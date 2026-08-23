/**
 * AgendaRescheduleDialog.test.tsx
 *
 * The drag & drop confirm-before-persist gate (Surface A; Analyst §1, Designer §4.4).
 * A thin wrapper over the `Dialog` confirm primitive (renders via Modal), mirroring
 * AgendaCancelDialog. It shows a self-contained FROM → TO summary; on a domain
 * failure after Confirm it stays open and renders `error.message` in `role="alert"`.
 *
 * Real Dialog primitive, real i18n + theme, `fireEvent` (no user-event in this repo).
 *
 * NOTE on the Dialog primitive: while `loading` is true the confirm button's text
 * becomes the localized `common:loading` label ("Cargando…" in ES — NOT the
 * `confirmText`) plus a decorative spinner, and BOTH buttons are disabled — the
 * assertions below account for that (the `common` namespace is loaded so the
 * label resolves exactly as it does at runtime).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import esCommon from '@infra/i18n/locales/es/common.json';
import { AgendaRescheduleDialog } from '@infra/pages/AgendaPage/components/admin/AgendaRescheduleDialog';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['agenda', 'common'],
  defaultNS: 'agenda',
  resources: { es: { agenda: esAgenda, common: esCommon } },
  interpolation: { escapeValue: false },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

function baseProps(overrides: Partial<React.ComponentProps<typeof AgendaRescheduleDialog>> = {}) {
  return {
    open: true,
    clientName: 'Lucía Romero',
    serviceName: 'Masaje tradicional',
    fromDate: 'Jue 12',
    fromTime: '10:00',
    toDate: 'Vie 13',
    toTime: '11:30',
    showOverlapHint: false,
    submitting: false,
    errorMessage: undefined,
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

// ── Summary rendering (FROM → TO) ───────────────────────────────────────────────

describe('AgendaRescheduleDialog — summary', () => {
  it('renders the move title', () => {
    render(<AgendaRescheduleDialog {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('¿Mover esta cita?')).toBeInTheDocument();
  });

  it('renders the client + service summary line', () => {
    render(<AgendaRescheduleDialog {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Lucía Romero · Masaje tradicional')).toBeInTheDocument();
  });

  it('renders the FROM label and the origin day · time', () => {
    render(<AgendaRescheduleDialog {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('De')).toBeInTheDocument();
    expect(screen.getByText('Jue 12 · 10:00')).toBeInTheDocument();
  });

  it('renders the TO label and the destination day · time', () => {
    render(<AgendaRescheduleDialog {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('Vie 13 · 11:30')).toBeInTheDocument();
  });

  it('shows a placeholder client name verbatim when passed "—"', () => {
    render(<AgendaRescheduleDialog {...baseProps({ clientName: '—' })} />, { wrapper: Wrapper });
    expect(screen.getByText('— · Masaje tradicional')).toBeInTheDocument();
  });
});

// ── Action buttons + callbacks ──────────────────────────────────────────────────

describe('AgendaRescheduleDialog — actions', () => {
  it('renders the Confirmar and Cancelar buttons', () => {
    render(<AgendaRescheduleDialog {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('clicking Confirmar calls onConfirm', () => {
    const onConfirm = vi.fn();
    render(<AgendaRescheduleDialog {...baseProps({ onConfirm })} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('clicking Cancelar calls onClose', () => {
    const onClose = vi.fn();
    render(<AgendaRescheduleDialog {...baseProps({ onClose })} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('does NOT call onConfirm when the Cancelar button is pressed', () => {
    const onConfirm = vi.fn();
    render(<AgendaRescheduleDialog {...baseProps({ onConfirm })} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

// ── Loading / submitting ────────────────────────────────────────────────────────

describe('AgendaRescheduleDialog — submitting', () => {
  it('disables both action buttons while submitting', () => {
    render(<AgendaRescheduleDialog {...baseProps({ submitting: true })} />, { wrapper: Wrapper });
    // The Dialog primitive swaps the confirm label to the localized common:loading
    // label ("Cargando…") while loading; the decorative spinner is aria-hidden so
    // the accessible name is exactly that text.
    expect(screen.getByRole('button', { name: 'Cargando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  it('keeps action buttons enabled when not submitting', () => {
    render(<AgendaRescheduleDialog {...baseProps({ submitting: false })} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled();
  });
});

// ── Domain error (kept open, role="alert") ──────────────────────────────────────

describe('AgendaRescheduleDialog — domain error', () => {
  it('renders the domain error message in a role="alert" region', () => {
    render(
      <AgendaRescheduleDialog
        {...baseProps({ errorMessage: 'El terapeuta ya tiene una cita en ese horario.' })}
      />,
      { wrapper: Wrapper },
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('El terapeuta ya tiene una cita en ese horario.');
  });

  it('does NOT render an alert when there is no error', () => {
    render(<AgendaRescheduleDialog {...baseProps({ errorMessage: undefined })} />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the Dialog open (title + summary still visible) when an error is present', () => {
    render(<AgendaRescheduleDialog {...baseProps({ errorMessage: 'No se pudo reagendar.' })} />, {
      wrapper: Wrapper,
    });
    // The error coexists with the summary — the user can read why and retry/cancel.
    expect(screen.getByText('¿Mover esta cita?')).toBeInTheDocument();
    expect(screen.getByText('Lucía Romero · Masaje tradicional')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo reagendar.');
  });
});

// ── Advisory overlap hint ───────────────────────────────────────────────────────

describe('AgendaRescheduleDialog — overlap hint', () => {
  it('renders the advisory overlap hint when showOverlapHint is true', () => {
    render(<AgendaRescheduleDialog {...baseProps({ showOverlapHint: true })} />, {
      wrapper: Wrapper,
    });
    expect(
      screen.getByText('Puede solaparse con otra cita; se validará al confirmar.'),
    ).toBeInTheDocument();
  });

  it('does NOT render the overlap hint by default', () => {
    render(<AgendaRescheduleDialog {...baseProps({ showOverlapHint: false })} />, {
      wrapper: Wrapper,
    });
    expect(
      screen.queryByText('Puede solaparse con otra cita; se validará al confirmar.'),
    ).not.toBeInTheDocument();
  });
});

// ── Closed state ────────────────────────────────────────────────────────────────

describe('AgendaRescheduleDialog — closed', () => {
  it('renders nothing visible when open is false', () => {
    render(<AgendaRescheduleDialog {...baseProps({ open: false })} />, { wrapper: Wrapper });
    expect(screen.queryByText('¿Mover esta cita?')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument();
  });
});

// ── Reassignment row (day view only) ────────────────────────────────────────────
// The DAY grid's horizontal axis is the therapist column, so a drop can reassign
// the cita to a different therapist. When BOTH `fromTherapist` and `toTherapist`
// are present AND differ, the Dialog renders an extra "Terapeuta: {from} → {to}"
// row plus a "Reasignación" badge. The WEEK path passes neither prop → the summary
// must render exactly as before (regression guard).

describe('AgendaRescheduleDialog — therapist reassignment row', () => {
  it('renders the reassignment row + badge when fromTherapist and toTherapist differ', () => {
    render(
      <AgendaRescheduleDialog
        {...baseProps({ fromTherapist: 'Naree Siri', toTherapist: 'Som Chai' })}
      />,
      { wrapper: Wrapper },
    );
    // reschedule.therapistLabel = "Terapeuta"
    expect(screen.getByText('Terapeuta')).toBeInTheDocument();
    // value row: "{from} → {to}"
    expect(screen.getByText('Naree Siri → Som Chai')).toBeInTheDocument();
    // reschedule.reassignBadge = "Reasignación"
    expect(screen.getByText('Reasignación')).toBeInTheDocument();
  });

  it('still renders the FROM/TO time rows alongside the reassignment row', () => {
    render(
      <AgendaRescheduleDialog
        {...baseProps({ fromTherapist: 'Naree Siri', toTherapist: 'Som Chai' })}
      />,
      { wrapper: Wrapper },
    );
    // The reassignment fact coexists with the time summary (the day view changes
    // BOTH therapist and possibly the hour).
    expect(screen.getByText('Naree Siri → Som Chai')).toBeInTheDocument();
    expect(screen.getByText('Jue 12 · 10:00')).toBeInTheDocument();
    expect(screen.getByText('Vie 13 · 11:30')).toBeInTheDocument();
  });

  it('does NOT render the reassignment row when both therapist names are absent (week path)', () => {
    render(<AgendaRescheduleDialog {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.queryByText('Terapeuta')).not.toBeInTheDocument();
    expect(screen.queryByText('Reasignación')).not.toBeInTheDocument();
  });

  it('does NOT render the reassignment row when the two therapist names are equal (pure time move)', () => {
    // Same therapist on both ends → a vertical-only drag. No reassignment.
    render(
      <AgendaRescheduleDialog
        {...baseProps({ fromTherapist: 'Naree Siri', toTherapist: 'Naree Siri' })}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.queryByText('Reasignación')).not.toBeInTheDocument();
    expect(screen.queryByText('Naree Siri → Naree Siri')).not.toBeInTheDocument();
  });

  it('does NOT render the reassignment row when only one therapist name is provided', () => {
    // Defensive: a half-provided pair must not render a malformed "X → undefined".
    render(<AgendaRescheduleDialog {...baseProps({ fromTherapist: 'Naree Siri' })} />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByText('Reasignación')).not.toBeInTheDocument();
    expect(screen.queryByText('Terapeuta')).not.toBeInTheDocument();
  });
});
