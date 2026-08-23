/**
 * Form.items.tsx  (v2 — security hardened)
 *
 * TextInput and TextareaInput now run a 4-layer security pipeline:
 *
 *   1. Sanitize      strip definitive XSS vectors before state update
 *   2. Detect        identify threats in the original raw value; fire audit events
 *   3. Validate      declarative IValidationRules + legacy validate fn
 *   4. Rate-limit    flag suspiciously rapid input streams
 *
 * SearchInput retains existing security posture (debounce + portal).
 *
 * SECURITY DISCLAIMER:
 *   Client-side defences only.  Backend MUST validate, sanitize,
 *   and use parameterised queries independently.
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from '@infra/components/ui/core/Typography';
import type {
  IFormInputProps,
  ISearchInputProps,
  ITextInputProps,
  ISearchResult,
  ITextareaInputProps,
} from './Form.item.types';
import { useFormContext, useFormContextOrThrow } from './Form.context';
import { useDebounce } from './Form.utils';
import { useOverlayPosition, useSearchInput } from './Form.search.hooks';
import { useSecureInput, escapeAttr } from './Form.security';
import type { ISecurityEvent } from './Form.security';
import {
  ClearIcon,
  ErrorIcon,
  EyeIcon,
  EyeOffIcon,
  SearchEmptyIcon,
  SearchIcon,
} from './Form.icons';
import * as S from './Form.item.styles';

// ═══════════════════════════════════════════════════════════════════════════════
// FIELD SHELL
// ═══════════════════════════════════════════════════════════════════════════════

interface IFieldShellProps {
  id: string;
  label?: string;
  helperText?: string;
  error: string;
  hasError: boolean;
  required?: boolean;
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}

const FieldShell = ({
  id,
  label,
  helperText,
  error,
  hasError,
  required,
  children,
  ref,
}: IFieldShellProps) => {
  const subTextId = `${id}-subtext`;
  const subText = hasError ? error : helperText;

  return (
    <S.FieldWrapper ref={ref}>
      {label && (
        <S.Label htmlFor={id} $required={required}>
          <Typography variant="caption1" as="span" weight="medium" color="secondary">
            {/* Render label as a plain text node — never via innerHTML */}
            {typeof label === 'string' ? label : null}
          </Typography>
        </S.Label>
      )}

      {children}

      {subText && (
        <S.BottomRow>
          <S.SubText
            id={subTextId}
            $isError={hasError}
            role={hasError ? 'alert' : undefined}
            /* Screen readers announce error updates immediately */
            aria-live={hasError ? 'assertive' : 'polite'}
          >
            {hasError && <ErrorIcon />}
            <Typography variant="caption2" as="span" color="inherit">
              {typeof subText === 'string' ? subText : null}
            </Typography>
          </S.SubText>
        </S.BottomRow>
      )}
    </S.FieldWrapper>
  );
};

FieldShell.displayName = 'FieldShell';

// ═══════════════════════════════════════════════════════════════════════════════
// TextInput — Hardened
// ═══════════════════════════════════════════════════════════════════════════════

interface ITextInputWithRef extends ITextInputProps {
  _id: string;
  ref?: React.Ref<HTMLInputElement>;
}

const TextInput = ({
  _id,
  label,
  helperText,
  error: externalError,
  validate: validateFn,
  // ── Security props ──────────────────────────────────────────────────
  validationRules,
  sanitize: enableSanitize = true,
  sanitizeOptions,
  onSecurityEvent,
  rateLimitOptions,
  // ── Display props ───────────────────────────────────────────────────
  size = 'md',
  variant = 'outlined',
  leftIcon,
  rightIcon,
  clearable = false,
  type = 'text',
  required,
  disabled,
  value,
  defaultValue,
  onChange,
  onBlur,
  placeholder,
  ref,
  ...rest
}: ITextInputWithRef) => {
  const isPassword = type === 'password';
  const [showPass, setShowPass] = useState(false);
  const { t } = useTranslation('common');

  // ── Form context ────────────────────────────────────────────────────────
  const formCtx = useFormContext();
  const fieldName = (rest as { name?: string }).name;

  React.useEffect(() => {
    if (formCtx && fieldName)
      (
        formCtx as unknown as {
          register?: (name: string, validate?: typeof validateFn) => void;
        }
      ).register?.(fieldName, validateFn);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ctxError =
    formCtx && fieldName
      ? ((formCtx as unknown as { getError?: (name: string) => string | null }).getError?.(
          fieldName,
        ) ?? null)
      : null;

  // ── Security pipeline ───────────────────────────────────────────────────
  const security = useSecureInput({
    validateFn,
    validationRules,
    sanitize: enableSanitize,
    sanitizeOptions,
    externalError: externalError ?? ctxError ?? undefined,
    rateLimitOptions,
    onSecurityEvent,
    fieldId: _id,
  });

  // ── Internal value — initialise with sanitized default ──────────────────
  const [internalVal, setInternalVal] = useState(() =>
    enableSanitize ? security.sanitize(String(defaultValue ?? '')) : String(defaultValue ?? ''),
  );

  const isControlled = value !== undefined;
  const currentVal = isControlled ? String(value) : internalVal;

  // Rate-limit error surface — surfaced as a validation error so submit is gated
  const resolvedError =
    security.error ||
    (security.isRateLimited ? 'Unusual input frequency detected — please slow down' : '');
  const resolvedHasError = Boolean(resolvedError);

  // Ensure placeholder is always a plain string (no prop injection)
  const safePlaceholder = escapeAttr(placeholder);

  // ── Change handler ──────────────────────────────────────────────────────
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Track rate-limiting (detection only — does NOT block controlled inputs)
      const limited = security.trackChange();
      if (limited) {
        onSecurityEvent?.({
          type: 'rate-limit-hit',
          fieldId: _id,
          timestamp: Date.now(),
          rawValue: raw,
        } satisfies ISecurityEvent);
      }

      // 1. Sanitize — strip XSS vectors; result is the value stored in state
      const safe = security.sanitize(raw);

      // 2 & 3. Detect threats + validate against rules
      security.validate(safe);

      // Update internal state with the safe value
      if (!isControlled) setInternalVal(safe);

      // Propagate to form context
      if (formCtx && fieldName) formCtx.setValue(fieldName, safe);

      // Emit a synthetic event carrying the SAFE value so parent receives
      // sanitized data. We create a new event object — never mutate the original.
      if (onChange) {
        const safeEvt = Object.assign({}, e, {
          target: Object.assign({}, e.target, { value: safe }),
          currentTarget: Object.assign({}, e.currentTarget, { value: safe }),
        }) as React.ChangeEvent<HTMLInputElement>;
        onChange(safeEvt);
      }
    },
    [isControlled, onChange, security, formCtx, fieldName, _id, onSecurityEvent],
  );

  // Blur validation catches paste-then-tab-away patterns
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      security.validate(e.target.value);
      onBlur?.(e);
    },
    [security, onBlur],
  );

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalVal('');
    security.validate('');
    if (formCtx && fieldName) formCtx.setValue(fieldName, '');
    onChange?.({
      target: { value: '' },
      currentTarget: { value: '' },
    } as React.ChangeEvent<HTMLInputElement>);
  }, [isControlled, onChange, security, formCtx, fieldName]);

  const resolvedType = isPassword ? (showPass ? 'text' : 'password') : type;

  const showClear = clearable && !isPassword && currentVal.length > 0;
  const showPassBtn = isPassword;
  const showRightIco = Boolean(rightIcon) && !showClear && !showPassBtn;

  const hasLeft = Boolean(leftIcon);
  // Stable — must not depend on current value (preserves focus during typing)
  const hasRight = clearable || isPassword || Boolean(rightIcon);

  // Shared native input props
  const inputProps = {
    ...rest,
    id: _id,
    type: resolvedType,
    $size: size,
    $variant: variant,
    $hasError: resolvedHasError,
    value: isControlled ? String(value) : internalVal,
    onChange: handleChange,
    onBlur: handleBlur,
    disabled,
    required,
    placeholder: safePlaceholder || undefined,
    'aria-invalid': resolvedHasError || undefined,
    'aria-describedby': resolvedHasError ? `${_id}-subtext` : undefined,
    autoComplete:
      (rest as { autoComplete?: string }).autoComplete ??
      (type === 'password' ? 'current-password' : undefined),
  };

  if (hasLeft || hasRight) {
    return (
      <FieldShell
        ref={ref}
        id={_id}
        label={label}
        helperText={helperText}
        error={resolvedError}
        hasError={resolvedHasError}
        required={required}
      >
        <S.InputWrap $disabled={Boolean(disabled)}>
          {leftIcon && (
            <S.IconSlot $size={size} $side="left" $variant={variant} aria-hidden="true">
              {leftIcon}
            </S.IconSlot>
          )}

          <S.NativeInput {...inputProps} $hasLeft={hasLeft} $hasRight={hasRight} />

          {showClear && (
            <S.IconButton
              $size={size}
              $side="right"
              $variant={variant}
              type="button"
              onClick={handleClear}
              aria-label={t('form.clearFieldAriaLabel')}
            >
              <ClearIcon />
            </S.IconButton>
          )}

          {showPassBtn && (
            <S.IconButton
              $size={size}
              $side="right"
              $variant={variant}
              type="button"
              onClick={() => {
                setShowPass((p) => !p);
              }}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              aria-pressed={showPass}
            >
              {showPass ? <EyeOffIcon /> : <EyeIcon />}
            </S.IconButton>
          )}

          {showRightIco && (
            <S.IconSlot $size={size} $side="right" $variant={variant} aria-hidden="true">
              {rightIcon}
            </S.IconSlot>
          )}
        </S.InputWrap>
      </FieldShell>
    );
  }

  return (
    <FieldShell
      id={_id}
      label={label}
      helperText={helperText}
      error={resolvedError}
      hasError={resolvedHasError}
      required={required}
    >
      <S.NativeInput {...inputProps} $hasLeft={false} $hasRight={false} />
    </FieldShell>
  );
};

TextInput.displayName = 'TextInput';

// ═══════════════════════════════════════════════════════════════════════════════
// highlightMatch (SearchInput helper)
// ═══════════════════════════════════════════════════════════════════════════════

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SearchResultContent
// ═══════════════════════════════════════════════════════════════════════════════

interface ISearchResultContentProps {
  listboxId: string;
  listRef: React.RefObject<HTMLDivElement> | React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  results?: ISearchResult[];
  activeIndex: number;
  currentVal: string;
  inputId: string;
  noResultsText: string;
  onMouseEnter: (idx: number) => void;
  onMouseLeave: () => void;
  onSelect: (result: ISearchResult) => void;
}

const SearchResultContent: React.FC<ISearchResultContentProps> = ({
  listboxId,
  listRef,
  isLoading,
  results,
  activeIndex,
  currentVal,
  inputId,
  noResultsText,
  onMouseEnter,
  onMouseLeave,
  onSelect,
}) => {
  const { t } = useTranslation('common');
  return (
    <S.SearchResultList
      ref={listRef}
      id={listboxId}
      role="listbox"
      aria-label={t('form.searchResultsAriaLabel')}
    >
      {isLoading ? (
        <>
          {(['60%', '45%', '72%'] as const).map((w, i) => (
            <S.SearchSkeletonItem key={i}>
              <S.SearchSkeletonCircle />
              <S.SearchResultText>
                <S.SearchSkeletonLine $width={w} />
                <S.SearchSkeletonLine $width={['40%', '55%', '35%'][i]} />
              </S.SearchResultText>
            </S.SearchSkeletonItem>
          ))}
        </>
      ) : results?.length === 0 ? (
        <S.SearchEmptyState>
          <SearchEmptyIcon />
          <Typography variant="caption1" as="span" color="secondary">
            {noResultsText}
          </Typography>
        </S.SearchEmptyState>
      ) : (
        results?.map((result, idx) => (
          <S.SearchResultItem
            key={result.id}
            type="button"
            $active={idx === activeIndex}
            id={`${inputId}-result-${idx}`}
            data-index={idx}
            role="option"
            aria-selected={idx === activeIndex}
            onMouseEnter={() => {
              onMouseEnter(idx);
            }}
            onMouseLeave={onMouseLeave}
            onClick={() => {
              onSelect(result);
            }}
            tabIndex={-1}
          >
            {result.icon && <S.SearchResultIcon>{result.icon}</S.SearchResultIcon>}
            <S.SearchResultText>
              <S.SearchResultLabel>{highlightMatch(result.label, currentVal)}</S.SearchResultLabel>
              {result.description && (
                <S.SearchResultDescription>{result.description}</S.SearchResultDescription>
              )}
            </S.SearchResultText>
          </S.SearchResultItem>
        ))
      )}
    </S.SearchResultList>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SearchInput (existing implementation — minimal security additions)
// ═══════════════════════════════════════════════════════════════════════════════

interface ISearchInputWithRef extends ISearchInputProps {
  _id: string;
  ref?: React.Ref<HTMLInputElement>;
}

const SearchInput = ({
  _id,
  label,
  helperText,
  error: externalError,
  validate: validateFn,
  size = 'md',
  variant = 'outlined',
  leftIcon,
  rightIcon,
  clearable = true,
  debounceMs = 350,
  onSearch,
  results,
  isLoading = false,
  onResultSelect,
  noResultsText = 'Sin resultados',
  disabled,
  required,
  value,
  defaultValue,
  onChange,
  // Accept but ignore the security props at SearchInput level —
  // security for search results is the responsibility of the data layer.
  sanitize: _s,
  sanitizeOptions: _so,
  onSecurityEvent: _ose,
  validationRules: _vr,
  rateLimitOptions: _rlo,
  ref,
  ...rest
}: ISearchInputWithRef) => {
  const { t } = useTranslation('common');
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const localInputRef = useRef<HTMLInputElement | null>(null);
  const isControlled = value !== undefined;

  const search = useSearchInput(
    {
      isControlled,
      defaultValue: String(defaultValue ?? ''),
      validateFn,
      externalError,
      onSearch,
      debounceMs,
      results,
      isLoading,
      onResultSelect,
      onChange,
    },
    isControlled ? String(value) : undefined,
  );

  const pos = useOverlayPosition(wrapRef, search.shouldShowPopover);

  useEffect(() => {
    if (!search.shouldShowPopover || pos.isMobile) return;
    const handle = (e: MouseEvent) => {
      const inWrap = wrapRef.current?.contains(e.target as Node);
      const inList = search.listRef.current?.contains(e.target as Node);
      if (!inWrap && !inList) {
        search.setIsOpen(false);
        search.setActiveIndex(-1);
      }
    };
    document.addEventListener('pointerdown', handle);
    return () => {
      document.removeEventListener('pointerdown', handle);
    };
  }, [search.shouldShowPopover, pos.isMobile, search]);

  const setRef = useCallback(
    (el: HTMLInputElement | null) => {
      localInputRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  const showClear = clearable && search.currentVal.length > 0;
  const showRightIco = Boolean(rightIcon) && !showClear;
  const listboxId = `${_id}-listbox`;

  const sharedContent = (
    <SearchResultContent
      listboxId={listboxId}
      listRef={search.listRef}
      isLoading={isLoading}
      results={results}
      activeIndex={search.activeIndex}
      currentVal={search.currentVal}
      inputId={_id}
      noResultsText={noResultsText}
      onMouseEnter={search.setActiveIndex}
      onMouseLeave={() => {
        search.setActiveIndex(-1);
      }}
      onSelect={search.handleSelect}
    />
  );

  return (
    <FieldShell
      id={_id}
      label={label}
      helperText={helperText}
      error={search.error}
      hasError={search.hasError}
      required={required}
    >
      <S.InputWrap ref={wrapRef} $disabled={Boolean(disabled)}>
        <S.IconSlot $size={size} $side="left" $variant={variant} aria-hidden="true">
          {leftIcon ?? <SearchIcon />}
        </S.IconSlot>

        <S.NativeInput
          {...rest}
          ref={setRef}
          id={_id}
          type="search"
          $size={size}
          $variant={variant}
          $hasError={search.hasError}
          $hasLeft={true}
          $hasRight={clearable || Boolean(rightIcon)}
          value={isControlled ? value : search.currentVal}
          onChange={search.handleChange}
          onFocus={search.handleFocus}
          onKeyDown={search.handleKeyDown}
          disabled={disabled}
          required={required}
          aria-invalid={search.hasError || undefined}
          aria-label={(rest as { 'aria-label'?: string })['aria-label'] ?? 'Search field'}
          aria-describedby={search.hasError ? `${_id}-subtext` : undefined}
          aria-expanded={search.shouldShowPopover}
          aria-autocomplete="list"
          aria-controls={search.shouldShowPopover ? listboxId : undefined}
          aria-activedescendant={
            search.activeIndex >= 0 ? `${_id}-result-${search.activeIndex}` : undefined
          }
          role="combobox"
          autoComplete="off"
        />

        {showClear && (
          <S.IconButton
            $size={size}
            $side="right"
            $variant={variant}
            type="button"
            onClick={search.handleClear}
            aria-label={t('form.clearSearchAriaLabel')}
          >
            <ClearIcon />
          </S.IconButton>
        )}

        {showRightIco && (
          <S.IconSlot $size={size} $side="right" $variant={variant} aria-hidden="true">
            {rightIcon}
          </S.IconSlot>
        )}
      </S.InputWrap>

      {search.shouldShowPopover &&
        createPortal(
          pos.isMobile ? (
            <>
              <S.SearchBackdrop
                onClick={() => {
                  search.setIsOpen(false);
                  search.setActiveIndex(-1);
                }}
              />
              <S.SearchBottomSheet>
                <S.SearchBottomSheetHandle aria-hidden="true" />
                {sharedContent}
              </S.SearchBottomSheet>
            </>
          ) : (
            <S.SearchPortalPopover
              style={{
                top: pos.top,
                left: pos.left,
                width: pos.width,
                maxHeight: pos.maxHeight,
                transform: pos.placement === 'top' ? 'translateY(-100%)' : undefined,
              }}
              $placement={pos.placement}
            >
              {sharedContent}
            </S.SearchPortalPopover>
          ),
          document.body,
        )}
    </FieldShell>
  );
};

SearchInput.displayName = 'SearchInput';

// ═══════════════════════════════════════════════════════════════════════════════
// TextareaInput — Hardened
// ═══════════════════════════════════════════════════════════════════════════════

interface ITextareaInputWithRef extends ITextareaInputProps {
  _id: string;
  ref?: React.Ref<HTMLTextAreaElement>;
}

const TextareaInput = ({
  _id,
  label,
  helperText,
  error: externalError,
  validate: validateFn,
  validationRules,
  sanitize: enableSanitize = true,
  sanitizeOptions,
  onSecurityEvent,
  rateLimitOptions,
  size = 'md',
  variant = 'outlined',
  leftIcon,
  rightIcon,
  clearable = false,
  showCount = false,
  minRows = 3,
  disabled,
  required,
  value,
  defaultValue,
  maxLength,
  onChange,
  onBlur,
  placeholder,
  ref,
  ...rest
}: ITextareaInputWithRef) => {
  const { t } = useTranslation('common');
  const [internalVal, setInternalVal] = useState(String(defaultValue ?? ''));
  const isControlled = value !== undefined;
  const currentVal = isControlled ? String(value) : internalVal;

  // Merge HTML maxLength into rules so the security pipeline sees it
  const mergedRules = maxLength ? { ...validationRules, maxLength } : validationRules;

  const security = useSecureInput({
    validateFn,
    validationRules: mergedRules,
    sanitize: enableSanitize,
    sanitizeOptions,
    externalError,
    rateLimitOptions,
    onSecurityEvent,
    fieldId: _id,
  });

  const resolvedError =
    security.error ||
    (security.isRateLimited ? 'Unusual input frequency detected — please slow down' : '');
  const resolvedHasError = Boolean(resolvedError);
  const safePlaceholder = escapeAttr(placeholder);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const raw = e.target.value;

      const limited = security.trackChange();
      if (limited) {
        onSecurityEvent?.({
          type: 'rate-limit-hit',
          fieldId: _id,
          timestamp: Date.now(),
          rawValue: raw,
        } satisfies ISecurityEvent);
      }

      const safe = security.sanitize(raw);
      security.validate(safe);
      if (!isControlled) setInternalVal(safe);

      if (onChange) {
        const safeEvt = Object.assign({}, e, {
          target: Object.assign({}, e.target, { value: safe }),
          currentTarget: Object.assign({}, e.currentTarget, { value: safe }),
        }) as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(safeEvt);
      }
    },
    [isControlled, onChange, security, _id, onSecurityEvent],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      security.validate(e.target.value);
      onBlur?.(e);
    },
    [security, onBlur],
  );

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalVal('');
    security.validate('');
    onChange?.({
      target: { value: '' },
    } as React.ChangeEvent<HTMLTextAreaElement>);
  }, [isControlled, onChange, security]);

  const effectiveMax =
    maxLength ??
    (typeof validationRules?.maxLength === 'number'
      ? validationRules.maxLength
      : typeof validationRules?.maxLength === 'object'
        ? validationRules.maxLength.value
        : undefined);

  const charCount = currentVal.length;
  const near = effectiveMax ? charCount >= effectiveMax * 0.85 : false;
  const over = effectiveMax ? charCount > effectiveMax : false;

  const showOverlay = showCount && effectiveMax !== undefined;
  const showClear = clearable && currentVal.length > 0;
  const showRightIco = Boolean(rightIcon) && !showClear;
  const hasLeft = Boolean(leftIcon);
  const hasRight = clearable || Boolean(rightIcon);

  const textarea = (
    <S.NativeTextarea
      ref={ref}
      {...rest}
      id={_id}
      $size={size}
      $variant={variant}
      $hasError={resolvedHasError}
      $hasLeft={hasLeft}
      $hasRight={hasRight}
      $minRows={minRows}
      $hasCount={showOverlay}
      value={isControlled ? String(value) : internalVal}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      required={required}
      maxLength={maxLength}
      placeholder={safePlaceholder || undefined}
      aria-invalid={resolvedHasError || undefined}
      aria-describedby={resolvedHasError ? `${_id}-subtext` : undefined}
      aria-multiline="true"
    />
  );

  if (!hasLeft && !hasRight && !showOverlay) {
    return (
      <FieldShell
        id={_id}
        label={label}
        helperText={helperText}
        error={resolvedError}
        hasError={resolvedHasError}
        required={required}
      >
        {textarea}
      </FieldShell>
    );
  }

  return (
    <FieldShell
      id={_id}
      label={label}
      helperText={helperText}
      error={resolvedError}
      hasError={resolvedHasError}
      required={required}
    >
      <S.InputWrap $disabled={Boolean(disabled)} style={{ alignItems: 'flex-start' }}>
        {leftIcon && (
          <S.IconSlot
            $size={size}
            $side="left"
            $variant={variant}
            aria-hidden="true"
            style={{ top: '12px', transform: 'none' }}
          >
            {leftIcon}
          </S.IconSlot>
        )}

        {textarea}

        {showClear && (
          <S.IconButton
            $size={size}
            $side="right"
            $variant={variant}
            type="button"
            onClick={handleClear}
            aria-label={t('form.clearFieldAriaLabel')}
            style={{ top: '10px', transform: 'none' }}
          >
            <ClearIcon />
          </S.IconButton>
        )}

        {showRightIco && (
          <S.IconSlot
            $size={size}
            $side="right"
            $variant={variant}
            aria-hidden="true"
            style={{ top: '10px', transform: 'none' }}
          >
            {rightIcon}
          </S.IconSlot>
        )}

        {showOverlay && (
          <S.CharCountOverlay $near={near} $over={over} $size={size}>
            {charCount} / {effectiveMax}
          </S.CharCountOverlay>
        )}
      </S.InputWrap>
    </FieldShell>
  );
};

TextareaInput.displayName = 'TextareaInput';

// ═══════════════════════════════════════════════════════════════════════════════
// FormInput — dispatcher
// ═══════════════════════════════════════════════════════════════════════════════

type TFormInputWithRef = IFormInputProps & { ref?: React.Ref<HTMLElement> };

export const FormInput = ({ ref, ...props }: TFormInputWithRef) => {
  useFormContextOrThrow();
  const autoId = useId();
  const id = (props as { id?: string }).id ?? autoId;
  if (props.type === 'search')
    return <SearchInput ref={ref as React.Ref<HTMLInputElement>} {...props} _id={id} />;
  if (props.type === 'textarea')
    return <TextareaInput ref={ref as React.Ref<HTMLTextAreaElement>} {...props} _id={id} />;
  return <TextInput ref={ref as React.Ref<HTMLInputElement>} {...props} _id={id} />;
};

FormInput.displayName = 'Form.Input';

// eslint-disable-next-line react-refresh/only-export-components -- hook re-exported for backward compatibility; no HMR impact
export { useDebounce };
