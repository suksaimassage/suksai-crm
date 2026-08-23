/**
 * AvatarBadge Component
 *
 * Badge/Indicator para mostrar status en el avatar
 *
 * Principios SOLID:
 * - Single Responsibility: Solo maneja el badge/indicator
 * - Open/Closed: Extensible via props
 *
 * @example
 * <AvatarBadge color="online" />
 * <AvatarBadge color="busy" ping />
 * <AvatarBadge position="top-right">3</AvatarBadge>
 */

import React from 'react';
import * as S from './Avatar.styles';
import type { IAvatarBadgeProps } from './Avatar.types';

// ========================================
// AVATAR BADGE COMPONENT
// ========================================

export const AvatarBadge: React.FC<IAvatarBadgeProps> = ({
  children,
  position = 'bottom-right',
  color = 'neutral',
  bordered = true,
  size = 'md',
  ping = false,
}) => {
  return (
    <S.StyledAvatarBadge
      $position={position}
      $size={size}
      $color={color}
      $bordered={bordered}
      $ping={ping}
    >
      {children}
    </S.StyledAvatarBadge>
  );
};

AvatarBadge.displayName = 'AvatarBadge';
