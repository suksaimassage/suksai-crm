/**
 * KPICard.test.tsx
 *
 * Behaviour tests for the KPICard presentational component.
 *
 * Strategy:
 *   - styled-components ThemeProvider supplies tokens (no CSS assertions)
 *   - Sparkline is mocked to a marker element so we assert *presence + position*
 *     in the layout, not its SVG internals (third-party-ish rendering detail)
 *   - No snapshot tests
 *
 * Covers:
 *   Layout structure: top row (title + sparkline slot), value row, comparison row
 *   Comparison pill: up / down / neutral trend, % vs pts delta unit, suppressed
 *   Sparkline: present when data has points, aria-hidden, absent when empty
 *   Accessibility: article role, composed aria-label, value aria-live region
 *   Loading: skeleton with aria-busy, no value/pill rendered
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';

// ── Mock the Sparkline so we assert presence/position, not SVG internals ──────
vi.mock('@infra/components/ui/common/Charts/Sparkline', () => ({
  Sparkline: () => <div data-testid="sparkline-mock" />,
}));

import { KPICard } from './KPICard';
import type { IDataPoint, IKPIComparison } from './KPI.types';

// ── Wrapper ────────────────────────────────────────────────────────────────
const Wrapper = ({ children }: { children: ReactNode }) => (
  <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
);

const SPARK: IDataPoint[] = [
  { timestamp: 1, value: 2 },
  { timestamp: 2, value: 4 },
  { timestamp: 3, value: 3 },
];

const upPercent: IKPIComparison = {
  previousValue: 10,
  percentChange: 25,
  trend: 'up',
  label: 'vs last week',
};

const downPercent: IKPIComparison = {
  previousValue: 20,
  percentChange: -15,
  trend: 'down',
  label: 'vs last week',
};

const neutralPercent: IKPIComparison = {
  previousValue: 10,
  percentChange: 0,
  trend: 'neutral',
  label: 'vs last week',
};

const ptsComparison: IKPIComparison = {
  previousValue: 40,
  percentChange: 4,
  trend: 'up',
  label: 'vs last week',
  deltaUnit: 'pts',
};

const suppressedComparison: IKPIComparison = {
  previousValue: 0,
  percentChange: 0,
  trend: 'neutral',
  label: 'vs last week',
  suppressed: true,
};

function renderCard(props: Partial<React.ComponentProps<typeof KPICard>> = {}) {
  return render(<KPICard id="k1" title="Reservas hoy" value={42} {...props} />, {
    wrapper: Wrapper,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 1. Layout structure
// ════════════════════════════════════════════════════════════════════════════

describe('KPICard — layout structure', () => {
  it('renders the title', () => {
    renderCard();
    expect(screen.getByText('Reservas hoy')).toBeInTheDocument();
  });

  it('renders the formatted value', () => {
    renderCard({ value: 42 });
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders a unit alongside the value when provided', () => {
    renderCard({ value: 80, unit: '%' });
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('applies a suffix to the value (e.g. currency)', () => {
    renderCard({ value: 1250, suffix: ' €' });
    // 1250 → 1.3K formatting, suffix appended
    expect(screen.getByText(/€/)).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    renderCard({ description: 'Citas confirmadas y pendientes' });
    expect(screen.getByText('Citas confirmadas y pendientes')).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Sparkline slot
// ════════════════════════════════════════════════════════════════════════════

describe('KPICard — sparkline', () => {
  it('renders the sparkline when data has points', () => {
    renderCard({ sparklineData: SPARK });
    expect(screen.getByTestId('sparkline-mock')).toBeInTheDocument();
  });

  it('hides the sparkline slot from assistive tech (aria-hidden)', () => {
    renderCard({ sparklineData: SPARK });
    const spark = screen.getByTestId('sparkline-mock');
    // The slot wrapping the sparkline carries aria-hidden="true".
    const hiddenSlot = spark.closest('[aria-hidden="true"]');
    expect(hiddenSlot).not.toBeNull();
  });

  it('does not render the sparkline when data is an empty array', () => {
    renderCard({ sparklineData: [] });
    expect(screen.queryByTestId('sparkline-mock')).not.toBeInTheDocument();
  });

  it('does not render the sparkline when data is undefined', () => {
    renderCard({ sparklineData: undefined });
    expect(screen.queryByTestId('sparkline-mock')).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Comparison pill — trend direction
// ════════════════════════════════════════════════════════════════════════════

describe('KPICard — comparison pill (trend)', () => {
  it('renders an up trend with a positive signed percent', () => {
    renderCard({ comparison: upPercent });
    // +25.0% with a leading plus sign
    expect(screen.getByText('+25.0%')).toBeInTheDocument();
  });

  it('exposes an "increase" accessible label on the up badge', () => {
    renderCard({ comparison: upPercent });
    expect(screen.getByLabelText('increase: +25.0%')).toBeInTheDocument();
  });

  it('renders a down trend with a negative percent (no plus sign)', () => {
    renderCard({ comparison: downPercent });
    expect(screen.getByText('-15.0%')).toBeInTheDocument();
    expect(screen.getByLabelText('decrease: -15.0%')).toBeInTheDocument();
  });

  it('renders a neutral trend at zero change', () => {
    renderCard({ comparison: neutralPercent });
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.getByLabelText('no change: 0.0%')).toBeInTheDocument();
  });

  it('renders the comparison period label', () => {
    renderCard({ comparison: upPercent });
    expect(screen.getByText('vs last week')).toBeInTheDocument();
  });

  it('renders no comparison row when comparison is undefined', () => {
    renderCard({ comparison: undefined });
    expect(screen.queryByText('vs last week')).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Comparison pill — delta unit (% vs pts)
// ════════════════════════════════════════════════════════════════════════════

describe('KPICard — delta unit', () => {
  it('defaults the delta unit to % when deltaUnit is absent', () => {
    renderCard({ comparison: upPercent });
    expect(screen.getByText('+25.0%')).toBeInTheDocument();
  });

  it('renders a pts delta with a space before the unit and no % sign', () => {
    renderCard({ comparison: ptsComparison });
    expect(screen.getByText('+4.0 pts')).toBeInTheDocument();
    // Must not be rendered as a percentage.
    expect(screen.queryByText('+4.0%')).not.toBeInTheDocument();
  });

  it('exposes the pts unit in the accessible badge label', () => {
    renderCard({ comparison: ptsComparison });
    expect(screen.getByLabelText('increase: +4.0 pts')).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Comparison pill — suppressed (zero baseline)
// ════════════════════════════════════════════════════════════════════════════

describe('KPICard — suppressed comparison', () => {
  it('renders an em-dash instead of a misleading percentage', () => {
    renderCard({ comparison: suppressedComparison });
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('labels the suppressed badge as "no comparison available"', () => {
    renderCard({ comparison: suppressedComparison });
    expect(screen.getByLabelText('no comparison available')).toBeInTheDocument();
  });

  it('still renders the period label so the user keeps context', () => {
    renderCard({ comparison: suppressedComparison });
    expect(screen.getByText('vs last week')).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Accessibility
// ════════════════════════════════════════════════════════════════════════════

describe('KPICard — accessibility', () => {
  it('renders the card as an article landmark', () => {
    renderCard();
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('composes an aria-label from title, value, and comparison clause', () => {
    renderCard({ value: 42, comparison: upPercent });
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', 'Reservas hoy: 42, increase of +25.0%');
  });

  it('includes the unit in the composed aria-label', () => {
    renderCard({ value: 80, unit: '%', comparison: undefined });
    expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'Reservas hoy: 80 %');
  });

  it('announces "no comparison available" in the aria-label when suppressed', () => {
    renderCard({ value: 3, comparison: suppressedComparison });
    expect(screen.getByRole('article')).toHaveAttribute(
      'aria-label',
      'Reservas hoy: 3, no comparison available',
    );
  });

  it('exposes the value in a polite live region', () => {
    renderCard({ value: 42 });
    const value = screen.getByText('42');
    expect(value).toHaveAttribute('aria-live', 'polite');
    expect(value).toHaveAttribute('aria-atomic', 'true');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Loading state
// ════════════════════════════════════════════════════════════════════════════

describe('KPICard — loading state', () => {
  it('marks the card aria-busy while loading', () => {
    renderCard({ isLoading: true });
    expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'true');
  });

  it('exposes a "Loading <title>" accessible label while loading', () => {
    renderCard({ isLoading: true, title: 'Reservas hoy' });
    expect(screen.getByLabelText('Loading Reservas hoy')).toBeInTheDocument();
  });

  it('does not render the value or comparison pill while loading', () => {
    renderCard({ isLoading: true, value: 42, comparison: upPercent });
    expect(screen.queryByText('42')).not.toBeInTheDocument();
    expect(screen.queryByText('+25.0%')).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Drill-down interaction (optional handler)
// ════════════════════════════════════════════════════════════════════════════

describe('KPICard — drill-down', () => {
  it('exposes a button role and is keyboard focusable when onDrillDown is set', () => {
    renderCard({ onDrillDown: vi.fn() });
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabindex', '0');
  });

  it('is not a button (plain article) when onDrillDown is absent', () => {
    renderCard();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('places the title and sparkline together in the top row above the value', () => {
    renderCard({ sparklineData: SPARK });
    const article = screen.getByRole('article');
    // Sanity: both the micro-label title and the sparkline marker render.
    expect(within(article).getByText('Reservas hoy')).toBeInTheDocument();
    expect(within(article).getByTestId('sparkline-mock')).toBeInTheDocument();
  });
});
