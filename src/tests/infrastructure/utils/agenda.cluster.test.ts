/**
 * agenda.cluster.test.ts
 *
 * Pure, deterministic unit tests for the week-view cita clustering ("folder")
 * helper. NO React, NO mocks — the helper is a framework-agnostic pure function,
 * so it is exercised directly (Tester hard rule: do NOT mock pure util logic).
 *
 * Highest-value coverage target (.claude/rules/testing.md → utils ~ behavior of
 * a pure helper): aim ~100% statements/branches/functions/lines. Covers the
 * Analyst §7 algorithm + Edge Cases E1/E2/E3 and the malformed-duration guard.
 *
 * dayStartHour is PINNED to 8 here (a local literal, deliberately NOT the live
 * AGENDA_DAY_START_HOUR): the clusterer's minute math is a pure function of the
 * dayStartHour ARGUMENT, independent of the grid's display range — so this unit
 * test stays stable when the grid range changes. With start 8, a 10:00 cita →
 * startMin = (10-8)*60 = 120, and the cluster key at 10:00 is `2026-06-08#120`.
 */

import { describe, it, expect } from 'vitest';
import {
  clusterDayAppointments,
  clusterKey,
  type TAgendaDaySlot,
  type IAgendaClusterSlot,
  type IAgendaSingletonSlot,
} from '@infra/utils/agenda.cluster';
import type { IAgendaAppointment } from '@domain/models/agenda.models';

// ── Fixture factory ──────────────────────────────────────────────────────────
// Minimal IAgendaAppointment — the clusterer only reads id, startTime,
// durationMin (and therapistId/clientName/sala are along for the ride for E3).

const DATE = '2026-06-08';
const DAY_START = 8; // pinned literal — offset math is independent of the grid range

const makeAppt = (overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment => ({
  id: 1,
  therapistId: 10,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  clientName: 'Cliente',
  visitInfo: null,
  serviceName: 'Masaje',
  sala: 'Sala 1',
  salaId: 1,
  centroId: 1,
  centroName: 'Centro Test',
  estado: 'confirmada',
  timelineState: 'done',
  evtVariant: 'gold',
  notes: null,
  tags: [],
  precioFinal: 60,
  ...overrides,
});

/** Narrowing helpers so assertions read against the discriminated union safely. */
const asCluster = (slot: TAgendaDaySlot): IAgendaClusterSlot => {
  expect(slot.kind).toBe('cluster');
  return slot as IAgendaClusterSlot;
};
const asSingleton = (slot: TAgendaDaySlot): IAgendaSingletonSlot => {
  expect(slot.kind).toBe('singleton');
  return slot as IAgendaSingletonSlot;
};

// ── clusterKey ────────────────────────────────────────────────────────────────

describe('clusterKey', () => {
  it('formats as `${dateStr}#${earliestStartMin}`', () => {
    expect(clusterKey('2026-06-08', 120)).toBe('2026-06-08#120');
  });

  it('encodes the earliest start minute, not the wall-clock time', () => {
    // 09:30 with dayStart 8 → (9-8)*60 + 30 = 90
    expect(clusterKey('2026-06-08', 90)).toBe('2026-06-08#90');
  });

  it('supports a zero start minute (cita exactly at day-start)', () => {
    expect(clusterKey('2026-06-08', 0)).toBe('2026-06-08#0');
  });
});

// ── Empty / trivial inputs ──────────────────────────────────────────────────

describe('clusterDayAppointments — empty & singletons', () => {
  it('returns an empty array for no appointments', () => {
    expect(clusterDayAppointments([], DATE, DAY_START)).toEqual([]);
  });

  it('returns one singleton for a single appointment', () => {
    const appt = makeAppt({ id: 1, startTime: '10:00', durationMin: 60 });
    const slots = clusterDayAppointments([appt], DATE, DAY_START);

    expect(slots).toHaveLength(1);
    const s = asSingleton(slots[0]);
    expect(s.appointment.id).toBe(1);
    expect(s.startMin).toBe(120); // (10-8)*60
  });

  it('two non-overlapping appointments → two singletons (no cluster)', () => {
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 60 }); // [120,180)
    const b = makeAppt({ id: 2, startTime: '11:00', durationMin: 60 }); // [180,240)
    const slots = clusterDayAppointments([a, b], DATE, DAY_START);

    expect(slots.map((s) => s.kind)).toEqual(['singleton', 'singleton']);
  });

  it('back-to-back (end == next start) does NOT merge (half-open interval)', () => {
    // a ends at 180, b starts at 180 → startMin(180) is NOT < groupMaxEnd(180).
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 60 }); // [120,180)
    const b = makeAppt({ id: 2, startTime: '11:00', durationMin: 30 }); // [180,210)
    const slots = clusterDayAppointments([a, b], DATE, DAY_START);

    expect(slots.map((s) => s.kind)).toEqual(['singleton', 'singleton']);
  });
});

// ── Basic overlap → cluster (threshold exactly 2) ───────────────────────────

describe('clusterDayAppointments — overlap collapses at threshold 2', () => {
  it('two overlapping appointments → exactly one cluster of 2', () => {
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 60 }); // [120,180)
    const b = makeAppt({ id: 2, startTime: '10:30', durationMin: 60 }); // [150,210)
    const slots = clusterDayAppointments([a, b], DATE, DAY_START);

    expect(slots).toHaveLength(1);
    const c = asCluster(slots[0]);
    expect(c.appointments).toHaveLength(2);
    expect(c.appointments.map((x) => x.id)).toEqual([1, 2]);
  });

  it('cluster key is `${dateStr}#${earliestStartMin}`', () => {
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 60 });
    const b = makeAppt({ id: 2, startTime: '10:30', durationMin: 60 });
    const c = asCluster(clusterDayAppointments([a, b], DATE, DAY_START)[0]);

    expect(c.key).toBe('2026-06-08#120');
  });

  it('exposes startMin/endMin/spanMin = union of the group', () => {
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 60 }); // [120,180)
    const b = makeAppt({ id: 2, startTime: '10:30', durationMin: 60 }); // [150,210)
    const c = asCluster(clusterDayAppointments([a, b], DATE, DAY_START)[0]);

    expect(c.startMin).toBe(120);
    expect(c.endMin).toBe(210);
    expect(c.spanMin).toBe(90); // 210 - 120
  });
});

// ── E1 — identical start AND duration ───────────────────────────────────────

describe('clusterDayAppointments — E1 identical start & duration', () => {
  it('groups two citas with the same start and duration into one cluster', () => {
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 60 });
    const b = makeAppt({ id: 2, startTime: '10:00', durationMin: 60 });
    const c = asCluster(clusterDayAppointments([a, b], DATE, DAY_START)[0]);

    expect(c.appointments).toHaveLength(2);
    expect(c.startMin).toBe(120);
    expect(c.endMin).toBe(180);
    expect(c.spanMin).toBe(60);
  });

  it('groups three identical-interval citas into one cluster of 3', () => {
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 60 });
    const b = makeAppt({ id: 2, startTime: '10:00', durationMin: 60 });
    const d = makeAppt({ id: 3, startTime: '10:00', durationMin: 60 });
    const c = asCluster(clusterDayAppointments([a, b, d], DATE, DAY_START)[0]);

    expect(c.appointments.map((x) => x.id)).toEqual([1, 2, 3]);
  });
});

// ── E2 — mixed/overlapping durations → union span ───────────────────────────

describe('clusterDayAppointments — E2 mixed durations, union span', () => {
  it('union endMin is driven by the latest-ending member, not the last-starting', () => {
    // a is long and ends last; b starts later but ends earlier.
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 120 }); // [120,240)
    const b = makeAppt({ id: 2, startTime: '10:30', durationMin: 30 }); //  [150,180)
    const c = asCluster(clusterDayAppointments([a, b], DATE, DAY_START)[0]);

    expect(c.startMin).toBe(120);
    expect(c.endMin).toBe(240); // from `a`, the latest end
    expect(c.spanMin).toBe(120);
  });
});

// ── Transitive chaining (A∩B, B∩C ⇒ one cluster even if A∌C) ────────────────

describe('clusterDayAppointments — transitive chaining', () => {
  it('chains A∩B and B∩C into one cluster even when A does not overlap C', () => {
    // A [120,180), B [170,230), C [200,260): A∩B (170<180), B∩C (200<230), A∌C.
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 60 });
    const b = makeAppt({ id: 2, startTime: '10:50', durationMin: 60 });
    const c = makeAppt({ id: 3, startTime: '11:20', durationMin: 60 });
    const slots = clusterDayAppointments([a, b, c], DATE, DAY_START);

    expect(slots).toHaveLength(1);
    const cluster = asCluster(slots[0]);
    expect(cluster.appointments.map((x) => x.id)).toEqual([1, 2, 3]);
    expect(cluster.startMin).toBe(120);
    expect(cluster.endMin).toBe(260); // C's end
  });

  it('a gap breaks the chain into two separate slots', () => {
    // A∩B form a cluster; C is isolated after a gap.
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 60 }); // [120,180)
    const b = makeAppt({ id: 2, startTime: '10:30', durationMin: 60 }); // [150,210)
    const c = makeAppt({ id: 3, startTime: '12:00', durationMin: 60 }); // [240,300)
    const slots = clusterDayAppointments([a, b, c], DATE, DAY_START);

    expect(slots.map((s) => s.kind)).toEqual(['cluster', 'singleton']);
    expect(asCluster(slots[0]).appointments.map((x) => x.id)).toEqual([1, 2]);
    expect(asSingleton(slots[1]).appointment.id).toBe(3);
  });

  it('emits two clusters when two overlapping pairs are separated by a gap', () => {
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 60 }); // [120,180)
    const b = makeAppt({ id: 2, startTime: '10:30', durationMin: 60 }); // [150,210)
    const c = makeAppt({ id: 3, startTime: '13:00', durationMin: 60 }); // [300,360)
    const d = makeAppt({ id: 4, startTime: '13:30', durationMin: 60 }); // [330,390)
    const slots = clusterDayAppointments([a, b, c, d], DATE, DAY_START);

    expect(slots.map((s) => s.kind)).toEqual(['cluster', 'cluster']);
    expect(asCluster(slots[0]).key).toBe('2026-06-08#120');
    expect(asCluster(slots[1]).key).toBe('2026-06-08#300');
  });
});

// ── Defensive sorting + tie-break (startMin → endMin → id) ───────────────────

describe('clusterDayAppointments — defensive ordering', () => {
  it('sorts unsorted input by start so output order is deterministic', () => {
    // Provided out of order; all disjoint → three singletons in start order.
    const late = makeAppt({ id: 3, startTime: '12:00', durationMin: 30 });
    const early = makeAppt({ id: 1, startTime: '10:00', durationMin: 30 });
    const mid = makeAppt({ id: 2, startTime: '11:00', durationMin: 30 });
    const slots = clusterDayAppointments([late, early, mid], DATE, DAY_START);

    expect(slots.map((s) => asSingleton(s).appointment.id)).toEqual([1, 2, 3]);
  });

  it('tie-break: same start → shorter (earlier endMin) first', () => {
    // Both start at 10:00 and overlap → one cluster, members ordered by endMin.
    const long = makeAppt({ id: 1, startTime: '10:00', durationMin: 90 }); // end 210
    const short = makeAppt({ id: 2, startTime: '10:00', durationMin: 30 }); // end 150
    const cluster = asCluster(clusterDayAppointments([long, short], DATE, DAY_START)[0]);

    // shorter endMin first → id 2 before id 1
    expect(cluster.appointments.map((x) => x.id)).toEqual([2, 1]);
  });

  it('tie-break: same start AND same endMin → lower id first', () => {
    const b = makeAppt({ id: 5, startTime: '10:00', durationMin: 60 });
    const a = makeAppt({ id: 2, startTime: '10:00', durationMin: 60 });
    const cluster = asCluster(clusterDayAppointments([b, a], DATE, DAY_START)[0]);

    expect(cluster.appointments.map((x) => x.id)).toEqual([2, 5]);
  });

  it('clusterKey is stable regardless of input order (survives re-derivation)', () => {
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 60 });
    const b = makeAppt({ id: 2, startTime: '10:30', durationMin: 60 });

    const k1 = asCluster(clusterDayAppointments([a, b], DATE, DAY_START)[0]).key;
    const k2 = asCluster(clusterDayAppointments([b, a], DATE, DAY_START)[0]).key;

    expect(k1).toBe(k2);
    expect(k1).toBe('2026-06-08#120');
  });
});

// ── E3 — sin_asignar members (null therapist/client/sala) still grouped ─────

describe('clusterDayAppointments — E3 sin_asignar members', () => {
  it('groups an unassigned cita (null therapist/client/sala) with an assigned one', () => {
    const assigned = makeAppt({ id: 1, startTime: '10:00', durationMin: 60, therapistId: 10 });
    const unassigned = makeAppt({
      id: 2,
      startTime: '10:30',
      durationMin: 60,
      therapistId: null,
      clientName: null,
      sala: null,
      salaId: null,
      estado: 'sin_asignar',
    });
    const cluster = asCluster(clusterDayAppointments([assigned, unassigned], DATE, DAY_START)[0]);

    expect(cluster.appointments).toHaveLength(2);
    expect(cluster.appointments.map((x) => x.id)).toEqual([1, 2]);
    // The null-therapist member is retained verbatim — grouping never drops it.
    expect(cluster.appointments[1].therapistId).toBeNull();
  });

  it('groups two unassigned citas together', () => {
    const u1 = makeAppt({ id: 1, startTime: '10:00', durationMin: 60, therapistId: null });
    const u2 = makeAppt({ id: 2, startTime: '10:15', durationMin: 60, therapistId: null });
    const cluster = asCluster(clusterDayAppointments([u1, u2], DATE, DAY_START)[0]);

    expect(cluster.appointments).toHaveLength(2);
  });
});

// ── Malformed / non-positive duration must not invert the interval ──────────

describe('clusterDayAppointments — malformed duration guard', () => {
  it('zero duration yields a degenerate [start,start) interval that does not overlap', () => {
    // A [120,120) is degenerate; B [120,180). startMin(120) < groupMaxEnd?
    // groupMaxEnd starts at A.endMin=120, so 120 < 120 is false → two singletons.
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 0 });
    const b = makeAppt({ id: 2, startTime: '10:00', durationMin: 60 });
    const slots = clusterDayAppointments([a, b], DATE, DAY_START);

    // Both start at 120; A (endMin 120) sorts before B (endMin 180). A is degenerate
    // so it does not extend the band; B opens its own slot → two singletons.
    expect(slots.map((s) => s.kind)).toEqual(['singleton', 'singleton']);
  });

  it('negative duration is clamped to 0 (endMin === startMin, never < startMin)', () => {
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: -120 });
    const s = asSingleton(clusterDayAppointments([a], DATE, DAY_START)[0]);

    // startMin is correct; the interval is not inverted (no negative span anywhere).
    expect(s.startMin).toBe(120);
  });

  it('a clamped-zero member still joins a cluster when it starts inside the band', () => {
    // Long A [120,240); zero-duration B at 10:30 → [150,150). 150 < 240 → joins.
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 120 });
    const b = makeAppt({ id: 2, startTime: '10:30', durationMin: 0 });
    const cluster = asCluster(clusterDayAppointments([a, b], DATE, DAY_START)[0]);

    expect(cluster.appointments.map((x) => x.id)).toEqual([1, 2]);
    expect(cluster.endMin).toBe(240); // unchanged by the zero-duration member
  });

  it('malformed startTime ("garbage") parses to 0 minutes-from-start, no throw', () => {
    const a = makeAppt({ id: 1, startTime: 'garbage', durationMin: 60 });
    const s = asSingleton(clusterDayAppointments([a], DATE, DAY_START)[0]);

    // parseInt('garbage') is NaN → coerced to 0; (0-8)*60 = -480.
    expect(s.startMin).toBe(-480);
  });

  it('parses "HH:MM:SS" the same as "HH:MM" (ignores the seconds field)', () => {
    const a = makeAppt({ id: 1, startTime: '10:00:00', durationMin: 60 });
    const s = asSingleton(clusterDayAppointments([a], DATE, DAY_START)[0]);

    expect(s.startMin).toBe(120);
  });
});

// ── dayStartHour parameterization ───────────────────────────────────────────

describe('clusterDayAppointments — dayStartHour offset', () => {
  it('startMin is relative to the supplied dayStartHour', () => {
    // With dayStart 9, a 10:00 cita → (10-9)*60 = 60.
    const a = makeAppt({ id: 1, startTime: '10:00', durationMin: 60 });
    const s = asSingleton(clusterDayAppointments([a], DATE, 9)[0]);

    expect(s.startMin).toBe(60);
    // and the cluster key would encode that offset start, too.
    const b = makeAppt({ id: 2, startTime: '10:30', durationMin: 60 });
    const c = asCluster(clusterDayAppointments([a, b], DATE, 9)[0]);
    expect(c.key).toBe('2026-06-08#60');
  });
});
