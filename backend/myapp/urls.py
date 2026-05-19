from django.urls import path
from .views.auth import *
from . import views

urlpatterns = [
    path('auth/register/', register_view),
    path('auth/verify-otp/', verify_otp_view),
    path('auth/resend-otp/', resend_otp_view),
    path('auth/refresh/', refresh_token_view),

    path('auth/google/', google_login_view),
    path('auth/login/',           login_view),
    path('auth/forgot-password/', forgot_password_view),
    path('auth/reset-password/',  reset_password_view),
]