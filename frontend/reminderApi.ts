// src/api/reminderApi.ts
import axiosClient from './axiosClient';

export interface ReminderData {
  id: string;
  note: string;
  note_title?: string;
  note_color?: string;
  remind_at: string;
  repeat_type: 'none' | 'daily' | 'weekly' | 'monthly';
  is_notified: boolean;
  is_deleted: boolean;
  updated_at: string;
}

export const fetchReminders = (): Promise<ReminderData[]> =>
  axiosClient.get('/reminders/').then(res => res.data);

export const createReminder = (data: {
  note: string;
  remind_at: string;
  repeat_type: string;
}): Promise<ReminderData> =>
  axiosClient.post('/reminders/', data).then(res => res.data);

export const updateReminder = (id: string, data: Partial<ReminderData>): Promise<ReminderData> =>
  axiosClient.put(`/reminders/${id}/`, data).then(res => res.data);

export const deleteReminder = (id: string): Promise<void> =>
  axiosClient.delete(`/reminders/${id}/`);