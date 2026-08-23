/**
 * Dialog Component
 *
 * Componente de diálogo para confirmaciones
 * Reutiliza Modal internamente
 *
 * Principios SOLID:
 * - Single Responsibility: Solo maneja diálogos de confirmación
 * - Composition: Usa Modal + Modal.Header + Modal.Body + Modal.Footer
 *
 * @example
 * <Dialog
 *   open={isOpen}
 *   onClose={handleClose}
 *   type="confirm"
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   onConfirm={handleDelete}
 * />
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
// Importar Button (asumiendo que existe)
// Si no existe, usar buttons HTML por ahora
import { Button, type TButtonColor } from '@infra/components/ui/common/Button';
import { Modal } from '@infra/components/ui/common/Modal';
import { Spinner } from '@infra/components/ui/common/Spinner';
import type { IDialogProps } from './Dialog.types';
import * as S from './Dialog.styles';

// ========================================
// ICONS
// ========================================

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const XCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const QuestionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ========================================
// DIALOG COMPONENT
// ========================================

export const Dialog: React.FC<IDialogProps> = ({
  open,
  onClose,
  title,
  message,
  type = 'confirm',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = true,
  loading = false,
  loadingText,
  autoButtonColor = true,
  size = 'sm',
  id,
  ...modalProps
}) => {
  const { t } = useTranslation('common');
  // Stable id so Modal can wire aria-labelledby → the dialog title (accessible
  // name, WCAG 4.1.2). Falls back to a generated id when the caller omits one.
  const generatedId = React.useId();
  const dialogId = id ?? generatedId;
  // Localized confirm-button label while a mutation is in flight. Defaults to the
  // shared `common:loading` key (always loaded at boot) so no Dialog consumer ever
  // surfaces a raw English "Loading…" string; consumers may override via `loadingText`.
  const resolvedLoadingText = loadingText ?? t('loading');
  // ========================================
  // HANDLERS
  // ========================================

  const handleConfirm = () => {
    onConfirm?.();
    // No cerrar automáticamente para permitir loading state
  };

  const handleCancel = () => {
    onCancel?.();
    onClose('action');
  };

  // ========================================
  // COLOR DEL BOTÓN SEGÚN TIPO
  // ========================================

  const getButtonColor = (): TButtonColor => {
    if (!autoButtonColor) return 'primary';

    const colorMap = {
      info: 'info',
      success: 'success',
      warning: 'warning',
      error: 'error',
      confirm: 'primary',
    };

    return colorMap[type] as TButtonColor;
  };

  // ========================================
  // RENDER ICON
  // ========================================

  const renderIcon = () => {
    const icons = {
      info: <InfoIcon />,
      success: <CheckIcon />,
      warning: <AlertIcon />,
      error: <XCircleIcon />,
      confirm: <QuestionIcon />,
    };

    return <S.DialogIcon $type={type}>{icons[type]}</S.DialogIcon>;
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      position="center"
      id={dialogId}
      {...modalProps}
    >
      <Modal.Header
        title={title}
        showCloseButton={true}
        onClose={() => {
          onClose('close-button');
        }}
      />

      <Modal.Body padding="lg">
        {/* Icon */}
        {renderIcon()}

        {/* Message */}
        <div style={{ textAlign: 'center' }}>
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
      </Modal.Body>

      <Modal.Footer align="center">
        {showCancel && (
          <Button onClick={handleCancel} variant="ghost" disabled={loading}>
            {cancelText}
          </Button>
        )}

        <Button
          onClick={handleConfirm}
          variant="solid"
          color={getButtonColor()}
          disabled={loading}
          loading={loading}
          loadingText={resolvedLoadingText}
          loadingIcon={
            // Decorative: the localized loadingText + the Button's own aria-busy
            // already convey the loading state, so the spinner is hidden from the
            // a11y tree — keeping the button's accessible name to just the text.
            <span aria-hidden="true">
              <Spinner size="xs" tone="inherit" />
            </span>
          }
        >
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

Dialog.displayName = 'Dialog';
