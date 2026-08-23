/**
 * TherapistWeekBanner.test.tsx
 *
 * Component tests for TherapistWeekBanner.
 * Mock strategy:
 *   - Purely prop-driven; no external hooks.
 *   - i18n: agenda namespace required (therapist.week.* keys).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { TherapistWeekBanner } from '@infra/pages/AgendaPage/components/therapist/TherapistWeekBanner';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type { IAgendaWeekBalance } from '@domain/models/agenda.models';

// ── i18n setup ────────────────────────────────────────────────────────────────

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['agenda'],
  defaultNS: 'agenda',
  resources: { es: { agenda: esAgenda } },
  interpolation: { escapeValue: false },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_BALANCE: IAgendaWeekBalance = {
  citasTotal: 12,
  citasCompletadas: 8,
  horasEnSala: 6.5,
  propinas: 0,
  valoracionMedia: 4.8,
  weekLabel: '18 may – 24 may',
};

const ZERO_BALANCE: IAgendaWeekBalance = {
  citasTotal: 0,
  citasCompletadas: 0,
  horasEnSala: 0,
  propinas: 0,
  valoracionMedia: 0,
  weekLabel: '18 may – 24 may',
};

// ── Banner title ──────────────────────────────────────────────────────────────

describe('TherapistWeekBanner — banner title', () => {
  it('shows banner title with therapist name interpolated', () => {
    render(<TherapistWeekBanner therapistName="Som" balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Tu semana, Som.')).toBeInTheDocument();
  });

  it('shows weekLabel as subtitle', () => {
    render(<TherapistWeekBanner therapistName="Som" balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('18 may – 24 may')).toBeInTheDocument();
  });
});

// ── Stat values ───────────────────────────────────────────────────────────────

describe('TherapistWeekBanner — stat values', () => {
  it('shows citasTotal as a number', () => {
    render(<TherapistWeekBanner therapistName="Naree" balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('formats horasEnSala 6.5 as "6h 30m"', () => {
    render(<TherapistWeekBanner therapistName="Naree" balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('6h 30m')).toBeInTheDocument();
  });

  it('shows valoracionMedia.toFixed(1) when valoracionMedia > 0', () => {
    render(<TherapistWeekBanner therapistName="Naree" balance={BASE_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('does not render valoracion stat when valoracionMedia === 0', () => {
    render(<TherapistWeekBanner therapistName="Naree" balance={ZERO_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByText('Valoración')).not.toBeInTheDocument();
  });
});

// ── Zero state ────────────────────────────────────────────────────────────────

describe('TherapistWeekBanner — zero balance', () => {
  it('renders without error when all balance values are 0', () => {
    const { container } = render(
      <TherapistWeekBanner therapistName="Naree" balance={ZERO_BALANCE} />,
      { wrapper: Wrapper },
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows "0" for citasTotal in zero balance', () => {
    render(<TherapistWeekBanner therapistName="Naree" balance={ZERO_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows "0h" for zero horasEnSala', () => {
    render(<TherapistWeekBanner therapistName="Naree" balance={ZERO_BALANCE} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('0h')).toBeInTheDocument();
  });
});
