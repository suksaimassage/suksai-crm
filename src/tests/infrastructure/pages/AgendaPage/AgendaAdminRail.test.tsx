/**
 * AgendaAdminRail.test.tsx
 *
 * The enriched admin rail (Designer §1.10). Verifies:
 *   - pending items render avatar + client + meta + the "VENCE…" meta line,
 *   - Confirmar / Reasignar are wired (and HIDDEN when canManage=false),
 *   - the alerts panel renders computed alerts as role="alert" with a dot
 *     (role="img" + aria-label) AND a glyph (status not colour-only),
 *   - the alerts panel is absent when there are no alerts,
 *   - the sr-only aria-live region announces the pending count,
 *   - the legend renders.
 *
 * Fully prop-driven; real i18n + theme; fireEvent.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import { AgendaAdminRail } from '@infra/pages/AgendaPage/components/admin/AgendaAdminRail';
import type {
  IAgendaAppointment,
  IAgendaAlert,
  IAgendaLegendItem,
  IAgendaTherapist,
} from '@domain/models/agenda.models';

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

function makePending(overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment {
  return {
    id: 1,
    therapistId: 10,
    startTime: '14:30',
    endTime: '16:00',
    durationMin: 90,
    clientName: 'Lucía Reyes',
    visitInfo: null,
    serviceName: 'Aromaterapia',
    sala: 'Suite',
    salaId: 2,
    centroId: 1,
    centroName: 'Centro Test',
    estado: 'pendiente',
    timelineState: 'pending',
    evtVariant: 'pending',
    notes: null,
    tags: [],
    precioFinal: 6500,
    ...overrides,
  };
}

const THERAPISTS: IAgendaTherapist[] = [
  {
    id: 10,
    nombre: 'Som',
    apellidos: 'Ongkham',
    initials: 'SO',
    sala: 'Suite',
    appointmentCount: 1,
    isActive: true,
    isAvailableOnDate: true,
  },
];

const LEGEND: IAgendaLegendItem[] = [
  { variant: 'gold', label: 'Tradicional / Hierbas' },
  { variant: 'pending', label: 'Por confirmar' },
];

function baseProps(overrides: Partial<React.ComponentProps<typeof AgendaAdminRail>> = {}) {
  return {
    pendingAppointments: [makePending()] as readonly IAgendaAppointment[],
    alerts: [] as readonly IAgendaAlert[],
    legendItems: LEGEND,
    therapists: THERAPISTS,
    canManage: true,
    optimisticId: null,
    onConfirm: vi.fn(),
    onReassign: vi.fn(),
    ...overrides,
  };
}

// ── Pending items ────────────────────────────────────────────────────────────────

describe('AgendaAdminRail — pending items', () => {
  it('renders the client name and service meta for each pending cita', () => {
    render(<AgendaAdminRail {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Lucía Reyes')).toBeInTheDocument();
    expect(screen.getByText(/Aromaterapia · 90 min/)).toBeInTheDocument();
  });

  it('renders the meta line with the therapist name', () => {
    render(<AgendaAdminRail {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText(/CON Som Ongkham/)).toBeInTheDocument();
  });

  it('renders the urgent "VENCE EN 1 H" meta line for a now-state cita', () => {
    render(
      <AgendaAdminRail
        {...baseProps({ pendingAppointments: [makePending({ timelineState: 'now' })] })}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText(/VENCE EN 1 H/)).toBeInTheDocument();
  });

  it('shows the empty message when there are no pending citas', () => {
    render(<AgendaAdminRail {...baseProps({ pendingAppointments: [] })} />, { wrapper: Wrapper });
    expect(screen.getByText('No hay citas pendientes')).toBeInTheDocument();
  });
});

// ── Confirmar / Reasignar wiring + gating ───────────────────────────────────────

describe('AgendaAdminRail — actions', () => {
  it('clicking Confirmar calls onConfirm with the cita id', () => {
    const onConfirm = vi.fn();
    render(
      <AgendaAdminRail
        {...baseProps({ pendingAppointments: [makePending({ id: 55 })], onConfirm })}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Lucía Reyes/ }));
    expect(onConfirm).toHaveBeenCalledWith(55);
  });

  it('clicking Reasignar calls onReassign with the cita id', () => {
    const onReassign = vi.fn();
    render(
      <AgendaAdminRail
        {...baseProps({ pendingAppointments: [makePending({ id: 55 })], onReassign })}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('button', { name: /Reasignar Lucía Reyes/ }));
    expect(onReassign).toHaveBeenCalledWith(55);
  });

  it('hides Confirmar/Reasignar when canManage is false (read-only)', () => {
    render(<AgendaAdminRail {...baseProps({ canManage: false })} />, { wrapper: Wrapper });
    expect(screen.queryByRole('button', { name: /Confirmar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reasignar/ })).not.toBeInTheDocument();
    // The pending item itself still renders (read-only view).
    expect(screen.getByText('Lucía Reyes')).toBeInTheDocument();
  });
});

// ── Alerts panel ─────────────────────────────────────────────────────────────────

describe('AgendaAdminRail — alerts panel', () => {
  const ALERTS: IAgendaAlert[] = [
    {
      id: 'double-1-2',
      type: 'double_booking',
      title: 'Solapamiento de citas',
      message: 'Ana y Beto se solapan en el mismo terapeuta.',
    },
    {
      id: 'cancel-9',
      type: 'cancellation',
      title: 'Cita cancelada',
      message: 'Marco · 12:00 · Masaje',
    },
  ];

  it('does not render the alerts panel when there are no alerts', () => {
    render(<AgendaAdminRail {...baseProps({ alerts: [] })} />, { wrapper: Wrapper });
    expect(screen.queryByText('Alertas del día')).not.toBeInTheDocument();
  });

  it('renders each alert with role="alert", its title and message', () => {
    render(<AgendaAdminRail {...baseProps({ alerts: ALERTS })} />, { wrapper: Wrapper });
    expect(screen.getByText('Alertas del día')).toBeInTheDocument();
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(screen.getByText('Solapamiento de citas')).toBeInTheDocument();
    expect(screen.getByText('Ana y Beto se solapan en el mismo terapeuta.')).toBeInTheDocument();
  });

  it('alert type is conveyed by a labelled dot (role="img") — not colour alone', () => {
    render(<AgendaAdminRail {...baseProps({ alerts: [ALERTS[0]] })} />, { wrapper: Wrapper });
    // The dot exposes the alert type as an accessible image label.
    expect(screen.getByRole('img', { name: 'Solapamiento' })).toBeInTheDocument();
  });

  it('alert also carries a non-color glyph', () => {
    render(<AgendaAdminRail {...baseProps({ alerts: [ALERTS[0]] })} />, { wrapper: Wrapper });
    // double_booking → ⚠ glyph
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });
});

// ── aria-live count + legend ────────────────────────────────────────────────────

describe('AgendaAdminRail — a11y & legend', () => {
  it('exposes a polite aria-live region with the pending count', () => {
    const { container } = render(<AgendaAdminRail {...baseProps()} />, { wrapper: Wrapper });
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live).toHaveTextContent('1 pendientes');
  });

  it('renders the legend items', () => {
    render(<AgendaAdminRail {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Leyenda de rituales')).toBeInTheDocument();
    expect(screen.getByText('Tradicional / Hierbas')).toBeInTheDocument();
  });
});
