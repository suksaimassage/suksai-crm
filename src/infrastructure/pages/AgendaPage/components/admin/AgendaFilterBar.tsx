import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { IAgendaCalendarFilters } from '@domain/models/agenda.models';
import type { TAgendaDateMode, TEstadoCita } from '@domain/types';
import { useFloatingPanel } from '@infra/hooks/useFloatingPanel';
import { Calendar } from '@infra/components/ui/common/DatePicker';
import * as DatePickerStyles from '@infra/components/ui/common/DatePicker/DatePicker.styles';
import {
  StyledFilterBar,
  StyledDatePager,
  StyledDatePagerBtn,
  StyledDatePagerLabel,
  StyledTodayChip,
  StyledSegmented,
  StyledSegmentBtn,
  StyledFilterChipGroup,
  StyledFilterSep,
  StyledFilterBarRight,
  StyledNewAppointmentButton,
} from '../../views/AdminAgendaView.styles';
import { AgendaFilterMenu, type IAgendaFilterOption } from './AgendaFilterMenu';

interface IAgendaFilterBarProps {
  readonly filters: IAgendaCalendarFilters;
  readonly centroOptions: readonly IAgendaFilterOption[];
  /** Currently active centre (id as string) — drives the centre selector. */
  readonly centroValue: string | null;
  readonly terapeutaOptions: readonly IAgendaFilterOption[];
  readonly servicioOptions: readonly IAgendaFilterOption[];
  readonly estadoOptions: readonly IAgendaFilterOption[];
  readonly optionsLoading: boolean;
  /** Hide the Nueva-cita button for users who cannot manage citas. */
  readonly canManage: boolean;
  /** Disable Nueva-cita + filters when there is no centre. */
  readonly disabled: boolean;
  readonly onDateModeChange: (mode: TAgendaDateMode) => void;
  readonly onPrevPeriod: () => void;
  readonly onNextPeriod: () => void;
  readonly onTodayClick: () => void;
  /** Called when the user picks a specific date from the calendar popup. */
  readonly onActiveDateChange: (dateStr: string) => void;
  readonly onCentroChange: (value: string | null) => void;
  readonly onTerapeutasChange: (value: readonly string[]) => void;
  readonly onServicioChange: (value: string | null) => void;
  readonly onEstadoChange: (value: TEstadoCita | null) => void;
  readonly onNewAppointment: () => void;
}

const DATE_MODES: TAgendaDateMode[] = ['day', 'week', 'month', 'list'];

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function prevLabel(mode: TAgendaDateMode, t: (k: string) => string): string {
  if (mode === 'week') return t('filter.prevWeek');
  if (mode === 'month') return t('filter.prevMonth');
  return t('filter.prevDay');
}

function nextLabel(mode: TAgendaDateMode, t: (k: string) => string): string {
  if (mode === 'week') return t('filter.nextWeek');
  if (mode === 'month') return t('filter.nextMonth');
  return t('filter.nextDay');
}

export const AgendaFilterBar = ({
  filters,
  centroOptions,
  centroValue,
  terapeutaOptions,
  servicioOptions,
  estadoOptions,
  optionsLoading,
  canManage,
  disabled,
  onDateModeChange,
  onPrevPeriod,
  onNextPeriod,
  onTodayClick,
  onActiveDateChange,
  onCentroChange,
  onTerapeutasChange,
  onServicioChange,
  onEstadoChange,
  onNewAppointment,
}: IAgendaFilterBarProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { panelRef, floatingStyles, mounted } = useFloatingPanel(triggerRef, datePickerOpen, {
    placement: 'bottom-start',
    offset: 6,
  });

  const closePicker = useCallback(() => {
    setDatePickerOpen(false);
  }, []);

  // Click-outside: close picker when clicking outside trigger + panel.
  useEffect(() => {
    if (!datePickerOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        closePicker();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [datePickerOpen, panelRef, closePicker]);

  // Escape key: close picker.
  useEffect(() => {
    if (!datePickerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePicker();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [datePickerOpen, closePicker]);

  const handleDateSelect = (date: Date) => {
    onActiveDateChange(toDateStr(date));
    closePicker();
  };

  const currentDateValue = new Date(filters.activeDate + 'T00:00:00');

  return (
    <StyledFilterBar role="toolbar" aria-label={t(`filter.${filters.dateMode}`)}>
      <StyledDatePager>
        <StyledDatePagerBtn
          onClick={() => {
            closePicker();
            onPrevPeriod();
          }}
          aria-label={prevLabel(filters.dateMode, t)}
        >
          <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M9 11L5 7l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </StyledDatePagerBtn>

        <StyledDatePagerLabel
          ref={triggerRef}
          as="button"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={datePickerOpen}
          aria-label={t('filter.openDatePicker')}
          onClick={() => {
            setDatePickerOpen((o) => !o);
          }}
        >
          {formatDisplayDate(filters.activeDate)}
        </StyledDatePagerLabel>

        <StyledDatePagerBtn
          onClick={() => {
            closePicker();
            onNextPeriod();
          }}
          aria-label={nextLabel(filters.dateMode, t)}
        >
          <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M5 11l4-4-4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </StyledDatePagerBtn>

        <StyledTodayChip
          type="button"
          onClick={() => {
            closePicker();
            onTodayClick();
          }}
          aria-label={t('filter.today')}
        >
          {t('filter.today')}
        </StyledTodayChip>
      </StyledDatePager>

      {datePickerOpen &&
        mounted &&
        createPortal(
          <DatePickerStyles.Popup
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('filter.openDatePicker')}
            style={floatingStyles}
          >
            <Calendar
              selected={currentDateValue}
              onSelect={handleDateSelect}
              onClose={closePicker}
            />
          </DatePickerStyles.Popup>,
          document.body,
        )}

      <StyledSegmented role="group" aria-label={t('filter.dateViewAriaLabel')}>
        {DATE_MODES.map((mode) => (
          <StyledSegmentBtn
            key={mode}
            $active={filters.dateMode === mode}
            aria-pressed={filters.dateMode === mode}
            onClick={() => {
              onDateModeChange(mode);
            }}
          >
            {t(`filter.${mode}`)}
          </StyledSegmentBtn>
        ))}
      </StyledSegmented>

      <StyledFilterSep aria-hidden="true" />

      <StyledFilterChipGroup role="group" aria-label={t('filter.filtersGroupAriaLabel')}>
        {!disabled && (
          <>
            <AgendaFilterMenu
              mode="single"
              label={t('filter.centro')}
              title={t('filterMenu.centroTitle')}
              options={centroOptions}
              value={centroValue}
              onChange={onCentroChange}
              isLoading={optionsLoading}
            />
            <AgendaFilterMenu
              mode="multi"
              label={t('filter.terapeutas')}
              title={t('filterMenu.terapeutasTitle')}
              options={terapeutaOptions}
              value={filters.selectedTerapeutas}
              onChange={onTerapeutasChange}
              isLoading={optionsLoading}
            />
            <AgendaFilterMenu
              mode="single"
              label={t('filter.servicio')}
              title={t('filterMenu.servicioTitle')}
              options={servicioOptions}
              value={filters.selectedServicio}
              onChange={onServicioChange}
              isLoading={optionsLoading}
            />
            <AgendaFilterMenu
              mode="single"
              label={t('filter.estado')}
              title={t('filterMenu.estadoTitle')}
              options={estadoOptions}
              value={filters.selectedEstado}
              onChange={(v) => {
                onEstadoChange(v as TEstadoCita | null);
              }}
            />
          </>
        )}
      </StyledFilterChipGroup>

      {canManage && (
        <StyledFilterBarRight>
          <StyledNewAppointmentButton
            type="button"
            onClick={onNewAppointment}
            disabled={disabled}
            aria-label={t('filter.newAppointment')}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            {t('filter.newAppointment')}
          </StyledNewAppointmentButton>
        </StyledFilterBarRight>
      )}
    </StyledFilterBar>
  );
};
