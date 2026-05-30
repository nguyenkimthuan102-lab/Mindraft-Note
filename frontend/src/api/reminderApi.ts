import axiosClient from './axiosClient';

// Khớp đúng với ReminderSerializer
export interface ReminderData {
  id: string;
  note: string;        // chỉ là note_id (ForeignKey trả về id)
  user: string;        // user_id
  remind_at: string;
  repeat_type: 'none' | 'daily' | 'weekly' | 'monthly';
  is_notified: number; // IntegerField (0 hoặc 1, không phải boolean)
  is_deleted: number;  // IntegerField (0 hoặc 1, không phải boolean)
  updated_at: string;

  // 2 field này backend chưa có → để optional, hiển thị fallback ở UI
  note_title?: string;
  note_color?: string;
}

// GET /reminders/
export const fetchReminders = (): Promise<ReminderData[]> =>
  axiosClient.get('/reminders/').then(res => res.data);

// POST /reminders/ — khớp CreateReminderSerializer
export const createReminder = (data: {
  note: string;
  remind_at: string;
  repeat_type: string;
}): Promise<ReminderData> =>
  axiosClient.post('/reminders/', data).then(res => res.data);

// PUT /reminders/<id>/ — khớp UpdateReminderSerializer
export const updateReminder = (
  id: string,
  data: Partial<Pick<ReminderData, 'remind_at' | 'repeat_type' | 'is_notified'>>
): Promise<ReminderData> =>
  axiosClient.put(`/reminders/${id}/`, data).then(res => res.data);

// DELETE /reminders/<id>/ — soft delete (backend set is_deleted=1)
export const deleteReminder = (id: string): Promise<void> =>
  axiosClient.delete(`/reminders/${id}/`);