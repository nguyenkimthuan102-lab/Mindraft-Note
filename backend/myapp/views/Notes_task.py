from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

import uuid
import os

from django.conf import settings

from django.utils import timezone

from rest_framework import status
from ..models import Tags, Notes,NoteTags,Media

from ..serializers import TagSerializer, NoteSerializer, CreateNoteSerializer, UpdateNoteSerializer, MediaSerializer

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

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_tag(request):
    """
    POST /tags

    {
        "name": "work"
    }
    """

    name = request.data.get("name", "").strip()

    if not name:
        return Response(
            {"error": "Tag name is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # kiểm tra trùng tên tag của user
    if Tags.objects.filter(
        owner=request.user,
        name=name,
        is_deleted=0
    ).exists():
        return Response(
            {"error": "Tag already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    now = timezone.now()

    tag = Tags.objects.create(
        id=str(uuid.uuid4()),
        owner=request.user,
        name=name,
        is_deleted=0,
        created_at=now,
        updated_at=now
    )

    return Response(
        TagSerializer(tag).data,
        status=status.HTTP_201_CREATED
    )

# views/tag_views.py


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_tag_to_note(request, note_id):
    """
    POST /notes/<note_id>/tags

    {
        "tag_id": "uuid-tag"
    }
    """

    tag_id = request.data.get("tag_id")

    if not tag_id:
        return Response(
            {"error": "tag_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        note = Notes.objects.get(
            id=note_id,
            owner=request.user,
            is_deleted=0
        )
    except Notes.DoesNotExist:
        return Response(
            {"error": "Note not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        tag = Tags.objects.get(
            id=tag_id,
            owner=request.user,
            is_deleted=0
        )
    except Tags.DoesNotExist:
        return Response(
            {"error": "Tag not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    relation, created = NoteTags.objects.get_or_create(
        note=note,
        tag=tag,
        defaults={
            "is_deleted": 0,
            "updated_at": timezone.now()
        }
    )

    if not created:
        if relation.is_deleted:
            relation.is_deleted = 0
            relation.updated_at = timezone.now()
            relation.save()

    return Response(
        {
            "message": "Tag added to note",
            "note_id": note.id,
            "tag_id": tag.id
        }
    )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_tag(request, tag_id):

    try:
        tag = Tags.objects.get(
            id=tag_id,
            owner=request.user,
            is_deleted=0
        )
    except Tags.DoesNotExist:
        return Response(
            {"error": "Tag not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    name = request.data.get("name", "").strip()

    if not name:
        return Response(
            {"error": "Tag name is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # kiểm tra trùng tên
    duplicate = Tags.objects.filter(
        owner=request.user,
        name=name,
        is_deleted=0
    ).exclude(id=tag.id).exists()

    if duplicate:
        return Response(
            {"error": "Tag name already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    tag.name = name
    tag.updated_at = timezone.now()
    tag.save()

    return Response(
        TagSerializer(tag).data,
        status=status.HTTP_200_OK
    )
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_note_tags(request, note_id):

    tags = Tags.objects.filter(
        notetags__note_id=note_id,
        notetags__is_deleted=0,
        is_deleted=0
    )

    serializer = TagSerializer(tags, many=True)

    return Response({
        "data": serializer.data
    })

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_tag(request, tag_id):

    try:
        tag = Tags.objects.get(
            id=tag_id,
            owner=request.user,
            is_deleted=0
        )
    except Tags.DoesNotExist:
        return Response(
            {"error": "Tag not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    tag.is_deleted = 1
    tag.updated_at = timezone.now()
    tag.save()

    return Response(
        {
            "message": "Tag deleted successfully"
        },
        status=status.HTTP_200_OK
    )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_tag_from_note(request, note_id, tag_id):

    try:
        relation = NoteTags.objects.get(
            note_id=note_id,
            tag_id=tag_id,
            is_deleted=0
        )
    except NoteTags.DoesNotExist:
        return Response(
            {"error": "Relation not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    relation.is_deleted = 1
    relation.updated_at = timezone.now()
    relation.save()

    return Response({
        "message": "Tag removed"
    })

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

    if note.is_trashed == 0:
        note.is_trashed = 1

        note.is_pinned = 0 
    # OPTIONAL:
    # thường archive sẽ bị bỏ khi vào trash
        note.is_archived = 0
    else:
        note.is_trashed = 0

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

# views/media_views.py

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_note_image(request, note_id):

    file = request.FILES.get("file")

    if not file:
        return Response(
            {"error": "No file uploaded"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        note = Notes.objects.get(
            id=note_id,
            owner=request.user,
            is_deleted=0
        )
    except Notes.DoesNotExist:
        return Response(
            {"error": "Note not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    ext = os.path.splitext(file.name)[1]

    filename = f"{uuid.uuid4()}{ext}"

    upload_dir = os.path.join(
        settings.MEDIA_ROOT,
        "notes"
    )

    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(
        upload_dir,
        filename
    )

    with open(file_path, "wb+") as destination:
        for chunk in file.chunks():
            destination.write(chunk)

    media = Media.objects.create(
        id=str(uuid.uuid4()),
        note=note,
        uploaded_by=request.user,
        file_url=f"/media/notes/{filename}",
        file_type=file.content_type,
        file_size=file.size,
        is_deleted=0,
        created_at=timezone.now(),
        updated_at=timezone.now()
    )

    return Response(
        MediaSerializer(media).data,
        status=status.HTTP_201_CREATED
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_note_media(request, note_id):

    media = Media.objects.filter(
        note_id=note_id,
        is_deleted=0
    )

    return Response(
        MediaSerializer(media, many=True).data
    )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_media(request, media_id):

    try:
        media = Media.objects.get(
            id=media_id,
            uploaded_by=request.user,
            is_deleted=0
        )
    except Media.DoesNotExist:
        return Response(
            {"error": "Media not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    media.is_deleted = 1
    media.updated_at = timezone.now()
    media.save()

    return Response({
        "message": "deleted"
    })

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def permanent_delete_note(request, note_id):
    """
    Xóa vĩnh viễn note khỏi Trash.
    Chỉ cho phép nếu note đang ở trash (is_trashed=1).
    """
    try:
        note = Notes.objects.get(
            id=note_id,
            user=request.user,
            is_trashed=1,
            is_deleted=0,
        )
    except Notes.DoesNotExist:
        return Response(
            {"error": "Note not found in trash"},
            status=status.HTTP_404_NOT_FOUND
        )

    note.is_deleted = 1
    note.is_trashed = 0
    note.server_updated_at = timezone.now()
    note.save(update_fields=['is_deleted', 'is_trashed', 'server_updated_at'])

    return Response(status=status.HTTP_204_NO_CONTENT)