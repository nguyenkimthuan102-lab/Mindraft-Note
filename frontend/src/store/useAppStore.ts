import { create } from 'zustand';
import { Platform } from 'react-native';
import { db } from '../services/database/database';
import api from '../api/axiosClient';

// ── Sort types ──────────────────────────────────────────────
export type SortField = 'updated_at' | 'created_at' | 'custom';
export type SortDirection = 'asc' | 'desc';
export interface SortOption { field: SortField; direction: SortDirection; }
export const DEFAULT_SORT: SortOption = { field: 'updated_at', direction: 'desc' };

interface AppState {
  viewMode: 'list' | 'grid';
  isSidebarOpen: boolean;
  sort: SortOption;  
  initSettings: () => Promise<void>;
  setViewMode: (mode: 'list' | 'grid') => void;
  setSort: (s: SortOption) => void;         
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: 'grid',
  isSidebarOpen: false,
  sort: DEFAULT_SORT,

  initSettings: async () => {
    if (Platform.OS === 'web') {
      try {
        // Gọi API lấy settings từ Django Backend
        //const response = await api.get('/user/settings/');
        //set({ viewMode: response.data.view_mode || 'grid' });
      } catch (e) {
        console.error("Mất mạng hoặc lỗi xác thực:", e);
      }
    } else {
      // Logic SQLite cho Mobile giữ nguyên
      const result = db?.getFirstSync<{value: string}>("SELECT value FROM Settings WHERE key='viewMode'");
      if (result) set({ viewMode: result.value as 'list' | 'grid' });
    }
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
    if (Platform.OS === 'web') {
      // Đồng bộ trực tiếp lên Server khi có mạng
      //api.patch('/user/settings/', { view_mode: mode }).catch(console.error);
    //} else {
      db?.runAsync("INSERT OR REPLACE INTO Settings (key, value) VALUES ('viewMode', ?)", [mode]);
    }
  },

  setSort: (sort) => set({ sort }), 

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));