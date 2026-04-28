import { Note } from '../types';

export const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Sample Note',
    content_text: 'This is a sample note content.',
    type: 'text',
    color: 'default',
    is_pinned: false,
    tags: [{ id: 't1', name: 'work' }],
    // ... các field khác theo interface
  },
  // thêm vài note mẫu
] as any;

export const fetchNotes = async (): Promise<Note[]> => {
  return mockNotes;
};