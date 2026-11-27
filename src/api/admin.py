"""Provision a dedicated administrator and expose aggregate operations metrics."""

import os
import re
from contextlib import closing
from hmac import compare_digest
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response

from src.api.auth import get_current_user, verify_password
from src.api.config import DATABASE_URL
from src.api.db import get_conn

admin_router = APIRouter(prefix="/api/admin", tags=["admin"])


def admin_credentials():
    email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    password_hash = os.getenv("ADMIN_PASSWORD_HASH", "").strip()
    if not email or not re.fullmatch(r"\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}", password_hash):
        return None
    return email, password_hash


def provision_admin():
    credentials = admin_credentials()
    if not credentials:
        return
    email, password_hash = credentials
    if any(verify_password(password, password_hash) for password in ("123", "123456", "password", "admin")):
        return
    with closing(get_conn()) as conn:
        conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?) ON CONFLICT (email) DO NOTHING",
            (email, password_hash),
        )
        conn.commit()


def require_admin(user: dict = Depends(get_current_user)):
    credentials = admin_credentials()
    if (
        not credentials
        or user["email"] != credentials[0]
        or not compare_digest(user["password_hash"].encode(), credentials[1].encode())
    ):
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user


@admin_router.get("/overview")
def overview(response: Response, _admin: dict = Depends(require_admin)):
    response.headers["Cache-Control"] = "no-store"
    today = datetime.now(timezone.utc).date()
    days = [(today - timedelta(days=offset)).isoformat() for offset in range(13, -1, -1)]
    activity = {day: {"date": day, "assessments": 0, "sign_ins": 0} for day in days}
    with closing(get_conn()) as conn:
        for table, column, metric in (
            ("trip_history", "created_at", "assessments"),
            ("login_events", "logged_in_at", "sign_ins"),
        ):
            day_expr = f"DATE({column} AT TIME ZONE 'UTC')" if DATABASE_URL else f"DATE({column})"
            cutoff = "CAST(? AS TIMESTAMPTZ)" if DATABASE_URL else "?"
            rows = conn.execute(
                f"SELECT {day_expr} AS day, COUNT(*) AS total FROM {table} "
                f"WHERE {column} >= {cutoff} GROUP BY 1",
                (days[0] + " 00:00:00+00" if DATABASE_URL else days[0],),
            ).fetchall()
            for row in rows:
                day = str(row["day"])
                if day in activity:
                    activity[day][metric] = row["total"]

        counts = conn.execute(
            """SELECT (SELECT COUNT(*) FROM users) AS accounts,
                      (SELECT COUNT(*) FROM trip_history) AS assessments,
                      (SELECT COUNT(*) FROM login_events) AS sign_ins,
                      (SELECT COUNT(*) FROM push_subscriptions) AS subscriptions"""
        ).fetchone()
        providers = conn.execute(
            "SELECT provider, COUNT(*) AS total FROM login_events GROUP BY provider ORDER BY provider"
        ).fetchall()
        destinations = conn.execute(
            """SELECT destination, COUNT(*) AS total FROM trip_history
               GROUP BY destination HAVING COUNT(*) >= 2
               ORDER BY total DESC, destination LIMIT 10"""
        ).fetchall()
    return {
        "counts": dict(counts),
        "activity": list(activity.values()),
        "sign_in_providers": [dict(row) for row in providers],
        "destinations": [dict(row) for row in destinations],
    }
