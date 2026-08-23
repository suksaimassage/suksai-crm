/**
 * Modal Component - Public API
 *
 * Sistema completo de modales y diálogos
 *
 * @example
 * import { Modal, ModalHeader, ModalBody, ModalFooter, Dialog, useModal } from '@components/ui/Modal';
 */

// Components
// Default export
export { Modal } from './Modal';

// Hooks
export { useModal, useLockScroll, useEscapeKey, useFocusTrap } from './Modal.hooks';

// Types
export type {
  IModalProps,
  IModalHeaderProps,
  IModalBodyProps,
  IModalFooterProps,
  TModalSize,
  TModalPosition,
  TModalCloseReason,
  IBackdropProps,
} from './Modal.types';
