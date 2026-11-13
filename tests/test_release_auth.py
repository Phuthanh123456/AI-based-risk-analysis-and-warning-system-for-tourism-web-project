from unittest.mock import patch

import jwt
import pytest

from src.api import config
from src.api.auth import decode_access_token, hash_password, verify_password


def test_password_cannot_silently_truncate(client):
    password = "a" * 72
    hashed = hash_password(password)
    assert verify_password(password, hashed)
    assert not verify_password(password + "different", hashed)
    response = client.post("/api/auth/register", json={"email": "long@example.com", "password": "x" * 73})
    assert response.status_code == 422


@pytest.mark.parametrize("payload", [{"sub": "bad", "iat": 1, "exp": 9999999999}, {"sub": "1"}])
def test_signed_but_malformed_tokens_are_rejected(payload):
    token = jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)


def test_production_refuses_development_secret(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    with patch.object(config, "JWT_SECRET", config.JWT_SECRET_DEFAULT), pytest.raises(RuntimeError):
        config.validate_production_config()
    with patch.object(config, "JWT_SECRET", "x" * 40):
        config.validate_production_config()


def test_debug_endpoints_are_not_public_in_production(client, monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    assert client.get("/debug/where").status_code == 404
    assert client.get("/health").status_code == 200
