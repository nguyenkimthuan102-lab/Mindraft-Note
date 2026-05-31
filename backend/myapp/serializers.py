from rest_framework import serializers
from .models import Notes, TodoItems, UserSettings, Tags, NoteTags, Reminders

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tags
        fields = ["id", "name", "created_at", "updated_at"]

class NotTagInlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tags
        fields = ["id", "name"]

class NoteSerializer(serializers.ModelSerializer):
    # Lấy danh sách tags đang hoạt động của note
    tags = serializers.SerializerMethodField()

    class Meta:
        model = Notes
        fields = [
            "id", "title", "content", "content_text", "type", "color",
            "is_pinned", "is_archived", "is_trashed", "position",
            "created_at", "server_updated_at", "client_updated_at", "tags"
        ]

    def get_tags(self, obj):
        active_tag_ids = NoteTags.objects.filter(note=obj, is_deleted=0).values_list("tag_id", flat=True)
        tags = Tags.objects.filter(id__in=active_tag_ids, is_deleted=0)
        return NotTagInlineSerializer(tags, many=True).data

    def validate(self, data):
        if data.get('is_deleted') and data.get('is_pinned'):
            raise serializers.ValidationError(
                "Không thể ghim một ghi chú đã nằm trong thùng rác!"
            )
        return data


class CreateNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notes
        fields = [
            "title",
            "type",
            "content",
            "content_text",
            "color",
            "position",
            "client_updated_at",
        ]
        extra_kwargs = {
            "title": {"required": False, "allow_blank": True},
            "content": {"required": False},
            "content_text": {"required": False, "allow_blank": True},
            "color": {"required": False},
            "position": {"required": False},
            "client_updated_at": {"required": False},
        }


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = [
            "theme",
            "notifications_enabled",
            "notify_reminder",
            "notify_collaboration",
            "default_note_view",
            "sort_by",
        ]


class UpdateNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notes
        fields = [
            "title",
            "content",
            "content_text",
            "color",
            "position",
            "is_pinned",
            "is_archived",
            "is_trashed",
            "client_updated_at",
        ]
        extra_kwargs = {
            "title": {"required": False},
            "content": {"required": False},
            "content_text": {"required": False},
            "color": {"required": False},
            "position": {"required": False},
            "is_pinned": {"required": False},
            "is_archived": {"required": False},
            "is_trashed": {"required": False},
            "client_updated_at": {"required": False},
        }

    def validate_color(self, value):
        if len(value) > 20:
            raise serializers.ValidationError("Invalid color")
        return value

    def validate_title(self, value):
        if len(value) > 1000:
            raise serializers.ValidationError("Title too long")
        return value

    def validate_position(self, value):
        if len(value) > 255:
            raise serializers.ValidationError("Invalid position")
        return value


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminders
        fields = ['id', 'note', 'user', 'remind_at', 'repeat_type', 'is_notified', 'is_deleted', 'updated_at']


class CreateReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminders
        fields = ['note', 'remind_at', 'repeat_type']


class UpdateReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminders
        fields = ['remind_at', 'repeat_type', 'is_notified']