/**
 * ClientesPage — Master-detail view for client management.
 *
 * Layout: page header → KPI grid → filter bar → master-detail
 *   left  → filterable/searchable client table
 *   right → slide-in detail panel (when a row is selected)
 *
 * Data: all rows and KPIs are fetched live from Supabase — no mock fallback.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useUserStore } from '@app/stores/useUserStore';
import { useClientes } from '@infra/hooks/useClientes';
import { useClienteDetalle } from '@infra/hooks/useClienteDetalle';
import { useDebouncedValue } from '@infra/hooks/useDebouncedValue';
import { useReactivateCliente } from '@infra/hooks/useReactivateCliente';
import { useToast } from '@infra/components/ui/common/Toast';
import { Table } from '@infra/components/ui/common/Table';
import { Avatar } from '@infra/components/ui/common/Avatar';
import { Button } from '@infra/components/ui/common/Button';
import { ButtonGroup } from '@infra/components/ui/common/ButtonGroup';
import { SegmentoBadge } from '@infra/components/ui/domain/SegmentoBadge';
import { FrequencyIndicator } from '@infra/components/ui/domain/FrequencyIndicator';
import { ClienteDetailPanel } from '@infra/components/ui/domain/ClienteDetailPanel';
import { VisuallyHidden } from '@infra/components/ui/shared/VisuallyHidden';
import { ClienteModal } from '@infra/components/ui/domain/modals/ClienteModal';
import { DeactivateClienteDialog } from '@infra/components/ui/domain/DeactivateClienteDialog';
import { Dialog } from '@infra/components/ui/common/Dialog';
import { Container, PageLayout, Section } from '@infra/components/ui/core/Layout';
import * as S from './ClientesPage.styles';
import type { IClienteTableRow, TClienteSegmento } from './Clientes.types';
import type { TClienteId } from '@domain/types';
import type { ITableColumnDef } from '@infra/components/ui/common/Table/Table.types';

// ── KPI zen icons ─────────────────────────────────────────────────────────────

const IcoZenPeople = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="15" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M4.5 19.5c0-3.2 2-5.5 4.5-5.5h6c2.5 0 4.5 2.3 4.5 5.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const IcoZenSprout = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 20v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M12 15c0 0-4.5-1.5-5-6 2-1.5 6 1 6 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 11c0 0 .5-5 4.5-5.5C17.5 7.5 14 11 12 11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IcoZenCycle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 18-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M20.5 7.5l.5 3L17.5 9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IcoZenStones = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="12" cy="19" rx="7" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="12" cy="14.5" rx="5" ry="2" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="12" cy="11" rx="3" ry="1.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// ── Icon primitives ───────────────────────────────────────────────────────────

const IcoSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IcoPlusCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <line
      x1="12"
      y1="8"
      x2="12"
      y2="16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <line
      x1="8"
      y1="12"
      x2="16"
      y2="12"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const IcoPencil = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 0 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IcoCalendarPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 13v5M9.5 15.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IcoEnvelope = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M2 4l10 9 10-9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IcoDotsThree = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

// ── Segment filter config ─────────────────────────────────────────────────────

type TSegmentFilter = TClienteSegmento | 'todos';

const SEGMENT_FILTERS: readonly TSegmentFilter[] = [
  'todos',
  'vip',
  'activo',
  'nuevo',
  'en_riesgo',
  'inactivo',
];

// ── Mobile / tablet breakpoint detection ─────────────────────────────────────

function useIsMobile(maxWidth = 1023): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${maxWidth}px)`).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    mql.addEventListener('change', handler);
    return () => {
      mql.removeEventListener('change', handler);
    };
  }, [maxWidth]);

  return isMobile;
}

// ── Filter function (no useMemo per project rules) ────────────────────────────

function filterClientRows(
  rows: readonly IClienteTableRow[],
  segmento: TSegmentFilter,
  query: string,
): IClienteTableRow[] {
  let result: IClienteTableRow[] = rows as IClienteTableRow[];

  if (segmento !== 'todos') {
    result = result.filter((r) => r.segmento === segmento);
  }

  if (query.trim().length > 0) {
    const q = query.toLowerCase().trim();
    result = result.filter(
      (r) =>
        r.nombreCompleto.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) === true ||
        r.telefono.includes(q),
    );
  }

  return result;
}

// ── Date formatter (i18n-reactive) ──────────────────────────────────────────────

/** Map an i18next language tag (`es`, `en`, or regional) to a BCP-47 locale Intl accepts. */
function resolveDateLocale(language: string): string {
  const base = language.toLowerCase().split('-')[0];
  if (base === 'en') return 'en-GB'; // matches the en phone-format convention (+44…)
  return 'es-ES';
}

/**
 * Build a short-date formatter bound to the active language. Same field options
 * across locales (2-digit day / short month / numeric year); only the locale changes.
 */
function buildDateFormatter(language: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(resolveDateLocale(language), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ── Table columns ─────────────────────────────────────────────────────────────

function buildColumns(
  t: (key: string) => string,
  onRowClick: (clienteId: TClienteId) => void,
  selectedClienteId: TClienteId | null,
  onEditCliente: (clienteId: TClienteId) => void,
  dateFormatter: Intl.DateTimeFormat,
  onScheduleCliente: (clienteId: TClienteId) => void,
): ITableColumnDef[] {
  return [
    {
      key: 'nombreCompleto',
      header: t('table.cliente'),
      pinned: true,
      sticky: true,
      minWidth: '200px',
      render: (_val, row) => {
        const nombre = typeof row.nombreCompleto === 'string' ? row.nombreCompleto : '';
        return (
          <S.StyledClientCellWrapper
            role="button"
            tabIndex={0}
            data-cliente-trigger={String(row.clienteId)}
            onClick={() => {
              onRowClick(row.clienteId as TClienteId);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onRowClick(row.clienteId as TClienteId);
              }
            }}
            aria-label={`${t('table.verDetalle')} ${nombre}`}
            aria-expanded={selectedClienteId === (row.clienteId as TClienteId)}
          >
            <Avatar name={nombre} size="sm" shape="circle" />
            <S.StyledClientCellName>{nombre}</S.StyledClientCellName>
          </S.StyledClientCellWrapper>
        );
      },
    },
    {
      key: 'segmento',
      header: t('table.estado'),
      minWidth: '110px',
      render: (_val, row) => <SegmentoBadge segment={row.segmento as TClienteSegmento} size="sm" />,
    },
    {
      key: 'frecuenciaVisitas',
      header: t('table.frecuencia'),
      minWidth: '110px',
      render: (_val, row) => (
        <FrequencyIndicator visitsPerMonth={Number(row.frecuenciaVisitas ?? 0)} />
      ),
    },
    {
      key: 'ultimaVisita',
      header: t('table.ultimaVisita'),
      minWidth: '120px',
      render: (_val, row) => {
        const d = row.ultimaVisita;
        if (!(d instanceof Date)) {
          const label = t('table.sinVisita');
          return (
            <>
              <span aria-hidden="true" title={label}>
                —
              </span>
              <VisuallyHidden>{label}</VisuallyHidden>
            </>
          );
        }
        return dateFormatter.format(d);
      },
    },
    {
      key: 'servicioTop',
      header: t('table.servicioTop'),
      minWidth: '160px',
      align: 'left',
      render: (_val, row) => {
        const servicio = typeof row.ritualFavorito === 'string' ? row.ritualFavorito : null;
        if (servicio === null) {
          const label = t('table.sinServicio');
          return (
            <>
              <span aria-hidden="true" title={label}>
                —
              </span>
              <VisuallyHidden>{label}</VisuallyHidden>
            </>
          );
        }
        return <S.StyledServiceCell title={servicio}>{servicio}</S.StyledServiceCell>;
      },
    },
    {
      key: 'acciones',
      header: '',
      pinned: true,
      sticky: true,
      align: 'right',
      minWidth: '140px',
      width: '140px',
      render: (_val, row) => {
        const clienteId = row.clienteId as TClienteId;
        const nombre = typeof row.nombreCompleto === 'string' ? row.nombreCompleto : '';
        const email = typeof row.email === 'string' ? row.email : null;

        return (
          <ButtonGroup attached orientation="horizontal" variant="ghost" color="neutral" size="xs">
            <Button
              shape="square"
              iconStart={<IcoPencil />}
              aria-label={`${t('table.acciones.editar')} ${nombre}`}
              onClick={() => {
                onEditCliente(clienteId);
              }}
            />
            <Button
              shape="square"
              iconStart={<IcoCalendarPlus />}
              aria-label={`${t('table.acciones.agendar')} ${nombre}`}
              onClick={() => {
                onScheduleCliente(clienteId);
              }}
            />
            <Button
              shape="square"
              iconStart={<IcoEnvelope />}
              aria-label={`${t('table.acciones.email')} ${email ?? nombre}`}
              disabled={email === null}
              onClick={
                email !== null
                  ? () => {
                      window.open(`mailto:${email}`);
                    }
                  : undefined
              }
            />
            <Button
              shape="square"
              iconStart={<IcoDotsThree />}
              aria-label={`${t('table.acciones.mas')} ${nombre}`}
              aria-disabled="true"
              tabIndex={-1}
            />
          </ButtonGroup>
        );
      },
    },
  ];
}

// ── Page component ────────────────────────────────────────────────────────────

export const ClientesPage = () => {
  const { t, i18n } = useTranslation('clientes');
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const prevSelectedIdRef = useRef<TClienteId | null>(null);

  // ── Local state ────────────────────────────────────────────────────────────
  const [selectedClienteId, setSelectedClienteId] = useState<TClienteId | null>(null);
  const [activeSegmento, setActiveSegmento] = useState<TSegmentFilter>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  // Server-side pagination: controlled page state. Reset to 1 on segment change.
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editClienteId, setEditClienteId] = useState<TClienteId | null>(null);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);

  // ── Debounced search ───────────────────────────────────────────────────────
  // Prevents a React Query re-fetch on every keystroke. Search is client-side
  // over the current page — the adapter has a search() method but no integrated
  // server-side search in findAllWithStats. A future improvement could pass a
  // search param to the adapter's findAllWithStats for full server-side search.
  const debouncedSearch = useDebouncedValue(searchQuery, 200);

  // ── Data hooks ─────────────────────────────────────────────────────────────
  // Server-side pagination: 25 rows per page. React Query caches each page
  // independently and keepPreviousData prevents the table from flickering.
  const {
    rows,
    total,
    kpi,
    isLoading,
    isError,
    refetch: refetchClientes,
  } = useClientes({
    page: currentPage,
    perPage: 25,
    includeInactive: activeSegmento === 'inactivo',
  });

  const {
    detalle,
    isLoading: isDetailLoading,
    isError: isDetailError,
    refetch: refetchDetalle,
  } = useClienteDetalle(selectedClienteId);

  const reactivateMutation = useReactivateCliente();
  const { success: toastSuccess, error: toastError } = useToast();

  // ── Derived values ────────────────────────────────────────────────────────
  // Filter is client-side over the current server page. With server-side
  // pagination the segment filter drives the includeInactive param (server-side)
  // while search filters within the fetched page (client-side for now).
  const filteredRows = filterClientRows(rows, activeSegmento, debouncedSearch);
  const isFiltered = activeSegmento !== 'todos' || searchQuery.trim().length > 0;

  // Segment counts — `inactivo` is null when not on that tab (data not fetched)
  const segmentCounts: Record<TSegmentFilter, number | null> = {
    todos: kpi.totalClientes,
    vip: (rows as IClienteTableRow[]).filter((r) => r.segmento === 'vip').length,
    activo: (rows as IClienteTableRow[]).filter((r) => r.segmento === 'activo').length,
    nuevo: (rows as IClienteTableRow[]).filter((r) => r.segmento === 'nuevo').length,
    en_riesgo: (rows as IClienteTableRow[]).filter((r) => r.segmento === 'en_riesgo').length,
    inactivo: activeSegmento === 'inactivo' ? (rows as IClienteTableRow[]).length : null,
  };

  useEffect(() => {
    if (prevSelectedIdRef.current !== null && selectedClienteId === null) {
      const trigger = document.querySelector<HTMLElement>(
        `[data-cliente-trigger="${prevSelectedIdRef.current}"]`,
      );
      trigger?.focus();
    }
    prevSelectedIdRef.current = selectedClienteId;
  }, [selectedClienteId]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleClosePanel = () => {
    setSelectedClienteId(null);
  };

  const handleSchedule = () => {
    if (selectedClienteId !== null) {
      void navigate({ to: '/dashboard/agenda', search: { clienteId: selectedClienteId } });
    }
  };

  const handleAddCliente = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditCliente = () => {
    if (selectedClienteId !== null) setEditClienteId(selectedClienteId);
  };

  const handleDeleteFromPanel = () => {
    setIsDeactivateDialogOpen(true);
  };

  const handleDeactivateSuccess = () => {
    setSelectedClienteId(null);
    setIsDeactivateDialogOpen(false);
  };

  const handleReactivate = async () => {
    if (selectedClienteId === null) return;
    try {
      await reactivateMutation.mutateAsync(selectedClienteId);
      toastSuccess(t('toast.reactivated'));
      setIsReactivateDialogOpen(false);
      setSelectedClienteId(null);
    } catch (err) {
      toastError(err instanceof Error ? err.message : t('error.description'));
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveSegmento('todos');
    setCurrentPage(1);
  };

  const handleModalSuccess = (action: 'created' | 'updated') => {
    void action;
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Stable row-action handlers — passed into columns (used inside useMemo below)
  const handleRowClickCb = useCallback((clienteId: TClienteId) => {
    setSelectedClienteId(clienteId);
  }, []);
  const handleEditClienteFromRowCb = useCallback((clienteId: TClienteId) => {
    setEditClienteId(clienteId);
  }, []);
  const handleScheduleFromRowCb = useCallback(
    (clienteId: TClienteId) => {
      void navigate({ to: '/dashboard/agenda', search: { clienteId } });
    },
    [navigate],
  );

  // Date formatter memoized on language — rebuilds only on language switch.
  // columns memoized on [t, selectedClienteId, dateFormatter] — recreates only
  // when one of those changes (not on every render).
  const dateFormatter = useMemo(() => buildDateFormatter(i18n.language), [i18n.language]);
  const columns = useMemo(
    () =>
      buildColumns(
        t,
        handleRowClickCb,
        selectedClienteId,
        handleEditClienteFromRowCb,
        dateFormatter,
        handleScheduleFromRowCb,
      ),
    [
      t,
      handleRowClickCb,
      selectedClienteId,
      handleEditClienteFromRowCb,
      dateFormatter,
      handleScheduleFromRowCb,
    ],
  );

  // Convert typed rows to the generic Record shape that Table expects
  const tableData = filteredRows.map((r) => ({
    ...r,
    // Ensure non-serialisable Date fields don't cause issues with the table's
    // generic Record<string, unknown> type constraint
    ultimaVisita: r.ultimaVisita,
    createdAt: r.createdAt,
  })) as unknown as Record<string, unknown>[];

  return (
    <PageLayout>
      <Section $py="xs">
        <Container size="full" gutter="lg">
          <S.StyledClientesPage>
            {/* ── Page header ──────────────────────────────────────────────── */}
            <S.StyledPageHeader>
              <S.StyledPageMeta>
                <S.StyledEyebrow>{t('page.eyebrow')}</S.StyledEyebrow>
                <S.StyledH1>{t('page.title')}</S.StyledH1>
                <S.StyledPageDescription>{t('page.description')}</S.StyledPageDescription>
              </S.StyledPageMeta>
              <S.StyledPageActions>
                <Button
                  variant="solid"
                  color="primary"
                  onClick={handleAddCliente}
                  aria-label={t('actions.add')}
                  iconStart={<IcoPlusCircle />}
                >
                  {t('actions.add')}
                </Button>
              </S.StyledPageActions>
            </S.StyledPageHeader>

            {/* ── KPI strip ────────────────────────────────────────────────── */}
            <S.StyledKPIStrip>
              <S.StyledKPICell>
                <S.StyledKPIIco aria-hidden="true">
                  <IcoZenPeople />
                </S.StyledKPIIco>
                <S.StyledKPIText>
                  <S.StyledKPILabel>{t('kpi.totalClientes')}</S.StyledKPILabel>
                  <S.StyledKPIValue>{isLoading ? '–' : kpi.totalClientes}</S.StyledKPIValue>
                </S.StyledKPIText>
              </S.StyledKPICell>

              <S.StyledKPICell>
                <S.StyledKPIIco aria-hidden="true">
                  <IcoZenSprout />
                </S.StyledKPIIco>
                <S.StyledKPIText>
                  <S.StyledKPILabel>{t('kpi.nuevos30Dias')}</S.StyledKPILabel>
                  <S.StyledKPIValue>{isLoading ? '–' : kpi.nuevos30Dias}</S.StyledKPIValue>
                </S.StyledKPIText>
              </S.StyledKPICell>

              <S.StyledKPICell>
                <S.StyledKPIIco aria-hidden="true">
                  <IcoZenCycle />
                </S.StyledKPIIco>
                <S.StyledKPIText>
                  <S.StyledKPILabel>{t('kpi.recurrencia')}</S.StyledKPILabel>
                  <S.StyledKPIValue>{isLoading ? '–' : `${kpi.recurrenciaPct}%`}</S.StyledKPIValue>
                </S.StyledKPIText>
              </S.StyledKPICell>

              <S.StyledKPICell>
                <S.StyledKPIIco aria-hidden="true">
                  <IcoZenStones />
                </S.StyledKPIIco>
                <S.StyledKPIText>
                  <S.StyledKPILabel>{t('kpi.gastoMedio')}</S.StyledKPILabel>
                  <S.StyledKPIValue>
                    {isLoading ? '–' : `${kpi.gastoMedioCliente.toFixed(2)} €`}
                  </S.StyledKPIValue>
                </S.StyledKPIText>
              </S.StyledKPICell>
            </S.StyledKPIStrip>

            {/* ── Toolbar ──────────────────────────────────────────────────── */}
            <S.StyledToolbar>
              <S.StyledToolbarLeft>
                <S.StyledTabStrip role="group" aria-label={t('filter.segmento')}>
                  {SEGMENT_FILTERS.map((seg) => (
                    <S.StyledTab
                      key={seg}
                      type="button"
                      $active={activeSegmento === seg}
                      onClick={() => {
                        setActiveSegmento(seg);
                        setCurrentPage(1);
                      }}
                      aria-pressed={activeSegmento === seg}
                    >
                      {t(`segmento.${seg}`)}
                      <S.StyledTabCount>
                        {isLoading || segmentCounts[seg] === null ? '–' : segmentCounts[seg]}
                      </S.StyledTabCount>
                    </S.StyledTab>
                  ))}
                </S.StyledTabStrip>
              </S.StyledToolbarLeft>

              <S.StyledSearchWrapper>
                <IcoSearch />
                <S.StyledSearchInput
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder={t('toolbar.buscarPlaceholder')}
                  aria-label={t('toolbar.buscarPlaceholder')}
                />
              </S.StyledSearchWrapper>
            </S.StyledToolbar>

            {/* ── List error banner ────────────────────────────────────────── */}
            {isError && !isLoading && (
              <S.StyledListErrorBanner role="alert" aria-live="assertive">
                <S.StyledListErrorText>{t('error.description')}</S.StyledListErrorText>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    void refetchClientes();
                  }}
                >
                  {t('error.retry')}
                </Button>
              </S.StyledListErrorBanner>
            )}

            {/* ── Master-detail ────────────────────────────────────────────── */}
            <S.StyledMasterDetailLayout>
              <S.StyledTableColumn>
                <S.StyledTableHeader>
                  <S.StyledTableMeta aria-live="polite" aria-atomic="true">
                    {t('table.mostrando', {
                      count: filteredRows.length,
                      total,
                    })}
                  </S.StyledTableMeta>
                </S.StyledTableHeader>

                {filteredRows.length === 0 && !isLoading && !isError && isFiltered && (
                  <S.StyledEmptyFiltersBlock>
                    <S.StyledEmptyFiltersText>{t('empty.description')}</S.StyledEmptyFiltersText>
                    <Button
                      variant="ghost"
                      color="primary"
                      type="button"
                      onClick={handleClearFilters}
                    >
                      {t('empty.action')}
                    </Button>
                  </S.StyledEmptyFiltersBlock>
                )}

                {!(filteredRows.length === 0 && !isLoading && !isError && isFiltered) && (
                  <Table
                    data={tableData}
                    columns={columns}
                    rowKey="clienteId"
                    loading={isLoading}
                    emptyText={isError ? t('error.description') : t('empty.description')}
                    sortable
                    paginated
                    size="md"
                    onRowClick={(row) => {
                      handleRowClickCb(row.clienteId as TClienteId);
                    }}
                    controlledPage={currentPage}
                    controlledTotalRows={total}
                    onControlledPageChange={handlePageChange}
                  />
                )}
              </S.StyledTableColumn>

              {selectedClienteId && !isMobile && (
                <S.StyledPanelWrapper $isOpen>
                  <ClienteDetailPanel
                    detalle={detalle}
                    isOpen
                    isLoading={isDetailLoading}
                    isError={isDetailError}
                    onClose={handleClosePanel}
                    onSchedule={handleSchedule}
                    onEdit={handleEditCliente}
                    onDelete={handleDeleteFromPanel}
                    onReactivate={() => {
                      setIsReactivateDialogOpen(true);
                    }}
                    isReactivatePending={reactivateMutation.isPending}
                    currentUserName={user?.nombre ?? ''}
                    onRetry={refetchDetalle}
                  />
                </S.StyledPanelWrapper>
              )}
            </S.StyledMasterDetailLayout>
          </S.StyledClientesPage>
        </Container>
      </Section>

      {selectedClienteId &&
        isMobile &&
        createPortal(
          <S.StyledClienteDetailModal role="dialog" aria-modal="true" onClick={handleClosePanel}>
            <S.StyledClienteDetailModalContent
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <ClienteDetailPanel
                detalle={detalle}
                isOpen
                isLoading={isDetailLoading}
                isError={isDetailError}
                onClose={handleClosePanel}
                onSchedule={handleSchedule}
                onEdit={handleEditCliente}
                onDelete={handleDeleteFromPanel}
                onReactivate={() => {
                  setIsReactivateDialogOpen(true);
                }}
                isReactivatePending={reactivateMutation.isPending}
                currentUserName={user?.nombre ?? ''}
                onRetry={refetchDetalle}
              />
            </S.StyledClienteDetailModalContent>
          </S.StyledClienteDetailModal>,
          document.body,
        )}

      {isCreateModalOpen && (
        <ClienteModal
          open
          onClose={() => {
            setIsCreateModalOpen(false);
          }}
          onSuccess={handleModalSuccess}
          mode="create"
        />
      )}

      {editClienteId !== null && (
        <ClienteModal
          open
          onClose={() => {
            setEditClienteId(null);
          }}
          onSuccess={handleModalSuccess}
          mode="edit"
          clienteId={editClienteId}
        />
      )}

      <DeactivateClienteDialog
        open={isDeactivateDialogOpen}
        onClose={() => {
          setIsDeactivateDialogOpen(false);
        }}
        clienteId={selectedClienteId}
        clienteName={
          detalle?.cliente ? `${detalle.cliente.nombre} ${detalle.cliente.apellidos}`.trim() : ''
        }
        onSuccess={handleDeactivateSuccess}
      />

      <Dialog
        open={isReactivateDialogOpen}
        onClose={() => {
          setIsReactivateDialogOpen(false);
        }}
        type="success"
        showCancel
        title={t('actions.reactivar')}
        message={(() => {
          const clientName = detalle?.cliente
            ? `${detalle.cliente.nombre} ${detalle.cliente.apellidos}`.trim()
            : undefined;
          return clientName
            ? t('reactivate.message', { name: clientName })
            : t('reactivate.messageFallback');
        })()}
        confirmText={t('actions.reactivar')}
        cancelText={t('modal.cancel')}
        loading={reactivateMutation.isPending}
        onConfirm={() => {
          void handleReactivate();
        }}
        onCancel={() => {
          setIsReactivateDialogOpen(false);
        }}
      />
    </PageLayout>
  );
};
