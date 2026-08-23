/**
 * Select — Campo de selección con panel dropdown flotante
 *
 * El panel se renderiza vía createPortal en document.body usando
 * useFloatingPanel, que delega a las utilidades de Popover para:
 * - Evitar recorte por overflow:hidden en ancestros.
 * - Auto-flip cuando no hay espacio en el viewport.
 *
 * SOLID:
 * - SRP: lógica de teclado en handlers, render en componente, estilos en .styles.
 * - OCP: opciones agrupadas sin modificar el render base.
 * - DIP: depende de ISelectProps (abstracción) y useFloatingPanel (hook genérico).
 */

import React, { useState, useRef, useCallback, useId, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { ISelectProps, ISelectOption } from './Select.types';
import { isGrouped } from './Select.types';
import { useFloatingPanel } from '@infra/hooks/useFloatingPanel';
import * as S from './Select.styles';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M3 5l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckMark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M2.5 7l3.5 3.5 5.5-6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClearX = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M6 3.5v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    <circle cx="6" cy="8.75" r="0.6" fill="currentColor" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenOptions(options: ISelectProps['options']): ISelectOption[] {
  if (!isGrouped(options)) return options;
  return options.flatMap((g) => g.options);
}

function filterOptions(options: ISelectOption[], query: string): ISelectOption[] {
  if (!query.trim()) return options;
  const q = query.toLowerCase();
  return options.filter(
    (o) => o.label.toLowerCase().includes(q) || (o.description ?? '').toLowerCase().includes(q),
  );
}

// ─── OptionRow ────────────────────────────────────────────────────────────────

interface IOptionRowProps {
  opt: ISelectOption;
  active: boolean;
  selected: boolean;
  onSelect: (o: ISelectOption) => void;
  onHover: () => void;
  id: string;
}

const OptionRow = ({ opt, active, selected, onSelect, onHover, id }: IOptionRowProps) => {
  return (
    <S.OptionItem
      id={id}
      type="button"
      role="option"
      aria-selected={selected}
      $active={active}
      $selected={selected}
      disabled={opt.disabled}
      onClick={() => {
        onSelect(opt);
      }}
      onMouseEnter={onHover}
      tabIndex={-1}
    >
      {opt.icon && <S.OptionIcon>{opt.icon}</S.OptionIcon>}
      <S.OptionText>
        <S.OptionLabel>{opt.label}</S.OptionLabel>
        {opt.description && <S.OptionDescription>{opt.description}</S.OptionDescription>}
      </S.OptionText>
      <S.CheckIcon $visible={selected}>
        <CheckMark />
      </S.CheckIcon>
    </S.OptionItem>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ISelectWithRef extends ISelectProps {
  ref?: React.Ref<HTMLDivElement>;
}

export const Select = ({
  id: idProp,
  value,
  defaultValue,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  label,
  helperText,
  error,
  size = 'md',
  variant = 'outlined',
  leftIcon,
  disabled = false,
  required = false,
  searchable = false,
  clearable = false,
  ref,
}: ISelectWithRef) => {
  const { t } = useTranslation('common');
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [internalVal, setInternalVal] = useState(defaultValue ?? '');
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(-1);

  // ── Floating panel (portal + auto-flip) ─────────────────────────────────

  const { panelRef, floatingStyles, mounted } = useFloatingPanel(triggerRef, isOpen, {
    placement: 'bottom-start',
    offset: 6,
    matchTriggerWidth: true,
  });

  const isControlled = value !== undefined;
  const currentVal = isControlled ? value : internalVal;
  const hasError = Boolean(error);
  const subText = hasError ? error : helperText;

  const allFlat = useMemo(() => flattenOptions(options), [options]);
  const visible = useMemo(
    () => (searchable ? filterOptions(allFlat, query) : allFlat),
    [allFlat, query, searchable],
  );

  const selectedLabel = useMemo(
    () => allFlat.find((o) => o.value === currentVal)?.label ?? '',
    [allFlat, currentVal],
  );

  // ── Handlers ────────────────────────────────────────────────────────────

  const open = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setActiveIdx(-1);
    setQuery('');
  }, [disabled]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setActiveIdx(-1);
    triggerRef.current?.focus();
  }, []);

  const select = useCallback(
    (opt: ISelectOption) => {
      if (opt.disabled) return;
      if (!isControlled) setInternalVal(opt.value);
      onChange?.(opt.value);
      close();
    },
    [isControlled, onChange, close],
  );

  const clear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isControlled) setInternalVal('');
      onChange?.('');
    },
    [isControlled, onChange],
  );

  // ── Click-outside (incluye panel en portal) ─────────────────────────────

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

  // ── Auto-focus del buscador al abrir ─────────────────────────────────────
  // Efecto cancelable en rAF en lugar de setTimeout(0): saca el trabajo del
  // cubo "setTimeout handler" y { preventScroll: true } evita el reflow
  // encadenado que provocaba el scroll automático al input.
  useEffect(() => {
    if (!isOpen || !searchable) return;
    const frameId = requestAnimationFrame(() => {
      searchRef.current?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isOpen, searchable]);

  // ── Keyboard ─────────────────────────────────────────────────────────────

  const handleTriggerKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        open();
      }
    },
    [open],
  );

  const handleListKey = useCallback(
    (e: React.KeyboardEvent) => {
      const count = visible.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, count - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && activeIdx >= 0 && visible[activeIdx]) {
        e.preventDefault();
        select(visible[activeIdx]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    },
    [visible, activeIdx, select, close],
  );

  const showClear = clearable && currentVal !== '' && !disabled;
  const listboxId = `${id}-listbox`;

  return (
    <S.FieldWrapper ref={ref}>
      {label && (
        <S.Label htmlFor={id} $required={required}>
          {label}
        </S.Label>
      )}

      <S.TriggerWrap>
        {leftIcon && (
          <S.TriggerIcon $side="left">
            <span
              style={{
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {leftIcon}
            </span>
          </S.TriggerIcon>
        )}

        <S.Trigger
          ref={triggerRef}
          id={id}
          type="button"
          $size={size}
          $variant={variant}
          $hasError={hasError}
          $isOpen={isOpen}
          $hasLeft={Boolean(leftIcon)}
          $disabled={disabled}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={subText ? `${id}-sub` : undefined}
          onClick={() => {
            if (isOpen) {
              close();
            } else {
              open();
            }
          }}
          onKeyDown={handleTriggerKey}
        >
          <S.TriggerText $isPlaceholder={!currentVal}>
            {currentVal ? selectedLabel : placeholder}
          </S.TriggerText>
        </S.Trigger>

        {showClear && (
          <S.ClearBtn
            type="button"
            onClick={clear}
            aria-label={t('select.clearAriaLabel')}
            tabIndex={-1}
          >
            <ClearX />
          </S.ClearBtn>
        )}

        <S.ChevronIcon $open={isOpen}>
          <ChevronDown />
        </S.ChevronIcon>
      </S.TriggerWrap>

      {/* ── Panel flotante vía portal ───────────────────────────────── */}
      {isOpen &&
        mounted &&
        createPortal(
          <S.DropPanel ref={panelRef} style={floatingStyles}>
            {searchable && (
              <S.SearchInput
                ref={searchRef}
                placeholder={t('select.searchPlaceholder')}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                onKeyDown={handleListKey}
                aria-label={t('select.searchAriaLabel')}
              />
            )}

            <S.OptionList
              id={listboxId}
              role="listbox"
              aria-label={label ?? t('select.optionsAriaLabel')}
              onKeyDown={!searchable ? handleListKey : undefined}
            >
              {visible.length === 0 && <S.EmptyState>{t('select.noResults')}</S.EmptyState>}

              {isGrouped(options) && !searchable
                ? options.map((group) => (
                    <div key={group.group}>
                      <S.GroupLabel>{group.group}</S.GroupLabel>
                      {group.options.map((opt, i) => (
                        <OptionRow
                          key={opt.value}
                          id={`${id}-opt-${i}`}
                          opt={opt}
                          active={activeIdx === allFlat.indexOf(opt)}
                          selected={opt.value === currentVal}
                          onSelect={select}
                          onHover={() => {
                            setActiveIdx(allFlat.indexOf(opt));
                          }}
                        />
                      ))}
                    </div>
                  ))
                : visible.map((opt, i) => (
                    <OptionRow
                      key={`opt-${i}`}
                      id={`${id}-opt-${i}`}
                      opt={opt}
                      active={activeIdx === i}
                      selected={opt.value === currentVal}
                      onSelect={select}
                      onHover={() => {
                        setActiveIdx(i);
                      }}
                    />
                  ))}
            </S.OptionList>
          </S.DropPanel>,
          document.body,
        )}

      {subText && (
        <S.SubText id={`${id}-sub`} $isError={hasError} role={hasError ? 'alert' : undefined}>
          {hasError && <ErrorIcon />}
          {subText}
        </S.SubText>
      )}
    </S.FieldWrapper>
  );
};

Select.displayName = 'Select';
