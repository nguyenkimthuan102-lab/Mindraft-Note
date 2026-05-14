from django.db import models
from django.contrib.auth.models import AbstractUser

# 1. Bảng Users 
class User(AbstractUser):
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    # Django mặc định đã có password_hash (password)
    avatar_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'

# 2. Bảng Settings (Quan hệ 1-1 với User)
class Setting(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='settings')
    dark_mode = models.BooleanField(default=False)
    notify_reminder = models.BooleanField(default=True)
    notify_collaboration = models.BooleanField(default=True)

    class Meta:
        db_table = 'settings'

# 3. Bảng Notes
class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, null=True)
    is_pinned = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notes'

# 4. Bảng Labels
class Label(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='labels')
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'labels'

# 5. Bảng trung gian Note_Labels (Many-to-Many giữa Note và Label)
class NoteLabel(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE)
    label = models.ForeignKey(Label, on_delete=models.CASCADE)

    class Meta:
        db_table = 'note_labels'
        unique_together = ('note', 'label')

# 6. Bảng Reminders
class Reminder(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='reminders')
    remind_at = models.DateTimeField()
    is_sent = models.BooleanField(default=False)

    class Meta:
        db_table = 'reminders'

# 7. Bảng Collaborators (Cộng tác viên)
class Collaborator(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='collaborators')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        db_table = 'collaborators'
        unique_together = ('note', 'user')

# 8. Bảng Checklist_Items
class ChecklistItem(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='checklist_items')
    content = models.TextField()
    is_completed = models.BooleanField(default=False)

    class Meta:
        db_table = 'checklist_items'