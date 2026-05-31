from django.urls import path
from .views.auth import *
from .views.settings import *
from .views.Notes_task import *
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
    path('auth/forgot-password/', forgot_password_view),
    path('auth/reset-password/',  reset_password_view),

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
]