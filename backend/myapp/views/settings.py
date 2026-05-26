from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..models import UserSettings
from ..serializers import UserSettingsSerializer

# ─── Các giá trị hợp lệ theo API Contract ──────────────────────────────────────
VALID_THEMES     = {"light", "dark", "system"}
VALID_VIEWS      = {"GRID", "LIST"}           # Backend luôn lưu CHỮ HOA
VALID_SORT_BY    = {"updated_at", "created_at", "custom"}
VALID_INT_BOOLS  = {0, 1}                     # Các field boolean lưu dạng integer


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def get_my_settings(request):
    """
    GET  /users/me/settings  — Trả về cài đặt hiện tại của user.
    PATCH /users/me/settings — Cập nhật một hoặc nhiều field (partial update).

    Quy ước mapping (theo API Contract mục 2.4 & 2.5):
      - theme:                 "light" | "dark" | "system"
      - default_note_view:     "GRID"  | "LIST"  (luôn CHỮ HOA)
      - sort_by:               "updated_at" | "created_at" | "custom"
      - notifications_enabled: 0 | 1
      - notify_reminder:       0 | 1
      - notify_collaboration:  0 | 1
    """

    # Lấy hoặc khởi tạo settings với giá trị mặc định hợp lý
    settings_obj, _ = UserSettings.objects.get_or_create(
        user=request.user,
        defaults={
            "theme":                  "light",
            "notifications_enabled":  1,
            "notify_reminder":        1,
            "notify_collaboration":   1,
            "default_note_view":      "GRID",
            "sort_by":                "updated_at",
            "updated_at":             timezone.now(),
        },
    )

    # ── GET ────────────────────────────────────────────────────────────────────
    if request.method == "GET":
        serializer = UserSettingsSerializer(settings_obj)
        return Response({"data": serializer.data})

    # ── PATCH ──────────────────────────────────────────────────────────────────
    data = request.data

    # Validation thủ công để trả lỗi rõ ràng trước khi vào serializer
    validation_errors = {}

    if "theme" in data:
        if data["theme"] not in VALID_THEMES:
            validation_errors["theme"] = (
                f"Giá trị không hợp lệ. Chấp nhận: {sorted(VALID_THEMES)}"
            )

    if "default_note_view" in data:
        # Chuẩn hoá: client có thể gửi chữ thường ("grid") → tự convert lên HOA
        data = dict(data)                       # QueryDict → dict thông thường
        data["default_note_view"] = str(data["default_note_view"]).upper()
        if data["default_note_view"] not in VALID_VIEWS:
            validation_errors["default_note_view"] = (
                f"Giá trị không hợp lệ. Chấp nhận: {sorted(VALID_VIEWS)}"
            )

    if "sort_by" in data:
        if data["sort_by"] not in VALID_SORT_BY:
            validation_errors["sort_by"] = (
                f"Giá trị không hợp lệ. Chấp nhận: {sorted(VALID_SORT_BY)}"
            )

    for bool_field in ("notifications_enabled", "notify_reminder", "notify_collaboration"):
        if bool_field in data:
            try:
                val = int(data[bool_field])
            except (TypeError, ValueError):
                val = -1
            if val not in VALID_INT_BOOLS:
                validation_errors[bool_field] = "Giá trị không hợp lệ. Chấp nhận: 0 hoặc 1"

    if validation_errors:
        return Response(
            {"error": {"code": "INVALID_FORMAT", "message": validation_errors}},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    # partial=True: chỉ cập nhật những field được gửi lên, bỏ qua field còn lại
    serializer = UserSettingsSerializer(
        settings_obj,
        data=data,
        partial=True,
    )
    serializer.is_valid(raise_exception=True)

    # Tự ghi updated_at — frontend không cần gửi
    serializer.save(updated_at=timezone.now())

    return Response({"data": serializer.data})