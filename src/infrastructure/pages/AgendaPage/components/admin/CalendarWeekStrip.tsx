/**
 * CalendarWeekStrip — the "week" zone of the AgendaCalendarOverlay.
 *
 * Seven day cells rendered as a single roving-tabindex group (only the selected
 * day is a tab stop; ←/→ move focus, Home/End jump to Monday/Sunday, Enter/Space
 * select). Each cell surfaces the real per-day appointment count (already computed
 * by `useAdminWeekData` → `weekDays[i].citaCount`) through number + pluralised
 * label + background tint — three redundant channels (WCAG 1.4.1).
 *
 * Pure presentation: it receives `weekDays`, the `selectedDate` and an
 * `onSelectDay` callback. Week navigation (prev/next/today) lives in the overlay
 * header, outside this grid area. `memo` — a hot control re-rendered whenever the
 * day changes; the parent passes a stable `onSelectDay` (`useCallback`).
 */

import { memo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { IAgendaWeekDay } from '@domain/models/agenda.models';
import * as S from './CalendarWeekStrip.styles';

export interface ICalendarWeekStripProps {
  readonly weekDays: readonly IAgendaWeekDay[];
  readonly selectedDate: string;
  readonly onSelectDay: (dateStr: string) => void;
}

const CalendarWeekStripComponent = ({
  weekDays,
  selectedDate,
  onSelectDay,
}: ICalendarWeekStripProps) => {
  const { t } = useTranslation('agenda');
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const focusDay = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, weekDays.length - 1));
      buttonsRef.current[clamped]?.focus();
    },
    [weekDays.length],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          focusDay(index + 1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          focusDay(index - 1);
          break;
        case 'Home':
          event.preventDefault();
          focusDay(0);
          break;
        case 'End':
          event.preventDefault();
          focusDay(weekDays.length - 1);
          break;
        default:
          break;
      }
    },
    [focusDay, weekDays.length],
  );

  // Fallback tab stop: if the selected date is not in this week (shouldn't happen,
  // the week is derived from it), keep the first cell reachable by keyboard.
  const hasSelected = weekDays.some((day) => day.dateStr === selectedDate);

  return (
    <S.StyledWeekStrip role="group" aria-label={t('calendarOverlay.weekSectionLabel')}>
      {weekDays.map((day, index) => {
        const isSelected = day.dateStr === selectedDate;
        const isEmpty = day.citaCount === 0;
        const countPhrase = t('calendarOverlay.dayCount', { count: day.citaCount });
        const todaySuffix = day.isToday ? `, ${t('calendarOverlay.weekNav.today')}` : '';
        return (
          <S.StyledWeekDayButton
            key={day.dateStr}
            ref={(el) => {
              buttonsRef.current[index] = el;
            }}
            type="button"
            $isSelected={isSelected}
            $isToday={day.isToday}
            $isDayOff={day.isDayOff}
            $empty={isEmpty}
            aria-pressed={isSelected}
            aria-current={day.isToday ? 'date' : undefined}
            aria-label={`${day.label} ${day.dateNumber}, ${countPhrase}${todaySuffix}`}
            tabIndex={isSelected || (!hasSelected && index === 0) ? 0 : -1}
            onClick={() => {
              onSelectDay(day.dateStr);
            }}
            onKeyDown={(event) => {
              handleKeyDown(event, index);
            }}
          >
            <S.StyledWeekDayLabel>{day.label}</S.StyledWeekDayLabel>
            <S.StyledWeekDayNumber $isToday={day.isToday}>{day.dateNumber}</S.StyledWeekDayNumber>
            <S.StyledWeekDayCount $empty={isEmpty} $isSelected={isSelected} aria-hidden="true">
              {day.isDayOff && isEmpty ? '—' : countPhrase}
            </S.StyledWeekDayCount>
          </S.StyledWeekDayButton>
        );
      })}
    </S.StyledWeekStrip>
  );
};

export const CalendarWeekStrip = memo(CalendarWeekStripComponent);
