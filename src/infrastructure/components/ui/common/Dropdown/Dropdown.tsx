/**
 * Dropdown — Trigger genérico + lista de acciones (flotante)
 *
 * Acepta cualquier ReactNode como trigger (Button, Avatar, icono…).
 * El panel se renderiza vía createPortal + useFloatingPanel para:
 * - Evitar recorte por overflow:hidden en ancestros.
 * - Auto-flip cuando no hay espacio en el viewport.
 *
 * Keyboard: ↑↓ navegan, Enter selecciona, Escape cierra.
 *
 * SOLID:
 * - SRP: lógica de teclado/selección en handlers, render en componente.
 * - DIP: depende de DropdownProps (contrato) y useFloatingPanel (hook genérico).
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { useFloatingPanel } from '@infra/hooks/useFloatingPanel';
import type { TPopoverPlacement } from '@infra/components/ui/common/Popover/Popover.types';
import type { DropdownProps, DropdownItem } from './Dropdown.types';
import * as S from './Dropdown.styles';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convierte align prop a placement de useFloatingPanel */
const alignToPlacement = (align: 'left' | 'right'): TPopoverPlacement =>
  align === 'right' ? 'bottom-end' : 'bottom-start';

// ─── Component ────────────────────────────────────────────────────────────────

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  disabled = false,
  minWidth = '180px',
  align = 'left',
}) => {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const triggerRef = useRef<HTMLDivElement>(null);

  const enabledItems = items.filter((i) => !i.disabled);

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

  // ── Keyboard ──────────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          open();
        }
        return;
      }
      const count = enabledItems.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, count - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && activeIdx >= 0) {
        e.preventDefault();
        handleSelect(enabledItems[activeIdx]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    },
    [isOpen, open, close, enabledItems, activeIdx, handleSelect],
  );

  return (
    <>
      {/* Trigger wrapper */}
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
          <S.DropdownPanel
            ref={panelRef}
            role="menu"
            $minWidth={minWidth}
            style={floatingStyles}
            aria-label={t('dropdown.menuAriaLabel')}
          >
            {items.map((item) => {
              const enabledIdx = enabledItems.indexOf(item);
              return (
                <S.MenuItem
                  key={item.id}
                  type="button"
                  role="menuitem"
                  $danger={item.danger ?? false}
                  $active={enabledIdx === activeIdx}
                  disabled={item.disabled}
                  onClick={() => {
                    handleSelect(item);
                  }}
                  onMouseEnter={() => {
                    setActiveIdx(enabledIdx);
                  }}
                  onMouseLeave={() => {
                    setActiveIdx(-1);
                  }}
                  tabIndex={-1}
                >
                  {item.icon && (
                    <S.MenuItemIcon $danger={item.danger ?? false}>{item.icon}</S.MenuItemIcon>
                  )}
                  <S.MenuItemLabel>{item.label}</S.MenuItemLabel>
                  {item.shortcut && <S.MenuItemShortcut>{item.shortcut}</S.MenuItemShortcut>}
                </S.MenuItem>
              );
            })}
          </S.DropdownPanel>,
          document.body,
        )}
    </>
  );
};

Dropdown.displayName = 'Dropdown';
