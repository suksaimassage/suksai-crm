import { useTranslation } from 'react-i18next';
import * as S from './TerapeutasKpiStrip.styles';

// ── Icon primitives ───────────────────────────────────────────────────────────

const IcoUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IcoActivity = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M22 12h-4l-3 9L9 3l-3 9H2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IcoClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 6v6l4 2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IcoCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// ── Props ─────────────────────────────────────────────────────────────────────

interface ITerapeutasKpiStripProps {
  readonly totalActivos: number;
  readonly totalEquipo: number;
  readonly enSalaAhora: number;
  readonly horasSemana: number;
  readonly avgHorasAlMes: number;
  readonly isLoading: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const TerapeutasKpiStrip = ({
  totalActivos,
  totalEquipo,
  enSalaAhora,
  horasSemana,
  avgHorasAlMes,
  isLoading,
}: ITerapeutasKpiStripProps) => {
  const { t } = useTranslation('terapeutas');

  return (
    <S.StyledKpiStrip role="region" aria-label={t('page.eyebrow')} aria-busy={isLoading}>
      {/* KPI 1 — Equipo activo */}
      <S.StyledKpiCell>
        <S.StyledKpiIco aria-hidden="true">
          <IcoUsers />
        </S.StyledKpiIco>
        <S.StyledKpiText>
          <S.StyledKpiLabel>{t('kpi.equipo_activo')}</S.StyledKpiLabel>
          {isLoading ? (
            <S.StyledKpiSkeleton />
          ) : (
            <S.StyledKpiValue
              aria-label={t('kpi.equipo_activo_aria', {
                activos: totalActivos,
                total: totalEquipo,
              })}
            >
              {totalActivos}
              <S.StyledKpiValueFraction>/ {totalEquipo}</S.StyledKpiValueFraction>
            </S.StyledKpiValue>
          )}
        </S.StyledKpiText>
      </S.StyledKpiCell>

      {/* KPI 2 — En sala ahora */}
      <S.StyledKpiCell>
        <S.StyledKpiIco aria-hidden="true">
          <IcoActivity />
        </S.StyledKpiIco>
        <S.StyledKpiText>
          <S.StyledKpiLabel>{t('kpi.en_sala')}</S.StyledKpiLabel>
          {isLoading ? <S.StyledKpiSkeleton /> : <S.StyledKpiValue>{enSalaAhora}</S.StyledKpiValue>}
        </S.StyledKpiText>
      </S.StyledKpiCell>

      {/* KPI 3 — Horas semana */}
      <S.StyledKpiCell>
        <S.StyledKpiIco aria-hidden="true">
          <IcoClock />
        </S.StyledKpiIco>
        <S.StyledKpiText>
          <S.StyledKpiLabel>{t('kpi.horas_semana')}</S.StyledKpiLabel>
          {isLoading ? (
            <S.StyledKpiSkeleton />
          ) : (
            <S.StyledKpiValue>{horasSemana.toFixed(0)}</S.StyledKpiValue>
          )}
        </S.StyledKpiText>
      </S.StyledKpiCell>

      {/* KPI 4 — Avg horas al mes */}
      <S.StyledKpiCell>
        <S.StyledKpiIco aria-hidden="true">
          <IcoCalendar />
        </S.StyledKpiIco>
        <S.StyledKpiText>
          <S.StyledKpiLabel>{t('kpi.horas_mes')}</S.StyledKpiLabel>
          {isLoading ? (
            <S.StyledKpiSkeleton />
          ) : (
            <S.StyledKpiValue
              aria-label={t('kpi.horas_mes_aria', {
                label: t('kpi.horas_mes'),
                horas: avgHorasAlMes.toFixed(0),
              })}
            >
              {avgHorasAlMes.toFixed(0)}
            </S.StyledKpiValue>
          )}
        </S.StyledKpiText>
      </S.StyledKpiCell>
    </S.StyledKpiStrip>
  );
};

TerapeutasKpiStrip.displayName = 'TerapeutasKpiStrip';
