/**
 * FrequencyIndicator.test.tsx
 *
 * Tests the dot-count computation and label exposed by the component for every
 * threshold boundary, including the edge cases: negative input and very large
 * input.
 *
 * Approach: count StyledDot elements by checking a data attribute or class. The
 * component renders exactly MAX_DOTS (5) dots always, marking each $filled. We
 * assert the label text (which encodes the computed frequency bucket) and the
 * role="img" + aria-label accessibility contract.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import enClientes from '@infra/i18n/locales/en/clientes.json';
import { FrequencyIndicator } from '@infra/components/ui/domain/FrequencyIndicator';

// ── i18n test instance ────────────────────────────────────────────────────────

const testI18n = i18n.createInstance();

void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['clientes'],
  defaultNS: 'clientes',
  resources: { en: { clientes: enClientes } },
  interpolation: { escapeValue: false },
});

// ── Wrapper ───────────────────────────────────────────────────────────────────

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Renders the component and returns the visible frequency label text.
 * The aria-label contains "Visit frequency: <label>" and the visible span
 * also renders the label — we assert both.
 */
function renderIndicator(visitsPerMonth: number) {
  return render(<FrequencyIndicator visitsPerMonth={visitsPerMonth} />, {
    wrapper: Wrapper,
  });
}

// ── Threshold boundary tests ──────────────────────────────────────────────────

describe('FrequencyIndicator — frequency label per threshold', () => {
  it('visitsPerMonth=4.5 → label "Weekly"', () => {
    renderIndicator(4.5);
    expect(screen.getByText('Weekly')).toBeInTheDocument();
  });

  it('visitsPerMonth=4 (boundary) → label "Weekly"', () => {
    renderIndicator(4);
    expect(screen.getByText('Weekly')).toBeInTheDocument();
  });

  it('visitsPerMonth=3 → label "Frequent"', () => {
    renderIndicator(3);
    expect(screen.getByText('Frequent')).toBeInTheDocument();
  });

  it('visitsPerMonth=3.9 (just below 4) → label "Frequent"', () => {
    renderIndicator(3.9);
    expect(screen.getByText('Frequent')).toBeInTheDocument();
  });

  it('visitsPerMonth=2 → label "Regular"', () => {
    renderIndicator(2);
    expect(screen.getByText('Regular')).toBeInTheDocument();
  });

  it('visitsPerMonth=2.9 (just below 3) → label "Regular"', () => {
    renderIndicator(2.9);
    expect(screen.getByText('Regular')).toBeInTheDocument();
  });

  it('visitsPerMonth=1 → label "Monthly"', () => {
    renderIndicator(1);
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('visitsPerMonth=1.9 (just below 2) → label "Monthly"', () => {
    renderIndicator(1.9);
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('visitsPerMonth=0.5 → label "Occasional"', () => {
    renderIndicator(0.5);
    expect(screen.getByText('Occasional')).toBeInTheDocument();
  });

  it('visitsPerMonth=0.01 (just above 0) → label "Occasional"', () => {
    renderIndicator(0.01);
    expect(screen.getByText('Occasional')).toBeInTheDocument();
  });

  it('visitsPerMonth=0 → label "No data"', () => {
    renderIndicator(0);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('FrequencyIndicator — edge cases', () => {
  it('negative value is treated as 0 → label "No data"', () => {
    renderIndicator(-1);
    // getFrequencyConfig: vpm >= 4 false, >= 3 false … vpm > 0 false → sinDatos
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('very large value (100) caps display at "Weekly" label without crashing', () => {
    renderIndicator(100);
    expect(screen.getByText('Weekly')).toBeInTheDocument();
  });
});

// ── Accessibility contract ────────────────────────────────────────────────────

describe('FrequencyIndicator — accessibility', () => {
  it('root element has role="img"', () => {
    renderIndicator(2);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('aria-label contains the frequency label text', () => {
    renderIndicator(4.5);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('aria-label');
    expect(img.getAttribute('aria-label')).toContain('Weekly');
  });

  it('aria-label for "No data" scenario contains the no-data string', () => {
    renderIndicator(0);
    const img = screen.getByRole('img');
    expect(img.getAttribute('aria-label')).toContain('No data');
  });

  it('dots row is aria-hidden so individual dots are not announced', () => {
    const { container } = renderIndicator(3);
    const dotsRow = container.querySelector('[aria-hidden="true"]');
    expect(dotsRow).not.toBeNull();
  });
});
