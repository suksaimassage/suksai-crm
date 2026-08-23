import { supabase } from './supabase.client';
import type { ISalasRow } from './database.types';
import type { ISalaRepositoryPort } from '@domain/ports';
import type { ISala, ICreateSalaDTO, IUpdateSalaDTO } from '@domain/models';
import type { TSalaId, TCentroId } from '@domain/types';

const SELECT_SALA = 'id, nombre, centro_id, capacidad, activa, descripcion, created_at, updated_at';

export class SupabaseSalaAdapter implements ISalaRepositoryPort {
  #toModel(row: ISalasRow): ISala {
    return {
      id: row.id,
      centroId: row.centro_id ?? 0,
      nombre: row.nombre,
      capacidad: row.capacidad,
      activa: row.activa,
      descripcion: row.descripcion ?? null,
    };
  }

  async findById(id: TSalaId): Promise<ISala | null> {
    const result = await supabase.from('salas').select(SELECT_SALA).eq('id', id).maybeSingle();
    if (!result.success) throw new Error(result.error.message);
    const row = result.data;
    return row !== null ? this.#toModel(row) : null;
  }

  async findByCentro(centroId: TCentroId): Promise<readonly ISala[]> {
    const result = await supabase.from('salas').select(SELECT_SALA).eq('centro_id', centroId);
    if (!result.success) throw new Error(result.error.message);
    return (result.data as ISalasRow[]).map((r) => this.#toModel(r));
  }

  async findActivasByCentro(centroId: TCentroId): Promise<readonly ISala[]> {
    const result = await supabase
      .from('salas')
      .select(SELECT_SALA)
      .eq('centro_id', centroId)
      .eq('activa', true);
    if (!result.success) throw new Error(result.error.message);
    return (result.data as ISalasRow[]).map((r) => this.#toModel(r));
  }

  async create(data: ICreateSalaDTO): Promise<ISala> {
    const result = await supabase
      .from('salas')
      .insert({
        nombre: data.nombre,
        centro_id: data.centroId,
        capacidad: data.capacidad,
        descripcion: data.descripcion ?? null,
      })
      .select(SELECT_SALA)
      .single();
    if (!result.success) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async update(id: TSalaId, data: IUpdateSalaDTO): Promise<ISala> {
    const patch: {
      nombre?: string;
      capacidad?: number;
      activa?: boolean;
      descripcion?: string | null;
    } = {};
    if (data.nombre !== undefined) patch.nombre = data.nombre;
    if (data.capacidad !== undefined) patch.capacidad = data.capacidad;
    if (data.activa !== undefined) patch.activa = data.activa;
    if (data.descripcion !== undefined) patch.descripcion = data.descripcion ?? null;

    const result = await supabase
      .from('salas')
      .update(patch)
      .eq('id', id)
      .select(SELECT_SALA)
      .single();
    if (!result.success) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async deactivate(id: TSalaId): Promise<void> {
    const result = await supabase.from('salas').update({ activa: false }).eq('id', id);
    if (!result.success) throw new Error(result.error.message);
  }
}
