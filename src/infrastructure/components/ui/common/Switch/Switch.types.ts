/**
 * Switch — Types
 * ISP: interfaces mínimas por responsabilidad.
 */

import type { ReactNode } from 'react';

export type SwitchVariant = 'default' | 'soft' | 'card';
export type SwitchSize = 'sm' | 'md' | 'lg';
export type SwitchColor = 'primary' | 'success' | 'warning' | 'danger';

export interface SwitchProps {
  /** Nombre del campo (form-friendly, registra en FormContext) */
  readonly name?: string;
  readonly label?: string;
  readonly description?: string;
  /** Icono mostrado dentro del thumb cuando está ON */
  readonly iconOn?: ReactNode;
  /** Icono mostrado dentro del thumb cuando está OFF */
  readonly iconOff?: ReactNode;
  /** Label izquierda del track (p.ej. "No") */
  readonly labelOff?: string;
  /** Label derecha del track (p.ej. "Sí") */
  readonly labelOn?: string;
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly onChange?: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly size?: SwitchSize;
  readonly variant?: SwitchVariant;
  readonly color?: SwitchColor;
  readonly className?: string;
}
