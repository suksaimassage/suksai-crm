import { describe, expect, it } from 'vitest';

import type { IAgendaAppointment, IAgendaTherapist } from '@domain/models/agenda.models';
import type { TCitaId, TEstadoCita, TUserId } from '@domain/types';
import {
  mergeDayCitas,
  partitionCitasByKanbanColumn,
  resolveTherapistName,
} from '@infra/pages/AgendaPage/components/admin/calendarOverlay.utils';

// ── Minimal builders — exercise every estado incl. nullable fields ────────────
const buildAppointment = (
  overrides: Partial<IAgendaAppointment> & { readonly id: TCitaId; readonly estado: TEstadoCita },
): IAgendaAppointment => ({
  therapistId: 1,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  clientName: 'Carmen Valverde',
  visitInfo: null,
  serviceName: 'Masaje Tradicional Tailandés',
  sala: 'Sala Loto',
  salaId: 1,
  centroId: 1,
  centroName: 'Centro Test',
  timelineState: 'pending',
  evtVariant: 'gold',
  notes: null,
  tags: [],
  precioFinal: 65,
  ...overrides,
});

const THERAPISTS: IAgendaTherapist[] = [
  {
    id: 1,
    nombre: 'Naree',
    apellidos: 'Anongphan',
    initials: 'NA',
    sala: 'Sala Loto',
    appointmentCount: 3,
    isActive: true,
    isAvailableOnDate: true,
  },
  {
    id: 2,
    nombre: 'Som',
    apellidos: 'Ongkham',
    initials: 'SO',
    sala: 'Sala Bambú',
    appointmentCount: 2,
    isActive: true,
    isAvailableOnDate: true,
  },
];

// Helper — build a cita with a concrete therapist assignment.
const assigned = (id: TCitaId, therapistId: TUserId): IAgendaAppointment =>
  buildAppointment({ id, estado: 'confirmada', therapistId });
const unassigned = (id: TCitaId): IAgendaAppointment =>
  buildAppointment({ id, estado: 'sin_asignar', therapistId: null });

describe('partitionCitasByKanbanColumn', () => {
  it('routes a cita with a therapist to `asignadas` and without one to `sinAsignar`', () => {
    const partition = partitionCitasByKanbanColumn([assigned(1, 10), unassigned(2)]);

    expect(partition.asignadas.map((c) => c.id)).toEqual([1]);
    expect(partition.sinAsignar.map((c) => c.id)).toEqual([2]);
  });

  it('places a cita with therapistId === null in the sinAsignar column regardless of estado', () => {
    // even a non-'sin_asignar' estado routes by assignment (therapistId only)
    const cita = buildAppointment({ id: 1, estado: 'confirmada', therapistId: null });

    const partition = partitionCitasByKanbanColumn([cita]);

    expect(partition.sinAsignar).toHaveLength(1);
    expect(partition.sinAsignar[0].id).toBe(1);
    expect(partition.asignadas).toHaveLength(0);
  });

  it('produces a disjoint, exhaustive partition — no cita lost or duplicated', () => {
    const citas = [assigned(1, 10), unassigned(2), assigned(3, 20), unassigned(4)];

    const partition = partitionCitasByKanbanColumn(citas);
    const total = partition.sinAsignar.length + partition.asignadas.length;

    expect(total).toBe(citas.length);
  });

  it('reports per-column counts', () => {
    const citas = [assigned(1, 10), assigned(2, 20), assigned(3, 10), unassigned(4), unassigned(5)];

    const partition = partitionCitasByKanbanColumn(citas);

    expect(partition.asignadas).toHaveLength(3);
    expect(partition.sinAsignar).toHaveLength(2);
  });

  it('returns two empty columns for an empty input', () => {
    const partition = partitionCitasByKanbanColumn([]);

    expect(partition.sinAsignar).toEqual([]);
    expect(partition.asignadas).toEqual([]);
  });

  it('tolerates null clientName, sala and therapistId', () => {
    const cita = buildAppointment({
      id: 1,
      estado: 'sin_asignar',
      clientName: null,
      sala: null,
      salaId: null,
      therapistId: null,
    });

    const partition = partitionCitasByKanbanColumn([cita]);

    expect(partition.sinAsignar[0]).toMatchObject({
      clientName: null,
      sala: null,
      therapistId: null,
    });
  });
});

describe('mergeDayCitas', () => {
  it('concatenates assigned and unassigned appointments preserving both', () => {
    const assignedList = [
      buildAppointment({ id: 1, estado: 'confirmada' }),
      buildAppointment({ id: 2, estado: 'pendiente' }),
    ];
    const unassignedList = [buildAppointment({ id: 3, estado: 'sin_asignar', therapistId: null })];

    const merged = mergeDayCitas(assignedList, unassignedList);

    expect(merged.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it('keeps unassigned citas so they land in sinAsignar after partitioning', () => {
    const assignedList = [buildAppointment({ id: 1, estado: 'confirmada', therapistId: 10 })];
    const unassignedList = [buildAppointment({ id: 2, estado: 'sin_asignar', therapistId: null })];

    const partition = partitionCitasByKanbanColumn(mergeDayCitas(assignedList, unassignedList));

    expect(partition.asignadas.map((c) => c.id)).toEqual([1]);
    expect(partition.sinAsignar.map((c) => c.id)).toEqual([2]);
    expect(partition.sinAsignar.some((c) => c.therapistId === null)).toBe(true);
  });

  it('returns an empty list when both sources are empty', () => {
    expect(mergeDayCitas([], [])).toEqual([]);
  });
});

describe('resolveTherapistName', () => {
  it('resolves nombre + apellidos for a known therapist id', () => {
    expect(resolveTherapistName(1, THERAPISTS)).toBe('Naree Anongphan');
    expect(resolveTherapistName(2, THERAPISTS)).toBe('Som Ongkham');
  });

  it('returns null when therapistId is null (unassigned cita)', () => {
    expect(resolveTherapistName(null, THERAPISTS)).toBeNull();
  });

  it('returns null when the therapistId does not match any therapist', () => {
    expect(resolveTherapistName(999, THERAPISTS)).toBeNull();
  });

  it('returns null against an empty therapist list', () => {
    expect(resolveTherapistName(1, [])).toBeNull();
  });

  it('trims to just the nombre when apellidos is empty (no trailing space)', () => {
    const [naree] = THERAPISTS;
    const singleName: IAgendaTherapist = { ...naree, id: 3, nombre: 'Kanya', apellidos: '' };

    expect(resolveTherapistName(3, [singleName])).toBe('Kanya');
  });

  it('never returns the literal string "null" — the caller localises the placeholder', () => {
    // both null-yielding paths return a real null, not the string 'null'
    expect(resolveTherapistName(null, THERAPISTS)).not.toBe('null');
    expect(resolveTherapistName(999, THERAPISTS)).not.toBe('null');
    expect(resolveTherapistName(null, THERAPISTS)).toBeNull();
  });
});
