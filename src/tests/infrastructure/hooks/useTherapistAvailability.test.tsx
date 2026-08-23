/**
 * useTherapistAvailability.test.tsx
 *
 * Contract tests for the slot-prefilling hook used by the CitaModal start-time
 * Select. Wraps availabilityService.getAvailableSlots (composition root).
 *
 * GATE (relaxed): usuarioId and salaId are structurally OPTIONAL in the service
 * (null → generic studio fallback / no-sala check) — the query is enabled as
 * soon as centroId + fecha + duracionMinutos (>0) are present. usuarioId=null
 * and salaId=null must each independently NOT disable the query — this is the
 * behaviour that unblocks the "no masajista picked" create flow.
 *
 * In edit mode the modal passes excludeCitaId so the cita being rescheduled is
 * dropped from the overlap sets; the hook forwards it and includes it in the key.
 *
 * API NOTE: getAvailableSlots now resolves an `IAvailabilityResult`
 * `{ slots, hadSchedule }` (was a bare slot array). The hook unwraps `.slots` and
 * surfaces `.hadSchedule` (defaulting to `true` while loading / before data so the
 * no-schedule caption never flashes prematurely).
 *
 * Mock strategy: composition root mocked with a vi.fn() getAvailableSlots. The
 * domain service is NOT mocked elsewhere — only the I/O boundary the hook calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockGetAvailableSlots = vi.fn();

vi.mock('@infra/services/agendaServices', () => ({
  availabilityService: {
    getAvailableSlots: (...a: unknown[]): unknown => mockGetAvailableSlots(...a),
  },
  citaService: {},
}));

import { useTherapistAvailability } from '@infra/hooks/useTherapistAvailability';
import type { IUseTherapistAvailabilityParams } from '@infra/hooks/useTherapistAvailability';
import type { IAvailableSlot, IAvailabilityResult } from '@domain/index';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

const SLOTS: IAvailableSlot[] = [
  { start: new Date('2026-05-18T10:00:00'), end: new Date('2026-05-18T11:00:00'), salaId: 4 },
  { start: new Date('2026-05-18T11:00:00'), end: new Date('2026-05-18T12:00:00'), salaId: 4 },
];

/** The service resolves an IAvailabilityResult; default to a worked-day result. */
function result(overrides: Partial<IAvailabilityResult> = {}): IAvailabilityResult {
  return { slots: SLOTS, hadSchedule: true, ...overrides };
}

// All five inputs present (usuarioId/salaId are optional but supplied here).
const FULL_PARAMS: IUseTherapistAvailabilityParams = {
  usuarioId: 2,
  centroId: 3,
  fecha: '2026-05-18',
  duracionMinutos: 60,
  salaId: 4,
};

// Only the three REQUIRED inputs — usuarioId/salaId omitted (null) on purpose.
const MINIMAL_PARAMS: IUseTherapistAvailabilityParams = {
  usuarioId: null,
  centroId: 3,
  fecha: '2026-05-18',
  duracionMinutos: 60,
  salaId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useTherapistAvailability', () => {
  it('returns the available slots when all params are present', async () => {
    mockGetAvailableSlots.mockResolvedValue(result());
    const { result: hook } = renderHook(() => useTherapistAvailability(FULL_PARAMS), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(hook.current.isLoading).toBe(false);
    });
    expect(hook.current.slots).toHaveLength(2);
  });

  it('calls getAvailableSlots with usuario, centro, parsed date, duration and salaId', async () => {
    mockGetAvailableSlots.mockResolvedValue(result());
    renderHook(() => useTherapistAvailability(FULL_PARAMS), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockGetAvailableSlots).toHaveBeenCalled();
    });
    const [usuarioId, centroId, parsedDate, duracion, salaId, excludeCitaId] = mockGetAvailableSlots
      .mock.calls[0] as [number, number, Date, number, number, number?];
    expect(usuarioId).toBe(2);
    expect(centroId).toBe(3);
    expect(parsedDate).toBeInstanceOf(Date);
    expect(duracion).toBe(60);
    expect(salaId).toBe(4);
    // No edit mode → excludeCitaId is undefined.
    expect(excludeCitaId).toBeUndefined();
  });

  it('forwards excludeCitaId to the service in edit mode', async () => {
    mockGetAvailableSlots.mockResolvedValue(result());
    renderHook(() => useTherapistAvailability({ ...FULL_PARAMS, excludeCitaId: 77 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockGetAvailableSlots).toHaveBeenCalled();
    });
    const args = mockGetAvailableSlots.mock.calls[0] as unknown[];
    expect(args[5]).toBe(77);
  });

  it.each([
    ['centroId null', { ...FULL_PARAMS, centroId: null }],
    ['fecha null', { ...FULL_PARAMS, fecha: null }],
    ['duracion null', { ...FULL_PARAMS, duracionMinutos: null }],
    ['duracion 0', { ...FULL_PARAMS, duracionMinutos: 0 }],
  ])('is disabled (no fetch, empty slots) when %s', (_label, params) => {
    const { result } = renderHook(() => useTherapistAvailability(params), {
      wrapper: createWrapper(),
    });
    expect(result.current.slots).toEqual([]);
    expect(mockGetAvailableSlots).not.toHaveBeenCalled();
  });
});

// ── Relaxed gate: usuarioId/salaId are OPTIONAL, never disabling ───────────────
describe('useTherapistAvailability — relaxed gate (usuarioId/salaId optional)', () => {
  it('usuarioId=null does NOT disable the query — it still fetches (generic studio fallback)', async () => {
    mockGetAvailableSlots.mockResolvedValue(result());
    const { result: hook } = renderHook(
      () => useTherapistAvailability({ ...FULL_PARAMS, usuarioId: null }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(hook.current.isLoading).toBe(false);
    });
    expect(hook.current.slots).toHaveLength(2);
    const [usuarioIdArg] = mockGetAvailableSlots.mock.calls[0] as [number | null];
    expect(usuarioIdArg).toBeNull();
  });

  it('salaId=null does NOT disable the query — it still fetches (no sala-overlap check)', async () => {
    mockGetAvailableSlots.mockResolvedValue(result());
    const { result: hook } = renderHook(
      () => useTherapistAvailability({ ...FULL_PARAMS, salaId: null }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(hook.current.isLoading).toBe(false);
    });
    expect(hook.current.slots).toHaveLength(2);
    const salaIdArg = (mockGetAvailableSlots.mock.calls[0] as unknown[])[4];
    expect(salaIdArg).toBeNull();
  });

  it('MINIMAL_PARAMS (only centro/fecha/duración) fetches with usuarioId AND salaId passed through as null', async () => {
    mockGetAvailableSlots.mockResolvedValue(result());
    renderHook(() => useTherapistAvailability(MINIMAL_PARAMS), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(mockGetAvailableSlots).toHaveBeenCalled();
    });
    const [usuarioId, centroId, , duracion, salaId] = mockGetAvailableSlots.mock.calls[0] as [
      number | null,
      number,
      Date,
      number,
      number | null,
    ];
    expect(usuarioId).toBeNull();
    expect(salaId).toBeNull();
    expect(centroId).toBe(3);
    expect(duracion).toBe(60);
  });
});

describe('useTherapistAvailability — misc', () => {
  it('refetches when salaId changes (the key includes salaId)', async () => {
    mockGetAvailableSlots.mockResolvedValue(result());
    const wrapper = createWrapper();
    const { rerender } = renderHook(
      (p: IUseTherapistAvailabilityParams) => useTherapistAvailability(p),
      {
        wrapper,
        initialProps: FULL_PARAMS,
      },
    );
    await waitFor(() => {
      expect(mockGetAvailableSlots).toHaveBeenCalledTimes(1);
    });
    // Change only the sala → a distinct query key → a second fetch.
    rerender({ ...FULL_PARAMS, salaId: 99 });
    await waitFor(() => {
      expect(mockGetAvailableSlots).toHaveBeenCalledTimes(2);
    });
    const secondCallSala = (mockGetAvailableSlots.mock.calls[1] as unknown[])[4];
    expect(secondCallSala).toBe(99);
  });

  it('exposes the error state when the service rejects', async () => {
    mockGetAvailableSlots.mockRejectedValue(new Error('boom'));
    const { result: hook } = renderHook(() => useTherapistAvailability(FULL_PARAMS), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(hook.current.isError).toBe(true);
    });
    expect(hook.current.slots).toEqual([]);
  });
});

// ── hadSchedule passthrough (distinguishes no-schedule fallback from ready-empty)
describe('useTherapistAvailability — hadSchedule', () => {
  it('surfaces hadSchedule=true from the service result (worked day)', async () => {
    mockGetAvailableSlots.mockResolvedValue(result({ slots: SLOTS, hadSchedule: true }));
    const { result: hook } = renderHook(() => useTherapistAvailability(FULL_PARAMS), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(hook.current.isLoading).toBe(false);
    });
    expect(hook.current.hadSchedule).toBe(true);
  });

  it('surfaces hadSchedule=false (no window applied → full-grid fallback)', async () => {
    // The service returned the full grid as a fallback: slots present, but no real
    // schedule. The modal uses this to show the "no schedule that day" caption.
    mockGetAvailableSlots.mockResolvedValue(result({ slots: SLOTS, hadSchedule: false }));
    const { result: hook } = renderHook(() => useTherapistAvailability(FULL_PARAMS), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(hook.current.isLoading).toBe(false);
    });
    expect(hook.current.hadSchedule).toBe(false);
  });

  it('defaults hadSchedule to true while the query is disabled (no premature caption)', () => {
    // Disabled (centroId null — usuarioId is no longer a disabling input) → query
    // never runs → no data → must NOT report hadSchedule=false (that would flash
    // the no-schedule caption before any input).
    const { result: hook } = renderHook(
      () => useTherapistAvailability({ ...FULL_PARAMS, centroId: null }),
      { wrapper: createWrapper() },
    );
    expect(hook.current.hadSchedule).toBe(true);
    expect(hook.current.slots).toEqual([]);
  });

  it('defaults hadSchedule to true while an ENABLED usuarioId=null query is still in flight', () => {
    // usuarioId=null no longer disables the query — it fetches immediately. Before
    // the mocked promise resolves, hadSchedule must still default to true (same
    // "no premature caption" guarantee, now exercised on the enabled path).
    mockGetAvailableSlots.mockReturnValue(new Promise(() => undefined)); // never resolves
    const { result: hook } = renderHook(
      () => useTherapistAvailability({ ...FULL_PARAMS, usuarioId: null }),
      { wrapper: createWrapper() },
    );
    expect(hook.current.isLoading).toBe(true);
    expect(hook.current.hadSchedule).toBe(true);
  });

  it('defaults hadSchedule to true on error (the empty list is an error, not a missing schedule)', async () => {
    mockGetAvailableSlots.mockRejectedValue(new Error('boom'));
    const { result: hook } = renderHook(() => useTherapistAvailability(FULL_PARAMS), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(hook.current.isError).toBe(true);
    });
    expect(hook.current.hadSchedule).toBe(true);
  });
});
