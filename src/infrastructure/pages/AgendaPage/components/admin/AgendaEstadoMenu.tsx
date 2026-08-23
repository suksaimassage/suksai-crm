/**
 * AgendaEstadoMenu — estado lifecycle control (Designer §1.8, §3.4).
 *
 * A `DropdownMenu` whose entries are the legal next states for the current
 * estado (`legalNextEstados`). When the estado is terminal the trigger renders
 * disabled (DropdownMenu `disabled`), satisfying the `no-legal-transitions`
 * state. Each entry carries a coloured estado dot so the choice is not conveyed
 * by text alone.
 *
 * Page-local feature composition — not a shared primitive.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownMenu } from '@infra/components/ui/common/DropdownMenu';
import type { DropdownEntry } from '@infra/components/ui/common/Dropdown/Dropdown.types';
import { legalNextEstados, isTerminalEstado } from '@domain/index';
import type { TEstadoCita } from '@domain/types';
import {
  StyledEstadoTrigger,
  StyledEstadoTriggerChevron,
  StyledEstadoDot,
  StyledEstadoMenuLabel,
} from './AgendaEstadoMenu.styles';

interface IAgendaEstadoMenuProps {
  readonly current: TEstadoCita;
  readonly onChange: (next: TEstadoCita) => void;
  readonly disabled?: boolean;
}

export const AgendaEstadoMenu = ({
  current,
  onChange,
  disabled = false,
}: IAgendaEstadoMenuProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  const nextStates = legalNextEstados(current);
  const terminal = isTerminalEstado(current);
  const isDisabled = disabled || terminal;

  const entries: DropdownEntry[] = nextStates.map((estado) => ({
    type: 'item',
    id: estado,
    label: t(`estado.${estado}`),
    icon: <StyledEstadoDot $estado={estado} aria-hidden="true" />,
    onClick: () => {
      onChange(estado);
    },
  }));

  return (
    <DropdownMenu
      disabled={isDisabled}
      align="left"
      minWidth="200px"
      trigger={
        <StyledEstadoTrigger
          as="span"
          $disabled={isDisabled}
          aria-disabled={isDisabled}
          title={terminal ? t('estado.menu.noTransitions') : undefined}
        >
          <StyledEstadoMenuLabel>{t('estado.menu.label')}</StyledEstadoMenuLabel>
          <StyledEstadoTriggerChevron viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3.5 5.5L7 9l3.5-3.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </StyledEstadoTriggerChevron>
        </StyledEstadoTrigger>
      }
      entries={entries}
    />
  );
};
