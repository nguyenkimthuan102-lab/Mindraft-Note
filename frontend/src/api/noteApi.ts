import axiosClient from './axiosClient';
import type { NoteCardData } from '../components/notes/NoteCard';

interface RawNote {
  id: string;
  type: 'text' | 'todo';
  color: string;
  title?: string;
  content_text?: string;
  is_pinned: number;       // Backend trả về 0 | 1
  is_archived: number;
  is_trashed: number;
  position?: string;
  created_at?: string;
  server_updated_at?: string;
  client_updated_at?: string;
}

export function normalizeNote(raw: RawNote): NoteCardData {
  return {
    ...raw,
    is_pinned:   Boolean(raw.is_pinned),
    is_archived: Boolean(raw.is_archived),
    is_trashed:  Boolean(raw.is_trashed),
  };
}

export interface FetchNotesParams {
  view?: 'active' | 'archived' | 'trash' | 'all';
  sort_by?: 'created_at' | 'position' | 'updated_at';
}

export interface CreateNotePayload {
  title?: string;
  type: 'text' | 'todo';
}

export interface QuickUpdatePayload {
  title?: string;
  content?: object;
  content_text?: string;
  color?: string;
  position?: string;
  is_pinned?: 0 | 1;
  is_archived?: 0 | 1;
  is_trashed?: 0 | 1;
  client_updated_at?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Hệ thống API chuẩn hóa hành vi
// ─────────────────────────────────────────────────────────────────────

export const fetchNotes = (params?: FetchNotesParams): Promise<NoteCardData[]> =>
  axiosClient.get('/notes/', { params })
    .then(res => (res.data.data as RawNote[]).map(normalizeNote));

export const createNote = (data: CreateNotePayload): Promise<NoteCardData> =>
  axiosClient.post('/notes/create/', data)
    .then(res => normalizeNote(res.data.data as RawNote));

export const quickUpdateNote = (id: string, data: QuickUpdatePayload): Promise<NoteCardData> =>
  axiosClient.patch(`/notes/${id}`, data)
    .then(res => normalizeNote(res.data.data as RawNote));

export const pinNote = (id: string): Promise<NoteCardData> =>
  axiosClient.patch(`/notes/${id}/pin`)
    .then(res => normalizeNote(res.data.data as RawNote));

export const archiveNote = (id: string): Promise<NoteCardData> =>
  axiosClient.patch(`/notes/${id}/archive`)
    .then(res => normalizeNote(res.data.data as RawNote));

// 🚀 NUỐT CHỬNG ENDPOINT MỚI CỦA ÔNG LÀM UI VÀ ĐƯA VÀO BỘ LỌC NORMALIZE
export const unarchiveNote = (id: string): Promise<NoteCardData> =>
  axiosClient.patch(`/notes/${id}/unarchive`)
    .then(res => normalizeNote(res.data.data as RawNote));

export const trashNote = (id: string): Promise<NoteCardData> =>
  axiosClient.patch(`/notes/${id}/trash`)
    .then(res => normalizeNote(res.data.data as RawNote));

export const restoreNote = (id: string): Promise<NoteCardData> =>
  axiosClient.patch(`/notes/${id}/restore`)
    .then(res => normalizeNote(res.data.data as RawNote));

export const deleteNotePermanently = (id: string): Promise<void> =>
  axiosClient.delete(`/notes/${id}/permanent`);

export const emptyTrash = (): Promise<void> =>
  axiosClient.delete('/notes/trash/empty');