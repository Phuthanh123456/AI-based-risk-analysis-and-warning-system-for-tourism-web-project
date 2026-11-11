from unittest.mock import patch

import pytest
from fastapi import HTTPException

from src.api import weather_ai


@pytest.mark.parametrize("query,coords", [
    ("Quảng Nam", (15.5394, 108.0191)),
    ("Hà Nội", (21.0278, 105.8342)),
    ("Ha Noi", (21.0278, 105.8342)),
    ("Đà Lạt", (11.94646, 108.44193)),
])
def test_weather_uses_same_configured_location_as_trip(query, coords):
    weather_ai._geocode_cache.clear()
    with patch.object(weather_ai.requests, "get") as external_geocode:
        result = weather_ai._geocode_openmeteo(query)
    assert (result["latitude"], result["longitude"]) == coords
    external_geocode.assert_not_called()


def test_trip_forecast_uses_resolved_destination_coordinates():
    class ForecastReached(Exception):
        pass

    weather_ai._forecast_cache.clear()
    with patch.object(weather_ai, "weather_model_system", object()), \
         patch.object(weather_ai, "_geocode_openmeteo") as geocode, \
         patch.object(weather_ai, "_fetch_openmeteo_forecast", side_effect=ForecastReached) as fetch:
        with pytest.raises(ForecastReached):
            weather_ai.weather_ai_forecast(
                city="Đà Lạt", province="Lâm Đồng", days=7,
                trip_purpose=None, lat=11.9404, lon=108.4583,
            )
    geocode.assert_not_called()
    fetch.assert_called_once_with(11.9404, 108.4583, 7)


def test_unknown_vietnamese_place_does_not_fall_back_to_hanoi():
    class Response:
        status_code = 200

        @staticmethod
        def json():
            return {"results": [{"country_code": "US", "latitude": 1, "longitude": 2}]}

    weather_ai._geocode_cache.clear()
    with patch.object(weather_ai.requests, "get", return_value=Response()):
        with pytest.raises(HTTPException) as exc:
            weather_ai._geocode_openmeteo("Dia diem khong co that")
    assert exc.value.status_code == 404
