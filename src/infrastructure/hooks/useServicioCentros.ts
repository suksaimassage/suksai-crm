import { useQuery } from '@tanstack/react-query';
import { SupabaseServicioAdapter } from '@infra/adapters/SupabaseServicioAdapter';
import { SupabaseCentroAdapter } from '@infra/adapters/SupabaseCentroAdapter';
import type { TServicioId, TCentroId } from '@domain/types';

const servicioAdapter = new SupabaseServicioAdapter();
const centroAdapter = new SupabaseCentroAdapter();

/**
 * Returns the list of centroIds that a given servicio is currently assigned to.
 * Enabled only when servicioId is defined.
 */
export function useServicioCentros(servicioId: TServicioId | undefined) {
  return useQuery({
    queryKey: ['servicios-centros', servicioId],
    queryFn: async (): Promise<readonly TCentroId[]> => {
      if (servicioId === undefined) return [];
      const centros = await centroAdapter.findActivos();
      const results = await Promise.all(
        centros.map((centro) =>
          servicioAdapter
            .findServicioCentro(servicioId, centro.id)
            .then((sc) => (sc !== null ? centro.id : null)),
        ),
      );
      return results.filter((id): id is TCentroId => id !== null);
    },
    enabled: servicioId !== undefined,
    staleTime: 1000 * 60 * 2,
  });
}
