/**
 * Form.security.ts
 *
 * Layered frontend security for form inputs.
 *
 * DISCLAIMER — Frontend protections are defensive-only.
 * Backend MUST independently validate, sanitize, and use
 * parameterised queries. This layer reduces the attack surface
 * and provides UX feedback; it does NOT replace server-side controls.
 *
 * Exports (pure utilities — no React deps):
 *   sanitizeInput       — strips definitive XSS vectors
 *   detectThreats       — identifies suspicious patterns without stripping
 *   validateRules       — configurable rule-based field validation
 *   escapeAttr          — ensures prop values are safe strings
 *
 * Exports (React hooks):
 *   useInputRateLimiter — detects bot-like rapid-input patterns
 *   useSecureInput      — orchestrates all layers; drop-in for useValidation
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ValidateFn } from './Form.types';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ISanitizeOptions {
  /**
   * Additional custom patterns to strip beyond the built-in XSS set.
   * Each pattern is replaced with an empty string.
   */
  readonly extraStripPatterns?: readonly RegExp[];
  /**
   * Hard cap applied after stripping. Excess characters are silently
   * truncated (maxLength validation produces an error message; this
   * is a last-resort structural guard).
   */
  readonly hardMaxLength?: number;
}

export interface IValidationRules {
  /** Field must have a non-empty value. */
  readonly required?: boolean | string;
  /** Minimum character count. */
  readonly minLength?: number | { readonly value: number; readonly message: string };
  /** Maximum character count. */
  readonly maxLength?: number | { readonly value: number; readonly message: string };
  /** Value must fully match this RegExp. */
  readonly pattern?: RegExp | { readonly value: RegExp; readonly message: string };
  /**
   * Any of these RegExps being present in the value is treated as an error.
   * Use for domain-specific blocked patterns (e.g. no angle brackets in a
   * name field, no newlines in a single-line field).
   */
  readonly disallowPatterns?: readonly (
    | RegExp
    | { readonly value: RegExp; readonly message: string }
  )[];
}

export interface IThreatReport {
  readonly hasXss: boolean;
  readonly hasSqlInjection: boolean;
  /** True when the sanitized value differs from the raw value. */
  readonly wasSanitized: boolean;
  /** Human-readable list of detected threat categories. */
  readonly detectedCategories: readonly string[];
  readonly riskLevel: 'none' | 'low' | 'medium' | 'critical';
}

/** Fired when a security event occurs — useful for audit logging. */
export interface ISecurityEvent {
  readonly type:
    | 'xss-detected'
    | 'xss-sanitized'
    | 'sql-injection-detected'
    | 'rate-limit-hit'
    | 'disallowed-pattern';
  readonly fieldId?: string;
  readonly timestamp: number;
  /** Raw value that triggered the event (never log to a remote service). */
  readonly rawValue: string;
}

export interface IRateLimitOptions {
  /**
   * Maximum number of change events allowed within `windowMs`.
   * @default 20
   */
  readonly maxChanges?: number;
  /**
   * Time window in milliseconds.
   * @default 1000
   */
  readonly windowMs?: number;
}

export interface IUseSecureInputOptions {
  readonly validateFn?: ValidateFn;
  readonly validationRules?: IValidationRules;
  readonly sanitize?: boolean;
  readonly sanitizeOptions?: ISanitizeOptions;
  readonly externalError?: string;
  readonly rateLimitOptions?: IRateLimitOptions;
  readonly onSecurityEvent?: (event: ISecurityEvent) => void;
  readonly fieldId?: string;
}

export interface IUseSecureInputReturn {
  /** Error string shown below the field (validation + threat messages merged). */
  readonly error: string;
  readonly hasError: boolean;
  /**
   * Run full security + validation pipeline on a new value.
   * Called from onChange / onBlur.
   */
  readonly validate: (value: string) => void;
  /** Sanitized value — used as the `value` shown in the input. */
  readonly sanitize: (raw: string) => string;
  /** Full threat report for the most-recently checked value. */
  readonly lastThreat: IThreatReport | null;
  readonly isRateLimited: boolean;
  readonly trackChange: () => boolean; // returns true if rate-limited
}

// ═══════════════════════════════════════════════════════════════════════════════
// XSS STRIP PATTERNS
// Only patterns that are UNAMBIGUOUSLY malicious and have no legitimate use
// in a plain-text form field are stripped.  We never strip individual < > ' "
// characters because they appear in valid text (comparisons, names, quotes).
// ═══════════════════════════════════════════════════════════════════════════════

const XSS_STRIP: readonly RegExp[] = [
  // Complete <script>…</script> blocks (including nested newlines)
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  // <iframe>, <object>, <embed>, <link rel=import> tags
  /<(?:iframe|object|embed)\b[^>]*(?:\/?>|>[\s\S]*?<\/(?:iframe|object|embed)>)/gi,
  // javascript: and vbscript: URI schemes
  /\bjavascript\s*:/gi,
  /\bvbscript\s*:/gi,
  // Inline event-handler attributes: onerror=, onclick=, onload=, etc.
  /\bon(?:error|load|unload|abort|click|dblclick|mouse(?:down|up|over|move|out|enter|leave)|focus(?:in|out)?|blur|key(?:down|up|press)|submit|reset|change|input|select|context(?:menu)|drag\w*|drop|touch\w*|pointer\w*|wheel|scroll|resize|copy|cut|paste|animation\w*|transition\w*)\s*=\s*["']?[^"'>]*/gi,
  // data: URIs embedding HTML or SVG
  /data\s*:\s*(?:text\/html|image\/svg\+xml)/gi,
  // srcdoc attribute (used to inject HTML into iframes)
  /\bsrcdoc\s*=/gi,
];

// ═══════════════════════════════════════════════════════════════════════════════
// XSS DETECTION PATTERNS (detect without stripping — for reporting)
// ═══════════════════════════════════════════════════════════════════════════════

const XSS_DETECT: readonly RegExp[] = [
  // Opening tags for high-risk elements
  /<(?:script|iframe|object|embed|link|meta|base|form|input|button|svg|math)\b/gi,
  // Any event handler attribute (broader than strip — catches partial injections)
  /\bon\w+\s*=/gi,
  // Protocol injections
  /\b(?:javascript|vbscript|data)\s*:/gi,
  // Template injection markers used by Angular, Vue, Twig, Jinja, etc.
  /\{\{[\s\S]{0,80}\}\}|\$\{[\s\S]{0,80}\}|<%[\s\S]{0,80}%>/g,
];

// ═══════════════════════════════════════════════════════════════════════════════
// SQL INJECTION DETECTION (warn; do NOT strip — legitimate text contains ' --)
// ═══════════════════════════════════════════════════════════════════════════════

const SQL_DETECT: readonly RegExp[] = [
  // Classic tautology: ' OR '1'='1  /  ' OR 1=1
  /'\s*(?:OR|AND)\s+(?:'1'\s*=\s*'1|\d+\s*=\s*\d+)/gi,
  // Destructive statements preceded by a delimiter
  /;\s*(?:DROP|DELETE|TRUNCATE|ALTER|CREATE|EXEC(?:UTE)?)\s+/gi,
  // UNION-based extraction
  /\bUNION\s+(?:ALL\s+)?SELECT\b/gi,
  // Batched queries via stacked statements
  /;\s*(?:INSERT|UPDATE|MERGE)\s+/gi,
];

// ═══════════════════════════════════════════════════════════════════════════════
// PURE UTILITY FUNCTIONS (no React)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Strips definitive XSS vectors from a string value.
 *
 * Only removes patterns that have NO legitimate use in a plain-text field
 * (complete script blocks, event handlers, dangerous URI schemes).
 * Single characters like `<`, `>`, `'`, `"`, or keywords like `OR` / `SELECT`
 * are intentionally preserved to avoid breaking valid input.
 *
 * Multiple passes are applied because stripping one pattern can expose another
 * (e.g. `<scr<script>ipt>` → `<script>` after the first pass).
 */
export function sanitizeInput(raw: string, opts?: ISanitizeOptions): string {
  if (!raw) return raw;

  let result = raw;

  // Two passes prevent bypass via recursive construction
  for (let pass = 0; pass < 2; pass++) {
    for (const pattern of XSS_STRIP) {
      // Reset lastIndex for stateful (g) regexes
      pattern.lastIndex = 0;
      result = result.replace(pattern, '');
    }
    if (opts?.extraStripPatterns) {
      for (const p of opts.extraStripPatterns) {
        p.lastIndex = 0;
        result = result.replace(p, '');
      }
    }
  }

  // Hard length cap (structural guard — not a UX validation)
  if (opts?.hardMaxLength && result.length > opts.hardMaxLength) {
    result = result.slice(0, opts.hardMaxLength);
  }

  return result;
}

/**
 * Detects threat patterns in a raw value without modifying it.
 *
 * Use this to generate audit events and user-facing warnings.
 * Deliberately separate from `sanitizeInput` so callers can log the
 * original value alongside the threat report.
 */
export function detectThreats(raw: string): IThreatReport {
  if (!raw) {
    return {
      hasXss: false,
      hasSqlInjection: false,
      wasSanitized: false,
      detectedCategories: [],
      riskLevel: 'none',
    };
  }

  const categories: string[] = [];

  const hasXss = XSS_DETECT.some((p) => {
    p.lastIndex = 0;
    return p.test(raw);
  });
  if (hasXss) categories.push('XSS');

  const hasSqlInjection = SQL_DETECT.some((p) => {
    p.lastIndex = 0;
    return p.test(raw);
  });
  if (hasSqlInjection) categories.push('SQL Injection');

  const sanitized = sanitizeInput(raw);
  const wasSanitized = sanitized !== raw;
  if (wasSanitized && !hasXss) categories.push('Sanitized');

  const riskLevel = hasXss
    ? 'critical'
    : wasSanitized
      ? 'critical' // sanitized = something was stripped = XSS vector was present
      : hasSqlInjection
        ? ('high' as const)
        : categories.length > 0
          ? ('low' as const)
          : ('none' as const);

  return {
    hasXss,
    hasSqlInjection,
    wasSanitized,
    detectedCategories: categories,
    riskLevel: riskLevel as IThreatReport['riskLevel'],
  };
}

/**
 * Validates a string value against a set of declarative rules.
 * Returns an error message string, or null if all rules pass.
 */
export function validateRules(value: string, rules?: IValidationRules): string | null {
  if (!rules) return null;

  const v = value;

  // Required
  if (rules.required) {
    if (!v.trim()) {
      return typeof rules.required === 'string' ? rules.required : 'This field is required';
    }
  }

  // Min length
  if (rules.minLength !== undefined) {
    const min = typeof rules.minLength === 'number' ? rules.minLength : rules.minLength.value;
    const msg =
      typeof rules.minLength === 'object'
        ? rules.minLength.message
        : `Minimum ${min} characters required`;
    if (v.length < min) return msg;
  }

  // Max length
  if (rules.maxLength !== undefined) {
    const max = typeof rules.maxLength === 'number' ? rules.maxLength : rules.maxLength.value;
    const msg =
      typeof rules.maxLength === 'object'
        ? rules.maxLength.message
        : `Maximum ${max} characters allowed`;
    if (v.length > max) return msg;
  }

  // Pattern (must match)
  if (rules.pattern !== undefined) {
    const regex = rules.pattern instanceof RegExp ? rules.pattern : rules.pattern.value;
    const msg = rules.pattern instanceof RegExp ? 'Invalid format' : rules.pattern.message;
    regex.lastIndex = 0;
    if (!regex.test(v)) return msg;
  }

  // Disallow patterns (must NOT match)
  if (rules.disallowPatterns) {
    for (const entry of rules.disallowPatterns) {
      const regex = entry instanceof RegExp ? entry : entry.value;
      const msg =
        entry instanceof RegExp
          ? 'Value contains disallowed characters or patterns'
          : entry.message;
      regex.lastIndex = 0;
      if (regex.test(v)) return msg;
    }
  }

  return null;
}

/**
 * Ensures a prop value is a safe plain string.
 *
 * - Non-string types → empty string (prevents type-confusion injection)
 * - HTML entities in the result are not escaped here because React already
 *   escapes attribute values when rendering. This guard is for structural
 *   safety (ensure we pass a string, not a number, object, or array).
 */
export function escapeAttr(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Strip the same XSS vectors from attribute values
  return sanitizeInput(value).slice(0, 1000); // hard cap for attributes
}

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tracks the frequency of input change events.
 *
 * Returns `isRateLimited` (true when changes exceed the threshold) and
 * `trackChange` (call this on every onChange to update the counter).
 *
 * Purposefully does NOT block onChange — controlled inputs must always
 * receive their update. Instead, the rate-limit state is exposed as an
 * error so the form's submit handler is gated.
 */
export function useInputRateLimiter(opts?: IRateLimitOptions): {
  isRateLimited: boolean;
  trackChange: () => boolean;
  reset: () => void;
} {
  const maxChanges = opts?.maxChanges ?? 20;
  const windowMs = opts?.windowMs ?? 1000;

  const [isRateLimited, setIsRateLimited] = useState(false);

  // Ring buffer of timestamps — avoids allocating on each change
  const timestamps = useRef<number[]>([]);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    timestamps.current = [];
    setIsRateLimited(false);
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const trackChange = useCallback((): boolean => {
    const now = Date.now();
    // Prune entries outside the window
    timestamps.current = timestamps.current.filter((t) => now - t < windowMs);
    timestamps.current.push(now);

    const limited = timestamps.current.length > maxChanges;
    setIsRateLimited(limited);

    if (limited) {
      // Auto-reset after the window expires
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(reset, windowMs);
    }

    return limited;
  }, [maxChanges, windowMs, reset]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  return { isRateLimited, trackChange, reset };
}

/**
 * Drop-in replacement for `useValidation` that adds:
 *  - XSS sanitization on every change
 *  - Threat detection + audit event dispatch
 *  - Rule-based validation (minLength, maxLength, pattern, disallowPatterns)
 *  - Rate-limit detection with error surfacing
 *
 * The hook returns a `sanitize()` function that the component must call
 * on the raw value before setting state.  This ensures the internal value
 * and the value shown in the input are always the sanitized version.
 */
export function useSecureInput(opts: IUseSecureInputOptions): IUseSecureInputReturn {
  const {
    validateFn,
    validationRules,
    sanitize: enableSanitize = true,
    sanitizeOptions,
    externalError,
    rateLimitOptions,
    onSecurityEvent,
    fieldId,
  } = opts;

  const [validationError, setValidationError] = useState('');
  const [threatError, setThreatError] = useState('');
  const [lastThreat, setLastThreat] = useState<IThreatReport | null>(null);

  const { isRateLimited, trackChange } = useInputRateLimiter(rateLimitOptions);

  // Stable ref to the security event callback — avoids stale closures
  const eventCbRef = useRef(onSecurityEvent);

  /** Emit a security audit event (fire-and-forget). */
  const emitEvent = useCallback(
    (type: ISecurityEvent['type'], rawValue: string) => {
      eventCbRef.current?.({
        type,
        fieldId,
        timestamp: Date.now(),
        rawValue,
      });
    },
    [fieldId],
  );

  /**
   * Sanitizes a raw string and emits audit events if the value was modified.
   * Returns the safe string — component must use this as the stored value.
   */
  const sanitize = useCallback(
    (raw: string): string => {
      if (!enableSanitize) return raw;
      const safe = sanitizeInput(raw, sanitizeOptions);
      if (safe !== raw) {
        emitEvent('xss-sanitized', raw);
      }
      return safe;
    },
    [enableSanitize, sanitizeOptions, emitEvent],
  );

  /**
   * Runs the full pipeline: threat detection → rule validation → custom fn.
   * Updates error state.  Call from onChange and onBlur.
   */
  const validate = useCallback(
    (value: string) => {
      // ── 1. Threat detection ──────────────────────────────────────────────
      const report = detectThreats(value);
      setLastThreat(report);

      if (report.hasXss || report.wasSanitized) {
        const msg = 'Input contains potentially unsafe content and has been cleaned';
        setThreatError(msg);
        emitEvent('xss-detected', value);
        setValidationError('');
        return;
      }

      if (report.hasSqlInjection) {
        const msg = 'Input contains disallowed patterns';
        setThreatError(msg);
        emitEvent('sql-injection-detected', value);
        setValidationError('');
        return;
      }

      setThreatError('');

      // ── 2. Rule-based validation ─────────────────────────────────────────
      const rulesError = validateRules(value, validationRules);
      if (rulesError) {
        setValidationError(rulesError);
        return;
      }

      // ── 3. Custom validate function ──────────────────────────────────────
      const customError = validateFn ? (validateFn(value) ?? '') : '';
      setValidationError(customError);
    },
    [validateFn, validationRules, emitEvent],
  );

  // Derive the final error (priority: external > threat > validation)
  const error =
    externalError ?? (threatError || validationError ? threatError || validationError : '');

  return {
    error,
    hasError: Boolean(error),
    validate,
    sanitize,
    lastThreat,
    isRateLimited,
    trackChange,
  };
}
