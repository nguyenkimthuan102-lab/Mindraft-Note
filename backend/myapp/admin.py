from django.contrib import admin
from .models import User, Note, Label, Setting, Reminder, Collaborator, ChecklistItem,NoteLabel

admin.site.register(User)
admin.site.register(Note)
admin.site.register(Label)
admin.site.register(Setting)
admin.site.register(Reminder)
admin.site.register(NoteLabel)
admin.site.register(Collaborator)
admin.site.register(ChecklistItem)