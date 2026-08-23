/**
 * FeaturePermissionService.test.ts
 *
 * Pure unit tests — no mocking required.
 * FeaturePermissionService has zero external dependencies; it operates solely on
 * immutable role-set constants and the deterministic hasAnyRole helper.
 *
 * Canonical roles (live DB): superadmin | masajista | recepcionista
 *
 * Test goals:
 *   - canManageCentros: superadmin=true, others=false, empty=false
 *   - canManageRituales: superadmin=true, others=false, empty=false
 *   - canSeeRevenue: superadmin=true, others=false, empty=false
 *   - canSeeAllTherapists: superadmin+recepcionista=true, masajista=false, empty=false
 *   - canEditWorkSchedule: superadmin+recepcionista=true, masajista=false, empty=false
 *   - Multi-role OR semantics: masajista+superadmin unlocks superadmin-only predicates
 *   - Empty roles array: all predicates return false
 */

import { describe, it, expect } from 'vitest';
import { FeaturePermissionService } from '@domain/services/FeaturePermissionService';
import type { TNombreRol } from '@domain/types';

// ── Fixtures ───────────────────────────────────────────────────────────────────

const SUPERADMIN: readonly TNombreRol[] = ['superadmin'];
const RECEPCIONISTA: readonly TNombreRol[] = ['recepcionista'];
const MASAJISTA: readonly TNombreRol[] = ['masajista'];
const EMPTY: readonly TNombreRol[] = [];

// ── canManageCentros ──────────────────────────────────────────────────────────

describe('FeaturePermissionService.canManageCentros', () => {
  it('returns true for superadmin', () => {
    expect(FeaturePermissionService.canManageCentros(SUPERADMIN)).toBe(true);
  });

  it('returns false for recepcionista', () => {
    expect(FeaturePermissionService.canManageCentros(RECEPCIONISTA)).toBe(false);
  });

  it('returns false for masajista', () => {
    expect(FeaturePermissionService.canManageCentros(MASAJISTA)).toBe(false);
  });

  it('returns false for empty roles', () => {
    expect(FeaturePermissionService.canManageCentros(EMPTY)).toBe(false);
  });

  it('returns true when superadmin is present alongside masajista (OR semantics)', () => {
    const roles: readonly TNombreRol[] = ['masajista', 'superadmin'];
    expect(FeaturePermissionService.canManageCentros(roles)).toBe(true);
  });
});

// ── canManageRituales ─────────────────────────────────────────────────────────

describe('FeaturePermissionService.canManageRituales', () => {
  it('returns true for superadmin', () => {
    expect(FeaturePermissionService.canManageRituales(SUPERADMIN)).toBe(true);
  });

  it('returns false for recepcionista', () => {
    expect(FeaturePermissionService.canManageRituales(RECEPCIONISTA)).toBe(false);
  });

  it('returns false for masajista', () => {
    expect(FeaturePermissionService.canManageRituales(MASAJISTA)).toBe(false);
  });

  it('returns false for empty roles', () => {
    expect(FeaturePermissionService.canManageRituales(EMPTY)).toBe(false);
  });

  it('returns true when superadmin is present alongside recepcionista (OR semantics)', () => {
    const roles: readonly TNombreRol[] = ['recepcionista', 'superadmin'];
    expect(FeaturePermissionService.canManageRituales(roles)).toBe(true);
  });
});

// ── canSeeRevenue ─────────────────────────────────────────────────────────────

describe('FeaturePermissionService.canSeeRevenue', () => {
  it('returns true for superadmin', () => {
    expect(FeaturePermissionService.canSeeRevenue(SUPERADMIN)).toBe(true);
  });

  it('returns false for recepcionista', () => {
    expect(FeaturePermissionService.canSeeRevenue(RECEPCIONISTA)).toBe(false);
  });

  it('returns false for masajista', () => {
    expect(FeaturePermissionService.canSeeRevenue(MASAJISTA)).toBe(false);
  });

  it('returns false for empty roles', () => {
    expect(FeaturePermissionService.canSeeRevenue(EMPTY)).toBe(false);
  });

  it('returns true when superadmin is present alongside masajista+recepcionista (OR semantics)', () => {
    const roles: readonly TNombreRol[] = ['masajista', 'recepcionista', 'superadmin'];
    expect(FeaturePermissionService.canSeeRevenue(roles)).toBe(true);
  });
});

// ── canSeeAllTherapists ───────────────────────────────────────────────────────

describe('FeaturePermissionService.canSeeAllTherapists', () => {
  it('returns true for superadmin', () => {
    expect(FeaturePermissionService.canSeeAllTherapists(SUPERADMIN)).toBe(true);
  });

  it('returns true for recepcionista', () => {
    expect(FeaturePermissionService.canSeeAllTherapists(RECEPCIONISTA)).toBe(true);
  });

  it('returns false for masajista', () => {
    expect(FeaturePermissionService.canSeeAllTherapists(MASAJISTA)).toBe(false);
  });

  it('returns false for empty roles', () => {
    expect(FeaturePermissionService.canSeeAllTherapists(EMPTY)).toBe(false);
  });

  it('returns true when masajista is combined with recepcionista (OR semantics)', () => {
    const roles: readonly TNombreRol[] = ['masajista', 'recepcionista'];
    expect(FeaturePermissionService.canSeeAllTherapists(roles)).toBe(true);
  });
});

// ── canEditWorkSchedule ───────────────────────────────────────────────────────

describe('FeaturePermissionService.canEditWorkSchedule', () => {
  it('returns true for superadmin', () => {
    expect(FeaturePermissionService.canEditWorkSchedule(SUPERADMIN)).toBe(true);
  });

  it('returns true for recepcionista', () => {
    expect(FeaturePermissionService.canEditWorkSchedule(RECEPCIONISTA)).toBe(true);
  });

  it('returns false for masajista', () => {
    expect(FeaturePermissionService.canEditWorkSchedule(MASAJISTA)).toBe(false);
  });

  it('returns false for empty roles', () => {
    expect(FeaturePermissionService.canEditWorkSchedule(EMPTY)).toBe(false);
  });

  it('returns true when masajista is combined with superadmin (OR semantics)', () => {
    const roles: readonly TNombreRol[] = ['masajista', 'superadmin'];
    expect(FeaturePermissionService.canEditWorkSchedule(roles)).toBe(true);
  });
});

// ── Cross-predicate consistency ───────────────────────────────────────────────

describe('FeaturePermissionService — superadmin unlocks all predicates', () => {
  it.each([
    'canManageCentros',
    'canManageRituales',
    'canSeeRevenue',
    'canSeeAllTherapists',
    'canEditWorkSchedule',
  ] as const)('%s returns true for superadmin', (predicate) => {
    expect(FeaturePermissionService[predicate](SUPERADMIN)).toBe(true);
  });
});

describe('FeaturePermissionService — masajista is denied all predicates', () => {
  it.each([
    'canManageCentros',
    'canManageRituales',
    'canSeeRevenue',
    'canSeeAllTherapists',
    'canEditWorkSchedule',
  ] as const)('%s returns false for masajista', (predicate) => {
    expect(FeaturePermissionService[predicate](MASAJISTA)).toBe(false);
  });
});

describe('FeaturePermissionService — empty roles is denied all predicates', () => {
  it.each([
    'canManageCentros',
    'canManageRituales',
    'canSeeRevenue',
    'canSeeAllTherapists',
    'canEditWorkSchedule',
  ] as const)('%s returns false for empty roles', (predicate) => {
    expect(FeaturePermissionService[predicate](EMPTY)).toBe(false);
  });
});
