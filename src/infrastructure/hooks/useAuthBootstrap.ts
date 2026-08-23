/**
 * hooks/useAuthBootstrap.ts — Boot-time session validation + ongoing auth listener.
 *
 * On mount: calls authAdapter.getSession() to restore an existing Supabase Auth
 * session (JWT stored by the SDK in localStorage). If valid, populates the
 * Zustand store. If not, clears it.
 *
 * Subscribes to authAdapter.onAuthStateChange for the session lifetime:
 *   SIGNED_OUT      → clearUser (fired by signOut() or server-side revocation)
 *   TOKEN_REFRESHED → update expiresAt (fired by autoRefreshToken: true)
 *
 * Architecture: all Supabase access goes through IAuthPort (SupabaseAuthAdapter).
 * No direct supabase imports — port contract enforced.
 *
 * Authentication strategy: Supabase Auth (JWT) + public.usuarios profile.
 * Migration doc: .claude/migrations/001_supabase_auth_migration.sql
 */

import { useEffect } from 'react';
import { SupabaseAuthAdapter } from '@infra/adapters/SupabaseAuthAdapter';
import { useUserStore } from '@app/stores/useUserStore';

// Module-scope singleton — pattern established by other hooks in this repo.
const authAdapter = new SupabaseAuthAdapter();

export const useAuthBootstrap = (): void => {
  const setStatus = useUserStore((s) => s.setStatus);
  const setSession = useUserStore((s) => s.setSession);
  const clearUser = useUserStore((s) => s.clearUser);

  useEffect(() => {
    setStatus('loading');

    // Initial check: restore session from Supabase's persisted storage.
    void authAdapter.getSession().then((authSession) => {
      if (authSession) setSession(authSession);
      else clearUser();
    });

    // Ongoing listener: react to session events for the lifetime of the app.
    // TAuthChangeEvent is a two-member union; the else branch is always TOKEN_REFRESHED.
    const unsubscribe = authAdapter.onAuthStateChange((event, expiresAt) => {
      if (event === 'SIGNED_OUT') {
        clearUser();
      } else {
        // TOKEN_REFRESHED — update expiresAt in the store when Supabase silently refreshes.
        const currentUser = useUserStore.getState().user;
        if (currentUser && expiresAt) {
          setSession({ user: currentUser, expiresAt });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [setStatus, setSession, clearUser]);
};
