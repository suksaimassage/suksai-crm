import { useQuery } from '@tanstack/react-query';
import { SupabaseCentroAdapter } from '@infra/adapters/SupabaseCentroAdapter';
import { SupabaseDashboardAdapter } from '@infra/adapters/SupabaseDashboardAdapter';
import type { ICentro } from '@domain/models';
import type { TCentroId } from '@domain/types';

const centroAdapter = new SupabaseCentroAdapter();
const dashboardAdapter = new SupabaseDashboardAdapter();

interface INetworkKPIs {
  readonly centrosActivos: number;
  readonly salasTotales: number;
  readonly ocupacionHoyPct: number;
  readonly enMantenimiento: number;
}

interface ICentroStats {
  readonly salaCount: number;
  readonly staffCount: number;
  readonly ocupacionPct: number;
}

export interface IUseCentrosPageResult {
  readonly centros: readonly ICentro[];
  readonly networkKPIs: INetworkKPIs;
  readonly centroStats: ReadonlyMap<TCentroId, ICentroStats>;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

const QUERY_KEYS = {
  centros: ['centros-page', 'centros'] as const,
  salas: ['centros-page', 'salas'] as const,
  networkCitas: (dateStr: string) => ['centros-page', 'network-citas', dateStr] as const,
  staffByCentros: ['centros-page', 'staff'] as const,
};

export function useCentrosPage(): IUseCentrosPageResult {
  const today = new Date();
  const todayStr = today.toDateString();

  const centrosQuery = useQuery({
    queryKey: QUERY_KEYS.centros,
    queryFn: () => centroAdapter.findAll({ page: 1, perPage: 50 }),
    staleTime: 1000 * 60 * 5,
  });

  const salasQuery = useQuery({
    queryKey: QUERY_KEYS.salas,
    queryFn: () => dashboardAdapter.fetchAllSalas(),
    staleTime: 1000 * 60 * 5,
  });

  const citasQuery = useQuery({
    queryKey: QUERY_KEYS.networkCitas(todayStr),
    queryFn: () => dashboardAdapter.fetchNetworkTodayCitas(today),
    staleTime: 1000 * 60 * 2,
  });

  const staffQuery = useQuery({
    queryKey: QUERY_KEYS.staffByCentros,
    queryFn: () => dashboardAdapter.fetchStaffByCentros(),
    staleTime: 1000 * 60 * 5,
  });

  const isLoading =
    centrosQuery.isLoading || salasQuery.isLoading || citasQuery.isLoading || staffQuery.isLoading;

  const isError =
    centrosQuery.isError || salasQuery.isError || citasQuery.isError || staffQuery.isError;

  const centros = centrosQuery.data?.data ?? [];
  const salas = salasQuery.data ?? [];
  const citas = citasQuery.data ?? [];
  const staff = staffQuery.data ?? [];

  const centroStatsMap = new Map<TCentroId, ICentroStats>();

  for (const centro of centros) {
    const centroSalas = salas.filter((s) => s.centro_id === centro.id);
    const salaCount = centroSalas.length;

    const centroStaff = staff.filter((s) => s.centro_id === centro.id);
    const staffCount = centroStaff.length;

    const salaIds = new Set(centroSalas.map((s) => s.id));
    const activeCitas = citas.filter(
      (c) =>
        c.centro_id === centro.id &&
        c.sala_id !== null &&
        salaIds.has(c.sala_id) &&
        c.estado === 'en_curso',
    );
    const ocupacionPct = salaCount > 0 ? Math.round((activeCitas.length / salaCount) * 100) : 0;

    centroStatsMap.set(centro.id, { salaCount, staffCount, ocupacionPct });
  }

  const centrosActivos = centros.filter((c) => c.activo).length;
  const salasTotales = salas.length;
  const totalActiveCitas = citas.filter((c) => c.estado === 'en_curso').length;
  const ocupacionHoyPct =
    salasTotales > 0 ? Math.round((totalActiveCitas / salasTotales) * 100) : 0;
  const enMantenimiento = salas.filter((s) => !s.activa).length;

  return {
    centros,
    networkKPIs: { centrosActivos, salasTotales, ocupacionHoyPct, enMantenimiento },
    centroStats: centroStatsMap,
    isLoading,
    isError,
  };
}
