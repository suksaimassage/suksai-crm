/**
 * useDashboardTopClientes.ts
 *
 * Fetches and aggregates top client data for the ClientPanel.
 *
 * Steps:
 *  1. Fetch all non-cancelled/no-show citas for the centro with client + price
 *  2. Group by cliente_id, compute LTV (sum of servicios.precio in euros) and visit count
 *  3. Tag: 'nuevo' if count < 3, 'frecuente' if count >= 5
 *  4. Sort by LTV desc, take top 10
 *  5. Fetch next future appointment for each of the top 10 clients
 *  6. Merge and return IDashboardClientRow[]
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseDashboardAdapter } from '@infra/adapters/SupabaseDashboardAdapter';
import type {
  IDashboardClientRow,
  TClientTag,
} from '@infra/pages/DashboardOverviewPage/DashboardOverviewPage.fixtures';
import type { TCentroId } from '@domain/types';

const dashboardAdapter = new SupabaseDashboardAdapter();

// ── Aggregation ───────────────────────────────────────────────────────────────

interface IClientAggregate {
  readonly clienteId: number;
  readonly nombre: string;
  readonly apellidos: string;
  readonly ltv: number;
  readonly visitCount: number;
}

function computeTags(visitCount: number): readonly TClientTag[] {
  const tags: TClientTag[] = [];
  if (visitCount < 3) tags.push('nuevo');
  if (visitCount >= 5) tags.push('frecuente');
  return tags;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface IUseDashboardTopClientesResult {
  readonly data: readonly IDashboardClientRow[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export const useDashboardTopClientes = (
  centroId: TCentroId | null,
): IUseDashboardTopClientesResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'top-clientes', centroId],
    queryFn: async () => {
      if (centroId === null) return [];

      // Step 1: Fetch citas with client + price
      const citasRaw = await dashboardAdapter.fetchTopClientData(centroId);

      // Step 2: Group by cliente_id
      const aggregateMap = new Map<number, IClientAggregate>();

      for (const row of citasRaw) {
        if (row.clientes === null) continue;

        const existing = aggregateMap.get(row.cliente_id);
        const price = row.servicios?.precio ?? 0;

        if (existing !== undefined) {
          aggregateMap.set(row.cliente_id, {
            ...existing,
            ltv: existing.ltv + price,
            visitCount: existing.visitCount + 1,
          });
        } else {
          aggregateMap.set(row.cliente_id, {
            clienteId: row.cliente_id,
            nombre: row.clientes.nombre,
            apellidos: row.clientes.apellidos ?? '',
            ltv: price,
            visitCount: 1,
          });
        }
      }

      // Step 3 + 4: Sort by LTV desc, take top 10
      const top10 = Array.from(aggregateMap.values())
        .sort((a, b) => b.ltv - a.ltv)
        .slice(0, 10);

      if (top10.length === 0) return [];

      // Step 5: Fetch most recent appointment per client (date label + service info)
      const top10Ids = top10.map((c) => c.clienteId);
      const lastAppts = await dashboardAdapter.fetchLastAppointmentsByClients(centroId, top10Ids);

      // Build map: clienteId → { fecha, servicio, sala } (first row = most recent, DESC order)
      const lastApptMap = new Map<
        number,
        { readonly fecha: string; readonly servicio: string | null; readonly sala: string | null }
      >();
      for (const appt of lastAppts) {
        if (!lastApptMap.has(appt.cliente_id)) {
          lastApptMap.set(appt.cliente_id, {
            fecha: appt.fecha_inicio ?? '',
            servicio: appt.servicios?.nombre ?? null,
            sala: appt.salas?.nombre ?? null,
          });
        }
      }

      // Step 6: Merge into IDashboardClientRow[]
      return top10.map((agg): IDashboardClientRow => {
        const last = lastApptMap.get(agg.clienteId);
        return {
          id: agg.clienteId,
          nombre: agg.nombre,
          apellidos: agg.apellidos,
          tags: computeTags(agg.visitCount),
          ltv: agg.ltv,
          lastAppointment: last?.fecha ?? null,
          lastAppointmentServicio: last?.servicio ?? null,
          lastAppointmentSala: last?.sala ?? null,
          numeroVisitas: agg.visitCount,
        };
      });
    },
    enabled: centroId !== null,
    staleTime: 300_000, // 5 min — top-client list is stable in the short term
  });

  return {
    data: data ?? [],
    isLoading,
    isError,
  };
};
