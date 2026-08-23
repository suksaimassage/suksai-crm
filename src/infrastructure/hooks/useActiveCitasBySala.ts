import { SupabaseCitaAdapter } from '@infra/adapters/SupabaseCitaAdapter';
import type { TSalaId } from '@domain/types';

const adapter = new SupabaseCitaAdapter();

/**
 * Returns a manual trigger function that counts active citas for a sala over
 * the next 30 days.  Used for delete-guard checks before sala deletion.
 */
export function useActiveCitasBySala() {
  const check = async (salaId: TSalaId): Promise<number> => {
    const from = new Date();
    const to = new Date(from);
    to.setDate(to.getDate() + 30);
    return adapter.countActiveCitasBySala(salaId, from, to);
  };

  return { check };
}
