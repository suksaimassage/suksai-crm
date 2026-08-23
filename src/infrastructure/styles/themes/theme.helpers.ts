import type { TTypographyColor } from '@infra/components/ui/core/Typography/Typography.types';
import type { TTheme } from '@infra/styles/themes/light.theme';
import { logger } from '@infra/utils/logger';
import type {
  TBorderRadius,
  TBorderStyle,
  TBorderWidths,
  TColorIntensity,
  TColorName,
  TColorScale,
} from '@infra/styles/themes/theme.types';

// ========================================
// HELPERS
// ========================================

export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

/**
 *
 */
export const ALPHAS: Record<number, number> = {
  4: 0.04,
  8: 0.08,
  12: 0.12,
  16: 0.16,
  24: 0.24,
  32: 0.32,
  48: 0.48,
  64: 0.64,
  80: 0.8,
  96: 0.96,
};

/**
 *
 * @param hex
 * @returns
 */
const hexToRgb = (hex: string) => {
  if (!hex) return { r: '', g: '', b: '' };

  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);

  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

/**
 * versión útil con alpha tokens (0.04 → 0.96)
 * @param hex
 * @param alpha
 * @returns
 */
export const toRgba = (hex: string, alpha = 1) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Obtiene un color de una escala específica
 * @param color - Nombre del color
 * @param shade - Nivel de la escala (50-900)
 */
export const getColor = (theme: TTheme, color: TColorName, shade: TColorScale): string => {
  const palette = theme.color[color];
  const value = palette[shade];
  if (!value) {
    logger.warn(`[getColor] Shade "${shade}" no existe en color "${color}"`);
    return '';
  }
  return value;
};

/**
 * Obtiene el color base (500) de una escala
 * @param color - Nombre del color
 */
export const getBaseColor = (theme: TTheme, color: TColorName) => {
  return theme.color[color][500];
};

/**
 * Genera un degradado de fondo usando los colores del tema
 */
export const gradientBackground = (
  theme: TTheme,
  variant:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'background'
    | 'error'
    | 'warning'
    | 'info' = 'background',
) => {
  return theme.color.gradient[variant];
};

/**
 * Obtiene un color de la escala de grises
 */
export const getGray = (theme: TTheme, shade: TColorScale) => {
  return theme.color.neutral[shade];
};

/**
 * Obtiene un color con opacidad
 * @param color - Nombre del color
 * @param shade - Nivel de la escala (50-900)
 * @param opacity - Opacidad (0-1)
 */
export const getColorWithOpacity = (
  theme: TTheme,
  color: TColorName,
  shade: TColorScale,
  opacity = 1,
) => {
  if (opacity === 1) return getColor(theme, color, shade);

  // Convertir hex a rgba
  const hex = getColor(theme, color, shade).replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Obtiene un color semántico con opacidad (versión legacy)
 */
export const getSemanticColor = (theme: TTheme, color: TColorName, opacity = 1) => {
  return getColorWithOpacity(theme, color, 500, opacity);
};

/**
 *
 * @param theme
 * @param color
 * @param shade
 * @returns
 */
export const getContrastText = (theme: TTheme, color: TTypographyColor, shade: number) => {
  if (color === 'inverse') return shade < 600 ? theme.color.text.primary : theme.color.text.inverse;
  if (theme.isDark) return shade < 600 ? theme.color.text.inverse : theme.color.text.primary;
  return shade >= 500 ? theme.color.text.inverse : theme.color.text.primary;
};

export const getBorder = (theme: TTheme, width: TBorderWidths) => {
  const border = {
    width: theme.border.width[width] || '0px',
    style: theme.border.style.solid,
    color: theme.border.color.neutral.light,
  };

  return border;
};

export const getShoftBorder = (theme: TTheme, width: TBorderWidths = 'xs') => {
  const border = {
    width: theme.border.width[width] || '0px',
    style: theme.border.style.solid,
    color: theme.border.color.neutral.light,
  };

  return `
    border: ${border.width} ${border.style} ${border.color};
  `;
};

export const getBorderWidth = (theme: TTheme, width: TBorderWidths) => {
  const border = {
    width: theme.border.width[width] || '0px',
    style: theme.border.style.solid,
    color: theme.border.color.neutral.light,
  };

  return `
    border: ${border.width} ${border.style} ${border.color};
  `;
};

export const getBorderRadius = (theme: TTheme, radius: TBorderRadius = 'none') => {
  const border = {
    color: theme.color.neutral[100],
    radius: theme.border.radius[radius],
  };

  return `
    border-radius: ${border.radius};
  `;
};

export const getBorderWithRadius = (
  theme: TTheme,
  width: TBorderWidths,
  radius: TBorderRadius = 'none',
) => {
  const border = {
    width: theme.border.width[width] || '0px',
    style: theme.border.style.solid,
    color: theme.border.color.neutral.light,
    radius: theme.border.radius[radius],
  };

  return `
    border: ${border.width} ${border.style} ${border.color};
    border-radius: ${border.radius};
  `;
};

export const getBorderColorIntensity = (
  theme: TTheme,
  color: TColorName = 'neutral',
  intensity: TColorIntensity = 'subtle',
) => {
  const border = {
    color: theme.border.color[color][intensity],
  };

  return `
    border-color: ${border.color};
  `;
};

export const getBorderStyle = (theme: TTheme, style: TBorderStyle = 'solid') => {
  const border = {
    style: theme.border.style[style],
  };

  return `
    border-style: ${border.style};
  `;
};

/**
 * Genera `color-mix(in oklch, ...)` para añadir alpha a cualquier color CSS,
 * incluyendo OKLCH. Reemplaza `toRgba` para tokens modernos.
 */
export const colorMixAlpha = (color: string, alpha: number): string => {
  const pct = Math.round(alpha * 100);
  return `color-mix(in oklch, ${color} ${pct}%, transparent)`;
};
