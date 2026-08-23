/**
 * Layout — Types & Interfaces
 *
 * Contratos para todos los componentes semánticos de layout.
 *
 * Principios SOLID:
 * - Interface Segregation: cada componente tiene su interfaz mínima.
 * - Dependency Inversion: dependen de TSpacingValue (abstracción), no de strings.
 * - Open/Closed: extensibles via props sin modificar la implementación base.
 *
 * Componentes:
 *   Container       <div>     → max-width + gutter responsivo
 *   PageLayout      <main>    → esqueleto de página completa
 *   Section         <section> → bloque temático con respiración vertical
 *   Article         <article> → contenido autocontenido
 *   Aside           <aside>   → contenido complementario / sidebar
 *   SectionHeader   <header>  → cabecera semántica de sección
 *   SectionFooter   <footer>  → pie semántico de sección
 *   Divider         <hr>      → separador semántico
 */

import type { ReactNode, CSSProperties, ElementType } from 'react';
import type { TSpacingValue } from '@infra/components/ui/core/Spacing/Spacing.types';
import type { TBreakpointKey } from '@infra/styles/themes/theme.types';

// ─── Base ──────────────────────────────────────────────────────────────────

export interface ILayoutBaseProps {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly id?: string;
  readonly style?: CSSProperties;
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
}

// ─── Container ─────────────────────────────────────────────────────────────

/**
 * Anchuras máximas del Container.
 * Alineadas con theme.breakpoint.
 *
 * xs:   480px   Mobile landscape / componentes compactos
 * sm:   640px   Formularios, contenido estrecho
 * md:   768px   Columna de lectura, artículos
 * lg:   1024px  Páginas con sidebar
 * xl:   1280px  Layout de escritorio estándar  ← DEFAULT
 * 2xl:  1536px  Pantallas anchas
 * 3xl:  1920px  Full HD
 * full: 100%    Sin límite
 */
export type TContainerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

export interface IContainerProps extends ILayoutBaseProps {
  /** Anchura máxima. @default "xl" → 1280px */
  readonly size?: TContainerSize;
  /**
   * Padding horizontal (gutter). Evita que el contenido toque los bordes.
   * Si no se define, el gutter es responsivo automático:
   * mobile → md (16px), tablet → xl (32px), desktop → 2xl (48px).
   */
  readonly gutter?: TSpacingValue;
  /** Centra el contenedor con margin: 0 auto. @default true */
  readonly center?: boolean;
  /** Elemento HTML a renderizar. @default "div" */
  readonly as?: ElementType;
}

export type TResponsiveValue<T> = Partial<Record<TBreakpointKey, T>>;

export type TSpacingInput = TSpacingValue | TResponsiveValue<TSpacingValue> | undefined;

// ─── PageLayout ────────────────────────────────────────────────────────────

export interface IPageLayoutProps extends ILayoutBaseProps {
  /** Padding vertical de la página. */
  readonly $py?: TSpacingValue;
  /** Color/gradiente de fondo. @default theme.color.background.light */
  readonly background?: CSSProperties['background'];
  /** @default "main" */
  readonly as?: 'main' | 'div';
}

// ─── Section ───────────────────────────────────────────────────────────────

export interface ISectionProps extends ILayoutBaseProps {
  /**
   * Padding vertical. Si no se define, es responsivo:
   * mobile → 2xl (48px), tablet → 3xl (64px), desktop → 4xl (96px).
   */
  readonly $py?: TSpacingValue;
  /** Padding horizontal adicional (raro — normalmente lo gestiona Container). */
  readonly $px?: TSpacingValue;
  /** Color/gradiente de fondo de la sección. @default "transparent" */
  readonly background?: CSSProperties['background'];
  /** Alineación del contenido interno. @default "left" */
  readonly align?: 'left' | 'center' | 'right';
  /** Altura mínima. Útil para hero sections (ej: "100vh"). */
  readonly minHeight?: CSSProperties['minHeight'];
}

// ─── Article ───────────────────────────────────────────────────────────────

export interface IArticleProps extends ILayoutBaseProps {
  /** Padding interno. @default responsivo lg → 2xl */
  readonly $p?: TSpacingValue;
  /**
   * Ancho máximo. El estándar tipográfico de legibilidad es 65–75ch.
   * @default undefined (sin límite — lo gestiona el layout padre)
   */
  readonly maxWidth?: CSSProperties['maxWidth'];
  /**
   * Estilos tipográficos de prosa automáticos: headings, párrafos,
   * listas, blockquotes, code. Ideal para contenido de CMS o Markdown.
   * @default false
   */
  readonly prose?: boolean;
  /** Card-like: fondo, borde, border-radius y sombra. @default false */
  readonly elevated?: boolean;
}

// ─── Aside ─────────────────────────────────────────────────────────────────

export interface IAsideProps extends ILayoutBaseProps {
  /** Padding interno. @default "lg" */
  readonly $p?: TSpacingValue;
  /** Ancho fijo del aside. Si no se define, el padre gestiona el ancho. */
  readonly width?: CSSProperties['width'];
  /**
   * Borde lateral hacia el contenido principal.
   * "start" = borde izquierdo (aside a la derecha del main).
   * "end"   = borde derecho  (aside a la izquierda del main).
   * @default "none"
   */
  readonly border?: 'start' | 'end' | 'none';
}

// ─── SectionHeader ─────────────────────────────────────────────────────────

export interface ISectionHeaderProps extends ILayoutBaseProps {
  /** Padding vertical. @default "lg" */
  readonly $py?: TSpacingValue;
  /** Padding horizontal. @default none */
  readonly $px?: TSpacingValue;
  /** Borde inferior separador. @default false */
  readonly bordered?: boolean;
}

// ─── SectionFooter ─────────────────────────────────────────────────────────

export interface ISectionFooterProps extends ILayoutBaseProps {
  /** Padding vertical. @default "lg" */
  readonly $py?: TSpacingValue;
  /** Borde superior separador. @default false */
  readonly bordered?: boolean;
  /** Alineación del contenido. @default "left" */
  readonly align?: 'left' | 'center' | 'right' | 'between';
}

// ─── Divider ───────────────────────────────────────────────────────────────

export type TDividerOrientation = 'horizontal' | 'vertical';
export type TDividerVariant = 'solid' | 'dashed' | 'dotted';

export interface IDividerProps {
  /** @default "horizontal" */
  readonly orientation?: TDividerOrientation;
  /** Estilo de la línea. @default "solid" */
  readonly variant?: TDividerVariant;
  /** Margen alrededor del divider. @default "lg" */
  readonly spacing?: TSpacingValue;
  /** Color personalizado de la línea. @default theme.color.neutral[200] */
  readonly color?: CSSProperties['borderColor'];
  /** Texto o nodo centrado en el divider. Ejemplo: "O continúa con" */
  readonly label?: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
}
