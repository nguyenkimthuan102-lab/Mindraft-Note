import { create } from 'zustand';
import { Platform } from 'react-native';
import { db } from '../api/database';
import api from '../api/axiosInstance'; // Giả định bạn có axios instance

interface AppState {
  viewMode: 'list' | 'grid';
  isSidebarOpen: boolean;
  initSettings: () => Promise<void>;
  setViewMode: (mode: 'list' | 'grid') => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: 'grid',
  isSidebarOpen: false,

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

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));