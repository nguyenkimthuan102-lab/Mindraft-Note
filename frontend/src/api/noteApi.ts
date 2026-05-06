import axiosClient from './axiosClient';
import { Note } from '../types';

export const fetchNotes = (): Promise<Note[]> =>
  axiosClient.get('/notes').then(res => res.data.data);

export const createNote = (note: Partial<Note>): Promise<Note> =>
  axiosClient.post('/notes', note).then(res => res.data.data);

export const updateNote = (id: string, note: Partial<Note>): Promise<Note> =>
  axiosClient.put(`/notes/${id}`, note).then(res => res.data.data);

export const deleteNote = (id: string): Promise<void> =>
  axiosClient.delete(`/notes/${id}`);