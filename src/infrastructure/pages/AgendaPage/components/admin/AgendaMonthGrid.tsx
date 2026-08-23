import React from 'react';
import { useTranslation } from 'react-i18next';
import type { IAgendaMonthCell, IAgendaMonthFooterKpis } from '@domain/models/agenda.models';
import { isTerminalEstado } from '@domain/index';
import {
  StyledMonth,
  StyledMonthDowRow,
  StyledMonthDowCell,
  StyledMonthGrid,
  StyledMonthCell,
  StyledMonthTodayAccentBar,
  StyledMonthCellDateRow,
  StyledMonthCellDate,
  StyledMonthCellMeta,
  StyledMonthDensityDot,
  StyledMonthCitaCountBadge,
  StyledMonthChipList,
  StyledMonthChip,
  StyledMonthChipTime,
  StyledMonthChipClient,
  StyledMonthOverflow,
  StyledMonthFooter,
  StyledMonthFooterKpi,
  StyledMonthFooterLabel,
  StyledMonthFooterValue,
  StyledMonthFooterPeaks,
  StyledMonthFooterPeakBadge,
} from './AgendaMonthGrid.styles';
import { useMonthCitaDnD, type IMonthRescheduleDrop } from './useMonthCitaDnD';

const DOW_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'] as const;

interface IAgendaMonthGridProps {
  readonly cells: readonly IAgendaMonthCell[];
  readonly footerKpis: IAgendaMonthFooterKpis;
  /** Click on a day cell (or a cita chip) → parent switches to Day view for that date. */
  readonly onDayClick: (dateStr: string) => void;
  /**
   * True if the current user may mutate citas (superadmin/recepcionista). Gates
   * whether cita chips can be picked up and dragged to another day. Defaults to
   * false so read-only consumers (and existing tests) get click-only chips.
   */
  readonly canManage?: boolean;
  /**
   * A reschedule is pending confirmation or in flight → no new drag may begin
   * (mirrors the day/week grids). Draggable chips render `not-allowed`.
   */
  readonly rescheduleBusy?: boolean;
  /**
   * Press-and-drag a chip onto a DIFFERENT day cell → parent opens the confirm
   * Dialog and persists via useRescheduleCita (the time-of-day is preserved).
   */
  readonly onRescheduleDrop?: (drop: IMonthRescheduleDrop) => void;
}

export const AgendaMonthGrid = ({
  cells,
  footerKpis,
  onDayClick,
  canManage = false,
  rescheduleBusy = false,
  onRescheduleDrop,
}: IAgendaMonthGridProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  // Pointer drag & drop (Surface A). The hook never moves the chip; on a
  // different-day drop it calls onRescheduleDrop with a self-contained snapshot.
  const { draggingId, dropTargetDateStr, registerCell, beginDrag } = useMonthCitaDnD({
    onDrop: onRescheduleDrop ?? (() => undefined),
  });

  return (
    <StyledMonth aria-label={t('month.title', { month: footerKpis.monthLabel, year: '' })}>
      {/* Weekday header */}
      <StyledMonthDowRow aria-hidden="true">
        {DOW_LABELS.map((label) => (
          <StyledMonthDowCell key={label}>{label}</StyledMonthDowCell>
        ))}
      </StyledMonthDowRow>

      {/* Calendar grid */}
      <StyledMonthGrid>
        {cells.map((cell) => (
          <StyledMonthCell
            key={cell.dateStr}
            ref={(el) => {
              registerCell(cell.dateStr, el);
            }}
            $isCurrentMonth={cell.isCurrentMonth}
            $isToday={cell.isToday}
            $isDropTarget={dropTargetDateStr === cell.dateStr && draggingId !== null}
            aria-label={
              cell.isToday
                ? t('month.cellSummaryToday', { day: cell.dateNumber, n: cell.citaCount })
                : t('month.cellSummary', { day: cell.dateNumber, n: cell.citaCount })
            }
            onClick={() => {
              onDayClick(cell.dateStr);
            }}
          >
            {cell.isToday && <StyledMonthTodayAccentBar aria-hidden="true" />}

            <StyledMonthCellDateRow>
              <StyledMonthCellDate
                $isToday={cell.isToday}
                role="button"
                tabIndex={0}
                aria-label={t('month.viewDayAriaLabel', { day: cell.dateNumber })}
                onClick={(e) => {
                  e.stopPropagation();
                  onDayClick(cell.dateStr);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDayClick(cell.dateStr);
                  }
                }}
              >
                {cell.dateNumber}
              </StyledMonthCellDate>
              <StyledMonthCellMeta>
                {cell.densityLevel > 0 && (
                  <StyledMonthDensityDot $level={cell.densityLevel} aria-hidden="true" />
                )}
                {cell.citaCount > 0 && (
                  <StyledMonthCitaCountBadge aria-hidden="true">
                    {cell.citaCount}
                  </StyledMonthCitaCountBadge>
                )}
              </StyledMonthCellMeta>
            </StyledMonthCellDateRow>

            {cell.chips.length > 0 && (
              <StyledMonthChipList>
                {cell.chips.map((chip) => {
                  // Drag eligibility mirrors the day/week grids: only authorised
                  // users may pick up a chip, terminal-estado citas stay put, and a
                  // pending/in-flight reschedule blocks a new gesture.
                  const isDraggable =
                    canManage && !rescheduleBusy && !isTerminalEstado(chip.estado);
                  return (
                    <StyledMonthChip
                      key={chip.id}
                      tabIndex={0}
                      role="button"
                      $draggable={isDraggable}
                      $dragging={draggingId === chip.id}
                      aria-label={`${chip.clientName ?? '—'} · ${chip.startTime}`}
                      onPointerDown={
                        isDraggable
                          ? (e) => {
                              beginDrag(chip, cell.dateStr, e);
                            }
                          : undefined
                      }
                      onClick={(e) => {
                        // A pure click (no drag crossed the threshold) opens Day view.
                        // stopPropagation so it doesn't ALSO bubble to the cell handler.
                        e.stopPropagation();
                        onDayClick(cell.dateStr);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onDayClick(cell.dateStr);
                        }
                      }}
                    >
                      <StyledMonthChipTime>{chip.startTime}</StyledMonthChipTime>
                      <StyledMonthChipClient>{chip.clientName ?? '—'}</StyledMonthChipClient>
                    </StyledMonthChip>
                  );
                })}
                {cell.overflowCount > 0 && (
                  <StyledMonthOverflow>
                    {t('month.overflow', { n: cell.overflowCount })}
                  </StyledMonthOverflow>
                )}
              </StyledMonthChipList>
            )}
          </StyledMonthCell>
        ))}
      </StyledMonthGrid>

      {/* Footer KPI strip */}
      <StyledMonthFooter>
        <StyledMonthFooterKpi>
          <StyledMonthFooterLabel>
            {t('month.footerCitas', {
              n: footerKpis.totalCitas,
              month: footerKpis.monthLabel,
            })}
          </StyledMonthFooterLabel>
          <StyledMonthFooterValue>{footerKpis.totalCitas}</StyledMonthFooterValue>
        </StyledMonthFooterKpi>

        {footerKpis.ocupacionPct !== null && (
          <StyledMonthFooterKpi>
            <StyledMonthFooterLabel>
              {t('month.footerOcupacion', { pct: footerKpis.ocupacionPct })}
            </StyledMonthFooterLabel>
            <StyledMonthFooterValue>{footerKpis.ocupacionPct}%</StyledMonthFooterValue>
          </StyledMonthFooterKpi>
        )}

        {footerKpis.peakDays.length > 0 && (
          <StyledMonthFooterKpi>
            <StyledMonthFooterLabel>{t('month.footerPicos')}</StyledMonthFooterLabel>
            <StyledMonthFooterPeaks>
              {footerKpis.peakDays.map((day) => (
                <StyledMonthFooterPeakBadge key={day}>{day}</StyledMonthFooterPeakBadge>
              ))}
            </StyledMonthFooterPeaks>
          </StyledMonthFooterKpi>
        )}
      </StyledMonthFooter>
    </StyledMonth>
  );
};
