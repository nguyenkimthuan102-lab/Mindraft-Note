from django.contrib.auth import get_user_model
User = get_user_model()
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Notes
from .serializers import NoteSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination
from .models import TodoItems,Tags, NoteCollaborators
from django.db.models import Q

class CustomPagination(PageNumberPagination):
    page_size = 10
    
#  REGISTER
@api_view(['POST'])
def register_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "Thiếu dữ liệu"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username đã tồn tại"}, status=400)

    user = User.objects.create_user(username=username, password=password)

    #  tạo token luôn
    refresh = RefreshToken.for_user(user)

    return Response({
        "message": "Đăng ký thành công",
        "access": str(refresh.access_token),
        "refresh": str(refresh)
    }, status=201)


#  LOGIN
@api_view(['POST'])
def login_view(request):
    from django.contrib.auth import authenticate

    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({"error": "Sai tài khoản hoặc mật khẩu"}, status=400)

    refresh = RefreshToken.for_user(user)

    return Response({
        "message": "Login thành công",
        "access": str(refresh.access_token),
        "refresh": str(refresh)
    })

@api_view(['POST'])
def logout_view(request):
    return Response({
        "message": "Logout thành công (client tự xoá token)"
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    return Response({
        "username": request.user.username
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def note_create(request):
    serializer = NoteSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=201)

    return Response(serializer.errors, status=400)


# GET ALL (chỉ lấy note của user đó)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def note_list(request):
    notes = Notes.objects.filter(user=request.user, is_deleted=False)

    paginator = CustomPagination()
    result_page = paginator.paginate_queryset(notes, request)

    serializer = NoteSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

#  GET DETAIL
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def note_detail(request, id):
    try:
        note = Notes.objects.get(id=id, user=request.user)
    except Notes.DoesNotExist:
        return Response({"error": "Không tìm thấy note"}, status=404)

    serializer = NoteSerializer(note)
    return Response(serializer.data)


#  UPDATE
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def note_update(request, id):
    try:
        note = Notes.objects.get(id=id, user=request.user)
    except Notes.DoesNotExist:
        return Response({"error": "Không tìm thấy note"}, status=404)

    serializer = NoteSerializer(note, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=400)


#  DELETE (soft delete)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def note_delete(request, id):
    try:
        note = Notes.objects.get(id=id, user=request.user)
    except Notes.DoesNotExist:
        return Response({"error": "Không tìm thấy note"}, status=404)

    note.is_deleted = True
    note.save()

    return Response({"message": "Đã xoá note"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_notes(request):
    query = request.GET.get('q', '')

    notes = Notes.objects.filter(
        Q(title__icontains=query) | Q(content__icontains=query),
        user=request.user,
        is_deleted=False
    )

    serializer = NoteSerializer(notes, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pinned_notes(request):
    notes = Notes.objects.filter(user=request.user, is_pinned=True, is_deleted=False)
    return Response(NoteSerializer(notes, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def archived_notes(request):
    notes = Notes.objects.filter(user=request.user, is_archived=True)
    return Response(NoteSerializer(notes, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trash_notes(request):
    notes = Notes.objects.filter(user=request.user, is_deleted=True)
    return Response(NoteSerializer(notes, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def label_create(request):
    name = request.data.get("name")

    label = Tags.objects.create(user=request.user, name=name)
    return Response({"id": label.id, "name": label.name})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def label_list(request):
    labels = Tags.objects.filter(user=request.user)
    return Response([{"id": l.id, "name": l.name} for l in labels])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checklist_create(request, note_id):
    content = request.data.get("content")

    try:
        note = Notes.objects.get(id=note_id, user=request.user)
    except Notes.DoesNotExist:
        return Response({"error": "Không có quyền hoặc không tồn tại"}, status=404)

    item = TodoItems.objects.create(
        note=note,
        content=content
    )

    return Response({
        "id": item.id,
        "content": item.content,
        "is_completed": item.is_completed
    })

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def checklist_toggle(request, item_id):
    try:
        item = TodoItems.objects.get(id=item_id)
    except TodoItems.DoesNotExist:
        return Response({"error": "Không tìm thấy item"}, status=404)

    item.is_completed = not item.is_completed
    item.save()

    return Response({"message": "Đã cập nhật"})

def has_permission(user, note):
    return note.user == user or note.collaborators.filter(user=user).exists()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_collaborator(request, note_id):
    user_id = request.data.get("user_id")

    try:
        note = Notes.objects.get(id=note_id, user=request.user)
    except Notes.DoesNotExist:
        return Response({"error": "Không tìm thấy note"}, status=404)

    NoteCollaborators.objects.get_or_create(note=note, user_id=user_id)

    return Response({"message": "Đã thêm collaborator"})