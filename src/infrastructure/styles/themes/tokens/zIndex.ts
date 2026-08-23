/**
 * tokens/zIndex.ts — Stacking order tokens
 *
 * Semantic levels — never use raw integers in components.
 * Each level is 100 apart to allow local adjustments within a layer.
 */

export const zIndex = {
  hide: -1, // visually hidden but in DOM
  base: 0, // default document flow
  dropdown: 1000, // menus, comboboxes
  sticky: 1100, // sticky table headers, floating labels
  fixed: 1200, // fixed nav bars
  overlay: 1300, // modal backdrop scrim
  modal: 1400, // modal dialogs, drawers
  popover: 1500, // popovers, date pickers
  toast: 1600, // toast notifications
  tooltip: 1700, // tooltips (highest — always on top)
} as const;

export type ZIndexToken = typeof zIndex;
export type ZIndexKey = keyof ZIndexToken;
