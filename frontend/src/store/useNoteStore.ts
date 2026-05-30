import { create } from 'zustand';
import type { NoteCardData } from '../components/notes/NoteCard';
import {
  fetchNotes, updateNote, trashNote, toggleArchiveNote, togglePinNote,
  createNoteText, createNoteTodo, restoreNote, deleteNotePermanently,
} from '../api/noteApi';
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

type ViewMode = 'grid' | 'list';
type EditorMode = 'text' | 'todo';

interface NoteStoreState {
  // DATA STATE
  notes: NoteCardData[];
  setNotes: (notes: NoteCardData[]) => void;
  loadNotes: (viewType: 'all' | 'active' | 'archived' | 'trash') => Promise<void>;

  // DATA ACTIONS
  pinNoteAction: (id: string) => Promise<void>;
  archiveNoteAction: (id: string) => Promise<void>;
  trashNoteAction: (id: string) => Promise<void>;
  saveNoteAction: (note: NoteCardData) => Promise<void>;
  restoreNoteAction: (id: string) => Promise<void>;
  deleteNotePermanentlyAction: (id: string) => Promise<void>;
  emptyTrashAction: () => Promise<void>;

  // UI STATE
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  editorVisible: boolean;
  editorMode: EditorMode;
  editingNote?: NoteCardData;
  openCreateText: () => void;
  openCreateTodo: () => void;
  openEditNote: (note: NoteCardData) => void;
  closeEditor: () => void;

  // TAG STATE
  allTags: string[];
  noteTagsMap: Record<string, string[]>;
  addTagToSystem: (tag: string) => Promise<void>;
  updateNoteTags: (noteId: string, tags: string[]) => Promise<void>;

  // BATCH ACTIONS
  batchPinAction: (ids: string[]) => Promise<void>;
  batchArchiveAction: (ids: string[]) => Promise<void>;
  batchTrashAction: (ids: string[]) => Promise<void>;
  batchColorAction: (ids: string[], color: string) => Promise<void>;
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
  // --- DATA ---
  notes: [],
  setNotes: (notes) => set({ notes }),

  loadNotes: async (viewType) => {
    try {
      const data = await fetchNotes({ view: viewType });
      set({ notes: data });
    } catch (error) {
      console.error('Lỗi fetch notes:', error);
    }
  },

  pinNoteAction: async (id) => {
    const oldNotes = get().notes;
    set({ notes: oldNotes.map(n => n.id === id ? { ...n, is_pinned: n.is_pinned ? 0 : 1 } : n) });
    try {
      await togglePinNote(id);
    } catch {
      set({ notes: oldNotes });
    }
  },

  archiveNoteAction: async (id) => {
    const oldNotes = get().notes;
    const note = oldNotes.find(n => n.id === id);
    set({ notes: oldNotes.filter(n => n.id !== id) });
    try {
      if (note?.is_pinned === 1) await togglePinNote(id);
      await toggleArchiveNote(id);
    } catch {
      set({ notes: oldNotes });
    }
  },

  trashNoteAction: async (id) => {
    const oldNotes = get().notes;
    set({ notes: oldNotes.filter(n => n.id !== id) });
    try {
      await trashNote(id);
      // Xóa luôn các reminder liên quan (không chặn UI, lỗi chỉ log)
      deleteRemindersForNote(id);
    } catch {
      set({ notes: oldNotes });
    }
  },

  // Khôi phục note từ Trash về Active
  restoreNoteAction: async (id) => {
    const oldNotes = get().notes;
    set({ notes: oldNotes.filter(n => n.id !== id) });
    try {
      await restoreNote(id);
    } catch {
      set({ notes: oldNotes });
    }
  },

  // Xóa vĩnh viễn: is_deleted=1, is_trash=0
  deleteNotePermanentlyAction: async (id) => {
    const oldNotes = get().notes;
    set({ notes: oldNotes.filter(n => n.id !== id) });
    try {
      await deleteNotePermanently(id);
      deleteRemindersForNote(id);
    } catch {
      set({ notes: oldNotes });
    }
  },

  // Dọn sạch toàn bộ Trash
  emptyTrashAction: async () => {
    const oldNotes = get().notes;
    if (oldNotes.length === 0) return;
    set({ notes: [] });
    try {
      await Promise.all(oldNotes.map(n => deleteNotePermanently(n.id)));
      // Xóa reminder của tất cả note trong trash
      await Promise.all(oldNotes.map(n => deleteRemindersForNote(n.id)));
    } catch {
      set({ notes: oldNotes });
    }
  },

  saveNoteAction: async (cleanNote) => {
    const isNewNote = cleanNote.id.startsWith('temp-');
    const currentNotes = get().notes;

    try {
      if (isNewNote) {
        set({ notes: [cleanNote, ...currentNotes] });
        const createdNote = cleanNote.type === 'text'
          ? await createNoteText(cleanNote)
          : await createNoteTodo(cleanNote);
        set((state) => ({
          notes: state.notes.map(n => n.id === cleanNote.id ? createdNote : n),
        }));
      } else {
        const oldNote = currentNotes.find(n => n.id === cleanNote.id);

        // Trường hợp đặc biệt: ghim note từ màn Archive → unarchive luôn (giống GG Keep)
        const isPinningFromArchive =
          (oldNote?.is_archived === 1 || cleanNote.is_archived === 1) &&
          (oldNote?.is_pinned ?? 0) !== (cleanNote.is_pinned ?? 0) &&
          cleanNote.is_pinned === 1;

        if (isPinningFromArchive) {
          // Optimistic: xóa khỏi danh sách Archive ngay
          set({ notes: currentNotes.filter(n => n.id !== cleanNote.id) });
          await updateNote(cleanNote.id, cleanNote);
          await togglePinNote(cleanNote.id);
          await toggleArchiveNote(cleanNote.id);
          return;
        }

        // Flow thông thường
        set({ notes: currentNotes.map(n => n.id === cleanNote.id ? cleanNote : n) });
        if (oldNote && oldNote.is_pinned !== cleanNote.is_pinned) {
          await togglePinNote(cleanNote.id);
        }
        await updateNote(cleanNote.id, cleanNote);
      }
    } catch (error) {
      console.error('Lỗi saveNoteAction:', error);
      set({ notes: currentNotes });
    }
  },

  // --- UI ---
  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),
  editorVisible: false,
  editorMode: 'text',
  editingNote: undefined,

  openCreateText: () => set({ editorVisible: true, editorMode: 'text', editingNote: undefined }),
  openCreateTodo: () => set({ editorVisible: true, editorMode: 'todo', editingNote: undefined }),
  openEditNote: (note) => set({ editorVisible: true, editorMode: note.type, editingNote: note }),
  closeEditor: () => set({ editorVisible: false, editingNote: undefined }),

  // --- TAGS ---
  allTags: ['ehr', 'g', 'gse'],
  noteTagsMap: {},
  addTagToSystem: async (rawTag) => {
    const tag = normalizeTag(rawTag);
    if (!tag) return;
    const previousTags = get().allTags;
    if (previousTags.includes(tag)) return;
    set({ allTags: [...previousTags, tag] });
    try {
      // await api.createTag({ name: tag });
    } catch {
      set({ allTags: previousTags });
    }
  },

  updateNoteTags: async (noteId, tags) => {
    const normalizedTags = uniqueTags(tags);
    const previousNoteTags = get().noteTagsMap[noteId] ?? [];
    const previousSystemTags = get().allTags;
    const mergedSystemTags = uniqueTags([...previousSystemTags, ...normalizedTags]);
    set((state) => ({
      allTags: mergedSystemTags,
      noteTagsMap: { ...state.noteTagsMap, [noteId]: normalizedTags },
    }));
    try {
      // await api.updateNoteTags(noteId, normalizedTags);
    } catch {
      set((state) => ({
        allTags: previousSystemTags,
        noteTagsMap: { ...state.noteTagsMap, [noteId]: previousNoteTags },
      }));
    }
  },

  // --- BATCH ---
  batchPinAction: async (ids) => {
    if (ids.length === 0) return;
    const oldNotes = get().notes;
    const pinnedCount = oldNotes.filter(n => ids.includes(n.id) && n.is_pinned).length;
    const targetPin = pinnedCount === ids.length ? 0 : 1;
    set({ notes: oldNotes.map(n => ids.includes(n.id) ? { ...n, is_pinned: targetPin } : n) });
    try {
      await Promise.all(ids.map(id => togglePinNote(id)));
    } catch {
      set({ notes: oldNotes });
    }
  },

  batchArchiveAction: async (ids) => {
    if (ids.length === 0) return;
    const oldNotes = get().notes;
    const pinnedIds = oldNotes.filter(n => ids.includes(n.id) && n.is_pinned === 1).map(n => n.id);
    set({ notes: oldNotes.filter(n => !ids.includes(n.id)) });
    try {
      if (pinnedIds.length > 0) await Promise.all(pinnedIds.map(id => togglePinNote(id)));
      await Promise.all(ids.map(id => toggleArchiveNote(id)));
    } catch {
      set({ notes: oldNotes });
    }
  },

  batchTrashAction: async (ids) => {
    if (ids.length === 0) return;
    const oldNotes = get().notes;
    set({ notes: oldNotes.filter(n => !ids.includes(n.id)) });
    try {
      await Promise.all(ids.map(id => trashNote(id)));
      ids.forEach(id => deleteRemindersForNote(id));
    } catch {
      set({ notes: oldNotes });
    }
  },

  batchColorAction: async (ids, color) => {
    if (ids.length === 0) return;
    const oldNotes = get().notes;
    set({ notes: oldNotes.map(n => ids.includes(n.id) ? { ...n, color } : n) });
    try {
      await Promise.all(ids.map(id => updateNote(id, { color })));
    } catch {
      set({ notes: oldNotes });
    }
  },
}));