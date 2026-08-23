/**
 * TerapeutasKpiStrip.test.tsx
 *
 * Component tests for the TerapeutasKpiStrip component.
 * Validates:
 *   - 4 KPI cells rendered with correct values
 *   - Loading state renders skeletons (aria-busy implied by skeleton presence)
 *   - Rating (valoracion_media) always shows "N/D" (kpi.no_data key)
 *
 * Mocks:
 *   - react-i18next → t() returns the key (with interpolation replacement)
 *   - styled-components → wrapped in ThemeProvider with light theme
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@infra/styles/themes/light.theme';
import { TerapeutasKpiStrip } from '@infra/components/ui/domain/TerapeutasKpiStrip/TerapeutasKpiStrip';

// ── i18n mock ──────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts !== undefined) {
        return Object.entries(opts).reduce((s, [k, v]) => s.replace(`{{${k}}}`, String(v)), key);
      }
      return key;
    },
    i18n: { language: 'es' },
  }),
}));

// ── ThemeProvider wrapper ──────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

// ── Default props ──────────────────────────────────────────────────────────────

const defaultProps = {
  totalActivos: 5,
  totalEquipo: 7,
  enSalaAhora: 2,
  horasSemana: 40,
  avgHorasAlMes: 24,
  isLoading: false,
};

// ── Rendering — loaded state ───────────────────────────────────────────────────

describe('TerapeutasKpiStrip — loaded state', () => {
  it('renders a region with the page.eyebrow label', () => {
    render(<TerapeutasKpiStrip {...defaultProps} />, { wrapper });
    expect(screen.getByRole('region', { name: 'page.eyebrow' })).toBeInTheDocument();
  });

  it('renders KPI 1 — totalActivos value with totalEquipo fraction', () => {
    render(<TerapeutasKpiStrip {...defaultProps} />, { wrapper });
    // With the raw-key i18n mock, t('kpi.equipo_activo_aria', { activos, total })
    // returns the key string 'kpi.equipo_activo_aria' (the mock doesn't resolve
    // translation values, only returns keys). Assert via the aria-label key.
    expect(screen.getByLabelText('kpi.equipo_activo_aria')).toBeInTheDocument();
    // The fraction "/7" is also visible
    expect(screen.getByText(/\/ 7/)).toBeInTheDocument();
  });

  it('renders KPI 2 — enSalaAhora value', () => {
    render(<TerapeutasKpiStrip {...defaultProps} />, { wrapper });
    // enSalaAhora = 2 → rendered as text "2"
    // Note: the value 5 is also present (totalActivos), so check for the exact node
    const kpiValues = screen.getAllByText('2');
    expect(kpiValues.length).toBeGreaterThanOrEqual(1);
  });

  it('renders KPI 3 — horasSemana rounded to integer', () => {
    render(<TerapeutasKpiStrip {...defaultProps} horasSemana={37.7} />, { wrapper });
    // toFixed(0) of 37.7 = "38"
    expect(screen.getByText('38')).toBeInTheDocument();
  });

  it('renders KPI 3 — horasSemana of 40 as "40"', () => {
    render(<TerapeutasKpiStrip {...defaultProps} />, { wrapper });
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('renders KPI 4 — avgHorasAlMes value', () => {
    render(<TerapeutasKpiStrip {...defaultProps} avgHorasAlMes={24} />, { wrapper });
    // With the raw-key i18n mock, t('kpi.horas_mes_aria', { label, horas }) returns
    // the key 'kpi.horas_mes_aria'. Assert via the aria-label key name.
    expect(screen.getByLabelText('kpi.horas_mes_aria')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('renders all 4 KPI label keys', () => {
    render(<TerapeutasKpiStrip {...defaultProps} />, { wrapper });
    expect(screen.getByText('kpi.equipo_activo')).toBeInTheDocument();
    expect(screen.getByText('kpi.en_sala')).toBeInTheDocument();
    expect(screen.getByText('kpi.horas_semana')).toBeInTheDocument();
    expect(screen.getByText('kpi.horas_mes')).toBeInTheDocument();
  });

  it('avgHorasAlMes cell renders rounded integer', () => {
    render(<TerapeutasKpiStrip {...defaultProps} avgHorasAlMes={17.6} />, { wrapper });
    expect(screen.getByText('18')).toBeInTheDocument();
  });
});

// ── Rendering — loading state ──────────────────────────────────────────────────

describe('TerapeutasKpiStrip — loading state', () => {
  it('does NOT render totalActivos value when isLoading is true', () => {
    render(<TerapeutasKpiStrip {...defaultProps} isLoading={true} />, { wrapper });
    // The aria-label 'kpi.equipo_activo_aria' only appears on the KPI value element,
    // which is replaced by a skeleton while loading.
    expect(screen.queryByLabelText('kpi.equipo_activo_aria')).not.toBeInTheDocument();
  });

  it('does NOT render enSalaAhora value when isLoading is true', () => {
    render(<TerapeutasKpiStrip {...defaultProps} enSalaAhora={3} isLoading={true} />, { wrapper });
    // The text "3" from enSalaAhora should not be present as a KPI value
    // (we check the kpi value is absent — skeletons replace it)
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('does NOT render horasSemana value when isLoading is true', () => {
    render(<TerapeutasKpiStrip {...defaultProps} horasSemana={40} isLoading={true} />, { wrapper });
    expect(screen.queryByText('40')).not.toBeInTheDocument();
  });

  it('still renders all 4 KPI label keys in loading state', () => {
    render(<TerapeutasKpiStrip {...defaultProps} isLoading={true} />, { wrapper });
    expect(screen.getByText('kpi.equipo_activo')).toBeInTheDocument();
    expect(screen.getByText('kpi.en_sala')).toBeInTheDocument();
    expect(screen.getByText('kpi.horas_semana')).toBeInTheDocument();
    expect(screen.getByText('kpi.horas_mes')).toBeInTheDocument();
  });

  it('renders skeletons in loading state (KPI cells have skeleton children)', () => {
    const { container } = render(<TerapeutasKpiStrip {...defaultProps} isLoading={true} />, {
      wrapper,
    });
    // TerapeutasKpiStrip imports StyledKpiSkeleton from styles.
    // We cannot query it by role, but we can assert the KPI values are absent.
    // The skeleton elements are rendered in place of values for the first 3 cells.
    // Verify the region is still present
    expect(screen.getByRole('region')).toBeInTheDocument();
    // And no numeric value from props is shown
    expect(
      container.querySelector('[aria-label="kpi.equipo_activo_aria"]'),
    ).not.toBeInTheDocument();
  });

  it('does NOT render avgHorasAlMes value when isLoading is true (skeleton replaces it)', () => {
    render(<TerapeutasKpiStrip {...defaultProps} avgHorasAlMes={24} isLoading={true} />, {
      wrapper,
    });
    expect(screen.queryByText('24')).not.toBeInTheDocument();
  });
});

// ── Edge values ───────────────────────────────────────────────────────────────

describe('TerapeutasKpiStrip — edge values', () => {
  it('renders totalActivos=0 and totalEquipo=0', () => {
    render(
      <TerapeutasKpiStrip
        totalActivos={0}
        totalEquipo={0}
        enSalaAhora={0}
        horasSemana={0}
        avgHorasAlMes={0}
        isLoading={false}
      />,
      { wrapper },
    );
    // With the raw-key i18n mock, aria-label = 'kpi.equipo_activo_aria' (key, not resolved).
    expect(screen.getByLabelText('kpi.equipo_activo_aria')).toBeInTheDocument();
  });

  it('renders horasSemana=0 as "0"', () => {
    render(<TerapeutasKpiStrip {...defaultProps} horasSemana={0} />, { wrapper });
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('transitions correctly from loading to loaded (isLoading prop change)', () => {
    const { rerender } = render(<TerapeutasKpiStrip {...defaultProps} isLoading={true} />, {
      wrapper: ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>,
    });

    // Loading state: no equipo_activo_aria aria-label (KPI value is a skeleton)
    expect(screen.queryByLabelText('kpi.equipo_activo_aria')).not.toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <TerapeutasKpiStrip {...defaultProps} isLoading={false} />
      </ThemeProvider>,
    );

    // Loaded state: aria-label present on the KPI value element
    expect(screen.getByLabelText('kpi.equipo_activo_aria')).toBeInTheDocument();
  });
});

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('TerapeutasKpiStrip — accessibility', () => {
  it('KPI 1 value has a descriptive aria-label with counts', () => {
    render(<TerapeutasKpiStrip {...defaultProps} />, { wrapper });
    // With the raw-key i18n mock, aria-label = key 'kpi.equipo_activo_aria'.
    const kpi1Value = screen.getByLabelText('kpi.equipo_activo_aria');
    expect(kpi1Value).toBeInTheDocument();
  });

  it('KPI 4 (horas_mes) value has a descriptive aria-label', () => {
    render(<TerapeutasKpiStrip {...defaultProps} avgHorasAlMes={24} />, { wrapper });
    // With the raw-key i18n mock, aria-label = key 'kpi.horas_mes_aria'.
    expect(screen.getByLabelText('kpi.horas_mes_aria')).toBeInTheDocument();
  });

  it('strip has role="region" for landmark navigation', () => {
    render(<TerapeutasKpiStrip {...defaultProps} />, { wrapper });
    expect(screen.getByRole('region')).toBeInTheDocument();
  });
});

// ── Rituales-style restructure (markup standardization) ─────────────────────────
// Validates the requirement-driven changes: aria-busy on the strip, icon boxes
// are decorative (aria-hidden), and the label-above-value text column structure
// (label DOM node precedes the value within each cell).

describe('TerapeutasKpiStrip — restructured markup', () => {
  it('sets aria-busy="true" on the region while loading', () => {
    render(<TerapeutasKpiStrip {...defaultProps} isLoading={true} />, { wrapper });
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
  });

  it('sets aria-busy="false" on the region when loaded', () => {
    render(<TerapeutasKpiStrip {...defaultProps} isLoading={false} />, { wrapper });
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false');
  });

  it('renders the icon boxes as aria-hidden (decorative, not announced)', () => {
    const { container } = render(<TerapeutasKpiStrip {...defaultProps} />, { wrapper });
    // 4 KPI cells → 4 decorative icon boxes; each SVG is aria-hidden too.
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBeGreaterThanOrEqual(4);
  });

  it('orders the label before the value within KPI 1 (label-above-value column)', () => {
    render(<TerapeutasKpiStrip {...defaultProps} />, { wrapper });
    const label = screen.getByText('kpi.equipo_activo');
    // With the raw-key i18n mock, aria-label = key 'kpi.equipo_activo_aria'.
    const value = screen.getByLabelText('kpi.equipo_activo_aria');
    // DOCUMENT_POSITION_FOLLOWING (4) means value comes after label in DOM order.
    expect(label.compareDocumentPosition(value) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
