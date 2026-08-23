/**
 * i18n/namespace-loader.ts — Dynamic translation loader
 *
 * SRP: knows HOW to load a translation file.
 *      Does not know WHEN or for which route.
 *
 * Strategy:
 *   - Uses Vite's dynamic import() for true code splitting.
 *   - Each locale/namespace is its own chunk — never bundled upfront.
 *   - Caches resolved promises to prevent duplicate requests.
 */

import type { i18n } from 'i18next';
import type { SupportedLanguage } from './index';
import { logger } from '@infra/utils/logger';

// ── Cache: prevents re-fetching the same chunk ────────────────────────────
const loadedChunks = new Set<string>();

// ── Loader registry: Vite requires static string patterns in import() ──────
// Vite statically analyses these calls at build time.
// Dynamic variables break tree-shaking — use explicit maps.
type TLoader = () => Promise<{ default: Record<string, unknown> }>;

const LOADERS: Partial<Record<string, Partial<Record<string, TLoader>>>> = {
  es: {
    common: () => import('./locales/es/common.json'),
    login: () => import('./locales/es/login.json'),
    dashboard: () => import('./locales/es/dashboard.json'),
    errors: () => import('./locales/es/errors.json'),
    terapeutas: () => import('./locales/es/terapeutas.json'),
    clientes: () => import('./locales/es/clientes.json'),
    rituales: () => import('./locales/es/rituales.json'),
    agenda: () => import('./locales/es/agenda.json'),
    legal: () => import('./locales/es/legal.json'),
  },
  en: {
    common: () => import('./locales/en/common.json'),
    login: () => import('./locales/en/login.json'),
    dashboard: () => import('./locales/en/dashboard.json'),
    errors: () => import('./locales/en/errors.json'),
    terapeutas: () => import('./locales/en/terapeutas.json'),
    clientes: () => import('./locales/en/clientes.json'),
    rituales: () => import('./locales/en/rituales.json'),
    agenda: () => import('./locales/en/agenda.json'),
    legal: () => import('./locales/en/legal.json'),
  },
};

/**
 * Loads a single namespace for a given language into i18next.
 * Safe to call multiple times — uses an in-memory cache.
 */
export async function loadNamespace(
  i18nInstance: i18n,
  language: SupportedLanguage,
  namespace: string,
): Promise<void> {
  const cacheKey = `${language}:${namespace}`;

  // Already loaded — skip
  if (loadedChunks.has(cacheKey)) return;

  const langLoaders = LOADERS[language];
  if (langLoaders === undefined) {
    logger.warn(`[i18n] No loaders registered for language "${language}"`);
    return;
  }

  const loader = langLoaders[namespace];
  if (loader === undefined) {
    logger.warn(`[i18n] No loader for namespace "${namespace}" (lang: "${language}")`);
    return;
  }

  try {
    const { default: translations } = await loader();
    i18nInstance.addResourceBundle(language, namespace, translations, true, true);
    loadedChunks.add(cacheKey);
  } catch (error) {
    logger.error(`[i18n] Failed to load "${language}/${namespace}":`, error);
  }
}

/**
 * Loads multiple namespaces in parallel for a given language.
 * Uses Promise.all — no waterfall.
 */
export async function loadNamespaces(
  i18nInstance: i18n,
  language: SupportedLanguage,
  namespaces: readonly string[],
): Promise<void> {
  await Promise.all(namespaces.map((ns) => loadNamespace(i18nInstance, language, ns)));
}
