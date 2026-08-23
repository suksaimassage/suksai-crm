/**
 * useClientes.ts — React Query hook for the client list.
 *
 * Fetches paginated clients from Supabase with aggregated stats
 * (last visit, visit frequency, annual visits, favourite ritual).
 *
 * Query keys (hierarchical — all share the 'clientes' prefix so a single
 * invalidateQueries({ queryKey: ['clientes'] }) busts rows + KPI together):
 *   ['clientes', 'list', page, perPage, includeInactive]  — client rows + total
 *   ['clientes', 'kpi']                                   — KPI aggregate
 *
 * Stale times:
 *   rows: 120 s
 *   KPI:  300 s
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { SupabaseClienteAdapter } from '@infra/adapters/SupabaseClienteAdapter';
import { deriveSegmento } from '@infra/utils/clientes.utils';
import type { IClienteTableRow, IClientesKPIData } from '@infra/pages/ClientesPage/Clientes.types';
import type { IPaginationParams } from '@domain/types';

// ── Adapter singleton ─────────────────────────────────────────────────────────

const adapter = new SupabaseClienteAdapter();

// ── Row mapper ────────────────────────────────────────────────────────────────

// IClienteWithStats is the private type from SupabaseClienteAdapter — we
// replicate the shape here as a local structural type to avoid importing the
// private interface. The adapter's public return type is IPaginatedResult of
// the stats object, so we describe it inline.
interface IClienteStatsRow {
  readonly cliente: {
    readonly id: number;
    readonly nombre: string;
    readonly apellidos: string;
    readonly email: string | null;
    readonly telefono: string;
    readonly observaciones: string | null;
    readonly activo: boolean;
    readonly createdAt: Date;
  };
  readonly ultimaVisita: Date | null;
  readonly totalVisitasAnio: number;
  readonly frecuenciaVisitas: number;
  readonly ritualFavorito: string | null;
  readonly gastoAnual: number;
}

function toTableRow(stats: IClienteStatsRow): IClienteTableRow {
  const segmento = deriveSegmento(
    stats.cliente.activo,
    stats.gastoAnual,
    stats.cliente.createdAt,
    stats.ultimaVisita,
    stats.totalVisitasAnio,
  );

  return {
    clienteId: stats.cliente.id,
    nombreCompleto: `${stats.cliente.nombre} ${stats.cliente.apellidos}`.trim(),
    telefono: stats.cliente.telefono,
    email: stats.cliente.email,
    segmento,
    activo: stats.cliente.activo,
    ultimaVisita: stats.ultimaVisita,
    ritualFavorito: stats.ritualFavorito,
    duracionRitual: null,
    frecuenciaVisitas: stats.frecuenciaVisitas,
    gastoAnual: stats.gastoAnual,
    totalVisitasAnio: stats.totalVisitasAnio,
    createdAt: stats.cliente.createdAt,
  };
}

// ── Query key factory ─────────────────────────────────────────────────────────

/** Shared key factory — keeps all clientes keys under the 'clientes' prefix. */
export const CLIENTES_QUERY_KEYS = {
  all: ['clientes'] as const,
  list: (page: number, perPage: number, includeInactive: boolean) =>
    ['clientes', 'list', page, perPage, includeInactive] as const,
  kpi: () => ['clientes', 'kpi'] as const,
} as const;

// ── Hook params ───────────────────────────────────────────────────────────────

export interface IUseClientesParams extends IPaginationParams {
  readonly includeInactive?: boolean;
}

// ── Hook result ───────────────────────────────────────────────────────────────

export interface IUseClientesResult {
  readonly rows: readonly IClienteTableRow[];
  readonly total: number;
  readonly kpi: IClientesKPIData;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refetch: () => unknown;
}

// ── Fallback KPI shape ────────────────────────────────────────────────────────

const EMPTY_KPI: IClientesKPIData = {
  totalClientes: 0,
  nuevos30Dias: 0,
  recurrenciaPct: 0,
  gastoMedioCliente: 0,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useClientes(params: IUseClientesParams): IUseClientesResult {
  const includeInactive = params.includeInactive ?? false;

  const rowsQuery = useQuery({
    queryKey: CLIENTES_QUERY_KEYS.list(params.page, params.perPage, includeInactive),
    queryFn: () => adapter.findAllWithStats(params, includeInactive),
    // React Query memoizes the select transform — toTableRow objects are only
    // recreated when the underlying data reference changes (not on every render).
    select: (result) => ({
      data: result.data.map(toTableRow),
      total: result.total,
    }),
    staleTime: 120_000,
    // Keeps the previous page's data visible while the new page loads —
    // prevents the table from flickering to empty during pagination.
    placeholderData: keepPreviousData,
  });

  const kpiQuery = useQuery({
    queryKey: CLIENTES_QUERY_KEYS.kpi(),
    queryFn: () => adapter.findClienteKPI(),
    staleTime: 300_000,
  });

  return {
    rows: rowsQuery.data?.data ?? [],
    total: rowsQuery.data?.total ?? 0,
    kpi: kpiQuery.data ?? EMPTY_KPI,
    isLoading: rowsQuery.isLoading || kpiQuery.isLoading,
    isError: rowsQuery.isError || kpiQuery.isError,
    // refetch is exposed for the error banner retry path only —
    // mutation hooks own cache invalidation on the success path.
    refetch: () => {
      void rowsQuery.refetch();
      void kpiQuery.refetch();
    },
  };
}
