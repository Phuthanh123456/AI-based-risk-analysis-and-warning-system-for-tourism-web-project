# src/api/auth.py
"""Password and Google Identity Services sign-in."""
import os
from contextlib import closing
from hmac import compare_digest
import re
import time
from typing import Optional

import bcrypt
import jwt
from fastapi import APIRouter, Body, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr

from src.api.config import DATABASE_URL, JWT_SECRET, JWT_EXPIRE_MINUTES
from src.api.db import get_conn, create_user, get_user_by_email, get_user_by_id

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# ============================================================
# PASSWORD HASHING
# ============================================================
def hash_password(password: str) -> str:
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password exceeds bcrypt's 72-byte limit")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    if len(password.encode("utf-8")) > 72:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


# ============================================================
# JWT
# ============================================================
def create_access_token(user_id: int, email: str) -> str:
    now = int(time.time())
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": now,
        "exp": now + JWT_EXPIRE_MINUTES * 60,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"require": ["sub", "exp", "iat"]})
    if not isinstance(payload["sub"], str) or not payload["sub"].isdigit() or int(payload["sub"]) <= 0:
        raise jwt.InvalidTokenError("Invalid subject")
    return payload


def _extract_token(request: Request) -> Optional[str]:
    header = request.headers.get("Authorization") or ""
    if header.lower().startswith("bearer "):
        return header[7:].strip()
    return None


_bearer_docs = HTTPBearer(auto_error=False, scheme_name="BearerAuth")


def get_current_user(request: Request, _credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_docs)) -> dict:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = get_user_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_current_user_optional(request: Request) -> Optional[dict]:
    token = _extract_token(request)
    if not token:
        return None
    try:
        payload = decode_access_token(token)
    except jwt.PyJWTError:
        return None
    return get_user_by_id(int(payload["sub"]))


# ============================================================
# SCHEMAS
# ============================================================
class RegisterPayload(BaseModel):
    email: EmailStr
    password: str


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


def admin_credentials():
    email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    password_hash = os.getenv("ADMIN_PASSWORD_HASH", "").strip()
    if not email or not re.fullmatch(r"\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}", password_hash):
        return None
    return email, password_hash


def is_admin(user: dict) -> bool:
    credentials = admin_credentials()
    return bool(
        credentials and user["email"] == credentials[0]
        and compare_digest(user["password_hash"].encode(), credentials[1].encode())
    )


def _public_user(user: dict) -> dict:
    return {"id": user["id"], "email": user["email"], "created_at": user.get("created_at"), "is_admin": is_admin(user)}


# ============================================================
# ROUTER
# ============================================================
auth_router = APIRouter(prefix="/api/auth", tags=["auth"])


@auth_router.post("/register")
def register(payload: RegisterPayload = Body(...)):
    email = payload.email.strip().lower()
    if len(payload.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
    if len(payload.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=422, detail="Password must not exceed 72 UTF-8 bytes")
    if get_user_by_email(email):
        raise HTTPException(status_code=409, detail="Email already registered")

    user = create_user(email, hash_password(payload.password))
    token = create_access_token(user["id"], user["email"])
    return {"token": token, "user": _public_user(user)}


@auth_router.post("/login")
def login(payload: LoginPayload = Body(...)):
    email = payload.email.strip().lower()
    user = get_user_by_email(email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    with closing(get_conn()) as conn, conn:
        conn.execute("INSERT INTO login_events(user_id, provider) VALUES (?, 'password')", (user["id"],))
    token = create_access_token(user["id"], user["email"])
    return {"token": token, "user": _public_user(user)}


@auth_router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return _public_user(current_user)

class GoogleLogin(BaseModel):
    credential: str


@auth_router.post("/google")
def google_login(payload: GoogleLogin):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(503, "Google sign-in is not configured")
    from google.oauth2.id_token import verify_oauth2_token
    from google.auth.transport.requests import Request as GoogleRequest
    from google.auth.exceptions import TransportError, GoogleAuthError
    try:
        claims = verify_oauth2_token(payload.credential, GoogleRequest(), client_id)
    except TransportError:
        raise HTTPException(503, "Google verification temporarily unavailable")
    except (ValueError, GoogleAuthError):
        raise HTTPException(401, "Invalid Google credential")
    if claims.get("email_verified") is not True or not claims.get("sub") or not claims.get("email"):
        raise HTTPException(401, "Verified Google email required")

    email = claims["email"].strip().lower()
    with closing(get_conn()) as conn, conn:
        # SQLite needs an explicit write lock here. PostgreSQL starts a
        # transaction automatically for the first statement on this connection.
        if not DATABASE_URL:
            conn.execute("BEGIN IMMEDIATE")
        identity = conn.execute("SELECT user_id FROM google_identity WHERE subject=?", (claims["sub"],)).fetchone()
        if identity:
            uid = identity["user_id"]
            conn.execute("UPDATE google_identity SET display_name=? WHERE user_id=?", (claims.get("name", ""), uid))
        else:
            if conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone():
                raise HTTPException(409, "This email already has an account. Use your original sign-in method.")
            if DATABASE_URL:
                uid = conn.execute(
                    "INSERT INTO users(email,password_hash) VALUES (?, '!google') RETURNING id", (email,)
                ).fetchone()["id"]
            else:
                uid = conn.execute("INSERT INTO users(email,password_hash) VALUES (?, '!google')", (email,)).lastrowid
            conn.execute("INSERT INTO google_identity VALUES (?,?,?)", (claims["sub"], uid, claims.get("name", "")))
        conn.execute("INSERT INTO login_events(user_id, provider) VALUES (?, 'google')", (uid,))
        user = dict(conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone())
    return {"token": create_access_token(uid, user["email"]), "user": _public_user(user)}
