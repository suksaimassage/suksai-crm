/**
 * Image.tsx
 *
 * Production-grade Image component with advanced Lightbox.
 * Part of the vti-core-res-des-sys design system.
 *
 * Capabilities:
 *  • Skeleton loader + native lazy loading (no CLS)
 *  • CSS keyframe animations — fade + scale (GPU-composited)
 *  • Wheel zoom (desktop) | Pinch-to-zoom (mobile) | Double-tap toggle
 *  • Drag / pan when zoomed (mouse + touch)
 *  • Swipe-to-close: vertical swipe OR velocity threshold
 *  • Close via ESC key, click-outside, close button
 *  • Focus trap inside overlay → return focus to trigger on close
 *  • Strict ARIA dialog semantics
 *  • Scroll lock while overlay is open
 *  • No external UI libraries — styled-components only
 *
 * Path: src/components/ui/common/Image/Image.tsx
 */

import {
  type FC,
  type KeyboardEvent,
  memo,
  type MouseEvent,
  type TouchEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  ANIM_MS,
  DOUBLE_TAP_WINDOW_MS,
  DOUBLE_TAP_ZOOM_LEVEL,
  MAX_SCALE,
  MIN_SCALE,
  SCROLL_ZOOM_STEP,
  SWIPE_CLOSE_PX,
  SWIPE_CLOSE_VEL,
  ZOOM_BADGE_TIMEOUT_MS,
} from './Image.constants';

import {
  Backdrop,
  CloseBtn,
  ContentAnimationShell,
  FigCaption,
  ImageTransformLayer,
  LightboxImg,
  SkeletonShimmer,
  StyledImg,
  ThumbnailWrapper,
  ZoomBadge,
} from './Image.styles';

import type { AnimationPhase, GestureState, ImageProps, ZoomTransform } from './Image.types';

// ─────────────────────────────────────────────────────────────
// PURE HELPERS
// ─────────────────────────────────────────────────────────────

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getPinchDistance = (touches: React.TouchList): number => {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
};

/**
 * Builds the CSS transform string applied to ImageTransformLayer.
 * Using an inline style (not a styled-component prop) avoids injecting
 * a new CSS class on every animation frame during drag / zoom.
 */
const buildTransform = (zoom: ZoomTransform, swipeOffsetY: number): string =>
  `translate(${zoom.panX}px, calc(${zoom.panY}px + ${swipeOffsetY}px)) scale(${zoom.scale})`;

/**
 * Dims the backdrop proportionally as the user swipes down,
 * providing visual feedback that the overlay is closing.
 */
const buildBackdropBackground = (swipeOffsetY: number): string => {
  const alpha = Math.max(0, 0.94 - Math.abs(swipeOffsetY) * 0.006);
  return `rgba(14, 13, 17, ${alpha.toFixed(3)})`;
};

// ─────────────────────────────────────────────────────────────
// INTERNAL HOOKS
// ─────────────────────────────────────────────────────────────

/**
 * Locks <body> scroll while the lightbox is open by applying
 * position:fixed, then restores the previous scroll position on cleanup.
 */
function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const scrollY = window.scrollY;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}

/**
 * Traps keyboard focus inside the overlay (WCAG 2.1 — SC 2.1.2).
 * Focuses the first focusable element on activation.
 */
function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const FOCUSABLE = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const nodes = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    first.focus();

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [active, containerRef]);
}

/**
 * Attaches a **non-passive** wheel listener to the overlay element.
 * React's synthetic onWheel may be passive in some environments,
 * which would prevent calling e.preventDefault() and allow background scroll.
 */
function useNativeWheelZoom(
  targetRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  onWheelDelta: (deltaY: number) => void,
): void {
  const callbackRef = useRef(onWheelDelta);

  // Update ref after every render so the wheel handler never goes stale
  useLayoutEffect(() => {
    callbackRef.current = onWheelDelta;
  });

  useEffect(() => {
    if (!active || !targetRef.current) return;

    const el = targetRef.current;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      callbackRef.current(e.deltaY);
    };

    el.addEventListener('wheel', handler, { passive: false });
    return () => {
      el.removeEventListener('wheel', handler);
    };
  }, [active, targetRef]);
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

const INITIAL_ZOOM: ZoomTransform = { scale: 1, panX: 0, panY: 0 };

const INITIAL_GESTURE: GestureState = {
  isDragging: false,
  dragOriginX: 0,
  dragOriginY: 0,
  panAtDragStart: { x: 0, y: 0 },
  pinchStartDistance: 0,
  pinchStartScale: 1,
  lastTapTimestamp: 0,
  swipeOriginY: 0,
  swipeRawDelta: 0,
  swipeLastY: 0,
  swipeLastTime: 0,
  swipeVelocity: 0,
};

export const Image: FC<ImageProps> = memo(
  ({
    src,
    alt,
    width,
    height,
    aspectRatio,
    caption,
    lightbox = false,
    objectFit = 'cover',
    borderRadius,
    className,
    onOpen,
    onClose,
  }) => {
    const { t } = useTranslation('common');

    // ── Image load ──────────────────────────────────────────
    const [imgLoaded, setImgLoaded] = useState(false);

    // ── Overlay lifecycle ───────────────────────────────────
    const [isOpen, setIsOpen] = useState(false);
    const [phase, setPhase] = useState<AnimationPhase>('idle');

    // ── Zoom / pan ──────────────────────────────────────────
    const [zoom, setZoom] = useState<ZoomTransform>(INITIAL_ZOOM);

    // ── Swipe visual feedback (raw tracking lives in gesture ref) ─
    const [swipeOffsetY, setSwipeOffsetY] = useState(0);

    // ── Zoom badge ──────────────────────────────────────────
    const [zoomBadgeVisible, setZoomBadgeVisible] = useState(false);

    // ── Refs ────────────────────────────────────────────────
    const triggerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const gesture = useRef<GestureState>({ ...INITIAL_GESTURE });
    const zoomBadgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Derived ─────────────────────────────────────────────
    const zoomLabel = useMemo(() => `${Math.round(zoom.scale * 100)}%`, [zoom.scale]);

    // ── Scroll lock + focus trap ─────────────────────────────
    useScrollLock(isOpen);
    useFocusTrap(isOpen, overlayRef);

    // ── Cleanup timers on unmount ────────────────────────────
    useEffect(
      () => () => {
        if (zoomBadgeTimer.current) clearTimeout(zoomBadgeTimer.current);
        if (animTimer.current) clearTimeout(animTimer.current);
      },
      [],
    );

    // ── Helpers ──────────────────────────────────────────────

    const flashZoomBadge = useCallback(() => {
      setZoomBadgeVisible(true);
      if (zoomBadgeTimer.current) clearTimeout(zoomBadgeTimer.current);
      zoomBadgeTimer.current = setTimeout(() => {
        setZoomBadgeVisible(false);
      }, ZOOM_BADGE_TIMEOUT_MS);
    }, []);

    const resetTransforms = useCallback(() => {
      setZoom(INITIAL_ZOOM);
      setSwipeOffsetY(0);
    }, []);

    const applyScale = useCallback((nextScale: number, keepPan = false) => {
      setZoom((prev) => {
        const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
        return {
          scale,
          panX: scale === 1 || !keepPan ? 0 : prev.panX,
          panY: scale === 1 || !keepPan ? 0 : prev.panY,
        };
      });
    }, []);

    // ── Open / close ─────────────────────────────────────────

    const openLightbox = useCallback(() => {
      if (!lightbox) return;
      resetTransforms();
      setIsOpen(true);
      setPhase('entering');
      onOpen?.();
      if (animTimer.current) clearTimeout(animTimer.current);
      animTimer.current = setTimeout(() => {
        setPhase('idle');
      }, ANIM_MS);
    }, [lightbox, onOpen, resetTransforms]);

    const closeLightbox = useCallback(() => {
      setPhase('exiting');
      if (animTimer.current) clearTimeout(animTimer.current);
      animTimer.current = setTimeout(() => {
        setIsOpen(false);
        setPhase('idle');
        resetTransforms();
        onClose?.();
        // Return focus to the trigger (WCAG 2.1 — SC 2.4.3)
        triggerRef.current?.focus();
      }, ANIM_MS);
    }, [onClose, resetTransforms]);

    // ── ESC key ──────────────────────────────────────────────
    useEffect(() => {
      if (!isOpen) return;
      const onKey = (e: globalThis.KeyboardEvent) => {
        if (e.key === 'Escape') closeLightbox();
      };
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('keydown', onKey);
      };
    }, [isOpen, closeLightbox]);

    // ── Wheel zoom ───────────────────────────────────────────
    const handleWheelDelta = useCallback(
      (deltaY: number) => {
        const step = deltaY < 0 ? SCROLL_ZOOM_STEP : -SCROLL_ZOOM_STEP;
        setZoom((prev) => {
          const scale = clamp(prev.scale + step, MIN_SCALE, MAX_SCALE);
          return {
            scale,
            panX: scale === 1 ? 0 : prev.panX,
            panY: scale === 1 ? 0 : prev.panY,
          };
        });
        flashZoomBadge();
      },
      [flashZoomBadge],
    );

    useNativeWheelZoom(overlayRef, isOpen, handleWheelDelta);

    // ── Mouse drag / pan ─────────────────────────────────────
    const handleMouseDown = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        const g = gesture.current;
        g.isDragging = true;
        g.dragOriginX = e.clientX;
        g.dragOriginY = e.clientY;
        g.panAtDragStart = { x: zoom.panX, y: zoom.panY };
      },
      [zoom.panX, zoom.panY],
    );

    const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
      const g = gesture.current;
      if (!g.isDragging) return;
      setZoom((prev) => ({
        ...prev,
        panX: g.panAtDragStart.x + (e.clientX - g.dragOriginX),
        panY: g.panAtDragStart.y + (e.clientY - g.dragOriginY),
      }));
    }, []);

    const stopMouseDrag = useCallback(() => {
      gesture.current.isDragging = false;
    }, []);

    // ── Backdrop click ───────────────────────────────────────
    const handleBackdropClick = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (e.target === overlayRef.current) closeLightbox();
      },
      [closeLightbox],
    );

    // ── Touch: start ─────────────────────────────────────────
    const handleTouchStart = useCallback(
      (e: TouchEvent<HTMLDivElement>) => {
        const g = gesture.current;
        const now = Date.now();

        if (e.touches.length === 2) {
          g.isDragging = false;
          g.pinchStartDistance = getPinchDistance(e.touches);
          g.pinchStartScale = zoom.scale;
          return;
        }

        const touch = e.touches[0];
        g.isDragging = true;
        g.dragOriginX = touch.clientX;
        g.dragOriginY = touch.clientY;
        g.panAtDragStart = { x: zoom.panX, y: zoom.panY };
        g.swipeOriginY = touch.clientY;
        g.swipeLastY = touch.clientY;
        g.swipeLastTime = now;
        g.swipeVelocity = 0;
        g.swipeRawDelta = 0;

        // Double-tap: zoom toggle
        const sinceLastTap = now - g.lastTapTimestamp;
        if (sinceLastTap < DOUBLE_TAP_WINDOW_MS && sinceLastTap > 0) {
          const nextScale = zoom.scale > 1 ? 1 : DOUBLE_TAP_ZOOM_LEVEL;
          applyScale(nextScale, nextScale > 1);
          flashZoomBadge();
          g.lastTapTimestamp = 0;
          return;
        }
        g.lastTapTimestamp = now;
      },
      [zoom.scale, zoom.panX, zoom.panY, applyScale, flashZoomBadge],
    );

    // ── Touch: move ──────────────────────────────────────────
    const handleTouchMove = useCallback(
      (e: TouchEvent<HTMLDivElement>) => {
        const g = gesture.current;
        const now = Date.now();

        if (e.touches.length === 2) {
          const dist = getPinchDistance(e.touches);
          applyScale((g.pinchStartScale * dist) / (g.pinchStartDistance || 1), true);
          flashZoomBadge();
          return;
        }

        if (!g.isDragging || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const dx = touch.clientX - g.dragOriginX;
        const dy = touch.clientY - g.dragOriginY;

        if (zoom.scale > 1) {
          setZoom((prev) => ({
            ...prev,
            panX: g.panAtDragStart.x + dx,
            panY: g.panAtDragStart.y + dy,
          }));
        } else {
          // Swipe-to-close: only downward motion
          const rawDelta = Math.max(0, touch.clientY - g.swipeOriginY);
          const dt = now - g.swipeLastTime || 1;
          g.swipeVelocity = Math.abs(touch.clientY - g.swipeLastY) / dt;
          g.swipeLastY = touch.clientY;
          g.swipeLastTime = now;
          g.swipeRawDelta = rawDelta;
          setSwipeOffsetY(rawDelta);
        }
      },
      [zoom.scale, applyScale, flashZoomBadge],
    );

    // ── Touch: end ───────────────────────────────────────────
    const handleTouchEnd = useCallback(() => {
      const g = gesture.current;
      g.isDragging = false;

      if (zoom.scale <= 1) {
        const shouldClose = g.swipeRawDelta > SWIPE_CLOSE_PX || g.swipeVelocity > SWIPE_CLOSE_VEL;

        if (shouldClose) {
          closeLightbox();
        } else {
          setSwipeOffsetY(0); // snap back
        }
      }
    }, [zoom.scale, closeLightbox]);

    // Non-passive touchmove on overlay — must be native to call preventDefault
    useEffect(() => {
      if (!isOpen || !overlayRef.current) return;
      const el = overlayRef.current;
      const prevent = (e: globalThis.TouchEvent) => {
        e.preventDefault();
      };
      el.addEventListener('touchmove', prevent, { passive: false });
      return () => {
        el.removeEventListener('touchmove', prevent);
      };
    }, [isOpen]);

    // ── Inline styles (dynamic values — avoid per-frame CSS class injection) ──
    const imageTransformStyle: React.CSSProperties = {
      transform: buildTransform(zoom, swipeOffsetY),
      // eslint-disable-next-line react-hooks/refs -- intentional: ref read avoids render-loop on pointer events
      transition: gesture.current.isDragging
        ? 'none'
        : `transform ${ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      cursor: zoom.scale > 1 ? 'grab' : 'default',
    };

    const backdropStyle = useMemo<React.CSSProperties>(
      () => ({ background: buildBackdropBackground(swipeOffsetY) }),
      [swipeOffsetY],
    );

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────
    return (
      <>
        {/* ── Thumbnail ──────────────────────────────────── */}
        <figure style={{ margin: 0 }}>
          <ThumbnailWrapper
            ref={triggerRef}
            $width={width}
            $height={height}
            $aspectRatio={aspectRatio}
            $borderRadius={borderRadius}
            $interactive={lightbox}
            className={className}
            onClick={openLightbox}
            onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
              if (lightbox && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                openLightbox();
              }
            }}
            tabIndex={lightbox ? 0 : undefined}
            role={lightbox ? 'button' : undefined}
            aria-label={lightbox ? `View ${alt} fullscreen` : undefined}
            aria-haspopup={lightbox ? 'dialog' : undefined}
          >
            <StyledImg
              src={src}
              alt={alt}
              loading="lazy"
              $loaded={imgLoaded}
              $objectFit={objectFit}
              onLoad={() => {
                setImgLoaded(true);
              }}
              onError={() => {
                setImgLoaded(true);
              }}
              draggable={false}
            />
            <SkeletonShimmer $visible={!imgLoaded} aria-hidden="true" />
          </ThumbnailWrapper>

          {caption && <FigCaption>{caption}</FigCaption>}
        </figure>

        {/* ── Lightbox ───────────────────────────────────── */}
        {isOpen && (
          <Backdrop
            ref={overlayRef}
            $phase={phase}
            style={backdropStyle}
            role="dialog"
            aria-modal="true"
            aria-label={`Fullscreen image: ${alt}`}
            onClick={handleBackdropClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopMouseDrag}
            onMouseLeave={stopMouseDrag}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <CloseBtn
              type="button"
              aria-label={t('image.closeLightboxAriaLabel')}
              onClick={closeLightbox}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </CloseBtn>

            <ContentAnimationShell $phase={phase}>
              <ImageTransformLayer style={imageTransformStyle}>
                <LightboxImg src={src} alt={alt} draggable={false} />
              </ImageTransformLayer>
            </ContentAnimationShell>

            <ZoomBadge $visible={zoomBadgeVisible} aria-hidden="true">
              {zoomLabel}
            </ZoomBadge>
          </Backdrop>
        )}
      </>
    );
  },
);

Image.displayName = 'Image';
