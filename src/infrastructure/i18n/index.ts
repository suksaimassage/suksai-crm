/**
 * i18n/index.ts — Core i18next initialization
 *
 * SRP: only configures i18next. Does not know about React or routing.
 *
 * ⚠️  This module runs once at app boot.
 *     Never import it from domain/ — it belongs to infrastructure/.
 */

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// ── Language detection priority ────────────────────────────────────────────
// 1. localStorage  →  user preference persists across sessions
// 2. fallbackLng   →  'es' — first-visit default; navigator is intentionally
//                     excluded so the browser OS language never overrides the
//                     product default on a fresh session.
const detectionOptions: ConstructorParameters<typeof LanguageDetector>[1] = {
  // Order: first match wins. navigator omitted — see comment above.
  order: ['localStorage'],

  // localStorage key for persisted language choice
  lookupLocalStorage: 'app_language',

  // Cache chosen language in localStorage
  caches: ['localStorage'],
};

// ── Supported languages ────────────────────────────────────────────────────
export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

// ── Namespaces ─────────────────────────────────────────────────────────────
// 'common' is the only namespace always loaded upfront.
// All others are loaded dynamically per route (see namespace-resolver.ts).
export const COMMON_NS = 'common' as const;

// 'dashboard' is the shell namespace for the entire /dashboard/* subtree
// (Sidebar + topbar). It is NOT loaded upfront — the dashboard branch route
// loads it on every navigation so the shell chrome is translated regardless of
// which leaf page rendered (see dashboard.route.tsx + namespace-resolver.ts).
export const DASHBOARD_NS = 'dashboard' as const;

// ── i18next initialization ─────────────────────────────────────────────────
if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGES,
      // Strip region codes: 'en-US' → 'en', 'es-419' → 'es'
      load: 'languageOnly',

      defaultNS: COMMON_NS,
      ns: [COMMON_NS],
      resources: {},

      react: {
        // false avoids Suspense cascades while namespaces load lazily
        useSuspense: false,
      },

      interpolation: { escapeValue: false },

      detection: detectionOptions,

      debug: import.meta.env.DEV,
    });
}

export { i18n };
