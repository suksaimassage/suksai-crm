/**
 * AgendaEstadoMenu.test.tsx
 *
 * The estado lifecycle control. It renders a DropdownMenu whose entries are the
 * legal next states for the current estado; terminal estados render the trigger
 * disabled (no-legal-transitions state, Designer §3.4).
 *
 * Real domain legalNextEstados/isTerminalEstado run (no mocking). Real i18n +
 * theme. The DropdownMenu portals its panel into document.body; fireEvent drives
 * the click interactions.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import { AgendaEstadoMenu } from '@infra/pages/AgendaPage/components/admin/AgendaEstadoMenu';
import type { TEstadoCita } from '@domain/types';

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

function renderMenu(current: TEstadoCita, onChange = vi.fn(), disabled = false) {
  render(<AgendaEstadoMenu current={current} onChange={onChange} disabled={disabled} />, {
    wrapper: Wrapper,
  });
  return { onChange };
}

/**
 * The DropdownMenu trigger is a styled div (aria-haspopup="menu"), not a <button>.
 * Return it via the menu label it wraps; clicking the label bubbles to its onClick.
 */
function getTrigger(): HTMLElement {
  const el = screen.getByText('Cambiar estado').closest('[aria-haspopup="menu"]');
  if (!(el instanceof HTMLElement)) throw new Error('estado menu trigger not found');
  return el;
}

// ── Trigger ─────────────────────────────────────────────────────────────────────

describe('AgendaEstadoMenu — trigger', () => {
  it('renders the "Cambiar estado" trigger with aria-haspopup="menu"', () => {
    renderMenu('pendiente');
    expect(screen.getByText('Cambiar estado')).toBeInTheDocument();
    expect(getTrigger()).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('the trigger reflects aria-expanded after opening', () => {
    renderMenu('pendiente');
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(getTrigger());
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
  });
});

// ── Legal next states ─────────────────────────────────────────────────────────

describe('AgendaEstadoMenu — legal next states', () => {
  it('pendiente → shows exactly Confirmada / Cancelada / No presentado', () => {
    renderMenu('pendiente');
    fireEvent.click(getTrigger());
    const items = screen.getAllByRole('menuitem');
    const labels = items.map((i) => i.textContent);
    expect(labels).toEqual(['Confirmada', 'Cancelada', 'No presentado']);
  });

  it('confirmada → shows En curso / Completada / Cancelada / No presentado (4 items)', () => {
    renderMenu('confirmada');
    fireEvent.click(getTrigger());
    expect(screen.getAllByRole('menuitem')).toHaveLength(4);
    expect(screen.getByRole('menuitem', { name: /En curso/ })).toBeInTheDocument();
  });

  it('en_curso → shows only Completada / Cancelada (2 items)', () => {
    renderMenu('en_curso');
    fireEvent.click(getTrigger());
    const labels = screen.getAllByRole('menuitem').map((i) => i.textContent);
    expect(labels).toEqual(['Completada', 'Cancelada']);
  });

  it('selecting a next state calls onChange with that estado and closes the menu', () => {
    const { onChange } = renderMenu('pendiente');
    fireEvent.click(getTrigger());
    fireEvent.click(screen.getByRole('menuitem', { name: 'Confirmada' }));
    expect(onChange).toHaveBeenCalledWith('confirmada');
  });
});

// ── Terminal estados (no-legal-transitions) ─────────────────────────────────────

describe('AgendaEstadoMenu — terminal estados', () => {
  it.each(['completada', 'cancelada', 'no_presentado'] as const)(
    'estado=%s renders the trigger as aria-disabled and opens no menu',
    (estado) => {
      renderMenu(estado);
      const trigger = screen.getByText('Cambiar estado');
      // The inner styled trigger carries aria-disabled="true".
      expect(trigger.closest('[aria-disabled="true"]')).not.toBeNull();
      fireEvent.click(getTrigger());
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    },
  );

  it('a terminal estado exposes the "Sin cambios disponibles" title hint', () => {
    renderMenu('completada');
    const hinted = screen.getByTitle('Sin cambios disponibles');
    expect(hinted).toBeInTheDocument();
  });
});

// ── Disabled prop (action pending) ──────────────────────────────────────────────

describe('AgendaEstadoMenu — disabled prop', () => {
  it('does not open the menu while disabled (action pending), even for a non-terminal estado', () => {
    renderMenu('pendiente', vi.fn(), true);
    fireEvent.click(getTrigger());
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });
});
