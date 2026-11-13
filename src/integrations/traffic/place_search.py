"""Bounded, cancellable address search with pooled HTTP and single-flight cache.

No global lock is held during network I/O. Demo-provider limits are fail-fast,
not a growing queue; configure a personal key/service for production traffic.
"""
from __future__ import annotations

import asyncio
import math
import json
from functools import lru_cache
from pathlib import Path
import os
import re
import time
import unicodedata
from urllib.parse import urlparse

import httpx


def normalize_query(value):
    value = unicodedata.normalize("NFKD", value.casefold().replace("đ", "d"))
    return " ".join("".join(c for c in value if not unicodedata.combining(c)).split())


def _candidates(features, source, limit):
    results, seen = [], set()
    for feature in features:
        try:
            props = feature.get("properties") or {}
            country = (props.get("country_code") or props.get("countrycode") or props.get("country_a") or "").upper()
            if country and country not in {"VN", "VNM"}:
                continue
            geom = feature.get("geometry") or {}
            if geom.get("type") != "Point":
                continue
            lon, lat = map(float, geom["coordinates"][:2])
            if not (math.isfinite(lat) and math.isfinite(lon) and 8 <= lat <= 24 and 102 <= lon <= 118):
                continue
            name = str(props.get("name") or props.get("street") or "").strip()
            if not name:
                continue
            parts = [name, " ".join(str(props.get(k) or "") for k in ("housenumber", "street")).strip()]
            parts += [props.get(k) for k in ("locality", "district", "county", "city", "state", "region", "country")]
            label = props.get("label") or ", ".join(dict.fromkeys(str(p) for p in parts if p))
            identity = (name.casefold(), round(lat, 3), round(lon, 3))
            if identity in seen:
                continue
            seen.add(identity)
            results.append({"id": f"{source}:{props.get('id') or props.get('osm_id') or len(results)}:{lat}:{lon}",
                            "name": name, "label": str(label), "lat": lat, "lon": lon,
                            "osm_id": props.get("osm_id"), "country_code": country,
                            "source": source, "kind": str(props.get("layer") or props.get("type") or "place")})
            if len(results) >= limit:
                break
        except (ValueError, TypeError, KeyError, IndexError, AttributeError):
            continue
    return results


def _rank(items, query, lat=None, lon=None):
    tokens = set(re.findall(r"[a-z0-9]+", normalize_query(query)))
    def rank(item):
        label_tokens = set(re.findall(r"[a-z0-9]+", normalize_query(item["label"])))
        coverage = len(tokens & label_tokens)
        name = normalize_query(item.get("name") or item["label"].split(",", 1)[0])
        exact_name = name == normalize_query(query)
        # This distance only ranks equally matching suggestions; it is not a route.
        distance = 0 if lat is None or lon is None else (item["lat"]-lat)**2 + ((item["lon"]-lon)*math.cos(math.radians(lat)))**2
        return -coverage, -int(exact_name), distance
    return sorted(items, key=rank)


@lru_cache(maxsize=1)
def _place_regions():
    path = Path(__file__).resolve().parents[3] / "configs" / "search_place_regions.json"
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def _place_aliases():
    path = Path(__file__).resolve().parents[3] / "configs" / "search_place_aliases.json"
    return {normalize_query(en): vi for en, vi in json.loads(path.read_text(encoding="utf-8")).items()}


def _verified_candidates(items, query):
    """Only expose source-backed OSM records that actually match the query.

    TrackAsia autocomplete contains conflicting venue records. A successful
    response is not verification: do not publish those records as destinations.
    """
    phrase = " ".join(re.findall(r"[a-z0-9]+", normalize_query(query)))
    results = []
    for item in items:
        label = normalize_query(item["label"])
        if not (item.get("source") == "photon" and item.get("osm_id")
                and item.get("country_code") in {"VN", "VNM"}
                and phrase in " ".join(re.findall(r"[a-z0-9]+", label))):
            continue
        constraints = [place for place in _place_regions()
                       if {normalize_query(item["name"]), normalize_query(query)} & {normalize_query(n) for n in place["names"]}]
        if constraints and not any(any(normalize_query(r).replace("tp. ", "") in label
                                      for r in place["regions"]) for place in constraints):
            continue
        results.append(item)
    return results


class PlaceSearchService:
    def __init__(self, *, transport=None, budget=None, max_inflight=8):
        self.transport = transport
        self.budget = budget or float(os.getenv("PLACE_SEARCH_BUDGET_SECONDS", "2.5"))
        self.max_inflight = max_inflight
        self.client = None
        self.cache = {}
        self.inflight = {}
        self.waiters = {}
        self.provider_state = {}
        self.metrics = {"requests": 0, "cache_hits": 0, "coalesced": 0, "busy": 0, "provider_calls": 0}

    async def close(self):
        pending = list(self.inflight.values())
        for task in pending:
            task.cancel()
        await asyncio.gather(*pending, return_exceptions=True)
        self.inflight.clear()
        self.waiters.clear()
        if self.client:
            await self.client.aclose()
            self.client = None

    def _reference(self, query):
        # Never reduce an actual street address to its first city-name fragment.
        if "," in query or re.search(r"\d", query):
            return None
        from src.integrations.traffic.serpapi_service import resolve_configured_location
        point = resolve_configured_location(query)
        if not point:
            return None
        lat, lon, label = point
        name = label.split(",", 1)[0]
        if normalize_query(query) in {"hue", "thanh pho hue"}:
            name, label = "Huế", "Huế, Việt Nam"
        return {"items": [{"id": f"reference:{lat}:{lon}", "name": name, "label": label,
                           "lat": lat, "lon": lon, "source": "reference", "kind": "province_reference"}],
                "status": "ok", "attribution": "Điểm tham chiếu trong cấu hình dự án", "cache": "reference"}

    async def search(self, query, lat=None, lon=None, limit=8):
        self.metrics["requests"] += 1
        query = " ".join(query.strip().split())
        query = _place_aliases().get(normalize_query(query), query)
        if len(query) < 3:
            return {"items": [], "status": "no_results", "attribution": ""}
        reference = self._reference(query)
        if reference:
            return reference
        key = (normalize_query(query), round(lat, 1) if lat is not None else None,
               round(lon, 1) if lon is not None else None, limit)
        entry = self.cache.get(key)
        if entry and time.monotonic() - entry[0] < (21600 if entry[1]["items"] else 5):
            self.metrics["cache_hits"] += 1
            return {**entry[1], "cache": "hit"}
        task = self.inflight.get(key)
        if task:
            self.metrics["coalesced"] += 1
        else:
            if len(self.inflight) >= self.max_inflight:
                self.metrics["busy"] += 1
                return {"items": [], "status": "busy", "retry_after_ms": 400, "attribution": ""}
            task = asyncio.create_task(self._lookup(query, lat, lon, limit, key))
            self.inflight[key] = task
            def finished(done):
                if self.inflight.get(key) is done:
                    self.inflight.pop(key, None)
                if not done.cancelled():
                    done.exception()  # Retrieve errors even if the browser disconnected.
            task.add_done_callback(finished)
        self.waiters[key] = self.waiters.get(key, 0) + 1
        try:
            return await asyncio.shield(task)
        finally:
            self.waiters[key] = self.waiters.get(key, 1) - 1
            if self.waiters[key] <= 0:
                self.waiters.pop(key, None)
                if not task.done():
                    task.cancel()
                    await asyncio.gather(task, return_exceptions=True)
            if task.done() and self.inflight.get(key) is task:
                self.inflight.pop(key, None)

    async def _call(self, source, url, params, limit, *, delay=0, demo=False):
        if delay:
            await asyncio.sleep(delay)
        state = self.provider_state.setdefault(source, {"until": 0, "last": -100.0, "errors": 0})
        now = time.monotonic()
        if now < state["until"]:
            return {"items": [], "status": "busy"}
        # Limit demo start rates, without holding any lock during HTTP I/O.
        # Waiting is cancellable and included in the query's total deadline.
        interval = (.25 if source == "trackasia" else 1.0) if demo else 0
        while interval and time.monotonic() - state["last"] < interval:
            await asyncio.sleep(max(.001, interval - (time.monotonic() - state["last"])))
        state["last"] = time.monotonic()
        if self.client is None:
            self.client = httpx.AsyncClient(
                transport=self.transport, timeout=httpx.Timeout(1.8, connect=.8, pool=.15),
                limits=httpx.Limits(max_connections=16, max_keepalive_connections=8),
                headers={"User-Agent": "VietnamTravelRiskAI-coursework/1.0", "Accept": "application/json"},
            )
        try:
            self.metrics["provider_calls"] += 1
            response = await self.client.get(url, params=params)
            if response.status_code == 429:
                retry_after = response.headers.get("retry-after", "20")
                seconds = float(retry_after) if retry_after.isdecimal() else 20
                state["until"] = now + min(86400, max(20, seconds))
                return {"items": [], "status": "busy"}
            response.raise_for_status()
            if len(response.content) > 2_000_000:
                raise ValueError("Oversized geocoding response")
            payload = response.json()
            if not isinstance(payload, dict) or not isinstance(payload.get("features"), list):
                raise ValueError("Invalid geocoding response")
            state["errors"] = 0
            items = _candidates(payload["features"], source, limit)
            items = _verified_candidates(items, params.get("text") or params.get("q") or "")
            items = _rank(items, params.get("text") or params.get("q") or "",
                          params.get("focus.point.lat", params.get("lat")), params.get("focus.point.lon", params.get("lon")))
            return {"items": items, "status": "ok" if items else "no_results", "attribution": "TrackAsia" if source == "trackasia" else "© OpenStreetMap contributors / Photon"}
        except (httpx.HTTPError, ValueError, TypeError):
            state["errors"] += 1
            if state["errors"] >= 2:
                state["until"] = now + 15
            return {"items": [], "status": "unavailable"}

    async def _lookup(self, query, lat, lon, limit, key):
        tasks = []
        result = {"items": [], "status": "unavailable", "attribution": ""}
        # Disabled for suggestions after reproducing incorrect same-name venue
        # records (e.g. Hoan Kiem Lake in Da Nang). Do not return an unchecked
        # provider as fallback when the OSM lookup is unavailable.
        params = {"q": query, "limit": limit, "countrycode": "VN", "bbox": "102,8,118,24"}
        if lat is not None and lon is not None:
            params.update({"lat": lat, "lon": lon})
        photon_url = os.getenv("PHOTON_API_URL", "https://photon.komoot.io/api/")
        tasks.append(asyncio.create_task(self._call("photon", photon_url, params, limit, demo=urlparse(photon_url).hostname in {"photon.komoot.io", "photon.komoot.de"})))
        pending = set(tasks)
        cancelled = False
        try:
            async with asyncio.timeout(self.budget):
                while pending:
                    done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
                    for task in done:
                        candidate = task.result()
                        if candidate["items"]:
                            result = candidate
                            return {**result, "cache": "miss"}
                        if candidate["status"] == "no_results" or result["status"] == "unavailable":
                            result = candidate
        except TimeoutError:
            pass
        except asyncio.CancelledError:
            cancelled = True
            raise
        finally:
            for task in tasks:
                if not task.done():
                    task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)
            if not cancelled and result["status"] in {"ok", "no_results"}:
                if len(self.cache) >= 1000:
                    self.cache.pop(next(iter(self.cache)))
                self.cache[key] = (time.monotonic(), result)
        return {**result, "retry_after_ms": 500 if result["status"] == "busy" else 0, "cache": "miss"}


service = PlaceSearchService()


async def search_places_async(query, lat=None, lon=None, limit=8):
    return await service.search(query, lat, lon, limit)


async def close_search_client():
    await service.close()
