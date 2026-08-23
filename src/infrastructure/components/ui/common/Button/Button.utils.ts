/**
 * Button Utilities
 *
 * Responsabilidad: Funciones helper para configuración de estilos del Button.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Cada función hace una sola cosa.
 * - Dependency Inversion: Depende del theme (abstracción), no de valores
 *   hardcodeados. Los colores se obtienen desde `theme.ts`, que es la
 *   única fuente de verdad (Single Source of Truth).
 */

import { css, type DefaultTheme } from 'styled-components';
import { ALPHAS, getColor, getContrastText, toRgba } from '@infra/styles/themes/theme.helpers';
import type {
  TButtonSize,
  TButtonColor,
  TButtonVariant,
  IButtonSizeConfig,
  IButtonColorConfig,
  TButtonShape,
} from './Button.types';

// ========================================
// SIZE CONFIG
// ========================================

/**
 * Configuración de tamaños del Button.
 * Mobile First: valores base para mobile, escalan en desktop vía media query.
 */
export const getButtonSizeConfig = (size: TButtonSize): IButtonSizeConfig => {
  const sizeConfigs: Record<TButtonSize, IButtonSizeConfig> = {
    xs: {
      height: '24px',
      width: '24px',
      padding: '0 8px',
      fontSize: '12px',
      iconSize: '14px',
      gap: '4px',
    },
    sm: {
      height: '32px',
      width: '32px',
      padding: '0 12px',
      fontSize: '14px',
      iconSize: '16px',
      gap: '6px',
    },
    md: {
      height: '40px',
      width: '40px',
      padding: '0 16px',
      fontSize: '16px',
      iconSize: '18px',
      gap: '8px',
    },
    lg: {
      height: '48px',
      width: '48px',
      padding: '0 20px',
      fontSize: '18px',
      iconSize: '20px',
      gap: '10px',
    },
    xl: {
      height: '56px',
      width: '56px',
      padding: '0 24px',
      fontSize: '20px',
      iconSize: '24px',
      gap: '12px',
    },
  };

  return sizeConfigs[size];
};

export const getShapeSizeIconOnly = (
  size: TButtonSize,
  shape: TButtonShape,
): ReturnType<typeof css> => {
  const desktopShapes: Record<TButtonSize, ReturnType<typeof css>> = {
    xs: css`
      width: 26px;
    `,
    sm: css`
      width: 36px;
    `,
    md: css`
      width: 44px;
    `,
    lg: css`
      width: 52px;
    `,
    xl: css`
      width: 60px;
    `,
  };
  if (shape === 'circle' || shape === 'pill') {
    return desktopShapes[size];
  }
  return css``;
};

// ========================================
// VARIANT COLORS
// ========================================

// Colores fijos de estado deshabilitado — función para recibir theme
const getDisabledColorsTransparent = (theme: DefaultTheme) => ({
  background: 'transparent',
  color: getColor(theme, 'neutral', 500),
  border: 'transparent',
});

/**
 * Genera la configuración de colores para una combinación color+variante.
 *
 * ✅ Retorna `ButtonColorConfig` (tipado estricto) en lugar de `any`.
 *    Esto garantiza que todos los estados (normal, hover, active,
 *    disabled, loading) estén siempre presentes y correctamente tipados.
 *
 * @param color   - Color semántico del botón
 * @param variant - Variante visual del botón
 */
export const getButtonVariantColors = (
  color: TButtonColor,
  variant: TButtonVariant,
  theme: DefaultTheme,
): IButtonColorConfig => {
  const isDark = theme.isDark;
  switch (variant) {
    case 'solid':
      return {
        background: isDark ? getColor(theme, color, 500) : getColor(theme, color, 600),
        color: isDark ? getContrastText(theme, color, 600) : getContrastText(theme, color, 600),
        border: isDark ? getColor(theme, color, 500) : getColor(theme, color, 500),
        hover: {
          background: isDark ? getColor(theme, color, 600) : getColor(theme, color, 600),
          color: isDark ? getContrastText(theme, color, 600) : getContrastText(theme, color, 600),
          border: isDark ? getColor(theme, color, 600) : getColor(theme, color, 600),
        },
        active: {
          background: getColor(theme, color, 700),
          color: getContrastText(theme, color, 700),
          border: getColor(theme, color, 700),
        },
        loading: {
          background: isDark
            ? toRgba(getColor(theme, color, 600), ALPHAS[32])
            : getColor(theme, color, 400),
          color: getContrastText(theme, color, 400),
          border: getColor(theme, color, 400),
        },
        disabled: {
          background: isDark ? theme.color.neutral[300] : theme.color.neutral[400],
          color: isDark
            ? getContrastText(theme, 'neutral', 400)
            : getContrastText(theme, 'neutral', 500),
          border: isDark ? theme.color.neutral[400] : theme.color.neutral[100],
        },
      };

    case 'outlined':
      return {
        background: 'transparent',
        color: isDark ? getColor(theme, color, 500) : getColor(theme, color, 600),
        border: isDark ? getColor(theme, color, 700) : getColor(theme, color, 600),
        hover: {
          background: isDark ? toRgba(getColor(theme, color, 900), ALPHAS[32]) : 'transparent',
          color: isDark ? getColor(theme, color, 400) : getColor(theme, color, 700),
          border: isDark ? getColor(theme, color, 500) : getColor(theme, color, 600),
        },
        active: {
          background: isDark ? getColor(theme, color, 800) : getColor(theme, color, 100),
          color: getContrastText(theme, color, 800),
          border: isDark ? getColor(theme, color, 700) : getColor(theme, color, 700),
        },
        disabled: {
          ...getDisabledColorsTransparent(theme),
          border: theme.color.neutral[100],
        },
        loading: {
          background: getColor(theme, color, 50),
          color: getContrastText(theme, color, 500),
          border: getColor(theme, color, 400),
        },
      };

    case 'dashed':
      return {
        background: 'transparent',
        color: isDark ? getContrastText(theme, color, 600) : getColor(theme, color, 600),
        border: getColor(theme, color, 500),
        hover: {
          background: isDark
            ? toRgba(getColor(theme, color, 900), ALPHAS[32])
            : getColor(theme, color, 200),
          color: isDark ? getContrastText(theme, color, 700) : getColor(theme, color, 600),
          border: getColor(theme, color, 600),
        },
        active: {
          background: getColor(theme, color, 100),
          color: getContrastText(theme, color, 800),
          border: getColor(theme, color, 700),
        },
        disabled: {
          ...getDisabledColorsTransparent(theme),
          border: theme.color.neutral[100],
        },
        loading: {
          background: getColor(theme, color, 50),
          color: getContrastText(theme, color, 500),
          border: getColor(theme, color, 400),
        },
      };

    case 'filled':
      return {
        background: isDark
          ? toRgba(getColor(theme, color, 900), ALPHAS[32])
          : getColor(theme, color, 100),
        color: isDark ? getContrastText(theme, color, 700) : getColor(theme, color, 600),
        border: isDark ? getColor(theme, color, 900) : getColor(theme, color, 100),
        hover: {
          background: theme.isDark
            ? toRgba(getColor(theme, color, 900), ALPHAS[32])
            : getColor(theme, color, 200),
          color: isDark ? getContrastText(theme, color, 800) : getColor(theme, color, 600),
          border: isDark ? getColor(theme, color, 800) : getColor(theme, color, 200),
        },
        active: {
          background: theme.isDark
            ? toRgba(getColor(theme, color, 900), ALPHAS[32])
            : getColor(theme, color, 300),
          color: getContrastText(theme, color, 900),
          border: getColor(theme, color, 300),
        },
        disabled: {
          background: theme.color.neutral[50] || '',
          color: getContrastText(theme, 'neutral', 500),
          border: theme.color.neutral[50] || '',
        },
        loading: {
          background: getColor(theme, color, 100),
          color: getContrastText(theme, color, 600),
          border: getColor(theme, color, 100),
        },
      };

    case 'text':
      return {
        background: 'transparent',
        color: isDark ? getContrastText(theme, color, 600) : getColor(theme, color, 600),
        border: 'transparent',
        hover: {
          background: isDark
            ? toRgba(getColor(theme, color, 900), ALPHAS[32])
            : getColor(theme, color, 50),
          color: isDark ? getContrastText(theme, color, 800) : getColor(theme, color, 600),
          border: 'transparent',
        },
        active: {
          background: getColor(theme, color, 100),
          color: getContrastText(theme, color, 800),
          border: 'transparent',
        },
        disabled: getDisabledColorsTransparent(theme),
        loading: {
          background: 'transparent',
          color: getContrastText(theme, color, 500),
          border: 'transparent',
        },
      };

    case 'link':
      return {
        background: 'transparent',
        color: isDark ? getContrastText(theme, color, 600) : getColor(theme, color, 600),
        border: 'transparent',
        hover: {
          background: 'transparent',
          color: isDark ? getContrastText(theme, color, 800) : getColor(theme, color, 600),
          border: 'transparent',
        },
        active: {
          background: 'transparent',
          color: getContrastText(theme, color, 800),
          border: 'transparent',
        },
        disabled: getDisabledColorsTransparent(theme),
        loading: {
          background: 'transparent',
          color: getContrastText(theme, color, 500),
          border: 'transparent',
        },
      };

    case 'ghost':
      return {
        background: 'transparent',
        color: isDark ? getContrastText(theme, color, 600) : getColor(theme, color, 600),
        border: 'transparent',
        hover: {
          background: 'transparent',
          color: isDark ? getContrastText(theme, color, 800) : getColor(theme, color, 600),
          border: 'transparent',
        },
        active: {
          background: isDark ? getColor(theme, color, 800) : getColor(theme, color, 200),
          color: getContrastText(theme, color, 800),
          border: isDark ? getColor(theme, color, 800) : getColor(theme, color, 200),
        },
        disabled: getDisabledColorsTransparent(theme),
        loading: {
          background: getColor(theme, color, 50),
          color: getContrastText(theme, color, 500),
          border: 'transparent',
        },
      };

    default: {
      // Exhaustive check: TypeScript alertará si se agrega una variante
      // sin actualizar este switch.
      const _exhaustiveCheck: never = variant;
      return getButtonVariantColors(_exhaustiveCheck, 'solid', theme);
    }
  }
};
