/**
 * LegalPage.types.ts
 *
 * Shared shape for the two public legal documents (Términos de Uso,
 * Política de Privacidad). Content lives in i18n locale JSON — these types
 * describe the structure `t(..., { returnObjects: true })` returns.
 */

export type TLegalSlug = 'terminos-uso' | 'privacidad';

export interface ILegalSection {
  readonly id: string;
  readonly heading: string;
  /** One entry per paragraph — rendered as separate <p> elements. */
  readonly body: readonly string[];
}

export interface ILegalDocument {
  readonly title: string;
  readonly lastUpdated: string;
  readonly sections: readonly ILegalSection[];
}
