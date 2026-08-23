/**
 * SupabaseAuthAdapter.ts — Implements IAuthPort using Supabase Auth.
 *
 * Auth strategy: supabase.auth.signInWithPassword for credential verification.
 * Profile and roles are fetched from suksai.usuarios + suksai.usuarios_roles
 * via the get_current_user_profile() RPC (SECURITY DEFINER, uses auth.uid()).
 *
 * Schema:
 *   auth.users             (Supabase Auth — credentials, JWT, session management)
 *   suksai.usuarios        (profile: id bigint, nombre, email, is_active, auth_user_id uuid)
 *   suksai.roles           (id bigint, nombre: TNombreRol)
 *   suksai.usuarios_roles  (usuario_id → usuarios, rol_id → roles)
 *
 * Session management: Supabase Auth (JWT + refresh tokens) + Zustand (UI state).
 * supabase.client.ts has persistSession: true — Supabase owns the token lifecycle.
 * Zustand store holds IAuthenticatedUser for synchronous UI consumption.
 *
 * Migration doc: .claude/migrations/001_supabase_auth_migration.sql
 */

import { supabase } from './supabase.client';
import type {
  IAuthPort,
  IAuthSession,
  IAuthenticatedUser,
  ISignInDTO,
  IChangePasswordDTO,
  TAuthChangeEvent,
} from '@domain/ports';
import type { TNombreRol } from '@domain/types';
import { BusinessRuleViolation } from '@domain/types';

export class SupabaseAuthAdapter implements IAuthPort {
  async signIn(dto: ISignInDTO): Promise<IAuthSession> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: dto.email.value,
      password: dto.password,
    });

    // authError presence implies session/user are null per Supabase typing; checking all three
    // is redundant but kept as runtime defense. ESLint rightly notes the extra conditions are
    // unreachable given the types — the explicit authError check is the canonical guard.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard: Supabase types guarantee session/user non-null when authError is null, but defensive check is kept for safety
    if (authError || !authData.session || !authData.user) {
      throw new BusinessRuleViolation('login:error.invalidCredentials', 'INVALID_CREDENTIALS');
    }

    const { data: profile, error: profileError } = await supabase.rpc('get_current_user_profile');

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard: Supabase RPC can return null/empty array even without error (empty DB state); defensive check is kept
    if (profileError || !profile || profile.length === 0) {
      await supabase.auth.signOut();
      throw new BusinessRuleViolation('login:error.invalidCredentials', 'INVALID_CREDENTIALS');
    }

    const { id, nombre, email, is_active, roles: rawRoles } = profile[0];
    const apellidos =
      ((profile[0] as Record<string, unknown>).apellidos as string | undefined) ?? '';

    if (!is_active) {
      await supabase.auth.signOut();
      throw new BusinessRuleViolation('login:error.accountDeactivated', 'ACCOUNT_DEACTIVATED');
    }

    const roles = rawRoles as readonly TNombreRol[];
    if (roles.length === 0) {
      await supabase.auth.signOut();
      throw new BusinessRuleViolation('login:error.noRoles', 'NO_ROLES_ASSIGNED');
    }

    const centroPrincipalNombre =
      ((profile[0] as Record<string, unknown>).centro_primario_nombre as
        | string
        | null
        | undefined) ?? null;

    const user: IAuthenticatedUser = {
      id,
      nombre,
      apellidos,
      email,
      roles,
      isActive: is_active,
      centroPrincipalNombre,
    };

    return {
      user,
      expiresAt: new Date((authData.session.expires_at ?? 0) * 1000),
    };
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getSession(): Promise<IAuthSession | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase.rpc('get_current_user_profile');
    if (!profile || profile.length === 0) return null;

    const { id, nombre, email, is_active, roles: rawRoles } = profile[0];
    const apellidos =
      ((profile[0] as Record<string, unknown>).apellidos as string | undefined) ?? '';
    if (!is_active) return null;

    const roles = rawRoles as readonly TNombreRol[];
    if (roles.length === 0) return null;

    const centroPrincipalNombre =
      ((profile[0] as Record<string, unknown>).centro_primario_nombre as
        | string
        | null
        | undefined) ?? null;

    const user: IAuthenticatedUser = {
      id,
      nombre,
      apellidos,
      email,
      roles,
      isActive: is_active,
      centroPrincipalNombre,
    };
    return { user, expiresAt: new Date((session.expires_at ?? 0) * 1000) };
  }

  async getCurrentUser(): Promise<IAuthenticatedUser | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  }

  async hasAnyRole(userId: number, roles: readonly TNombreRol[]): Promise<boolean> {
    const { useUserStore } = await import('@app/stores/useUserStore');
    const state = useUserStore.getState();
    if (state.user?.id !== userId) return false;
    return roles.some((r) => state.user?.roles.includes(r) ?? false);
  }

  onAuthStateChange(
    handler: (event: TAuthChangeEvent, expiresAt: Date | null) => void,
  ): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        handler('SIGNED_OUT', null);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        handler('TOKEN_REFRESHED', new Date((session.expires_at ?? 0) * 1000));
      }
      // All other Supabase Auth events are intentionally ignored.
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  async changePassword(dto: IChangePasswordDTO): Promise<void> {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      throw new BusinessRuleViolation('auth:error.notAuthenticated', 'NOT_AUTHENTICATED');
    }

    // Re-authenticate to verify the current password before allowing the change.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: dto.currentPassword,
    });

    if (verifyError) {
      throw new BusinessRuleViolation('auth:error.invalidCurrentPassword', 'INVALID_CREDENTIALS');
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: dto.newPassword,
    });

    if (updateError) throw updateError;
  }
}
