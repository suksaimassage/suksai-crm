/**
 * CitaService.test.ts
 *
 * Unit tests for the appointment domain service.
 *
 * Mocking strategy (per .claude/rules/testing.md):
 *   - The domain service is NEVER mocked. We run the REAL CitaService.
 *   - Its dependencies are PORTS (repositories) — the architectural boundary —
 *     so those are the things we fake. Each port method is a vi.fn() with a
 *     sensible "all rules pass" default; each test overrides exactly ONE method
 *     to drive exactly ONE rule, so a test has a single reason to fail.
 *   - Real value objects (DateRange / TimeRange / Money) run unmocked.
 *
 * Time handling: CitaService computes the weekday via getDay() and the work-hours
 * window via getHours()/getMinutes() (LOCAL time). All fixture dates are built
 * with the local-time Date constructor so the appointment deterministically lands
 * on a Monday 10:00–11:00 regardless of the runner's timezone.
 *
 * Coverage focus (Analyst §5): schedule rules 1–10, reschedule (self-exclusion
 * from overlap), changeEstado (legal vs illegal), cancel guards, calculateFinalPrice.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CitaService } from '@domain/services/CitaService';
import { BusinessRuleViolation, ValidationError } from '@domain/types';
import type {
  ICita,
  IServicio,
  ISala,
  IUsuarioCentro,
  IHorarioTrabajo,
  IAusencia,
  IServicioCentro,
} from '@domain/models';

// ── Fixed reference instants (LOCAL time → Monday 2026-05-18) ──────────────────
// 2026-05-18 is a Monday. Using the multi-arg Date ctor pins these to local time,
// so getDay()===1 and getHours()===10 hold in any timezone.
const START = new Date(2026, 4, 18, 10, 0, 0); // Mon 10:00 local
const END = new Date(2026, 4, 18, 11, 0, 0); // Mon 11:00 local  → 60 min

const CENTRO_ID = 1;
const SALA_ID = 7;
const SERVICIO_ID = 3;
const USUARIO_ID = 9;
const CLIENTE_ID = 4;
const CITA_ID = 100;

// ── Entity fixtures (each rule's "happy path" value) ───────────────────────────

function makeServicio(overrides: Partial<IServicio> = {}): IServicio {
  return {
    id: SERVICIO_ID,
    tipoServicioId: 1,
    nombre: 'Masaje Tradicional',
    descripcion: null,
    duracionMinutos: 60,
    precioBase: 50, // euros (50.00 €) — IServicio.precioBase is euros (numeric), NOT cents
    esBono: false,
    sesionesTotales: null,
    tieneDescuento: false,
    porcentajeDescuento: 0,
    estado: 'activo',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function makeSala(overrides: Partial<ISala> = {}): ISala {
  return {
    id: SALA_ID,
    centroId: CENTRO_ID,
    nombre: 'Sala Loto',
    capacidad: 1,
    activa: true,
    descripcion: null,
    ...overrides,
  };
}

function makeAsignacion(overrides: Partial<IUsuarioCentro> = {}): IUsuarioCentro {
  return {
    usuarioId: USUARIO_ID,
    centroId: CENTRO_ID,
    esPrincipal: true,
    activo: true,
    assignedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function makeHorarioRecurrente(overrides: Partial<IHorarioTrabajo> = {}): IHorarioTrabajo {
  return {
    id: 50,
    usuarioId: USUARIO_ID,
    centroId: CENTRO_ID,
    tipo: 'recurrente',
    diaSemana: 1, // Monday — matches START
    fecha: null,
    horaInicio: '08:00',
    horaFin: '20:00',
    activo: true,
    ...overrides,
  };
}

function makeCita(overrides: Partial<ICita> = {}): ICita {
  return {
    id: CITA_ID,
    clienteId: CLIENTE_ID,
    usuarioId: USUARIO_ID,
    centroId: CENTRO_ID,
    salaId: SALA_ID,
    servicioId: SERVICIO_ID,
    fechaHoraInicio: START,
    fechaHoraFin: END,
    estado: 'pendiente',
    precioFinal: 5000, // cents (50.00 €) — ICita.precioFinal is cents (Money.cents), unlike precioBase
    notas: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

const VALID_CREATE_DTO = {
  clienteId: CLIENTE_ID,
  usuarioId: USUARIO_ID,
  centroId: CENTRO_ID,
  salaId: SALA_ID,
  servicioId: SERVICIO_ID,
  fechaHoraInicio: START,
  fechaHoraFin: END,
  precioFinal: 5000, // cents — schedule() forwards this verbatim to create()
} as const;

// ── Port fakes ──────────────────────────────────────────────────────────────

interface IMockCitaRepo {
  findById: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  updateEstado: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
  findByUsuario: ReturnType<typeof vi.fn>;
  findBySala: ReturnType<typeof vi.fn>;
}

function makeDeps() {
  const citaRepository: IMockCitaRepo = {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateEstado: vi.fn(),
    cancel: vi.fn(),
    findByUsuario: vi.fn().mockResolvedValue([]), // no therapist conflicts
    findBySala: vi.fn().mockResolvedValue([]), // no sala conflicts
  };
  const servicioRepository = {
    findById: vi.fn().mockResolvedValue(makeServicio()),
    findServicioCentro: vi.fn().mockResolvedValue(null),
  };
  const salaRepository = {
    findById: vi.fn().mockResolvedValue(makeSala()),
  };
  const usuarioCentroRepository = {
    findByUsuario: vi.fn().mockResolvedValue([makeAsignacion()]),
  };
  const horarioRepository = {
    findByUsuarioAndCentro: vi.fn().mockResolvedValue([makeHorarioRecurrente()]),
  };
  const ausenciaRepository = {
    findByUsuario: vi.fn().mockResolvedValue([]), // no leave
  };

  return {
    citaRepository,
    servicioRepository,
    salaRepository,
    usuarioCentroRepository,
    horarioRepository,
    ausenciaRepository,
  };
}

// Build a service from a deps bag. The real CitaService only touches the methods
// faked above, so the partial bag satisfies it at runtime; cast through unknown
// keeps the test honest about which methods matter.
function makeService(deps: ReturnType<typeof makeDeps>): CitaService {
  return new CitaService(deps as unknown as ConstructorParameters<typeof CitaService>[0]);
}

// ════════════════════════════════════════════════════════════════════════════
// schedule (create) — rules 1–10
// ════════════════════════════════════════════════════════════════════════════

describe('CitaService.schedule — happy path', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: CitaService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
    deps.citaRepository.create.mockResolvedValue(makeCita());
  });

  it('persists the cita when all rules pass', async () => {
    const result = await service.schedule(VALID_CREATE_DTO);
    // schedule() stamps estado onto the create payload — with cliente/usuario/sala
    // all present it is 'pendiente' (the DTO itself carries no estado).
    expect(deps.citaRepository.create).toHaveBeenCalledWith({
      ...VALID_CREATE_DTO,
      estado: 'pendiente',
    });
    expect(result.id).toBe(CITA_ID);
  });

  it('does not call create when a rule fails (no partial persistence)', async () => {
    deps.servicioRepository.findById.mockResolvedValue(makeServicio({ estado: 'inactivo' }));
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toThrow(BusinessRuleViolation);
    expect(deps.citaRepository.create).not.toHaveBeenCalled();
  });
});

describe('CitaService.schedule — rule 1: end after start', () => {
  it('throws ValidationError when end equals start', async () => {
    const deps = makeDeps();
    const service = makeService(deps);
    await expect(service.schedule({ ...VALID_CREATE_DTO, fechaHoraFin: START })).rejects.toThrow(
      ValidationError,
    );
  });

  it('throws ValidationError when end is before start', async () => {
    const deps = makeDeps();
    const service = makeService(deps);
    await expect(
      service.schedule({
        ...VALID_CREATE_DTO,
        fechaHoraInicio: END,
        fechaHoraFin: START,
      }),
    ).rejects.toThrow(ValidationError);
  });
});

describe('CitaService.schedule — rule 2: duration matches service', () => {
  it('throws ValidationError when servicio not found', async () => {
    const deps = makeDeps();
    deps.servicioRepository.findById.mockResolvedValue(null);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toThrow(ValidationError);
  });

  it('throws DURATION_MISMATCH when appointment length ≠ servicio.duracionMinutos', async () => {
    const deps = makeDeps();
    // Service is 90 min, appointment is 60 min
    deps.servicioRepository.findById.mockResolvedValue(makeServicio({ duracionMinutos: 90 }));
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toMatchObject({
      code: 'DURATION_MISMATCH',
    });
  });
});

describe('CitaService.schedule — rule: servicio active', () => {
  it('throws SERVICIO_INACTIVO when the service is not active', async () => {
    const deps = makeDeps();
    deps.servicioRepository.findById.mockResolvedValue(makeServicio({ estado: 'inactivo' }));
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toMatchObject({
      code: 'SERVICIO_INACTIVO',
    });
  });
});

describe('CitaService.schedule — rule 3/5: sala belongs to centro + active', () => {
  it('throws SALA_CENTRO_MISMATCH when sala is not found', async () => {
    const deps = makeDeps();
    deps.salaRepository.findById.mockResolvedValue(null);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toMatchObject({
      code: 'SALA_CENTRO_MISMATCH',
    });
  });

  it('throws SALA_CENTRO_MISMATCH when sala belongs to a different centro', async () => {
    const deps = makeDeps();
    deps.salaRepository.findById.mockResolvedValue(makeSala({ centroId: 999 }));
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toMatchObject({
      code: 'SALA_CENTRO_MISMATCH',
    });
  });

  it('throws SALA_INACTIVA when the sala is inactive', async () => {
    const deps = makeDeps();
    deps.salaRepository.findById.mockResolvedValue(makeSala({ activa: false }));
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toMatchObject({
      code: 'SALA_INACTIVA',
    });
  });
});

describe('CitaService.schedule — rule 4: therapist assigned to centro', () => {
  it('throws USUARIO_NOT_ASSIGNED_TO_CENTRO when no assignment matches the centro', async () => {
    const deps = makeDeps();
    deps.usuarioCentroRepository.findByUsuario.mockResolvedValue([
      makeAsignacion({ centroId: 555 }),
    ]);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toMatchObject({
      code: 'USUARIO_NOT_ASSIGNED_TO_CENTRO',
    });
  });

  it('throws USUARIO_NOT_ASSIGNED_TO_CENTRO when the user has no assignments at all', async () => {
    const deps = makeDeps();
    deps.usuarioCentroRepository.findByUsuario.mockResolvedValue([]);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toMatchObject({
      code: 'USUARIO_NOT_ASSIGNED_TO_CENTRO',
    });
  });
});

describe('CitaService.schedule — rule 9: within work hours', () => {
  it('falls back to the full studio window and ACCEPTS a within-hours cita when the therapist has no schedule that day', async () => {
    // OFFER/SUBMIT consistency: AvailabilityService offers the full 09:00–21:00
    // grid when no horario applies, so submit must accept within those hours too.
    // Previously this threw NO_HORARIO → no cita could ever be created for a
    // therapist with no horarios_trabajo rows (the agenda stayed empty).
    const deps = makeDeps();
    deps.citaRepository.create.mockResolvedValue(makeCita());
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([]);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).resolves.toBeDefined();
  });

  it('falls back to the full studio window when the only schedule is for a different weekday', async () => {
    const deps = makeDeps();
    deps.citaRepository.create.mockResolvedValue(makeCita());
    // START is Monday (diaSemana 1); only a Tuesday recurrente exists → no window
    // for Monday → full studio window fallback → within-hours cita is accepted.
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ diaSemana: 2 }),
    ]);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).resolves.toBeDefined();
  });

  it('ignores inactive horarios and falls back to the full studio window', async () => {
    const deps = makeDeps();
    deps.citaRepository.create.mockResolvedValue(makeCita());
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ activo: false }),
    ]);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).resolves.toBeDefined();
  });

  it('still rejects (OUTSIDE_WORK_HOURS) a no-schedule cita outside 09:00–21:00', async () => {
    // The fallback is the studio window, not "anything goes": an early-morning
    // slot the agenda would never offer is still rejected at submit.
    const deps = makeDeps();
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([]);
    const service = makeService(deps);
    const earlyStart = new Date(2026, 4, 18, 7, 0, 0); // 07:00 — before studio open
    const earlyEnd = new Date(2026, 4, 18, 8, 0, 0); // 08:00
    await expect(
      service.schedule({
        ...VALID_CREATE_DTO,
        fechaHoraInicio: earlyStart,
        fechaHoraFin: earlyEnd,
      }),
    ).rejects.toMatchObject({ code: 'OUTSIDE_WORK_HOURS' });
  });

  it('throws OUTSIDE_WORK_HOURS when the appointment falls outside the work window', async () => {
    const deps = makeDeps();
    // Work window 08:00–09:30 but appointment is 10:00–11:00
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({ horaInicio: '08:00', horaFin: '09:30' }),
    ]);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toMatchObject({
      code: 'OUTSIDE_WORK_HOURS',
    });
  });

  it('uses the especifico window for the day (overrides the recurrente)', async () => {
    const deps = makeDeps();
    deps.citaRepository.create.mockResolvedValue(makeCita());
    // The adapter stores a DB `date` as a UTC-midnight Date (`new Date('YYYY-MM-DD')`),
    // while the appointment start is a LOCAL wall-clock Date. The override model
    // matches the especifico on the appointment's LOCAL calendar day (2026-05-18)
    // in any timezone.
    const fechaEspecifica = new Date('2026-05-18T00:00:00.000Z');
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      // recurrente that would FAIL (window too small)…
      makeHorarioRecurrente({ horaInicio: '08:00', horaFin: '09:00' }),
      // …but a same-day especifico override that PASSES (08:00–20:00 ⊇ 10:00–11:00)
      makeHorarioRecurrente({
        id: 51,
        tipo: 'especifico',
        diaSemana: null,
        fecha: fechaEspecifica,
        horaInicio: '08:00',
        horaFin: '20:00',
      }),
    ]);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).resolves.toBeDefined();
  });

  it('especifico OVERRIDES recurrente — an appointment fitting only the recurrente is rejected', async () => {
    const deps = makeDeps();
    const fechaEspecifica = new Date('2026-05-18T00:00:00.000Z');
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      // A WIDE recurrente that WOULD contain 10:00–11:00…
      makeHorarioRecurrente({ horaInicio: '08:00', horaFin: '20:00' }),
      // …but a same-day especifico exception REPLACES it with a morning-only window.
      makeHorarioRecurrente({
        id: 61,
        tipo: 'especifico',
        diaSemana: null,
        fecha: fechaEspecifica,
        horaInicio: '08:00',
        horaFin: '09:30',
      }),
    ]);
    const service = makeService(deps);
    // 10:00–11:00 fits the recurrente but NOT the especifico → override rejects it.
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toMatchObject({
      code: 'OUTSIDE_WORK_HOURS',
    });
  });

  it('accepts an appointment that fits a LATER window of a split shift (multi-window override)', async () => {
    const deps = makeDeps();
    deps.citaRepository.create.mockResolvedValue(makeCita());
    const fechaEspecifica = new Date('2026-05-18T00:00:00.000Z');
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      // Split shift: morning + afternoon especifico windows on the same date.
      makeHorarioRecurrente({
        id: 60,
        tipo: 'especifico',
        diaSemana: null,
        fecha: fechaEspecifica,
        horaInicio: '08:00',
        horaFin: '12:00',
      }),
      makeHorarioRecurrente({
        id: 61,
        tipo: 'especifico',
        diaSemana: null,
        fecha: fechaEspecifica,
        horaInicio: '16:00',
        horaFin: '20:00',
      }),
    ]);
    const service = makeService(deps);
    // 16:30–17:30 fits the SECOND window; the old single-window check (first
    // especifico only) would have wrongly rejected it as OUTSIDE_WORK_HOURS.
    const start = new Date(2026, 4, 18, 16, 30, 0);
    const end = new Date(2026, 4, 18, 17, 30, 0);
    await expect(
      service.schedule({ ...VALID_CREATE_DTO, fechaHoraInicio: start, fechaHoraFin: end }),
    ).resolves.toBeDefined();
  });

  it('rejects an appointment that lands in the gap between split-shift windows', async () => {
    const deps = makeDeps();
    const fechaEspecifica = new Date('2026-05-18T00:00:00.000Z');
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({
        id: 60,
        tipo: 'especifico',
        diaSemana: null,
        fecha: fechaEspecifica,
        horaInicio: '08:00',
        horaFin: '12:00',
      }),
      makeHorarioRecurrente({
        id: 61,
        tipo: 'especifico',
        diaSemana: null,
        fecha: fechaEspecifica,
        horaInicio: '16:00',
        horaFin: '20:00',
      }),
    ]);
    const service = makeService(deps);
    // 13:00–14:00 sits in the midday gap → no single window contains it.
    const gapStart = new Date(2026, 4, 18, 13, 0, 0);
    const gapEnd = new Date(2026, 4, 18, 14, 0, 0);
    await expect(
      service.schedule({ ...VALID_CREATE_DTO, fechaHoraInicio: gapStart, fechaHoraFin: gapEnd }),
    ).rejects.toMatchObject({ code: 'OUTSIDE_WORK_HOURS' });
  });

  it('matches an especifico by LOCAL calendar day for a late appointment (no UTC rollback)', async () => {
    const deps = makeDeps();
    deps.citaRepository.create.mockResolvedValue(makeCita());
    // Stored especifico fecha is a UTC-midnight Date (adapter `new Date('YYYY-MM-DD')`)
    // for the appointment's LOCAL calendar day (2026-05-18). The ONLY schedule is
    // this especifico — there is no recurrente fallback.
    const fechaEspecifica = new Date('2026-05-18T00:00:00.000Z');
    deps.horarioRepository.findByUsuarioAndCentro.mockResolvedValue([
      makeHorarioRecurrente({
        id: 70,
        tipo: 'especifico',
        diaSemana: null,
        fecha: fechaEspecifica,
        horaInicio: '09:00',
        horaFin: '21:00',
      }),
    ]);
    const service = makeService(deps);
    // Late appointment 20:00–21:00. Resolving the especifico by the appointment's
    // UTC date-part (the old bug) would roll the calendar day in an offset TZ
    // (Europe/Madrid, America/*), miss the especifico, find no recurrente, and
    // wrongly throw NO_HORARIO. The LOCAL date-part keeps the match in any TZ.
    const lateStart = new Date(2026, 4, 18, 20, 0, 0);
    const lateEnd = new Date(2026, 4, 18, 21, 0, 0);
    await expect(
      service.schedule({ ...VALID_CREATE_DTO, fechaHoraInicio: lateStart, fechaHoraFin: lateEnd }),
    ).resolves.toBeDefined();
  });
});

describe('CitaService.schedule — rule 8: therapist overlap', () => {
  it('throws THERAPIST_CONFLICT when a non-cancelled therapist cita overlaps', async () => {
    const deps = makeDeps();
    // Overlapping cita 10:30–11:30 for the same therapist
    deps.citaRepository.findByUsuario.mockResolvedValue([
      makeCita({
        id: 200,
        fechaHoraInicio: new Date(2026, 4, 18, 10, 30, 0),
        fechaHoraFin: new Date(2026, 4, 18, 11, 30, 0),
        estado: 'confirmada',
      }),
    ]);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toMatchObject({
      code: 'THERAPIST_CONFLICT',
    });
  });

  it('does NOT conflict when the overlapping therapist cita is cancelled', async () => {
    const deps = makeDeps();
    deps.citaRepository.create.mockResolvedValue(makeCita());
    deps.citaRepository.findByUsuario.mockResolvedValue([
      makeCita({
        id: 200,
        fechaHoraInicio: new Date(2026, 4, 18, 10, 30, 0),
        fechaHoraFin: new Date(2026, 4, 18, 11, 30, 0),
        estado: 'cancelada',
      }),
    ]);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).resolves.toBeDefined();
  });
});

describe('CitaService.schedule — rule: sala overlap', () => {
  it('throws SALA_CONFLICT when a non-cancelled cita occupies the sala', async () => {
    const deps = makeDeps();
    deps.citaRepository.findBySala.mockResolvedValue([
      makeCita({
        id: 300,
        usuarioId: 88, // different therapist, same sala
        fechaHoraInicio: new Date(2026, 4, 18, 10, 30, 0),
        fechaHoraFin: new Date(2026, 4, 18, 11, 30, 0),
        estado: 'confirmada',
      }),
    ]);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toMatchObject({
      code: 'SALA_CONFLICT',
    });
  });

  it('does NOT conflict when the sala cita is cancelled', async () => {
    const deps = makeDeps();
    deps.citaRepository.create.mockResolvedValue(makeCita());
    deps.citaRepository.findBySala.mockResolvedValue([makeCita({ id: 300, estado: 'cancelada' })]);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).resolves.toBeDefined();
  });
});

describe('CitaService.schedule — rule 6: therapist on leave', () => {
  it('throws THERAPIST_ON_LEAVE when an approved ausencia covers the start', async () => {
    const deps = makeDeps();
    deps.ausenciaRepository.findByUsuario.mockResolvedValue([
      {
        id: 1,
        usuarioId: USUARIO_ID,
        tipo: 'vacaciones',
        fechaInicio: new Date(2026, 4, 17),
        fechaFin: new Date(2026, 4, 19),
        motivo: null,
        aprobada: true,
        aprobadaPor: 1,
        createdAt: new Date('2024-01-01'),
      } satisfies IAusencia,
    ]);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).rejects.toMatchObject({
      code: 'THERAPIST_ON_LEAVE',
    });
  });

  it('does NOT block when the covering ausencia is not approved', async () => {
    const deps = makeDeps();
    deps.citaRepository.create.mockResolvedValue(makeCita());
    deps.ausenciaRepository.findByUsuario.mockResolvedValue([
      {
        id: 1,
        usuarioId: USUARIO_ID,
        tipo: 'vacaciones',
        fechaInicio: new Date(2026, 4, 17),
        fechaFin: new Date(2026, 4, 19),
        motivo: null,
        aprobada: false,
        aprobadaPor: null,
        createdAt: new Date('2024-01-01'),
      } satisfies IAusencia,
    ]);
    const service = makeService(deps);
    await expect(service.schedule(VALID_CREATE_DTO)).resolves.toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// reschedule (edit / reassign)
// ════════════════════════════════════════════════════════════════════════════

describe('CitaService.reschedule', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: CitaService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
    deps.citaRepository.findById.mockResolvedValue(makeCita());
    // Return value is unused by reschedule's caller in these tests (only the
    // hook's onSuccess reads it); a static resolved cita keeps the mock simple.
    deps.citaRepository.update.mockResolvedValue(makeCita());
  });

  it('throws ValidationError when the cita does not exist', async () => {
    deps.citaRepository.findById.mockResolvedValue(null);
    await expect(service.reschedule(CITA_ID, { salaId: 8 })).rejects.toThrow(ValidationError);
  });

  it('merges the partial onto the current cita and persists via update', async () => {
    // Reassign to a new therapist only; everything else inherited from current.
    deps.usuarioCentroRepository.findByUsuario.mockResolvedValue([
      makeAsignacion({ usuarioId: 42 }),
    ]);
    await service.reschedule(CITA_ID, { usuarioId: 42 });
    expect(deps.citaRepository.update).toHaveBeenCalledWith(
      CITA_ID,
      expect.objectContaining({ usuarioId: 42, salaId: SALA_ID, servicioId: SERVICIO_ID }),
    );
  });

  it('EXCLUDES the cita being edited from its own therapist-overlap check', async () => {
    // The only "overlapping" cita is the one we're editing → must NOT conflict.
    deps.citaRepository.findByUsuario.mockResolvedValue([
      makeCita({
        id: CITA_ID, // same id as the cita under edit
        fechaHoraInicio: START,
        fechaHoraFin: END,
        estado: 'confirmada',
      }),
    ]);
    await expect(service.reschedule(CITA_ID, { salaId: SALA_ID })).resolves.toBeDefined();
    expect(deps.citaRepository.update).toHaveBeenCalled();
  });

  it('EXCLUDES the cita being edited from its own sala-overlap check', async () => {
    deps.citaRepository.findBySala.mockResolvedValue([
      makeCita({ id: CITA_ID, estado: 'confirmada' }),
    ]);
    await expect(service.reschedule(CITA_ID, { salaId: SALA_ID })).resolves.toBeDefined();
  });

  it('still rejects an overlap with a DIFFERENT cita during reschedule', async () => {
    deps.citaRepository.findByUsuario.mockResolvedValue([
      makeCita({
        id: 999, // a different cita
        fechaHoraInicio: new Date(2026, 4, 18, 10, 30, 0),
        fechaHoraFin: new Date(2026, 4, 18, 11, 30, 0),
        estado: 'confirmada',
      }),
    ]);
    await expect(service.reschedule(CITA_ID, { salaId: SALA_ID })).rejects.toMatchObject({
      code: 'THERAPIST_CONFLICT',
    });
  });

  it('re-runs DURATION_MISMATCH when the new servicio duration disagrees with the time span', async () => {
    // Keep the current 60-min span, but switch to a 90-min service.
    deps.servicioRepository.findById.mockResolvedValue(makeServicio({ duracionMinutos: 90 }));
    await expect(service.reschedule(CITA_ID, { servicioId: SERVICIO_ID })).rejects.toMatchObject({
      code: 'DURATION_MISMATCH',
    });
  });

  // ── sin_asignar → pendiente on masajista assignment (owner-decision) ─────────
  // A 'sin_asignar' cita auto-transitions to 'pendiente' as soon as the edit
  // assigns a masajista (usuarioId !== null), even if cliente/sala stay null.

  it('flips a sin_asignar cita to pendiente when the reschedule assigns a masajista', async () => {
    // Current cita is sin_asignar with no therapist yet. The edit assigns one.
    deps.citaRepository.findById.mockResolvedValue(
      makeCita({ estado: 'sin_asignar', usuarioId: null }),
    );
    // update echoes the merged fields; the estado flip is a separate updateEstado call.
    deps.citaRepository.update.mockResolvedValue(
      makeCita({ estado: 'sin_asignar', usuarioId: USUARIO_ID }),
    );
    deps.citaRepository.updateEstado.mockResolvedValue(
      makeCita({ estado: 'pendiente', usuarioId: USUARIO_ID }),
    );

    const result = await service.reschedule(CITA_ID, { usuarioId: USUARIO_ID });

    expect(deps.citaRepository.updateEstado).toHaveBeenCalledWith({
      id: CITA_ID,
      estado: 'pendiente',
    });
    expect(result.estado).toBe('pendiente');
  });

  it('keeps a sin_asignar cita as sin_asignar when the reschedule assigns no masajista', async () => {
    // sin_asignar with no therapist; the edit only touches the sala → usuarioId stays null.
    deps.citaRepository.findById.mockResolvedValue(
      makeCita({ estado: 'sin_asignar', usuarioId: null }),
    );
    deps.citaRepository.update.mockResolvedValue(
      makeCita({ estado: 'sin_asignar', usuarioId: null }),
    );

    await service.reschedule(CITA_ID, { salaId: SALA_ID });

    // No estado flip — the masajista trigger did not fire.
    expect(deps.citaRepository.updateEstado).not.toHaveBeenCalled();
  });

  it('clearing the masajista (usuarioId: null) on a sin_asignar cita does NOT flip estado', async () => {
    // Edge of the trigger: an explicit null masajista keeps it sin_asignar.
    deps.citaRepository.findById.mockResolvedValue(
      makeCita({ estado: 'sin_asignar', usuarioId: USUARIO_ID }),
    );
    deps.citaRepository.update.mockResolvedValue(
      makeCita({ estado: 'sin_asignar', usuarioId: null }),
    );

    await service.reschedule(CITA_ID, { usuarioId: null });

    expect(deps.citaRepository.updateEstado).not.toHaveBeenCalled();
  });

  it('preserves the estado of a non-sin_asignar cita rescheduled with a masajista (no pendiente flip)', async () => {
    // A confirmada cita keeps its estado through reschedule — only sin_asignar
    // auto-transitions. Other lifecycle moves go through changeEstado.
    deps.citaRepository.findById.mockResolvedValue(
      makeCita({ estado: 'confirmada', usuarioId: USUARIO_ID }),
    );
    deps.citaRepository.update.mockResolvedValue(makeCita({ estado: 'confirmada', usuarioId: 42 }));
    deps.usuarioCentroRepository.findByUsuario.mockResolvedValue([
      makeAsignacion({ usuarioId: 42 }),
    ]);

    const result = await service.reschedule(CITA_ID, { usuarioId: 42 });

    expect(deps.citaRepository.updateEstado).not.toHaveBeenCalled();
    expect(result.estado).toBe('confirmada');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// updateNotas — note-only patch that DELIBERATELY bypasses the schedule rules
// ════════════════════════════════════════════════════════════════════════════
//
// updateNotas is the domain seam behind the therapist quick-edit flow. Unlike
// reschedule, it must NOT re-run rules 1–10: the slot/therapist/sala are
// untouched, so re-validating them would be pointless and could reject an
// otherwise-fine cita whose surrounding data drifted (e.g. the therapist's
// horario changed). These tests pin BOTH halves of that contract:
//   (a) it persists exactly `{ notas }` via citaRepository.update, and
//   (b) it touches NONE of the rule-evaluation repositories.

describe('CitaService.updateNotas', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: CitaService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
    // updateNotas first findById's the cita, then update()s it. The default
    // makeDeps() leaves findById unseeded (→ undefined), so each test that
    // expects a hit seeds it explicitly.
    deps.citaRepository.findById.mockResolvedValue(makeCita());
    deps.citaRepository.update.mockResolvedValue(makeCita({ notas: 'nota guardada' }));
  });

  it('persists ONLY { notas } via citaRepository.update and returns the updated cita', async () => {
    deps.citaRepository.update.mockResolvedValue(
      makeCita({ notas: 'cliente prefiere camilla baja' }),
    );

    const result = await service.updateNotas(CITA_ID, 'cliente prefiere camilla baja');

    expect(deps.citaRepository.update).toHaveBeenCalledWith(CITA_ID, {
      notas: 'cliente prefiere camilla baja',
    });
    expect(result.notas).toBe('cliente prefiere camilla baja');
  });

  it('forwards notas: null verbatim to clear the observation (null ≠ undefined)', async () => {
    // Empty-note → null is the adapter's "clear the observaciones column" signal;
    // the service must pass `null` through untouched (undefined would mean "no change").
    deps.citaRepository.update.mockResolvedValue(makeCita({ notas: null }));

    await service.updateNotas(CITA_ID, null);

    expect(deps.citaRepository.update).toHaveBeenCalledWith(CITA_ID, { notas: null });
    // Pin the exact null (not just any falsy) so a future `?? ''` regression fails here.
    const [, patch] = deps.citaRepository.update.mock.calls[0] as [
      number,
      { notas: string | null },
    ];
    expect(patch.notas).toBeNull();
  });

  it('throws ValidationError when the cita does not exist (and never calls update)', async () => {
    deps.citaRepository.findById.mockResolvedValue(null);

    await expect(service.updateNotas(CITA_ID, 'algo')).rejects.toThrow(ValidationError);
    expect(deps.citaRepository.update).not.toHaveBeenCalled();
  });

  // ── THE load-bearing test: updateNotas must NOT run the schedule rules ───────
  it('does NOT invoke ANY schedule-rule repository (proves it bypasses validation)', async () => {
    await service.updateNotas(CITA_ID, 'nota nueva');

    // None of the rule-evaluation ports may be consulted — this is what makes
    // updateNotas distinct from reschedule. If a future refactor accidentally
    // routes notes through the validation path, every one of these flips to
    // called and this test fails loudly.
    expect(deps.servicioRepository.findById).not.toHaveBeenCalled();
    expect(deps.salaRepository.findById).not.toHaveBeenCalled();
    expect(deps.horarioRepository.findByUsuarioAndCentro).not.toHaveBeenCalled();
    expect(deps.usuarioCentroRepository.findByUsuario).not.toHaveBeenCalled();
    expect(deps.ausenciaRepository.findByUsuario).not.toHaveBeenCalled();
    // It also must not consult the overlap-check helpers on the cita repo.
    expect(deps.citaRepository.findByUsuario).not.toHaveBeenCalled();
    expect(deps.citaRepository.findBySala).not.toHaveBeenCalled();
    // …nor touch the estado at all (updateEstado is changeEstado's job).
    expect(deps.citaRepository.updateEstado).not.toHaveBeenCalled();
  });

  it('does the minimal work: exactly one findById + one update, nothing else on the cita repo', async () => {
    await service.updateNotas(CITA_ID, 'breve');

    expect(deps.citaRepository.findById).toHaveBeenCalledTimes(1);
    expect(deps.citaRepository.findById).toHaveBeenCalledWith(CITA_ID);
    expect(deps.citaRepository.update).toHaveBeenCalledTimes(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// changeEstado
// ════════════════════════════════════════════════════════════════════════════

describe('CitaService.changeEstado', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: CitaService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
    // updateEstado echoes back the persisted estado; configured per-test where
    // the returned value matters (static resolved value avoids a promise-returning
    // mockImplementation, which the no-misused-promises rule rejects).
    deps.citaRepository.updateEstado.mockResolvedValue(makeCita());
  });

  it('throws ValidationError when the cita does not exist', async () => {
    deps.citaRepository.findById.mockResolvedValue(null);
    await expect(service.changeEstado(CITA_ID, 'confirmada')).rejects.toThrow(ValidationError);
  });

  it('persists a legal transition (pendiente → confirmada)', async () => {
    deps.citaRepository.findById.mockResolvedValue(makeCita({ estado: 'pendiente' }));
    deps.citaRepository.updateEstado.mockResolvedValue(makeCita({ estado: 'confirmada' }));
    const result = await service.changeEstado(CITA_ID, 'confirmada');
    expect(deps.citaRepository.updateEstado).toHaveBeenCalledWith({
      id: CITA_ID,
      estado: 'confirmada',
    });
    expect(result.estado).toBe('confirmada');
  });

  it('persists confirmada → en_curso', async () => {
    deps.citaRepository.findById.mockResolvedValue(makeCita({ estado: 'confirmada' }));
    await service.changeEstado(CITA_ID, 'en_curso');
    expect(deps.citaRepository.updateEstado).toHaveBeenCalledWith({
      id: CITA_ID,
      estado: 'en_curso',
    });
  });

  it('is a no-op (returns current, no write) when next === current', async () => {
    const current = makeCita({ estado: 'confirmada' });
    deps.citaRepository.findById.mockResolvedValue(current);
    const result = await service.changeEstado(CITA_ID, 'confirmada');
    expect(result).toBe(current);
    expect(deps.citaRepository.updateEstado).not.toHaveBeenCalled();
  });

  it('throws ILLEGAL_ESTADO_TRANSITION for an illegal move (completada → confirmada)', async () => {
    deps.citaRepository.findById.mockResolvedValue(makeCita({ estado: 'completada' }));
    await expect(service.changeEstado(CITA_ID, 'confirmada')).rejects.toMatchObject({
      code: 'ILLEGAL_ESTADO_TRANSITION',
    });
    expect(deps.citaRepository.updateEstado).not.toHaveBeenCalled();
  });

  it('throws BusinessRuleViolation when moving out of a terminal estado', async () => {
    deps.citaRepository.findById.mockResolvedValue(makeCita({ estado: 'cancelada' }));
    await expect(service.changeEstado(CITA_ID, 'pendiente')).rejects.toThrow(BusinessRuleViolation);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// cancel
// ════════════════════════════════════════════════════════════════════════════

describe('CitaService.cancel', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: CitaService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
    deps.citaRepository.cancel.mockResolvedValue(undefined);
  });

  it('throws ValidationError when the cita does not exist', async () => {
    deps.citaRepository.findById.mockResolvedValue(null);
    await expect(service.cancel(CITA_ID)).rejects.toThrow(ValidationError);
  });

  it('cancels a pending cita and forwards the motivo', async () => {
    deps.citaRepository.findById.mockResolvedValue(makeCita({ estado: 'pendiente' }));
    await service.cancel(CITA_ID, 'cliente lo pidió');
    expect(deps.citaRepository.cancel).toHaveBeenCalledWith(CITA_ID, 'cliente lo pidió');
  });

  it('throws CANNOT_CANCEL_COMPLETED for a completed cita', async () => {
    deps.citaRepository.findById.mockResolvedValue(makeCita({ estado: 'completada' }));
    await expect(service.cancel(CITA_ID)).rejects.toMatchObject({
      code: 'CANNOT_CANCEL_COMPLETED',
    });
    expect(deps.citaRepository.cancel).not.toHaveBeenCalled();
  });

  it('throws ALREADY_CANCELLED for an already-cancelled cita', async () => {
    deps.citaRepository.findById.mockResolvedValue(makeCita({ estado: 'cancelada' }));
    await expect(service.cancel(CITA_ID)).rejects.toMatchObject({
      code: 'ALREADY_CANCELLED',
    });
    expect(deps.citaRepository.cancel).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// calculateFinalPrice
// ════════════════════════════════════════════════════════════════════════════

describe('CitaService.calculateFinalPrice', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: CitaService;

  beforeEach(() => {
    deps = makeDeps();
    service = makeService(deps);
  });

  it('throws ValidationError when the servicio does not exist', async () => {
    deps.servicioRepository.findById.mockResolvedValue(null);
    await expect(service.calculateFinalPrice(SERVICIO_ID, CENTRO_ID)).rejects.toThrow(
      ValidationError,
    );
  });

  it('returns the base price when there is no centro override and no discount', async () => {
    deps.servicioRepository.findById.mockResolvedValue(makeServicio({ precioBase: 50 }));
    deps.servicioRepository.findServicioCentro.mockResolvedValue(null);
    const money = await service.calculateFinalPrice(SERVICIO_ID, CENTRO_ID);
    expect(money.cents).toBe(5000);
  });

  it('uses the centro price override when present', async () => {
    deps.servicioRepository.findById.mockResolvedValue(makeServicio({ precioBase: 50 }));
    deps.servicioRepository.findServicioCentro.mockResolvedValue({
      servicioId: SERVICIO_ID,
      centroId: CENTRO_ID,
      precioPersonalizado: 70,
      activo: true,
    } satisfies IServicioCentro);
    const money = await service.calculateFinalPrice(SERVICIO_ID, CENTRO_ID);
    expect(money.cents).toBe(7000);
  });

  it('applies the service discount to the base price', async () => {
    deps.servicioRepository.findById.mockResolvedValue(
      makeServicio({ precioBase: 50, tieneDescuento: true, porcentajeDescuento: 10 }),
    );
    deps.servicioRepository.findServicioCentro.mockResolvedValue(null);
    const money = await service.calculateFinalPrice(SERVICIO_ID, CENTRO_ID);
    expect(money.cents).toBe(4500); // 10% off 50.00 € → 45.00 € → 4500 cents
  });

  it('applies the discount on top of the centro override', async () => {
    deps.servicioRepository.findById.mockResolvedValue(
      makeServicio({ precioBase: 50, tieneDescuento: true, porcentajeDescuento: 50 }),
    );
    deps.servicioRepository.findServicioCentro.mockResolvedValue({
      servicioId: SERVICIO_ID,
      centroId: CENTRO_ID,
      precioPersonalizado: 80,
      activo: true,
    } satisfies IServicioCentro);
    const money = await service.calculateFinalPrice(SERVICIO_ID, CENTRO_ID);
    expect(money.cents).toBe(4000); // 50% off 80.00 € → 40.00 € → 4000 cents
  });

  it('treats precioBase as euros and converts to cents ×100 (regression: cents-scaling drift)', async () => {
    // IServicio.precioBase is euros (numeric(10,2) from DB), so calculateFinalPrice
    // converts via Money.fromEuros: 49.90 € → 4990 cents, NEVER 499000. A fractional
    // euro value pins the ×100 conversion so a future "treat precioBase as cents"
    // regression (or a dropped ×100 in Money.fromEuros) fails right here.
    deps.servicioRepository.findById.mockResolvedValue(makeServicio({ precioBase: 49.9 }));
    deps.servicioRepository.findServicioCentro.mockResolvedValue(null);
    const money = await service.calculateFinalPrice(SERVICIO_ID, CENTRO_ID);
    expect(money.cents).toBe(4990);
    expect(money.euros).toBe(49.9);
  });
});
