# myapp/models.py
# Sau khi sửa: python manage.py makemigrations && python manage.py migrate
# ─────────────────────────────────────────────────────────────────────────────
 
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import random
import string
 
 
# ─────────────────────────────────────────────────────────────────────────────
# NOTE
# ─────────────────────────────────────────────────────────────────────────────
 
class Note(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    title      = models.CharField(max_length=255)
    content    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
 
    def __str__(self):
        return self.title
 
 
# ─────────────────────────────────────────────────────────────────────────────
# OTP CODE
# ─────────────────────────────────────────────────────────────────────────────
 
OTP_PURPOSE_CHOICES = [
    ('verify_email',   'Xác thực Email'),
    ('reset_password', 'Đặt lại mật khẩu'),
]
 
 
class OTPCode(models.Model):
    OTP_EXPIRE_MINUTES = 10
 
    email      = models.EmailField()
    code       = models.CharField(max_length=6)
    purpose    = models.CharField(max_length=20, choices=OTP_PURPOSE_CHOICES)
    is_used    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        ordering = ['-created_at']
 
    def __str__(self):
        return f"{self.email} – {self.purpose} – {self.code}"
 
    @classmethod
    def generate(cls, email: str, purpose: str) -> "OTPCode":
        """Xóa OTP cũ chưa dùng, tạo OTP mới."""
        cls.objects.filter(email=email, purpose=purpose, is_used=False).delete()
        code = ''.join(random.choices(string.digits, k=6))
        return cls.objects.create(email=email, code=code, purpose=purpose)
 
    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.created_at + timedelta(minutes=self.OTP_EXPIRE_MINUTES)
 
    def verify(self, input_code: str) -> bool:
        """True nếu OTP đúng, chưa dùng, chưa hết hạn. Đánh dấu is_used=True sau khi pass."""
        if self.is_used or self.is_expired:
            return False
        if self.code != input_code:
            return False
        self.is_used = True
        self.save(update_fields=['is_used'])
        return True