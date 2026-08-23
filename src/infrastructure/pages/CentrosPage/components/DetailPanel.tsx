import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@infra/components/ui/common/Button';
import { Empty } from '@infra/components/ui/common/Empty';
import { Table } from '@infra/components/ui/common/Table';
import { Dialog } from '@infra/components/ui/common/Dialog';
import { DeleteGuardDialog } from '@infra/components/ui/common/DeleteGuardDialog';
import { useToast } from '@infra/components/ui/common/Toast';
import type { ITableColumnDef } from '@infra/components/ui/common/Table/Table.types';
import { useCentroDetail } from '@infra/hooks/useCentroDetail';
import { useUpdateSala } from '@infra/hooks/useUpdateSala';
import { useSalaDeletion } from '@infra/hooks/useSalaDeletion';
import type { ICentro, ISala } from '@domain/models';
import type { TNombreRol } from '@domain/types';
import { FeaturePermissionService } from '@domain/services/FeaturePermissionService';
import suksaiLogoLight from '@infra/assets/images/suksai-massage-logo.png';
import suksaiLogoDark from '@infra/assets/images/cropped-suksai-massage-dark.png';
import { IcoPin, IcoClock, IcoPhone, IcoPencilEdit } from './centros.icons';
import { deriveSalaStatus, STATUS_KEY, TOTAL_SLOTS } from './centros.types';
import type { TSalaViewMode, ISalaTableRow } from './centros.types';
import { SalaCard, AddSalaCard, SalaViewToggle } from './SalaCard';
import { StyledSalaGrid, StyledSalaStatusPill } from './SalaCard.styles';
import {
  StyledDetailPanel,
  StyledDetailCard,
  StyledDetailCardTop,
  StyledDetailCardLeft,
  StyledDetailImagePlaceholder,
  StyledDetailImageLogo,
  StyledDetailInfoBlock,
  StyledDetailEyebrow,
  StyledDetailH2,
  StyledDetailTitleAccent,
  StyledDetailInfoRow,
  StyledDetailInfoIcon,
  StyledDetailInfoText,
  StyledOpenNowPill,
  StyledDetailActionRow,
  StyledDetailKPIRow,
  StyledDetailKPICell,
  StyledDetailKPILabel,
  StyledDetailKPIValue,
  StyledSalasSection,
  StyledSalasSectionHeader,
  StyledSalasSectionLeft,
  StyledSalasSectionTitle,
  StyledSalasTitleAccent,
  StyledSalasSectionSubtitle,
  StyledStatusDot,
} from './DetailPanel.styles';

const canWrite = FeaturePermissionService.canManageCentros;
const canSeeRevenue = FeaturePermissionService.canSeeRevenue;

// Deterministic per-centro logo pick — stable across re-renders (never Math.random()).
const CENTRO_LOGOS = [suksaiLogoLight, suksaiLogoDark] as const;

interface IDetailPanelProps {
  readonly centro: ICentro;
  readonly roles: readonly TNombreRol[];
  readonly onAddSala: () => void;
  readonly onEditSala: (sala: ISala) => void;
  readonly onEditCentro: () => void;
  readonly salaViewMode: TSalaViewMode;
  readonly onSalaViewModeChange: (mode: TSalaViewMode) => void;
}

export const DetailPanel = ({
  centro,
  roles,
  onAddSala,
  onEditSala,
  onEditCentro,
  salaViewMode,
  onSalaViewModeChange,
}: IDetailPanelProps) => {
  const { t, i18n } = useTranslation(['dashboard']);
  const { success: toastSuccess, error: toastError } = useToast();
  const showRevenue = canSeeRevenue(roles);
  const canEdit = canWrite(roles);

  const { salas, salaOccupancy, detailKPIs, isLoading, isError } = useCentroDetail(centro.id);

  const updateSala = useUpdateSala(centro.id);
  const deletion = useSalaDeletion(centro.id);
  const [guardSalaName, setGuardSalaName] = useState('');
  const [confirmSalaName, setConfirmSalaName] = useState('');

  const handleToggleSala = (sala: ISala) => {
    updateSala.mutate(
      { id: sala.id, dto: { activa: !sala.activa } },
      {
        onSuccess: () => {
          toastSuccess(
            sala.activa
              ? t('dashboard:centros.sala.toast.disabled')
              : t('dashboard:centros.sala.toast.enabled'),
          );
        },
        onError: (err: unknown) => {
          toastError(err instanceof Error ? err.message : t('dashboard:centros.sala.toast.error'));
        },
      },
    );
  };

  const handleDeleteSala = (sala: ISala) => {
    setGuardSalaName(sala.nombre);
    setConfirmSalaName(sala.nombre);
    void deletion.requestDelete(sala.id);
  };

  const handleConfirmDeleteSala = async () => {
    const ok = await deletion.confirmDelete();
    if (ok) {
      toastSuccess(t('dashboard:salas.toast.deleted'));
    } else {
      toastError(t('dashboard:salas.toast.errorDelete'));
    }
  };

  const year = centro.createdAt.getFullYear();
  const centroLogoSrc = CENTRO_LOGOS[centro.id % CENTRO_LOGOS.length];

  const kpiCells = [
    {
      key: 'salas',
      label: t('dashboard:centros.detail.kpi.salas'),
      value: String(detailKPIs.salaCount),
    },
    {
      key: 'ocupacion',
      label: t('dashboard:centros.detail.kpi.ocupacion'),
      value: `${detailKPIs.ocupacionPct}%`,
    },
    {
      key: 'sesiones',
      label: t('dashboard:centros.detail.kpi.sesionesHoy'),
      value: String(detailKPIs.sesionesHoy),
    },
    ...(showRevenue
      ? [
          {
            key: 'ingreso',
            label: t('dashboard:centros.detail.kpi.ingresoHoy'),
            value: new Intl.NumberFormat(i18n.language, {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(detailKPIs.ingresoHoyEuros),
          },
        ]
      : []),
  ];
  const salaTableData: ISalaTableRow[] = salas.map((sala) => {
    const occupancy = salaOccupancy.get(sala.id);
    const status = deriveSalaStatus(sala, occupancy?.hasActiveCita ?? false);
    const slotsUsed = occupancy?.slotsUsed ?? 0;
    return {
      key: String(sala.id),
      nombre: sala.nombre,
      statusLabel: t(`dashboard:centros.sala.status.${STATUS_KEY[status]}`),
      capacidad: String(sala.capacidad),
      slotsHoy: `${slotsUsed} / ${TOTAL_SLOTS}`,
      _status: status,
    };
  });

  const salaColumns: ITableColumnDef<ISalaTableRow>[] = [
    {
      key: 'nombre',
      header: t('dashboard:centros.sala.list.colNombre'),
      minWidth: '180px',
      render: (_val, row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StyledStatusDot $status={row._status} />
          {row.nombre}
        </span>
      ),
    },
    {
      key: 'statusLabel',
      header: t('dashboard:centros.sala.list.colEstado'),
      minWidth: '120px',
      render: (_val, row) => (
        <StyledSalaStatusPill $status={row._status} $static={true}>
          • {row.statusLabel}
        </StyledSalaStatusPill>
      ),
    },
    {
      key: 'capacidad',
      header: t('dashboard:centros.sala.list.colCapacidad'),
      minWidth: '100px',
      align: 'right',
    },
    {
      key: 'slotsHoy',
      header: t('dashboard:centros.sala.list.colSlots'),
      minWidth: '120px',
      align: 'right',
    },
  ];
  const salaContent = (() => {
    if (isError)
      return (
        <Empty
          preset="error"
          size="sm"
          title={t('dashboard:centros.sala.errorTitle')}
          description={t('dashboard:centros.sala.errorDescription')}
        />
      );
    if (isLoading) return <span>{t('dashboard:centros.sala.loading')}</span>;
    if (salas.length === 0 && !canEdit)
      return (
        <Empty
          preset="no-data"
          size="sm"
          title={t('dashboard:centros.sala.emptyTitle')}
          description={t('dashboard:centros.sala.emptyDescription')}
        />
      );
    if (salaViewMode === 'list')
      return (
        <>
          <Table
            data={salaTableData}
            columns={salaColumns}
            rowKey="key"
            size="sm"
            loading={isLoading}
            emptyText={t('dashboard:centros.sala.list.emptyText')}
          />
          {canEdit && salas.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <AddSalaCard onClick={onAddSala} />
            </div>
          )}
          {canEdit && salas.length === 0 && <AddSalaCard onClick={onAddSala} />}
        </>
      );
    return (
      <StyledSalaGrid>
        {salas.map((sala, idx) => {
          const colorVariant = (idx % 5) as 0 | 1 | 2 | 3 | 4;
          const occupancy = salaOccupancy.get(sala.id);
          const status = deriveSalaStatus(sala, occupancy?.hasActiveCita ?? false);
          const slotsUsed = occupancy?.slotsUsed ?? 0;
          return (
            <SalaCard
              key={sala.id}
              sala={sala}
              status={status}
              slotsUsed={slotsUsed}
              colorVariant={colorVariant}
              index={idx}
              canManage={canEdit}
              onClick={
                canEdit
                  ? () => {
                      onEditSala(sala);
                    }
                  : undefined
              }
              onEditSala={onEditSala}
              onToggleSala={handleToggleSala}
              onDeleteSala={handleDeleteSala}
            />
          );
        })}
        {canEdit && <AddSalaCard onClick={onAddSala} />}
      </StyledSalaGrid>
    );
  })();

  return (
    <>
      <StyledDetailPanel>
        <StyledDetailCard>
          <StyledDetailCardTop>
            <StyledDetailCardLeft>
              <StyledDetailImagePlaceholder aria-hidden="true">
                <StyledDetailImageLogo src={centroLogoSrc} alt="" />
              </StyledDetailImagePlaceholder>

              <StyledDetailInfoBlock>
                <StyledDetailEyebrow>
                  {t('dashboard:centros.detail.eyebrow', { year })}
                </StyledDetailEyebrow>
                <StyledDetailH2>
                  {t('dashboard:centros.detail.namePrefix')}{' '}
                  <StyledDetailTitleAccent>
                    {centro.ciudad || centro.nombre}
                  </StyledDetailTitleAccent>
                </StyledDetailH2>

                <StyledDetailInfoRow>
                  <StyledDetailInfoIcon>
                    <IcoPin />
                  </StyledDetailInfoIcon>
                  <StyledDetailInfoText>
                    {centro.direccion || '—'}
                    {centro.ciudad && ` · ${centro.ciudad}`}
                  </StyledDetailInfoText>
                </StyledDetailInfoRow>

                <StyledDetailInfoRow>
                  <StyledDetailInfoIcon>
                    <IcoClock />
                  </StyledDetailInfoIcon>
                  <StyledDetailInfoText>
                    {t('dashboard:centros.detail.schedule')}
                  </StyledDetailInfoText>
                  {centro.activo && (
                    <StyledOpenNowPill>• {t('dashboard:centros.detail.openNow')}</StyledOpenNowPill>
                  )}
                </StyledDetailInfoRow>

                {(centro.telefono ?? null) !== null && (
                  <StyledDetailInfoRow>
                    <StyledDetailInfoIcon>
                      <IcoPhone />
                    </StyledDetailInfoIcon>
                    <StyledDetailInfoText>{centro.telefono}</StyledDetailInfoText>
                  </StyledDetailInfoRow>
                )}
              </StyledDetailInfoBlock>
            </StyledDetailCardLeft>

            {canEdit && (
              <StyledDetailActionRow>
                <Button
                  variant="solid"
                  color="primary"
                  size="sm"
                  type="button"
                  onClick={onEditCentro}
                  iconStart={<IcoPencilEdit />}
                  aria-label={t('dashboard:centros.detail.editButtonAriaLabel', {
                    nombre: centro.nombre,
                  })}
                >
                  {t('dashboard:centros.actions.editar')}
                </Button>
              </StyledDetailActionRow>
            )}
          </StyledDetailCardTop>

          <StyledDetailKPIRow $cellCount={kpiCells.length}>
            {kpiCells.map((cell) => (
              <StyledDetailKPICell key={cell.key}>
                <StyledDetailKPILabel>{cell.label}</StyledDetailKPILabel>
                <StyledDetailKPIValue>{isLoading ? '–' : cell.value}</StyledDetailKPIValue>
              </StyledDetailKPICell>
            ))}
          </StyledDetailKPIRow>
        </StyledDetailCard>

        <StyledSalasSection>
          <StyledSalasSectionHeader>
            <StyledSalasSectionLeft>
              <StyledSalasSectionTitle>
                {t('dashboard:centros.sala.sectionTitlePrefix')}{' '}
                <StyledSalasTitleAccent>
                  {t('dashboard:centros.sala.sectionTitleAccent')}
                </StyledSalasTitleAccent>
              </StyledSalasSectionTitle>
              <StyledSalasSectionSubtitle>
                {t('dashboard:centros.sala.sectionSubtitle')}
              </StyledSalasSectionSubtitle>
            </StyledSalasSectionLeft>
            <SalaViewToggle value={salaViewMode} onChange={onSalaViewModeChange} />
          </StyledSalasSectionHeader>
          {salaContent}
        </StyledSalasSection>
      </StyledDetailPanel>

      <DeleteGuardDialog
        open={deletion.guardOpen}
        onClose={deletion.closeGuard}
        entityName={guardSalaName}
        activeCitasCount={deletion.guardCount}
        message={t('dashboard:salas.guard.description', { count: deletion.guardCount })}
      />

      <Dialog
        open={deletion.confirmOpen}
        onClose={deletion.cancelConfirm}
        type="error"
        showCancel
        title={t('dashboard:centros.sala.deleteDialog.title')}
        message={t('dashboard:centros.sala.deleteDialog.message', { nombre: confirmSalaName })}
        confirmText={t('dashboard:centros.sala.deleteDialog.confirm')}
        cancelText={t('dashboard:centros.sala.deleteDialog.cancel')}
        loading={deletion.isDeleting}
        onConfirm={() => {
          void handleConfirmDeleteSala();
        }}
      />
    </>
  );
};
