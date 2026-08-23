/**
 * Select — Types
 *
 * ISP: interfaces mínimas y separadas por responsabilidad.
 */

import type { InputSize, InputVariant } from '@infra/components/ui/common/Form/Form.item.types';
import type { ReactNode } from 'react';

export interface ISelectOption {
  readonly type?: 'option';
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
}

export interface ISelectOptionGroup {
  readonly type?: 'group';
  readonly group: string;
  readonly options: ISelectOption[];
}

export type TSelectOptions = ISelectOption[] | ISelectOptionGroup[];

// Discrimina si el array es de grupos o de opciones planas
export function isGrouped(opts: TSelectOptions): opts is ISelectOptionGroup[] {
  return opts.every((item) => item.type === 'group');
}

export interface ISelectProps {
  // Identity — overrides internal useId() when label htmlFor linkage is needed
  readonly id?: string;

  // Valor
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: (value: string) => void;

  // Opciones
  readonly options: TSelectOptions;
  readonly placeholder?: string;

  // Apariencia — mismos tokens que FormInput
  readonly label?: string;
  readonly helperText?: string;
  readonly error?: string;
  readonly size?: InputSize;
  readonly variant?: InputVariant;
  readonly leftIcon?: ReactNode;

  // Estado
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly searchable?: boolean; // filtra opciones al escribir
  readonly clearable?: boolean;
}
