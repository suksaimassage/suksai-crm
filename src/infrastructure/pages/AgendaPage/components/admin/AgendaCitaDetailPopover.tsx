/**
 * AgendaCitaDetailPopover — anchored read-then-act surface (Designer §1.5, §1.6, §3.2).
 *
 * Wraps the activated event element as the Popover trigger (controlled `open`),
 * so the panel scales from the clicked block (spatial continuity) and Popover's
 * focus-return restores focus to the event on close (§5). Loads the authoritative
 * cita via `useCitaById` for estado + loading/not-found/error; the lightweight
 * `IAgendaAppointment` supplies display strings immediately (no blank flash).
 *
 * Lifecycle actions (Confirmar / estado menu / Editar / Cancelar) are the single
 * source of truth for the cita and are gated:
 *  - permission (canManageCitas) → HIDDEN entirely;
 *  - state legality → specific buttons OMITTED, the generic estado menu DISABLED.
 *
 * The actual mutations + edit modal + cancel dialog live in the parent view; this
 * component only signals intent via callbacks.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverHeader, PopoverBody } from '@infra/components/ui/common/Popover';
import { Button } from '@infra/components/ui/common/Button';
import { Tag } from '@infra/components/ui/common/Tag';
import { Chip } from '@infra/components/ui/common/Chip';
import { Empty } from '@infra/components/ui/common/Empty';
import { useCitaById } from '@infra/hooks/useCitaById';
import type { IAgendaAppointment } from '@domain/models/agenda.models';
import type { TCitaId, TEstadoCita } from '@domain/types';
import { ESTADO_GLYPH, ESTADO_TAG_COLOR } from '../shared/agendaEstado';
import {
  StyledDetailBody,
  StyledDetailClient,
  StyledCoupleTag,
  StyledDetailMetaList,
  StyledDetailMetaRow,
  StyledDetailMetaIcon,
  StyledDetailMetaTime,
  StyledDetailNotes,
  StyledDetailActions,
  StyledDetailActionsRow,
  StyledDetailSkeleton,
  StyledSkeletonLine,
} from './AgendaCitaDetailPopover.styles';

interface IAgendaCitaDetailPopoverProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly appointment: IAgendaAppointment;
  /** Centre display name for the meta list (optional). */
  readonly centroName?: string;
  /** True if the current user may mutate citas (superadmin/recepcionista). */
  readonly canManage: boolean;
  /** A mutation is in flight for this cita → disable actions, show busy. */
  readonly actionPending: boolean;
  readonly onConfirm: (id: TCitaId) => void;
  /**
   * Retained on the contract (parents still pass it) but no longer consumed
   * here — the inline estado Select was replaced by a read-only differential
   * Tag; estado transitions now go through the Edit modal.
   */
  readonly onChangeEstado: (id: TCitaId, estado: TEstadoCita) => void;
  readonly onEdit: (id: TCitaId) => void;
  readonly onCancel: (id: TCitaId) => void;
  /** The activated event element this popover anchors to. */
  readonly children: React.ReactElement;
}

export const AgendaCitaDetailPopover = ({
  open,
  onOpenChange,
  appointment,
  centroName,
  canManage,
  actionPending,
  onConfirm,
  onEdit,
  onCancel,
  children,
}: IAgendaCitaDetailPopoverProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  // Authoritative estado/loading — only fetched while open.
  const { cita, isLoading, isError } = useCitaById(open ? appointment.id : null);

  // Estado: prefer the freshly-loaded value, fall back to the list snapshot.
  const estado: TEstadoCita = cita?.estado ?? appointment.estado;
  const isCouple = appointment.tags.includes('pareja');

  // Centro label: prefer the per-cita centro carried by the appointment model;
  // fall back to the view-level `centroName` prop for callers that still pass it.
  const centroLabel = appointment.centroName !== '' ? appointment.centroName : centroName;

  const close = () => {
    onOpenChange(false);
  };

  const renderContent = (): React.ReactNode => {
    if (isLoading && !cita) {
      return (
        <StyledDetailSkeleton aria-busy="true" aria-live="polite">
          <StyledSkeletonLine $w="40%" />
          <StyledSkeletonLine $w="80%" />
          <StyledSkeletonLine $w="65%" />
          <StyledSkeletonLine $w="55%" />
        </StyledDetailSkeleton>
      );
    }

    if (isError) {
      return (
        <Empty
          preset="error"
          size="sm"
          title={t('detail.errorTitle')}
          description={t('detail.errorDescription')}
        >
          <Button variant="ghost" color="neutral" type="button" onClick={close}>
            {t('detail.retry')}
          </Button>
        </Empty>
      );
    }

    if (!isLoading && cita === null) {
      return (
        <Empty
          preset="no-results"
          size="sm"
          title={t('detail.notFoundTitle')}
          description={t('detail.notFoundDescription')}
        >
          <Button variant="ghost" color="neutral" type="button" onClick={close}>
            {t('detail.close')}
          </Button>
        </Empty>
      );
    }

    const showConfirm = canManage && estado === 'pendiente';

    return (
      <StyledDetailBody>
        <Tag
          color={ESTADO_TAG_COLOR[estado]}
          size="sm"
          icon={ESTADO_GLYPH[estado]}
          style={{ alignSelf: 'flex-start' }}
        >
          {t(`estado.${estado}`)}
        </Tag>

        <StyledDetailClient>
          {appointment.clientName}
          {isCouple && <StyledCoupleTag>{t('detail.couple')}</StyledCoupleTag>}
        </StyledDetailClient>

        <StyledDetailMetaList>
          <StyledDetailMetaRow>
            <StyledDetailMetaIcon aria-hidden="true">🕐</StyledDetailMetaIcon>
            <StyledDetailMetaTime>
              {t('detail.meta.time', {
                start: appointment.startTime,
                end: appointment.endTime,
                duration: appointment.durationMin,
              })}
            </StyledDetailMetaTime>
          </StyledDetailMetaRow>
          <StyledDetailMetaRow>
            <StyledDetailMetaIcon aria-hidden="true">💆</StyledDetailMetaIcon>
            {t('detail.meta.service', { service: appointment.serviceName, room: appointment.sala })}
          </StyledDetailMetaRow>
          {centroLabel !== undefined && centroLabel !== '' && (
            <StyledDetailMetaRow>
              <StyledDetailMetaIcon aria-hidden="true">📍</StyledDetailMetaIcon>
              {t('detail.meta.center', { center: centroLabel })}
            </StyledDetailMetaRow>
          )}
        </StyledDetailMetaList>

        {appointment.notes !== null && appointment.notes !== '' && (
          <StyledDetailNotes>{appointment.notes}</StyledDetailNotes>
        )}

        {canManage && (
          <StyledDetailActions aria-busy={actionPending}>
            {showConfirm && (
              <StyledDetailActionsRow>
                <Chip
                  color="success"
                  selected
                  type="button"
                  icon={ESTADO_GLYPH.confirmada}
                  disabled={actionPending}
                  onClick={() => {
                    onConfirm(appointment.id);
                  }}
                >
                  {t('detail.confirm')}
                </Chip>
              </StyledDetailActionsRow>
            )}
            <StyledDetailActionsRow>
              <Button
                variant="ghost"
                color="neutral"
                type="button"
                disabled={actionPending}
                onClick={() => {
                  onEdit(appointment.id);
                }}
              >
                {t('detail.edit')}
              </Button>
              <Button
                variant="ghost"
                color="error"
                type="button"
                disabled={actionPending}
                onClick={() => {
                  onCancel(appointment.id);
                }}
              >
                {t('detail.cancel')}
              </Button>
            </StyledDetailActionsRow>
          </StyledDetailActions>
        )}
      </StyledDetailBody>
    );
  };

  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      trigger="manual"
      role="dialog"
      ariaLabel={t('detail.title')}
      placement="right-start"
      closeOnEscape
      closeOnClickOutside
      arrow={false}
      width={320}
      maxWidth="calc(100vw - 32px)"
      content={
        // Portal-rendered content lives outside the grid track's real DOM
        // subtree — this marker lets the Day/Week double-click-to-create
        // guard (`closest('[data-agenda-occupied]')`) recognize a click
        // anywhere inside this popover as landing on an existing cita.
        <div data-agenda-occupied="true">
          <PopoverHeader title={t('detail.title')} showCloseButton onClose={close} />
          <PopoverBody padding="md">{renderContent()}</PopoverBody>
        </div>
      }
    >
      {children}
    </Popover>
  );
};
