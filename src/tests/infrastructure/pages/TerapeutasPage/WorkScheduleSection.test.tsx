/**
 * WorkScheduleSection.test.tsx
 *
 * Behaviour tests for the page-local wrapper that adapts domain data to the
 * WorkScheduleCalendar black box. The calendar itself is STUBBED (treated as a
 * foreign black box per the brief) and re-exposes its write callbacks as plain
 * buttons so we can drive them deterministically and assert the wrapper's logic:
 *
 *   - read gate: loading / error / employees-empty states (State Inventory)
 *   - RBAC: write callbacks present only for superadmin/recepcionista (Goal 7)
 *   - §8 recurrente READ-ONLY contract: rec: ids never mutate; esp: ids do
 *   - Edge 8: a zero-length / inverted time range is rejected with an error toast
 *   - Edge 9: centro_id NOT NULL — a create with centroId null never mutates
 *   - employees + shifts derivation passed to the calendar (Goal 4)
 *
 * Mocks: all hooks, useUserStore, useToast, and WorkScheduleCalendar. No
 * QueryClient needed because the data hooks are fully stubbed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
// NOTE: this project does NOT depend on @testing-library/user-event; the entire
// existing suite uses fireEvent. We follow that established convention.
import { ThemeProvider } from 'styled-components';
import { theme } from '@infra/styles/themes/light.theme';
import type { ReactNode } from 'react';
import type { ITerapeutaAggregate } from '@infra/hooks/useTerapeutas';
import type { IHorarioTrabajo, ICreateHorarioDTO } from '@domain/models';
import type {
  Employee,
  Shift,
  WorkScheduleCalendarProps,
} from '@infra/components/ui/shared/WorkScheduleCalendar';
import type { IUpdateHorarioInput } from '@infra/hooks/useUpdateHorario';

// Mutation-callback option shapes (onSuccess/onError handlers React Query passes).
interface IMutateOpts {
  onSuccess: () => void;
  onError: () => void;
}

// ── i18n mock (t returns key, interpolating opts) ─────────────────────────────

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

// ── Hook mocks ────────────────────────────────────────────────────────────────

const useTerapeutasMock = vi.fn<() => unknown>();
const useCentroHorariosMock = vi.fn<() => unknown>();
const createMutate = vi.fn<(dto: ICreateHorarioDTO, opts: IMutateOpts) => void>();
const updateMutate = vi.fn<(input: IUpdateHorarioInput, opts: IMutateOpts) => void>();
const deleteMutate = vi.fn<(id: number, opts: IMutateOpts) => void>();
const useUserStoreMock = vi.fn<(selector: (s: unknown) => unknown) => unknown>();
const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastInfo = vi.fn();

// Responsive Day-view geometry hook. Mocked to a deterministic band so the
// section's slotWidth/density plumbing is asserted without standing up a
// width-driven matchMedia (the hook itself is unit-tested in
// useScheduleViewportConfig.test.ts). Default is the tablet-landscape band —
// the viewport class the responsive fix targets. Mutate before render to vary.
let viewportConfigMock: { slotWidth: number; density: 'xs' | 'sm' | 'md' } = {
  slotWidth: 64,
  density: 'sm',
};

vi.mock('@infra/hooks/useTerapeutas', () => ({
  useTerapeutas: () => useTerapeutasMock(),
}));
vi.mock('@infra/hooks/useCentroHorarios', () => ({
  useCentroHorarios: () => useCentroHorariosMock(),
}));
vi.mock('@infra/hooks/useCreateHorario', () => ({
  useCreateHorario: () => ({ mutate: createMutate }),
}));
// updateHorario.isPending drives the calendar's `rescheduleSubmitting` prop
// (Confirm-button loading state). Mutable so a test can flip it before render.
let updateIsPending = false;
vi.mock('@infra/hooks/useUpdateHorario', () => ({
  useUpdateHorario: () => ({ mutate: updateMutate, isPending: updateIsPending }),
}));
vi.mock('@infra/hooks/useDeleteHorario', () => ({
  useDeleteHorario: () => ({ mutate: deleteMutate }),
}));
vi.mock('@app/stores/useUserStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown) => useUserStoreMock(selector),
}));
vi.mock('@infra/components/ui/common/Toast', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError, info: toastInfo }),
}));
vi.mock('@infra/hooks/useScheduleViewportConfig', () => ({
  useScheduleViewportConfig: () => viewportConfigMock,
}));

// WorkScheduleCalendar black-box stub: records props and re-exposes write
// callbacks as buttons. Buttons render ONLY when their callback is defined,
// mirroring the RBAC `canWrite ? handler : undefined` wiring.
let lastCalendarProps: WorkScheduleCalendarProps | null = null;
// Captures the boolean handleReschedule returns (accepted = true / rejected = false).
let lastRescheduleResult: boolean | undefined;
vi.mock('@infra/components/ui/shared/WorkScheduleCalendar', () => ({
  WorkScheduleCalendar: (props: WorkScheduleCalendarProps) => {
    lastCalendarProps = props;
    // Echo the read-only predicate's verdict for an esp: vs rec: shift so the
    // wiring (isShiftReadOnly = isRecurrenteShiftId) is assertable on the stub.
    const sample = (id: string): Shift => ({
      id,
      employeeId: '1',
      date: '2026-05-14',
      startTime: '10:00',
      endTime: '12:00',
    });
    return (
      <div
        data-testid="calendar-stub"
        data-slot-width={String(props.slotWidth)}
        data-density={String(props.density)}
        data-reschedule-submitting={String(props.rescheduleSubmitting)}
        data-readonly-esp={String(props.isShiftReadOnly?.(sample('esp:42')))}
        data-readonly-rec={String(props.isShiftReadOnly?.(sample('rec:5:2026-05-04')))}
      >
        <span data-testid="employee-count">{props.employees.length}</span>
        <span data-testid="shift-count">{props.shifts?.length ?? 0}</span>
        {props.onShiftReschedule && (
          <>
            {/* Reassign esp:42 to therapist 2 (the dropped-on row), new time 11:00–15:00. */}
            <button
              type="button"
              data-testid="reschedule-result"
              data-result={String(lastRescheduleResult)}
              onClick={() => {
                lastRescheduleResult = props.onShiftReschedule?.({
                  id: 'esp:42',
                  employeeId: '2',
                  date: '2026-05-14',
                  startTime: '11:00',
                  endTime: '15:00',
                });
              }}
            >
              fire-reschedule-reassign
            </button>
            {/* Reschedule an inverted-range esp shift (validation must reject → false). */}
            <button
              type="button"
              onClick={() => {
                lastRescheduleResult = props.onShiftReschedule?.({
                  id: 'esp:42',
                  employeeId: '1',
                  date: '2026-05-14',
                  startTime: '15:00',
                  endTime: '11:00',
                });
              }}
            >
              fire-reschedule-inverted
            </button>
            {/* Reschedule a recurrente shift (read-only → no-op, returns false). */}
            <button
              type="button"
              onClick={() => {
                lastRescheduleResult = props.onShiftReschedule?.({
                  id: 'rec:5:2026-05-04',
                  employeeId: '1',
                  date: '2026-05-04',
                  startTime: '11:00',
                  endTime: '15:00',
                });
              }}
            >
              fire-reschedule-recurrente
            </button>
          </>
        )}
        {props.onShiftCreate && (
          <>
            <button
              type="button"
              onClick={() =>
                props.onShiftCreate?.({
                  employeeId: '1',
                  date: '2026-05-14',
                  startTime: '10:00',
                  endTime: '12:00',
                })
              }
            >
              fire-create-valid
            </button>
            <button
              type="button"
              onClick={() =>
                props.onShiftCreate?.({
                  employeeId: '1',
                  date: '2026-05-14',
                  startTime: '12:00',
                  endTime: '10:00',
                })
              }
            >
              fire-create-inverted
            </button>
          </>
        )}
        {props.onShiftUpdate && (
          <>
            <button
              type="button"
              onClick={() =>
                props.onShiftUpdate?.({
                  id: 'esp:42',
                  employeeId: '1',
                  date: '2026-05-14',
                  startTime: '11:00',
                  endTime: '15:00',
                })
              }
            >
              fire-update-especifico
            </button>
            <button
              type="button"
              onClick={() =>
                props.onShiftUpdate?.({
                  id: 'rec:5:2026-05-04',
                  employeeId: '1',
                  date: '2026-05-04',
                  startTime: '11:00',
                  endTime: '15:00',
                })
              }
            >
              fire-update-recurrente
            </button>
            <button
              type="button"
              onClick={() =>
                props.onShiftUpdate?.({
                  id: 'esp:42',
                  employeeId: '1',
                  date: '2026-05-14',
                  startTime: '15:00',
                  endTime: '11:00',
                })
              }
            >
              fire-update-inverted
            </button>
          </>
        )}
        {props.onShiftDelete && (
          <>
            <button type="button" onClick={() => props.onShiftDelete?.('esp:42')}>
              fire-delete-especifico
            </button>
            <button type="button" onClick={() => props.onShiftDelete?.('rec:5:2026-05-04')}>
              fire-delete-recurrente
            </button>
          </>
        )}
      </div>
    );
  },
}));

import { WorkScheduleSection } from '@infra/pages/TerapeutasPage/components/WorkScheduleSection';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeAggregate(overrides: Partial<ITerapeutaAggregate> = {}): ITerapeutaAggregate {
  return {
    usuarioId: 1,
    nombre: 'Ana García',
    apellidos: '',
    email: '',
    telefono: null,
    activo: true,
    createdAt: new Date('2023-01-01'),
    estadoActual: 'disponible',
    salaActual: null,
    proximaCita: null,
    proximaCitaSala: null,
    horariosSemanales: [],
    totalHorasSemana: 0,
    sesionesEstaSemana: 0,
    ingresosSemana: 0,
    valoracionMedia: null,
    especialidades: ['Masaje'],
    roles: [],
    servicioMasRealizado: null,
    ...overrides,
  };
}

function makeHorario(overrides: Partial<IHorarioTrabajo> = {}): IHorarioTrabajo {
  return {
    id: 1,
    usuarioId: 1,
    centroId: 10,
    tipo: 'especifico',
    diaSemana: null,
    // Inside the current month so the mapper keeps it (range = current month).
    fecha: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    horaInicio: '09:00',
    horaFin: '17:00',
    activo: true,
    ...overrides,
  };
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

interface ISetupOverrides {
  readonly roles?: readonly string[];
  readonly terapeutas?: readonly ITerapeutaAggregate[];
  readonly terapeutasLoading?: boolean;
  readonly horarios?: readonly IHorarioTrabajo[];
  readonly horariosLoading?: boolean;
  readonly isError?: boolean;
}

function setupMocks(o: ISetupOverrides = {}) {
  useUserStoreMock.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({ user: { roles: o.roles ?? ['superadmin'] } }),
  );
  useTerapeutasMock.mockReturnValue({
    data: o.terapeutas ?? [makeAggregate()],
    isLoading: o.terapeutasLoading ?? false,
    isError: false,
    refetch: vi.fn(),
  });
  useCentroHorariosMock.mockReturnValue({
    data: o.horarios ?? [],
    isLoading: o.horariosLoading ?? false,
    isError: o.isError ?? false,
    refetch: vi.fn(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  lastCalendarProps = null;
  lastRescheduleResult = undefined;
  // Restore the default responsive band between tests (one test overrides it).
  viewportConfigMock = { slotWidth: 64, density: 'sm' };
  updateIsPending = false;
});

// ── Read gate ──────────────────────────────────────────────────────────────────

describe('WorkScheduleSection — read gate', () => {
  it('renders the loading status (not the calendar) while data loads', () => {
    setupMocks({ horariosLoading: true });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    expect(screen.getByText('schedule.loading')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-stub')).not.toBeInTheDocument();
  });

  it('loading container is marked aria-busy', () => {
    setupMocks({ terapeutasLoading: true });
    render(<WorkScheduleSection centroId={10} />, { wrapper });
    // Two role="status" exist while loading (the section + the Spinner); assert on
    // the busy container that carries the loading text.
    const busy = screen.getByText('schedule.loading').closest('[aria-busy]');
    expect(busy).toHaveAttribute('aria-busy', 'true');
  });

  it('renders the error alert + retry button when the read fails', () => {
    setupMocks({ isError: true });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('schedule.error.title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'schedule.error.retry' })).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-stub')).not.toBeInTheDocument();
  });

  it('invokes refetch when the retry button is clicked', () => {
    const refetch = vi.fn();
    setupMocks();
    useCentroHorariosMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      refetch,
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'schedule.error.retry' }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders the empty state when the centre has no therapists', () => {
    setupMocks({ terapeutas: [] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    expect(screen.getByText('schedule.empty')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-stub')).not.toBeInTheDocument();
  });
});

// ── Data derivation (Goal 4) ────────────────────────────────────────────────

describe('WorkScheduleSection — data derivation', () => {
  it('maps therapists to calendar employees', () => {
    setupMocks({
      terapeutas: [
        makeAggregate({ usuarioId: 1, nombre: 'Ana' }),
        makeAggregate({ usuarioId: 2, nombre: 'Bruno' }),
      ],
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    expect(screen.getByTestId('employee-count')).toHaveTextContent('2');
    const employees: Employee[] = lastCalendarProps!.employees;
    expect(employees.map((e) => e.id)).toEqual(['1', '2']);
    expect(employees[0]?.name).toBe('Ana');
    expect(employees[0]?.role).toBe('Masaje'); // first especialidad
  });

  it('maps active horarios to shifts via the pure mapper and passes them down', () => {
    setupMocks({
      terapeutas: [makeAggregate({ usuarioId: 1 })],
      horarios: [makeHorario({ id: 42, usuarioId: 1 })],
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    expect(screen.getByTestId('shift-count')).toHaveTextContent('1');
    const shifts: Shift[] = lastCalendarProps!.shifts ?? [];
    expect(shifts[0]?.id).toBe('esp:42');
  });

  it('drops orphan horarios whose therapist is absent from the centre (Edge 10)', () => {
    setupMocks({
      terapeutas: [makeAggregate({ usuarioId: 1 })],
      horarios: [makeHorario({ id: 9, usuarioId: 999 })],
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });
    expect(screen.getByTestId('shift-count')).toHaveTextContent('0');
  });
});

// ── Responsive Day-view config plumbing (tablet-landscape fix) ───────────────
// The section consumes useScheduleViewportConfig() and forwards its (slotWidth,
// density) pair to the WorkScheduleCalendar so the fixed-pixel Day grid fits the
// content column at tablet landscape. The hook is mocked here (it is unit-tested
// in useScheduleViewportConfig.test.ts); these tests prove the WIRING only.
describe('WorkScheduleSection — responsive Day-view config', () => {
  it('forwards the tablet band (slotWidth 64, density sm) to the calendar', () => {
    viewportConfigMock = { slotWidth: 64, density: 'sm' };
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    expect(lastCalendarProps?.slotWidth).toBe(64);
    expect(lastCalendarProps?.density).toBe('sm');
    // Also visible on the stub DOM (echoed as data-* attributes).
    const stub = screen.getByTestId('calendar-stub');
    expect(stub).toHaveAttribute('data-slot-width', '64');
    expect(stub).toHaveAttribute('data-density', 'sm');
  });

  it('forwards the wide band (slotWidth 96, density md) unchanged', () => {
    viewportConfigMock = { slotWidth: 96, density: 'md' };
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    expect(lastCalendarProps?.slotWidth).toBe(96);
    expect(lastCalendarProps?.density).toBe('md');
  });

  it('forwards the compact band (slotWidth 48, density xs) unchanged', () => {
    viewportConfigMock = { slotWidth: 48, density: 'xs' };
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    expect(lastCalendarProps?.slotWidth).toBe(48);
    expect(lastCalendarProps?.density).toBe('xs');
  });

  it('passes the config even for a read-only role (geometry is independent of RBAC)', () => {
    viewportConfigMock = { slotWidth: 64, density: 'sm' };
    setupMocks({ roles: ['masajista'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    // Write callbacks are withheld, but the responsive geometry is still applied.
    expect(lastCalendarProps?.onShiftCreate).toBeUndefined();
    expect(lastCalendarProps?.slotWidth).toBe(64);
    expect(lastCalendarProps?.density).toBe('sm');
  });
});

// ── RBAC (Goal 7) ────────────────────────────────────────────────────────────

describe('WorkScheduleSection — RBAC write capability', () => {
  it('passes write callbacks to the calendar for a superadmin', () => {
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    expect(lastCalendarProps?.onShiftCreate).toBeTypeOf('function');
    expect(lastCalendarProps?.onShiftUpdate).toBeTypeOf('function');
    expect(lastCalendarProps?.onShiftDelete).toBeTypeOf('function');
  });

  it('passes write callbacks for a recepcionista', () => {
    setupMocks({ roles: ['recepcionista'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });
    expect(lastCalendarProps?.onShiftCreate).toBeTypeOf('function');
  });

  it('withholds ALL write callbacks for a read-only role (masajista)', () => {
    setupMocks({ roles: ['masajista'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    expect(lastCalendarProps?.onShiftCreate).toBeUndefined();
    expect(lastCalendarProps?.onShiftUpdate).toBeUndefined();
    expect(lastCalendarProps?.onShiftDelete).toBeUndefined();
    // The write-affordance buttons in the stub are therefore absent.
    expect(screen.queryByRole('button', { name: 'fire-create-valid' })).not.toBeInTheDocument();
  });

  it('grants write capability via the union of roles (read-only + writer)', () => {
    setupMocks({ roles: ['masajista', 'recepcionista'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });
    expect(lastCalendarProps?.onShiftCreate).toBeTypeOf('function');
  });

  it('treats a user with no roles as read-only', () => {
    setupMocks({ roles: [] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });
    expect(lastCalendarProps?.onShiftCreate).toBeUndefined();
  });
});

// ── Create path (especifico) + Edge 8 / Edge 9 ───────────────────────────────

describe('WorkScheduleSection — create', () => {
  it('creates an especifico horario for a valid draft and toasts success', () => {
    setupMocks({ roles: ['superadmin'] });
    createMutate.mockImplementation((_dto, opts) => {
      opts.onSuccess();
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-create-valid' }));

    expect(createMutate).toHaveBeenCalledOnce();
    const dto = createMutate.mock.calls[0]?.[0];
    expect(dto).toMatchObject({
      usuarioId: 1,
      centroId: 10,
      tipo: 'especifico',
      horaInicio: '10:00',
      horaFin: '12:00',
    });
    // especifico create carries a fecha and omits diaSemana (Edge 7).
    expect(dto.fecha).toBeInstanceOf(Date);
    expect(dto.diaSemana).toBeUndefined();
    expect(toastSuccess).toHaveBeenCalledWith('schedule.toast.created');
  });

  it('rejects an inverted time range without mutating (Edge 8)', () => {
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-create-inverted' }));

    expect(createMutate).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith('schedule.error.title');
  });

  it('toasts an error when the create mutation rejects (network failure)', () => {
    setupMocks({ roles: ['superadmin'] });
    createMutate.mockImplementation((_dto, opts) => {
      opts.onError();
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-create-valid' }));
    expect(toastError).toHaveBeenCalledWith('schedule.error.title');
  });

  it('does NOT create when centroId is null (Edge 9 — centro_id NOT NULL)', () => {
    // Force write affordances on with a null centro to prove the in-handler guard.
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={null} />, { wrapper });

    // With employees present and canWrite, the create button renders; firing it must no-op.
    const btn = screen.queryByRole('button', { name: 'fire-create-valid' });
    if (btn !== null) {
      fireEvent.click(btn);
    }
    expect(createMutate).not.toHaveBeenCalled();
  });
});

// ── §8 recurrente READ-ONLY contract ─────────────────────────────────────────

describe('WorkScheduleSection — recurrente read-only contract (§8)', () => {
  it('updates an especifico shift (esp: id) via the update mutation', () => {
    setupMocks({ roles: ['superadmin'] });
    updateMutate.mockImplementation((_input, opts) => {
      opts.onSuccess();
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-update-especifico' }));

    expect(updateMutate).toHaveBeenCalledOnce();
    const input = updateMutate.mock.calls[0]?.[0];
    expect(input.id).toBe(42);
    expect(input.data).toMatchObject({
      tipo: 'especifico',
      horaInicio: '11:00',
      horaFin: '15:00',
    });
    expect(toastSuccess).toHaveBeenCalledWith('schedule.toast.updated');
  });

  it('NO-OPS an update of a recurrente shift (rec: id) — never rewrites the template', () => {
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-update-recurrente' }));

    expect(updateMutate).not.toHaveBeenCalled();
    // Surfaces the non-blocking informational toast.
    expect(toastInfo).toHaveBeenCalledWith('schedule.recurrente_readonly');
  });

  it('rejects an especifico update with an inverted range (Edge 8) without mutating', () => {
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-update-inverted' }));

    expect(updateMutate).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith('schedule.error.title');
  });

  it('deletes an especifico shift via the soft-delete mutation', () => {
    setupMocks({ roles: ['superadmin'] });
    deleteMutate.mockImplementation((_id, opts) => {
      opts.onSuccess();
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-delete-especifico' }));

    expect(deleteMutate).toHaveBeenCalledWith(42, expect.any(Object));
    expect(toastSuccess).toHaveBeenCalledWith('schedule.toast.deleted');
  });

  it('NO-OPS a delete of a recurrente shift (rec: id)', () => {
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-delete-recurrente' }));

    expect(deleteMutate).not.toHaveBeenCalled();
    expect(toastInfo).toHaveBeenCalledWith('schedule.recurrente_readonly');
  });

  it('toasts an error when the delete mutation rejects', () => {
    setupMocks({ roles: ['superadmin'] });
    deleteMutate.mockImplementation((_id, opts) => {
      opts.onError();
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-delete-especifico' }));
    expect(toastError).toHaveBeenCalledWith('schedule.error.title');
  });
});

// ── Overlap rejection write path (actively-enforced findScheduleConflict layer) ──
// The REAL domain `findScheduleConflict` runs inside the section (NOT mocked — per
// the no-mocking-domain rule). These tests seed loaded `horarios` that conflict
// (or not) with the stub's fired create/update drafts and assert the section
// aborts BEFORE mutating + shows the overlap error toast (no optimistic flash),
// while the half-open / self-exclusion / cross-tipo rules hold end-to-end.
//
// Stub draft coordinates (from the calendar stub above):
//   create → employee '1', date 2026-05-14, 10:00–12:00
//   update → esp:42, employee '1', date 2026-05-14, 11:00–15:00
describe('WorkScheduleSection — overlap rejection (write path)', () => {
  it('aborts a CREATE that overlaps an existing especifico on the same date (no mutation, error toast)', () => {
    // Existing especifico on 2026-05-14 09:00–11:00 — overlaps the draft 10:00–12:00.
    setupMocks({
      roles: ['superadmin'],
      horarios: [
        makeHorario({
          id: 7,
          usuarioId: 1,
          tipo: 'especifico',
          diaSemana: null,
          fecha: new Date(2026, 4, 14),
          horaInicio: '09:00',
          horaFin: '11:00',
        }),
      ],
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-create-valid' }));

    // Rejected BEFORE any write — no optimistic shift can flash because the mutation
    // never fires.
    expect(createMutate).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith('schedule.error.overlap.title', {
      description: 'schedule.error.overlap.description',
    });
  });

  it('ALLOWS a CREATE that only TOUCHES an existing especifico endpoint (half-open, no conflict)', () => {
    // Existing especifico 08:00–10:00 ends exactly where the draft (10:00–12:00)
    // starts → back-to-back, NOT a conflict → the create proceeds.
    setupMocks({
      roles: ['superadmin'],
      horarios: [
        makeHorario({
          id: 7,
          usuarioId: 1,
          tipo: 'especifico',
          diaSemana: null,
          fecha: new Date(2026, 4, 14),
          horaInicio: '08:00',
          horaFin: '10:00',
        }),
      ],
    });
    createMutate.mockImplementation((_dto, opts) => {
      opts.onSuccess();
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-create-valid' }));

    expect(createMutate).toHaveBeenCalledOnce();
    expect(toastSuccess).toHaveBeenCalledWith('schedule.toast.created');
  });

  it('does NOT treat an existing RECURRENTE as a conflict for an especifico CREATE (cross-tipo)', () => {
    // 2026-05-14 is a Thursday (ISO 4). A recurrente Thursday window that overlaps
    // the draft in clock time is NOT a write-time conflict — the especifico wins at
    // read time (override model). The create proceeds.
    setupMocks({
      roles: ['superadmin'],
      horarios: [
        makeHorario({
          id: 8,
          usuarioId: 1,
          tipo: 'recurrente',
          diaSemana: 4, // Thursday — same weekday as 2026-05-14
          fecha: null,
          horaInicio: '09:00',
          horaFin: '13:00',
        }),
      ],
    });
    createMutate.mockImplementation((_dto, opts) => {
      opts.onSuccess();
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-create-valid' }));

    expect(createMutate).toHaveBeenCalledOnce();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('aborts an UPDATE that overlaps a DIFFERENT especifico on the same date', () => {
    // Editing esp:42 to 11:00–15:00; a different row esp:99 sits 12:00–14:00 on the
    // same date → conflict → abort, error toast, no mutation.
    setupMocks({
      roles: ['superadmin'],
      horarios: [
        makeHorario({
          id: 42,
          usuarioId: 1,
          tipo: 'especifico',
          diaSemana: null,
          fecha: new Date(2026, 4, 14),
          horaInicio: '11:00',
          horaFin: '15:00',
        }),
        makeHorario({
          id: 99,
          usuarioId: 1,
          tipo: 'especifico',
          diaSemana: null,
          fecha: new Date(2026, 4, 14),
          horaInicio: '12:00',
          horaFin: '14:00',
        }),
      ],
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-update-especifico' }));

    expect(updateMutate).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith('schedule.error.overlap.title', {
      description: 'schedule.error.overlap.description',
    });
  });

  it('ALLOWS an UPDATE of esp:42 against its OWN row (self-exclusion — never conflicts with itself)', () => {
    // The only loaded row IS esp:42 (the one being edited). Without self-exclusion
    // the new times would "conflict" with its own former times; with it, the update
    // proceeds.
    setupMocks({
      roles: ['superadmin'],
      horarios: [
        makeHorario({
          id: 42,
          usuarioId: 1,
          tipo: 'especifico',
          diaSemana: null,
          fecha: new Date(2026, 4, 14),
          horaInicio: '10:00',
          horaFin: '12:00',
        }),
      ],
    });
    updateMutate.mockImplementation((_input, opts) => {
      opts.onSuccess();
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-update-especifico' }));

    expect(updateMutate).toHaveBeenCalledOnce();
    expect(toastSuccess).toHaveBeenCalledWith('schedule.toast.updated');
  });
});

// ── Drag-reschedule commit (Surface B) ───────────────────────────────────────
// handleReschedule is the consumer commit the calendar calls ONLY after the user
// confirms a drag. It differs from handleUpdate in two owner-mandated ways:
//   1. the update payload includes `usuarioId` so a cross-row reassignment
//      persists (Latent Defect #2 — was dropped, card jumped back after refetch);
//   2. the overlap check runs against the TARGET therapist (candidate.usuarioId =
//      the dropped-on employeeId).
// It returns a boolean (accepted/rejected) so the calendar avoids a false success.
describe('WorkScheduleSection — drag reschedule commit (handleReschedule)', () => {
  it('passes onShiftReschedule + isShiftReadOnly to the calendar for a writer', () => {
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });
    expect(lastCalendarProps?.onShiftReschedule).toBeTypeOf('function');
    expect(lastCalendarProps?.isShiftReadOnly).toBeTypeOf('function');
  });

  it('withholds onShiftReschedule for a read-only role (masajista)', () => {
    setupMocks({ roles: ['masajista'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });
    expect(lastCalendarProps?.onShiftReschedule).toBeUndefined();
    // isShiftReadOnly is RBAC-independent (always supplied so recurrente reads as locked).
    expect(lastCalendarProps?.isShiftReadOnly).toBeTypeOf('function');
  });

  it('isShiftReadOnly is the recurrente predicate (rec: → true, esp: → false)', () => {
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });
    const stub = screen.getByTestId('calendar-stub');
    expect(stub).toHaveAttribute('data-readonly-rec', 'true');
    expect(stub).toHaveAttribute('data-readonly-esp', 'false');
  });

  it('forwards updateHorario.isPending as rescheduleSubmitting', () => {
    updateIsPending = true;
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });
    expect(lastCalendarProps?.rescheduleSubmitting).toBe(true);
    expect(screen.getByTestId('calendar-stub')).toHaveAttribute(
      'data-reschedule-submitting',
      'true',
    );
  });

  it('persists a reassignment WITH usuarioId of the target therapist (Latent Defect #2)', () => {
    setupMocks({ roles: ['superadmin'] }); // no loaded horarios → no overlap
    updateMutate.mockImplementation((_input, opts) => {
      opts.onSuccess();
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-reschedule-reassign' }));

    expect(updateMutate).toHaveBeenCalledOnce();
    const input = updateMutate.mock.calls[0]?.[0];
    expect(input.id).toBe(42);
    // The payload carries the NEW therapist (employeeId '2' → usuarioId 2) so the
    // reassignment actually persists — this is the whole point of Defect #2.
    expect(input.data).toMatchObject({
      usuarioId: 2,
      tipo: 'especifico',
      horaInicio: '11:00',
      horaFin: '15:00',
      centroId: 10,
    });
    expect(input.data.fecha).toBeInstanceOf(Date);
    expect(toastSuccess).toHaveBeenCalledWith('schedule.toast.updated');
    // Accepted → returns true so the calendar applies the optimistic move.
    expect(lastRescheduleResult).toBe(true);
  });

  it('runs the overlap check against the TARGET therapist and rejects on conflict (no mutation)', () => {
    // Therapist 2 already has an especifico on 2026-05-14 12:00–14:00; the dragged
    // shift lands on therapist 2 at 11:00–15:00 → overlap for the TARGET → reject.
    // (Therapist 1, the origin, is irrelevant to the target-scoped overlap.)
    setupMocks({
      roles: ['superadmin'],
      horarios: [
        makeHorario({
          id: 77,
          usuarioId: 2, // the TARGET therapist
          tipo: 'especifico',
          diaSemana: null,
          fecha: new Date(2026, 4, 14),
          horaInicio: '12:00',
          horaFin: '14:00',
        }),
      ],
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-reschedule-reassign' }));

    expect(updateMutate).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith('schedule.error.overlap.title', {
      description: 'schedule.error.overlap.description',
    });
    // Rejected → returns false so the calendar keeps the card at origin (no false success).
    expect(lastRescheduleResult).toBe(false);
  });

  it('does NOT treat the ORIGIN therapist a conflict (overlap is target-scoped)', () => {
    // Therapist 1 (the origin) has a clashing window, but the shift is being
    // reassigned to therapist 2 (free) → no conflict for the target → it persists.
    setupMocks({
      roles: ['superadmin'],
      horarios: [
        makeHorario({
          id: 88,
          usuarioId: 1, // ORIGIN therapist — must NOT block a move to therapist 2
          tipo: 'especifico',
          diaSemana: null,
          fecha: new Date(2026, 4, 14),
          horaInicio: '11:00',
          horaFin: '15:00',
        }),
      ],
    });
    updateMutate.mockImplementation((_input, opts) => {
      opts.onSuccess();
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-reschedule-reassign' }));

    expect(updateMutate).toHaveBeenCalledOnce();
    expect(updateMutate.mock.calls[0]?.[0].data).toMatchObject({ usuarioId: 2 });
    expect(toastError).not.toHaveBeenCalled();
    expect(lastRescheduleResult).toBe(true);
  });

  it('rejects an inverted time range without mutating (returns false)', () => {
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-reschedule-inverted' }));

    expect(updateMutate).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith('schedule.error.title');
    expect(lastRescheduleResult).toBe(false);
  });

  it('NO-OPS a recurrente reschedule (rec: id) — never rewrites the template, returns false', () => {
    // Defense-in-depth: the calendar blocks recurrente drags, but the consumer
    // must still refuse one that slips through.
    setupMocks({ roles: ['superadmin'] });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-reschedule-recurrente' }));

    expect(updateMutate).not.toHaveBeenCalled();
    expect(toastInfo).toHaveBeenCalledWith('schedule.recurrente_readonly');
    expect(lastRescheduleResult).toBe(false);
  });

  it('toasts an error when the reschedule mutation rejects (network failure)', () => {
    setupMocks({ roles: ['superadmin'] });
    updateMutate.mockImplementation((_input, opts) => {
      opts.onError();
    });
    render(<WorkScheduleSection centroId={10} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'fire-reschedule-reassign' }));

    expect(toastError).toHaveBeenCalledWith('schedule.error.title');
    // The mutation WAS dispatched (accepted) — the async error is surfaced via toast,
    // so the commit still reports true (consistent with the EditModal save path).
    expect(lastRescheduleResult).toBe(true);
  });
});
