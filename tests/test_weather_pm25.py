"""PM2.5 should use live air-quality data before a fixed fallback."""
from unittest.mock import patch

import src.api.weather_ai as weather_ai


FAKE_OWM_RESPONSE = {
    "list": [{"components": {"pm2_5": 42.7}}]
}


def test_fetch_air_quality_uses_openmeteo_without_key():
    weather_ai._air_quality_cache.clear()

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"current": {"pm2_5": 31.2}}

    with patch.object(weather_ai, "OPENWEATHERMAP_API_KEY", ""), \
         patch("src.api.weather_ai.requests.get", return_value=FakeResponse()) as mock_get:
        assert weather_ai._fetch_air_quality(10.77, 106.69) == 31.2
    assert "open-meteo.com" in mock_get.call_args.args[0]


def test_fetch_air_quality_uses_fallback_without_coords():
    with patch.object(weather_ai, "OPENWEATHERMAP_API_KEY", "fake-key"):
        assert weather_ai._fetch_air_quality(None, None) == weather_ai._PM25_FALLBACK


def test_fetch_air_quality_real_value(monkeypatch):
    weather_ai._air_quality_cache.clear()

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return FAKE_OWM_RESPONSE

    with patch.object(weather_ai, "OPENWEATHERMAP_API_KEY", "fake-key"), \
         patch("src.api.weather_ai.requests.get", return_value=FakeResponse()):
        pm25 = weather_ai._fetch_air_quality(10.77, 106.69)
    assert pm25 == 42.7


def test_fetch_air_quality_falls_back_on_error():
    weather_ai._air_quality_cache.clear()
    with patch.object(weather_ai, "OPENWEATHERMAP_API_KEY", "fake-key"), \
         patch("src.api.weather_ai.requests.get", side_effect=Exception("boom")):
        pm25 = weather_ai._fetch_air_quality(10.77, 106.69)
    assert pm25 == weather_ai._PM25_FALLBACK


def test_fetch_air_quality_uses_openmeteo_when_openweathermap_fails():
    weather_ai._air_quality_cache.clear()

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"current": {"pm2_5": 42.7}}

    with patch.object(weather_ai, "OPENWEATHERMAP_API_KEY", "fake-key"), \
         patch("src.api.weather_ai.requests.get", side_effect=[Exception("OWM failed"), FakeResponse()]):
        assert weather_ai._fetch_air_quality(10.77, 106.69) == 42.7


def test_transform_openmeteo_uses_air_quality_helper():
    om_data = {
        "current_weather": {"windspeed": 10.0, "temperature": 28.0},
        "hourly": {
            "time": ["2026-11-13T12:00"],
            "relativehumidity_2m": [70],
            "precipitation": [0],
            "uv_index": [2],
            "visibility": [10000],
        },
        "elevation": 5.0,
    }
    with patch.object(weather_ai, "_fetch_air_quality", return_value=99.9) as mock_fetch:
        result = weather_ai.transform_openmeteo_to_ai_format(
            om_data, province="Hà Nội", geo={"latitude": 21.0, "longitude": 105.8, "elevation": 5.0}
        )
    mock_fetch.assert_called_once_with(21.0, 105.8)
    assert result["pm25"] == 99.9
    assert result["smog_impact"] == round(min(99.9 / 150.0, 1.0), 4)


def test_missing_air_quality_is_not_exposed_as_the_model_default():
    weather_ai._air_quality_cache.clear()
    with patch.object(weather_ai, "OPENWEATHERMAP_API_KEY", ""), \
         patch.object(weather_ai.requests, "get", side_effect=Exception("provider down")):
        assert weather_ai._fetch_air_quality(11.94, 108.44) == 10.0
    public = weather_ai.air_quality_metadata(11.94, 108.44)
    assert public["pm25"] is None
    assert public["status"] == "unavailable"
    assert public["model_fallback_used"] is True


def test_air_quality_exposes_source_timestamp_and_only_available_forecast_hours():
    weather_ai._air_quality_cache.clear()
    class Response:
        def raise_for_status(self):
            pass
        def json(self):
            return {"current": {"pm2_5": 3.0, "time": "2026-11-11T22:00"}, "hourly": {
                "time": ["2026-11-11T00:00", "2026-11-11T01:00", "2026-11-12T00:00"],
                "pm2_5": [2.0, 4.0, None]}}
    with patch.object(weather_ai, "OPENWEATHERMAP_API_KEY", ""), patch.object(weather_ai.requests, "get", return_value=Response()):
        assert weather_ai._fetch_air_quality(11.94, 108.44) == 3.0
    public = weather_ai.air_quality_metadata(11.94, 108.44)
    assert public["source"] == "Open-Meteo Air Quality / CAMS"
    assert public["observed_at"] == "2026-11-11T22:00+07:00"
    assert public["model_fallback_used"] is False
    daily = weather_ai.air_quality_day(11.94, 108.44, "2026-11-11")
    assert daily["pm25"] == 3.0 and daily["hours"] == 2
    assert weather_ai.air_quality_day(11.94, 108.44, "2026-11-12")["pm25"] is None


def test_trip_includes_real_pm25_metadata(client):
    from src.api import app as api
    import pandas as pd
    api._trip_cache.clear()
    weather_ai._air_quality_cache[weather_ai._air_quality_cache_key(11.94, 108.44)] = {
        "ts": weather_ai.time.time(), "pm25": 3.0, "source": "Open-Meteo", "status": "available", "observed_at": "2026-11-11T22:00+07:00"}
    class Model:
        def predict(self, frame):
            return 1.0, 0, "AI_XGBOOST"
    with patch("src.api.app.weather_model_system", Model()), \
         patch("src.api.app._fetch_openmeteo_weather", return_value={"current_weather": {"temperature": 20, "windspeed": 10}, "hourly": {"time": ["2026-11-13T12:00"], "relativehumidity_2m": [70], "precipitation": [0], "uv_index": [2], "visibility": [10000]}}), \
         patch("src.api.app._weather_cache_get", return_value=None), \
         patch("src.api.app.load_features_df", return_value=pd.DataFrame()), \
         patch("src.api.app.check_route_traffic_google", return_value={"route_available": False}):
        response = client.get("/trip", params={"destination": "PM metadata test", "lat": 16.4, "lon": 107.6,
                                             "destination_lat": 11.94, "destination_lon": 108.44})
    assert response.status_code == 200
    assert response.json()["weather"]["pm25"] == 3.0
    assert response.json()["weather"]["air_quality"]["status"] == "available"
