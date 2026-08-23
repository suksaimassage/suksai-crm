/**
 * Sidebar — Componente de navegación vertical
 *
 * Navegación lateral para aplicaciones: dashboards, paneles, herramientas.
 * Complementa al Navbar horizontal (navegación pública / marketing).
 *
 * Principios SOLID:
 * - SRP: cada sub-componente tiene una responsabilidad visual única.
 * - OCP: extensible via props, inmutable en la base.
 * - LSP: se comporta igual en cualquier contexto de layout.
 * - ISP: props mínimas por responsabilidad; footer, groups, search son opcionales.
 * - DIP: depende de SidebarProps y useSidebar (abstracciones).
 *
 * Comportamiento por breakpoint (Mobile First):
 *   < md (768px) → drawer overlay fijo, backdrop, cierre con Escape / click fuera
 *   ≥ md (768px) → sticky en el grid del layout, colapsable a iconos con tooltips
 *
 * @example
 * // Uso básico (uncontrolled — estado interno con persistencia localStorage)
 * <Sidebar logo={LOGO} groups={GROUPS} footer={<UserProfile />} />
 *
 * @example
 * // Controlado desde el layout padre
 * const [mobileOpen, setMobileOpen] = useState(false);
 * <Sidebar.MobileToggle onClick={() => setMobileOpen(true)} />
 * <Sidebar
 *   logo={LOGO}
 *   groups={GROUPS}
 *   mobileOpen={mobileOpen}
 *   onMobileClose={() => setMobileOpen(false)}
 *   footer={<UserProfile />}
 * />
 */

import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from '@tanstack/react-router';
import type {
  ISidebarProps,
  ISidebarGroup,
  ISidebarItem,
  TSidebarVariant,
  TSidebarPlacement,
  ISidebarSearchProps,
} from './Sidebar.types';
import * as S from './Sidebar.styles';
import { useSidebar } from '@infra/hooks/useSidebar';

// ─── Icons SVG inline ──────────────────────────────────────────────────────

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M5.5 3.5l3.5 3.5-3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CollapseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M8 2L4 6l4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HamburgerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M2 4.5h14M2 9h14M2 13.5h14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" />
    <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const CloseXIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path
      d="M1.5 1.5l7 7M8.5 1.5l-7 7"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

// ─── Filter utility ────────────────────────────────────────────────────────

const filterGroups = (
  groups: readonly ISidebarGroup[],
  query: string,
): readonly ISidebarGroup[] => {
  if (!query.trim()) return groups;
  const q = query.toLowerCase();

  return groups
    .map((group) => {
      const filteredItems = group.items
        .map((item): ISidebarItem | null => {
          if (item.label.toLowerCase().includes(q)) return item;
          if (item.children) {
            const filteredChildren = item.children.filter((c) => c.label.toLowerCase().includes(q));
            if (filteredChildren.length > 0) {
              return { ...item, children: filteredChildren };
            }
          }
          return null;
        })
        .filter((item): item is ISidebarItem => item !== null);
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);
};

// ─── SidebarSearch ─────────────────────────────────────────────────────────

const SidebarSearch: React.FC<ISidebarSearchProps> = ({
  placeholder,
  value,
  onChange,
  collapsed = false,
  variant = 'dark',
  className,
}) => {
  const { t } = useTranslation('dashboard');
  const resolvedPlaceholder = placeholder ?? t('sidebar.searchPlaceholder');
  const [internalValue, setInternalValue] = useState('');
  const resolvedValue = value ?? internalValue;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setInternalValue(v);
      onChange?.(v);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange?.('');
  }, [onChange]);

  if (collapsed) return null;

  return (
    <S.SearchWrapper $variant={variant} $collapsed={collapsed} className={className}>
      <S.SearchInputRow $variant={variant}>
        <S.SearchIconWrapper $variant={variant}>
          <SearchIcon />
        </S.SearchIconWrapper>
        <S.SearchInput
          $variant={variant}
          type="search"
          placeholder={resolvedPlaceholder}
          value={resolvedValue}
          onChange={handleChange}
          aria-label={t('sidebar.searchAriaLabel')}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <S.SearchClearButton
          $visible={resolvedValue.length > 0}
          $variant={variant}
          onClick={handleClear}
          aria-label={t('sidebar.searchClearAriaLabel')}
          type="button"
        >
          <CloseXIcon />
        </S.SearchClearButton>
      </S.SearchInputRow>
    </S.SearchWrapper>
  );
};

SidebarSearch.displayName = 'Sidebar.Search';

// ─── SubItems ──────────────────────────────────────────────────────────────

interface SubItemsProps {
  readonly items: readonly ISidebarItem[];
  readonly variant: TSidebarVariant;
  readonly collapsed: boolean;
  readonly isExpanded: boolean;
  readonly currentPath: string;
  readonly onItemClick: (item: ISidebarItem) => void;
}

const SubItems: React.FC<SubItemsProps> = ({
  items,
  variant,
  collapsed,
  isExpanded,
  currentPath,
  onItemClick,
}) => {
  const { t } = useTranslation('dashboard');
  return (
    <S.SubItemsContainer
      $expanded={isExpanded}
      $collapsed={collapsed}
      $itemCount={items.length}
      role="group"
      aria-label={t('sidebar.subNavAriaLabel')}
    >
      {items.map((subItem) => {
        const isActive = subItem.href !== '#' && currentPath.startsWith(subItem.href);
        const isLink = !subItem.href.startsWith('#');
        const shared = {
          $variant: variant,
          $isActive: isActive,
          $disabled: subItem.disabled ?? false,
          'aria-current': isActive ? 'page' : undefined,
          onClick: () => {
            if (!subItem.disabled) onItemClick(subItem);
          },
        } as const;
        return (
          <S.NavItemWrapper key={subItem.id}>
            {isLink ? (
              <Link to={subItem.href as never}>
                {({ isActive: linkActive }: { isActive: boolean }) => (
                  <S.SubItemButton as="span" {...shared} $isActive={linkActive}>
                    {subItem.label}
                  </S.SubItemButton>
                )}
              </Link>
            ) : (
              <S.SubItemButton disabled={subItem.disabled} {...shared}>
                {subItem.label}
              </S.SubItemButton>
            )}
          </S.NavItemWrapper>
        );
      })}
    </S.SubItemsContainer>
  );
};

SubItems.displayName = 'SidebarSubItems';

// ─── NavItem ───────────────────────────────────────────────────────────────

interface INavItemProps {
  readonly item: ISidebarItem;
  readonly variant: TSidebarVariant;
  readonly placement: TSidebarPlacement;
  readonly collapsed: boolean;
  readonly currentPath: string;
  readonly isGroupExpanded: (id: string) => boolean;
  readonly onToggleGroup: (id: string) => void;
  readonly onItemClick: (item: ISidebarItem) => void;
  readonly forceExpanded?: boolean;
}

const NavItem: React.FC<INavItemProps> = ({
  item,
  variant,
  placement,
  collapsed,
  currentPath,
  isGroupExpanded,
  onToggleGroup,
  onItemClick,
  forceExpanded = false,
}) => {
  const hasChildren = (item.children?.length ?? 0) > 0;
  const isActive = !hasChildren && item.href !== '#' && currentPath === item.href;
  const isExpanded = forceExpanded || isGroupExpanded(item.id);
  const isParentActive =
    hasChildren &&
    (item.children ?? []).some((child) => child.href !== '#' && currentPath.startsWith(child.href));

  const handleClick = useCallback(() => {
    if (item.disabled) return;
    if (hasChildren) {
      onToggleGroup(item.id);
    } else {
      onItemClick(item);
    }
  }, [item, hasChildren, onToggleGroup, onItemClick]);

  return (
    <>
      {item.dividerBefore && <S.ItemDivider $variant={variant} />}

      <S.TooltipWrapper $collapsed={collapsed} $placement={placement} data-label={item.label}>
        <S.NavItemWrapper>
          {!hasChildren && !item.href.startsWith('#') ? (
            <Link to={item.href as never} onClick={handleClick}>
              {({ isActive: linkActive }: { isActive: boolean }) => (
                <S.NavItemButton
                  as="span"
                  $variant={variant}
                  $isActive={linkActive || isParentActive}
                  $collapsed={collapsed}
                  $disabled={item.disabled ?? false}
                  aria-current={linkActive ? 'page' : undefined}
                >
                  {item.icon && <S.NavItemIcon aria-hidden="true">{item.icon}</S.NavItemIcon>}
                  {!collapsed && (
                    <>
                      <S.NavItemLabel $collapsed={collapsed}>{item.label}</S.NavItemLabel>
                      {item.badge !== undefined && (
                        <S.Badge $variant={variant} $collapsed={collapsed}>
                          {item.badge}
                        </S.Badge>
                      )}
                    </>
                  )}
                </S.NavItemButton>
              )}
            </Link>
          ) : (
            <S.NavItemButton
              $variant={variant}
              $isActive={isActive || isParentActive}
              $collapsed={collapsed}
              $disabled={item.disabled ?? false}
              disabled={item.disabled}
              aria-expanded={hasChildren ? isExpanded : undefined}
              aria-current={isActive ? 'page' : undefined}
              onClick={handleClick}
            >
              {item.icon && <S.NavItemIcon aria-hidden="true">{item.icon}</S.NavItemIcon>}
              <S.NavItemLabel $collapsed={collapsed}>{item.label}</S.NavItemLabel>
              {item.badge !== undefined && (
                <S.Badge $variant={variant} $collapsed={collapsed}>
                  {item.badge}
                </S.Badge>
              )}
              {hasChildren && (
                <S.Chevron $expanded={isExpanded} $collapsed={collapsed}>
                  <ChevronRightIcon />
                </S.Chevron>
              )}
            </S.NavItemButton>
          )}
        </S.NavItemWrapper>

        {hasChildren && item.children && (
          <SubItems
            items={item.children}
            variant={variant}
            collapsed={collapsed}
            isExpanded={isExpanded}
            currentPath={currentPath}
            onItemClick={onItemClick}
          />
        )}
      </S.TooltipWrapper>
    </>
  );
};

NavItem.displayName = 'SidebarNavItem';

// ─── NavGroupSection ───────────────────────────────────────────────────────

interface NavGroupProps {
  readonly group: ISidebarGroup;
  readonly variant: TSidebarVariant;
  readonly placement: TSidebarPlacement;
  readonly collapsed: boolean;
  readonly currentPath: string;
  readonly isGroupExpanded: (id: string) => boolean;
  readonly onToggleGroup: (id: string) => void;
  readonly onItemClick: (item: ISidebarItem) => void;
  readonly forceExpandItems?: boolean;
}

const NavGroupSection: React.FC<NavGroupProps> = ({
  group,
  variant,
  placement,
  collapsed,
  currentPath,
  isGroupExpanded,
  onToggleGroup,
  onItemClick,
  forceExpandItems = false,
}) => {
  const { t } = useTranslation('dashboard');
  return (
    <S.NavGroup role="list" aria-label={group.label ?? t('sidebar.navAriaLabel')}>
      {group.label && (
        <S.GroupLabel $variant={variant} $collapsed={collapsed} aria-hidden={collapsed}>
          {group.label}
        </S.GroupLabel>
      )}
      {group.items.map((item) => (
        <NavItem
          key={item.id}
          item={item}
          variant={variant}
          placement={placement}
          collapsed={collapsed}
          currentPath={currentPath}
          isGroupExpanded={isGroupExpanded}
          onToggleGroup={onToggleGroup}
          onItemClick={onItemClick}
          forceExpanded={forceExpandItems}
        />
      ))}
    </S.NavGroup>
  );
};

NavGroupSection.displayName = 'SidebarNavGroup';

// ─── Sidebar root ──────────────────────────────────────────────────────────

export const Sidebar: React.FC<ISidebarProps> & {
  Search: typeof SidebarSearch;
  MobileToggle: typeof MobileToggleButton;
} = ({
  logo,
  groups,
  items,
  footer,
  collapsed: collapsedProp,
  mobileOpen: mobileOpenProp,
  onCollapseChange,
  onMobileClose,
  onLogoClick,
  onItemClick,
  variant = 'dark',
  placement = 'left',
  width = '260px',
  collapsedWidth = '80px',
  className,
  style,
  'aria-label': ariaLabel,
  search = false,
}) => {
  const { t } = useTranslation('dashboard');
  const { pathname: currentPath } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Normalizar: items planos → un grupo sin label
  const rawGroups: readonly ISidebarGroup[] = useMemo(
    () => groups ?? (items ? [{ id: '__default__', items }] : []),
    [groups, items],
  );

  // Filtrar por búsqueda activa
  const resolvedGroups = useMemo(
    () => filterGroups(rawGroups, searchQuery),
    [rawGroups, searchQuery],
  );

  const hasSearch = Boolean(search);
  const isSearching = searchQuery.trim().length > 0;
  const hasNoResults = isSearching && resolvedGroups.length === 0;

  const {
    collapsed,
    mobileOpen,
    toggleCollapsed,
    closeMobile,
    toggleGroup,
    openGroup,
    isGroupExpanded,
  } = useSidebar({
    collapsedProp,
    mobileOpenProp,
    onCollapseChange,
    onMobileClose,
  });

  // Auto-expandir el grupo cuyo sub-item está activo al montar.
  // Se ejecuta una sola vez: `openGroup` es estable (useCallback sin deps)
  // y `rawGroupsRef` captura el valor inicial sin crear una dependencia reactiva.
  const rawGroupsRef = useRef(rawGroups);
  const currentPathRef = useRef(currentPath);
  useEffect(() => {
    rawGroupsRef.current.forEach((group) => {
      group.items.forEach((item) => {
        if (
          item.children?.some(
            (child) => child.href !== '#' && currentPathRef.current.startsWith(child.href),
          )
        ) {
          openGroup(item.id);
        }
      });
    });
  }, [openGroup]); // openGroup es estable — el efecto solo corre al montar

  const handleItemClick = useCallback(
    (item: ISidebarItem) => {
      closeMobile();
      onItemClick?.(item);
    },
    [closeMobile, onItemClick],
  );

  return (
    <>
      {/* Backdrop mobile */}
      <S.Backdrop $isOpen={mobileOpen} onClick={closeMobile} aria-hidden="true" />

      {/* Sidebar */}
      <S.SidebarRoot
        $variant={variant}
        $placement={placement}
        $collapsed={collapsed}
        $mobileOpen={mobileOpen}
        $width={width}
        $collapsedWidth={collapsedWidth}
        className={className}
        style={style}
        role="navigation"
        aria-label={ariaLabel ?? t('sidebar.navAriaLabel')}
      >
        {/* Header: logo + botón colapso */}
        <S.SidebarHeader $variant={variant} $collapsed={collapsed}>
          <S.StyledBrandOrnament />
          {logo && (
            <S.LogoWrapper
              onClick={onLogoClick}
              aria-label={`${logo.title ?? 'Inicio'} — ir al inicio`}
              type="button"
            >
              <S.LogoIconWrapper>{logo.icon}</S.LogoIconWrapper>
              {logo.title && logo.title !== '' && (
                <S.LogoTitle $variant={variant} $collapsed={collapsed}>
                  {logo.title}
                </S.LogoTitle>
              )}
            </S.LogoWrapper>
          )}

          <S.CollapseButton
            $variant={variant}
            $collapsed={collapsed}
            $placement={placement}
            onClick={toggleCollapsed}
            aria-label={collapsed ? t('sidebar.expandLabel') : t('sidebar.collapseLabel')}
            title={collapsed ? t('sidebar.expandTitle') : t('sidebar.collapseTitle')}
            type="button"
          >
            <CollapseIcon />
          </S.CollapseButton>
        </S.SidebarHeader>

        {/* Búsqueda integrada */}
        {hasSearch && (
          <SidebarSearch
            placeholder={
              typeof search === 'object' ? search.placeholder : t('sidebar.searchPlaceholder')
            }
            value={searchQuery}
            onChange={setSearchQuery}
            collapsed={collapsed}
            variant={variant}
          />
        )}

        {/* Cuerpo: grupos de navegación */}
        <S.NavBody $variant={variant}>
          {hasNoResults ? (
            <S.SearchNoResults $variant={variant}>
              {t('sidebar.noResults', { query: searchQuery })}
            </S.SearchNoResults>
          ) : (
            resolvedGroups.map((group) => (
              <NavGroupSection
                key={group.id}
                group={group}
                variant={variant}
                placement={placement}
                collapsed={collapsed}
                currentPath={currentPath}
                isGroupExpanded={isGroupExpanded}
                onToggleGroup={toggleGroup}
                onItemClick={handleItemClick}
                forceExpandItems={isSearching}
              />
            ))
          )}
        </S.NavBody>

        {/* Footer opcional */}
        {footer && (
          <S.SidebarFooter $variant={variant} $collapsed={collapsed}>
            {footer}
          </S.SidebarFooter>
        )}
      </S.SidebarRoot>
    </>
  );
};

Sidebar.displayName = 'Sidebar';

// ─── MobileToggleButton ────────────────────────────────────────────────────

interface MobileToggleButtonProps {
  readonly onClick: () => void;
  readonly 'aria-label'?: string;
  readonly className?: string;
}

const MobileToggleButton: React.FC<MobileToggleButtonProps> = ({
  onClick,
  'aria-label': ariaLabel,
  className,
}) => {
  const { t } = useTranslation('dashboard');
  return (
    <S.MobileToggleButton
      onClick={onClick}
      aria-label={ariaLabel ?? t('sidebar.mobileOpenAriaLabel')}
      aria-haspopup="true"
      type="button"
      className={className}
    >
      <HamburgerIcon />
    </S.MobileToggleButton>
  );
};

MobileToggleButton.displayName = 'Sidebar.MobileToggle';

// Compound components
Sidebar.Search = SidebarSearch;
Sidebar.MobileToggle = MobileToggleButton;
