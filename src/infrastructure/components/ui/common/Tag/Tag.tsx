/**
 * Tag — Etiqueta de metadata con eliminación opcional
 *
 * Renderiza como <span>. El botón × es el único elemento interactivo.
 * Usa Typography para texto consistente con el sistema.
 *
 * @example
 * <Tag color="primary">React</Tag>
 * <Tag color="success" onRemove={() => remove(id)}>TypeScript</Tag>
 * <Tag icon={<FolderIcon />} variant="outline">Proyectos</Tag>
 */
import React from 'react';
import { Typography } from '@infra/components/ui/core/Typography';
import type { ITagProps } from './Tag.types';
import * as S from './Tag.styles';

const XIcon = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
    <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const Tag: React.FC<ITagProps> = ({
  children,
  color = 'neutral',
  variant = 'soft',
  size = 'md',
  icon,
  onRemove,
  removeLabel = 'Eliminar',
  className,
  style,
  ...htmlProps
}) => (
  <S.TagRoot
    $color={color}
    $variant={variant}
    $size={size}
    className={className}
    style={style}
    {...htmlProps}
  >
    {icon && (
      <S.TagIcon $size={size} aria-hidden="true">
        {icon}
      </S.TagIcon>
    )}

    <Typography
      variant={size === 'lg' ? 'caption1' : 'caption2'}
      as="span"
      weight="medium"
      color="inherit"
      loading={false}
    >
      {children}
    </Typography>

    {onRemove && (
      <S.RemoveBtn onClick={onRemove} aria-label={removeLabel} type="button">
        <XIcon />
      </S.RemoveBtn>
    )}
  </S.TagRoot>
);

Tag.displayName = 'Tag';
