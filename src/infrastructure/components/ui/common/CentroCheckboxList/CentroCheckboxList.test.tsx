/**
 * CentroCheckboxList.test.tsx
 *
 * Two modes:
 *   A) checkbox-only (existing behavior) — principalId/onPrincipalChange omitted.
 *      Renders a role="group" scroll box; no radios.
 *   B) principal mode — onPrincipalChange provided. Each centro row gains a
 *      "Principal" radio. The radios form a native group via a shared `name`
 *      (no role="radiogroup" wrapper — a radiogroup may not enclose the
 *      membership checkboxes). Radios for UNCHECKED centros are disabled.
 *
 * Spec mapping:
 *   - §5 A11y: principal radios share a `name` (native radio group); each radio
 *     has an aria-label tying it to its centro; disabled radios announce
 *     unavailable; help text associated via aria-describedby.
 *   - Edge E23: extension props are OPTIONAL — omitting them preserves checkbox-only
 *     behavior. Unchecked centro's radio is disabled.
 *   - Interactions: toggling a checkbox emits the new selection; selecting a
 *     radio emits onPrincipalChange with the centro id.
 *
 * Real component under test — no stubs. Checkbox/Radio render natively so we can
 * exercise real ARIA. ThemeProvider supplies styled-components tokens.
 *
 * NOTE: this project does NOT ship @testing-library/user-event (only dom/jest-dom/
 * react are installed), so interactions use fireEvent — the established convention
 * across the suite. See [TESTABILITY GAP] in the Tester report.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import type { ICentro } from '@domain/models';
import { CentroCheckboxList } from './CentroCheckboxList';

// ── Wrapper ──────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeCentro(id: number, nombre: string): ICentro {
  return {
    id,
    nombre,
    direccion: 'Calle Falsa 123',
    ciudad: 'Madrid',
    codigoPostal: '28001',
    telefono: null,
    email: null,
    activo: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };
}

const CENTROS: readonly ICentro[] = [
  makeCentro(1, 'Centro Norte'),
  makeCentro(2, 'Centro Sur'),
  makeCentro(3, 'Centro Este'),
];

const principalLabel = 'Principal';
const principalHelp = 'Elige cuál de los centros seleccionados es el principal.';
const radioAria = (centro: string) => `Marcar ${centro} como centro principal`;

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Mode A: checkbox-only (backward compatibility) ─────────────────────────────

describe('CentroCheckboxList — checkbox-only mode (E23 backward compat)', () => {
  it('renders the list label', () => {
    render(
      <CentroCheckboxList centros={CENTROS} selected={[]} onChange={vi.fn()} label="Centros" />,
      { wrapper },
    );
    expect(screen.getByText('Centros')).toBeInTheDocument();
  });

  it('renders a role="group" scroll box (no radiogroup)', () => {
    render(
      <CentroCheckboxList centros={CENTROS} selected={[]} onChange={vi.fn()} label="Centros" />,
      { wrapper },
    );
    expect(screen.getByRole('group', { name: 'Centros' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('renders one checkbox per centro', () => {
    render(
      <CentroCheckboxList centros={CENTROS} selected={[]} onChange={vi.fn()} label="Centros" />,
      { wrapper },
    );
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('checking a centro emits the centro id appended to the selection', () => {
    const onChange = vi.fn();
    render(
      <CentroCheckboxList centros={CENTROS} selected={[1]} onChange={onChange} label="Centros" />,
      { wrapper },
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Centro Sur' }));
    expect(onChange).toHaveBeenCalledWith([1, 2]);
  });

  it('unchecking a centro emits the selection without that id', () => {
    const onChange = vi.fn();
    render(
      <CentroCheckboxList
        centros={CENTROS}
        selected={[1, 2]}
        onChange={onChange}
        label="Centros"
      />,
      { wrapper },
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Centro Norte' }));
    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it('renders an empty message when there are no centros', () => {
    render(<CentroCheckboxList centros={[]} selected={[]} onChange={vi.fn()} label="Centros" />, {
      wrapper,
    });
    expect(screen.getByText(/no hay centros disponibles/i)).toBeInTheDocument();
  });

  it('renders a loading state with aria-busy when isLoading', () => {
    const { container } = render(
      <CentroCheckboxList
        centros={CENTROS}
        selected={[]}
        onChange={vi.fn()}
        label="Centros"
        isLoading
      />,
      { wrapper },
    );
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});

// ── Mode B: principal radiogroup ───────────────────────────────────────────────

describe('CentroCheckboxList — principal mode rendering', () => {
  function renderPrincipal(props?: {
    selected?: readonly number[];
    principalId?: number | null;
    onPrincipalChange?: (id: number) => void;
  }) {
    return render(
      <CentroCheckboxList
        centros={CENTROS}
        selected={props?.selected ?? [1, 2]}
        onChange={vi.fn()}
        label="Centros"
        principalId={props?.principalId ?? 1}
        onPrincipalChange={props?.onPrincipalChange ?? vi.fn()}
        principalLabel={principalLabel}
        principalHelp={principalHelp}
        principalRadioAriaLabel={radioAria}
      />,
      { wrapper },
    );
  }

  it('groups principal radios via a shared name without an invalid radiogroup wrapper', () => {
    // BUG-04 fix: a role="radiogroup" may not contain the membership checkboxes,
    // so there is no explicit radiogroup. The principal radios instead form a
    // native group via a shared `name`; each carries its own accessible name
    // (asserted by the sibling tests below).
    renderPrincipal();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    const names = new Set(screen.getAllByRole('radio').map((r) => r.getAttribute('name')));
    expect(names.size).toBe(1);
    expect([...names][0]).toBeTruthy();
  });

  it('renders one principal radio per centro', () => {
    renderPrincipal();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('gives each radio an accessible name tied to its centro', () => {
    renderPrincipal();
    expect(
      screen.getByRole('radio', { name: 'Marcar Centro Norte como centro principal' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Marcar Centro Sur como centro principal' }),
    ).toBeInTheDocument();
  });

  it('renders the help text', () => {
    renderPrincipal();
    expect(screen.getByText(principalHelp)).toBeInTheDocument();
  });

  it('associates the help text with the scroll box via aria-describedby', () => {
    renderPrincipal();
    const help = screen.getByText(principalHelp);
    const describedEl = document.querySelector(`[aria-describedby="${help.id}"]`);
    expect(describedEl).not.toBeNull();
  });

  it('disables radios for UNCHECKED centros (only selected are eligible)', () => {
    renderPrincipal({ selected: [1, 2], principalId: 1 });
    // Centro Este (id 3) is unchecked → its radio must be disabled.
    const este = screen.getByRole('radio', { name: 'Marcar Centro Este como centro principal' });
    expect(este).toBeDisabled();
  });

  it('enables radios for CHECKED centros', () => {
    renderPrincipal({ selected: [1, 2], principalId: 1 });
    const norte = screen.getByRole('radio', { name: 'Marcar Centro Norte como centro principal' });
    expect(norte).toBeEnabled();
  });

  it('marks the current principal radio as checked', () => {
    renderPrincipal({ selected: [1, 2], principalId: 2 });
    const sur = screen.getByRole('radio', { name: 'Marcar Centro Sur como centro principal' });
    expect(sur).toBeChecked();
  });

  it('does not check a selected radio that is not the principal', () => {
    renderPrincipal({ selected: [1, 2], principalId: 2 });
    const norte = screen.getByRole('radio', { name: 'Marcar Centro Norte como centro principal' });
    expect(norte).not.toBeChecked();
  });

  it('still renders the checkboxes alongside the radios', () => {
    renderPrincipal();
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });
});

describe('CentroCheckboxList — principal mode interactions', () => {
  it('selecting an enabled principal radio emits onPrincipalChange with the centro id', () => {
    const onPrincipalChange = vi.fn();
    render(
      <CentroCheckboxList
        centros={CENTROS}
        selected={[1, 2]}
        onChange={vi.fn()}
        label="Centros"
        principalId={1}
        onPrincipalChange={onPrincipalChange}
        principalLabel={principalLabel}
        principalHelp={principalHelp}
        principalRadioAriaLabel={radioAria}
      />,
      { wrapper },
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Marcar Centro Sur como centro principal' }));
    expect(onPrincipalChange).toHaveBeenCalledWith(2);
  });

  it('does not emit onPrincipalChange when a disabled (unchecked) radio is clicked', () => {
    const onPrincipalChange = vi.fn();
    render(
      <CentroCheckboxList
        centros={CENTROS}
        selected={[1, 2]}
        onChange={vi.fn()}
        label="Centros"
        principalId={1}
        onPrincipalChange={onPrincipalChange}
        principalLabel={principalLabel}
        principalHelp={principalHelp}
        principalRadioAriaLabel={radioAria}
      />,
      { wrapper },
    );

    // Centro Este (id 3) is unchecked → disabled radio → click is a no-op
    // (jsdom does not dispatch change on disabled inputs).
    fireEvent.click(
      screen.getByRole('radio', { name: 'Marcar Centro Este como centro principal' }),
    );
    expect(onPrincipalChange).not.toHaveBeenCalled();
  });
});
