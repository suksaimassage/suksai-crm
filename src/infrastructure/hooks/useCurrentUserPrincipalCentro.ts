/**
 * hooks/useCurrentUserPrincipalCentro.ts — Resolves the authenticated user's
 * primary-center display name for the sidebar footer.
 *
 * Reads centroPrincipalNombre directly from the Zustand auth store. The value
 * is populated at login / session restore by the get_current_user_profile() RPC
 * (SECURITY DEFINER — bypasses RLS). This means masajista users, who are
 * blocked by RLS from SELECT on usuarios_centro and centros, correctly receive
 * their primary-center name without an additional query.
 *
 * Contract returned to the view:
 *   { centroNombre: string | null; isLoading: boolean }
 * isLoading is always false — the value is synchronously available from the store.
 */

import { useUserStore } from '@app/stores/useUserStore';

export interface IUseCurrentUserPrincipalCentroResult {
  readonly centroNombre: string | null;
  readonly isLoading: boolean;
}

export const useCurrentUserPrincipalCentro = (): IUseCurrentUserPrincipalCentroResult => {
  const centroNombre = useUserStore((s) => s.user?.centroPrincipalNombre ?? null);

  return {
    centroNombre,
    isLoading: false,
  };
};
