/**
 * FeaturePermissionService — UI-feature access predicates.
 *
 * Pure, framework-agnostic service that answers YES/NO questions about
 * which features a user may access based on their role set.
 *
 * Rules of thumb:
 *   - All methods accept the full roles array (a user can have multiple roles).
 *   - Permissions are ORed across roles — never ANDed.
 *   - These predicates gate UI visibility only; RLS on the database enforces
 *     the real access control boundary.
 *
 * Canonical roles: 'superadmin' | 'masajista' | 'recepcionista'
 * (see src/domain/types for TNombreRol)
 */

import type { TNombreRol } from '../types';

// ─── Role sets (private) ──────────────────────────────────────────────────────

/** Roles that may write/mutate catalogue and configuration data. */
const ADMIN_WRITE_ROLES: readonly TNombreRol[] = ['superadmin'] as const;

/** Roles that may manage the work schedule (shifts). */
const SCHEDULE_WRITE_ROLES: readonly TNombreRol[] = ['superadmin', 'recepcionista'] as const;

/** Roles that may see all therapists (e.g. LTV column, full therapist list). */
const ALL_THERAPISTS_ROLES: readonly TNombreRol[] = ['superadmin', 'recepcionista'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasAnyRole(roles: readonly TNombreRol[], allowed: readonly TNombreRol[]): boolean {
  return roles.some((r) => (allowed as readonly string[]).includes(r));
}

// ─── Predicates ──────────────────────────────────────────────────────────────

/**
 * Whether the user may create, edit, or delete centres (centros).
 * Superadmin only.
 */
function canManageCentros(roles: readonly TNombreRol[]): boolean {
  return hasAnyRole(roles, ADMIN_WRITE_ROLES);
}

/**
 * Whether the user may create, edit, or delete ritual/service catalogue entries.
 * Superadmin only.
 */
function canManageRituales(roles: readonly TNombreRol[]): boolean {
  return hasAnyRole(roles, ADMIN_WRITE_ROLES);
}

/**
 * Whether the user may see revenue / financial KPIs.
 * Superadmin only.
 */
function canSeeRevenue(roles: readonly TNombreRol[]): boolean {
  return hasAnyRole(roles, ADMIN_WRITE_ROLES);
}

/**
 * Whether the user may see data for all therapists (e.g. full client LTV,
 * therapist selector in calendar).
 * Superadmin and recepcionista.
 */
function canSeeAllTherapists(roles: readonly TNombreRol[]): boolean {
  return hasAnyRole(roles, ALL_THERAPISTS_ROLES);
}

/**
 * Whether the user may create, update, delete, or reschedule work schedule shifts.
 * Superadmin and recepcionista.
 */
function canEditWorkSchedule(roles: readonly TNombreRol[]): boolean {
  return hasAnyRole(roles, SCHEDULE_WRITE_ROLES);
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const FeaturePermissionService = {
  canManageCentros,
  canManageRituales,
  canSeeRevenue,
  canSeeAllTherapists,
  canEditWorkSchedule,
} as const;
