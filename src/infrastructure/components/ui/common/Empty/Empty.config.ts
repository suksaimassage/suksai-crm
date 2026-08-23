/**
 * Empty Component Config
 *
 * Static preset definitions and size token maps.
 * SRP: Pure data — no JSX, no styled-components.
 */

import type { IEmptyPresetConfig, IEmptySizeConfig, TEmptyPreset, TEmptySize } from './Empty.types';

// ─── Preset Definitions ─────────────────────────────────────────────────────

export const EMPTY_PRESETS: Record<TEmptyPreset, IEmptyPresetConfig> = {
  'no-data': {
    title: 'No data yet',
    description: "There's nothing here to display. Add your first entry to get started.",
    animation: 'float',
  },
  'no-results': {
    title: 'No results found',
    description: "We couldn't find anything matching your criteria. Try adjusting your filters.",
    animation: 'none',
  },
  'empty-list': {
    title: 'Your list is empty',
    description: "Once you add items they'll appear here.",
    animation: 'float',
  },
  'search-empty': {
    title: 'Nothing matches',
    description: 'Try a different search term or clear your current query.',
    animation: 'none',
  },
  error: {
    title: 'Something went wrong',
    description: 'We ran into an unexpected problem. Please try again or contact support.',
    animation: 'pulse',
  },
  onboarding: {
    title: 'Welcome aboard!',
    description: "Let's get you set up. Follow the steps below to get started.",
    animation: 'float',
  },
  'drag-drop': {
    title: 'Drop files here',
    description: 'Drag and drop your files into this area to upload them.',
    animation: 'none',
  },
};

// ─── Size Token Map ──────────────────────────────────────────────────────────

export const EMPTY_SIZES: Record<TEmptySize, IEmptySizeConfig> = {
  xs: {
    iconSize: 24,
    illustrationSize: 80,
    gap: '8px',
    padding: '24px 16px',
    maxWidth: '280px',
  },
  sm: {
    iconSize: 32,
    illustrationSize: 120,
    gap: '12px',
    padding: '32px 24px',
    maxWidth: '340px',
  },
  md: {
    iconSize: 40,
    illustrationSize: 160,
    gap: '16px',
    padding: '48px 32px',
    maxWidth: '420px',
  },
  lg: {
    iconSize: 56,
    illustrationSize: 220,
    gap: '20px',
    padding: '64px 48px',
    maxWidth: '520px',
  },
};
