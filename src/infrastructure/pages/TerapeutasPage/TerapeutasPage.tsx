import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useActiveCentroStore } from '@app/stores/useActiveCentroStore';
import { useCentrosActivos } from '@infra/hooks/useCentrosActivos';
import { useTerapeutas } from '@infra/hooks/useTerapeutas';
import { useTerapeutasFilter } from '@infra/hooks/useTerapeutasFilter';
import { TerapeutaCard } from '@infra/components/ui/domain/TerapeutaCard/TerapeutaCard';
import { TerapeutaAddCard } from '@infra/components/ui/domain/TerapeutaCard/TerapeutaAddCard';
import { TerapeutaModal } from '@infra/components/ui/domain/modals/TerapeutaModal';
import { TerapeutasKpiStrip } from '@infra/components/ui/domain/TerapeutasKpiStrip/TerapeutasKpiStrip';
import { Button } from '@infra/components/ui/common/Button';
import { Tabs } from '@infra/components/ui/common/Tabs';
import { WorkScheduleSection } from './components/WorkScheduleSection';
import {
  StyledSkeletonCard,
  StyledSkeletonLine,
} from '@infra/components/ui/domain/TerapeutaCard/TerapeutaCard.styles';
import * as S from './TerapeutasPage.styles';
import type { TTerapeutasTab, TTerapeutasSort } from '@infra/hooks/useTerapeutasFilter';
import type { ITerapeutaAggregate } from '@infra/hooks/useTerapeutas';
import { Container, PageLayout, Section } from '@infra/components/ui/core/Layout';

type TPageTab = 'directorio' | 'horarios';

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

const IcoChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IcoUsers = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS: readonly TTerapeutasTab[] = [
  'todos',
  'en_sala',
  'disponibles',
  'descanso',
  'inactivos',
];

// ── Skeleton grid ──────────────────────────────────────────────────────────────

interface ISkeletonGridProps {
  readonly label: string;
}

const SkeletonGrid = ({ label }: ISkeletonGridProps) => (
  <S.StyledCardGrid aria-busy="true" aria-label={label}>
    {Array.from({ length: 6 }).map((_, i) => (
      <S.StyledCardItem key={i}>
        <StyledSkeletonCard>
          <div
            style={{
              padding: '32px 24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <StyledSkeletonLine $width="72px" $height="72px" style={{ borderRadius: '50%' }} />
            <StyledSkeletonLine $width="60%" $mx />
            <StyledSkeletonLine $width="40%" $mx />
          </div>
          <div
            style={{
              padding: '8px 24px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <StyledSkeletonLine $width="100%" $height="40px" />
          </div>
          <div
            style={{
              padding: '0 24px 16px',
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <StyledSkeletonLine $width="60px" $height="20px" />
            <StyledSkeletonLine $width="80px" $height="20px" />
          </div>
        </StyledSkeletonCard>
      </S.StyledCardItem>
    ))}
  </S.StyledCardGrid>
);

// ── Error state ────────────────────────────────────────────────────────────────

interface IErrorStateProps {
  readonly onRetry: () => void;
}

const ErrorState = ({ onRetry }: IErrorStateProps) => {
  const { t } = useTranslation('terapeutas');
  return (
    <S.StyledErrorState role="alert">
      <S.StyledEmptyIcon>
        <IcoUsers />
      </S.StyledEmptyIcon>
      <S.StyledErrorTitle>{t('error.title')}</S.StyledErrorTitle>
      <S.StyledEmptyDescription>{t('error.description')}</S.StyledEmptyDescription>
      <Button variant="solid" color="primary" onClick={onRetry}>
        {t('error.retry')}
      </Button>
    </S.StyledErrorState>
  );
};

// ── Empty state ────────────────────────────────────────────────────────────────

interface IEmptyStateProps {
  readonly isFiltered: boolean;
  readonly onClearFilters?: () => void;
  readonly onAddClick?: () => void;
}

const EmptyState = ({ isFiltered, onClearFilters, onAddClick }: IEmptyStateProps) => {
  const { t } = useTranslation('terapeutas');
  const ns = isFiltered ? 'empty_filtered' : 'empty';
  return (
    <S.StyledEmptyState>
      <S.StyledEmptyIcon>
        <IcoUsers />
      </S.StyledEmptyIcon>
      <S.StyledEmptyTitle>{t(`${ns}.title`)}</S.StyledEmptyTitle>
      <S.StyledEmptyDescription>{t(`${ns}.description`)}</S.StyledEmptyDescription>
      {isFiltered && onClearFilters !== undefined ? (
        <Button variant="outlined" color="primary" onClick={onClearFilters}>
          {t(`${ns}.action`)}
        </Button>
      ) : (
        onAddClick !== undefined && (
          <Button variant="solid" color="primary" onClick={onAddClick}>
            {t(`${ns}.action`)}
          </Button>
        )
      )}
    </S.StyledEmptyState>
  );
};

// ── Directorio tab panel ────────────────────────────────────────────────────
//
// Page-local grouping component (not exported, not a DS component). Exists only
// to give the 'directorio' tab a single content node and keep the page readable.
// Owns NO state — receives the already-derived filter props from the page.

interface IDirectorioPanelProps {
  readonly data: readonly ITerapeutaAggregate[];
  readonly filtered: readonly ITerapeutaAggregate[];
  readonly filterState: ReturnType<typeof useTerapeutasFilter>['filterState'];
  readonly counts: ReturnType<typeof useTerapeutasFilter>['counts'];
  readonly allEspecialidades: readonly string[];
  readonly isDirty: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly onRetry: () => void;
  readonly setTab: (tab: TTerapeutasTab) => void;
  readonly setSearch: (value: string) => void;
  readonly setEspecialidad: (value: string | null) => void;
  readonly setSort: (value: TTerapeutasSort) => void;
  readonly clearFilters: () => void;
  readonly onAddClick: () => void;
  readonly onEditAggregate: (aggregate: ITerapeutaAggregate) => void;
  readonly onManageSchedule: () => void;
}

const DirectorioPanel = ({
  data,
  filtered,
  filterState,
  counts,
  allEspecialidades,
  isDirty,
  isLoading,
  isError,
  onRetry,
  setTab,
  setSearch,
  setEspecialidad,
  setSort,
  clearFilters,
  onAddClick,
  onEditAggregate,
  onManageSchedule,
}: IDirectorioPanelProps) => {
  const { t } = useTranslation('terapeutas');

  const totalEquipo = data.length;
  const totalActivos = data.filter((tp) => tp.activo).length;
  const enSalaAhora = data.filter((tp) => tp.estadoActual === 'en_sala').length;
  const horasSemana = data.reduce((acc, tp) => acc + tp.totalHorasSemana, 0);
  const avgHorasAlMes = totalEquipo > 0 ? Math.round((horasSemana / totalEquipo) * 4.33) : 0;

  return (
    <>
      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <TerapeutasKpiStrip
        totalActivos={totalActivos}
        totalEquipo={totalEquipo}
        enSalaAhora={enSalaAhora}
        horasSemana={horasSemana}
        avgHorasAlMes={avgHorasAlMes}
        isLoading={isLoading}
      />

      {/* ── Toolbar (status pill-filters + search · filters) ──────────────── */}
      <S.StyledToolbar>
        <S.StyledToolbarLeft>
          {/* Status filters — a filter GROUP of toggle buttons (aria-pressed),
              NOT a tablist. The page-level tabs are the only role="tab" layer. */}
          <S.StyledFilterStrip role="group" aria-label={t('toolbar.statusFilter')}>
            {TABS.map((tab) => (
              <S.StyledTab
                key={tab}
                $active={filterState.tab === tab}
                aria-pressed={filterState.tab === tab}
                onClick={() => {
                  setTab(tab);
                }}
                type="button"
              >
                {t(`tabs.${tab}`)}
                <S.StyledTabCount>{counts[tab]}</S.StyledTabCount>
              </S.StyledTab>
            ))}
          </S.StyledFilterStrip>

          <S.StyledSearchWrapper>
            <IcoSearch />
            <S.StyledSearchInput
              type="search"
              value={filterState.search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder={t('toolbar.search_placeholder')}
              aria-label={t('toolbar.search_placeholder')}
            />
          </S.StyledSearchWrapper>
        </S.StyledToolbarLeft>

        <S.StyledToolbarRight>
          {allEspecialidades.length > 0 && (
            <S.StyledSelectWrapper>
              <S.StyledSelect
                value={filterState.especialidad ?? ''}
                onChange={(e) => {
                  setEspecialidad(e.target.value === '' ? null : e.target.value);
                }}
                aria-label={t('toolbar.especialidad')}
              >
                <option value="">{t('toolbar.especialidad')}</option>
                {allEspecialidades.map((esp) => (
                  <option key={esp} value={esp}>
                    {esp}
                  </option>
                ))}
              </S.StyledSelect>
              <S.StyledSelectChevron>
                <IcoChevronDown />
              </S.StyledSelectChevron>
            </S.StyledSelectWrapper>
          )}

          <S.StyledSelectWrapper>
            <S.StyledSelect
              value={filterState.sort}
              onChange={(e) => {
                setSort(e.target.value as TTerapeutasSort);
              }}
              aria-label={t('toolbar.sort')}
            >
              <option value="nombre_asc">{t('toolbar.sort_nombre_asc')}</option>
              <option value="nombre_desc">{t('toolbar.sort_nombre_desc')}</option>
              <option value="sesiones_desc">{t('toolbar.sort_sesiones_desc')}</option>
              <option value="ingresos_desc">{t('toolbar.sort_ingresos_desc')}</option>
            </S.StyledSelect>
            <S.StyledSelectChevron>
              <IcoChevronDown />
            </S.StyledSelectChevron>
          </S.StyledSelectWrapper>

          {isDirty && (
            <S.StyledClearFiltersBtn type="button" onClick={clearFilters}>
              {t('toolbar.clear')}
            </S.StyledClearFiltersBtn>
          )}
        </S.StyledToolbarRight>
      </S.StyledToolbar>

      {/* ── Content area ───────────────────────────────────────────────────── */}
      {isError && <ErrorState onRetry={onRetry} />}

      {!isError && isLoading && <SkeletonGrid label={t('page.loading')} />}

      {!isError && !isLoading && filtered.length === 0 && (
        <EmptyState
          isFiltered={isDirty || filterState.tab !== 'todos'}
          onClearFilters={clearFilters}
          onAddClick={onAddClick}
        />
      )}

      {!isError && !isLoading && filtered.length > 0 && (
        <S.StyledCardGrid role="list" aria-label={t('page.title')}>
          {filtered.map((aggregate) => (
            <S.StyledCardItem key={aggregate.usuarioId} role="listitem">
              <TerapeutaCard
                aggregate={aggregate}
                onEdit={() => {
                  onEditAggregate(aggregate);
                }}
                onManageSchedule={onManageSchedule}
              />
            </S.StyledCardItem>
          ))}

          {/* Add card at the end */}
          <TerapeutaAddCard
            onAddClick={onAddClick}
            label={t('card.add_label')}
            description={t('card.add_description')}
          />
        </S.StyledCardGrid>
      )}
    </>
  );
};

// ── Page component ────────────────────────────────────────────────────────────

export const TerapeutasPage = () => {
  const { t } = useTranslation('terapeutas');
  const { data: centros = [], isLoading: centrosIsLoading } = useCentrosActivos();
  const { centroId, setCentroId } = useActiveCentroStore();

  // Auto-select the first active centro when none is stored, or if the stored one
  // no longer exists in the active list (e.g. centro was deactivated).
  useEffect(() => {
    if (centros.length === 0) return;
    // centros[0] is guaranteed non-undefined by the length guard above
    const first = centros[0];
    const isValid = centros.some((c) => c.id === centroId);
    if (centroId === null || !isValid) {
      setCentroId(first.id);
    }
  }, [centroId, centros, setCentroId]);

  // Use the persisted centroId, falling back to the first centro while the effect hasn't fired yet.
  // centros[0] may be undefined at runtime (empty array); cast clarifies this for ESLint.
  const effectiveCentroId = centroId ?? (centros[0] as (typeof centros)[0] | undefined)?.id ?? null;

  const {
    data,
    isLoading: terapeutasIsLoading,
    isError,
    refetch,
  } = useTerapeutas(effectiveCentroId);
  const isLoading = centrosIsLoading || terapeutasIsLoading;
  const {
    filtered,
    filterState,
    setTab,
    setSearch,
    setEspecialidad,
    setSort,
    clearFilters,
    isDirty,
    counts,
    allEspecialidades,
  } = useTerapeutasFilter(data);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editAggregate, setEditAggregate] = useState<ITerapeutaAggregate | null>(null);
  // Page-level tab (Option B). Controlled so the card menu can switch tabs.
  const [activeTab, setActiveTab] = useState<TPageTab>('directorio');
  // True only when the schedule tab was opened via a card menu (not a direct tab
  // click) — drives the one-shot focus move in WorkScheduleSection (WCAG 3.2.2).
  const [scheduleAutoFocus, setScheduleAutoFocus] = useState(false);

  const handleAddClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditClick = (aggregate: ITerapeutaAggregate) => {
    setEditAggregate(aggregate);
  };

  // Card menu "Horario de trabajo" → switch to the schedule tab. The schedule
  // section moves focus to itself on mount (the originating card unmounts under
  // destroyOnHide, so focus must not be returned to a detached node).
  const handleManageSchedule = () => {
    setScheduleAutoFocus(true);
    setActiveTab('horarios');
  };

  const handleModalSuccess = (_action: 'created' | 'updated' | 'deleted' | 'reactivated') => {
    // cache invalidation and toasts owned by TerapeutaModal mutation hooks
  };

  // Named handler — stable reference for React Compiler (closes only over setEditAggregate,
  // a stable state dispatcher). Inline arrow in JSX is NOT stabilizable by the Compiler
  // because it has a side effect, causing useEscapeKey and the success useEffect in
  // TerapeutaModal to re-register on every TerapeutasPage render.
  const handleEditModalClose = () => {
    setEditAggregate(null);
  };

  return (
    <PageLayout>
      <Section $py={'xl'}>
        <Container size="full" gutter={'lg'}>
          {/* ── Page header ──────────────────────────────────────────────────── */}
          <S.StyledPageHeader>
            <S.StyledPageMeta>
              <S.StyledPageEyebrow>{t('page.eyebrow')}</S.StyledPageEyebrow>
              <S.StyledPageTitle>
                {t('page.title')}
                {t('page.titleAccent') !== '' && (
                  <>
                    {' '}
                    <S.StyledH1Accent>{t('page.titleAccent')}</S.StyledH1Accent>
                  </>
                )}
              </S.StyledPageTitle>
              <S.StyledPageDescription>{t('page.description')}</S.StyledPageDescription>
            </S.StyledPageMeta>
            <S.StyledPageActions>
              {centros.length > 1 && (
                <S.StyledSelectWrapper>
                  <S.StyledSelect
                    value={effectiveCentroId ?? ''}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      if (id > 0) setCentroId(id);
                    }}
                    aria-label={t('toolbar.centro')}
                  >
                    {centros.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </S.StyledSelect>
                  <S.StyledSelectChevron>
                    <IcoChevronDown />
                  </S.StyledSelectChevron>
                </S.StyledSelectWrapper>
              )}
              <Button
                variant="solid"
                color="primary"
                onClick={handleAddClick}
                aria-label={t('actions.add')}
                iconStart={<IcoPlusCircle />}
              >
                {t('actions.add')}
              </Button>
            </S.StyledPageActions>
          </S.StyledPageHeader>

          {/* ── Page-level tabs (Option B) ───────────────────────────────────── */}
          {/* variant="enclosed" reads as primary navigation and is visually
              distinct from the inner status pill-filters. Controlled activeKey so
              the card menu can switch tabs. destroyOnHide keeps the heavy calendar
              unmounted until 'horarios' is active. */}
          <Tabs
            variant="enclosed"
            size="md"
            activeKey={activeTab}
            onChange={(key) => {
              // A direct tab click must NOT steal focus into the panel (WCAG 3.2.2).
              setScheduleAutoFocus(false);
              setActiveTab(key as TPageTab);
            }}
            destroyOnHide
            tabs={[
              {
                key: 'directorio',
                label: t('tabs.directorio'),
                content: (
                  <DirectorioPanel
                    data={data}
                    filtered={filtered}
                    filterState={filterState}
                    counts={counts}
                    allEspecialidades={allEspecialidades}
                    isDirty={isDirty}
                    isLoading={isLoading}
                    isError={isError}
                    onRetry={refetch}
                    setTab={setTab}
                    setSearch={setSearch}
                    setEspecialidad={setEspecialidad}
                    setSort={setSort}
                    clearFilters={clearFilters}
                    onAddClick={handleAddClick}
                    onEditAggregate={handleEditClick}
                    onManageSchedule={handleManageSchedule}
                  />
                ),
              },
              {
                key: 'horarios',
                label: t('tabs.horarios'),
                content: (
                  <WorkScheduleSection centroId={effectiveCentroId} autoFocus={scheduleAutoFocus} />
                ),
              },
            ]}
          />
        </Container>
      </Section>

      {isCreateModalOpen && (
        <TerapeutaModal
          open
          onClose={() => {
            setIsCreateModalOpen(false);
          }}
          onSuccess={handleModalSuccess}
          mode="create"
        />
      )}

      {editAggregate !== null && (
        <TerapeutaModal
          open
          onClose={handleEditModalClose}
          onSuccess={handleModalSuccess}
          mode="edit"
          usuarioId={editAggregate.usuarioId}
          initialRol={editAggregate.roles.find((r) => r !== 'superadmin')}
          initialData={{
            id: editAggregate.usuarioId,
            nombre: editAggregate.nombre,
            apellidos: editAggregate.apellidos,
            email: editAggregate.email,
            telefono: editAggregate.telefono,
            activo: editAggregate.activo,
            createdAt: editAggregate.createdAt,
            updatedAt: editAggregate.createdAt,
          }}
        />
      )}
    </PageLayout>
  );
};
