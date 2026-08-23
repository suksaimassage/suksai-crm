/**
 * Dropdown / DropdownMenu — Types
 *
 * Dropdown:     trigger genérico (cualquier ReactNode) + lista de acciones.
 * DropdownMenu: extensión con items tipados (item, separator, group, header).
 */

import type { ReactNode } from 'react';
import type { DropdownEntry } from '@infra/components/ui/common/Dropdown/Dropdown.types';

// ─── DropdownMenu ─────────────────────────────────────────────────────────────

export interface DropdownMenuProps {
  readonly trigger: ReactNode;
  readonly entries: DropdownEntry[];
  readonly disabled?: boolean;
  readonly minWidth?: string;
  readonly align?: 'left' | 'right';
}
