import { useQuery } from '@tanstack/react-query';
import { SupabaseCentroAdapter } from '@infra/adapters/SupabaseCentroAdapter';
import type { ICentro } from '@domain/models';

const adapter = new SupabaseCentroAdapter();

export function useCentrosActivos() {
  return useQuery<readonly ICentro[]>({
    queryKey: ['centros', 'activos'],
    queryFn: () => adapter.findActivos(),
    staleTime: 1000 * 60 * 5,
  });
}
