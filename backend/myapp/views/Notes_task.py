from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

import uuid

from django.utils import timezone

from rest_framework import status
from ..models import Tags, Notes

from ..serializers import TagSerializer, NoteSerializer, CreateNoteSerializer, UpdateNoteSerializer


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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_notes(request):

    view_type = request.GET.get("view", "active")

    notes = Notes.objects.none()

    if view_type == "active":
        notes = Notes.objects.filter(
            user=request.user, is_deleted=0, is_archived=0, is_trashed=0
        )
    elif view_type == "archived":
        notes = Notes.objects.filter(
            user=request.user, is_deleted=0, is_archived=1, is_trashed=0
        )
    elif view_type == "trash":
        notes = Notes.objects.filter(
            user=request.user, is_deleted=0, is_trashed=1
        )
    elif view_type == "all":
        notes = Notes.objects.filter(
            user=request.user, is_deleted=0
        )

    sort_by = request.GET.get("sort_by", "updated_at")

    if sort_by == "created_at":
        notes = notes.order_by("-created_at")
    elif sort_by == "position":
        notes = notes.order_by("position")
    else:
        notes = notes.order_by("-server_updated_at")

    serializer = NoteSerializer(notes, many=True)

    return Response({
        "data": serializer.data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_note(request):

    serializer = CreateNoteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    note_type = serializer.validated_data.get("type", "text")
    title     = serializer.validated_data.get("title", "")
    now       = timezone.now()

    default_content = {"items": []} if note_type == "checklist" else {}

    note = Notes.objects.create(
        id=str(uuid.uuid4()),
        user=request.user,
        title=title,
        content=default_content,
        content_text="",
        type=note_type,
        color="default",          # FIX: "default" khớp với cardColorMap frontend
        is_pinned=0,
        is_archived=0,
        is_trashed=0,
        is_deleted=0,
        position="a0",
        created_at=now,
        server_updated_at=now,
        client_updated_at=now,
    )

    return Response(
        {"data": NoteSerializer(note).data},
        status=status.HTTP_201_CREATED
    )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def toggle_pin_note(request, note_id):

    try:
        note = Notes.objects.get(id=note_id, user=request.user, is_deleted=0)
    except Notes.DoesNotExist:
        return Response({"error": {"code": "NOTE_NOT_FOUND", "message": "Note not found"}},
                        status=status.HTTP_404_NOT_FOUND)

    note.is_pinned = 0 if note.is_pinned == 1 else 1
    note.server_updated_at = timezone.now()
    note.save(update_fields=["is_pinned", "server_updated_at"])

    return Response({"data": NoteSerializer(note).data})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def toggle_archive_note(request, note_id):

    try:
        note = Notes.objects.get(id=note_id, user=request.user, is_deleted=0)
    except Notes.DoesNotExist:
        return Response({"error": {"code": "NOTE_NOT_FOUND", "message": "Note not found"}},
                        status=status.HTTP_404_NOT_FOUND)

    note.is_archived = 0 if note.is_archived == 1 else 1
    note.server_updated_at = timezone.now()
    note.save(update_fields=["is_archived", "server_updated_at"])

    return Response({"data": NoteSerializer(note).data})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def trash_note(request, note_id):

    try:
        note = Notes.objects.get(id=note_id, user=request.user, is_deleted=0)
    except Notes.DoesNotExist:
        return Response({"error": {"code": "NOTE_NOT_FOUND", "message": "Note not found"}},
                        status=status.HTTP_404_NOT_FOUND)

    note.is_trashed   = 1
    note.is_archived  = 0    # bỏ archive khi vào trash
    note.trashed_at   = timezone.now()
    note.server_updated_at = timezone.now()
    note.save(update_fields=["is_trashed", "is_archived", "trashed_at", "server_updated_at"])

    return Response({"data": NoteSerializer(note).data})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_note_quick(request, note_id):

    try:
        note = Notes.objects.get(id=note_id, user=request.user, is_deleted=0)
    except Notes.DoesNotExist:
        return Response({"error": {"code": "NOTE_NOT_FOUND", "message": "Note not found"}},
                        status=status.HTTP_404_NOT_FOUND)

    serializer = UpdateNoteSerializer(note, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)

    # FIX: save() trả về instance đã cập nhật — dùng nó để serialize
    # thay vì dùng biến `note` cũ có thể chứa giá trị cũ trong bộ nhớ
    updated_note = serializer.save(server_updated_at=timezone.now())

    return Response({"data": NoteSerializer(updated_note).data})