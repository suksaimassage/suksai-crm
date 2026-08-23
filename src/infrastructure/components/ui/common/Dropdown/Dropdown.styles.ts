/**
 * Dropdown — Styled Components
 *
 * El panel se renderiza en document.body vía createPortal.
 * El posicionamiento (top, left, z-index) se aplica con inline styles
 * desde useFloatingPanel. Aquí solo estilos visuales.
 *
 * SRP: solo estilos, cero lógica.
 */

import styled from 'styled-components';

// ─── Trigger wrapper ─────────────────────────────────────────────────────────
// Ya no necesita position:relative — el panel flota vía portal.

export const DropdownTrigger = styled.div<{ $disabled: boolean }>`
  display: inline-flex;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.48 : 1)};
`;

// ─── Panel ───────────────────────────────────────────────────────────────────
// Se renderiza en document.body. Posición viene por inline styles.

export const DropdownPanel = styled.div<{ $minWidth: string }>`
  min-width: ${({ $minWidth }) => $minWidth};

  background: ${({ theme }) => theme.color.background.light};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.effect.shadow.outer.md};

  overflow: hidden;
  padding: 4px 0;
`;

// ─── Items ────────────────────────────────────────────────────────────────────

export const MenuItem = styled.button<{ $danger: boolean; $active: boolean }>`
  appearance: none;
  border: none;
  margin: 0;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 12px;

  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 0.875rem;
  line-height: 1.4;

  color: ${({ $danger, theme }) => ($danger ? theme.color.error[500] : theme.color.text.primary)};

  background: ${({ $active, $danger, theme }) =>
    $active
      ? $danger
        ? theme.color.intent.errorZone
        : theme.color.background.neutral
      : 'transparent'};

  transition: background ${({ theme }) => theme.transition.duration.fast};

  &:hover {
    background: ${({ $danger, theme }) =>
      $danger ? theme.color.intent.errorZone : theme.color.background.neutral};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const MenuItemIcon = styled.span<{ $danger: boolean }>`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: ${({ $danger, theme }) => ($danger ? theme.color.error[400] : theme.color.neutral[400])};

  svg {
    width: 15px;
    height: 15px;
    display: block;
  }
`;

export const MenuItemLabel = styled.span`
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const MenuItemShortcut = styled.kbd`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 0.6875rem;
  color: ${({ theme }) => theme.color.text.tertiary};
  background: ${({ theme }) => theme.color.background.neutral};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: 4px;
  padding: 1px 5px;
  white-space: nowrap;
`;

export const Separator = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  margin: 4px 0;
`;

export const GroupHeader = styled.div`
  padding: 6px 12px 3px;
  font-size: 0.6875rem;
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.color.text.tertiary};
`;
