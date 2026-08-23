/**
 * Chip — Types
 *
 * Elemento de selección / filtro interactivo (<button>).
 * Extiende ButtonHTMLAttributes para a11y nativa completa.
 */
import type { ReactNode, ButtonHTMLAttributes } from 'react';
import type { TColorName, TSizes } from '@infra/styles/themes/theme.types';

export type TChipColor = TColorName;

export type TChipSize = Extract<TSizes, 'xs' | 'sm' | 'md' | 'lg'>;

export interface IChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode;
  /** @default "neutral" */
  readonly color?: TChipColor;
  /** @default "md" */
  readonly size?: TChipSize;
  /** Estado seleccionado. @default false */
  readonly selected?: boolean;
  /** Icono SVG a la izquierda del texto */
  readonly icon?: ReactNode;
}
