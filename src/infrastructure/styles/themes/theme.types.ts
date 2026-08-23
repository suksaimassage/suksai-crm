/**
 * Theme Configuration Types
 *
 * Centraliza todos los design tokens del proyecto
 * Siguiendo el principio de Single Responsibility
 */

export interface ITheme {
  readonly color: IColor;
  readonly border: IBorder;
  readonly typography: ITypography;
  readonly spacing: ISpacing;
  readonly transition: ITransition;
  readonly effect: IEffect;
  readonly zIndex: IZIndex;
  readonly breakpoint: IBreakpoint;
  readonly isDark: boolean;
}

// ========================================
// GENERAL
// ========================================

export type TSizes = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TSizesExtended = TSizes | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl';
export type TBreakpointKey = TSizes;
export type TResponsiveValue = Partial<Record<TBreakpointKey, string>>;

// ========================================
// COLORS - Color System
// ========================================
export type TColorName =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'neutral'
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'neutralWarm'
  | 'neutralDark';

export type TColorScale = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

interface IBrandAgendaColor {
  readonly gold: {
    readonly 50: string;
    readonly 100: string;
    readonly 300: string;
    readonly 400: string;
    readonly 700: string;
    readonly bg: string;
    readonly bgHero: string;
    readonly bgNow: string;
    readonly border: string;
    readonly pendingBorder: string;
    readonly glow: string;
    readonly subText: string;
  };
  readonly jungle: {
    readonly 700: string;
    readonly 900: string;
    readonly bg: string;
    readonly border: string;
  };
  readonly clay: {
    readonly 500: string;
    readonly 600: string;
    readonly bg: string;
    readonly border: string;
    readonly tint: string;
  };
  readonly lotus: {
    readonly bg: string;
    readonly border: string;
    readonly text: string;
  };
  readonly ink: {
    readonly 500: string;
    readonly 700: string;
    readonly 900: string;
  };
  readonly agenda: {
    readonly gridLine: string;
    readonly nowTrackBg: string;
    readonly blockHatchA: string;
    readonly blockHatchB: string;
  };
  readonly therapistAccent: {
    readonly a: string;
    readonly aBg: string;
    readonly b: string;
    readonly bBg: string;
    readonly c: string;
    readonly cBg: string;
    readonly d: string;
    readonly dBg: string;
    readonly e: string;
    readonly eBg: string;
    readonly f: string;
    readonly fBg: string;
  };
}

interface IColor {
  readonly primary: IColorScale;
  readonly secondary: IColorScale;
  readonly tertiary: IColorScale;
  readonly neutral: IColorScale;
  readonly success: IColorScale;
  readonly info: IColorScale;
  readonly warning: IColorScale;
  readonly error: IColorScale;
  readonly neutralWarm: IColorScale;
  readonly neutralDark: IColorScale;
  readonly accent: IAccentColor;
  readonly background: IBackgroundColor;
  readonly text: ITextColor;
  readonly gradient: IGradientColor;
  readonly overlay: IOverlayColor;
  readonly scrollbar: IScrollbarThumbColor;
  readonly intent: IIntentColor;
  readonly brand: IBrandAgendaColor;
}

interface IColorScale {
  readonly 50: string;
  readonly 100: string;
  readonly 200: string;
  readonly 300: string;
  readonly 400: string;
  readonly 500: string;
  readonly 600: string;
  readonly 700: string;
  readonly 800: string;
  readonly 900: string;
}

type ColorShade = keyof IColorScale;
type GetColorShade<K extends keyof IColor, S extends ColorShade> = IColor[K] extends IColorScale
  ? IColor[K][S]
  : never;
interface IColorIntensity<K extends keyof IColor> {
  // color.50
  readonly inverse?: GetColorShade<K, 50>;
  // color.100
  readonly divider?: GetColorShade<K, 100>;
  // color.100 - Subtle borders (para fondos claros)
  readonly subtle?: GetColorShade<K, 100>;
  // color.200
  readonly light: GetColorShade<K, 200>;
  // color.300
  readonly medium: GetColorShade<K, 300>;
  // color.500
  readonly strong: GetColorShade<K, 500>;
  // color.700
  readonly dark: GetColorShade<K, 700>;
}

export type TColorIntensity = 'subtle' | 'light' | 'medium' | 'strong' | 'dark';

// ========================================
// SEMANTIC COLORS
// Estados y notificaciones
// ========================================
interface IAccentColor {
  readonly primary: IColor['primary'][500];
  readonly secondary: IColor['secondary'][500];
  readonly tertiary: IColor['tertiary'][500];
}

interface IBackgroundColor {
  readonly light: string;
  readonly neutral: string;
  readonly dark: string;
  readonly card: string;
  readonly elevated: string;
  readonly overlay: string;
  readonly sidebar: string;
  readonly tooltip: string;
  readonly badge: string;
}

interface ITextColor {
  readonly primary: string;
  readonly secondary: string;
  readonly tertiary: string;
  readonly neutral: string;
  readonly neutralWarm?: string;
  readonly neutralDark?: string;
  readonly muted: string;
  readonly inverse: string;
  readonly link: string;
  readonly linkHover: string;
  readonly success: string;
  readonly info: string;
  readonly warning: string;
  readonly error: string;
  readonly disabled: string;
  readonly placeholder: string;
}

interface IGradientColor {
  readonly primary: string;
  readonly secondary: string;
  readonly tertiary: string;
  readonly neutral: string;
  readonly success: string;
  readonly info: string;
  readonly warning: string;
  readonly error: string;
  readonly background: string;
}

interface IOverlayColor {
  readonly primary: string;
  readonly secondary: string;
  readonly light: string;
  readonly dark: string;
}

interface IIntentColor {
  readonly primary: string;
  readonly primaryHover: string;
  readonly focusRing: string; // WCAG 2.2 AA (1.4.11) focus indicator — ≥3:1 on its mode surfaces
  readonly secondary: string;
  readonly tertiary: string;
  readonly success: string;
  readonly error: string;
  readonly errorSubtle: string;
  readonly errorZone: string;
  readonly successZone: string;
  readonly warningZone: string;
  readonly infoZone: string;
  readonly warning: string;
  readonly info: string;
}

interface IScrollbarThumbColor {
  readonly scrollbarThumb: string;
  readonly scrollbarThumbHover: string;
}

// ========================================
// BORDERS - Width & Color System
// ========================================
interface IBorder {
  readonly width: IBorderWidth;
  readonly color: IBorderColor;
  readonly style: IBorderStyle;
  readonly radius: IBorderRadius;
}

// ========================================
// COLORED BORDERS - Brand Colors
// Combinan con fondos de colores
// ========================================
interface IBorderColor {
  readonly primary: IColorIntensity<'primary'>;
  readonly secondary: IColorIntensity<'secondary'>;
  readonly tertiary: IColorIntensity<'tertiary'>;
  readonly neutral: IColorIntensity<'neutral'>;
  readonly neutralWarm: IColorIntensity<'neutralWarm'>;
  readonly neutralDark: IColorIntensity<'neutralDark'>;
  readonly success: IColorIntensity<'success'>;
  readonly info: IColorIntensity<'info'>;
  readonly warning: IColorIntensity<'warning'>;
  readonly error: IColorIntensity<'error'>;
}

// ========================================
// BORDER WIDTHS
// ========================================
interface IBorderWidth {
  readonly none: string;
  readonly xs: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
}

export type TBorderWidths = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// ========================================
// BORDER STYLES
// ========================================
interface IBorderStyle {
  readonly solid: string;
  readonly dashed: string;
  readonly dotted: string;
}

export type TBorderStyle = 'solid' | 'dashed' | 'dotted';

// ========================================
// BORDER RADIUS - Modern & Smooth
// ========================================
export interface IBorderRadius {
  readonly none: string;
  // Subtle - Chips, badges
  readonly xs: string;
  // Small - Small buttons, inputs
  readonly sm: string;
  // Medium - Standard buttons, cards
  readonly md: string;
  // Large - Cards, modals
  readonly lg: string;
  // Extra large - Hero cards, sections
  readonly xl?: string;
  // 2X large - Large containers
  readonly '2xl'?: string;
  // 3X large - Feature sections
  readonly '3xl'?: string;
  // Pill/Circle - Pills, avatars
  readonly full: string;
}

export type TBorderRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

// ========================================
// TYPOGRAPHY SCALE SYSTEM
// Mobile First - Escalas responsivas
// ========================================
type TTypographyFont = string;
type TTypographyWeight = 300 | 400 | 500 | 600 | 700 | 800 | 900;
// Tipo genérico que extrae el valor de una clave específica de TypographyFont
type FontValue<K extends keyof ITypographyFont> = ITypographyFont[K];

interface ITypography {
  readonly font: ITypographyFont;
  readonly weight: ITypographyWeight;
  readonly size: ITypographySize;
  readonly type: ITypographyTypes;
}

interface ITypographyFont {
  // Para títulos y headings
  readonly display: TTypographyFont;
  // Para body, content, subtitles
  readonly body: TTypographyFont;
  // Para código
  readonly mono: TTypographyFont;
}

interface ITypographyWeight {
  // 300
  readonly light: TTypographyWeight;
  // 400
  readonly regular: TTypographyWeight;
  // 500
  readonly medium: TTypographyWeight;
  // 600
  readonly semibold: TTypographyWeight;
  // 700
  readonly bold: TTypographyWeight;
}

/**
 * Atomic typographic size tokens.
 *
 * Scale (Major Third ≈1.25, base=16px):
 *   3xs=8  | 2xs=10 | xs=12  | sm=14  | md=16  | lg=18
 *   xl=20  | 2xl=24 | 3xl=30 | 4xl=36 | 5xl=48 | 6xl=60 | 7xl=72
 *
 * ADDED: "3xs" (8px) and "2xs" (10px) for dense UI contexts.
 */
interface ITypographySize {
  // 8px — micro labels, dense badges (NEW)
  readonly '3xs'?: string;
  // 10px — dense UI, overlines (NEW)
  readonly '2xs'?: string;
  // 12px
  readonly xs: string;
  // 14px
  readonly sm: string;
  // 16px
  readonly md: string;
  // 18px
  readonly lg?: string;
  // 20px
  readonly xl?: string;
  // 24px
  readonly '2xl'?: string;
  // 30px
  readonly '3xl'?: string;
  // 36px
  readonly '4xl'?: string;
  // 48px
  readonly '5xl'?: string;
  // 60px
  readonly '6xl'?: string;
  // 72px
  readonly '7xl'?: string;
}

interface ITypographyLineHeight {
  // 12px
  readonly xs: string;
  // 14px
  readonly sm?: string;
  // 14px
  readonly md?: string;
}

interface ITypographyTypes {
  readonly h1: TypographyTypeDefinition<'display'>;
  readonly h2: TypographyTypeDefinition<'display'>;
  readonly h3: TypographyTypeDefinition<'display'>;
  readonly h4: TypographyTypeDefinition<'display'>;
  readonly h5: TypographyTypeDefinition<'display'>;
  readonly h6: TypographyTypeDefinition<'display'>;
  readonly largeTitle: TypographyTypeDefinition<'display'>;
  readonly subtitle: TypographyTypeDefinition<'body'>;
  readonly headline: TypographyTypeDefinition<'display'>;
  readonly body: TypographyTypeDefinition<'body'>;
  readonly content: TypographyTypeDefinition<'body'>;
  readonly caption1: TypographyTypeDefinition<'body'>;
  readonly caption2: TypographyTypeDefinition<'mono'>;
  readonly label: TypographyTypeDefinition<'body'>; // NEW
  readonly footnote: TypographyTypeDefinition<'body'>;
  readonly code: TypographyTypeDefinition<'mono'>;
}

interface TypographyTypeDefinition<F extends keyof ITypographyFont> {
  readonly fontFamily: FontValue<F>;
  readonly fontSize: ITypographySize;
  readonly fontWeight: TTypographyWeight;
  readonly lineHeight: ITypographyLineHeight;
}

// ========================================
// SPACING SYSTEM
// Sistema de espaciado basado en escala 4px
// Base: 4px | Factor multiplicador: 4px × n
// ========================================
export interface ISpacing {
  // Extra extra small
  readonly xxs: string;
  // Extra small
  readonly xs: string;
  // Small
  readonly sm: string;
  // Medium (base)
  readonly md: string;
  // Large
  readonly lg: string;
  // Extra large
  readonly xl: string;
  // 2× Extra large
  readonly '2xl'?: string;
  // 3× Extra large
  readonly '3xl'?: string;
  // 4× Extra large
  readonly '4xl'?: string;
  // 5× Extra large
  readonly '5xl'?: string;
  // 6× Extra large
  readonly '6xl'?: string;
  // 7× Extra large
  readonly '7xl'?: string;
  // 8× Extra large
  readonly '8xl'?: string;
}

// ========================================
// TRANSITIONS
// Duraciones y timing functions
// ========================================
type TDuration = '150ms' | '200ms' | '300ms' | '500ms';

interface ITransition {
  readonly duration: ITransitionDuration;
  readonly timing: ITransitionTimming;
}

interface ITransitionDuration {
  readonly fast: TDuration;
  readonly base: TDuration;
  readonly slow: TDuration;
  readonly slower: TDuration;
}

interface ITransitionTimming {
  readonly ease: string;
  readonly easeIn: string;
  readonly easeOut: string;
  readonly easeInOut: string;
  readonly sharp: string;
  readonly drawer: string;
}

// ========================================
// EFFECTS - Shadows & Blurs System
// ========================================
type TEffectSpeed = '1s' | '1.5s' | '2s';

interface IEffect {
  readonly shadow: IEffectShadow;
  readonly blur: IEffectSize;
  readonly glow: IEffectGlow;
  readonly skeleton: IEffectSkeleton;
  readonly elevation: IElevation;
  readonly easing: IEasing;
}

// ========================================
// (xs → xl)
// ========================================
interface IEffectSize {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

// ========================================
// SHADOWS
// Elevation system (xs → xl)
// ========================================
interface IEffectShadow {
  readonly primary?: IEffectSize;
  readonly secondary?: IEffectSize;
  readonly tertiary?: IEffectSize;
  readonly neutral?: IEffectSize;
  readonly success?: IEffectSize;
  readonly info?: IEffectSize;
  readonly warning?: IEffectSize;
  readonly error?: IEffectSize;
  readonly inner?: IEffectSize;
  readonly outer: IEffectSize;
}

// ========================================
// GLOW EFFECTS
// Para elementos que brillan
// ========================================
interface IEffectGlow {
  readonly primary?: IEffectSize;
  readonly secondary?: IEffectSize;
  readonly tertiary?: IEffectSize;
  readonly neutral?: IEffectSize;
  readonly success?: IEffectSize;
  readonly info?: IEffectSize;
  readonly warning?: IEffectSize;
  readonly error?: IEffectSize;
}

// ========================================
// SKELETON LOADING
// Animaciones de carga con shimmer effect
// ========================================
interface IEffectSkeleton {
  // Opacidad del fondo base
  readonly baseColor: string;
  // Color del brillo
  readonly shimmerColor: string;
  // Animación del shimmer
  readonly animation: IEffectSkeletonAnimation;
  // Gradientes para el shimmer effect
  readonly gradient: IEffectSkeletonGradient;
  // Variantes de velocidad
  readonly speed: IEffectSkeletonSpeed;
}

interface IEffectSkeletonAnimation {
  readonly duration: TEffectSpeed;
  readonly timingFunction: string;
  readonly iterationCount: string;
}

interface IEffectSkeletonGradient {
  readonly light: string;
  readonly dark: string;
}

interface IEffectSkeletonSpeed {
  readonly slow: TEffectSpeed;
  readonly normal: TEffectSpeed;
  readonly fast: TEffectSpeed;
}

// ========================================
// ELEVATION LEVELS
// Niveles semánticos de elevación
// ========================================
interface IElevation {
  readonly base: string;
  readonly raised: string;
  readonly overlay: string;
  readonly modal: string;
  readonly popover: string;
}

interface IEasing {
  readonly out: string;
  readonly inOut: string;
}

// ========================================
// Z-INDEX
// Niveles de apilamiento semánticos
// ========================================
interface IZIndex {
  readonly hide: number;
  readonly base: number;
  readonly dropdown: number;
  readonly sticky: number;
  readonly fixed: number;
  readonly overlay: number;
  readonly modal: number;
  readonly popover: number;
  readonly toast: number;
  readonly tooltip: number;
}

// ========================================
// BREAKPOINTS
// ========================================
export interface IBreakpoint {
  // Extra small devices (phones portrait)
  xs: string;
  // Small devices (phones landscape)
  sm: string;
  // Medium devices (tablets)
  md: string;
  // Large devices (desktops)
  lg: string;
  // Extra large devices (large desktops)
  xl: string;
  // 2X large devices (larger desktops)
  '2xl': string;
  // 3X large devices (HD displays)
  '3xl': string;
  // 4X large devices (4K displays)
  '4xl': string;
}
