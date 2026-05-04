# myapp/serializers.py
# ─────────────────────────────────────────────────────────────────────────────
 
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Note
 
 
# ─────────────────────────────────────────────────────────────────────────────
# NOTE (giữ nguyên)
# ─────────────────────────────────────────────────────────────────────────────
 
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Note
        fields = ['id', 'title', 'content', 'created_at']
 
 
# ─────────────────────────────────────────────────────────────────────────────
# REGISTER
# Frontend gửi: { "email", "password", "confirmPassword", "nickname" }
# → username tự sinh từ email
# → nickname lưu vào first_name (trường có sẵn của Django User)
# ─────────────────────────────────────────────────────────────────────────────
 
class RegisterSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    nickname = serializers.CharField(max_length=150)
 
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email đã được đăng ký.")
        return value
 
    def create(self, validated_data):
        # Tự sinh username từ local-part của email, tránh trùng
        base     = validated_data['email'].split('@')[0]
        username = base
        counter  = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1
 
        user = User.objects.create_user(
            username   = username,
            email      = validated_data['email'],
            password   = validated_data['password'],
            first_name = validated_data['nickname'],    # nickname → first_name
        )
        user.is_active = False      # Chờ xác thực OTP
        user.save()
        return user
 
 
# ─────────────────────────────────────────────────────────────────────────────
# VERIFY OTP  (dùng chung register + forgot-password)
# Frontend gửi: { "email", "code", "mode" }
# ─────────────────────────────────────────────────────────────────────────────
 
class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code  = serializers.CharField(max_length=6)     # frontend field tên là "code"
 
 
# ─────────────────────────────────────────────────────────────────────────────
# LOGIN
# Frontend gửi: { "email", "password" }
# ─────────────────────────────────────────────────────────────────────────────
 
class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)
 
 
# ─────────────────────────────────────────────────────────────────────────────
# FORGOT PASSWORD
# Frontend gửi: { "email" }
# ─────────────────────────────────────────────────────────────────────────────
 
class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
 
 
# ─────────────────────────────────────────────────────────────────────────────
# RESET PASSWORD
# Frontend gửi: { "email", "password" }
# email dùng để tra cache xem bước verify-otp đã pass chưa
# ─────────────────────────────────────────────────────────────────────────────
 
class ResetPasswordSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)