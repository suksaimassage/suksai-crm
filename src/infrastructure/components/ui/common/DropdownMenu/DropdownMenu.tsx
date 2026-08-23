/**
 * DropdownMenu — Menú contextual con entradas tipadas (flotante)
 *
 * Extiende Dropdown con soporte para separadores, headers y grupos.
 * Cada entrada tiene un `type` discriminante:
 *   "item"      → botón de acción
 *   "separator" → línea divisoria
 *   "header"    → etiqueta de sección (no clickable)
 *   "group"     → header + items anidados
 *
 * El panel se renderiza vía createPortal + useFloatingPanel para:
 * - Evitar recorte por overflow:hidden en ancestros.
 * - Auto-flip cuando no hay espacio en el viewport.
 *
 * SOLID:
 * - SRP: lógica de navegación en handlers, render en componente.
 * - OCP: nuevos tipos de entrada se añaden sin modificar el render existente.
 * - DIP: depende de DropdownMenuProps (contrato) y useFloatingPanel (hook).
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFloatingPanel } from '@infra/hooks/useFloatingPanel';
import type {
  DropdownEntry,
  DropdownItem,
} from '@infra/components/ui/common/Dropdown/Dropdown.types';
import type { TPopoverPlacement } from '@infra/components/ui/common/Popover';
import type { DropdownMenuProps } from './DropdownMenu.types';
import * as S from '../Dropdown/Dropdown.styles';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrae todos los DropdownItem activos (no disabled) de la lista de entries */
function collectItems(entries: DropdownEntry[]): DropdownItem[] {
  const result: DropdownItem[] = [];
  for (const entry of entries) {
    if (entry.type === 'item' && !entry.disabled) result.push(entry);
    if (entry.type === 'group') result.push(...entry.items.filter((i) => !i.disabled));
  }
  return result;
}

/** Convierte align prop a placement de useFloatingPanel */
const alignToPlacement = (align: 'left' | 'right'): TPopoverPlacement =>
  align === 'right' ? 'bottom-end' : 'bottom-start';

// ─── Component ────────────────────────────────────────────────────────────────

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  entries,
  disabled = false,
  minWidth = '200px',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const triggerRef = useRef<HTMLDivElement>(null);

  const navigable = collectItems(entries);

  // ── Floating panel (portal + auto-flip) ───────────────────────────────────

  const { panelRef, floatingStyles, mounted } = useFloatingPanel(triggerRef, isOpen, {
    placement: alignToPlacement(align),
    offset: 6,
  });

  const open = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      setActiveIdx(-1);
    }
  }, [disabled]);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIdx(-1);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  const handleSelect = useCallback(
    (item: DropdownItem) => {
      if (item.disabled) return;
      item.onClick?.();
      close();
    },
    [close],
  );

  // ── Click-outside (incluye panel en portal) ───────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = triggerRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inTrigger && !inPanel) close();
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen, close, panelRef]);

  // ── Keyboard navigation ───────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
          e.preventDefault();
          open();
        }
        return;
      }
      const count = navigable.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, count - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && activeIdx >= 0) {
        e.preventDefault();
        handleSelect(navigable[activeIdx]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    },
    [isOpen, open, close, navigable, activeIdx, handleSelect],
  );

  return (
    <>
      {/* Trigger */}
      <S.DropdownTrigger
        ref={triggerRef}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        $disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </S.DropdownTrigger>

      {/* Panel flotante vía portal */}
      {isOpen &&
        mounted &&
        createPortal(
          <S.DropdownPanel ref={panelRef} role="menu" $minWidth={minWidth} style={floatingStyles}>
            {entries.map((entry) => {
              if (entry.type === 'separator') {
                return <S.Separator key={entry.id} role="separator" />;
              }
              if (entry.type === 'header') {
                return <S.GroupHeader key={entry.id}>{entry.label}</S.GroupHeader>;
              }
              if (entry.type === 'group') {
                return (
                  <div key={entry.id} role="group" aria-label={entry.label}>
                    <S.GroupHeader>{entry.label}</S.GroupHeader>
                    {entry.items.map((item) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        active={navigable.indexOf(item) === activeIdx}
                        onSelect={handleSelect}
                        onHover={() => {
                          setActiveIdx(navigable.indexOf(item));
                        }}
                        onLeave={() => {
                          setActiveIdx(-1);
                        }}
                      />
                    ))}
                  </div>
                );
              }
              // type === "item"
              return (
                <MenuItemRow
                  key={entry.id}
                  item={entry}
                  active={navigable.indexOf(entry) === activeIdx}
                  onSelect={handleSelect}
                  onHover={() => {
                    setActiveIdx(navigable.indexOf(entry));
                  }}
                  onLeave={() => {
                    setActiveIdx(-1);
                  }}
                />
              );
            })}
          </S.DropdownPanel>,
          document.body,
        )}
    </>
  );
};

DropdownMenu.displayName = 'DropdownMenu';

// ─── MenuItemRow ──────────────────────────────────────────────────────────────

interface MenuItemRowProps {
  item: DropdownItem;
  active: boolean;
  onSelect: (i: DropdownItem) => void;
  onHover: () => void;
  onLeave: () => void;
}

const MenuItemRow: React.FC<MenuItemRowProps> = ({ item, active, onSelect, onHover, onLeave }) => (
  <S.MenuItem
    type="button"
    role="menuitem"
    $danger={item.danger ?? false}
    $active={active}
    disabled={item.disabled}
    onClick={() => {
      onSelect(item);
    }}
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
    tabIndex={-1}
  >
    {item.icon && <S.MenuItemIcon $danger={item.danger ?? false}>{item.icon}</S.MenuItemIcon>}
    <S.MenuItemLabel>{item.label}</S.MenuItemLabel>
    {item.shortcut && <S.MenuItemShortcut>{item.shortcut}</S.MenuItemShortcut>}
  </S.MenuItem>
);
