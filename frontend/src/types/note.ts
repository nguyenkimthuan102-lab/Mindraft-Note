// src/types/note.ts
export type NoteColor =
  | 'default' | 'red' | 'orange' | 'yellow' | 'green'
  | 'teal' | 'blue' | 'purple' | 'pink' | 'brown';

export interface Block {
  id: string;
  type: 'heading' | 'text' | 'list' | 'image' | 'file';
  data: any; // đơn giản hóa cho demo
}

export interface Tag {
  id: string;
  name: string;
}

export interface Reminder {
  id: string;
  remind_at: string;
  repeat_type: 'none' | 'daily' | 'weekly' | 'monthly';
}

export interface Collaborator {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  invited_by: string;
  accepted_at: string | null;
}

export interface Media {
  id: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

export interface Note {
  id: string;
  user_id: string;
  title: string | null;
  content?: Block[] | null;
  content_text?: string | null;
  type: 'text' | 'todo';
  color: NoteColor;
  is_pinned: boolean;
  is_archived: boolean;
  is_trashed: boolean;
  is_owner: boolean;
  position: string;
  created_at: string;
  server_updated_at: string;
  client_updated_at: string;
  trashed_at: string | null;
  tags: Tag[];
  collaborators: Collaborator[];
  reminder: Reminder | null;
  media: Media[];
}