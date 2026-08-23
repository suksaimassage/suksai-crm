/**
 * Badge — Types
 *
 * ISP: interfaz mínima específica. OCP: extensible vía tipos.
 */
import type { ReactNode, HTMLAttributes } from 'react';
import type { TColorName, TSizes } from '@infra/styles/themes/theme.types';

export type TBadgeColor = TColorName;

/**
 * solid   → fondo lleno, texto inverso
 * soft    → fondo tenue, texto del color  (default)
 * outline → solo borde
 * dot     → punto + texto sin cápsula
 */
export type TBadgeVariant = 'solid' | 'soft' | 'soft-outline' | 'outline' | 'dot';

export type TBadgeSize = Extract<TSizes, 'xs' | 'sm' | 'md' | 'lg'>;

export interface IBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly children: ReactNode;
  /** @default "primary" */
  readonly color?: TBadgeColor;
  /** @default "soft" */
  readonly variant?: TBadgeVariant;
  /** @default "md" */
  readonly size?: TBadgeSize;
  /** Pill shape. @default true */
  readonly pill?: boolean;
}
