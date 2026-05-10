import { create } from 'zustand';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    app: boolean;
    reminders: boolean;
    collaboration: boolean;
  };
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleNotification: (key: keyof SettingsState['notifications']) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'light',
  notifications: {
    app: true,
    reminders: true,
    collaboration: true,
  },
  setTheme: (theme) => set({ theme }),
  toggleNotification: (key) =>
    set((state) => ({
      notifications: {
        ...state.notifications,
        [key]: !state.notifications[key],
      },
    })),
}));