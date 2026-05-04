import { create } from 'zustand';
import type { NoteCardData } from '../components/notes/NoteCard';

interface NoteUIState {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  editorVisible: boolean;
  editorMode: 'text' | 'todo';
  editingNote?: NoteCardData;
  openCreateText: () => void;
  openCreateTodo: () => void;
  openEditNote: (note: NoteCardData) => void;
  closeEditor: () => void;
}

export const useNoteStore = create<NoteUIState>((set) => ({
  viewMode: 'list',
  editorVisible: false,
  editorMode: 'text',
  editingNote: undefined,
  setViewMode: (mode) => set({ viewMode: mode }),
  openCreateText: () => set({ editorVisible: true, editorMode: 'text', editingNote: undefined }),
  openCreateTodo: () => set({ editorVisible: true, editorMode: 'todo', editingNote: undefined }),
  openEditNote: (note) => set({ editorVisible: true, editorMode: note.type, editingNote: note }),
  closeEditor: () => set({ editorVisible: false, editingNote: undefined }),
}));
