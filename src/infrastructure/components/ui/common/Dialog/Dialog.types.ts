import type { ReactNode } from 'react';
import type { IModalProps } from '@infra/components/ui/common/Modal/Modal.types';

export type TDialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm';
/**
 * Props del Dialog (confirmación)
 */
export interface IDialogProps extends Omit<IModalProps, 'children'> {
  /** Título del dialog */
  readonly title: string;

  /** Mensaje del dialog */
  readonly message: string | ReactNode;

  /** Tipo de dialog */
  readonly type?: TDialogType;

  /** Texto del botón de confirmar */
  readonly confirmText?: string;

  /** Texto del botón de cancelar */
  readonly cancelText?: string;

  /** Callback al confirmar */
  readonly onConfirm?: () => void;

  /** Callback al cancelar */
  readonly onCancel?: () => void;

  /** Mostrar botón de cancelar */
  readonly showCancel?: boolean;

  /** Loading en botón de confirmar */
  readonly loading?: boolean;

  /**
   * Texto del botón de confirmar mientras `loading` es true.
   * Si se omite, el Dialog lo resuelve a la clave i18n `common:loading`
   * (cargada al boot), evitando texto en inglés sin traducir.
   */
  readonly loadingText?: string;

  /** Color del botón de confirmar según tipo */
  readonly autoButtonColor?: boolean;
}
