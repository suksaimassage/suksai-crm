/**
 * i18n/provider.tsx — React i18n Provider
 *
 * Responsibilities:
 *   1. Boot i18next (via side-effect import of index.ts)
 *   2. Load ONLY the 'common' namespace on mount (everything always-available)
 *   3. Gate render until 'common' is ready (returns null meanwhile)
 *
 * It does NOT watch the pathname or load per-route namespaces — it sits above
 * RouterProvider and never calls useLocation(). Route/page namespaces are loaded
 * by the route guards themselves (see application/routes/*.route.tsx via
 * namespace-resolver + namespace-loader).
 *
 * Not responsible for: language detection, namespace mapping, file loading.
 */

import { type ReactNode, Suspense, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

// Side-effect: configures i18next singleton
import { i18n, COMMON_NS, type SupportedLanguage } from './index';
import { loadNamespaces } from './namespace-loader';

// ── Types ──────────────────────────────────────────────────────────────────
interface I18nProviderProps {
  readonly children: ReactNode;
}

// ── Provider ───────────────────────────────────────────────────────────────
// Boots i18next and loads the 'common' namespace. Does NOT use useLocation()
// so it can safely sit above RouterProvider.
export const I18nProvider = ({ children }: I18nProviderProps) => {
  const [isCommonReady, setIsCommonReady] = useState(false);

  useEffect(() => {
    const language = i18n.language as SupportedLanguage;

    void loadNamespaces(i18n, language, [COMMON_NS]).then(() => {
      document.documentElement.setAttribute('lang', language);
      setIsCommonReady(true);
    });
  }, []);

  if (!isCommonReady) return null;

  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>{children}</Suspense>
    </I18nextProvider>
  );
};
