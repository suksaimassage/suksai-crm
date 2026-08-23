/**
 * Avatar Component
 *
 * Componente de avatar con soporte para imágenes e iniciales
 *
 * Principios SOLID:
 * - Single Responsibility: Solo maneja visualización de avatar
 * - Open/Closed: Extensible via props, cerrado a modificación
 * - Liskov Substitution: Puede usarse consistentemente
 * - Interface Segregation: Props bien definidas
 * - Dependency Inversion: Depende de abstracciones (tipos)
 *
 * Mobile First:
 * - Tamaños touch-friendly
 * - Responsive
 *
 * @example
 * // Con imagen
 * <Avatar src="/user.jpg" alt="John Doe" />
 *
 * @example
 * // Con iniciales
 * <Avatar name="John Doe" />
 *
 * @example
 * // Con badge
 * <Avatar
 *   src="/user.jpg"
 *   badge={<span />}
 *   badgePosition="bottom-right"
 * />
 *
 * @example
 * // Con estados
 * <Avatar name="John Doe" loading />
 * <Avatar name="John Doe" disabled />
 * <Avatar name="John Doe" skeleton />
 */

import React, { useState } from 'react';
import type { TAvatarColor, IAvatarProps } from './Avatar.types';
import { getInitials, getColorFromName, isValidImageUrl } from './Avatar.utils';
import * as S from './Avatar.styles';

// ========================================
// AVATAR COMPONENT
// ========================================

interface IAvatarWithRef extends IAvatarProps {
  ref?: React.Ref<HTMLDivElement>;
}

export const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  color,
  bordered = false,
  borderWidth = 'medium',
  disabled = false,
  loading = false,
  skeleton = false,
  onClick,
  className,
  id,
  badge,
  badgePosition = 'bottom-right',
  imgProps,
  ref,
}: IAvatarWithRef) => {
  // ========================================
  // STATE
  // ========================================

  // Estado de carga de imagen
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ========================================
  // COMPUTED VALUES
  // ========================================

  // Determinar si es clickable
  const isClickable = !!onClick && !disabled && !loading && !skeleton;

  // Determinar color de fondo
  const backgroundColor = color ?? ((name ? getColorFromName(name) : 'neutral') as TAvatarColor);

  // Determinar si mostrar imagen
  const showImage = isValidImageUrl(src) && !imageError && !skeleton && !loading;

  // Determinar iniciales
  const initials = name ? getInitials(name) : '?';

  // ========================================
  // HANDLERS
  // ========================================

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const handleClick = () => {
    if (isClickable) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  // ========================================
  // RENDER CONTENT
  // ========================================

  const renderContent = () => {
    // Skeleton state
    if (skeleton) {
      return null;
    }

    // Loading state
    if (loading) {
      return <S.AvatarInitials>{initials}</S.AvatarInitials>;
    }

    // Image
    if (showImage && imageLoaded) {
      return (
        <S.AvatarImage
          src={src}
          alt={alt ?? name ?? 'Avatar'}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          {...imgProps}
        />
      );
    }

    // Initials fallback
    return <S.AvatarInitials>{initials}</S.AvatarInitials>;
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <S.StyledAvatar
      ref={ref}
      $size={size}
      $shape={shape}
      $color={backgroundColor}
      $bordered={bordered}
      $borderWidth={borderWidth}
      $disabled={disabled}
      $clickable={isClickable}
      $loading={loading}
      $skeleton={skeleton}
      className={className}
      id={id}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={alt ?? name ?? 'Avatar'}
      aria-disabled={disabled}
      aria-busy={loading}
    >
      {renderContent()}

      {/* Badge */}
      {badge && !skeleton && (
        <S.StyledAvatarBadge
          $position={badgePosition}
          $size="md"
          $color="neutral"
          $bordered={true}
          $ping={false}
        >
          {badge}
        </S.StyledAvatarBadge>
      )}
    </S.StyledAvatar>
  );
};

Avatar.displayName = 'Avatar';
