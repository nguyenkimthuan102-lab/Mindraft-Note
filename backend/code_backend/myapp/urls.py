# myapp/urls.py
# ─────────────────────────────────────────────────────────────────────────────
 
from django.urls import path
from .views import (
    home, note_list, note_detail,
    auth_register,
    auth_verify_otp,
    auth_login,
    auth_refresh,
    auth_logout,
    auth_forgot_password,
    auth_reset_password,
)
 
urlpatterns = [
    # ── Trang chủ ─────────────────────────────────────────────────────────
    path('', home),
 
    # ── Notes ─────────────────────────────────────────────────────────────
    path('api/notes/',           note_list),
    path('api/notes/<int:pk>/',  note_detail),
 
    # ── Authentication ────────────────────────────────────────────────────
    path('api/auth/register/',        auth_register),
    path('api/auth/verify-otp/',      auth_verify_otp),      # otp.tsx → /auth/verify-otp
    path('api/auth/login/',           auth_login),
    path('api/auth/refresh/',         auth_refresh),          # api.ts → /auth/refresh/
    path('api/auth/logout/',          auth_logout),
    path('api/auth/forgot-password/', auth_forgot_password),
    path('api/auth/reset-password/',  auth_reset_password),
]