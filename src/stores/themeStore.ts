import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, PRESET_THEMES, ThemeSettings } from '../types/theme';
import { useSettingsStore } from './settingsStore';

interface ThemeStore {
  themes: Theme[];
  activeThemeId: string;
  isCustomMode: boolean;

  // Actions
  applyTheme: (themeId: string) => void;
  saveTheme: (name: string, settings: ThemeSettings) => void;
  deleteTheme: (themeId: string) => void;
  setCustomMode: (isCustom: boolean) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      themes: PRESET_THEMES,
      activeThemeId: 'light',
      isCustomMode: false,

      applyTheme: (themeId: string) => {
        const theme = get().themes.find((t) => t.id === themeId);
        if (theme) {
          // 应用主题设置到设置store
          useSettingsStore.getState().updateSettings(theme.settings);
          set({ activeThemeId: themeId, isCustomMode: false });
        }
      },

      saveTheme: (name: string, settings: ThemeSettings) => {
        const newTheme: Theme = {
          id: `custom-${Date.now()}`,
          name,
          type: 'custom',
          settings,
          createdAt: new Date(),
        };
        set((state) => ({
          themes: [...state.themes, newTheme],
          activeThemeId: newTheme.id,
          isCustomMode: false,
        }));
      },

      deleteTheme: (themeId: string) => {
        set((state) => ({
          themes: state.themes.filter((t) => t.id !== themeId),
        }));
      },

      setCustomMode: (isCustom: boolean) => {
        set({ isCustomMode: isCustom });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
