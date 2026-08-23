import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import type { TEstadoCita } from '@domain/types';
import { FeaturePermissionService } from '@domain/services/FeaturePermissionService';
import { useUserStore } from '@app/stores/useUserStore';
import { KPICard } from '@infra/components/ui/common/KPI';
import type { IKPICard } from '@infra/components/ui/common/KPI';
import { Badge } from '@infra/components/ui/common/Badge';
import { Tag } from '@infra/components/ui/common/Tag';
import { Avatar } from '@infra/components/ui/common/Avatar';
import { CalendarVolume } from '@infra/components/ui/common/CalendarVolume';
import { Empty } from '@infra/components/ui/common/Empty';
import type {
  IDashboardClientRow,
  IDashboardAppointmentRow,
  TClientTag,
} from './DashboardOverviewPage.fixtures';
import type { TBadgeColor } from '@infra/components/ui/common/Badge';
import type { TTagColor } from '@infra/components/ui/common/Tag';
import {
  StyledBanner,
  StyledBannerTextGroup,
  StyledBannerGreeting,
  StyledBannerDateLine,
  StyledBannerTagline,
  StyledBannerRightColumn,
  StyledBannerDateText,
  StyledBannerWeatherText,
  StyledBannerOrnament,
  StyledAppointmentRow,
  StyledAppointmentInfo,
  StyledClientIdentityRow,
  StyledClientNameCol,
  StyledClientTagsRow,
  StyledClientMetaRow,
  StyledApptTimeCol,
  StyledApptAvatarWrap,
  StyledApptDurationWrap,
  StyledApptBadgeWrap,
  StyledCalendarSkeleton,
} from './DashboardOverviewPage.styles';
import { Container, Divider, PageLayout, Section } from '@infra/components/ui/core/Layout';
import { Grid } from '@infra/components/ui/core/Grid';
import { Card } from '@infra/components/ui/common/Card';
import { Typography } from '@infra/components/ui/core/Typography';
import { Flex } from '@infra/components/ui/core/Flex';
import { Button } from '@infra/components/ui/common/Button';
import { useDashboardCentroId } from '@infra/hooks/useDashboardCentroId';
import { useDashboardCitasHoy } from '@infra/hooks/useDashboardCitasHoy';
import { useDashboardKPIs } from '@infra/hooks/useDashboardKPIs';
import { useDashboardTopClientes } from '@infra/hooks/useDashboardTopClientes';
import { useDashboardCalendarVolume } from '@infra/hooks/useDashboardCalendarVolume';

// ── Role helpers (pure functions — no side effects) ──────────────────────────
// Delegated to FeaturePermissionService — aliases kept for local readability.

const canSeeRevenue = FeaturePermissionService.canSeeRevenue;
const canSeeAllTherapists = FeaturePermissionService.canSeeAllTherapists;

// ── Lotus ornament SVG (decorative, aria-hidden) ─────────────────────────────

const LotusOrnament = () => (
  <svg
    width="220"
    height="220"
    viewBox="0 0 220 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="110" cy="110" r="108" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="110" cy="110" rx="28" ry="70" stroke="currentColor" strokeWidth="1.5" />
    <ellipse
      cx="110"
      cy="110"
      rx="28"
      ry="70"
      stroke="currentColor"
      strokeWidth="1.5"
      transform="rotate(45 110 110)"
    />
    <ellipse
      cx="110"
      cy="110"
      rx="28"
      ry="70"
      stroke="currentColor"
      strokeWidth="1.5"
      transform="rotate(90 110 110)"
    />
    <ellipse
      cx="110"
      cy="110"
      rx="28"
      ry="70"
      stroke="currentColor"
      strokeWidth="1.5"
      transform="rotate(135 110 110)"
    />
    <circle cx="110" cy="110" r="12" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// ── Appointment status → badge color mapping ─────────────────────────────────

const ESTADO_BADGE_COLOR: Readonly<Record<TEstadoCita, TBadgeColor>> = {
  sin_asignar: 'warning',
  confirmada: 'success',
  pendiente: 'warning',
  en_curso: 'info',
  completada: 'neutral',
  cancelada: 'error',
  no_presentado: 'error',
} as const;

// ── Client tag → tag color mapping ───────────────────────────────────────────

const CLIENT_TAG_COLOR = {
  vip: 'secondary',
  bono_activo: 'success',
  frecuente: 'primary',
  nuevo: 'info',
} as const satisfies Record<TClientTag, TTagColor>;

// ── WelcomeBanner ────────────────────────────────────────────────────────────

interface IWelcomeBannerProps {
  readonly userName: string;
  readonly dayGreeting: string;
  readonly summaryText: string;
  readonly dateText: string;
  readonly weatherText: string;
}

const WelcomeBanner = ({
  userName,
  dayGreeting,
  summaryText,
  dateText,
  weatherText,
}: IWelcomeBannerProps) => {
  const { t } = useTranslation(['dashboard']);

  return (
    <StyledBanner aria-labelledby="banner-greeting">
      <StyledBannerTextGroup>
        <StyledBannerDateLine aria-hidden="true">{dayGreeting}</StyledBannerDateLine>
        <StyledBannerGreeting id="banner-greeting">
          {t('dashboard:overview.greetingWord')} <em>{userName}.</em>
        </StyledBannerGreeting>
        <StyledBannerTagline>{summaryText}</StyledBannerTagline>
      </StyledBannerTextGroup>

      <StyledBannerRightColumn>
        <StyledBannerDateText>{dateText}</StyledBannerDateText>
        <StyledBannerWeatherText>{weatherText}</StyledBannerWeatherText>
      </StyledBannerRightColumn>

      <StyledBannerOrnament aria-hidden="true">
        <LotusOrnament />
      </StyledBannerOrnament>
    </StyledBanner>
  );
};

// ── KPIGrid ──────────────────────────────────────────────────────────────────

interface IKPIGridProps {
  readonly centroId: number | null;
}

const KPIGrid = ({ centroId }: IKPIGridProps) => {
  const { t } = useTranslation(['dashboard']);
  const user = useUserStore((s) => s.user);
  const roles = user?.roles ?? [];

  const showRevenue = canSeeRevenue(roles);

  const { reservasHoy, ingresosSemana, ocupacionSemana, reservasCompletadasMes } = useDashboardKPIs(
    centroId,
    {
      vsSameDayLastWeek: t('dashboard:kpi.vsMismoDiaSemanaPrevia'),
      vsPreviousWeek: t('dashboard:kpi.vsPeriodoPrevio'),
      vsLastMonth: t('dashboard:kpi.vsMesAnterior'),
    },
  );

  const kpiCards: readonly IKPICard[] = [
    {
      id: 'reservas-hoy',
      title: t('dashboard:kpi.reservasHoy'),
      value: reservasHoy.value,
      color: 'primary',
      comparison: reservasHoy.comparison,
      sparklineData: [...reservasHoy.sparklineData],
      isLoading: reservasHoy.isLoading,
    },
    ...(showRevenue
      ? [
          {
            id: 'ingresos-semana',
            title: t('dashboard:kpi.ingresosSemana'),
            value: ingresosSemana.value,
            suffix: ' €',
            color: 'secondary' as const,
            comparison: ingresosSemana.comparison,
            sparklineData: [...ingresosSemana.sparklineData],
            isLoading: ingresosSemana.isLoading,
          },
        ]
      : []),
    {
      id: 'ocupacion-semana',
      title: t('dashboard:kpi.ocupacionSemana'),
      value: ocupacionSemana.value,
      suffix: '%',
      color: 'success',
      comparison: ocupacionSemana.comparison,
      sparklineData: [...ocupacionSemana.sparklineData],
      isLoading: ocupacionSemana.isLoading,
    },
    {
      id: 'reservas-completadas-mes',
      title: t('dashboard:kpi.reservasCompletadasMes'),
      value: reservasCompletadasMes.value,
      color: 'info',
      comparison: reservasCompletadasMes.comparison,
      sparklineData: [...reservasCompletadasMes.sparklineData],
      isLoading: reservasCompletadasMes.isLoading,
    },
  ];

  return (
    <Grid
      $columns={{
        xs: 1,
        sm: 1,
        md: 2,
        lg: 2,
        xl: 4,
      }}
      $gap={{ xs: 'xs', md: 'md', lg: 'lg' }}
      aria-label={t('dashboard:kpi.gridAriaLabel')}
    >
      {kpiCards.map((kpi) => (
        <Grid.Item key={kpi.id}>
          <KPICard {...kpi} />
        </Grid.Item>
      ))}
    </Grid>
  );
};

// ── ClientRow (sub-component) ─────────────────────────────────────────────────

interface IClientRowProps {
  readonly client: IDashboardClientRow;
  readonly showLtv: boolean;
}

const ClientRow = ({ client, showLtv }: IClientRowProps) => {
  const { t, i18n } = useTranslation(['dashboard']);

  const ltvFormatted = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(client.ltv);

  const lastApptLabel = (() => {
    if (client.lastAppointment === null) return t('dashboard:clients.lastAppt.noCitas');
    const appt = new Date(client.lastAppointment);
    const now = new Date();
    const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const apptMs = new Date(appt.getFullYear(), appt.getMonth(), appt.getDate()).getTime();
    const diff = Math.round((todayMs - apptMs) / 86_400_000);
    const time = new Intl.DateTimeFormat(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(appt);
    if (diff === 0) return t('dashboard:clients.lastAppt.hoy', { time });
    if (diff === 1) return t('dashboard:clients.lastAppt.ayer', { time });
    if (diff === 2) return t('dashboard:clients.lastAppt.haceDos');
    if (diff >= 365) return t('dashboard:clients.lastAppt.haceUnAnio');
    if (diff >= 30)
      return t('dashboard:clients.lastAppt.haceNMes', { count: Math.round(diff / 30) });
    if (diff >= 7) return t('dashboard:clients.lastAppt.haceUnaSemana');
    const date = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
      appt,
    );
    return `${date} ${time}`;
  })();

  const serviceLabel = (() => {
    if (client.lastAppointmentServicio === null || client.lastAppointment === null) return null;
    const appt = new Date(client.lastAppointment);
    const now = new Date();
    const isToday =
      appt.getFullYear() === now.getFullYear() &&
      appt.getMonth() === now.getMonth() &&
      appt.getDate() === now.getDate();
    return isToday && client.lastAppointmentSala !== null
      ? `${client.lastAppointmentServicio} · ${client.lastAppointmentSala}`
      : client.lastAppointmentServicio;
  })();

  return (
    <Card>
      <Card.Body padding="md">
        {/* Row 1: Avatar + name column */}
        <StyledClientIdentityRow>
          <Avatar
            name={`${client.nombre} ${client.apellidos}`}
            size="md"
            shape="circle"
            color="primary"
          />
          <StyledClientNameCol>
            <Typography variant="body">{`${client.nombre} ${client.apellidos}`}</Typography>
            <Typography variant="label" size="xs" color="disabled">
              {t('dashboard:clients.visits', { count: client.numeroVisitas })}
            </Typography>
          </StyledClientNameCol>
        </StyledClientIdentityRow>

        {/* Row 2: Tags (wrapping) */}
        {client.tags.length > 0 && (
          <StyledClientTagsRow role="list" style={{ marginTop: '8px' }}>
            {client.tags.map((tag) => (
              <Tag key={tag} color={CLIENT_TAG_COLOR[tag]} variant="soft" size="sm">
                {t(`dashboard:clients.tag.${tag}`)}
              </Tag>
            ))}
          </StyledClientTagsRow>
        )}

        <Divider variant="dashed" spacing={'sm'} />

        {/* Row 3: LTV + last appointment — stacks on mobile, row on sm+ */}
        <StyledClientMetaRow>
          {showLtv && (
            <Typography
              variant="body"
              family="display"
              size="xl"
              color="neutralWarm"
              weight="bold"
              aria-label={t('dashboard:clients.ltv')}
            >
              {ltvFormatted}
            </Typography>
          )}
          <Flex direction={'column'} align={'flex-end'} justify={'center'}>
            <Typography
              variant="label"
              size="xs"
              weight="bold"
              aria-label={t('dashboard:clients.lastAppt.ariaLabel')}
            >
              {lastApptLabel}
            </Typography>
            {serviceLabel !== null && (
              <Typography variant="label" size="xs" color="disabled">
                {serviceLabel}
              </Typography>
            )}
          </Flex>
        </StyledClientMetaRow>
      </Card.Body>
    </Card>
  );
};

// ── ClientPanel ───────────────────────────────────────────────────────────────

interface IClientPanelProps {
  readonly centroId: number | null;
}

const ClientPanel = ({ centroId }: IClientPanelProps) => {
  const { t } = useTranslation(['dashboard']);
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const showLtv = canSeeAllTherapists(user?.roles ?? []);

  const { data: clients, isLoading, isError } = useDashboardTopClientes(centroId);

  const renderContent = () => {
    if (isError) {
      return (
        <Empty
          preset="error"
          size="sm"
          title={t('dashboard:clients.errorTitle')}
          description={t('dashboard:clients.errorDescription')}
        />
      );
    }

    if (isLoading) {
      return (
        <Flex gap="sm" direction="column">
          {[1, 2, 3].map((n) => (
            <KPICard key={n} id={`client-skeleton-${n}`} title="" value="" isLoading />
          ))}
        </Flex>
      );
    }

    if (clients.length === 0) {
      return (
        <Empty
          preset="no-data"
          size="sm"
          title={t('dashboard:clients.emptyTitle')}
          description={t('dashboard:clients.emptyDescription')}
        />
      );
    }

    return (
      <Flex gap={'sm'} direction={'column'}>
        {clients.map((client) => (
          <ClientRow key={client.id} client={client} showLtv={showLtv} />
        ))}
      </Flex>
    );
  };

  return (
    <Card aria-labelledby="client-panel-heading">
      <Card.Body padding="lg">
        <Flex gap={'md'} direction={'column'}>
          <Flex direction={'row'} alignContent={'space-around'} justify={'space-between'}>
            <Typography variant="headline" id="client-panel-heading">
              {t('dashboard:clients.sectionTitle')}
            </Typography>
            <Button
              variant="link"
              size="sm"
              aria-label={t('dashboard:clients.viewAll')}
              onClick={() => {
                void navigate({ to: '/dashboard/clientes' });
              }}
            >
              {t('dashboard:clients.viewAll').toUpperCase()}
            </Button>
          </Flex>
          {renderContent()}
        </Flex>
      </Card.Body>
    </Card>
  );
};

// ── AppointmentRow (sub-component) ────────────────────────────────────────────

interface IAppointmentRowProps {
  readonly appointment: IDashboardAppointmentRow;
}

const AppointmentRow = ({ appointment }: IAppointmentRowProps) => {
  const { t, i18n } = useTranslation(['dashboard']);

  const timeFormatted = new Intl.DateTimeFormat(i18n.language, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(appointment.fechaHoraInicio));

  const badgeColor: TBadgeColor = ESTADO_BADGE_COLOR[appointment.estado];
  const statusLabel = t(`dashboard:appointments.status.${appointment.estado}`);

  return (
    <StyledAppointmentRow>
      <Flex direction={'row'} align={'center'} gap={'md'} paddingY={'sm'}>
        {/* Hora: fija, no encoge */}
        <StyledApptTimeCol>
          <Typography variant="label" family="display" size="2xl">
            {timeFormatted}
          </Typography>
        </StyledApptTimeCol>

        {/* Info block */}
        <StyledAppointmentInfo>
          <Flex direction={'row'} align={'center'} gap={'sm'}>
            {/* Avatar: oculto en xs */}
            <StyledApptAvatarWrap>
              <Avatar name={appointment.clienteNombre} size="md" shape="circle" color="primary" />
            </StyledApptAvatarWrap>
            <Typography variant="body" truncate>
              {appointment.clienteNombre}
            </Typography>
            {/* Duración: oculta en xs */}
            <StyledApptDurationWrap>
              <Typography variant="label" color="disabled">
                {appointment.duracionMinutos ?? t('dashboard:clients.durationFallback')}
              </Typography>
            </StyledApptDurationWrap>
          </Flex>
          <Typography variant="body" size="sm" truncate>
            {appointment.servicioNombre}
          </Typography>
          <Typography variant="body" size="sm" color="disabled" truncate>
            {appointment.terapeutaNombre} · {appointment.salaNombre}
          </Typography>
        </StyledAppointmentInfo>

        {/* Badge: no encoge, centrado verticalmente */}
        <StyledApptBadgeWrap>
          <Badge color={badgeColor} variant="soft" size="sm" aria-label={statusLabel}>
            {statusLabel}
          </Badge>
        </StyledApptBadgeWrap>
      </Flex>
    </StyledAppointmentRow>
  );
};

// ── AppointmentPanel ──────────────────────────────────────────────────────────

interface IAppointmentPanelProps {
  readonly centroId: number | null;
}

const AppointmentPanel = ({ centroId }: IAppointmentPanelProps) => {
  const { t } = useTranslation(['dashboard']);
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const userId = user?.id ?? null;
  const roles = user?.roles ?? [];

  const { data: appointments, isLoading, isError } = useDashboardCitasHoy(centroId, userId, roles);

  const renderContent = () => {
    if (isError) {
      return (
        <Empty
          preset="error"
          size="sm"
          title={t('dashboard:appointments.errorTitle')}
          description={t('dashboard:appointments.errorDescription')}
        />
      );
    }

    if (isLoading) {
      return (
        <Flex gap="sm" direction="column">
          {[1, 2, 3].map((n) => (
            <KPICard key={n} id={`appt-skeleton-${n}`} title="" value="" isLoading />
          ))}
        </Flex>
      );
    }

    if (appointments.length === 0) {
      return (
        <Empty
          preset="no-data"
          size="sm"
          title={t('dashboard:appointments.emptyTitle')}
          description={t('dashboard:appointments.emptyDescription')}
        />
      );
    }

    return (
      <Flex gap={'sm'} direction={'column'}>
        {appointments.map((appt) => (
          <AppointmentRow key={appt.id} appointment={appt} />
        ))}
      </Flex>
    );
  };

  return (
    <Card aria-labelledby="appointment-panel-heading">
      <Card.Body padding="lg">
        <Flex gap={'md'} direction={'column'}>
          <Flex direction={'row'} alignContent={'space-around'} justify={'space-between'}>
            <Typography variant="headline" id="appointment-panel-heading">
              {t('dashboard:appointments.sectionTitle')}
            </Typography>
            <Button
              variant="link"
              size="sm"
              aria-label={t('dashboard:appointments.viewAgenda')}
              onClick={() => {
                void navigate({ to: '/dashboard/agenda' });
              }}
            >
              {t('dashboard:appointments.viewAgenda').toUpperCase()}
            </Button>
          </Flex>
          {renderContent()}
        </Flex>
      </Card.Body>
    </Card>
  );
};

// ── CalendarVolumePanel ───────────────────────────────────────────────────────

interface ICalendarVolumePanelProps {
  readonly centroId: number | null;
}

const CalendarVolumePanel = ({ centroId }: ICalendarVolumePanelProps) => {
  const { t } = useTranslation(['dashboard']);
  const { data, isError, isLoading } = useDashboardCalendarVolume(centroId);

  return (
    <Flex direction="column" gap="md">
      <Card>
        <Card.Body padding="lg">
          <Typography variant="headline" aria-label={t('dashboard:calendarVolume.sectionTitle')}>
            {t('dashboard:calendarVolume.sectionTitle')}
          </Typography>
          {isLoading ? (
            <StyledCalendarSkeleton
              aria-busy="true"
              aria-label={t('dashboard:calendarVolume.sectionTitle')}
            />
          ) : isError ? (
            <Empty
              preset="error"
              size="sm"
              title={t('dashboard:calendarVolume.errorTitle')}
              description={t('dashboard:calendarVolume.errorDescription')}
            />
          ) : (
            <CalendarVolume
              data={[...data]}
              defaultView="week"
              startHour={9}
              endHour={21}
              showInsights
              insightsCount={3}
              // Compact dashboard variant: static single-week heatmap with no
              // day/week toggle or prev/next nav (strict 09:00–21:00 window).
              compact
              // The panel's outer Typography heading owns the title; suppress
              // CalendarVolume's internal default header to avoid a duplicate.
              renderHeader={() => null}
              aria-label={t('dashboard:calendarVolume.ariaLabel')}
            />
          )}
        </Card.Body>
      </Card>
    </Flex>
  );
};

// ── Page root ─────────────────────────────────────────────────────────────────

export const DashboardOverviewPage: React.FC = () => {
  const { t, i18n } = useTranslation(['dashboard']);
  const user = useUserStore((s) => s.user);
  const userId = user?.id ?? null;

  const { centroId } = useDashboardCentroId(userId);

  const currentDate = new Date();
  const firstName = user?.nombre.split(' ')[0] ?? '';
  const dayName = currentDate.toLocaleDateString(i18n.language, { weekday: 'long' }).toUpperCase();
  const dateText = currentDate.toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <PageLayout>
      <Section $py={'2xl'}>
        <Container size="full">
          <Grid
            $columns={{
              xs: 1,
              sm: 2,
              md: 4,
              lg: 8,
              xl: 12,
            }}
            $gap={{ xs: 'xs', md: 'md', lg: 'lg' }}
            $autoFlow="fit"
          >
            <Grid.Item
              $colSpan={{
                xs: 1,
                sm: 2,
                md: 4,
                lg: 8,
                xl: 12,
              }}
            >
              <WelcomeBanner
                userName={firstName}
                dayGreeting={`${dayName} · ${t('dashboard:overview.goodMorning')}`}
                summaryText={t('dashboard:overview.tagline')}
                dateText={dateText}
                weatherText={''}
              />
            </Grid.Item>
            <Grid.Item
              $colSpan={{
                xs: 1,
                sm: 2,
                md: 4,
                lg: 8,
                xl: 12,
              }}
            >
              <Typography variant="headline" weight="bold">
                {t('dashboard:overview.studioPulse')}
              </Typography>
            </Grid.Item>
            <Grid.Item
              $colSpan={{
                xs: 1,
                sm: 2,
                md: 4,
                lg: 8,
                xl: 12,
              }}
            >
              <KPIGrid centroId={centroId} />
            </Grid.Item>
            <Grid.Item
              $colSpan={{
                xs: 1,
                sm: 2,
                md: 4,
                lg: 4,
                xl: 6,
              }}
            >
              <ClientPanel centroId={centroId} />
            </Grid.Item>
            <Grid.Item
              $colSpan={{
                xs: 1,
                sm: 2,
                md: 4,
                lg: 4,
                xl: 6,
              }}
            >
              <AppointmentPanel centroId={centroId} />
            </Grid.Item>
            <Grid.Item
              $colSpan={{
                xs: 1,
                sm: 2,
                md: 4,
                lg: 8,
                xl: 12,
              }}
            >
              <CalendarVolumePanel centroId={centroId} />
            </Grid.Item>
          </Grid>
        </Container>
      </Section>
    </PageLayout>
  );
};
