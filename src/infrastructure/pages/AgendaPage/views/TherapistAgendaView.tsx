import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TAgendaTherapistDateMode, TUserId, TCitaId } from '@domain/types';
import type { IAgendaAppointment } from '@domain/models/agenda.models';
import { CitaQuickEditModal } from '@infra/components/ui/domain/modals';
import { useUserStore } from '@app/stores/useUserStore';
import { useDashboardCentroId } from '@infra/hooks/useDashboardCentroId';
import { useCentroMasajistas } from '@infra/hooks/useCentroMasajistas';
import { useTherapistAgendaData } from '@infra/hooks/useTherapistAgendaData';
import { useTherapistWeekData } from '@infra/hooks/useTherapistWeekData';
import { TherapistHeroBanner } from '../components/therapist/TherapistHeroBanner';
import { TherapistTimeline } from '../components/therapist/TherapistTimeline';
import { TherapistRail } from '../components/therapist/TherapistRail';
import { TherapistWeekBanner } from '../components/therapist/TherapistWeekBanner';
import { TherapistWeekGrid } from '../components/therapist/TherapistWeekGrid';
import { TherapistWeekRail } from '../components/therapist/TherapistWeekRail';
import { AgendaTherapistSelector } from '../components/shared/AgendaTherapistSelector';
import {
  StyledTherGrid,
  StyledTherapistFilterStrip,
  StyledModeEmptyState,
} from './TherapistAgendaView.styles';
import { StyledSegmented, StyledSegmentBtn } from './AdminAgendaView.styles';
import { getWeekStart, getTodayKey } from '@infra/utils/agenda.utils';

const DATE_MODES: TAgendaTherapistDateMode[] = ['day', 'week'];

export const TherapistAgendaView = (): React.ReactElement => {
  const { t } = useTranslation('agenda');
  const user = useUserStore((s) => s.user);
  const [therapistDateMode, setTherapistDateMode] = useState<TAgendaTherapistDateMode>('day');
  // No Prev/Next/Today control exists in this view — always "today".
  const activeDate = getTodayKey();
  // Admin-selected therapist (overrides own id); null = show own agenda.
  const [selectedTherapistId, setSelectedTherapistId] = useState<TUserId | null>(null);
  const [selectorAnnounce, setSelectorAnnounce] = useState('');
  // Quick-edit modal target — one modal instance serves both Mi Día and Mi Semana.
  const [quickEditAppt, setQuickEditAppt] = useState<IAgendaAppointment | null>(null);

  const isAdmin = (user?.roles ?? []).some((r) => r === 'superadmin' || r === 'recepcionista');

  const { centroId } = useDashboardCentroId(user?.id ?? null);
  const { masajistas, isLoading: masajistasLoading } = useCentroMasajistas(
    isAdmin ? centroId : null,
  );

  // The therapist whose agenda is shown: admin pick takes precedence, else own.
  const therapistId: TUserId | null = isAdmin ? selectedTherapistId : (user?.id ?? null);
  const ownName = user?.nombre ?? '';
  const therapistName =
    isAdmin && selectedTherapistId !== null
      ? (masajistas.find((m) => m.id === selectedTherapistId)?.nombre ?? ownName)
      : ownName;

  // Day view data
  const { appointments, stats, notes, reviews, sala, isLoading } = useTherapistAgendaData(
    therapistId,
    activeDate,
  );

  // Week view data — weekStart is derived from activeDate
  const weekStartStr = getWeekStart(activeDate);
  const {
    weekDays,
    balance,
    isLoading: isWeekLoading,
  } = useTherapistWeekData(therapistId, weekStartStr);

  // Derive the most-performed service this week from enriched appointments.
  const masajeMasRealizado: string = (() => {
    const counts: Record<string, number> = {};
    weekDays.forEach((day) => {
      day.appointments.forEach((apt) => {
        if (
          apt.evtVariant !== 'break' &&
          apt.evtVariant !== 'sand' &&
          apt.estado !== 'cancelada' &&
          apt.estado !== 'no_presentado'
        ) {
          counts[apt.serviceName] = (counts[apt.serviceName] ?? 0) + 1;
        }
      });
    });
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    const top = sorted[0];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard: sorted may be empty despite TS typing sorted[0] as non-undefined (noUncheckedIndexedAccess not enabled)
    return top !== undefined ? top[0] : '—';
  })();

  const weekMasajesCount = balance.citasTotal;

  const handleModeChange = (mode: TAgendaTherapistDateMode) => {
    setTherapistDateMode(mode);
  };

  // ── Quick-edit open handlers ──────────────────────────────────────────────
  // Mi Día: the cita lives in the flat `appointments` list.
  const handleDayApptClick = (id: TCitaId) => {
    setQuickEditAppt(appointments.find((a) => a.id === id) ?? null);
  };

  // Mi Semana: search across every day's appointments. Break/non-cita rows are
  // never opened (the grid only wires real citas, but guard defensively).
  const handleWeekApptClick = (id: TCitaId) => {
    const appt = weekDays.flatMap((d) => d.appointments).find((a) => a.id === id);
    if (appt && appt.evtVariant !== 'break') {
      setQuickEditAppt(appt);
    }
  };

  return (
    <>
      {therapistDateMode === 'week' ? (
        <TherapistWeekBanner therapistName={therapistName} balance={balance} />
      ) : (
        <TherapistHeroBanner
          therapistName={therapistName}
          sala={sala}
          date={activeDate}
          stats={stats}
          notes={notes}
          weekMasajesCount={weekMasajesCount}
          masajeMasRealizado={masajeMasRealizado}
        />
      )}

      <StyledTherapistFilterStrip role="toolbar" aria-label={t('therapist.viewModeAriaLabel')}>
        <StyledSegmented role="group" aria-label={t('therapist.viewGroupAriaLabel')}>
          {DATE_MODES.map((mode) => (
            <StyledSegmentBtn
              key={mode}
              $active={therapistDateMode === mode}
              aria-pressed={therapistDateMode === mode}
              onClick={() => {
                handleModeChange(mode);
              }}
            >
              {mode === 'day' ? t('therapist.myDay') : t('therapist.myWeek')}
            </StyledSegmentBtn>
          ))}
        </StyledSegmented>

        {/* Admin-only: pick which therapist's agenda to view + manage (§1.9). */}
        {isAdmin && (
          <AgendaTherapistSelector
            masajistas={masajistas}
            value={selectedTherapistId}
            isLoading={masajistasLoading}
            onChange={(id) => {
              setSelectedTherapistId(id);
              const name = masajistas.find((m) => m.id === id)?.nombre ?? '';
              setSelectorAnnounce(t('therapistSelector.announce', { name }));
            }}
          />
        )}
      </StyledTherapistFilterStrip>

      {/* Therapist-change announcement (polite) for screen readers (§5). */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {selectorAnnounce}
      </div>

      {therapistDateMode === 'day' ? (
        <StyledTherGrid>
          {isLoading ? (
            <StyledModeEmptyState role="status" aria-live="polite">
              <span>{t('loading')}</span>
            </StyledModeEmptyState>
          ) : (
            <TherapistTimeline
              appointments={appointments}
              onAppointmentClick={handleDayApptClick}
            />
          )}
          <TherapistRail
            notes={notes}
            stats={stats}
            reviews={reviews}
            weekMasajesCount={weekMasajesCount}
            masajeMasRealizado={masajeMasRealizado}
          />
        </StyledTherGrid>
      ) : (
        <StyledTherGrid>
          {isWeekLoading ? (
            <StyledModeEmptyState role="status" aria-live="polite">
              <span>{t('loading')}</span>
            </StyledModeEmptyState>
          ) : (
            <TherapistWeekGrid weekDays={weekDays} onAppointmentClick={handleWeekApptClick} />
          )}
          <TherapistWeekRail weekDays={weekDays} balance={balance} />
        </StyledTherGrid>
      )}

      {/* Quick-edit modal — shared by Mi Día + Mi Semana. Mounted only when a
          cita is selected (mirrors AdminAgendaView's conditional CitaModal). */}
      {quickEditAppt !== null && (
        <CitaQuickEditModal
          open
          appointment={quickEditAppt}
          onClose={() => {
            setQuickEditAppt(null);
          }}
        />
      )}
    </>
  );
};
