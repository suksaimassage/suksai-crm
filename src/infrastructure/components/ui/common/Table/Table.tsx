/**
 * Table / DataGrid
 *
 * SOLID:
 * - SRP: useTableState (estado), TableHeaderSection, TableBodySection,
 *        TableFooterSection, ColumnToggle → responsabilidad única cada uno.
 * - OCP: nuevas columnas/variantes sin tocar la lógica base.
 * - ISP: ITableProps mínimo; ITableColumnDef independiente.
 * - DIP: depende de abstracciones (ITableColumnDef, SortState), no implementaciones.
 *
 * Características:
 * - Header: SearchInput debounced + acciones custom + ColumnToggle
 * - Body: <table> semántico, sticky first col, THead/TBody
 * - Footer: paginación con page-size selector + info de registros
 * - Sort ASC/DESC por columna con indicador visual
 * - Selección de filas con Checkbox (select-all de página)
 * - Column visibility toggle (excepto pinned)
 * - Loading skeleton + empty state
 * - Variantes: default | striped | bordered
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTableState } from '@infra/hooks/useTableState';
import { Checkbox } from '@infra/components/ui/common/Checkbox';
import { Form } from '@infra/components/ui/common/Form';
import { type ISelectOption, Select } from '@infra/components/ui/common/Select';
import type { ITableProps, ITableColumnDef, TTablePageSize } from './Table.types';
import { Button } from '@infra/components/ui/common/Button';
import * as S from './Table.styles';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IcoColumns = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1.5" y="2.5" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.4" />
    <rect x="6.5" y="2.5" width="3" height="11" rx="1" stroke="currentColor" strokeWidth="1.4" />
    <rect x="10.5" y="2.5" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const IcoReset = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M2.5 8a5.5 5.5 0 1 0 1-3.2M2.5 2v3h3"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IcoChevLeft = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M10 12l-4-4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IcoChevRight = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M6 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IcoSortUp = ({ active }: { active: boolean }) => (
  <svg width="8" height="5" viewBox="0 0 8 5" fill="none" aria-hidden="true">
    <path
      d="M1 4.5l3-3 3 3"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={active ? 1 : 0.3}
    />
  </svg>
);

const IcoSortDown = ({ active }: { active: boolean }) => (
  <svg width="8" height="5" viewBox="0 0 8 5" fill="none" aria-hidden="true">
    <path
      d="M1 0.5l3 3 3-3"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={active ? 1 : 0.3}
    />
  </svg>
);

// ─── ColumnToggle ─────────────────────────────────────────────────────────────

/**
 * SRP: gestiona la visibilidad de columnas.
 * El panel usa position:fixed calculado desde getBoundingClientRect para escapar
 * de cualquier contenedor con overflow:hidden o overflow:auto.
 */
interface ColumnToggleProps<T extends Record<string, unknown>> {
  columns: ITableColumnDef<T>[];
  hiddenCols: Set<string>;
  onToggle: (key: string) => void;
}

const ColumnToggle = <T extends Record<string, unknown>>({
  columns,
  hiddenCols,
  onToggle,
}: ColumnToggleProps<T>) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Calcula posición fixed al abrir
  const handleOpen = useCallback(() => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setOpen((p) => !p);
  }, [open]);

  // Click-outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        btnRef.current &&
        !btnRef.current.contains(target)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  // Recalcula si el viewport cambia de tamaño
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const handleResize = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 6, right: window.innerWidth - r.right });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  const toggleable = columns.filter((c) => !c.pinned);

  return (
    <S.ColumnPanelWrapper>
      <S.IconBtn
        ref={btnRef}
        $active={open}
        onClick={handleOpen}
        aria-label={t('table.columnsVisibleAriaLabel')}
        title={t('table.columnsVisibleAriaLabel')}
        type="button"
      >
        <IcoColumns />
      </S.IconBtn>

      <S.ColumnPanel
        ref={panelRef}
        $open={open}
        $top={coords.top}
        $right={coords.right}
        role="menu"
        aria-label={t('table.columnVisibilityAriaLabel')}
      >
        <S.ColumnPanelHead>Columnas</S.ColumnPanelHead>
        {toggleable.map((col) => (
          <S.ColumnPanelItem key={col.key}>
            <Checkbox
              checked={!hiddenCols.has(col.key)}
              onChange={() => {
                onToggle(col.key);
              }}
              size="sm"
            />
            {col.header}
          </S.ColumnPanelItem>
        ))}
      </S.ColumnPanel>
    </S.ColumnPanelWrapper>
  );
};

// ─── Skeleton rows ────────────────────────────────────────────────────────────

// Widths estables — evita regenerar clases en cada render
const SKELETON_WIDTHS = ['72%', '58%', '85%', '63%', '78%', '55%', '90%', '68%'];

const SkeletonRows: React.FC<{
  rows: number;
  cols: number;
  size: ITableProps['size'];
  selectable?: boolean;
}> = ({ rows, cols, size = 'md', selectable }) => (
  <>
    {Array.from({ length: rows }).map((_, ri) => (
      <S.SkeletonRow key={ri}>
        {selectable && (
          <S.CheckboxTd $size={size}>
            <S.SkeletonLine $w="18px" />
          </S.CheckboxTd>
        )}
        {Array.from({ length: cols }).map((_, ci) => (
          <S.SkeletonCell key={ci} $size={size}>
            <S.SkeletonLine $w={SKELETON_WIDTHS[(ri * cols + ci) % SKELETON_WIDTHS.length]} />
          </S.SkeletonCell>
        ))}
      </S.SkeletonRow>
    ))}
  </>
);

// ─── Pagination ───────────────────────────────────────────────────────────────

const PAGESIZEOPTION = [
  { value: '5', label: '5 / pág.' },
  { value: '10', label: '10 / pág.' },
  { value: '25', label: '25 / pág.' },
  { value: '50', label: '50 / pág.' },
  { value: '100', label: '100 / pág.' },
];

/**
 * SRP: renderiza la paginación.
 */
const Pagination: React.FC<{
  page: number;
  totalPages: number;
  pageSize: number;
  totalRows: number;
  pageSizeOpts: ISelectOption[];
  onPage: (p: number) => void;
  onPageSize: (ps: number) => void;
}> = ({ page, totalPages, pageSize, totalRows, pageSizeOpts, onPage, onPageSize }) => {
  const { t } = useTranslation('common');
  // Genera ventana de páginas: máx 5 botones
  const pages = useMemo(() => {
    const range: (number | '…')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      range.push(1);
      if (page > 3) range.push('…');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        range.push(i);
      }
      if (page < totalPages - 2) range.push('…');
      range.push(totalPages);
    }
    return range;
  }, [page, totalPages]);

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRows);

  return (
    <>
      <S.PaginationInfo>
        {totalRows === 0
          ? t('table.noResults')
          : t('table.paginationRange', { start, end, total: totalRows })}
      </S.PaginationInfo>

      <S.PaginationWrap>
        <Select
          size="sm"
          placeholder={t('table.pageSizeLabel')}
          options={pageSizeOpts}
          value={String(pageSize)}
          onChange={(e) => {
            onPageSize(Number(e));
          }}
        />
        <Button
          size="xs"
          variant="ghost"
          title={t('table.prevPageAriaLabel')}
          iconStart={<IcoChevLeft />}
          onClick={() => {
            onPage(page - 1);
          }}
          disabled={page === 1}
          aria-label={t('table.prevPageAriaLabel')}
        />
        {pages.map((p, i) =>
          p === '…' ? (
            <Button key={`ellipsis-${i}`} size="xs" disabled>
              …
            </Button>
          ) : (
            <Button
              key={p}
              variant="filled"
              size="sm"
              title={`Pag. ${p}`}
              color={p === page ? 'primary' : 'neutral'}
              onClick={() => {
                onPage(p);
              }}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          size="xs"
          variant="ghost"
          title={t('table.nextPageAriaLabel')}
          iconStart={<IcoChevRight />}
          onClick={() => {
            onPage(page + 1);
          }}
          disabled={page === totalPages}
          aria-label={t('table.nextPageAriaLabel')}
        />
      </S.PaginationWrap>
    </>
  );
};

// ─── Table ────────────────────────────────────────────────────────────────────

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  rowKey = 'id',
  variant = 'default',
  size = 'md',
  title,
  searchable = false,
  searchPlaceholder = 'Buscar…',
  headerActions,
  emptyText = 'Sin datos',
  loading = false,
  columnToggle = false,
  sortable = false,
  paginated = false,
  pageSizeOptions = PAGESIZEOPTION,
  defaultPageSize = Number(PAGESIZEOPTION[1].value) as TTablePageSize,
  selectable = false,
  onSelectionChange,
  onRowClick,
  controlledPage,
  controlledTotalRows,
  onControlledPageChange,
  className,
  style,
}: ITableProps<T>) {
  const { t } = useTranslation('common');
  // Whether controlled (server-side) pagination mode is active
  const isControlled = controlledPage !== undefined;

  const state = useTableState({
    data,
    columns,
    defaultPageSize,
    // In controlled mode, data already contains only the current page's rows —
    // disable internal slicing so all received rows are rendered as-is.
    paginated: isControlled ? false : paginated,
    onSelectionChange,
    rowKey,
  });

  const {
    query,
    setQuery,
    sort,
    handleSort,
    pagination,
    setPage,
    setPageSize,
    totalRows,
    totalPages,
    hiddenCols,
    toggleCol,
    visibleColumns,
    selectedKeys,
    toggleRow,
    toggleAll,
    pageRows,
  } = state;

  // ── "Select all" state for current page ───────────────────────────────────
  const pageKeys = pageRows.map((r) => String(r[rowKey]));
  const allPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selectedKeys.has(k));
  const somePageSelected = pageKeys.some((k) => selectedKeys.has(k)) && !allPageSelected;

  // ── Reset handler ──────────────────────────────────────────────────────────
  const hasFilters = query.trim().length > 0;
  const handleReset = useCallback(() => {
    setQuery('');
  }, [setQuery]);

  const showHeader = title != null || searchable || headerActions != null || columnToggle;
  const showFooter = paginated;
  const colCount = visibleColumns.length + (selectable ? 1 : 0);

  return (
    <S.TableRoot className={className} style={style}>
      {/* ── Header ──────────────────────────────────────────────── */}
      {showHeader && (
        <S.TableHeader>
          <S.HeaderLeft>
            {title && <S.TableTitle>{title}</S.TableTitle>}

            {searchable && (
              <div style={{ minWidth: 200, maxWidth: 320, flex: 1 }}>
                <Form.Input
                  type="search"
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                  }}
                  onSearch={setQuery}
                  size="sm"
                />
              </div>
            )}
          </S.HeaderLeft>

          <S.HeaderRight>
            {headerActions}

            {searchable && hasFilters && (
              <S.IconBtn onClick={handleReset} title={t('table.resetFilters')} type="button">
                <IcoReset />
              </S.IconBtn>
            )}

            {columnToggle && (
              <ColumnToggle columns={columns} hiddenCols={hiddenCols} onToggle={toggleCol} />
            )}
          </S.HeaderRight>
        </S.TableHeader>
      )}

      {/* ── Body ────────────────────────────────────────────────── */}
      <S.TableBody>
        <S.StyledTable $variant={variant} aria-label={title}>
          <S.THead>
            <tr>
              {/* Select-all checkbox */}
              {selectable && (
                <S.CheckboxTh $size={size}>
                  <Checkbox
                    checked={allPageSelected}
                    indeterminate={somePageSelected}
                    onChange={() => {
                      toggleAll(pageRows);
                    }}
                    size={size}
                    aria-label={t('table.selectAllAriaLabel')}
                  />
                </S.CheckboxTh>
              )}

              {visibleColumns.map((col, ci) => {
                const isSortActive = sort.key === col.key && sort.direction !== null;
                const canSort = sortable && col.sortable !== false;
                return (
                  <S.Th
                    key={col.key}
                    $size={size}
                    $align={col.align ?? 'left'}
                    $sticky={ci === 0 && !!col.sticky}
                    $sortable={canSort}
                    style={{ width: col.width, minWidth: col.minWidth }}
                    scope="col"
                    onClick={() => {
                      if (canSort) handleSort(col.key);
                    }}
                    aria-sort={
                      isSortActive
                        ? sort.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <S.ThInner>
                      {col.header}
                      {canSort && (
                        <S.SortIcon
                          $active={isSortActive}
                          $direction={isSortActive ? sort.direction : null}
                        >
                          <IcoSortUp active={isSortActive && sort.direction === 'asc'} />
                          <IcoSortDown active={isSortActive && sort.direction === 'desc'} />
                        </S.SortIcon>
                      )}
                    </S.ThInner>
                  </S.Th>
                );
              })}
            </tr>
          </S.THead>

          <S.TBody>
            {loading ? (
              <SkeletonRows
                rows={5}
                cols={visibleColumns.length}
                size={size}
                selectable={selectable}
              />
            ) : pageRows.length === 0 ? (
              <S.EmptyRow>
                <S.EmptyCell colSpan={colCount}>{emptyText}</S.EmptyCell>
              </S.EmptyRow>
            ) : (
              pageRows.map((row, ri) => {
                const key = String(row[rowKey]);
                const isSelected = selectedKeys.has(key);
                return (
                  <S.Tr
                    key={key}
                    $variant={variant}
                    $selected={isSelected}
                    $index={ri}
                    $clickable={onRowClick !== undefined}
                    aria-selected={isSelected}
                    onClick={
                      onRowClick !== undefined
                        ? () => {
                            onRowClick(row, key);
                          }
                        : undefined
                    }
                  >
                    {selectable && (
                      <S.CheckboxTd $size={size}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => {
                            toggleRow(key);
                          }}
                          size={size}
                          aria-label={`Seleccionar fila ${key}`}
                        />
                      </S.CheckboxTd>
                    )}

                    {visibleColumns.map((col, ci) => (
                      <S.Td
                        key={col.key}
                        $size={size}
                        $align={col.align ?? 'left'}
                        $sticky={ci === 0 && !!col.sticky}
                      >
                        {col.render
                          ? col.render(row[col.key], row, ri)
                          : (() => {
                              const val = row[col.key] ?? '—';
                              if (typeof val === 'object') return JSON.stringify(val);
                              // eslint-disable-next-line @typescript-eslint/no-base-to-string
                              return String(val);
                            })()}
                      </S.Td>
                    ))}
                  </S.Tr>
                );
              })
            )}
          </S.TBody>
        </S.StyledTable>
      </S.TableBody>

      {/* ── Footer ──────────────────────────────────────────────── */}
      {showFooter && (
        <S.TableFooter>
          <Pagination
            page={isControlled ? controlledPage : pagination.page}
            totalPages={
              isControlled
                ? Math.ceil((controlledTotalRows ?? data.length) / pagination.pageSize)
                : totalPages
            }
            pageSize={pagination.pageSize}
            totalRows={isControlled ? (controlledTotalRows ?? data.length) : totalRows}
            pageSizeOpts={pageSizeOptions}
            onPage={isControlled ? (onControlledPageChange ?? setPage) : setPage}
            onPageSize={setPageSize}
          />
        </S.TableFooter>
      )}
    </S.TableRoot>
  );
}

Table.displayName = 'Table';
