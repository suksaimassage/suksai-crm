/**
 * TerapeutaStatsService.test.ts
 *
 * Pure unit tests — no mocking needed.
 * All four exported functions are deterministic pure functions.
 *
 * Functions under test:
 *   - computeSesionesEstaSemana
 *   - computeTotalHorasSemana
 *   - computeIngresosSemana
 *   - deriveEspecialidades
 */

import { describe, it, expect } from 'vitest';
import {
  computeSesionesEstaSemana,
  computeTotalHorasSemana,
  computeIngresosSemana,
  deriveEspecialidades,
} from '@domain/services/TerapeutaStatsService';
import type { ICitaForStats } from '@domain/services/TerapeutaStatsService';
import type { IHorarioTrabajo } from '@domain/models';

// ── Week fixture ─────────────────────────────────────────────────────────────

/** Monday 2024-06-10 00:00:00 UTC */
const WEEK_START = new Date('2024-06-10T00:00:00Z');
/** Sunday 2024-06-16 23:59:59 UTC */
const WEEK_END = new Date('2024-06-16T23:59:59Z');

const USER_ID = 1;
const OTHER_USER_ID = 2;

// ── computeSesionesEstaSemana ─────────────────────────────────────────────────

describe('computeSesionesEstaSemana', () => {
  it('returns 0 for an empty citas array', () => {
    expect(computeSesionesEstaSemana(USER_ID, [], WEEK_START, WEEK_END)).toBe(0);
  });

  it('counts completada citas within the week', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'completada', fechaInicio: '2024-06-12T10:00:00Z', precio: 50 },
    ];
    expect(computeSesionesEstaSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(1);
  });

  it('counts en_curso citas within the week', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'en_curso', fechaInicio: '2024-06-13T14:00:00Z', precio: 60 },
    ];
    expect(computeSesionesEstaSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(1);
  });

  it('counts pendiente citas (scheduled — included in weekly workload)', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'pendiente', fechaInicio: '2024-06-12T10:00:00Z', precio: 50 },
    ];
    expect(computeSesionesEstaSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(1);
  });

  it('does NOT count cancelada citas', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'cancelada', fechaInicio: '2024-06-12T10:00:00Z', precio: 50 },
    ];
    expect(computeSesionesEstaSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(0);
  });

  it('does NOT count citas with null estado (unknown state excluded)', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: null, fechaInicio: '2024-06-12T10:00:00Z', precio: 50 },
    ];
    expect(computeSesionesEstaSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(0);
  });

  it('does NOT count citas outside the week range (before start)', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'completada', fechaInicio: '2024-06-09T23:59:59Z', precio: 50 },
    ];
    expect(computeSesionesEstaSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(0);
  });

  it('does NOT count citas outside the week range (after end)', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'completada', fechaInicio: '2024-06-17T00:00:00Z', precio: 50 },
    ];
    expect(computeSesionesEstaSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(0);
  });

  it('counts citas on exact weekStart boundary (inclusive)', () => {
    const citas: ICitaForStats[] = [
      {
        usuarioId: USER_ID,
        estado: 'completada',
        fechaInicio: WEEK_START.toISOString(),
        precio: 50,
      },
    ];
    expect(computeSesionesEstaSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(1);
  });

  it('counts citas on exact weekEnd boundary (inclusive)', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'completada', fechaInicio: WEEK_END.toISOString(), precio: 50 },
    ];
    expect(computeSesionesEstaSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(1);
  });

  it('does NOT count citas belonging to a different usuarioId', () => {
    const citas: ICitaForStats[] = [
      {
        usuarioId: OTHER_USER_ID,
        estado: 'completada',
        fechaInicio: '2024-06-12T10:00:00Z',
        precio: 50,
      },
    ];
    expect(computeSesionesEstaSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(0);
  });

  it('does NOT count citas with null fechaInicio', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'completada', fechaInicio: null, precio: 50 },
    ];
    expect(computeSesionesEstaSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(0);
  });

  it('counts completada + en_curso + pendiente; excludes cancelada, null estado and other user', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'completada', fechaInicio: '2024-06-10T09:00:00Z', precio: 50 },
      { usuarioId: USER_ID, estado: 'en_curso', fechaInicio: '2024-06-11T14:00:00Z', precio: 60 },
      { usuarioId: USER_ID, estado: 'completada', fechaInicio: '2024-06-13T11:00:00Z', precio: 70 },
      { usuarioId: USER_ID, estado: 'pendiente', fechaInicio: '2024-06-14T09:00:00Z', precio: 50 },
      { usuarioId: USER_ID, estado: 'cancelada', fechaInicio: '2024-06-15T09:00:00Z', precio: 50 },
      {
        usuarioId: OTHER_USER_ID,
        estado: 'completada',
        fechaInicio: '2024-06-12T10:00:00Z',
        precio: 50,
      },
    ];
    // completada×2 + en_curso×1 + pendiente×1 = 4 (cancelada and other user excluded)
    expect(computeSesionesEstaSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(4);
  });
});

// ── computeTotalHorasSemana ───────────────────────────────────────────────────

describe('computeTotalHorasSemana', () => {
  function makeHorario(overrides: Partial<IHorarioTrabajo> = {}): IHorarioTrabajo {
    return {
      id: 1,
      usuarioId: USER_ID,
      centroId: 1,
      tipo: 'recurrente',
      diaSemana: 1,
      fecha: null,
      horaInicio: '09:00',
      horaFin: '17:00',
      activo: true,
      ...overrides,
    };
  }

  it('returns 0 for an empty horarios array', () => {
    expect(computeTotalHorasSemana(USER_ID, [])).toBe(0);
  });

  it('computes correct hours for a single 8-hour shift', () => {
    const horarios = [makeHorario({ horaInicio: '09:00', horaFin: '17:00' })];
    expect(computeTotalHorasSemana(USER_ID, horarios)).toBe(8);
  });

  it('computes correct hours for a 5-hour shift', () => {
    const horarios = [makeHorario({ horaInicio: '10:00', horaFin: '15:00' })];
    expect(computeTotalHorasSemana(USER_ID, horarios)).toBe(5);
  });

  it('accumulates hours across multiple horario entries', () => {
    const horarios = [
      makeHorario({ id: 1, diaSemana: 1, horaInicio: '09:00', horaFin: '17:00' }), // 8h
      makeHorario({ id: 2, diaSemana: 2, horaInicio: '10:00', horaFin: '14:00' }), // 4h
      makeHorario({ id: 3, diaSemana: 3, horaInicio: '08:00', horaFin: '12:00' }), // 4h
    ];
    expect(computeTotalHorasSemana(USER_ID, horarios)).toBe(16);
  });

  it('excludes horarios of tipo "especifico"', () => {
    const horarios = [
      makeHorario({ id: 1, tipo: 'recurrente', horaInicio: '09:00', horaFin: '17:00' }), // 8h
      makeHorario({ id: 2, tipo: 'especifico', horaInicio: '09:00', horaFin: '13:00' }), // excluded
    ];
    expect(computeTotalHorasSemana(USER_ID, horarios)).toBe(8);
  });

  it('excludes horarios belonging to a different usuarioId', () => {
    const horarios = [
      makeHorario({ id: 1, usuarioId: USER_ID, horaInicio: '09:00', horaFin: '17:00' }), // 8h
      makeHorario({ id: 2, usuarioId: OTHER_USER_ID, horaInicio: '09:00', horaFin: '18:00' }), // excluded
    ];
    expect(computeTotalHorasSemana(USER_ID, horarios)).toBe(8);
  });

  it('returns 0 when all horarios are for a different user', () => {
    const horarios = [makeHorario({ usuarioId: OTHER_USER_ID })];
    expect(computeTotalHorasSemana(USER_ID, horarios)).toBe(0);
  });

  it('handles horaFin === horaInicio (zero-duration shift) — returns 0 for that entry', () => {
    const horarios = [makeHorario({ horaInicio: '10:00', horaFin: '10:00' })];
    expect(computeTotalHorasSemana(USER_ID, horarios)).toBe(0);
  });

  it('uses Math.max(0, end-start) — does not go negative for inverted times', () => {
    // Malformed: fin before inicio
    const horarios = [makeHorario({ horaInicio: '17:00', horaFin: '09:00' })];
    expect(computeTotalHorasSemana(USER_ID, horarios)).toBe(0);
  });
});

// ── computeIngresosSemana ─────────────────────────────────────────────────────

describe('computeIngresosSemana', () => {
  it('returns 0 for an empty citas array', () => {
    expect(computeIngresosSemana(USER_ID, [], WEEK_START, WEEK_END)).toBe(0);
  });

  it('sums precio of completada citas in the week', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'completada', fechaInicio: '2024-06-12T10:00:00Z', precio: 50 },
      { usuarioId: USER_ID, estado: 'completada', fechaInicio: '2024-06-13T10:00:00Z', precio: 30 },
    ];
    expect(computeIngresosSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(80);
  });

  it('sums precio of en_curso citas in the week', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'en_curso', fechaInicio: '2024-06-12T10:00:00Z', precio: 75 },
    ];
    expect(computeIngresosSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(75);
  });

  it('treats null precio as 0', () => {
    const citas: ICitaForStats[] = [
      {
        usuarioId: USER_ID,
        estado: 'completada',
        fechaInicio: '2024-06-12T10:00:00Z',
        precio: null,
      },
      { usuarioId: USER_ID, estado: 'completada', fechaInicio: '2024-06-13T10:00:00Z', precio: 40 },
    ];
    expect(computeIngresosSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(40);
  });

  it('does NOT include pendiente citas in the sum', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'pendiente', fechaInicio: '2024-06-12T10:00:00Z', precio: 100 },
    ];
    expect(computeIngresosSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(0);
  });

  it('does NOT include cancelada citas in the sum', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'cancelada', fechaInicio: '2024-06-12T10:00:00Z', precio: 100 },
    ];
    expect(computeIngresosSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(0);
  });

  it('does NOT include citas outside the week range', () => {
    const citas: ICitaForStats[] = [
      {
        usuarioId: USER_ID,
        estado: 'completada',
        fechaInicio: '2024-06-09T10:00:00Z',
        precio: 100,
      },
      {
        usuarioId: USER_ID,
        estado: 'completada',
        fechaInicio: '2024-06-17T10:00:00Z',
        precio: 200,
      },
    ];
    expect(computeIngresosSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(0);
  });

  it('does NOT include citas belonging to a different usuarioId', () => {
    const citas: ICitaForStats[] = [
      {
        usuarioId: OTHER_USER_ID,
        estado: 'completada',
        fechaInicio: '2024-06-12T10:00:00Z',
        precio: 200,
      },
    ];
    expect(computeIngresosSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(0);
  });

  it('does NOT include citas with null fechaInicio', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'completada', fechaInicio: null, precio: 100 },
    ];
    expect(computeIngresosSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(0);
  });

  it('correctly sums mixed completada and en_curso while excluding others', () => {
    const citas: ICitaForStats[] = [
      { usuarioId: USER_ID, estado: 'completada', fechaInicio: '2024-06-10T09:00:00Z', precio: 50 },
      { usuarioId: USER_ID, estado: 'en_curso', fechaInicio: '2024-06-11T10:00:00Z', precio: 60 },
      { usuarioId: USER_ID, estado: 'pendiente', fechaInicio: '2024-06-12T10:00:00Z', precio: 999 },
      { usuarioId: USER_ID, estado: 'cancelada', fechaInicio: '2024-06-13T10:00:00Z', precio: 999 },
      { usuarioId: USER_ID, estado: 'completada', fechaInicio: null, precio: 999 },
      {
        usuarioId: OTHER_USER_ID,
        estado: 'completada',
        fechaInicio: '2024-06-12T10:00:00Z',
        precio: 999,
      },
    ];
    expect(computeIngresosSemana(USER_ID, citas, WEEK_START, WEEK_END)).toBe(110);
  });
});

// ── deriveEspecialidades ──────────────────────────────────────────────────────

describe('deriveEspecialidades', () => {
  it('returns empty array for empty input', () => {
    expect(deriveEspecialidades(USER_ID, [])).toEqual([]);
  });

  it('returns sorted unique service names for the given usuarioId', () => {
    const input = [
      { usuarioId: USER_ID, nombre: 'Reflexología' },
      { usuarioId: USER_ID, nombre: 'Masaje Tailandés' },
      { usuarioId: USER_ID, nombre: 'Aromaterapia' },
    ];
    expect(deriveEspecialidades(USER_ID, input)).toEqual([
      'Aromaterapia',
      'Masaje Tailandés',
      'Reflexología',
    ]);
  });

  it('deduplicates repeated service names', () => {
    const input = [
      { usuarioId: USER_ID, nombre: 'Masaje Tailandés' },
      { usuarioId: USER_ID, nombre: 'Masaje Tailandés' },
      { usuarioId: USER_ID, nombre: 'Reflexología' },
    ];
    expect(deriveEspecialidades(USER_ID, input)).toEqual(['Masaje Tailandés', 'Reflexología']);
  });

  it('caps the result at a maximum of 3 especialidades', () => {
    const input = [
      { usuarioId: USER_ID, nombre: 'A' },
      { usuarioId: USER_ID, nombre: 'B' },
      { usuarioId: USER_ID, nombre: 'C' },
      { usuarioId: USER_ID, nombre: 'D' },
      { usuarioId: USER_ID, nombre: 'E' },
    ];
    const result = deriveEspecialidades(USER_ID, input);
    expect(result).toHaveLength(3);
    // Sorted alphabetically: A, B, C (D and E are sliced off)
    expect(result).toEqual(['A', 'B', 'C']);
  });

  it('excludes services belonging to a different usuarioId', () => {
    const input = [
      { usuarioId: USER_ID, nombre: 'Reflexología' },
      { usuarioId: OTHER_USER_ID, nombre: 'Masaje Sueco' },
    ];
    expect(deriveEspecialidades(USER_ID, input)).toEqual(['Reflexología']);
  });

  it('returns empty array when all services are for a different user', () => {
    const input = [{ usuarioId: OTHER_USER_ID, nombre: 'Masaje Sueco' }];
    expect(deriveEspecialidades(USER_ID, input)).toEqual([]);
  });

  it('returns exactly 3 items when there are exactly 3 unique names', () => {
    const input = [
      { usuarioId: USER_ID, nombre: 'B' },
      { usuarioId: USER_ID, nombre: 'A' },
      { usuarioId: USER_ID, nombre: 'C' },
    ];
    const result = deriveEspecialidades(USER_ID, input);
    expect(result).toHaveLength(3);
    expect(result).toEqual(['A', 'B', 'C']);
  });

  it('result is always alphabetically sorted', () => {
    const input = [
      { usuarioId: USER_ID, nombre: 'Zen' },
      { usuarioId: USER_ID, nombre: 'Aromaterapia' },
    ];
    expect(deriveEspecialidades(USER_ID, input)).toEqual(['Aromaterapia', 'Zen']);
  });
});
