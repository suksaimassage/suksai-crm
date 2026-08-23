/**
 * hooks/useAuth.ts — Auth primitives bridging the adapter and Zustand store.
 *
 * signIn: plain async function for use inside React 19 Actions (not a hook).
 * useSignOut: mutation hook for sign-out (React Query).
 */

import { useMutation } from '@tanstack/react-query';
import type { ISignInDTO, IAuthSession } from '@domain/ports';
import { useUserStore } from '@app/stores/useUserStore';
import { SupabaseAuthAdapter } from '@infra/adapters/SupabaseAuthAdapter';

const adapter = new SupabaseAuthAdapter();

/**
 * Plain async function — use inside React 19 Actions, not as a hook.
 * Callers are responsible for updating the store and handling errors.
 */
export async function signIn(dto: ISignInDTO): Promise<IAuthSession> {
  return adapter.signIn(dto);
}

export const useSignOut = () => {
  const clearUser = useUserStore((s) => s.clearUser);

  return useMutation({
    mutationFn: async () => {
      try {
        await adapter.signOut();
      } finally {
        clearUser();
      }
    },
  });
};
