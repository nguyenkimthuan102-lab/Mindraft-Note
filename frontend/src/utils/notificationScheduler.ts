// src/utils/notificationScheduler.ts
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

// ── Cấu hình hiển thị thông báo khi app đang mở ────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // hiện banner
    shouldPlaySound: true,   // phát âm thanh
    shouldSetBadge: true,    // cập nhật badge icon
    shouldShowBanner: true,  // Bổ sung dòng này
    shouldShowList: true,
  }),
});

// ── Xin quyền thông báo (gọi 1 lần khi app khởi động) ─────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false; // Web không hỗ trợ local notification

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Lên lịch thông báo cho 1 reminder ─────────────────────────────────────
export async function scheduleReminderNotification(params: {
  reminderId: string;   // để cancel sau nếu cần
  noteTitle: string;
  remindAt: Date;
}): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    alert('Vui lòng cấp quyền thông báo để nhận nhắc nhở.');
    return null;
  }

  // Không lên lịch nếu thời gian đã qua
  if (params.remindAt <= new Date()) return null;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Nhắc nhở',
      body: params.noteTitle || 'Bạn có một nhắc nhở',
      sound: true,          // âm thanh mặc định
      vibrate: [0, 250, 250, 250], // rung
      data: { reminderId: params.reminderId },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: params.remindAt, // đúng thời điểm remind_at
    },
  });

  return notificationId; // lưu lại để cancel nếu cần
}

// ── Hủy thông báo đã lên lịch ──────────────────────────────────────────────
export async function cancelReminderNotification(notificationId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// ── Hủy tất cả thông báo ───────────────────────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Lấy danh sách thông báo đang chờ (debug) ──────────────────────────────
export async function getPendingNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}