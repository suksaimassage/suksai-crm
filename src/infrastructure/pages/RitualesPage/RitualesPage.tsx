import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@app/stores/useUserStore';
import { ServicioModal } from '@infra/components/ui/domain/modals/ServicioModal';
import type { TServicioId, TTipoServicioId } from '@domain/types';
import { FeaturePermissionService } from '@domain/services/FeaturePermissionService';
import type { IServicio, ITipoServicio } from '@domain/models';
import { useServicios } from '@infra/hooks/useServicios';
import { useTipoServicios } from '@infra/hooks/useTipoServicios';
import { useDashboardCentroId } from '@infra/hooks/useDashboardCentroId';
import { useReservasMes } from '@infra/hooks/useReservasMes';
import { Empty } from '@infra/components/ui/common/Empty';
import { Button } from '@infra/components/ui/common/Button';
import { Container, PageLayout, Section } from '@infra/components/ui/core/Layout';
import { StyledRitualesPage, StyledContentGrid } from './RitualesPage.styles';
import type { TTone } from './RitualesPage.styles';
import { RitualesPageHeader } from './components/RitualesPageHeader';
import { RitualesKPIStrip } from './components/RitualesKPIStrip';
import { RitualesToolbar } from './components/RitualesToolbar';
import type { TActiveTab } from './components/rituales.utils';
import { CategoryRail } from './components/CategoryRail';
import { ServiceGridSection, SkeletonGrid, ComingSoonGrid } from './components/ServiceGridSection';
import { ComplementosSection } from './components/ComplementosSection';
import { StyledSrOnly } from './RitualesPage.styles';

// ── Role helpers ───────────────────────────────────────────────────────────────

const canWrite = FeaturePermissionService.canManageRituales;

// ── Tone helpers ───────────────────────────────────────────────────────────────

const TONES = ['bamboo', 'gold', 'lotus', 'ink', 'clay', 'default'] as const;

function buildToneMap(tipoServicios: readonly ITipoServicio[]): Map<TTipoServicioId, TTone> {
  return new Map(tipoServicios.map((cat, idx) => [cat.id, TONES[idx % TONES.length]]));
}

// ── Page root ──────────────────────────────────────────────────────────────────

export const RitualesPage = () => {
  const { t, i18n } = useTranslation(['rituales']);
  const user = useUserStore((s) => s.user);
  const roles = user?.roles ?? [];
  const locale = i18n.language;

  // Centro resolution
  const { centroId } = useDashboardCentroId(user?.id ?? null);

  // Data hooks
  const { servicios, isLoading: servLoading, isError: servError, refetch } = useServicios(centroId);
  const { tipoServicios, isLoading: tipoLoading, isError: tipoError } = useTipoServicios();
  const { data: reservasMesData } = useReservasMes(centroId);

  // Local filter state
  const [activeTab, setActiveTab] = useState<TActiveTab>('activos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<TTipoServicioId | null>(null);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editServicioId, setEditServicioId] = useState<TServicioId | null>(null);
  const [editServicioData, setEditServicioData] = useState<IServicio | null>(null);

  // Split bono vs non-bono
  const serviciosBase = servicios.filter((s) => !s.esBono);
  const complementos = servicios.filter((s) => s.esBono);

  // Apply filters to base services
  const filtered = serviciosBase.filter((s) => {
    if (activeTab !== 'todos' && activeTab !== 'activos') return false;
    if (selectedCategoryId !== null && s.tipoServicioId !== selectedCategoryId) return false;
    if (searchQuery.trim() !== '') {
      return s.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // KPI values
  const kpiActivos = serviciosBase.filter((s) => s.estado === 'activo').length;
  const kpiPrecioMedio =
    serviciosBase.length > 0
      ? serviciosBase.reduce((sum, s) => sum + s.precioBase, 0) / serviciosBase.length
      : 0;
  const kpiCategorias = new Set(serviciosBase.map((s) => s.tipoServicioId)).size;
  const kpiReservasMes = reservasMesData ?? null;

  // Category counts for the rail
  const categoryCounts = new Map<TTipoServicioId, number>(
    tipoServicios.map((cat) => [
      cat.id,
      serviciosBase.filter((s) => s.tipoServicioId === cat.id).length,
    ]),
  );

  const categoryToneMap = buildToneMap(tipoServicios);
  const isLoading = servLoading || tipoLoading;

  // ── Error state ────────────────────────────────────────────────────────────
  if (servError || tipoError) {
    return (
      <PageLayout>
        <Section $py="xs">
          <Container size="full" gutter="lg">
            <Empty
              preset="error"
              title={t('rituales:empty.error')}
              description={t('rituales:empty.errorDesc')}
            >
              <Button
                onClick={() => {
                  void refetch();
                }}
                variant="ghost"
                color="primary"
              >
                {t('rituales:empty.retry')}
              </Button>
            </Empty>
          </Container>
        </Section>
      </PageLayout>
    );
  }

  const showComingSoon = activeTab === 'inactivos' || activeTab === 'archivados';

  const handleOpenCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleEdit = (s: IServicio) => {
    setEditServicioId(s.id);
    setEditServicioData(s);
  };

  return (
    <PageLayout>
      <Section $py="xs">
        <Container size="full" gutter="lg">
          <StyledRitualesPage>
            {/* ── Page header ───────────────────────────────────────────── */}
            <RitualesPageHeader onNewRitual={handleOpenCreate} />

            {/* ── KPI strip ─────────────────────────────────────────────── */}
            <RitualesKPIStrip
              kpiActivos={kpiActivos}
              kpiPrecioMedio={kpiPrecioMedio}
              kpiCategorias={kpiCategorias}
              kpiReservasMes={kpiReservasMes}
              locale={locale}
              isLoading={isLoading}
            />

            {/* ── Toolbar ───────────────────────────────────────────────── */}
            <RitualesToolbar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activosCount={serviciosBase.filter((s) => s.estado === 'activo').length}
              todosCount={serviciosBase.length}
              filteredCount={filtered.length}
            />

            {/* ── Main content grid ──────────────────────────────────────── */}
            <StyledContentGrid>
              {/* Category rail */}
              <CategoryRail
                tipoServicios={tipoServicios}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                categoryCounts={categoryCounts}
                totalCount={serviciosBase.length}
                avgPrice={kpiPrecioMedio}
                locale={locale}
              />

              {/* Service grid area */}
              {isLoading ? (
                <SkeletonGrid label={t('rituales:loading.services')} />
              ) : showComingSoon ? (
                <ComingSoonGrid message={t('rituales:grid.comingSoonContent')} />
              ) : (
                <div>
                  <StyledSrOnly as="h2">{t('rituales:grid.sectionTitle')}</StyledSrOnly>
                  <ServiceGridSection
                    servicios={filtered}
                    tipoServicios={tipoServicios}
                    categoryToneMap={categoryToneMap}
                    searchQuery={searchQuery}
                    canAdd={canWrite(roles)}
                    locale={locale}
                    onAddNew={handleOpenCreate}
                    onEdit={handleEdit}
                  />
                </div>
              )}
            </StyledContentGrid>

            {/* ── Complementos section ───────────────────────────────────── */}
            {!isLoading && complementos.length > 0 && (
              <ComplementosSection
                complementos={complementos}
                tipoServicios={tipoServicios}
                categoryToneMap={categoryToneMap}
                searchQuery={searchQuery}
                canAdd={canWrite(roles)}
                locale={locale}
                onAddNew={handleOpenCreate}
                onEdit={handleEdit}
              />
            )}
          </StyledRitualesPage>
        </Container>
      </Section>

      {isCreateModalOpen && (
        <ServicioModal
          open
          onClose={() => {
            setIsCreateModalOpen(false);
          }}
          onSuccess={() => {
            void refetch();
          }}
          mode="create"
        />
      )}

      {editServicioId !== null && (
        <ServicioModal
          open
          onClose={() => {
            setEditServicioId(null);
            setEditServicioData(null);
          }}
          onSuccess={() => {
            void refetch();
          }}
          mode="edit"
          servicioId={editServicioId}
          initialData={editServicioData ?? undefined}
        />
      )}
    </PageLayout>
  );
};
