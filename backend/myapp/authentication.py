from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class StatusTokenJWTAuthentication(JWTAuthentication):
    """
    Kế thừa JWTAuthentication của simplejwt, thêm bước so sánh
    status_token trong JWT payload với giá trị hiện tại trong DB.

    Flow:
      1. Decode JWT (simplejwt xử lý)
      2. Lấy user từ DB theo user_id trong payload (simplejwt xử lý)
      3. So sánh status_token trong payload với users.status_token trong DB
         → Khác nhau: token đã bị vô hiệu hóa → 401
         → Khớp: cho qua bình thường
    """

    def get_user(self, validated_token):
        # Bước 1 + 2: simplejwt tự xử lý, trả về user object
        user = super().get_user(validated_token)

        # Bước 3: kiểm tra status_token
        token_status = validated_token.get('status_token', None)
        db_status    = user.status_token or ''

        if token_status is None or token_status != db_status:
            raise AuthenticationFailed(
                'Token đã bị vô hiệu hóa.',
                code='token_revoked',
            )

        return user