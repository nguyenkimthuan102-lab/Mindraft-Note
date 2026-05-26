// src/store/useSelectionStore.ts
import { create } from 'zustand';
import { useNoteStore } from './useNoteStore';
import { trashNote, toggleArchiveNote } from '../api/noteApi';

interface SelectionState {
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  batchTrash: () => Promise<void>;
  batchArchive: () => Promise<void>;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: [],
  toggleSelect: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter((i) => i !== id)
      : [...state.selectedIds, id]
  })),
  clearSelection: () => set({ selectedIds: [] }),

  batchTrash: async () => {
    const ids = get().selectedIds;
    if (ids.length === 0) return;
    const { notes, setNotes } = useNoteStore.getState();
    const oldNotes = notes;

    setNotes(oldNotes.filter(n => !ids.includes(n.id)));
    set({ selectedIds: [] });

    try {
      await Promise.all(ids.map(id => trashNote(id)));
    } catch {
      setNotes(oldNotes);
    }
  },

  batchArchive: async () => {
    const ids = get().selectedIds;
    if (ids.length === 0) return;
    const { notes, setNotes } = useNoteStore.getState();
    const oldNotes = notes;

    setNotes(oldNotes.filter(n => !ids.includes(n.id)));
    set({ selectedIds: [] });

    try {
      await Promise.all(ids.map(id => toggleArchiveNote(id)));
    } catch {
      setNotes(oldNotes);
    }
  }
}));