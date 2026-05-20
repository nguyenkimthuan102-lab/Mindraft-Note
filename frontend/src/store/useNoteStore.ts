// src/store/useNoteStore.ts
import { create } from 'zustand';
import type { NoteCardData } from '../components/notes/NoteCard';
import {
  fetchNotes,
  createNote,
  pinNote,
  archiveNote,
  trashNote,
  quickUpdateNote,
  type FetchNotesParams,
  type CreateNotePayload,
  type QuickUpdatePayload,
} from '../api/noteApi';

type ViewMode  = 'grid' | 'list';
type EditorMode = 'text' | 'todo';

// ─────────────────────────────────────────────────────────────────────
// Helper: chuyển boolean → 0 | 1 trước khi gửi lên Backend
// ─────────────────────────────────────────────────────────────────────
function boolToInt(val: boolean | undefined): 0 | 1 | undefined {
  if (val === undefined) return undefined;
  return val ? 1 : 0;
}

// ─────────────────────────────────────────────────────────────────────
// Helper: build QuickUpdatePayload từ Partial<NoteCardData>
// NoteCardData dùng boolean, QuickUpdatePayload dùng 0 | 1
// ─────────────────────────────────────────────────────────────────────
function toQuickUpdatePayload(changes: Partial<NoteCardData>): QuickUpdatePayload {
  const payload: QuickUpdatePayload = {};

  if (changes.title       !== undefined) payload.title        = changes.title;
  if (changes.content_text !== undefined) payload.content_text = changes.content_text;
  if (changes.color       !== undefined) payload.color        = changes.color;

  const pinned    = boolToInt(changes.is_pinned);
  const archived  = boolToInt(changes.is_archived);
  const trashed   = boolToInt(changes.is_trashed);

  if (pinned   !== undefined) payload.is_pinned   = pinned;
  if (archived !== undefined) payload.is_archived = archived;
  if (trashed  !== undefined) payload.is_trashed  = trashed;

  payload.client_updated_at = new Date().toISOString();

  return payload;
}

// ─────────────────────────────────────────────────────────────────────
// Store interface
// ─────────────────────────────────────────────────────────────────────
interface NoteUIState {
  notes:     NoteCardData[];
  isLoading: boolean;

  loadNotes:   (params?: FetchNotesParams) => Promise<void>;
  togglePin:   (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  trashNote:   (id: string) => Promise<void>;
  quickUpdate: (id: string, changes: Partial<NoteCardData>) => Promise<void>;
  addNote:     (payload: CreateNotePayload) => Promise<NoteCardData>;

  viewMode:    ViewMode;
  setViewMode: (mode: ViewMode) => void;

  editorVisible: boolean;
  editorMode:    EditorMode;
  editingNote?:  NoteCardData;

  openCreateText: () => void;
  openCreateTodo: () => void;
  openEditNote:   (note: NoteCardData) => void;
  closeEditor:    () => void;

  allTags:        string[];
  noteTagsMap:    Record<string, string[]>;
  addTagToSystem: (tag: string) => Promise<void>;
  updateNoteTags: (noteId: string, tags: string[]) => Promise<void>;
}

const normalizeTag  = (tag: string) => tag.trim();
const uniqueTags    = (tags: string[]) => {
  const seen = new Set<string>();
  return tags.reduce<string[]>((acc, tag) => {
    const n = normalizeTag(tag);
    if (n && !seen.has(n)) { seen.add(n); acc.push(n); }
    return acc;
  }, []);
};

// ─────────────────────────────────────────────────────────────────────
// Store implementation
// ─────────────────────────────────────────────────────────────────────
export const useNoteStore = create<NoteUIState>((set, get) => ({
  notes:     [],
  isLoading: false,

  // ── Fetch ──────────────────────────────────────────────────────────
  loadNotes: async (params) => {
    set({ isLoading: true });
    try {
      // noteApi.fetchNotes đã normalizeNote rồi → boolean đúng
      const notes = await fetchNotes(params);
      set({ notes });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Pin (optimistic update) ────────────────────────────────────────
  togglePin: async (id) => {
    const prev = get().notes;

    // is_pinned đã là boolean sau khi normalize
    set({
      notes: prev.map(n => n.id === id ? { ...n, is_pinned: !n.is_pinned } : n),
    });

    try {
      const updated = await pinNote(id);   // backend trả về state mới, đã normalize
      set({
        notes: get().notes.map(n => n.id === id ? { ...n, ...updated } : n),
      });
    } catch {
      set({ notes: prev });
    }
  },

  // ── Archive (optimistic: xóa khỏi danh sách active) ───────────────
  archiveNote: async (id) => {
    const prev = get().notes;
    set({ notes: prev.filter(n => n.id !== id) });
    try {
      await archiveNote(id);
    } catch {
      set({ notes: prev });
    }
  },

  // ── Trash (optimistic: xóa khỏi danh sách) ────────────────────────
  trashNote: async (id) => {
    const prev = get().notes;
    set({ notes: prev.filter(n => n.id !== id) });
    try {
      await trashNote(id);
    } catch {
      set({ notes: prev });
    }
  },

  // ── Quick update (optimistic + sync từ server) ─────────────────────
  quickUpdate: async (id, changes) => {
    const prev = get().notes;

    // Cập nhật UI ngay với kiểu boolean
    set({
      notes: prev.map(n => n.id === id ? { ...n, ...changes } : n),
    });

    try {
      // Chuyển đổi sang payload 0/1 trước khi gửi lên Backend
      const payload = toQuickUpdatePayload(changes);
      const updated = await quickUpdateNote(id, payload);

      // Đồng bộ lại từ server (đã normalize về boolean)
      set({
        notes: get().notes.map(n => n.id === id ? { ...n, ...updated } : n),
      });
    } catch (error) {
      console.error('quickUpdate failed:', error);
      set({ notes: prev });
    }
  },

  // ── Add note (tạo mới, thêm lên đầu danh sách) ────────────────────
  addNote: async (payload) => {
    const note = await createNote(payload);   // đã normalize
    set({ notes: [note, ...get().notes] });
    return note;
  },

  // ─── Editor state ──────────────────────────────────────────────────
  viewMode:    'list',
  setViewMode: (mode) => set({ viewMode: mode }),

  editorVisible: false,
  editorMode:    'text',
  editingNote:   undefined,

  openCreateText: () => set({ editorVisible: true, editorMode: 'text',  editingNote: undefined }),
  openCreateTodo: () => set({ editorVisible: true, editorMode: 'todo',  editingNote: undefined }),
  openEditNote:   (note) => set({ editorVisible: true, editorMode: note.type, editingNote: note }),
  closeEditor:    () => set({ editorVisible: false, editingNote: undefined }),

  // ─── Tags ──────────────────────────────────────────────────────────
  allTags:     [],
  noteTagsMap: {},

  addTagToSystem: async (rawTag) => {
    const tag = normalizeTag(rawTag);
    if (!tag || get().allTags.includes(tag)) return;
    const prev = get().allTags;
    set({ allTags: [...prev, tag] });
    try {
      // TODO: await api.createTag({ name: tag });
    } catch {
      set({ allTags: prev });
    }
  },

  updateNoteTags: async (noteId, tags) => {
    const normalized      = uniqueTags(tags);
    const prevNoteTags    = get().noteTagsMap[noteId] ?? [];
    const prevSystemTags  = get().allTags;
    set((state) => ({
      allTags:     uniqueTags([...prevSystemTags, ...normalized]),
      noteTagsMap: { ...state.noteTagsMap, [noteId]: normalized },
    }));
    try {
      // TODO: await api.updateNoteTags(noteId, normalized);
    } catch {
      set((state) => ({
        allTags:     prevSystemTags,
        noteTagsMap: { ...state.noteTagsMap, [noteId]: prevNoteTags },
      }));
    }
  },
}));