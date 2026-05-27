from django.urls import path

from .views.auth import *
from .views.settings import *
from .views.Notes_task import *
from .views.Reminders import *
from .views.Notify import *
from .views.Todoitems import *
from .views.tag_views import *
from .views.media_views import *

urlpatterns = [

    # =========================
    # AUTH
    # =========================
    path('auth/register/', register_view),
    path('auth/verify-otp/', verify_otp_view),
    path('auth/resend-otp/', resend_otp_view),

    path('auth/google/', google_login_view),
    path('auth/refresh/', refresh_token_view, name='token_refresh'),
    path('auth/login/', login_view),
    path('auth/forgot-password/', forgot_password_view),
    path('auth/reset-password/', reset_password_view),

    # =========================
    # USER SETTINGS
    # =========================
    path('users/me/settings', get_my_settings),

    # =========================
    # NOTES
    # =========================
    path('notes/', notes_collection_view),

    path('notes/<str:note_id>', update_note_quick),

    path('notes/<str:note_id>/pin', toggle_pin_note),
    path('notes/<str:note_id>/archive', toggle_archive_note),
    path('notes/<str:note_id>/trash', trash_note),

    # =========================
    # MEDIA
    # =========================
    path(
        'notes/<str:note_id>/media',
        upload_note_image,
        name='upload_note_image'
    ),

    # =========================
    # TAGS
    # =========================

    # tạo tag
    path(
        'tags/',
        create_tag,
        name='create_tag'
    ),

    # lấy danh sách tag
    path(
        'tags/list/',
        get_tags,
        name='get_tags'
    ),
    path(
    "notes/<str:note_id>/tags/list/",
    get_note_tags
)
    # sửa tag
    path(
        'tags/<str:tag_id>/',
        update_tag,
        name='update_tag'
    ),

    # xoá tag
    path(
        'tags/<str:tag_id>/delete/',
        delete_tag,
        name='delete_tag'
    ),

    # gắn tag vào note
    path(
        'notes/<str:note_id>/tags/',
        add_tag_to_note,
        name='add_tag_to_note'
    ),

    # bỏ tag khỏi note
    path(
        'notes/<str:note_id>/tags/<str:tag_id>/',
        remove_tag_from_note,
        name='remove_tag_from_note'
    ),

    # =========================
    # REMINDERS
    # =========================
    path(
        'reminders/',
        reminder_list,
        name='reminder-list'
    ),

    path(
        'reminders/<str:reminder_id>/',
        reminder_detail,
        name='reminder-detail'
    ),

    # =========================
    # NOTIFICATIONS
    # =========================
    path(
        'notifications/',
        notification_list,
        name='notification-list'
    ),

    path(
        'notifications/read-all/',
        notification_mark_all_read,
        name='notification-read-all'
    ),

    path(
        'notifications/<str:notification_id>/',
        notification_detail,
        name='notification-detail'
    ),

    path(
        'notifications/<str:notification_id>/read/',
        notification_mark_read,
        name='notification-mark-read'
    ),

    # =========================
    # TODO ITEMS
    # =========================
    path(
        'notes/<str:note_id>/todos/',
        todo_list,
        name='todo-list'
    ),

    path(
        'notes/<str:note_id>/todos/<str:todo_id>/',
        todo_detail,
        name='todo-detail'
    ),

    path(
        'notes/<str:note_id>/todos/<str:todo_id>/toggle/',
        todo_toggle,
        name='todo-toggle'
    ),
]