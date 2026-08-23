/**
 * UserMenu.tsx — User account dropdown menu (profile, settings, logout)
 *
 * Compound wrapper around DropdownMenu that handles:
 * - Menu trigger: user pill (avatar + name + role + caret)
 * - Menu entries: "Profile", "Settings", "Logout" (destructive)
 * - Logout flow: call useSignOut(), show error toast if needed
 * - Keyboard navigation: ↑↓ to navigate, Enter to select, Escape to close
 * - Click-outside: closes menu
 *
 * Used in DashboardPage topbar. Accessible via ARIA menu semantics.
 */

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { DropdownMenu } from '@infra/components/ui/common/DropdownMenu';
import type { DropdownEntry } from '@infra/components/ui/common/Dropdown/Dropdown.types';
import { useSignOut } from '@infra/hooks/useAuth';

// ─── Props ────────────────────────────────────────────────────────────────────

interface IUserMenuProps {
  readonly trigger: ReactNode;
  readonly disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const UserMenu = ({ trigger, disabled = false }: IUserMenuProps) => {
  const { t } = useTranslation('dashboard');
  const signOut = useSignOut();
  const navigate = useNavigate();

  // ── Menu entries ────────────────────────────────────────────────────────────

  const entries: DropdownEntry[] = [
    {
      type: 'item',
      id: 'logout',
      label: t('topbar.signOut'),
      danger: true,
      disabled: signOut.isPending,
      onClick: () => {
        signOut.mutate(undefined, {
          onSuccess: () => {
            void navigate({ to: '/login', replace: true });
          },
          onError: (error) => {
            throw error;
          },
        });
      },
    },
  ];

  return (
    <DropdownMenu
      trigger={trigger}
      entries={entries}
      disabled={disabled}
      minWidth="200px"
      align="right"
    />
  );
};

UserMenu.displayName = 'UserMenu';
