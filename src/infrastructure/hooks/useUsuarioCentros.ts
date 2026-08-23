/**
 * useUsuarioCentros.ts
 *
 * Lists the ACTIVE centros a user is assigned to, with their display name and
 * primary flag — the data source for the admin agenda's centre selector.
 *
 * Reuses two existing adapters (no port change, no N+1): a single query fans out
 * to `findByUsuario` (active usuarios_centro rows → centroId + esPrincipal) and
 * `findActivos` (active centros → nombre) in parallel, then crosses them by id.
 * Assignments whose centro is not resolvable (inactive/hidden by RLS) are dropped
 * so the selector never shows an unlabeled option. The primary centre is ordered
 * first; the rest sort alphabetically.
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseUsuarioCentroAdapter } from '@infra/adapters/SupabaseUsuarioCentroAdapter';
import { SupabaseCentroAdapter } from '@infra/adapters/SupabaseCentroAdapter';
import type { TUserId, TCentroId } from '@domain/types';

const usuarioCentroAdapter = new SupabaseUsuarioCentroAdapter();
const centroAdapter = new SupabaseCentroAdapter();

export interface IUsuarioCentroOption {
  readonly id: TCentroId;
  readonly nombre: string;
  readonly esPrincipal: boolean;
}

export interface IUseUsuarioCentrosResult {
  readonly centros: readonly IUsuarioCentroOption[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export const useUsuarioCentros = (userId: TUserId | null): IUseUsuarioCentrosResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['usuario-centros', userId],
    queryFn: async (): Promise<readonly IUsuarioCentroOption[]> => {
      if (userId === null) return [];
      const [asignaciones, centros] = await Promise.all([
        usuarioCentroAdapter.findByUsuario(userId),
        centroAdapter.findActivos(),
      ]);
      const nombreById = new Map(centros.map((c) => [c.id, c.nombre]));
      return asignaciones
        .map((a) => ({
          id: a.centroId,
          nombre: nombreById.get(a.centroId) ?? '',
          esPrincipal: a.esPrincipal,
        }))
        .filter((c) => c.nombre !== '')
        .sort((a, b) => {
          if (a.esPrincipal !== b.esPrincipal) return a.esPrincipal ? -1 : 1;
          return a.nombre.localeCompare(b.nombre);
        });
    },
    enabled: userId !== null,
    staleTime: 600_000, // 10 min — centro assignments rarely change mid-session
  });

  return {
    centros: data ?? [],
    isLoading,
    isError,
  };
};
