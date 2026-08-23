/**
 * Popover Component — Public API
 *
 * Sistema completo de popovers: posicionamiento inteligente,
 * accesibilidad y libre de flicker.
 *
 * @example
 * import { Popover, PopoverHeader, PopoverBody, usePopover } from '@ui/over/Popover';
 */

// ── Components ──────────────────────────────────────────────────────────────
export { Popover as default } from './Popover';
export { Popover } from './Popover';
export { PopoverHeader, PopoverBody } from './PopoverParts';

// ── Hooks ────────────────────────────────────────────────────────────────────
export {
  usePopover,
  useClickOutside,
  usePopoverPosition,
  useEscapeKey,
  useHoverDelay,
  useFocusReturn,
} from './Popover.hooks';

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  PopoverProps,
  PopoverHeaderProps,
  PopoverBodyProps,
  TPopoverPlacement,
  TPopoverSurfaceRole,
  TAriaHasPopup,
  PopoverTrigger,
  PopoverPosition,
  ElementDimensions,
  PositionOptions,
  TriggerProps,
} from './Popover.types';

// ── Utilities ─────────────────────────────────────────────────────────────────
export {
  calculatePopoverPosition,
  getElementDimensions,
  getOppositePlacement,
} from './Popover.utils';
