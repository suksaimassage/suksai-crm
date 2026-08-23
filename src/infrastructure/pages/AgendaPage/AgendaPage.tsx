import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TAgendaRoleView, TUserId } from '@domain/types';
import { useUserStore } from '@app/stores/useUserStore';
import { useDashboardCentroId } from '@infra/hooks/useDashboardCentroId';
import { useAdminAgendaData } from '@infra/hooks/useAdminAgendaData';
import { useTherapistAgendaData } from '@infra/hooks/useTherapistAgendaData';
import { toLocalDateKey } from '@infra/utils/agenda.utils';
import {
  StyledAgendaMain,
  StyledPageHead,
  StyledPageHeadTitle,
  StyledPageEyebrow,
  StyledPageTitle,
} from './AgendaPage.styles';
import { AgendaRoleToggle } from './components/shared/AgendaRoleToggle';
import { AdminAgendaView } from './views/AdminAgendaView';
import { TherapistAgendaView } from './views/TherapistAgendaView';
import { Container, PageLayout, Section } from '@infra/components/ui/core/Layout';

function deriveInitialView(roles: readonly string[]): TAgendaRoleView {
  const adminRoles = ['superadmin', 'recepcionista'] as const;
  return roles.some((r) => adminRoles.includes(r as (typeof adminRoles)[number]))
    ? 'admin'
    : 'therapist';
}

export const AgendaPage: React.FC = () => {
  const { t, i18n } = useTranslation('agenda');
  const user = useUserStore((s) => s.user);

  const initialView = deriveInitialView(user?.roles ?? []);
  const [view, setView] = useState<TAgendaRoleView>(initialView);

  const today = new Date();
  const todayStr = toLocalDateKey(today);
  const dayName = today.toLocaleDateString(i18n.language, { weekday: 'long' });
  const dateStr = today.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' });
  const eyebrow = t('dateEyebrow', { dayName, date: dateStr });

  const firstName = user?.nombre.split(' ')[0] ?? '';
  const title = view === 'admin' ? t('pageTitle') : t('pageTitleTherapist', { name: firstName });

  // Real role-toggle badge counts (today, active centre / own agenda). React
  // Query dedupes these keys with the ones the views consume — no double fetch.
  const userId: TUserId | null = user?.id ?? null;
  const { centroId } = useDashboardCentroId(userId);
  const { adminCount } = useAdminAgendaData(centroId, todayStr);
  const { therapistCount } = useTherapistAgendaData(userId, todayStr);

  const isAdmin = (user?.roles ?? []).some((r) => r === 'superadmin' || r === 'recepcionista');

  return (
    <PageLayout>
      <Section $py="xs">
        <Container size="full" gutter="xs">
          <StyledAgendaMain>
            {isAdmin && (
              <StyledPageHead>
                <StyledPageHeadTitle>
                  <StyledPageEyebrow aria-hidden="true">{eyebrow}</StyledPageEyebrow>
                  <StyledPageTitle>{title}</StyledPageTitle>
                </StyledPageHeadTitle>
                <AgendaRoleToggle
                  view={view}
                  onViewChange={setView}
                  adminCount={adminCount}
                  therapistCount={therapistCount}
                />
              </StyledPageHead>
            )}

            {view === 'admin' ? <AdminAgendaView /> : <TherapistAgendaView />}
          </StyledAgendaMain>
        </Container>
      </Section>
    </PageLayout>
  );
};
