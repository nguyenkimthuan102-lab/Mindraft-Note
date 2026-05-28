from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings

def verify_google_token(token: str) -> dict:
    try:
        payload = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise ValueError("INVALID_TOKEN")

    return {
        "email":      payload["email"],
        "name":       payload.get("name", ""),
        "google_id":  payload["sub"],
        "avatar_url": payload.get("picture", None),
    }