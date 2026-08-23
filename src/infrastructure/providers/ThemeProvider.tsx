/**
 * infrastructure/providers/ThemeProvider.tsx — Theme injection
 *
 * Responsibilities:
 *   1. Read isDark from Zustand store (via selector — minimal re-renders)
 *   2. Select lightTheme or darkTheme accordingly
 *   3. Inject selected theme into styled-components context
 *   4. Apply GlobalStyles once at the root
 *   5. Sync <html data-theme> attribute for CSS custom property hooks (optional)
 *
 * NOT responsible for: persisting theme, detecting OS preference, toggling.
 */

import { type ReactNode, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { darkTheme } from '@infra/styles/themes/dark.theme';
import { GlobalStyles } from '@infra/styles/GlobalStyles';
import { useIsDark } from '@app/stores/useThemeStore';

interface ThemeProviderProps {
  readonly children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Granular selector — only re-renders when isDark flips
  const isDark = useIsDark();
  const theme = isDark ? darkTheme : lightTheme;

  // Sync data-theme on <html> — enables CSS custom property overrides
  // and helps third-party libraries respect the current mode.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  return (
    <StyledThemeProvider theme={theme}>
      {/* GlobalStyles is recreated automatically when theme changes */}
      <GlobalStyles />
      {children}
    </StyledThemeProvider>
  );
};
