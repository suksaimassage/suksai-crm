import type { MouseEvent } from 'react';
import type { IButtonProps } from './Button.types';
import * as S from './Button.styles';
import { logger } from '@infra/utils/logger';

export const Button = ({
  ref,
  // Estilos
  color = 'primary',
  variant = 'solid',
  size = 'md',
  shape = 'default',
  // Contenido
  children,
  iconStart,
  iconEnd,
  // Estados
  loading = false,
  loadingIcon,
  loadingText,
  disabled = false,
  // Layout
  fullWidth = false,
  iconOnly = false,
  // HTML Props
  type = 'button',
  onClick,
  className,
  id,
  'aria-label': ariaLabel,
  // Rest props
  ...restProps
}: IButtonProps) => {
  const isIconOnly = iconOnly || (!children && (!!iconStart || !!iconEnd));

  const displayIconStart = loading ? loadingIcon : iconStart;
  const displayIconEnd = loading && !iconStart && iconEnd ? loadingIcon : iconEnd;
  const displayText = loading && loadingText ? loadingText : children;
  const isDisabled = disabled || loading;

  if (isIconOnly && !ariaLabel) {
    logger.warn('Button: aria-label is required for icon-only buttons');
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <S.StyledButton
      ref={ref}
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      className={className}
      id={id}
      aria-label={ariaLabel}
      aria-busy={loading}
      aria-disabled={isDisabled}
      $color={color}
      $variant={variant}
      $size={size}
      $shape={shape}
      $loading={loading}
      $disabled={isDisabled}
      $fullWidth={fullWidth}
      $iconOnly={isIconOnly}
      {...restProps}
    >
      {displayIconStart && <S.IconWrapper>{displayIconStart}</S.IconWrapper>}
      {displayText && displayText}
      {!loading && displayIconEnd && <S.IconWrapper>{displayIconEnd}</S.IconWrapper>}
    </S.StyledButton>
  );
};

Button.displayName = 'Button';
