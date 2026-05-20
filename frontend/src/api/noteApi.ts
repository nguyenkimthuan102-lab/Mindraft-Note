import axiosClient from './axiosClient';
import { Note } from '../types';
import { NoteCardData } from '../components/notes/NoteCard';

interface FetchNotesParams {
  view?: 'active' | 'archived' | 'trash' | 'all';
  sort_by?: 'created_at' | 'position' | 'updated_at';
}

export const fetchNotes = (params?: FetchNotesParams): Promise<NoteCardData[]> =>
  axiosClient.get('/notes/', { params }).then(res => res.data.data);

export const createNote = (note: Partial<Note>): Promise<Note> =>
  axiosClient.post('/notes', note).then(res => res.data.data);

export const updateNote = (id: string, note: Partial<Note>): Promise<Note> =>
  axiosClient.put(`/notes/${id}`, note).then(res => res.data.data);

export const deleteNote = (id: string): Promise<void> =>
  axiosClient.delete(`/notes/${id}`);

/** Chuyển ghi chú vào lưu trữ (màn Home → Archive). */
export const archiveNote = (id: string): Promise<Note> =>
  axiosClient.patch(`/notes/${id}/archive`).then(res => res.data.data);

/** Khôi phục ghi chú từ lưu trữ về active (màn Archive → Home). */
export const unarchiveNote = (id: string): Promise<Note> =>
  axiosClient.patch(`/notes/${id}/unarchive`).then(res => res.data.data);

/** Khôi phục ghi chú từ thùng rác về active (màn Trash → Home). */
export const restoreNote = (id: string): Promise<Note> =>
  axiosClient.patch(`/notes/${id}/restore`).then(res => res.data.data);

/** Xóa vĩnh viễn một ghi chú trong thùng rác. */
export const deleteNotePermanently = (id: string): Promise<void> =>
  axiosClient.delete(`/notes/${id}/permanent`);

/** Dọn sạch toàn bộ thùng rác. */
export const emptyTrash = (): Promise<void> =>
  axiosClient.delete('/notes/trash/empty');