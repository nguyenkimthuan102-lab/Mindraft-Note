import axiosClient from './axiosClient';
import { Platform } from 'react-native';
import {
  scheduleWebNotification,
  cancelWebNotification,
  resolveNextTriggerDate,
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

// ── Helper: lên lịch thông báo tùy platform ──────────────────────────────
async function scheduleNotification(reminder: ReminderData, noteTitle: string) {
  if (Platform.OS === 'web') {
    // Web: dùng Web Notification API với logic tính ngày kế tiếp an toàn, chống spam
    await scheduleWebNotification({
      id: reminder.id,
      title: '🔔 Nhắc nhở ghi chú',
      body: noteTitle,
      remindAt: new Date(reminder.remind_at),
      repeatType: reminder.repeat_type,
      noteId: reminder.note,
      noteTitle: noteTitle,
    });
  } else {
    // Mobile: expo-notifications
    const Notifications = await import('expo-notifications');
    try {
      await Notifications.cancelScheduledNotificationAsync(reminder.id);
    } catch (_) {}

    const triggerDate = resolveNextTriggerDate(
      new Date(reminder.remind_at),
      reminder.repeat_type
    );

    // Nếu thời gian đã qua và không lặp thì không lên lịch trên Mobile nữa
    if (reminder.repeat_type === 'none' && triggerDate <= new Date()) {
      return;
    }

    let trigger: any;
    if (reminder.repeat_type === 'daily') {
      trigger = {
        hour: triggerDate.getHours(),
        minute: triggerDate.getMinutes(),
        repeats: true,
      };
    } else if (reminder.repeat_type === 'weekly') {
      trigger = {
        weekday: triggerDate.getDay() + 1,
        hour: triggerDate.getHours(),
        minute: triggerDate.getMinutes(),
        repeats: true,
      };
    } else if (reminder.repeat_type === 'monthly') {
      trigger = {
        day: triggerDate.getDate(),
        hour: triggerDate.getHours(),
        minute: triggerDate.getMinutes(),
        repeats: true,
      };
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

// ── Helper: hủy thông báo tùy platform ───────────────────────────────────
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

// ── POST /reminders/ ─────────────────────────────────────────────────────
export const createReminder = async (data: {
  note: string;
  remind_at: string;
  repeat_type: 'none' | 'daily' | 'weekly' | 'monthly'; // Đã chuẩn hóa kiểu dữ liệu rõ ràng thay vì string chung chung
  note_title?: string;
}): Promise<ReminderData> => {
  const reminder: ReminderData = await axiosClient
    .post('/reminders/', data)
    .then(res => res.data);

  const title = data.note_title ?? reminder.note_title ?? 'Ghi chú';
  await scheduleNotification(reminder, title);

  return reminder;
};

// ── PUT /reminders/<id>/ ──────────────────────────────────────────────────
export const updateReminder = async (
  id: string,
  data: Partial<Pick<ReminderData, 'remind_at' | 'repeat_type' | 'is_notified'>>,
  noteTitle?: string,
): Promise<ReminderData> => {
  const reminder: ReminderData = await axiosClient
    .put(`/reminders/${id}/`, data)
    .then(res => res.data);

  if (data.remind_at || data.repeat_type) {
    const title = noteTitle ?? reminder.note_title ?? 'Ghi chú';
    await scheduleNotification(reminder, title);
  }

  return reminder;
};

// ── DELETE /reminders/<id>/ ───────────────────────────────────────────────
export const deleteReminder = async (id: string): Promise<void> => {
  await axiosClient.delete(`/reminders/${id}/`);
  await cancelNotification(id);
};