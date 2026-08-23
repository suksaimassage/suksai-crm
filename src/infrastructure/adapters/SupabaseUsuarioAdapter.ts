import { supabase } from './supabase.client';
import { buildPaginatedResult } from './pagination.helper';
import type { IUsuariosRow, IUsuariosInsert } from './database.types';
import type { IUsuarioRepositoryPort } from '@domain/ports';
import type { IUsuario, ICreateUsuarioDTO, IUpdateUsuarioDTO } from '@domain/models';
import type { TUserId, TCentroId, IPaginationParams, IPaginatedResult } from '@domain/types';

const SELECT_USUARIO = 'id, nombre, apellidos, email, telefono, is_active, created_at, updated_at';

export class SupabaseUsuarioAdapter implements IUsuarioRepositoryPort {
  #toModel(row: IUsuariosRow): IUsuario {
    return {
      id: row.id,
      nombre: row.nombre,
      apellidos: row.apellidos,
      email: row.email,
      telefono: row.telefono ?? null,
      activo: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async findById(id: TUserId): Promise<IUsuario | null> {
    const result = await supabase
      .from('usuarios')
      .select(SELECT_USUARIO)
      .eq('id', id)
      .maybeSingle();
    if (!result.success) throw new Error(result.error.message);
    const row = result.data as IUsuariosRow | null;
    return row !== null ? this.#toModel(row) : null;
  }

  async findByEmail(email: string): Promise<IUsuario | null> {
    const result = await supabase
      .from('usuarios')
      .select(SELECT_USUARIO)
      .eq('email', email)
      .maybeSingle();
    if (!result.success) throw new Error(result.error.message);
    const row = result.data as IUsuariosRow | null;
    return row !== null ? this.#toModel(row) : null;
  }

  async findAll(params?: IPaginationParams): Promise<IPaginatedResult<IUsuario>> {
    const perPage = params?.perPage ?? 50;
    const page = params?.page ?? 1;
    const result = await supabase
      .from('usuarios')
      .select(SELECT_USUARIO, { count: 'exact' })
      .range((page - 1) * perPage, page * perPage - 1);
    if (!result.success) throw new Error(result.error.message);
    const rows = result.data as IUsuariosRow[];
    return buildPaginatedResult(
      rows.map((r) => this.#toModel(r)),
      result.count,
      params,
    );
  }

  async findByCentro(centroId: TCentroId): Promise<readonly IUsuario[]> {
    const result = await supabase
      .from('usuarios_centro')
      .select(`usuario_id, usuarios(${SELECT_USUARIO})`)
      .eq('centro_id', centroId);
    if (!result.success) throw new Error(result.error.message);
    const rows = result.data as unknown as { usuarios: IUsuariosRow | null }[];
    return rows
      .map((r) => r.usuarios)
      .filter((u): u is IUsuariosRow => u !== null)
      .map((u) => this.#toModel(u));
  }

  async create(data: ICreateUsuarioDTO): Promise<IUsuario> {
    const insert: IUsuariosInsert = {
      nombre: data.nombre,
      email: data.email,
      apellidos: data.apellidos,
      telefono: data.telefono ?? null,
      is_active: data.activo ?? true,
    };
    const result = await supabase.from('usuarios').insert(insert).select(SELECT_USUARIO).single();
    if (!result.success) throw new Error(result.error.message);
    return this.#toModel(result.data as IUsuariosRow);
  }

  async update(id: TUserId, data: IUpdateUsuarioDTO): Promise<IUsuario> {
    const patch: {
      nombre?: string;
      apellidos?: string;
      telefono?: string | null;
      is_active?: boolean;
    } = {};
    if (data.nombre !== undefined) patch.nombre = data.nombre;
    if (data.apellidos !== undefined) patch.apellidos = data.apellidos;
    if (data.telefono !== undefined) patch.telefono = data.telefono ?? null;
    if (data.activo !== undefined) patch.is_active = data.activo;

    const result = await supabase
      .from('usuarios')
      .update(patch)
      .eq('id', id)
      .select(SELECT_USUARIO)
      .single();
    if (!result.success) throw new Error(result.error.message);
    return this.#toModel(result.data as IUsuariosRow);
  }

  async deactivate(id: TUserId): Promise<void> {
    const result = await supabase.from('usuarios').update({ is_active: false }).eq('id', id);
    if (!result.success) throw new Error(result.error.message);
  }
}
