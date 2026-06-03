import { create } from 'zustand';
import {
  NotificationData,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from 'src/api/notificationApi';

interface NotificationStore {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  loadNotifications: () => Promise<void>;
  readNotificationAction: (id: string) => Promise<void>;
  readAllNotificationsAction: () => Promise<void>;
  deleteNotificationAction: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  loadNotifications: async () => {
    set({ loading: true });
    try {
      const res = await fetchNotifications() as any;
      const dataArray = res && Array.isArray(res.results) ? res.results : [];
      const unread = dataArray.filter((n: any) => n.is_read === 0).length;
      
      set({ notifications: dataArray, unreadCount: unread });
    } catch (err) {
      console.error('Lỗi load thông báo:', err);
    } finally {
      set({ loading: false });
    }
  },

  readNotificationAction: async (id) => {
    // Optimistic UI update
    set(state => {
      const updated = state.notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n);
      return { notifications: updated, unreadCount: Math.max(0, state.unreadCount - 1) };
    });
    try {
      await markNotificationRead(id);
    } catch {
      await get().loadNotifications(); // Rollback nếu lỗi
    }
  },

  readAllNotificationsAction: async () => {
    set({ notifications: get().notifications.map(n => ({ ...n, is_read: 1 })), unreadCount: 0 });
    try {
      await markAllNotificationsRead();
    } catch {
      await get().loadNotifications();
    }
  },

  deleteNotificationAction: async (id) => {
    const backup = get().notifications;
    set(state => {
      const filtered = state.notifications.filter(n => n.id !== id);
      const unread = filtered.filter(n => n.is_read === 0).length;
      return { notifications: filtered, unreadCount: unread };
    });
    try {
      await deleteNotification(id);
    } catch {
      set({ notifications: backup, unreadCount: backup.filter(n => n.is_read === 0).length });
    }
  },
}));
