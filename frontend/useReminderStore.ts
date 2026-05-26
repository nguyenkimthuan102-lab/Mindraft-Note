// src/store/useReminderStore.ts
import { create } from 'zustand';
import {
  ReminderData,
  fetchReminders,
  updateReminder,
  deleteReminder,
} from '../api/reminderApi';

interface ReminderStore {
  reminders: ReminderData[];
  loading: boolean;

  loadReminders: () => Promise<void>;
  updateReminderAction: (id: string, data: Partial<ReminderData>) => Promise<void>;
  deleteReminderAction: (id: string) => Promise<void>;
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: [],
  loading: false,

  loadReminders: async () => {
    set({ loading: true });
    try {
      const data = await fetchReminders();
      set({ reminders: data });
    } finally {
      set({ loading: false });
    }
  },

  updateReminderAction: async (id, data) => {
    // Optimistic update
    set(s => ({
      reminders: s.reminders.map(r => r.id === id ? { ...r, ...data } : r),
    }));
    try {
      const updated = await updateReminder(id, data);
      set(s => ({
        reminders: s.reminders.map(r => r.id === id ? updated : r),
      }));
    } catch {
      await get().loadReminders(); // rollback
      throw new Error('Không thể cập nhật nhắc nhở');
    }
  },

  deleteReminderAction: async (id) => {
    const backup = get().reminders.find(r => r.id === id);
    set(s => ({ reminders: s.reminders.filter(r => r.id !== id) }));
    try {
      await deleteReminder(id);
    } catch {
      if (backup) set(s => ({ reminders: [backup, ...s.reminders] }));
      throw new Error('Không thể xóa nhắc nhở');
    }
  },
}));