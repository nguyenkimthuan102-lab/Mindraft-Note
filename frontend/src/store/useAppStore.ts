import { create } from 'zustand';
import { Platform } from 'react-native';
import { db } from '../services/database/database';
import api from '../api/axiosClient';
import { Tag, getTags } from '../api/tagApi';


// ── Sort types ──────────────────────────────────────────────
export type SortField = 'updated_at' | 'created_at' | 'custom';
export type SortDirection = 'asc' | 'desc';
export type ThemeType = 'light' | 'dark' | 'system'; // Thêm kiểu dữ liệu theme

export interface SortOption { field: SortField; direction: SortDirection; }
export const DEFAULT_SORT: SortOption = { field: 'updated_at', direction: 'desc' };

interface AppState {
  viewMode: 'list' | 'grid';
  theme: ThemeType; // Thêm trạng thái theme vào store
  isSidebarOpen: boolean;
  sort: SortOption;  
  initSettings: () => Promise<void>;
  setViewMode: (mode: 'list' | 'grid') => void;
  setTheme: (theme: ThemeType) => void; // Thêm action đổi theme
  setSort: (s: SortOption) => void;         
  toggleSidebar: () => void;
  tags: Tag[];
  fetchTags: () => Promise<void>;
  setTags: (tags: Tag[]) => void;
  // ── Lọc note theo tag (sidebar click) ────────────────────────────────────
  selectedTagId: string | null;
  setSelectedTagId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: 'grid',
  theme: 'light', // Mặc định là sáng
  isSidebarOpen: false,
  sort: DEFAULT_SORT,

  initSettings: async () => {
    if (Platform.OS === 'web') {
      try {
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
    }
  },

  tags: [],
  selectedTagId: null,

  fetchTags: async () => {
    try {
      const data = await getTags();
      set({ tags: data });
    } catch (error) {
      console.error("Lỗi lấy danh sách nhãn:", error);
    }
  },

  setTags: (tags) => set({ tags }),

  // ── Khi click tag trên sidebar → cập nhật filter ─────────────────────────
  setSelectedTagId: (id) => set({ selectedTagId: id }),

  setViewMode: (mode) => {
    set({ viewMode: mode });
    if (Platform.OS === 'web') {
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

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));