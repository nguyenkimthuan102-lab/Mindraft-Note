from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

import uuid

from django.utils import timezone

from rest_framework import status
from ..models import Tags, Notes

from ..serializers import TagSerializer, NoteSerializer, CreateNoteSerializer, UpdateNoteSerializer

def handle_get_notes(request):
    view_type = request.GET.get("view", "active")

    notes = Notes.objects.none()

    # =========================
    # ACTIVE NOTES
    # =========================
    if view_type == "active":

        notes = Notes.objects.filter(
            user=request.user,
            is_deleted=0,
            is_archived=0,
            is_trashed=0
        )

    # =========================
    # ARCHIVED NOTES
    # =========================
    elif view_type == "archived":

        notes = Notes.objects.filter(
            user=request.user,
            is_deleted=0,
            is_archived=1,
            is_trashed=0
        )

    # =========================
    # TRASH NOTES
    # =========================
    elif view_type == "trash":

        notes = Notes.objects.filter(
            user=request.user,
            is_deleted=0,
            is_trashed=1
        )

    # =========================
    # ALL NOTES
    # =========================
    elif view_type == "all":

        notes = Notes.objects.filter(
            user=request.user,
            is_deleted=0
        )

    # =========================
    # SORT
    # =========================

    sort_by = request.GET.get("sort_by", "updated_at")

    if sort_by == "created_at":

        notes = notes.order_by("-created_at")

    elif sort_by == "position":

        notes = notes.order_by("position")

    else:

        notes = notes.order_by("-server_updated_at")

    # =========================
    # SERIALIZE
    # =========================

    serializer = NoteSerializer(notes, many=True)

    return Response({
        "data": serializer.data
    })

def handle_create_note(request):
    serializer = CreateNoteSerializer(data=request.data)
    if not serializer.is_valid():
            return Response({
                "error": {
                    "code": "INVALID_DATA",
                    "message": "Dữ liệu gửi lên không hợp lệ."
                }
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    note_type = serializer.validated_data.get("type")

    serializer.is_valid(raise_exception=True)

    now = timezone.now()

    # CREATE NOTE
    note = Notes.objects.create(
        id=str(uuid.uuid4()),

        user=request.user,

        title=serializer.validated_data.get("title", ""),

        content=serializer.validated_data.get("content", []), # Sử dụng validated_data của serializer để validate, 
        #tránh cho phép dữ liệu rác vào database

        content_text=serializer.validated_data.get("content_text", ""),

        type=note_type,

        color=serializer.validated_data.get("color", "default"),

        is_pinned=0,

        is_archived=0,

        is_trashed=0,

        is_deleted=0,

        position=serializer.validated_data.get("position", "a0"),

        created_at=now,

        server_updated_at=now,

        client_updated_at=serializer.validated_data.get("client_updated_at", now),
    )

    response_serializer = NoteSerializer(note)

    return Response(
        {
            "data": response_serializer.data
        },
        status=status.HTTP_201_CREATED
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_tags(request):

    tags = Tags.objects.filter(
        owner=request.user,
        is_deleted=0
    ).order_by("name")

    serializer = TagSerializer(tags, many=True)

    return Response({
        "data": serializer.data
    })


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def notes_collection_view(request):
    if request.method == "GET":
        return handle_get_notes(request)
    elif request.method == "POST":
        return handle_create_note(request)



@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def toggle_pin_note(request, note_id):

    try:

        note = Notes.objects.get(
            id=note_id,
            user=request.user,
            is_deleted=0
        )

    except Notes.DoesNotExist:

        return Response(
            {
                "error": "Note not found"
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # TOGGLE PIN
    if note.is_pinned == 1:

        note.is_pinned = 0

    else:

        note.is_pinned = 1

    note.server_updated_at = timezone.now()

    note.save()

    serializer = NoteSerializer(note)

    return Response({
        "data": serializer.data
    })

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def toggle_archive_note(request, note_id):

    try:

        note = Notes.objects.get(
            id=note_id,
            user=request.user,
            is_deleted=0
        )

    except Notes.DoesNotExist:

        return Response(
            {
                "error": "Note not found"
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # TOGGLE ARCHIVE
    if note.is_archived == 1:

        note.is_archived = 0

    else:

        note.is_archived = 1

    note.server_updated_at = timezone.now()

    note.save()

    serializer = NoteSerializer(note)

    return Response({
        "data": serializer.data
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_note_quick(request, note_id):

    try:

        note = Notes.objects.get(
            id=note_id,
            user=request.user,
            is_trashed=0,
            is_deleted=0
        )

    except Notes.DoesNotExist:

        return Response(
            {
                "error": "Note not found"
            },
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = UpdateNoteSerializer(
        note,
        data=request.data,
        partial=True
    )

    serializer.is_valid(raise_exception=True)

    # UPDATE FIELDS
    updated_note = serializer.save(
        server_updated_at=timezone.now()
    )

    response_serializer = NoteSerializer(updated_note)

    return Response({
        "data": response_serializer.data
    })

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def trash_note(request, note_id):

    try:

        note = Notes.objects.get(
            id=note_id,
            user=request.user,
            is_deleted=0
        )

    except Notes.DoesNotExist:

        return Response(
            {
                "error": "Note not found"
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # MOVE TO TRASH
    note.is_trashed = 1

    note.is_pinned = 0 
    # OPTIONAL:
    # thường archive sẽ bị bỏ khi vào trash
    note.is_archived = 0

    note.trashed_at = timezone.now()

    note.server_updated_at = timezone.now()

    note.save()

    serializer = NoteSerializer(note)

    return Response({
        "data": serializer.data
    })

# @api_view(["PATCH"])
# @permission_classes([IsAuthenticated])
# def note_detail(request, pk):
#     try:
#         # Ngăn không cho sửa note đã vào thùng rác
#         note = Notes.objects.get(id=pk, user=request.user, is_trashed=0, is_deleted=0)
#     except Notes.DoesNotExist:
#         return Response({"error": "Không tìm thấy ghi chú hoặc ghi chú đã bị xóa/vào thùng rác"}, status=404)

#     serializer = CreateNoteSerializer(note, data=request.data, partial=True)
#     if serializer.is_valid():
#         # Cập nhật thời gian tại đây
#         serializer.save(server_updated_at=timezone.now())
#         return Response({"data": NoteSerializer(note).data})
    
#     return Response(serializer.errors, status=422)