import type { IHorarioRepositoryPort } from '../ports';
import type { IAusenciaRepositoryPort } from '../ports';
import type { ICitaRepositoryPort } from '../ports';
import type { ISalaRepositoryPort } from '../ports';
import type { ICita } from '../models';
import type { TUserId, TCentroId, TSalaId, TCitaId } from '../types';
import { DateRange } from '../value-objects/DateRange';
import {
  computeAvailableStartTimes,
  type IBookedRange,
  type IWorkingWindow,
} from './availability.slots';
import { resolveWorkingWindowsForDate } from './horarioSchedule';

/**
 * Studio window offered when no therapist is assigned: 10:00–20:00
 * (600–1200 min). Narrower than the default studio grid (AGENDA_OPEN_MIN
 * 09:00 / AGENDA_CLOSE_MIN 21:00) — unassigned slots use a fixed generic
 * reception window instead of a therapist's real working hours.
 */
const UNASSIGNED_OPEN_MIN = 600; // 10:00
const UNASSIGNED_CLOSE_MIN = 1200; // 20:00

export interface IAvailableSlot {
  readonly start: Date;
  readonly end: Date;
  /** null when no sala was selected — the slot is not room-specific. */
  readonly salaId: TSalaId | null;
}

/**
 * Result of {@link AvailabilityService.getAvailableSlots}. `hadSchedule`
 * distinguishes the two empty-list causes the UI must render differently:
 *   - hadSchedule = true,  slots = []  → the therapist works that day but every
 *     candidate is booked / absent / no block fits (genuine "no free slots").
 *   - hadSchedule = false, slots = []  → no active window applies that day; the
 *     full open–close grid was used as a fallback (so a non-empty list here is
 *     the "no schedule, full day offered" state). When false and slots is
 *     non-empty, the field is usable via the fallback grid.
 */
export interface IAvailabilityResult {
  readonly slots: readonly IAvailableSlot[];
  readonly hadSchedule: boolean;
}

interface IAvailabilityServiceDeps {
  readonly horarioRepository: IHorarioRepositoryPort;
  readonly ausenciaRepository: IAusenciaRepositoryPort;
  readonly citaRepository: ICitaRepositoryPort;
  readonly salaRepository: ISalaRepositoryPort;
}

export class AvailabilityService {
  private readonly deps: IAvailabilityServiceDeps;

  constructor(deps: IAvailabilityServiceDeps) {
    this.deps = deps;
  }

  /**
   * Returns the available start slots for a therapist on a date, in the SELECTED
   * sala. HYBRID + OVERRIDE semantics: the studio grid [09:00,21:00]/30-min is
   * intersected with the UNION of the therapist's active working windows for the
   * date (resolved via the override model — especifico replaces recurrente; full
   * grid when none applies), then candidates overlapping approved absences, the
   * sala's bookings, or the therapist's bookings are excluded. `excludeCitaId`
   * drops the cita being rescheduled from BOTH booking sets so its own current
   * slot stays selectable.
   *
   * The result reports `hadSchedule` so the UI can distinguish a genuine
   * "no free slots" (worked but booked/absent) from a "no schedule → full grid
   * fallback" state.
   *
   * I/O lives here; the deterministic math is delegated to the pure
   * `computeAvailableStartTimes`. Each returned slot carries the passed salaId
   * and `end = start + duración`.
   */
  /**
   * Returns available start slots for a given date/centre/service combination.
   *
   * Both `usuarioId` and `salaId` are optional:
   *  - `usuarioId = null` → skip therapist schedule, absences and therapist
   *    overlap checks; use the fixed 10:00–20:00 reception window as the
   *    fallback.
   *  - `salaId = null` → skip sala overlap checks; any room-free slot is valid.
   *
   * This mirrors the CitaService validation rules (14 / conditional) so the
   * slots the agenda OFFERS and the rules the domain VALIDATES against agree.
   */
  async getAvailableSlots(
    usuarioId: TUserId | null,
    centroId: TCentroId,
    fecha: Date,
    duracionMinutos: number,
    salaId: TSalaId | null,
    excludeCitaId?: TCitaId,
  ): Promise<IAvailabilityResult> {
    // ── Therapist-dependent data (skip when no therapist selected) ────────────
    let windows: readonly IWorkingWindow[] = [];
    let approvedAusencias: { start: Date; end: Date }[] = [];
    let therapistBookedRanges: IBookedRange[] = [];

    if (usuarioId !== null) {
      const horarios = await this.deps.horarioRepository.findByUsuarioAndCentro(
        usuarioId,
        centroId,
      );
      windows = resolveWorkingWindowsForDate(horarios, fecha);

      const dayRange = DateRange.singleDay(fecha);
      const ausencias = await this.deps.ausenciaRepository.findByUsuario(usuarioId, {
        from: dayRange.start,
        to: dayRange.end,
      });
      approvedAusencias = ausencias
        .filter((a) => a.aprobada)
        .map((a) => ({ start: a.fechaInicio, end: a.fechaFin }));

      const therapistCitas = await this.deps.citaRepository.findByUsuario(usuarioId, {
        from: dayRange.start,
        to: dayRange.end,
      });
      therapistBookedRanges = this.#toBookedRanges(therapistCitas, excludeCitaId);
    }

    // ── Sala-dependent data (skip when no sala selected) ──────────────────────
    let salaBookedRanges: IBookedRange[] = [];
    if (salaId !== null) {
      const salaCitas = await this.deps.citaRepository.findBySala(salaId, fecha);
      salaBookedRanges = this.#toBookedRanges(salaCitas, excludeCitaId);
    }

    // When no therapist: no configured windows → computeAvailableStartTimes
    // falls back to the full studio grid. We narrow it to the fixed 10:00–20:00
    // reception window instead of the default 09:00–21:00 studio grid.
    const starts = computeAvailableStartTimes({
      fecha,
      duracionMinutos,
      windows,
      ausencias: approvedAusencias,
      salaBookedRanges,
      therapistBookedRanges,
      ...(usuarioId === null
        ? { openMin: UNASSIGNED_OPEN_MIN, closeMin: UNASSIGNED_CLOSE_MIN }
        : {}),
    });

    const durationMs = duracionMinutos * 60_000;
    const slots = starts.map((start) => ({
      start,
      end: new Date(start.getTime() + durationMs),
      salaId,
    }));

    // hadSchedule is false when no therapist (always in fallback mode) or when
    // the therapist has no active working window for the date.
    return { slots, hadSchedule: usuarioId !== null && windows.length > 0 };
  }

  async isUsuarioAvailable(usuarioId: TUserId, centroId: TCentroId, fecha: Date): Promise<boolean> {
    const horarios = await this.deps.horarioRepository.findByUsuarioAndCentro(usuarioId, centroId);
    if (resolveWorkingWindowsForDate(horarios, fecha).length === 0) return false;

    const dayRange = DateRange.singleDay(fecha);
    const ausencias = await this.deps.ausenciaRepository.findByUsuario(usuarioId, {
      from: dayRange.start,
      to: dayRange.end,
    });

    return !ausencias.some((a) => a.aprobada && dayRange.includes(a.fechaInicio));
  }

  /** Maps non-cancelled citas (optionally excluding one) to booked ranges. */
  #toBookedRanges(citas: readonly ICita[], excludeCitaId?: TCitaId): IBookedRange[] {
    return citas
      .filter((c) => c.estado !== 'cancelada' && c.id !== excludeCitaId)
      .map((c) => ({ start: c.fechaHoraInicio, end: c.fechaHoraFin }));
  }
}
