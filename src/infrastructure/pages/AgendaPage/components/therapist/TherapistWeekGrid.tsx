import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { IAgendaTherapistWeekDay, IAgendaAppointment } from '@domain/models/agenda.models';
import type { TCitaId, TAgendaEvtVariant } from '@domain/types';
import {
  formatHorasEnSala,
  formatHoraLabel,
  slotIndexFromTime,
  slotSpanFromDuration,
} from '@infra/utils/agenda.utils';
import {
  StyledTherWeekGrid,
  StyledTherWeekScrollArea,
  StyledTherWeekTimeHeader,
  StyledTherWeekTimeCorner,
  StyledTherWeekTimeRow,
  StyledTherWeekTimeCell,
  StyledTherWeekRows,
  StyledTherWeekRow,
  StyledTherWeekRowLabel,
  StyledTherWeekRowDayName,
  StyledTherWeekRowDayNumber,
  StyledTherWeekRowMeta,
  StyledTherWeekTrack,
  StyledTherWeekSlotCell,
  StyledTherWeekLane,
  StyledTherWeekSundayLabel,
  StyledTherMiniEvt,
  StyledTherMiniEvtTime,
  StyledTherMiniEvtClient,
  StyledTherWeekLegend,
  StyledTherWeekLegendTitle,
  StyledTherWeekLegendItems,
  StyledTherWeekLegendItem,
  StyledTherWeekLegendDot,
  StyledTherWeekLegendLabel,
} from './TherapistWeekGrid.styles';
import {
  AGENDA_SLOT_HEIGHT_PX,
  THERAPIST_WEEK_START_HOUR,
  THERAPIST_WEEK_TOTAL_SLOTS,
} from '../../agenda.constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ITherapistWeekGridProps {
  readonly weekDays: readonly IAgendaTherapistWeekDay[];
  readonly onAppointmentClick?: (id: TCitaId) => void;
}

interface ILanedAppointment {
  readonly appt: IAgendaAppointment;
  readonly laneIndex: number;
  readonly laneCount: number;
  readonly slotStart: number;
  readonly slotEnd: number;
  readonly intraOffset: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SLOT_WIDTH_PX = AGENDA_SLOT_HEIGHT_PX;
const TRACK_WIDTH = THERAPIST_WEEK_TOTAL_SLOTS * SLOT_WIDTH_PX;
const MAX_ANIM_DELAY_MS = 150;

const LEGEND_ITEMS: readonly { variant: TAgendaEvtVariant; i18nKey: string }[] = [
  { variant: 'gold', i18nKey: 'legend.gold' },
  { variant: 'jungle', i18nKey: 'legend.jungle' },
  { variant: 'clay', i18nKey: 'legend.clay' },
  { variant: 'lotus', i18nKey: 'legend.lotus' },
  { variant: 'pending', i18nKey: 'legend.pending' },
  { variant: 'break', i18nKey: 'legend.break' },
];

// ── Lane assignment algorithm (greedy interval coloring) ──────────────────────

/**
 * Assigns each appointment to a horizontal lane so overlapping appointments
 * are displayed in separate rows within the same day swimlane.
 *
 * Algorithm:
 * 1. Derive slotStart / slotEnd for each appointment (clamped to valid range).
 * 2. Sort by slotStart ascending.
 * 3. Greedy lane assignment: for each appointment, find the first lane whose
 *    last occupied slotEnd <= current slotStart. If none exists, open a new lane.
 * 4. Patch each entry with the final total laneCount.
 */
function computeLanes(
  appointments: readonly IAgendaAppointment[],
  startHour: number,
  totalSlots: number,
): ILanedAppointment[] {
  if (appointments.length === 0) return [];

  const withBounds = appointments.map((appt) => {
    const { slotIndex, intraFraction } = slotIndexFromTime(appt.startTime, startHour, totalSlots);
    const span = slotSpanFromDuration(appt.durationMin);
    const slotStart = Math.max(0, Math.min(slotIndex, totalSlots - 1));
    const slotEnd = Math.max(1, Math.min(slotStart + span, totalSlots));
    return { appt, slotStart, slotEnd, intraOffset: intraFraction };
  });

  withBounds.sort((a, b) => a.slotStart - b.slotStart);

  // laneEnds[i] = the slotEnd of the last appointment placed in lane i
  const laneEnds: number[] = [];
  const laneAssignments: number[] = [];

  for (const item of withBounds) {
    let assignedLane = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      const end = laneEnds[i];
      if (end <= item.slotStart) {
        assignedLane = i;
        break;
      }
    }
    if (assignedLane === -1) {
      assignedLane = laneEnds.length;
      laneEnds.push(item.slotEnd);
    } else {
      laneEnds[assignedLane] = item.slotEnd;
    }
    laneAssignments.push(assignedLane);
  }

  const laneCount = laneEnds.length;

  return withBounds.map((item, idx) => ({
    appt: item.appt,
    laneIndex: laneAssignments[idx],
    laneCount,
    slotStart: item.slotStart,
    slotEnd: item.slotEnd,
    intraOffset: item.intraOffset,
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────

const TherapistWeekGridInner = ({
  weekDays,
  onAppointmentClick,
}: ITherapistWeekGridProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  const slots = Array.from({ length: THERAPIST_WEEK_TOTAL_SLOTS }, (_, i) => i);

  // Pre-compute lane assignments for all days once per weekDays change (O(n log n)
  // per day). useMemo: consumer is memo(TherapistWeekGrid) — avoids re-running the
  // greedy interval-coloring algorithm when only unrelated parent state flips.
  // Compiler is NOT enabled — see project_react_compiler_not_active.
  const lanedByDay = useMemo(
    () =>
      weekDays.map((day) => {
        const isDayOff = day.dayOfWeek === 7 || day.isLibranza;
        const lanedAppts = isDayOff
          ? []
          : computeLanes(day.appointments, THERAPIST_WEEK_START_HOUR, THERAPIST_WEEK_TOTAL_SLOTS);
        const laneCount = lanedAppts.length > 0 ? (lanedAppts[0]?.laneCount ?? 1) : 1;
        return { day, isDayOff, lanedAppts, laneCount };
      }),
    [weekDays],
  );

  return (
    <StyledTherWeekGrid aria-label={t('therapist.myWeek')}>
      <StyledTherWeekScrollArea>
        {/* ── Time ruler header ──────────────────────────────────────────── */}
        <StyledTherWeekTimeHeader $trackWidth={TRACK_WIDTH}>
          <StyledTherWeekTimeCorner>{t('therapist.week.cornerLabel')}</StyledTherWeekTimeCorner>

          <StyledTherWeekTimeRow
            $slotCount={THERAPIST_WEEK_TOTAL_SLOTS}
            $slotWidthPx={SLOT_WIDTH_PX}
            aria-hidden="true"
          >
            {slots.map((slot) => {
              const isHour = slot % 2 === 0;
              const isLast = slot === THERAPIST_WEEK_TOTAL_SLOTS - 1;
              return (
                <StyledTherWeekTimeCell key={slot} $isHour={isHour} $isLast={isLast}>
                  {formatHoraLabel(slot, THERAPIST_WEEK_START_HOUR)}
                </StyledTherWeekTimeCell>
              );
            })}
          </StyledTherWeekTimeRow>
        </StyledTherWeekTimeHeader>

        {/* ── Day swimlane rows ──────────────────────────────────────────── */}
        <StyledTherWeekRows>
          {lanedByDay.map(({ day, isDayOff, lanedAppts, laneCount }) => (
            <StyledTherWeekRow key={day.dateStr} $trackWidth={TRACK_WIDTH} $laneCount={laneCount}>
              {/* ── Row label (sticky left) ─────────────────────────── */}
              {/* $isToday/$isDayOff let the sticky label paint the SAME band
                    as the track so the tint reads as one continuous strip. */}
              <StyledTherWeekRowLabel $isToday={day.isToday} $isDayOff={isDayOff}>
                <StyledTherWeekRowDayName $tinted={day.isToday || isDayOff}>
                  {day.label}
                </StyledTherWeekRowDayName>
                <StyledTherWeekRowDayNumber $isToday={day.isToday && !isDayOff}>
                  {day.dateNumber}
                </StyledTherWeekRowDayNumber>
                {isDayOff ? (
                  <StyledTherWeekRowMeta $isDayOff>
                    {t('therapist.week.descanso')}
                  </StyledTherWeekRowMeta>
                ) : (
                  <StyledTherWeekRowMeta $isToday={day.isToday}>
                    {t('therapist.week.rowCitas', { count: day.citaCount })}
                    {day.hoursWorked > 0 &&
                      ` + ${formatHorasEnSala(day.hoursWorked)} ${t('therapist.week.rowHoras')}`}
                  </StyledTherWeekRowMeta>
                )}
              </StyledTherWeekRowLabel>

              {/* ── Horizontal swimlane track ───────────────────────── */}
              <StyledTherWeekTrack $isDayOff={isDayOff} $isToday={day.isToday} $isPast={day.isPast}>
                {/* Absolutely positioned slot cells — span full track height */}
                {slots.map((slot) => (
                  <StyledTherWeekSlotCell
                    key={slot}
                    $slotIndex={slot}
                    $slotWidthPx={SLOT_WIDTH_PX}
                    $isHour={slot % 2 === 0}
                    $isLast={slot === THERAPIST_WEEK_TOTAL_SLOTS - 1}
                    aria-hidden="true"
                  />
                ))}

                {/* Day-off label centered over the hatch */}
                {isDayOff && (
                  <StyledTherWeekSundayLabel>
                    {t('therapist.week.sundayLabel')}
                  </StyledTherWeekSundayLabel>
                )}

                {/* Event lanes — one absolute layer per lane index */}
                {Array.from({ length: laneCount }, (_, laneIdx) => {
                  const laneAppts = lanedAppts.filter((la) => la.laneIndex === laneIdx);
                  return (
                    <StyledTherWeekLane key={laneIdx} $laneIndex={laneIdx} $laneCount={laneCount}>
                      {laneAppts.map(({ appt, slotStart, intraOffset }) => {
                        const span = slotSpanFromDuration(appt.durationMin);
                        const delay = Math.min(laneIdx * 30 + slotStart * 3, MAX_ANIM_DELAY_MS);
                        return (
                          <StyledTherMiniEvt
                            key={appt.id}
                            $variant={appt.evtVariant}
                            $slotStart={slotStart}
                            $slotSpan={span}
                            $intraOffset={intraOffset}
                            $slotWidthPx={SLOT_WIDTH_PX}
                            $delay={delay}
                            tabIndex={0}
                            role="button"
                            aria-label={`${appt.clientName ?? '—'} · ${appt.startTime}–${appt.endTime}`}
                            onClick={() => onAppointmentClick?.(appt.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onAppointmentClick?.(appt.id);
                              }
                            }}
                          >
                            <StyledTherMiniEvtTime>{appt.startTime}</StyledTherMiniEvtTime>
                            <StyledTherMiniEvtClient>
                              {appt.clientName ?? '—'}
                            </StyledTherMiniEvtClient>
                          </StyledTherMiniEvt>
                        );
                      })}
                    </StyledTherWeekLane>
                  );
                })}
              </StyledTherWeekTrack>
            </StyledTherWeekRow>
          ))}
        </StyledTherWeekRows>
      </StyledTherWeekScrollArea>

      {/* ── Legend footer ──────────────────────────────────────────────── */}
      <StyledTherWeekLegend aria-label={t('rail.legendTitle')}>
        <StyledTherWeekLegendTitle>{t('rail.legendTitle')}</StyledTherWeekLegendTitle>
        <StyledTherWeekLegendItems>
          {LEGEND_ITEMS.map(({ variant, i18nKey }) => (
            <StyledTherWeekLegendItem key={variant}>
              <StyledTherWeekLegendDot $variant={variant} />
              <StyledTherWeekLegendLabel>{t(i18nKey)}</StyledTherWeekLegendLabel>
            </StyledTherWeekLegendItem>
          ))}
        </StyledTherWeekLegendItems>
      </StyledTherWeekLegend>
    </StyledTherWeekGrid>
  );
};

/**
 * memo(): the week grid runs computeLanes (O(n log n)) per day row on every render.
 * Wrapping prevents those recomputations when parent state unrelated to weekDays
 * changes (e.g. a KPI refetch in TherapistAgendaView). The lanedByDay useMemo
 * above is the key work-avoider; memo() ensures it is only run when props change.
 * Compiler is NOT enabled — see project_react_compiler_not_active.
 */
export const TherapistWeekGrid = memo(TherapistWeekGridInner);
