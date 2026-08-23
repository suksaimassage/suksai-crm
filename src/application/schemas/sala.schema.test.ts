/**
 * sala.schema.test.ts
 *
 * Unit tests for salaCreateSchema and salaUpdateSchema.
 * Pure Zod validation — no mocks required.
 */

import { describe, it, expect } from 'vitest';
import { salaCreateSchema, salaUpdateSchema } from './sala.schema';

// ── salaCreateSchema — nombre ─────────────────────────────────────────────────

describe('salaCreateSchema — nombre', () => {
  it('accepts a non-empty nombre', () => {
    const result = salaCreateSchema.safeParse({ nombre: 'Lotus Room', capacidad: 1 });
    expect(result.success).toBe(true);
  });

  it('rejects an empty nombre', () => {
    const result = salaCreateSchema.safeParse({ nombre: '', capacidad: 1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre es obligatorio');
    }
  });

  it('rejects when nombre is missing', () => {
    const result = salaCreateSchema.safeParse({ capacidad: 1 });
    expect(result.success).toBe(false);
  });
});

// ── salaCreateSchema — capacidad ──────────────────────────────────────────────

describe('salaCreateSchema — capacidad', () => {
  it('accepts capacidad of 1', () => {
    const result = salaCreateSchema.safeParse({ nombre: 'Room', capacidad: 1 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.capacidad).toBe(1);
  });

  it('accepts capacidad greater than 1', () => {
    const result = salaCreateSchema.safeParse({ nombre: 'Room', capacidad: 5 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.capacidad).toBe(5);
  });

  it('rejects capacidad of 0', () => {
    const result = salaCreateSchema.safeParse({ nombre: 'Room', capacidad: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La capacidad mínima es 1');
    }
  });

  it('rejects negative capacidad', () => {
    const result = salaCreateSchema.safeParse({ nombre: 'Room', capacidad: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La capacidad mínima es 1');
    }
  });

  it('coerces a numeric string to number', () => {
    // capacidad uses z.coerce.number() — string "2" should parse to 2
    const result = salaCreateSchema.safeParse({ nombre: 'Room', capacidad: '2' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.capacidad).toBe(2);
  });

  it('coerces string "0" and rejects it (below min 1)', () => {
    const result = salaCreateSchema.safeParse({ nombre: 'Room', capacidad: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric string', () => {
    const result = salaCreateSchema.safeParse({ nombre: 'Room', capacidad: 'abc' });
    expect(result.success).toBe(false);
  });
});

// ── salaCreateSchema — descripcion ────────────────────────────────────────────

describe('salaCreateSchema — descripcion', () => {
  it('accepts descripcion as a non-empty string', () => {
    const result = salaCreateSchema.safeParse({
      nombre: 'Room',
      capacidad: 1,
      descripcion: 'Main treatment room',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.descripcion).toBe('Main treatment room');
  });

  it('accepts descripcion as empty string', () => {
    const result = salaCreateSchema.safeParse({
      nombre: 'Room',
      capacidad: 1,
      descripcion: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts when descripcion is omitted', () => {
    const result = salaCreateSchema.safeParse({ nombre: 'Room', capacidad: 1 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.descripcion).toBeUndefined();
  });
});

// ── salaCreateSchema — full valid payload ─────────────────────────────────────

describe('salaCreateSchema — full valid payload', () => {
  it('parses a complete payload correctly', () => {
    const result = salaCreateSchema.safeParse({
      nombre: 'Lotus Room',
      capacidad: 3,
      descripcion: 'Quiet room with essential oils',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Lotus Room');
      expect(result.data.capacidad).toBe(3);
      expect(result.data.descripcion).toBe('Quiet room with essential oils');
    }
  });
});

// ── salaUpdateSchema — nombre required even in update ────────────────────────

describe('salaUpdateSchema — nombre', () => {
  it('rejects empty nombre in update', () => {
    const result = salaUpdateSchema.safeParse({ nombre: '', capacidad: 2 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre es obligatorio');
    }
  });

  it('accepts non-empty nombre in update', () => {
    const result = salaUpdateSchema.safeParse({ nombre: 'Updated Room', capacidad: 2 });
    expect(result.success).toBe(true);
  });
});

// ── salaUpdateSchema — activa field ───────────────────────────────────────────

describe('salaUpdateSchema — activa', () => {
  it('accepts activa: true', () => {
    const result = salaUpdateSchema.safeParse({ nombre: 'Room', activa: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.activa).toBe(true);
  });

  it('accepts activa: false', () => {
    const result = salaUpdateSchema.safeParse({ nombre: 'Room', activa: false });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.activa).toBe(false);
  });

  it('accepts update without activa field', () => {
    const result = salaUpdateSchema.safeParse({ nombre: 'Room' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.activa).toBeUndefined();
  });

  it('rejects non-boolean activa', () => {
    const result = salaUpdateSchema.safeParse({ nombre: 'Room', activa: 'true' as any });
    expect(result.success).toBe(false);
  });
});

describe('salaUpdateSchema — capacidad optional in update', () => {
  it('accepts update without capacidad (partial inheritance)', () => {
    const result = salaUpdateSchema.safeParse({ nombre: 'Room' });
    expect(result.success).toBe(true);
  });

  it('rejects capacidad 0 when provided in update', () => {
    const result = salaUpdateSchema.safeParse({ nombre: 'Room', capacidad: 0 });
    expect(result.success).toBe(false);
  });

  it('coerces capacidad string in update', () => {
    const result = salaUpdateSchema.safeParse({ nombre: 'Room', capacidad: '4' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.capacidad).toBe(4);
  });
});
