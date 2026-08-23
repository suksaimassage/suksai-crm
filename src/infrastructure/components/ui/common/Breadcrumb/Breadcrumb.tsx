/**
 * Breadcrumb — Componente de navegación jerárquica
 *
 * @example
 * <Breadcrumb
 *   items={[
 *     { id: "home",    label: "Inicio",   href: "/",        icon: <HomeIcon /> },
 *     { id: "orders",  label: "Pedidos",  href: "/pedidos",
 *       dropdownOptions: [
 *         { id: "active",   label: "Activos",   href: "/pedidos/activos" },
 *         { id: "archived", label: "Archivados", href: "/pedidos/archivados" },
 *       ]
 *     },
 *     { id: "detail",  label: "Pedido",  params: { id: "42" }, highlight: true },
 *   ]}
 *   variant="pills"
 *   separator="›"
 * />
 *
 * SOLID:
 * - SRP: BreadcrumbItem, BreadcrumbDropdown, BreadcrumbEllipsis → cada uno su responsabilidad.
 * - OCP: variantes y separadores extensibles via props.
 * - ISP: interfaces separadas por uso.
 * - DIP: depende de abstracciones (tipos), no implementaciones.
 */

import React, { useState, useRef, useEffect, isValidElement } from 'react';
import * as S from './Breadcrumb.styles';
import type {
  IBreadcrumbProps,
  IBreadcrumbItem,
  TBreadcrumbVariant,
  TBreadcrumbSeparator,
  IBreadcrumbDropdownOption,
} from './Breadcrumb.types';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconChevron = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M3 4.5l3 3 3-3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Separator renderer ───────────────────────────────────────────────────────

const renderSeparator = (sep: TBreadcrumbSeparator) =>
  isValidElement(sep) ? sep : <span aria-hidden="true">{sep}</span>;

// ─── Param badges ─────────────────────────────────────────────────────────────

/**
 * ParamBadges — Responsabilidad: mostrar parámetros de ruta.
 */
const ParamBadges: React.FC<{ params: Record<string, string | number> }> = ({ params }) => (
  <>
    {Object.entries(params).map(([key, val]) => (
      <S.ParamBadge key={key} title={`${key}: ${val}`}>
        #{val}
      </S.ParamBadge>
    ))}
  </>
);

// ─── Dropdown ítem ────────────────────────────────────────────────────────────

/**
 * BreadcrumbDropdown — Responsabilidad: manejar rutas alternativas en un ítem.
 * Dropdown inline, sin dependencia del componente Dropdown global.
 */
const BreadcrumbDropdown: React.FC<{
  item: IBreadcrumbItem;
  variant: TBreadcrumbVariant;
  isLast: boolean;
  isActive: boolean;
  options: readonly IBreadcrumbDropdownOption[];
}> = ({ item, variant, isActive, options }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Click outside → cerrar
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  // Escape → cerrar
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [open]);

  return (
    <S.DropWrapper ref={wrapRef}>
      <S.DropTrigger
        $variant={variant}
        $isActive={isActive}
        onClick={() => {
          setOpen((p) => !p);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${item.label} — ver opciones`}
      >
        {item.icon}
        {item.label}
        {item.params && <ParamBadges params={item.params} />}
        <S.ChevronIcon $open={open}>
          <IconChevron />
        </S.ChevronIcon>
      </S.DropTrigger>

      <S.DropPanel $open={open} role="listbox" aria-label={`Opciones de ${item.label}`}>
        {options.map((opt) => (
          <S.DropOption
            key={opt.id}
            href={opt.href}
            role="option"
            onClick={(e) => {
              if (!opt.href) e.preventDefault();
              opt.onClick?.();
              setOpen(false);
            }}
          >
            {opt.icon}
            {opt.label}
          </S.DropOption>
        ))}
      </S.DropPanel>
    </S.DropWrapper>
  );
};

// ─── Breadcrumb ítem ──────────────────────────────────────────────────────────

/**
 * BreadcrumbItemNode — Responsabilidad: renderizar un único ítem
 * según sus propiedades (link, span, dropdown).
 */
const BreadcrumbItemNode: React.FC<{
  item: IBreadcrumbItem;
  isLast: boolean;
  variant: TBreadcrumbVariant;
}> = ({ item, isLast, variant }) => {
  const isActive = !!item.highlight || isLast;
  const isDisabled = !!item.disabled;
  const hasDropdown = item.dropdownOptions && item.dropdownOptions.length > 0;

  const itemProps = {
    $variant: variant,
    $isLast: isLast,
    $isActive: isActive,
    $disabled: isDisabled,
  } as const;

  // ── Con dropdown ──────────────────────────────────────────────────────────
  if (hasDropdown) {
    return (
      <BreadcrumbDropdown
        item={item}
        variant={variant}
        isLast={isLast}
        isActive={isActive}
        options={item.dropdownOptions}
      />
    );
  }

  const content = (
    <>
      {item.icon}
      {item.label}
      {item.params && <ParamBadges params={item.params} />}
    </>
  );

  // ── Con href → enlace ────────────────────────────────────────────────────
  if (item.href && !isDisabled && !isLast) {
    return (
      <S.ItemLink href={item.href} {...itemProps} aria-current={isActive ? 'page' : undefined}>
        {content}
      </S.ItemLink>
    );
  }

  // ── Sin href o último → span ─────────────────────────────────────────────
  return (
    <S.ItemSpan
      {...itemProps}
      aria-current={isLast ? 'page' : undefined}
      aria-disabled={isDisabled || undefined}
    >
      {content}
    </S.ItemSpan>
  );
};

// ─── Collapse logic ───────────────────────────────────────────────────────────

/**
 * Colapsa ítems del medio cuando hay más de `maxItems`.
 * Siempre muestra: primero + (ítems del medio colapsados) + último.
 */
function useCollapse(items: readonly IBreadcrumbItem[], maxItems: number) {
  const [expanded, setExpanded] = useState(false);

  const shouldCollapse = maxItems > 0 && items.length > maxItems && !expanded;

  const visible: IBreadcrumbItem[] = shouldCollapse ? [items[0], ...items.slice(-1)] : [...items];

  return {
    visible,
    shouldCollapse,
    expand: () => {
      setExpanded(true);
    },
  };
}

// ─── Breadcrumb (main) ────────────────────────────────────────────────────────

export const Breadcrumb: React.FC<IBreadcrumbProps> = ({
  items,
  variant = 'default',
  separator = '/',
  maxItems = 0,
  className,
  'aria-label': ariaLabel = 'Ruta de navegación',
}) => {
  const { visible, shouldCollapse, expand } = useCollapse(items, maxItems);

  return (
    <S.BreadcrumbRoot $variant={variant} className={className} aria-label={ariaLabel}>
      <S.BreadcrumbList>
        {visible.map((item, idx) => {
          const isLast = idx === visible.length - 1;
          const showSep = idx > 0;
          // Mostrar ellipsis entre primer y último ítem colapsado
          const showEllipsis = shouldCollapse && idx === 1;

          return (
            <S.BreadcrumbLi key={item.id}>
              {showSep && (
                <S.Separator aria-hidden="true">{renderSeparator(separator)}</S.Separator>
              )}

              {showEllipsis && (
                <>
                  <S.EllipsisBtn
                    onClick={expand}
                    aria-label={`Expandir ${items.length - 2} ítems intermedios`}
                    title="Ver ruta completa"
                  >
                    ···
                  </S.EllipsisBtn>
                  <S.Separator aria-hidden="true">{renderSeparator(separator)}</S.Separator>
                </>
              )}

              <BreadcrumbItemNode item={item} isLast={isLast} variant={variant} />
            </S.BreadcrumbLi>
          );
        })}
      </S.BreadcrumbList>
    </S.BreadcrumbRoot>
  );
};

Breadcrumb.displayName = 'Breadcrumb';
