from rest_framework import serializers
from .models import Notes, TodoItems

class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TodoItems
        fields = ['id', 'content', 'is_completed']

class NoteSerializer(serializers.ModelSerializer):
    checklist_items = ChecklistItemSerializer(many=True, read_only=True)

    class Meta:
        model = Notes
        fields = '__all__'
        read_only_fields = ['user']

    def validate(self, data):
        if data.get('is_deleted') and data.get('is_pinned'):
            raise serializers.ValidationError(
                "Không thể ghim một ghi chú đã nằm trong thùng rác!"
            )
        return data