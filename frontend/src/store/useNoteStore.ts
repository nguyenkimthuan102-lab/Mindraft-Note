import { create } from 'zustand';
import type { NoteCardData } from '../components/notes/NoteCard';
import { getTags, createTag, addTagToNote, removeTagFromNote, type Tag } from '../api/tagApi';
import { useAppStore } from './useAppStore';

type ViewMode = 'grid' | 'list';
type EditorMode = 'text' | 'todo';

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

  allTags: string[];           // tên tag — giữ nguyên cho TagMenu tương thích
  allTagObjects: Tag[];        // tag đầy đủ {id, name} để gọi API
  tagIdByName: Record<string, string>; // name → id mapping
  noteTagsMap: Record<string, string[]>;

  loadTagsFromServer: () => Promise<void>;
  addTagToSystem: (tag: string) => Promise<void>;
  updateNoteTags: (noteId: string, tags: string[]) => Promise<void>;
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

  allTags: [],
  allTagObjects: [],
  tagIdByName: {},
  noteTagsMap: {},

  // fetch tất cả tags từ server (gọi khi app mount)
  loadTagsFromServer: async () => {
    try {
      const serverTags = await getTags();
      const names = serverTags.map((t: Tag) => t.name);
      const idByName: Record<string, string> = {};
      serverTags.forEach((t: Tag) => { idByName[t.name] = t.id; });
      set({
        allTagObjects: serverTags,
        allTags: names,
        tagIdByName: idByName,
      });
      // Đồng bộ sang AppStore để Sidebar hiển thị đúng
      useAppStore.getState().setTags(serverTags);
    } catch {
      // giữ nguyên state nếu lỗi
    }
  },

  addTagToSystem: async (rawTag) => {
    const tag = normalizeTag(rawTag);
    if (!tag) return;

    const previousTags = get().allTags;
    const previousObjects = get().allTagObjects;
    const previousIdByName = get().tagIdByName;

    if (previousTags.includes(tag)) {
      return;
    }

    // Optimistic: thêm tạm vào list
    set({
      allTags: [...previousTags, tag],
    });

    try {
      const created = await createTag(tag);
      const newIdByName = { ...get().tagIdByName, [created.name]: created.id };
      const newTagObjects = [...get().allTagObjects, created];
      set({
        allTagObjects: newTagObjects,
        tagIdByName: newIdByName,
        allTags: get().allTags.map(t => t === tag ? created.name : t),
      });
      // ✅ Sync sang AppStore để Sidebar tự động cập nhật tag mới
      useAppStore.getState().setTags(newTagObjects);
    } catch (error) {
      set({
        allTags: previousTags,
        allTagObjects: previousObjects,
        tagIdByName: previousIdByName,
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
      const tagIdByName = get().tagIdByName;

      const toAdd = normalizedTags.filter(t => !previousNoteTags.includes(t));
      const toRemove = previousNoteTags.filter(t => !normalizedTags.includes(t));

      await Promise.all([
        ...toAdd.map(name => {
          const tagId = tagIdByName[name];
          return tagId ? addTagToNote(noteId, tagId) : Promise.resolve();
        }),
        ...toRemove.map(name => {
          const tagId = tagIdByName[name];
          return tagId ? removeTagFromNote(noteId, tagId) : Promise.resolve();
        }),
      ]);
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
}));