/**
 * Sidebar — Types & Interfaces
 *
 * Contratos del componente de navegación vertical.
 *
 * Principios SOLID:
 * - Interface Segregation: interfaces pequeñas y específicas por responsabilidad.
 * - Dependency Inversion: el componente depende de estas abstracciones,
 *   no de implementaciones concretas.
 * - Open/Closed: extensible via props sin tocar la implementación base.
 *
 * Relación con Navbar:
 *   Comparte NavLink y NavLogo del Navbar (mismo contrato semántico).
 *   Diferencia: el Sidebar añade grupos, secciones, badges e iconos
 *   que no tienen sentido en un Navbar horizontal.
 */

import type { ReactNode, CSSProperties } from 'react';
import type { INavLink, INavLogo } from '@infra/components/ui/common/Navbar/Navbar.types';

// Re-exportar para que los consumidores del Sidebar no necesiten
// importar desde Navbar — Dependency Inversion en acción.
export type { INavLink, INavLogo };

// ─── Sidebar variant ───────────────────────────────────────────────────────

/**
 * Variante visual del Sidebar.
 *
 * dark  → fondo oscuro (gray[900]), ideal para dashboards de aplicación.
 * light → fondo claro (bg.light), para apps más ligeras o landing interno.
 * ghost → sin fondo propio, hereda el del layout padre.
 */
export type TSidebarVariant = 'dark' | 'light' | 'ghost' | 'suksai';

// ─── Sidebar placement ─────────────────────────────────────────────────────

/** Posición del Sidebar en el layout. @default "left" */
export type TSidebarPlacement = 'left' | 'right';

// ─── Sidebar item ──────────────────────────────────────────────────────────

/**
 * SidebarItem extiende NavLink con capacidades de UI específicas
 * de navegación vertical: icono, badge y subitems (anidado).
 */
export interface ISidebarItem extends INavLink {
  /** Icono que precede al label. */
  readonly icon?: ReactNode;
  /**
   * Badge numérico o de texto (notificaciones, contadores).
   * Ej: 3, "Nuevo", "Beta"
   */
  readonly badge?: string | number;
  /**
   * Sub-items para menús anidados (un nivel máximo).
   * Mantener la jerarquía plana: más de un nivel confunde al usuario.
   */
  readonly children?: readonly ISidebarItem[];
  /** Deshabilita el item sin eliminarlo visualmente. @default false */
  readonly disabled?: boolean;

  /** Deshabilita el item sin eliminarlo visualmente. @default false */
  readonly dividerBefore?: boolean;

  readonly href: string;
}

// ─── Sidebar group ─────────────────────────────────────────────────────────

/**
 * Grupo semántico de items con label de sección.
 * Permite organizar la navegación en categorías visuales.
 *
 * Ejemplo de uso real:
 *   Grupo "Principal" → Dashboard, Analytics, Reportes
 *   Grupo "Configuración" → Perfil, Ajustes, Seguridad
 */
export interface ISidebarGroup {
  readonly id: string;
  /**
   * Label de la sección. Si no se define, el grupo no tiene separador
   * visible con texto (solo espacio visual).
   */
  readonly label?: string;
  readonly items: readonly ISidebarItem[];
}

// ─── Sidebar props ─────────────────────────────────────────────────────────

export interface ISidebarProps {
  // ── Contenido ──────────────────────────────────────────────────────────

  /** Logo / identidad de la aplicación. */
  readonly logo?: INavLogo;

  /**
   * Estructura de navegación: grupos con items o items planos.
   * Si se pasan items planos, se envuelven en un grupo sin label.
   */
  readonly groups?: readonly ISidebarGroup[];

  /**
   * Atajo para pasar items sin estructura de grupos.
   * Si se pasa junto a `groups`, `items` se ignora.
   */
  readonly items?: readonly ISidebarItem[];

  /**
   * Contenido adicional en el pie del sidebar.
   * Ideal para: perfil de usuario, logout, versión de app.
   */
  readonly footer?: ReactNode;

  // ── Estado ─────────────────────────────────────────────────────────────

  /**
   * Estado colapsado (solo iconos, sin labels).
   * Si es undefined, el estado es gestionado internamente.
   * Si se define, el componente es controlado externamente.
   */
  readonly collapsed?: boolean;

  /**
   * Estado de apertura en mobile (overlay).
   * Si es undefined, el estado es gestionado internamente.
   */
  readonly mobileOpen?: boolean;

  // ── Comportamiento ─────────────────────────────────────────────────────

  /** Callback cuando el usuario colapsa o expande en desktop. */
  readonly onCollapseChange?: (collapsed: boolean) => void;

  /** Callback cuando el usuario cierra en mobile. */
  readonly onMobileClose?: () => void;

  /** Callback cuando se hace click en el logo. */
  readonly onLogoClick?: () => void;

  /** Callback cuando se hace click en un item. */
  readonly onItemClick?: (item: ISidebarItem) => void;

  // ── Apariencia ─────────────────────────────────────────────────────────

  /** @default "dark" */
  readonly variant?: TSidebarVariant;

  /** @default "left" */
  readonly placement?: TSidebarPlacement;

  /**
   * Ancho expandido en desktop.
   * @default "260px"
   */
  readonly width?: string;

  /**
   * Ancho colapsado en desktop (solo iconos).
   * @default "72px"
   */
  readonly collapsedWidth?: string;

  // ── Miscelánea ─────────────────────────────────────────────────────────

  readonly className?: string;
  readonly style?: CSSProperties;

  /**
   * Activa el campo de búsqueda integrado.
   * - false → no se muestra (default)
   * - true → se muestra con placeholder "Buscar..."
   * - objeto → configuración avanzada { placeholder }
   */
  readonly search?: boolean | { placeholder?: string };

  readonly 'aria-label'?: string;
}

// ─── useSidebar return ─────────────────────────────────────────────────────

/** Contrato del hook interno de estado del Sidebar. */
export interface IUseSidebarState {
  readonly collapsed: boolean;
  readonly mobileOpen: boolean;
  readonly expandedGroups: ReadonlySet<string>;
  readonly toggleCollapsed: () => void;
  readonly toggleMobile: () => void;
  readonly closeMobile: () => void;
  readonly toggleGroup: (groupId: string) => void;
  readonly openGroup: (groupId: string) => void;
  readonly isGroupExpanded: (groupId: string) => boolean;
}

// ─── Sidebar search ────────────────────────────────────────────────────────

/**
 * Props para el sub-componente SidebarSearch.
 * Campo de búsqueda integrado en el Sidebar que filtra items en tiempo real.
 */
export interface ISidebarSearchProps {
  /** Placeholder del input. @default "Buscar..." */
  readonly placeholder?: string;
  /** Valor controlado externamente. */
  readonly value?: string;
  /** Callback cuando el valor cambia. */
  readonly onChange?: (value: string) => void;
  /** Se oculta visualmente en modo collapsed (solo icono). */
  readonly collapsed?: boolean;
  /** Variante visual heredada del Sidebar padre. @default "dark" */
  readonly variant?: TSidebarVariant;
  readonly className?: string;
}
