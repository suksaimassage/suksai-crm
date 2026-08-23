/**
 * CitaModal.test.tsx
 *
 * The create/edit appointment modal. The form uses custom (portal) Selects whose
 * full open→pick interaction is mostly avoided here (multi-field cascades,
 * search, keyboard nav — see the Select component's own test suite), so these
 * tests focus on the deterministically-observable contract:
 *   - create vs edit title + submit label,
 *   - loading-options / options-empty (per-field hint) / missing-prereqs states,
 *   - submit gating (disabled while options load / when prereqs are missing),
 *   - the client-side validation path (empty form → rule error banner via the
 *     real Zod schema + useActionState),
 *   - edit-prefilling (fields disabled while the cita loads),
 *   - a11y: dialog, error banner role="alert", derived-end aria-live region.
 *   - the split slot-field caption (noTherapistFallback vs noSchedule) DOES
 *     drive one real Select (Servicio) — its trigger is a labelable <button
 *     id>, so `getByLabelText(/^Servicio/)` resolves it directly and the
 *     portal listbox opens synchronously in jsdom. `fecha`/`usuarioId` are set
 *     via `prefill` (CitaModal's own props→state sync effect), so no DatePicker
 *     interaction is needed either.
 *
 * Mock strategy: ALL picker/data/mutation hooks are mocked so each state is
 * driven directly; the composition-root calculateFinalPrice is stubbed. Real
 * i18n + theme + Toast provider.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { ToastProvider } from '@infra/components/ui/common/Toast';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type { ICliente, IServicio, ISala, ICita } from '@domain/models';
import type { IAgendaTerapeutaRow } from '@domain/models/agenda.models';
import { BusinessRuleViolation } from '@domain/index';

// ── Hook mocks (drive each modal state) ─────────────────────────────────────────
const mockUseCentrosActivos = vi.fn();
const mockUseClientesActivos = vi.fn();
const mockUseServiciosActivosCentro = vi.fn();
const mockUseSalasActivas = vi.fn();
const mockUseCentroMasajistas = vi.fn();
const mockUseTherapistAvailability = vi.fn();
const mockUseCitaById = vi.fn();
const mockMutateCreate = vi.fn();
const mockMutateReschedule = vi.fn();
const mockMutateChangeEstado = vi.fn();
const mockCalculateFinalPrice = vi.fn();

vi.mock('@infra/hooks/useCentrosActivos', () => ({
  useCentrosActivos: (...a: unknown[]): unknown => mockUseCentrosActivos(...a),
}));
vi.mock('@infra/hooks/useClientesActivos', () => ({
  useClientesActivos: (...a: unknown[]): unknown => mockUseClientesActivos(...a),
}));
vi.mock('@infra/hooks/useServiciosActivosCentro', () => ({
  useServiciosActivosCentro: (...a: unknown[]): unknown => mockUseServiciosActivosCentro(...a),
}));
vi.mock('@infra/hooks/useSalasActivas', () => ({
  useSalasActivas: (...a: unknown[]): unknown => mockUseSalasActivas(...a),
}));
vi.mock('@infra/hooks/useCentroMasajistas', () => ({
  useCentroMasajistas: (...a: unknown[]): unknown => mockUseCentroMasajistas(...a),
}));
vi.mock('@infra/hooks/useTherapistAvailability', () => ({
  useTherapistAvailability: (...a: unknown[]): unknown => mockUseTherapistAvailability(...a),
}));
vi.mock('@infra/hooks/useCitaById', () => ({
  useCitaById: (...a: unknown[]): unknown => mockUseCitaById(...a),
}));
vi.mock('@infra/hooks/useCreateCita', () => ({
  useCreateCita: (): unknown => ({ mutateAsync: mockMutateCreate }),
}));
vi.mock('@infra/hooks/useRescheduleCita', () => ({
  useRescheduleCita: (): unknown => ({ mutateAsync: mockMutateReschedule }),
}));
vi.mock('@infra/hooks/useChangeCitaEstado', () => ({
  useChangeCitaEstado: (): unknown => ({ mutateAsync: mockMutateChangeEstado }),
}));
vi.mock('@infra/services/agendaServices', () => ({
  citaService: {
    calculateFinalPrice: (...a: unknown[]): unknown => mockCalculateFinalPrice(...a),
  },
  availabilityService: {},
}));

// DatePicker is rendered for real: it tolerates a missing <Form> provider
// (useFormContext returns null outside a Form), so CitaModal can compose it
// inside its native <form> without a stub.

import { CitaModal } from '@infra/components/ui/domain/modals/CitaModal';

// ── i18n + providers ────────────────────────────────────────────────────────────

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
    <StyledThemeProvider theme={lightTheme}>
      <ToastProvider>{children}</ToastProvider>
    </StyledThemeProvider>
  </I18nextProvider>
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CLIENTE: ICliente = {
  id: 1,
  nombre: 'Juan',
  apellidos: 'Pérez',
  email: null,
  telefono: '+34 600 000 000',
  fechaNacimiento: null,
  observaciones: null,
  activo: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};
const SERVICIO: IServicio = {
  id: 5,
  tipoServicioId: 1,
  nombre: 'Aromaterapia',
  descripcion: null,
  duracionMinutos: 90,
  precioBase: 6500,
  esBono: false,
  sesionesTotales: null,
  tieneDescuento: false,
  porcentajeDescuento: 0,
  estado: 'activo',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};
const SALA: ISala = {
  id: 2,
  centroId: 1,
  nombre: 'Suite',
  capacidad: 1,
  activa: true,
  descripcion: null,
};
const MASAJISTA: IAgendaTerapeutaRow = { id: 3, nombre: 'Naree', apellidos: '', isActive: true };

/** All pickers loaded with one option each, availability empty, no edit cita. */
function happyHooks() {
  mockUseCentrosActivos.mockReturnValue({
    data: [
      { id: 1, nombre: 'Centro Uno' },
      { id: 2, nombre: 'Centro Dos' },
    ],
    isLoading: false,
    isError: false,
  });
  mockUseClientesActivos.mockReturnValue({ clientes: [CLIENTE], isLoading: false, isError: false });
  mockUseServiciosActivosCentro.mockReturnValue({
    servicios: [SERVICIO],
    isLoading: false,
    isError: false,
  });
  mockUseSalasActivas.mockReturnValue({ salas: [SALA], isLoading: false, isError: false });
  mockUseCentroMasajistas.mockReturnValue({
    masajistas: [MASAJISTA],
    isLoading: false,
    isError: false,
  });
  mockUseTherapistAvailability.mockReturnValue({
    slots: [],
    isLoading: false,
    isError: false,
    hadSchedule: true,
  });
  mockUseCitaById.mockReturnValue({ cita: null, isLoading: false, isError: false });
  mockCalculateFinalPrice.mockResolvedValue({ format: () => '65,00 €' });
}

function baseProps(overrides: Partial<React.ComponentProps<typeof CitaModal>> = {}) {
  return {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    mode: 'create' as const,
    centroId: 1,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  happyHooks();
});

// ── Title / labels ───────────────────────────────────────────────────────────────

describe('CitaModal — title & submit label', () => {
  it('create mode shows "Nueva cita" and "Crear cita"', () => {
    render(<CitaModal {...baseProps({ mode: 'create' })} />, { wrapper: Wrapper });
    expect(screen.getByText('Nueva cita')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear cita' })).toBeInTheDocument();
  });

  it('edit mode shows "Editar cita" and "Guardar cambios"', () => {
    render(<CitaModal {...baseProps({ mode: 'edit', citaId: 7 })} />, { wrapper: Wrapper });
    expect(screen.getByText('Editar cita')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
  });

  it('renders nothing when open is false', () => {
    render(<CitaModal {...baseProps({ open: false })} />, { wrapper: Wrapper });
    expect(screen.queryByText('Nueva cita')).not.toBeInTheDocument();
  });
});

// ── Required fields present ──────────────────────────────────────────────────────

describe('CitaModal — form fields', () => {
  it('renders the cliente, servicio, terapeuta, fecha, hora and sala field labels', () => {
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Cliente')).toBeInTheDocument();
    expect(screen.getByText('Servicio')).toBeInTheDocument();
    expect(screen.getByText('Terapeuta')).toBeInTheDocument();
    expect(screen.getByText('Fecha')).toBeInTheDocument();
    expect(screen.getByText('Hora de inicio')).toBeInTheDocument();
    expect(screen.getByText('Sala')).toBeInTheDocument();
  });

  it('shows the derived-end placeholder in an aria-live region before a service is chosen', () => {
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Selecciona servicio y hora')).toBeInTheDocument();
  });
});

// ── options-empty (per-field hint) ──────────────────────────────────────────────

describe('CitaModal — options-empty hints', () => {
  it('shows the "No hay clientes" placeholder when there are no active clientes', () => {
    // Production does not render a separate hint element for missing clientes.
    // The Select trigger displays the empty-state placeholder text directly.
    mockUseClientesActivos.mockReturnValue({ clientes: [], isLoading: false, isError: false });
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('No hay clientes')).toBeInTheDocument();
  });

  it('shows the missing-prereqs empty state when there are no active servicios', () => {
    // allPrereqsMissing = !optionsLoading && missingServicios → shows Empty, not the form hint.
    mockUseServiciosActivosCentro.mockReturnValue({
      servicios: [],
      isLoading: false,
      isError: false,
    });
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Faltan datos para reservar')).toBeInTheDocument();
  });
});

// ── slot-field status states (no-schedule fallback vs ready-empty vs error) ─────
// The distinct slot-field statuses (`noSchedule`, `error`) only render once the
// field is ENABLED, which requires the therapist + servicio + fecha + sala portal
// Selects to be driven — brittle in jsdom and deliberately avoided by this suite
// (see file header). The hook-level `hadSchedule` contract that DRIVES these
// states is covered exhaustively in useTherapistAvailability.test.tsx and
// AvailabilityService.test.ts. Here we lock only the deterministically-reachable
// invariant: while the field is DISABLED (default — prereqs unmet), NEITHER the
// no-schedule caption NOR the availability-error caption appears prematurely (the
// A11y "no premature status" requirement). The enabled-state DOM is flagged
// [NEEDS MANUAL] in the Tester report.
describe('CitaModal — slot-field status (no premature caption)', () => {
  it('does NOT render the no-schedule caption while the slot field is disabled (hadSchedule=false)', () => {
    // Even though the service reports no schedule, the field is disabled (no
    // therapist/servicio/fecha/sala chosen yet) → the caption must stay hidden.
    mockUseTherapistAvailability.mockReturnValue({
      slots: [],
      isLoading: false,
      isError: false,
      hadSchedule: false,
    });
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    expect(
      screen.queryByText('Sin horario ese día · se muestra el turno completo'),
    ).not.toBeInTheDocument();
  });

  it('does NOT render the availability-error caption while the slot field is disabled', () => {
    mockUseTherapistAvailability.mockReturnValue({
      slots: [],
      isLoading: false,
      isError: true,
      hadSchedule: true,
    });
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    // The error placeholder belongs to the (disabled) field; the standalone error
    // status text must not appear as a live region while disabled.
    expect(screen.queryByText('No se pudo comprobar la disponibilidad')).not.toBeInTheDocument();
  });
});

// ── split slot-field captions (noTherapistFallback vs noSchedule) ──────────────
// Unlike the disabled-state guard above, these three cases need the field
// ENABLED (servicioId + fecha both set) to observe which caption renders.
// `fecha` (and `usuarioId`, when a therapist IS picked) come from `prefill` —
// synced to controlled state by CitaModal's own effect, no Select interaction
// needed. `servicioId` has no prefill hook, so it's set via the REAL Select
// (trigger is a labelable <button id> — `getByLabelText('Servicio')` resolves
// it directly; the portal listbox opens synchronously in jsdom).
describe('CitaModal — split slot-field captions (noTherapistFallback vs noSchedule)', () => {
  it('usuarioId empty + hadSchedule=false → shows the NEW "no therapist" caption, not the old one', async () => {
    mockUseTherapistAvailability.mockReturnValue({
      slots: [
        {
          start: new Date('2026-05-18T10:00:00'),
          end: new Date('2026-05-18T11:00:00'),
          salaId: null,
        },
      ],
      isLoading: false,
      isError: false,
      hadSchedule: false,
    });
    render(<CitaModal {...baseProps({ prefill: { fecha: '2026-05-18' } })} />, {
      wrapper: Wrapper,
    });

    fireEvent.click(screen.getByLabelText(/^Servicio/));
    fireEvent.click(await screen.findByRole('option', { name: /Aromaterapia/ }));

    expect(
      await screen.findByText('Sin terapeuta asignado · horario general 10:00–20:00'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Sin horario ese día · se muestra el turno completo'),
    ).not.toBeInTheDocument();
  });

  it('usuarioId SET + hadSchedule=false → shows the ORIGINAL "no schedule that day" caption, not the new one', async () => {
    mockUseTherapistAvailability.mockReturnValue({
      slots: [
        {
          start: new Date('2026-05-18T10:00:00'),
          end: new Date('2026-05-18T11:00:00'),
          salaId: null,
        },
      ],
      isLoading: false,
      isError: false,
      hadSchedule: false,
    });
    render(
      <CitaModal {...baseProps({ prefill: { fecha: '2026-05-18', usuarioId: MASAJISTA.id } })} />,
      { wrapper: Wrapper },
    );

    fireEvent.click(screen.getByLabelText(/^Servicio/));
    fireEvent.click(await screen.findByRole('option', { name: /Aromaterapia/ }));

    expect(
      await screen.findByText('Sin horario ese día · se muestra el turno completo'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Sin terapeuta asignado · horario general 10:00–20:00'),
    ).not.toBeInTheDocument();
  });

  it('hadSchedule=true → neither fallback caption renders (real availability, no fallback)', async () => {
    // happyHooks() default already sets hadSchedule: true.
    render(<CitaModal {...baseProps({ prefill: { fecha: '2026-05-18' } })} />, {
      wrapper: Wrapper,
    });

    fireEvent.click(screen.getByLabelText(/^Servicio/));
    fireEvent.click(await screen.findByRole('option', { name: /Aromaterapia/ }));

    // Flush the async calculateFinalPrice update the selection triggers so it
    // resolves inside this test's act() boundary rather than bleeding into
    // whichever test runs next.
    await waitFor(() => {
      expect(screen.getByText('65,00 €')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Sin terapeuta asignado/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sin horario ese día/)).not.toBeInTheDocument();
  });
});

// ── missing-prereqs → Empty body, no form ────────────────────────────────────────
// Production: allPrereqsMissing = !optionsLoading && missingServicios (only servicios blocks).

describe('CitaModal — missing prerequisites', () => {
  it('replaces the form with the "Faltan datos para reservar" empty state when servicios are missing', () => {
    mockUseServiciosActivosCentro.mockReturnValue({
      servicios: [],
      isLoading: false,
      isError: false,
    });
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Faltan datos para reservar')).toBeInTheDocument();
    // The servicio field label is not rendered (the form is replaced by Empty).
    expect(screen.queryByText('Servicio')).not.toBeInTheDocument();
  });

  it('disables the submit button when servicios are missing', () => {
    mockUseServiciosActivosCentro.mockReturnValue({
      servicios: [],
      isLoading: false,
      isError: false,
    });
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Crear cita' })).toBeDisabled();
  });
});

// ── loading-options ──────────────────────────────────────────────────────────────

describe('CitaModal — loading options', () => {
  it('disables the submit button while option sets are still loading', () => {
    mockUseClientesActivos.mockReturnValue({ clientes: [], isLoading: true, isError: false });
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Crear cita' })).toBeDisabled();
  });
});

// ── edit-prefilling ──────────────────────────────────────────────────────────────

describe('CitaModal — edit prefilling', () => {
  it('disables the Cancelar/submit affordances while the cita is loading', () => {
    mockUseCitaById.mockReturnValue({ cita: null, isLoading: true, isError: false });
    render(<CitaModal {...baseProps({ mode: 'edit', citaId: 7 })} />, { wrapper: Wrapper });
    // prefilling → submit disabled
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
  });

  it('pre-fills the observaciones field from the loaded cita', async () => {
    const cita: ICita = {
      id: 7,
      clienteId: 1,
      usuarioId: 3,
      centroId: 1,
      salaId: 2,
      servicioId: 5,
      fechaHoraInicio: new Date('2026-05-18T14:00:00'),
      fechaHoraFin: new Date('2026-05-18T15:30:00'),
      estado: 'pendiente',
      precioFinal: 6500,
      notas: 'Cliente prefiere camilla baja',
      createdAt: new Date('2026-05-01'),
      updatedAt: new Date('2026-05-01'),
    };
    mockUseCitaById.mockReturnValue({ cita, isLoading: false, isError: false });
    render(<CitaModal {...baseProps({ mode: 'edit', citaId: 7 })} />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Cliente prefiere camilla baja')).toBeInTheDocument();
    });
  });
});

// ── Validation path (empty form → rule banner) ──────────────────────────────────

describe('CitaModal — client-side validation', () => {
  it('submitting with empty fields surfaces the first Zod rule error in a role="alert" banner', async () => {
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    // Submit the form directly (custom Selects are unset → schema fails).
    // Schema validates servicioId first (required), not clienteId (optional).
    fireEvent.click(screen.getByRole('button', { name: 'Crear cita' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona un servicio');
    // The mutation must NOT have been attempted on a validation failure.
    expect(mockMutateCreate).not.toHaveBeenCalled();
  });
});

// ── start-time field gating (servicioId + fecha gate the slot field) ─────────────
// Production: slotFieldDisabled = fieldsDisabled || servicioId === '' || fecha === ''
// (sala and masajista are optional and do NOT gate the slot field).

describe('CitaModal — start-time field requires servicio and fecha', () => {
  it('shows the "needs fields" placeholder while no servicio/fecha is chosen', () => {
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    // The needsFields copy shown when servicioId or fecha is still empty.
    const placeholder = screen.getByText('Elige servicio y fecha primero');
    expect(placeholder).toBeInTheDocument();
    // It is rendered inside the disabled start-time trigger (button[id=cita-hora]).
    const trigger = placeholder.closest('button');
    expect(trigger).not.toBeNull();
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('id', 'cita-hora');
  });

  it('keeps the start-time field disabled when servicio and fecha are not yet selected', () => {
    // All option sets are present (happyHooks) but the controlled fields start
    // empty (servicioId='' and fecha='') — slotFieldDisabled stays true.
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    const trigger = screen.getByText('Elige servicio y fecha primero').closest('button');
    expect(trigger).toBeDisabled();
  });
});

// ── availability hook wiring (salaId + excludeCitaId pass-through) ──────────────

describe('CitaModal — availability hook wiring', () => {
  it('passes salaId:null (unset) and no excludeCitaId in create mode initially', () => {
    render(<CitaModal {...baseProps({ mode: 'create' })} />, { wrapper: Wrapper });
    expect(mockUseTherapistAvailability).toHaveBeenCalled();
    const lastCall = mockUseTherapistAvailability.mock.calls.at(-1)?.[0] as {
      salaId: number | null;
      excludeCitaId: number | undefined;
    };
    // Nothing selected yet → salaId resolves to null; create mode → no exclusion.
    expect(lastCall.salaId).toBeNull();
    expect(lastCall.excludeCitaId).toBeUndefined();
  });

  it("passes excludeCitaId = citaId in edit mode (so the cita's own slot is not hidden)", () => {
    const cita: ICita = {
      id: 7,
      clienteId: 1,
      usuarioId: 3,
      centroId: 1,
      salaId: 2,
      servicioId: 5,
      fechaHoraInicio: new Date('2026-05-18T14:00:00'),
      fechaHoraFin: new Date('2026-05-18T15:30:00'),
      estado: 'pendiente',
      precioFinal: 6500,
      notas: null,
      createdAt: new Date('2026-05-01'),
      updatedAt: new Date('2026-05-01'),
    };
    mockUseCitaById.mockReturnValue({ cita, isLoading: false, isError: false });
    render(<CitaModal {...baseProps({ mode: 'edit', citaId: 7 })} />, { wrapper: Wrapper });
    const calls = mockUseTherapistAvailability.mock.calls.map(
      (c) => c[0] as { excludeCitaId: number | undefined; salaId: number | null },
    );
    // Every render in edit mode forwards the cita id as the exclusion.
    expect(calls.every((c) => c.excludeCitaId === 7)).toBe(true);
  });
});

// ── field order (Sala precedes Hora de inicio — Analyst §4 reorder) ─────────────

describe('CitaModal — field order', () => {
  it('renders the Sala field BEFORE the Hora de inicio field in the DOM (tab/SR order)', () => {
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    const salaLabel = screen.getByText('Sala');
    const horaLabel = screen.getByText('Hora de inicio');
    // DOCUMENT_POSITION_FOLLOWING (4) means horaLabel comes AFTER salaLabel.
    const relation = salaLabel.compareDocumentPosition(horaLabel);
    expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

// ── inline presentation (presentation="inline") ─────────────────────────────────
// The additive, retro-compatible variant embedded by AgendaCalendarOverlay: it
// renders ONLY the form body + a flat action footer, with NO generic-Modal
// dialog/backdrop (avoids dialog-inside-dialog, WCAG 2.1.2). All business logic
// (Zod, mutation hooks, onSuccess) is unchanged — only the surface differs.

describe('CitaModal — inline presentation', () => {
  it('renders the form + section-title heading WITHOUT the modal dialog chrome', () => {
    render(<CitaModal {...baseProps({ presentation: 'inline' })} />, { wrapper: Wrapper });
    // No generic Modal wrapper → no dialog role / backdrop.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Title is an <h3> section heading, not the Modal.Header.
    const heading = screen.getByRole('heading', { level: 3, name: 'Nueva cita' });
    expect(heading).toHaveAttribute('id', 'cita-inline-title');
    // The form itself and the action buttons are still present.
    expect(document.getElementById('cita-form')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear cita' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('still replaces the form with the missing-prereqs Empty when servicios are missing', () => {
    mockUseServiciosActivosCentro.mockReturnValue({
      servicios: [],
      isLoading: false,
      isError: false,
    });
    render(<CitaModal {...baseProps({ presentation: 'inline' })} />, { wrapper: Wrapper });
    expect(screen.getByText('Faltan datos para reservar')).toBeInTheDocument();
    expect(document.getElementById('cita-form')).not.toBeInTheDocument();
  });

  it('runs the SAME reschedule mutation + onSuccess when a pre-filled cita is submitted', async () => {
    const cita: ICita = {
      id: 7,
      clienteId: 1,
      usuarioId: 3,
      centroId: 1,
      salaId: 2,
      servicioId: 5,
      fechaHoraInicio: new Date('2026-05-18T14:00:00'),
      fechaHoraFin: new Date('2026-05-18T15:30:00'),
      estado: 'pendiente',
      precioFinal: 6500,
      notas: 'Nota inline',
      createdAt: new Date('2026-05-01'),
      updatedAt: new Date('2026-05-01'),
    };
    mockUseCitaById.mockReturnValue({ cita, isLoading: false, isError: false });
    mockMutateReschedule.mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    render(
      <CitaModal {...baseProps({ mode: 'edit', citaId: 7, presentation: 'inline', onSuccess })} />,
      { wrapper: Wrapper },
    );
    // Wait for the edit prefill effect to sync the cita into the controlled fields.
    await waitFor(() => {
      expect(screen.getByDisplayValue('Nota inline')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => {
      expect(mockMutateReschedule).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('updated', 'Juan Pérez');
    });
  });

  it('default presentation (prop omitted) keeps rendering the modal dialog', () => {
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

// ── centro selector (Slice B: pick the centro on create, read-only on edit) ──────
// The centro scopes servicio/sala/masajista, so it sits at the top of the form.
// Options come from useCentrosActivos() — ALL active centros system-wide, not
// just the ones the logged-in user is personally assigned to.

describe('CitaModal — centro selector', () => {
  it('create mode renders the centro selector with all active centros as options', async () => {
    render(<CitaModal {...baseProps({ mode: 'create' })} />, { wrapper: Wrapper });
    // Field label present (create → required, but the label text is still "Centro").
    expect(screen.getByText('Centro')).toBeInTheDocument();
    // The user's centros populate the Select options.
    fireEvent.click(screen.getByLabelText(/^Centro/));
    expect(await screen.findByRole('option', { name: 'Centro Uno' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Centro Dos' })).toBeInTheDocument();
  });

  it('changing the centro resets servicio/sala/masajista and re-scopes the pickers', async () => {
    render(<CitaModal {...baseProps({ mode: 'create' })} />, { wrapper: Wrapper });

    // Pick a servicio first so the reset is observable.
    fireEvent.click(screen.getByLabelText(/^Servicio/));
    fireEvent.click(await screen.findByRole('option', { name: /Aromaterapia/ }));
    expect(screen.getByLabelText(/^Servicio/)).toHaveTextContent('Aromaterapia');

    // Switch centro from the default (id 1) to "Centro Dos" (id 2).
    fireEvent.click(screen.getByLabelText(/^Centro/));
    fireEvent.click(await screen.findByRole('option', { name: 'Centro Dos' }));

    // The dependent pickers are re-scoped to the newly selected centro id.
    await waitFor(() => {
      expect(mockUseServiciosActivosCentro.mock.calls.at(-1)?.[0]).toBe(2);
    });
    expect(mockUseSalasActivas.mock.calls.at(-1)?.[0]).toBe(2);
    expect(mockUseCentroMasajistas.mock.calls.at(-1)?.[0]).toBe(2);

    // The servicio selection was cleared (belonged to the previous centro).
    expect(screen.getByLabelText(/^Servicio/)).toHaveTextContent('Selecciona un servicio');
  });

  it('includes the selected centroId in the create payload', async () => {
    mockMutateCreate.mockResolvedValue(undefined);
    mockUseTherapistAvailability.mockReturnValue({
      slots: [
        {
          start: new Date('2030-01-01T10:00:00'),
          end: new Date('2030-01-01T11:00:00'),
          salaId: null,
        },
      ],
      isLoading: false,
      isError: false,
      hadSchedule: true,
    });
    render(<CitaModal {...baseProps({ mode: 'create', prefill: { fecha: '2030-01-01' } })} />, {
      wrapper: Wrapper,
    });

    // Choose a non-default centro (id 2).
    fireEvent.click(screen.getByLabelText(/^Centro/));
    fireEvent.click(await screen.findByRole('option', { name: 'Centro Dos' }));

    // Required: servicio + hora (fecha comes from prefill).
    fireEvent.click(screen.getByLabelText(/^Servicio/));
    fireEvent.click(await screen.findByRole('option', { name: /Aromaterapia/ }));
    fireEvent.click(screen.getByLabelText(/^Hora de inicio/));
    fireEvent.click(await screen.findByRole('option', { name: '10:00' }));

    fireEvent.click(screen.getByRole('button', { name: 'Crear cita' }));

    await waitFor(() => {
      expect(mockMutateCreate).toHaveBeenCalledTimes(1);
    });
    expect(mockMutateCreate.mock.calls[0]?.[0]).toMatchObject({ centroId: 2 });
  });

  it('edit mode shows the centro as read-only (disabled, not changeable)', () => {
    const cita: ICita = {
      id: 7,
      clienteId: 1,
      usuarioId: 3,
      centroId: 2,
      salaId: 2,
      servicioId: 5,
      fechaHoraInicio: new Date('2026-05-18T14:00:00'),
      fechaHoraFin: new Date('2026-05-18T15:30:00'),
      estado: 'pendiente',
      precioFinal: 6500,
      notas: null,
      createdAt: new Date('2026-05-01'),
      updatedAt: new Date('2026-05-01'),
    };
    mockUseCitaById.mockReturnValue({ cita, isLoading: false, isError: false });
    render(<CitaModal {...baseProps({ mode: 'edit', citaId: 7, centroId: 2 })} />, {
      wrapper: Wrapper,
    });
    const centroTrigger = screen.getByLabelText(/^Centro/);
    // Disabled → the centro cannot be changed while editing an existing cita.
    expect(centroTrigger).toBeDisabled();
    // Shows the cita's centro name resolved from useCentrosActivos.
    expect(centroTrigger).toHaveTextContent('Centro Dos');
  });
});

// ── therapist/centro mismatch (masajista must belong to the selected centro) ────
// The therapist picker is already scoped to the selected centro
// (useCentroMasajistas), but a stale prefill/edit value can still point at a
// mismatched therapist — both the client-side pre-check and the domain-layer
// fallback (CitaService rule 4) must surface the same friendly message.

describe('CitaModal — therapist/centro mismatch', () => {
  it('blocks submit with "Esa masajista no pertenece a ese centro" when the prefilled therapist is not in the centro list', async () => {
    render(<CitaModal {...baseProps({ mode: 'create', prefill: { usuarioId: 999 } })} />, {
      wrapper: Wrapper,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Crear cita' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esa masajista no pertenece a ese centro',
    );
    expect(mockMutateCreate).not.toHaveBeenCalled();
  });

  it('translates a USUARIO_NOT_ASSIGNED_TO_CENTRO BusinessRuleViolation from the server into the same friendly message', async () => {
    mockMutateCreate.mockRejectedValue(
      new BusinessRuleViolation(
        'User 3 is not assigned to Centro 1',
        'USUARIO_NOT_ASSIGNED_TO_CENTRO',
      ),
    );
    mockUseTherapistAvailability.mockReturnValue({
      slots: [
        {
          start: new Date('2030-01-01T10:00:00'),
          end: new Date('2030-01-01T11:00:00'),
          salaId: null,
        },
      ],
      isLoading: false,
      isError: false,
      hadSchedule: true,
    });
    render(
      <CitaModal
        {...baseProps({
          mode: 'create',
          prefill: { fecha: '2030-01-01', usuarioId: MASAJISTA.id },
        })}
      />,
      { wrapper: Wrapper },
    );

    // The prefilled therapist IS in the centro's list, so the client pre-check
    // passes and the mutation actually runs (exercising the catch-block mapping).
    fireEvent.click(screen.getByLabelText(/^Servicio/));
    fireEvent.click(await screen.findByRole('option', { name: /Aromaterapia/ }));
    fireEvent.click(screen.getByLabelText(/^Hora de inicio/));
    fireEvent.click(await screen.findByRole('option', { name: '10:00' }));

    fireEvent.click(screen.getByRole('button', { name: 'Crear cita' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esa masajista no pertenece a ese centro',
    );
  });
});

// ── onDirty (unsaved-input signal for a hosting overlay) ─────────────────────────
// Consumed by AgendaCalendarOverlay to warn before its `key`-based remount
// (switching kanban selection) silently discards in-progress input. Must fire
// on genuine field edits only — never from the prefill/edit-sync effects.

describe('CitaModal — onDirty', () => {
  it('does NOT fire on mount from create-mode prefill (props → state sync, not user input)', () => {
    const onDirty = vi.fn();
    render(
      <CitaModal
        {...baseProps({
          mode: 'create',
          prefill: { fecha: '2030-01-01', usuarioId: MASAJISTA.id },
          onDirty,
        })}
      />,
      { wrapper: Wrapper },
    );
    expect(onDirty).not.toHaveBeenCalled();
  });

  it('does NOT fire on mount from edit-mode prefill (loading an existing cita)', async () => {
    const onDirty = vi.fn();
    const cita: ICita = {
      id: 7,
      clienteId: 1,
      usuarioId: 3,
      centroId: 1,
      salaId: 2,
      servicioId: 5,
      fechaHoraInicio: new Date('2026-05-18T14:00:00'),
      fechaHoraFin: new Date('2026-05-18T15:30:00'),
      estado: 'pendiente',
      precioFinal: 6500,
      notas: null,
      createdAt: new Date('2026-05-01'),
      updatedAt: new Date('2026-05-01'),
    };
    mockUseCitaById.mockReturnValue({ cita, isLoading: false, isError: false });
    render(<CitaModal {...baseProps({ mode: 'edit', citaId: 7, onDirty })} />, {
      wrapper: Wrapper,
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/^Servicio/)).toHaveTextContent('Aromaterapia');
    });
    expect(onDirty).not.toHaveBeenCalled();
  });

  it('fires when the user picks a servicio (a real field edit)', async () => {
    const onDirty = vi.fn();
    render(<CitaModal {...baseProps({ mode: 'create', onDirty })} />, { wrapper: Wrapper });

    fireEvent.click(screen.getByLabelText(/^Servicio/));
    fireEvent.click(await screen.findByRole('option', { name: /Aromaterapia/ }));

    expect(onDirty).toHaveBeenCalled();
  });

  it('fires when the user types in observaciones', () => {
    const onDirty = vi.fn();
    render(<CitaModal {...baseProps({ mode: 'create', onDirty })} />, { wrapper: Wrapper });

    fireEvent.change(screen.getByLabelText(/^Observaciones/), {
      target: { value: 'Cliente pide toallas' },
    });

    expect(onDirty).toHaveBeenCalled();
  });
});

// ── a11y ─────────────────────────────────────────────────────────────────────────

describe('CitaModal — accessibility', () => {
  it('renders as a dialog', () => {
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('exposes the derived end-time as an aria-live region labelled by the end label', () => {
    render(<CitaModal {...baseProps()} />, { wrapper: Wrapper });
    // The derived-end value region announces start/servicio-driven updates.
    const region = screen.getByText('Selecciona servicio y hora');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-labelledby', 'cita-fin-label');
  });
});
