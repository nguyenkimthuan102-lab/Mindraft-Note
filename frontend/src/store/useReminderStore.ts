import { create } from 'zustand';
import {
  ReminderData,
  fetchReminders,
  updateReminder,
  deleteReminder,
} from 'src/api/reminderApi';
// 🔥 IMPORT HOOK THÔNG BÁO CỤC BỘ
import { useLocalNotification } from 'src/hooks/useLocalNotification';

interface ReminderStore {
  reminders: ReminderData[];
  loading: boolean;
  loadReminders: () => Promise<void>;
  updateReminderAction: (
    id: string,
    data: Partial<Pick<ReminderData, 'remind_at' | 'repeat_type' | 'is_notified'>>
  ) => Promise<void>;
  deleteReminderAction: (id: string) => Promise<void>;
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: [],
  loading: false,

  loadReminders: async () => {
    set({ loading: true });
    try {
      const data = await fetchReminders();
      // Lọc is_deleted = 0 ở frontend phòng trường hợp backend trả về cả deleted
      const active = data.filter(r => r.is_deleted === 0);
      set({ reminders: active });
    } finally {
      set({ loading: false });
    }
  },

  updateReminderAction: async (id, data) => {
    // Kích hoạt hàm quản lý notification từ hook
    const { scheduleReminderNotification } = useLocalNotification();

    // Optimistic update (Cập nhật giao diện trước để tạo cảm giác mượt mà)
    set(s => ({
      reminders: s.reminders.map(r => r.id === id ? { ...r, ...data } : r),
    }));

    try {
      const updated = await updateReminder(id, data);
      set(s => ({
        reminders: s.reminders.map(r => r.id === id ? updated : r),
      }));

      // 🔥 THÊM: Nếu cập nhật hoặc thiết lập thời gian, tự động cập nhật lịch báo thức tương ứng
      if (data.remind_at) {
        // Tái tạo lại chuỗi ký tự hiển thị từ thông tin note_id
        const titleFallback = `Nội dung ghi chú #${updated.note.slice(0, 8)}`;
        await scheduleReminderNotification(updated, titleFallback);
      }
    } catch {
      await get().loadReminders(); // rollback nếu lỗi mạng/server
      throw new Error('Không thể cập nhật');
    }
  },

  deleteReminderAction: async (id) => {
    // Kích hoạt hàm hủy notification từ hook
    const { cancelReminderNotification } = useLocalNotification();
    
    const backup = get().reminders.find(r => r.id === id);
    
    // Xóa khỏi UI ngay (optimistic)
    set(s => ({ reminders: s.reminders.filter(r => r.id !== id) }));

    try {
      await deleteReminder(id); // backend soft delete: is_deleted = 1
      
      // 🔥 THÊM: Hủy hẳn lịch báo thức trên máy của người dùng sau khi xóa thành công
      await cancelReminderNotification(id);
    } catch {
      // Rollback đưa phần tử cũ về vị trí nếu API lỗi
      if (backup) set(s => ({ reminders: [backup, ...s.reminders] }));
      throw new Error('Không thể xóa');
    }
  },
}));