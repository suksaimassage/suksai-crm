/**
 * Modal Component
 *
 * Componente de modal accesible y responsive
 *
 * Principios SOLID:
 * - Single Responsibility: Solo maneja el modal
 * - Open/Closed: Extensible via props
 * - Composition: Usa Card internamente
 *
 * Mobile First:
 * - Full screen en mobile para tamaños grandes
 * - Touch-friendly
 *
 * Accesibilidad:
 * - Focus trap
 * - Escape key
 * - ARIA attributes
 * - Keyboard navigation
 *
 * @example
 * <Modal open={isOpen} onClose={handleClose}>
 *   <ModalHeader title="Title" />
 *   <ModalBody>Content</ModalBody>
 *   <ModalFooter>
 *     <Button onClick={handleClose}>Close</Button>
 *   </ModalFooter>
 * </Modal>
 */

import React, { useRef, useContext, createContext, isValidElement, Children } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type {
  IModalProps,
  IModalHeaderProps,
  IModalBodyProps,
  IModalFooterProps,
} from './Modal.types';
import { useLockScroll, useEscapeKey, useFocusTrap, useAfterTransition } from './Modal.hooks';
import * as S from './Modal.styles';

interface IModalContextValue {
  readonly hasBody?: boolean;
  /** `${id}-title` when the Modal has an id — lets ModalHeader label the dialog. */
  readonly titleId?: string;
}

const ModalContext = createContext<IModalContextValue | null>(null);

/**
 * Hook interno para consumir el CardContext.
 * Centraliza el acceso y permite detectar uso fuera del contexto.
 */
const useModalContext = (): IModalContextValue => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal components must be used within <Modal>');
  }
  return context;
};

// ========================================
// ICONS
// ========================================

/**
 * Close Icon (X)
 */
const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ========================================
// MODAL HEADER
// ========================================

/**
 * ModalHeader - Encabezado del modal
 *
 * @example
 * <ModalHeader title="Title" subtitle="Subtitle" showCloseButton />
 *
 * @example
 * <ModalHeader onClose={handleClose}>
 *   <CustomHeader />
 * </ModalHeader>
 */
export const ModalHeader: React.FC<IModalHeaderProps> = ({
  children,
  title,
  subtitle,
  showCloseButton = true,
  onClose,
  className,
}) => {
  const { titleId } = useModalContext();
  const { t } = useTranslation('common');

  // Si solo hay children sin title/subtitle, renderizar directamente
  if (!title && !subtitle && children) {
    return (
      <S.StyledModalHeader className={className}>
        <S.ModalHeaderContent>{children}</S.ModalHeaderContent>
        {showCloseButton && onClose && (
          <S.CloseButton onClick={onClose} aria-label={t('modal.cerrar')} type="button">
            <CloseIcon />
          </S.CloseButton>
        )}
      </S.StyledModalHeader>
    );
  }

  return (
    <S.StyledModalHeader className={className}>
      <S.ModalHeaderContent>
        {title && <S.ModalTitle id={titleId}>{title}</S.ModalTitle>}
        {subtitle && <S.ModalSubtitle>{subtitle}</S.ModalSubtitle>}
        {children}
      </S.ModalHeaderContent>

      {showCloseButton && onClose && (
        <S.CloseButton onClick={onClose} aria-label={t('modal.cerrar')} type="button">
          <CloseIcon />
        </S.CloseButton>
      )}
    </S.StyledModalHeader>
  );
};

ModalHeader.displayName = 'Modal.Header';

// ========================================
// MODAL BODY
// ========================================

/**
 * ModalBody - Cuerpo del modal
 *
 * @example
 * <ModalBody>
 *   <p>Content here</p>
 * </ModalBody>
 *
 * @example
 * <ModalBody padding="lg" scrollable>
 *   <LongContent />
 * </ModalBody>
 */
export const ModalBody: React.FC<IModalBodyProps> = ({
  children,
  padding = 'md',
  className,
  scrollable = false,
}) => {
  useModalContext();

  return (
    <S.StyledModalBody $padding={padding} $scrollable={scrollable} className={className}>
      {children}
    </S.StyledModalBody>
  );
};

ModalBody.displayName = 'Modal.Body';

// ========================================
// MODAL FOOTER
// ========================================

/**
 * ModalFooter - Pie del modal
 *
 * @example
 * <ModalFooter align="right">
 *   <Button variant="ghost">Cancel</Button>
 *   <Button>Confirm</Button>
 * </ModalFooter>
 */
export const ModalFooter: React.FC<IModalFooterProps> = ({
  children,
  align = 'right',
  className,
}) => {
  useModalContext();

  return (
    <S.StyledModalFooter $align={align} className={className}>
      {children}
    </S.StyledModalFooter>
  );
};

ModalFooter.displayName = 'Modal.Footer';

// ========================================
// MODAL COMPONENT
// ========================================

type TModalComponent = React.FC<IModalProps> & {
  Header: React.FC<IModalHeaderProps>;
  Body: React.FC<IModalBodyProps>;
  Footer: React.FC<IModalFooterProps>;
};

export const Modal: TModalComponent = ({
  open,
  onClose,
  children,
  size = 'md',
  position = 'center',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  id,
  lockScroll = true,
  animated = true,
  backdropBlur = false,
  onAfterOpen,
  onAfterClose,
}) => {
  // ========================================
  // REFS
  // ========================================

  const modalRef = useRef<HTMLDivElement>(null);

  // ========================================
  // EFFECTS
  // ========================================

  // Lock scroll
  useLockScroll(open && lockScroll);

  // Escape key
  useEscapeKey(
    open,
    () => {
      onClose('escape');
    },
    closeOnEscape,
  );

  // Focus trap
  useFocusTrap(open, modalRef);

  // Callbacks después de transición
  useAfterTransition(onAfterOpen, open, 300);
  useAfterTransition(onAfterClose, !open, 300);

  // ========================================
  // HANDLERS
  // ========================================

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Solo cerrar si el click fue en el backdrop, no en el contenido
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose('backdrop');
    }
  };

  // ========================================
  // RENDER
  // ========================================

  // No renderizar si no está abierto y no hay animación
  if (!open && !animated) return null;

  const childrenArray = Children.toArray(children);

  const hasItem = childrenArray.some(
    (child) => isValidElement(child) && (child.type as React.FC).displayName === 'Modal.Header',
  );

  if (!hasItem) {
    throw new Error('Modal must include a Modal.Header');
  }

  // Renderizar en portal
  return createPortal(
    <ModalContext.Provider value={{ titleId: id ? `${id}-title` : undefined }}>
      {/* Backdrop */}
      <S.Backdrop
        $open={open}
        $blur={backdropBlur}
        $animated={animated}
        onClick={
          closeOnBackdropClick
            ? () => {
                onClose('backdrop');
              }
            : undefined
        }
        aria-hidden="true"
      />

      {/* Modal Container */}
      {open && (
        <S.ModalContainer $position={position} onClick={handleBackdropClick} role="presentation">
          <S.ModalContent
            ref={modalRef}
            $size={size}
            $position={position}
            $animated={animated}
            $open={open}
            className={className}
            id={id}
            role="dialog"
            aria-modal="true"
            aria-labelledby={id ? `${id}-title` : undefined}
          >
            {children}
          </S.ModalContent>
        </S.ModalContainer>
      )}
    </ModalContext.Provider>,
    document.body,
  );
};

Modal.displayName = 'Modal';
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
