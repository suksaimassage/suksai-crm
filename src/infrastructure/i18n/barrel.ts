/**
 * i18n public API
 *
 * Import from here — never deep-import internal modules directly.
 */

export { I18nProvider } from './provider';
export { getNamespacesByRoute } from './namespace-resolver';
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, type SupportedLanguage } from './index';
