/**
 * i18n/namespace-resolver.ts — Route → Namespace mapping
 *
 * SRP: knows WHICH namespaces a route needs.
 *      Does not know how to load them or when.
 *
 * Extension guide:
 *   1. Add a new route key to ROUTE_NAMESPACE_MAP
 *   2. Add the corresponding loader in namespace-loader.ts
 *   3. Add the translation files under locales/{lang}/{namespace}.json
 */

import { COMMON_NS, DASHBOARD_NS } from './index';

// Re-export so route guards can reference the shell namespace from a single
// source alongside the resolver they already import.
export { DASHBOARD_NS };

// ── Route → namespace map ─────────────────────────────────────────────────
// 'common' is injected automatically — never add it here.
const ROUTE_NAMESPACE_MAP: Record<string, readonly string[]> = {
  '/': [], // root: only common
  '/login': ['login'],
  '/legal/terminos-uso': ['legal'],
  '/legal/privacidad': ['legal'],
  '/dashboard': ['dashboard', 'errors'],
  '/dashboard/agenda': ['agenda'],
  '/dashboard/centros': ['dashboard'],
  '/dashboard/terapeutas': ['terapeutas'],
  '/dashboard/clientes': ['clientes'],
  '/dashboard/rituales': ['rituales'],
} as const;

// ── Fallback namespaces for unknown routes ─────────────────────────────────
const FALLBACK_NAMESPACES: readonly string[] = [];

/**
 * Returns the full list of namespaces required for a given pathname.
 * 'common' is always included as the first element.
 *
 * @example
 * getNamespacesByRoute('/usuarios') // → ['common', 'usuarios']
 * getNamespacesByRoute('/dashboard') // → ['common', 'dashboard']
 * getNamespacesByRoute('/unknown')   // → ['common']
 */
export function getNamespacesByRoute(pathname: string): readonly string[] {
  // Normalize: remove trailing slash except for root
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;

  // Match exact route first, then try prefix match for nested routes
  const routeNamespaces = ROUTE_NAMESPACE_MAP[normalized] ?? findPrefixMatch(normalized);

  // common is always first — deduplicate just in case
  return [COMMON_NS, ...routeNamespaces.filter((ns) => ns !== COMMON_NS)];
}

/**
 * Prefix matching for nested routes.
 *
 * @example
 * '/usuarios/123' → matches '/usuarios' → ['usuarios']
 */
function findPrefixMatch(pathname: string): readonly string[] {
  const matchedKey = Object.keys(ROUTE_NAMESPACE_MAP)
    .filter((key) => key !== '/' && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length) // longest match wins
    .at(0);

  return matchedKey
    ? (ROUTE_NAMESPACE_MAP[matchedKey] ?? FALLBACK_NAMESPACES)
    : FALLBACK_NAMESPACES;
}

/**
 * Returns namespaces that are in `current` but not in `next`.
 * Useful for cleanup when navigating away from a route.
 * (i18next keeps resources in memory — this is for tracking purposes only.)
 */
export function getNamespacesToUnload(
  current: readonly string[],
  next: readonly string[],
): readonly string[] {
  const nextSet = new Set(next);
  return current.filter((ns) => ns !== COMMON_NS && !nextSet.has(ns));
}
