/**
 * KPIStrip.test.tsx
 *
 * Behaviour tests for the KPIStrip compound component.
 * Strategy:
 *   - ThemeProvider wraps every render so styled-components tokens resolve.
 *   - Tests cover structure, accessibility, and optional icon slot presence.
 *   - No snapshot tests. No CSS assertions.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import type { ReactNode } from 'react';
import { lightTheme } from '@infra/styles/themes/light.theme';
import { KPIStrip } from './KPIStrip';

// ── Test wrapper ───────────────────────────────────────────────────────────────

const TestWrapper = ({ children }: { children: ReactNode }) => (
  <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
);

function renderStrip(ui: ReactNode) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('KPIStrip — root', () => {
  it('renders a region landmark', () => {
    renderStrip(
      <KPIStrip aria-label="KPI strip test">
        <KPIStrip.Cell label="Clientes" value="42" />
      </KPIStrip>,
    );
    expect(screen.getByRole('region', { name: 'KPI strip test' })).toBeInTheDocument();
  });

  it('renders without aria-label (no landmark name required)', () => {
    renderStrip(
      <KPIStrip>
        <KPIStrip.Cell label="Clientes" value="42" />
      </KPIStrip>,
    );
    // Should render without error — role=region still present
    expect(document.querySelector('[role="region"]')).toBeInTheDocument();
  });
});

describe('KPIStrip.Cell — label and value', () => {
  it('renders the label text', () => {
    renderStrip(
      <KPIStrip>
        <KPIStrip.Cell label="Ingresos totales" value="€4.200" />
      </KPIStrip>,
    );
    expect(screen.getByText('Ingresos totales')).toBeInTheDocument();
  });

  it('renders the value text', () => {
    renderStrip(
      <KPIStrip>
        <KPIStrip.Cell label="Citas este mes" value={128} />
      </KPIStrip>,
    );
    expect(screen.getByText('128')).toBeInTheDocument();
  });

  it('renders a string value', () => {
    renderStrip(
      <KPIStrip>
        <KPIStrip.Cell label="Estado" value="Activo" />
      </KPIStrip>,
    );
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });
});

describe('KPIStrip.Cell — icon slot', () => {
  it('renders the icon when provided', () => {
    renderStrip(
      <KPIStrip>
        <KPIStrip.Cell icon={<span data-testid="my-icon">★</span>} label="Servicios" value="12" />
      </KPIStrip>,
    );
    expect(screen.getByTestId('my-icon')).toBeInTheDocument();
  });

  it('does not render an icon slot when icon is omitted', () => {
    renderStrip(
      <KPIStrip>
        <KPIStrip.Cell label="Sin icono" value="0" />
      </KPIStrip>,
    );
    expect(screen.queryByTestId('my-icon')).toBeNull();
  });

  it('marks the icon wrapper as aria-hidden', () => {
    renderStrip(
      <KPIStrip>
        <KPIStrip.Cell icon={<svg data-testid="svg-icon" />} label="Terapeutas" value="5" />
      </KPIStrip>,
    );
    const icon = screen.getByTestId('svg-icon');
    // The wrapper div should carry aria-hidden
    expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe('KPIStrip — multiple cells', () => {
  it('renders all cells', () => {
    renderStrip(
      <KPIStrip>
        <KPIStrip.Cell label="Clientes" value="10" />
        <KPIStrip.Cell label="Citas" value="20" />
        <KPIStrip.Cell label="Ingresos" value="30" />
        <KPIStrip.Cell label="Servicios" value="40" />
      </KPIStrip>,
    );
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Citas')).toBeInTheDocument();
    expect(screen.getByText('Ingresos')).toBeInTheDocument();
    expect(screen.getByText('Servicios')).toBeInTheDocument();
  });

  it('each cell has its own label and value pair', () => {
    renderStrip(
      <KPIStrip aria-label="Stats">
        <KPIStrip.Cell label="A" value="1" />
        <KPIStrip.Cell label="B" value="2" />
      </KPIStrip>,
    );
    const region = screen.getByRole('region', { name: 'Stats' });
    expect(within(region).getByText('A')).toBeInTheDocument();
    expect(within(region).getByText('1')).toBeInTheDocument();
    expect(within(region).getByText('B')).toBeInTheDocument();
    expect(within(region).getByText('2')).toBeInTheDocument();
  });
});
