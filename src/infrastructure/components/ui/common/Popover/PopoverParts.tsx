/**
 * Popover Subcomponents — Header y Body
 *
 * Principios SOLID:
 * - Single Responsibility: Cada uno gestiona su sección
 * - Composition: Se componen libremente dentro del prop `content`
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import * as S from './Popover.styles';
import type { PopoverHeaderProps, PopoverBodyProps } from './Popover.types';

// ========================================
// POPOVER HEADER
// ========================================

/**
 * Encabezado del popover con soporte para título y botón de cierre.
 *
 * @example
 * <PopoverHeader title="Settings" showCloseButton onClose={close} />
 *
 * @example
 * <PopoverHeader>
 *   <CustomHeaderContent />
 * </PopoverHeader>
 */
export const PopoverHeader: React.FC<PopoverHeaderProps> = ({
  children,
  title,
  showCloseButton = false,
  onClose,
  className,
}) => {
  const { t } = useTranslation('common');
  return (
    <S.StyledPopoverHeader className={className}>
      <S.PopoverHeaderContent>
        {title && <S.PopoverTitle>{title}</S.PopoverTitle>}
        {children}
      </S.PopoverHeaderContent>

      {showCloseButton && onClose && (
        <S.CloseButton onClick={onClose} aria-label={t('popover.closeAriaLabel')} type="button">
          <CloseIcon />
        </S.CloseButton>
      )}
    </S.StyledPopoverHeader>
  );
};

PopoverHeader.displayName = 'PopoverHeader';

// ========================================
// POPOVER BODY
// ========================================

/**
 * Cuerpo del popover. Acepta cualquier contenido React.
 *
 * @example
 * <PopoverBody padding="lg" scrollable>
 *   <LongContent />
 * </PopoverBody>
 */
export const PopoverBody: React.FC<PopoverBodyProps> = ({
  children,
  padding = 'md',
  className,
}) => {
  return (
    <S.StyledPopoverBody $padding={padding} $scrollable={true} className={className}>
      {children}
    </S.StyledPopoverBody>
  );
};

PopoverBody.displayName = 'PopoverBody';

// ========================================
// INTERNAL ICONS
// ========================================

const CloseIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
