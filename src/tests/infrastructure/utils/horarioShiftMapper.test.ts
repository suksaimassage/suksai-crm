/**
 * horarioShiftMapper.test.ts
 *
 * Unit tests for the PURE domain→Shift[] mapper. No React, no mocks — just
 * instantiate fixtures and assert. Target: 100% (statements/branches/functions).
 *
 * Maps to the Analyst spec:
 *   - §8 recurrente READ-ONLY write contract (id/color encoding so writes are
 *     safely classifiable)
 *   - Edge 5  recurrente expansion bounded by the visible range
 *   - Edge 6  ISO weekday conversion (DB 1=Mon…7=Sun ↔ JS getDay 0=Sun)
 *   - Edge 7  especifico carries a fecha; recurrente carries diaSemana
 *   - Edge 10 drop shifts whose employeeId is not in the centre's employee set
 *   - Edge 11 drop rows with no attributable user (usuarioId 0 = null in adapter)
 *   - Edge 18 especifico + recurrente on the same weekday are distinct shifts
 */

import { describe, it, expect } from 'vitest';
import {
  mapHorariosToShifts,
  buildEspecificoShiftId,
  buildRecurrenteShiftId,
  isRecurrenteShiftId,
  parseEspecificoHorarioId,
} from '@infra/utils/horarioShiftMapper';
import type { IHorarioTrabajo } from '@domain/models';

// ── Fixture factory ──────────────────────────────────────────────────────────

function makeHorario(overrides: Partial<IHorarioTrabajo> = {}): IHorarioTrabajo {
  return {
    id: 1,
    usuarioId: 1,
    centroId: 10,
    tipo: 'recurrente',
    diaSemana: 1, // Monday
    fecha: null,
    horaInicio: '09:00',
    horaFin: '17:00',
    activo: true,
    ...overrides,
  };
}

// May 2026: 1st is a Friday. Mondays fall on 4, 11, 18, 25. A full-month window.
const MONTH_START = new Date(2026, 4, 1); // 2026-05-01 (local)
const MONTH_END = new Date(2026, 4, 31); // 2026-05-31 (local)

// ── id encoding helpers ───────────────────────────────────────────────────────

describe('horarioShiftMapper — id encoding', () => {
  it('buildEspecificoShiftId encodes the domain id with the esp: prefix', () => {
    expect(buildEspecificoShiftId(42)).toBe('esp:42');
  });

  it('buildRecurrenteShiftId encodes id + date key with the rec: prefix', () => {
    expect(buildRecurrenteShiftId(7, '2026-05-18')).toBe('rec:7:2026-05-18');
  });

  it('isRecurrenteShiftId is true for a rec: id', () => {
    expect(isRecurrenteShiftId('rec:7:2026-05-18')).toBe(true);
  });

  it('isRecurrenteShiftId is false for an esp: id', () => {
    expect(isRecurrenteShiftId('esp:42')).toBe(false);
  });

  it('isRecurrenteShiftId is false for an unrelated id', () => {
    expect(isRecurrenteShiftId('something-else')).toBe(false);
  });

  it('parseEspecificoHorarioId recovers the domain id from an esp: id', () => {
    expect(parseEspecificoHorarioId('esp:42')).toBe(42);
  });

  it('parseEspecificoHorarioId returns null for a recurrente id', () => {
    expect(parseEspecificoHorarioId('rec:7:2026-05-18')).toBeNull();
  });

  it('parseEspecificoHorarioId returns null for a non-numeric payload', () => {
    expect(parseEspecificoHorarioId('esp:abc')).toBeNull();
  });

  it('parseEspecificoHorarioId returns null for a zero / non-positive id', () => {
    expect(parseEspecificoHorarioId('esp:0')).toBeNull();
    expect(parseEspecificoHorarioId('esp:-3')).toBeNull();
  });
});

// ── especifico mapping ─────────────────────────────────────────────────────────

describe('mapHorariosToShifts — especifico', () => {
  it('maps an especifico row to exactly one Shift on its fecha (primary color, esp: id)', () => {
    const horario = makeHorario({
      id: 99,
      tipo: 'especifico',
      diaSemana: null,
      fecha: new Date(2026, 4, 14), // 2026-05-14
    });

    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });

    expect(shifts).toHaveLength(1);
    expect(shifts[0]).toEqual({
      id: 'esp:99',
      employeeId: '1',
      date: '2026-05-14',
      startTime: '09:00',
      endTime: '17:00',
      color: 'primary',
    });
  });

  it('drops an especifico row whose fecha is null (defensive — violates CHECK)', () => {
    const horario = makeHorario({ tipo: 'especifico', diaSemana: null, fecha: null });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });
    expect(shifts).toHaveLength(0);
  });

  it('drops an especifico row whose fecha is before the range start', () => {
    const horario = makeHorario({
      tipo: 'especifico',
      diaSemana: null,
      fecha: new Date(2026, 3, 30), // 2026-04-30, before May
    });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });
    expect(shifts).toHaveLength(0);
  });

  it('drops an especifico row whose fecha is after the range end', () => {
    const horario = makeHorario({
      tipo: 'especifico',
      diaSemana: null,
      fecha: new Date(2026, 5, 1), // 2026-06-01, after May
    });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });
    expect(shifts).toHaveLength(0);
  });

  it('keeps an especifico row on the inclusive range boundary (start day)', () => {
    const horario = makeHorario({
      tipo: 'especifico',
      diaSemana: null,
      fecha: new Date(2026, 4, 1), // exactly MONTH_START
    });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });
    expect(shifts).toHaveLength(1);
    expect(shifts[0]?.date).toBe('2026-05-01');
  });

  it('keeps an especifico row on the inclusive range boundary (end day)', () => {
    const horario = makeHorario({
      tipo: 'especifico',
      diaSemana: null,
      fecha: new Date(2026, 4, 31), // exactly MONTH_END
    });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });
    expect(shifts).toHaveLength(1);
    expect(shifts[0]?.date).toBe('2026-05-31');
  });
});

// ── recurrente expansion (Edge 5, 6) ──────────────────────────────────────────

describe('mapHorariosToShifts — recurrente expansion', () => {
  it('expands a Monday recurrente into one read-only Shift per Monday in the range', () => {
    // May 2026 Mondays: 4, 11, 18, 25 → 4 occurrences.
    const horario = makeHorario({ id: 5, tipo: 'recurrente', diaSemana: 1 });

    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });

    expect(shifts).toHaveLength(4);
    expect(shifts.map((s) => s.date)).toEqual([
      '2026-05-04',
      '2026-05-11',
      '2026-05-18',
      '2026-05-25',
    ]);
    // Every synthetic shift is read-only origin (secondary color, rec: id).
    shifts.forEach((s) => {
      expect(s.color).toBe('secondary');
      expect(isRecurrenteShiftId(s.id)).toBe(true);
    });
    expect(shifts[0]?.id).toBe('rec:5:2026-05-04');
  });

  it('converts Sunday correctly: DB dia_semana 7 maps to JS getDay 0', () => {
    // May 2026 Sundays: 3, 10, 17, 24, 31 → 5 occurrences.
    const horario = makeHorario({ tipo: 'recurrente', diaSemana: 7 });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });
    expect(shifts.map((s) => s.date)).toEqual([
      '2026-05-03',
      '2026-05-10',
      '2026-05-17',
      '2026-05-24',
      '2026-05-31',
    ]);
  });

  it('maps each ISO weekday to the right calendar dates (no off-by-one)', () => {
    // Tuesday = ISO 2. May 2026 Tuesdays: 5, 12, 19, 26.
    const horario = makeHorario({ tipo: 'recurrente', diaSemana: 2 });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });
    expect(shifts.map((s) => s.date)).toEqual([
      '2026-05-05',
      '2026-05-12',
      '2026-05-19',
      '2026-05-26',
    ]);
  });

  it('bounds expansion to a single week range (Edge 5 — not unbounded)', () => {
    // Window: Mon 2026-05-11 .. Sun 2026-05-17 → exactly one Monday occurrence.
    const horario = makeHorario({ tipo: 'recurrente', diaSemana: 1 });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: new Date(2026, 4, 11),
      rangeEnd: new Date(2026, 4, 17),
    });
    expect(shifts).toHaveLength(1);
    expect(shifts[0]?.date).toBe('2026-05-11');
  });

  it('includes a recurrente occurrence that lands exactly on the range end day', () => {
    // Single-day window on a Monday → the occurrence on the boundary is included.
    const horario = makeHorario({ tipo: 'recurrente', diaSemana: 1 });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: new Date(2026, 4, 18),
      rangeEnd: new Date(2026, 4, 18), // Monday, same start & end
    });
    expect(shifts).toHaveLength(1);
    expect(shifts[0]?.date).toBe('2026-05-18');
  });

  it('produces zero shifts when no matching weekday falls in the range', () => {
    // Window Tue..Wed contains no Monday.
    const horario = makeHorario({ tipo: 'recurrente', diaSemana: 1 });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: new Date(2026, 4, 12), // Tue
      rangeEnd: new Date(2026, 4, 13), // Wed
    });
    expect(shifts).toHaveLength(0);
  });

  it('drops a recurrente row whose diaSemana is null (defensive — violates CHECK)', () => {
    const horario = makeHorario({ tipo: 'recurrente', diaSemana: null });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });
    expect(shifts).toHaveLength(0);
  });

  it('tags recurrente shifts with the provided label + note (non-color cue, WCAG 1.4.1)', () => {
    const horario = makeHorario({ tipo: 'recurrente', diaSemana: 1 });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: new Date(2026, 4, 4),
      rangeEnd: new Date(2026, 4, 4), // single Monday
      recurrenteLabel: 'Recurrente',
      recurrenteNote: 'solo lectura',
    });
    expect(shifts).toHaveLength(1);
    expect(shifts[0]?.label).toBe('Recurrente');
    expect(shifts[0]?.note).toBe('solo lectura');
  });

  it('leaves especifico shifts free of the recurrente label/note marker', () => {
    const horario = makeHorario({
      id: 99,
      tipo: 'especifico',
      diaSemana: null,
      fecha: new Date(2026, 4, 14),
    });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
      recurrenteLabel: 'Recurrente',
      recurrenteNote: 'solo lectura',
    });
    expect(shifts[0]?.label).toBeUndefined();
    expect(shifts[0]?.note).toBeUndefined();
  });
});

// ── orphan / null-user dropping (Edge 10, 11) ──────────────────────────────────

describe('mapHorariosToShifts — orphan and null-user rows', () => {
  it('drops a row whose usuarioId is not in the employee set (Edge 10)', () => {
    const horario = makeHorario({ usuarioId: 999, tipo: 'recurrente', diaSemana: 1 });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1', '2']), // 999 absent
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });
    expect(shifts).toHaveLength(0);
  });

  it('drops a row with usuarioId 0 (null usuario_id in the adapter — Edge 11)', () => {
    const horario = makeHorario({
      usuarioId: 0,
      tipo: 'especifico',
      diaSemana: null,
      fecha: new Date(2026, 4, 14),
    });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      // Even if '0' were somehow in the set, the explicit 0 guard drops it.
      employeeIds: new Set(['0', '1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });
    expect(shifts).toHaveLength(0);
  });

  it('attributes a kept shift to the right employee column', () => {
    const horario = makeHorario({ usuarioId: 2, tipo: 'recurrente', diaSemana: 1 });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1', '2', '3']),
      rangeStart: new Date(2026, 4, 4),
      rangeEnd: new Date(2026, 4, 4), // single Monday
    });
    expect(shifts).toHaveLength(1);
    expect(shifts[0]?.employeeId).toBe('2');
  });
});

// ── mixed / multi-row scenarios (Edge 18) ──────────────────────────────────────

describe('mapHorariosToShifts — mixed rows', () => {
  it('keeps especifico and recurrente on the same weekday as distinct shifts (Edge 18)', () => {
    // Both fall on Monday 2026-05-04: one especifico (editable), one recurrente (read-only).
    const especifico = makeHorario({
      id: 100,
      tipo: 'especifico',
      diaSemana: null,
      fecha: new Date(2026, 4, 4),
      horaInicio: '10:00',
      horaFin: '12:00',
    });
    const recurrente = makeHorario({
      id: 200,
      tipo: 'recurrente',
      diaSemana: 1,
      horaInicio: '14:00',
      horaFin: '18:00',
    });

    const shifts = mapHorariosToShifts({
      horarios: [especifico, recurrente],
      employeeIds: new Set(['1']),
      rangeStart: new Date(2026, 4, 4),
      rangeEnd: new Date(2026, 4, 4), // single Monday
    });

    expect(shifts).toHaveLength(2);
    const esp = shifts.find((s) => s.id === 'esp:100');
    const rec = shifts.find((s) => isRecurrenteShiftId(s.id));
    expect(esp).toBeDefined();
    expect(esp?.color).toBe('primary');
    expect(rec).toBeDefined();
    expect(rec?.color).toBe('secondary');
    expect(rec?.id).toBe('rec:200:2026-05-04');
    // No dedup/merge — they coexist.
    expect(esp?.id).not.toBe(rec?.id);
  });

  it('returns an empty array for an empty horarios input', () => {
    const shifts = mapHorariosToShifts({
      horarios: [],
      employeeIds: new Set(['1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });
    expect(shifts).toEqual([]);
  });

  it('preserves horaInicio/horaFin verbatim on the produced shift', () => {
    const horario = makeHorario({
      tipo: 'especifico',
      diaSemana: null,
      fecha: new Date(2026, 4, 14),
      horaInicio: '08:30',
      horaFin: '13:45',
    });
    const shifts = mapHorariosToShifts({
      horarios: [horario],
      employeeIds: new Set(['1']),
      rangeStart: MONTH_START,
      rangeEnd: MONTH_END,
    });
    expect(shifts[0]?.startTime).toBe('08:30');
    expect(shifts[0]?.endTime).toBe('13:45');
  });
});
