import { create } from 'zustand';

type SyncStatus = 'idle' | 'syncing' | 'done' | 'error';

interface SyncState {
  status: SyncStatus;
  setSyncing: () => void;
  setDone: () => void;
  setError: () => void;
  setIdle: () => void; // ← thêm
} 


export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  setSyncing: () => set({ status: 'syncing' }),
  setDone: () => set({ status: 'done' }),
  setError: () => set({ status: 'error' }),
  setIdle: () => set({ status: 'idle' }), // ← thêm
}));