import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type AppTheme = 'warm' | 'forest' | 'clay' | 'system';

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'clnch_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as AppTheme) ?? 'warm';
    } catch {
      return 'warm';
    }
  });

  // Apply to <html> every time theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* ignore */ }
  }, [theme]);

  const setTheme = useCallback((t: AppTheme) => setThemeState(t), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
