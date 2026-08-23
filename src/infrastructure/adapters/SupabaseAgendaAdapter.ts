/**
 * SupabaseAgendaAdapter.ts
 *
 * Adapter for agenda-page queries. Implements IAgendaRepositoryPort.
 * Uses PostgREST embedded joins for efficient single-round-trip fetches.
 *
 * Architectural rule: Supabase calls ONLY in adapters — never in hooks or components.
 */

import { supabase } from './supabase.client';
import type { TCentroId, TUserId, TEstadoCita } from '@domain/types';
import type {
  IAgendaRawCita,
  IAgendaTerapeutaRow,
  IHorarioForDateRow,
} from '@domain/models/agenda.models';
import type { IAgendaRepositoryPort } from '@domain/ports';

// ── Local join shapes (PostgREST embedded join result shapes) ──────────────────

interface ICitaAgendaRow {
  readonly id: number;
  readonly fecha_inicio: string | null;
  readonly fecha_fin: string | null;
  readonly estado: string | null;
  readonly observaciones: string | null;
  /** Null when no therapist is assigned yet (estado = 'sin_asignar'). */
  readonly usuario_id: number | null;
  readonly sala_id: number | null;
  readonly centro_id: number;
  readonly clientes: { readonly nombre: string; readonly apellidos: string | null } | null;
  readonly salas: { readonly id: number; readonly nombre: string } | null;
  readonly centros: { readonly nombre: string } | null;
  readonly servicios: {
    readonly nombre: string;
    readonly duracion: number;
    readonly precio: number | null;
  } | null;
}

interface IUsuariosCentroAgendaRow {
  readonly usuarios: {
    readonly id: number;
    readonly nombre: string;
    readonly apellidos: string;
    readonly is_active: boolean;
    readonly usuarios_roles: readonly { readonly roles: { readonly nombre: string } }[];
  };
}

interface IHorarioAgendaRow {
  readonly usuario_id: number;
  readonly tipo: 'recurrente' | 'especifico';
  readonly dia_semana: number | null;
  readonly fecha: string | null;
  readonly hora_inicio: string;
  readonly hora_fin: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function mapCitaRow(row: ICitaAgendaRow): IAgendaRawCita | null {
  if (!row.fecha_inicio || !row.fecha_fin) return null;

  const startDate = new Date(row.fecha_inicio);
  const endDate = new Date(row.fecha_fin);
  const durationMin =
    row.servicios?.duracion ?? Math.round((endDate.getTime() - startDate.getTime()) / 60_000);

  // clientName is null when no client is assigned (sin_asignar)
  const clientName = row.clientes
    ? `${row.clientes.nombre}${row.clientes.apellidos ? ' ' + row.clientes.apellidos : ''}`
    : null;

  // salaId and sala name are null when no room is assigned (sin_asignar)
  const salaId = row.salas?.id ?? row.sala_id ?? null;
  const sala = row.salas?.nombre ?? null;

  return {
    id: row.id,
    therapistId: row.usuario_id, // null when no therapist is assigned
    startIso: row.fecha_inicio,
    endIso: row.fecha_fin,
    clientName,
    serviceName: row.servicios?.nombre ?? 'Servicio',
    sala,
    salaId,
    centroId: row.centro_id,
    centroName: row.centros?.nombre ?? '',
    durationMin,
    estado: (row.estado ?? 'sin_asignar') as TEstadoCita,
    notes: row.observaciones ?? null,
    precio: row.servicios?.precio ?? 0,
  };
}

function buildDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function buildWeekRange(weekStart: Date): { start: Date; end: Date } {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function buildMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

const CITA_SELECT = `
  id, fecha_inicio, fecha_fin, estado, observaciones, usuario_id, sala_id, centro_id,
  clientes(nombre, apellidos),
  salas(id, nombre),
  centros(nombre),
  servicios(nombre, duracion, precio)
` as const;

// ── Adapter ────────────────────────────────────────────────────────────────────

export class SupabaseAgendaAdapter implements IAgendaRepositoryPort {
  async fetchDayCitas(centroId: TCentroId, date: Date): Promise<readonly IAgendaRawCita[]> {
    const { start, end } = buildDayRange(date);

    const { data, error } = await supabase
      .from('citas')
      .select(CITA_SELECT)
      .eq('centro_id', centroId)
      .gte('fecha_inicio', start.toISOString())
      .lte('fecha_inicio', end.toISOString())
      // Exclude cancelled/no-show AND exclude sin-asignar (no therapist) from the
      // therapist-column grid — those are rendered separately in the "Sin asignar" rail.
      .not('estado', 'in', '("cancelada","no_presentado","sin_asignar")')
      .not('usuario_id', 'is', null)
      .order('fecha_inicio', { ascending: true });

    if (error) throw new Error(error.message);

    return (data as unknown as ICitaAgendaRow[])
      .map(mapCitaRow)
      .filter((c): c is IAgendaRawCita => c !== null);
  }

  async fetchDayCancelledCitas(
    centroId: TCentroId,
    date: Date,
  ): Promise<readonly IAgendaRawCita[]> {
    const { start, end } = buildDayRange(date);

    const { data, error } = await supabase
      .from('citas')
      .select(CITA_SELECT)
      .eq('centro_id', centroId)
      .gte('fecha_inicio', start.toISOString())
      .lte('fecha_inicio', end.toISOString())
      .eq('estado', 'cancelada')
      .order('fecha_inicio', { ascending: true });

    if (error) throw new Error(error.message);

    return (data as unknown as ICitaAgendaRow[])
      .map(mapCitaRow)
      .filter((c): c is IAgendaRawCita => c !== null);
  }

  async fetchTherapistDayCitas(
    therapistId: TUserId,
    date: Date,
  ): Promise<readonly IAgendaRawCita[]> {
    const { start, end } = buildDayRange(date);

    const { data, error } = await supabase
      .from('citas')
      .select(CITA_SELECT)
      .eq('usuario_id', therapistId)
      .gte('fecha_inicio', start.toISOString())
      .lte('fecha_inicio', end.toISOString())
      .not('estado', 'in', '("cancelada","no_presentado")')
      .order('fecha_inicio', { ascending: true });

    if (error) throw new Error(error.message);

    return (data as unknown as ICitaAgendaRow[])
      .map(mapCitaRow)
      .filter((c): c is IAgendaRawCita => c !== null);
  }

  async fetchDayTerapeutas(centroId: TCentroId): Promise<readonly IAgendaTerapeutaRow[]> {
    const { data, error } = await supabase
      .from('usuarios_centro')
      .select(
        'usuarios!inner(id, nombre, apellidos, is_active, usuarios_roles!inner(roles!inner(nombre)))',
      )
      .eq('centro_id', centroId)
      .eq('activo', true); // only active centro assignments (soft-delete: false = removed)

    if (error) throw new Error(error.message);

    const rows = data as unknown as IUsuariosCentroAgendaRow[];
    // Deduplicate by user id in case a user has multiple active assignments to the same centro.
    // Accept both 'masajista' (legacy seed) and 'terapeuta' (canonical TNombreRol) role names.
    const seen = new Set<number>();
    return rows
      .map((r) => r.usuarios)
      .filter((u) => {
        if (!u.is_active || seen.has(u.id)) return false;
        const isTerapeuta = u.usuarios_roles.some((ur) => ur.roles.nombre === 'masajista');
        if (!isTerapeuta) return false;
        seen.add(u.id);
        return true;
      })
      .map(({ id, nombre, apellidos, is_active }) => ({
        id,
        nombre,
        apellidos,
        isActive: is_active,
      }));
  }

  async fetchDayHorarios(centroId: TCentroId, date: Date): Promise<readonly IHorarioForDateRow[]> {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

    const HORARIO_SELECT = 'usuario_id, tipo, dia_semana, fecha, hora_inicio, hora_fin' as const;

    const [specificResult, recurringResult] = await Promise.all([
      supabase
        .from('horarios_trabajo')
        .select(HORARIO_SELECT)
        .eq('centro_id', centroId)
        .eq('tipo', 'especifico')
        .eq('fecha', dateStr)
        .eq('activo', true),
      supabase
        .from('horarios_trabajo')
        .select(HORARIO_SELECT)
        .eq('centro_id', centroId)
        .eq('tipo', 'recurrente')
        .eq('dia_semana', dayOfWeek)
        .eq('activo', true),
    ]);

    if (specificResult.error) throw new Error(specificResult.error.message);
    if (recurringResult.error) throw new Error(recurringResult.error.message);

    return [
      ...(specificResult.data as unknown as IHorarioAgendaRow[]),
      ...(recurringResult.data as unknown as IHorarioAgendaRow[]),
    ].map((r) => ({
      usuarioId: r.usuario_id,
      tipo: r.tipo,
      diaSemana: r.dia_semana,
      fecha: r.fecha,
      horaInicio: r.hora_inicio,
      horaFin: r.hora_fin,
    }));
  }

  async fetchWeekCitas(centroId: TCentroId, weekStart: Date): Promise<readonly IAgendaRawCita[]> {
    const { start, end } = buildWeekRange(weekStart);

    const { data, error } = await supabase
      .from('citas')
      .select(CITA_SELECT)
      .eq('centro_id', centroId)
      .gte('fecha_inicio', start.toISOString())
      .lte('fecha_inicio', end.toISOString())
      .not('estado', 'in', '("cancelada","no_presentado")')
      .order('fecha_inicio', { ascending: true });

    if (error) throw new Error(error.message);

    return (data as unknown as ICitaAgendaRow[])
      .map(mapCitaRow)
      .filter((c): c is IAgendaRawCita => c !== null);
  }

  async fetchMonthCitas(
    centroId: TCentroId,
    year: number,
    month: number,
  ): Promise<readonly IAgendaRawCita[]> {
    const { start, end } = buildMonthRange(year, month);

    const { data, error } = await supabase
      .from('citas')
      .select(CITA_SELECT)
      .eq('centro_id', centroId)
      .gte('fecha_inicio', start.toISOString())
      .lte('fecha_inicio', end.toISOString())
      .not('estado', 'in', '("cancelada","no_presentado")')
      .order('fecha_inicio', { ascending: true });

    if (error) throw new Error(error.message);

    return (data as unknown as ICitaAgendaRow[])
      .map(mapCitaRow)
      .filter((c): c is IAgendaRawCita => c !== null);
  }

  async fetchTherapistWeekCitas(
    therapistId: TUserId,
    weekStart: Date,
  ): Promise<readonly IAgendaRawCita[]> {
    const { start, end } = buildWeekRange(weekStart);

    const { data, error } = await supabase
      .from('citas')
      .select(CITA_SELECT)
      .eq('usuario_id', therapistId)
      .gte('fecha_inicio', start.toISOString())
      .lte('fecha_inicio', end.toISOString())
      .order('fecha_inicio', { ascending: true });

    if (error) throw new Error(error.message);

    return (data as unknown as ICitaAgendaRow[])
      .map(mapCitaRow)
      .filter((c): c is IAgendaRawCita => c !== null);
  }

  async fetchDayUnassignedCitas(
    centroId: TCentroId,
    date: Date,
  ): Promise<readonly IAgendaRawCita[]> {
    const { start, end } = buildDayRange(date);

    // Fetch non-cancelled citas that are missing at least one of the three
    // required fields. PostgREST OR: usuario_id IS NULL OR sala_id IS NULL OR
    // cliente_id IS NULL — covers the full sin_asignar set regardless of which
    // field is missing.
    const { data, error } = await supabase
      .from('citas')
      .select(CITA_SELECT)
      .eq('centro_id', centroId)
      .gte('fecha_inicio', start.toISOString())
      .lte('fecha_inicio', end.toISOString())
      .neq('estado', 'cancelada')
      .or('usuario_id.is.null,sala_id.is.null,cliente_id.is.null')
      .order('fecha_inicio', { ascending: true });

    if (error) throw new Error(error.message);

    return (data as unknown as ICitaAgendaRow[])
      .map(mapCitaRow)
      .filter((c): c is IAgendaRawCita => c !== null);
  }
}
