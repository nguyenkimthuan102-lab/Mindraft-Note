# views/notification_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import uuid
from django.utils import timezone

from ..models import Notifications, Notes
from ..serializers import NotificationSerializer, CreateNotificationSerializer

VALID_TYPES = ['reminder', 'shared_note', 'note_updated', 'system']

# ─────────────────────────────────────────
# Helper: tạo notification (dùng nội bộ)
# ─────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_notification(user, notif_type, note=None, payload=None):
    return Notifications.objects.create(
        id=str(uuid.uuid4()),
        user=user,
        type=notif_type,
        note=note,
        payload=payload or {},
        is_read=0,       # ← đổi False → 0 (IntegerField)
        is_deleted=0,    # ← THÊM dòng này
        created_at=timezone.now()
    )

# ─────────────────────────────────────────
# GET  /notifications/       - Lấy danh sách
# POST /notifications/       - Tạo mới (admin/internal)
# ─────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def notification_list(request):

    if request.method == 'GET':
        # Filter tuỳ chọn: ?is_read=false&type=reminder
        queryset = Notifications.objects.filter(
            user=request.user
        ).order_by('-created_at')  # mới nhất trước

        # Filter theo is_read nếu có query param
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')

        # Filter theo type nếu có
        notif_type = request.query_params.get('type')
        if notif_type:
            queryset = queryset.filter(type=notif_type)

        serializer = NotificationSerializer(queryset, many=True)

        # Trả thêm unread_count tiện cho frontend hiển thị badge
        unread_count = Notifications.objects.filter(
            user=request.user,
            is_read=False
        ).count()

        return Response({
            'unread_count': unread_count,
            'results': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = CreateNotificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        notif_type = serializer.validated_data.get('type')
        if notif_type not in VALID_TYPES:
            return Response(
                {'error': f'type phải là một trong: {VALID_TYPES}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Nếu có note_id thì kiểm tra note tồn tại
        note = serializer.validated_data.get('note')
        if note:
            try:
                Notes.objects.get(id=note.id, is_deleted=False)
            except Notes.DoesNotExist:
                return Response({'error': 'Note không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

        notification = create_notification(
            user=request.user,
            notif_type=notif_type,
            note=note,
            payload=serializer.validated_data.get('payload', {})
        )

        return Response(
            NotificationSerializer(notification).data,
            status=status.HTTP_201_CREATED
        )


# ─────────────────────────────────────────
# GET    /notifications/<id>/       - Chi tiết
# DELETE /notifications/<id>/       - Xóa
# ─────────────────────────────────────────
@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def notification_detail(request, notification_id):
    try:
        notification = Notifications.objects.get(id=notification_id, user=request.user)
    except Notifications.DoesNotExist:
        return Response({'error': 'Notification không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        # Tự động đánh dấu đã đọc khi xem chi tiết
        if not notification.is_read:
            notification.is_read = True
            notification.save()

        return Response(NotificationSerializer(notification).data)

    elif request.method == 'DELETE':
        notification.delete()  # Hard delete vì notify không cần giữ lại
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────
# PUT /notifications/<id>/read      - Đánh dấu đã đọc
# ─────────────────────────────────────────
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def notification_mark_read(request, notification_id):
    try:
        notification = Notifications.objects.get(id=notification_id, user=request.user)
    except Notifications.DoesNotExist:
        return Response({'error': 'Notification không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

    notification.is_read = True
    notification.save()

    return Response(NotificationSerializer(notification).data)


# ─────────────────────────────────────────
# PUT /notifications/read-all/      - Đánh dấu tất cả đã đọc
# ─────────────────────────────────────────
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def notification_mark_all_read(request):
    updated = Notifications.objects.filter(
        user=request.user,
        is_read=False
    ).update(is_read=True)

    return Response({
        'message': f'Đã đánh dấu {updated} thông báo là đã đọc'
    }, status=status.HTTP_200_OK)