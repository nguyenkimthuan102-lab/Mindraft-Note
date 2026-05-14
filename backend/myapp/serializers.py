from rest_framework import serializers
from .models import Note,ChecklistItem

class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ['id', 'content', 'is_completed']

class NoteSerializer(serializers.ModelSerializer):
    checklist_items = ChecklistItemSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = '__all__'
        read_only_fields = ['user']

    def validate(self, data):
        if data.get('is_deleted') and data.get('is_pinned'):
            raise serializers.ValidationError(
                "Không thể ghim một ghi chú đã nằm trong thùng rác!"
            )
        return data