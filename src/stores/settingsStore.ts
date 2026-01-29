import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReaderSettings, DEFAULT_SETTINGS } from '../types/settings';

interface SettingsStore {
  settings: ReaderSettings;
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      updateSettings: (newSettings: Partial<ReaderSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);
