import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';
import type { IServiciosRow, IServiciosCentroRow } from '@infra/adapters/database.types';
import { BusinessRuleViolation } from '@domain/types';

// ── Mock ───────────────────────────────────────────────────────────────────
const { mockSupabase, mockChain } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

const { SupabaseServicioAdapter } = await import('@infra/adapters/SupabaseServicioAdapter');

// ── Fixtures ───────────────────────────────────────────────────────────────
const servicioRow: IServiciosRow = {
  id: 1,
  nombre: 'Masaje Sueco 60min',
  descripcion: null,
  duracion: 60,
  precio: 65,
  descuento: 0,
  permite_bono: true,
  sesiones_totales: null,
  tipo_servicio: 1,
  estado: 'activo',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const servicioBono: IServiciosRow = {
  id: 2,
  nombre: 'Bono 10 Sesiones',
  descripcion: 'Paquete de 10 sesiones de masaje',
  duracion: 60,
  precio: 500,
  descuento: 20,
  permite_bono: true,
  sesiones_totales: 10,
  tipo_servicio: 2,
  estado: 'activo',
  created_at: '2024-02-01T00:00:00Z',
  updated_at: '2024-02-01T00:00:00Z',
};

const servicioCentroRow: IServiciosCentroRow = {
  id: 1,
  centro_id: 10,
  servicio_id: 1,
  created_at: '2024-01-01T00:00:00Z',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function resetMocks() {
  vi.clearAllMocks();
  const methods = [
    'select',
    'eq',
    'neq',
    'in',
    'or',
    'gte',
    'lte',
    'lt',
    'range',
    'order',
    'insert',
    'update',
    'delete',
    'upsert',
  ];
  for (const m of methods) {
    mockChain[m].mockReturnValue(mockChain);
  }
  mockSupabase.from.mockReturnValue(mockChain);
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('SupabaseServicioAdapter', () => {
  let adapter: InstanceType<typeof SupabaseServicioAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseServicioAdapter();
  });

  // ── findById ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('returns mapped IServicio when found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: servicioRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.nombre).toBe('Masaje Sueco 60min');
      expect(result!.duracionMinutos).toBe(60);
      expect(result!.precioBase).toBe(65);
      expect(result!.esBono).toBe(true);
      expect(result!.estado).toBe('activo');
    });

    it('maps null precio to 0', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: { ...servicioRow, precio: null },
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(result!.precioBase).toBe(0);
    });

    it('maps tieneDescuento correctly when descuento > 0', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: servicioBono,
        error: null,
        count: null,
      });

      const result = await adapter.findById(2);
      expect(result!.tieneDescuento).toBe(true);
      expect(result!.porcentajeDescuento).toBe(20);
    });

    it('maps tieneDescuento to false when descuento is 0', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: servicioRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(result!.tieneDescuento).toBe(false);
      expect(result!.porcentajeDescuento).toBe(0);
    });

    it('returns null when not found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: null,
        error: null,
        count: null,
      });

      const result = await adapter.findById(999);
      expect(result).toBeNull();
    });

    it('throws Error on DB error', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'db error' },
        count: null,
      });

      await expect(adapter.findById(1)).rejects.toThrow('db error');
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('returns paginated result', async () => {
      mockChain.range.mockResolvedValue({
        success: true,
        data: [servicioRow, servicioBono],
        error: null,
        count: 2,
      });

      const result = await adapter.findAll();

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(50);
    });

    it('throws Error on DB error', async () => {
      mockChain.range.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'timeout' },
        count: null,
      });

      await expect(adapter.findAll()).rejects.toThrow('timeout');
    });
  });

  // ── findByCentro ───────────────────────────────────────────────────────
  describe('findByCentro', () => {
    it('returns servicios available at a centro', async () => {
      mockChain.eq.mockResolvedValue({
        success: true,
        data: [{ servicios: servicioRow }],
        error: null,
        count: null,
      });

      const result = await adapter.findByCentro(10);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('filters out null servicio entries from join', async () => {
      mockChain.eq.mockResolvedValue({
        success: true,
        data: [{ servicios: null }],
        error: null,
        count: null,
      });

      const result = await adapter.findByCentro(10);
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.eq.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'join error' },
        count: null,
      });

      await expect(adapter.findByCentro(10)).rejects.toThrow('join error');
    });
  });

  // ── findActivos ────────────────────────────────────────────────────────
  describe('findActivos', () => {
    it('returns only servicios with estado = activo', async () => {
      mockChain.setResolution({
        success: true,
        data: [servicioRow],
        error: null,
        count: null,
      });

      const result = await adapter.findActivos();
      expect(result).toHaveLength(1);
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'error' },
        count: null,
      });

      await expect(adapter.findActivos()).rejects.toThrow('error');
    });
  });

  // ── findBonos ─────────────────────────────────────────────────────────
  describe('findBonos', () => {
    it('returns servicios with permite_bono=true and estado=activo', async () => {
      mockChain.setResolution({
        success: true,
        data: [servicioBono],
        error: null,
        count: null,
      });

      const result = await adapter.findBonos();
      expect(result).toHaveLength(1);
      expect(result[0].esBono).toBe(true);
      expect(result[0].sesionesTotales).toBe(10);
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'bono error' },
        count: null,
      });

      await expect(adapter.findBonos()).rejects.toThrow('bono error');
    });
  });

  // ── create ─────────────────────────────────────────────────────────────
  describe('create', () => {
    it('returns mapped IServicio from inserted row', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: servicioRow,
        error: null,
        count: null,
      });

      const result = await adapter.create({
        nombre: 'Masaje Sueco 60min',
        duracionMinutos: 60,
        tipoServicioId: 1,
        precioBase: 65,
      });

      expect(result.nombre).toBe('Masaje Sueco 60min');
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'insert error' },
        count: null,
      });

      await expect(
        adapter.create({ nombre: 'X', duracionMinutos: 30, tipoServicioId: 1, precioBase: 0 }),
      ).rejects.toThrow('insert error');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────
  describe('update', () => {
    it('returns updated IServicio', async () => {
      const updatedRow = { ...servicioRow, nombre: 'Masaje Actualizado' };
      mockChain.single.mockResolvedValue({
        success: true,
        data: updatedRow,
        error: null,
        count: null,
      });

      const result = await adapter.update(1, { nombre: 'Masaje Actualizado' });
      expect(result.nombre).toBe('Masaje Actualizado');
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'update error' },
        count: null,
      });

      await expect(adapter.update(1, { nombre: 'X' })).rejects.toThrow('update error');
    });
  });

  // ── assignToCentro ─────────────────────────────────────────────────────
  describe('assignToCentro', () => {
    it('returns IServicioCentro on successful assignment', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: servicioCentroRow,
        error: null,
        count: null,
      });

      const result = await adapter.assignToCentro({
        servicioId: 1,
        centroId: 10,
        precioPersonalizado: null,
        activo: true,
      });

      expect(result.servicioId).toBe(1);
      expect(result.centroId).toBe(10);
      expect(result.precioPersonalizado).toBeNull();
      expect(result.activo).toBe(true);
    });

    it('throws BusinessRuleViolation when servicio already assigned', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { code: '23505', message: 'duplicate' },
        count: null,
      });

      const dto = { servicioId: 1, centroId: 10, precioPersonalizado: null, activo: true };
      await expect(adapter.assignToCentro(dto)).rejects.toThrow(BusinessRuleViolation);
      await expect(adapter.assignToCentro(dto)).rejects.toMatchObject({
        code: 'SERVICIO_ALREADY_ASSIGNED',
      });
    });

    it('throws generic Error on non-duplicate DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { code: '42000', message: 'syntax error' },
        count: null,
      });

      await expect(
        adapter.assignToCentro({
          servicioId: 1,
          centroId: 10,
          precioPersonalizado: null,
          activo: true,
        }),
      ).rejects.toThrow('syntax error');
    });
  });

  // ── removeFromCentro ───────────────────────────────────────────────────
  // This method chains .delete().eq().eq() where the whole expression is awaited.
  // The chain object itself must be thenable — use setResolution() helper.
  describe('removeFromCentro', () => {
    it('resolves without error on success', async () => {
      mockChain.setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      await expect(adapter.removeFromCentro(1, 10)).resolves.toBeUndefined();
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'delete error' },
      });

      await expect(adapter.removeFromCentro(1, 10)).rejects.toThrow('delete error');
    });
  });

  // ── findServicioCentro ─────────────────────────────────────────────────
  describe('findServicioCentro', () => {
    it('returns IServicioCentro when found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: servicioCentroRow,
        error: null,
        count: null,
      });

      const result = await adapter.findServicioCentro(1, 10);

      expect(result).not.toBeNull();
      expect(result!.servicioId).toBe(1);
      expect(result!.centroId).toBe(10);
    });

    it('returns null when not found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: null,
        error: null,
        count: null,
      });

      const result = await adapter.findServicioCentro(1, 99);
      expect(result).toBeNull();
    });

    it('throws Error on DB error', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'lookup error' },
        count: null,
      });

      await expect(adapter.findServicioCentro(1, 10)).rejects.toThrow('lookup error');
    });
  });
});
