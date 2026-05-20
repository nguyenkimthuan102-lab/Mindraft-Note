from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import UserSettings
from ..serializers import UserSettingsSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_my_settings(request):

    settings_obj, created = UserSettings.objects.get_or_create(
        user=request.user,
        defaults={
            "theme": "system",
            "notifications_enabled": 1,
            "notify_reminder": 1,
            "notify_collaboration": 1,
            "default_note_view": "GRID",
            "sort_by": "updated_at",
            "updated_at": timezone.now(),
        }
    )

    serializer = UserSettingsSerializer(settings_obj)

    return Response({
        "data": serializer.data
    })