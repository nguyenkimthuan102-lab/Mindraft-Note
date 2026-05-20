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

export const createNoteTodo = (note: NoteCardData): Promise<NoteCardData> =>
  executeCreateNote(note);

export const updateNote = (id: string, note: Partial<NoteCardData>): Promise<NoteCardData> =>
  axiosClient.patch(`/notes/${id}`, {
    ...note,
    client_updated_at: new Date().toISOString(),
  }).then(res => res.data.data);

export const trashNote = (id: string): Promise<void> =>
  axiosClient.patch(`/notes/${id}`, {
    is_trashed: true,
    client_updated_at: new Date().toISOString(),
  });

// Archive
export const archiveNote = (id: string): Promise<void> =>
  axiosClient.patch(`/notes/${id}/`, {
    is_archived: true,
    client_updated_at: new Date().toISOString(),
  });
 
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
