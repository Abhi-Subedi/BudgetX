"""Apple Sign In provider.

Requires Apple Developer configuration:
  - APPLE_CLIENT_ID  (your Services ID)
  - APPLE_TEAM_ID    (your Team ID)
  - APPLE_KEY_ID     (the key ID for the .p8 private key)
  - APPLE_PRIVATE_KEY (contents of the .p8 private key file)
Set these in your .env file or environment variables.
"""

import secrets
import time
from urllib.parse import urlencode

import httpx
import jwt
from jwt.algorithms import RSAAlgorithm

from app.core.config import get_settings
from app.core.errors import AppError

APPLE_AUTH_URL = "https://appleid.apple.com/auth/authorize"
APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token"
APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys"

_settings = get_settings()

_apple_public_keys: dict = {}
_apple_keys_fetched_at: float = 0


def _fetch_apple_keys() -> dict:
    """Fetch and cache Apple's public signing keys."""
    global _apple_public_keys, _apple_keys_fetched_at
    now = time.time()
    if _apple_public_keys and (now - _apple_keys_fetched_at) < 3600:
        return _apple_public_keys
    resp = httpx.get(APPLE_KEYS_URL, timeout=15)
    if resp.status_code != 200:
        raise AppError(502, "Failed to fetch Apple signing keys.")
    jwks = resp.json().get("keys", [])
    _apple_public_keys = {k["kid"]: k for k in jwks}
    _apple_keys_fetched_at = now
    return _apple_public_keys


def get_apple_authorization_url(state: str | None = None, nonce: str | None = None) -> str:
    """Build the Apple Sign In authorization URL."""
    if not _settings.apple_client_id:
        raise AppError(500, "Apple Sign In is not configured. Set APPLE_CLIENT_ID.")
    if state is None:
        state = secrets.token_urlsafe(32)
    if nonce is None:
        nonce = secrets.token_urlsafe(16)
    params = {
        "client_id": _settings.apple_client_id,
        "redirect_uri": "postmessage",
        "response_type": "code id_token",
        "scope": "name email",
        "response_mode": "form_post",
        "state": state,
        "nonce": nonce,
    }
    return f"{APPLE_AUTH_URL}?{urlencode(params)}"


def exchange_code(code: str) -> dict:
    """Exchange an Apple authorization code for access/ID tokens."""
    if not _settings.apple_client_id or not _settings.apple_team_id or not _settings.apple_key_id:
        raise AppError(500, "Apple Sign In is not configured. Set APPLE_CLIENT_ID, APPLE_TEAM_ID, and APPLE_KEY_ID.")

    now = int(time.time())
    client_secret = jwt.encode(
        {
            "iss": _settings.apple_team_id,
            "iat": now,
            "exp": now + 15777000,
            "aud": "https://appleid.apple.com",
            "sub": _settings.apple_client_id,
        },
        _settings.apple_private_key,
        algorithm="ES256",
        headers={"kid": _settings.apple_key_id},
    )

    data = {
        "code": code,
        "client_id": _settings.apple_client_id,
        "client_secret": client_secret,
        "redirect_uri": "postmessage",
        "grant_type": "authorization_code",
    }
    resp = httpx.post(APPLE_TOKEN_URL, data=data, timeout=15)
    if resp.status_code != 200:
        detail = resp.json().get("error_description", resp.text)
        raise AppError(400, f"Apple token exchange failed: {detail}")
    return resp.json()


def validate_id_token(id_token: str) -> dict:
    """Validate an Apple ID token and return its payload."""
    if not _settings.apple_client_id:
        raise AppError(500, "Apple Sign In is not configured. Set APPLE_CLIENT_ID.")

    # Decode header to find the key ID
    unverified_header = jwt.get_unverified_header(id_token)
    kid = unverified_header.get("kid")
    if kid is None:
        raise AppError(401, "Apple ID token is missing a key ID.")

    keys = _fetch_apple_keys()
    key_data = keys.get(kid)
    if key_data is None:
        raise AppError(401, f"No matching Apple public key for kid={kid}.")

    public_key = RSAAlgorithm.from_jwk(key_data)
    try:
        payload = jwt.decode(
            id_token,
            public_key,
            algorithms=["RS256"],
            audience=_settings.apple_client_id,
            issuer="https://appleid.apple.com",
        )
    except jwt.ExpiredSignatureError:
        raise AppError(401, "Apple ID token has expired.")
    except jwt.InvalidAudienceError:
        raise AppError(401, "Apple ID token has an invalid audience.")
    except jwt.InvalidIssuerError:
        raise AppError(401, "Apple ID token has an invalid issuer.")
    except jwt.DecodeError:
        raise AppError(401, "Apple ID token could not be decoded.")

    return payload
