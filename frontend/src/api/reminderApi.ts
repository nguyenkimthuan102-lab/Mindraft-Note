import axiosClient from './axiosClient';
import { Platform } from 'react-native';
import {
  scheduleWebNotification,
  cancelWebNotification,
} from '../hooks/webNotification';

export interface ReminderData {
  id: string;
  note: string;
  note_title?: string;
  note_color?: string;
  remind_at: string;
  repeat_type: 'none' | 'daily' | 'weekly' | 'monthly';
  is_notified: number;
  is_deleted: number;
  updated_at: string;
}

// ── Helper nội bộ: lên lịch thông báo tùy platform ───────────────────────
async function scheduleNotification(reminder: ReminderData, noteTitle: string) {
  const triggerDate = new Date(reminder.remind_at);
  if (triggerDate <= new Date()) return; // Đã qua → bỏ qua

  if (Platform.OS === 'web') {
    // Web: dùng Web Notification API (setTimeout)
    await scheduleWebNotification({
      id: reminder.id,
      title: '🔔 Nhắc nhở ghi chú',
      body: noteTitle,
      remindAt: triggerDate,
      noteId: reminder.note,
    });
  } else {
    // Mobile: dùng expo-notifications (lazy import tránh lỗi trên web)
    const Notifications = await import('expo-notifications');
    try {
      await Notifications.cancelScheduledNotificationAsync(reminder.id);
    } catch (_) {}

    let trigger: any;
    if (reminder.repeat_type === 'daily') {
      trigger = { hour: triggerDate.getHours(), minute: triggerDate.getMinutes(), repeats: true };
    } else if (reminder.repeat_type === 'weekly') {
      trigger = { weekday: triggerDate.getDay() + 1, hour: triggerDate.getHours(), minute: triggerDate.getMinutes(), repeats: true };
    } else if (reminder.repeat_type === 'monthly') {
      trigger = { day: triggerDate.getDate(), hour: triggerDate.getHours(), minute: triggerDate.getMinutes(), repeats: true };
    } else {
      trigger = { date: triggerDate };
    }

    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: '🔔 Nhắc nhở ghi chú',
        body: noteTitle,
        sound: true,
        data: {
          note_id: reminder.note,
          reminder_id: reminder.id,
          note_title: noteTitle,
        },
      },
      trigger,
    });
  }
}

// ── Helper nội bộ: hủy thông báo tùy platform ────────────────────────────
async function cancelNotification(reminderId: string) {
  if (Platform.OS === 'web') {
    cancelWebNotification(reminderId);
  } else {
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.cancelScheduledNotificationAsync(reminderId);
    } catch (_) {}
  }
}

// ── GET /reminders/ ───────────────────────────────────────────────────────
export const fetchReminders = (): Promise<ReminderData[]> =>
  axiosClient.get('/reminders/').then(res => res.data);

// ── POST /reminders/ — tạo mới + lên lịch thông báo ─────────────────────
export const createReminder = async (data: {
  note: string;
  remind_at: string;
  repeat_type: string;
  note_title?: string;
}): Promise<ReminderData> => {
  const reminder: ReminderData = await axiosClient
    .post('/reminders/', data)
    .then(res => res.data);

  const title = data.note_title ?? reminder.note_title ?? 'Ghi chú';
  await scheduleNotification(reminder, title);

  return reminder;
};

// ── PUT /reminders/<id>/ — cập nhật + reschedule nếu đổi giờ ─────────────
export const updateReminder = async (
  id: string,
  data: Partial<Pick<ReminderData, 'remind_at' | 'repeat_type' | 'is_notified'>>,
  noteTitle?: string,
): Promise<ReminderData> => {
  const reminder: ReminderData = await axiosClient
    .put(`/reminders/${id}/`, data)
    .then(res => res.data);

  if (data.remind_at) {
    const title = noteTitle ?? reminder.note_title ?? 'Ghi chú';
    await scheduleNotification(reminder, title);
  }

  return reminder;
};

// ── DELETE /reminders/<id>/ — xóa mềm + hủy thông báo ───────────────────
export const deleteReminder = async (id: string): Promise<void> => {
  await axiosClient.delete(`/reminders/${id}/`);
  await cancelNotification(id); // Hủy lịch thông báo local
};