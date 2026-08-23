/**
 * DatePickerCalendar — Calendario reutilizable
 *
 * SRP: renderiza el grid de días y navegación.
 * Añadido: teclado (ArrowKeys, Enter, Escape) + focus visual.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as S from './DatePicker.styles';
import { Button } from '@infra/components/ui/common/Button';

// ─── Utils ────────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetween(date: Date, start: Date, end: Date): boolean {
  const d = startOfDay(date).getTime();
  return d > startOfDay(start).getTime() && d < startOfDay(end).getTime();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Day of week of the 1st — Monday = 0 */
function firstDayOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CalendarProps {
  selected?: Date | null;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  min?: Date;
  max?: Date;
  onSelect: (date: Date) => void;
  onClose?: () => void;
  /** Mes inicial a mostrar. Si no se pasa, usa selected o hoy. */
  initialMonth?: Date;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Calendar: React.FC<CalendarProps> = ({
  selected,
  rangeStart,
  rangeEnd,
  min,
  max,
  onSelect,
  onClose,
  initialMonth,
}) => {
  const { t } = useTranslation('common');
  const base = initialMonth ?? selected ?? rangeStart ?? new Date();
  const [viewYear, setViewYear] = useState(base.getFullYear());
  const [viewMonth, setViewMonth] = useState(base.getMonth());

  // Keyboard-focused date (visual ring, not yet selected)
  const [focusedDate, setFocusedDate] = useState<Date>(
    startOfDay(selected ?? rangeStart ?? new Date()),
  );

  // Sync focused date when value changes externally
  useEffect(() => {
    if (selected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: syncs focus when external selection changes
      setFocusedDate(startOfDay(selected));
    } else if (rangeStart) {
      setFocusedDate(startOfDay(rangeStart));
    }
  }, [selected, rangeStart]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const today = startOfDay(new Date());

  // ── Navigation ──────────────────────────────────────────────────────────────

  const prevMonth = useCallback(() => {
    setViewYear((y) => (viewMonth === 0 ? y - 1 : y));
    setViewMonth((m) => (m === 0 ? 11 : m - 1));
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    setViewYear((y) => (viewMonth === 11 ? y + 1 : y));
    setViewMonth((m) => (m === 11 ? 0 : m + 1));
  }, [viewMonth]);

  // ── Ensure view month follows focusedDate ───────────────────────────────────

  const navigateTo = useCallback(
    (date: Date) => {
      setFocusedDate(date);
      if (date.getFullYear() !== viewYear || date.getMonth() !== viewMonth) {
        setViewYear(date.getFullYear());
        setViewMonth(date.getMonth());
      }
    },
    [viewMonth, viewYear],
  );

  // ── Keyboard handler ────────────────────────────────────────────────────────

  const isDisabled = useCallback(
    (d: Date) => {
      if (min && startOfDay(d) < startOfDay(min)) return true;
      if (max && startOfDay(d) > startOfDay(max)) return true;
      return false;
    },
    [min, max],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          navigateTo(addDays(focusedDate, -1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateTo(addDays(focusedDate, 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          navigateTo(addDays(focusedDate, -7));
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigateTo(addDays(focusedDate, 7));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!isDisabled(focusedDate)) onSelect(focusedDate);
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
        case 'PageUp':
          e.preventDefault();
          prevMonth();
          break;
        case 'PageDown':
          e.preventDefault();
          nextMonth();
          break;
        default:
          break;
      }
    },
    [focusedDate, isDisabled, navigateTo, nextMonth, onClose, onSelect, prevMonth],
  );

  // Auto-focus the wrap div when calendar mounts so keyboard works immediately
  useEffect(() => {
    wrapRef.current?.focus();
  }, []);

  // ── Grid ────────────────────────────────────────────────────────────────────

  const offset = firstDayOffset(viewYear, viewMonth);
  const total = getDaysInMonth(viewYear, viewMonth);
  const prevTotal = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);

  const cells: { date: Date; outside: boolean }[] = [];

  for (let i = offset - 1; i >= 0; i--) {
    const d =
      viewMonth === 0
        ? new Date(viewYear - 1, 11, prevTotal - i)
        : new Date(viewYear, viewMonth - 1, prevTotal - i);
    cells.push({ date: d, outside: true });
  }
  for (let d = 1; d <= total; d++) {
    cells.push({ date: new Date(viewYear, viewMonth, d), outside: false });
  }
  let next = 1;
  while (cells.length < 42) {
    const d =
      viewMonth === 11 ? new Date(viewYear + 1, 0, next) : new Date(viewYear, viewMonth + 1, next);
    cells.push({ date: d, outside: true });
    next++;
  }

  return (
    <S.CalendarWrap
      ref={wrapRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      role="grid"
      aria-label={`${MONTHS_ES[viewMonth]} ${viewYear}`}
    >
      {/* Header */}
      <S.CalendarHeader>
        <Button
          iconStart={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          }
          color="neutral"
          variant="filled"
          onClick={prevMonth}
          aria-label={t('datePicker.prevMonthAriaLabel')}
          type="button"
          iconOnly={true}
          size="xs"
        />

        <Button
          color="neutral"
          variant="ghost"
          size="sm"
          type="button"
          aria-live="polite"
          aria-label={`${MONTHS_ES[viewMonth]} ${viewYear}`}
          style={{ flexBasis: '60%' }}
        >
          {MONTHS_ES[viewMonth]} {viewYear}
        </Button>

        <Button
          iconStart={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          }
          color="neutral"
          variant="filled"
          onClick={nextMonth}
          aria-label={t('datePicker.nextMonthAriaLabel')}
          type="button"
          iconOnly={true}
          size="xs"
        />
      </S.CalendarHeader>

      {/* Week headers */}
      <S.WeekGrid role="row">
        {DAYS_OF_WEEK.map((d) => (
          <S.WeekDay key={d} role="columnheader" aria-label={d}>
            {d}
          </S.WeekDay>
        ))}
      </S.WeekGrid>

      {/* Day grid */}
      <S.DayGrid role="rowgroup">
        {cells.map(({ date, outside }, i) => {
          const isSelected = !!selected && isSameDay(date, selected);
          const isRangeStart = !!rangeStart && isSameDay(date, rangeStart);
          const isRangeEnd = !!rangeEnd && isSameDay(date, rangeEnd);
          const inRange = !!(rangeStart && rangeEnd && isBetween(date, rangeStart, rangeEnd));
          const isToday = isSameDay(date, today);
          const disabled = isDisabled(date);
          const isFocused = isSameDay(date, focusedDate);

          return (
            <S.Day
              key={i}
              type="button"
              role="gridcell"
              $today={isToday}
              $selected={isSelected || isRangeStart || isRangeEnd}
              $inRange={inRange}
              $rangeStart={isRangeStart}
              $rangeEnd={isRangeEnd}
              $disabled={disabled}
              $outside={outside}
              $focused={isFocused}
              aria-label={date.toLocaleDateString('es-ES')}
              aria-pressed={isSelected || isRangeStart || isRangeEnd}
              aria-selected={isSelected || isRangeStart || isRangeEnd}
              aria-disabled={disabled}
              disabled={disabled}
              tabIndex={isFocused ? 0 : -1}
              onClick={() => {
                onSelect(date);
              }}
            >
              {date.getDate()}
            </S.Day>
          );
        })}
      </S.DayGrid>
    </S.CalendarWrap>
  );
};
