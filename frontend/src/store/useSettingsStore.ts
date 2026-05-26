// src/store/useSettingsStore.ts
import { create } from 'zustand';
import api from '../api/axiosClient'; // Instance axios đã gắn Authorization header tự động
import { useAppStore } from './useAppStore'; // Sync sang runtime store để NoteList, Header... đọc đúng

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ThemeType     = 'light' | 'dark' | 'system';
export type ViewMode      = 'grid'  | 'list';
export type SortField     = 'updated_at' | 'created_at' | 'custom';
export type SortDirection = 'asc'   | 'desc';

export interface SortOption {
  field:     SortField;
  direction: SortDirection;
}

/** Kiểu dữ liệu backend trả về (snake_case, integer cho boolean, CHỮ HOA cho enum view) */
interface BackendSettings {
  theme:                 string; // 'light' | 'dark' | 'system'
  notifications_enabled: number; // 0 | 1
  notify_reminder:       number; // 0 | 1
  notify_collaboration:  number; // 0 | 1
  default_note_view:     string; // 'GRID' | 'LIST'
  sort_by:               string; // 'updated_at' | 'created_at' | 'custom'
}

interface SettingsState {
  /** true sau khi fetch server lần đầu thành công (hoặc thất bại) — dùng để chặn render sớm */
  isLoaded: boolean;

  // ── Giá trị cài đặt ─────────────────────────────────────────────────────────
  theme:    ThemeType;
  viewMode: ViewMode;
  sort:     SortOption;
  notifications: {
    reminders:     boolean;
    collaboration: boolean;
  };

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Gọi GET /users/me/settings khi app mount.
   * Nạp cài đặt từ server và đồng bộ sang useAppStore.
   * Chỉ gọi khi user đã đăng nhập (có access_token).
   */
  loadSettings: () => Promise<void>;

  /** Đổi theme: optimistic update → PATCH API → rollback nếu lỗi */
  updateTheme: (theme: ThemeType) => Promise<void>;

  /** Đổi chế độ xem: optimistic update → PATCH API → rollback nếu lỗi */
  updateViewMode: (mode: ViewMode) => Promise<void>;

  /** Đổi sắp xếp: optimistic update → PATCH API → rollback nếu lỗi */
  updateSort: (sort: SortOption) => Promise<void>;

  /** Toggle thông báo: optimistic update → PATCH API → rollback nếu lỗi */
  toggleNotification: (key: 'reminders' | 'collaboration') => Promise<void>;

  /**
   * Reset toàn bộ state về giá trị mặc định.
   * Gọi khi user đăng xuất để tránh rò rỉ dữ liệu sang session mới.
   */
  resetSettings: () => void;

  /** Giữ lại để tương thích với code cũ đang dùng updateSettings trực tiếp */
  updateSettings: (patch: Partial<SettingsState>) => void;
}

// ─── Default state (dùng lại ở resetSettings) ──────────────────────────────────

const DEFAULT_STATE = {
  isLoaded: false,
  theme:    'light'       as ThemeType,
  viewMode: 'grid'        as ViewMode,
  sort:     { field: 'updated_at' as SortField, direction: 'desc' as SortDirection },
  notifications: { reminders: true, collaboration: true },
};

// ─── Helpers map dữ liệu ───────────────────────────────────────────────────────

/**
 * Backend → Frontend
 * - 'GRID' / 'LIST' → 'grid' / 'list'
 * - 1 / 0 → true / false
 * - direction mặc định 'desc' (backend không lưu)
 */
function fromBackend(
  data: BackendSettings,
): Pick<SettingsState, 'theme' | 'viewMode' | 'sort' | 'notifications'> {
  return {
    theme:    data.theme as ThemeType,
    viewMode: data.default_note_view.toLowerCase() as ViewMode,
    sort: {
      field:     data.sort_by as SortField,
      direction: 'desc',
    },
    notifications: {
      reminders:     data.notify_reminder     === 1,
      collaboration: data.notify_collaboration === 1,
    },
  };
}

/**
 * Đồng bộ giá trị vừa load/update sang useAppStore
 * để NoteList, Header và các màn hình khác nhận diện đúng.
 */
function syncToAppStore(mapped: ReturnType<typeof fromBackend>) {
  const appStore = useAppStore.getState();
  appStore.setTheme(mapped.theme);
  appStore.setViewMode(mapped.viewMode);
  appStore.setSort(mapped.sort);
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_STATE,

  // ── Load settings khi app khởi động ─────────────────────────────────────────
  loadSettings: async () => {
    try {
      const res    = await api.get('/users/me/settings');
      const mapped = fromBackend(res.data.data as BackendSettings);

      set({ ...mapped, isLoaded: true });
      syncToAppStore(mapped);
    } catch (e: any) {
      // Đánh dấu đã load xong trong mọi trường hợp
      set({ isLoaded: true });

      // Lỗi 401 sau khi interceptor đã thử refresh → session hết hạn thật sự.
      // Re-throw để _layout.tsx biết cần redirect về login.
      // Lỗi mạng (network error, timeout, 5xx) → nuốt, user vẫn ở lại app
      // với settings mặc định.
      const httpStatus = e?.response?.status;
      if (httpStatus === 401) {
        console.error('[useSettingsStore] Session hết hạn, cần đăng nhập lại.');
        throw e;
      }

      console.error('[useSettingsStore] Lỗi tải settings (không phải auth):', e);
    }
  },

  // ── Đổi theme ────────────────────────────────────────────────────────────────
  updateTheme: async (theme) => {
    const prev = get().theme;

    // 1. Cập nhật UI ngay lập tức (optimistic)
    set({ theme });
    useAppStore.getState().setTheme(theme);

    try {
      // Backend nhận đúng snake_case, giá trị hợp lệ: "light" | "dark" | "system"
      await api.patch('/users/me/settings', { theme });
    } catch (e) {
      // 2. Rollback nếu API lỗi
      set({ theme: prev });
      useAppStore.getState().setTheme(prev);
      console.error('[useSettingsStore] Lỗi lưu theme:', e);
      throw e; // Re-throw để UI có thể hiển thị toast lỗi nếu cần
    }
  },

  // ── Đổi chế độ xem ───────────────────────────────────────────────────────────
  updateViewMode: async (mode) => {
    const prev = get().viewMode;

    set({ viewMode: mode });
    useAppStore.getState().setViewMode(mode);

    try {
      // Backend yêu cầu CHỮ HOA: 'grid' → 'GRID', 'list' → 'LIST'
      await api.patch('/users/me/settings', {
        default_note_view: mode.toUpperCase(),
      });
    } catch (e) {
      set({ viewMode: prev });
      useAppStore.getState().setViewMode(prev);
      console.error('[useSettingsStore] Lỗi lưu viewMode:', e);
      throw e;
    }
  },

  // ── Đổi sắp xếp ──────────────────────────────────────────────────────────────
  updateSort: async (sort) => {
    const prev = get().sort;

    set({ sort });
    useAppStore.getState().setSort(sort);

    try {
      // Backend chỉ lưu field, không lưu direction
      await api.patch('/users/me/settings', { sort_by: sort.field });
    } catch (e) {
      set({ sort: prev });
      useAppStore.getState().setSort(prev);
      console.error('[useSettingsStore] Lỗi lưu sort:', e);
      throw e;
    }
  },

  // ── Toggle thông báo ──────────────────────────────────────────────────────────
  toggleNotification: async (key) => {
    const prev     = get().notifications;
    const newValue = !prev[key];
    const newNotifs = { ...prev, [key]: newValue };

    set({ notifications: newNotifs });

    // Map tên field frontend → backend
    const backendField =
      key === 'reminders' ? 'notify_reminder' : 'notify_collaboration';

    try {
      // boolean → integer: true → 1, false → 0
      await api.patch('/users/me/settings', {
        [backendField]: newValue ? 1 : 0,
      });
    } catch (e) {
      set({ notifications: prev });
      console.error('[useSettingsStore] Lỗi lưu notification:', e);
      throw e;
    }
  },

  // ── Reset về mặc định khi logout ─────────────────────────────────────────────
  resetSettings: () => set({ ...DEFAULT_STATE }),

  // ── Tương thích ngược với code cũ ────────────────────────────────────────────
  updateSettings: (patch) => set((state) => ({ ...state, ...patch })),
}));