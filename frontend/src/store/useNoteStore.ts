import { create } from 'zustand';
import type { NoteCardData } from '../components/notes/NoteCard';

type ViewMode = 'grid' | 'list';
type EditorMode = 'text' | 'todo';
// Bổ sung các type mới cho Settings
type ThemeMode = 'light' | 'dark' | 'system';
type SortMode = 'updated' | 'created' | 'custom';

interface NoteUIState {
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

  // --- PHẦN BỔ SUNG CHO SETTINGS ---
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  sortBy: SortMode;
  setSortBy: (sort: SortMode) => void;

  notifications: {
    app: boolean;
    reminders: boolean;
    collaboration: boolean;
  };
  toggleNotification: (key: keyof NoteUIState['notifications']) => void;
  // ---------------------------------
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

export const useNoteStore = create<NoteUIState>((set, get) => ({
  // Logic cũ giữ nguyên
  viewMode: 'list',

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  editorVisible: false,
  editorMode: 'text',
  editingNote: undefined,

  openCreateText: () =>
    set({
      editorVisible: true,
      editorMode: 'text',
      editingNote: undefined,
    }),

  openCreateTodo: () =>
    set({
      editorVisible: true,
      editorMode: 'todo',
      editingNote: undefined,
    }),

  openEditNote: (note) =>
    set({
      editorVisible: true,
      editorMode: note.type,
      editingNote: note,
    }),

  closeEditor: () =>
    set({
      editorVisible: false,
      editingNote: undefined,
    }),

  allTags: ['ehr', 'g', 'gse'],
  noteTagsMap: {},

  addTagToSystem: async (rawTag) => {
    const tag = normalizeTag(rawTag);
    if (!tag) return;

    const previousTags = get().allTags;

    if (previousTags.includes(tag)) {
      return;
    }

    set({
      allTags: [...previousTags, tag],
    });

    try {
      // TODO: gọi API backend
    } catch (error) {
      set({
        allTags: previousTags,
      });
      throw error;
    }
  },

  updateNoteTags: async (noteId, tags) => {
    const normalizedTags = uniqueTags(tags);
    const previousNoteTags = get().noteTagsMap[noteId] ?? [];
    const previousSystemTags = get().allTags;

    const mergedSystemTags = uniqueTags([
      ...previousSystemTags,
      ...normalizedTags,
    ]);

    set((state) => ({
      allTags: mergedSystemTags,
      noteTagsMap: {
        ...state.noteTagsMap,
        [noteId]: normalizedTags,
      },
    }));

    try {
      // TODO: gọi API backend
    } catch (error) {
      set((state) => ({
        allTags: previousSystemTags,
        noteTagsMap: {
          ...state.noteTagsMap,
          [noteId]: previousNoteTags,
        },
      }));
      throw error;
    }
  },

  // --- TRIỂN KHAI PHẦN BỔ SUNG ---
  theme: 'light',
  setTheme: (theme) => set({ theme }),

  sortBy: 'updated',
  setSortBy: (sort) => set({ sortBy: sort }),

  notifications: {
    app: true,
    reminders: true,
    collaboration: true,
  },
  toggleNotification: (key) =>
    set((state) => ({
      notifications: {
        ...state.notifications,
        [key]: !state.notifications[key],
      },
    })),
  // ---------------------------------
}));