/**
 * auth-error-mapping.ts — Map auth/network errors to i18n keys.
 *
 * Pure function — no side effects (except a single logger.warn for unmapped errors).
 * Domain errors carrying an i18n key in their `message` field pass through unchanged.
 */

import { logger } from './logger';

interface IErrorShape {
  readonly code?: string;
  readonly status?: number;
  readonly message?: string;
}

const I18N_KEY_PATTERN = /^[a-z0-9_]+:[a-zA-Z0-9._]+$/;

export function mapAuthErrorToI18nKey(error: unknown): string {
  if (!error) return 'login:error.unknown';

  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return 'login:error.network';
  }

  const e = error as IErrorShape;

  if (e.message && I18N_KEY_PATTERN.test(e.message)) return e.message;

  // BusinessRuleViolation codes from SupabaseAuthAdapter (custom auth — no Supabase Auth events)
  if (e.code === 'INVALID_CREDENTIALS') return 'login:error.invalidCredentials';
  if (e.code === 'ACCOUNT_DEACTIVATED') return 'login:error.accountDeactivated';
  if (e.code === 'NO_ROLES_ASSIGNED') return 'login:error.noRoles';
  if (e.code === 'PROFILE_NOT_FOUND') return 'login:error.profileNotFound';

  // Supabase network-level error codes (lowercase — from supabase-js client)
  if (e.code === 'invalid_credentials') return 'login:error.invalidCredentials';

  if (e.status === 429) return 'login:error.rateLimited';
  if (typeof e.status === 'number' && e.status >= 500) return 'login:error.serverUnavailable';

  if (e.status === 400 && /credentials/i.test(e.message ?? '')) {
    return 'login:error.invalidCredentials';
  }

  // Log only safe structural metadata — never the raw error object (may contain tokens/emails).
  const safeShape = {
    status: typeof e.status === 'number' ? e.status : undefined,
    code: typeof e.code === 'string' ? e.code : undefined,
  };
  logger.warn('[auth] unmapped error:', safeShape);
  return 'login:error.unknown';
}
