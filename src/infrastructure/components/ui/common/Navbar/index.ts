/**
 * Navbar — Public API
 *
 * @example
 * import Navbar, { NAV_LINKS } from "@ui/common/Navbar";
 * import type { NavbarProps, NavLogo, NavLink, NavAction } from "@ui/common/Navbar";
 */

// Default export (compatibilidad con import existente)
export { Navbar } from './Navbar';

// Types
export type {
  INavbarProps,
  TNavbarVariant,
  INavLogo,
  INavLink,
  INavAction,
  TNavActionVariant,
  TNavLinksAlign,
  TNavbarLogoMode,
} from './Navbar.types';
