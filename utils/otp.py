# _generate_otp, _hash_otp

import hashlib, secrets, string, uuid
from rest_framework.throttling import SimpleRateThrottle
from ..models import OtpVerifications
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from django.core.mail import send_mail

def generate_otp(length: int = 6) -> str:
    return ''.join(secrets.choice(string.digits) for _ in range(length))

def hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


class OtpSendThrottle(SimpleRateThrottle):
    scope = 'otp_send'
    rate = '10/hour'

    def get_cache_key(self, request, view):
        if not isinstance(request.data, dict):
            return None
        email = request.data.get('email', '')
        return f'throttle_otp_send_{email}'

class OtpVerifyThrottle(SimpleRateThrottle):
    scope = 'otp_verify'
    rate = '20/hour'

    def get_cache_key(self, request, view):
        if not isinstance(request.data, dict):
            return None
        
        email = request.data.get('email', '')
        return f'throttle_otp_verify_{email}'
    
def save_and_send_otp(email: str, purpose: str, otp: str) -> None:
    """Xoá OTP cũ, lưu OTP mới, gửi email."""
    otp_hash = hash_otp(otp)
    OtpVerifications.objects.filter(email=email, purpose=purpose).delete()
    OtpVerifications.objects.create(
        id=str(uuid.uuid4()),
        email=email,
        otp_hash=otp_hash,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=5),
        created_at=timezone.now(),
    )
    send_mail(
        subject='Xác thực tài khoản Mindraft Note',
        message=f'Mã OTP của bạn là: {otp}. Hết hạn sau 5 phút.',
        from_email='no-reply@mindraft.app',
        recipient_list=[email],
        fail_silently=False,
    )

def cache_pending_register(email: str, name: str, password: str) -> None:
    cache.set(f"pending_register:{email}", {"name": name, "password": password}, timeout=300)

def pop_pending_register(email: str) -> dict | None:
    data = cache.get(f"pending_register:{email}")
    if data:
        cache.delete(f"pending_register:{email}")
    return data
