/**
 * Chip — Filtro / toggle interactivo
 *
 * Renderiza como <button aria-pressed> — a11y nativa sin ARIA manual.
 * Usa Typography para texto consistente con el sistema.
 *
 * @example
 * <Chip selected={active} onClick={toggle}>TypeScript</Chip>
 * <Chip color="success" icon={<CheckIcon />} selected>Completado</Chip>
 * <Chip disabled>No disponible</Chip>
 */
import React from 'react';
import { Typography } from '@infra/components/ui/core/Typography';
import type { IChipProps } from './Chip.types';
import * as S from './Chip.styles';

interface IChipWithRef extends IChipProps {
  ref?: React.Ref<HTMLButtonElement>;
}

export const Chip = ({
  children,
  color = 'neutral',
  size = 'md',
  selected = false,
  icon,
  disabled = false,
  type = 'button',
  className,
  style,
  ref,
  ...htmlProps
}: IChipWithRef) => {
  return (
    <S.ChipRoot
      ref={ref}
      $color={color}
      $size={size}
      $selected={selected}
      disabled={disabled}
      type={type}
      aria-pressed={selected}
      className={className}
      style={style}
      {...htmlProps}
    >
      {icon && (
        <S.ChipIcon $size={size} aria-hidden="true">
          {icon}
        </S.ChipIcon>
      )}
      <Typography
        variant={size === 'lg' ? 'caption1' : 'caption2'}
        as="span"
        weight="medium"
        size="xs"
        color="inherit"
      >
        {children}
      </Typography>
    </S.ChipRoot>
  );
};

Chip.displayName = 'Chip';
