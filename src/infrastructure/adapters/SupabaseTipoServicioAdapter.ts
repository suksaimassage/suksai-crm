import { supabase } from './supabase.client';
import type { ITipoServiciosRow } from './database.types';
import type { ITipoServicioRepositoryPort } from '@domain/ports';
import type { ITipoServicio } from '@domain/models';
import type { TTipoServicioId } from '@domain/types';

export class SupabaseTipoServicioAdapter implements ITipoServicioRepositoryPort {
  #toModel(row: ITipoServiciosRow): ITipoServicio {
    return {
      id: row.id,
      nombre: row.nombre,
      descripcion: null,
    };
  }

  async findAll(): Promise<readonly ITipoServicio[]> {
    const result = await supabase
      .from('tipo_servicios')
      .select('id, nombre, categoria, created_at');
    if (!result.success) throw new Error(result.error.message);
    return (result.data as ITipoServiciosRow[]).map((r) => this.#toModel(r));
  }

  async findById(id: TTipoServicioId): Promise<ITipoServicio | null> {
    const result = await supabase
      .from('tipo_servicios')
      .select('id, nombre, categoria, created_at')
      .eq('id', id)
      .maybeSingle();
    if (!result.success) throw new Error(result.error.message);
    const row = result.data;
    return row !== null ? this.#toModel(row) : null;
  }
}
