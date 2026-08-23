// ── Inline SVG icon components for CentrosPage ───────────────────────────────
// All icons are aria-hidden — they are decorative. Accessible text is provided
// by sibling labels or aria-label on the parent interactive element.
// Botanical ornament icons live in centros.botanic.tsx.

import type { JSX } from 'react';

export const IcoBuilding = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9 9v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="12" y="13" width="3" height="4" stroke="currentColor" strokeWidth="1.8" />
    <rect x="5" y="12" width="2" height="2" stroke="currentColor" strokeWidth="1.8" />
    <rect x="5" y="16" width="2" height="2" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const IcoDoor = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="4"
      y="2"
      width="12"
      height="20"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M4 22h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="14" cy="12" r="0.8" fill="currentColor" />
  </svg>
);

export const IcoActivity = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M2 12 L6 7 L10 15 L14 5 L18 13 L22 10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IcoWrench = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3-3a8 8 0 0 1-11 11l-4.1 4.1a2 2 0 1 1-2.9-2.9L8.8 15A8 8 0 0 1 17.7 3.3z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IcoSearch = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <line
      x1="16.5"
      y1="16.5"
      x2="22"
      y2="22"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const IcoBuildingSmall = (): JSX.Element => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="4"
      y="6"
      width="16"
      height="15"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="9" y="14" width="3" height="4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const IcoPeople = (): JSX.Element => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const IcoWarning = (): JSX.Element => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M10.3 3.3L1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="12"
      y1="9"
      x2="12"
      y2="13"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="17"
      x2="12.01"
      y2="17"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const IcoPlusCircle = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <line
      x1="12"
      y1="8"
      x2="12"
      y2="16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <line
      x1="8"
      y1="12"
      x2="16"
      y2="12"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const IcoPin = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2C8.7 2 6 4.7 6 8c0 5 6 14 6 14s6-9 6-14c0-3.3-2.7-6-6-6z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="8" r="2" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const IcoClock = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 7v5l3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IcoPhone = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M22 16.9v3a2 2 0 0 1-2.2 2c-3.2-.3-6.2-1.6-8.6-3.8a19.8 19.8 0 0 1-3.9-8.7A2 2 0 0 1 9.1 8h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.8 2.6a2 2 0 0 1-.5 2.1L13 15.8a16 16 0 0 0 5.2 5.2l1.4-1.4a2 2 0 0 1 2.1-.4c.8.4 1.7.7 2.6.8a2 2 0 0 1 1.7 2z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IcoPencilEdit = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 2.5a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IcoTrash = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <polyline
      points="3 6 5 6 21 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="10"
      y1="11"
      x2="10"
      y2="17"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <line
      x1="14"
      y1="11"
      x2="14"
      y2="17"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const IcoPower = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M18.36 6.64a9 9 0 1 1-12.73 0"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="12"
      y1="2"
      x2="12"
      y2="12"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const IcoImagePlaceholder = (): JSX.Element => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.8" />
    <polyline
      points="21 15 16 10 5 21"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IcoGrid = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="3"
      y="3"
      width="7"
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="14"
      y="3"
      width="7"
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="3"
      y="14"
      width="7"
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="14"
      y="14"
      width="7"
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IcoList = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <line
      x1="8"
      y1="6"
      x2="21"
      y2="6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <line
      x1="8"
      y1="12"
      x2="21"
      y2="12"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <line
      x1="8"
      y1="18"
      x2="21"
      y2="18"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
);

export const IcoDotsThree = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" />
  </svg>
);
