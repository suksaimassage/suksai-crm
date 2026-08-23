/**
 * Radio — Types
 * ISP: interfaces mínimas y separadas por responsabilidad.
 */

import type { ReactNode } from 'react';

// ─── Variantes ────────────────────────────────────────────────────────────────

export type RadioVariant =
  | 'default' // Círculo nativo estilizado
  | 'card' // Ítem con borde/fondo como card seleccionable
  | 'button'; // RadioGroup como segmented-button strip

export type RadioSize = 'sm' | 'md' | 'lg';

// ─── Radio individual ─────────────────────────────────────────────────────────

export interface RadioProps {
  /** Valor que representa este radio */
  readonly value: string;
  /** Label visible */
  readonly label?: string;
  /** Descripción secundaria (visible en variant="card") */
  readonly description?: string;
  /** Icono a la izquierda del label */
  readonly icon?: ReactNode;
  /** Controlado: valor seleccionado actualmente */
  readonly checked?: boolean;
  /** Callback al seleccionar */
  readonly onChange?: (value: string) => void;
  readonly name?: string;
  readonly disabled?: boolean;
  readonly size?: RadioSize;
  readonly variant?: RadioVariant;
  readonly className?: string;
  /**
   * Accessible name for the underlying input. Use when the visible label is
   * absent or insufficient (e.g. a per-row radio in a distributed radiogroup
   * that needs to name the entity it controls).
   */
  readonly ariaLabel?: string;
}

// ─── RadioGroup ───────────────────────────────────────────────────────────────

export interface RadioOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
}

export interface RadioGroupProps {
  /** Nombre del campo (form-friendly) */
  readonly name: string;
  readonly options: readonly RadioOption[];
  /** Valor seleccionado */
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly variant?: RadioVariant;
  readonly size?: RadioSize;
  /** Orientación del grupo */
  readonly orientation?: 'horizontal' | 'vertical';
  /** Label del grupo (accesibilidad + UI) */
  readonly label?: string;
  /** Mensaje de error */
  readonly error?: string;
  /** Helper text */
  readonly hint?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly className?: string;
}
