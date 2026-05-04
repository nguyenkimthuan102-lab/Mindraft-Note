# myapp/views.py
# ─────────────────────────────────────────────────────────────────────────────
 
# 1. Django
from django.shortcuts import render
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.core.cache import cache
from django.conf import settings as django_settings
 
# 2. DRF
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
 
# 3. JWT
from rest_framework_simplejwt.tokens import RefreshToken
 
# 4. Local
from .models import Note, OTPCode
from .serializers import (
    NoteSerializer,
    RegisterSerializer,
    VerifyOtpSerializer,
    LoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
 
 
# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
 
def success_response(data: dict, http_status=200):
    """
    Bọc thành {"data": {...}}.
    api.ts đọc: body.data !== undefined ? body.data : body
    → luôn bọc để nhất quán.
    """
    return Response({"data": data}, status=http_status)
 
 
def error_response(code: str, message: str, http_status=400):
    """
    api.ts throw: { status, ...errorBody.error }
    → cần format: {"error": {"code": "...", "message": "..."}}
    """
    return Response({"error": {"code": code, "message": message}}, status=http_status)
 
 
def _build_token_payload(user) -> dict:
    """
    Tạo JWT và trả về dict khớp với những gì api.ts lưu vào SecureStore.
    api.ts lưu: access_token, refresh_token (qua key tương ứng)
    api.ts refresh gửi: { refresh: refreshToken }
    → trả về key "access" và "refresh" để thống nhất với SimpleJWT convention
    """
    import datetime
    refresh    = RefreshToken.for_user(user)
    lifetime   = django_settings.SIMPLE_JWT.get(
        'ACCESS_TOKEN_LIFETIME', datetime.timedelta(days=1)
    )
    return {
        "access":     str(refresh.access_token),
        "refresh":    str(refresh),
        "expires_in": int(lifetime.total_seconds()),
    }
 
 
def _send_otp_email(email: str, otp_obj: OTPCode, purpose: str):
    """
    Dev: EMAIL_BACKEND = ConsoleEmailBackend → OTP in ra terminal.
    Prod: đổi sang SMTP trong settings.py.
    """
    subject_map = {
        'verify_email':   '[Mindraft] Mã xác thực tài khoản',
        'reset_password': '[Mindraft] Mã đặt lại mật khẩu',
    }
    body = (
        f"Mã OTP của bạn là: {otp_obj.code}\n"
        f"Mã có hiệu lực trong {OTPCode.OTP_EXPIRE_MINUTES} phút.\n"
        "Không chia sẻ mã này với bất kỳ ai."
    )
    send_mail(
        subject        = subject_map.get(purpose, '[Mindraft] OTP'),
        message        = body,
        from_email     = getattr(django_settings, 'DEFAULT_FROM_EMAIL', 'noreply@mindraft.app'),
        recipient_list = [email],
        fail_silently  = False,
    )
 
 
# ─────────────────────────────────────────────────────────────────────────────
# NOTE VIEWS
# ─────────────────────────────────────────────────────────────────────────────
 
def home(request):
    return render(request, 'index.html')
 
 
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def note_list(request):
    if request.method == 'GET':
        notes = Note.objects.filter(user=request.user).order_by('-id')
        return Response(NoteSerializer(notes, many=True).data)
 
    serializer = NoteSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)
 
 
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def note_detail(request, pk):
    try:
        note = Note.objects.get(pk=pk, user=request.user)
    except Note.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
 
    if request.method == 'GET':
        return Response(NoteSerializer(note).data)
 
    if request.method == 'PUT':
        serializer = NoteSerializer(note, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
 
    note.delete()
    return Response({"message": "Deleted"}, status=204)
 
 
# ─────────────────────────────────────────────────────────────────────────────
# AUTH – REGISTER
# POST /api/auth/register/
# Frontend: { "email", "password", "confirmPassword", "nickname" }
# confirmPassword chỉ validate ở Frontend, Backend không cần nhận
# ─────────────────────────────────────────────────────────────────────────────
 
@api_view(['POST'])
@permission_classes([AllowAny])
def auth_register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=400)
 
    user = serializer.save()    # is_active=False, nickname→first_name
 
    otp_obj = OTPCode.generate(email=user.email, purpose='verify_email')
    _send_otp_email(user.email, otp_obj, 'verify_email')
 
    return success_response(
        {"message": "Đăng ký thành công. Kiểm tra email để lấy mã OTP."},
        http_status=201,
    )
 
 
# ─────────────────────────────────────────────────────────────────────────────
# AUTH – VERIFY OTP  (dùng chung register + forgot-password)
# POST /api/auth/verify-otp/
# Frontend otp.tsx gửi: { "email", "code", "mode" }
#   mode = "register" → kích hoạt account, trả token luôn (vào app ngay)
#   mode = "reset"    → lưu cache, cho phép gọi reset-password
# ─────────────────────────────────────────────────────────────────────────────
 
@api_view(['POST'])
@permission_classes([AllowAny])
def auth_verify_otp(request):
    serializer = VerifyOtpSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=400)
 
    email = serializer.validated_data['email']
    code  = serializer.validated_data['code']
    mode  = request.data.get('mode', 'register')    # "register" | "reset"
 
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return error_response("USER_NOT_FOUND", "Email không tồn tại.", 404)
 
    purpose = 'verify_email' if mode == 'register' else 'reset_password'
    otp_obj = (
        OTPCode.objects
        .filter(email=email, purpose=purpose, is_used=False)
        .first()
    )
 
    if otp_obj is None or not otp_obj.verify(code):
        return error_response("OTP_INVALID", "Mã OTP không hợp lệ hoặc đã hết hạn.", 400)
 
    if mode == 'register':
        # Kích hoạt account → trả token để vào app ngay, không cần login thêm bước
        user.is_active = True
        user.save(update_fields=['is_active'])
        return success_response(_build_token_payload(user))
 
    else:   # mode == 'reset'
        # Lưu cache 10 phút: email đã xác thực, được phép gọi reset-password
        cache.set(f"pwd_reset_verified:{email}", True, timeout=600)
        return success_response({"message": "Xác thực thành công. Bạn có thể đặt lại mật khẩu."})
 
 
# ─────────────────────────────────────────────────────────────────────────────
# AUTH – LOGIN
# POST /api/auth/login/
# Frontend: { "email", "password" }
# api.ts sau đó lưu: SecureStore.setItemAsync('access_token', access)
#                    SecureStore.setItemAsync('refresh_token', refresh)
# ─────────────────────────────────────────────────────────────────────────────
 
@api_view(['POST'])
@permission_classes([AllowAny])
def auth_login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=400)
 
    email    = serializer.validated_data['email']
    password = serializer.validated_data['password']
 
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return error_response("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.", 401)
 
    if not user.is_active:
        return error_response("EMAIL_NOT_VERIFIED", "Tài khoản chưa được xác thực email.", 403)
 
    if not user.check_password(password):
        return error_response("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.", 401)
 
    return success_response(_build_token_payload(user))
 
 
# ─────────────────────────────────────────────────────────────────────────────
# AUTH – REFRESH TOKEN
# POST /api/auth/refresh/
# api.ts gửi: body = { "refresh": "<token>" }  ← KHÔNG phải Cookie
# Vì đây là mobile app dùng SecureStore, không phải browser
# ─────────────────────────────────────────────────────────────────────────────
 
@api_view(['POST'])
@permission_classes([AllowAny])
def auth_refresh(request):
    # Đọc từ body (khớp với api.ts: body: JSON.stringify({ refresh: refreshToken }))
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return error_response("REFRESH_TOKEN_MISSING", "Thiếu refresh token.", 401)
 
    try:
        refresh    = RefreshToken(refresh_token)
        new_access = refresh.access_token
    except Exception:
        return error_response("REFRESH_TOKEN_INVALID", "Refresh token không hợp lệ hoặc đã hết hạn.", 401)
 
    import datetime
    lifetime   = django_settings.SIMPLE_JWT.get(
        'ACCESS_TOKEN_LIFETIME', datetime.timedelta(days=1)
    )
    # api.ts đọc: resData.data?.access || resData.access → bọc trong data
    return success_response({
        "access":     str(new_access),
        "expires_in": int(lifetime.total_seconds()),
    })
 
 
# ─────────────────────────────────────────────────────────────────────────────
# AUTH – LOGOUT
# POST /api/auth/logout/
# ─────────────────────────────────────────────────────────────────────────────
 
@api_view(['POST'])
@permission_classes([AllowAny])
def auth_logout(request):
    # Mobile app tự xóa token ở SecureStore
    # Backend chỉ cần trả 200, không cần xóa Cookie
    return success_response({"message": "Đăng xuất thành công."})
 
 
# ─────────────────────────────────────────────────────────────────────────────
# AUTH – FORGOT PASSWORD
# POST /api/auth/forgot-password/
# Frontend: { "email" }
# ─────────────────────────────────────────────────────────────────────────────
 
@api_view(['POST'])
@permission_classes([AllowAny])
def auth_forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=400)
 
    email = serializer.validated_data['email']
 
    # Luôn trả 200 để không lộ email có tồn tại không
    try:
        user = User.objects.get(email=email, is_active=True)
        otp_obj = OTPCode.generate(email=user.email, purpose='reset_password')
        _send_otp_email(user.email, otp_obj, 'reset_password')
    except User.DoesNotExist:
        pass
 
    return success_response({
        "message": "Nếu email tồn tại, mã OTP đặt lại mật khẩu đã được gửi."
    })
 
 
# ─────────────────────────────────────────────────────────────────────────────
# AUTH – RESET PASSWORD
# POST /api/auth/reset-password/
# Frontend: { "email", "password" }
# Xác thực phiên bằng cache key được set ở bước verify-otp (mode=reset)
# ─────────────────────────────────────────────────────────────────────────────
 
@api_view(['POST'])
@permission_classes([AllowAny])
def auth_reset_password(request):
    serializer = ResetPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=400)
 
    email        = serializer.validated_data['email']
    new_password = serializer.validated_data['password']
 
    # Kiểm tra cache: đảm bảo đã qua bước verify-otp
    if not cache.get(f"pwd_reset_verified:{email}"):
        return error_response(
            "RESET_TOKEN_INVALID",
            "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại từ đầu.",
            400,
        )
 
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return error_response("RESET_TOKEN_INVALID", "Tài khoản không tồn tại.", 400)
 
    if user.check_password(new_password):
        return error_response("SAME_PASSWORD", "Mật khẩu mới không được trùng với mật khẩu cũ.", 400)
 
    user.set_password(new_password)
    user.save(update_fields=['password'])
    cache.delete(f"pwd_reset_verified:{email}")     # Xóa cache sau khi dùng xong
 
    return success_response({"message": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại."})