import { useState, useEffect } from 'react';
import { themeService, AppTheme } from './ThemeService';

export function useTheme(): AppTheme {
  const [theme, setTheme] = useState<AppTheme>(themeService.getTheme());

  useEffect(() => {
    // Sync local state with current service theme
    setTheme(themeService.getTheme());

    // Subscribe to theme change notifications
    const unsubscribe = themeService.subscribe((newTheme) => {
      setTheme(newTheme);
    });
    return unsubscribe;
  }, []);

  return theme;
}
