/**
 * SupabaseDashboardAdapter.ts
 *
 * Dashboard-specific queries using PostgREST embedded joins.
 * These queries span multiple tables and are not representable through
 * the typed IDatabase.Tables without full Supabase codegen.
 * Result rows are cast with `as unknown as T[]` — accepted pattern for joins.
 *
 * Architectural rule: Supabase calls ONLY in adapters, never in hooks or components.
 */

import { supabase } from './supabase.client';
import type { TCentroId } from '@domain/types';

// ── Local join types (PostgREST embedded join result shapes) ──────────────────

export interface ICitaConJoins {
  readonly id: number;
  readonly sala_id: number | null;
  readonly fecha_inicio: string | null;
  readonly fecha_fin: string | null;
  readonly estado: string | null;
  readonly cliente_id: number;
  readonly usuario_id: number;
  readonly clientes: { readonly nombre: string; readonly apellidos: string | null } | null;
  readonly usuarios: { readonly nombre: string } | null;
  readonly salas: { readonly nombre: string } | null;
  readonly servicios: {
    readonly nombre: string;
    readonly duracion: number;
    readonly precio: number | null;
  } | null;
}

export interface ICitaConPrecio {
  readonly id: number;
  readonly cliente_id: number;
  readonly fecha_inicio: string | null;
  readonly estado: string | null;
  readonly servicios: { readonly precio: number | null } | null;
}

export interface INetworkCita {
  readonly centro_id: number | null;
  readonly sala_id: number | null;
  readonly estado: string | null;
  readonly servicios: { readonly precio: number | null } | null;
}

export interface IStaffByCentro {
  readonly centro_id: number | null;
  readonly usuario_id: number;
}

export interface ISalaRaw {
  readonly id: number;
  readonly centro_id: number | null;
  readonly nombre: string;
  readonly activa: boolean;
}

export interface ICitaConClientePrecio {
  readonly id: number;
  readonly cliente_id: number;
  readonly estado: string | null;
  readonly fecha_inicio: string | null;
  readonly clientes: {
    readonly id: number;
    readonly nombre: string;
    readonly apellidos: string | null;
  } | null;
  readonly servicios: { readonly precio: number | null } | null;
}

export interface ILastAppointmentRaw {
  readonly cliente_id: number;
  readonly fecha_inicio: string | null;
  readonly servicios: { readonly nombre: string } | null;
  readonly salas: { readonly nombre: string } | null;
}

// ── Adapter class ─────────────────────────────────────────────────────────────

export class SupabaseDashboardAdapter {
  /**
   * Fetch today's appointments for a centro with all joined relations.
   * Used by AppointmentPanel (non-terapeuta path).
   */
  async fetchTodayAppointments(centroId: TCentroId, date: Date): Promise<ICitaConJoins[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await supabase
      .from('citas')
      .select(
        `id, sala_id, fecha_inicio, fecha_fin, estado, cliente_id, usuario_id,
         clientes(nombre, apellidos),
         usuarios(nombre),
         salas(nombre),
         servicios(nombre, duracion, precio)`,
      )
      .eq('centro_id', centroId)
      .gte('fecha_inicio', startOfDay.toISOString())
      .lte('fecha_inicio', endOfDay.toISOString())
      .order('fecha_inicio', { ascending: true })
      .limit(10);

    if (!result.success) throw new Error(result.error.message);
    // JOIN result — Relationships: [] in IDatabase, cast required (accepted pattern)
    return result.data as unknown as ICitaConJoins[];
  }

  /**
   * Fetch today's appointments for a specific therapist (terapeuta role path).
   */
  async fetchTerapeutaTodayAppointments(usuarioId: number, date: Date): Promise<ICitaConJoins[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await supabase
      .from('citas')
      .select(
        `id, fecha_inicio, fecha_fin, estado, cliente_id, usuario_id,
         clientes(nombre, apellidos),
         usuarios(nombre),
         salas(nombre),
         servicios(nombre, duracion, precio)`,
      )
      .eq('usuario_id', usuarioId)
      .gte('fecha_inicio', startOfDay.toISOString())
      .lte('fecha_inicio', endOfDay.toISOString())
      .order('fecha_inicio', { ascending: true })
      .limit(10);

    if (!result.success) throw new Error(result.error.message);
    // JOIN result — cast required (Relationships: [] in IDatabase)
    return result.data as unknown as ICitaConJoins[];
  }

  /**
   * Fetch citas in a date range with prices for KPI aggregation.
   *
   * Returns a single superset window spanning the earliest..latest boundary the
   * dashboard KPIs need (start of previous calendar month → end of current
   * calendar week). The hook then buckets the rows in-memory against each KPI's
   * own period (today/today-7d, current/previous week, current/previous month).
   *
   * `estado` is intentionally NOT pre-filtered here — each KPI applies its own
   * estado rule in the hook (e.g. revenue excludes cancelada/no_presentado,
   * `reservasCompletadasMes` keeps only `completada`).
   */
  async fetchCitasForKpiWindow(
    centroId: TCentroId,
    from: Date,
    to: Date,
  ): Promise<ICitaConPrecio[]> {
    const result = await supabase
      .from('citas')
      .select(`id, cliente_id, fecha_inicio, estado, servicios(precio)`)
      .eq('centro_id', centroId)
      .gte('fecha_inicio', from.toISOString())
      .lte('fecha_inicio', to.toISOString());

    if (!result.success) throw new Error(result.error.message);
    return result.data as unknown as ICitaConPrecio[];
  }

  /**
   * Fetch all non-cancelled citas for a centro to compute top clients.
   * Used by useDashboardTopClientes.
   */
  async fetchTopClientData(centroId: TCentroId): Promise<ICitaConClientePrecio[]> {
    const result = await supabase
      .from('citas')
      .select(
        `id, cliente_id, estado, fecha_inicio,
         clientes(id, nombre, apellidos),
         servicios(precio)`,
      )
      .eq('centro_id', centroId)
      .not('estado', 'in', '("cancelada","no_presentado")');

    if (!result.success) throw new Error(result.error.message);
    return result.data as unknown as ICitaConClientePrecio[];
  }

  /**
   * Fetch the next scheduled appointment for each given client.
   * Used by useDashboardTopClientes to show upcoming appointment date.
   */
  async fetchNetworkTodayCitas(date: Date): Promise<INetworkCita[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await supabase
      .from('citas')
      .select('centro_id, sala_id, estado, servicios(precio)')
      .gte('fecha_inicio', startOfDay.toISOString())
      .lte('fecha_inicio', endOfDay.toISOString());

    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }

  async fetchStaffByCentros(): Promise<IStaffByCentro[]> {
    const result = await supabase.from('usuarios_centro').select('centro_id, usuario_id');

    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }

  async fetchAllSalas(): Promise<ISalaRaw[]> {
    const result = await supabase
      .from('salas')
      .select('id, centro_id, nombre, activa')
      .order('nombre', { ascending: true });

    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }

  async fetchFutureAppointmentsByClients(
    centroId: TCentroId,
    clienteIds: readonly number[],
  ): Promise<{ readonly cliente_id: number | null; readonly fecha_inicio: string | null }[]> {
    if (clienteIds.length === 0) return [];

    const now = new Date().toISOString();
    const result = await supabase
      .from('citas')
      .select('cliente_id, fecha_inicio')
      .eq('centro_id', centroId)
      .in('cliente_id', [...clienteIds])
      .gt('fecha_inicio', now)
      .in('estado', ['pendiente', 'confirmada'])
      .order('fecha_inicio', { ascending: true });

    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }

  async fetchLastAppointmentsByClients(
    centroId: TCentroId,
    clienteIds: readonly number[],
  ): Promise<ILastAppointmentRaw[]> {
    if (clienteIds.length === 0) return [];

    const result = await supabase
      .from('citas')
      .select('cliente_id, fecha_inicio, servicios(nombre), salas(nombre)')
      .eq('centro_id', centroId)
      .in('cliente_id', [...clienteIds])
      .not('estado', 'in', '("cancelada","no_presentado")')
      .order('fecha_inicio', { ascending: false });

    if (!result.success) throw new Error(result.error.message);
    return result.data as unknown as ILastAppointmentRaw[];
  }
}
