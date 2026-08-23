/**
 * Empty Illustrations
 *
 * Built-in SVG illustrations for each preset.
 * Each illustration is a pure functional SVG component.
 * SRP: Only SVG rendering — no logic, no styled-components.
 */

import type { SVGProps } from 'react';

// ─── Shared SVG defaults ─────────────────────────────────────────────────────

const defaults: SVGProps<SVGSVGElement> = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  'aria-hidden': true,
};

// ─── No Data ─────────────────────────────────────────────────────────────────

export const NoDataIllustration = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 200 160" {...defaults} {...props}>
    <rect x="20" y="30" width="160" height="110" rx="12" fill="currentColor" fillOpacity="0.15" />
    <rect x="36" y="50" width="128" height="8" rx="4" fill="currentColor" fillOpacity="0.28" />
    <rect x="36" y="66" width="96" height="6" rx="3" fill="currentColor" fillOpacity="0.28" />
    <rect x="36" y="80" width="112" height="6" rx="3" fill="currentColor" fillOpacity="0.28" />
    <rect x="36" y="94" width="72" height="6" rx="3" fill="currentColor" fillOpacity="0.28" />
    <circle cx="100" cy="115" r="16" fill="currentColor" fillOpacity="0.15" />
    <path
      d="M93 115h14M100 108v14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeOpacity="1"
    />
  </svg>
);

// ─── No Results ──────────────────────────────────────────────────────────────

export const NoResultsIllustration = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 200 160" {...defaults} {...props}>
    <circle
      cx="88"
      cy="76"
      r="44"
      fill="currentColor"
      fillOpacity="0.06"
      stroke="currentColor"
      strokeOpacity="0.18"
      strokeWidth="2"
    />
    <circle cx="88" cy="76" r="30" fill="currentColor" fillOpacity="0.15" />
    <path
      d="M88 62v16M88 84v4"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeOpacity="1"
    />
    <line
      x1="122"
      y1="112"
      x2="150"
      y2="140"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      strokeOpacity="0.8"
    />
  </svg>
);

// ─── Empty List ───────────────────────────────────────────────────────────────

export const EmptyListIllustration = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 200 160" {...defaults} {...props}>
    <rect x="30" y="20" width="140" height="120" rx="10" fill="currentColor" fillOpacity="0.15" />
    {[40, 60, 80, 100, 120].map((y, i) => (
      <rect
        key={i}
        x="46"
        y={y}
        width={i % 2 === 0 ? 108 : 80}
        height="8"
        rx="4"
        fill="currentColor"
        fillOpacity={0.28 + i * 0.01}
      />
    ))}
    <circle cx="154" cy="126" r="20" fill="currentColor" fillOpacity="0.15" />
    <path
      d="M147 126h14M154 119v14"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeOpacity="0.8"
    />
  </svg>
);

// ─── Search Empty ─────────────────────────────────────────────────────────────

export const SearchEmptyIllustration = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 200 160" {...defaults} {...props}>
    <circle
      cx="90"
      cy="72"
      r="38"
      fill="currentColor"
      fillOpacity="0.07"
      stroke="currentColor"
      strokeWidth="3"
      strokeOpacity="0.18"
    />
    <circle cx="90" cy="72" r="24" fill="currentColor" fillOpacity="0.15" />
    <line
      x1="118"
      y1="100"
      x2="148"
      y2="130"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinecap="round"
      strokeOpacity="0.8"
    />
    <path
      d="M82 72h16M90 64v16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeOpacity="0.8"
    />
  </svg>
);

// ─── Error ────────────────────────────────────────────────────────────────────

export const ErrorIllustration = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 200 160" {...defaults} {...props}>
    <circle cx="100" cy="80" r="52" fill="currentColor" fillOpacity="0.18" />
    <circle cx="100" cy="80" r="36" fill="currentColor" fillOpacity="0.15" />
    <path
      d="M84 64l32 32M116 64L84 96"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeOpacity="0.8"
    />
  </svg>
);

// ─── Onboarding ───────────────────────────────────────────────────────────────

export const OnboardingIllustration = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 200 160" {...defaults} {...props}>
    <circle cx="100" cy="70" r="46" fill="currentColor" fillOpacity="0.15" />
    <circle cx="100" cy="70" r="30" fill="currentColor" fillOpacity="0.15" />
    <path
      d="M86 70l10 10 20-20"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.8"
    />
    <circle cx="56" cy="126" r="8" fill="currentColor" fillOpacity="0.15" />
    <circle cx="100" cy="136" r="6" fill="currentColor" fillOpacity="0.18" />
    <circle cx="144" cy="126" r="8" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

// ─── Drag & Drop ─────────────────────────────────────────────────────────────

export const DragDropIllustration = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 200 160" {...defaults} {...props}>
    <rect
      x="24"
      y="24"
      width="152"
      height="112"
      rx="12"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeDasharray="8 5"
      strokeOpacity="0.8"
    />
    <path
      d="M100 58v48M82 76l18-18 18 18"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.8"
    />
  </svg>
);

// ─── Preset illustration map ──────────────────────────────────────────────────

export type TPresetIllustrationKey =
  | 'no-data'
  | 'no-results'
  | 'empty-list'
  | 'search-empty'
  | 'error'
  | 'onboarding'
  | 'drag-drop';

export const PRESET_ILLUSTRATIONS: Record<
  TPresetIllustrationKey,
  (props: SVGProps<SVGSVGElement>) => React.JSX.Element
> = {
  'no-data': NoDataIllustration,
  'no-results': NoResultsIllustration,
  'empty-list': EmptyListIllustration,
  'search-empty': SearchEmptyIllustration,
  error: ErrorIllustration,
  onboarding: OnboardingIllustration,
  'drag-drop': DragDropIllustration,
};
