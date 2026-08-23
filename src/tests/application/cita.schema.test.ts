/**
 * cita.schema.test.ts
 *
 * The create schema blocks past-dated citas (same-day allowed for walk-in
 * logging); the edit schema does NOT (a past cita must stay editable).
 */

import { describe, it, expect } from 'vitest';
import { citaCreateSchema, citaEditSchema } from '@app/schemas/cita.schema';

function localTodayStr(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

const base = {
  centroId: 5,
  clienteId: 1,
  servicioId: 2,
  usuarioId: 3,
  salaId: 4,
  horaInicio: '10:00',
} as const;

describe('citaCreateSchema — centro requirement', () => {
  it('rejects a create payload without a centroId', () => {
    const { centroId: _omit, ...noCentro } = base;
    const result = citaCreateSchema.safeParse({ ...noCentro, fecha: '2999-12-31' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('centroId'))).toBe(true);
    }
  });

  it('ignores centroId on the edit schema (centro is read-only when editing)', () => {
    const { centroId: _omit, ...noCentro } = base;
    const result = citaEditSchema.safeParse({ ...noCentro, fecha: '2000-01-01' });
    expect(result.success).toBe(true);
  });
});

describe('citaCreateSchema — past-date guard', () => {
  it('rejects a cita whose date is in the past', () => {
    const result = citaCreateSchema.safeParse({ ...base, fecha: '2000-01-01' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/pasad/i);
      expect(result.error.issues[0]?.path).toContain('fecha');
    }
  });

  it('accepts a cita scheduled for today (same-day walk-in logging)', () => {
    const result = citaCreateSchema.safeParse({ ...base, fecha: localTodayStr() });
    expect(result.success).toBe(true);
  });

  it('accepts a cita scheduled for a future date', () => {
    const result = citaCreateSchema.safeParse({ ...base, fecha: '2999-12-31' });
    expect(result.success).toBe(true);
  });
});

describe('citaEditSchema — no past-date guard', () => {
  it('accepts a past date on edit (past citas remain editable)', () => {
    const result = citaEditSchema.safeParse({ ...base, fecha: '2000-01-01' });
    expect(result.success).toBe(true);
  });
});
