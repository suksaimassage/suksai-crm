/**
 * AgendaEnrichmentService.new.test.ts
 *
 * Pure unit tests for AgendaEnrichmentService exported functions.
 * No mocks — domain service has zero external dependencies.
 *
 * Functions covered:
 *   deriveTherapistColorMap
 *   buildWeekDays
 *   buildMonthCells
 *   computeMonthFooterKpis
 *   buildTherapistWeekDays
 *   computeWeekBalance
 *
 * TIMEZONE NOTE:
 *   buildWeekDays / buildTherapistWeekDays compute `dateStr` via the service's
 *   `localDateKey()`: `new Date(weekStartStr + 'T00:00:00')` (local) → local Y-M-D
 *   parts (getFullYear/getMonth/getDate), NOT toISOString() (which is UTC and rolls
 *   the day back in +offset zones such as Europe/Madrid).
 *   Tests that reference specific dateStr values use the helper `svcDateStr()` which
 *   mirrors that same local-parts derivation, making them timezone-agnostic.
 */

import { describe, it, expect } from 'vitest';
import { AgendaEnrichmentService } from '@domain/services/AgendaEnrichmentService';
import type { IAgendaRawCita } from '@domain/models/agenda.models';

// ── Fixture helper ────────────────────────────────────────────────────────────

function makeRawCita(overrides: Partial<IAgendaRawCita> = {}): IAgendaRawCita {
  const base: IAgendaRawCita = {
    id: 1,
    therapistId: 1,
    startIso: '2026-05-18T10:00:00',
    endIso: '2026-05-18T11:00:00',
    durationMin: 60,
    clientName: 'Test Client',
    serviceName: 'Masaje Test',
    sala: 'Sala 1',
    salaId: 1,
    centroId: 1,
    centroName: 'Centro Test',
    estado: 'confirmada',
    precio: 60,
  };
  return { ...base, ...overrides };
}

/**
 * Mirrors the service's localDateKey() dateStr derivation:
 * new Date(weekStartStr + 'T00:00:00') then setDate(+offset) then LOCAL Y-M-D parts.
 * Deliberately NOT toISOString().slice(0,10) — that is UTC and rolls the day back in
 * positive-offset zones, which is the stale behavior the service was fixed away from.
 */
function svcDateStr(weekStartStr: string, dayOffset: number): string {
  const d = new Date(weekStartStr + 'T00:00:00');
  d.setDate(d.getDate() + dayOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── deriveTherapistColorMap ───────────────────────────────────────────────────

describe('AgendaEnrichmentService.deriveTherapistColorMap', () => {
  it('empty array → empty map {}', () => {
    expect(AgendaEnrichmentService.deriveTherapistColorMap([])).toEqual({});
  });

  it('[1] → { 1: "a" }', () => {
    expect(AgendaEnrichmentService.deriveTherapistColorMap([1])).toEqual({ 1: 'a' });
  });

  it('[1, 2, 3] → { 1: "a", 2: "b", 3: "c" }', () => {
    expect(AgendaEnrichmentService.deriveTherapistColorMap([1, 2, 3])).toEqual({
      1: 'a',
      2: 'b',
      3: 'c',
    });
  });

  it('6 therapists → uses all 6 color slots a–f', () => {
    expect(AgendaEnrichmentService.deriveTherapistColorMap([1, 2, 3, 4, 5, 6])).toEqual({
      1: 'a',
      2: 'b',
      3: 'c',
      4: 'd',
      5: 'e',
      6: 'f',
    });
  });

  it('7th therapist wraps to "a" (index 6 % 6 === 0)', () => {
    const result = AgendaEnrichmentService.deriveTherapistColorMap([1, 2, 3, 4, 5, 6, 7]);
    expect(result[7]).toBe('a');
  });
});

// ── enrichAppointments (centro propagation) ───────────────────────────────────

describe('AgendaEnrichmentService.enrichAppointments', () => {
  it('carries centroId and centroName from the raw cita to the appointment', () => {
    const raw = makeRawCita({ centroId: 7, centroName: 'Centro Valencia' });
    const [appt] = AgendaEnrichmentService.enrichAppointments([raw], new Date());
    expect(appt.centroId).toBe(7);
    expect(appt.centroName).toBe('Centro Valencia');
  });
});

// ── buildWeekDays ─────────────────────────────────────────────────────────────

describe('AgendaEnrichmentService.buildWeekDays', () => {
  const WEEK_START = '2026-05-18';

  // Derive expected dateStr values using the same local→UTC path as the service
  const DAY0 = svcDateStr(WEEK_START, 0);
  const DAY1 = svcDateStr(WEEK_START, 1);
  const DAY2 = svcDateStr(WEEK_START, 2);
  const DAY3 = svcDateStr(WEEK_START, 3);

  // Set TODAY to DAY2 so item[2].isToday is predictably true regardless of timezone
  const TODAY = DAY2;
  const NOW = new Date();

  const rawCitas: readonly IAgendaRawCita[] = [
    // Two citas on day 0
    makeRawCita({ id: 1, startIso: `${DAY0}T09:00:00`, endIso: `${DAY0}T10:00:00` }),
    makeRawCita({ id: 2, startIso: `${DAY0}T11:00:00`, endIso: `${DAY0}T12:00:00` }),
    // One cita on day 2 (= today)
    makeRawCita({ id: 3, startIso: `${DAY2}T10:00:00`, endIso: `${DAY2}T11:00:00` }),
  ];

  it('returns an array of exactly 7 items', () => {
    const result = AgendaEnrichmentService.buildWeekDays(WEEK_START, [], TODAY, NOW);
    expect(result).toHaveLength(7);
  });

  it('item 0 has the dateStr that the service computes for weekStart', () => {
    const result = AgendaEnrichmentService.buildWeekDays(WEEK_START, [], TODAY, NOW);
    expect(result[0]?.dateStr).toBe(DAY0);
  });

  it('item 0 has label="LUN"', () => {
    const result = AgendaEnrichmentService.buildWeekDays(WEEK_START, [], TODAY, NOW);
    expect(result[0]?.label).toBe('LUN');
  });

  it('item 6 (Sunday) has label="DOM"', () => {
    const result = AgendaEnrichmentService.buildWeekDays(WEEK_START, [], TODAY, NOW);
    expect(result[6]?.label).toBe('DOM');
  });

  it('item 2 has isToday=true when TODAY=DAY2', () => {
    const result = AgendaEnrichmentService.buildWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    expect(result[2]?.isToday).toBe(true);
  });

  it('items 0, 1, 3 have isToday=false', () => {
    const result = AgendaEnrichmentService.buildWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    expect(result[0]?.isToday).toBe(false);
    expect(result[1]?.isToday).toBe(false);
    expect(result[3]?.isToday).toBe(false);
  });

  it('item 0 has citaCount=2 (two citas on DAY0)', () => {
    const result = AgendaEnrichmentService.buildWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    expect(result[0]?.citaCount).toBe(2);
  });

  it('item 2 has citaCount=1 (one cita on DAY2)', () => {
    const result = AgendaEnrichmentService.buildWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    expect(result[2]?.citaCount).toBe(1);
  });

  it('item 1 has citaCount=0 (no citas on DAY1)', () => {
    const result = AgendaEnrichmentService.buildWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    expect(result[1]?.citaCount).toBe(0);
  });

  it('appointments for a day only include citas whose startIso starts with that day dateStr', () => {
    const result = AgendaEnrichmentService.buildWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    expect(result[0]?.appointments).toHaveLength(2);
    expect(result[2]?.appointments).toHaveLength(1);
    expect(result[1]?.appointments).toHaveLength(0);
  });

  it('isDayOff is always false (current implementation)', () => {
    const result = AgendaEnrichmentService.buildWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    result.forEach((day) => {
      expect(day.isDayOff).toBe(false);
    });
  });

  // Suppress unused variable linting for documentation helpers
  void DAY1;
  void DAY3;
});

// ── buildMonthCells ───────────────────────────────────────────────────────────

describe('AgendaEnrichmentService.buildMonthCells', () => {
  const YEAR = 2026;
  const MONTH = 5; // May

  // For month cells: buildMonthCells uses `new Date(year, month-1, 1).getDay()`
  // for leading days, then `new Date(year, month-1, 1 - leadingDays + i).toISOString()` for dateStr.
  // Raw citas use exact ISO strings: the service matches `c.startIso.startsWith(dateStr)`.
  // To ensure the rawCita startIso prefix matches the cell's UTC dateStr,
  // we derive the cell dateStr for May 7 the same way: local date → UTC slice.
  const may7LocalDate = new Date(2026, 4, 7); // May 7 in local time
  const MAY7_CELL_DATE = may7LocalDate.toISOString().slice(0, 10);

  // For isToday matching: the service compares dateStr === today, both in UTC form.
  const TODAY = MAY7_CELL_DATE;

  const rawCitas: readonly IAgendaRawCita[] = [
    // Use the UTC-consistent dateStr + time to guarantee startIso.startsWith(dateStr)
    makeRawCita({ id: 1, startIso: `${MAY7_CELL_DATE}T09:00:00` }),
    makeRawCita({ id: 2, startIso: `${MAY7_CELL_DATE}T11:00:00` }),
  ];

  it('returns array with length divisible by 7 (full weeks)', () => {
    const result = AgendaEnrichmentService.buildMonthCells(YEAR, MONTH, rawCitas, TODAY);
    expect(result.length % 7).toBe(0);
  });

  it('contains a cell with dateStr matching May 7 (UTC-derived)', () => {
    const result = AgendaEnrichmentService.buildMonthCells(YEAR, MONTH, rawCitas, TODAY);
    const cell = result.find((c) => c.dateStr === MAY7_CELL_DATE);
    expect(cell).toBeDefined();
  });

  it('the May-7 cell has isToday=true', () => {
    const result = AgendaEnrichmentService.buildMonthCells(YEAR, MONTH, rawCitas, TODAY);
    const cell = result.find((c) => c.dateStr === MAY7_CELL_DATE);
    expect(cell?.isToday).toBe(true);
  });

  it('the May-7 cell has citaCount=2', () => {
    const result = AgendaEnrichmentService.buildMonthCells(YEAR, MONTH, rawCitas, TODAY);
    const cell = result.find((c) => c.dateStr === MAY7_CELL_DATE);
    expect(cell?.citaCount).toBe(2);
  });

  it('the May-7 cell has densityLevel=1 for count=2 (< 3 threshold)', () => {
    const result = AgendaEnrichmentService.buildMonthCells(YEAR, MONTH, rawCitas, TODAY);
    const cell = result.find((c) => c.dateStr === MAY7_CELL_DATE);
    expect(cell?.densityLevel).toBe(1);
  });

  it('cells outside current month have isCurrentMonth=false', () => {
    const result = AgendaEnrichmentService.buildMonthCells(YEAR, MONTH, rawCitas, TODAY);
    const outsideMonth = result.filter((c) => !c.isCurrentMonth);
    // May 2026 has leading days from April in the grid
    expect(outsideMonth.length).toBeGreaterThan(0);
    outsideMonth.forEach((c) => {
      expect(c.isCurrentMonth).toBe(false);
    });
  });

  it('overflowCount=0 when citaCount <= 3', () => {
    const result = AgendaEnrichmentService.buildMonthCells(YEAR, MONTH, rawCitas, TODAY);
    const cell = result.find((c) => c.dateStr === MAY7_CELL_DATE);
    expect(cell?.overflowCount).toBe(0);
  });

  it('overflowCount=2 when citaCount=5 (5-3=2 overflow, 3 chips shown)', () => {
    const may14LocalDate = new Date(2026, 4, 14);
    const MAY14_CELL_DATE = may14LocalDate.toISOString().slice(0, 10);
    const fiveCitas: readonly IAgendaRawCita[] = Array.from({ length: 5 }, (_, i) =>
      makeRawCita({ id: 10 + i, startIso: `${MAY14_CELL_DATE}T10:00:00` }),
    );
    const result = AgendaEnrichmentService.buildMonthCells(YEAR, MONTH, fiveCitas, TODAY);
    const cell = result.find((c) => c.dateStr === MAY14_CELL_DATE);
    expect(cell?.overflowCount).toBe(2);
    expect(cell?.chips).toHaveLength(3);
  });

  it('first cell of the grid is not after the first day of the month', () => {
    // The grid always starts on or before the 1st of the month.
    // buildMonthCells subtracts `leadingDays` from the 1st, so cell[0] is ≤ day 1.
    const result = AgendaEnrichmentService.buildMonthCells(YEAR, MONTH, [], TODAY);
    const firstDateStr = result[0]?.dateStr;
    expect(firstDateStr).toBeDefined();
    // The first cell's dateStr must be on or before May 1 2026 in UTC
    const firstOfMonth = new Date(YEAR, MONTH - 1, 1).toISOString().slice(0, 10);
    expect(firstDateStr <= firstOfMonth).toBe(true);
  });
});

// ── computeMonthFooterKpis ────────────────────────────────────────────────────

describe('AgendaEnrichmentService.computeMonthFooterKpis', () => {
  const YEAR = 2026;
  const MONTH = 5;

  const rawCitas: readonly IAgendaRawCita[] = [
    makeRawCita({ id: 1, startIso: '2026-05-07T09:00:00' }),
    makeRawCita({ id: 2, startIso: '2026-05-07T10:00:00' }),
    makeRawCita({ id: 3, startIso: '2026-05-07T11:00:00' }),
    makeRawCita({ id: 4, startIso: '2026-05-14T09:00:00' }),
    makeRawCita({ id: 5, startIso: '2026-05-14T10:00:00' }),
  ];

  it('totalCitas = 5 (3 on day 7 + 2 on day 14)', () => {
    const result = AgendaEnrichmentService.computeMonthFooterKpis(rawCitas, YEAR, MONTH);
    expect(result.totalCitas).toBe(5);
  });

  it('monthLabel = "MAYO"', () => {
    const result = AgendaEnrichmentService.computeMonthFooterKpis(rawCitas, YEAR, MONTH);
    expect(result.monthLabel).toBe('MAYO');
  });

  it('peakDays = [7] (day 7 has 3 citas, day 14 has 2 — peak is 7)', () => {
    const result = AgendaEnrichmentService.computeMonthFooterKpis(rawCitas, YEAR, MONTH);
    expect(result.peakDays).toEqual([7]);
  });

  it('ocupacionPct = null (current implementation always null)', () => {
    const result = AgendaEnrichmentService.computeMonthFooterKpis(rawCitas, YEAR, MONTH);
    expect(result.ocupacionPct).toBeNull();
  });

  it('empty rawCitas → totalCitas=0, peakDays=[]', () => {
    const result = AgendaEnrichmentService.computeMonthFooterKpis([], YEAR, MONTH);
    expect(result.totalCitas).toBe(0);
    expect(result.peakDays).toEqual([]);
  });
});

// ── buildTherapistWeekDays ────────────────────────────────────────────────────

describe('AgendaEnrichmentService.buildTherapistWeekDays', () => {
  const WEEK_START = '2026-05-18';

  // Use svcDateStr so dateStr values match what the service actually produces
  const DAY0 = svcDateStr(WEEK_START, 0); // Mon
  const DAY1 = svcDateStr(WEEK_START, 1); // Tue
  const DAY2 = svcDateStr(WEEK_START, 2); // Wed — today
  const DAY3 = svcDateStr(WEEK_START, 3); // Thu

  const TODAY = DAY2;
  const NOW = new Date();

  const rawCitas: readonly IAgendaRawCita[] = [
    makeRawCita({
      id: 1,
      startIso: `${DAY0}T10:00:00`,
      endIso: `${DAY0}T11:00:00`,
      serviceName: 'Masaje',
    }),
    makeRawCita({
      id: 2,
      startIso: `${DAY2}T10:00:00`,
      endIso: `${DAY2}T11:00:00`,
      serviceName: 'Libranza',
    }),
  ];

  it('returns 7 items', () => {
    const result = AgendaEnrichmentService.buildTherapistWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    expect(result).toHaveLength(7);
  });

  it('item 0 (DAY0) has isPast=true (before today=DAY2)', () => {
    const result = AgendaEnrichmentService.buildTherapistWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    expect(result[0]?.isPast).toBe(true);
  });

  it('item 2 (DAY2=today) has isToday=true and isPast=false', () => {
    const result = AgendaEnrichmentService.buildTherapistWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    expect(result[2]?.isToday).toBe(true);
    expect(result[2]?.isPast).toBe(false);
  });

  it('item 3 (DAY3) has isPast=false and isToday=false', () => {
    const result = AgendaEnrichmentService.buildTherapistWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    expect(result[3]?.isPast).toBe(false);
    expect(result[3]?.isToday).toBe(false);
  });

  it('isLibranza=true for day with serviceName="Libranza"', () => {
    const result = AgendaEnrichmentService.buildTherapistWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    const libDay = result.find((d) => d.dateStr === DAY2);
    expect(libDay?.isLibranza).toBe(true);
  });

  it('isLibranza=false for day with serviceName="Masaje"', () => {
    const result = AgendaEnrichmentService.buildTherapistWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    const masajeDay = result.find((d) => d.dateStr === DAY0);
    expect(masajeDay?.isLibranza).toBe(false);
  });

  it('citaCount counts real appointments (not libranza)', () => {
    const result = AgendaEnrichmentService.buildTherapistWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    const masajeDay = result.find((d) => d.dateStr === DAY0);
    expect(masajeDay?.citaCount).toBe(1);
    const libDay = result.find((d) => d.dateStr === DAY2);
    expect(libDay?.citaCount).toBe(0);
  });

  it('item 0 (Monday) has dayOfWeek=1', () => {
    const result = AgendaEnrichmentService.buildTherapistWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    expect(result[0]?.dayOfWeek).toBe(1);
  });

  it('item 6 (Sunday) has dayOfWeek=7', () => {
    const result = AgendaEnrichmentService.buildTherapistWeekDays(WEEK_START, rawCitas, TODAY, NOW);
    expect(result[6]?.dayOfWeek).toBe(7);
  });

  void DAY1;
  void DAY3;
});

// ── computeWeekBalance ────────────────────────────────────────────────────────

describe('AgendaEnrichmentService.computeWeekBalance', () => {
  const WEEK_START = '2026-05-18';

  const makeApptForBalance = (estado: 'completada' | 'confirmada' | 'pendiente') => ({
    id: Math.random(),
    therapistId: 1,
    startTime: '10:00',
    endTime: '11:00',
    durationMin: 60,
    clientName: 'C',
    visitInfo: null,
    serviceName: 'Masaje',
    sala: 'Sala 1',
    salaId: 1,
    centroId: 1,
    centroName: 'Centro Test',
    estado,
    timelineState: 'done' as const,
    evtVariant: 'gold' as const,
    notes: null,
    tags: [],
    precioFinal: 60,
  });

  const weekDays = [
    {
      dateStr: '2026-05-18',
      label: 'LUN',
      dateNumber: 18,
      dayOfWeek: 1 as const,
      isToday: false,
      isPast: true,
      isLibranza: false,
      appointments: [makeApptForBalance('completada'), makeApptForBalance('confirmada')],
      citaCount: 2,
      hoursWorked: 2.5,
      revenueForDay: 120,
    },
    {
      dateStr: '2026-05-19',
      label: 'MAR',
      dateNumber: 19,
      dayOfWeek: 2 as const,
      isToday: false,
      isPast: true,
      isLibranza: false,
      appointments: [
        makeApptForBalance('completada'),
        makeApptForBalance('completada'),
        makeApptForBalance('pendiente'),
      ],
      citaCount: 3,
      hoursWorked: 3.0,
      revenueForDay: 180,
    },
    {
      dateStr: '2026-05-20',
      label: 'MIÉ',
      dateNumber: 20,
      dayOfWeek: 3 as const,
      isToday: true,
      isPast: false,
      isLibranza: false,
      appointments: [],
      citaCount: 0,
      hoursWorked: 0,
      revenueForDay: 0,
    },
  ];

  it('citasTotal = 5 (2+3+0)', () => {
    const result = AgendaEnrichmentService.computeWeekBalance(weekDays, WEEK_START);
    expect(result.citasTotal).toBe(5);
  });

  it('citasCompletadas = 3', () => {
    const result = AgendaEnrichmentService.computeWeekBalance(weekDays, WEEK_START);
    expect(result.citasCompletadas).toBe(3);
  });

  it('horasEnSala = 5.5 (2.5+3.0+0)', () => {
    const result = AgendaEnrichmentService.computeWeekBalance(weekDays, WEEK_START);
    expect(result.horasEnSala).toBe(5.5);
  });

  it('valoracionMedia = 0 (current implementation always 0)', () => {
    const result = AgendaEnrichmentService.computeWeekBalance(weekDays, WEEK_START);
    expect(result.valoracionMedia).toBe(0);
  });

  it('propinas = 0', () => {
    const result = AgendaEnrichmentService.computeWeekBalance(weekDays, WEEK_START);
    expect(result.propinas).toBe(0);
  });

  it('weekLabel is a non-empty string matching "{day} {month} – {day} {month}" pattern', () => {
    const result = AgendaEnrichmentService.computeWeekBalance(weekDays, WEEK_START);
    expect(result.weekLabel).toMatch(/\d+ \w+ – \d+ \w+/);
    expect(result.weekLabel.length).toBeGreaterThan(0);
  });
});
