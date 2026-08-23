import { supabase } from './supabase.client';
import { buildPaginatedResult } from './pagination.helper';
import type { IClientesRow } from './database.types';
import type { IClienteRepositoryPort } from '@domain/ports';
import type { ICliente, ICreateClienteDTO, IUpdateClienteDTO } from '@domain/models';
import type { TClienteId, IPaginationParams, IPaginatedResult } from '@domain/types';
import type { IClientesKPIData } from '@infra/pages/ClientesPage/Clientes.types';

// ── Private aggregate type (adapter-internal only) ────────────────────────────

interface IClienteWithStats {
  readonly cliente: ICliente;
  readonly ultimaVisita: Date | null;
  readonly totalVisitasAnio: number;
  /** Average visits per month over last 180 days (6-month rolling window), 1 decimal. */
  readonly frecuenciaVisitas: number;
  /** Most frequent service TYPE name (tipo_servicios.nombre) in the last 12 months. */
  readonly ritualFavorito: string | null;
  /** Always 0 until pagos table is migrated. */
  readonly gastoAnual: number;
}

export class SupabaseClienteAdapter implements IClienteRepositoryPort {
  #toModel(row: IClientesRow): ICliente {
    return {
      id: row.id,
      nombre: row.nombre,
      apellidos: row.apellidos ?? '',
      email: row.email,
      telefono: row.telefono ?? '',
      fechaNacimiento: null,
      observaciones: row.observaciones,
      activo: row.activo ?? true,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at),
    };
  }

  async findById(id: TClienteId): Promise<ICliente | null> {
    const result = await supabase
      .from('clientes')
      .select('id, nombre, apellidos, email, telefono, observaciones, activo, created_at')
      .eq('id', id)
      .maybeSingle();
    if (result.error !== null) throw new Error(result.error.message);
    const row = result.data;
    return row !== null ? this.#toModel(row) : null;
  }

  async findByEmail(email: string): Promise<ICliente | null> {
    const result = await supabase
      .from('clientes')
      .select('id, nombre, apellidos, email, telefono, observaciones, activo, created_at')
      .eq('email', email)
      .maybeSingle();
    if (result.error !== null) throw new Error(result.error.message);
    const row = result.data;
    return row !== null ? this.#toModel(row) : null;
  }

  async findByTelefono(telefono: string): Promise<ICliente | null> {
    const result = await supabase
      .from('clientes')
      .select('id, nombre, apellidos, email, telefono, observaciones, activo, created_at')
      .eq('telefono', telefono)
      .maybeSingle();
    if (result.error !== null) throw new Error(result.error.message);
    const row = result.data;
    return row !== null ? this.#toModel(row) : null;
  }

  async findAll(params?: IPaginationParams): Promise<IPaginatedResult<ICliente>> {
    const perPage = params?.perPage ?? 50;
    const page = params?.page ?? 1;
    const result = await supabase
      .from('clientes')
      .select('id, nombre, apellidos, email, telefono, observaciones, activo, created_at', {
        count: 'exact',
      })
      .range((page - 1) * perPage, page * perPage - 1);
    if (result.error !== null) throw new Error(result.error.message);
    const rows = result.data as IClientesRow[];
    return buildPaginatedResult(
      rows.map((r) => this.#toModel(r)),
      result.count,
      params,
    );
  }

  async search(query: string): Promise<readonly ICliente[]> {
    const result = await supabase
      .from('clientes')
      .select('id, nombre, apellidos, email, telefono, observaciones, activo, created_at')
      .or(
        'nombre.ilike.%' + query + '%,apellidos.ilike.%' + query + '%,email.ilike.%' + query + '%',
      );
    if (result.error !== null) throw new Error(result.error.message);
    return (result.data as IClientesRow[]).map((r) => this.#toModel(r));
  }

  async create(data: ICreateClienteDTO): Promise<ICliente> {
    const result = await supabase
      .from('clientes')
      .insert({
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email ?? null,
        telefono: data.telefono || null,
        observaciones: null,
      })
      .select('id, nombre, apellidos, email, telefono, observaciones, activo, created_at')
      .single();
    if (result.error !== null) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async update(id: TClienteId, data: IUpdateClienteDTO): Promise<ICliente> {
    const patch: {
      nombre?: string;
      apellidos?: string | null;
      email?: string | null;
      telefono?: string | null;
      observaciones?: string | null;
    } = {};
    if (data.nombre !== undefined) patch.nombre = data.nombre;
    if (data.apellidos !== undefined) patch.apellidos = data.apellidos;
    if (data.email !== undefined) patch.email = data.email;
    if (data.telefono !== undefined) patch.telefono = data.telefono || null;
    if (data.observaciones !== undefined) patch.observaciones = data.observaciones;

    const result = await supabase
      .from('clientes')
      .update(patch)
      .eq('id', id)
      .select('id, nombre, apellidos, email, telefono, observaciones, activo, created_at')
      .single();
    if (result.error !== null) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async deactivate(id: TClienteId): Promise<void> {
    const result = await supabase.from('clientes').update({ activo: false }).eq('id', id);
    if (result.error !== null) throw new Error(result.error.message);
  }

  async reactivate(id: TClienteId): Promise<void> {
    const result = await supabase.from('clientes').update({ activo: true }).eq('id', id);
    if (result.error !== null) throw new Error(result.error.message);
  }

  async deactivateWithCancellation(id: TClienteId): Promise<number> {
    const deactivateResult = await supabase.from('clientes').update({ activo: false }).eq('id', id);
    if (deactivateResult.error !== null) throw new Error(deactivateResult.error.message);

    const now = new Date().toISOString();
    const cancelResult = await supabase
      .from('citas')
      .update({ estado: 'cancelada' })
      .eq('cliente_id', id)
      .gt('fecha_inicio', now)
      .not('estado', 'in', '("cancelada","completada","no_presentado")');
    if (cancelResult.error !== null) throw new Error(cancelResult.error.message);

    return cancelResult.count ?? 0;
  }

  // ── Batch-aggregate query for the client list with stats ──────────────────

  async findAllWithStats(
    params: IPaginationParams,
    includeInactive = false,
  ): Promise<IPaginatedResult<IClienteWithStats>> {
    const perPage = params.perPage;
    const page = params.page;

    // Step 1 — fetch the page of clients
    // When includeInactive=false we show only active clients; when true we show
    // ALL clients (active + inactive). The old code always applied a .eq() filter
    // which made includeInactive=true still return only inactive rows — bug fixed.
    let pageQuery = supabase
      .from('clientes')
      .select('id, nombre, apellidos, email, telefono, observaciones, activo, created_at', {
        count: 'exact',
      });

    if (!includeInactive) {
      pageQuery = pageQuery.eq('activo', true);
    }

    const pageResult = await pageQuery.range((page - 1) * perPage, page * perPage - 1);

    if (pageResult.error !== null) throw new Error(pageResult.error.message);

    const clientes = (pageResult.data as IClientesRow[]).map((r) => this.#toModel(r));

    if (clientes.length === 0) {
      return buildPaginatedResult([], pageResult.count, params);
    }

    const pageClientIds = clientes.map((c) => c.id);

    // Step 2 — time boundaries
    const now = new Date();
    const oneHundredEightyDaysAgo = new Date(
      now.getTime() - 180 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    // Step 3 — three parallel cita queries + one view query (replaces the old Q4
    // which was an unbounded full-table scan for ultimaVisita).
    // Q4 is now served by the suksai.clientes_ultima_visita view (server-side MAX).
    // Requires migration 005_clientes_stats_aggregates.sql to be applied.
    const nowIso = now.toISOString();
    const [q1, q2, q3, q4] = await Promise.all([
      // Q1: last-180-days past non-cancelled (for frecuenciaVisitas — rolling 6-month window)
      supabase
        .from('citas')
        .select('cliente_id, fecha_inicio')
        .in('cliente_id', pageClientIds)
        .not('estado', 'in', '("cancelada","no_presentado")')
        .gte('fecha_inicio', oneHundredEightyDaysAgo)
        .lte('fecha_inicio', nowIso),
      // Q2: year-to-date past non-cancelled (for totalVisitasAnio + gastoAnual)
      supabase
        .from('citas')
        .select('cliente_id, servicios(precio)')
        .in('cliente_id', pageClientIds)
        .not('estado', 'in', '("cancelada","no_presentado")')
        .gte('fecha_inicio', startOfYear)
        .lte('fecha_inicio', nowIso),
      // Q3: last-12-months past non-cancelled with servicio_id (for ritualFavorito)
      supabase
        .from('citas')
        .select('cliente_id, servicio_id')
        .in('cliente_id', pageClientIds)
        .not('estado', 'in', '("cancelada","no_presentado")')
        .gte('fecha_inicio', twelveMonthsAgo)
        .lte('fecha_inicio', nowIso)
        .not('servicio_id', 'is', null),
      // Q4: ultimaVisita from the server-side view — no JS max() needed.
      // Migration 005 must be applied before this query works.
      supabase
        .from('clientes_ultima_visita')
        .select('cliente_id, ultima_visita')
        .in('cliente_id', pageClientIds),
    ]);

    if (q1.error !== null) throw new Error(q1.error.message);
    if (q2.error !== null) throw new Error(q2.error.message);
    if (q3.error !== null) throw new Error(q3.error.message);
    if (q4.error !== null) throw new Error(q4.error.message);

    // Step 4 — build aggregate maps from Q1 rows (frecuenciaVisitas only)
    const q1Map = new Map<number, { count: number }>();
    for (const row of q1.data as { cliente_id: number; fecha_inicio: string | null }[]) {
      if (row.fecha_inicio === null) continue;
      const existing = q1Map.get(row.cliente_id);
      if (existing === undefined) {
        q1Map.set(row.cliente_id, { count: 1 });
      } else {
        existing.count += 1;
      }
    }

    // Q4 map: cliente_id → ultima_visita from the view (already the MAX at DB level)
    const q4Map = new Map<number, Date>();
    for (const row of q4.data as { cliente_id: number; ultima_visita: string | null }[]) {
      if (row.ultima_visita === null) continue;
      q4Map.set(row.cliente_id, new Date(row.ultima_visita));
    }

    // Q2 map: cliente_id → { count, gastoAnual }
    const q2Map = new Map<number, { count: number; gasto: number }>();
    for (const row of q2.data as {
      cliente_id: number;
      servicios: { precio: number | null } | null;
    }[]) {
      const existing = q2Map.get(row.cliente_id);
      const precio = row.servicios?.precio ?? 0;
      if (existing === undefined) {
        q2Map.set(row.cliente_id, { count: 1, gasto: precio });
      } else {
        existing.count += 1;
        existing.gasto += precio;
      }
    }

    // Q3 map: cliente_id → Map<servicio_id, frequency>
    const q3Map = new Map<number, Map<number, number>>();
    for (const row of q3.data as { cliente_id: number; servicio_id: number | null }[]) {
      if (row.servicio_id === null) continue;
      let servicioFreq = q3Map.get(row.cliente_id);
      if (servicioFreq === undefined) {
        servicioFreq = new Map<number, number>();
        q3Map.set(row.cliente_id, servicioFreq);
      }
      servicioFreq.set(row.servicio_id, (servicioFreq.get(row.servicio_id) ?? 0) + 1);
    }

    // Step 5 — determine the winning servicio_id per client, then resolve to tipo_servicio name
    const winningServicioPerClient = new Map<number, number>();
    const winningServicioIds = new Set<number>();

    for (const clienteId of pageClientIds) {
      const servicioFreq = q3Map.get(clienteId);
      if (servicioFreq === undefined || servicioFreq.size === 0) continue;

      let maxCount = 0;
      let winningId = 0;
      for (const [servicioId, count] of servicioFreq) {
        if (count > maxCount) {
          maxCount = count;
          winningId = servicioId;
        }
      }
      if (winningId !== 0) {
        winningServicioPerClient.set(clienteId, winningId);
        winningServicioIds.add(winningId);
      }
    }

    // Resolve servicio_id → tipo_servicio FK (a plain column on servicios)
    const servicioTipoMap = new Map<number, number>();
    if (winningServicioIds.size > 0) {
      const serviciosResult = await supabase
        .from('servicios')
        .select('id, tipo_servicio')
        .in('id', [...winningServicioIds]);
      if (serviciosResult.error !== null) throw new Error(serviciosResult.error.message);
      for (const row of serviciosResult.data as { id: number; tipo_servicio: number }[]) {
        servicioTipoMap.set(row.id, row.tipo_servicio);
      }
    }

    // Resolve tipo_servicio IDs → nombre
    const winningTipoIds = new Set(
      [...winningServicioPerClient.values()]
        .map((sId) => servicioTipoMap.get(sId))
        .filter((t): t is number => t !== undefined),
    );
    const tipoServicioNombreMap = new Map<number, string>();
    if (winningTipoIds.size > 0) {
      const tipoResult = await supabase
        .from('tipo_servicios')
        .select('id, nombre')
        .in('id', [...winningTipoIds]);
      if (tipoResult.error !== null) throw new Error(tipoResult.error.message);
      for (const row of tipoResult.data as { id: number; nombre: string }[]) {
        tipoServicioNombreMap.set(row.id, row.nombre);
      }
    }

    // Step 6 — assemble IClienteWithStats[]
    const stats: IClienteWithStats[] = clientes.map((cliente) => {
      const q1Entry = q1Map.get(cliente.id);
      // q4Map value is now a Date directly (server-side MAX, no JS comparison needed)
      const ultimaVisita = q4Map.get(cliente.id) ?? null;
      const winningServicioId = winningServicioPerClient.get(cliente.id);
      const q2Entry = q2Map.get(cliente.id);

      const tipoId =
        winningServicioId !== undefined ? servicioTipoMap.get(winningServicioId) : undefined;
      return {
        cliente,
        ultimaVisita,
        totalVisitasAnio: q2Entry?.count ?? 0,
        frecuenciaVisitas: Number(((q1Entry?.count ?? 0) / 6).toFixed(1)),
        ritualFavorito: tipoId !== undefined ? (tipoServicioNombreMap.get(tipoId) ?? null) : null,
        gastoAnual: q2Entry?.gasto ?? 0,
      };
    });

    return buildPaginatedResult(stats, pageResult.count, params);
  }

  // ── KPI aggregate query ───────────────────────────────────────────────────

  async findClienteKPI(): Promise<IClientesKPIData> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [kpiQ1, kpiQ2, kpiQ3, kpiQ4] = await Promise.all([
      // kpiQ1: total active+inactive clientes count
      supabase.from('clientes').select('*', { count: 'exact', head: true }),
      // kpiQ2: nuevos 30-day count
      supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo),
      // kpiQ3: recurrenciaPct (0-100) — server-side via RPC.
      // The RPC computes the full percentage (numerator + denominator at DB level),
      // replacing the unbounded system-wide citas download from before.
      // Requires migration 005_clientes_stats_aggregates.sql.
      supabase.rpc('kpi_recurrencia_90d'),
      // kpiQ4: all completed citas with service prices — for gastoMedioCliente.
      // Non-fatal: errors fall back to 0.
      supabase.from('citas').select('cliente_id, servicios(precio)').eq('estado', 'completada'),
    ]);

    if (kpiQ1.error !== null) throw new Error(kpiQ1.error.message);
    if (kpiQ2.error !== null) throw new Error(kpiQ2.error.message);
    if (kpiQ3.error !== null) throw new Error(kpiQ3.error.message);
    // kpiQ4 errors are non-fatal: fall back to gastoMedioCliente = 0

    const totalClientes = kpiQ1.count ?? 0;
    const nuevos30Dias = kpiQ2.count ?? 0;
    // RPC returns the recurrenciaPct value (0-100) directly — no JS computation needed.
    const recurrenciaPct = typeof kpiQ3.data === 'number' ? kpiQ3.data : 0;

    // gastoMedioCliente — average total spending across clients with ≥1 completed cita
    let gastoMedioCliente = 0;
    if (kpiQ4.error === null) {
      const gastoPorCliente = new Map<number, number>();
      for (const row of kpiQ4.data as {
        cliente_id: number;
        servicios: { precio: number | null } | null;
      }[]) {
        const precio = row.servicios?.precio ?? 0;
        if (precio > 0) {
          gastoPorCliente.set(row.cliente_id, (gastoPorCliente.get(row.cliente_id) ?? 0) + precio);
        }
      }
      const totales = [...gastoPorCliente.values()];
      if (totales.length > 0) {
        const avg = totales.reduce((s, g) => s + g, 0) / totales.length;
        gastoMedioCliente = Math.round(avg * 100) / 100;
      }
    }

    return {
      totalClientes,
      nuevos30Dias,
      recurrenciaPct,
      gastoMedioCliente,
    };
  }
}
