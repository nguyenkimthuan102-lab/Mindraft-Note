import { create } from 'zustand';
import {
  ReminderData,
  fetchReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} from '../api/reminderApi';

interface ReminderStore {
  reminders: ReminderData[];
  loading: boolean;
  loadReminders: () => Promise<void>;
  createReminderAction: (
    data: Pick<ReminderData, 'note' | 'remind_at' | 'repeat_type'> & {
      note_title?: string;
      note_color?: string;
    },
    onSuccessNotification?: (created: ReminderData) => Promise<void>
  ) => Promise<ReminderData>;
  updateReminderAction: (
    id: string,
    data: Partial<Pick<ReminderData, 'remind_at' | 'repeat_type' | 'is_notified'>>,
    onSuccessNotification?: (updatedData: ReminderData) => Promise<void>
  ) => Promise<void>;
  deleteReminderAction: (
    id: string,
    onSuccessNotification?: () => Promise<void>
  ) => Promise<void>;
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: [],
  loading: false,

  createReminderAction: async (data, onSuccessNotification) => {
    try {
      const created = await createReminder(data);
      // Thêm vào đầu danh sách để hiện ngay
      set(s => ({ reminders: [created, ...s.reminders] }));
      if (onSuccessNotification) {
        await onSuccessNotification(created);
      }
      return created;
    } catch (err) {
      console.error('Lỗi tạo nhắc nhở:', err);
      throw new Error('Không thể tạo nhắc nhở');
    }
  },

  loadReminders: async () => {
    set({ loading: true });
    try {
      const data = await fetchReminders();
      // Lọc is_deleted = 0 ở frontend phòng trường hợp backend trả về cả deleted
      const active = data.filter(r => r.is_deleted === 0);
      set({ reminders: active });
    } catch (err) {
      console.error('Lỗi tải danh sách nhắc nhở:', err);
    } finally {
      set({ loading: false });
    }
  },

  updateReminderAction: async (id, data, onSuccessNotification) => {
    // Optimistic update: Cập nhật giao diện trước cho mượt mà
    set(s => ({
      reminders: s.reminders.map(r => r.id === id ? { ...r, ...data } : r),
    }));

    try {
      const updated = await updateReminder(id, data);
      set(s => ({
        reminders: s.reminders.map(r => r.id === id ? updated : r),
      }));

      // Nếu cập nhật thời gian thành công và có hàm callback notification từ UI truyền xuống
      if (data.remind_at && onSuccessNotification) {
        await onSuccessNotification(updated);
      }
    } catch (err) {
      await get().loadReminders(); // Rollback khôi phục lại dữ liệu cũ nếu API lỗi
      throw new Error('Không thể cập nhật nhắc nhở');
    }
  },

  deleteReminderAction: async (id, onSuccessNotification) => {
    const backup = get().reminders.find(r => r.id === id);
    
    // Xóa ngay lập tức khỏi giao diện (Optimistic UI)
    set(s => ({ reminders: s.reminders.filter(r => r.id !== id) }));

    try {
      await deleteReminder(id); // Gọi API soft delete phía backend
      
      // Nếu xóa backend thành công và có hàm callback từ UI truyền xuống thì tiến hành hủy lịch báo thức trên thiết bị
      if (onSuccessNotification) {
        await onSuccessNotification();
      }
    } catch (err) {
      // Rollback đưa phần tử cũ về vị trí ban đầu nếu API bị lỗi
      if (backup) {
        set(s => ({ reminders: [backup, ...s.reminders] }));
      }
      throw new Error('Không thể xóa nhắc nhở');
    }
  },
}));