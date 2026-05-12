import { create } from 'zustand';
import { Platform } from 'react-native';
import { db } from '../services/database/database';
import api from '../api/axiosClient';

// ── Sort types ──────────────────────────────────────────────
export type SortField = 'updated_at' | 'created_at' | 'custom';
export type SortDirection = 'asc' | 'desc';
<<<<<<< HEAD
export type ThemeType = 'light' | 'dark' | 'system'; // Thêm kiểu dữ liệu theme

=======
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
export interface SortOption { field: SortField; direction: SortDirection; }
export const DEFAULT_SORT: SortOption = { field: 'updated_at', direction: 'desc' };

interface AppState {
  viewMode: 'list' | 'grid';
<<<<<<< HEAD
  theme: ThemeType; // Thêm trạng thái theme vào store
=======
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
  isSidebarOpen: boolean;
  sort: SortOption;  
  initSettings: () => Promise<void>;
  setViewMode: (mode: 'list' | 'grid') => void;
<<<<<<< HEAD
  setTheme: (theme: ThemeType) => void; // Thêm action đổi theme
=======
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
  setSort: (s: SortOption) => void;         
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: 'grid',
<<<<<<< HEAD
  theme: 'light', // Mặc định là sáng
=======
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
  isSidebarOpen: false,
  sort: DEFAULT_SORT,

  initSettings: async () => {
    if (Platform.OS === 'web') {
      try {
<<<<<<< HEAD
        // Sau này bạn có thể mở comment để lấy từ backend Django
        // const response = await api.get('/user/settings/');
        // set({ 
        //   viewMode: response.data.view_mode || 'grid',
        //   theme: response.data.theme || 'light' 
        // });
      } catch (e) {
        console.error("Lỗi xác thực hoặc kết nối:", e);
      }
    } else {
      // Lấy cấu hình từ SQLite cho Mobile
      const modeResult = db?.getFirstSync<{value: string}>("SELECT value FROM Settings WHERE key='viewMode'");
      const themeResult = db?.getFirstSync<{value: string}>("SELECT value FROM Settings WHERE key='theme'");
      
      if (modeResult) set({ viewMode: modeResult.value as 'list' | 'grid' });
      if (themeResult) set({ theme: themeResult.value as ThemeType });
=======
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
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
    }
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
    if (Platform.OS === 'web') {
<<<<<<< HEAD
      // api.patch('/user/settings/', { view_mode: mode }).catch(console.error);
    } 
    // Lưu vào SQLite
    db?.runAsync("INSERT OR REPLACE INTO Settings (key, value) VALUES ('viewMode', ?)", [mode]);
  },

  setTheme: (theme) => {
    set({ theme });
    if (Platform.OS === 'web') {
      // api.patch('/user/settings/', { theme: theme }).catch(console.error);
    }
    // Lưu trạng thái theme vào SQLite
    db?.runAsync("INSERT OR REPLACE INTO Settings (key, value) VALUES ('theme', ?)", [theme]);
  },

  setSort: (sort) => {
    set({ sort });
    // Có thể lưu sort vào DB tương tự như viewMode nếu muốn
    db?.runAsync("INSERT OR REPLACE INTO Settings (key, value) VALUES ('sortBy', ?)", [sort.field]);
  }, 
=======
      // Đồng bộ trực tiếp lên Server khi có mạng
      //api.patch('/user/settings/', { view_mode: mode }).catch(console.error);
    //} else {
      db?.runAsync("INSERT OR REPLACE INTO Settings (key, value) VALUES ('viewMode', ?)", [mode]);
    }
  },

  setSort: (sort) => set({ sort }), 
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));