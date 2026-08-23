/**
 * ForbiddenError.test.ts
 *
 * Pure unit tests — no mocking required.
 * ForbiddenError is a value object that extends DomainError.
 * All test assertions are purely structural and behavioral.
 *
 * Roles (live DB): superadmin | masajista | recepcionista
 *
 * Test goals:
 *   - Verify error code is always 'FORBIDDEN'
 *   - Verify name is 'ForbiddenError'
 *   - Verify message is formatted with routeId and role list
 *   - Verify routeId and userRoles are stored as read-only properties
 *   - Verify instanceof chain: ForbiddenError → DomainError → Error
 *   - Edge cases: empty roles array, single role, all routes
 */

import { describe, it, expect } from 'vitest';
import { ForbiddenError, DomainError } from '@domain/types';
import type { TDashboardRouteId, TNombreRol } from '@domain/types';

// ── Identity and inheritance ───────────────────────────────────────────────────

describe('ForbiddenError — identity and inheritance', () => {
  it('is an instance of Error', () => {
    const err = new ForbiddenError('overview', ['masajista']);
    expect(err).toBeInstanceOf(Error);
  });

  it('is an instance of DomainError', () => {
    const err = new ForbiddenError('overview', ['masajista']);
    expect(err).toBeInstanceOf(DomainError);
  });

  it('is an instance of ForbiddenError', () => {
    const err = new ForbiddenError('overview', ['masajista']);
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('has name "ForbiddenError"', () => {
    const err = new ForbiddenError('overview', ['masajista']);
    expect(err.name).toBe('ForbiddenError');
  });
});

// ── Error code ────────────────────────────────────────────────────────────────

describe('ForbiddenError — error code', () => {
  it('has code "FORBIDDEN"', () => {
    const err = new ForbiddenError('agenda', ['recepcionista']);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('code is "FORBIDDEN" regardless of the routeId', () => {
    const routes: TDashboardRouteId[] = ['rituales', 'caja', 'ajustes'];
    for (const routeId of routes) {
      const err = new ForbiddenError(routeId, ['masajista']);
      expect(err.code).toBe('FORBIDDEN');
    }
  });
});

// ── Stored properties ─────────────────────────────────────────────────────────

describe('ForbiddenError — stored routeId', () => {
  it.each([
    'overview',
    'agenda',
    'clientes',
    'rituales',
    'terapeutas',
    'caja',
    'informes',
    'ajustes',
  ] as TDashboardRouteId[])('stores routeId "%s" exactly', (routeId) => {
    const err = new ForbiddenError(routeId, ['masajista']);
    expect(err.routeId).toBe(routeId);
  });
});

describe('ForbiddenError — stored userRoles', () => {
  it('stores a single role correctly', () => {
    const roles: readonly TNombreRol[] = ['masajista'];
    const err = new ForbiddenError('rituales', roles);
    expect(err.userRoles).toEqual(['masajista']);
  });

  it('stores multiple roles correctly', () => {
    const roles: readonly TNombreRol[] = ['masajista', 'recepcionista'];
    const err = new ForbiddenError('caja', roles);
    expect(err.userRoles).toEqual(['masajista', 'recepcionista']);
  });

  it('stores an empty roles array without throwing', () => {
    const err = new ForbiddenError('ajustes', []);
    expect(err.userRoles).toEqual([]);
  });

  it('preserves role order', () => {
    const roles: readonly TNombreRol[] = ['recepcionista', 'masajista', 'superadmin'];
    const err = new ForbiddenError('informes', roles);
    expect(err.userRoles[0]).toBe('recepcionista');
    expect(err.userRoles[1]).toBe('masajista');
    expect(err.userRoles[2]).toBe('superadmin');
  });
});

// ── Message format ────────────────────────────────────────────────────────────

describe('ForbiddenError — message format', () => {
  it('includes the routeId in the message', () => {
    const err = new ForbiddenError('rituales', ['masajista']);
    expect(err.message).toContain('rituales');
  });

  it('includes each role in the message', () => {
    const err = new ForbiddenError('caja', ['masajista', 'recepcionista']);
    expect(err.message).toContain('masajista');
    expect(err.message).toContain('recepcionista');
  });

  it('message mentions "forbidden" semantics (contains routeId and roles text)', () => {
    const err = new ForbiddenError('ajustes', ['masajista']);
    // The message template: `Access to route "${routeId}" is forbidden for roles: ...`
    expect(err.message).toMatch(/forbidden/i);
    expect(err.message).toContain('ajustes');
  });

  it('message with empty roles array does not throw and is a non-empty string', () => {
    const err = new ForbiddenError('overview', []);
    expect(err.message).toBeTruthy();
    expect(typeof err.message).toBe('string');
  });

  it('message separates multiple roles with a comma', () => {
    const err = new ForbiddenError('caja', ['masajista', 'recepcionista']);
    // join(', ') produces "masajista, recepcionista"
    expect(err.message).toContain('masajista, recepcionista');
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('ForbiddenError — edge cases', () => {
  it('all three roles can be passed simultaneously without throwing', () => {
    const allRoles: readonly TNombreRol[] = ['superadmin', 'recepcionista', 'masajista'];
    expect(() => new ForbiddenError('overview', allRoles)).not.toThrow();
    const err = new ForbiddenError('overview', allRoles);
    expect(err.userRoles).toHaveLength(3);
  });

  it('two different ForbiddenError instances for the same route+roles are independent objects', () => {
    const err1 = new ForbiddenError('agenda', ['masajista']);
    const err2 = new ForbiddenError('agenda', ['masajista']);
    expect(err1).not.toBe(err2);
    expect(err1.message).toBe(err2.message);
  });

  it('can be caught as a generic Error', () => {
    const throwForbidden = () => {
      throw new ForbiddenError('rituales', ['recepcionista']);
    };
    expect(throwForbidden).toThrow(Error);
  });

  it('can be caught as a DomainError', () => {
    const throwForbidden = () => {
      throw new ForbiddenError('rituales', ['recepcionista']);
    };
    expect(throwForbidden).toThrow(DomainError);
  });

  it('can be caught as a ForbiddenError', () => {
    const throwForbidden = () => {
      throw new ForbiddenError('rituales', ['recepcionista']);
    };
    expect(throwForbidden).toThrow(ForbiddenError);
  });
});
