# views/reminder_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import uuid
from django.utils import timezone

from ..models import Reminders, Notes
from ..serializers import ReminderSerializer, CreateReminderSerializer, UpdateReminderSerializer

VALID_REPEAT_TYPES = ['none', 'daily', 'weekly', 'monthly']

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def reminder_list(request):
    """
    GET  /reminders/       - Lấy tất cả reminder của user
    POST /reminders/       - Tạo reminder mới
    """
    if request.method == 'GET':
        reminders = Reminders.objects.filter(
            user=request.user,
            is_deleted=False
        ).order_by('remind_at')

        serializer = ReminderSerializer(reminders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = CreateReminderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        note_id = serializer.validated_data.get('note').id
        repeat_type = serializer.validated_data.get('repeat_type', 'none')

        # Validate repeat_type
        if repeat_type not in VALID_REPEAT_TYPES:
            return Response(
                {'error': f'repeat_type phải là một trong: {VALID_REPEAT_TYPES}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Kiểm tra note có thuộc user không
        try:
            note = Notes.objects.get(id=note_id, user=request.user, is_deleted=False)
        except Notes.DoesNotExist:
            return Response({'error': 'Note không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra reminder đã tồn tại chưa (unique_together: note + user)
        if Reminders.objects.filter(note=note, user=request.user, is_deleted=False).exists():
            return Response(
                {'error': 'Reminder cho note này đã tồn tại'},
                status=status.HTTP_409_CONFLICT
            )

        reminder = Reminders.objects.create(
            id=str(uuid.uuid4()),
            note=note,
            user=request.user,
            remind_at=serializer.validated_data['remind_at'],
            repeat_type=repeat_type,
            is_notified=False,
            is_deleted=False,
            updated_at=timezone.now()
        )

        return Response(ReminderSerializer(reminder).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def reminder_detail(request, reminder_id):
    """
    GET    /reminders/<id>/  - Lấy chi tiết reminder
    PUT    /reminders/<id>/  - Cập nhật reminder
    DELETE /reminders/<id>/  - Xóa CỨNG (Hard Delete) hoàn toàn khỏi Database
    """
    try:
        # Tìm bản ghi của chính user đó 
        reminder = Reminders.objects.get(id=reminder_id, user=request.user)
    except Reminders.DoesNotExist:
        return Response({'error': 'Reminder không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ReminderSerializer(reminder).data)

    elif request.method == 'PUT':
        serializer = UpdateReminderSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        repeat_type = serializer.validated_data.get('repeat_type')
        if repeat_type and repeat_type not in VALID_REPEAT_TYPES:
            return Response(
                {'error': f'repeat_type phải là một trong: {VALID_REPEAT_TYPES}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        for field, value in serializer.validated_data.items():
            setattr(reminder, field, value)

        reminder.updated_at = timezone.now()
        reminder.save()

        return Response(ReminderSerializer(reminder).data)

    # 🔥 ĐOẠN ĐÃ SỬA: Thực hiện Xóa cứng vĩnh viễn dữ liệu khỏi bảng
    elif request.method == 'DELETE':
        reminder.delete() # 👈 Xóa hẳn bản ghi bằng ORM .delete() thay vì gán cờ is_deleted = True
        return Response(
            {"message": "Đã xóa vĩnh viễn nhắc nhở khỏi hệ thống"}, 
            status=status.HTTP_200_OK
        )