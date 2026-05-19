import hashlib, secrets, uuid
from datetime import timedelta
from django.utils import timezone
from ..models import RefreshTokens
from rest_framework_simplejwt.tokens import AccessToken as _AccessToken  # dùng cho make_access_token

def generate_refresh_token() -> str:
    """Sinh raw token gửi cho client."""
    return secrets.token_urlsafe(64)

def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()

def save_refresh_token(user_id: str, raw_token: str, days: int = 7) -> None:
    RefreshTokens.objects.create(
        id=str(uuid.uuid4()),
        user_id=user_id,
        token_hash=hash_token(raw_token),
        expires_at=timezone.now() + timedelta(days=days),
        created_at=timezone.now(),
    )

def verify_refresh_token(raw_token: str):
    """Trả về record nếu hợp lệ, raise exception nếu không."""
    try:
        record = RefreshTokens.objects.get(
            token_hash=hash_token(raw_token),
            revoked_at__isnull=True,
        )
    except RefreshTokens.DoesNotExist:
        raise ValueError("REFRESH_TOKEN_INVALID")

    if timezone.now() > record.expires_at:
        raise ValueError("REFRESH_TOKEN_EXPIRED")

    return record

def revoke_refresh_token(raw_token: str) -> None:
    RefreshTokens.objects.filter(
        token_hash=hash_token(raw_token)
    ).update(revoked_at=timezone.now())

def make_access_token(user) -> str:
    token = _AccessToken.for_user(user)
    token['status_token'] = user.status_token or ''
    return str(token)