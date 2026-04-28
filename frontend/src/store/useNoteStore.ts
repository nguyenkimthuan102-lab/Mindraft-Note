import { create } from 'zustand';

interface NoteUIState {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

export const useNoteStore = create<NoteUIState>((set) => ({
  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),
}));