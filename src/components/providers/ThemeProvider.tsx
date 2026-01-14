'use client';

import { useMemo, useEffect, useState } from 'react';
import { ThemeProvider as MUIThemeProvider, CssBaseline, PaletteMode } from '@mui/material';
import { createAppTheme } from '@/lib/theme';
import { useUIStore } from '@/store/uiStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { themeMode } = useUIStore();
  const [mounted, setMounted] = useState(false);

  // Handle system preference
  const [systemPreference, setSystemPreference] = useState<PaletteMode>('light');

  useEffect(() => {
    setMounted(true);

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Determine actual mode
  const resolvedMode: PaletteMode = useMemo(() => {
    if (themeMode === 'system') {
      return systemPreference;
    }
    return themeMode as PaletteMode;
  }, [themeMode, systemPreference]);

  // Create theme based on mode
  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);

  // Update document attribute for CSS
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', resolvedMode);
    }
  }, [resolvedMode, mounted]);

  // Prevent hydration mismatch by rendering with default theme first
  if (!mounted) {
    return (
      <MUIThemeProvider theme={createAppTheme('light')}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    );
  }

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
