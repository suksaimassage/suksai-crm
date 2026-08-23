/**
 * Typography Component
 *
 * Sistema de tipografía responsive y escalable.
 * Mobile First.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Renderizado tipográfico + estado de carga.
 * - Open/Closed: Extensible via props sin modificar el componente.
 * - Interface Segregation: Props opcionales y específicas.
 * - Dependency Inversion: Depende del theme (abstracción)
 */

import React, { memo, useEffect, useState } from 'react';
import { Skeleton } from '@infra/components/ui/core/Skeleton';
import type { ITypographyProps } from './Typography.types';
import { DEFAULT_ELEMENT_MAP, SKELETON_HEIGHT_MAP } from './Typography.utils';
import * as S from './Typography.styles';

const TypographyBase: React.FC<ITypographyProps> = ({
  variant = 'body',
  as,
  family,
  color = 'primary',
  align = 'left',
  weight,
  size,
  children,
  className,
  shade = null,
  truncate = false,
  lineClamp,
  gutterBottom = false,
  loading = false,
  skeletonWidth = 'auto',
  loadingDelay = 200,
  responsive = true,
  ...ariaProps
}) => {
  const [showSkeleton, setShowSkeleton] = useState(loading);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSkeleton(true);
    } else {
      timer = setTimeout(() => {
        setShowSkeleton(false);
      }, loadingDelay);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [loading, loadingDelay]);

  // ========================================
  // RENDER — Skeleton state
  // ========================================

  if (showSkeleton) {
    return (
      <Skeleton
        variant="text"
        width={skeletonWidth}
        height={SKELETON_HEIGHT_MAP[variant]}
        className={className}
      />
    );
  }

  // ========================================
  // RENDER — Content state
  // ========================================

  const element = as ?? DEFAULT_ELEMENT_MAP[variant];

  return (
    <S.TypographyStyled
      as={element}
      $variant={variant}
      $color={color}
      $family={family}
      $align={align}
      $weight={weight}
      $size={size}
      $truncate={truncate}
      $lineClamp={lineClamp}
      $gutterBottom={gutterBottom}
      $shade={shade}
      $responsive={responsive}
      className={className}
      {...ariaProps}
    >
      {children}
    </S.TypographyStyled>
  );
};

TypographyBase.displayName = 'Typography';

/**
 * Typography — memoized typographic primitive.
 *
 * Skips re-render when all props are shallowly equal.
 * Safe because Typography has no internal subscriptions or side effects
 * beyond the controlled `loading` state.
 */
export const Typography = memo(TypographyBase);
