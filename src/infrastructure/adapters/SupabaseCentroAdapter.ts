import { supabase } from './supabase.client';
import { buildPaginatedResult } from './pagination.helper';
import type { ICentrosRow } from './database.types';
import type { ICentroRepositoryPort } from '@domain/ports';
import type { ICentro, ICreateCentroDTO, IUpdateCentroDTO } from '@domain/models';
import type { TCentroId, IPaginationParams, IPaginatedResult } from '@domain/types';

const SELECT_CENTRO =
  'id, nombre, direccion, ciudad, codigo_postal, telefono, email, activo, created_at, updated_at';

export class SupabaseCentroAdapter implements ICentroRepositoryPort {
  #toModel(row: ICentrosRow): ICentro {
    return {
      id: row.id,
      nombre: row.nombre,
      direccion: row.direccion,
      ciudad: row.ciudad,
      codigoPostal: row.codigo_postal ?? '',
      telefono: row.telefono ?? null,
      email: row.email ?? null,
      activo: row.activo,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async findById(id: TCentroId): Promise<ICentro | null> {
    const result = await supabase.from('centros').select(SELECT_CENTRO).eq('id', id).maybeSingle();
    if (!result.success) throw new Error(result.error.message);
    const row = result.data;
    return row !== null ? this.#toModel(row) : null;
  }

  async findAll(params?: IPaginationParams): Promise<IPaginatedResult<ICentro>> {
    const perPage = params?.perPage ?? 50;
    const page = params?.page ?? 1;
    const result = await supabase
      .from('centros')
      .select(SELECT_CENTRO, { count: 'exact' })
      .range((page - 1) * perPage, page * perPage - 1);
    if (!result.success) throw new Error(result.error.message);
    const rows = result.data as ICentrosRow[];
    return buildPaginatedResult(
      rows.map((r) => this.#toModel(r)),
      result.count,
      params,
    );
  }

  async findActivos(): Promise<readonly ICentro[]> {
    const result = await supabase.from('centros').select(SELECT_CENTRO).eq('activo', true);
    if (!result.success) throw new Error(result.error.message);
    return (result.data as ICentrosRow[]).map((r) => this.#toModel(r));
  }

  async create(data: ICreateCentroDTO): Promise<ICentro> {
    const result = await supabase
      .from('centros')
      .insert({
        nombre: data.nombre,
        direccion: data.direccion,
        ciudad: data.ciudad,
        codigo_postal: data.codigoPostal,
        telefono: data.telefono ?? null,
        email: data.email ?? null,
      })
      .select(SELECT_CENTRO)
      .single();
    if (!result.success) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async update(id: TCentroId, data: IUpdateCentroDTO): Promise<ICentro> {
    const patch: {
      nombre?: string;
      direccion?: string;
      ciudad?: string;
      codigo_postal?: string | null;
      telefono?: string | null;
      email?: string | null;
      activo?: boolean;
    } = {};
    if (data.nombre !== undefined) patch.nombre = data.nombre;
    if (data.direccion !== undefined) patch.direccion = data.direccion;
    if (data.ciudad !== undefined) patch.ciudad = data.ciudad;
    if (data.codigoPostal !== undefined) patch.codigo_postal = data.codigoPostal ?? null;
    if (data.telefono !== undefined) patch.telefono = data.telefono ?? null;
    if (data.email !== undefined) patch.email = data.email ?? null;
    if (data.activo !== undefined) patch.activo = data.activo;

    const result = await supabase
      .from('centros')
      .update(patch)
      .eq('id', id)
      .select(SELECT_CENTRO)
      .single();
    if (!result.success) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async deactivate(id: TCentroId): Promise<void> {
    const result = await supabase.from('centros').update({ activo: false }).eq('id', id);
    if (!result.success) throw new Error(result.error.message);
  }
}
