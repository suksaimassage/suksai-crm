import { supabase } from './supabase.client';
import type { IUsuariosCentroRow } from './database.types';
import type { IUsuarioCentroRepositoryPort } from '@domain/ports';
import type { IUsuarioCentro } from '@domain/models';
import type { TUserId, TCentroId } from '@domain/types';
import { BusinessRuleViolation } from '@domain/types';

const USUARIOS_CENTRO_COLUMNS = 'id, usuario_id, centro_id, es_principal, activo, created_at';

export class SupabaseUsuarioCentroAdapter implements IUsuarioCentroRepositoryPort {
  #toModel(row: IUsuariosCentroRow): IUsuarioCentro {
    return {
      usuarioId: row.usuario_id,
      centroId: row.centro_id,
      esPrincipal: row.es_principal,
      activo: row.activo,
      assignedAt: new Date(row.created_at),
    };
  }

  async assign(
    usuarioId: TUserId,
    centroId: TCentroId,
    esPrincipal?: boolean,
  ): Promise<IUsuarioCentro> {
    // Reactivate an existing soft-deleted row first to avoid duplicate records.
    // The soft-delete pattern (activo=false) means the row stays in the DB after
    // unassign; re-assigning must UPDATE that row back to activo=true, not INSERT.
    const reactivate = await supabase
      .from('usuarios_centro')
      .update({ activo: true, es_principal: esPrincipal ?? false })
      .eq('usuario_id', usuarioId)
      .eq('centro_id', centroId)
      .eq('activo', false)
      .select(USUARIOS_CENTRO_COLUMNS);

    if (!reactivate.success) throw new Error(reactivate.error.message);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Supabase .select() can return null at runtime despite TS typing data as non-null; defensive guard preserved
    if (reactivate.data !== null && reactivate.data.length > 0) {
      return this.#toModel((reactivate.data as IUsuariosCentroRow[])[0]);
    }

    // No soft-deleted row found — create a fresh assignment.
    const insert = await supabase
      .from('usuarios_centro')
      .insert({
        usuario_id: usuarioId,
        centro_id: centroId,
        es_principal: esPrincipal ?? false,
        activo: true,
      })
      .select(USUARIOS_CENTRO_COLUMNS)
      .single();

    if (!insert.success) {
      if (insert.error.code === '23505') {
        throw new BusinessRuleViolation(
          'Usuario already assigned to centro',
          'USUARIO_ALREADY_ASSIGNED',
        );
      }
      throw new Error(insert.error.message);
    }
    return this.#toModel(insert.data);
  }

  async unassign(usuarioId: TUserId, centroId: TCentroId): Promise<void> {
    const result = await supabase
      .from('usuarios_centro')
      .update({ activo: false })
      .eq('usuario_id', usuarioId)
      .eq('centro_id', centroId);
    if (!result.success) throw new Error(result.error.message);
  }

  async findByUsuario(usuarioId: TUserId): Promise<readonly IUsuarioCentro[]> {
    const result = await supabase
      .from('usuarios_centro')
      .select(USUARIOS_CENTRO_COLUMNS)
      .eq('usuario_id', usuarioId)
      .eq('activo', true);
    if (!result.success) throw new Error(result.error.message);
    return (result.data as IUsuariosCentroRow[]).map((r) => this.#toModel(r));
  }

  async findByCentro(centroId: TCentroId): Promise<readonly IUsuarioCentro[]> {
    const result = await supabase
      .from('usuarios_centro')
      .select(USUARIOS_CENTRO_COLUMNS)
      .eq('centro_id', centroId)
      .eq('activo', true);
    if (!result.success) throw new Error(result.error.message);
    return (result.data as IUsuariosCentroRow[]).map((r) => this.#toModel(r));
  }

  async findPrincipalByUsuario(usuarioId: TUserId): Promise<IUsuarioCentro | null> {
    const result = await supabase
      .from('usuarios_centro')
      .select(USUARIOS_CENTRO_COLUMNS)
      .eq('usuario_id', usuarioId)
      .eq('es_principal', true)
      .eq('activo', true)
      .maybeSingle();
    if (!result.success) throw new Error(result.error.message);
    const row = result.data;
    return row !== null ? this.#toModel(row) : null;
  }

  async setPrincipal(usuarioId: TUserId, centroId: TCentroId): Promise<void> {
    // 1. Desmarcar todos los centros principales activos del usuario
    const resetResult = await supabase
      .from('usuarios_centro')
      .update({ es_principal: false })
      .eq('usuario_id', usuarioId)
      .eq('activo', true);
    if (!resetResult.success) throw new Error(resetResult.error.message);

    // 2. Marcar el centro indicado como principal
    const setResult = await supabase
      .from('usuarios_centro')
      .update({ es_principal: true })
      .eq('usuario_id', usuarioId)
      .eq('centro_id', centroId)
      .eq('activo', true);
    if (!setResult.success) throw new Error(setResult.error.message);
  }
}
