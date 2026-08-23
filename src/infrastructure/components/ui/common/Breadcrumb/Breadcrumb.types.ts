/**
 * Breadcrumb — Types
 * ISP: interfaces mínimas y separadas por responsabilidad.
 */

import type { ReactNode } from 'react';

// ─── Variantes visuales ───────────────────────────────────────────────────────

export type TBreadcrumbVariant =
  | 'default' // Sin contenedor, texto plano
  | 'pills' // Cada ítem con fondo redondeado
  | 'contained' // Barra con fondo y borde
  | 'underline'; // El ítem activo con subrayado de color

// ─── Separador ────────────────────────────────────────────────────────────────

// The `(string & {})` trick preserves IntelliSense suggestions while allowing
// any string without triggering `no-redundant-type-constituents`.
export type TBreadcrumbSeparator =
  | '/'
  | '>'
  | '›'
  | '→'
  | (string & {})
  | Exclude<ReactNode, string>;

// ─── Ítem del breadcrumb ─────────────────────────────────────────────────────

/** Opción dentro del DropdownMenu de un ítem (rutas alternativas) */
export interface IBreadcrumbDropdownOption {
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly icon?: ReactNode;
  readonly onClick?: () => void;
}

export interface IBreadcrumbItem {
  readonly id: string;
  readonly label: string;

  /** URL de navegación. Sin href → ítem no es enlace. */
  readonly href?: string;

  /** Icono a la izquierda del label */
  readonly icon?: ReactNode;

  /**
   * Parámetros de ruta para mostrar junto al label.
   * Ej: { id: "42" } → "Pedido #42"
   */
  readonly params?: Record<string, string | number>;

  /**
   * Rutas alternativas accesibles desde este punto.
   * Activa un DropdownMenu en el ítem.
   */
  readonly dropdownOptions?: readonly IBreadcrumbDropdownOption[];

  /**
   * Si true, se aplica el estilo de "ítem activo/resaltado"
   * aunque no sea el último de la lista.
   */
  readonly highlight?: boolean;

  /** Deshabilitar la navegación del ítem */
  readonly disabled?: boolean;
}

// ─── Breadcrumb props ─────────────────────────────────────────────────────────

export interface IBreadcrumbProps {
  readonly items: readonly IBreadcrumbItem[];
  readonly variant?: TBreadcrumbVariant;
  /** Separador entre ítems. Default: "/" */
  readonly separator?: TBreadcrumbSeparator;
  /**
   * Colapsa el breadcrumb en mobile cuando hay más de N ítems,
   * mostrando "… > último".
   * @default 0 (sin colapso)
   */
  readonly maxItems?: number;
  readonly className?: string;
  readonly 'aria-label'?: string;
}
