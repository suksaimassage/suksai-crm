import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TAgendaRoleView } from '@domain/types';
import {
  StyledRoleToggle,
  StyledRoleToggleTab,
  StyledRoleToggleBadge,
} from '../../AgendaPage.styles';

interface IAgendaRoleToggleProps {
  readonly view: TAgendaRoleView;
  readonly onViewChange: (view: TAgendaRoleView) => void;
  readonly adminCount: number;
  readonly therapistCount: number;
}

export const AgendaRoleToggle = ({
  view,
  onViewChange,
  adminCount,
  therapistCount,
}: IAgendaRoleToggleProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  return (
    <StyledRoleToggle role="group" aria-label={t('roleToggle.groupLabel')}>
      <StyledRoleToggleTab
        $active={view === 'admin'}
        aria-pressed={view === 'admin'}
        onClick={() => {
          onViewChange('admin');
        }}
      >
        {t('roleToggle.admin')}
        <StyledRoleToggleBadge>{adminCount}</StyledRoleToggleBadge>
      </StyledRoleToggleTab>
      <StyledRoleToggleTab
        $active={view === 'therapist'}
        aria-pressed={view === 'therapist'}
        onClick={() => {
          onViewChange('therapist');
        }}
      >
        {t('roleToggle.therapist')}
        <StyledRoleToggleBadge>{therapistCount}</StyledRoleToggleBadge>
      </StyledRoleToggleTab>
    </StyledRoleToggle>
  );
};
