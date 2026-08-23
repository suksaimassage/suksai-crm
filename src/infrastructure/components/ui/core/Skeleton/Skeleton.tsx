/**
 * Skeleton Component
 *
 * Componente reutilizable para estados de carga
 * Con shimmer animation
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ISkeletonProps } from './Skeleton.types';
import * as S from './Skeleton.styles';

export const Skeleton: React.FC<ISkeletonProps> = ({
  variant = 'text',
  width,
  height,
  speed = 'normal',
  animation = true,
  borderRadius,
  className,
}) => {
  const { t } = useTranslation('common');
  return (
    <S.SkeletonBase
      $variant={variant}
      $width={width}
      $height={height}
      $speed={speed}
      $animation={animation}
      $borderRadius={borderRadius}
      className={className}
      aria-busy="true"
      aria-label={t('loading')}
    />
  );
};
