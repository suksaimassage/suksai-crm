/**
 * agenda.cluster.ts — pure, deterministic week-view cita clustering ("folder").
 *
 * Collapses ≥2 overlapping citas in a single day column into one "folder" slot.
 * Framework-agnostic (NO React) and unit-testable in isolation — the Tester owns
 * the suite. Algorithm = Analyst §7:
 *   1. Parse each appt to a half-open interval [startMin, endMin) using the SAME
 *      minute math as `timeToTopOffset`/`durationToHeight` (minutes-from-dayStart;
 *      end derived from `durationMin`, never from parsing `endTime`, so a malformed
 *      end can't invert the interval).
 *   2. Sort by startMin asc → endMin asc → id asc (stable, deterministic).
 *   3. Sweep with a running `groupMaxEnd`; `startMin < groupMaxEnd` joins the
 *      current group (transitive chaining — A∩B, B∩C ⇒ one cluster even if A∌C),
 *      otherwise close the group and start a new one.
 *   4. Emit ordered slots tagged `singleton` (len 1) | `cluster` (len ≥2),
 *      preserving sorted order.
 *
 * The `clusterKey(dateStr, earliestStartMin)` is deterministic from the sort, so
 * it survives re-derivation while the group exists (used as React key + the
 * parent's `openClusterKey`).
 */

import type { IAgendaAppointment } from '@domain/models/agenda.models';

/** A single, non-overlapping appointment in its own track position. */
export interface IAgendaSingletonSlot {
  readonly kind: 'singleton';
  readonly appointment: IAgendaAppointment;
  /** Minutes from the day-start hour (for geometry; matches `timeToTopOffset`). */
  readonly startMin: number;
}

/** A group of ≥2 overlapping appointments rendered as one "folder". */
export interface IAgendaClusterSlot {
  readonly kind: 'cluster';
  /** Stable identity for React keys + the parent's `openClusterKey`. */
  readonly key: string;
  /** Members in chronological order (same comparator as grouping). */
  readonly appointments: readonly IAgendaAppointment[];
  /** Earliest member start, minutes from day-start (folder anchor `top`). */
  readonly startMin: number;
  /** Latest member end, minutes from day-start (folder `height` = union span). */
  readonly endMin: number;
  /** Union span in minutes (`endMin - startMin`) — drives folder height. */
  readonly spanMin: number;
}

/** Ordered render slot for a day column: either one block or one folder. */
export type TAgendaDaySlot = IAgendaSingletonSlot | IAgendaClusterSlot;

/** Internal: an appointment paired with its computed [startMin, endMin) interval. */
interface IAppointmentInterval {
  readonly appointment: IAgendaAppointment;
  readonly startMin: number;
  readonly endMin: number;
}

/**
 * Deterministic cluster key from the cluster's day + earliest start, e.g.
 * `2026-06-08#120`. Survives re-derivation as long as the group exists.
 */
export function clusterKey(dateStr: string, earliestStartMin: number): string {
  return `${dateStr}#${earliestStartMin}`;
}

/**
 * Parses a `"HH:MM"` (or `"HH:MM:SS"`) time to minutes-from-`dayStartHour`.
 * Mirrors `timeToTopOffset`'s parse exactly (same defensive `parseInt`).
 */
function timeToMinutesFromStart(time: string, dayStartHour: number): number {
  const parts = time.split(':');
  const hour = parseInt(parts[0] ?? '0', 10);
  const min = parseInt(parts[1] ?? '0', 10);
  const safeHour = Number.isNaN(hour) ? 0 : hour;
  const safeMin = Number.isNaN(min) ? 0 : min;
  return (safeHour - dayStartHour) * 60 + safeMin;
}

/**
 * Groups one day's appointments into ordered render slots (singleton | cluster).
 *
 * @param appointments one day column's citas (order NOT guaranteed by caller)
 * @param dateStr      the day's `YYYY-MM-DD` key (for `clusterKey`)
 * @param dayStartHour the grid's day-start hour (e.g. `AGENDA_DAY_START_HOUR`)
 * @returns ordered slots; clusters carry ≥2 members, singletons exactly one.
 */
export function clusterDayAppointments(
  appointments: readonly IAgendaAppointment[],
  dateStr: string,
  dayStartHour: number,
): readonly TAgendaDaySlot[] {
  if (appointments.length === 0) return [];

  // 1. Compute [startMin, endMin) per appt. End from durationMin (never endTime),
  //    clamped so a non-positive duration still yields a degenerate but valid
  //    interval (endMin >= startMin) — overlap math stays sane.
  const intervals: IAppointmentInterval[] = appointments.map((appointment) => {
    const startMin = timeToMinutesFromStart(appointment.startTime, dayStartHour);
    const endMin = startMin + Math.max(appointment.durationMin, 0);
    return { appointment, startMin, endMin };
  });

  // 2. Stable sort: startMin asc → endMin asc → id asc.
  intervals.sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    if (a.endMin !== b.endMin) return a.endMin - b.endMin;
    return a.appointment.id - b.appointment.id;
  });

  // 3. Sweep with running groupMaxEnd; transitive chaining.
  const slots: TAgendaDaySlot[] = [];
  let group: IAppointmentInterval[] = [];
  let groupMaxEnd = -Infinity;

  const flush = (): void => {
    if (group.length === 0) return;
    // `group` is non-empty here; index 0 is present (sorted, accumulated above).
    const first = group[0];
    if (group.length === 1) {
      slots.push({
        kind: 'singleton',
        appointment: first.appointment,
        startMin: first.startMin,
      });
    } else {
      const startMin = first.startMin;
      const endMin = group.reduce((max, iv) => Math.max(max, iv.endMin), -Infinity);
      slots.push({
        kind: 'cluster',
        key: clusterKey(dateStr, startMin),
        appointments: group.map((iv) => iv.appointment),
        startMin,
        endMin,
        spanMin: endMin - startMin,
      });
    }
    group = [];
    groupMaxEnd = -Infinity;
  };

  for (const iv of intervals) {
    if (group.length > 0 && iv.startMin < groupMaxEnd) {
      // Overlaps the running band → join (transitive: groupMaxEnd accumulates).
      group.push(iv);
      groupMaxEnd = Math.max(groupMaxEnd, iv.endMin);
    } else {
      // No overlap with the current band → close it, open a fresh one.
      flush();
      group.push(iv);
      groupMaxEnd = iv.endMin;
    }
  }
  flush();

  return slots;
}
