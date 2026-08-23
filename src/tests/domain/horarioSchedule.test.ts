/**
 * horarioSchedule.test.ts
 *
 * Unit tests for the PURE logic-layer schedule refinement + overlap-prevention
 * primitives. Zero I/O, no repositories, no mocks — just instantiate fixtures and
 * assert (per .claude/rules/testing.md domain philosophy).
 *
 * Coverage target: 100% (statements/branches/functions/lines).
 *
 * Covers:
 *   - toTherapistSchedule  → narrows IHorarioTrabajo to the discriminated union,
 *     or null on a tipo-invariant violation (defensive skip).
 *   - isRecurrente / isEspecifico type guards.
 *   - timeRangesOverlap    → HALF-OPEN overlap (touching endpoints do NOT overlap).
 *   - findScheduleConflict → same usuarioId + same tipo+key (recurrente×weekday or
 *     especifico×date) + half-open time overlap; cross-tipo NEVER conflicts;
 *     self-exclusion by id; inactive rows skipped; malformed rows skipped.
 *
 * Override/exception model (owner-decided): a recurrente and an especifico are
 * NOT a write-time conflict — the especifico simply wins at availability time. The
 * conflict scan therefore only collides WITHIN the same tipo+key. These tests pin
 * exactly that rule.
 */

import { describe, it, expect } from 'vitest';
import {
  toTherapistSchedule,
  isRecurrente,
  isEspecifico,
  timeRangesOverlap,
  findScheduleConflict,
} from '@domain/services/horarioSchedule';
import type {
  TTherapistSchedule,
  IScheduleConflictCandidate,
} from '@domain/services/horarioSchedule';
import { ValidationError } from '@domain/index';
import type { IHorarioTrabajo } from '@domain/models';

const USUARIO_ID = 9;
const OTHER_USUARIO_ID = 10;
const CENTRO_ID = 1;

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeRecurrente(overrides: Partial<IHorarioTrabajo> = {}): IHorarioTrabajo {
  return {
    id: 1,
    usuarioId: USUARIO_ID,
    centroId: CENTRO_ID,
    tipo: 'recurrente',
    diaSemana: 1, // Monday
    fecha: null,
    horaInicio: '09:00',
    horaFin: '13:00',
    activo: true,
    ...overrides,
  };
}

function makeEspecifico(overrides: Partial<IHorarioTrabajo> = {}): IHorarioTrabajo {
  return {
    id: 2,
    usuarioId: USUARIO_ID,
    centroId: CENTRO_ID,
    tipo: 'especifico',
    diaSemana: null,
    fecha: new Date('2026-05-18T00:00:00.000Z'),
    horaInicio: '09:00',
    horaFin: '13:00',
    activo: true,
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// toTherapistSchedule — narrowing helper
// ════════════════════════════════════════════════════════════════════════════

describe('toTherapistSchedule', () => {
  it('refines a recurrente row into the recurrente arm (diaSemana present, fecha null)', () => {
    const schedule = toTherapistSchedule(makeRecurrente({ diaSemana: 3 }));
    expect(schedule).not.toBeNull();
    expect(schedule?.tipo).toBe('recurrente');
    if (schedule !== null && isRecurrente(schedule)) {
      expect(schedule.diaSemana).toBe(3);
      expect(schedule.fecha).toBeNull();
    }
  });

  it('refines an especifico row into the especifico arm (fecha present, diaSemana null)', () => {
    const fecha = new Date('2026-05-18T00:00:00.000Z');
    const schedule = toTherapistSchedule(makeEspecifico({ fecha }));
    expect(schedule).not.toBeNull();
    expect(schedule?.tipo).toBe('especifico');
    if (schedule !== null && isEspecifico(schedule)) {
      expect(schedule.fecha).toBe(fecha);
      expect(schedule.diaSemana).toBeNull();
    }
  });

  it('returns null for a recurrente row whose diaSemana is null (tipo-invariant violation)', () => {
    expect(toTherapistSchedule(makeRecurrente({ diaSemana: null }))).toBeNull();
  });

  it('returns null for an especifico row whose fecha is null (tipo-invariant violation)', () => {
    expect(toTherapistSchedule(makeEspecifico({ fecha: null }))).toBeNull();
  });

  it('carries every field through verbatim (id/usuarioId/centroId/times/activo)', () => {
    const row = makeRecurrente({
      id: 77,
      usuarioId: 42,
      centroId: 8,
      horaInicio: '08:30',
      horaFin: '14:45',
      activo: false,
    });
    const schedule = toTherapistSchedule(row);
    expect(schedule).toMatchObject({
      id: 77,
      usuarioId: 42,
      centroId: 8,
      horaInicio: '08:30',
      horaFin: '14:45',
      activo: false,
    });
  });

  it('produces a FRESH object (does not return the input row reference) — immutability', () => {
    const row = makeRecurrente();
    const schedule = toTherapistSchedule(row);
    expect(schedule).not.toBe(row as unknown as TTherapistSchedule);
  });

  it('carries the especifico fecha by reference (callers treat schedules as read-only)', () => {
    const fecha = new Date('2026-05-18T00:00:00.000Z');
    const schedule = toTherapistSchedule(makeEspecifico({ fecha }));
    if (schedule !== null && isEspecifico(schedule)) {
      expect(schedule.fecha).toBe(fecha); // same Date reference, not a copy
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// type guards
// ════════════════════════════════════════════════════════════════════════════

describe('isRecurrente / isEspecifico', () => {
  it('isRecurrente is true for the recurrente arm, false for especifico', () => {
    const rec = toTherapistSchedule(makeRecurrente());
    const esp = toTherapistSchedule(makeEspecifico());
    expect(rec !== null && isRecurrente(rec)).toBe(true);
    expect(esp !== null && isRecurrente(esp)).toBe(false);
  });

  it('isEspecifico is true for the especifico arm, false for recurrente', () => {
    const rec = toTherapistSchedule(makeRecurrente());
    const esp = toTherapistSchedule(makeEspecifico());
    expect(esp !== null && isEspecifico(esp)).toBe(true);
    expect(rec !== null && isEspecifico(rec)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// timeRangesOverlap — HALF-OPEN boundaries
// ════════════════════════════════════════════════════════════════════════════

describe('timeRangesOverlap (half-open)', () => {
  it('touching endpoints do NOT overlap (09:00–11:00 vs 11:00–13:00 are valid neighbours)', () => {
    expect(timeRangesOverlap('09:00', '11:00', '11:00', '13:00')).toBe(false);
  });

  it('touching at the other endpoint does NOT overlap (11:00–13:00 vs 09:00–11:00)', () => {
    expect(timeRangesOverlap('11:00', '13:00', '09:00', '11:00')).toBe(false);
  });

  it('a partial overlap DOES conflict (09:00–11:00 vs 10:30–12:00)', () => {
    expect(timeRangesOverlap('09:00', '11:00', '10:30', '12:00')).toBe(true);
  });

  it('full containment conflicts (09:00–13:00 vs 10:00–11:00)', () => {
    expect(timeRangesOverlap('09:00', '13:00', '10:00', '11:00')).toBe(true);
  });

  it('identical ranges conflict', () => {
    expect(timeRangesOverlap('09:00', '13:00', '09:00', '13:00')).toBe(true);
  });

  it('fully-disjoint ranges do not conflict (09:00–10:00 vs 12:00–13:00)', () => {
    expect(timeRangesOverlap('09:00', '10:00', '12:00', '13:00')).toBe(false);
  });

  it('a one-minute overlap still conflicts (09:00–11:00 vs 10:59–12:00)', () => {
    expect(timeRangesOverlap('09:00', '11:00', '10:59', '12:00')).toBe(true);
  });

  it('throws ValidationError for an inverted candidate range (delegates to TimeRange.create)', () => {
    expect(() => timeRangesOverlap('13:00', '09:00', '10:00', '11:00')).toThrow(ValidationError);
  });

  it('throws ValidationError for a malformed time string', () => {
    expect(() => timeRangesOverlap('09:00', '11:00', 'nope', '12:00')).toThrow(ValidationError);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// findScheduleConflict — recurrente × recurrente (same weekday)
// ════════════════════════════════════════════════════════════════════════════

describe('findScheduleConflict — recurrente vs recurrente', () => {
  it('flags a conflict when two recurrente rows share the weekday AND overlap in time', () => {
    const existing = [
      makeRecurrente({ id: 1, diaSemana: 1, horaInicio: '09:00', horaFin: '13:00' }),
    ];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'recurrente',
      diaSemana: 1,
      horaInicio: '12:00', // overlaps 09:00–13:00
      horaFin: '15:00',
    };
    const conflict = findScheduleConflict(existing, candidate);
    expect(conflict).not.toBeNull();
    expect(conflict?.id).toBe(1);
  });

  it('does NOT flag two recurrente rows on the SAME weekday that only touch (half-open)', () => {
    const existing = [makeRecurrente({ diaSemana: 1, horaInicio: '09:00', horaFin: '11:00' })];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'recurrente',
      diaSemana: 1,
      horaInicio: '11:00', // back-to-back, no overlap
      horaFin: '13:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });

  it('does NOT flag two recurrente rows on DIFFERENT weekdays even if the times overlap', () => {
    const existing = [makeRecurrente({ diaSemana: 1, horaInicio: '09:00', horaFin: '13:00' })];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'recurrente',
      diaSemana: 2, // Tuesday — different key
      horaInicio: '10:00',
      horaFin: '12:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// findScheduleConflict — especifico × especifico (same date)
// ════════════════════════════════════════════════════════════════════════════

describe('findScheduleConflict — especifico vs especifico', () => {
  it('flags a conflict when two especifico rows share the date AND overlap in time', () => {
    const existing = [
      makeEspecifico({
        id: 5,
        fecha: new Date('2026-05-18T00:00:00.000Z'),
        horaInicio: '09:00',
        horaFin: '13:00',
      }),
    ];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'especifico',
      fecha: new Date('2026-05-18T00:00:00'), // local-midnight same calendar day
      horaInicio: '12:00',
      horaFin: '14:00',
    };
    const conflict = findScheduleConflict(existing, candidate);
    expect(conflict).not.toBeNull();
    expect(conflict?.id).toBe(5);
  });

  it('does NOT flag two especifico rows on DIFFERENT dates', () => {
    const existing = [
      makeEspecifico({
        fecha: new Date('2026-05-18T00:00:00.000Z'),
        horaInicio: '09:00',
        horaFin: '13:00',
      }),
    ];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'especifico',
      fecha: new Date('2026-05-19T00:00:00'), // next day
      horaInicio: '10:00',
      horaFin: '12:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });

  it('does NOT flag split-shift especifico rows on the same date that merely touch', () => {
    // 09:00–13:00 then a new 13:00–17:00 split shift on the same day — valid neighbours.
    const existing = [
      makeEspecifico({
        fecha: new Date('2026-05-18T00:00:00.000Z'),
        horaInicio: '09:00',
        horaFin: '13:00',
      }),
    ];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'especifico',
      fecha: new Date('2026-05-18T00:00:00'),
      horaInicio: '13:00',
      horaFin: '17:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });

  it('matches the date on the LOCAL calendar day (UTC-midnight stored row vs local-midnight candidate)', () => {
    // The stored especifico fecha is UTC-midnight (adapter shape); the candidate is
    // local-midnight (the section builds `new Date(date + 'T00:00:00')`). Both must
    // resolve to 2026-05-18 in a positive-offset TZ. A naive toISOString() compare
    // on the candidate would roll the day back and MISS this conflict.
    const existing = [
      makeEspecifico({
        id: 8,
        fecha: new Date('2026-05-18T00:00:00.000Z'),
        horaInicio: '09:00',
        horaFin: '13:00',
      }),
    ];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'especifico',
      fecha: new Date(2026, 4, 18, 0, 0, 0, 0), // local midnight 2026-05-18
      horaInicio: '10:00',
      horaFin: '11:00',
    };
    expect(findScheduleConflict(existing, candidate)?.id).toBe(8);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// findScheduleConflict — cross-tipo is NEVER a conflict (override model)
// ════════════════════════════════════════════════════════════════════════════

describe('findScheduleConflict — cross-tipo never conflicts', () => {
  it('a recurrente candidate never conflicts with an existing especifico (same day, overlapping times)', () => {
    // Existing especifico on Monday 2026-05-18 09:00–13:00; candidate recurrente
    // on Monday (diaSemana 1) 10:00–12:00. The especifico wins at read time; this
    // is NOT a write-time conflict.
    const existing = [
      makeEspecifico({
        fecha: new Date('2026-05-18T00:00:00.000Z'),
        horaInicio: '09:00',
        horaFin: '13:00',
      }),
    ];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'recurrente',
      diaSemana: 1,
      horaInicio: '10:00',
      horaFin: '12:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });

  it('an especifico candidate never conflicts with an existing recurrente (same weekday, overlapping times)', () => {
    const existing = [makeRecurrente({ diaSemana: 1, horaInicio: '09:00', horaFin: '13:00' })];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'especifico',
      fecha: new Date('2026-05-18T00:00:00'), // a Monday
      horaInicio: '10:00',
      horaFin: '12:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// findScheduleConflict — usuario scoping, self-exclusion, inactive, malformed
// ════════════════════════════════════════════════════════════════════════════

describe('findScheduleConflict — scoping & exclusions', () => {
  it('does NOT flag a conflict against a DIFFERENT therapist (overlap on same date)', () => {
    const existing = [
      makeEspecifico({
        usuarioId: OTHER_USUARIO_ID,
        fecha: new Date('2026-05-18T00:00:00.000Z'),
        horaInicio: '09:00',
        horaFin: '13:00',
      }),
    ];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID, // different therapist
      tipo: 'especifico',
      fecha: new Date('2026-05-18T00:00:00'),
      horaInicio: '10:00',
      horaFin: '12:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });

  it('excludes the candidate own id (update mode) — a row never conflicts with itself', () => {
    const existing = [
      makeEspecifico({
        id: 42,
        fecha: new Date('2026-05-18T00:00:00.000Z'),
        horaInicio: '09:00',
        horaFin: '13:00',
      }),
    ];
    const candidate: IScheduleConflictCandidate = {
      id: 42, // editing this very row
      usuarioId: USUARIO_ID,
      tipo: 'especifico',
      fecha: new Date('2026-05-18T00:00:00'),
      horaInicio: '10:00', // overlaps its OWN former times — but it's excluded
      horaFin: '12:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });

  it('still flags a DIFFERENT row when the candidate id excludes only itself', () => {
    const existing = [
      makeEspecifico({
        id: 42,
        fecha: new Date('2026-05-18T00:00:00.000Z'),
        horaInicio: '09:00',
        horaFin: '11:00',
      }),
      makeEspecifico({
        id: 43,
        fecha: new Date('2026-05-18T00:00:00.000Z'),
        horaInicio: '12:00',
        horaFin: '16:00',
      }),
    ];
    const candidate: IScheduleConflictCandidate = {
      id: 42, // editing row 42
      usuarioId: USUARIO_ID,
      tipo: 'especifico',
      fecha: new Date('2026-05-18T00:00:00'),
      horaInicio: '13:00', // now overlaps row 43
      horaFin: '15:00',
    };
    expect(findScheduleConflict(existing, candidate)?.id).toBe(43);
  });

  it('skips INACTIVE existing rows (a soft-deleted window cannot conflict)', () => {
    const existing = [
      makeEspecifico({
        id: 9,
        activo: false,
        fecha: new Date('2026-05-18T00:00:00.000Z'),
        horaInicio: '09:00',
        horaFin: '13:00',
      }),
    ];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'especifico',
      fecha: new Date('2026-05-18T00:00:00'),
      horaInicio: '10:00',
      horaFin: '12:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });

  it('skips a MALFORMED existing row (especifico with null fecha) without crashing', () => {
    const existing = [
      makeEspecifico({ fecha: null, horaInicio: '09:00', horaFin: '13:00' }), // invalid row
    ];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'especifico',
      fecha: new Date('2026-05-18T00:00:00'),
      horaInicio: '10:00',
      horaFin: '12:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });

  it('returns null on an empty existing list', () => {
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'especifico',
      fecha: new Date('2026-05-18T00:00:00'),
      horaInicio: '10:00',
      horaFin: '12:00',
    };
    expect(findScheduleConflict([], candidate)).toBeNull();
  });

  it('returns the FIRST conflicting row when several overlap', () => {
    const existing = [
      makeEspecifico({
        id: 1,
        fecha: new Date('2026-05-18T00:00:00.000Z'),
        horaInicio: '09:00',
        horaFin: '13:00',
      }),
      makeEspecifico({
        id: 2,
        fecha: new Date('2026-05-18T00:00:00.000Z'),
        horaInicio: '10:00',
        horaFin: '14:00',
      }),
    ];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'especifico',
      fecha: new Date('2026-05-18T00:00:00'),
      horaInicio: '11:00',
      horaFin: '12:00',
    };
    expect(findScheduleConflict(existing, candidate)?.id).toBe(1); // first match wins
  });
});

// ════════════════════════════════════════════════════════════════════════════
// findScheduleConflict — malformed CANDIDATE (tipo-invariant unmet → no conflict)
// ════════════════════════════════════════════════════════════════════════════

describe('findScheduleConflict — malformed candidate', () => {
  it('returns null for a recurrente candidate with no diaSemana (nothing to compare)', () => {
    const existing = [makeRecurrente({ diaSemana: 1, horaInicio: '09:00', horaFin: '13:00' })];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'recurrente',
      // diaSemana intentionally omitted (undefined)
      horaInicio: '10:00',
      horaFin: '12:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });

  it('returns null for a recurrente candidate with diaSemana explicitly null', () => {
    const existing = [makeRecurrente({ diaSemana: 1 })];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'recurrente',
      diaSemana: null,
      horaInicio: '10:00',
      horaFin: '12:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });

  it('returns null for an especifico candidate with no fecha (nothing to compare)', () => {
    const existing = [makeEspecifico({ fecha: new Date('2026-05-18T00:00:00.000Z') })];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'especifico',
      // fecha intentionally omitted (undefined)
      horaInicio: '10:00',
      horaFin: '12:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });

  it('returns null for an especifico candidate with fecha explicitly null', () => {
    const existing = [makeEspecifico({ fecha: new Date('2026-05-18T00:00:00.000Z') })];
    const candidate: IScheduleConflictCandidate = {
      usuarioId: USUARIO_ID,
      tipo: 'especifico',
      fecha: null,
      horaInicio: '10:00',
      horaFin: '12:00',
    };
    expect(findScheduleConflict(existing, candidate)).toBeNull();
  });
});
