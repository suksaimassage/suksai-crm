/**
 * Tag — Types
 *
 * Etiqueta de metadata / categoría con eliminación opcional.
 * ISP: solo lo que Tag necesita, sin props de Button ni Badge.
 */
import type { TColorName, TSizes } from '@infra/styles/themes/theme.types';
import type { ReactNode, HTMLAttributes, MouseEvent } from 'react';

export type TTagColor = TColorName;
export type TTagVariant = 'soft' | 'outline' | 'solid';
export type TTagSize = Extract<TSizes, 'sm' | 'md' | 'lg'>;

export interface ITagProps extends HTMLAttributes<HTMLSpanElement> {
  readonly children: ReactNode;
  /** @default "neutral" */
  readonly color?: TTagColor;
  /** @default "soft" */
  readonly variant?: TTagVariant;
  /** @default "md" */
  readonly size?: TTagSize;
  /** Icono SVG a la izquierda del texto */
  readonly icon?: ReactNode;
  /** Muestra botón × y llama a onRemove al pulsarlo */
  readonly onRemove?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** aria-label del botón eliminar. @default "Eliminar" */
  readonly removeLabel?: string;
}
