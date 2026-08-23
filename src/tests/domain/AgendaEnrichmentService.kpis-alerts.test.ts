/**
 * AgendaEnrichmentService.kpis-alerts.test.ts
 *
 * Pure unit tests for the two functions added by the CRUD enhancement:
 *   computeKpis   — the 5-card KPI strip (Analyst goal 11, Designer §1.2)
 *   computeAlerts — double-booking + cancellation alerts (Analyst goal 10, §4)
 *
 * No mocks — AgendaEnrichmentService has zero external dependencies. `now` is
 * passed explicitly so the "vencen en 1 h" window is deterministic (no Date.now).
 *
 * The sibling AgendaEnrichmentService.new.test.ts already covers the week/month
 * builders + colorMap; this file does NOT duplicate those.
 */

import { describe, it, expect } from 'vitest';
import { AgendaEnrichmentService } from '@domain/services/AgendaEnrichmentService';
import type { IAgendaRawCita } from '@domain/models/agenda.models';

const { computeKpis, computeAlerts } = AgendaEnrichmentService;

// Fixed "now": 2026-05-18 10:00 local. Slots are built relative to this.
const NOW = new Date(2026, 4, 18, 10, 0, 0);

function makeRawCita(overrides: Partial<IAgendaRawCita> = {}): IAgendaRawCita {
  return {
    id: 1,
    therapistId: 1,
    startIso: '2026-05-18T12:00:00',
    endIso: '2026-05-18T13:00:00',
    durationMin: 60,
    clientName: 'Cliente Test',
    serviceName: 'Masaje Tradicional',
    sala: 'Sala 1',
    salaId: 1,
    centroId: 1,
    centroName: 'Centro Test',
    estado: 'confirmada',
    precio: 5000,
    ...overrides,
  };
}

const TERAPEUTA_ACTIVO = { id: 1, nombre: 'Naree', apellidos: 'Anong', isActive: true } as const;
const TERAPEUTA_INACTIVO = {
  id: 2,
  nombre: 'Som',
  apellidos: 'Ongkham',
  isActive: false,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// computeKpis — 5-card strip
// ════════════════════════════════════════════════════════════════════════════

describe('AgendaEnrichmentService.computeKpis — strip shape', () => {
  it('returns exactly 5 cards', () => {
    expect(computeKpis([], [], NOW)).toHaveLength(5);
  });

  it('cards appear in the canonical order', () => {
    const ids = computeKpis([], [], NOW).map((k) => k.id);
    expect(ids).toEqual([
      'reservas-hoy',
      'por-confirmar',
      'terapeutas-activos',
      'ingresos-previstos',
      'lista-espera',
    ]);
  });

  it('only the "reservas-hoy" card is accented', () => {
    const kpis = computeKpis([], [], NOW);
    const accented = kpis.filter((k) => k.isAccent);
    expect(accented).toHaveLength(1);
    expect(accented[0]?.id).toBe('reservas-hoy');
  });
});

describe('AgendaEnrichmentService.computeKpis — empty input', () => {
  const kpis = computeKpis([], [], NOW);
  const byId = (id: string) => kpis.find((k) => k.id === id);

  it('reservas-hoy value is 0 with no citas', () => {
    expect(byId('reservas-hoy')?.value).toBe(0);
  });

  it('por-confirmar value is 0 and has no subtext', () => {
    expect(byId('por-confirmar')?.value).toBe(0);
    expect(byId('por-confirmar')?.subtext).toBeNull();
  });

  it('terapeutas-activos value is 0 with no terapeutas', () => {
    expect(byId('terapeutas-activos')?.value).toBe(0);
  });

  it('ingresos-previstos value is 0 with no citas', () => {
    expect(byId('ingresos-previstos')?.value).toBe(0);
  });

  it('lista-espera is always a transparent placeholder (value 0 + explanatory subtext)', () => {
    expect(byId('lista-espera')?.value).toBe(0);
    expect(byId('lista-espera')?.subtext).toBe('⏰ Si hay huecos, avisar');
  });
});

describe('AgendaEnrichmentService.computeKpis — reservas-hoy (real citas only)', () => {
  it('counts real appointments but excludes non-bookable blocks (pausa/libranza)', () => {
    const citas: IAgendaRawCita[] = [
      makeRawCita({ id: 1, serviceName: 'Masaje Tradicional' }),
      makeRawCita({ id: 2, serviceName: 'Reflexología' }),
      makeRawCita({ id: 3, serviceName: 'Pausa · Té' }), // not a real cita
      makeRawCita({ id: 4, serviceName: 'Libranza' }), // not a real cita
    ];
    const kpis = computeKpis(citas, [TERAPEUTA_ACTIVO], NOW);
    expect(kpis.find((k) => k.id === 'reservas-hoy')?.value).toBe(2);
  });

  it('denominator = activeTerapeutas * 8 when there are active terapeutas', () => {
    const kpis = computeKpis([], [TERAPEUTA_ACTIVO, TERAPEUTA_INACTIVO], NOW);
    // 1 active terapeuta → 1 * 8
    expect(kpis.find((k) => k.id === 'reservas-hoy')?.denominator).toBe(8);
  });

  it('denominator is null when there are no active terapeutas', () => {
    const kpis = computeKpis([], [TERAPEUTA_INACTIVO], NOW);
    expect(kpis.find((k) => k.id === 'reservas-hoy')?.denominator).toBeNull();
  });
});

describe('AgendaEnrichmentService.computeKpis — por-confirmar + due-soon subtext', () => {
  it('counts pending real citas', () => {
    const citas: IAgendaRawCita[] = [
      makeRawCita({ id: 1, estado: 'pendiente' }),
      makeRawCita({ id: 2, estado: 'pendiente' }),
      makeRawCita({ id: 3, estado: 'confirmada' }),
    ];
    const kpis = computeKpis(citas, [TERAPEUTA_ACTIVO], NOW);
    expect(kpis.find((k) => k.id === 'por-confirmar')?.value).toBe(2);
  });

  it('subtext lists how many pending citas start within the next hour', () => {
    const citas: IAgendaRawCita[] = [
      // pending, starts 30 min from NOW → due soon
      makeRawCita({
        id: 1,
        estado: 'pendiente',
        startIso: '2026-05-18T10:30:00',
        endIso: '2026-05-18T11:30:00',
      }),
      // pending, starts 3 h from NOW → NOT due soon
      makeRawCita({
        id: 2,
        estado: 'pendiente',
        startIso: '2026-05-18T13:00:00',
        endIso: '2026-05-18T14:00:00',
      }),
    ];
    const kpis = computeKpis(citas, [TERAPEUTA_ACTIVO], NOW);
    expect(kpis.find((k) => k.id === 'por-confirmar')?.subtext).toBe('⏱ 1 vencen en 1 h');
  });

  it('subtext is null when no pending cita is due within the hour', () => {
    const citas: IAgendaRawCita[] = [
      makeRawCita({
        id: 1,
        estado: 'pendiente',
        startIso: '2026-05-18T15:00:00',
        endIso: '2026-05-18T16:00:00',
      }),
    ];
    const kpis = computeKpis(citas, [TERAPEUTA_ACTIVO], NOW);
    expect(kpis.find((k) => k.id === 'por-confirmar')?.subtext).toBeNull();
  });
});

describe('AgendaEnrichmentService.computeKpis — terapeutas-activos', () => {
  it('value = active count, denominator = total terapeutas', () => {
    const kpis = computeKpis([], [TERAPEUTA_ACTIVO, TERAPEUTA_INACTIVO], NOW);
    const card = kpis.find((k) => k.id === 'terapeutas-activos');
    expect(card?.value).toBe(1);
    expect(card?.denominator).toBe(2);
  });

  it('subtext names the first inactive terapeuta when one exists', () => {
    const kpis = computeKpis([], [TERAPEUTA_ACTIVO, TERAPEUTA_INACTIVO], NOW);
    expect(kpis.find((k) => k.id === 'terapeutas-activos')?.subtext).toBe(
      '🛋 Som Ongkham · libranza',
    );
  });

  it('subtext is null when all terapeutas are active', () => {
    const kpis = computeKpis([], [TERAPEUTA_ACTIVO], NOW);
    expect(kpis.find((k) => k.id === 'terapeutas-activos')?.subtext).toBeNull();
  });
});

describe('AgendaEnrichmentService.computeKpis — ingresos-previstos', () => {
  it('sums precio of real citas excluding cancelled and no-show', () => {
    const citas: IAgendaRawCita[] = [
      makeRawCita({ id: 1, estado: 'confirmada', precio: 5000 }),
      makeRawCita({ id: 2, estado: 'completada', precio: 3000 }),
      makeRawCita({ id: 3, estado: 'cancelada', precio: 9999 }), // excluded
      makeRawCita({ id: 4, estado: 'no_presentado', precio: 9999 }), // excluded
    ];
    const kpis = computeKpis(citas, [TERAPEUTA_ACTIVO], NOW);
    expect(kpis.find((k) => k.id === 'ingresos-previstos')?.value).toBe(8000);
  });

  it('uses € as the unit', () => {
    const kpis = computeKpis([], [], NOW);
    expect(kpis.find((k) => k.id === 'ingresos-previstos')?.unit).toBe('€');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// computeAlerts
// ════════════════════════════════════════════════════════════════════════════

describe('AgendaEnrichmentService.computeAlerts — empty / no-conflict', () => {
  it('returns [] for empty input', () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it('returns [] for a single cita (nothing to overlap)', () => {
    expect(computeAlerts([makeRawCita()])).toEqual([]);
  });

  it('returns [] when two citas neither share a therapist nor a sala', () => {
    const citas: IAgendaRawCita[] = [
      makeRawCita({ id: 1, therapistId: 1, salaId: 1 }),
      makeRawCita({ id: 2, therapistId: 2, salaId: 2 }), // same time, different th + sala
    ];
    expect(computeAlerts(citas)).toEqual([]);
  });

  it('returns [] when two citas share a therapist but do NOT overlap in time', () => {
    const citas: IAgendaRawCita[] = [
      makeRawCita({
        id: 1,
        therapistId: 1,
        startIso: '2026-05-18T10:00:00',
        endIso: '2026-05-18T11:00:00',
      }),
      makeRawCita({
        id: 2,
        therapistId: 1,
        startIso: '2026-05-18T11:00:00', // starts exactly when the first ends
        endIso: '2026-05-18T12:00:00',
      }),
    ];
    expect(computeAlerts(citas)).toEqual([]);
  });
});

describe('AgendaEnrichmentService.computeAlerts — double booking', () => {
  it('flags two overlapping citas that share a therapist', () => {
    const citas: IAgendaRawCita[] = [
      makeRawCita({
        id: 1,
        therapistId: 1,
        salaId: 1,
        clientName: 'Ana',
        startIso: '2026-05-18T10:00:00',
        endIso: '2026-05-18T11:00:00',
      }),
      makeRawCita({
        id: 2,
        therapistId: 1,
        salaId: 2, // different sala, same therapist
        clientName: 'Beto',
        startIso: '2026-05-18T10:30:00',
        endIso: '2026-05-18T11:30:00',
      }),
    ];
    const alerts = computeAlerts(citas);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.type).toBe('double_booking');
    expect(alerts[0]?.message).toContain('el mismo terapeuta');
    expect(alerts[0]?.message).toContain('Ana');
    expect(alerts[0]?.message).toContain('Beto');
  });

  it('flags two overlapping citas that share a sala (different therapists)', () => {
    const citas: IAgendaRawCita[] = [
      makeRawCita({
        id: 1,
        therapistId: 1,
        salaId: 5,
        sala: 'Suite',
        startIso: '2026-05-18T10:00:00',
        endIso: '2026-05-18T11:00:00',
      }),
      makeRawCita({
        id: 2,
        therapistId: 2,
        salaId: 5,
        sala: 'Suite',
        startIso: '2026-05-18T10:30:00',
        endIso: '2026-05-18T11:30:00',
      }),
    ];
    const alerts = computeAlerts(citas);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.message).toContain('la sala Suite');
  });

  it('does not treat salaId null (unassigned sala) as a shared sala', () => {
    // The domain sentinel for "no room assigned yet" is salaId === null (see
    // IAgendaRawCita.salaId: TSalaId | null and SupabaseAgendaAdapter `?? null`).
    // Two unassigned citas (both null) must NOT be flagged as a sala clash — the
    // service guards this with `a.salaId !== null && b.salaId !== null`.
    const citas: IAgendaRawCita[] = [
      makeRawCita({
        id: 1,
        therapistId: 1,
        salaId: null,
        startIso: '2026-05-18T10:00:00',
        endIso: '2026-05-18T11:00:00',
      }),
      makeRawCita({
        id: 2,
        therapistId: 2, // different therapist…
        salaId: null, // …and both unassigned (null) → must NOT count as a sala clash
        startIso: '2026-05-18T10:30:00',
        endIso: '2026-05-18T11:30:00',
      }),
    ];
    expect(computeAlerts(citas)).toEqual([]);
  });

  it('ignores cancelled citas when detecting overlaps', () => {
    const citas: IAgendaRawCita[] = [
      makeRawCita({
        id: 1,
        therapistId: 1,
        startIso: '2026-05-18T10:00:00',
        endIso: '2026-05-18T11:00:00',
        estado: 'confirmada',
      }),
      makeRawCita({
        id: 2,
        therapistId: 1,
        startIso: '2026-05-18T10:30:00',
        endIso: '2026-05-18T11:30:00',
        estado: 'cancelada', // cancelled → excluded
      }),
    ];
    expect(computeAlerts(citas)).toEqual([]);
  });

  it('ignores non-bookable blocks (libranza) when detecting overlaps', () => {
    const citas: IAgendaRawCita[] = [
      makeRawCita({
        id: 1,
        therapistId: 1,
        serviceName: 'Masaje',
        startIso: '2026-05-18T10:00:00',
        endIso: '2026-05-18T11:00:00',
      }),
      makeRawCita({
        id: 2,
        therapistId: 1,
        serviceName: 'Libranza', // not a real cita
        startIso: '2026-05-18T10:30:00',
        endIso: '2026-05-18T11:30:00',
      }),
    ];
    expect(computeAlerts(citas)).toEqual([]);
  });
});

describe('AgendaEnrichmentService.computeAlerts — cancellation alerts', () => {
  it('produces no cancellation alerts when none are supplied', () => {
    const alerts = computeAlerts([makeRawCita()]);
    expect(alerts.filter((a) => a.type === 'cancellation')).toHaveLength(0);
  });

  it('produces one cancellation alert per supplied cancelled cita', () => {
    const cancelled: IAgendaRawCita[] = [
      makeRawCita({ id: 10, clientName: 'Lucía', estado: 'cancelada' }),
      makeRawCita({ id: 11, clientName: 'Marco', estado: 'cancelada' }),
    ];
    const alerts = computeAlerts([], cancelled);
    const cancellations = alerts.filter((a) => a.type === 'cancellation');
    expect(cancellations).toHaveLength(2);
    expect(cancellations[0]?.message).toContain('Lucía');
    expect(cancellations[1]?.message).toContain('Marco');
  });

  it('combines double-booking and cancellation alerts in one result', () => {
    const dayCitas: IAgendaRawCita[] = [
      makeRawCita({
        id: 1,
        therapistId: 1,
        startIso: '2026-05-18T10:00:00',
        endIso: '2026-05-18T11:00:00',
      }),
      makeRawCita({
        id: 2,
        therapistId: 1,
        startIso: '2026-05-18T10:30:00',
        endIso: '2026-05-18T11:30:00',
      }),
    ];
    const cancelled: IAgendaRawCita[] = [makeRawCita({ id: 9, estado: 'cancelada' })];
    const alerts = computeAlerts(dayCitas, cancelled);
    expect(alerts.filter((a) => a.type === 'double_booking')).toHaveLength(1);
    expect(alerts.filter((a) => a.type === 'cancellation')).toHaveLength(1);
  });

  it('gives every alert a unique id', () => {
    const dayCitas: IAgendaRawCita[] = [
      makeRawCita({
        id: 1,
        therapistId: 1,
        startIso: '2026-05-18T10:00:00',
        endIso: '2026-05-18T11:00:00',
      }),
      makeRawCita({
        id: 2,
        therapistId: 1,
        startIso: '2026-05-18T10:30:00',
        endIso: '2026-05-18T11:30:00',
      }),
    ];
    const cancelled: IAgendaRawCita[] = [makeRawCita({ id: 9, estado: 'cancelada' })];
    const alerts = computeAlerts(dayCitas, cancelled);
    const ids = alerts.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
