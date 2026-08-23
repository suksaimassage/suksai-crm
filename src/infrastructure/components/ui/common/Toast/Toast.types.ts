/**
 * Toast — Types
 * ISP: interfaces mínimas por responsabilidad.
 */

import type { ReactNode } from 'react';

export type TToastType = 'success' | 'error' | 'warning' | 'info' | 'default';
export type TToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

export type TToastAction =
  | { type: 'ADD'; payload: IToastProps }
  | { type: 'DISMISS'; payload: string }
  | { type: 'DISMISS_ALL' };

// ─── Toast individual ─────────────────────────────────────────────────────────

export interface IToastProps {
  readonly id: string;
  readonly type: TToastType;
  readonly title: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  /** ms. 0 = no auto-cierra. @default 4000 */
  readonly duration?: number;
  readonly action?: { label: string; onClick: () => void };
  /** Posición de este toast. Si se omite usa defaultPosition del Provider. */
  readonly position?: TToastPosition;
}

// ─── Opciones comunes para los atajos semánticos ──────────────────────────────

export type TToastShortcutOptions = Partial<Omit<IToastProps, 'id' | 'type' | 'title'>>;

// ─── Context value ────────────────────────────────────────────────────────────

export interface IToastContextValue {
  toast: (options: Omit<IToastProps, 'id'>) => string;
  success: (title: string, options?: TToastShortcutOptions) => string;
  error: (title: string, options?: TToastShortcutOptions) => string;
  warning: (title: string, options?: TToastShortcutOptions) => string;
  info: (title: string, options?: TToastShortcutOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ─── Provider props ───────────────────────────────────────────────────────────

export interface IToastProviderProps {
  readonly children: ReactNode;
  /** Posición por defecto para todos los toasts. @default "top-right" */
  readonly defaultPosition?: TToastPosition;
  /** Máx. toasts por posición. @default 5 */
  readonly maxToasts?: number;
}
