/**
 * application/stores/useUserStore.ts — Auth session state with persistence.
 *
 * Persists user + expiresAt to localStorage via Zustand persist middleware.
 * status is NOT persisted — it always resets to 'idle' on hydration and is
 * resolved by useAuthBootstrap (calls supabase.auth.getSession on mount).
 *
 * Session management: Supabase Auth (JWT + refresh tokens).
 * expiresAt is sourced from session.expires_at — Supabase auto-refreshes before expiry.
 * Migration doc: .claude/migrations/001_supabase_auth_migration.sql
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IAuthenticatedUser, IAuthSession } from '@domain/ports';

export type TAuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface IUserState {
  user: IAuthenticatedUser | null;
  expiresAt: number | null;
  status: TAuthStatus;
  setSession: (session: IAuthSession) => void;
  /** @deprecated Use setSession. Kept for test compatibility only. */
  setUser: (user: IAuthenticatedUser) => void;
  clearUser: () => void;
  setStatus: (status: TAuthStatus) => void;
}

export const useUserStore = create<IUserState>()(
  persist(
    (set) => ({
      user: null,
      expiresAt: null,
      status: 'idle',
      setSession: (session) => {
        set({
          user: session.user,
          expiresAt: session.expiresAt.getTime(),
          status: 'authenticated',
        });
      },
      setUser: (user) => {
        // Fallback TTL of 1 hour; prefer setSession with a real expiresAt from Supabase.
        set({ user, expiresAt: Date.now() + 60 * 60 * 1000, status: 'authenticated' });
      },
      clearUser: () => {
        set({ user: null, expiresAt: null, status: 'unauthenticated' });
      },
      setStatus: (status) => {
        set({ status });
      },
    }),
    {
      name: 'stm-auth-session',
      // Only persist user and expiresAt — status always resets to 'idle' on load
      partialize: (state) => ({ user: state.user, expiresAt: state.expiresAt }),
    },
  ),
);
