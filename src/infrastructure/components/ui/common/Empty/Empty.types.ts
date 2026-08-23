/**
 * Empty Component Types
 *
 * Defines all public API types for the Empty state system.
 * SRP: Only type definitions — no logic, no styling.
 */

import type { ReactNode, ComponentType, SVGProps } from 'react';

// ─── Size System ────────────────────────────────────────────────────────────

export type TEmptySize = 'xs' | 'sm' | 'md' | 'lg';

// ─── Visual Variants ────────────────────────────────────────────────────────

export type TEmptyVariant = 'default' | 'illustrated' | 'subtle' | 'card' | 'fullscreen';

// ─── Contextual Presets ─────────────────────────────────────────────────────

export type TEmptyPreset =
  | 'no-data'
  | 'no-results'
  | 'empty-list'
  | 'search-empty'
  | 'error'
  | 'onboarding'
  | 'drag-drop';

// ─── Animation ──────────────────────────────────────────────────────────────

export type TEmptyAnimation = 'float' | 'pulse' | 'shimmer' | 'none';

// ─── Illustration ───────────────────────────────────────────────────────────

export type TEmptyIllustration = ComponentType<SVGProps<SVGSVGElement>> | string; // URL fallback

// ─── Icon ───────────────────────────────────────────────────────────────────

export type TEmptyIcon = ComponentType<SVGProps<SVGSVGElement>> | ReactNode;

// ─── Main Props ─────────────────────────────────────────────────────────────

export interface IEmptyProps {
  /** Visual size scale */
  size?: TEmptySize;
  /** Visual treatment variant */
  variant?: TEmptyVariant;
  /** Preset context — overrides defaults; all can be overridden via props */
  preset?: TEmptyPreset;
  /** Override title from preset */
  title?: string;
  /** Override description from preset */
  description?: string;
  /** Custom icon component or node */
  icon?: TEmptyIcon;
  /** Custom illustration (SVG component or image URL) */
  illustration?: TEmptyIllustration;
  /** Looping micro-animation on illustration/icon */
  animation?: TEmptyAnimation;
  /** Whether the parent DnD container is being dragged over */
  isDragOver?: boolean;
  /** Actions slot — buttons, links, or any CTA */
  children?: ReactNode;
  /** Additional className for container */
  className?: string;
  /** Custom ARIA label for screen readers */
  ariaLabel?: string;
}

// ─── Preset Config ──────────────────────────────────────────────────────────

export interface IEmptyPresetConfig {
  title: string;
  description: string;
  animation?: TEmptyAnimation;
}

// ─── Size Config ────────────────────────────────────────────────────────────

export interface IEmptySizeConfig {
  iconSize: number;
  illustrationSize: number;
  gap: string;
  padding: string;
  maxWidth: string;
}
