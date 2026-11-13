from concurrent.futures import ThreadPoolExecutor
from threading import Event
from datetime import date
import time
import pandas as pd

from src.api import utils


def test_fast_date_parser_preserves_original_calendar_day():
    assert utils._published_to_date("2026-11-12T00:15:00+07:00") == date(2026, 11, 12)
    assert utils._published_to_date("Wed, 11 Nov 2026 23:30:00 -1100") == date(2026, 11, 11)
    assert utils._published_to_date("2026-11-12T00:00:00Z") == date(2026, 11, 12)
    assert utils._published_to_date("not a date") is None
    assert utils._published_to_date(None) is None


def test_simultaneous_cold_loads_parse_the_dataset_once(monkeypatch):
    monkeypatch.setattr(utils, "_df_cache", None)
    monkeypatch.setattr(utils, "_df_mtime", None)
    monkeypatch.setattr(utils, "_news_predictions_files", lambda: [])
    calls = []
    def read(path):
        calls.append(path)
        time.sleep(.02)
        return [{"id": "sample", "province": "Hà Nội", "quality_pass": True,
                 "published_at": "2026-11-12T00:00:00+07:00", "risk_groups": [], "risk_score_rule": 0}]
    monkeypatch.setattr(utils, "safe_read_jsonl", read)
    with ThreadPoolExecutor(max_workers=6) as pool:
        frames = list(pool.map(lambda _: utils.load_features_df(), range(6)))
    assert len(calls) == 1
    assert all(frame is frames[0] for frame in frames)


def test_trip_fetches_weather_and_air_quality_concurrently(client, monkeypatch):
    from src.api import app as api
    api._trip_cache.clear()
    air_started, release_air = Event(), Event()
    def air(lat, lon):
        air_started.set()
        assert release_air.wait(2)
        return 10.0
    def weather(lat, lon):
        assert air_started.wait(2)
        release_air.set()
        return {"current_weather": {"temperature": 25, "windspeed": 10}}
    class Model:
        def predict(self, frame):
            return 1.0, 0, "AI_XGBOOST"
    monkeypatch.setattr(api, "_fetch_air_quality", air)
    monkeypatch.setattr(api, "_fetch_openmeteo_weather", weather)
    monkeypatch.setattr(api, "_weather_cache_get", lambda _: None)
    monkeypatch.setattr(api, "load_features_df", lambda **_: pd.DataFrame())
    monkeypatch.setattr(api, "weather_model_system", Model())
    monkeypatch.setattr(api, "transform_openmeteo_to_ai_format", lambda *args, **kwargs: {"temperature": 25, "wind": 10, "pm25": 10})
    monkeypatch.setattr(api, "check_route_traffic_google", lambda *args: {"route_available": False})
    response = client.get("/trip", params={"destination": "parallel provider test", "lat": 22.6, "lon": 106.2,
                                          "destination_lat": 21.028, "destination_lon": 105.852})
    assert response.status_code == 200
    assert response.json()["weather"]["temperature"] == 25
