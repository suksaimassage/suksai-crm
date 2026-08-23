/**
 * Image.constants.ts
 *
 * Central source-of-truth for all numeric thresholds and configuration
 * values used by the Image + Lightbox component.
 *
 * Path: src/components/ui/common/Image/Image.constants.ts
 */

/** Duration of overlay enter / exit CSS animations in milliseconds */
export const ANIM_MS = 260;

/** Minimum zoom scale (natural size) */
export const MIN_SCALE = 1;

/** Maximum zoom scale */
export const MAX_SCALE = 6;

/** Scale increment/decrement per scroll wheel tick */
export const SCROLL_ZOOM_STEP = 0.25;

/** Scale applied on double-tap when zoomed out */
export const DOUBLE_TAP_ZOOM_LEVEL = 2.5;

/** Maximum milliseconds between two taps to qualify as a double-tap */
export const DOUBLE_TAP_WINDOW_MS = 300;

/** Minimum downward swipe distance (px) required to close the lightbox */
export const SWIPE_CLOSE_PX = 110;

/** Minimum swipe velocity (px / ms) required to close regardless of distance */
export const SWIPE_CLOSE_VEL = 0.55;

/** How long the zoom badge stays visible after a zoom interaction (ms) */
export const ZOOM_BADGE_TIMEOUT_MS = 1400;
