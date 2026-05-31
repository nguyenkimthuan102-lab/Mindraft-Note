from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db.models import CompositePrimaryKey


class Media(models.Model):
    id = models.CharField(primary_key=True, max_length=36)
    note = models.ForeignKey('Notes', models.DO_NOTHING)
    uploaded_by = models.ForeignKey(
        'Users',
        models.DO_NOTHING,
        db_column='uploaded_by'
    )
    file_url = models.CharField(max_length=2048)
    file_type = models.CharField(max_length=100)
    file_size = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = 'media'


class NoteCollaborators(models.Model):
    id = models.CharField(primary_key=True, max_length=36)
    note = models.ForeignKey('Notes', models.DO_NOTHING)
    user = models.ForeignKey('Users', models.DO_NOTHING)

    invited_by = models.ForeignKey(
        'Users',
        models.DO_NOTHING,
        db_column='invited_by',
        related_name='notecollaborators_invited_by_set'
    )

    is_pinned = models.IntegerField()
    is_archived = models.IntegerField()
    is_trashed = models.IntegerField()

    accepted_at = models.DateTimeField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = 'note_collaborators'
        unique_together = (('note', 'user'),)


class NoteTags(models.Model):
    pk = models.CompositePrimaryKey(
        'note_id',
        'tag_id'
    )

    note = models.ForeignKey(
        'Notes',
        models.DO_NOTHING
    )

    tag = models.ForeignKey(
        'Tags',
        models.DO_NOTHING
    )

    is_deleted = models.IntegerField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = 'note_tags'


class NoteVersionEditors(models.Model):
    pk = models.CompositePrimaryKey(
        'version_id',
        'user_id'
    )

    version = models.ForeignKey(
        'NoteVersions',
        models.DO_NOTHING
    )

    user = models.ForeignKey(
        'Users',
        models.DO_NOTHING
    )

    class Meta:
        db_table = 'note_version_editors'


class NoteVersions(models.Model):
    id = models.CharField(
        primary_key=True,
        max_length=36
    )

    note = models.ForeignKey(
        'Notes',
        models.DO_NOTHING
    )

    title = models.CharField(
        max_length=1000,
        blank=True,
        null=True
    )

    content = models.JSONField(
        blank=True,
        null=True
    )

    saved_at = models.DateTimeField()

    class Meta:
        db_table = 'note_versions'


class Notes(models.Model):
    id = models.CharField(
        primary_key=True,
        max_length=36
    )

    user = models.ForeignKey(
        'Users',
        models.DO_NOTHING
    )

    title = models.CharField(
        max_length=1000,
        blank=True,
        null=True
    )

    content = models.JSONField(
        blank=True,
        null=True
    )

    content_text = models.TextField(
        blank=True,
        null=True
    )

    type = models.CharField(max_length=20)
    color = models.CharField(max_length=20)

    is_pinned = models.IntegerField()
    is_archived = models.IntegerField()
    is_trashed = models.IntegerField()
    is_deleted = models.IntegerField()
    is_reminded = models.IntegerField()

    deleted_at = models.DateTimeField(
        blank=True,
        null=True
    )

    position = models.CharField(max_length=255)

    created_at = models.DateTimeField()
    server_updated_at = models.DateTimeField()
    client_updated_at = models.DateTimeField()

    trashed_at = models.DateTimeField(
        blank=True,
        null=True
    )

    class Meta:
        db_table = 'notes'


class Notifications(models.Model):
    id = models.CharField(
        primary_key=True,
        max_length=36
    )

    user = models.ForeignKey(
        'Users',
        models.DO_NOTHING
    )

    type = models.CharField(max_length=21)

    note = models.ForeignKey(
        Notes,
        models.DO_NOTHING,
        blank=True,
        null=True
    )

    payload = models.JSONField(
        blank=True,
        null=True
    )
    is_deleted = models.IntegerField()
    is_read = models.IntegerField()
    created_at = models.DateTimeField()

    class Meta:
        db_table = 'notifications'


class OtpVerifications(models.Model):
    id = models.CharField(
        primary_key=True,
        max_length=36
    )

    email = models.CharField(max_length=255)
    otp_hash = models.CharField(max_length=512)
    purpose = models.CharField(max_length=14)

    expires_at = models.DateTimeField()

    used_at = models.DateTimeField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField()

    class Meta:
        db_table = 'otp_verifications'


class RefreshTokens(models.Model):
    id = models.CharField(
        primary_key=True,
        max_length=36
    )

    user = models.ForeignKey(
        'Users',
        models.DO_NOTHING
    )

    token_hash = models.CharField(max_length=512)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField()

    revoked_at = models.DateTimeField(
        blank=True,
        null=True
    )

    class Meta:
        db_table = 'refresh_tokens'


class Reminders(models.Model):
    id = models.CharField(
        primary_key=True,
        max_length=36
    )

    note = models.ForeignKey(
        Notes,
        models.DO_NOTHING
    )

    user = models.ForeignKey(
        'Users',
        models.DO_NOTHING
    )

    remind_at = models.DateTimeField()
    repeat_type = models.CharField(max_length=7)

    is_notified = models.IntegerField()
    is_deleted = models.IntegerField()

    updated_at = models.DateTimeField()

    class Meta:
        db_table = 'reminders'
        unique_together = (('note', 'user'),)


class ResetTokens(models.Model):
    id = models.CharField(
        primary_key=True,
        max_length=36
    )

    user = models.ForeignKey(
        'Users',
        models.DO_NOTHING
    )

    token_hash = models.CharField(max_length=512)
    expires_at = models.DateTimeField()

    used_at = models.DateTimeField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField()

    class Meta:
        db_table = 'reset_tokens'


class Tags(models.Model):
    id = models.CharField(
        primary_key=True,
        max_length=36
    )

    owner = models.ForeignKey(
        'Users',
        models.DO_NOTHING
    )

    name = models.CharField(max_length=100)

    is_deleted = models.IntegerField()

    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = 'tags'
        unique_together = (('owner', 'name'),)


class TodoItems(models.Model):
    id = models.CharField(
        primary_key=True,
        max_length=36
    )

    note = models.ForeignKey(
        Notes,
        models.DO_NOTHING
    )

    parent = models.ForeignKey(
        'self',
        models.DO_NOTHING,
        blank=True,
        null=True
    )

    title = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    content = models.TextField(
        blank=True,
        null=True
    )

    is_completed = models.IntegerField()

    position = models.CharField(max_length=255)

    remind_at = models.DateTimeField(
        blank=True,
        null=True
    )

    repeat_type = models.CharField(max_length=7)

    is_notified = models.IntegerField()

    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = 'todo_items'


class UserSettings(models.Model):
    user = models.OneToOneField(
        'Users',
        models.DO_NOTHING,
        primary_key=True
    )

    theme = models.CharField(max_length=6)

    notifications_enabled = models.IntegerField()
    notify_reminder = models.IntegerField()
    notify_collaboration = models.IntegerField()

    default_note_view = models.CharField(max_length=4)
    sort_by = models.CharField(max_length=50)

    updated_at = models.DateTimeField()

    class Meta:
        db_table = 'user_settings'


class UsersManager(BaseUserManager):

    def create_user(
        self,
        email,
        password=None,
        **extra_fields
    ):
        raise NotImplementedError(
            "Dùng register_view để tạo user."
        )

    def create_superuser(
        self,
        email,
        password=None,
        **extra_fields
    ):
        raise NotImplementedError(
            "Không hỗ trợ superuser qua manager này."
        )


class Users(AbstractBaseUser):

    id = models.CharField(
        primary_key=True,
        max_length=36
    )

    name = models.CharField(
        unique=True,
        max_length=255
    )

    email = models.CharField(
        unique=True,
        max_length=255
    )

    password_hash = models.CharField(
        max_length=512,
        blank=True,
        null=True
    )

    status_token = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    google_id = models.CharField(
        unique=True,
        max_length=255,
        blank=True,
        null=True
    )

    is_verified = models.IntegerField()

    avatar_url = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    objects = UsersManager()

    last_login = None
    password = None

    class Meta:
        db_table = 'users'