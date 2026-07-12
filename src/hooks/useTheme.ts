import { useState, useCallback, useEffect } from 'react';
import type { ThemeMode } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

function loadTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* ignore */ }
  return 'dark';
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => loadTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const isDark = theme === 'dark';

  return { theme, toggleTheme, isDark };
}