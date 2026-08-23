/**
 * useDashboardCentroId.ts
 *
 * Resolves the primary centroId for the current user via SupabaseUsuarioCentroAdapter.
 * Returns the first centro assigned to the user, or null if none exist.
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseUsuarioCentroAdapter } from '@infra/adapters/SupabaseUsuarioCentroAdapter';
import type { TUserId, TCentroId } from '@domain/types';

const adapter = new SupabaseUsuarioCentroAdapter();

export interface IUseDashboardCentroIdResult {
  readonly centroId: TCentroId | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export const useDashboardCentroId = (userId: TUserId | null): IUseDashboardCentroIdResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'centro-id', userId],
    queryFn: async () => {
      if (userId === null) return null;
      const centros = await adapter.findByUsuario(userId);
      return centros[0]?.centroId ?? null;
    },
    enabled: userId !== null,
    staleTime: 600_000, // 10 min — centro assignments rarely change mid-session
  });

  return {
    centroId: data ?? null,
    isLoading,
    isError,
  };
};
