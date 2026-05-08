import { create } from 'zustand';

interface NoteState {
  notes: any[];
  setNotes: (notes: any[]) => void;
  
  editorVisible: boolean;
  editorMode: 'text' | 'todo';
  editingNote: any | null;

  viewMode: 'grid' | 'list';
  activeFilter: string;

  openCreateText: () => void;
  openCreateTodo: () => void;
  openEditNote: (note: any) => void;
  closeEditor: () => void;
  
  addNote: (note: any) => void;
  updateNote: (id: string, changes: any) => void;
  deleteNote: (id: string) => void;
  
  setViewMode: (mode: 'grid' | 'list') => void;
  setActiveFilter: (filter: string) => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  editorVisible: false,
  editorMode: 'text',
  editingNote: null,
  viewMode: 'grid',
  activeFilter: 'all',

  setNotes: (notes) => set({ notes }),

  openCreateText: () => set({ editorVisible: true, editorMode: 'text', editingNote: null }),

  openCreateTodo: () => set({ editorVisible: true, editorMode: 'todo', editingNote: null }),

  openEditNote: (note) => set({ 
    editorVisible: true, 
    editorMode: (note.type as 'text' | 'todo') || 'text', 
    editingNote: note 
  }),

  closeEditor: () => set({ editorVisible: false, editingNote: null }),

  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),

  updateNote: (id, changes) => set((state) => ({
    notes: state.notes.map((n) => (n.id === id ? { ...n, ...changes } : n)),
  })),

  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id)
  })),

  setViewMode: (mode) => set({ viewMode: mode }),

  setActiveFilter: (filter) => set({ activeFilter: filter }),
}));