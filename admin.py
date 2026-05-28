from django.contrib import admin
from .models import Users, Notes, Tags, UserSettings, Reminders, NoteCollaborators, TodoItems, NoteTags, NoteVersionEditors, NoteVersions

admin.site.register(Users)
admin.site.register(Tags)
admin.site.register(UserSettings)
admin.site.register(Reminders)
admin.site.register(NoteCollaborators)
admin.site.register(TodoItems)

class NoteTagsInline(admin.TabularInline):
    model = NoteTags
    extra = 0

@admin.register(Notes)
class NoteAdmin(admin.ModelAdmin):
    inlines = [NoteTagsInline]

class NoteVersionEditorsInline(admin.TabularInline):
    model = NoteVersionEditors
    extra = 0

@admin.register(NoteVersions)
class NoteVersionAdmin(admin.ModelAdmin):
    inlines = [NoteVersionEditorsInline]