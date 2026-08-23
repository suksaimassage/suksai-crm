/**
 * terapeuta.schema.test.ts
 *
 * Unit tests for the Zod create/update schemas — pure, zero external deps.
 * Target: 100% statement/branch coverage of terapeuta.schema.ts, including the
 * shared `principalInCentros` refine (every branch) and the field-optionality
 * differences between the create and update schemas.
 *
 * Spec mapping:
 *   - §7 Domain Boundaries: principalCentroId added (number, nullable/optional)
 *     to both schemas + refine "principal ∈ centroIds when present".
 *   - Edge case E15: zero centros → principalCentroId null → valid.
 *   - Edge case E24: refine fires only when principal is non-null and NOT in centroIds.
 */

import { describe, it, expect } from 'vitest';
import { terapeutaCreateSchema, terapeutaUpdateSchema } from './terapeuta.schema';

// ── Fixtures ────────────────────────────────────────────────────────────────

const VALID_CREATE = {
  nombre: 'Ana',
  apellidos: 'Pérez',
  email: 'ana@suksai.com',
  telefono: '+34 600 000 000',
  centroIds: [1, 2],
  principalCentroId: 1,
  rolNombre: 'masajista',
} as const;

// ── Create schema — happy paths ───────────────────────────────────────────────

describe('terapeutaCreateSchema — valid input', () => {
  it('accepts a fully-populated valid DTO', () => {
    const result = terapeutaCreateSchema.safeParse(VALID_CREATE);
    expect(result.success).toBe(true);
  });

  it('accepts when principalCentroId is null (no principal chosen)', () => {
    const result = terapeutaCreateSchema.safeParse({ ...VALID_CREATE, principalCentroId: null });
    expect(result.success).toBe(true);
  });

  it('accepts when principalCentroId is omitted entirely', () => {
    const { principalCentroId: _omit, ...rest } = VALID_CREATE;
    const result = terapeutaCreateSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it('defaults centroIds to [] when omitted', () => {
    const result = terapeutaCreateSchema.safeParse({
      nombre: 'Ana',
      email: 'ana@suksai.com',
      rolNombre: 'masajista',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.centroIds).toEqual([]);
  });

  it('treats apellidos and telefono as optional', () => {
    const result = terapeutaCreateSchema.safeParse({
      nombre: 'Ana',
      email: 'ana@suksai.com',
      centroIds: [],
      rolNombre: 'masajista',
    });
    expect(result.success).toBe(true);
  });
});

// ── Create schema — required-field failures ───────────────────────────────────

describe('terapeutaCreateSchema — required-field validation', () => {
  it('rejects empty nombre', () => {
    const result = terapeutaCreateSchema.safeParse({ ...VALID_CREATE, nombre: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = terapeutaCreateSchema.safeParse({ ...VALID_CREATE, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects when email is missing', () => {
    const { email: _drop, ...rest } = VALID_CREATE;
    const result = terapeutaCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects empty rolNombre (rol is required in create mode)', () => {
    const result = terapeutaCreateSchema.safeParse({ ...VALID_CREATE, rolNombre: '' });
    expect(result.success).toBe(false);
  });

  it('rejects when rolNombre is missing', () => {
    const { rolNombre: _drop, ...rest } = VALID_CREATE;
    const result = terapeutaCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ── Create schema — principal refine (E24) ────────────────────────────────────

describe('terapeutaCreateSchema — principal-in-centros refine', () => {
  it('rejects when principalCentroId is NOT among centroIds', () => {
    const result = terapeutaCreateSchema.safeParse({
      ...VALID_CREATE,
      centroIds: [2, 3],
      principalCentroId: 1, // not in [2,3]
    });
    expect(result.success).toBe(false);
  });

  it('surfaces the refine message on the principalCentroId path', () => {
    const result = terapeutaCreateSchema.safeParse({
      ...VALID_CREATE,
      centroIds: [2, 3],
      principalCentroId: 99,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('principalCentroId'));
      expect(issue).toBeDefined();
      expect(issue?.message).toBe('El centro principal debe estar entre los centros asignados.');
    }
  });

  it('accepts when principalCentroId IS among centroIds', () => {
    const result = terapeutaCreateSchema.safeParse({
      ...VALID_CREATE,
      centroIds: [5, 6, 7],
      principalCentroId: 6,
    });
    expect(result.success).toBe(true);
  });

  it('does NOT fire the refine when principal is null even if centroIds is empty (E15)', () => {
    const result = terapeutaCreateSchema.safeParse({
      ...VALID_CREATE,
      centroIds: [],
      principalCentroId: null,
    });
    expect(result.success).toBe(true);
  });

  it('does NOT fire the refine when principal is undefined (omitted) with default centroIds', () => {
    const result = terapeutaCreateSchema.safeParse({
      nombre: 'Ana',
      email: 'ana@suksai.com',
      rolNombre: 'masajista',
      // centroIds omitted → defaults to []; principalCentroId omitted → undefined
    });
    expect(result.success).toBe(true);
  });
});

// ── Update schema — field optionality differences ─────────────────────────────

describe('terapeutaUpdateSchema — optional fields', () => {
  it('requires nombre (still mandatory in update)', () => {
    const result = terapeutaUpdateSchema.safeParse({ nombre: '', centroIds: [] });
    expect(result.success).toBe(false);
  });

  it('accepts a minimal update with only nombre + centroIds', () => {
    const result = terapeutaUpdateSchema.safeParse({ nombre: 'Ana', centroIds: [] });
    expect(result.success).toBe(true);
  });

  it('treats email as optional in update mode', () => {
    const result = terapeutaUpdateSchema.safeParse({
      nombre: 'Ana',
      centroIds: [1],
      principalCentroId: 1,
      // email omitted — allowed in update
    });
    expect(result.success).toBe(true);
  });

  it('still validates email format when provided in update mode', () => {
    const result = terapeutaUpdateSchema.safeParse({
      nombre: 'Ana',
      email: 'bad',
      centroIds: [],
    });
    expect(result.success).toBe(false);
  });

  it('treats rolNombre as optional in update mode', () => {
    const result = terapeutaUpdateSchema.safeParse({
      nombre: 'Ana',
      centroIds: [],
      // rolNombre omitted — allowed in update (unlike create)
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty rolNombre when explicitly provided (min(1) still applies)', () => {
    const result = terapeutaUpdateSchema.safeParse({
      nombre: 'Ana',
      centroIds: [],
      rolNombre: '',
    });
    expect(result.success).toBe(false);
  });
});

// ── Update schema — principal refine (shared logic, both branches) ─────────────

describe('terapeutaUpdateSchema — principal-in-centros refine', () => {
  it('rejects principal not in centroIds', () => {
    const result = terapeutaUpdateSchema.safeParse({
      nombre: 'Ana',
      centroIds: [1, 2],
      principalCentroId: 9,
    });
    expect(result.success).toBe(false);
  });

  it('accepts principal that is in centroIds', () => {
    const result = terapeutaUpdateSchema.safeParse({
      nombre: 'Ana',
      centroIds: [1, 2],
      principalCentroId: 2,
    });
    expect(result.success).toBe(true);
  });

  it('accepts null principal in update mode', () => {
    const result = terapeutaUpdateSchema.safeParse({
      nombre: 'Ana',
      centroIds: [1],
      principalCentroId: null,
    });
    expect(result.success).toBe(true);
  });
});
