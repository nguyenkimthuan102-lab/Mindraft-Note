import { create } from 'zustand';
import type { NoteCardData } from '../components/notes/NoteCard';

interface SelectionState {
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  clearSelection: () => void;

  batchUpdate?: (changes: Partial<NoteCardData>) => void;
  batchDelete?: () => void;
  batchArchive?: () => void;
  setHandlers: (handlers: {
    batchUpdate: (changes: Partial<NoteCardData>) => void;
    batchDelete: () => void;
    batchArchive: () => void;
  }) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: [],
  toggleSelect: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter((i) => i !== id)
      : [...state.selectedIds, id]
  })),
  clearSelection: () => set({ selectedIds: [] }),
  setHandlers: (handlers) => set(handlers),
}));