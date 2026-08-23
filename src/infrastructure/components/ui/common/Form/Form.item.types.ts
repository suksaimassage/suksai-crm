/**
 * FormInput — Types
 *
 * ISP: Interfaces mínimas por responsabilidad.
 * OCP: Extensible vía props sin modificar la implementación base.
 *
 * Security additions (v2):
 *   - IValidationRules      — declarative field validation
 *   - ISanitizeOptions      — tuning knobs for sanitization
 *   - ISecurityEvent        — audit callback payload
 *   - validationRules       — added to IInputBaseProps
 *   - sanitize              — enable / disable sanitization layer
 *   - onSecurityEvent       — fires on XSS / SQL detection / rate-limit
 *
 * Extiende los atributos HTML nativos del elemento correspondiente
 * para mantener compatibilidad total (a11y, autoComplete, name, form…).
 */

import type { IRateLimitOptions } from '@infra/components/ui/common/Form/Form.security';
import type {
  ISanitizeOptions,
  ISecurityEvent,
  IValidationRules,
} from '@infra/components/ui/common/Form/Form.types';
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

// ─── Re-export security types (consumers import from one place) ───────────────

export type {
  IValidationRules,
  ISanitizeOptions,
  ISecurityEvent,
  IThreatReport,
} from './Form.security';

// ─── Shared ────────────────────────────────────────────────────────────────────

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'outlined' | 'filled' | 'ghost';

/**
 * Legacy per-field validate function.
 * Prefer `validationRules` for new code; this remains for backwards compatibility.
 *
 * Returns a string error if validation fails, null/undefined if valid.
 */
export type ValidateFn<T = unknown> = (value: T) => string | null | undefined;

// ─── Base shared props (no HTML) ───────────────────────────────────────────────

interface IInputBaseProps {
  // ── Display ──────────────────────────────────────────────────────────────────
  /** Etiqueta visible encima del campo */
  readonly label?: string;
  /** Texto de ayuda debajo del campo (sustituido por error cuando hay uno) */
  readonly helperText?: string;
  /** Texto de error externo. Si está presente, el campo se marca en rojo */
  readonly error?: string;
  /** @default "md" */
  readonly size?: InputSize;
  /** @default "outlined" */
  readonly variant?: InputVariant;
  /** Icono a la izquierda del input */
  readonly leftIcon?: ReactNode;
  /** Icono a la derecha del input */
  readonly rightIcon?: ReactNode;
  /** Muestra botón × para limpiar el valor */
  readonly clearable?: boolean;

  // ── Validation ───────────────────────────────────────────────────────────────
  /**
   * Legacy per-field validator (still supported).
   * Runs after rule-based validation.
   */
  readonly validate?: ValidateFn;
  /**
   * Declarative validation rules applied on every change and blur.
   * Takes priority over the legacy `validate` fn for rule-based checks;
   * both can coexist — rules run first, then the custom function.
   */
  readonly validationRules?: IValidationRules;

  // ── Security ─────────────────────────────────────────────────────────────────
  /**
   * Enable the XSS sanitization layer.
   * When true (default), XSS vectors are stripped from the value before
   * it is stored in state or passed to onChange callbacks.
   *
   * Set to false ONLY for intentionally rich-text fields where the sanitized
   * value will be processed elsewhere (e.g. a dedicated markdown editor).
   *
   * @default true
   */
  readonly sanitize?: boolean;
  /**
   * Tuning options for the sanitizer.
   * Only relevant when sanitize is true.
   */
  readonly sanitizeOptions?: ISanitizeOptions;
  /**
   * Audit callback — fired when a security-relevant event occurs:
   *   "xss-detected"            — XSS pattern found in raw value
   *   "xss-sanitized"           — sanitizer removed content from the value
   *   "sql-injection-detected"  — SQL injection pattern detected
   *   "rate-limit-hit"          — input changed too rapidly
   *   "disallowed-pattern"      — a disallowPatterns rule triggered
   *
   * Intended for integration with logging / monitoring.
   * NEVER forward the rawValue in this callback to a remote service.
   */
  readonly onSecurityEvent?: (event: ISecurityEvent) => void;
  /**
   * Rate-limiter options.
   * Inputs that receive an unusual number of changes per second are flagged.
   * @see IRateLimitOptions in Form.security.ts
   */
  readonly rateLimitOptions?: IRateLimitOptions;
}

// ─── Text / Password / Email / URL / Tel / Number ─────────────────────────────

export interface ITextInputProps
  extends IInputBaseProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  readonly type?: 'text' | 'password' | 'email' | 'url' | 'tel' | 'number';
}

// ─── Search ────────────────────────────────────────────────────────────────────

/** A single result item rendered in the search popover. */
export interface ISearchResult {
  readonly id: string | number;
  readonly label: string;
  readonly description?: string;
  readonly icon?: React.ReactNode;
}

export interface ISearchInputProps
  extends
    IInputBaseProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'results'> {
  readonly type: 'search';
  /** @default 350 */
  readonly debounceMs?: number;
  readonly onSearch?: (value: string) => void;
  readonly results?: ISearchResult[];
  readonly isLoading?: boolean;
  readonly onResultSelect?: (result: ISearchResult) => void;
  /** @default "Sin resultados" */
  readonly noResultsText?: string;
}

// ─── Textarea ──────────────────────────────────────────────────────────────────

export interface ITextareaInputProps
  extends IInputBaseProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  readonly type: 'textarea';
  /** Muestra contador "actual / máximo" al pie */
  readonly showCount?: boolean;
  /** @default 3 */
  readonly minRows?: number;
}

// ─── Union ─────────────────────────────────────────────────────────────────────

export type IFormInputProps = ITextInputProps | ISearchInputProps | ITextareaInputProps;
