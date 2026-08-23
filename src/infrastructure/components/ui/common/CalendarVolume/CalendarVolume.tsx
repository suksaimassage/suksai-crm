import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ICalendarVolumeProps, IGridCell, TCalendarView } from './CalendarVolume.types';
import { useCalendarVolume } from './useCalendarVolume';
import { useTimeGrid, toISODateKey, formatHourLabel } from './useTimeGrid';
import { useHeatmapScale } from './useHeatmapScale';
import { useResponsiveGrid } from './useResponsiveGrid';
import { HeatmapCell } from './HeatmapCell';
import {
  SCard,
  SHeader,
  STitle,
  SMoreButton,
  SControls,
  SViewToggle,
  SViewButton,
  SNavButton,
  SDateButton,
  SBody,
  SGridWrapper,
  SGrid,
  SDayHeader,
  SDayHeaderToday,
  STimeLabel,
  SCornerCell,
  SSidePanel,
  SSectionTitle,
  SBusyList,
  SBusyItem,
  SBusyLabel,
  SBusyCount,
  SMobileSummary,
  SMobileSummaryChip,
  SLegend,
  SLegendBar,
  SLegendLabels,
} from './CalendarVolume.styles';

// ─── Icon primitives (inline SVG, zero deps) ──────────────────────────────────

const CalIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ChevronDown = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronLeft = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const MoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
);

// ─── Day-of-week key map (JS getDay() index 0=Sun..6=Sat → i18n key) ─────────

const DAY_KEY_BY_JS_INDEX = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export const CalendarVolume: React.FC<ICalendarVolumeProps> = ({
  data = [],
  view: controlledView,
  defaultView = 'week',
  selectedDate: controlledDate,
  defaultDate,
  startHour = 9,
  endHour = 18,
  title,
  showInsights,
  insightsCount = 3,
  compact = false,
  onCellClick,
  onCellHover,
  onCellFocus,
  onCellBlur,
  onRangeSelect,
  onViewChange,
  onDayChange,
  onWeekChange,
  renderCell,
  renderHeader,
  className,
  'aria-label': ariaLabel,
}) => {
  const { t } = useTranslation(['dashboard', 'common']);

  // ── Responsive container ───────────────────────────────────────────────────
  const { containerRef, isMobile } = useResponsiveGrid();

  // ── Core state + stable dispatchers ───────────────────────────────────────
  const {
    view,
    selectedDate,
    dateLabel,
    todayKey,
    handleViewChange,
    handleNavigate,
    buildCellEventProps,
    deriveBusySlots,
  } = useCalendarVolume({
    view: controlledView,
    defaultView,
    selectedDate: controlledDate,
    defaultDate,
    insightsCount,
    onCellClick,
    onCellHover,
    onCellFocus,
    onCellBlur,
    onRangeSelect,
    onViewChange,
    onDayChange,
    onWeekChange,
  });

  // ── Localized, Monday-first day labels (reactive to active language) ───────
  const dayShortLabels: Record<number, string> = {};
  const dayFullLabels: Record<number, string> = {};
  // Mobile uses 2-char siglas (e.g. "Lu" "Ma" "Mi") to fit 30 px columns.
  // text-transform:uppercase in SDayHeader renders them as "LU" "MA" "MI" etc.
  const dayMobileLabels: Record<number, string> = {};
  for (let i = 0; i < 7; i++) {
    const key = DAY_KEY_BY_JS_INDEX[i];
    dayShortLabels[i] = t(`dashboard:heatmap.days.${key}`);
    dayFullLabels[i] = t(`dashboard:heatmap.daysFull.${key}`);
    dayMobileLabels[i] = dayShortLabels[i].slice(0, 2);
  }

  // ── Grid data ──────────────────────────────────────────────────────────────
  const { timeSlots, days, cellMap, maxValue } = useTimeGrid({
    view,
    startHour,
    endHour,
    selectedDate,
    data,
    dayShortLabels: isMobile ? dayMobileLabels : dayShortLabels,
    dayFullLabels,
  });

  // ── Color scale ────────────────────────────────────────────────────────────
  const heatmap = useHeatmapScale(maxValue);

  // ── Selected cell tracking (local highlight) ───────────────────────────────
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // ── Cell event handlers ────────────────────────────────────────────────────
  const handleCellClick = (cell: IGridCell, el: HTMLElement | null) => {
    const key = `${cell.day}__${cell.hour}`;
    setSelectedKey((prev) => (prev === key ? null : key));
    onCellClick?.({
      day: cell.day,
      dayLabel: cell.dayLabel,
      hour: cell.hour,
      value: cell.value,
      element: el,
    });
  };

  const handleCellMouseEnter = (cell: IGridCell, el: HTMLElement | null) => {
    onCellHover?.({
      day: cell.day,
      dayLabel: cell.dayLabel,
      hour: cell.hour,
      value: cell.value,
      element: el,
    });
  };

  const handleCellFocus = (cell: IGridCell, el: HTMLElement | null) => {
    onCellFocus?.({
      day: cell.day,
      dayLabel: cell.dayLabel,
      hour: cell.hour,
      value: cell.value,
      element: el,
    });
  };

  const handleCellBlur = (cell: IGridCell, el: HTMLElement | null) => {
    onCellBlur?.({
      day: cell.day,
      dayLabel: cell.dayLabel,
      hour: cell.hour,
      value: cell.value,
      element: el,
    });
  };

  // ── View change with selection reset ──────────────────────────────────────
  const handleViewChangeWithReset = (v: TCalendarView) => {
    handleViewChange(v);
    setSelectedKey(null);
  };

  // ── Busy slots ─────────────────────────────────────────────────────────────
  const busySlots = deriveBusySlots(cellMap);

  // ── Sidebar visibility ─────────────────────────────────────────────────────
  const sidebarVisible = showInsights ?? !isMobile;

  // ── i18n helpers ──────────────────────────────────────────────────────────
  const prevLabel =
    view === 'day' ? t('dashboard:calendarVolume.prevDay') : t('dashboard:calendarVolume.prevWeek');
  const nextLabel =
    view === 'day' ? t('dashboard:calendarVolume.nextDay') : t('dashboard:calendarVolume.nextWeek');

  // Title shown in the default header; the `title` prop overrides the i18n default.
  const resolvedTitle = title ?? t('dashboard:calendarVolume.title');

  void buildCellEventProps;

  return (
    <SCard
      ref={containerRef}
      $compact={compact}
      className={className}
      aria-label={ariaLabel ?? t('dashboard:calendarVolume.ariaLabel')}
    >
      {/* Header: a custom `renderHeader` fully replaces the default title + more
          options affordance; otherwise the default SHeader is rendered. */}
      {renderHeader ? (
        renderHeader({ title: resolvedTitle, view, onViewChange: handleViewChangeWithReset })
      ) : (
        <SHeader>
          <STitle>{resolvedTitle}</STitle>
          <SMoreButton type="button" aria-label={t('dashboard:calendarVolume.moreOptions')}>
            <MoreIcon />
          </SMoreButton>
        </SHeader>
      )}

      {!compact && (
        <SControls>
          <SViewToggle role="group" aria-label={t('dashboard:calendarVolume.viewToggleLabel')}>
            {(['day', 'week'] as TCalendarView[]).map((v) => (
              <SViewButton
                key={v}
                $active={view === v}
                onClick={() => {
                  handleViewChangeWithReset(v);
                }}
                aria-pressed={view === v}
                type="button"
              >
                {v === 'day'
                  ? t('dashboard:calendarVolume.viewDay')
                  : t('dashboard:calendarVolume.viewWeek')}
              </SViewButton>
            ))}
          </SViewToggle>

          <SNavButton
            onClick={() => {
              handleNavigate(-1);
            }}
            aria-label={prevLabel}
            type="button"
          >
            <ChevronLeft />
          </SNavButton>

          <SDateButton
            disabled
            aria-disabled="true"
            aria-label={t('dashboard:calendarVolume.currentPeriod', { dateLabel })}
            aria-live="polite"
            type="button"
          >
            <CalIcon />
            <span>{dateLabel}</span>
            <ChevronDown />
          </SDateButton>

          <SNavButton
            onClick={() => {
              handleNavigate(1);
            }}
            aria-label={nextLabel}
            type="button"
          >
            <ChevronRight />
          </SNavButton>
        </SControls>
      )}

      <SBody>
        <SGridWrapper>
          <SGrid
            $cols={days.length}
            role="grid"
            aria-label={t('dashboard:calendarVolume.ariaLabel')}
            aria-rowcount={timeSlots.length + 1}
            aria-colcount={days.length + 1}
          >
            <SCornerCell
              role="columnheader"
              aria-label={t('common:calendarVolume.timeAriaLabel')}
            />

            {days.map(({ key, label, fullLabel, date }) => {
              const isToday = toISODateKey(date) === todayKey;
              const DayH = isToday ? SDayHeaderToday : SDayHeader;
              return (
                <DayH key={key} role="columnheader" aria-label={fullLabel}>
                  {label}
                </DayH>
              );
            })}

            {timeSlots.map(({ hour, label: hourLabel }) => (
              <React.Fragment key={hour}>
                <STimeLabel role="rowheader">{hourLabel}</STimeLabel>

                {days.map(({ key, fullLabel }) => {
                  const mapKey = `${key}__${hour}`;
                  const cell = cellMap.get(mapKey) ?? {
                    day: key,
                    dayLabel: fullLabel,
                    hour,
                    value: 0,
                    intensity: 0,
                  };
                  const bgColor = heatmap.getColor(cell.intensity);
                  const textColor = heatmap.getTextColor(cell.intensity);
                  const isSelected = selectedKey === mapKey;

                  return (
                    <HeatmapCell
                      key={mapKey}
                      cell={cell}
                      bgColor={bgColor}
                      textColor={textColor}
                      isSelected={isSelected}
                      renderCell={renderCell}
                      ariaLabel={t('dashboard:calendarVolume.cellAriaLabel', {
                        dayLabel: cell.dayLabel,
                        hourLabel: formatHourLabel(cell.hour),
                        count: cell.value,
                      })}
                      onCellClick={handleCellClick}
                      onCellMouseEnter={handleCellMouseEnter}
                      onCellFocus={handleCellFocus}
                      onCellBlur={handleCellBlur}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </SGrid>
        </SGridWrapper>

        <SSidePanel
          $forceVisible={sidebarVisible}
          aria-label={t('dashboard:calendarVolume.insightsLabel')}
        >
          <div>
            <SSectionTitle>{t('dashboard:calendarVolume.busyTimesTitle')}</SSectionTitle>
            <SBusyList aria-label={t('dashboard:calendarVolume.peakSlotsLabel')}>
              {busySlots.length > 0 ? (
                busySlots.map((slot, i) => (
                  <SBusyItem key={i}>
                    <SBusyLabel>{slot.label}</SBusyLabel>
                    <SBusyCount>
                      {t('dashboard:calendarVolume.appointmentCount', { count: slot.count })}
                    </SBusyCount>
                  </SBusyItem>
                ))
              ) : (
                <SBusyItem>
                  <SBusyCount>{t('dashboard:calendarVolume.noData')}</SBusyCount>
                </SBusyItem>
              )}
            </SBusyList>
          </div>

          <div>
            <SSectionTitle>{t('dashboard:calendarVolume.colorKeyTitle')}</SSectionTitle>
            <SLegend>
              <SLegendBar
                $gradientCss={heatmap.gradientCss}
                role="img"
                aria-label={t('dashboard:calendarVolume.legendAriaLabel', { maxValue })}
              />
              <SLegendLabels aria-hidden="true">
                <span>{t('dashboard:calendarVolume.legendMin')}</span>
                <span>{t('dashboard:calendarVolume.legendMax')}</span>
              </SLegendLabels>
            </SLegend>
          </div>
        </SSidePanel>
      </SBody>

      {isMobile && !sidebarVisible && busySlots.length > 0 && (
        <SMobileSummary aria-label={t('dashboard:calendarVolume.peakTimesLabel')}>
          {busySlots.map((slot, i) => (
            <SMobileSummaryChip key={i}>
              <SBusyLabel>{slot.label}</SBusyLabel>
              <SBusyCount>
                {t('dashboard:calendarVolume.appointmentCountShort', { count: slot.count })}
              </SBusyCount>
            </SMobileSummaryChip>
          ))}
        </SMobileSummary>
      )}
    </SCard>
  );
};

export default CalendarVolume;
