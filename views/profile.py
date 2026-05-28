import os
import uuid
import secrets
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from django.http import FileResponse, HttpResponse  # Chèn thêm để phục vụ hàm đọc/ghi file local
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny  # Import thêm AllowAny cho hàng giả lập
from rest_framework.response import Response

from ..models import Users, RefreshTokens
from ..serializers import UserProfileSerializer
from ..utils.response import error, success

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    user = request.user

    if request.method == "GET":
        serializer = UserProfileSerializer(user, context={"request": request})
        return Response({"data": serializer.data})

    serializer = UserProfileSerializer(user, data=request.data, partial=True, context={"request": request})
    if not serializer.is_valid():
        first_error = next(iter(serializer.errors.values()))[0]
        code = str(first_error) if str(first_error).isupper() else "INVALID_FORMAT"
        return error(code, str(first_error), 409 if code == "NAME_ALREADY_EXISTS" else 422)

    serializer.save(updated_at=timezone.now())
    return Response({"data": serializer.data})

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    current_password = request.data.get("current_password")
    new_password = request.data.get("new_password")
    logout_all = request.data.get("logout_all_devices", False)

    if not current_password or not new_password:
        return error("INVALID_FORMAT", "Dữ liệu sai định dạng.", 422)

    user = request.user
    if not check_password(current_password, user.password_hash or ''):
        return error("WRONG_PASSWORD", "Mật khẩu hiện tại sai.", 400)

    if check_password(new_password, user.password_hash or ''):
        return error("SAME_PASSWORD", "Mật khẩu mới không được trùng mật khẩu cũ.", 422)

    user.password_hash = make_password(new_password)
    user.updated_at = timezone.now()

    if logout_all:
        RefreshTokens.objects.filter(user_id=user.id, revoked_at__isnull=True).update(revoked_at=timezone.now())
        user.status_token = secrets.token_hex(16) # Vô hiệu hóa AT cũ theo đúng thiết kế hệ thống

    user.save()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def presigned_url_view(request):
    # Giả lập Presigned URL cục bộ phục vụ dev local
    file_name = request.data.get("file_name", "")
    file_type = request.data.get("file_type", "")
    file_size = request.data.get("file_size", 0)

    if not file_name or not file_type or not file_size:
        return error("INVALID_FORMAT", "Thiếu thông tin file.", 422)

    user = request.user
    ext = os.path.splitext(file_name)[1].lower()
    s3_key = f"users/{user.id}/avatar{ext}"
    
    base_url = getattr(settings, "LOCAL_MEDIA_BASE_URL", "http://localhost:8000")
    file_url = f"{base_url}/media/{s3_key}"

    return Response({
        "data": {
            "media_id": None,
            "upload_url": f"{base_url}/api/media/upload/{s3_key}",
            "file_url": f"{base_url}/api/media/{s3_key}",
            "expires_in": 300
        }
    }, status=status.HTTP_201_CREATED)


# ==========================================================================================
# 🔥 HÀNG GIẢ LẬP LOCAL (SẼ XÓA SẠCH HOÀN TOÀN 2 HÀM DƯỚI ĐÂY KHI DEPLOY LÊN PRODUCTION TRÊN AWS S3)
#
# 👉 TẠI SAO LẠI THÊM CẢ HAI THẰNG ĐI CÙNG NHAU THẾ NÀY?
# 1. @authentication_classes([]): Nhằm tắt cơ chế tự động quét kiểm tra JWT Token mặc định của dự án.
#    Khi Frontend thực hiện lệnh PUT để tải file ảnh thô lên, request đó hoàn toàn không mang theo 
#    Header Authorization chứa Token. Nếu không tắt lớp này đi, Django Rest Framework sẽ tự động 
#    chặn đứng lại và báo lỗi "401 Unauthorized" ngay từ vòng gửi xe.
# 2. @permission_classes([AllowAny]): Khi đã tắt lớp check Token ở trên, lớp này sẽ mở toang cửa 
#    cho phép bất kỳ ai (kể cả khách vãng lai chưa đăng nhập) cũng có thể đẩy file hoặc đọc file ảnh đại diện.
# ==========================================================================================

@api_view(["PUT"])
@authentication_classes([])  # Tắt lớp check Token toàn cục của dự án đối với riêng API này
@permission_classes([AllowAny])  # Mở cửa cho request không có token đi thẳng vào xử lý ghi file
def upload_local_file_view(request, file_path):
    """
    Hàm hứng dữ liệu file thô từ Frontend và lưu trực tiếp vào thư mục local_media dưới máy.
    """
    try:
        # Tự động tạo thư mục local_media trong source code nếu chưa tồn tại
        full_dir = os.path.join(settings.BASE_DIR, "local_media", os.path.dirname(file_path))
        os.makedirs(full_dir, exist_ok=True)
        
        full_path = os.path.join(settings.BASE_DIR, "local_media", file_path)
        
        # Đọc dữ liệu binary thô (raw body) từ request và ghi thẳng thành file vật lý
        with open(full_path, "wb") as f:
            f.write(request.body)
            
        return HttpResponse(status=200)
    except Exception as e:
        return HttpResponse(str(e), status=500)


@api_view(["GET"])
@authentication_classes([])  # Tắt check Token để bất cứ ai cũng có thể lướt qua xem được ảnh avatar công khai
@permission_classes([AllowAny])  # Cho phép hiển thị ảnh công khai lên giao diện người dùng
def serve_local_file_view(request, file_path):
    """
    Hàm đọc file ảnh từ thư mục tạm local_media lên để trả về cho Frontend render ra giao diện.
    """
    full_path = os.path.join(settings.BASE_DIR, "local_media", file_path)
    
    if os.path.exists(full_path):
        return FileResponse(open(full_path, "rb"))
        
    return HttpResponse("File không tồn tại trên hệ thống local.", status=404)