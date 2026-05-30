// ─── 1a. src/api/notificationApi.ts ───
import axiosClient from './axiosClient';

export interface NotificationData {
  id: string;
  user: string;
  type: 'reminder' | 'shared_note' | 'note_updated' | 'system';
  note: string | null;
  payload: {
    note_title?: string;
    message?: string;
    [key: string]: any;
  } | null;
  is_read: number; // Backend trả về IntegerField (0 hoặc 1)
  created_at: string;
}

export const fetchNotifications = (): Promise<NotificationData[]> =>
  axiosClient.get('/notifications/').then(res => res.data);

export const markNotificationRead = (id: string): Promise<NotificationData> =>
  axiosClient.put(`/notifications/${id}/read/`).then(res => res.data);

export const markAllNotificationsRead = (): Promise<{ message: string }> =>
  axiosClient.put('/notifications/read-all/').then(res => res.data);

export const deleteNotification = (id: string): Promise<void> =>
  axiosClient.delete(`/notifications/${id}/`).then(res => res.data);