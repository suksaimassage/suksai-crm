import { useTranslation } from 'react-i18next';
import { Button } from '@infra/components/ui/common/Button';
import type { ICentro } from '@domain/models';
import type { TCentroId } from '@domain/types';
import { IcoBuildingSmall, IcoPeople, IcoWarning, IcoPlusCircle } from './centros.icons';
import type { ICentroStatsEntry } from './centros.types';
import {
  StyledCenterListCard,
  StyledSidebarHeader,
  StyledSidebarTitle,
  StyledSidebarTitleAccent,
  StyledSidebarCount,
  StyledCenterListItem,
  StyledCenterAvatarSquare,
  StyledCenterItemBody,
  StyledCenterItemName,
  StyledCenterItemNameAccent,
  StyledCenterItemMeta,
  StyledCenterItemStats,
  StyledCenterItemStatText,
  StyledCenterItemStatIcon,
  StyledCenterItemRight,
  StyledCenterOccupancy,
  StyledCenterTodayLabel,
  StyledSidebarFooter,
  StyledInactiveBadge,
  StyledEmptyList,
} from './CenterList.styles';

interface ICenterListProps {
  readonly centros: readonly ICentro[];
  readonly selectedId: TCentroId | null;
  readonly onSelect: (id: TCentroId) => void;
  readonly centroStats: ReadonlyMap<TCentroId, ICentroStatsEntry>;
  readonly onAddCentro: (() => void) | null;
}

export const CenterList = ({
  centros,
  selectedId,
  onSelect,
  centroStats,
  onAddCentro,
}: ICenterListProps) => {
  const { t } = useTranslation(['dashboard']);

  if (centros.length === 0) {
    return (
      <StyledCenterListCard>
        <StyledSidebarHeader>
          <StyledSidebarTitle>
            {t('dashboard:centros.list.headerTitle')}{' '}
            <StyledSidebarTitleAccent>
              {t('dashboard:centros.list.headerTitleAccent')}
            </StyledSidebarTitleAccent>
          </StyledSidebarTitle>
          <StyledSidebarCount>
            {t('dashboard:centros.list.centrosCount', { count: 0 })}
          </StyledSidebarCount>
        </StyledSidebarHeader>
        <StyledEmptyList>
          <span>{t('dashboard:centros.list.empty')}</span>
        </StyledEmptyList>
      </StyledCenterListCard>
    );
  }

  return (
    <StyledCenterListCard>
      <StyledSidebarHeader>
        <StyledSidebarTitle>
          {t('dashboard:centros.list.headerTitle')}{' '}
          <StyledSidebarTitleAccent>
            {t('dashboard:centros.list.headerTitleAccent')}
          </StyledSidebarTitleAccent>
        </StyledSidebarTitle>
        <StyledSidebarCount>
          {t('dashboard:centros.list.centrosCount', { count: centros.length })}
        </StyledSidebarCount>
      </StyledSidebarHeader>

      <div role="list" aria-label={t('dashboard:centros.list.ariaLabel')}>
        {centros.map((centro, idx) => {
          const stats = centroStats.get(centro.id);
          const isSelected = centro.id === selectedId;
          const isInactive = !centro.activo;
          const initial = centro.nombre.charAt(0).toUpperCase();
          const colorIndex = idx % 5;

          return (
            <StyledCenterListItem
              key={centro.id}
              $selected={isSelected}
              $inactive={isInactive}
              aria-pressed={isSelected}
              aria-label={
                isInactive
                  ? t('dashboard:centros.list.inactiveAriaLabel', { nombre: centro.nombre })
                  : centro.nombre
              }
              onClick={() => {
                onSelect(centro.id);
              }}
            >
              <StyledCenterAvatarSquare $colorIndex={colorIndex} aria-hidden="true">
                {initial}
              </StyledCenterAvatarSquare>

              <StyledCenterItemBody>
                <StyledCenterItemName>
                  {t('dashboard:centros.detail.namePrefix')}{' '}
                  <StyledCenterItemNameAccent>
                    {centro.nombre || centro.ciudad}
                  </StyledCenterItemNameAccent>
                </StyledCenterItemName>
                <StyledCenterItemMeta>
                  {centro.ciudad && centro.direccion
                    ? `${centro.ciudad} · ${centro.direccion}`
                    : centro.direccion || centro.ciudad || '—'}
                </StyledCenterItemMeta>
                {stats !== undefined && (
                  <StyledCenterItemStats>
                    <StyledCenterItemStatIcon>
                      <IcoBuildingSmall />
                    </StyledCenterItemStatIcon>
                    <StyledCenterItemStatText>
                      {t('dashboard:centros.list.statsSalas', { count: stats.salaCount })}
                    </StyledCenterItemStatText>
                    <StyledCenterItemStatIcon>
                      <IcoPeople />
                    </StyledCenterItemStatIcon>
                    <StyledCenterItemStatText>
                      {t('dashboard:centros.list.statsStaff', { count: stats.staffCount })}
                    </StyledCenterItemStatText>
                  </StyledCenterItemStats>
                )}
              </StyledCenterItemBody>

              <StyledCenterItemRight>
                {stats !== undefined && (
                  <>
                    <StyledCenterOccupancy $hasIncident={isInactive}>
                      {stats.ocupacionPct}%
                    </StyledCenterOccupancy>
                    <StyledCenterTodayLabel>
                      {t('dashboard:centros.list.occupancyToday')}
                    </StyledCenterTodayLabel>
                  </>
                )}
                {isInactive && (
                  <StyledInactiveBadge aria-hidden="true">
                    {t('dashboard:centros.list.inactiveBadge')}
                  </StyledInactiveBadge>
                )}
                {!isInactive && stats !== undefined && stats.ocupacionPct < 30 && (
                  <span aria-label={t('dashboard:centros.list.incidentWarningAriaLabel')}>
                    <IcoWarning />
                  </span>
                )}
              </StyledCenterItemRight>
            </StyledCenterListItem>
          );
        })}
      </div>

      {onAddCentro !== null && (
        <StyledSidebarFooter>
          <Button
            variant="ghost"
            color="primary"
            fullWidth
            onClick={onAddCentro}
            iconStart={<IcoPlusCircle />}
          >
            {t('dashboard:centros.list.addCentro')}
          </Button>
        </StyledSidebarFooter>
      )}
    </StyledCenterListCard>
  );
};
