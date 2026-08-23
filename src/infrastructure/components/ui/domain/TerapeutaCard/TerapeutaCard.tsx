import { useTranslation } from 'react-i18next';
import type { SyntheticEvent } from 'react';
import { DropdownMenu } from '@infra/components/ui/common/DropdownMenu';
import type { ITerapeutaAggregate } from '@infra/hooks/useTerapeutas';
import type { TTerapeutaEstado } from '@domain/types';
import type { IHorarioRaw } from '@infra/adapters/SupabaseTerapeutasAdapter';
import type { DropdownEntry } from '@infra/components/ui/common/Dropdown/Dropdown.types';
import * as S from './TerapeutaCard.styles';

// ── Props interfaces ──────────────────────────────────────────────────────────

interface ITerapeutaCardProps {
  readonly aggregate: ITerapeutaAggregate;
  readonly onEdit: () => void;
  readonly onManageSchedule: () => void;
}

interface IActionsProps {
  readonly nombre: string;
  readonly onEdit: () => void;
  readonly onManageSchedule: () => void;
}

interface IStatusPillProps {
  readonly estado: TTerapeutaEstado;
}

interface IWeekBarProps {
  readonly horarios: readonly IHorarioRaw[];
}

interface IFootStatsProps {
  readonly sesiones: number;
  readonly ingresos: number;
  readonly servicioMasRealizado: string | null;
}

// ── Icon primitives ────────────────────────────────────────────────────────

const IcoDotsVertical = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
);

const IcoPencil = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IcoClock = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IcoRoom = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const IcoCalendar = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// ── Avatar initials helper ─────────────────────────────────────────────────

function buildInitials(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

// ── StatusPill sub-component ───────────────────────────────────────────────

const TerapeutaCardStatusPill = ({ estado }: IStatusPillProps) => {
  const { t } = useTranslation('terapeutas');
  return (
    <S.StyledStatusPill $estado={estado} role="status" aria-label={t(`status.${estado}`)}>
      {t(`status.${estado}`)}
    </S.StyledStatusPill>
  );
};

TerapeutaCardStatusPill.displayName = 'TerapeutaCard.StatusPill';

// ── Actions sub-component (3-dots menu) ───────────────────────────────────

const TerapeutaCardActions = ({ nombre, onEdit, onManageSchedule }: IActionsProps) => {
  const { t } = useTranslation('terapeutas');

  const entries: DropdownEntry[] = [
    {
      type: 'item',
      id: 'editar',
      label: t('card.menu.editar'),
      icon: <IcoPencil />,
      onClick: onEdit,
    },
    {
      type: 'item',
      id: 'horario',
      label: t('card.menu.horario'),
      icon: <IcoClock />,
      onClick: onManageSchedule,
    },
  ];

  const stop = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <S.StyledTerapeutaCardActions onClick={stop} onKeyDown={stop}>
      <DropdownMenu
        align="right"
        entries={entries}
        trigger={
          <S.StyledMenuTrigger
            type="button"
            aria-label={t('card.menu.ariaLabel', { nombre })}
            aria-haspopup="menu"
          >
            <IcoDotsVertical />
          </S.StyledMenuTrigger>
        }
      />
    </S.StyledTerapeutaCardActions>
  );
};

TerapeutaCardActions.displayName = 'TerapeutaCard.Actions';

// ── WeekBar sub-component — labels on top, bars below ─────────────────────

const ISO_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

const TerapeutaCardWeekBar = ({ horarios }: IWeekBarProps) => {
  const { t } = useTranslation('terapeutas');
  const today = new Date();
  const rawDay = today.getDay();
  const todayIso = rawDay === 0 ? 7 : rawDay;

  return (
    <S.StyledWeekBarSection>
      <S.StyledWeekBarDayLabels aria-hidden="true">
        {ISO_DAYS.map((day) => (
          <S.StyledDayLabel key={day} $isToday={day === todayIso}>
            {t(`days.${day}`)}
          </S.StyledDayLabel>
        ))}
      </S.StyledWeekBarDayLabels>
      <S.StyledWeekBarGrid role="group" aria-label={t('card.horas_semana', { hours: '' }).trim()}>
        {ISO_DAYS.map((day) => {
          const horario = horarios.find((h) => h.tipo === 'recurrente' && h.dia_semana === day);
          const isToday = day === todayIso;

          let heightPct = 0;
          if (horario !== undefined) {
            const parts0 = horario.hora_inicio.split(':');
            const parts1 = horario.hora_fin.split(':');
            const startH = parseInt(parts0[0] ?? '0', 10);
            const endH = parseInt(parts1[0] ?? '0', 10);
            const hours = Math.max(0, endH - startH);
            heightPct = Math.min(100, Math.max(8, (hours / 10) * 100));
          }

          return (
            <S.StyledWeekBarCol
              key={day}
              $hasShift={horario !== undefined}
              $isToday={isToday}
              $heightPct={heightPct}
              aria-label={`${t(`days.${day}`)}${horario !== undefined ? ` · ${horario.hora_inicio}–${horario.hora_fin}` : ''}`}
            />
          );
        })}
      </S.StyledWeekBarGrid>
    </S.StyledWeekBarSection>
  );
};

TerapeutaCardWeekBar.displayName = 'TerapeutaCard.WeekBar';

// ── FootStats sub-component ────────────────────────────────────────────────

const TerapeutaCardFootStats = ({ sesiones, ingresos, servicioMasRealizado }: IFootStatsProps) => {
  const { t } = useTranslation('terapeutas');

  return (
    <S.StyledFootStats>
      <S.StyledFootStatCell>
        <S.StyledFootStatValue>{sesiones}</S.StyledFootStatValue>
        <S.StyledFootStatLabel>{t('card.sesiones_label')}</S.StyledFootStatLabel>
      </S.StyledFootStatCell>
      <S.StyledFootStatCell>
        {servicioMasRealizado !== null ? (
          <S.StyledFootStatServicio title={servicioMasRealizado}>
            {servicioMasRealizado}
          </S.StyledFootStatServicio>
        ) : (
          <S.StyledFootStatValueMuted>{t('kpi.no_data')}</S.StyledFootStatValueMuted>
        )}
        <S.StyledFootStatLabel>{t('card.servicio_label')}</S.StyledFootStatLabel>
      </S.StyledFootStatCell>
      <S.StyledFootStatCell $last>
        <S.StyledFootStatValueGold>€{ingresos.toFixed(0)}</S.StyledFootStatValueGold>
        <S.StyledFootStatLabel>{t('card.ingresos_label')}</S.StyledFootStatLabel>
      </S.StyledFootStatCell>
    </S.StyledFootStats>
  );
};

TerapeutaCardFootStats.displayName = 'TerapeutaCard.FootStats';

// ── Root card ─────────────────────────────────────────────────────────────────

const TerapeutaCardRoot = ({ aggregate, onEdit, onManageSchedule }: ITerapeutaCardProps) => {
  const { t } = useTranslation('terapeutas');
  const year = aggregate.createdAt.getFullYear();
  const isMasajista = aggregate.roles.includes('masajista');
  const fullName = `${aggregate.nombre} ${aggregate.apellidos}`.trim();

  const primaryRole = aggregate.roles.includes('masajista')
    ? t('roles.masajista')
    : aggregate.roles.includes('recepcionista')
      ? t('roles.recepcionista')
      : (aggregate.roles[0] ?? '');

  const proximaTime =
    aggregate.proximaCita !== null
      ? aggregate.proximaCita.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : null;

  const proximaLabel =
    proximaTime !== null
      ? [t('card.proxima', { time: proximaTime }), aggregate.proximaCitaSala]
          .filter(Boolean)
          .join(' · ')
      : t('card.sin_proxima');

  return (
    <S.StyledTerapeutaCard role="article" aria-label={fullName}>
      {/* Row 1: horizontal header — avatar + name/role/status + 3-dots */}
      <S.StyledCardHeader>
        <S.StyledAvatarWrap>
          <S.StyledAvatarCircle aria-hidden="true">
            {buildInitials(aggregate.nombre)}
          </S.StyledAvatarCircle>
          <S.StyledStatusDot $estado={aggregate.estadoActual} aria-hidden="true" />
        </S.StyledAvatarWrap>
        <S.StyledHeaderTextBlock>
          <S.StyledTerapeutaName>{fullName}</S.StyledTerapeutaName>
          <S.StyledHeaderSubRow>
            <S.StyledRoleLabel>{primaryRole}</S.StyledRoleLabel>
            <TerapeutaCardStatusPill estado={aggregate.estadoActual} />
          </S.StyledHeaderSubRow>
        </S.StyledHeaderTextBlock>
        <TerapeutaCardActions
          nombre={aggregate.nombre}
          onEdit={onEdit}
          onManageSchedule={onManageSchedule}
        />
      </S.StyledCardHeader>

      {/* Row 2: sala (if en_sala) + creation date */}
      <S.StyledCardInfoRow>
        {aggregate.salaActual !== null && (
          <S.StyledMetaItem>
            <IcoRoom />
            {aggregate.salaActual}
          </S.StyledMetaItem>
        )}
        <S.StyledMetaItem>
          <IcoCalendar />
          {t('card.desde', { year })}
        </S.StyledMetaItem>
      </S.StyledCardInfoRow>

      {/* Row 3: service type badges */}
      {aggregate.especialidades.length > 0 && (
        <S.StyledEspecialidadesStrip>
          {aggregate.especialidades.map((esp) => (
            <S.StyledEspecialidadTag key={esp}>{esp}</S.StyledEspecialidadTag>
          ))}
        </S.StyledEspecialidadesStrip>
      )}

      {/* Row 4: week schedule bars */}
      <TerapeutaCardWeekBar horarios={aggregate.horariosSemanales} />

      {/* Row 5: total hours this week ← → proxima cita time + sala */}
      <S.StyledWeekMetaRow>
        <S.StyledHorasLabel>
          {t('card.horas_semana', { hours: aggregate.totalHorasSemana })}
        </S.StyledHorasLabel>
        <S.StyledProximaCita aria-live="polite">{proximaLabel}</S.StyledProximaCita>
      </S.StyledWeekMetaRow>

      {/* Footer: performance stats — masajistas only */}
      {isMasajista && (
        <TerapeutaCardFootStats
          sesiones={aggregate.sesionesEstaSemana}
          ingresos={aggregate.ingresosSemana}
          servicioMasRealizado={aggregate.servicioMasRealizado}
        />
      )}
    </S.StyledTerapeutaCard>
  );
};

TerapeutaCardRoot.displayName = 'TerapeutaCard';

// ── Compound component assembly ───────────────────────────────────────────────

export const TerapeutaCard = Object.assign(TerapeutaCardRoot, {
  StatusPill: TerapeutaCardStatusPill,
  Actions: TerapeutaCardActions,
  WeekBar: TerapeutaCardWeekBar,
  FootStats: TerapeutaCardFootStats,
});
