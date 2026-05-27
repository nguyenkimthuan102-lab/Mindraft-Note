# views/todo_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import uuid
from django.utils import timezone

from ..models import TodoItems, Notes
from ..serializers import (
    TodoItemSerializer,
    CreateTodoItemSerializer,
    UpdateTodoItemSerializer
)

VALID_REPEAT_TYPES = ['none', 'daily', 'weekly', 'monthly']


# ─────────────────────────────────────────
# GET  /notes/<note_id>/todos/     - Lấy danh sách todo của note
# POST /notes/<note_id>/todos/     - Tạo todo mới
# ─────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def todo_list(request, note_id):

    # Kiểm tra note tồn tại và thuộc user
    try:
        note = Notes.objects.get(id=note_id, user=request.user, is_deleted=False)
    except Notes.DoesNotExist:
        return Response({'error': 'Note không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        # Chỉ lấy todo cha (parent=None), children sẽ được nest bên trong
        todos = TodoItems.objects.filter(
            note=note,
            parent=None         # chỉ lấy root items
        ).order_by('position')

        # Filter theo is_completed nếu có: ?is_completed=0 hoặc 1
        is_completed = request.query_params.get('is_completed')
        if is_completed is not None:
            todos = todos.filter(is_completed=int(is_completed))

        serializer = TodoItemSerializer(todos, many=True)

        # Thống kê nhanh cho frontend
        total = TodoItems.objects.filter(note=note).count()
        completed = TodoItems.objects.filter(note=note, is_completed=1).count()

        return Response({
            'stats': {
                'total': total,
                'completed': completed,
                'remaining': total - completed
            },
            'results': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = CreateTodoItemSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Validate repeat_type
        repeat_type = serializer.validated_data.get('repeat_type', 'none')
        if repeat_type not in VALID_REPEAT_TYPES:
            return Response(
                {'error': f'repeat_type phải là một trong: {VALID_REPEAT_TYPES}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Nếu có parent thì kiểm tra parent thuộc note này
        parent = serializer.validated_data.get('parent')
        if parent:
            try:
                TodoItems.objects.get(id=parent.id, note=note)
            except TodoItems.DoesNotExist:
                return Response(
                    {'error': 'Parent todo không tồn tại trong note này'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        todo = TodoItems.objects.create(
            id=str(uuid.uuid4()),
            note=note,
            parent=parent,
            title=serializer.validated_data.get('title', ''),
            content=serializer.validated_data.get('content', ''),
            is_completed=0,         # mặc định chưa hoàn thành
            position=serializer.validated_data.get('position', '0'),
            remind_at=serializer.validated_data.get('remind_at'),
            repeat_type=repeat_type,
            is_notified=0,
            created_at=timezone.now(),
            updated_at=timezone.now()
        )

        return Response(TodoItemSerializer(todo).data, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────
# GET    /notes/<note_id>/todos/<id>/   - Chi tiết
# PUT    /notes/<note_id>/todos/<id>/   - Cập nhật
# DELETE /notes/<note_id>/todos/<id>/   - Xóa
# ─────────────────────────────────────────
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def todo_detail(request, note_id, todo_id):

    # Kiểm tra note
    try:
        note = Notes.objects.get(id=note_id, user=request.user, is_deleted=False)
    except Notes.DoesNotExist:
        return Response({'error': 'Note không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

    # Kiểm tra todo
    try:
        todo = TodoItems.objects.get(id=todo_id, note=note)
    except TodoItems.DoesNotExist:
        return Response({'error': 'Todo không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(TodoItemSerializer(todo).data)

    elif request.method == 'PUT':
        serializer = UpdateTodoItemSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        repeat_type = serializer.validated_data.get('repeat_type')
        if repeat_type and repeat_type not in VALID_REPEAT_TYPES:
            return Response(
                {'error': f'repeat_type phải là một trong: {VALID_REPEAT_TYPES}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        for field, value in serializer.validated_data.items():
            setattr(todo, field, value)

        todo.updated_at = timezone.now()
        todo.save()

        return Response(TodoItemSerializer(todo).data)

    elif request.method == 'DELETE':
        # Xóa cả children trước khi xóa parent
        TodoItems.objects.filter(parent=todo).delete()
        todo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────
# PUT /notes/<note_id>/todos/<id>/toggle/  - Toggle hoàn thành
# ─────────────────────────────────────────
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def todo_toggle(request, note_id, todo_id):
    try:
        note = Notes.objects.get(id=note_id, user=request.user, is_deleted=False)
        todo = TodoItems.objects.get(id=todo_id, note=note)
    except (Notes.DoesNotExist, TodoItems.DoesNotExist):
        return Response({'error': 'Không tìm thấy'}, status=status.HTTP_404_NOT_FOUND)

    # Toggle: 0 → 1, 1 → 0
    todo.is_completed = 1 if todo.is_completed == 0 else 0
    todo.updated_at = timezone.now()
    todo.save()

    # Nếu là parent → toggle toàn bộ children theo
    TodoItems.objects.filter(parent=todo).update(
        is_completed=todo.is_completed,
        updated_at=timezone.now()
    )

    return Response(TodoItemSerializer(todo).data)