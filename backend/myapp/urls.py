from django.urls import path
from .views.auth import *
from . import views

urlpatterns = [
    path('auth/register/', register_view),
    path('auth/verify-otp/', verify_otp_view),
    path('auth/resend-otp/', resend_otp_view),

    path('auth/google/', google_login_view),
]