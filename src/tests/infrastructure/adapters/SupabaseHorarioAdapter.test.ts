import { vi, describe, it, expect, beforeEach } from 'vitest';
import { buildSupabaseMock } from './supabase.mock';
import type { IHorariosTrabajoRow } from '@infra/adapters/database.types';

// ── Mock ───────────────────────────────────────────────────────────────────
const { mockSupabase, mockChain } = buildSupabaseMock();

vi.mock('@infra/adapters/supabase.client', () => ({
  supabase: mockSupabase,
}));

const { SupabaseHorarioAdapter } = await import('@infra/adapters/SupabaseHorarioAdapter');

// ── Fixtures ───────────────────────────────────────────────────────────────
const horarioFijoRow: IHorariosTrabajoRow = {
  id: 1,
  usuario_id: 5,
  tipo: 'recurrente',
  dia_semana: 1,
  fecha: null,
  hora_inicio: '09:00:00',
  hora_fin: '17:00:00',
  centro_id: 20,
  activo: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const horarioEspecificoRow: IHorariosTrabajoRow = {
  id: 2,
  usuario_id: 5,
  tipo: 'especifico',
  dia_semana: null,
  fecha: '2024-06-15',
  hora_inicio: '10:00:00',
  hora_fin: '14:00:00',
  centro_id: 20,
  activo: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
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
describe('SupabaseHorarioAdapter', () => {
  let adapter: InstanceType<typeof SupabaseHorarioAdapter>;

  beforeEach(() => {
    resetMocks();
    adapter = new SupabaseHorarioAdapter();
  });

  // ── findById ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('returns mapped IHorarioTrabajo for recurrente type', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: horarioFijoRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.usuarioId).toBe(5);
      expect(result!.tipo).toBe('recurrente');
      expect(result!.diaSemana).toBe(1);
      expect(result!.fecha).toBeNull();
      expect(result!.activo).toBe(true);
    });

    it('slices hora_inicio and hora_fin to HH:mm format', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: horarioFijoRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(result!.horaInicio).toBe('09:00');
      expect(result!.horaFin).toBe('17:00');
    });

    it('maps fecha for especifico type', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: horarioEspecificoRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(2);

      expect(result!.tipo).toBe('especifico');
      expect(result!.diaSemana).toBeNull();
      expect(result!.fecha).toBeInstanceOf(Date);
    });

    it('maps null usuario_id as 0', async () => {
      const rowWithNullUser = { ...horarioFijoRow, usuario_id: null };
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: rowWithNullUser,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(result!.usuarioId).toBe(0);
    });

    it('maps centroId from centro_id column', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        success: true,
        data: horarioFijoRow,
        error: null,
        count: null,
      });

      const result = await adapter.findById(1);
      expect(result!.centroId).toBe(20);
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
        error: { message: 'horario not found' },
        count: null,
      });

      await expect(adapter.findById(1)).rejects.toThrow('horario not found');
    });
  });

  // ── findByUsuario ──────────────────────────────────────────────────────
  describe('findByUsuario', () => {
    it('returns horarios for a given usuario', async () => {
      // Adapter chains .eq('usuario_id', ...).eq('activo', true) — use setResolution
      mockChain.setResolution({
        success: true,
        data: [horarioFijoRow, horarioEspecificoRow],
        error: null,
        count: null,
      });

      const result = await adapter.findByUsuario(5);

      expect(result).toHaveLength(2);
      expect(result[0].usuarioId).toBe(5);
    });

    it('returns empty array when no horarios', async () => {
      mockChain.setResolution({ success: true, data: [], error: null, count: null });

      const result = await adapter.findByUsuario(5);
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'query error' },
        count: null,
      });

      await expect(adapter.findByUsuario(5)).rejects.toThrow('query error');
    });
  });

  // ── findByUsuarioAndCentro ─────────────────────────────────────────────
  describe('findByUsuarioAndCentro', () => {
    it('filters by both usuario_id and centro_id', async () => {
      // The adapter chains .eq('usuario_id', ...).eq('centro_id', ...) — the last
      // .eq call is the one that resolves when awaited via the chain's then().
      mockChain.setResolution({
        success: true,
        data: [horarioFijoRow],
        error: null,
        count: null,
      });

      const result = await adapter.findByUsuarioAndCentro(5, 20);

      expect(result).toHaveLength(1);
      expect(result[0].centroId).toBe(20);
      expect(mockChain.eq).toHaveBeenCalledWith('usuario_id', 5);
      expect(mockChain.eq).toHaveBeenCalledWith('centro_id', 20);
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'fetch error' },
        count: null,
      });

      await expect(adapter.findByUsuarioAndCentro(5, 10)).rejects.toThrow('fetch error');
    });
  });

  // ── findByCentro ───────────────────────────────────────────────────────
  describe('findByCentro', () => {
    it('returns all active horarios for the centre (both tipos) in one query', async () => {
      mockChain.setResolution({
        success: true,
        data: [horarioFijoRow, horarioEspecificoRow],
        error: null,
        count: null,
      });

      const result = await adapter.findByCentro(20);

      expect(result).toHaveLength(2);
      // Filters by centre + active only (avoids N+1 per-therapist reads).
      expect(mockChain.eq).toHaveBeenCalledWith('centro_id', 20);
      expect(mockChain.eq).toHaveBeenCalledWith('activo', true);
      expect(result[0].tipo).toBe('recurrente');
      expect(result[1].tipo).toBe('especifico');
    });

    it('returns an empty array when the centre has no active horarios', async () => {
      mockChain.setResolution({ success: true, data: [], error: null, count: null });

      const result = await adapter.findByCentro(20);
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      mockChain.setResolution({
        success: false,
        data: null,
        error: { message: 'centre query failed' },
        count: null,
      });

      await expect(adapter.findByCentro(20)).rejects.toThrow('centre query failed');
    });
  });

  // ── findActivosByFecha ─────────────────────────────────────────────────
  describe('findActivosByFecha', () => {
    it('combines specific-date and recurrente-weekly results', async () => {
      // Both parallel queries share the same mock chain — each resolves to [horarioFijoRow]
      (mockChain as unknown as { setResolution: (v: unknown) => void }).setResolution({
        success: true,
        data: [horarioFijoRow],
        error: null,
        count: null,
      });

      const fecha = new Date('2024-06-17T10:00:00Z'); // Monday → dayOfWeek=1
      const result = await adapter.findActivosByFecha(10, fecha);

      // Both queries return [horarioFijoRow] → combined = 2 rows
      expect(result).toHaveLength(2);
      expect(result[0].tipo).toBe('recurrente');
    });

    it('returns empty array when no horarios match', async () => {
      (mockChain as unknown as { setResolution: (v: unknown) => void }).setResolution({
        success: true,
        data: [],
        error: null,
        count: null,
      });

      const result = await adapter.findActivosByFecha(10, new Date('2024-12-25T00:00:00Z'));
      expect(result).toHaveLength(0);
    });

    it('throws Error on DB error', async () => {
      (mockChain as unknown as { setResolution: (v: unknown) => void }).setResolution({
        success: false,
        data: null,
        error: { message: 'date query failed' },
        count: null,
      });

      await expect(adapter.findActivosByFecha(10, new Date())).rejects.toThrow('date query failed');
    });
  });

  // ── create ─────────────────────────────────────────────────────────────
  describe('create', () => {
    it('returns mapped IHorarioTrabajo from inserted row', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: horarioFijoRow,
        error: null,
        count: null,
      });

      const result = await adapter.create({
        usuarioId: 5,
        centroId: 20,
        tipo: 'recurrente',
        diaSemana: 1,
        horaInicio: '09:00',
        horaFin: '17:00',
      });

      expect(result.id).toBe(1);
      expect(result.tipo).toBe('recurrente');
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'insert error' },
        count: null,
      });

      await expect(
        adapter.create({
          usuarioId: 5,
          centroId: 20,
          tipo: 'recurrente',
          horaInicio: '09:00',
          horaFin: '17:00',
        }),
      ).rejects.toThrow('insert error');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────
  describe('update', () => {
    it('returns updated IHorarioTrabajo', async () => {
      const updatedRow = { ...horarioFijoRow, hora_inicio: '08:00:00' };
      mockChain.single.mockResolvedValue({
        success: true,
        data: updatedRow,
        error: null,
        count: null,
      });

      const result = await adapter.update(1, { horaInicio: '08:00' });
      expect(result.horaInicio).toBe('08:00');
    });

    it('throws Error on DB error', async () => {
      mockChain.single.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'update failed' },
        count: null,
      });

      await expect(adapter.update(1, { horaInicio: '08:00' })).rejects.toThrow('update failed');
    });

    // ── Reassignment persistence (Latent Defect #2) ──────────────────────────
    // A Day-view drag that moves a shift to another therapist sends `usuarioId`
    // in the update payload. The adapter MUST map it to the `usuario_id` column,
    // otherwise the reassignment is silently dropped and the card jumps back
    // after the next refetch.
    it('maps usuarioId → usuario_id in the patch (reassignment persists)', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: { ...horarioEspecificoRow, usuario_id: 7 },
        error: null,
        count: null,
      });

      await adapter.update(2, {
        usuarioId: 7,
        tipo: 'especifico',
        fecha: new Date('2024-06-20T00:00:00Z'),
        horaInicio: '11:00',
        horaFin: '15:00',
        centroId: 20,
      });

      expect(mockChain.update).toHaveBeenCalledTimes(1);
      const patch = mockChain.update.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(patch.usuario_id).toBe(7);
      // The rest of the reassignment payload is mapped to snake_case columns too.
      expect(patch).toMatchObject({
        usuario_id: 7,
        tipo: 'especifico',
        hora_inicio: '11:00',
        hora_fin: '15:00',
        centro_id: 20,
      });
      expect(patch.fecha).toBe('2024-06-20'); // Date → YYYY-MM-DD
    });

    it('OMITS usuario_id from the patch when usuarioId is not provided (time-only edit)', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: { ...horarioEspecificoRow, hora_inicio: '08:00:00' },
        error: null,
        count: null,
      });

      // A pure time/resize edit on the same therapist — no usuarioId in the DTO.
      await adapter.update(2, { horaInicio: '08:00', horaFin: '10:00' });

      const patch = mockChain.update.mock.calls[0]?.[0] as Record<string, unknown>;
      // Partial-update semantics: a key absent from the DTO must NOT appear in the
      // patch (so a time-only edit never blanks the therapist).
      expect(patch).not.toHaveProperty('usuario_id');
      expect(patch).toEqual({ hora_inicio: '08:00', hora_fin: '10:00' });
    });

    it('scopes the update to the id + active rows only', async () => {
      mockChain.single.mockResolvedValue({
        success: true,
        data: horarioEspecificoRow,
        error: null,
        count: null,
      });

      await adapter.update(2, { horaInicio: '08:00' });

      expect(mockChain.eq).toHaveBeenCalledWith('id', 2);
      expect(mockChain.eq).toHaveBeenCalledWith('activo', true);
    });
  });

  // ── deactivate ─────────────────────────────────────────────────────────
  describe('deactivate', () => {
    it('resolves without error on success', async () => {
      mockChain.eq.mockResolvedValue({ success: true, data: [], error: null, count: null });

      await expect(adapter.deactivate(1)).resolves.toBeUndefined();
    });

    it('throws Error on DB error', async () => {
      mockChain.eq.mockResolvedValue({
        success: false,
        data: null,
        error: { message: 'delete error' },
        count: null,
      });

      await expect(adapter.deactivate(1)).rejects.toThrow('delete error');
    });
  });
});
