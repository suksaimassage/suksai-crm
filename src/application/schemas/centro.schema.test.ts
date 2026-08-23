/**
 * centro.schema.test.ts
 *
 * Unit tests for centroCreateSchema and centroUpdateSchema.
 * Pure Zod validation — no mocks required.
 */

import { describe, it, expect } from 'vitest';
import { centroCreateSchema, centroUpdateSchema } from './centro.schema';

// ── centroCreateSchema ────────────────────────────────────────────────────────

describe('centroCreateSchema — nombre', () => {
  it('accepts a non-empty nombre', () => {
    const result = centroCreateSchema.safeParse({ nombre: 'Centro Ibiza', ciudad: 'Ibiza' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty nombre', () => {
    const result = centroCreateSchema.safeParse({ nombre: '', ciudad: 'Madrid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre es obligatorio');
    }
  });

  it('rejects when nombre is missing', () => {
    const result = centroCreateSchema.safeParse({ ciudad: 'Madrid' });
    expect(result.success).toBe(false);
  });
});

describe('centroCreateSchema — ciudad', () => {
  it('accepts a non-empty ciudad', () => {
    const result = centroCreateSchema.safeParse({ nombre: 'Centro', ciudad: 'Barcelona' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty ciudad', () => {
    const result = centroCreateSchema.safeParse({ nombre: 'Centro', ciudad: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La ciudad es obligatoria');
    }
  });

  it('rejects when ciudad is missing', () => {
    const result = centroCreateSchema.safeParse({ nombre: 'Centro' });
    expect(result.success).toBe(false);
  });
});

describe('centroCreateSchema — email', () => {
  it('accepts a valid email address', () => {
    const result = centroCreateSchema.safeParse({
      nombre: 'Centro',
      ciudad: 'Madrid',
      email: 'info@centro.com',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('info@centro.com');
  });

  it('accepts an empty string for email', () => {
    const result = centroCreateSchema.safeParse({
      nombre: 'Centro',
      ciudad: 'Madrid',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts when email is omitted', () => {
    const result = centroCreateSchema.safeParse({ nombre: 'Centro', ciudad: 'Madrid' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email format', () => {
    const result = centroCreateSchema.safeParse({
      nombre: 'Centro',
      ciudad: 'Madrid',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Introduce un correo válido');
    }
  });

  it('rejects email with missing domain', () => {
    const result = centroCreateSchema.safeParse({
      nombre: 'Centro',
      ciudad: 'Madrid',
      email: 'noemail@',
    });
    expect(result.success).toBe(false);
  });
});

describe('centroCreateSchema — optional string fields', () => {
  it('accepts direccion as empty string', () => {
    const result = centroCreateSchema.safeParse({
      nombre: 'Centro',
      ciudad: 'Madrid',
      direccion: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts direccion when omitted', () => {
    const result = centroCreateSchema.safeParse({ nombre: 'Centro', ciudad: 'Madrid' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.direccion).toBeUndefined();
  });

  it('accepts codigoPostal as empty string', () => {
    const result = centroCreateSchema.safeParse({
      nombre: 'Centro',
      ciudad: 'Madrid',
      codigoPostal: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts codigoPostal as non-empty string', () => {
    const result = centroCreateSchema.safeParse({
      nombre: 'Centro',
      ciudad: 'Madrid',
      codigoPostal: '28001',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.codigoPostal).toBe('28001');
  });

  it('accepts telefono as empty string', () => {
    const result = centroCreateSchema.safeParse({
      nombre: 'Centro',
      ciudad: 'Madrid',
      telefono: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts telefono when omitted', () => {
    const result = centroCreateSchema.safeParse({ nombre: 'Centro', ciudad: 'Madrid' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.telefono).toBeUndefined();
  });
});

describe('centroCreateSchema — full valid payload', () => {
  it('accepts a complete valid payload', () => {
    const result = centroCreateSchema.safeParse({
      nombre: 'Suksai Madrid',
      direccion: 'Calle Mayor 1',
      ciudad: 'Madrid',
      codigoPostal: '28001',
      telefono: '+34 910 000 000',
      email: 'madrid@suksai.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Suksai Madrid');
      expect(result.data.ciudad).toBe('Madrid');
    }
  });
});

// ── centroUpdateSchema ────────────────────────────────────────────────────────

describe('centroUpdateSchema — nombre required even in update', () => {
  it('rejects empty nombre in update', () => {
    const result = centroUpdateSchema.safeParse({ nombre: '', ciudad: 'Madrid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre es obligatorio');
    }
  });

  it('accepts non-empty nombre in update', () => {
    const result = centroUpdateSchema.safeParse({ nombre: 'New Name', ciudad: 'Madrid' });
    expect(result.success).toBe(true);
  });
});

describe('centroUpdateSchema — activo field', () => {
  it('accepts activo: true', () => {
    const result = centroUpdateSchema.safeParse({
      nombre: 'Centro',
      ciudad: 'Madrid',
      activo: true,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.activo).toBe(true);
  });

  it('accepts activo: false', () => {
    const result = centroUpdateSchema.safeParse({
      nombre: 'Centro',
      ciudad: 'Madrid',
      activo: false,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.activo).toBe(false);
  });

  it('accepts update without activo field', () => {
    const result = centroUpdateSchema.safeParse({ nombre: 'Centro', ciudad: 'Madrid' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.activo).toBeUndefined();
  });

  it('rejects non-boolean activo', () => {
    const result = centroUpdateSchema.safeParse({
      nombre: 'Centro',
      ciudad: 'Madrid',

      activo: 'yes' as any,
    });
    expect(result.success).toBe(false);
  });
});

describe('centroUpdateSchema — partial fields from createSchema', () => {
  it('ciudad is optional in update (inherited partial)', () => {
    // centroUpdateSchema = centroCreateSchema.partial().extend({ nombre, activo })
    // ciudad comes from the partial — so it is optional in update
    const result = centroUpdateSchema.safeParse({ nombre: 'Centro' });
    expect(result.success).toBe(true);
  });
});
