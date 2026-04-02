import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = ['default', 'supercell'] as const;
export type Theme = typeof THEMES[number];

export const THEME_LABELS: Record<Theme, string> = {
  default: 'Poker Night',
  supercell: 'Supercell',
};

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'default',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('poker-theme');
    return (THEMES as readonly string[]).includes(saved ?? '') ? (saved as Theme) : 'default';
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('poker-theme', t);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync theme when changed from another window (e.g. main → display TV)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'poker-theme' && e.newValue && (THEMES as readonly string[]).includes(e.newValue)) {
        setThemeState(e.newValue as Theme);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
