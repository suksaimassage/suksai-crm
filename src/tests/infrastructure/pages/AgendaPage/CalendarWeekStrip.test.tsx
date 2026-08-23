/**
 * CalendarWeekStrip.test.tsx
 *
 * Behaviour of the presentational week strip (the "week" zone of the
 * AgendaCalendarOverlay). Seven real `IAgendaWeekDay` are passed as props — no
 * hook mocking, no component mocking. Assertions cover: the seven day <button>
 * cells, the three redundant count channels (day number + pluralised phrase +
 * the `$empty`/`$isSelected` tint prop — CSS not asserted), day selection via
 * click, the roving-tabindex contract, keyboard focus movement that does NOT
 * select (←/→/Home/End), native <button> activation (Enter/Space → onSelectDay)
 * and the `aria-pressed` / `aria-current="date"` state.
 *
 * i18n is the real `agenda` resource (es) so the count phrase exercises the true
 * `dayCount_zero`/`_one`/`_other` keys. `react-i18next` is NOT mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type { IAgendaWeekDay } from '@domain/models/agenda.models';

import { CalendarWeekStrip } from '@infra/pages/AgendaPage/components/admin/CalendarWeekStrip';

// ── i18n ─────────────────────────────────────────────────────────────────────────

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

// ── Fixtures ───────────────────────────────────────────────────────────────────

const makeWeekDay = (overrides: Partial<IAgendaWeekDay> = {}): IAgendaWeekDay => ({
  dateStr: '2026-05-20',
  label: 'MIÉ',
  dateNumber: 20,
  appointments: [],
  isDayOff: false,
  citaCount: 0,
  isToday: false,
  ...overrides,
});

// LUN..DOM — mixed counts, one today (JUE), one day-off + empty (SÁB).
const SEVEN_DAYS: IAgendaWeekDay[] = [
  makeWeekDay({ dateStr: '2026-05-18', label: 'LUN', dateNumber: 18, citaCount: 2 }),
  makeWeekDay({ dateStr: '2026-05-19', label: 'MAR', dateNumber: 19, citaCount: 0 }),
  makeWeekDay({ dateStr: '2026-05-20', label: 'MIÉ', dateNumber: 20, citaCount: 3 }),
  makeWeekDay({ dateStr: '2026-05-21', label: 'JUE', dateNumber: 21, citaCount: 1, isToday: true }),
  makeWeekDay({ dateStr: '2026-05-22', label: 'VIE', dateNumber: 22, citaCount: 5 }),
  makeWeekDay({
    dateStr: '2026-05-23',
    label: 'SÁB',
    dateNumber: 23,
    citaCount: 0,
    isDayOff: true,
  }),
  makeWeekDay({ dateStr: '2026-05-24', label: 'DOM', dateNumber: 24, citaCount: 0 }),
];

const SELECTED = '2026-05-20'; // MIÉ

function renderStrip(
  overrides: {
    weekDays?: IAgendaWeekDay[];
    selectedDate?: string;
  } = {},
) {
  const onSelectDay = vi.fn();
  render(
    <CalendarWeekStrip
      weekDays={overrides.weekDays ?? SEVEN_DAYS}
      selectedDate={overrides.selectedDate ?? SELECTED}
      onSelectDay={onSelectDay}
    />,
    { wrapper: Wrapper },
  );
  return { onSelectDay };
}

/** The seven day cells, in DOM (visual/focus) order. */
function dayButtons(): HTMLButtonElement[] {
  const group = screen.getByRole('group', { name: 'Vista de semana' });
  return within(group).getAllByRole('button');
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Structure ──────────────────────────────────────────────────────────────────

describe('CalendarWeekStrip — structure', () => {
  it('renders a labelled group with seven day <button> cells', () => {
    renderStrip();
    const buttons = dayButtons();
    expect(buttons).toHaveLength(7);
    buttons.forEach((btn) => {
      expect(btn.tagName).toBe('BUTTON');
      expect(btn).toHaveAttribute('type', 'button');
    });
  });
});

// ── Three redundant count channels (WCAG 1.4.1) ─────────────────────────────────

describe('CalendarWeekStrip — count channels', () => {
  it('renders the day number (channel 1) and the pluralised count phrase (channel 2)', () => {
    renderStrip();
    const mie = screen.getByRole('button', { name: /^MIÉ 20,/ });
    // channel 1 — the numeric day-of-month
    expect(within(mie).getByText('20')).toBeInTheDocument();
    // channel 2 — the pluralised phrase (dayCount_other)
    expect(within(mie).getByText('3 citas')).toBeInTheDocument();
  });

  it('uses dayCount_one for a single appointment', () => {
    renderStrip();
    const jue = screen.getByRole('button', { name: /^JUE 21,/ });
    expect(within(jue).getByText('1 cita')).toBeInTheDocument();
  });

  it('uses dayCount_zero ("Sin citas") for an empty non-day-off day', () => {
    renderStrip();
    const dom = screen.getByRole('button', { name: /^DOM 24,/ });
    expect(within(dom).getByText('Sin citas')).toBeInTheDocument();
    // never the raw "0 citas" fallback
    expect(within(dom).queryByText('0 citas')).not.toBeInTheDocument();
  });

  it('renders the "—" placeholder for an empty day-off cell yet keeps the count in its name', () => {
    renderStrip();
    // channel 3 (tint) is a $empty/$isSelected transient prop — not asserted via CSS.
    const sab = screen.getByRole('button', { name: 'SÁB 23, Sin citas' });
    expect(sab).toHaveTextContent('—');
  });
});

// ── Selection state ─────────────────────────────────────────────────────────────

describe('CalendarWeekStrip — selection state', () => {
  it('marks the selected day aria-pressed and today aria-current="date"', () => {
    renderStrip();
    const selected = screen.getByRole('button', { name: /^MIÉ 20,/ });
    expect(selected).toHaveAttribute('aria-pressed', 'true');

    const today = screen.getByRole('button', { name: /^JUE 21,/ });
    expect(today).toHaveAttribute('aria-current', 'date');
    // a non-today cell has no aria-current
    expect(selected).not.toHaveAttribute('aria-current');
  });

  it('applies roving tabindex: the selected day is the only tab stop', () => {
    renderStrip();
    const buttons = dayButtons();
    buttons.forEach((btn) => {
      const isSelected = btn.getAttribute('aria-pressed') === 'true';
      expect(btn).toHaveAttribute('tabindex', isSelected ? '0' : '-1');
    });
    // exactly one tab stop
    expect(buttons.filter((b) => b.getAttribute('tabindex') === '0')).toHaveLength(1);
  });
});

// ── Selection interaction ───────────────────────────────────────────────────────

describe('CalendarWeekStrip — selection interaction', () => {
  it('clicking a day invokes onSelectDay with its dateStr', () => {
    const { onSelectDay } = renderStrip();
    fireEvent.click(screen.getByRole('button', { name: /^VIE 22,/ }));
    expect(onSelectDay).toHaveBeenCalledTimes(1);
    expect(onSelectDay).toHaveBeenCalledWith('2026-05-22');
  });

  it('native <button> activation (Enter/Space on the focused cell) selects the day', () => {
    // jsdom does not synthesise a click from a keydown, so we assert the native
    // contract: the cell is a real <button> and its activation fires onSelectDay.
    // Enter/Space keydown must NOT be swallowed by the roving handler.
    const { onSelectDay } = renderStrip();
    const dom = screen.getByRole('button', { name: /^DOM 24,/ });
    dom.focus();
    expect(document.activeElement).toBe(dom);

    fireEvent.keyDown(dom, { key: 'Enter' });
    fireEvent.keyDown(dom, { key: ' ' });
    // focus did not move (Enter/Space are not focus-movement keys)
    expect(document.activeElement).toBe(dom);

    // native activation of the focused button
    fireEvent.click(document.activeElement!);
    expect(onSelectDay).toHaveBeenCalledWith('2026-05-24');
  });
});

// ── Roving keyboard navigation (focus moves, selection does not) ────────────────

describe('CalendarWeekStrip — keyboard navigation', () => {
  it('ArrowRight / ArrowLeft move focus between cells without selecting', () => {
    const { onSelectDay } = renderStrip();
    const buttons = dayButtons();
    const selected = screen.getByRole('button', { name: /^MIÉ 20,/ }); // index 2
    selected.focus();

    fireEvent.keyDown(selected, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[3]); // JUE 21

    fireEvent.keyDown(buttons[3], { key: 'ArrowLeft' });
    fireEvent.keyDown(buttons[2], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(buttons[1]); // MAR 19

    // pure focus movement — nothing selected
    expect(onSelectDay).not.toHaveBeenCalled();
  });

  it('Home / End jump focus to the first / last cell without selecting', () => {
    const { onSelectDay } = renderStrip();
    const buttons = dayButtons();
    buttons[2].focus();

    fireEvent.keyDown(buttons[2], { key: 'End' });
    expect(document.activeElement).toBe(buttons[6]); // DOM 24

    fireEvent.keyDown(buttons[6], { key: 'Home' });
    expect(document.activeElement).toBe(buttons[0]); // LUN 18

    expect(onSelectDay).not.toHaveBeenCalled();
  });

  it('ArrowLeft at the first cell and ArrowRight at the last cell stay clamped', () => {
    renderStrip();
    const buttons = dayButtons();

    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(buttons[0]);

    buttons[6].focus();
    fireEvent.keyDown(buttons[6], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[6]);
  });
});
