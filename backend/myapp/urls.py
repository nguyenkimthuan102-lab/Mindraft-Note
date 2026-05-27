from django.urls import path
from .views.auth import *
from .views.settings import *
from .views.Notes_task import *
from .views.profile import user_profile_view, change_password_view, presigned_url_view, upload_local_file_view, serve_local_file_view

urlpatterns = [
    path('auth/register/', register_view),
    path('auth/verify-otp/', verify_otp_view),
    path('auth/resend-otp/', resend_otp_view),

    path('auth/google/', google_login_view),
    path('auth/refresh/', refresh_token_view, name='token_refresh'),
    path('auth/login/',           login_view),
    path('auth/forgot-password/', forgot_password_view),
    path('auth/reset-password/',  reset_password_view),

    # ─── USERS & MEDIA PROFILE ───────────────────────────────────────────
    path("users/me",              user_profile_view,    name="user-profile"), 
    path("users/me/password",     change_password_view, name="change-password"),   
    path("media/presigned-url",   presigned_url_view,   name="presigned-url"), 
    path('auth/logout/', logout_view), # Mở cổng POST Đăng xuất theo mục 1.7 Contract

    path( "users/me/settings",get_my_settings),

    path("tags/",get_tags),
    path("notes/",notes_collection_view),

    path("notes/<str:note_id>/pin",toggle_pin_note),
    path("notes/<str:note_id>/archive",toggle_archive_note),
    path("notes/<str:note_id>/trash",trash_note),
    path("notes/<str:note_id>/permanent-delete", permanent_delete_note),
    
    path("notes/<str:note_id>",update_note_quick),

    # =========================================================================
    # 🔥 HÀNG GIẢ LẬP LOCAL (SẼ XÓA SẠCH KHI DEPLOY LÊN SERVER THẬT TRÊN AWS S3)
    # Lý do: Phục vụ dev local độc lập khi chưa cấu hình kho lưu trữ đám mây AWS S3.
    # =========================================================================
    # =========================================================================
    # 🔥 HÀNG GIẢ LẬP LOCAL (SẼ XÓA SẠCH KHI DEPLOY LÊN SERVER THẬT TRÊN AWS S3)
    # Bọc lót cả trường hợp Frontend gọi có '/api/' hoặc không có '/api/' ở đầu
    # =========================================================================
    path("media/upload/<path:file_path>",         upload_local_file_view),
    path("media/<path:file_path>",                serve_local_file_view),
    path("api/media/upload/<path:file_path>",     upload_local_file_view), # Phòng hờ Frontend gọi đủ /api/
    path("api/media/<path:file_path>",            serve_local_file_view),  # Phòng hờ Frontend gọi đủ /api/

]