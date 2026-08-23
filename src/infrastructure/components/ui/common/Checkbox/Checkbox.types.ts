/**
 * Checkbox — Types
 * ISP: interfaces mínimas por responsabilidad.
 * Checkbox: boolean. CheckboxGroup: string[] (multi-selección).
 */

import type { TSizes } from '@infra/styles/themes/theme.types';
import type { ReactNode } from 'react';

export type TCheckboxVariant = 'default' | 'card' | 'button';
export type TCheckboxSize = Extract<TSizes, 'sm' | 'md' | 'lg'>;
export type TCheckboxOrientation = 'horizontal' | 'vertical';

// ─── Checkbox individual ──────────────────────────────────────────────────────

export interface ICheckboxProps {
  /** Nombre del campo (form-friendly) */
  readonly name?: string;
  readonly label?: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly checked?: boolean;
  /** Estado indeterminado (p.ej. "seleccionar todos" parcial) */
  readonly indeterminate?: boolean;
  readonly onChange?: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly size?: TCheckboxSize;
  readonly variant?: TCheckboxVariant;
  readonly className?: string;
}

// ─── CheckboxGroup ────────────────────────────────────────────────────────────

export interface ICheckboxOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
}

export interface ICheckboxGroupProps {
  readonly name: string;
  readonly options: readonly ICheckboxOption[];
  /** Valores seleccionados */
  readonly value?: string[];
  readonly onChange?: (values: string[]) => void;
  readonly variant?: TCheckboxVariant;
  readonly size?: TCheckboxSize;
  readonly orientation?: TCheckboxOrientation;
  readonly label?: string;
  readonly error?: string;
  readonly hint?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly className?: string;
}
