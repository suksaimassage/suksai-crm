/**
 * domain/services/CitaService.ts — Appointment domain service
 *
 * Contains business rules that span multiple entities.
 * Uses only ports (interfaces) — never concrete adapters.
 *
 * Rules enforced here:
 *   1. End time must be after start time
 *   2. Duration must match service definition
 *   3. Sala must belong to Centro (conditional: only when salaId != null)
 *   4. Therapist must be assigned to Centro (conditional: only when usuarioId != null)
 *   5. No overlapping appointments for therapist or sala (conditional)
 *   6. No appointment during therapist's ausencias (conditional)
 *   7. Sala must be active (conditional: only when salaId != null)
 *   8. Service must be active
 *   9. Appointment must fall within work hours (conditional: only when usuarioId != null)
 *
 * When clienteId, usuarioId or salaId are null, the cita is created with
 * estado = 'sin_asignar'. Use assignCliente / assignMasajista / assignSala to
 * fill them in later; the cita automatically transitions to 'pendiente' once
 * all three fields are present.
 */

import type { ICitaRepositoryPort } from '../ports';
import type { IHorarioRepositoryPort } from '../ports';
import type { IAusenciaRepositoryPort } from '../ports';
import type { ISalaRepositoryPort } from '../ports';
import type { IServicioRepositoryPort } from '../ports';
import type { IUsuarioCentroRepositoryPort } from '../ports';
import type { ICita, ICreateCitaDTO, IUpdateCitaDTO } from '../models';
import { BusinessRuleViolation, ValidationError } from '../types';
import type {
  TServicioId,
  TCentroId,
  TCitaId,
  TEstadoCita,
  TUserId,
  TSalaId,
  TClienteId,
} from '../types';
import { DateRange } from '../value-objects/DateRange';
import { TimeRange } from '../value-objects/TimeRange';
import { Money } from '../value-objects/Money';
import { isLegalEstadoTransition } from './citaEstadoTransitions';
import { resolveWorkingWindowsForDate } from './horarioSchedule';
import { AGENDA_OPEN_MIN, AGENDA_CLOSE_MIN, type IWorkingWindow } from './availability.slots';

const minutesToHHMM = (min: number): string =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/**
 * Full studio window [09:00, 21:00] used when a therapist has NO configured
 * schedule for the date. Mirrors AvailabilityService's empty-windows fallback
 * (computeAvailableStartTimes opens the full grid) so the slots the agenda OFFERS
 * and the window submit VALIDATES against can never disagree.
 */
const STUDIO_WINDOW: IWorkingWindow = {
  horaInicio: minutesToHHMM(AGENDA_OPEN_MIN),
  horaFin: minutesToHHMM(AGENDA_CLOSE_MIN),
};

/**
 * The fully-resolved set of fields a schedule validation needs. Both `schedule`
 * (create) and `reschedule` (edit) reduce to validating one of these.
 *
 * All three of clienteId / usuarioId / salaId are nullable — when null, the
 * corresponding validation rules are skipped (the cita will be 'sin_asignar').
 */
interface IScheduleCandidate {
  readonly clienteId: number | null;
  readonly usuarioId: number | null;
  readonly centroId: TCentroId;
  readonly salaId: number | null;
  readonly servicioId: TServicioId;
  readonly fechaHoraInicio: Date;
  readonly fechaHoraFin: Date;
}

interface ICitaServiceDeps {
  readonly citaRepository: ICitaRepositoryPort;
  readonly horarioRepository: IHorarioRepositoryPort;
  readonly ausenciaRepository: IAusenciaRepositoryPort;
  readonly salaRepository: ISalaRepositoryPort;
  readonly servicioRepository: IServicioRepositoryPort;
  readonly usuarioCentroRepository: IUsuarioCentroRepositoryPort;
}

export class CitaService {
  private readonly deps: ICitaServiceDeps;

  constructor(deps: ICitaServiceDeps) {
    this.deps = deps;
  }

  // ── Schedule appointment ────────────────────────────────────────────────
  /**
   * Creates a new cita. If any of clienteId, usuarioId or salaId is absent /
   * null, the cita is created with estado = 'sin_asignar'. Once all three are
   * present (passed explicitly), estado = 'pendiente'.
   */
  async schedule(data: ICreateCitaDTO): Promise<ICita> {
    const clienteId = data.clienteId ?? null;
    const usuarioId = data.usuarioId ?? null;
    const salaId = data.salaId ?? null;

    const candidate: IScheduleCandidate = {
      clienteId,
      usuarioId,
      centroId: data.centroId,
      salaId,
      servicioId: data.servicioId,
      fechaHoraInicio: data.fechaHoraInicio,
      fechaHoraFin: data.fechaHoraFin,
    };

    await this.#validateScheduleRules(candidate);

    const estado: TEstadoCita =
      clienteId === null || usuarioId === null || salaId === null ? 'sin_asignar' : 'pendiente';

    return this.deps.citaRepository.create({ ...data, clienteId, usuarioId, salaId, estado });
  }

  // ── Reschedule / reassign appointment (in-place edit) ─────────────────────
  /**
   * Edits an existing cita's schedule (therapist, sala, servicio, date/time,
   * cliente, notas) re-running schedule rules 1–10 against the merged result.
   * Preserves the cita id. The cita being edited is excluded from overlap checks
   * so it never conflicts with itself.
   *
   * For clienteId / usuarioId / salaId:
   *   - undefined (key absent) → keep current value
   *   - null (key explicitly null) → set to null
   *   - number → reassign to the new ID
   *
   * Estado handling: estado is preserved for every estado EXCEPT 'sin_asignar'.
   * When the current estado is 'sin_asignar' and the merged result assigns a
   * masajista (usuarioId !== null), the cita auto-transitions to 'pendiente' —
   * the owner-chosen trigger is "a masajista is assigned" (cliente/sala may still
   * be null). This mirrors the two-step persist used by the assign* methods.
   * Other estado lifecycle changes continue to go through changeEstado.
   */
  async reschedule(citaId: TCitaId, partial: IUpdateCitaDTO): Promise<ICita> {
    const current = await this.deps.citaRepository.findById(citaId);
    if (!current) {
      throw new ValidationError(`Appointment ${citaId} not found`, 'citaId');
    }

    // Preserve null semantics: undefined = no change, null = clear
    const clienteId: number | null =
      'clienteId' in partial ? (partial.clienteId ?? null) : current.clienteId;
    const usuarioId: number | null =
      'usuarioId' in partial ? (partial.usuarioId ?? null) : current.usuarioId;
    const salaId: number | null = 'salaId' in partial ? (partial.salaId ?? null) : current.salaId;

    const candidate: IScheduleCandidate = {
      clienteId,
      usuarioId,
      centroId: current.centroId,
      salaId,
      servicioId: partial.servicioId ?? current.servicioId,
      fechaHoraInicio: partial.fechaHoraInicio ?? current.fechaHoraInicio,
      fechaHoraFin: partial.fechaHoraFin ?? current.fechaHoraFin,
    };

    await this.#validateScheduleRules(candidate, citaId);

    const updated = await this.deps.citaRepository.update(citaId, {
      clienteId,
      usuarioId,
      salaId,
      servicioId: candidate.servicioId,
      fechaHoraInicio: candidate.fechaHoraInicio,
      fechaHoraFin: candidate.fechaHoraFin,
      notas: partial.notas,
    });

    // A sin_asignar cita becomes 'pendiente' as soon as a masajista is assigned
    // (owner decision), even if cliente/sala are still null. Any other estado is
    // preserved here — its lifecycle changes go through changeEstado.
    if (current.estado === 'sin_asignar' && usuarioId !== null) {
      return this.deps.citaRepository.updateEstado({ id: citaId, estado: 'pendiente' });
    }

    return updated;
  }

  // ── Update observation notes only (no schedule re-validation) ─────────────
  /**
   * Updates ONLY a cita's observation notes, deliberately bypassing the 10
   * schedule rules that `reschedule` re-runs. Used by the therapist quick-edit
   * flow, where the slot/therapist/sala are untouched and re-validating them
   * would be both pointless and capable of rejecting a now-stale-by-data cita.
   *
   * Mirrors the minimal-patch pattern of `assignCliente`: a single-field
   * `citaRepository.update`. `notas` is intentionally `string | null` —
   * passing `null` (or the caller's empty-note → null) clears the underlying
   * `observaciones` column (the adapter maps `notas: null` → `observaciones = null`,
   * while `undefined` would mean "no change"). Estado is left untouched.
   */
  async updateNotas(citaId: TCitaId, notas: string | null): Promise<ICita> {
    const current = await this.deps.citaRepository.findById(citaId);
    if (!current) {
      throw new ValidationError(`Appointment ${citaId} not found`, 'citaId');
    }

    return this.deps.citaRepository.update(citaId, { notas });
  }

  // ── Change estado along the legal transition graph ────────────────────────
  /**
   * Moves a cita to `next` estado, enforcing the lifecycle graph
   * (citaEstadoTransitions). Illegal transitions throw BusinessRuleViolation.
   */
  async changeEstado(citaId: TCitaId, next: TEstadoCita): Promise<ICita> {
    const current = await this.deps.citaRepository.findById(citaId);
    if (!current) {
      throw new ValidationError(`Appointment ${citaId} not found`, 'citaId');
    }

    if (current.estado === next) {
      return current;
    }

    if (!isLegalEstadoTransition(current.estado, next)) {
      throw new BusinessRuleViolation(
        `Illegal estado transition: ${current.estado} → ${next}`,
        'ILLEGAL_ESTADO_TRANSITION',
      );
    }

    return this.deps.citaRepository.updateEstado({ id: citaId, estado: next });
  }

  // ── Assign cliente to a sin_asignar cita ────────────────────────────────
  /**
   * Assigns a cliente to a 'sin_asignar' cita. No availability checks are
   * needed for the client. If, after the assignment, all three of
   * clienteId/usuarioId/salaId are non-null, automatically transitions
   * the cita to 'pendiente'.
   */
  async assignCliente(citaId: TCitaId, clienteId: TClienteId): Promise<ICita> {
    const current = await this.deps.citaRepository.findById(citaId);
    if (!current) {
      throw new ValidationError(`Appointment ${citaId} not found`, 'citaId');
    }
    if (current.estado !== 'sin_asignar') {
      throw new BusinessRuleViolation(
        `Cannot assign cliente: cita ${citaId} is not in sin_asignar estado (current: ${current.estado})`,
        'ILLEGAL_CLIENTE_ASSIGN',
      );
    }

    const updated = await this.deps.citaRepository.update(citaId, { clienteId });

    if (updated.clienteId !== null && updated.usuarioId !== null && updated.salaId !== null) {
      return this.deps.citaRepository.updateEstado({ id: citaId, estado: 'pendiente' });
    }
    return updated;
  }

  // ── Assign masajista to a sin_asignar cita ───────────────────────────────
  /**
   * Assigns a therapist to a 'sin_asignar' cita. Runs deferred availability
   * rules 4, 5a, 6, 9 against the candidate therapist and the cita's time slot.
   * If, after the assignment, all three of clienteId/usuarioId/salaId are
   * non-null, automatically transitions the cita to 'pendiente'.
   */
  async assignMasajista(citaId: TCitaId, usuarioId: TUserId): Promise<ICita> {
    const current = await this.deps.citaRepository.findById(citaId);
    if (!current) {
      throw new ValidationError(`Appointment ${citaId} not found`, 'citaId');
    }
    if (current.estado !== 'sin_asignar') {
      throw new BusinessRuleViolation(
        `Cannot assign masajista: cita ${citaId} is not in sin_asignar estado (current: ${current.estado})`,
        'ILLEGAL_MASAJISTA_ASSIGN',
      );
    }

    await this.#validateMasjistaCandidateRules(
      usuarioId,
      current.centroId,
      current.fechaHoraInicio,
      current.fechaHoraFin,
      citaId,
    );

    const updated = await this.deps.citaRepository.update(citaId, { usuarioId });

    if (updated.clienteId !== null && updated.usuarioId !== null && updated.salaId !== null) {
      return this.deps.citaRepository.updateEstado({ id: citaId, estado: 'pendiente' });
    }
    return updated;
  }

  // ── Assign sala to a sin_asignar cita ────────────────────────────────────
  /**
   * Assigns a sala to a 'sin_asignar' cita. Runs deferred availability
   * rules 3, 5b, 7 against the candidate sala and the cita's time slot.
   * If, after the assignment, all three of clienteId/usuarioId/salaId are
   * non-null, automatically transitions the cita to 'pendiente'.
   */
  async assignSala(citaId: TCitaId, salaId: TSalaId): Promise<ICita> {
    const current = await this.deps.citaRepository.findById(citaId);
    if (!current) {
      throw new ValidationError(`Appointment ${citaId} not found`, 'citaId');
    }
    if (current.estado !== 'sin_asignar') {
      throw new BusinessRuleViolation(
        `Cannot assign sala: cita ${citaId} is not in sin_asignar estado (current: ${current.estado})`,
        'ILLEGAL_SALA_ASSIGN',
      );
    }

    await this.#validateSalaCandidateRules(
      salaId,
      current.centroId,
      current.fechaHoraInicio,
      current.fechaHoraFin,
      citaId,
    );

    const updated = await this.deps.citaRepository.update(citaId, { salaId });

    if (updated.clienteId !== null && updated.usuarioId !== null && updated.salaId !== null) {
      return this.deps.citaRepository.updateEstado({ id: citaId, estado: 'pendiente' });
    }
    return updated;
  }

  // ── Shared schedule validation (rules 1–10) ───────────────────────────────
  /**
   * Validates a schedule candidate against domain rules. Used by both
   * schedule (create) and reschedule (edit). `excludeCitaId`, when provided,
   * removes that cita from therapist/sala overlap checks so an edit does not
   * collide with its own previous slot.
   *
   * Rules that require usuarioId or salaId are skipped when those fields are null.
   */
  async #validateScheduleRules(
    candidate: IScheduleCandidate,
    excludeCitaId?: TCitaId,
  ): Promise<void> {
    // Rule 1: end must be after start (always enforced)
    if (candidate.fechaHoraFin <= candidate.fechaHoraInicio) {
      throw new ValidationError('Appointment end time must be after start time', 'fechaHoraFin');
    }

    // Rule 2 + 8: service must exist and be active (always enforced)
    const servicio = await this.deps.servicioRepository.findById(candidate.servicioId);
    if (!servicio) {
      throw new ValidationError(`Service ${candidate.servicioId} not found`, 'servicioId');
    }

    const requestedMinutes =
      (candidate.fechaHoraFin.getTime() - candidate.fechaHoraInicio.getTime()) / 60_000;

    if (requestedMinutes !== servicio.duracionMinutos) {
      throw new BusinessRuleViolation(
        `Appointment duration (${requestedMinutes}min) does not match service duration (${servicio.duracionMinutos}min)`,
        'DURATION_MISMATCH',
      );
    }

    if (servicio.estado !== 'activo') {
      throw new BusinessRuleViolation(
        `Service ${candidate.servicioId} is not active (estado: ${servicio.estado})`,
        'SERVICIO_INACTIVO',
      );
    }

    // Rules 3 + 7: sala validation (conditional — skip when salaId is null)
    if (candidate.salaId !== null) {
      await this.#validateSalaCandidateRules(
        candidate.salaId,
        candidate.centroId,
        candidate.fechaHoraInicio,
        candidate.fechaHoraFin,
        excludeCitaId,
      );
    }

    // Rules 4, 5a, 6, 9: therapist validation (conditional — skip when usuarioId is null)
    if (candidate.usuarioId !== null) {
      await this.#validateMasjistaCandidateRules(
        candidate.usuarioId,
        candidate.centroId,
        candidate.fechaHoraInicio,
        candidate.fechaHoraFin,
        excludeCitaId,
      );
    }
  }

  // ── Sala-specific deferred validation (rules 3, 5b, 7) ────────────────────
  async #validateSalaCandidateRules(
    salaId: TSalaId,
    centroId: TCentroId,
    fechaHoraInicio: Date,
    fechaHoraFin: Date,
    excludeCitaId?: TCitaId,
  ): Promise<void> {
    // Rule 3: sala must belong to centro
    const sala = await this.deps.salaRepository.findById(salaId);
    if (sala?.centroId !== centroId) {
      throw new BusinessRuleViolation(
        `Sala ${salaId} does not belong to Centro ${centroId}`,
        'SALA_CENTRO_MISMATCH',
      );
    }

    // Rule 7: sala must be active
    if (!sala.activa) {
      throw new BusinessRuleViolation(`Sala ${salaId} is not active`, 'SALA_INACTIVA');
    }

    // Rule 5b: no overlapping citas for sala (excluding the cita being edited)
    const newRange = DateRange.create(fechaHoraInicio, fechaHoraFin);
    const citasDiaSala = await this.deps.citaRepository.findBySala(salaId, fechaHoraInicio);

    const hasConflictSala = citasDiaSala
      .filter((c) => c.estado !== 'cancelada' && c.id !== excludeCitaId)
      .some((c) => DateRange.create(c.fechaHoraInicio, c.fechaHoraFin).overlaps(newRange));

    if (hasConflictSala) {
      throw new BusinessRuleViolation('Sala is occupied at this time', 'SALA_CONFLICT');
    }
  }

  // ── Therapist-specific deferred validation (rules 4, 5a, 6, 9) ────────────
  async #validateMasjistaCandidateRules(
    usuarioId: TUserId,
    centroId: TCentroId,
    fechaHoraInicio: Date,
    fechaHoraFin: Date,
    excludeCitaId?: TCitaId,
  ): Promise<void> {
    // Rule 4: therapist must be assigned to centro
    const asignaciones = await this.deps.usuarioCentroRepository.findByUsuario(usuarioId);
    const asignadoACentro = asignaciones.some((a) => a.centroId === centroId);
    if (!asignadoACentro) {
      throw new BusinessRuleViolation(
        `User ${usuarioId} is not assigned to Centro ${centroId}`,
        'USUARIO_NOT_ASSIGNED_TO_CENTRO',
      );
    }

    // Rule 9: appointment must fall within AT LEAST ONE of the therapist's
    // working windows for that date. Windows are resolved via the shared OVERRIDE
    // model (active especifico rows for the LOCAL calendar day replace recurrente;
    // split shifts = multiple especifico windows; otherwise the weekday's
    // recurrente rows). This is the SAME resolution AvailabilityService uses to
    // offer slots, so a booking can never be rejected here that the agenda
    // offered — nor accepted here that the agenda would not (see horarioSchedule).
    const horarios = await this.deps.horarioRepository.findByUsuarioAndCentro(usuarioId, centroId);
    const resolvedWindows = resolveWorkingWindowsForDate(horarios, fechaHoraInicio);

    // No configured schedule that day → fall back to the full studio window,
    // EXACTLY as AvailabilityService does when it offers slots.
    const workWindows: readonly IWorkingWindow[] =
      resolvedWindows.length > 0 ? resolvedWindows : [STUDIO_WINDOW];

    const apptStart = `${String(fechaHoraInicio.getHours()).padStart(2, '0')}:${String(fechaHoraInicio.getMinutes()).padStart(2, '0')}`;
    const apptEnd = `${String(fechaHoraFin.getHours()).padStart(2, '0')}:${String(fechaHoraFin.getMinutes()).padStart(2, '0')}`;

    const fitsAnyWindow = workWindows.some((w) => {
      const workWindow = TimeRange.create(w.horaInicio, w.horaFin);
      return workWindow.containsTime(apptStart) && workWindow.containsTime(apptEnd);
    });

    if (!fitsAnyWindow) {
      const windowsLabel = workWindows.map((w) => `${w.horaInicio}–${w.horaFin}`).join(', ');
      throw new BusinessRuleViolation(
        `Appointment time ${apptStart}–${apptEnd} falls outside therapist work hours (${windowsLabel})`,
        'OUTSIDE_WORK_HOURS',
      );
    }

    const newRange = DateRange.create(fechaHoraInicio, fechaHoraFin);

    // Rule 5a: no overlapping citas for therapist (excluding the cita being edited)
    const citasDiaTerapeuta = await this.deps.citaRepository.findByUsuario(usuarioId, {
      from: fechaHoraInicio,
      to: fechaHoraFin,
    });

    const hasConflictTerapeuta = citasDiaTerapeuta
      .filter((c) => c.estado !== 'cancelada' && c.id !== excludeCitaId)
      .some((c) => DateRange.create(c.fechaHoraInicio, c.fechaHoraFin).overlaps(newRange));

    if (hasConflictTerapeuta) {
      throw new BusinessRuleViolation(
        'Therapist has a conflicting appointment at this time',
        'THERAPIST_CONFLICT',
      );
    }

    // Rule 6: no ausencias during appointment
    const ausencias = await this.deps.ausenciaRepository.findByUsuario(usuarioId, {
      from: fechaHoraInicio,
      to: fechaHoraFin,
    });

    const hasAusencia = ausencias.some((a) => {
      if (!a.aprobada) return false;
      const range = DateRange.create(a.fechaInicio, a.fechaFin);
      return range.includes(fechaHoraInicio);
    });

    if (hasAusencia) {
      throw new BusinessRuleViolation(
        'Therapist is on approved leave during this time',
        'THERAPIST_ON_LEAVE',
      );
    }
  }

  // ── Cancel appointment ──────────────────────────────────────────────────
  /**
   * Cancels a cita. Supports 'sin_asignar' estado (cancelada is in the
   * transition graph for sin_asignar). Only blocks on 'completada' and
   * 'cancelada' estados.
   */
  async cancel(citaId: TCitaId, motivo?: string): Promise<void> {
    const cita = await this.deps.citaRepository.findById(citaId);

    if (!cita) {
      throw new ValidationError(`Appointment ${citaId} not found`, 'citaId');
    }

    if (cita.estado === 'completada') {
      throw new BusinessRuleViolation(
        'Cannot cancel a completed appointment',
        'CANNOT_CANCEL_COMPLETED',
      );
    }

    if (cita.estado === 'cancelada') {
      throw new BusinessRuleViolation('Appointment is already cancelled', 'ALREADY_CANCELLED');
    }

    await this.deps.citaRepository.cancel(citaId, motivo);
  }

  // ── Calculate final price ───────────────────────────────────────────────
  async calculateFinalPrice(servicioId: TServicioId, centroId: TCentroId): Promise<Money> {
    const servicio = await this.deps.servicioRepository.findById(servicioId);
    if (!servicio) {
      throw new ValidationError(`Service ${servicioId} not found`, 'servicioId');
    }

    // Check for center-specific price override
    const servicioCentro = await this.deps.servicioRepository.findServicioCentro(
      servicioId,
      centroId,
    );

    const basePrice =
      servicioCentro?.precioPersonalizado != null
        ? Money.fromEuros(servicioCentro.precioPersonalizado)
        : Money.fromEuros(servicio.precioBase);

    if (servicio.tieneDescuento && servicio.porcentajeDescuento > 0) {
      return basePrice.applyDiscount(servicio.porcentajeDescuento);
    }

    return basePrice;
  }
}
