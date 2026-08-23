/**
 * TerapeutaStatusService.test.ts
 *
 * Pure unit tests — no mocking needed.
 * deriveEstado has zero external dependencies; operates solely on plain objects + a Date.
 *
 * Priority order under test:
 *   1. inactivo  — usuario.activo === false (overrides everything)
 *   2. ausente   — approved ausencia covering today (overrides en_sala)
 *   3. en_sala   — ICita with estado 'en_curso' spanning now and matching usuarioId
 *   4. disponible — IHorarioTrabajo (tipo fijo) covering current day + time window
 *   5. descanso  — fallback
 */

import { describe, it, expect } from 'vitest';
import { deriveEstado } from '@domain/services/TerapeutaStatusService';
import type { IDeriveEstadoParams } from '@domain/services/TerapeutaStatusService';
import type { IUsuario, IAusencia, ICita, IHorarioTrabajo } from '@domain/models';

// ── Fixtures ────────────────────────────────────────────────────────────────

const activeUsuario: IUsuario = {
  id: 1,
  nombre: 'Ana',
  apellidos: 'García',
  email: 'ana@example.com',
  telefono: null,
  activo: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const inactiveUsuario: IUsuario = { ...activeUsuario, activo: false };

/**
 * Wednesday 2024-06-12 at 10:30 AM LOCAL time.
 * TerapeutaStatusService uses Date.getHours() / Date.getMinutes() (local time),
 * so all "now" fixtures must be constructed with local-time semantics.
 * We use the Date(y,m,d,h,min) constructor which always creates local time.
 */
const WED_10_30 = new Date(2024, 5, 12, 10, 30, 0); // June 12 2024, 10:30 local

/** 2024-06-12 is a Wednesday → ISO day = 3 */
const WED_ISO_DAY = 3;

function makeHorario(overrides: Partial<IHorarioTrabajo> = {}): IHorarioTrabajo {
  return {
    id: 1,
    usuarioId: 1,
    centroId: 1,
    tipo: 'recurrente',
    diaSemana: WED_ISO_DAY,
    fecha: null,
    horaInicio: '09:00',
    horaFin: '18:00',
    activo: true,
    ...overrides,
  };
}

function makeAusencia(overrides: Partial<IAusencia> = {}): IAusencia {
  // Use local midnight constructors so isoDateStr() (which calls toISOString())
  // returns the expected date string regardless of the test environment's timezone.
  // Note: toISOString() converts to UTC. If local TZ is UTC+N, Date(y,m,d) midnight local
  // becomes (d-1)T(24-N):00:00Z. To avoid this, ausencia dates must align with "now"
  // which is also constructed in local time. The service compares isoDateStr(now)
  // against isoDateStr(ausencia.fechaInicio) — both use toISOString() — so as long as
  // both fixtures use the same time-of-day, the date strings will match consistently.
  return {
    id: 1,
    usuarioId: 1,
    tipo: 'vacaciones',
    fechaInicio: new Date(2024, 5, 12, 12, 0, 0), // June 12 noon local
    fechaFin: new Date(2024, 5, 12, 12, 0, 0), // June 12 noon local
    motivo: null,
    aprobada: true,
    aprobadaPor: null,
    createdAt: new Date(2024, 5, 1, 12, 0, 0),
    ...overrides,
  };
}

function makeCita(overrides: Partial<ICita> = {}): ICita {
  // WED_10_30 is local noon; cita spans 10:00–11:00 local to match "now" fixture
  return {
    id: 1,
    clienteId: 10,
    usuarioId: 1,
    centroId: 1,
    salaId: 2,
    servicioId: 3,
    fechaHoraInicio: new Date(2024, 5, 12, 10, 0, 0), // June 12, 10:00 local
    fechaHoraFin: new Date(2024, 5, 12, 11, 0, 0), // June 12, 11:00 local
    estado: 'en_curso',
    precioFinal: 5000,
    notas: null,
    createdAt: new Date(2024, 5, 12),
    updatedAt: new Date(2024, 5, 12),
    ...overrides,
  };
}

function baseParams(now: Date = WED_10_30): IDeriveEstadoParams {
  return {
    usuario: activeUsuario,
    ausencias: [],
    citasActuales: [],
    horarios: [],
    now,
  };
}

// ── 1. inactivo (highest priority) ──────────────────────────────────────────

describe('deriveEstado — inactivo', () => {
  it('returns inactivo when usuario.activo is false', () => {
    const result = deriveEstado({ ...baseParams(), usuario: inactiveUsuario });
    expect(result).toBe('inactivo');
  });

  it('returns inactivo even when a valid en_curso cita exists', () => {
    const result = deriveEstado({
      ...baseParams(),
      usuario: inactiveUsuario,
      citasActuales: [makeCita()],
    });
    expect(result).toBe('inactivo');
  });

  it('returns inactivo even when a valid horario covers the time slot', () => {
    const result = deriveEstado({
      ...baseParams(),
      usuario: inactiveUsuario,
      horarios: [makeHorario()],
    });
    expect(result).toBe('inactivo');
  });

  it('returns inactivo even when an ausencia covers today', () => {
    const result = deriveEstado({
      ...baseParams(),
      usuario: inactiveUsuario,
      ausencias: [makeAusencia()],
    });
    expect(result).toBe('inactivo');
  });
});

// ── 2. ausente (overrides en_sala) ───────────────────────────────────────────

describe('deriveEstado — ausente', () => {
  it('returns ausente when an ausencia spans today', () => {
    const result = deriveEstado({
      ...baseParams(),
      ausencias: [makeAusencia()],
    });
    expect(result).toBe('ausente');
  });

  it('returns ausente even when a matching en_curso cita exists (ausente takes priority)', () => {
    const result = deriveEstado({
      ...baseParams(),
      ausencias: [makeAusencia()],
      citasActuales: [makeCita()],
    });
    expect(result).toBe('ausente');
  });

  it('returns ausente on the exact start date of the ausencia (inclusive boundary)', () => {
    // Use noon local time for both "now" and ausencia boundaries so
    // toISOString() (used by isoDateStr) always returns the correct date string
    // regardless of the test runner's local timezone offset.
    const now = new Date(2024, 5, 10, 12, 0, 0); // June 10, noon local
    const ausencia = makeAusencia({
      fechaInicio: new Date(2024, 5, 10, 12, 0, 0), // June 10 noon local
      fechaFin: new Date(2024, 5, 15, 12, 0, 0),
    });
    const result = deriveEstado({ ...baseParams(now), ausencias: [ausencia] });
    expect(result).toBe('ausente');
  });

  it('returns ausente on the exact end date of the ausencia (inclusive boundary)', () => {
    const now = new Date(2024, 5, 15, 12, 0, 0); // June 15, noon local
    const ausencia = makeAusencia({
      fechaInicio: new Date(2024, 5, 10, 12, 0, 0),
      fechaFin: new Date(2024, 5, 15, 12, 0, 0),
    });
    const result = deriveEstado({ ...baseParams(now), ausencias: [ausencia] });
    expect(result).toBe('ausente');
  });

  it('does NOT return ausente the day after the ausencia ends', () => {
    const now = new Date(2024, 5, 16, 12, 0, 0); // June 16 (Mon), noon local
    const ausencia = makeAusencia({
      fechaInicio: new Date(2024, 5, 10, 12, 0, 0),
      fechaFin: new Date(2024, 5, 15, 12, 0, 0),
    });
    // No cita, no horario → descanso
    const result = deriveEstado({ ...baseParams(now), ausencias: [ausencia] });
    expect(result).toBe('descanso');
  });

  it('does NOT return ausente the day before the ausencia starts', () => {
    const now = new Date(2024, 5, 9, 12, 0, 0); // June 9 (Sun), noon local
    const ausencia = makeAusencia({
      fechaInicio: new Date(2024, 5, 10, 12, 0, 0),
      fechaFin: new Date(2024, 5, 15, 12, 0, 0),
    });
    const result = deriveEstado({ ...baseParams(now), ausencias: [ausencia] });
    expect(result).toBe('descanso');
  });

  it('handles multiple ausencias — returns ausente if any cover today', () => {
    const now = new Date(2024, 5, 12, 12, 0, 0); // June 12, noon local
    const ausencias: IAusencia[] = [
      makeAusencia({
        id: 1,
        fechaInicio: new Date(2024, 5, 1, 12, 0, 0),
        fechaFin: new Date(2024, 5, 5, 12, 0, 0),
      }),
      makeAusencia({
        id: 2,
        fechaInicio: new Date(2024, 5, 10, 12, 0, 0),
        fechaFin: new Date(2024, 5, 14, 12, 0, 0),
      }),
    ];
    const result = deriveEstado({ ...baseParams(now), ausencias });
    expect(result).toBe('ausente');
  });
});

// ── 3. en_sala ───────────────────────────────────────────────────────────────

describe('deriveEstado — en_sala', () => {
  it('returns en_sala when an en_curso cita matches usuarioId and spans now', () => {
    const result = deriveEstado({
      ...baseParams(),
      citasActuales: [makeCita()],
    });
    expect(result).toBe('en_sala');
  });

  it('does NOT return en_sala when cita.usuarioId differs from usuario.id', () => {
    const result = deriveEstado({
      ...baseParams(),
      citasActuales: [makeCita({ usuarioId: 99 })],
    });
    // No horario → descanso
    expect(result).toBe('descanso');
  });

  it('does NOT return en_sala when cita.estado is not en_curso', () => {
    const result = deriveEstado({
      ...baseParams(),
      citasActuales: [makeCita({ estado: 'pendiente' })],
    });
    expect(result).toBe('descanso');
  });

  it('does NOT return en_sala when now is before cita.fechaHoraInicio', () => {
    // now = 09:30 local, cita starts at 10:00 local — Date comparison is timezone-safe
    const now = new Date(2024, 5, 12, 9, 30, 0);
    const cita = makeCita({
      fechaHoraInicio: new Date(2024, 5, 12, 10, 0, 0),
      fechaHoraFin: new Date(2024, 5, 12, 11, 0, 0),
    });
    const result = deriveEstado({ ...baseParams(now), citasActuales: [cita] });
    expect(result).toBe('descanso');
  });

  it('does NOT return en_sala when now is after cita.fechaHoraFin', () => {
    // now = 11:30 local, cita ended at 11:00 local
    const now = new Date(2024, 5, 12, 11, 30, 0);
    const cita = makeCita({
      fechaHoraInicio: new Date(2024, 5, 12, 10, 0, 0),
      fechaHoraFin: new Date(2024, 5, 12, 11, 0, 0),
    });
    const result = deriveEstado({ ...baseParams(now), citasActuales: [cita] });
    expect(result).toBe('descanso');
  });

  it('returns en_sala at exact start boundary (now === fechaHoraInicio)', () => {
    const boundary = new Date(2024, 5, 12, 10, 0, 0);
    const cita = makeCita({
      fechaHoraInicio: boundary,
      fechaHoraFin: new Date(2024, 5, 12, 11, 0, 0),
    });
    const result = deriveEstado({ ...baseParams(boundary), citasActuales: [cita] });
    expect(result).toBe('en_sala');
  });

  it('returns en_sala at exact end boundary (now === fechaHoraFin)', () => {
    const boundary = new Date(2024, 5, 12, 11, 0, 0);
    const cita = makeCita({
      fechaHoraInicio: new Date(2024, 5, 12, 10, 0, 0),
      fechaHoraFin: boundary,
    });
    const result = deriveEstado({ ...baseParams(boundary), citasActuales: [cita] });
    expect(result).toBe('en_sala');
  });
});

// ── 4. disponible ────────────────────────────────────────────────────────────

describe('deriveEstado — disponible', () => {
  it('returns disponible when a fijo horario covers the current day and time', () => {
    // WED_10_30 = Wednesday 10:30, horario 09:00-18:00 on Wednesday (ISO 3)
    const result = deriveEstado({
      ...baseParams(),
      horarios: [makeHorario()],
    });
    expect(result).toBe('disponible');
  });

  it('does NOT return disponible when horario tipo is especifico (not fijo)', () => {
    const result = deriveEstado({
      ...baseParams(),
      horarios: [makeHorario({ tipo: 'especifico' })],
    });
    expect(result).toBe('descanso');
  });

  it('does NOT return disponible when horario.diaSemana differs from today', () => {
    // Wednesday = 3, horario for Monday = 1
    const result = deriveEstado({
      ...baseParams(),
      horarios: [makeHorario({ diaSemana: 1 })],
    });
    expect(result).toBe('descanso');
  });

  it('does NOT return disponible when now is before horaInicio', () => {
    // TerapeutaStatusService uses Date.getHours() (local time).
    // Use Date(y,m,d,h,min) constructor to guarantee the correct local hour.
    // Wednesday 2024-06-12, 08:30 local (before horario 09:00)
    const now = new Date(2024, 5, 12, 8, 30, 0);
    const result = deriveEstado({
      ...baseParams(now),
      horarios: [makeHorario({ horaInicio: '09:00', horaFin: '18:00' })],
    });
    expect(result).toBe('descanso');
  });

  it('does NOT return disponible when now equals horaFin (exclusive upper bound)', () => {
    // now = 18:00 local, horario ends at 18:00 → nowMinutes (18*60) < end (18*60) = false
    const now = new Date(2024, 5, 12, 18, 0, 0); // Wed 18:00 local
    const result = deriveEstado({
      ...baseParams(now),
      horarios: [makeHorario({ horaInicio: '09:00', horaFin: '18:00' })],
    });
    expect(result).toBe('descanso');
  });

  it('returns disponible at exactly horaInicio (inclusive lower bound)', () => {
    const now = new Date(2024, 5, 12, 9, 0, 0); // Wed 09:00 local
    const result = deriveEstado({
      ...baseParams(now),
      horarios: [makeHorario({ horaInicio: '09:00', horaFin: '18:00' })],
    });
    expect(result).toBe('disponible');
  });

  it('handles Sunday correctly — ISO day 7, Date.getDay() === 0', () => {
    // 2024-06-09 is a Sunday (getDay() === 0 → ISO 7)
    // Sunday 10:00 local, horario 08:00–14:00 on ISO day 7
    const sundayNow = new Date(2024, 5, 9, 10, 0, 0);
    const sundayHorario = makeHorario({ diaSemana: 7, horaInicio: '08:00', horaFin: '14:00' });
    const result = deriveEstado({ ...baseParams(sundayNow), horarios: [sundayHorario] });
    expect(result).toBe('disponible');
  });

  it('does NOT match a Sunday horario (ISO 7) on a Monday (ISO 1)', () => {
    // 2024-06-10 is Monday (getDay() === 1 → ISO 1)
    // Monday 10:00 local — should not match Sunday horario
    const mondayNow = new Date(2024, 5, 10, 10, 0, 0);
    const sundayHorario = makeHorario({ diaSemana: 7, horaInicio: '08:00', horaFin: '14:00' });
    const result = deriveEstado({ ...baseParams(mondayNow), horarios: [sundayHorario] });
    expect(result).toBe('descanso');
  });
});

// ── 5. descanso (fallback) ────────────────────────────────────────────────────

describe('deriveEstado — descanso', () => {
  it('returns descanso when no conditions match (active user, no ausencias, no citas, no horarios)', () => {
    const result = deriveEstado(baseParams());
    expect(result).toBe('descanso');
  });

  it('returns descanso when horario exists for a different day', () => {
    // Thursday horario; now = Wednesday
    const result = deriveEstado({
      ...baseParams(),
      horarios: [makeHorario({ diaSemana: 4 })],
    });
    expect(result).toBe('descanso');
  });

  it('returns descanso with an empty ausencias array', () => {
    const result = deriveEstado({ ...baseParams(), ausencias: [] });
    expect(result).toBe('descanso');
  });
});

// ── Day boundary (midnight edge case) ────────────────────────────────────────

describe('deriveEstado — day boundary', () => {
  it('correctly resolves ausente when now and ausencia fechas are the same day', () => {
    // All timestamps use noon local time to ensure toISOString() returns the
    // same date string regardless of the test runner's UTC offset.
    const noon = new Date(2024, 5, 12, 12, 0, 0); // June 12, noon local
    const ausencia = makeAusencia({
      fechaInicio: new Date(2024, 5, 12, 12, 0, 0), // June 12 noon local
      fechaFin: new Date(2024, 5, 12, 12, 0, 0), // June 12 noon local
    });
    const result = deriveEstado({ ...baseParams(noon), ausencias: [ausencia] });
    expect(result).toBe('ausente');
  });

  it('returns descanso when ausencia ended the previous day', () => {
    // now = June 12 noon, ausencia ended June 11 noon
    const now = new Date(2024, 5, 12, 12, 0, 0);
    const ausencia = makeAusencia({
      fechaInicio: new Date(2024, 5, 10, 12, 0, 0),
      fechaFin: new Date(2024, 5, 11, 12, 0, 0),
    });
    const result = deriveEstado({ ...baseParams(now), ausencias: [ausencia] });
    expect(result).toBe('descanso');
  });
});
