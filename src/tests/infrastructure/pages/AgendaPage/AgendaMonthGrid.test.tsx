/**
 * AgendaMonthGrid.test.tsx
 *
 * Component tests for AgendaMonthGrid.
 * Mock strategy:
 *   - Purely prop-driven; no hooks to mock.
 *   - i18n: agenda namespace required (month.* and list.* keys).
 *
 * `onDayClick` is a REQUIRED prop (day-navigation feature — clicking a cell or
 * its date-number switches to Day view for that date). `renderGrid()` supplies
 * a no-op default so every pre-existing test keeps compiling; tests that care
 * about the callback pass their own vi.fn().
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { AgendaMonthGrid } from '@infra/pages/AgendaPage/components/admin/AgendaMonthGrid';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type {
  IAgendaMonthCell,
  IAgendaMonthFooterKpis,
  IAgendaMonthChipData,
} from '@domain/models/agenda.models';

// ── i18n setup ────────────────────────────────────────────────────────────────

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['agenda'],
  defaultNS: 'agenda',
  resources: { es: { agenda: esAgenda } },
  interpolation: { escapeValue: false },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeChip = (
  id: number,
  overrides: Partial<IAgendaMonthChipData> = {},
): IAgendaMonthChipData => ({
  id,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  serviceName: 'Masaje',
  estado: 'confirmada',
  clientName: `Client ${id}`,
  therapistId: 1,
  ...overrides,
});

const makeCell = (overrides: Partial<IAgendaMonthCell> = {}): IAgendaMonthCell => ({
  dateStr: '2026-05-07',
  dateNumber: 7,
  isCurrentMonth: true,
  isToday: false,
  citaCount: 0,
  densityLevel: 0,
  chips: [],
  overflowCount: 0,
  ...overrides,
});

const EMPTY_FOOTER: IAgendaMonthFooterKpis = {
  totalCitas: 0,
  monthLabel: 'MAYO',
  ocupacionPct: null,
  peakDays: [],
};

const BASE_CELL = makeCell({
  dateNumber: 7,
  citaCount: 2,
  densityLevel: 1,
  chips: [makeChip(1), makeChip(2)],
});
const TODAY_CELL = makeCell({
  dateStr: '2026-05-20',
  dateNumber: 20,
  isToday: true,
  citaCount: 1,
  densityLevel: 1,
  chips: [makeChip(3)],
});
const PREV_MONTH_CELL = makeCell({ dateStr: '2026-04-30', dateNumber: 30, isCurrentMonth: false });
const OVERFLOW_CELL = makeCell({
  dateNumber: 14,
  citaCount: 5,
  densityLevel: 2,
  chips: [makeChip(4), makeChip(5), makeChip(6)],
  overflowCount: 2,
});

/** Renders the grid with a no-op onDayClick default — override per test. */
function renderGrid(
  cells: readonly IAgendaMonthCell[],
  footerKpis: IAgendaMonthFooterKpis = EMPTY_FOOTER,
  onDayClick: (dateStr: string) => void = () => undefined,
) {
  return render(<AgendaMonthGrid cells={cells} footerKpis={footerKpis} onDayClick={onDayClick} />, {
    wrapper: Wrapper,
  });
}

// ── DOW header ────────────────────────────────────────────────────────────────

describe('AgendaMonthGrid — day-of-week header', () => {
  it('renders LUN through DOM labels', () => {
    renderGrid([]);
    ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('DOW header row is aria-hidden="true"', () => {
    const { container } = renderGrid([]);
    const hiddenRow = container.querySelector('[aria-hidden="true"]');
    expect(hiddenRow).toBeInTheDocument();
  });
});

// ── Cell rendering ────────────────────────────────────────────────────────────

describe('AgendaMonthGrid — cell rendering', () => {
  it('renders one cell per entry in cells array', () => {
    const cells = [BASE_CELL, TODAY_CELL, PREV_MONTH_CELL];
    renderGrid(cells);
    // Each cell has an aria-label with its dateNumber
    expect(screen.getByLabelText('7 · 2 citas')).toBeInTheDocument();
    expect(screen.getByLabelText('20 (hoy) · 1 citas')).toBeInTheDocument();
    expect(screen.getByLabelText('30 · 0 citas')).toBeInTheDocument();
  });

  it('non-today cell aria-label contains dateNumber and cita count without "(hoy)"', () => {
    renderGrid([BASE_CELL]);
    expect(screen.getByLabelText('7 · 2 citas')).toBeInTheDocument();
    expect(screen.queryByLabelText(/hoy/)).not.toBeInTheDocument();
  });

  it('today cell aria-label includes "(hoy)"', () => {
    renderGrid([TODAY_CELL]);
    expect(screen.getByLabelText('20 (hoy) · 1 citas')).toBeInTheDocument();
  });

  it('today cell renders accent bar (aria-hidden="true")', () => {
    const { container } = renderGrid([TODAY_CELL]);
    // Accent bar + DOW header both use aria-hidden
    const hiddenEls = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenEls.length).toBeGreaterThanOrEqual(2);
  });

  it('density dot rendered when densityLevel > 0 (aria-hidden="true")', () => {
    const { container } = renderGrid([BASE_CELL]);
    const hiddenEls = container.querySelectorAll('[aria-hidden="true"]');
    // DOW header + density dot both present
    expect(hiddenEls.length).toBeGreaterThanOrEqual(2);
  });

  it('no density dot when densityLevel === 0', () => {
    const nodens = makeCell({ densityLevel: 0 });
    const { container } = renderGrid([nodens]);
    // Only the DOW header row should be aria-hidden (not a dot)
    const hiddenEls = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenEls).toHaveLength(1); // only DOW header row
  });

  it('chip list shows startTime and clientName for each chip', () => {
    renderGrid([BASE_CELL]);
    expect(screen.getByText('Client 1')).toBeInTheDocument();
    expect(screen.getByText('Client 2')).toBeInTheDocument();
    expect(screen.getAllByText('10:00')).toHaveLength(2);
  });

  it('overflow renders "+N más" when overflowCount > 0', () => {
    renderGrid([OVERFLOW_CELL]);
    expect(screen.getByText('+2 más')).toBeInTheDocument();
  });

  it('no overflow element when overflowCount === 0', () => {
    renderGrid([BASE_CELL]);
    expect(screen.queryByText(/más/)).not.toBeInTheDocument();
  });
});

// ── Footer ────────────────────────────────────────────────────────────────────

describe('AgendaMonthGrid — footer KPIs', () => {
  it('footer shows totalCitas value', () => {
    const footer: IAgendaMonthFooterKpis = { ...EMPTY_FOOTER, totalCitas: 42 };
    renderGrid([], footer);
    // totalCitas rendered as <StyledMonthFooterValue> and also in the footerCitas label
    const matches = screen.getAllByText('42');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('footer shows ocupacion% when ocupacionPct is not null', () => {
    const footer: IAgendaMonthFooterKpis = { ...EMPTY_FOOTER, ocupacionPct: 75 };
    renderGrid([], footer);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('footer does not show ocupacion block when ocupacionPct is null', () => {
    renderGrid([]);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('footer shows peak day badges when peakDays.length > 0', () => {
    const footer: IAgendaMonthFooterKpis = { ...EMPTY_FOOTER, peakDays: [7, 14] };
    renderGrid([], footer);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('footer does not show peak section when peakDays is empty', () => {
    renderGrid([]);
    expect(screen.queryByText('PICOS DEL MES')).not.toBeInTheDocument();
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('AgendaMonthGrid — edge cases', () => {
  it('renders without error when cells array is empty', () => {
    const { container } = renderGrid([]);
    expect(container.firstChild).toBeInTheDocument();
  });
});

// ── Day-click navigation ─────────────────────────────────────────────────────
// Split target (Analyst/Designer decision, avoids interactive-in-interactive):
// the CELL itself has a plain onClick (mouse-only, no role/tabIndex); the
// DATE-NUMBER span is the real keyboard/SR-accessible trigger (role="button",
// tabIndex=0, its own onClick that stopPropagation()s so a date-number click
// doesn't ALSO bubble into the cell's own handler and double-fire).

describe('AgendaMonthGrid — day-click navigation', () => {
  it("clicking the cell background fires onDayClick with that cell's dateStr", () => {
    const onDayClick = vi.fn();
    renderGrid([BASE_CELL], EMPTY_FOOTER, onDayClick);
    fireEvent.click(screen.getByLabelText('7 · 2 citas'));
    expect(onDayClick).toHaveBeenCalledWith('2026-05-07');
    expect(onDayClick).toHaveBeenCalledTimes(1);
  });

  it('the date-number span is a separate keyboard-focusable trigger (role="button", tabIndex 0)', () => {
    renderGrid([BASE_CELL]);
    const dateBtn = screen.getByRole('button', { name: 'Ver el día 7' });
    expect(dateBtn).toHaveAttribute('tabindex', '0');
  });

  it('clicking the date-number fires onDayClick exactly once (stopPropagation — no double-fire)', () => {
    const onDayClick = vi.fn();
    renderGrid([BASE_CELL], EMPTY_FOOTER, onDayClick);
    fireEvent.click(screen.getByRole('button', { name: 'Ver el día 7' }));
    expect(onDayClick).toHaveBeenCalledWith('2026-05-07');
    expect(onDayClick).toHaveBeenCalledTimes(1);
  });

  it('Enter on the date-number fires onDayClick', () => {
    const onDayClick = vi.fn();
    renderGrid([BASE_CELL], EMPTY_FOOTER, onDayClick);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Ver el día 7' }), { key: 'Enter' });
    expect(onDayClick).toHaveBeenCalledWith('2026-05-07');
  });

  it('Space on the date-number fires onDayClick', () => {
    const onDayClick = vi.fn();
    renderGrid([BASE_CELL], EMPTY_FOOTER, onDayClick);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Ver el día 7' }), { key: ' ' });
    expect(onDayClick).toHaveBeenCalledWith('2026-05-07');
  });

  it('an unrelated key on the date-number does not fire onDayClick', () => {
    const onDayClick = vi.fn();
    renderGrid([BASE_CELL], EMPTY_FOOTER, onDayClick);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Ver el día 7' }), { key: 'a' });
    expect(onDayClick).not.toHaveBeenCalled();
  });

  it('clicking a chip inside the cell ALSO fires onDayClick (intentional bubble, not a bug)', () => {
    const onDayClick = vi.fn();
    renderGrid([BASE_CELL], EMPTY_FOOTER, onDayClick);
    fireEvent.click(screen.getByText('Client 1'));
    expect(onDayClick).toHaveBeenCalledWith('2026-05-07');
  });

  it("clicking one cell does not fire onDayClick with a DIFFERENT cell's dateStr", () => {
    const onDayClick = vi.fn();
    renderGrid([BASE_CELL, TODAY_CELL], EMPTY_FOOTER, onDayClick);
    fireEvent.click(screen.getByLabelText('20 (hoy) · 1 citas'));
    expect(onDayClick).toHaveBeenCalledWith('2026-05-20');
    expect(onDayClick).not.toHaveBeenCalledWith('2026-05-07');
  });
});

// ── Drag & drop props (Surface A) ─────────────────────────────────────────────
// The month grid accepts canManage / rescheduleBusy / onRescheduleDrop for the
// press-and-drag reschedule. Pointer-drag mechanics (target-cell hit-test, drop
// snapshot) live in useMonthCitaDnD.test.tsx (rect-stubbed harness); here we only
// assert the grid still renders and a PLAIN chip click opens Day view even when
// drag is enabled (a click never crosses the 5px threshold).

describe('AgendaMonthGrid — drag & drop wiring', () => {
  it('renders without error when the DnD props are supplied', () => {
    const { container } = render(
      <AgendaMonthGrid
        cells={[BASE_CELL]}
        footerKpis={EMPTY_FOOTER}
        onDayClick={() => undefined}
        canManage
        rescheduleBusy={false}
        onRescheduleDrop={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText('Client 1')).toBeInTheDocument();
  });

  it('a plain chip click still opens Day view when drag is enabled (canManage)', () => {
    const onDayClick = vi.fn();
    render(
      <AgendaMonthGrid
        cells={[BASE_CELL]}
        footerKpis={EMPTY_FOOTER}
        onDayClick={onDayClick}
        canManage
        rescheduleBusy={false}
        onRescheduleDrop={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByText('Client 1'));
    expect(onDayClick).toHaveBeenCalledWith('2026-05-07');
  });
});
