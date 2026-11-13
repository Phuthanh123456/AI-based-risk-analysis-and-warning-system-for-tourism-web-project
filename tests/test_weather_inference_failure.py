"""Prediction failures must not masquerade as measured severe weather."""
from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest

from src.integrations.weather.main import HybridSafetyPredictor, WeatherInferenceError, normalize_weather_score


class BrokenModel:
    def predict(self, frame):
        raise ValueError("incompatible model")


class NanModel:
    def predict(self, frame):
        return np.full(len(frame), np.nan)


@pytest.mark.parametrize("model", [BrokenModel(), NanModel()])
def test_failed_predictions_are_unavailable(model):
    predictor = HybridSafetyPredictor(model)
    frame = pd.DataFrame([{"precipitation": 0, "wind": 0}])
    with pytest.raises(WeatherInferenceError):
        predictor.predict(frame)
    with pytest.raises(WeatherInferenceError):
        predictor.predict_batch(frame)
    # An observed extreme condition still triggers its real safety rule.
    assert predictor.predict(pd.DataFrame([{"precipitation": 201}])) == (20., 5, "SAFETY_GATE_FLOOD")


def test_nonfinite_score_is_not_a_risk_score():
    with pytest.raises(WeatherInferenceError):
        normalize_weather_score(float("nan"))


def test_manual_api_reports_prediction_outage(client):
    with patch("src.api.weather_ai.weather_model_system", HybridSafetyPredictor(BrokenModel())):
        response = client.post("/weather/ai", json={"temperature": 25, "humidity": 70,
            "precipitation": 0, "wind": 10, "pm25": 10, "visibility_km": 10, "uv_index": 2})
    assert response.status_code == 503
    assert "risk_score" not in response.json()


def test_partial_provider_weather_is_not_replaced_with_defaults():
    from fastapi import HTTPException
    from src.api.weather_ai import transform_openmeteo_to_ai_format, _transform_daily_to_ai_inputs
    with pytest.raises(HTTPException) as exc:
        transform_openmeteo_to_ai_format({"current_weather": {"temperature": 25}})
    assert exc.value.status_code == 502
    with patch("src.api.weather_ai._fetch_air_quality", return_value=10):
        with pytest.raises(HTTPException) as exc:
            _transform_daily_to_ai_inputs({"daily": {"time": ["2026-11-14"]}})
    assert exc.value.status_code == 502
