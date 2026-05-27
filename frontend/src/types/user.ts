// src/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  notify_reminder: boolean;
  notify_collaboration: boolean;
  default_note_view: 'GRID' | 'LIST';
  sort_by: 'updated_at' | 'created_at' | 'custom';
}