import { useQuery } from '@tanstack/react-query';
import { SupabaseSalaAdapter } from '@infra/adapters/SupabaseSalaAdapter';
import { SupabaseDashboardAdapter } from '@infra/adapters/SupabaseDashboardAdapter';
import type { ISala } from '@domain/models';
import type { TCentroId, TSalaId } from '@domain/types';

const salaAdapter = new SupabaseSalaAdapter();
const dashboardAdapter = new SupabaseDashboardAdapter();

interface ISalaOccupancy {
  readonly slotsUsed: number;
  readonly hasActiveCita: boolean;
}

interface IDetailKPIs {
  readonly salaCount: number;
  readonly ocupacionPct: number;
  readonly sesionesHoy: number;
  readonly ingresoHoyEuros: number;
}

export interface IUseCentroDetailResult {
  readonly salas: readonly ISala[];
  readonly salaOccupancy: ReadonlyMap<TSalaId, ISalaOccupancy>;
  readonly detailKPIs: IDetailKPIs;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

const QUERY_KEYS = {
  salas: (centroId: TCentroId) => ['centro-detail', centroId, 'salas'] as const,
  citas: (centroId: TCentroId, dateStr: string) =>
    ['centro-detail', centroId, 'citas', dateStr] as const,
};

const TOTAL_SLOTS = 10;

export function useCentroDetail(centroId: TCentroId | null): IUseCentroDetailResult {
  const today = new Date();
  const todayStr = today.toDateString();

  const salasQuery = useQuery({
    queryKey: QUERY_KEYS.salas(centroId ?? 0),
    queryFn: () => salaAdapter.findByCentro(centroId!), // eslint-disable-line @typescript-eslint/no-non-null-assertion
    enabled: centroId !== null,
    staleTime: 1000 * 60 * 5,
  });

  const citasQuery = useQuery({
    queryKey: QUERY_KEYS.citas(centroId ?? 0, todayStr),
    queryFn: () => dashboardAdapter.fetchTodayAppointments(centroId!, today), // eslint-disable-line @typescript-eslint/no-non-null-assertion
    enabled: centroId !== null,
    staleTime: 1000 * 60 * 2,
  });

  const isLoading = salasQuery.isLoading || citasQuery.isLoading;
  const isError = salasQuery.isError || citasQuery.isError;

  const salas = salasQuery.data ?? [];
  const citas = citasQuery.data ?? [];

  const occupancyMap = new Map<TSalaId, ISalaOccupancy>();
  for (const sala of salas) {
    const activeCitas = citas.filter((c) => c.sala_id === sala.id && c.estado === 'en_curso');
    occupancyMap.set(sala.id, {
      slotsUsed: Math.min(activeCitas.length, TOTAL_SLOTS),
      hasActiveCita: activeCitas.length > 0,
    });
  }

  const salaCount = salas.length;
  const sesionesHoy = citas.filter(
    (c) => c.estado === 'en_curso' || c.estado === 'completada',
  ).length;
  const activeCitaCount = citas.filter((c) => c.estado === 'en_curso').length;
  const ocupacionPct = salaCount > 0 ? Math.round((activeCitaCount / salaCount) * 100) : 0;
  const ingresoHoyEuros =
    citas
      .filter((c) => c.estado === 'completada')
      .reduce((sum, c) => {
        const precio =
          (c as unknown as { servicios: { precio: number | null } | null }).servicios?.precio ?? 0;
        return sum + precio;
      }, 0) / 100;

  return {
    salas,
    salaOccupancy: occupancyMap,
    detailKPIs: { salaCount, ocupacionPct, sesionesHoy, ingresoHoyEuros },
    isLoading,
    isError,
  };
}
