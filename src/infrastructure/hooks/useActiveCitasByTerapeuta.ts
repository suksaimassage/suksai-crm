import { SupabaseCitaAdapter } from '@infra/adapters/SupabaseCitaAdapter';
import type { TUserId } from '@domain/types';

const adapter = new SupabaseCitaAdapter();

/**
 * Returns a manual trigger function (not a React Query query) that counts active
 * citas for a terapeuta over the next 30 days.  Used for delete-guard checks.
 */
export function useActiveCitasByTerapeuta() {
  const check = async (usuarioId: TUserId): Promise<number> => {
    const from = new Date();
    const to = new Date(from);
    to.setDate(to.getDate() + 30);
    return adapter.countActiveCitasByUsuario(usuarioId, from, to);
  };

  return { check };
}
