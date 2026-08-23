/**
 * AgendaFilterMenu — generic filter chip + Popover menu (Designer §1.3, §3.5).
 *
 * One reusable composition for all four filter chips (Centro / Terapeutas /
 * Servicio / Estado). The chip trigger shows the SELECTED VALUE
 * ("Estado · Confirmada", "Terapeutas · 4 activos"), not a bare label — so the
 * active state is conveyed by the text itself, not colour alone (WCAG 1.4.1).
 *
 *  - `mode="single"` → Radio options (Centro / Servicio / Estado).
 *  - `mode="multi"`  → Checkbox options (Terapeutas), value summary = count.
 * Estado options render a coloured dot. A "Limpiar" footer resets to default.
 *
 * Page-local feature composition (Popover + Radio/Checkbox primitives).
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverHeader, PopoverBody } from '@infra/components/ui/common/Popover';
import { Radio } from '@infra/components/ui/common/Radio';
import { Checkbox } from '@infra/components/ui/common/Checkbox';
import type { TEstadoCita } from '@domain/types';
import {
  StyledFilterChip,
  StyledChipValue,
  StyledMenuList,
  StyledMenuOption,
  StyledOptionDot,
  StyledMenuFooter,
  StyledClearButton,
  StyledMenuEmpty,
} from './AgendaFilterMenu.styles';

export interface IAgendaFilterOption {
  readonly value: string;
  readonly label: string;
  /** Estado options render a coloured dot keyed by this. */
  readonly estado?: TEstadoCita;
}

interface IAgendaFilterMenuBaseProps {
  readonly label: string;
  readonly title: string;
  readonly options: readonly IAgendaFilterOption[];
  readonly isLoading?: boolean;
  /** Optional leading icon for the chip. */
  readonly icon?: React.ReactNode;
}

interface IAgendaFilterMenuSingleProps extends IAgendaFilterMenuBaseProps {
  readonly mode: 'single';
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
}

interface IAgendaFilterMenuMultiProps extends IAgendaFilterMenuBaseProps {
  readonly mode: 'multi';
  readonly value: readonly string[];
  readonly onChange: (value: readonly string[]) => void;
}

type TAgendaFilterMenuProps = IAgendaFilterMenuSingleProps | IAgendaFilterMenuMultiProps;

const Chevron = () => (
  <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3.5 5.5L7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const AgendaFilterMenu = (props: TAgendaFilterMenuProps): React.ReactElement => {
  const { t } = useTranslation('agenda');
  const [open, setOpen] = useState(false);

  const { label, title, options, isLoading = false, icon } = props;

  const isActive = props.mode === 'single' ? props.value !== null : props.value.length > 0;

  // ── Value summary shown on the chip ──────────────────────────────────────────
  let valueSummary: string;
  if (props.mode === 'single') {
    valueSummary =
      props.value === null
        ? t('filterMenu.all')
        : (options.find((o) => o.value === props.value)?.label ?? t('filterMenu.all'));
  } else if (props.value.length === 0) {
    valueSummary = t('filterMenu.all');
  } else if (props.value.length === 1) {
    valueSummary = options.find((o) => o.value === props.value[0])?.label ?? t('filterMenu.all');
  } else {
    valueSummary = t('filterMenu.terapeutasCount', { n: props.value.length });
  }

  const handleClear = () => {
    if (props.mode === 'single') props.onChange(null);
    else props.onChange([]);
  };

  const toggleMulti = (value: string) => {
    if (props.mode !== 'multi') return;
    const next = props.value.includes(value)
      ? props.value.filter((v) => v !== value)
      : [...props.value, value];
    props.onChange(next);
  };

  const renderOptions = (): React.ReactNode => {
    if (isLoading) {
      return <StyledMenuEmpty>{t('filterMenu.loading')}</StyledMenuEmpty>;
    }
    if (options.length === 0) {
      return <StyledMenuEmpty>{t('filterMenu.noOptions')}</StyledMenuEmpty>;
    }
    return (
      <StyledMenuList role="group" aria-label={title}>
        {options.map((opt) => {
          const selected =
            props.mode === 'single' ? props.value === opt.value : props.value.includes(opt.value);
          return (
            <StyledMenuOption key={opt.value} $selected={selected}>
              {props.mode === 'single' ? (
                <Radio
                  name={`filter-${label}`}
                  value={opt.value}
                  checked={selected}
                  onChange={(val) => {
                    props.onChange(val);
                  }}
                  label={opt.label}
                  icon={
                    opt.estado !== undefined ? (
                      <StyledOptionDot $estado={opt.estado} aria-hidden="true" />
                    ) : undefined
                  }
                />
              ) : (
                <Checkbox
                  checked={selected}
                  onChange={() => {
                    toggleMulti(opt.value);
                  }}
                  label={opt.label}
                />
              )}
            </StyledMenuOption>
          );
        })}
      </StyledMenuList>
    );
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom-start"
      arrow={false}
      width={props.mode === 'multi' ? 260 : 240}
      maxWidth="calc(100vw - 32px)"
      content={
        <>
          <PopoverHeader title={title} />
          <PopoverBody padding="sm">
            {renderOptions()}
            <StyledMenuFooter>
              <StyledClearButton type="button" onClick={handleClear}>
                {t('filterMenu.clear')}
              </StyledClearButton>
            </StyledMenuFooter>
          </PopoverBody>
        </>
      }
    >
      <StyledFilterChip
        type="button"
        $active={isActive}
        $open={open}
        aria-pressed={isActive}
        aria-label={`${label} · ${valueSummary}`}
      >
        {icon}
        {label} · <StyledChipValue>{valueSummary}</StyledChipValue>
        <Chevron />
      </StyledFilterChip>
    </Popover>
  );
};
