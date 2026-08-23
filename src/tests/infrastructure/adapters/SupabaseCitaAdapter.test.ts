import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';
import type { ICitasRow } from '@infra/adapters/database.types';

// ── Mock ───────────────────────────────────────────────────────────────────
const { mockSupabase, mockChain } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

const { SupabaseCitaAdapter } = await import('@infra/adapters/SupabaseCitaAdapter');

// ── Fixtures ───────────────────────────────────────────────────────────────
const citaRow: ICitasRow = {
  id: 1,
  usuario_id: 5,
  centro_id: 10,
  sala_id: 2,
  servicio_id: 3,
  cliente_id: 7,
  fecha_inicio: '2024-06-15T10:00:00.000Z',
  fecha_fin: '2024-06-15T11:00:00.000Z',
  estado: 'pendiente',
  observaciones: 'Alergia al aceite de almendras',
  created_at: '2024-06-01T00:00:00Z',
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
describe('SupabaseCitaAdapter', () => {
  let adapter: InstanceType<typeof SupabaseCitaAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseCitaAdapter();
  });

  // ── findById ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('returns mapped ICita when found', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: citaRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.usuarioId).toBe(5);
      expect(result!.centroId).toBe(10);
      expect(result!.salaId).toBe(2);
      expect(result!.servicioId).toBe(3);
      expect(result!.clienteId).toBe(7);
      expect(result!.estado).toBe('pendiente');
      expect(result!.notas).toBe('Alergia al aceite de almendras');
    });

    it('maps fechaHoraInicio and fechaHoraFin as Date objects', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: citaRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(result!.fechaHoraInicio).toBeInstanceOf(Date);
      expect(result!.fechaHoraFin).toBeInstanceOf(Date);
      expect(result!.fechaHoraInicio).toEqual(new Date('2024-06-15T10:00:00.000Z'));
    });

    it('maps precioFinal to 0 (not stored in DB)', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: citaRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(result!.precioFinal).toBe(0);
    });

    it('defaults estado to sin_asignar when null in DB', async () => {
      const rowWithNullEstado = { ...citaRow, estado: null };
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: rowWithNullEstado,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(result!.estado).toBe('sin_asignar');
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
        error: { message: 'cita not found' },
        count: null,
      });

      await expect(adapter.findById(1)).rejects.toThrow('cita not found');
    });
  });

  // ── findByCentroAndFecha ───────────────────────────────────────────────
  describe('findByCentroAndFecha', () => {
    it('returns citas for a centro on a given date', async () => {
      mockChain.lt.mockResolvedValue({ success: true, data: [citaRow], error: null, count: null });

      const fecha = new Date('2024-06-15T12:00:00Z');
      const result = await adapter.findByCentroAndFecha(10, fecha);

      expect(result).toHaveLength(1);
      expect(result[0].centroId).toBe(10);
    });

    it('applies gte and lt constraints for the day range', async () => {
      mockChain.lt.mockResolvedValue({ success: true, data: [], error: null, count: null });

      const fecha = new Date('2024-06-15T00:00:00Z');
      await adapter.findByCentroAndFecha(10, fecha);

      // Verify gte and lt are called with 'fecha_inicio' and ISO strings
      // The adapter zeroes local hours, so exact ISO value is timezone-dependent.
      // We assert on field name and that the lt boundary is 1 day after the gte boundary.
      const gteCall = mockChain.gte.mock.calls[0];
      const ltCall = mockChain.lt.mock.calls[0];

      expect(gteCall[0]).toBe('fecha_inicio');
      expect(ltCall[0]).toBe('fecha_inicio');

      // lt timestamp must be exactly 24 hours after gte timestamp
      const gteTime = new Date(gteCall[1]).getTime();
      const ltTime = new Date(ltCall[1]).getTime();
      expect(ltTime - gteTime).toBe(24 * 60 * 60 * 1000);
    });

    it('returns empty array when no citas on that day', async () => {
      mockChain.lt.mockResolvedValue({ success: true, data: [], error: null, count: null });

      const result = await adapter.findByCentroAndFecha(10, new Date('2024-12-25T00:00:00Z'));
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.lt.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'date range error' },
        count: null,
      });

      await expect(adapter.findByCentroAndFecha(10, new Date())).rejects.toThrow(
        'date range error',
      );
    });
  });

  // ── findByCliente ──────────────────────────────────────────────────────
  describe('findByCliente', () => {
    it('returns paginated citas for a cliente', async () => {
      mockChain.range.mockResolvedValue({ success: true, data: [citaRow], error: null, count: 1 });

      const result = await adapter.findByCliente(7);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].clienteId).toBe(7);
      expect(result.total).toBe(1);
    });

    it('respects pagination params', async () => {
      mockChain.range.mockResolvedValue({ success: true, data: [citaRow], error: null, count: 25 });

      const result = await adapter.findByCliente(7, { page: 2, perPage: 10 });
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('throws Error on DB error', async () => {
      mockChain.range.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'client error' },
        count: null,
      });

      await expect(adapter.findByCliente(7)).rejects.toThrow('client error');
    });
  });

  // ── findByUsuario ──────────────────────────────────────────────────────
  describe('findByUsuario', () => {
    it('returns citas for a usuario in date range', async () => {
      mockChain.lte.mockResolvedValue({ success: true, data: [citaRow], error: null, count: null });

      const range = { from: new Date('2024-06-01'), to: new Date('2024-06-30') };
      const result = await adapter.findByUsuario(5, range);

      expect(result).toHaveLength(1);
      expect(result[0].usuarioId).toBe(5);
    });

    it('applies gte and lte date range filter', async () => {
      mockChain.lte.mockResolvedValue({ success: true, data: [], error: null, count: null });

      const from = new Date('2024-06-01T00:00:00Z');
      const to = new Date('2024-06-30T23:59:59Z');
      await adapter.findByUsuario(5, { from, to });

      expect(mockChain.gte).toHaveBeenCalledWith('fecha_inicio', from.toISOString());
      expect(mockChain.lte).toHaveBeenCalledWith('fecha_inicio', to.toISOString());
    });

    it('throws Error on DB error', async () => {
      mockChain.lte.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'range error' },
        count: null,
      });

      await expect(adapter.findByUsuario(5, { from: new Date(), to: new Date() })).rejects.toThrow(
        'range error',
      );
    });
  });

  // ── findBySala ─────────────────────────────────────────────────────────
  describe('findBySala', () => {
    it('returns citas for a sala on a given date', async () => {
      mockChain.lt.mockResolvedValue({ success: true, data: [citaRow], error: null, count: null });

      const result = await adapter.findBySala(2, new Date('2024-06-15T00:00:00Z'));
      expect(result).toHaveLength(1);
      expect(result[0].salaId).toBe(2);
    });

    it('throws Error on DB error', async () => {
      mockChain.lt.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'sala error' },
        count: null,
      });

      await expect(adapter.findBySala(2, new Date())).rejects.toThrow('sala error');
    });
  });

  // ── findByEstado ───────────────────────────────────────────────────────
  describe('findByEstado', () => {
    it('returns citas with the given estado (no centroId filter)', async () => {
      // Without centroId: `await query` resolves via the first .eq() call
      mockChain.eq.mockResolvedValue({ success: true, data: [citaRow], error: null, count: null });

      const result = await adapter.findByEstado('pendiente');
      expect(result).toHaveLength(1);
      expect(result[0].estado).toBe('pendiente');
    });

    it('applies additional centroId filter when provided', async () => {
      // With centroId: chain is .eq(estado).eq(centroId) — the whole chain is awaited.
      // Use setResolution so `await mockChain` returns the expected value.
      mockChain.setResolution({
        success: true,
        data: [citaRow],
        error: null,
        count: null,
      });

      const result = await adapter.findByEstado('confirmada', 10);

      expect(result).toHaveLength(1);
      expect(mockChain.eq).toHaveBeenCalledWith('estado', 'confirmada');
      expect(mockChain.eq).toHaveBeenCalledWith('centro_id', 10);
    });

    it('throws Error on DB error', async () => {
      mockChain.eq.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'estado error' },
        count: null,
      });

      await expect(adapter.findByEstado('pendiente')).rejects.toThrow('estado error');
    });
  });

  // ── create ─────────────────────────────────────────────────────────────
  describe('create', () => {
    it('returns mapped ICita from inserted row', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: citaRow,
        error: null,
        count: null,
      });

      const result = await adapter.create({
        usuarioId: 5,
        centroId: 10,
        salaId: 2,
        servicioId: 3,
        clienteId: 7,
        fechaHoraInicio: new Date('2024-06-15T10:00:00Z'),
        fechaHoraFin: new Date('2024-06-15T11:00:00Z'),
        precioFinal: 6000,
        notas: 'Alergia al aceite de almendras',
      });

      expect(result.id).toBe(1);
      expect(result.estado).toBe('pendiente');
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'insert failed' },
        count: null,
      });

      await expect(
        adapter.create({
          usuarioId: 5,
          centroId: 10,
          salaId: 2,
          servicioId: 3,
          clienteId: 7,
          fechaHoraInicio: new Date(),
          fechaHoraFin: new Date(),
          precioFinal: 6000,
        }),
      ).rejects.toThrow('insert failed');
    });
  });

  // ── updateEstado ───────────────────────────────────────────────────────
  describe('updateEstado', () => {
    it('returns updated ICita with new estado', async () => {
      const updatedRow = { ...citaRow, estado: 'confirmada' };
      mockChain.single.mockResolvedValue({
        success: true,
        data: updatedRow,
        error: null,
        count: null,
      });

      const result = await adapter.updateEstado({ id: 1, estado: 'confirmada' });
      expect(result.estado).toBe('confirmada');
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'update error' },
        count: null,
      });

      await expect(adapter.updateEstado({ id: 1, estado: 'cancelada' })).rejects.toThrow(
        'update error',
      );
    });
  });

  // ── cancel ─────────────────────────────────────────────────────────────
  describe('cancel', () => {
    it('resolves without error on success', async () => {
      mockChain.eq.mockResolvedValue({ success: true, data: [], error: null, count: null });

      await expect(adapter.cancel(1, 'No puede asistir')).resolves.toBeUndefined();
    });

    it('resolves without error when no motivo provided', async () => {
      mockChain.eq.mockResolvedValue({ success: true, data: [], error: null, count: null });

      await expect(adapter.cancel(1)).resolves.toBeUndefined();
    });

    it('throws Error on DB error', async () => {
      mockChain.eq.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'cancel error' },
        count: null,
      });

      await expect(adapter.cancel(1)).rejects.toThrow('cancel error');
    });
  });
});
