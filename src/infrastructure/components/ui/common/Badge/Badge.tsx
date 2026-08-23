/**
 * Badge — Indicador de estado / conteo
 *
 * Elemento inline no interactivo (<span>).
 * Usa Typography para el texto: consistencia tipográfica garantizada.
 *
 * @example
 * <Badge color="success">Activo</Badge>
 * <Badge color="error" variant="solid">3</Badge>
 * <Badge color="warning" variant="dot">Pendiente</Badge>
 */
import React from 'react';
import { Typography } from '@infra/components/ui/core/Typography';
import type { IBadgeProps } from './Badge.types';
import * as S from './Badge.styles';

export const Badge: React.FC<IBadgeProps> = ({
  children,
  color = 'primary',
  variant = 'soft',
  size = 'md',
  pill = true,
  className,
  style,
  ...htmlProps
}) => (
  <S.BadgeRoot
    $color={color}
    $variant={variant}
    $size={size}
    $pill={pill}
    className={className}
    style={style}
    {...htmlProps}
  >
    <Typography variant="label" as="span" size="xs" weight="regular" color="inherit">
      {children}
    </Typography>
  </S.BadgeRoot>
);

Badge.displayName = 'Badge';
