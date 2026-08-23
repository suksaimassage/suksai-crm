/**
 * ClienteDetailPanel — Slide-in detail panel for the selected client.
 *
 * Self-contained compound component. All sub-components are private (not
 * exported) and defined in this file.  The panel renders three states:
 *   loading → skeleton placeholders
 *   error   → error message + retry button
 *   ready   → full client detail view
 *
 * Accessibility:
 *   - Root is <aside role="complementary"> with aria-label
 *   - Close button has aria-label
 *   - Stars are aria-hidden; rating value is exposed via text
 *   - Contact rows use meaningful link text / aria-label
 */

import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@infra/components/ui/common/Avatar';
import { Button } from '@infra/components/ui/common/Button';
import { SegmentoBadge } from '@infra/components/ui/domain/SegmentoBadge';
import type { IClienteDetalle, ICitaEnriquecida } from '@infra/pages/ClientesPage/Clientes.types';
import * as S from './ClienteDetailPanel.styles';

// ── Date formatting helpers ───────────────────────────────────────────────────

const FMT_DATE = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const FMT_TIME = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
});

const FMT_CURRENCY = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatDate(d: Date): string {
  return FMT_DATE.format(d);
}

function formatTime(d: Date): string {
  return FMT_TIME.format(d);
}

function formatCents(cents: number): string {
  return FMT_CURRENCY.format(cents / 100);
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const IcoCalendarCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M9 16l2 2 4-4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IcoEuro = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M14.5 8.5A4 4 0 1014.5 15.5M8 11h6M8 13h6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const IcoStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Private sub-component: StarRating ─────────────────────────────────────────

interface IStarRatingProps {
  readonly value: number;
}

const StarRating = ({ value }: IStarRatingProps) => (
  <S.StyledStarRow aria-hidden="true">
    {Array.from({ length: 5 }).map((_, i) => (
      <S.StyledStar key={i} $filled={i < Math.round(value)}>
        ★
      </S.StyledStar>
    ))}
  </S.StyledStarRow>
);

// ── Private sub-component: AppointmentTimelineItem ─────────────────────────���──

interface IAppointmentTimelineItemProps {
  readonly cita: ICitaEnriquecida;
  readonly type: 'next' | 'past';
}

const AppointmentTimelineItem = ({ cita, type }: IAppointmentTimelineItemProps) => {
  const dateLabel =
    type === 'next'
      ? `${formatDate(cita.fechaHoraInicio)} · ${formatTime(cita.fechaHoraInicio)}`
      : formatDate(cita.fechaHoraInicio);

  return (
    <S.StyledTimelineItem>
      <S.StyledTimelineNode $type={type} aria-hidden="true" />
      <S.StyledTimelineContent>
        <S.StyledTimelineDate>{dateLabel}</S.StyledTimelineDate>
        <S.StyledTimelineSub>
          {cita.servicioNombre} · {cita.duracionMinutos} min · {cita.salaNombre}
        </S.StyledTimelineSub>
        <S.StyledTimelineSub>{cita.terapeutaNombre}</S.StyledTimelineSub>
        {cita.valoracion !== null && <StarRating value={cita.valoracion} />}
      </S.StyledTimelineContent>
    </S.StyledTimelineItem>
  );
};

// ── Private sub-component: PanelHeader ───────────────────────────────────────

interface IPanelHeaderProps {
  readonly detalle: IClienteDetalle;
  readonly onClose: () => void;
  readonly isScrolled: boolean;
}

const PanelHeader = ({ detalle, onClose, isScrolled }: IPanelHeaderProps) => {
  const { t } = useTranslation('clientes');
  const { cliente, segmento, plan } = detalle;
  const fullName = `${cliente.nombre} ${cliente.apellidos}`.trim();

  return (
    <S.StyledPanelHeader data-scrolled={isScrolled}>
      <S.StyledCloseButton type="button" onClick={onClose} aria-label={t('panel.cerrar')}>
        ✕
      </S.StyledCloseButton>

      <S.StyledAvatarRow>
        <S.StyledAvatarRing $segment={segmento}>
          <Avatar name={fullName} size="lg" shape="circle" />
        </S.StyledAvatarRing>
        <S.StyledNameBlock>
          <S.StyledClientName>{fullName}</S.StyledClientName>
          <S.StyledClientMeta>
            {t('panel.miembroDesde', { date: formatDate(cliente.createdAt) })}
          </S.StyledClientMeta>
        </S.StyledNameBlock>
      </S.StyledAvatarRow>

      <S.StyledBadgeRow>
        <SegmentoBadge segment={segmento} size="sm" />
        {plan !== null && <S.StyledPreferenceTag>{plan}</S.StyledPreferenceTag>}
      </S.StyledBadgeRow>
    </S.StyledPanelHeader>
  );
};

// ── Private sub-component: PanelContact ──────────────────────────────────────

interface IPanelContactProps {
  readonly detalle: IClienteDetalle;
}

const PanelContact = ({ detalle }: IPanelContactProps) => {
  const { cliente } = detalle;
  const { t } = useTranslation('clientes');

  return (
    <S.StyledPanelSection>
      <S.StyledPanelSectionLabel>{t('panel.contacto')}</S.StyledPanelSectionLabel>

      <S.StyledContactRow>
        <S.StyledContactIcon aria-hidden="true">📞</S.StyledContactIcon>
        <S.StyledContactText>{cliente.telefono}</S.StyledContactText>
      </S.StyledContactRow>

      {cliente.email !== null ? (
        <S.StyledContactRow>
          <S.StyledContactIcon aria-hidden="true">✉</S.StyledContactIcon>
          <S.StyledContactLink
            href={`mailto:${cliente.email}`}
            aria-label={t('panel.enviarCorreo', { email: cliente.email })}
          >
            {cliente.email}
          </S.StyledContactLink>
        </S.StyledContactRow>
      ) : (
        <S.StyledContactRow>
          <S.StyledContactIcon aria-hidden="true">✉</S.StyledContactIcon>
          <S.StyledClientMeta>{t('panel.sinEmail')}</S.StyledClientMeta>
        </S.StyledContactRow>
      )}
    </S.StyledPanelSection>
  );
};

// ── Private sub-component: PanelStats ────────────────────────────────────────

interface IPanelStatsProps {
  readonly detalle: IClienteDetalle;
}

const PanelStats = ({ detalle }: IPanelStatsProps) => {
  const { t } = useTranslation('clientes');
  return (
    <S.StyledPanelSection>
      <S.StyledStatsGrid>
        <S.StyledStatCard $intent="success">
          <S.StyledStatIcon $intent="success">
            <IcoCalendarCheck />
          </S.StyledStatIcon>
          <S.StyledStatValue>{detalle.totalVisitasAnio}</S.StyledStatValue>
          <S.StyledStatLabel>{t('panel.visitas')}</S.StyledStatLabel>
        </S.StyledStatCard>
        <S.StyledStatCard $intent="warning">
          <S.StyledStatIcon $intent="warning">
            <IcoEuro />
          </S.StyledStatIcon>
          <S.StyledStatValue>{formatCents(detalle.gastoAnio)}</S.StyledStatValue>
          <S.StyledStatLabel>{t('panel.gastoAnio')}</S.StyledStatLabel>
        </S.StyledStatCard>
        <S.StyledStatCard $intent="secondary">
          <S.StyledStatIcon $intent="secondary">
            <IcoStar />
          </S.StyledStatIcon>
          <S.StyledStatValue>{detalle.puntos}</S.StyledStatValue>
          <S.StyledStatLabel>{t('panel.puntos')}</S.StyledStatLabel>
        </S.StyledStatCard>
      </S.StyledStatsGrid>
    </S.StyledPanelSection>
  );
};

// ── Private sub-component: PanelAppointments ─────────────────────────────────

interface IPanelAppointmentsProps {
  readonly detalle: IClienteDetalle;
}

const PanelAppointments = ({ detalle }: IPanelAppointmentsProps) => {
  const { t } = useTranslation('clientes');

  return (
    <S.StyledPanelSection>
      <S.StyledPanelSectionLabel>{t('panel.citas')}</S.StyledPanelSectionLabel>

      {detalle.proximaCita !== null && (
        <AppointmentTimelineItem cita={detalle.proximaCita} type="next" />
      )}

      {detalle.citasRecientes.map((cita) => (
        <AppointmentTimelineItem key={cita.citaId} cita={cita} type="past" />
      ))}

      {detalle.proximaCita === null && detalle.citasRecientes.length === 0 && (
        <S.StyledClientMeta>{t('panel.sinCitas')}</S.StyledClientMeta>
      )}
    </S.StyledPanelSection>
  );
};

// ── Private sub-component: PanelNote ─────────────────────────────────────────

interface IPanelNoteProps {
  readonly nota: string;
  readonly autor: string | null;
  readonly fecha: Date | null;
}

const PanelNote = ({ nota, autor, fecha }: IPanelNoteProps) => {
  const { t } = useTranslation('clientes');
  return (
    <S.StyledPanelSection>
      <S.StyledPanelSectionLabel>{t('panel.notaEstudio')}</S.StyledPanelSectionLabel>
      <S.StyledNoteBlockquote>
        <S.StyledNoteText>{nota}</S.StyledNoteText>
        {(autor !== null || fecha !== null) && (
          <S.StyledNoteAuthor>
            {autor ?? t('panel.autorDesconocido')}
            {fecha !== null && ` · ${formatDate(fecha)}`}
          </S.StyledNoteAuthor>
        )}
      </S.StyledNoteBlockquote>
    </S.StyledPanelSection>
  );
};

// ── Private sub-component: PanelActions ──────────────────────────────────────

interface IPanelActionsProps {
  readonly email: string | null;
  readonly onSchedule: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onReactivate: () => void;
  readonly clienteName: string;
  readonly isInactive: boolean;
  readonly isReactivatePending: boolean;
}

const PanelActions = ({
  email,
  onSchedule,
  onEdit,
  onDelete,
  onReactivate,
  clienteName,
  isInactive,
  isReactivatePending,
}: IPanelActionsProps) => {
  const { t } = useTranslation('clientes');

  return (
    <S.StyledPanelActions>
      <S.StyledPrimaryRow>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            if (email !== null) window.location.href = `mailto:${email}`;
          }}
          disabled={email === null}
          aria-label={
            email === null
              ? `${t('actions.mensaje')} — ${t('actions.sinEmail')}`
              : t('actions.mensaje')
          }
        >
          {t('actions.mensaje')}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={onSchedule}
          aria-label={t('actions.agendar')}
        >
          {t('actions.agendar')}
        </Button>
      </S.StyledPrimaryRow>
      <S.StyledManagementRow>
        <Button
          variant="ghost"
          color="neutral"
          onClick={onEdit}
          disabled={isReactivatePending}
          aria-label={`${t('actions.editar')} ${clienteName}`}
        >
          {t('actions.editar')}
        </Button>
        {isInactive ? (
          <Button
            variant="solid"
            color="success"
            onClick={onReactivate}
            loading={isReactivatePending}
            disabled={isReactivatePending}
            aria-label={`${t('actions.reactivar')} ${clienteName}`}
          >
            {t('actions.reactivar')}
          </Button>
        ) : (
          <Button
            variant="ghost"
            color="error"
            onClick={onDelete}
            aria-label={`${t('actions.eliminar')} ${clienteName}`}
          >
            {t('actions.eliminar')}
          </Button>
        )}
      </S.StyledManagementRow>
    </S.StyledPanelActions>
  );
};

// ── Private sub-component: PanelSkeleton ─────────────────────────────────────

const PanelSkeleton = () => (
  <>
    <S.StyledPanelHeader data-scrolled={false}>
      <S.StyledAvatarRow>
        <S.StyledSkeletonBlock $w="56px" $h="56px" style={{ borderRadius: '50%' }} />
        <S.StyledNameBlock>
          <S.StyledSkeletonBlock $w="60%" $h="22px" />
          <S.StyledSkeletonBlock $w="40%" $h="14px" style={{ marginTop: 4 }} />
        </S.StyledNameBlock>
      </S.StyledAvatarRow>
    </S.StyledPanelHeader>
    <S.StyledPanelSection>
      <S.StyledSkeletonBlock $w="100%" $h="14px" style={{ marginBottom: 8 }} />
      <S.StyledSkeletonBlock $w="80%" $h="14px" style={{ marginBottom: 8 }} />
      <S.StyledSkeletonBlock $w="60%" $h="14px" />
    </S.StyledPanelSection>
    <S.StyledPanelSection>
      <S.StyledStatsGrid>
        {Array.from({ length: 3 }).map((_, i) => (
          <S.StyledStatCard key={i} $intent="success">
            <S.StyledSkeletonBlock $w="50px" $h="22px" />
            <S.StyledSkeletonBlock $w="40px" $h="12px" style={{ marginTop: 4 }} />
          </S.StyledStatCard>
        ))}
      </S.StyledStatsGrid>
    </S.StyledPanelSection>
  </>
);

// ── Root component ────────────────────────────────────────────────────────────

export interface IClienteDetailPanelProps {
  readonly detalle: IClienteDetalle | null;
  readonly isOpen: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly onClose: () => void;
  readonly onSchedule: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onReactivate: () => void;
  readonly isReactivatePending: boolean;
  readonly currentUserName: string;
  readonly onRetry: () => void;
}

export const ClienteDetailPanel = ({
  detalle,
  isOpen,
  isLoading,
  isError,
  onClose,
  onSchedule,
  onEdit,
  onDelete,
  onReactivate,
  isReactivatePending,
  onRetry,
}: IClienteDetailPanelProps) => {
  const { t } = useTranslation('clientes');
  const panelRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const el = panelRef.current;
    if (el === null) return;
    const handleScroll = () => {
      setIsScrolled(el.scrollTop > 0);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const clienteName =
    detalle !== null ? `${detalle.cliente.nombre} ${detalle.cliente.apellidos}`.trim() : '';

  return (
    <S.StyledPanel ref={panelRef} tabIndex={-1} role="complementary" aria-label={t('panel.titulo')}>
      {isLoading && <PanelSkeleton />}

      {isError && !isLoading && (
        <S.StyledErrorState role="alert" aria-live="assertive">
          <S.StyledErrorMessage>{t('panel.error')}</S.StyledErrorMessage>
          <Button variant="outlined" color="primary" onClick={onRetry}>
            {t('error.retry')}
          </Button>
        </S.StyledErrorState>
      )}

      {!isLoading && !isError && detalle !== null && (
        <>
          <PanelHeader detalle={detalle} onClose={onClose} isScrolled={isScrolled} />
          <PanelContact detalle={detalle} />
          <PanelStats detalle={detalle} />
          <PanelAppointments detalle={detalle} />
          {detalle.notaEstudio !== null && (
            <PanelNote
              nota={detalle.notaEstudio}
              autor={detalle.notaAutor}
              fecha={detalle.notaFecha}
            />
          )}
          <PanelActions
            email={detalle.cliente.email}
            onSchedule={onSchedule}
            onEdit={onEdit}
            onDelete={onDelete}
            onReactivate={onReactivate}
            clienteName={clienteName}
            isInactive={!detalle.cliente.activo}
            isReactivatePending={isReactivatePending}
          />
        </>
      )}

      {!isLoading && isError && (
        <PanelActions
          email={null}
          onSchedule={onSchedule}
          onEdit={onEdit}
          onDelete={onDelete}
          onReactivate={onReactivate}
          clienteName={clienteName}
          isInactive={false}
          isReactivatePending={isReactivatePending}
        />
      )}
    </S.StyledPanel>
  );
};
