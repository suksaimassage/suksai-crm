export interface ILegalTocItem {
  readonly id: string;
  readonly heading: string;
}

export interface ILegalTocProps {
  readonly items: readonly ILegalTocItem[];
  /** Accessible name for the <nav> landmark. */
  readonly ariaLabel: string;
  /** Eyebrow label rendered above the list (e.g. "En esta página"). */
  readonly label: string;
  readonly className?: string;
}
