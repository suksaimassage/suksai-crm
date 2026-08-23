/**
 * AvatarGroup Component
 *
 * Agrupa múltiples avatares con overlap
 *
 * Principios SOLID:
 * - Single Responsibility: Solo maneja agrupación de avatares
 * - Open/Closed: Extensible via props
 *
 * @example
 * <AvatarGroup max={3}>
 *   <Avatar name="John Doe" />
 *   <Avatar name="Jane Smith" />
 *   <Avatar name="Bob Johnson" />
 *   <Avatar name="Alice Brown" />
 * </AvatarGroup>
 *
 * @example
 * <AvatarGroup spacing="tight" bordered>
 *   <Avatar src="/user1.jpg" />
 *   <Avatar src="/user2.jpg" />
 *   <Avatar src="/user3.jpg" />
 * </AvatarGroup>
 */

import React, { Children, cloneElement, isValidElement } from 'react';
import type { IAvatarGroupProps, IAvatarProps } from './Avatar.types';
import * as S from './Avatar.styles';

// ========================================
// AVATAR GROUP COMPONENT
// ========================================

export const AvatarGroup: React.FC<IAvatarGroupProps> = ({
  children,
  size = 'md',
  shape = 'circle',
  max,
  spacing = 'normal',
  bordered = false,
  className,
  excessText = (count) => `+${count}`,
}) => {
  // Convertir children a array
  const childrenArray = Children.toArray(children);

  // Calcular avatares a mostrar
  const hasMax = typeof max === 'number' && max > 0;
  const visibleCount = hasMax ? Math.min(max, childrenArray.length) : childrenArray.length;
  const excessCount = hasMax ? Math.max(0, childrenArray.length - max) : 0;

  // Avatares visibles
  const visibleChildren = childrenArray.slice(0, visibleCount);

  // Clonar avatares con props heredadas
  const enhancedChildren = visibleChildren.map((child) => {
    if (!isValidElement<IAvatarProps>(child)) return child;

    const inheritedProps = {
      ...(child.props.size === undefined && { size }),
      ...(child.props.shape === undefined && { shape }),
      ...(child.props.bordered === undefined && { bordered }),
    };

    return cloneElement(child, inheritedProps);
  });

  return (
    <S.StyledAvatarGroup $spacing={spacing} className={className} role="group">
      {enhancedChildren}

      {/* Avatar de excess (+N) */}
      {excessCount > 0 && (
        <S.ExcessAvatar
          $size={size}
          $shape={shape}
          $color="neutral"
          $bordered={bordered}
          $borderWidth="medium"
          $disabled={false}
          $clickable={false}
          $loading={false}
          $skeleton={false}
          aria-label={`${excessCount} more`}
        >
          <S.AvatarInitials>{excessText(excessCount)}</S.AvatarInitials>
        </S.ExcessAvatar>
      )}
    </S.StyledAvatarGroup>
  );
};

AvatarGroup.displayName = 'AvatarGroup';
