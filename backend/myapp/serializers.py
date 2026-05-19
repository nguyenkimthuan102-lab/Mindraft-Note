from rest_framework import serializers
from .models import Notes, TodoItems,UserSettings,Tags

class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TodoItems
        fields = ['id', 'content', 'is_completed']

class NoteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notes

        fields = [
            "id",
            "title",
            "content",
            "content_text",
            "type",
            "color",
            "is_pinned",
            "is_archived",
            "is_trashed",
            "position",
            "created_at",
            "server_updated_at",
            "client_updated_at",
        ]

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
        ]
        
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

class TagSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tags

        fields = [
            "id",
            "name",
            "created_at",
            "updated_at",
        ]

class UpdateNoteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notes

        fields = [
            "color",
            "position",
        ]

    def validate_color(self, value):

        if len(value) > 20:
            raise serializers.ValidationError(
                "Invalid color"
            )

        return value