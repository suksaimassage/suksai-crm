import type { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from '@infra/providers/ThemeProvider';
import { I18nProvider } from '@infra/i18n/provider';
import { useAuthBootstrap } from '@infra/hooks/useAuthBootstrap';
import { useUserStore } from '@app/stores/useUserStore';
import { ToastProvider } from '@infra/components/ui/common/Toast';
import { BootstrapSplash } from '@infra/components/ui/shared/BootstrapSplash';

interface IAppProvidersProps {
  readonly children: ReactNode;
}

/**
 * AuthGate — hosts useAuthBootstrap() for the app lifetime and gates the router
 * tree behind session resolution.
 *
 * On reload, Zustand rehydrates `user` from localStorage but resets `status` to
 * 'idle'; useAuthBootstrap then calls getSession() (status 'loading') and settles
 * to 'authenticated' | 'unauthenticated'. We render <BootstrapSplash/> while the
 * status is unsettled so the router does not mount and bounce a still-valid
 * session to /login before getSession() resolves.
 *
 * This component never unmounts after settling, so the onAuthStateChange
 * subscription inside useAuthBootstrap stays alive for the app lifetime.
 */
const AuthGate = ({ children }: { readonly children: ReactNode }) => {
  useAuthBootstrap();
  const status = useUserStore((s) => s.status);

  if (status === 'idle' || status === 'loading') {
    return <BootstrapSplash />;
  }

  return <>{children}</>;
};

export const AppProviders = ({ children }: IAppProvidersProps) => (
  <I18nProvider>
    <QueryProvider>
      <ThemeProvider>
        <ToastProvider defaultPosition="bottom-right">
          <AuthGate>{children}</AuthGate>
        </ToastProvider>
      </ThemeProvider>
    </QueryProvider>
  </I18nProvider>
);
