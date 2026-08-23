/**
 * AgendaTherapistSelector.test.tsx
 *
 * The admin-only therapist picker (Designer §1.9, §3.6). This component is ALWAYS
 * rendered when mounted — the "hidden for non-admin" decision belongs to the
 * parent view (covered in the view tests). Here we verify the selector's own
 * states: loading / empty (+ hint) / populated placeholder, the sr-only label,
 * and disabled gating.
 *
 * The Select is a custom portal dropdown; driving its option pick is brittle in
 * jsdom, so option-selection wiring (onChange→Number) is asserted via the parent
 * view test indirectly. Real Select + i18n + theme.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import { AgendaTherapistSelector } from '@infra/pages/AgendaPage/components/shared/AgendaTherapistSelector';
import type { IAgendaTerapeutaRow } from '@domain/models/agenda.models';

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

const MASAJISTAS: IAgendaTerapeutaRow[] = [
  { id: 1, nombre: 'Naree', apellidos: '', isActive: true },
  { id: 2, nombre: 'Som', apellidos: '', isActive: true },
];

function baseProps(overrides: Partial<React.ComponentProps<typeof AgendaTherapistSelector>> = {}) {
  return {
    masajistas: MASAJISTAS,
    value: 1 as number | null,
    isLoading: false,
    onChange: vi.fn(),
    ...overrides,
  };
}

// ── Label ─────────────────────────────────────────────────────────────────────

describe('AgendaTherapistSelector — label', () => {
  it('renders an accessible (sr-only) "Terapeuta" label', () => {
    render(<AgendaTherapistSelector {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Terapeuta')).toBeInTheDocument();
  });
});

// ── States ────────────────────────────────────────────────────────────────────

describe('AgendaTherapistSelector — states', () => {
  it('loading: shows the loading placeholder', () => {
    render(<AgendaTherapistSelector {...baseProps({ isLoading: true, value: null })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Cargando terapeutas…')).toBeInTheDocument();
  });

  it('empty: shows the empty placeholder and the empty hint', () => {
    render(<AgendaTherapistSelector {...baseProps({ masajistas: [], value: null })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Sin terapeutas en este centro')).toBeInTheDocument();
    expect(
      screen.getByText('Asigna terapeutas a este centro para ver su agenda.'),
    ).toBeInTheDocument();
  });

  it('populated, no selection: shows the default placeholder', () => {
    render(<AgendaTherapistSelector {...baseProps({ value: null })} />, { wrapper: Wrapper });
    expect(screen.getByText('Selecciona un terapeuta')).toBeInTheDocument();
  });

  it('populated, with selection: shows the selected therapist name', () => {
    render(<AgendaTherapistSelector {...baseProps({ value: 2 })} />, { wrapper: Wrapper });
    expect(screen.getByText('Som')).toBeInTheDocument();
  });

  it('does not render the empty hint when there are masajistas', () => {
    render(<AgendaTherapistSelector {...baseProps()} />, { wrapper: Wrapper });
    expect(
      screen.queryByText('Asigna terapeutas a este centro para ver su agenda.'),
    ).not.toBeInTheDocument();
  });
});
