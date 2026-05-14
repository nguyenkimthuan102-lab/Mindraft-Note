from django.urls import path
from . import views

urlpatterns = [
    path('notes/', views.note_list),
    path('notes/create/', views.note_create),
    path('notes/<int:id>/', views.note_detail),
    path('notes/<int:id>/update/', views.note_update),
    path('notes/<int:id>/delete/', views.note_delete),
    path('notes/search/', views.search_notes),
    path('notes/pinned/', views.pinned_notes),
    path('notes/archived/', views.archived_notes),
    path('notes/trash/', views.trash_notes),
    path('labels/', views.label_list),
    path('labels/create/', views.label_create),
    path('notes/<int:note_id>/add-label/', views.add_label_to_note),
    path('notes/<int:note_id>/checklist/', views.checklist_create),
    path('checklist/<int:item_id>/toggle/', views.checklist_toggle),
    path('notes/<int:note_id>/add-collab/', views.add_collaborator),
]