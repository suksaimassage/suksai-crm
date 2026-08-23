import { useQuery } from '@tanstack/react-query';
import { SupabaseUsuarioCentroAdapter } from '@infra/adapters/SupabaseUsuarioCentroAdapter';
import type { TUserId, TCentroId } from '@domain/types';

const adapter = new SupabaseUsuarioCentroAdapter();

// Module-level sentinel — stable reference so useEffect deps never see a "new" empty array.
const EMPTY_CENTRO_IDS: readonly TCentroId[] = [];

export interface IUsuarioCentroAssignments {
  readonly centroIds: readonly TCentroId[];
  readonly principalCentroId: TCentroId | null;
}

// Module-level stable result for the empty/loading state — preserves the
// invariant that the returned object never produces a new reference while
// `data` is undefined (prevents the useEffect reference-instability loop).
const EMPTY_ASSIGNMENTS: IUsuarioCentroAssignments = {
  centroIds: EMPTY_CENTRO_IDS,
  principalCentroId: null,
};

/**
 * Reads a usuario's active centro assignments (and which one is principal)
 * from a single query. The principal is derived from the `esPrincipal` flag
 * the adapter already returns — no extra round-trip.
 *
 * Tolerates data-integrity violations (multiple `es_principal=true` rows):
 * picks the first one encountered.
 */
export const useUsuarioCentroAssignments = (
  usuarioId: TUserId | undefined,
  enabled: boolean,
): IUsuarioCentroAssignments => {
  const { data } = useQuery({
    queryKey: ['usuarios_centro', 'by_usuario', usuarioId ?? 0],
    queryFn: () => {
      if (usuarioId === undefined) throw new Error('usuarioId required');
      return adapter.findByUsuario(usuarioId).then((rows) => {
        const centroIds = rows.map((r) => r.centroId);
        const principal = rows.find((r) => r.esPrincipal);
        const result: IUsuarioCentroAssignments = {
          centroIds,
          principalCentroId: principal?.centroId ?? null,
        };
        return result;
      });
    },
    enabled: enabled && usuarioId !== undefined,
    staleTime: 5 * 60 * 1000,
    // gcTime default (5 min) — gcTime: 0 caused data to evict between re-renders,
    // reverting `data` to undefined and restarting the reference-instability loop.
  });
  return data ?? EMPTY_ASSIGNMENTS;
};
