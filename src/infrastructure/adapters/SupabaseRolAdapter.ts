import { supabase } from './supabase.client';
import type { IRolesRow } from './database.types';
import type { IRolRepositoryPort } from '@domain/ports';
import type { IRol, IUsuarioRol } from '@domain/models';
import type { TRolId, TUserId } from '@domain/types';
import { BusinessRuleViolation } from '@domain/types';

export class SupabaseRolAdapter implements IRolRepositoryPort {
  #toModel(row: IRolesRow): IRol {
    return {
      id: row.id,
      nombre: row.nombre,
      descripcion: null,
    };
  }

  async findAll(): Promise<readonly IRol[]> {
    const result = await supabase.from('roles').select('id, nombre, created_at, updated_at');
    if (!result.success) throw new Error(result.error.message);
    return (result.data as IRolesRow[]).map((r) => this.#toModel(r));
  }

  async findAssignables(): Promise<readonly IRol[]> {
    const result = await supabase
      .from('roles')
      .select('id, nombre, created_at, updated_at')
      .neq('nombre', 'superadmin');
    if (!result.success) throw new Error(result.error.message);
    return (result.data as IRolesRow[]).map((r) => this.#toModel(r));
  }

  async findById(id: TRolId): Promise<IRol | null> {
    const result = await supabase
      .from('roles')
      .select('id, nombre, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();
    if (!result.success) throw new Error(result.error.message);
    const row = result.data;
    return row !== null ? this.#toModel(row) : null;
  }

  async assignRolToUsuario(usuarioId: TUserId, rolId: TRolId): Promise<IUsuarioRol> {
    const result = await supabase
      .from('usuarios_roles')
      .insert({ usuario_id: usuarioId, rol_id: rolId })
      .select('usuario_id, rol_id')
      .single();
    if (!result.success) {
      if (result.error.code === '23505') {
        throw new BusinessRuleViolation('Role already assigned to user', 'ROL_ALREADY_ASSIGNED');
      }
      throw new Error(result.error.message);
    }
    return {
      usuarioId: result.data.usuario_id,
      rolId: result.data.rol_id,
      assignedAt: new Date(),
    };
  }

  async removeRolFromUsuario(usuarioId: TUserId, rolId: TRolId): Promise<void> {
    const result = await supabase
      .from('usuarios_roles')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('rol_id', rolId);
    if (!result.success) throw new Error(result.error.message);
  }

  async updateNonSuperadminRolForUsuario(usuarioId: TUserId, newRolId: TRolId): Promise<void> {
    const currentRoles = await this.findRolesByUsuario(usuarioId);
    const existing = currentRoles.find((r) => r.nombre !== 'superadmin');

    if (existing !== undefined) {
      // UPDATE the existing non-superadmin row — DELETE is not permitted by RLS.
      const result = await supabase
        .from('usuarios_roles')
        .update({ rol_id: newRolId })
        .eq('usuario_id', usuarioId)
        .eq('rol_id', existing.id);
      if (!result.success) throw new Error(result.error.message);
    } else {
      await this.assignRolToUsuario(usuarioId, newRolId);
    }
  }

  async findRolesByUsuario(usuarioId: TUserId): Promise<readonly IRol[]> {
    const result = await supabase
      .from('usuarios_roles')
      .select('roles(id, nombre, created_at, updated_at)')
      .eq('usuario_id', usuarioId);
    if (!result.success) throw new Error(result.error.message);
    const rows = result.data as unknown as { roles: IRolesRow | null }[];
    return rows
      .map((r) => r.roles)
      .filter((rol): rol is IRolesRow => rol !== null)
      .map((rol) => this.#toModel(rol));
  }
}
