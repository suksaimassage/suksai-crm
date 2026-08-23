/**
 * Image.types.ts
 *
 * All public and internal types for the Image + Lightbox component.
 * Path: src/components/ui/common/Image/Image.types.ts
 */

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

export interface ImageProps {
  /** Image source URL */
  src: string;
  /** Descriptive alt text — required for accessibility */
  alt: string;
  /** CSS width of the thumbnail wrapper (number = px, string = any CSS unit) */
  width?: number | string;
  /** CSS height of the thumbnail wrapper */
  height?: number | string;
  /** CSS aspect-ratio shorthand, e.g. "16/9", "1/1", "4/3" */
  aspectRatio?: string;
  /** Optional caption rendered in a <figcaption> below the thumbnail */
  caption?: string;
  /** Enable fullscreen lightbox on click / Enter / Space */
  lightbox?: boolean;
  /** object-fit strategy applied to the thumbnail image */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Border-radius override — falls back to theme.border.radius.md */
  borderRadius?: string;
  /** Additional className applied to the outermost wrapper */
  className?: string;
  /** Fired when the lightbox finishes its enter animation */
  onOpen?: () => void;
  /** Fired after the lightbox finishes its exit animation */
  onClose?: () => void;
}

// ─────────────────────────────────────────────────────────────
// INTERNAL — Animation
// ─────────────────────────────────────────────────────────────

/**
 * Controls which CSS keyframe plays on the overlay and content shell.
 * 'idle' means no animation is running (overlay is fully visible).
 */
export type AnimationPhase = 'entering' | 'idle' | 'exiting';

// ─────────────────────────────────────────────────────────────
// INTERNAL — Zoom / pan
// ─────────────────────────────────────────────────────────────

export interface ZoomTransform {
  /** Current zoom scale; clamped to [MIN_SCALE, MAX_SCALE] */
  scale: number;
  /** Horizontal pan offset in px, applied inside the zoomed coordinate space */
  panX: number;
  /** Vertical pan offset in px */
  panY: number;
}

// ─────────────────────────────────────────────────────────────
// INTERNAL — Gesture tracking (mutable ref, NOT React state)
// ─────────────────────────────────────────────────────────────

/**
 * All pointer / touch gesture state is kept in a single mutable ref
 * to avoid stale closures and unnecessary re-renders during drag.
 */
export interface GestureState {
  // ── drag / pan ────────────────────────────────────────────
  isDragging: boolean;
  dragOriginX: number;
  dragOriginY: number;
  panAtDragStart: { x: number; y: number };

  // ── pinch ─────────────────────────────────────────────────
  pinchStartDistance: number;
  pinchStartScale: number;

  // ── double-tap ────────────────────────────────────────────
  lastTapTimestamp: number;

  // ── swipe-to-close ────────────────────────────────────────
  swipeOriginY: number;
  /** Accumulated downward-only delta in px */
  swipeRawDelta: number;
  swipeLastY: number;
  swipeLastTime: number;
  /** px / ms — measured between last two touchmove events */
  swipeVelocity: number;
}

// ─────────────────────────────────────────────────────────────
// INTERNAL — Styled-component transient props
// ─────────────────────────────────────────────────────────────

export interface ThumbnailWrapperProps {
  $width?: number | string;
  $height?: number | string;
  $aspectRatio?: string;
  $borderRadius?: string;
  /** Whether the thumbnail is clickable (lightbox enabled) */
  $interactive: boolean;
}

export interface StyledImgProps {
  $loaded: boolean;
  $objectFit: NonNullable<ImageProps['objectFit']>;
}

export interface SkeletonProps {
  $visible: boolean;
}

export interface BackdropProps {
  $phase: AnimationPhase;
}

export interface ContentShellProps {
  $phase: AnimationPhase;
}

export interface ZoomBadgeProps {
  $visible: boolean;
}
