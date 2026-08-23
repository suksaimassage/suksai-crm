/**
 * AgendaTherapistSelector — admin-only therapist picker (Designer §1.9, §3.6).
 *
 * A `Select` of the active centre's masajistas (Avatar initials + name + sala
 * description). Choosing one drives which therapist's agenda the therapist view
 * loads and enables manage actions on their citas. Hidden entirely for non-admin
 * masajistas (own agenda only). States: closed / open / loading / empty / selected.
 *
 * Page-local composition (Select + Avatar).
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@infra/components/ui/common/Select';
import { Avatar } from '@infra/components/ui/common/Avatar';
import type { IAgendaTerapeutaRow } from '@domain/models/agenda.models';
import type { TUserId } from '@domain/types';
import {
  StyledTherapistSelectorWrap,
  StyledHiddenLabel,
  StyledSelectorHint,
} from './AgendaTherapistSelector.styles';

interface IAgendaTherapistSelectorProps {
  readonly masajistas: readonly IAgendaTerapeutaRow[];
  readonly value: TUserId | null;
  readonly isLoading: boolean;
  readonly onChange: (usuarioId: TUserId) => void;
}

const SELECT_ID = 'agenda-therapist-selector';

export const AgendaTherapistSelector = ({
  masajistas,
  value,
  isLoading,
  onChange,
}: IAgendaTherapistSelectorProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  const isEmpty = !isLoading && masajistas.length === 0;
  const selected = masajistas.find((m) => m.id === value) ?? null;

  const options = masajistas.map((m) => ({
    value: String(m.id),
    label: m.nombre,
    icon: <Avatar name={m.nombre} size="xs" />,
  }));

  const placeholder = isLoading
    ? t('therapistSelector.loading')
    : isEmpty
      ? t('therapistSelector.empty')
      : t('therapistSelector.placeholder');

  return (
    <StyledTherapistSelectorWrap>
      <StyledHiddenLabel htmlFor={SELECT_ID}>{t('therapistSelector.label')}</StyledHiddenLabel>
      <Select
        id={SELECT_ID}
        value={value !== null ? String(value) : ''}
        onChange={(val) => {
          onChange(Number(val));
        }}
        options={options}
        placeholder={placeholder}
        disabled={isLoading || isEmpty}
        leftIcon={selected ? <Avatar name={selected.nombre} size="xs" /> : undefined}
      />
      {isEmpty && <StyledSelectorHint>{t('therapistSelector.emptyHint')}</StyledSelectorHint>}
    </StyledTherapistSelectorWrap>
  );
};
