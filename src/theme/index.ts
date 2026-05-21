import { useColorScheme } from 'react-native';
import useThemeStore from '../stores/themeStore';
import { lightColors, darkColors, AppColors } from './colors';

export function useTheme(): { colors: AppColors; isDark: boolean } {
  const mode = useThemeStore((s) => s.mode);
  const system = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return { colors: isDark ? darkColors : lightColors, isDark };
}

export { lightColors, darkColors };
export type { AppColors };
