/**
 * Navbar — Types
 * ISP: interfaces pequeñas por responsabilidad.
 */

import type { ReactNode } from 'react';

// ─── Variantes visuales ───────────────────────────────────────────────────────

/**
 * Apariencia del Navbar
 *
 * "default" - Fondo blanco, borde inferior sutil
 *
 * "filled" - Fondo primario sólido
 *
 * "glass" - Blur glassmorphism, semi-transparente
 *
 * "dark"; - Fondo oscuro
 * */
export type TNavbarVariant = 'default' | 'filled' | 'glass' | 'dark' | 'suksai';

// ─── Logo (lado izquierdo) ────────────────────────────────────────────────────

/** Modo de presentación del logo */
export type TNavbarLogoMode = 'icon-text' | 'icon' | 'text';

export interface INavLogo {
  /** Elemento icono/imagen */
  readonly icon?: ReactNode;
  /** Texto del logo/marca */
  readonly title?: string;
  /** Qué mostrar. Auto-detectado si se omite. */
  readonly mode?: TNavbarLogoMode;
  /** Click handler */
  readonly onClick?: () => void;
}

// ─── Links de navegación ─────────────────────────────────────────────────────

export type TNavLinksAlign = 'left' | 'center' | 'right';

export interface INavLink {
  readonly id: string;
  /**
   * Label de la sección. Si no se define, el grupo no tiene separador
   * visible con texto (solo espacio visual).
   */
  readonly label: string;
  readonly href: string;
  readonly isActive?: boolean;
  readonly icon?: ReactNode;
}

// ─── Acciones lado derecho ────────────────────────────────────────────────────

export type TNavActionVariant = 'icon' | 'button' | 'avatar' | 'custom';

export interface INavAction {
  readonly id: string;
  readonly type: TNavActionVariant;
  /** Solo type="icon" | type="button" */
  readonly label?: string;
  /** Tooltip accesible (aria-label) */
  readonly ariaLabel: string;
  /** Icono SVG */
  readonly icon?: ReactNode;
  /** Solo type="avatar": URL o iniciales */
  readonly avatar?: { src?: string; initials?: string };
  /** Solo type="custom" */
  readonly children?: ReactNode;
  readonly onClick?: () => void;
  /** Resalta el botón (útil para CTA principal) */
  readonly primary?: boolean;
}

// ─── Navbar props ─────────────────────────────────────────────────────────────

export interface INavbarProps {
  readonly logo?: INavLogo;
  readonly links?: readonly INavLink[];
  readonly linksAlign?: TNavLinksAlign;
  readonly actions?: readonly INavAction[];
  readonly variant?: TNavbarVariant;
  /** Altura en px. Default: 64 */
  readonly height?: number;
  /** Fija el nav en la parte superior */
  readonly sticky?: boolean;
  readonly className?: string;
  readonly 'aria-label'?: string;
}

export interface IVariantTokens {
  readonly background: string;
  readonly border: string;
  readonly logoColor: string;
  readonly linkColor: string;
  readonly linkHoverColor: string;
  readonly linkActiveBg: string;
  readonly linkActiveColor: string;
  readonly actionColor: string;
  readonly actionHoverBg: string;
  readonly mobileMenuBg: string;
  readonly mobileLinkBorder: string;
}
