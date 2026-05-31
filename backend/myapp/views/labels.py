from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

import uuid
from django.utils import timezone

from ..models import Tags, Notes, NoteTags
from ..serializers import TagSerializer

# ─── 4.1 & 4.2: LẤY VÀ TẠO NHÃN ───────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def tags_collection_view(request):
    if request.method == "GET":
        tags = Tags.objects.filter(owner=request.user, is_deleted=0).order_by("name")
        serializer = TagSerializer(tags, many=True)
        return Response({"data": serializer.data})

    elif request.method == "POST":
        name = request.data.get("name", "").strip()
        if not name:
            return Response({"error": {"code": "INVALID_DATA", "message": "Tên nhãn không được để trống."}}, status=422)

        if Tags.objects.filter(owner=request.user, name__iexact=name, is_deleted=0).exists():
            return Response({"error": {"code": "TAG_ALREADY_EXISTS", "message": f"Nhãn '{name}' đã tồn tại."}}, status=409)

        tag = Tags.objects.create(
            id=str(uuid.uuid4()), owner=request.user, name=name,
            is_deleted=0, created_at=timezone.now(), updated_at=timezone.now()
        )
        return Response({"data": TagSerializer(tag).data}, status=201)

# ─── 4.3 & 4.4: SỬA VÀ XÓA NHÃN ───────────────────────────────────────────

@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def tag_detail_view(request, tag_id):
    try:
        tag = Tags.objects.get(id=tag_id, owner=request.user, is_deleted=0)
    except Tags.DoesNotExist:
        return Response({"error": {"code": "TAG_NOT_FOUND", "message": "Không tìm thấy nhãn."}}, status=404)

    if request.method == "PATCH":
        name = request.data.get("name", "").strip()
        if not name or Tags.objects.filter(owner=request.user, name__iexact=name, is_deleted=0).exclude(id=tag_id).exists():
            return Response({"error": {"code": "INVALID_OR_EXISTS", "message": "Tên không hợp lệ hoặc đã tồn tại."}}, status=400)
        
        tag.name = name
        tag.updated_at = timezone.now()
        tag.save()
        return Response({"data": TagSerializer(tag).data})

    elif request.method == "DELETE":
        now = timezone.now()
        # Xóa logic: Soft-delete nhãn và toàn bộ liên kết NoteTags liên quan
        NoteTags.objects.filter(tag=tag, is_deleted=0).update(is_deleted=1, updated_at=now)
        tag.is_deleted = 1
        tag.updated_at = now
        tag.save()
        return Response(status=204)

# ─── 5.1 & 5.2: GẮN VÀ GỠ NHÃN KHỎI GHI CHÚ ────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def note_tags_collection_view(request, note_id):
    try:
        note = Notes.objects.get(id=note_id, user=request.user, is_deleted=0)
        tag = Tags.objects.get(id=request.data.get("tag_id"), owner=request.user, is_deleted=0)
    except (Notes.DoesNotExist, Tags.DoesNotExist):
        return Response({"error": {"code": "NOT_FOUND", "message": "Ghi chú hoặc nhãn không tồn tại."}}, status=404)

    obj, created = NoteTags.objects.update_or_create(
        note=note, tag=tag,
        defaults={'is_deleted': 0, 'updated_at': timezone.now()}
    )
    return Response({"data": {"note_id": note.id, "tag_id": tag.id}}, status=201)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def note_tag_detail_view(request, note_id, tag_id):
    NoteTags.objects.filter(note_id=note_id, tag_id=tag_id, is_deleted=0).update(
        is_deleted=1, updated_at=timezone.now()
    )
    return Response(status=204)