/**
 * utils/logger.ts — Centralised application logger.
 *
 * Security rule: Never log sensitive data — no emails, tokens, passwords,
 * or opaque third-party objects (e.g. AuthError from supabase-js).
 * Log only safe structural metadata: { status, code } extracted defensively.
 *
 * Behaviour:
 *   debug / info / warn  → no-op in production (import.meta.env.DEV === false)
 *   error                → always emits via console.error (production errors must be visible)
 */

/* eslint-disable no-console */
// This is the single authorised console wrapper — all other files must use logger instead.

const isDev = import.meta.env.DEV;

const noop = (): void => undefined;

export const logger = {
  debug: isDev
    ? (...args: readonly unknown[]): void => {
        console.debug(...args);
      }
    : noop,
  info: isDev
    ? (...args: readonly unknown[]): void => {
        console.info(...args);
      }
    : noop,
  warn: isDev
    ? (...args: readonly unknown[]): void => {
        console.warn(...args);
      }
    : noop,
  /** Always emits — production errors must be visible in the browser console. */
  error: (...args: readonly unknown[]): void => {
    console.error(...args);
  },
} as const;
