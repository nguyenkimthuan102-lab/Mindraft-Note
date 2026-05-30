import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ReminderData } from '../api/reminderApi';

export const useLocalNotification = () => {
  
  // Đăng ký quyền hiển thị thông báo với HĐH
  const registerForPushNotifications = async () => {
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

  // Tạo lịch phát thông báo cục bộ dựa trên thời gian nhắc nhở (remind_at) và chế độ lặp
  const scheduleReminderNotification = async (reminder: ReminderData, titleFallback: string) => {
    const hasPermission = await registerForPushNotifications();
    if (!hasPermission) return null;

    // Hủy lịch cũ nếu trùng mã Note ID để tránh lặp lặp âm thanh vô cớ
    await cancelReminderNotification(reminder.id);

    const triggerDate = new Date(reminder.remind_at);
    if (triggerDate < new Date()) return null; // Quá khứ thì không schedule

    let trigger: Notifications.NotificationTriggerInput;

    // Phân loại kiểu lặp tương thích với chuẩn Expo SDK mới
    if (reminder.repeat_type === 'daily') {
      trigger = {
        hour: triggerDate.getHours(),
        minute: triggerDate.getMinutes(),
        repeats: true,
      } as Notifications.CalendarTriggerInput;
    } else if (reminder.repeat_type === 'weekly') {
      trigger = {
        weekday: triggerDate.getDay() + 1, // Expo weekday bắt đầu từ 1 (Chủ Nhật)
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
      // Sửa lỗi ở đây: Bọc đối tượng Date vào thuộc tính date theo chuẩn DateTriggerInput
      trigger = {
        date: triggerDate,
      } as Notifications.DateTriggerInput;
    }

    try {
      const localId = await Notifications.scheduleNotificationAsync({
        identifier: reminder.id, // Dùng chính id của reminder làm identifier để dễ hủy
        content: {
          title: '🔔 Nhắc nhở ghi chú',
          body: titleFallback,
          data: { note_id: reminder.note }, // Đính kèm payload nhảy màn hình
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

  // Hủy thông báo theo ID định danh
  const cancelReminderNotification = async (reminderId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminderId);
    } catch (e) {
      console.warn('Không tìm thấy thông báo cũ để hủy:', e);
    }
  };

  return {
    registerForPushNotifications,
    scheduleReminderNotification,
    cancelReminderNotification,
  };
};