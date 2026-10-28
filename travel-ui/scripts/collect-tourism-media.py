"""Resolve encyclopedia references and collect openly licensed Commons photographs.

Input: artifacts/tourism-guide/places.json, exported from the source catalogue.
Output: WebP photos + credit metadata; research excerpts remain ignored artifacts.
No non-free/unknown-license image is included. Requires requests, Pillow.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from io import BytesIO
from pathlib import Path
import json
import re
import threading
import sys

import requests
from PIL import Image, ImageOps
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

ROOT = Path(__file__).resolve().parents[1]
RESEARCH = ROOT / "artifacts/tourism-guide"
PHOTOS = ROOT / "public/images/explore"
MEDIA = ROOT / "src/tourism/catalog/media.json"
PHOTOS.mkdir(parents=True, exist_ok=True)
local = threading.local()


def session():
    if not hasattr(local, "session"):
        s = requests.Session()
        s.headers["User-Agent"] = "VietnamTravelRiskCourse/1.0 educational prototype (source and license verification)"
        s.mount("https://", HTTPAdapter(max_retries=Retry(total=2, backoff_factor=1, status_forcelist=[429, 502, 503])))
        local.session = s
    return local.session


def plain(value):
    return unescape(re.sub(r"<[^>]+>", "", value or "")).strip()


def collect(place):
    record = {"id": place["id"], "name": place["name"], "source": place["source"]}
    photo = None
    try:
        r = session().get("https://vi.wikipedia.org/w/api.php", params={
            "action": "query", "format": "json", "formatversion": 2,
            "titles": place["wiki"], "redirects": 1, "prop": "extracts|pageimages|langlinks", "lllang": "en",
            "exintro": 1, "explaintext": 1, "exchars": 1800, "piprop": "name",
        }, timeout=25)
        r.raise_for_status()
        page = r.json()["query"]["pages"][0]
        if page.get("missing"):
            record["error"] = "reference_missing"
            return record, photo
        if "định hướng" in page["title"]:
            record["error"] = "ambiguous_reference_requires_manual_review"
            return record, photo
        record.update(title=page["title"], excerpt=page.get("extract", ""), checked=True)
        if place["id"] == "banh-it-la-gai":
            record["photo_status"] = "no_exact_regional_photo"
            return record, photo
        filename = page.get("pageimage")
        if not filename or re.search(r"(?:map|logo|flag|emblem|coat.of.arms|bản.đồ)", filename, re.I):
            links = page.get("langlinks") or []
            if links:
                en = session().get("https://en.wikipedia.org/w/api.php", params={
                    "action": "query", "format": "json", "formatversion": 2,
                    "titles": links[0]["title"], "redirects": 1, "prop": "pageimages", "piprop": "name",
                }, timeout=25)
                en.raise_for_status()
                filename = en.json()["query"]["pages"][0].get("pageimage")
        if not filename or re.search(r"(?:map|logo|flag|emblem|coat.of.arms|bản.đồ)", filename, re.I):
            record["photo_status"] = "no_suitable_main_photo"
            return record, photo
        info = session().get("https://commons.wikimedia.org/w/api.php", params={
            "action": "query", "format": "json", "formatversion": 2,
            "titles": "File:" + filename, "prop": "imageinfo",
            "iiprop": "url|extmetadata", "iiurlwidth": 1200,
        }, timeout=25)
        info.raise_for_status()
        filepage = info.json()["query"]["pages"][0]
        imageinfo = (filepage.get("imageinfo") or [{}])[0]
        meta = imageinfo.get("extmetadata") or {}
        license_name = plain(meta.get("LicenseShortName", {}).get("value"))
        if not re.match(r"^(CC BY(?:-SA)?(?: |$)|CC0|Public domain)", license_name, re.I):
            record["photo_status"] = "license_not_accepted: " + license_name
            return record, photo
        url = imageinfo.get("thumburl") or imageinfo.get("url")
        if not url:
            record["photo_status"] = "no_image_url"
            return record, photo
        image_response = session().get(url, timeout=30)
        image_response.raise_for_status()
        image = ImageOps.exif_transpose(Image.open(BytesIO(image_response.content))).convert("RGB")
        if min(image.size) < 240:
            record["photo_status"] = "image_too_small"
            return record, photo
        image.thumbnail((1200, 1000), Image.Resampling.LANCZOS)
        target = PHOTOS / (place["id"] + ".webp")
        image.save(target, "WEBP", quality=82, method=6)
        photo = {
            "image": "/images/explore/" + target.name,
            "subject": page["title"] if place["kind"] == "food" else place["name"],
            "contextual": place["kind"] == "food",
            "artist": plain(meta.get("Artist", {}).get("value")) or "See original file page",
            "license": license_name, "licenseUrl": plain(meta.get("LicenseUrl", {}).get("value")),
            "source": imageinfo["descriptionurl"], "original": imageinfo["url"],
            "changes": "Resized and encoded as WebP; displayed with a responsive crop.",
        }
        record["photo_status"] = "downloaded"
    except Exception as exc:
        record["error"] = str(exc)[:220]
    return record, photo


if __name__ == "__main__":
    places = json.loads((RESEARCH / "places.json").read_text(encoding="utf-8"))
    photos = json.loads(MEDIA.read_text(encoding="utf-8")) if MEDIA.exists() else {}
    previous = json.loads((RESEARCH / "reference-review.json").read_text(encoding="utf-8")) if (RESEARCH / "reference-review.json").exists() else []
    records = {record["id"]: record for record in previous}
    if "--retry-missing" in sys.argv:
        places = [place for place in places if place["id"] not in photos]
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(collect, p): p for p in places}
        for future in as_completed(futures):
            record, photo = future.result()
            records[record["id"]] = record
            if photo:
                photos[record["id"]] = photo
            print(record["id"], record.get("error") or record.get("photo_status"), flush=True)
    MEDIA.write_text(json.dumps(photos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (RESEARCH / "reference-review.json").write_text(json.dumps(list(records.values()), ensure_ascii=False, indent=2), encoding="utf-8")
    (PHOTOS / "PHOTO_CREDITS.json").write_text(json.dumps(photos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("REFERENCES", sum(bool(r.get("checked")) for r in records.values()), "PHOTOS", len(photos), flush=True)
