import { useQuery } from '@tanstack/react-query';
import { SupabaseCitaAdapter } from '@infra/adapters/SupabaseCitaAdapter';
import type { TCentroId } from '@domain/types';

const adapter = new SupabaseCitaAdapter();

/** Total non-cancelled citas for the current calendar month in a centro. */
export const useReservasMes = (centroId: TCentroId | null) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return useQuery({
    queryKey: ['reservas-mes', centroId, year, month] as const,
    queryFn: async () => {
      if (centroId === null) return 0;
      return adapter.countReservasMes(centroId, year, month);
    },
    enabled: centroId !== null,
    staleTime: 5 * 60_000,
  });
};
