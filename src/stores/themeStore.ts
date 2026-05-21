import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'light' | 'dark' | 'system';

const KEY = 'app_theme_mode';

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  loadMode: () => Promise<void>;
}

const useThemeStore = create<ThemeStore>((set) => ({
  mode: 'system',
  setMode: async (mode) => {
    await SecureStore.setItemAsync(KEY, mode);
    set({ mode });
  },
  loadMode: async () => {
    try {
      const saved = await SecureStore.getItemAsync(KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        set({ mode: saved as ThemeMode });
      }
    } catch {}
  },
}));

export default useThemeStore;
