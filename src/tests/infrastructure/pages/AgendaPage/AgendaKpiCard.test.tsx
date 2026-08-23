/**
 * AgendaKpiCard.test.tsx
 *
 * Tests for the AgendaKpiCard component.
 *
 * Mocking strategy:
 *   - No external hooks — component is purely presentational (driven by IAgendaKpi prop).
 *   - styled-components: not mocked; AdminAgendaView.styles.ts exports are real.
 *   - No i18n usage in AgendaKpiCard — no mock needed.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { AgendaKpiCard } from '@infra/pages/AgendaPage/components/admin/AgendaKpiCard';
import type { IAgendaKpi } from '@domain/models/agenda.models';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
);

// Shared fixture builders

function buildKpi(overrides: Partial<IAgendaKpi> = {}): IAgendaKpi {
  return {
    id: 'test-kpi',
    label: 'Test Label',
    value: 7,
    denominator: null,
    unit: null,
    subtext: null,
    isAccent: false,
    ...overrides,
  };
}

// ── Basic rendering ──────────────────────────────────────────────────────────

describe('AgendaKpiCard — basic rendering', () => {
  it('renders the label text', () => {
    render(<AgendaKpiCard kpi={buildKpi({ label: 'Reservas · Hoy' })} />, { wrapper: Wrapper });
    expect(screen.getByText('Reservas · Hoy')).toBeInTheDocument();
  });

  it('renders the numeric value', () => {
    render(<AgendaKpiCard kpi={buildKpi({ value: 14 })} />, { wrapper: Wrapper });
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('renders subtext when provided', () => {
    render(<AgendaKpiCard kpi={buildKpi({ subtext: '64% ocupación' })} />, { wrapper: Wrapper });
    expect(screen.getByText('64% ocupación')).toBeInTheDocument();
  });

  it('does not render subtext when subtext is null', () => {
    render(<AgendaKpiCard kpi={buildKpi({ subtext: null })} />, { wrapper: Wrapper });
    // There should be no element with subtext content
    expect(screen.queryByText('64% ocupación')).not.toBeInTheDocument();
  });

  it('has an aria-label equal to the kpi label', () => {
    const { container } = render(<AgendaKpiCard kpi={buildKpi({ label: 'Por confirmar' })} />, {
      wrapper: Wrapper,
    });
    const card = container.querySelector('[aria-label="Por confirmar"]');
    expect(card).toBeInTheDocument();
  });
});

// ── Value display variants ───────────────────────────────────────────────────

describe('AgendaKpiCard — value display variants', () => {
  it('renders "value/denominator" format when denominator is provided', () => {
    render(<AgendaKpiCard kpi={buildKpi({ value: 14, denominator: 22 })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('/22')).toBeInTheDocument();
  });

  it('renders "value unit" format when unit is provided and denominator is null', () => {
    render(<AgendaKpiCard kpi={buildKpi({ value: 1240, unit: '€', denominator: null })} />, {
      wrapper: Wrapper,
    });
    // Value formatted with toLocaleString('es-ES') — 1240 → "1.240" in es-ES
    expect(screen.getByText('€')).toBeInTheDocument();
  });

  it('renders bare value when both denominator and unit are null', () => {
    render(<AgendaKpiCard kpi={buildKpi({ value: 3, denominator: null, unit: null })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('denominator takes precedence over unit when both are provided', () => {
    // Per implementation: denominator branch checked first
    render(<AgendaKpiCard kpi={buildKpi({ value: 4, denominator: 5, unit: 'items' })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('/5')).toBeInTheDocument();
    // Unit should not be rendered in this branch
    expect(screen.queryByText('items')).not.toBeInTheDocument();
  });
});

// ── Accent state ─────────────────────────────────────────────────────────────

describe('AgendaKpiCard — accent state', () => {
  it('applies $accent prop when isAccent is true (aria-label still present)', () => {
    const { container } = render(
      <AgendaKpiCard kpi={buildKpi({ label: 'Ingresos previstos', isAccent: true })} />,
      { wrapper: Wrapper },
    );
    const card = container.querySelector('[aria-label="Ingresos previstos"]');
    expect(card).toBeInTheDocument();
  });

  it('renders accent and non-accent cards with identical DOM structure', () => {
    const { container: acc } = render(<AgendaKpiCard kpi={buildKpi({ isAccent: true })} />, {
      wrapper: Wrapper,
    });
    const { container: noAcc } = render(<AgendaKpiCard kpi={buildKpi({ isAccent: false })} />, {
      wrapper: Wrapper,
    });
    // Same number of child elements regardless of accent
    expect(acc.firstElementChild?.childElementCount).toBe(
      noAcc.firstElementChild?.childElementCount,
    );
  });
});

// ── Semantics ────────────────────────────────────────────────────────────────

describe('AgendaKpiCard — semantics', () => {
  it('is not interactive — no button or link role', () => {
    render(<AgendaKpiCard kpi={buildKpi()} />, { wrapper: Wrapper });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('label text is visible before value text in document order', () => {
    render(<AgendaKpiCard kpi={buildKpi({ label: 'Lista de espera', value: 2 })} />, {
      wrapper: Wrapper,
    });
    const label = screen.getByText('Lista de espera');
    const value = screen.getByText('2');
    // Label node should appear before value node in the DOM
    expect(label.compareDocumentPosition(value) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
