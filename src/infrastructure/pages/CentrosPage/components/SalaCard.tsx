import { useTranslation } from 'react-i18next';
import { Tag } from '@infra/components/ui/common/Tag';
import { DropdownMenu } from '@infra/components/ui/common/DropdownMenu';
import type { DropdownEntry } from '@infra/components/ui/common/Dropdown/Dropdown.types';
import type { ISala } from '@domain/models';
import {
  IcoPencilEdit,
  IcoPower,
  IcoTrash,
  IcoDotsThree,
  IcoPlusCircle,
  IcoGrid,
  IcoList,
} from './centros.icons';
import { STATUS_KEY, TOTAL_SLOTS, BOTANIC_ORNAMENTS } from './centros.types';
import type { TSalaStatus, TColorVariant, TSalaViewMode } from './centros.types';
import {
  StyledSalaCard,
  StyledSalaHeroArea,
  StyledSalaStatusPill,
  StyledSalaMenuAnchor,
  StyledSalaMoreBtn,
  StyledSalaCardBody,
  StyledSalaCode,
  StyledSalaCardNameRow,
  StyledSalaName,
  StyledSalaNameAccent,
  StyledSalaEquipmentTags,
  StyledSalaSlotSummary,
  StyledSalaSlotLabel,
  StyledSalaSlotCount,
  StyledSlotBar,
  StyledSlotSegment,
  StyledAddSalaCard,
} from './SalaCard.styles';

// ── SalaViewToggle ────────────────────────────────────────────────────────────
// Kept here because it uses the same styled sheet (SalaCard.styles.ts).
// It's re-exported for DetailPanel consumption.

import { StyledViewToggle, StyledViewToggleButton } from './SalaViewToggle.styles';

interface ISalaViewToggleProps {
  readonly value: TSalaViewMode;
  readonly onChange: (mode: TSalaViewMode) => void;
}

export const SalaViewToggle = ({ value, onChange }: ISalaViewToggleProps) => {
  const { t } = useTranslation(['dashboard']);

  return (
    <StyledViewToggle role="group" aria-label={t('dashboard:centros.sala.viewToggle.ariaLabel')}>
      <StyledViewToggleButton
        type="button"
        $active={value === 'grid'}
        $disabled={false}
        onClick={() => {
          onChange('grid');
        }}
        aria-pressed={value === 'grid'}
      >
        <IcoGrid />
        {t('dashboard:centros.sala.viewToggle.grid')}
      </StyledViewToggleButton>
      <StyledViewToggleButton
        type="button"
        $active={value === 'list'}
        $disabled={false}
        onClick={() => {
          onChange('list');
        }}
        aria-pressed={value === 'list'}
      >
        <IcoList />
        {t('dashboard:centros.sala.viewToggle.list')}
      </StyledViewToggleButton>
    </StyledViewToggle>
  );
};

// ── SalaCard ──────────────────────────────────────────────────────────────────

interface ISalaCardProps {
  readonly sala: ISala;
  readonly status: TSalaStatus;
  readonly slotsUsed: number;
  readonly colorVariant: TColorVariant;
  readonly index: number;
  readonly canManage: boolean;
  readonly onClick?: () => void;
  readonly onEditSala: (sala: ISala) => void;
  readonly onToggleSala: (sala: ISala) => void;
  readonly onDeleteSala: (sala: ISala) => void;
}

export const SalaCard = ({
  sala,
  status,
  slotsUsed,
  colorVariant,
  index,
  canManage,
  onClick,
  onEditSala,
  onToggleSala,
  onDeleteSala,
}: ISalaCardProps) => {
  const { t } = useTranslation(['dashboard']);
  const statusKey = STATUS_KEY[status];

  const menuEntries: DropdownEntry[] = [
    {
      type: 'item',
      id: 'editar',
      label: t('dashboard:centros.sala.menu.editar'),
      icon: <IcoPencilEdit />,
      onClick: () => {
        onEditSala(sala);
      },
    },
    { type: 'separator', id: 'sep-1' },
    {
      type: 'item',
      id: 'toggle',
      label: sala.activa
        ? t('dashboard:centros.sala.menu.deshabilitar')
        : t('dashboard:centros.sala.menu.habilitar'),
      icon: <IcoPower />,
      onClick: () => {
        onToggleSala(sala);
      },
    },
    { type: 'separator', id: 'sep-2' },
    {
      type: 'item',
      id: 'eliminar',
      label: t('dashboard:centros.sala.menu.eliminar'),
      icon: <IcoTrash />,
      danger: true,
      onClick: () => {
        onDeleteSala(sala);
      },
    },
  ];

  const BotanicOrnament = BOTANIC_ORNAMENTS[colorVariant % BOTANIC_ORNAMENTS.length];
  const codeNum = String(index + 1).padStart(2, '0');
  const code = `${sala.nombre.substring(0, 2).toUpperCase()} · ${codeNum}`;

  // Split name: first word normal, rest italic
  const nameParts = sala.nombre.split(' ');
  const nameFirst = nameParts[0] ?? sala.nombre;
  const nameRest = nameParts.length > 1 ? ' ' + nameParts.slice(1).join(' ') : '';

  return (
    <StyledSalaCard
      $status={status}
      aria-label={sala.nombre}
      onClick={onClick}
      role={onClick !== undefined ? 'button' : undefined}
      tabIndex={onClick !== undefined ? 0 : undefined}
      onKeyDown={
        onClick !== undefined
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <StyledSalaHeroArea $colorVariant={colorVariant}>
        <span style={{ opacity: 0.4 }} aria-hidden="true">
          <BotanicOrnament />
        </span>
        <StyledSalaStatusPill $status={status} aria-hidden="true">
          • {t(`dashboard:centros.sala.status.${statusKey}`)}
        </StyledSalaStatusPill>
        {canManage && (
          <StyledSalaMenuAnchor
            onClick={(e) => {
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
          >
            <DropdownMenu
              align="right"
              entries={menuEntries}
              trigger={
                <StyledSalaMoreBtn
                  type="button"
                  aria-label={t('dashboard:centros.sala.menu.ariaLabel', { nombre: sala.nombre })}
                >
                  <IcoDotsThree />
                </StyledSalaMoreBtn>
              }
            />
          </StyledSalaMenuAnchor>
        )}
      </StyledSalaHeroArea>

      <StyledSalaCardBody>
        <StyledSalaCode>{code}</StyledSalaCode>
        <StyledSalaCardNameRow>
          <StyledSalaName>
            {nameFirst}
            {nameRest.length > 0 && <StyledSalaNameAccent>{nameRest}</StyledSalaNameAccent>}
          </StyledSalaName>
        </StyledSalaCardNameRow>

        {sala.descripcion !== null && sala.descripcion.trim().length > 0 && (
          <StyledSalaEquipmentTags>
            {sala.descripcion
              .split(',')
              .slice(0, 3)
              .map((tag) => (
                <Tag key={tag.trim()} color="secondary">
                  {tag.trim()}
                </Tag>
              ))}
          </StyledSalaEquipmentTags>
        )}

        <StyledSalaSlotSummary>
          <StyledSalaSlotLabel>{t('dashboard:centros.sala.todayLabel')}</StyledSalaSlotLabel>
          <StyledSalaSlotCount>
            {t('dashboard:centros.sala.slotFraction', { used: slotsUsed, total: TOTAL_SLOTS })}
          </StyledSalaSlotCount>
        </StyledSalaSlotSummary>
        <StyledSlotBar
          aria-label={t('dashboard:centros.sala.slotBarAriaLabel', {
            used: slotsUsed,
            total: TOTAL_SLOTS,
          })}
        >
          {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
            <StyledSlotSegment
              key={i}
              $status={i < slotsUsed ? 'used' : 'free'}
              aria-hidden="true"
            />
          ))}
        </StyledSlotBar>
      </StyledSalaCardBody>
    </StyledSalaCard>
  );
};

// ── AddSalaCard ───────────────────────────────────────────────────────────────

interface IAddSalaCardProps {
  readonly onClick: () => void;
}

export const AddSalaCard = ({ onClick }: IAddSalaCardProps) => {
  const { t } = useTranslation(['dashboard']);

  return (
    <StyledAddSalaCard
      onClick={onClick}
      aria-label={t('dashboard:centros.sala.addAriaLabel')}
      type="button"
    >
      <IcoPlusCircle />
      <span>{t('dashboard:centros.sala.addLabel')}</span>
    </StyledAddSalaCard>
  );
};
