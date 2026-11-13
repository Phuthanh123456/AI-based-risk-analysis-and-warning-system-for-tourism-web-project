import os
import tempfile

import pytest

# Point the app at a throwaway SQLite file before importing it, so tests
# never touch the real data/state/app.sqlite.
_tmp_db_fd, _tmp_db_path = tempfile.mkstemp(suffix=".sqlite")
os.close(_tmp_db_fd)
os.environ["DB_PATH_OVERRIDE"] = _tmp_db_path

from fastapi.testclient import TestClient

from src.api.app import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def isolate_recent_news_network(monkeypatch):
    # Unit tests must not depend on changing live headlines or network latency.
    monkeypatch.setattr("src.api.app.fetch_recent_news", lambda place: {
        "place": place, "status": "unavailable", "events": [], "count": 0,
        "provider": "Google News RSS", "window_days": 7,
    })
    # Air-quality fetching itself is tested separately. Keep unrelated trip
    # concurrency tests independent of the public provider's response time.
    monkeypatch.setattr("src.api.app._fetch_air_quality", lambda lat, lon: 10.0)


@pytest.fixture
def auth_headers(client):
    """Registers a throwaway user and returns an Authorization header dict."""
    email = f"test_{os.urandom(4).hex()}@example.com"
    resp = client.post("/api/auth/register", json={"email": email, "password": "testpass123"})
    assert resp.status_code == 200, resp.text
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}
