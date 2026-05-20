import axiosClient from './axiosClient';
import { Note } from '../types';
import { NoteCardData } from '../components/notes/NoteCard'; // Đồng nhất type

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