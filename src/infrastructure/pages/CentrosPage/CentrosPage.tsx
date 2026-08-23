import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@app/stores/useUserStore';
import { CentroModal } from '@infra/components/ui/domain/modals/CentroModal';
import { SalaModal } from '@infra/components/ui/domain/modals/SalaModal';
import type { TCentroId, TSalaId } from '@domain/types';
import { FeaturePermissionService } from '@domain/services/FeaturePermissionService';
import type { ICentro, ISala } from '@domain/models';
import { useCentrosPage } from '@infra/hooks/useCentrosPage';
import { Empty } from '@infra/components/ui/common/Empty';
import { Container, PageLayout, Section } from '@infra/components/ui/core/Layout';
import { StyledCentrosPage, StyledContentGrid } from './CentrosPage.styles';
import { CentrosPageHeader } from './components/CentrosPageHeader';
import { CentrosKPIStrip } from './components/CentrosKPIStrip';
import { CentrosToolbar } from './components/CentrosToolbar';
import { CenterList } from './components/CenterList';
import { DetailPanel } from './components/DetailPanel';
import type { TTab } from './components/centros.types';

const canWrite = FeaturePermissionService.canManageCentros;

export const CentrosPage = () => {
  const { t } = useTranslation(['dashboard']);
  const user = useUserStore((s) => s.user);
  const roles = user?.roles ?? [];

  const [activeTab, setActiveTab] = useState<TTab>('todos');
  const [selectedCentroId, setSelectedCentroId] = useState<TCentroId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [salaViewMode, setSalaViewMode] = useState<'grid' | 'list'>('grid');

  // Modal state
  const [isCreateCentroOpen, setIsCreateCentroOpen] = useState(false);
  const [editCentroData, setEditCentroData] = useState<ICentro | null>(null);
  const [salaModalState, setSalaModalState] = useState<{
    centroId: TCentroId;
    centroNombre: string;
    salaId?: TSalaId;
    sala?: ISala;
  } | null>(null);

  const { centros, networkKPIs, centroStats, isLoading, isError } = useCentrosPage();

  // Tab filter
  const centrosFiltradosPorTab = centros.filter((c) => {
    if (activeTab === 'abiertos') return c.activo;
    // suite_pareja and incidencias: no domain field available — show all
    return true;
  });

  // Search filter applied on top of tab filter
  const centrosFiltrados = centrosFiltradosPorTab.filter((c) =>
    searchQuery.trim().length === 0
      ? true
      : c.nombre.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Tab counts
  const tabCounts: Record<TTab, number> = {
    todos: centros.length,
    abiertos: centros.filter((c) => c.activo).length,
    suite_pareja: centros.length, // placeholder — no domain filter available
    incidencias: centros.length, // placeholder — no domain filter available
  };

  // Auto-select first centro
  const effectiveSelectedCentroId =
    selectedCentroId !== null && centrosFiltrados.find((c) => c.id === selectedCentroId)
      ? selectedCentroId
      : centrosFiltrados.length > 0
        ? centrosFiltrados[0].id
        : null;

  const selectedCentro = centros.find((c) => c.id === effectiveSelectedCentroId) ?? null;

  const handleTabChange = (tab: TTab) => {
    setActiveTab(tab);
    const nextFiltered = centros.filter((c) => {
      if (tab === 'abiertos') return c.activo;
      return true;
    });
    if (selectedCentroId !== null && !nextFiltered.find((c) => c.id === selectedCentroId)) {
      setSelectedCentroId(null);
    }
  };

  if (isError) {
    return (
      <PageLayout>
        <Section $py="2xl">
          <Container size="full" gutter="lg">
            <Empty
              preset="error"
              title={t('dashboard:centros.errorTitle')}
              description={t('dashboard:centros.errorDescription')}
            />
          </Container>
        </Section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Section $py="xs">
        <Container size="full" gutter="lg">
          <StyledCentrosPage>
            {/* ── Page header ──────────────────────────────────────────────── */}
            <CentrosPageHeader
              centrosActivos={networkKPIs.centrosActivos}
              salasTotales={networkKPIs.salasTotales}
              canAdd={canWrite(roles)}
              onAddCentro={() => {
                setIsCreateCentroOpen(true);
              }}
            />

            {/* ── KPI strip ────────────────────────────────────────────────── */}
            <CentrosKPIStrip
              centrosActivos={networkKPIs.centrosActivos}
              salasTotales={networkKPIs.salasTotales}
              ocupacionHoyPct={networkKPIs.ocupacionHoyPct}
              enMantenimiento={networkKPIs.enMantenimiento}
              isLoading={isLoading}
            />

            {/* ── Toolbar ──────────────────────────────────────────────────── */}
            <CentrosToolbar
              activeTab={activeTab}
              tabCounts={tabCounts}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onTabChange={handleTabChange}
              onSearchChange={setSearchQuery}
            />

            {/* ── Content grid ─────────────────────────────────────────────── */}
            {centrosFiltrados.length === 0 && !isLoading ? (
              <Empty
                preset="no-data"
                title={t('dashboard:centros.emptyTitle')}
                description={t('dashboard:centros.emptyDescription')}
              />
            ) : (
              <StyledContentGrid>
                <CenterList
                  centros={centrosFiltrados}
                  selectedId={effectiveSelectedCentroId}
                  onSelect={setSelectedCentroId}
                  centroStats={centroStats}
                  onAddCentro={
                    canWrite(roles)
                      ? () => {
                          setIsCreateCentroOpen(true);
                        }
                      : null
                  }
                />
                {selectedCentro !== null ? (
                  <DetailPanel
                    centro={selectedCentro}
                    roles={roles}
                    onAddSala={() => {
                      setSalaModalState({
                        centroId: selectedCentro.id,
                        centroNombre: selectedCentro.nombre,
                      });
                    }}
                    onEditSala={(sala) => {
                      setSalaModalState({
                        centroId: selectedCentro.id,
                        centroNombre: selectedCentro.nombre,
                        salaId: sala.id,
                        sala,
                      });
                    }}
                    onEditCentro={() => {
                      setEditCentroData(selectedCentro);
                    }}
                    salaViewMode={salaViewMode}
                    onSalaViewModeChange={setSalaViewMode}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '300px',
                    }}
                  >
                    <span>{t('dashboard:centros.detail.selectPrompt')}</span>
                  </div>
                )}
              </StyledContentGrid>
            )}
          </StyledCentrosPage>
        </Container>
      </Section>

      {/* Create centro modal */}
      {isCreateCentroOpen && (
        <CentroModal
          open
          onClose={() => {
            setIsCreateCentroOpen(false);
          }}
          onSuccess={() => {
            setIsCreateCentroOpen(false);
          }}
          mode="create"
        />
      )}

      {/* Edit centro modal */}
      {editCentroData !== null && (
        <CentroModal
          open
          onClose={() => {
            setEditCentroData(null);
          }}
          onSuccess={() => {
            setEditCentroData(null);
          }}
          mode="edit"
          centroId={editCentroData.id}
          initialData={editCentroData}
        />
      )}

      {/* Sala modal (create or edit) */}
      {salaModalState !== null && (
        <SalaModal
          open
          onClose={() => {
            setSalaModalState(null);
          }}
          onSuccess={() => {
            setSalaModalState(null);
          }}
          mode={salaModalState.salaId !== undefined ? 'edit' : 'create'}
          centroId={salaModalState.centroId}
          centroNombre={salaModalState.centroNombre}
          salaId={salaModalState.salaId}
          initialData={salaModalState.sala}
        />
      )}
    </PageLayout>
  );
};
