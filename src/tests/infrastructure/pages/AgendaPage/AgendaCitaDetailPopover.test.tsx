/**
 * AgendaCitaDetailPopover.test.tsx
 *
 * The anchored read-then-act surface (Designer §1.5, §3.2). Key behaviours:
 *   - loads the authoritative cita via useCitaById (loading / loaded / not-found
 *     / error states),
 *   - lifecycle actions gated by permission (canManage → HIDDEN entirely for a
 *     masajista) and by estado legality (Confirmar only when pendiente),
 *   - action callbacks fire with the cita id.
 *
 * Mock strategy: useCitaById is mocked so each data state is driven directly.
 * The real Popover renders its content into document.body (portal). The estado
 * menu (AgendaEstadoMenu) renders real (pure domain). fireEvent for clicks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type { IAgendaAppointment } from '@domain/models/agenda.models';
import type { ICita } from '@domain/models';

// ── Mock the cita loader so each data state is deterministic ────────────────────
const mockUseCitaById = vi.fn();
vi.mock('@infra/hooks/useCitaById', () => ({
  useCitaById: (...a: unknown[]): unknown => mockUseCitaById(...a),
}));

import { AgendaCitaDetailPopover } from '@infra/pages/AgendaPage/components/admin/AgendaCitaDetailPopover';

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

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeAppt(overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment {
  return {
    id: 7,
    therapistId: 1,
    startTime: '14:00',
    endTime: '15:30',
    durationMin: 90,
    clientName: 'Lucía Reyes',
    visitInfo: null,
    serviceName: 'Aromaterapia',
    sala: 'Suite',
    salaId: 2,
    centroId: 1,
    centroName: 'Centro Madrid',
    estado: 'pendiente',
    timelineState: 'pending',
    evtVariant: 'pending',
    notes: null,
    tags: [],
    precioFinal: 6500,
    ...overrides,
  };
}

function makeCita(overrides: Partial<ICita> = {}): ICita {
  return {
    id: 7,
    clienteId: 1,
    usuarioId: 1,
    centroId: 1,
    salaId: 2,
    servicioId: 1,
    fechaHoraInicio: new Date('2026-05-18T14:00:00Z'),
    fechaHoraFin: new Date('2026-05-18T15:30:00Z'),
    estado: 'pendiente',
    precioFinal: 6500,
    notas: null,
    createdAt: new Date('2026-05-01T00:00:00Z'),
    updatedAt: new Date('2026-05-01T00:00:00Z'),
    ...overrides,
  };
}

function loaded(estado: ICita['estado']) {
  mockUseCitaById.mockReturnValue({ cita: makeCita({ estado }), isLoading: false, isError: false });
}

function baseProps(overrides: Partial<React.ComponentProps<typeof AgendaCitaDetailPopover>> = {}) {
  return {
    open: true,
    onOpenChange: vi.fn(),
    appointment: makeAppt(),
    centroName: 'Centro Madrid',
    canManage: true,
    actionPending: false,
    onConfirm: vi.fn(),
    onChangeEstado: vi.fn(),
    onEdit: vi.fn(),
    onCancel: vi.fn(),
    children: <button type="button">evento</button>,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Data states ─────────────────────────────────────────────────────────────────

describe('AgendaCitaDetailPopover — data states', () => {
  it('loading: shows an aria-busy skeleton and no actions', () => {
    mockUseCitaById.mockReturnValue({ cita: null, isLoading: true, isError: false });
    // Popover content renders into a body portal, so query the document, not the
    // render container. The skeleton is intentionally text-free → aria-busy is the
    // only stable hook.
    render(<AgendaCitaDetailPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument();
  });

  it('error: shows the error title and a retry affordance', () => {
    mockUseCitaById.mockReturnValue({ cita: null, isLoading: false, isError: true });
    render(<AgendaCitaDetailPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('No se pudo cargar la cita')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('not-found: shows the not-found message and a close affordance', () => {
    mockUseCitaById.mockReturnValue({ cita: null, isLoading: false, isError: false });
    render(<AgendaCitaDetailPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Cita no encontrada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });

  it('loaded: shows client name, estado badge and meta', () => {
    loaded('confirmada');
    render(<AgendaCitaDetailPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Lucía Reyes')).toBeInTheDocument();
    // estado renders as a single differential Tag label
    expect(screen.getAllByText('Confirmada').length).toBeGreaterThan(0);
    expect(screen.getByText(/14:00–15:30 · 90 min/)).toBeInTheDocument();
  });

  it('shows a centro row sourced from the appointment model (not the prop)', () => {
    loaded('confirmada');
    // Distinct centro on the appointment; prop omitted → the model value must win.
    render(
      <AgendaCitaDetailPopover
        {...baseProps({
          appointment: makeAppt({ centroName: 'Centro Barcelona' }),
          centroName: undefined,
        })}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Centro Barcelona')).toBeInTheDocument();
  });
});

// ── Dialog semantics (WCAG 4.1.2 name/role/value) ──────────────────────────────

describe('AgendaCitaDetailPopover — dialog semantics', () => {
  it('renders the surface as a role="dialog", not a tooltip', () => {
    loaded('confirmada');
    render(<AgendaCitaDetailPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('the dialog surface has an accessible name (detail.title)', () => {
    // axe-core requires a dialog node to have an accessible name; it is supplied
    // via ariaLabel={t('detail.title')} → "Detalle de la cita".
    loaded('confirmada');
    render(<AgendaCitaDetailPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByRole('dialog', { name: 'Detalle de la cita' })).toBeInTheDocument();
  });

  it('the anchor trigger advertises aria-haspopup="dialog" (derived from role)', () => {
    loaded('confirmada');
    render(<AgendaCitaDetailPopover {...baseProps()} />, { wrapper: Wrapper });
    // The bare <button>evento</button> declares no aria-haspopup → derived from
    // the Popover role="dialog" instead of clobbered to "true".
    expect(screen.getByRole('button', { name: 'evento' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
  });
});

// ── Permission gating (canManage) ───────────────────────────────────────────────

describe('AgendaCitaDetailPopover — permission gating', () => {
  it('masajista (canManage=false) sees NO lifecycle actions', () => {
    loaded('pendiente');
    render(<AgendaCitaDetailPopover {...baseProps({ canManage: false })} />, { wrapper: Wrapper });
    // Read-only: client + estado present…
    expect(screen.getByText('Lucía Reyes')).toBeInTheDocument();
    // …but none of the management controls.
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument();
    expect(screen.queryByText('Cambiar estado')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar cita' })).not.toBeInTheDocument();
  });

  it('manager (canManage=true) sees Editar, Cancelar and the estado Tag (no inline selector)', () => {
    loaded('confirmada');
    render(<AgendaCitaDetailPopover {...baseProps({ canManage: true })} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar cita' })).toBeInTheDocument();
    // Estado now renders as a read-only differential Tag — the inline listbox selector is gone.
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
    expect(document.querySelector('[aria-haspopup="listbox"]')).toBeNull();
  });
});

// ── Confirm visibility by estado ────────────────────────────────────────────────

describe('AgendaCitaDetailPopover — Confirmar visibility', () => {
  it('shows Confirmar only when estado is pendiente', () => {
    loaded('pendiente');
    render(<AgendaCitaDetailPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
  });

  it('hides Confirmar when estado is not pendiente', () => {
    loaded('confirmada');
    render(<AgendaCitaDetailPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument();
  });
});

// ── Action callbacks ─────────────────────────────────────────────────────────────

describe('AgendaCitaDetailPopover — action callbacks', () => {
  it('clicking Confirmar calls onConfirm with the cita id', () => {
    loaded('pendiente');
    const onConfirm = vi.fn();
    render(<AgendaCitaDetailPopover {...baseProps({ onConfirm })} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalledWith(7);
  });

  it('clicking Editar calls onEdit with the cita id', () => {
    loaded('confirmada');
    const onEdit = vi.fn();
    render(<AgendaCitaDetailPopover {...baseProps({ onEdit })} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(onEdit).toHaveBeenCalledWith(7);
  });

  it('clicking Cancelar cita calls onCancel with the cita id', () => {
    loaded('confirmada');
    const onCancel = vi.fn();
    render(<AgendaCitaDetailPopover {...baseProps({ onCancel })} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar cita' }));
    expect(onCancel).toHaveBeenCalledWith(7);
  });

  it('disables the management buttons while an action is pending (aria-busy region)', () => {
    loaded('pendiente');
    render(<AgendaCitaDetailPopover {...baseProps({ actionPending: true })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar cita' })).toBeDisabled();
  });
});

// ── Estado fallback (snapshot vs loaded) ─────────────────────────────────────────

describe('AgendaCitaDetailPopover — estado source', () => {
  it('prefers the freshly-loaded estado over the appointment snapshot', () => {
    // Snapshot says pendiente, server says confirmada → trust the server.
    mockUseCitaById.mockReturnValue({
      cita: makeCita({ estado: 'confirmada' }),
      isLoading: false,
      isError: false,
    });
    render(
      <AgendaCitaDetailPopover
        {...baseProps({ appointment: makeAppt({ estado: 'pendiente' }) })}
      />,
      {
        wrapper: Wrapper,
      },
    );
    // Confirmar (pendiente-only) must NOT show, because the loaded estado is confirmada.
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument();
    // estado renders as a single differential Tag label
    expect(screen.getAllByText('Confirmada').length).toBeGreaterThan(0);
  });
});
