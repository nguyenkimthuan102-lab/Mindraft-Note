from django.urls import path

# Import toàn bộ từ các file views gốc
from .views.auth import *
from .views.settings import *
from .views.Notes_task import *
<<<<<<< HEAD
from .views.Reminders import *
from .views.Notify import *
from .views.Todoitems import *

# Import cụ thể từ profile view (ở file 1)
from .views.profile import (
    user_profile_view,
    change_password_view,
    presigned_url_view,
    upload_local_file_view,
    serve_local_file_view
)

urlpatterns = [
    # ==========================================
    # AUTHENTICATION (Xác thực)
    # ==========================================
    path('auth/register/', register_view),
    path('auth/verify-otp/', verify_otp_view),
    path('auth/resend-otp/', resend_otp_view),
    path('auth/google/', google_login_view),
    path('auth/refresh/', refresh_token_view, name='token_refresh'),
    path('auth/login/', login_view),
=======
from .views.labels import (        # THÊM MỚI
    tags_collection_view,
    tag_detail_view,
    note_tags_collection_view,
    note_tag_detail_view,
)

urlpatterns = [
    # ── AUTH ──────────────────────────────────────────────────────────────────
    path('auth/register/',        register_view),
    path('auth/verify-otp/',      verify_otp_view),
    path('auth/resend-otp/',      resend_otp_view),
    path('auth/google/',          google_login_view),
    path('auth/refresh/',         refresh_token_view, name='token_refresh'),
    path('auth/login/',           login_view),
>>>>>>> 20e9488 (feat(backend): tích hợp API xử lý nhãn và cập nhật logic liên kết ghi chú)
    path('auth/forgot-password/', forgot_password_view),
    path('auth/reset-password/', reset_password_view),
    path('auth/logout/', logout_view),

<<<<<<< HEAD
    # ==========================================
    # USERS, PROFILE & SETTINGS (Người dùng & Cài đặt)
    # ==========================================
    path("users/me", user_profile_view, name="user-profile"),
    path("users/me/password", change_password_view, name="change-password"),
    path('users/me/settings', get_my_settings),

    # ==========================================
    # NOTES (Ghi chú)
    # ==========================================
    path('notes/', notes_collection_view),
    path('notes/<str:note_id>', update_note_quick),
    path('notes/<str:note_id>/pin', toggle_pin_note),
    path('notes/<str:note_id>/archive', toggle_archive_note),
    path('notes/<str:note_id>/trash', trash_note),
    path('notes/<str:note_id>/toggle-remind/', toggle_reminded_note, name='toggle-remind-note'),
    path("notes/<str:note_id>/permanent-delete", permanent_delete_note),

    # ==========================================
    # MEDIA (Hình ảnh & File)
    # ==========================================
    path('notes/<str:note_id>/media', upload_note_image, name='upload_note_image'),
    path('notes/<str:note_id>/media/list/', get_note_media, name='get_note_media'),    
    path('notes/media/<str:media_id>/delete/', delete_media, name='delete_media'),

    # ==========================================
    # TAGS (Nhãn)
    # ==========================================
    path('tags/', create_tag, name='create_tag'),
    path('tags/list/', get_tags, name='get_tags'),
    path('tags/<str:tag_id>/', update_tag, name='update_tag'),
    path('tags/<str:tag_id>/delete/', delete_tag, name='delete_tag'),
    path('notes/<str:note_id>/tags/', add_tag_to_note, name='add_tag_to_note'),
    path('notes/<str:note_id>/tags/list/', get_note_tags),
    path('notes/<str:note_id>/tags/<str:tag_id>/', remove_tag_from_note, name='remove_tag_from_note'),

    # ==========================================
    # REMINDERS (Nhắc nhở)
    # ==========================================
    path('reminders/', reminder_list, name='reminder-list'),
    path('reminders/<str:reminder_id>/', reminder_detail, name='reminder-detail'),

    # ==========================================
    # NOTIFICATIONS (Thông báo)
    # ==========================================
    path('notifications/', notification_list, name='notification-list'),
    path('notifications/read-all/', notification_mark_all_read, name='notification-read-all'),
    path('notifications/<str:notification_id>/', notification_detail, name='notification-detail'),
    path('notifications/<str:notification_id>/read/', notification_mark_read, name='notification-mark-read'),

    # ==========================================
    # TODO ITEMS (Công việc cần làm)
    # ==========================================
    path('notes/<str:note_id>/todos/', todo_list, name='todo-list'),
    path('notes/<str:note_id>/todos/clear-completed/', todo_clear_completed, name='todo-clear-completed'),
    path('notes/<str:note_id>/todos/<str:todo_id>/', todo_detail, name='todo-detail'),
    path('notes/<str:note_id>/todos/<str:todo_id>/toggle/', todo_toggle, name='todo-toggle'),
=======
    # ── SETTINGS ───────────────────────────────────────────────────────────────
    path('users/me/settings',     get_my_settings),

    # ── NOTES ──────────────────────────────────────────────────────────────────
    path('notes/',                        notes_collection_view),     # GET, POST
    path('notes/<str:note_id>/pin',       toggle_pin_note),           # PATCH
    path('notes/<str:note_id>/archive',   toggle_archive_note),       # PATCH
    path('notes/<str:note_id>/trash',     trash_note),                # PATCH
    path('notes/<str:note_id>',           update_note_quick),         # PATCH

    # ── NOTE TAGS (5.1, 5.2) ───────────────────────────────────────────────────
    path('notes/<str:note_id>/tags/',              note_tags_collection_view),   # POST
    path('notes/<str:note_id>/tags/<str:tag_id>/', note_tag_detail_view),        # DELETE

    # ── TAGS (4.1, 4.2, 4.3, 4.4) ─────────────────────────────────────────────
    path('tags/',              tags_collection_view),   # GET, POST
    path('tags/<str:tag_id>/', tag_detail_view),        # PATCH, DELETE
>>>>>>> 20e9488 (feat(backend): tích hợp API xử lý nhãn và cập nhật logic liên kết ghi chú)
]