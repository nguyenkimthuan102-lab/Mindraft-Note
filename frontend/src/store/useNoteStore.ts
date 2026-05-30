import { create } from 'zustand';
import type { NoteCardData, TodoItemData } from '../components/notes/NoteCard';
import {
  fetchNotes, updateNote, trashNote, toggleArchiveNote, togglePinNote,
  createNoteText, createNoteTodo, restoreNote, deleteNotePermanently,
} from '../api/noteApi';
<<<<<<< HEAD
import api from '@/src/api/axiosClient';
=======
import { deleteReminder, fetchReminders } from '../api/reminderApi';

// Helper: tìm và xóa tất cả reminder của một note (silent, không throw)
const deleteRemindersForNote = async (noteId: string) => {
  try {
    const reminders = await fetchReminders();
    const toDelete = reminders.filter(r => r.note === noteId && r.is_deleted === 0);
    if (toDelete.length > 0) {
      await Promise.all(toDelete.map(r => deleteReminder(r.id)));
    }
  } catch (err) {
    console.warn('Không thể xóa reminder của note:', noteId, err);
  }
};
>>>>>>> df26e1e (Update reminder and notifications)

type ViewMode = 'grid' | 'list';
type EditorMode = 'text' | 'todo';

export function mapApiTodoItems(results: any[]): TodoItemData[] {
  if (!results) return [];
  return results.map((root: any) => ({
    id: root.id,
    title: root.title ?? '',
    is_completed: Boolean(root.is_completed),
    content: root.content ?? '',
    subtasks: (root.children || [])
      .sort((a: any, b: any) => (a.position || '').localeCompare(b.position || ''))
      .map((child: any) => ({
        id: child.id,
        title: child.title ?? '',
        is_completed: Boolean(child.is_completed),
        content: child.content ?? '',
      })),
  }));
}

interface NoteStoreState {
  notes: NoteCardData[];
  setNotes: (notes: NoteCardData[]) => void;
  loadNotes: (viewType: 'all' | 'active' | 'archived' | 'trash') => Promise<void>;
  pinNoteAction: (id: string) => Promise<void>;
  archiveNoteAction: (id: string) => Promise<void>;
  trashNoteAction: (id: string) => Promise<void>;
  saveNoteAction: (cleanNote: NoteCardData, localContents?: Record<string, string>) => Promise<any>;
  restoreNoteAction: (id: string) => Promise<void>;
  deleteNotePermanentlyAction: (id: string) => Promise<void>;
  emptyTrashAction: () => Promise<void>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  editorVisible: boolean;
  editorMode: EditorMode;
  editingNote?: NoteCardData;
  openCreateText: () => void;
  openCreateTodo: () => void;
  openEditNote: (note: NoteCardData) => void;
  closeEditor: () => void;
  allTags: string[];
  noteTagsMap: Record<string, string[]>;
  addTagToSystem: (tag: string) => Promise<void>;
  updateNoteTags: (noteId: string, tags: string[]) => Promise<void>;
  batchPinAction: (ids: string[]) => Promise<void>;
  batchArchiveAction: (ids: string[]) => Promise<void>;
  batchTrashAction: (ids: string[]) => Promise<void>;
  batchColorAction: (ids: string[], color: string) => Promise<void>;
  clearCompletedTodosAction: (noteId: string) => Promise<void>;
}

const normalizeTag = (tag: string) => tag.trim();
const uniqueTags = (tags: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const normalized = normalizeTag(tag);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
};

export const useNoteStore = create<NoteStoreState>((set, get) => ({
  notes: [],
  setNotes: (notes) => set({ notes }),

  loadNotes: async (viewType) => {
    try {
      const data = await fetchNotes({ view: viewType });
      set({ notes: data });

      const todoNotes = data.filter(n => n.type === 'todo');

      Promise.all(
        todoNotes.map(async (note) => {
          try {
            const response = await api.get(`/notes/${note.id}/todos/`);
            const freshItems = mapApiTodoItems(response.data.results);

            set((state) => ({
              notes: state.notes.map(n => n.id === note.id ? {
                ...n,
                todo_items: freshItems,
                todo_total: freshItems.length,
                todo_completed: freshItems.filter(i => i.is_completed).length
              } : n)
            }));
          } catch (err) {
            console.warn(`[Store] Lỗi load danh sách việc con:`, err);
          }
        })
      );
    } catch (error) {
      console.error('Lỗi fetch notes:', error);
    }
  },

  pinNoteAction: async (id) => {
    const oldNotes = get().notes;
    set({ notes: oldNotes.map(n => n.id === id ? { ...n, is_pinned: n.is_pinned ? 0 : 1 } : n) });
    try { await togglePinNote(id); } catch { set({ notes: oldNotes }); }
  },

  archiveNoteAction: async (id) => {
    const oldNotes = get().notes;
    const note = oldNotes.find(n => n.id === id);
    set({ notes: oldNotes.filter(n => n.id !== id) });
    try {
      if (note?.is_pinned === 1) await togglePinNote(id);
      await toggleArchiveNote(id);
    } catch { set({ notes: oldNotes }); }
  },

  trashNoteAction: async (id) => {
    const oldNotes = get().notes;
    set({ notes: oldNotes.filter(n => n.id !== id) });
<<<<<<< HEAD
    try { await trashNote(id); } catch { set({ notes: oldNotes }); }
=======
    try {
      await trashNote(id);
      // Xóa luôn các reminder liên quan (không chặn UI, lỗi chỉ log)
      deleteRemindersForNote(id);
    } catch {
      set({ notes: oldNotes });
    }
>>>>>>> df26e1e (Update reminder and notifications)
  },

  restoreNoteAction: async (id) => {
    const oldNotes = get().notes;
    set({ notes: oldNotes.filter(n => n.id !== id) });
    try { await restoreNote(id); } catch { set({ notes: oldNotes }); }
  },

  deleteNotePermanentlyAction: async (id) => {
    const oldNotes = get().notes;
    set({ notes: oldNotes.filter(n => n.id !== id) });
<<<<<<< HEAD
    try { await deleteNotePermanently(id); } catch { set({ notes: oldNotes }); }
=======
    try {
      await deleteNotePermanently(id);
      deleteRemindersForNote(id);
    } catch {
      set({ notes: oldNotes });
    }
>>>>>>> df26e1e (Update reminder and notifications)
  },

  emptyTrashAction: async () => {
    const oldNotes = get().notes;
    if (oldNotes.length === 0) return;
    set({ notes: [] });
<<<<<<< HEAD
    try { await Promise.all(oldNotes.map(n => deleteNotePermanently(n.id))); } catch { set({ notes: oldNotes }); }
=======
    try {
      await Promise.all(oldNotes.map(n => deleteNotePermanently(n.id)));
      // Xóa reminder của tất cả note trong trash
      await Promise.all(oldNotes.map(n => deleteRemindersForNote(n.id)));
    } catch {
      set({ notes: oldNotes });
    }
>>>>>>> df26e1e (Update reminder and notifications)
  },

  saveNoteAction: async (cleanNote, localContents = {}) => {
    const isNewNote = cleanNote.id.startsWith('temp-');
    const currentNotes = get().notes;

    try {
      if (isNewNote) {
        set({ notes: [cleanNote, ...currentNotes] });
        const createdNote = cleanNote.type === 'text'
          ? await createNoteText(cleanNote)
          : await createNoteTodo(cleanNote);

        const mergedNote = cleanNote.type === 'todo'
          ? { ...createdNote, todo_items: cleanNote.todo_items }
          : createdNote;

        set((state) => ({
          notes: state.notes.map(n => n.id === cleanNote.id ? mergedNote : n),
        }));

        const updatedContentsMap: Record<string, string> = { ...localContents };

        if (cleanNote.type === 'todo' && cleanNote.todo_items && cleanNote.todo_items.length > 0) {
          let rootIndex = 0;
          let subIndex = 0;

          for (const root of cleanNote.todo_items) {
            const rootPos = `a${String(rootIndex++).padStart(4, '0')}`;
            const rootRes = await api.post(`/notes/${createdNote.id}/todos/`, {
              title: root.title.trim() || ' ',
              content: localContents[root.id] ?? '',
              is_completed: root.is_completed ? 1 : 0,
              position: rootPos,
              repeat_type: 'none',
            });

            const rootRealId = rootRes.data.id;
            if (localContents[root.id]) {
              updatedContentsMap[rootRealId] = localContents[root.id];
            }

            if (root.subtasks && root.subtasks.length > 0) {
              for (const sub of root.subtasks) {
                const subPos = `b${String(subIndex++).padStart(4, '0')}`;
                const subRes = await api.post(`/notes/${createdNote.id}/todos/`, {
                  title: sub.title.trim() || ' ',
                  content: localContents[sub.id] ?? '',
                  is_completed: sub.is_completed ? 1 : 0,
                  parent: rootRealId,
                  position: subPos,
                  repeat_type: 'none',
                });

                if (localContents[sub.id]) {
                  updatedContentsMap[subRes.data.id] = localContents[sub.id];
                }
              }
            }
          }

          const freshResponse = await api.get(`/notes/${createdNote.id}/todos/`);
          const finalMappedItems = mapApiTodoItems(freshResponse.data.results);

          const finalItemsWithContent = finalMappedItems.map(item => ({
            ...item,
            content: updatedContentsMap[item.id] ?? item.content,
            subtasks: (item.subtasks || []).map(sub => ({
              ...sub,
              content: updatedContentsMap[sub.id] ?? sub.content,
            }))
          }));

          set((state) => ({
            notes: state.notes.map(n => n.id === createdNote.id ? {
              ...n,
              todo_items: finalItemsWithContent,
              todo_total: finalItemsWithContent.length,
              todo_completed: finalItemsWithContent.filter((i: any) => i.is_completed).length,
            } : n),
          }));
        }
        return {
          note: get().notes.find(n => n.id === createdNote.id) || createdNote,
          contentsMap: updatedContentsMap
        };
      } else {
        const oldNote = currentNotes.find(n => n.id === cleanNote.id);
        const isPinningFromArchive =
          (oldNote?.is_archived === 1 || cleanNote.is_archived === 1) &&
          (oldNote?.is_pinned ?? 0) !== (cleanNote.is_pinned ?? 0) &&
          cleanNote.is_pinned === 1;

        if (isPinningFromArchive) {
          set({ notes: currentNotes.filter(n => n.id !== cleanNote.id) });
          await updateNote(cleanNote.id, cleanNote);
          await togglePinNote(cleanNote.id);
          await toggleArchiveNote(cleanNote.id);
          return { note: cleanNote, contentsMap: localContents };
        }

        let updatedTodoItems = cleanNote.todo_items;
        const updatedContentsMap: Record<string, string> = { ...localContents };

        if (cleanNote.type === 'todo' && cleanNote.todo_items?.some(item => item.id.startsWith('temp-'))) {
          try {
            const oldTodosRes = await api.get(`/notes/${cleanNote.id}/todos/`);
            for (const oldItem of (oldTodosRes.data.results || [])) {
              await api.delete(`/notes/${cleanNote.id}/todos/${oldItem.id}/`);
            }
          } catch (e) { console.warn("Lỗi dọn dẹp todo cũ khi đổi mode:", e); }

          let rootIndex = 0;
          let subIndex = 0;
          const tempMappedItems: TodoItemData[] = [];

          for (const root of cleanNote.todo_items) {
            const rootPos = `a${String(rootIndex++).padStart(4, '0')}`;
            const rootRes = await api.post(`/notes/${cleanNote.id}/todos/`, {
              title: root.title.trim() || ' ',
              content: localContents[root.id] ?? '',
              is_completed: root.is_completed ? 1 : 0,
              position: rootPos,
              repeat_type: 'none',
            });

            const rootRealId = rootRes.data.id;
            if (localContents[root.id]) {
              updatedContentsMap[rootRealId] = localContents[root.id];
            }

            const syncedSubtasks: TodoItemData[] = [];
            if (root.subtasks && root.subtasks.length > 0) {
              for (const sub of root.subtasks) {
                const subPos = `b${String(subIndex++).padStart(4, '0')}`;
                const subRes = await api.post(`/notes/${cleanNote.id}/todos/`, {
                  title: sub.title.trim() || ' ',
                  content: localContents[sub.id] ?? '',
                  is_completed: sub.is_completed ? 1 : 0,
                  parent: rootRealId,
                  position: subPos,
                  repeat_type: 'none',
                });

                const subRealId = subRes.data.id;
                if (localContents[sub.id]) {
                  updatedContentsMap[subRealId] = localContents[sub.id];
                }
                syncedSubtasks.push({ id: subRealId, title: sub.title, is_completed: sub.is_completed, content: localContents[sub.id] ?? '' });
              }
            }
            tempMappedItems.push({ id: rootRealId, title: root.title, is_completed: root.is_completed, content: localContents[root.id] ?? '', subtasks: syncedSubtasks });
          }
          updatedTodoItems = tempMappedItems;
          cleanNote.todo_items = updatedTodoItems;
        }

        set({ notes: currentNotes.map(n => n.id === cleanNote.id ? { ...cleanNote, todo_items: updatedTodoItems } : n) });
        if (oldNote && oldNote.is_pinned !== cleanNote.is_pinned) {
          await togglePinNote(cleanNote.id);
        }
        await updateNote(cleanNote.id, cleanNote);
        return { note: cleanNote, contentsMap: updatedContentsMap };
      }
    } catch (error) {
      console.error('Lỗi saveNoteAction:', error);
      set({ notes: currentNotes });
      return { note: cleanNote, contentsMap: localContents };
    }
  },

  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),
  editorVisible: false,
  editorMode: 'text',
  editingNote: undefined,

  openCreateText: () => set({ editorVisible: true, editorMode: 'text', editingNote: undefined }),
  openCreateTodo: () => set({ editorVisible: true, editorMode: 'todo', editingNote: undefined }),
  openEditNote: (note) => set({ editorVisible: true, editorMode: note.type, editingNote: note }),
  closeEditor: () => set({ editorVisible: false, editingNote: undefined }),

  allTags: ['ehr', 'g', 'gse'],
  noteTagsMap: {},
  addTagToSystem: async (rawTag) => {
    const tag = normalizeTag(rawTag);
    if (!tag) return;
    const previousTags = get().allTags;
    if (previousTags.includes(tag)) return;
    set({ allTags: [...previousTags, tag] });
  },

  updateNoteTags: async (noteId, tags) => {
    const normalizedTags = uniqueTags(tags);
    const previousSystemTags = get().allTags;
    const mergedSystemTags = uniqueTags([...previousSystemTags, ...normalizedTags]);
    set((state) => ({
      allTags: mergedSystemTags,
      noteTagsMap: { ...state.noteTagsMap, [noteId]: normalizedTags },
    }));
  },

  batchPinAction: async (ids) => {
    if (ids.length === 0) return;
    const oldNotes = get().notes;
    const pinnedCount = oldNotes.filter(n => ids.includes(n.id) && n.is_pinned).length;
    const targetPin = pinnedCount === ids.length ? 0 : 1;
    set({ notes: oldNotes.map(n => ids.includes(n.id) ? { ...n, is_pinned: targetPin } : n) });
    try { await Promise.all(ids.map(id => togglePinNote(id))); } catch { set({ notes: oldNotes }); }
  },

  batchArchiveAction: async (ids) => {
    if (ids.length === 0) return;
    const oldNotes = get().notes;
    const pinnedIds = oldNotes.filter(n => ids.includes(n.id) && n.is_pinned === 1).map(n => n.id);
    set({ notes: oldNotes.filter(n => !ids.includes(n.id)) });
    try {
      if (pinnedIds.length > 0) await Promise.all(pinnedIds.map(id => togglePinNote(id)));
      await Promise.all(ids.map(id => toggleArchiveNote(id)));
    } catch { set({ notes: oldNotes }); }
  },

  batchTrashAction: async (ids) => {
    if (ids.length === 0) return;
    const oldNotes = get().notes;
    set({ notes: oldNotes.filter(n => !ids.includes(n.id)) });
<<<<<<< HEAD
    try { await Promise.all(ids.map(id => trashNote(id))); } catch { set({ notes: oldNotes }); }
=======
    try {
      await Promise.all(ids.map(id => trashNote(id)));
      ids.forEach(id => deleteRemindersForNote(id));
    } catch {
      set({ notes: oldNotes });
    }
>>>>>>> df26e1e (Update reminder and notifications)
  },

  batchColorAction: async (ids, color) => {
    if (ids.length === 0) return;
    const oldNotes = get().notes;
    set({ notes: oldNotes.map(n => ids.includes(n.id) ? { ...n, color } : n) });
    try { await Promise.all(ids.map(id => updateNote(id, { color }))); } catch { set({ notes: oldNotes }); }
  },

  // FIX: clearCompletedTodosAction
  //
  // Previous bugs:
  //   1. Only collected root-level completed IDs; orphaned completed subtasks
  //      under non-completed parents were never deleted.
  //   2. Individual DELETE calls for root todos hit a 404 for subtasks because
  //      the Django view used `.get(id=todo_id, note=note)`, which fails for
  //      items that only have a parent FK. Any 404 triggered a full state rollback.
  //   3. After deletion the code called saveNoteAction(latestNote), which
  //      re-POSTed all surviving items as new todos, corrupting the database.
  //   4. The local editor's todoItems state was never refreshed after the store
  //      was updated, so the UI still showed the deleted items.
  //
  // Fix strategy:
  //   - Use the new single bulk endpoint DELETE /notes/<id>/todos/clear-completed/
  //     so all deletion logic lives in Django with a single atomic DB sweep.
  //   - Optimistically update the store first; on API failure revert only the
  //     store (the editor subscribes to the store and will revert with it).
  //   - Never call saveNoteAction here — that would re-create deleted rows.
  clearCompletedTodosAction: async (noteId: string) => {
    const currentNotes = get().notes;
    const targetNote = currentNotes.find(n => n.id === noteId);
    if (!targetNote || !targetNote.todo_items) return;

    // Check that there is actually something to delete before touching the UI.
    const hasCompletedRoot = targetNote.todo_items.some(item => item.is_completed);
    const hasCompletedSub = targetNote.todo_items.some(
      item => (item.subtasks || []).some(sub => sub.is_completed)
    );
    if (!hasCompletedRoot && !hasCompletedSub) return;

    // --- Optimistic UI update ---
    // Remove completed roots and completed subtasks under surviving roots.
    const updatedItems = targetNote.todo_items
      .filter(item => !item.is_completed)
      .map(item => ({
        ...item,
        subtasks: (item.subtasks || []).filter(sub => !sub.is_completed),
      }));

    set({
      notes: currentNotes.map(n =>
        n.id === noteId
          ? {
              ...n,
              todo_items: updatedItems,
              todo_total: updatedItems.reduce(
                (acc, i) => acc + 1 + (i.subtasks?.length ?? 0), 0
              ),
              todo_completed: 0,
            }
          : n
      ),
    });

    // --- Single bulk API call ---
    try {
      await api.delete(`/notes/${noteId}/todos/clear-completed/`);
      // No saveNoteAction call — the bulk endpoint handles everything server-side.
    } catch (error) {
      console.warn('[Store] Lỗi xóa todo đã hoàn thành:', error);
      // Revert the optimistic update on failure so the user sees the real state.
      set({ notes: currentNotes });
    }
  },
}));