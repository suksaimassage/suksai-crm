// ── Botanical ornament SVG components for CentrosPage ────────────────────────
// 48×48 decorative SVGs used as hero-area background ornaments (opacity 0.4).
// All are aria-hidden — they are purely decorative.
// Kept in a separate file from centros.icons.tsx to satisfy the 400-line limit
// and the react-refresh/only-export-components rule (BOTANIC_ORNAMENTS lives in
// centros.types.ts as a plain constant, not in a component file).

import type { JSX } from 'react';

export const BotanicLotus = (): JSX.Element => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path
      d="M24 36 C24 36 18 28 18 22 C18 17 21 14 24 14 C27 14 30 17 30 22 C30 28 24 36 24 36Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 36 C24 36 14 30 12 24 C10 18 13 14 16 13 C19 12 22 15 23 20"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 36 C24 36 34 30 36 24 C38 18 35 14 32 13 C29 12 26 15 25 20"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M24 36 L24 44" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path
      d="M24 40 C20 38 16 39 14 42"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M24 40 C28 38 32 39 34 42"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

export const BotanicLeaf = (): JSX.Element => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path
      d="M24 42 C24 42 10 32 10 20 C10 12 16 8 24 8 C32 8 38 12 38 20 C38 32 24 42 24 42Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M24 42 L24 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M24 22 L17 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M24 22 L31 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M24 28 L16 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M24 28 L32 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const BotanicDrop = (): JSX.Element => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path
      d="M24 8 C24 8 12 22 12 30 C12 37 17.4 42 24 42 C30.6 42 36 37 36 30 C36 22 24 8 24 8Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 28 C18 24 20 21 23 20"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

export const BotanicFlame = (): JSX.Element => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path
      d="M24 10 C24 10 34 22 34 30 C34 37 29.6 42 24 42 C18.4 42 14 37 14 30 C14 22 24 10 24 10Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 22 C24 22 30 29 30 33 C30 36.3 27.3 38 24 38"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

export const BotanicHand = (): JSX.Element => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path
      d="M12 28 C12 28 12 34 16 38 C20 42 28 42 32 38 C36 34 36 28 36 28"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 28 L18 18 C18 16.3 19.3 15 21 15 C22.7 15 24 16.3 24 18"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M24 28 L24 15 C24 13.3 25.3 12 27 12 C28.7 12 30 13.3 30 15 L30 20"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M30 28 L30 20 C30 18.3 31.3 17 33 17 C34.7 17 36 18.3 36 20 L36 28"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M18 28 L18 22 C18 22 14 22 14 26 L14 28"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M20 32 C20 32 24 26 28 28 C26 30 24 34 20 32Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
