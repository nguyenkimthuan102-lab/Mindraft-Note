// src/utils/useLocalNotification.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ReminderData } from '../api/reminderApi';
import { createNotification } from '../api/notificationApi';
import { useNotificationStore } from '../store/useNotificationStore';
import {
  scheduleWebNotification,
  cancelWebNotification,
  requestWebNotificationPermission,
} from './webNotification'; // ← THÊM

export const useLocalNotification = () => {

  const { loadNotifications } = useNotificationStore.getState();

  const registerForPushNotifications = async () => {
    // Web dùng Web Notification API riêng
    if (Platform.OS === 'web') {
      return await requestWebNotificationPermission();
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminder-channel', {
        name: 'Nhắc nhở công việc',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  };

  const scheduleReminderNotification = async (
    reminder: ReminderData,
    titleFallback: string
  ) => {
    const triggerDate = new Date(reminder.remind_at);
    if (triggerDate < new Date()) return null;

    // ── WEB: dùng Web Notification API ──────────────────────────────────
    if (Platform.OS === 'web') {
      const success = await scheduleWebNotification({
        id: reminder.id,
        title: '🔔 Nhắc nhở ghi chú',
        body: titleFallback,
        remindAt: triggerDate,
        noteId: reminder.note,
      });
      return success ? reminder.id : null;
    }

    // ── MOBILE: dùng expo-notifications ─────────────────────────────────
    await cancelReminderNotification(reminder.id);

    const hasPermission = await registerForPushNotifications();
    if (!hasPermission) return null;

    let trigger: Notifications.NotificationTriggerInput;

    if (reminder.repeat_type === 'daily') {
      trigger = {
        hour: triggerDate.getHours(),
        minute: triggerDate.getMinutes(),
        repeats: true,
      } as Notifications.CalendarTriggerInput;
    } else if (reminder.repeat_type === 'weekly') {
      trigger = {
        weekday: triggerDate.getDay() + 1,
        hour: triggerDate.getHours(),
        minute: triggerDate.getMinutes(),
        repeats: true,
      } as Notifications.CalendarTriggerInput;
    } else if (reminder.repeat_type === 'monthly') {
      trigger = {
        day: triggerDate.getDate(),
        hour: triggerDate.getHours(),
        minute: triggerDate.getMinutes(),
        repeats: true,
      } as Notifications.CalendarTriggerInput;
    } else {
      trigger = { date: triggerDate } as Notifications.DateTriggerInput;
    }

    try {
      const localId = await Notifications.scheduleNotificationAsync({
        identifier: reminder.id,
        content: {
          title: '🔔 Nhắc nhở ghi chú',
          body: titleFallback,
          data: {
            note_id: reminder.note,
            reminder_id: reminder.id,
            note_title: titleFallback,
          },
          sound: true,
        },
        trigger,
      });
      return localId;
    } catch (error) {
      console.error('Lỗi khi lập lịch thông báo:', error);
      return null;
    }
  };

  const cancelReminderNotification = async (reminderId: string) => {
    // Web
    if (Platform.OS === 'web') {
      cancelWebNotification(reminderId);
      return;
    }
    // Mobile
    try {
      await Notifications.cancelScheduledNotificationAsync(reminderId);
    } catch (e) {
      console.warn('Không tìm thấy thông báo cũ để hủy:', e);
    }
  };

  const handleNotificationReceived = async (
    notification: Notifications.Notification
  ) => {
    const data = notification.request.content.data;
    if (!data?.reminder_id) return;

    try {
      // ĐÚNG — ép về string
        await createNotification({
        type: 'reminder',
        note: typeof data.note_id === 'string' ? data.note_id : null,
        payload: {
        message: String(notification.request.content.body ?? 'Nhắc nhở'),
        note_title: String(data.note_title ?? ''),
        reminder_id: String(data.reminder_id ?? ''),
          },
        });
      await loadNotifications();
    } catch (err) {
      console.error('Lỗi tạo server notification:', err);
    }
  };

  return {
    registerForPushNotifications,
    scheduleReminderNotification,
    cancelReminderNotification,
    handleNotificationReceived,
  };
};