import { supabase } from './supabase.client';
import type { IAusenciasRow } from './database.types';
import type { IAusenciaRepositoryPort } from '@domain/ports';
import type { IAusencia, ICreateAusenciaDTO } from '@domain/models';
import type { TAusenciaId, TUserId, TTipoAusencia, IDateRangeFilter } from '@domain/types';

const AUSENCIA_COLUMNS =
  'id, usuario_id, tipo, fecha_inicio, fecha_fin, activa, aprobado_por, observaciones, created_at';

export class SupabaseAusenciaAdapter implements IAusenciaRepositoryPort {
  #toModel(row: IAusenciasRow): IAusencia {
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      tipo: row.tipo as TTipoAusencia,
      fechaInicio: new Date(row.fecha_inicio),
      fechaFin: new Date(row.fecha_fin),
      motivo: row.observaciones,
      aprobada: row.activa,
      aprobadaPor: row.aprobado_por,
      createdAt: new Date(row.created_at),
    };
  }

  async findById(id: TAusenciaId): Promise<IAusencia | null> {
    const result = await supabase
      .from('ausencias')
      .select(AUSENCIA_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (!result.success) throw new Error(result.error.message);
    const row = result.data;
    return row !== null ? this.#toModel(row) : null;
  }

  async findByUsuario(
    usuarioId: TUserId,
    params?: IDateRangeFilter,
  ): Promise<readonly IAusencia[]> {
    let query = supabase.from('ausencias').select(AUSENCIA_COLUMNS).eq('usuario_id', usuarioId);

    if (params) {
      query = query
        .gte('fecha_inicio', params.from.toISOString().slice(0, 10))
        .lte('fecha_fin', params.to.toISOString().slice(0, 10));
    }

    const result = await query;
    if (!result.success) throw new Error(result.error.message);
    return (result.data as IAusenciasRow[]).map((r) => this.#toModel(r));
  }

  async findPendientesAprobacion(): Promise<readonly IAusencia[]> {
    const result = await supabase.from('ausencias').select(AUSENCIA_COLUMNS).eq('activa', false);
    if (!result.success) throw new Error(result.error.message);
    return (result.data as IAusenciasRow[]).map((r) => this.#toModel(r));
  }

  async findByTipo(tipo: TTipoAusencia): Promise<readonly IAusencia[]> {
    const result = await supabase.from('ausencias').select(AUSENCIA_COLUMNS).eq('tipo', tipo);
    if (!result.success) throw new Error(result.error.message);
    return (result.data as IAusenciasRow[]).map((r) => this.#toModel(r));
  }

  async create(data: ICreateAusenciaDTO): Promise<IAusencia> {
    const result = await supabase
      .from('ausencias')
      .insert({
        usuario_id: data.usuarioId,
        tipo: data.tipo,
        fecha_inicio: data.fechaInicio.toISOString().slice(0, 10),
        fecha_fin: data.fechaFin.toISOString().slice(0, 10),
        aprobado_por: data.aprobadaPor,
        activa: false,
        observaciones: data.motivo ?? null,
      })
      .select(AUSENCIA_COLUMNS)
      .single();
    if (!result.success) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async aprobar(id: TAusenciaId, aprobadaPor: TUserId): Promise<IAusencia> {
    const result = await supabase
      .from('ausencias')
      .update({ activa: true, aprobado_por: aprobadaPor })
      .eq('id', id)
      .select(AUSENCIA_COLUMNS)
      .single();
    if (!result.success) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async rechazar(id: TAusenciaId): Promise<void> {
    const result = await supabase.from('ausencias').update({ activa: false }).eq('id', id);
    if (!result.success) throw new Error(result.error.message);
  }
}
