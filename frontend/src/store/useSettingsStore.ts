import { create } from 'zustand';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  viewMode: 'grid' | 'list';
  sortBy: 'updated' | 'created' | 'custom';
  notifications: {
    reminders: boolean;
    collaboration: boolean;
  };
  updateSettings: (patch: Partial<SettingsState>) => void;
  toggleNotification: (key: 'reminders' | 'collaboration') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'light',
  viewMode: 'grid',
  sortBy: 'created',
  notifications: { reminders: true, collaboration: true },
  updateSettings: (patch) => set((state) => ({ ...state, ...patch })),
  toggleNotification: (key) =>
    set((state) => ({
      notifications: { 
        ...state.notifications, 
        [key]: !state.notifications[key] 
      },
    })),
}));