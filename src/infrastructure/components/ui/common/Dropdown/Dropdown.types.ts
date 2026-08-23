/**
 * Dropdown / DropdownMenu — Types
 *
 * Dropdown:     trigger genérico (cualquier ReactNode) + lista de acciones.
 * DropdownMenu: extensión con items tipados (item, separator, group, header).
 */

import type { ReactNode } from 'react';

// ─── Item primitivo ───────────────────────────────────────────────────────────

export interface DropdownItem {
  readonly type: 'item';
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly shortcut?: string; // p.ej. "⌘K"
  readonly danger?: boolean; // tono rojo
  readonly disabled?: boolean;
  readonly onClick?: () => void;
}

export interface DropdownSeparator {
  readonly type: 'separator';
  readonly id: string;
}

export interface DropdownHeader {
  readonly type: 'header';
  readonly id: string;
  readonly label: string;
}

export interface DropdownGroup {
  readonly type: 'group';
  readonly id: string;
  readonly label: string;
  readonly items: DropdownItem[];
}

export type DropdownEntry = DropdownItem | DropdownSeparator | DropdownHeader | DropdownGroup;

// ─── Dropdown ─────────────────────────────────────────────────────────────────

export interface DropdownProps {
  /** Elemento que activa el dropdown al hacer click */
  readonly trigger: ReactNode;
  readonly items: DropdownItem[];
  readonly disabled?: boolean;
  /** Ancho mínimo del panel. @default "180px" */
  readonly minWidth?: string;
  /** Alineación del panel respecto al trigger. @default "left" */
  readonly align?: 'left' | 'right';
}
