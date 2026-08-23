export type TSkeletonVariant = 'text' | 'circular' | 'rectangular';
export type TSkeletonSpeed = 'slow' | 'normal' | 'fast';

export interface ISkeletonProps {
  /** Variante del skeleton */
  readonly variant?: TSkeletonVariant;

  /** Ancho del skeleton */
  readonly width?: string | number;

  /** Alto del skeleton */
  readonly height?: string | number;

  /** Velocidad de la animación */
  readonly speed?: TSkeletonSpeed;

  /** Deshabilitar animación */
  readonly animation?: boolean;

  /** Border radius personalizado */
  readonly borderRadius?: string;

  /** Clase CSS adicional */
  readonly className?: string;
}

export interface ISkeletonBaseProps {
  $variant: TSkeletonVariant;
  $width?: string | number;
  $height?: string | number;
  $speed: TSkeletonSpeed;
  $animation: boolean;
  $borderRadius?: string;
}
