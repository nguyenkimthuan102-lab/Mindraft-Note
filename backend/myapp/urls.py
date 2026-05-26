from django.urls import path
from .views.auth import *
from .views.settings import *
from .views.Notes_task import *

urlpatterns = [
    path('auth/register/', register_view),
    path('auth/verify-otp/', verify_otp_view),
    path('auth/resend-otp/', resend_otp_view),

    path('auth/google/', google_login_view),
    path('auth/refresh/', refresh_token_view, name='token_refresh'),
    path('auth/login/',           login_view),
    path('auth/forgot-password/', forgot_password_view),
    path('auth/reset-password/',  reset_password_view),

    path( "users/me/settings",get_my_settings),

    path("tags/",get_tags),
    path("notes/",notes_collection_view),

    path("notes/<str:note_id>/pin",toggle_pin_note),
    path("notes/<str:note_id>/archive",toggle_archive_note),
    path("notes/<str:note_id>/trash",trash_note),
    path("notes/<str:note_id>/permanent-delete", permanent_delete_note),
    
    path("notes/<str:note_id>",update_note_quick),

]