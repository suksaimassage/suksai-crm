/**
 * Form.search.hooks.ts
 *
 * SRP: Dedicated hooks for SearchInput adaptive overlay positioning and state.
 *
 * useOverlayPosition — computes viewport-safe fixed-position coordinates.
 * useSearchInput     — encapsulates all SearchInput stateful logic (OCP / testable).
 */

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ISearchResult } from './Form.item.types';
import type { ValidateFn } from './Form.types';
import { noop, useDebounce, useValidation } from './Form.utils';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Gap (px) between anchor bottom and popover top. */
const OFFSET_PX = 6;
/** Minimum viewport margin (px) on every side. */
const EDGE_MARGIN_PX = 12;
/** Maximum popover height (px). */
const MAX_POPOVER_HEIGHT = 340;
/** Minimum useful height (px) before we flip placement or truncate. */
const MIN_POPOVER_HEIGHT = 100;
/** Viewport width (px) below which we render a mobile bottom-sheet. */
const MOBILE_BREAKPOINT_PX = 640;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IOverlayPosition {
  /** Fixed `top` in viewport px.
   *  For 'top' placement apply `transform: translateY(-100%)` via CSS. */
  top: number;
  /** Fixed `left` in viewport px. Clamped to avoid edge overflow. */
  left: number;
  /** Width matching anchor, clamped to available viewport width. */
  width: number;
  /** Computed max-height based on available space in the chosen direction. */
  maxHeight: number;
  /** 'bottom' = popover opens below anchor; 'top' = opens above. */
  placement: 'bottom' | 'top';
  /** True when viewport width < MOBILE_BREAKPOINT_PX → render bottom-sheet. */
  isMobile: boolean;
}

// ─── useOverlayPosition ───────────────────────────────────────────────────────

/**
 * Computes viewport-safe position for a `position:fixed` popover.
 *
 * Strategy:
 *  - Default: bottom-start (below, left-aligned to anchor).
 *  - Flips to top-start when space below < MIN_POPOVER_HEIGHT AND space above > space below.
 *  - Shifts left if popover would overflow right edge.
 *  - Returns isMobile:true on narrow viewports → component renders bottom-sheet.
 *
 * Recalculates on: open, window resize, and any scroll (capture phase).
 */
export function useOverlayPosition(
  anchorRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
): IOverlayPosition {
  const [pos, setPos] = useState<IOverlayPosition>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: MAX_POPOVER_HEIGHT,
    placement: 'bottom',
    isMobile: false,
  });

  const calculate = useCallback(() => {
    if (!anchorRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Mobile: positioning deferred to CSS bottom-sheet
    if (vw < MOBILE_BREAKPOINT_PX) {
      setPos((prev) => ({ ...prev, isMobile: true }));
      return;
    }

    // Vertical space in each direction (accounting for offset + edge margin)
    const spaceBelow = vh - rect.bottom - OFFSET_PX - EDGE_MARGIN_PX;
    const spaceAbove = rect.top - OFFSET_PX - EDGE_MARGIN_PX;

    // Prefer bottom; flip to top only when bottom is too tight AND above has more room
    const placement: 'bottom' | 'top' =
      spaceBelow >= MIN_POPOVER_HEIGHT || spaceBelow >= spaceAbove ? 'bottom' : 'top';

    const available = placement === 'bottom' ? spaceBelow : spaceAbove;
    const maxHeight = Math.min(MAX_POPOVER_HEIGHT, Math.max(MIN_POPOVER_HEIGHT, available));

    // Horizontal: left-align to anchor, shift inward if right edge overflows
    let left = rect.left;
    if (left + rect.width > vw - EDGE_MARGIN_PX) {
      left = vw - EDGE_MARGIN_PX - rect.width;
    }
    left = Math.max(EDGE_MARGIN_PX, left);

    // position:fixed is viewport-relative — no scrollX/scrollY adjustment needed
    // For 'top' placement: CSS translateY(-100%) aligns popover bottom to anchor top - offset
    const top = placement === 'bottom' ? rect.bottom + OFFSET_PX : rect.top - OFFSET_PX;

    setPos({
      top,
      left,
      width: Math.min(rect.width, vw - EDGE_MARGIN_PX * 2),
      maxHeight,
      placement,
      isMobile: false,
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Diferimos la ejecución inicial de calculate() al siguiente frame.
    // Esto elimina el warning del linter (ya no es síncrono), evita el
    // renderizado en cascada y garantiza que el DOM esté listo para medirse.
    const initialFrameId = requestAnimationFrame(calculate);

    // 2. rAF-throttle de los listeners scroll/resize: coalesce los eventos en
    // un único recálculo por frame para evitar el layout thrashing (Forced
    // reflow) que provoca llamar a calculate() de forma síncrona por evento.
    let listenerFrameId: number | null = null;
    const handleUpdate = () => {
      if (listenerFrameId !== null) return; // ya hay un recálculo encolado para este frame
      listenerFrameId = requestAnimationFrame(() => {
        listenerFrameId = null;
        calculate();
      });
    };

    const opts = { passive: true } as const;
    window.addEventListener('resize', handleUpdate, opts);
    // Capture scroll on all ancestors — handles nested scroll containers
    window.addEventListener('scroll', handleUpdate, { ...opts, capture: true });

    return () => {
      // 3. Limpiamos ambos frames en caso de que el componente se desmonte
      // antes de que lleguen a ejecutarse.
      cancelAnimationFrame(initialFrameId);
      if (listenerFrameId !== null) cancelAnimationFrame(listenerFrameId);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, { capture: true });
    };
  }, [isOpen, calculate]);

  return pos;
}

// ─── useSearchInput ───────────────────────────────────────────────────────────

interface IUseSearchInputParams {
  isControlled: boolean;
  defaultValue: string;
  validateFn?: ValidateFn;
  externalError?: string;
  onSearch?: (value: string) => void;
  debounceMs: number;
  results?: ISearchResult[];
  isLoading: boolean;
  onResultSelect?: (result: ISearchResult) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface IUseSearchInputReturn {
  currentVal: string;
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  error: string;
  hasError: boolean;
  /** Ref forwarded to the native <input> element. */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Ref placed on the scrollable result container (for scrollIntoView). */
  listRef: React.RefObject<HTMLDivElement | null>;
  shouldShowPopover: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFocus: () => void;
  handleClear: () => void;
  handleSelect: (result: ISearchResult) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Encapsulates all SearchInput stateful logic.
 *
 * Separated from rendering for testability and SRP compliance.
 * Accepts `controlledValue` separately to avoid stale closure issues.
 */
export function useSearchInput(
  params: IUseSearchInputParams,
  controlledValue?: string,
): IUseSearchInputReturn {
  const {
    isControlled,
    defaultValue,
    validateFn,
    externalError,
    onSearch,
    debounceMs,
    results,
    isLoading,
    onResultSelect,
    onChange,
  } = params;

  const [internalVal, setInternalVal] = useState(defaultValue);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  // Reset keyboard active index whenever results list refreshes
  // 1. Añadimos un estado para rastrear los resultados previos
  const [prevResults, setPrevResults] = useState(results);

  // 2. Comparamos durante el renderizado
  if (results !== prevResults) {
    setPrevResults(results);
    setActiveIndex(-1);
  }

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const currentVal = isControlled ? (controlledValue ?? '') : internalVal;
  const { error, hasError, validate } = useValidation(validateFn, externalError);
  const debouncedSearch = useDebounce(onSearch ?? noop, debounceMs);

  const shouldShowPopover =
    isOpen && currentVal.trim().length > 0 && (isLoading || results !== undefined);

  // Scroll active keyboard-navigated item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    listRef.current
      .querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (!isControlled) setInternalVal(v);
      validate(v);
      onChange?.(e);
      setIsOpen(true);
      debouncedSearch(v);
    },
    [isControlled, onChange, validate, debouncedSearch],
  );

  const handleFocus = useCallback(() => {
    if (currentVal.trim().length > 0 && results !== undefined) {
      setIsOpen(true);
    }
  }, [currentVal, results]);

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalVal('');
    validate('');
    onSearch?.('');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, [isControlled, onSearch, validate]);

  const handleSelect = useCallback(
    (result: ISearchResult) => {
      onResultSelect?.(result);
      if (!isControlled) setInternalVal(result.label);
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    },
    [isControlled, onResultSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!shouldShowPopover) return;
      const count = results?.length ?? 0;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, count - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          if (activeIndex >= 0 && results?.[activeIndex]) {
            e.preventDefault();
            handleSelect(results[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setActiveIndex(-1);
          break;
      }
    },
    [shouldShowPopover, results, activeIndex, handleSelect],
  );

  return {
    currentVal,
    activeIndex,
    setActiveIndex,
    isOpen,
    setIsOpen,
    error,
    hasError,
    inputRef,
    listRef,
    shouldShowPopover,
    handleChange,
    handleFocus,
    handleClear,
    handleSelect,
    handleKeyDown,
  };
}
