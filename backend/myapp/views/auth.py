import uuid
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from ..utils.otp import (generate_otp, hash_otp, save_and_send_otp, cache_pending_register, pop_pending_register,
    OtpSendThrottle, OtpVerifyThrottle,)
from ..utils.response import success, error
from rest_framework.decorators import api_view, throttle_classes, authentication_classes, permission_classes
from rest_framework.response import Response
from ..models import Users, OtpVerifications
from ..utils.token import *
from django.core.cache import cache
from rest_framework.permissions import AllowAny
from ..utils.google import verify_google_token



#  REGISTER
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([OtpSendThrottle])
def register_view(request):
    name = request.data.get("name")
    email = request.data.get("email")
    password = request.data.get("password")

    if not name or not email or not password:
        return error("INVALID_FORMAT", "Dữ liệu sai định dạng.", 422)

    if Users.objects.filter(name=name).exists():
        return error("NAME_ALREADY_EXISTS", "Tên đã tồn tại.", 409)
    
    if Users.objects.filter(email=email).exists():
        return error("EMAIL_ALREADY_EXISTS", "Email đã đăng ký.", 409)
    
    otp = generate_otp()
    save_and_send_otp(email, purpose='register', otp=otp)
    cache_pending_register(email, name, password)
    
    return success({"message": "OTP đã được gửi tới email. Vui lòng xác thực trong 5 phút."})

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([OtpVerifyThrottle])
def verify_otp_view(request):
    email   = request.data.get("email")
    otp     = request.data.get("otp")
    purpose = request.data.get("purpose")

    if not email or not otp or not purpose:
        return error("INVALID_FORMAT", "Dữ liệu sai định dạng.", 422)

    try:
        record = OtpVerifications.objects.get(
            email=email,
            otp_hash=hash_otp(otp),
            purpose=purpose,
            used_at__isnull=True,
        )
    except OtpVerifications.DoesNotExist:
        return error("OTP_INVALID", "Mã OTP sai.", 400)

    if timezone.now() > record.expires_at:
        return error("OTP_EXPIRED", "Mã OTP hết hạn.", 400)

    record.used_at = timezone.now()
    record.save()


    if purpose == 'register':
        pending = pop_pending_register(email)
        if not pending:
            return error("SESSION_EXPIRED", "Phiên đăng ký hết hạn.",400)

        user = Users.objects.create(
            id=str(uuid.uuid4()),
            name=pending["name"],
            email=email,
            password_hash=make_password(pending["password"]),
            is_verified=1,
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )

        # Refresh token tự quản lý
        raw_refresh = generate_refresh_token()
        save_refresh_token(user.id, raw_refresh)

        is_mobile = request.headers.get('X-Platform') == 'mobile'

        data = {
            "access_token": make_access_token(user),
            "expires_in": 900,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "avatar_url": user.avatar_url,
            },
        }
        if is_mobile:
            data["refresh_token"] = raw_refresh

        response = Response({"data": data}, status=201)
        if not is_mobile:
            response.set_cookie('refresh_token', raw_refresh, httponly=True)
        return response
     
    # --- reset_password ---
    if purpose == 'reset_password':
        reset_token = str(uuid.uuid4())
        cache.set(f"reset_token:{reset_token}", email, timeout=900)  # 15 phút

        return success({"reset_token": reset_token, "expires_in": 900})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([OtpSendThrottle])
def resend_otp_view(request):
    email   = request.data.get("email")
    purpose = request.data.get("purpose")

    if not email or not purpose:
        return error("INVALID_FORMAT", "Dữ liệu sai định dạng.", 422)

    # Kiểm tra email tồn tại theo từng purpose
    if purpose == 'register':
        if not cache.get(f"pending_register:{email}"):
            return error("EMAIL_NOT_FOUND", "Email không tồn tại trong hệ thống.", 404)
    elif purpose == 'reset_password':
        if not Users.objects.filter(email=email).exists():
            return error("EMAIL_NOT_FOUND", "Email không tồn tại trong hệ thống.", 404)

    otp = generate_otp()
    save_and_send_otp(email, purpose=purpose, otp=otp)

    return success({"message": "OTP mới đã được gửi."})

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def refresh_token_view(request):
    is_mobile = request.headers.get('X-Platform') == 'mobile'
    raw_token = (
        request.data.get("refresh_token")
        if is_mobile
        else request.COOKIES.get("refresh_token")
    )

    if not raw_token:
        return error("REFRESH_TOKEN_INVALID", "Refresh token không hợp lệ.", 401)

    try:
        record = verify_refresh_token(raw_token)
    except ValueError as e:
        code = str(e)  # "REFRESH_TOKEN_INVALID" hoặc "REFRESH_TOKEN_EXPIRED"
        messages = {
            "REFRESH_TOKEN_INVALID": "Refresh token không hợp lệ.",
            "REFRESH_TOKEN_EXPIRED": "Refresh token hết hạn.",
        }
        return error(code, messages.get(code, "Lỗi xác thực."), 401)

    user = Users.objects.get(id=record.user_id)

    # Rotation: revoke cũ, cấp mới
    revoke_refresh_token(raw_token)
    new_raw = generate_refresh_token()
    save_refresh_token(user.id, new_raw)

    data = {
        "access_token": make_access_token(user),
        "expires_in": 900,
    }
    if is_mobile:
        data["refresh_token"] = new_raw

    response = success(data)
    if not is_mobile:
        response.set_cookie('refresh_token', new_raw, httponly=True)
    return response

@api_view(['POST'])
def google_login_view(request):
    id_token_str = request.data.get("id_token")

    if not id_token_str:
        return error("INVALID_FORMAT", "Dữ liệu sai định dạng.", 422)

    try:
        google_data = verify_google_token(id_token_str)
    except ValueError:
        return error("INVALID_TOKEN", "Google token không hợp lệ.", 401)

    user, created = Users.objects.get_or_create(
        email=google_data["email"],
        defaults={
            "id":            str(uuid.uuid4()),
            "name":          google_data["name"],
            "password_hash": make_password(None),  # unusable password
            "google_id":     google_data["google_id"],
            "is_verified":   1,
            "avatar_url":    google_data["avatar_url"],
            "created_at":    timezone.now(),
            "updated_at":    timezone.now(),
        }
    )

    # Cập nhật avatar nếu user cũ chưa có
    if not created and not user.avatar_url and google_data["avatar_url"]:
        user.avatar_url = google_data["avatar_url"]
        user.save(update_fields=["avatar_url", "updated_at"])

    raw_refresh = generate_refresh_token()
    save_refresh_token(user.id, raw_refresh)

    is_mobile = request.headers.get('X-Platform') == 'mobile'

    data = {
        "access_token": make_access_token(user),
        "expires_in":   900,
        "user": {
            "id":         user.id,
            "name":       user.name,
            "email":      user.email,
            "avatar_url": user.avatar_url,
        },
    }
    if is_mobile:
        data["refresh_token"] = raw_refresh

    response = success(data, 201 if created else 200)
    if not is_mobile:
        response.set_cookie('refresh_token', raw_refresh, httponly=True)
    return response

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    email    = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return error("INVALID_FORMAT", "Dữ liệu sai định dạng.", 422)

    user = Users.objects.filter(email=email).first()

    # Không tìm thấy email hoặc mật khẩu sai → cùng 1 mã lỗi để chống dò email
    if not user or not check_password(password, user.password_hash or ''):
        return error("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.", 401)

    if not user.is_verified:
        return error("ACCOUNT_NOT_VERIFIED", "Tài khoản chưa được xác thực OTP.", 403)

    # Cấp token — dùng đúng hàm helper
    raw_refresh = generate_refresh_token()
    save_refresh_token(user.id, raw_refresh)

    is_mobile = request.headers.get('X-Platform') == 'mobile'

    data = {
        "access_token": make_access_token(user),
        "expires_in":   900,
        "user": {
            "id":         user.id,
            "name":       user.name,
            "email":      user.email,
            "avatar_url": user.avatar_url,
        },
    }
    if is_mobile:
        data["refresh_token"] = raw_refresh

    response = success(data)
    if not is_mobile:
        response.set_cookie(
            'refresh_token', raw_refresh,
            httponly=True,
            samesite='Lax',
        )
    return response


# ─────────────────────────────────────────────────────────────────────
# 1.8  QUÊN MẬT KHẨU — GỬI OTP
# POST /auth/forgot-password/
# ─────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([OtpSendThrottle])
def forgot_password_view(request):
    email = request.data.get('email')

    if not email:
        return error("INVALID_FORMAT", "Dữ liệu sai định dạng.", 422)

    if not Users.objects.filter(email=email).exists():
        return error("EMAIL_NOT_FOUND", "Email không tồn tại trong hệ thống.", 404)

    # Tái dùng save_and_send_otp của Leader, purpose='reset_password'
    # Sau khi user verify OTP (POST /auth/verify-otp/ với purpose='reset_password'),
    # verify_otp_view sẽ tự set cache reset_token:{uuid} → email (15 phút).
    otp = generate_otp()
    save_and_send_otp(email, purpose='reset_password', otp=otp)

    return success({"message": "OTP đã được gửi tới email."})


# ─────────────────────────────────────────────────────────────────────
# 1.9  ĐẶT LẠI MẬT KHẨU MỚI
# POST /auth/reset-password/
# ─────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def reset_password_view(request):
    reset_token  = request.data.get('reset_token')
    new_password = request.data.get('new_password')
    logout_all   = request.data.get('logout_all_devices', False)

    if not reset_token or not new_password:
        return error("INVALID_FORMAT", "Dữ liệu sai định dạng.", 422)

    # reset_token được set bởi verify_otp_view (purpose='reset_password')
    # cache key: "reset_token:{uuid}" → email
    email = cache.get(f"reset_token:{reset_token}")

    if not email:
        # Không phân biệt invalid vs expired với client để tránh dò token
        return error("RESET_TOKEN_EXPIRED", "Reset token hết hạn hoặc không hợp lệ.", 400)

    user = Users.objects.filter(email=email).first()
    if not user:
        return error("RESET_TOKEN_INVALID", "Reset token không hợp lệ.", 400)

    # Không cho đặt lại mật khẩu trùng mật khẩu cũ
    if user.password_hash and check_password(new_password, user.password_hash):
        return error("SAME_PASSWORD", "Mật khẩu mới không được trùng mật khẩu cũ.", 422)

    # Cập nhật mật khẩu
    user.password_hash = make_password(new_password)
    user.updated_at    = timezone.now()
    user.save(update_fields=['password_hash', 'updated_at'])

    # Xoá reset_token khỏi cache — dùng 1 lần duy nhất
    cache.delete(f"reset_token:{reset_token}")

    # Vô hiệu hoá toàn bộ refresh token cũ + xoay status_token nếu user yêu cầu
    if logout_all:
        import secrets
        from ..models import RefreshTokens
        RefreshTokens.objects.filter(
            user_id=user.id,
            revoked_at__isnull=True,
        ).update(revoked_at=timezone.now())

        # Xoay status_token → vô hiệu hóa tất cả access token cũ trên mọi thiết bị
        user.status_token = secrets.token_hex(16)
        user.updated_at   = timezone.now()
        user.save(update_fields=['password_hash', 'status_token', 'updated_at'])

    # Cấp token mới — cấu trúc giống hệt login_view (1.4)
    raw_refresh = generate_refresh_token()
    save_refresh_token(user.id, raw_refresh)

    is_mobile = request.headers.get('X-Platform') == 'mobile'

    data = {
        "access_token": make_access_token(user),
        "expires_in":   900,
        "user": {
            "id":         user.id,
            "name":       user.name,
            "email":      user.email,
            "avatar_url": user.avatar_url,
        },
    }
    if is_mobile:
        data["refresh_token"] = raw_refresh

    response = success(data)
    if not is_mobile:
        response.set_cookie(
            'refresh_token', raw_refresh,
            httponly=True,
            samesite='Lax',
        )
    return response