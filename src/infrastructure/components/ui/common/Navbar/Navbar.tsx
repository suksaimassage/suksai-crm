/**
 * Navbar — Barra de navegación horizontal
 *
 * SOLID:
 * - SRP: cada sub-componente (Logo, Links, Actions, Mobile) tiene una responsabilidad.
 * - OCP: variantes y acciones extensibles via props.
 * - ISP: interfaces mínimas por responsabilidad.
 * - DIP: depende de abstracciones (tipos), no implementaciones.
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  INavbarProps,
  INavLogo,
  INavLink,
  INavAction,
  TNavbarVariant,
  TNavbarLogoMode,
  TNavLinksAlign,
} from './Navbar.types';
import * as S from './Navbar.styles';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconMenu = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M3 5h14M3 10h14M3 15h14"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// ─── Logo ─────────────────────────────────────────────────────────────────────

/**
 * NavbarLogo — Responsabilidad: renderizar el logo según su modo.
 * Auto-detecta el modo si no se especifica.
 */
const NavbarLogo: React.FC<{ logo: INavLogo; variant: TNavbarVariant }> = ({ logo, variant }) => {
  const mode: TNavbarLogoMode =
    logo.mode ?? (logo.icon && logo.title ? 'icon-text' : logo.icon ? 'icon' : 'text');

  return (
    <S.LogoWrap
      $variant={variant}
      onClick={logo.onClick}
      aria-label={logo.title ?? 'Inicio'}
      type="button"
    >
      {(mode === 'icon-text' || mode === 'icon') && logo.icon && (
        <S.LogoIcon>{logo.icon}</S.LogoIcon>
      )}
      {(mode === 'icon-text' || mode === 'text') && logo.title && (
        <S.LogoText>{logo.title}</S.LogoText>
      )}
    </S.LogoWrap>
  );
};

// ─── Desktop links ────────────────────────────────────────────────────────────

/**
 * NavbarLinks — Responsabilidad: lista de links desktop con alineación.
 */
const NavbarLinks: React.FC<{
  links: readonly INavLink[];
  linksAlign: TNavLinksAlign;
  variant: TNavbarVariant;
  onLinkClick?: (link: INavLink) => void;
}> = ({ links, linksAlign, variant, onLinkClick }) => {
  const { t } = useTranslation('common');
  return (
    <S.NavLinks $align={linksAlign} $variant={variant} aria-label={t('navbar.navAriaLabel')}>
      {links.map((link) => (
        <S.NavLinkItem
          key={link.id}
          href={link.href}
          $variant={variant}
          $isActive={!!link.isActive}
          aria-current={link.isActive ? 'page' : undefined}
          onClick={(e) => {
            if (onLinkClick) {
              e.preventDefault();
              onLinkClick(link);
            }
          }}
        >
          {link.icon}
          {link.label}
        </S.NavLinkItem>
      ))}
    </S.NavLinks>
  );
};

// ─── Action renderers ─────────────────────────────────────────────────────────

/**
 * NavbarAction — Responsabilidad: renderizar una acción del lado derecho.
 * Soporta: icon | button | avatar | custom.
 */
const NavbarAction: React.FC<{
  action: INavAction;
  variant: TNavbarVariant;
}> = ({ action, variant }) => {
  if (action.type === 'icon') {
    return (
      <S.ActionIconBtn
        $variant={variant}
        onClick={action.onClick}
        aria-label={action.ariaLabel}
        title={action.ariaLabel}
        type="button"
      >
        {action.icon}
      </S.ActionIconBtn>
    );
  }

  if (action.type === 'button') {
    return (
      <S.ActionBtn
        $variant={variant}
        $primary={!!action.primary}
        onClick={action.onClick}
        aria-label={action.ariaLabel}
        type="button"
      >
        {action.icon}
        {action.label}
      </S.ActionBtn>
    );
  }

  if (action.type === 'avatar') {
    const { src, initials } = action.avatar ?? {};
    return (
      <S.AvatarBtn
        $variant={variant}
        onClick={action.onClick}
        aria-label={action.ariaLabel}
        title={action.ariaLabel}
        type="button"
      >
        {src ? (
          <img src={src} alt={action.ariaLabel} />
        ) : (
          <S.AvatarInitials>{initials ?? '?'}</S.AvatarInitials>
        )}
      </S.AvatarBtn>
    );
  }

  // type="custom"
  return <>{action.children}</>;
};

// ─── Actions strip ────────────────────────────────────────────────────────────

/**
 * NavbarActions — Responsabilidad: lista de acciones del lado derecho
 * con soporte a dividers entre grupos.
 */
const NavbarActions: React.FC<{
  actions: readonly INavAction[];
  variant: TNavbarVariant;
}> = ({ actions, variant }) => (
  <S.ActionsWrap>
    {actions.map((action) => (
      <React.Fragment key={action.id}>
        {/* Divider automático cuando el id empieza con "divider" */}
        {action.id.startsWith('divider') ? (
          <S.ActionDivider $variant={variant} aria-hidden="true" />
        ) : (
          <NavbarAction action={action} variant={variant} />
        )}
      </React.Fragment>
    ))}
  </S.ActionsWrap>
);

// ─── Mobile menu ──────────────────────────────────────────────────────────────

/**
 * MobileMenu — Responsabilidad: drawer de links y acciones en mobile.
 */
const MobileMenuPanel: React.FC<{
  open: boolean;
  links: readonly INavLink[];
  actions: readonly INavAction[];
  variant: TNavbarVariant;
  height: number;
  onClose: () => void;
  onLinkClick?: (link: INavLink) => void;
}> = ({ open, links, actions, variant, height, onClose, onLinkClick }) => {
  const { t } = useTranslation('common');
  const buttonActions = actions.filter(
    (a) => !a.id.startsWith('divider') && (a.type === 'button' || a.type === 'icon'),
  );

  return (
    <S.MobileMenu
      $open={open}
      $variant={variant}
      $height={height}
      aria-hidden={!open}
      role="dialog"
      aria-label={t('navbar.menuAriaLabel')}
    >
      <S.MobileMenuInner>
        {/* Links */}
        {links.map((link) => (
          <S.MobileLinkItem
            key={link.id}
            href={link.href}
            $variant={variant}
            $isActive={!!link.isActive}
            aria-current={link.isActive ? 'page' : undefined}
            onClick={(e) => {
              onClose();
              if (onLinkClick) {
                e.preventDefault();
                onLinkClick(link);
              }
            }}
          >
            {link.icon}
            {link.label}
          </S.MobileLinkItem>
        ))}

        {/* Divider + acciones tipo button en mobile */}
        {buttonActions.length > 0 && (
          <>
            <S.MobileDivider $variant={variant} />
            {buttonActions.map((action) => (
              <S.MobileLinkItem
                key={action.id}
                as="button"
                href={undefined}
                $variant={variant}
                $isActive={false}
                onClick={() => {
                  onClose();
                  action.onClick?.();
                }}
                type="button"
              >
                {action.icon}
                {action.label ?? action.ariaLabel}
              </S.MobileLinkItem>
            ))}
          </>
        )}
      </S.MobileMenuInner>
    </S.MobileMenu>
  );
};

// ─── Navbar (main) ────────────────────────────────────────────────────────────

export const Navbar: React.FC<INavbarProps> = ({
  logo,
  links = [],
  linksAlign = 'left',
  actions = [],
  variant = 'default',
  height = 64,
  sticky = false,
  className,
  'aria-label': ariaLabel = 'Navegación principal',
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = useCallback(() => {
    setMobileOpen((p) => !p);
  }, []);
  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const hasLinks = links.length > 0;
  const hasActions = actions.filter((a) => !a.id.startsWith('divider')).length > 0;
  const hasMobile = hasLinks || hasActions;

  return (
    <>
      <S.NavRoot
        $height={height}
        $variant={variant}
        $sticky={sticky}
        className={className}
        aria-label={ariaLabel}
      >
        <S.NavInner $height={height} $variant={variant}>
          {/* Logo */}
          {logo && <NavbarLogo logo={logo} variant={variant} />}

          {/* Links desktop */}
          {hasLinks && <NavbarLinks links={links} linksAlign={linksAlign} variant={variant} />}

          {/* Actions desktop */}
          {hasActions && <NavbarActions actions={actions} variant={variant} />}

          {/* Hamburger mobile */}
          {hasMobile && (
            <S.HamburgerBtn
              $variant={variant}
              onClick={toggleMobile}
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileOpen}
              aria-controls="navbar-mobile-menu"
              type="button"
            >
              {mobileOpen ? <IconClose /> : <IconMenu />}
            </S.HamburgerBtn>
          )}
        </S.NavInner>
      </S.NavRoot>

      {/* Mobile drawer */}
      {hasMobile && (
        <MobileMenuPanel
          open={mobileOpen}
          links={links}
          actions={actions}
          variant={variant}
          height={height}
          onClose={closeMobile}
        />
      )}
    </>
  );
};

Navbar.displayName = 'Navbar';
