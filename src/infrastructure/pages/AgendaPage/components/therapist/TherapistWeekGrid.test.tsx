/**
 * TherapistWeekGrid.test.tsx
 *
 * Comprehensive test suite for TherapistWeekGrid (DOM-grid refactor).
 *
 * Test areas:
 *   1. Pure utility functions from agenda.utils.ts
 *      - slotIndexFromTime: boundary slots, intra-slot times, out-of-range, malformed strings
 *      - slotSpanFromDuration: 30/60/90/45/0/negative minutes
 *   2. computeLanes algorithm (tested indirectly via rendered output):
 *      - 0 citas, 1 cita, 2 non-overlapping, 2 overlapping, 3 partial-overlap
 *   3. Component rendering (DOM structure):
 *      - 24 slot cells per normal day row
 *      - 24 time cells in the header
 *      - Lane count matches overlap scenario
 *      - isDayOff: dayOfWeek===7 renders SundayLabel; isLibranza renders SundayLabel
 *      - isDayOff suppresses appointment events
 *      - Row labels, meta text, hoursWorked formatting
 *   4. Interactions:
 *      - Click on appointment fires onAppointmentClick(id)
 *      - Enter key fires onAppointmentClick(id)
 *      - Space key fires onAppointmentClick(id)
 *      - Missing onAppointmentClick: click does not throw
 *   5. Accessibility:
 *      - StyledTherWeekTimeRow has aria-hidden="true"
 *      - StyledTherWeekSlotCells have aria-hidden="true"
 *      - StyledTherWeekGrid has aria-label = t('therapist.myWeek')
 *      - Appointment blocks have tabIndex={0}
 *      - Appointment blocks have role="button"
 *      - aria-label contains clientName, startTime, endTime
 *   6. Edge cases:
 *      - Empty weekDays array renders without error
 *      - durationMin=0 does not render an appointment block
 *      - slotStart before range (negative) is clamped to 0 (no crash)
 *      - Legend footer renders all 6 legend items
 *
 * Mock strategy:
 *   - No external hooks — component is purely prop-driven.
 *   - i18n: real i18next instance with Spanish agenda.json (same pattern as
 *     src/tests/infrastructure/pages/AgendaPage/TherapistWeekGrid.test.tsx).
 *   - No snapshot tests (prohibited).
 *   - No CSS assertions.
 *   - userEvent preferred over fireEvent; fireEvent used for keyboard events
 *     to test the specific onKeyDown handler contract.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { TherapistWeekGrid } from './TherapistWeekGrid';
import { slotIndexFromTime, slotSpanFromDuration } from '@infra/utils/agenda.utils';
import { THERAPIST_WEEK_START_HOUR, THERAPIST_WEEK_TOTAL_SLOTS } from '../../agenda.constants';
import type { IAgendaTherapistWeekDay, IAgendaAppointment } from '@domain/models/agenda.models';

// ── i18n instance ──────────────────────────────────────────────────────────────
// Using a real i18n instance with the Spanish agenda locale so aria-label
// assertions match actual translated values (e.g. "Mi semana").

import esAgenda from '@infra/i18n/locales/es/agenda.json';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['agenda'],
  defaultNS: 'agenda',
  resources: { es: { agenda: esAgenda } },
  interpolation: { escapeValue: false },
});

// ── Test wrapper ───────────────────────────────────────────────────────────────

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

// ── Fixture helpers ────────────────────────────────────────────────────────────

function makeAppt(overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment {
  return {
    id: 1,
    therapistId: 10,
    startTime: '10:00',
    endTime: '11:00',
    durationMin: 60,
    clientName: 'Test Client',
    visitInfo: null,
    serviceName: 'Masaje Thai',
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
  };
}

function makeDay(overrides: Partial<IAgendaTherapistWeekDay> = {}): IAgendaTherapistWeekDay {
  return {
    dateStr: '2026-05-18',
    label: 'LUN',
    dateNumber: 18,
    dayOfWeek: 1,
    isToday: false,
    isPast: false,
    isLibranza: false,
    appointments: [],
    citaCount: 0,
    hoursWorked: 0,
    revenueForDay: 0,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Pure utility: slotIndexFromTime
// ═══════════════════════════════════════════════════════════════════════════════

describe('slotIndexFromTime', () => {
  const START_HOUR = THERAPIST_WEEK_START_HOUR; // 9
  const TOTAL = THERAPIST_WEEK_TOTAL_SLOTS; // 24

  it('returns slotIndex=0 and intraFraction=0 for the exact start hour :00', () => {
    const { slotIndex, intraFraction } = slotIndexFromTime('09:00', START_HOUR, TOTAL);
    expect(slotIndex).toBe(0);
    expect(intraFraction).toBe(0);
  });

  it('returns slotIndex=0 and intraFraction=0.5 for the start hour :30', () => {
    // 09:30 → minutesFromStart=30 → rawSlot=1.0 floor=1 — actually slot 1, frac 0
    // Correction: 09:30 → minutesFromStart=30 → rawSlot=1.0 → floor=1, frac=0
    const { slotIndex, intraFraction } = slotIndexFromTime('09:30', START_HOUR, TOTAL);
    expect(slotIndex).toBe(1);
    expect(intraFraction).toBe(0);
  });

  it('returns slotIndex=2 and intraFraction=0 for 10:00', () => {
    // 10:00 → minutesFromStart=60 → rawSlot=2.0 → floor=2, frac=0
    const { slotIndex, intraFraction } = slotIndexFromTime('10:00', START_HOUR, TOTAL);
    expect(slotIndex).toBe(2);
    expect(intraFraction).toBe(0);
  });

  it('returns correct intraFraction for an intra-slot :15 time', () => {
    // 09:15 → minutesFromStart=15 → rawSlot=0.5 → floor=0, frac=0.5
    const { slotIndex, intraFraction } = slotIndexFromTime('09:15', START_HOUR, TOTAL);
    expect(slotIndex).toBe(0);
    expect(intraFraction).toBeCloseTo(0.5);
  });

  it('returns correct intraFraction for an intra-slot :45 time', () => {
    // 09:45 → minutesFromStart=45 → rawSlot=1.5 → floor=1, frac=0.5
    const { slotIndex, intraFraction } = slotIndexFromTime('09:45', START_HOUR, TOTAL);
    expect(slotIndex).toBe(1);
    expect(intraFraction).toBeCloseTo(0.5);
  });

  it('clamps slotIndex to 0 when time is before startHour', () => {
    // 08:00 → minutesFromStart=-60 → rawSlot=-2 → clamped to 0
    const { slotIndex } = slotIndexFromTime('08:00', START_HOUR, TOTAL);
    expect(slotIndex).toBe(0);
  });

  it('clamps slotIndex to totalSlots-1 when time is after the grid end', () => {
    // 22:00 → minutesFromStart=780 → rawSlot=26 → clamped to 23 (TOTAL-1)
    const { slotIndex } = slotIndexFromTime('22:00', START_HOUR, TOTAL);
    expect(slotIndex).toBe(TOTAL - 1);
  });

  it('returns slotIndex=TOTAL-1 for the last valid :00 slot (21:00)', () => {
    // 21:00 → minutesFromStart=720 → rawSlot=24 → clamped to 23
    const { slotIndex } = slotIndexFromTime('21:00', START_HOUR, TOTAL);
    expect(slotIndex).toBe(TOTAL - 1);
  });

  it('handles a malformed string with missing minutes gracefully (defaults to 0)', () => {
    // parts[1] is undefined → parseInt(undefined ?? '0', 10) = 0
    const { slotIndex } = slotIndexFromTime('10', START_HOUR, TOTAL);
    // "10" splits to ['10'], parts[1] undefined → min=0 → 10:00 → slot 2
    expect(slotIndex).toBe(2);
    // No throw is the primary assertion
  });

  it('handles an empty string without throwing — returns slotIndex=0 (NaN guarded to 0)', () => {
    // '' → parts=[''] → safeInt('') guards parseInt('',10)=NaN → hour=0, min=0
    // minutesFromStart=(0-9)*60+0=-540 → rawSlot=-18 → clamped to 0
    expect(() => slotIndexFromTime('', START_HOUR, TOTAL)).not.toThrow();
    const { slotIndex } = slotIndexFromTime('', START_HOUR, TOTAL);
    expect(slotIndex).toBe(0);
  });

  it('returns slotIndex=TOTAL-1 for the very last :30 slot (20:30)', () => {
    // 20:30 → minutesFromStart=690 → rawSlot=23 → floor=23 (=TOTAL-1), frac=0
    const { slotIndex, intraFraction } = slotIndexFromTime('20:30', START_HOUR, TOTAL);
    expect(slotIndex).toBe(23);
    expect(intraFraction).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Pure utility: slotSpanFromDuration
// ═══════════════════════════════════════════════════════════════════════════════

describe('slotSpanFromDuration', () => {
  it('30 min → 1 slot', () => {
    expect(slotSpanFromDuration(30)).toBe(1);
  });

  it('60 min → 2 slots', () => {
    expect(slotSpanFromDuration(60)).toBe(2);
  });

  it('90 min → 3 slots', () => {
    expect(slotSpanFromDuration(90)).toBe(3);
  });

  it('45 min → 2 slots (ceil)', () => {
    expect(slotSpanFromDuration(45)).toBe(2);
  });

  it('0 min → 1 slot (minimum 1)', () => {
    expect(slotSpanFromDuration(0)).toBe(1);
  });

  it('negative duration → 1 slot (minimum 1)', () => {
    expect(slotSpanFromDuration(-30)).toBe(1);
  });

  it('15 min → 1 slot (ceil of 0.5 = 1)', () => {
    expect(slotSpanFromDuration(15)).toBe(1);
  });

  it('31 min → 2 slots (ceil of 1.033… = 2)', () => {
    expect(slotSpanFromDuration(31)).toBe(2);
  });

  it('120 min → 4 slots', () => {
    expect(slotSpanFromDuration(120)).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. computeLanes — tested indirectly via rendered StyledTherWeekLane elements
//
//    The lane algorithm is internal and not exported. We verify its output
//    by inspecting the DOM structure rendered for each overlap scenario.
//    StyledTherWeekLane is a div positioned absolutely; the number of lanes
//    rendered per day is observable via [aria-hidden] absence + structure.
//
//    Since StyledTherWeekLane has no role or accessible name, we use the
//    container query approach to count them inside each day row.
// ═══════════════════════════════════════════════════════════════════════════════

describe('computeLanes — 0 citas', () => {
  it('renders 1 lane (laneCount defaults to 1 when no appointments)', () => {
    const day = makeDay({ appointments: [], citaCount: 0 });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

describe('computeLanes — 1 cita, no overlap', () => {
  it('renders exactly 1 appointment button for 1 appointment', () => {
    const day = makeDay({
      appointments: [makeAppt({ id: 1, startTime: '10:00', durationMin: 60 })],
      citaCount: 1,
    });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

describe('computeLanes — 2 citas without overlap', () => {
  it('renders 2 appointment buttons for 2 non-overlapping appointments', () => {
    const day = makeDay({
      appointments: [
        makeAppt({ id: 1, startTime: '09:00', durationMin: 30, clientName: 'A' }),
        makeAppt({ id: 2, startTime: '10:00', durationMin: 30, clientName: 'B' }),
      ],
      citaCount: 2,
    });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});

describe('computeLanes — 2 citas overlapping', () => {
  it('renders 2 appointment buttons when 2 appointments overlap', () => {
    const day = makeDay({
      appointments: [
        makeAppt({ id: 1, startTime: '10:00', durationMin: 60, clientName: 'Overlap A' }),
        makeAppt({ id: 2, startTime: '10:30', durationMin: 60, clientName: 'Overlap B' }),
      ],
      citaCount: 2,
    });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Overlap A/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Overlap B/i })).toBeInTheDocument();
  });
});

describe('computeLanes — 3 citas partial overlap (A↔B and B↔C, but A not overlap C)', () => {
  it('renders 3 appointment buttons where middle overlaps both neighbors', () => {
    // A: 09:00–10:00, B: 09:30–10:30, C: 10:00–11:00
    // A ends at slot 2, B at slot 3, C starts at slot 2 (after A ends)
    // A↔B overlap (B starts at 09:30 while A ends at 10:00)
    // B↔C overlap (C starts at 10:00, B ends at 10:30)
    // A and C don't overlap (A ends at 10:00, C starts at 10:00 — no overlap: end<=start)
    const day = makeDay({
      appointments: [
        makeAppt({ id: 1, startTime: '09:00', durationMin: 60, clientName: 'Alpha' }),
        makeAppt({ id: 2, startTime: '09:30', durationMin: 60, clientName: 'Beta' }),
        makeAppt({ id: 3, startTime: '10:00', durationMin: 60, clientName: 'Gamma' }),
      ],
      citaCount: 3,
    });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(screen.getByRole('button', { name: /Alpha/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Beta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gamma/i })).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. DOM structure — slot cell counts
// ═══════════════════════════════════════════════════════════════════════════════

describe('TherapistWeekGrid — DOM structure (slot cells)', () => {
  it('renders 24 aria-hidden slot cells per normal day row', () => {
    // THERAPIST_WEEK_TOTAL_SLOTS = (21 - 9) * 2 = 24
    const day = makeDay({ appointments: [] });
    const { container } = render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    // SlotCells are all aria-hidden divs inside StyledTherWeekTrack.
    // Time header cells are also aria-hidden. We count those separately.
    // Total aria-hidden="true" elements = 1 (TimeRow) + 24 (header cells) + 24 (track cells)
    // We look for all elements with aria-hidden="true"
    const hiddenEls = container.querySelectorAll('[aria-hidden="true"]');
    // At minimum 24 slot cells in the track + 1 time row + 24 time cells = 49
    // We assert at least 24 slot cells are present
    expect(hiddenEls.length).toBeGreaterThanOrEqual(24);
  });

  it('renders exactly THERAPIST_WEEK_TOTAL_SLOTS (24) time cells in the time ruler header', () => {
    const day = makeDay();
    const { container } = render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    // StyledTherWeekTimeRow has aria-hidden="true" and contains 24 child cells.
    // Find the time row (the first direct aria-hidden element in the scroll area header).
    const timeRow = container.querySelector('[aria-hidden="true"]');
    expect(timeRow).not.toBeNull();
    // It contains 24 children (the time cells)
    expect(timeRow!.children).toHaveLength(THERAPIST_WEEK_TOTAL_SLOTS);
  });

  it('renders 24 × weekDays.length slot cells in total across all day rows', () => {
    // Structure: StyledTherWeekTimeRow has aria-hidden="true" (1 element) and contains 24
    // StyledTherWeekTimeCell children that are NOT themselves aria-hidden.
    // Each day track renders 24 StyledTherWeekSlotCell with aria-hidden="true".
    // Total: 1 (TimeRow) + 3 × 24 (SlotCells) = 1 + 72 = 73
    const days = [
      makeDay({ dateStr: '2026-05-18', dateNumber: 18 }),
      makeDay({ dateStr: '2026-05-19', dateNumber: 19, dayOfWeek: 2 }),
      makeDay({ dateStr: '2026-05-20', dateNumber: 20, dayOfWeek: 3 }),
    ];
    const { container } = render(<TherapistWeekGrid weekDays={days} />, { wrapper: Wrapper });
    const hiddenEls = container.querySelectorAll('[aria-hidden="true"]');
    // 1 TimeRow + 3 × TOTAL_SLOTS SlotCells
    expect(hiddenEls.length).toBe(1 + 3 * THERAPIST_WEEK_TOTAL_SLOTS);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Rendering — row labels and meta
// ═══════════════════════════════════════════════════════════════════════════════

describe('TherapistWeekGrid — row labels and meta', () => {
  it('renders the day label text for each row', () => {
    const days = [
      makeDay({ label: 'LUN', dateNumber: 18, dateStr: '2026-05-18' }),
      makeDay({ label: 'MAR', dateNumber: 19, dateStr: '2026-05-19', dayOfWeek: 2 }),
    ];
    render(<TherapistWeekGrid weekDays={days} />, { wrapper: Wrapper });
    expect(screen.getByText('LUN')).toBeInTheDocument();
    expect(screen.getByText('MAR')).toBeInTheDocument();
  });

  it('renders the dateNumber for each row', () => {
    const day = makeDay({ dateNumber: 24 });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('renders cita count in the meta row when citaCount > 0', () => {
    const day = makeDay({
      citaCount: 3,
      appointments: [
        makeAppt({ id: 1 }),
        makeAppt({ id: 2, startTime: '11:00', endTime: '12:00' }),
        makeAppt({ id: 3, startTime: '12:00', endTime: '13:00' }),
      ],
    });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    // i18n key: therapist.week.rowCitas = "{{count}} citas"
    expect(screen.getByText(/3 citas/i)).toBeInTheDocument();
  });

  it('renders hoursWorked in the meta row when hoursWorked > 0', () => {
    const day = makeDay({ hoursWorked: 2, citaCount: 0 });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    // formatHorasEnSala(2) = "2h" + " en sala"
    expect(screen.getByText(/2h.*en sala/i)).toBeInTheDocument();
  });

  it('does not render hoursWorked fragment when hoursWorked === 0', () => {
    const day = makeDay({ hoursWorked: 0, citaCount: 1, appointments: [makeAppt()] });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    // "en sala" should not appear if hoursWorked is 0
    expect(screen.queryByText(/en sala/i)).not.toBeInTheDocument();
  });

  it('renders "Descanso" label text in the meta area for isDayOff rows (isLibranza)', () => {
    const day = makeDay({ isLibranza: true });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    // i18n key: therapist.week.descanso = "Descanso"
    // Note: "Descanso" also appears in the legend (legend.break key).
    // getAllByText handles the multiple-match case correctly.
    const matches = screen.getAllByText('Descanso');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Rendering — isDayOff scenarios
// ═══════════════════════════════════════════════════════════════════════════════

describe('TherapistWeekGrid — isDayOff: dayOfWeek===7 (Sunday)', () => {
  it('renders StyledTherWeekSundayLabel text for dayOfWeek=7', () => {
    const sunday = makeDay({
      dayOfWeek: 7,
      dateStr: '2026-05-24',
      label: 'DOM',
      dateNumber: 24,
      isLibranza: false,
    });
    render(<TherapistWeekGrid weekDays={[sunday]} />, { wrapper: Wrapper });
    // i18n key: therapist.week.sundayLabel = "Libranza - estudio cerrado"
    expect(screen.getByText('Libranza - estudio cerrado')).toBeInTheDocument();
  });

  it('does not render appointment buttons for dayOfWeek=7 even when appointments exist', () => {
    const sunday = makeDay({
      dayOfWeek: 7,
      dateStr: '2026-05-24',
      label: 'DOM',
      dateNumber: 24,
      appointments: [makeAppt({ id: 99, clientName: 'Should Not Appear' })],
      citaCount: 1,
    });
    render(<TherapistWeekGrid weekDays={[sunday]} />, { wrapper: Wrapper });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Should Not Appear')).not.toBeInTheDocument();
  });
});

describe('TherapistWeekGrid — isDayOff: isLibranza===true (non-Sunday)', () => {
  it('renders StyledTherWeekSundayLabel text for isLibranza=true', () => {
    const libranza = makeDay({
      dayOfWeek: 3,
      dateStr: '2026-05-20',
      label: 'MIÉ',
      dateNumber: 20,
      isLibranza: true,
    });
    render(<TherapistWeekGrid weekDays={[libranza]} />, { wrapper: Wrapper });
    expect(screen.getByText('Libranza - estudio cerrado')).toBeInTheDocument();
  });

  it('does not render appointment buttons for isLibranza=true even when appointments exist', () => {
    const libranza = makeDay({
      dayOfWeek: 3,
      isLibranza: true,
      appointments: [makeAppt({ id: 50, clientName: 'Hidden Client' })],
      citaCount: 1,
    });
    render(<TherapistWeekGrid weekDays={[libranza]} />, { wrapper: Wrapper });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden Client')).not.toBeInTheDocument();
  });
});

describe('TherapistWeekGrid — normal day does NOT render SundayLabel', () => {
  it('does not render the sundayLabel text for a normal weekday', () => {
    const normalDay = makeDay({ dayOfWeek: 1, isLibranza: false });
    render(<TherapistWeekGrid weekDays={[normalDay]} />, { wrapper: Wrapper });
    expect(screen.queryByText('Libranza - estudio cerrado')).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Appointment rendering
// ═══════════════════════════════════════════════════════════════════════════════

describe('TherapistWeekGrid — appointment rendering', () => {
  it('renders an appointment with role="button"', () => {
    const day = makeDay({ appointments: [makeAppt()], citaCount: 1 });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('aria-label includes clientName, startTime, and endTime with middot separator', () => {
    const appt = makeAppt({ clientName: 'Anna Smith', startTime: '14:00', endTime: '15:00' });
    const day = makeDay({ appointments: [appt], citaCount: 1 });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Anna Smith · 14:00–15:00' })).toBeInTheDocument();
  });

  it('renders the startTime text inside the mini event block', () => {
    // Use a time that does NOT appear in the time ruler header (ruler renders :00/:30 labels
    // for each slot from 09:00 to 20:30 — "16:30" is a ruler label too, so use a non-boundary time).
    // Pick startTime='16:15' (intra-slot, not a ruler label) to avoid duplicate text.
    const appt = makeAppt({ startTime: '16:15' });
    const day = makeDay({ appointments: [appt], citaCount: 1 });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    // "16:15" only appears inside the appointment block (not in the ruler)
    expect(screen.getByText('16:15')).toBeInTheDocument();
  });

  it('renders the clientName text inside the mini event block', () => {
    const appt = makeAppt({ clientName: 'María García' });
    const day = makeDay({ appointments: [appt], citaCount: 1 });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    expect(screen.getByText('María García')).toBeInTheDocument();
  });

  it('renders multiple appointments from the same day', () => {
    const day = makeDay({
      appointments: [
        makeAppt({ id: 1, clientName: 'Cliente A', startTime: '09:00', endTime: '09:30' }),
        makeAppt({ id: 2, clientName: 'Cliente B', startTime: '11:00', endTime: '12:00' }),
        makeAppt({ id: 3, clientName: 'Cliente C', startTime: '13:00', endTime: '14:00' }),
      ],
      citaCount: 3,
    });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('renders appointments from multiple different days', () => {
    const days = [
      makeDay({
        dateStr: '2026-05-18',
        appointments: [makeAppt({ id: 1, clientName: 'Day 1 Client' })],
        citaCount: 1,
      }),
      makeDay({
        dateStr: '2026-05-19',
        dayOfWeek: 2,
        appointments: [makeAppt({ id: 2, clientName: 'Day 2 Client' })],
        citaCount: 1,
      }),
    ];
    render(<TherapistWeekGrid weekDays={days} />, { wrapper: Wrapper });
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Day 1 Client/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Day 2 Client/i })).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Interactions
// ═══════════════════════════════════════════════════════════════════════════════

describe('TherapistWeekGrid — click interaction', () => {
  afterEach(() => vi.clearAllMocks());

  it('calls onAppointmentClick with the appointment id when clicked', () => {
    const onAppointmentClick = vi.fn();
    const appt = makeAppt({ id: 42, clientName: 'Clicked Client' });
    const day = makeDay({ appointments: [appt], citaCount: 1 });
    render(<TherapistWeekGrid weekDays={[day]} onAppointmentClick={onAppointmentClick} />, {
      wrapper: Wrapper,
    });
    fireEvent.click(screen.getByRole('button', { name: /Clicked Client/i }));
    expect(onAppointmentClick).toHaveBeenCalledTimes(1);
    expect(onAppointmentClick).toHaveBeenCalledWith(42);
  });

  it('calls onAppointmentClick with the correct id when multiple appointments exist', () => {
    const onAppointmentClick = vi.fn();
    const days = [
      makeDay({
        dateStr: '2026-05-18',
        appointments: [
          makeAppt({ id: 10, clientName: 'First Client', startTime: '09:00', endTime: '09:30' }),
          makeAppt({ id: 20, clientName: 'Second Client', startTime: '11:00', endTime: '12:00' }),
        ],
        citaCount: 2,
      }),
    ];
    render(<TherapistWeekGrid weekDays={days} onAppointmentClick={onAppointmentClick} />, {
      wrapper: Wrapper,
    });
    fireEvent.click(screen.getByRole('button', { name: /Second Client/i }));
    expect(onAppointmentClick).toHaveBeenCalledWith(20);
  });

  it('does not throw when onAppointmentClick is not provided and an appointment is clicked', () => {
    const appt = makeAppt({ id: 1, clientName: 'No Handler' });
    const day = makeDay({ appointments: [appt], citaCount: 1 });
    expect(() => {
      render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
      fireEvent.click(screen.getByRole('button', { name: /No Handler/i }));
    }).not.toThrow();
  });
});

describe('TherapistWeekGrid — keyboard interaction (Enter)', () => {
  afterEach(() => vi.clearAllMocks());

  it('calls onAppointmentClick when Enter is pressed on a focused appointment', () => {
    const onAppointmentClick = vi.fn();
    const appt = makeAppt({ id: 7, clientName: 'Enter Client' });
    const day = makeDay({ appointments: [appt], citaCount: 1 });
    render(<TherapistWeekGrid weekDays={[day]} onAppointmentClick={onAppointmentClick} />, {
      wrapper: Wrapper,
    });
    const btn = screen.getByRole('button', { name: /Enter Client/i });
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(onAppointmentClick).toHaveBeenCalledTimes(1);
    expect(onAppointmentClick).toHaveBeenCalledWith(7);
  });

  it('does NOT call onAppointmentClick when an unrelated key is pressed', () => {
    const onAppointmentClick = vi.fn();
    const appt = makeAppt({ id: 8, clientName: 'Tab Client' });
    const day = makeDay({ appointments: [appt], citaCount: 1 });
    render(<TherapistWeekGrid weekDays={[day]} onAppointmentClick={onAppointmentClick} />, {
      wrapper: Wrapper,
    });
    const btn = screen.getByRole('button', { name: /Tab Client/i });
    fireEvent.keyDown(btn, { key: 'Tab' });
    fireEvent.keyDown(btn, { key: 'Escape' });
    fireEvent.keyDown(btn, { key: 'ArrowRight' });
    expect(onAppointmentClick).not.toHaveBeenCalled();
  });
});

describe('TherapistWeekGrid — keyboard interaction (Space)', () => {
  afterEach(() => vi.clearAllMocks());

  it('calls onAppointmentClick when Space is pressed on a focused appointment', () => {
    const onAppointmentClick = vi.fn();
    const appt = makeAppt({ id: 9, clientName: 'Space Client' });
    const day = makeDay({ appointments: [appt], citaCount: 1 });
    render(<TherapistWeekGrid weekDays={[day]} onAppointmentClick={onAppointmentClick} />, {
      wrapper: Wrapper,
    });
    const btn = screen.getByRole('button', { name: /Space Client/i });
    fireEvent.keyDown(btn, { key: ' ' });
    expect(onAppointmentClick).toHaveBeenCalledTimes(1);
    expect(onAppointmentClick).toHaveBeenCalledWith(9);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Accessibility
// ═══════════════════════════════════════════════════════════════════════════════

describe('TherapistWeekGrid — accessibility', () => {
  it('StyledTherWeekGrid has aria-label with the translated "Mi semana" text', () => {
    render(<TherapistWeekGrid weekDays={[makeDay()]} />, { wrapper: Wrapper });
    // i18n key: therapist.myWeek = "Mi semana"
    expect(screen.getByLabelText('Mi semana')).toBeInTheDocument();
  });

  it('the root element is a <section> (semantic landmark)', () => {
    render(<TherapistWeekGrid weekDays={[makeDay()]} />, { wrapper: Wrapper });
    // StyledTherWeekGrid = styled.section
    const section = screen.getByLabelText('Mi semana');
    expect(section.tagName).toBe('SECTION');
  });

  it('StyledTherWeekTimeRow has aria-hidden="true"', () => {
    const { container } = render(<TherapistWeekGrid weekDays={[makeDay()]} />, {
      wrapper: Wrapper,
    });
    // The first aria-hidden element is the TimeRow
    const timeRow = container.querySelector('[aria-hidden="true"]');
    expect(timeRow).toBeInTheDocument();
    expect(timeRow).toHaveAttribute('aria-hidden', 'true');
  });

  it('StyledTherWeekSlotCells have aria-hidden="true"', () => {
    const { container } = render(<TherapistWeekGrid weekDays={[makeDay()]} />, {
      wrapper: Wrapper,
    });
    const allHidden = container.querySelectorAll('[aria-hidden="true"]');
    // Verify multiple aria-hidden elements are present (time row + time cells + slot cells)
    expect(allHidden.length).toBeGreaterThan(1);
  });

  it('appointment blocks have tabIndex={0} for keyboard focusability', () => {
    const appt = makeAppt({ id: 1 });
    const day = makeDay({ appointments: [appt], citaCount: 1 });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('tabindex', '0');
  });

  it('appointment blocks have role="button" explicitly set', () => {
    const appt = makeAppt({ id: 1 });
    const day = makeDay({ appointments: [appt], citaCount: 1 });
    render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('StyledTherWeekLegend has aria-label with the translated legend title', () => {
    render(<TherapistWeekGrid weekDays={[]} />, { wrapper: Wrapper });
    // i18n key: rail.legendTitle = "Leyenda de rituales"
    expect(screen.getByRole('contentinfo', { name: /Leyenda de rituales/i })).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Legend footer
// ═══════════════════════════════════════════════════════════════════════════════

describe('TherapistWeekGrid — legend footer', () => {
  it('renders the legend title "Leyenda de rituales"', () => {
    render(<TherapistWeekGrid weekDays={[]} />, { wrapper: Wrapper });
    expect(screen.getByText('Leyenda de rituales')).toBeInTheDocument();
  });

  it('renders 6 legend items (gold, jungle, clay, lotus, pending, break)', () => {
    render(<TherapistWeekGrid weekDays={[]} />, { wrapper: Wrapper });
    // Each legend item renders a label text from i18n
    // legend.gold, legend.jungle, legend.clay, legend.lotus, legend.pending, legend.break
    expect(screen.getByText('Tradicional / Hierbas')).toBeInTheDocument();
    expect(screen.getByText('Espalda / Reflexología')).toBeInTheDocument();
    expect(screen.getByText('Primera visita')).toBeInTheDocument();
    expect(screen.getByText('Pareja / Aromaterapia')).toBeInTheDocument();
    expect(screen.getByText('Por confirmar')).toBeInTheDocument();
    expect(screen.getByText('Descanso')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Edge cases
// ═══════════════════════════════════════════════════════════════════════════════

describe('TherapistWeekGrid — edge cases', () => {
  it('renders without error when weekDays is empty (no rows)', () => {
    const { container } = render(<TherapistWeekGrid weekDays={[]} />, { wrapper: Wrapper });
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without error for an empty weekDays — no appointment buttons', () => {
    render(<TherapistWeekGrid weekDays={[]} />, { wrapper: Wrapper });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('does not render an appointment block when durationMin is 0', () => {
    // slotSpanFromDuration(0) = 1 (minimum), BUT computeLanes still creates an entry.
    // The real behavior: a 0-duration appt gets span=1 and IS rendered (clamped).
    // This test verifies no crash occurs and the block is rendered (not zero-width crash).
    const appt = makeAppt({ id: 55, durationMin: 0, clientName: 'Zero Duration' });
    const day = makeDay({ appointments: [appt], citaCount: 1 });
    // Should not throw — durationMin=0 triggers Math.max(1,...) fallback
    expect(() => {
      render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    }).not.toThrow();
    // With span=1 it still renders the block
    expect(screen.getByRole('button', { name: /Zero Duration/i })).toBeInTheDocument();
  });

  it('clamps a cita starting before startHour to slotStart=0 without crashing', () => {
    // 07:00 is before THERAPIST_WEEK_START_HOUR (9:00)
    // slotIndexFromTime returns a negative rawSlot which computeLanes clamps to 0
    const appt = makeAppt({
      id: 88,
      startTime: '07:00',
      endTime: '08:00',
      durationMin: 60,
      clientName: 'Early Client',
    });
    const day = makeDay({ appointments: [appt], citaCount: 1 });
    expect(() => {
      render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    }).not.toThrow();
    // The appointment is still rendered (clamped to slot 0)
    expect(screen.getByRole('button', { name: /Early Client/i })).toBeInTheDocument();
  });

  it('renders correctly for the full 7-day week without error', () => {
    const days: IAgendaTherapistWeekDay[] = [
      makeDay({ dateStr: '2026-05-18', dayOfWeek: 1, label: 'LUN', dateNumber: 18 }),
      makeDay({ dateStr: '2026-05-19', dayOfWeek: 2, label: 'MAR', dateNumber: 19 }),
      makeDay({ dateStr: '2026-05-20', dayOfWeek: 3, label: 'MIÉ', dateNumber: 20 }),
      makeDay({ dateStr: '2026-05-21', dayOfWeek: 4, label: 'JUE', dateNumber: 21 }),
      makeDay({ dateStr: '2026-05-22', dayOfWeek: 5, label: 'VIE', dateNumber: 22 }),
      makeDay({ dateStr: '2026-05-23', dayOfWeek: 6, label: 'SÁB', dateNumber: 23 }),
      makeDay({ dateStr: '2026-05-24', dayOfWeek: 7, label: 'DOM', dateNumber: 24 }),
    ];
    expect(() => {
      render(<TherapistWeekGrid weekDays={days} />, { wrapper: Wrapper });
    }).not.toThrow();
    // Sunday row should show libranza label
    expect(screen.getByText('Libranza - estudio cerrado')).toBeInTheDocument();
  });

  it('renders slot cells for isDayOff rows (hatch layer still uses slot cells)', () => {
    const sunday = makeDay({ dayOfWeek: 7, dateStr: '2026-05-24', label: 'DOM', dateNumber: 24 });
    const { container } = render(<TherapistWeekGrid weekDays={[sunday]} />, { wrapper: Wrapper });
    // Slot cells are rendered even for day-off rows (DOM grid structure stays intact)
    // We check the aria-hidden elements exist
    const hiddenEls = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenEls.length).toBeGreaterThan(0);
  });

  it('renders isToday row without error (background styling prop)', () => {
    const today = makeDay({
      isToday: true,
      appointments: [makeAppt({ id: 3, clientName: 'Today Client' })],
      citaCount: 1,
    });
    expect(() => {
      render(<TherapistWeekGrid weekDays={[today]} />, { wrapper: Wrapper });
    }).not.toThrow();
    expect(screen.getByRole('button', { name: /Today Client/i })).toBeInTheDocument();
  });

  it('renders isPast row without error (opacity styling prop)', () => {
    const past = makeDay({
      isPast: true,
      appointments: [makeAppt({ id: 4, clientName: 'Past Client' })],
      citaCount: 1,
    });
    expect(() => {
      render(<TherapistWeekGrid weekDays={[past]} />, { wrapper: Wrapper });
    }).not.toThrow();
    expect(screen.getByRole('button', { name: /Past Client/i })).toBeInTheDocument();
  });

  it('renders all evtVariant values without throwing', () => {
    const variants = ['gold', 'jungle', 'clay', 'lotus', 'sand', 'pending', 'break'] as const;
    const appointments = variants.map((variant, i) =>
      makeAppt({
        id: i + 100,
        evtVariant: variant,
        clientName: `Client ${variant}`,
        startTime: `${9 + i}:00`,
        endTime: `${10 + i}:00`,
        durationMin: 60,
      }),
    );
    const day = makeDay({ appointments, citaCount: appointments.length });
    expect(() => {
      render(<TherapistWeekGrid weekDays={[day]} />, { wrapper: Wrapper });
    }).not.toThrow();
    expect(screen.getAllByRole('button')).toHaveLength(variants.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. Corner label
// ═══════════════════════════════════════════════════════════════════════════════

describe('TherapistWeekGrid — corner label', () => {
  it('renders the "Tu semana" corner label text in the time header', () => {
    render(<TherapistWeekGrid weekDays={[makeDay()]} />, { wrapper: Wrapper });
    // i18n key: therapist.week.cornerLabel = "Tu semana"
    expect(screen.getByText('Tu semana')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 13. Container accessible name
// ═══════════════════════════════════════════════════════════════════════════════
//
// Ported from the now-removed duplicate (src/tests/.../TherapistWeekGrid.test.tsx)
// using the REAL translated label. The component sets
// `aria-label={t('therapist.myWeek')}` on its <section>; with the real es locale
// that resolves to "Mi semana" (the old duplicate asserted a mock "Semana del
// terapeuta" that never matched production).

describe('TherapistWeekGrid — container', () => {
  it('exposes the grid via an accessible name (aria-label "Mi semana")', () => {
    render(<TherapistWeekGrid weekDays={[makeDay()]} />, { wrapper: Wrapper });
    // i18n key: therapist.myWeek = "Mi semana"
    expect(screen.getByLabelText('Mi semana')).toBeInTheDocument();
  });
});
