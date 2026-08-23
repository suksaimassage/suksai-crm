/**
 * RitualesIcons — all inline SVG icons used exclusively within RitualesPage.
 *
 * KPI icons (IcoKpi*) are fixed-size 22px decorative glyphs.
 * Category icons (IcoCat*) receive a size prop so they can render at 16px
 * (rail) or 32px (card glyph) without duplication.
 *
 * The icon mapping helper (getServiceIcon) lives in rituales.utils.ts to avoid
 * react-refresh warnings about non-component exports in component files.
 */

// ── IIconSizeProps ─────────────────────────────────────────────────────────────

export interface IIconSizeProps {
  readonly size: number;
}

// ── KPI icons ──────────────────────────────────────────────────────────────────

export const IcoKpiLotus = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 19.5c0 0-5-3.5-5-9a5 5 0 0 1 10 0c0 5.5-5 9-5 9z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M12 19.5c-2.5-2.5-7.5-3-8.5-8C3 8.8 5 6.5 7.5 7c1.5.4 3 2 3 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 19.5c2.5-2.5 7.5-3 8.5-8C21 8.8 19 6.5 16.5 7c-1.5.4-3 2-3 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 19.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const IcoKpiBamboo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 20V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M15 20V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M7 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M7 15.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M13 12.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M13 17.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M9 5c-1-.5-2-1.5-2-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M15 8c1-.5 2-1.5 2-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const IcoKpiPetals = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M8 10.5C8 10.5 6.5 7 8 4c1.5 3 0 6.5 0 6.5z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path d="M8 10.5v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path
      d="M16 10.5C16 10.5 14.5 7 16 4c1.5 3 0 6.5 0 6.5z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path d="M16 10.5v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path
      d="M8 20C8 20 6.5 16.5 8 13.5c1.5 3 0 6.5 0 6.5z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path d="M8 20v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path
      d="M16 20C16 20 14.5 16.5 16 13.5c1.5 3 0 6.5 0 6.5z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path d="M16 20v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const IcoKpiCalendar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 10.5h18" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M12 18.5c0 0 2.5-1.5 2.5-4.5-2 .5-2.5 4.5-2.5 4.5z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path
      d="M12 18.5c0 0-2.5-1.5-2.5-4.5 2 .5 2.5 4.5 2.5 4.5z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Category icons ─────────────────────────────────────────────────────────────

export const IcoCatAll = ({ size }: IIconSizeProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 6h16M4 12h16M4 18h10"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

export const IcoCatMassage = ({ size }: IIconSizeProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 8.5c2.5-3.5 5.5-3.5 8 0s5.5 3.5 8 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M4 15.5c2.5-3.5 5.5-3.5 8 0s5.5 3.5 8 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const IcoCatDrop = ({ size }: IIconSizeProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3c0 0 7 9 7 13a7 7 0 0 1-14 0c0-4 7-13 7-13z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M9 18a3.5 3.5 0 0 0 3.5 2"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

export const IcoCatStone = ({ size }: IIconSizeProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="12" cy="17.5" rx="7" ry="3.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8.5 11.5c1-1.5 2-1.5 3 0"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M12.5 9c1-1.5 2-1.5 3 0"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path d="M10 6c1-1.5 2-1.5 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const IcoCatMoon = ({ size }: IIconSizeProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M21 12.8a9 9 0 1 1-9.8-9.8 7 7 0 0 0 9.8 9.8z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const IcoCatCouples = ({ size }: IIconSizeProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9.5" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="14.5" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const IcoCatSports = ({ size }: IIconSizeProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 8l4-4 4 8 4-4 4 4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 16l4-4 4 8 4-4 4 4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IcoCatPrenatal = ({ size }: IIconSizeProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M21 12.8a9 9 0 1 1-9.8-9.8 7 7 0 0 0 9.8 9.8z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="18.5" cy="5.5" r="1.5" fill="currentColor" />
    <circle cx="21" cy="9" r="1" fill="currentColor" />
  </svg>
);

export const IcoCatDefault = ({ size }: IIconSizeProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
);
