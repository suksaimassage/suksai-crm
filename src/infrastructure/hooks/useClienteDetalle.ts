/**
 * useClienteDetalle.ts — React Query hook for the client detail panel.
 *
 * Fetches ICliente + enriched ICitaEnriquecida[] for the selected client
 * and composes them into IClienteDetalle. No mock fallback — all data is live.
 *
 * Query key:  ['cliente-detalle', clienteId]
 * Stale time: 60 s
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseClienteAdapter } from '@infra/adapters/SupabaseClienteAdapter';
import { SupabaseCitaAdapter } from '@infra/adapters/SupabaseCitaAdapter';
import { deriveSegmento } from '@infra/utils/clientes.utils';
import type { IClienteDetalle } from '@infra/pages/ClientesPage/Clientes.types';
import type { TClienteId } from '@domain/types';

// ── Adapter singletons ────────────────────────────────────────────────────────

const clienteAdapter = new SupabaseClienteAdapter();
const citaAdapter = new SupabaseCitaAdapter();

// ── Hook result ───────────────────────────────────────────────────────────────

export interface IUseClienteDetalleResult {
  readonly detalle: IClienteDetalle | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refetch: () => unknown;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useClienteDetalle(clienteId: TClienteId | null): IUseClienteDetalleResult {
  const query = useQuery({
    queryKey: ['cliente-detalle', clienteId] as const,
    enabled: clienteId !== null,
    staleTime: 60_000,
    queryFn: async (): Promise<IClienteDetalle> => {
      // `enabled` guard prevents execution when null, but TypeScript needs
      // a runtime check for type narrowing inside the async function.
      if (clienteId === null) throw new Error('clienteId is null');

      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

      // Fetch all data in parallel — gastoAnio from citas service prices (no pagos table yet)
      const [cliente, proximaCitaArr, citasRecientes, visitCount, gastoAnio] = await Promise.all([
        clienteAdapter.findById(clienteId),
        citaAdapter.findEnrichedByCliente(clienteId, { limit: 1, onlyFuture: true }),
        citaAdapter.findEnrichedByCliente(clienteId, { limit: 5, onlyPast: true }),
        citaAdapter.countYTDByCliente(clienteId, startOfYear),
        citaAdapter.sumYTDGastoByCliente(clienteId, startOfYear),
      ]);

      if (cliente === null) throw new Error(`Cliente ${clienteId} not found`);

      // Derive the last visit from citasRecientes (most recent past completed)
      const ultimaVisita = citasRecientes.length > 0 ? citasRecientes[0].fechaHoraInicio : null;
      const segmento = deriveSegmento(
        cliente.activo,
        gastoAnio,
        cliente.createdAt,
        ultimaVisita,
        visitCount,
      );

      return {
        cliente,
        segmento,
        plan: null,
        puntos: 0,
        gastoAnio,
        totalVisitasAnio: visitCount,
        proximaCita: proximaCitaArr[0] ?? null,
        citasRecientes,
        notaEstudio: cliente.observaciones,
        notaAutor: null,
        // notaFecha is null — clientes table has no updated_at column
        notaFecha: null,
      };
    },
  });

  return {
    detalle: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
