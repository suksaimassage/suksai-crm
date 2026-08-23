import { supabase } from './supabase.client';
import { buildPaginatedResult } from './pagination.helper';
import type { ICitasRow, ICitaEnrichadaRow } from './database.types';
import type { ICitaRepositoryPort } from '@domain/ports';
import type { ICita, ICreateCitaDTO, IUpdateCitaDTO, IUpdateCitaEstadoDTO } from '@domain/models';
import type {
  TCitaId,
  TCentroId,
  TClienteId,
  TUserId,
  TSalaId,
  TServicioId,
  TEstadoCita,
  IPaginationParams,
  IPaginatedResult,
  IDateRangeFilter,
} from '@domain/types';
import type { ICitaEnriquecida } from '@infra/pages/ClientesPage/Clientes.types';

export class SupabaseCitaAdapter implements ICitaRepositoryPort {
  #toModel(row: ICitasRow): ICita {
    return {
      id: row.id,
      clienteId: row.cliente_id, // null when no client is assigned
      usuarioId: row.usuario_id, // null when no therapist is assigned
      centroId: row.centro_id,
      salaId: row.sala_id, // null when no room is assigned
      servicioId: row.servicio_id,
      fechaHoraInicio: new Date(row.fecha_inicio),
      fechaHoraFin: new Date(row.fecha_fin),
      estado: (row.estado ?? 'sin_asignar') as TEstadoCita,
      precioFinal: 0,
      notas: row.observaciones,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at),
    };
  }

  async findById(id: TCitaId): Promise<ICita | null> {
    const result = await supabase
      .from('citas')
      .select(
        'id, usuario_id, centro_id, sala_id, servicio_id, cliente_id, fecha_inicio, fecha_fin, estado, observaciones, created_at',
      )
      .eq('id', id)
      .maybeSingle();
    if (result.error !== null) throw new Error(result.error.message);
    const row = result.data;
    return row !== null ? this.#toModel(row) : null;
  }

  async findByCentroAndFecha(centroId: TCentroId, fecha: Date): Promise<readonly ICita[]> {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    const nextDay = new Date(startOfDay);
    nextDay.setDate(nextDay.getDate() + 1);

    const result = await supabase
      .from('citas')
      .select(
        'id, usuario_id, centro_id, sala_id, servicio_id, cliente_id, fecha_inicio, fecha_fin, estado, observaciones, created_at',
      )
      .eq('centro_id', centroId)
      .gte('fecha_inicio', startOfDay.toISOString())
      .lt('fecha_inicio', nextDay.toISOString());
    if (result.error !== null) throw new Error(result.error.message);
    return (result.data as ICitasRow[]).map((r) => this.#toModel(r));
  }

  async findByCliente(
    clienteId: TClienteId,
    params?: IPaginationParams,
  ): Promise<IPaginatedResult<ICita>> {
    const perPage = params?.perPage ?? 50;
    const page = params?.page ?? 1;
    const result = await supabase
      .from('citas')
      .select(
        'id, usuario_id, centro_id, sala_id, servicio_id, cliente_id, fecha_inicio, fecha_fin, estado, observaciones, created_at',
        { count: 'exact' },
      )
      .eq('cliente_id', clienteId)
      .range((page - 1) * perPage, page * perPage - 1);
    if (result.error !== null) throw new Error(result.error.message);
    const rows = result.data as ICitasRow[];
    return buildPaginatedResult(
      rows.map((r) => this.#toModel(r)),
      result.count,
      params,
    );
  }

  async findByUsuario(usuarioId: TUserId, range: IDateRangeFilter): Promise<readonly ICita[]> {
    const result = await supabase
      .from('citas')
      .select(
        'id, usuario_id, centro_id, sala_id, servicio_id, cliente_id, fecha_inicio, fecha_fin, estado, observaciones, created_at',
      )
      .eq('usuario_id', usuarioId)
      .gte('fecha_inicio', range.from.toISOString())
      .lte('fecha_inicio', range.to.toISOString());
    if (result.error !== null) throw new Error(result.error.message);
    return (result.data as ICitasRow[]).map((r) => this.#toModel(r));
  }

  async findBySala(salaId: TSalaId, fecha: Date): Promise<readonly ICita[]> {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    const nextDay = new Date(startOfDay);
    nextDay.setDate(nextDay.getDate() + 1);

    const result = await supabase
      .from('citas')
      .select(
        'id, usuario_id, centro_id, sala_id, servicio_id, cliente_id, fecha_inicio, fecha_fin, estado, observaciones, created_at',
      )
      .eq('sala_id', salaId)
      .gte('fecha_inicio', startOfDay.toISOString())
      .lt('fecha_inicio', nextDay.toISOString());
    if (result.error !== null) throw new Error(result.error.message);
    return (result.data as ICitasRow[]).map((r) => this.#toModel(r));
  }

  async findByCentroAndRange(
    centroId: TCentroId,
    range: IDateRangeFilter,
  ): Promise<readonly ICita[]> {
    const result = await supabase
      .from('citas')
      .select(
        'id, usuario_id, centro_id, sala_id, servicio_id, cliente_id, fecha_inicio, fecha_fin, estado, observaciones, created_at',
      )
      .eq('centro_id', centroId)
      .gte('fecha_inicio', range.from.toISOString())
      .lte('fecha_inicio', range.to.toISOString());
    if (result.error !== null) throw new Error(result.error.message);
    return (result.data as ICitasRow[]).map((r) => this.#toModel(r));
  }

  async findByEstado(estado: TEstadoCita, centroId?: TCentroId): Promise<readonly ICita[]> {
    let query = supabase
      .from('citas')
      .select(
        'id, usuario_id, centro_id, sala_id, servicio_id, cliente_id, fecha_inicio, fecha_fin, estado, observaciones, created_at',
      )
      .eq('estado', estado);

    if (centroId !== undefined) {
      query = query.eq('centro_id', centroId);
    }

    const result = await query;
    if (result.error !== null) throw new Error(result.error.message);
    return (result.data as ICitasRow[]).map((r) => this.#toModel(r));
  }

  async create(data: ICreateCitaDTO): Promise<ICita> {
    const result = await supabase
      .from('citas')
      .insert({
        // Omit nulls from the payload so the DB column remains NULL (not 0/undefined).
        ...(data.usuarioId != null ? { usuario_id: data.usuarioId } : {}),
        centro_id: data.centroId,
        ...(data.salaId != null ? { sala_id: data.salaId } : {}),
        servicio_id: data.servicioId,
        ...(data.clienteId != null ? { cliente_id: data.clienteId } : {}),
        fecha_inicio: data.fechaHoraInicio.toISOString(),
        fecha_fin: data.fechaHoraFin.toISOString(),
        // estado is set by CitaService.schedule; default to 'sin_asignar' as safety net
        estado: data.estado ?? 'sin_asignar',
        observaciones: data.notas ?? null,
      })
      .select(
        'id, usuario_id, centro_id, sala_id, servicio_id, cliente_id, fecha_inicio, fecha_fin, estado, observaciones, created_at',
      )
      .single();
    if (result.error !== null) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async update(id: TCitaId, data: IUpdateCitaDTO): Promise<ICita> {
    // Build a patch with only the columns the caller actually changed. The
    // `citas` table has no price column, so precioFinal is never persisted here.
    // Nullable fields (cliente_id, usuario_id, sala_id) may be explicitly set to
    // null to clear an assignment — undefined means "no change".
    const patch: {
      cliente_id?: TClienteId | null;
      usuario_id?: TUserId | null;
      sala_id?: TSalaId | null;
      servicio_id?: TServicioId;
      fecha_inicio?: string;
      fecha_fin?: string;
      observaciones?: string | null;
    } = {};

    if ('clienteId' in data) patch.cliente_id = data.clienteId ?? null;
    if ('usuarioId' in data) patch.usuario_id = data.usuarioId ?? null;
    if ('salaId' in data) patch.sala_id = data.salaId ?? null;
    if (data.servicioId !== undefined) patch.servicio_id = data.servicioId;
    if (data.fechaHoraInicio !== undefined) patch.fecha_inicio = data.fechaHoraInicio.toISOString();
    if (data.fechaHoraFin !== undefined) patch.fecha_fin = data.fechaHoraFin.toISOString();
    if (data.notas !== undefined) patch.observaciones = data.notas;

    const result = await supabase
      .from('citas')
      .update(patch)
      .eq('id', id)
      .select(
        'id, usuario_id, centro_id, sala_id, servicio_id, cliente_id, fecha_inicio, fecha_fin, estado, observaciones, created_at',
      )
      .single();
    if (result.error !== null) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async updateEstado(data: IUpdateCitaEstadoDTO): Promise<ICita> {
    const result = await supabase
      .from('citas')
      .update({ estado: data.estado })
      .eq('id', data.id)
      .select(
        'id, usuario_id, centro_id, sala_id, servicio_id, cliente_id, fecha_inicio, fecha_fin, estado, observaciones, created_at',
      )
      .single();
    if (result.error !== null) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async cancel(id: TCitaId, motivo?: string): Promise<void> {
    const result = await supabase
      .from('citas')
      .update({ estado: 'cancelada', observaciones: motivo ?? null })
      .eq('id', id);
    if (result.error !== null) throw new Error(result.error.message);
  }

  // ── Enriched cita query for the client detail panel ───────────────────────

  async findEnrichedByCliente(
    clienteId: TClienteId,
    options: { limit: number; onlyFuture?: boolean; onlyPast?: boolean },
  ): Promise<readonly ICitaEnriquecida[]> {
    // Step 1 — fetch base citas (no nested selects — FK traversal not confirmed)
    let query = supabase
      .from('citas')
      .select('id, fecha_inicio, fecha_fin, estado, servicio_id, sala_id, usuario_id')
      .eq('cliente_id', clienteId)
      .order('fecha_inicio', { ascending: options.onlyFuture ?? false })
      .limit(options.limit);

    if (options.onlyFuture === true) {
      query = query
        .in('estado', ['pendiente', 'confirmada'])
        .gt('fecha_inicio', new Date().toISOString());
    } else if (options.onlyPast === true) {
      query = query.eq('estado', 'completada').lt('fecha_inicio', new Date().toISOString());
    }

    const citasResult = await query;
    if (citasResult.error !== null) throw new Error(citasResult.error.message);

    const rows = citasResult.data as ICitaEnrichadaRow[];

    // Filter out rows with null dates before any further processing
    const validRows = rows.filter(
      (r): r is ICitaEnrichadaRow & { fecha_inicio: string; fecha_fin: string } =>
        r.fecha_inicio !== null && r.fecha_fin !== null,
    );

    if (validRows.length === 0) return [];

    // Step 2 — collect unique IDs for related entities
    const servicioIds = new Set<number>();
    const salaIds = new Set<number>();
    const usuarioIds = new Set<number>();

    for (const row of validRows) {
      if (row.servicio_id !== null) servicioIds.add(row.servicio_id);
      if (row.sala_id !== null) salaIds.add(row.sala_id);
      if (row.usuario_id !== null) usuarioIds.add(row.usuario_id);
    }

    // Step 3 — fetch names in parallel (empty sets skip the query)
    const [serviciosRes, salasRes, usuariosRes] = await Promise.all([
      servicioIds.size > 0
        ? supabase
            .from('servicios')
            .select('id, nombre')
            .in('id', [...servicioIds])
        : Promise.resolve({ data: [], error: null }),
      salaIds.size > 0
        ? supabase
            .from('salas')
            .select('id, nombre')
            .in('id', [...salaIds])
        : Promise.resolve({ data: [], error: null }),
      usuarioIds.size > 0
        ? supabase
            .from('usuarios')
            .select('id, nombre')
            .in('id', [...usuarioIds])
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (serviciosRes.error !== null) throw new Error(serviciosRes.error.message);
    if (salasRes.error !== null) throw new Error(salasRes.error.message);
    if (usuariosRes.error !== null) throw new Error(usuariosRes.error.message);

    // Step 4 — build lookup maps
    const servicioMap = new Map<number, string>();
    for (const row of serviciosRes.data as { id: number; nombre: string }[]) {
      servicioMap.set(row.id, row.nombre);
    }

    const salaMap = new Map<number, string>();
    for (const row of salasRes.data as { id: number; nombre: string }[]) {
      salaMap.set(row.id, row.nombre);
    }

    const usuarioMap = new Map<number, string>();
    for (const row of usuariosRes.data as { id: number; nombre: string }[]) {
      usuarioMap.set(row.id, row.nombre);
    }

    // Step 5 — map to ICitaEnriquecida
    return validRows.map((row) => {
      const inicio = new Date(row.fecha_inicio);
      const fin = new Date(row.fecha_fin);
      const duracionMinutos = Math.round((fin.getTime() - inicio.getTime()) / 60_000);

      return {
        citaId: row.id,
        fechaHoraInicio: inicio,
        fechaHoraFin: fin,
        estado: (row.estado ?? 'pendiente') as TEstadoCita,
        servicioNombre:
          row.servicio_id !== null
            ? (servicioMap.get(row.servicio_id) ?? 'Servicio desconocido')
            : 'Servicio desconocido',
        duracionMinutos,
        salaNombre:
          row.sala_id !== null
            ? (salaMap.get(row.sala_id) ?? 'Sala desconocida')
            : 'Sala desconocida',
        terapeutaNombre:
          row.usuario_id !== null
            ? (usuarioMap.get(row.usuario_id) ?? 'Terapeuta desconocido')
            : 'Terapeuta desconocido',
        valoracion: null,
      };
    });
  }

  // ── Active cita counts for delete-guard checks ───────────────────────────

  async countActiveCitasByUsuario(usuarioId: TUserId, from: Date, to: Date): Promise<number> {
    const result = await supabase
      .from('citas')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId)
      .in('estado', ['pendiente', 'confirmada', 'en_curso'])
      .gte('fecha_inicio', from.toISOString())
      .lte('fecha_inicio', to.toISOString());
    if (result.error !== null) throw new Error(result.error.message);
    return result.count ?? 0;
  }

  async countActiveCitasBySala(salaId: TSalaId, from: Date, to: Date): Promise<number> {
    const result = await supabase
      .from('citas')
      .select('*', { count: 'exact', head: true })
      .eq('sala_id', salaId)
      .in('estado', ['pendiente', 'confirmada', 'en_curso'])
      .gte('fecha_inicio', from.toISOString())
      .lte('fecha_inicio', to.toISOString());
    if (result.error !== null) throw new Error(result.error.message);
    return result.count ?? 0;
  }

  // ── Year-to-date visit count (used by useClienteDetalle) ─────────────────

  async countYTDByCliente(clienteId: TClienteId, startOfYear: string): Promise<number> {
    const result = await supabase
      .from('citas')
      .select('*', { count: 'exact', head: true })
      .eq('cliente_id', clienteId)
      .eq('estado', 'completada')
      .gte('fecha_inicio', startOfYear);

    if (result.error !== null) throw new Error(result.error.message);
    return result.count ?? 0;
  }

  // ── Future cita count for deactivation guard ──────────────────────────────

  /** Sum of completed cita service prices for a client since `startOfYear`. */
  async sumYTDGastoByCliente(clienteId: TClienteId, startOfYear: string): Promise<number> {
    const result = await supabase
      .from('citas')
      .select('servicios(precio)')
      .eq('cliente_id', clienteId)
      .eq('estado', 'completada')
      .gte('fecha_inicio', startOfYear);
    if (result.error !== null) return 0; // non-fatal: show 0 on failure
    const rows = result.data as unknown as { servicios: { precio: number | null } | null }[];
    return rows.reduce((sum, r) => sum + (r.servicios?.precio ?? 0), 0);
  }

  async countFutureCitas(clienteId: TClienteId, from: Date): Promise<number> {
    const result = await supabase
      .from('citas')
      .select('*', { count: 'exact', head: true })
      .eq('cliente_id', clienteId)
      .in('estado', ['pendiente', 'confirmada', 'en_curso'])
      .gt('fecha_inicio', from.toISOString());
    if (result.error !== null) throw new Error(result.error.message);
    return result.count ?? 0;
  }

  // ── Unassigned citas for a given centro + date ────────────────────────────

  /**
   * Returns non-cancelled citas for a centro on a given date where at least one
   * of usuario_id / sala_id / cliente_id is NULL (estado = 'sin_asignar').
   * Uses three OR-conditions via PostgREST `.or()`.
   */
  async fetchUnassigned(centroId: TCentroId, fecha: Date): Promise<readonly ICita[]> {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    const nextDay = new Date(startOfDay);
    nextDay.setDate(nextDay.getDate() + 1);

    const result = await supabase
      .from('citas')
      .select(
        'id, usuario_id, centro_id, sala_id, servicio_id, cliente_id, fecha_inicio, fecha_fin, estado, observaciones, created_at',
      )
      .eq('centro_id', centroId)
      .gte('fecha_inicio', startOfDay.toISOString())
      .lt('fecha_inicio', nextDay.toISOString())
      .neq('estado', 'cancelada')
      .or('usuario_id.is.null,sala_id.is.null,cliente_id.is.null');

    if (result.error !== null) throw new Error(result.error.message);
    return (result.data as ICitasRow[]).map((r) => this.#toModel(r));
  }

  /** Total non-cancelled/no-show citas in a given month for a centro. */
  async countReservasMes(centroId: TCentroId, year: number, month: number): Promise<number> {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const result = await supabase
      .from('citas')
      .select('*', { count: 'exact', head: true })
      .eq('centro_id', centroId)
      .gte('fecha_inicio', start.toISOString())
      .lte('fecha_inicio', end.toISOString())
      .not('estado', 'in', '("cancelada","no_presentado")');
    if (result.error !== null) throw new Error(result.error.message);
    return result.count ?? 0;
  }
}
