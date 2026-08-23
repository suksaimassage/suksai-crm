/**
 * AgendaFilterMenu.test.tsx
 *
 * The generic filter chip + Popover menu (Designer §1.3, §3.5). One composition
 * for all four chips. Verifies:
 *   - the chip shows the SELECTED VALUE in its label (not a bare label) and
 *     reflects active via aria-pressed (status not colour-only),
 *   - opening the menu (chip click) reveals the options (Radio single /
 *     Checkbox multi) in a body portal,
 *   - selecting filters (onChange) and "Limpiar" resets,
 *   - loading / empty option states.
 *
 * Real Popover (portal) + Radio/Checkbox. Real i18n + theme. fireEvent.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import { AgendaFilterMenu } from '@infra/pages/AgendaPage/components/admin/AgendaFilterMenu';
import type { IAgendaFilterOption } from '@infra/pages/AgendaPage/components/admin/AgendaFilterMenu';

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

const ESTADO_OPTIONS: IAgendaFilterOption[] = [
  { value: 'pendiente', label: 'Por confirmar', estado: 'pendiente' },
  { value: 'confirmada', label: 'Confirmada', estado: 'confirmada' },
];

const THERAPIST_OPTIONS: IAgendaFilterOption[] = [
  { value: '1', label: 'Naree' },
  { value: '2', label: 'Som' },
  { value: '3', label: 'Kanya' },
];

/**
 * Checkbox forwards no `value` onto its <input>. The option inputs are
 * rendered in the same order as the `options` prop, so we address them by
 * index, which is stable and faithful to the rendered menu.
 */
function optionAt(role: 'radio' | 'checkbox', index: number): HTMLElement {
  const els = screen.getAllByRole(role);
  expect(els.length).toBeGreaterThan(index);
  return els[index];
}

/** Opens the menu by clicking the chip (found via its aria-label prefix). */
function openMenu(labelPrefix: string): void {
  const chip = screen
    .getAllByRole('button')
    .find((b) => b.getAttribute('aria-label')?.startsWith(`${labelPrefix} · `));
  if (!chip) throw new Error(`filter chip "${labelPrefix}" not found`);
  fireEvent.click(chip);
}

// ── Chip label (value summary) ──────────────────────────────────────────────────

describe('AgendaFilterMenu — chip value summary', () => {
  it('single unset → chip shows "Estado · Todos" and is not active', () => {
    render(
      <AgendaFilterMenu
        mode="single"
        label="Estado"
        title="Filtrar por estado"
        options={ESTADO_OPTIONS}
        value={null}
        onChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    const chip = screen.getByRole('button');
    expect(chip).toHaveAttribute('aria-label', 'Estado · Todos');
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('single selected → chip shows the value label and is active (aria-pressed)', () => {
    render(
      <AgendaFilterMenu
        mode="single"
        label="Estado"
        title="Filtrar por estado"
        options={ESTADO_OPTIONS}
        value="confirmada"
        onChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    const chip = screen.getByRole('button');
    expect(chip).toHaveAttribute('aria-label', 'Estado · Confirmada');
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('multi with 2 selected → chip shows the count summary', () => {
    render(
      <AgendaFilterMenu
        mode="multi"
        label="Terapeutas"
        title="Filtrar por terapeuta"
        options={THERAPIST_OPTIONS}
        value={['1', '2']}
        onChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Terapeutas · 2 activos');
  });

  it('multi with 1 selected → chip shows that single name', () => {
    render(
      <AgendaFilterMenu
        mode="multi"
        label="Terapeutas"
        title="Filtrar por terapeuta"
        options={THERAPIST_OPTIONS}
        value={['3']}
        onChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Terapeutas · Kanya');
  });
});

// ── Opening the menu ─────────────────────────────────────────────────────────────

describe('AgendaFilterMenu — open menu', () => {
  it('clicking the chip opens the menu and reveals radio options (single mode)', () => {
    render(
      <AgendaFilterMenu
        mode="single"
        label="Estado"
        title="Filtrar por estado"
        options={ESTADO_OPTIONS}
        value={null}
        onChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    // Options are not present until the menu opens.
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    openMenu('Estado');
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    // The visible option labels are present in the menu.
    expect(screen.getByText('Por confirmar')).toBeInTheDocument();
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
  });

  it('multi mode reveals checkbox options', () => {
    render(
      <AgendaFilterMenu
        mode="multi"
        label="Terapeutas"
        title="Filtrar por terapeuta"
        options={THERAPIST_OPTIONS}
        value={[]}
        onChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    openMenu('Terapeutas');
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.getByText('Naree')).toBeInTheDocument();
  });
});

// ── Selection ────────────────────────────────────────────────────────────────────

describe('AgendaFilterMenu — selection', () => {
  it('single: selecting an option calls onChange with that value', () => {
    const onChange = vi.fn();
    render(
      <AgendaFilterMenu
        mode="single"
        label="Estado"
        title="Filtrar por estado"
        options={ESTADO_OPTIONS}
        value={null}
        onChange={onChange}
      />,
      { wrapper: Wrapper },
    );
    openMenu('Estado');
    fireEvent.click(optionAt('radio', 1)); // index 1 = "Confirmada"
    expect(onChange).toHaveBeenCalledWith('confirmada');
  });

  it('multi: checking an unselected option adds it to the value array', () => {
    const onChange = vi.fn();
    render(
      <AgendaFilterMenu
        mode="multi"
        label="Terapeutas"
        title="Filtrar por terapeuta"
        options={THERAPIST_OPTIONS}
        value={['1']}
        onChange={onChange}
      />,
      { wrapper: Wrapper },
    );
    openMenu('Terapeutas');
    fireEvent.click(optionAt('checkbox', 1)); // index 1 = "Som" (value '2')
    expect(onChange).toHaveBeenCalledWith(['1', '2']);
  });

  it('multi: unchecking a selected option removes it from the value array', () => {
    const onChange = vi.fn();
    render(
      <AgendaFilterMenu
        mode="multi"
        label="Terapeutas"
        title="Filtrar por terapeuta"
        options={THERAPIST_OPTIONS}
        value={['1', '2']}
        onChange={onChange}
      />,
      { wrapper: Wrapper },
    );
    openMenu('Terapeutas');
    fireEvent.click(optionAt('checkbox', 0)); // index 0 = "Naree" (value '1')
    expect(onChange).toHaveBeenCalledWith(['2']);
  });

  // Regression: the option's visible text used to be a plain sibling <span>
  // outside the Radio/Checkbox's own <label> — clicking it did nothing. The
  // label text is now rendered BY the Radio/Checkbox (native label→input
  // association), so clicking the text itself must toggle the value too.
  it('single: clicking the option LABEL TEXT (not the radio input) calls onChange', () => {
    const onChange = vi.fn();
    render(
      <AgendaFilterMenu
        mode="single"
        label="Estado"
        title="Filtrar por estado"
        options={ESTADO_OPTIONS}
        value={null}
        onChange={onChange}
      />,
      { wrapper: Wrapper },
    );
    openMenu('Estado');
    fireEvent.click(screen.getByText('Confirmada'));
    expect(onChange).toHaveBeenCalledWith('confirmada');
  });

  it('multi: clicking the option LABEL TEXT (not the checkbox input) toggles the value', () => {
    const onChange = vi.fn();
    render(
      <AgendaFilterMenu
        mode="multi"
        label="Terapeutas"
        title="Filtrar por terapeuta"
        options={THERAPIST_OPTIONS}
        value={['1']}
        onChange={onChange}
      />,
      { wrapper: Wrapper },
    );
    openMenu('Terapeutas');
    fireEvent.click(screen.getByText('Som'));
    expect(onChange).toHaveBeenCalledWith(['1', '2']);
  });
});

// ── Limpiar (reset) ──────────────────────────────────────────────────────────────

describe('AgendaFilterMenu — Limpiar', () => {
  it('single: Limpiar resets the value to null', () => {
    const onChange = vi.fn();
    render(
      <AgendaFilterMenu
        mode="single"
        label="Estado"
        title="Filtrar por estado"
        options={ESTADO_OPTIONS}
        value="confirmada"
        onChange={onChange}
      />,
      { wrapper: Wrapper },
    );
    openMenu('Estado');
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('multi: Limpiar resets the value to an empty array', () => {
    const onChange = vi.fn();
    render(
      <AgendaFilterMenu
        mode="multi"
        label="Terapeutas"
        title="Filtrar por terapeuta"
        options={THERAPIST_OPTIONS}
        value={['1', '2']}
        onChange={onChange}
      />,
      { wrapper: Wrapper },
    );
    openMenu('Terapeutas');
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});

// ── Loading / empty option states ───────────────────────────────────────────────

describe('AgendaFilterMenu — option states', () => {
  it('shows the loading text while isLoading', () => {
    render(
      <AgendaFilterMenu
        mode="single"
        label="Centro"
        title="Filtrar por centro"
        options={[]}
        isLoading
        value={null}
        onChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('shows "Sin opciones" when there are no options', () => {
    render(
      <AgendaFilterMenu
        mode="single"
        label="Servicio"
        title="Filtrar por servicio"
        options={[]}
        value={null}
        onChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Sin opciones')).toBeInTheDocument();
  });
});
