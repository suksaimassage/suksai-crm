/**
 * SupabaseTerapeutasAdapter.ts
 *
 * Dedicated adapter for the Terapeutas management page.
 * All queries use PostgREST embedded joins and follow the
 * `if (!result.success) throw` pattern established in this codebase.
 *
 * Architectural rule: Supabase calls ONLY in adapters — never in hooks or components.
 */

import { supabase } from './supabase.client';
import type { TCentroId, TUserId } from '@domain/types';

// ── Raw join shapes (PostgREST embedded join result shapes) ───────────────────

export interface ITerapeutaRaw {
  readonly id: number;
  readonly nombre: string;
  readonly apellidos: string;
  readonly email: string;
  readonly telefono: string | null;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly roles: readonly string[];
}

export interface ICitaConServicioRaw {
  readonly id: number;
  readonly usuario_id: number;
  readonly fecha_inicio: string | null;
  readonly fecha_fin: string | null;
  readonly estado: string | null;
  readonly servicios: { readonly nombre: string; readonly precio: number | null } | null;
  readonly salas: { readonly nombre: string } | null;
}

export interface IHorarioRaw {
  readonly id: number;
  readonly usuario_id: number | null;
  readonly tipo: string;
  readonly dia_semana: number | null;
  readonly fecha: string | null;
  readonly hora_inicio: string;
  readonly hora_fin: string;
}

export interface IAusenciaRaw {
  readonly id: number;
  readonly usuario_id: number | null;
  readonly tipo: string;
  readonly fecha_inicio: string;
  readonly fecha_fin: string;
  readonly estado: string | null;
}

export interface ICurrentCitaRaw {
  readonly id: number;
  readonly usuario_id: number;
  readonly sala_id: number | null;
  readonly estado: string | null;
  readonly fecha_inicio: string | null;
  readonly fecha_fin: string | null;
  readonly salas: { readonly id: number; readonly nombre: string } | null;
}

// ── Local join type for usuarios_centro query ─────────────────────────────────

interface IUsuariosCentroJoinRow {
  readonly usuarios: {
    readonly id: number;
    readonly nombre: string;
    readonly apellidos: string;
    readonly email: string;
    readonly telefono: string | null;
    readonly is_active: boolean;
    readonly created_at: string;
    // Left join — array is always present but entries may have roles: null for orphaned FK rows
    readonly usuarios_roles: readonly { readonly roles: { readonly nombre: string } | null }[];
  };
}

// ── Local shape for ausencias raw select ──────────────────────────────────────

interface IAusenciaSelectRow {
  readonly id: number;
  readonly usuario_id: number | null;
  readonly tipo: string;
  readonly fecha_inicio: string;
  readonly fecha_fin: string;
  readonly activa: boolean | null;
}

// ── Adapter class ─────────────────────────────────────────────────────────────

export class SupabaseTerapeutasAdapter {
  /**
   * Fetch all users with an active centro assignment who hold the masajista or
   * recepcionista role. Filtering is client-side because PostgREST nested IN-eq on
   * deeply joined tables is unreliable without explicit foreign key hints.
   */
  async fetchTerapeutasByCentro(centroId: TCentroId): Promise<ITerapeutaRaw[]> {
    const result = await supabase
      .from('usuarios_centro')
      .select(
        'usuarios!inner(id, nombre, apellidos, email, telefono, is_active, created_at, usuarios_roles(roles(nombre)))',
      )
      .eq('centro_id', centroId)
      .eq('activo', true);

    if (!result.success) throw new Error(result.error.message);

    const rows = result.data as unknown as IUsuariosCentroJoinRow[];
    return rows
      .map((r) => r.usuarios)
      .filter((u) =>
        u.usuarios_roles.some(
          (ur) => ur.roles?.nombre === 'masajista' || ur.roles?.nombre === 'recepcionista',
        ),
      )
      .map(({ id, nombre, apellidos, email, telefono, is_active, created_at, usuarios_roles }) => ({
        id,
        nombre,
        apellidos,
        email,
        telefono,
        is_active,
        created_at,
        roles: usuarios_roles
          .map((ur) => ur.roles?.nombre)
          .filter((n): n is string => n !== undefined),
      }));
  }

  /**
   * Fetch citas in a date range for a set of therapist user IDs.
   * Includes service name and price for stats and specialty derivation.
   */
  async fetchWeekCitasForUsuarios(
    usuarioIds: readonly TUserId[],
    from: Date,
    to: Date,
  ): Promise<ICitaConServicioRaw[]> {
    if (usuarioIds.length === 0) return [];

    // The FK hint (!citas_servicio_id_fkey) disambiguates the join for PostgREST.
    // Without it, PostgREST may return a SelectQueryError object instead of the
    // service data when the client's Relationships array is empty ([]).
    const result = await supabase
      .from('citas')
      .select(
        'id, usuario_id, fecha_inicio, fecha_fin, estado, servicios!citas_servicio_id_fkey(nombre, precio), salas(nombre)',
      )
      .in('usuario_id', [...usuarioIds])
      .gte('fecha_inicio', from.toISOString())
      .lte('fecha_inicio', to.toISOString());

    if (!result.success) throw new Error(result.error.message);
    return result.data as unknown as ICitaConServicioRaw[];
  }

  /**
   * Fetch all horarios_trabajo entries for a set of therapist user IDs.
   * Note: horarios_trabajo has no centro_id — multi-centro bleed accepted at MVP.
   */
  async fetchHorariosForUsuarios(usuarioIds: readonly TUserId[]): Promise<IHorarioRaw[]> {
    if (usuarioIds.length === 0) return [];

    const result = await supabase
      .from('horarios_trabajo')
      .select('id, usuario_id, tipo, dia_semana, fecha, hora_inicio, hora_fin')
      .in('usuario_id', [...usuarioIds]);

    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }

  /**
   * Fetch ausencias for a set of therapist user IDs that overlap a date range.
   */
  async fetchAusenciasForUsuarios(
    usuarioIds: readonly TUserId[],
    from: Date,
    to: Date,
  ): Promise<IAusenciaRaw[]> {
    if (usuarioIds.length === 0) return [];

    const fromStr = from.toISOString().split('T')[0] ?? '';
    const toStr = to.toISOString().split('T')[0] ?? '';

    const result = await supabase
      .from('ausencias')
      .select('id, usuario_id, tipo, fecha_inicio, fecha_fin, activa')
      .in('usuario_id', [...usuarioIds])
      .lte('fecha_inicio', toStr)
      .gte('fecha_fin', fromStr);

    if (!result.success) throw new Error(result.error.message);

    return (result.data as IAusenciaSelectRow[]).map((r) => ({
      id: r.id,
      usuario_id: r.usuario_id,
      tipo: r.tipo,
      fecha_inicio: r.fecha_inicio,
      fecha_fin: r.fecha_fin,
      estado: r.activa === true ? 'aprobada' : null,
    }));
  }

  /**
   * Fetch currently active (en_curso) citas for a centro at a given instant.
   * Used to populate en_sala status and room name.
   */
  async fetchCurrentCitasForCentro(centroId: TCentroId, now: Date): Promise<ICurrentCitaRaw[]> {
    const nowIso = now.toISOString();

    const result = await supabase
      .from('citas')
      .select('id, usuario_id, sala_id, estado, fecha_inicio, fecha_fin, salas(id, nombre)')
      .eq('centro_id', centroId)
      .eq('estado', 'en_curso')
      .lte('fecha_inicio', nowIso)
      .gte('fecha_fin', nowIso);

    if (!result.success) throw new Error(result.error.message);
    // JOIN result — cast required (Relationships: [] in IDatabase)
    return result.data as unknown as ICurrentCitaRaw[];
  }
}
