from unittest.mock import patch, AsyncMock
import asyncio
import time
import httpx

from src.integrations.traffic import place_search as search


def feature(name, lon, lat, **properties):
    return {"geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {"name": name, "country_code": "VN", "osm_id": 123, **properties}}


def test_candidates_keep_distinct_addresses_and_reject_bad_or_foreign_coordinates():
    items = search._candidates([
        feature("Trường Chu Văn An", 107.6, 16.45, label="Trường Chu Văn An, Huế"),
        feature("Trường Chu Văn An", 107.60001, 16.45001, label="Duplicate"),
        feature("Trường Chu Văn An", 106.7, 10.8, label="Trường Chu Văn An, TP.HCM"),
        feature("Foreign", 106.7, 10.8, country_code="US"),
        feature("Invalid", float("nan"), 16.4),
        feature("Outside", 2.3, 48.8),
    ], "trackasia", 8)
    assert len(items) == 2
    assert items[0]["label"].endswith("Huế")
    assert items[1]["lat"] == 10.8


def test_explicit_address_tokens_beat_proximity_and_nearby_ties_rank_first():
    items = [{"label": "Hồ Hoàn Kiếm, Đà Nẵng", "lat": 16.04, "lon": 108.18},
             {"label": "Hồ Hoàn Kiếm, Hà Nội", "lat": 21.028, "lon": 105.852}]
    assert search._rank(items, "Hồ Hoàn Kiếm", 22.6657, 106.257)[0]["lat"] == 21.028
    assert search._rank(items, "Hồ Hoàn Kiếm Hà Nội", 16.04, 108.18)[0]["lat"] == 21.028


def test_unchecked_trackasia_is_not_called_and_osm_results_are_cached(monkeypatch):
    monkeypatch.setenv("TRACKASIA_SEARCH_KEY", "private-test-key")
    calls = []
    async def handler(request):
        calls.append(request)
        if "track-asia" in request.url.host:
            raise httpx.ConnectTimeout("private detail")
        return httpx.Response(200, json={"features": [feature("Hẻm 10", 106.7, 10.8, label="Hẻm 10, TP.HCM")]})
    async def scenario():
        service = search.PlaceSearchService(transport=httpx.MockTransport(handler))
        try:
            result = await service.search("Hẻm 10", 10.8, 106.7)
            again = await service.search("hem   10", 10.8, 106.7)
            assert result["items"] == again["items"]
            assert again["cache"] == "hit"
            assert result["items"][0]["source"] == "photon"
            assert len(calls) == 1
            assert "private-test-key" not in str(result)
            assert calls[0].url.params["lat"] == "10.8"
            assert all("track-asia" not in call.url.host for call in calls)
        finally:
            await service.close()
    asyncio.run(scenario())


def test_provider_failure_is_distinguished_from_no_matches(monkeypatch):
    monkeypatch.setenv("TRACKASIA_SEARCH_KEY", "test-key")
    async def handler(request):
        raise httpx.ConnectTimeout("private detail")
    async def scenario():
        service = search.PlaceSearchService(transport=httpx.MockTransport(handler))
        try:
            result = await service.search("unavailable location")
            assert result["status"] == "unavailable"
            assert result["items"] == []
            assert "private detail" not in str(result)
        finally:
            await service.close()
    asyncio.run(scenario())


def test_suggestions_endpoint_forwards_focus_and_rejects_incomplete_coordinates(client):
    with patch("src.api.app.search_places_async", new_callable=AsyncMock, return_value={"items": [], "status": "no_results", "attribution": "TrackAsia"}) as lookup:
        response = client.get("/api/locations/search", params={"q": "Chu Văn An", "lat": 16.4, "lon": 107.6})
    assert response.status_code == 200
    lookup.assert_awaited_once_with("Chu Văn An", 16.4, 107.6)
    assert client.get("/api/locations/search", params={"q": "Chu Văn An", "lat": 16.4}).status_code == 422
    assert client.get("/api/locations/search", params={"q": "ab"}).status_code == 422


def test_selected_destination_coordinates_bypass_geocoder_and_have_separate_cache(client):
    from src.api import app as api
    api._trip_cache.clear()
    with patch("src.api.app.search_location_google") as geocode, \
         patch("src.api.app.weather_model_system", None), \
         patch("src.api.app.check_route_traffic_google", return_value={"route_available": False, "traffic_available": False}):
        first = client.get("/trip", params={"destination": "Chu Văn An", "lat": 16.4, "lon": 107.6,
                                           "destination_lat": 16.45, "destination_lon": 107.6})
        second = client.get("/trip", params={"destination": "Chu Văn An", "lat": 16.4, "lon": 107.6,
                                            "destination_lat": 10.8, "destination_lon": 106.7})
    assert first.status_code == second.status_code == 200
    assert first.json()["to"]["lat"] == 16.45
    assert second.json()["to"]["lat"] == 10.8
    geocode.assert_not_called()
    assert client.get("/trip", params={"destination": "test", "lat": 16.4, "lon": 107.6, "destination_lat": 16.45}).status_code == 422
    assert client.get("/trip", params={"destination": "test", "lat": 16.4, "lon": 107.6, "destination_lat": "nan", "destination_lon": 107.6}).status_code == 422


def test_slow_query_does_not_block_an_unrelated_query(monkeypatch):
    monkeypatch.setenv("TRACKASIA_SEARCH_KEY", "test-key")
    monkeypatch.setenv("PHOTON_API_URL", "https://photon.example/api/")
    async def scenario():
        started, release = asyncio.Event(), asyncio.Event()
        async def handler(request):
            if "slow" in str(request.url):
                started.set()
                await release.wait()
            return httpx.Response(200, json={"features": [feature(request.url.params["q"], 106.7, 10.8)]})
        service = search.PlaceSearchService(transport=httpx.MockTransport(handler))
        try:
            slow = asyncio.create_task(service.search("slow query"))
            await started.wait()
            fast = await asyncio.wait_for(service.search("fast query"), .15)
            assert fast["items"]
            assert not slow.done()
            release.set()
            await slow
        finally:
            release.set()
            await service.close()
    asyncio.run(scenario())


def test_same_query_is_coalesced_and_one_cancelled_waiter_does_not_cancel_the_other(monkeypatch):
    monkeypatch.setenv("TRACKASIA_SEARCH_KEY", "test-key")
    async def scenario():
        started, release = asyncio.Event(), asyncio.Event()
        count = 0
        async def handler(request):
            nonlocal count
            count += 1
            started.set()
            await release.wait()
            return httpx.Response(200, json={"features": [feature("Hồ Hoàn Kiếm", 105.852, 21.028, label="Hồ Hoàn Kiếm, Hà Nội")]})
        service = search.PlaceSearchService(transport=httpx.MockTransport(handler))
        try:
            first = asyncio.create_task(service.search("Hồ Hoàn Kiếm"))
            await started.wait()
            second = asyncio.create_task(service.search("ho hoan kiem"))
            await asyncio.sleep(0)
            first.cancel()
            await asyncio.gather(first, return_exceptions=True)
            release.set()
            assert (await second)["items"]
            assert count == 1
            assert service.metrics["coalesced"] == 1
        finally:
            await service.close()
    asyncio.run(scenario())


def test_deadline_cancels_stalled_provider_and_releases_capacity(monkeypatch):
    monkeypatch.setenv("TRACKASIA_SEARCH_KEY", "test-key")
    async def handler(request):
        await asyncio.sleep(10)
        return httpx.Response(200, json={"features": []})
    async def scenario():
        service = search.PlaceSearchService(transport=httpx.MockTransport(handler), budget=.06)
        try:
            started = time.monotonic()
            result = await service.search("stalled provider")
            assert time.monotonic() - started < .3
            assert result["status"] == "unavailable"
            await asyncio.sleep(0)
            assert not service.inflight
        finally:
            await service.close()
    asyncio.run(scenario())


def test_capacity_returns_busy_without_queuing_and_last_waiter_cancellation_stops_work(monkeypatch):
    monkeypatch.setenv("TRACKASIA_SEARCH_KEY", "test-key")
    async def scenario():
        started = asyncio.Event()
        async def handler(request):
            started.set()
            await asyncio.sleep(10)
        service = search.PlaceSearchService(transport=httpx.MockTransport(handler), max_inflight=1)
        try:
            first = asyncio.create_task(service.search("pending query"))
            await started.wait()
            result = await asyncio.wait_for(service.search("another query"), .1)
            assert result["status"] == "busy"
            first.cancel()
            await asyncio.gather(first, return_exceptions=True)
            await asyncio.sleep(.01)
            assert not service.inflight
        finally:
            await service.close()
    asyncio.run(scenario())


def test_exact_references_do_not_call_a_provider_or_turn_street_addresses_into_a_city():
    async def scenario():
        service = search.PlaceSearchService()
        try:
            result = await service.search("Hà Nội")
            assert result["cache"] == "reference"
            assert result["items"][0]["kind"] == "province_reference"
            assert service.metrics["provider_calls"] == 0
            assert service._reference("Hà Nội, 12 phố Huế") is None
        finally:
            await service.close()
    asyncio.run(scenario())


def test_quota_does_not_fall_back_to_unchecked_provider(monkeypatch):
    monkeypatch.setenv("TRACKASIA_SEARCH_KEY", "test-key")
    monkeypatch.setenv("PHOTON_API_URL", "https://photon.example/api/")
    async def scenario():
        primary_calls = 0
        async def handler(request):
            nonlocal primary_calls
            primary_calls += 1
            assert request.url.host == "photon.example"
            return httpx.Response(429, headers={"Retry-After": "60"})
        service = search.PlaceSearchService(transport=httpx.MockTransport(handler))
        try:
            first = await service.search("first quota query")
            second = await service.search("second quota query")
            assert not first["items"] and not second["items"]
            assert primary_calls == 1
            assert service.provider_state["photon"]["until"] - time.monotonic() > 58
        finally:
            await service.close()
    asyncio.run(scenario())


def test_landmark_region_conflicts_and_untraceable_results_are_removed():
    items = search._candidates([
        feature("Hồ Hoàn Kiếm", 108.186804, 16.037271, label="Hồ Hoàn Kiếm, Phường An Khê, Đà Nẵng"),
        feature("Hồ Hoàn Kiếm", 105.85152, 21.0291, label="Hồ Hoàn Kiếm, Hà Nội"),
        feature("Hồ Hoàn Kiếm", 105.852, 21.028, label="Hồ Hoàn Kiếm, Hà Nội", osm_id=None),
    ], "photon", 8)
    result = search._verified_candidates(items, "ho hoan kiem")
    assert len(result) == 1
    assert result[0]["label"] == "Hồ Hoàn Kiếm, Hà Nội"
    assert search._verified_candidates(items, "ho hoan kiem da nang") == []
    assert search._verified_candidates(search._candidates([
        feature("Hồ Hoàn Kiếm", 105.85152, 21.0291, label="Hồ Hoàn Kiếm, Hà Nội")
    ], "trackasia", 8), "ho hoan kiem") == []


def test_unrelated_fuzzy_matches_are_not_suggestions():
    items = search._candidates([feature("Hồng Kim", 106.7, 10.8)], "photon", 8)
    assert search._verified_candidates(items, "ho hoan kiem") == []
    reversed_name = search._candidates([feature("Chùa Thanh Tâm", 106.7, 10.8)], "photon", 8)
    assert search._verified_candidates(reversed_name, "chua tam thanh") == []
    wrong_region = search._candidates([feature("Núi Hồ Ba Bể", 109, 12, label="Núi Hồ Ba Bể, Khánh Hòa")], "photon", 8)
    assert search._verified_candidates(wrong_region, "ho ba be") == []


def test_exact_landmark_precedes_a_nearby_similarly_named_business():
    items = [
        {"name": "Khách sạn Hồ Hoàn Kiếm", "label": "Khách sạn Hồ Hoàn Kiếm, Hà Nội", "lat": 21.03, "lon": 105.85},
        {"name": "Hồ Hoàn Kiếm", "label": "Hồ Hoàn Kiếm, Hà Nội", "lat": 21.0288, "lon": 105.8525},
    ]
    assert search._rank(items, "ho hoan kiem", 21.03, 105.85)[0]["name"] == "Hồ Hoàn Kiếm"


def test_english_landmark_search_uses_canonical_query_without_changing_coordinates(monkeypatch):
    monkeypatch.setenv("PHOTON_API_URL", "https://photon.example/api/")
    queries = []
    async def handler(request):
        queries.append(request.url.params["q"])
        return httpx.Response(200, json={"features": [feature("Hồ Hoàn Kiếm", 105.8525, 21.0288, label="Hồ Hoàn Kiếm, Hà Nội")]})
    async def scenario():
        service = search.PlaceSearchService(transport=httpx.MockTransport(handler))
        try:
            result = await service.search("Hoan Kiem Lake")
            assert queries == ["Hồ Hoàn Kiếm"]
            assert result["items"][0]["lat"] == 21.0288
            assert result["items"][0]["lon"] == 105.8525
            assert result["items"][0]["name"] == "Hồ Hoàn Kiếm"
            assert service._reference(search._place_aliases()["ho chi minh city"])
        finally:
            await service.close()
    asyncio.run(scenario())
