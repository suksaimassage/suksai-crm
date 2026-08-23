/**
 * WorkScheduleCalendar.dayA11y.test.tsx
 *
 * Focused accessibility test for the Day-view scroll region (WCAG 2.1.1 —
 * Keyboard). The tablet-landscape responsive fix made the fixed-pixel Day grid
 * scroll horizontally inside its column; a horizontal-scroll region must be
 * keyboard-reachable, so the Developer added `tabIndex={0}` to the
 * `role="grid"` container (WorkScheduleCalendar.tsx). Keyboard users can then
 * Tab to the grid and pan it with arrow keys.
 *
 * This mounts the REAL calendar (not the WorkScheduleSection stub) in Day view
 * with a real i18next instance loading the real `terapeutas` ES resources, so
 * the assertion is end-to-end on the component the change actually touched. We
 * assert ONLY the structural a11y contract (role + tabindex + accessible name);
 * the visible focus ring and actual scroll panning are CSS/visual and are
 * handed to QA below.
 *
 * Day view renders `role="grid"` only when there is ≥1 employee — the empty
 * branch returns a different node — so a single employee fixture is supplied.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

import { theme } from '@infra/styles/themes/light.theme';
import esTerapeutas from '@infra/i18n/locales/es/terapeutas.json';
import { WorkScheduleCalendar } from '@infra/components/ui/shared/WorkScheduleCalendar';
import type { Employee } from '@infra/components/ui/shared/WorkScheduleCalendar';

// Real i18n instance with the actual terapeutas namespace — the calendar reads
// `workSchedule.*` keys (e.g. dailyScheduleAriaLabel) via useTranslation.
const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['terapeutas'],
  defaultNS: 'terapeutas',
  resources: { es: { terapeutas: esTerapeutas } },
  interpolation: { escapeValue: false },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  </I18nextProvider>
);

const EMPLOYEES: Employee[] = [{ id: '1', name: 'Ana García', role: 'Masaje' }];

describe('WorkScheduleCalendar — Day-view keyboard reachability (WCAG 2.1.1)', () => {
  it('exposes the Day scroll region as role="grid"', () => {
    render(<WorkScheduleCalendar employees={EMPLOYEES} shifts={[]} initialView="day" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('makes the Day scroll region keyboard-focusable (tabindex=0)', () => {
    render(<WorkScheduleCalendar employees={EMPLOYEES} shifts={[]} initialView="day" />, {
      wrapper: Wrapper,
    });
    // The horizontal-scroll container must be Tab-reachable so arrow keys can pan
    // it — tabIndex={0}, not -1 (programmatic-only) and not absent.
    expect(screen.getByRole('grid')).toHaveAttribute('tabindex', '0');
  });

  it('gives the Day grid an accessible name from the terapeutas namespace', () => {
    render(<WorkScheduleCalendar employees={EMPLOYEES} shifts={[]} initialView="day" />, {
      wrapper: Wrapper,
    });
    // workSchedule.dailyScheduleAriaLabel = "Horario diario"
    expect(screen.getByRole('grid')).toHaveAccessibleName('Horario diario');
  });
});
