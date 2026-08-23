/**
 * AvailabilityService.test.ts
 *
 * Tests the I/O orchestration of the REAL AvailabilityService (never mocked —
 * per .claude/rules/testing.md). The architectural boundary — the repository
 * PORTS — are faked with vi.fn()s; the real DateRange/TimeRange value objects, the
 * real `toTherapistSchedule`/`isEspecifico` helpers and the real pure
 * `computeAvailableStartTimes` run unmocked. Each test overrides the minimum set
 * of port responses to assert one orchestration contract:
 *   - resolves the working WINDOWS from horarios under the OVERRIDE model
 *     (especifico replaces recurrente; multiple especifico = split shifts; full
 *     grid when none applies),
 *   - fetches bookings for ONLY the selected sala (one findBySala) + the therapist,
 *   - filters cancelled citas and the excluded cita out of BOTH booking sets,
 *   - excludes approved (not pending) absences,
 *   - returns IAvailabilityResult { slots, hadSchedule } with each slot carrying
 *     the passed salaId and end = start + duración,
 *   - isUsuarioAvailable is unchanged.
 *
 * ── API NOTE (migrated) ────────────────────────────────────────────────────────
 * getAvailableSlots now returns `IAvailabilityResult { slots, hadSchedule }`
 * (was a bare IAvailableSlot[]). `hadSchedule` is `true` when ≥1 active window was
 * resolved (the therapist works that day), `false` when none applied and the full
 * open–close grid was used as a fallback. Helpers below read `.slots`.
 *
 * Time handling: the service derives the weekday via getDay() (local) and matches
 * specific horarios on the LOCAL calendar day (so a local-midnight request and a
 * UTC-midnight stored `fecha` resolve to the same date in any positive-offset TZ).
 * Fixtures are pinned to local Monday 2026-05-18 so the recurrente diaSemana=1
 * match holds in any timezone.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvailabilityService } from '@domain/services/AvailabilityService';
import type { IAvailabilityResult } from '@domain/services/AvailabilityService';
import type { ICita, IHorarioTrabajo, IAusencia } from '@domain/models';

// ── Fixed instants (LOCAL → Monday 2026-05-18) ────────────────────────────────
const Y = 2026;
const MO = 4;
const D = 18;
function at(h: number, m = 0): Date {
  return new Date(Y, MO, D, h, m, 0, 0);
}
const FECHA = at(0, 0);

const USUARIO_ID = 9;
const CENTRO_ID = 1;
const SALA_ID = 7;
const OTHER_SALA_ID = 8;

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeHorarioRecurrente(overrides: Partial<IHorarioTrabajo> = {}): IHorarioTrabajo {
  return {
    id: 50,
    usuarioId: USUARIO_ID,
    centroId: CENTRO_ID,
    tipo: 'recurrente',
    diaSemana: 1, // Monday — matches FECHA
    fecha: null,
    horaInicio: '09:00',
    horaFin: '21:00',
    activo: true,
    ...overrides,
  };
}

/**
 * An especifico row whose `fecha` is the UTC-midnight Date for FECHA's local
 * calendar day (2026-05-18) — exactly the shape the adapter produces from a DB
 * `date` (`new Date('YYYY-MM-DD')`). This reproduces the positive-offset-TZ shape
 * so the override resolver's local-YMD compare is exercised honestly.
 */
function makeHorarioEspecifico(overrides: Partial<IHorarioTrabajo> = {}): IHorarioTrabajo {
  return {
    id: 51,
    usuarioId: USUARIO_ID,
    centroId: CENTRO_ID,
    tipo: 'especifico',
    diaSemana: null,
    fecha: new Date('2026-05-18T00:00:00.000Z'),
    horaInicio: '10:00',
    horaFin: '12:00',
    activo: true,
    ...overrides,
  };
}

function makeCita(overrides: Partial<ICita> = {}): ICita {
  return {
    id: 100,
    clienteId: 4,
    usuarioId: USUARIO_ID,
    centroId: CENTRO_ID,
    salaId: SALA_ID,
    servicioId: 3,
    fechaHoraInicio: at(10, 0),
    fechaHoraFin: at(11, 0),
    estado: 'confirmada',
    precioFinal: 5000,
    notas: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function makeAusencia(overrides: Partial<IAusencia> = {}): IAusencia {
  return {
    id: 1,
    usuarioId: USUARIO_ID,
    tipo: 'vacaciones',
    fechaInicio: at(0, 0),
    fechaFin: at(23, 59),
    motivo: null,
    aprobada: true,
    aprobadaPor: 1,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function makeDeps() {
  const horarioRepository = {
    findByUsuarioAndCentro: vi.fn().mockResolvedValue([makeHorarioRecurrente()]),
  };
  const ausenciaRepository = {
    findByUsuario: vi.fn().mockResolvedValue([]),
  };
  const citaRepository = {
    findByUsuario: vi.fn().mockResolvedValue([]),
    findBySala: vi.fn().mockResolvedValue([]),
  };
  const salaRepository = {
    findActivasByCentro: vi.fn().mockResolvedValue([]),
  };
  return { horarioRepository, ausenciaRepository, citaRepository, salaRepository };
}

function makeService(deps: ReturnType<typeof makeDeps>): AvailabilityService {
  return new AvailabilityService(
    deps as unknown as ConstructorParameters<typeof AvailabilityService>[0],
  );
}

/** Produces "HH:MM" wall-clock strings from a result's slots' start dates. */
function startsHHMM(result: IAvailabilityResult): string[] {
  return result.slots.map(
    (s) =>
      `${s.start.getHours().toString().padStart(2, '0')}:${s.start
        .getMinutes()
        .toString()
        .padStart(2, '0')}`,
  );
}

// ════════════════════════════════════════════════════════════════════════════
// getAvailableSlots — window resolution (OVERRIDE model)
// ════════════════════════════════════════════════════════════════════════════

describe('AvailabilityService.getAvailableSlots — window resolution', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: AvailabilityService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
  });

  it('uses the active recurrente horario for the weekday as the working window', async () => {
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ horaInicio: '10:00', horaFin: '12:00' }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(startsHHMM(result)).toEqual(['10:00', '10:30', '11:00']);
    expect(result.hadSchedule).toBe(true);
  });

  it('falls back to the full studio window when NO active horario applies (hadSchedule=false)', async () => {
    // No matching horario → service passes windows:[] → full 09:00–20:00 grid.
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(startsHHMM(result).at(0)).toBe('09:00');
    expect(startsHHMM(result).at(-1)).toBe('20:00');
    expect(result.slots).toHaveLength(23);
    // The full grid is a FALLBACK, not a real schedule.
    expect(result.hadSchedule).toBe(false);
  });

  it('falls back to the full window when the only horario is for a different weekday', async () => {
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ diaSemana: 2 }), // Tuesday — FECHA is Monday
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(result.slots).toHaveLength(23); // full window, not empty
    expect(result.hadSchedule).toBe(false);
  });

  it('ignores inactive horarios (falls back to the full window)', async () => {
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ horaInicio: '10:00', horaFin: '12:00', activo: false }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(result.slots).toHaveLength(23); // full window
    expect(result.hadSchedule).toBe(false);
  });

  it('OVERRIDE: an active especifico for the date REPLACES the recurrente window', async () => {
    // The adapter maps a DB `date` to a UTC-midnight Date (`new Date('YYYY-MM-DD')`),
    // while the requested day (FECHA) is LOCAL midnight. The especifico fecha is the
    // UTC-midnight Date for FECHA's local calendar day (2026-05-18). This asserts the
    // narrowed window resolves against a local-day request and would fail under a raw
    // toISOString() compare on the requested side in any positive-offset TZ.
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ horaInicio: '09:00', horaFin: '21:00' }), // would give full grid
      makeHorarioEspecifico({ horaInicio: '10:00', horaFin: '12:00' }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    // The specific 10:00–12:00 window wins over the recurrente full window.
    expect(startsHHMM(result)).toEqual(['10:00', '10:30', '11:00']);
    expect(result.hadSchedule).toBe(true);
  });

  it('OVERRIDE + split shifts: MULTIPLE especifico on the same date are ALL active windows', async () => {
    // Two especifico rows on 2026-05-18 (09:00–11:00 and 15:00–17:00) → union of both;
    // the recurrente full-day window is ignored (especifico replaces it). 60-min service.
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ horaInicio: '09:00', horaFin: '21:00' }),
      makeHorarioEspecifico({ id: 60, horaInicio: '09:00', horaFin: '11:00' }),
      makeHorarioEspecifico({ id: 61, horaInicio: '15:00', horaFin: '17:00' }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(startsHHMM(result)).toEqual(['09:00', '09:30', '10:00', '15:00', '15:30', '16:00']);
    // The midday gap (11:00–15:00) yields no slots.
    expect(startsHHMM(result)).not.toContain('12:00');
    expect(result.hadSchedule).toBe(true);
  });

  it('OVERRIDE: an INACTIVE especifico does NOT replace the recurrente (recurrente still applies)', async () => {
    // Especifico exists for the date but activo=false → not collected → recurrente wins.
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ horaInicio: '10:00', horaFin: '12:00' }),
      makeHorarioEspecifico({ horaInicio: '14:00', horaFin: '20:00', activo: false }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    // The recurrente 10:00–12:00 window applies (the inactive especifico is ignored).
    expect(startsHHMM(result)).toEqual(['10:00', '10:30', '11:00']);
  });

  it('OVERRIDE: an especifico for a DIFFERENT date does not replace the recurrente', async () => {
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ horaInicio: '10:00', horaFin: '12:00' }),
      // especifico is for 2026-05-19 (the next day), not FECHA (2026-05-18).
      makeHorarioEspecifico({ fecha: new Date('2026-05-19T00:00:00.000Z') }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(startsHHMM(result)).toEqual(['10:00', '10:30', '11:00']); // recurrente applies
  });

  it('skips a malformed recurrente row (diaSemana null) without crashing → falls back', async () => {
    // A row that violates its tipo invariant is defensively skipped by
    // toTherapistSchedule; with no other window the full grid is used.
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ diaSemana: null }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(result.slots).toHaveLength(23);
    expect(result.hadSchedule).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getAvailableSlots — booking fan-out (selected sala only)
// ════════════════════════════════════════════════════════════════════════════

describe('AvailabilityService.getAvailableSlots — booking fetches', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: AvailabilityService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
  });

  it('fetches bookings for ONLY the selected sala (a single findBySala call)', async () => {
    await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(deps.citaRepository.findBySala).toHaveBeenCalledTimes(1);
    expect(deps.citaRepository.findBySala).toHaveBeenCalledWith(SALA_ID, FECHA);
  });

  it('fetches the therapist day citas via findByUsuario over the single-day range', async () => {
    await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(deps.citaRepository.findByUsuario).toHaveBeenCalledTimes(1);
    const [uid, range] = deps.citaRepository.findByUsuario.mock.calls[0] as [
      number,
      { from: Date; to: Date },
    ];
    expect(uid).toBe(USUARIO_ID);
    // Single-day window: 00:00:00 → 23:59:59 on FECHA.
    expect(range.from.getHours()).toBe(0);
    expect(range.to.getHours()).toBe(23);
  });

  it('does NOT call salaRepository.findActivasByCentro (sala is provided, not discovered)', async () => {
    await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(deps.salaRepository.findActivasByCentro).not.toHaveBeenCalled();
  });

  it('excludes candidates overlapping a booking in the selected sala', async () => {
    deps.citaRepository.findBySala.mockResolvedValue([
      makeCita({ id: 300, fechaHoraInicio: at(10, 0), fechaHoraFin: at(11, 0) }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    const hhmm = startsHHMM(result);
    expect(hhmm).not.toContain('10:00');
    expect(hhmm).not.toContain('10:30');
    expect(hhmm).toContain('11:30');
  });

  it('excludes candidates overlapping a therapist booking', async () => {
    deps.citaRepository.findByUsuario.mockResolvedValue([
      makeCita({
        id: 301,
        salaId: OTHER_SALA_ID,
        fechaHoraInicio: at(15, 0),
        fechaHoraFin: at(16, 0),
      }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    const hhmm = startsHHMM(result);
    expect(hhmm).not.toContain('15:00');
    expect(hhmm).toContain('16:30');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getAvailableSlots — cancelled & excludeCitaId filtering
// ════════════════════════════════════════════════════════════════════════════

describe('AvailabilityService.getAvailableSlots — cancelled & exclude filtering', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: AvailabilityService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
  });

  it('ignores cancelled citas in the sala set (a cancelled booking never blocks a slot)', async () => {
    deps.citaRepository.findBySala.mockResolvedValue([
      makeCita({
        id: 300,
        fechaHoraInicio: at(10, 0),
        fechaHoraFin: at(11, 0),
        estado: 'cancelada',
      }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(startsHHMM(result)).toContain('10:00'); // cancelled → not a conflict
  });

  it('ignores cancelled citas in the therapist set', async () => {
    deps.citaRepository.findByUsuario.mockResolvedValue([
      makeCita({
        id: 301,
        fechaHoraInicio: at(15, 0),
        fechaHoraFin: at(16, 0),
        estado: 'cancelada',
      }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(startsHHMM(result)).toContain('15:00');
  });

  it('keeps a non-cancelled, non-shown cita blocking the slot (only cancelada frees it)', async () => {
    // A no_presentado booking still occupies the room (current product behaviour).
    deps.citaRepository.findBySala.mockResolvedValue([
      makeCita({
        id: 302,
        fechaHoraInicio: at(10, 0),
        fechaHoraFin: at(11, 0),
        estado: 'no_presentado',
      }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(startsHHMM(result)).not.toContain('10:00');
  });

  it('excludeCitaId drops the edited cita from the THERAPIST set (its own slot stays free)', async () => {
    const EDIT_ID = 555;
    deps.citaRepository.findByUsuario.mockResolvedValue([
      makeCita({ id: EDIT_ID, fechaHoraInicio: at(10, 0), fechaHoraFin: at(11, 0) }),
    ]);
    const result = await service.getAvailableSlots(
      USUARIO_ID,
      CENTRO_ID,
      FECHA,
      60,
      SALA_ID,
      EDIT_ID,
    );
    // Without exclusion 10:00 would be blocked; with it the slot reappears.
    expect(startsHHMM(result)).toContain('10:00');
  });

  it('excludeCitaId drops the edited cita from the SALA set as well', async () => {
    const EDIT_ID = 556;
    deps.citaRepository.findBySala.mockResolvedValue([
      makeCita({ id: EDIT_ID, fechaHoraInicio: at(10, 0), fechaHoraFin: at(11, 0) }),
    ]);
    const result = await service.getAvailableSlots(
      USUARIO_ID,
      CENTRO_ID,
      FECHA,
      60,
      SALA_ID,
      EDIT_ID,
    );
    expect(startsHHMM(result)).toContain('10:00');
  });

  it('still blocks a DIFFERENT cita when excludeCitaId is set', async () => {
    const EDIT_ID = 557;
    deps.citaRepository.findBySala.mockResolvedValue([
      makeCita({ id: EDIT_ID, fechaHoraInicio: at(10, 0), fechaHoraFin: at(11, 0) }), // excluded
      makeCita({ id: 999, fechaHoraInicio: at(13, 0), fechaHoraFin: at(14, 0) }), // NOT excluded
    ]);
    const result = await service.getAvailableSlots(
      USUARIO_ID,
      CENTRO_ID,
      FECHA,
      60,
      SALA_ID,
      EDIT_ID,
    );
    const hhmm = startsHHMM(result);
    expect(hhmm).toContain('10:00'); // edited cita's own slot freed
    expect(hhmm).not.toContain('13:00'); // the other cita still blocks
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getAvailableSlots — absences
// ════════════════════════════════════════════════════════════════════════════

describe('AvailabilityService.getAvailableSlots — absences', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: AvailabilityService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
  });

  it('a whole-day approved absence yields no slots but STILL reports hadSchedule=true', async () => {
    // The therapist works that day (recurrente window) — the empty list is due to
    // the absence, NOT a missing schedule. hadSchedule must stay true so the UI
    // shows "no free slots", not the no-schedule fallback caption.
    deps.ausenciaRepository.findByUsuario.mockResolvedValue([makeAusencia()]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(result.slots).toEqual([]);
    expect(result.hadSchedule).toBe(true);
  });

  it('an UNAPPROVED whole-day absence is ignored (slots remain)', async () => {
    deps.ausenciaRepository.findByUsuario.mockResolvedValue([
      makeAusencia({ aprobada: false, aprobadaPor: null }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(result.slots.length).toBeGreaterThan(0);
  });

  it('queries absences for the single day window', async () => {
    await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(deps.ausenciaRepository.findByUsuario).toHaveBeenCalledTimes(1);
    const [uid, range] = deps.ausenciaRepository.findByUsuario.mock.calls[0] as [
      number,
      { from: Date; to: Date },
    ];
    expect(uid).toBe(USUARIO_ID);
    expect(range.from).toBeInstanceOf(Date);
    expect(range.to).toBeInstanceOf(Date);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getAvailableSlots — returned slot shape
// ════════════════════════════════════════════════════════════════════════════

describe('AvailabilityService.getAvailableSlots — slot shape', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: AvailabilityService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
  });

  it('every returned slot carries the PASSED salaId', async () => {
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ horaInicio: '10:00', horaFin: '12:00' }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots.every((s) => s.salaId === SALA_ID)).toBe(true);
  });

  it('every returned slot has end = start + duración', async () => {
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ horaInicio: '10:00', horaFin: '12:00' }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 90, SALA_ID);
    // First start in a 10:00–12:00 window with a 90-min service is 10:00 → 11:30.
    const [first] = result.slots;
    expect(first).toBeDefined();
    expect(first.end.getTime() - first.start.getTime()).toBe(90 * 60_000);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getAvailableSlots — unassigned fallback window (usuarioId = null)
// ════════════════════════════════════════════════════════════════════════════
//
// When no masajista is picked, the service skips ALL therapist-dependent
// lookups (horario/ausencias/therapist citas) and offers a FIXED 10:00–20:00
// reception window (UNASSIGNED_OPEN_MIN/CLOSE_MIN) instead of the 09:00–21:00
// studio default. salaId is orthogonal — it only gates the sala-overlap
// lookup, never the window bounds, in either direction (unassigned OR
// therapist-selected).

describe('AvailabilityService.getAvailableSlots — unassigned fallback window (usuarioId=null)', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: AvailabilityService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
  });

  it('uses the fixed 10:00–20:00 reception window, not the 09:00–21:00 studio default', async () => {
    const result = await service.getAvailableSlots(null, CENTRO_ID, FECHA, 60, SALA_ID);
    const hhmm = startsHHMM(result);
    expect(hhmm.at(0)).toBe('10:00');
    // Last 60-min start that still ends by 20:00.
    expect(hhmm.at(-1)).toBe('19:00');
    expect(hhmm).toHaveLength(19);
  });

  it('reports hadSchedule=false (the fallback grid is not a real schedule)', async () => {
    const result = await service.getAvailableSlots(null, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(result.hadSchedule).toBe(false);
  });

  it('skips ALL therapist-dependent lookups (horario, ausencias, therapist citas)', async () => {
    await service.getAvailableSlots(null, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(deps.horarioRepository.findByUsuarioAndCentro).not.toHaveBeenCalled();
    expect(deps.ausenciaRepository.findByUsuario).not.toHaveBeenCalled();
    expect(deps.citaRepository.findByUsuario).not.toHaveBeenCalled();
  });

  it('a selected sala still blocks candidates that overlap its bookings', async () => {
    deps.citaRepository.findBySala.mockResolvedValue([
      makeCita({ id: 400, usuarioId: 999, fechaHoraInicio: at(10, 0), fechaHoraFin: at(11, 0) }),
    ]);
    const result = await service.getAvailableSlots(null, CENTRO_ID, FECHA, 60, SALA_ID);
    expect(deps.citaRepository.findBySala).toHaveBeenCalledTimes(1);
    expect(deps.citaRepository.findBySala).toHaveBeenCalledWith(SALA_ID, FECHA);
    expect(startsHHMM(result)).not.toContain('10:00');
  });

  it('salaId=null ALSO skips the sala lookup — a fully unassigned cita has no bookings to check', async () => {
    const result = await service.getAvailableSlots(null, CENTRO_ID, FECHA, 60, null);
    expect(deps.citaRepository.findBySala).not.toHaveBeenCalled();
    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots.every((s) => s.salaId === null)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getAvailableSlots — salaId never gates the window bounds (regression guard)
// ════════════════════════════════════════════════════════════════════════════

describe('AvailabilityService.getAvailableSlots — salaId is independent of the window', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: AvailabilityService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
  });

  it('a therapist-selected cita with salaId=null still uses the THERAPIST real working window, not the unassigned fallback', async () => {
    // A narrow 13:00–15:00 recurrente window proves the real schedule applies —
    // distinct from BOTH the 09:00–21:00 studio default's opening slot AND the
    // 10:00–20:00 unassigned fallback's opening slot, so this can't pass by
    // accident (the studio grid intersection would clip an 08:00 start to 09:00).
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ horaInicio: '13:00', horaFin: '15:00' }),
    ]);
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, null);
    expect(startsHHMM(result)).toEqual(['13:00', '13:30', '14:00']);
    expect(result.hadSchedule).toBe(true);
  });

  it('a therapist-selected cita with salaId=null does not call findBySala and returns salaId=null slots', async () => {
    const result = await service.getAvailableSlots(USUARIO_ID, CENTRO_ID, FECHA, 60, null);
    expect(deps.citaRepository.findBySala).not.toHaveBeenCalled();
    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots.every((s) => s.salaId === null)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// isUsuarioAvailable — unchanged behaviour
// ════════════════════════════════════════════════════════════════════════════

describe('AvailabilityService.isUsuarioAvailable', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: AvailabilityService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
  });

  it('returns true when the therapist has an active horario and no approved leave', async () => {
    await expect(service.isUsuarioAvailable(USUARIO_ID, CENTRO_ID, FECHA)).resolves.toBe(true);
  });

  it('returns false when there is no active horario for the day', async () => {
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([]);
    await expect(service.isUsuarioAvailable(USUARIO_ID, CENTRO_ID, FECHA)).resolves.toBe(false);
  });

  it('returns false when an approved absence covers the day', async () => {
    deps.ausenciaRepository.findByUsuario.mockResolvedValue([makeAusencia()]);
    await expect(service.isUsuarioAvailable(USUARIO_ID, CENTRO_ID, FECHA)).resolves.toBe(false);
  });

  it('returns true when the covering absence is not approved', async () => {
    deps.ausenciaRepository.findByUsuario.mockResolvedValue([makeAusencia({ aprobada: false })]);
    await expect(service.isUsuarioAvailable(USUARIO_ID, CENTRO_ID, FECHA)).resolves.toBe(true);
  });

  it('resolves availability via the OVERRIDE model — an especifico window counts as a schedule', async () => {
    // Only an especifico for the date (no recurrente) → still "has a schedule".
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([makeHorarioEspecifico()]);
    await expect(service.isUsuarioAvailable(USUARIO_ID, CENTRO_ID, FECHA)).resolves.toBe(true);
  });
});
