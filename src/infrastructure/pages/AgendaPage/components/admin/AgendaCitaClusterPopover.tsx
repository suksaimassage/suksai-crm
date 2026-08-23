/**
 * AgendaCitaClusterPopover — anchored list of edit-only rows for a week-view
 * "folder" (Designer §1.3, §5). Sibling of AgendaCitaDetailPopover; composes the
 * same `common/Popover` family (controlled `open`, `trigger="manual"`,
 * `closeOnEscape`/`ClickOutside`, focus-return-to-trigger).
 *
 * RESOLVED OQ-2 — rows are EDIT-ONLY: each row is ONE full-width `<button>` that
 * opens the edit modal directly via `onEdit(id)`. No Confirmar/estado-Select/
 * Cancelar inside rows (that rich surface stays in AgendaCitaDetailPopover for
 * single citas). Rows render from the in-memory `IAgendaAppointment` snapshots
 * already grouped by the parent — NO per-row fetch (OQ-3), so state = ready only.
 *
 * Reuses the shared estado language (`ESTADO_GLYPH` / `estadoDotColor` /
 * `isStruckEstado`) and the therapist `colorMap` (a–f) for the per-row dot.
 *
 * Focus on open → the first row button (Analyst §5; Popover handles focus-return
 * on close). The handoff to the edit modal is the parent's concern.
 */

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverHeader, PopoverBody } from '@infra/components/ui/common/Popover';
import type { IAgendaAppointment, TTherapistColorMap } from '@domain/models/agenda.models';
import type { TAgendaTherapistColor, TCitaId } from '@domain/types';
import { ESTADO_GLYPH, isStruckEstado } from '../shared/agendaEstado';
import {
  StyledClusterList,
  StyledClusterRow,
  StyledClusterRowColorDot,
  StyledClusterRowMain,
  StyledClusterRowTop,
  StyledClusterRowEstado,
  StyledClusterRowEstadoGlyph,
  StyledClusterRowTime,
  StyledClusterRowClient,
  StyledClusterRowMeta,
  StyledClusterRowChevron,
} from './AgendaCitaClusterPopover.styles';

const DEFAULT_COLOR: TAgendaTherapistColor = 'a';

interface IAgendaCitaClusterPopoverProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** The clustered citas, already chronologically ordered by the grouping pass. */
  readonly appointments: readonly IAgendaAppointment[];
  /** therapistId → color slot (a–f) for the per-row leading dot. */
  readonly colorMap: TTherapistColorMap;
  /** Cita being optimistically mutated → its row is dimmed. */
  readonly optimisticId: TCitaId | null;
  /** Earliest start of the union span (for the list aria-label range). */
  readonly rangeStart: string;
  /** Latest end of the union span (for the list aria-label range). */
  readonly rangeEnd: string;
  /** Opens the edit modal for the given cita (RESOLVED OQ-2). */
  readonly onEdit: (id: TCitaId) => void;
  /** The folder control this popover anchors to. */
  readonly children: React.ReactElement;
}

export const AgendaCitaClusterPopover = ({
  open,
  onOpenChange,
  appointments,
  colorMap,
  optimisticId,
  rangeStart,
  rangeEnd,
  onEdit,
  children,
}: IAgendaCitaClusterPopoverProps): React.ReactElement => {
  const { t } = useTranslation('agenda');
  const listRef = useRef<HTMLDivElement>(null);

  const count = appointments.length;
  const close = (): void => {
    onOpenChange(false);
  };

  // Focus the first row on open (Analyst §5). rAF + preventScroll avoids the
  // focus→scroll→forced-reflow chain documented in the overlay-perf bugfix.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const first = listRef.current?.querySelector<HTMLButtonElement>('button');
      first?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [open]);

  const listLabel = t('week.cluster.triggerLabel', {
    count,
    start: rangeStart,
    end: rangeEnd,
  });

  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      trigger="manual"
      role="dialog"
      ariaLabel={t('week.cluster.title')}
      placement="right-start"
      closeOnEscape
      closeOnClickOutside
      arrow={false}
      width={320}
      maxWidth="calc(100vw - 32px)"
      content={
        // Portal-rendered content lives outside the grid track's real DOM
        // subtree — this marker lets the Week double-click-to-create guard
        // (`closest('[data-agenda-occupied]')`) recognize a click anywhere
        // inside this popover as landing on an existing cita.
        <div data-agenda-occupied="true">
          <PopoverHeader title={t('week.cluster.title')} showCloseButton onClose={close} />
          <PopoverBody padding="none">
            <StyledClusterList ref={listRef} role="list" aria-label={listLabel}>
              {appointments.map((appt) => {
                const color: TAgendaTherapistColor =
                  (appt.therapistId !== null
                    ? (colorMap as Record<number, TAgendaTherapistColor>)[appt.therapistId]
                    : undefined) ?? DEFAULT_COLOR;
                const isOptimistic = optimisticId === appt.id;
                const struck = isStruckEstado(appt.estado);
                const clientLabel = appt.clientName ?? t('rail.sinCliente');
                const rowLabel = t('week.cluster.rowLabel', {
                  client: clientLabel,
                  start: appt.startTime,
                  end: appt.endTime,
                  service: appt.serviceName,
                  estado: t(`estado.${appt.estado}`),
                });
                const meta =
                  appt.sala !== null && appt.sala !== ''
                    ? `${appt.serviceName} · ${appt.sala}`
                    : appt.serviceName;

                return (
                  <div role="listitem" key={appt.id}>
                    <StyledClusterRow
                      type="button"
                      $optimistic={isOptimistic}
                      aria-label={rowLabel}
                      onClick={() => {
                        onEdit(appt.id);
                      }}
                    >
                      <StyledClusterRowColorDot $color={color} aria-hidden="true" />
                      <StyledClusterRowMain>
                        <StyledClusterRowTop>
                          <StyledClusterRowEstado $estado={appt.estado}>
                            <StyledClusterRowEstadoGlyph aria-hidden="true">
                              {ESTADO_GLYPH[appt.estado]}
                            </StyledClusterRowEstadoGlyph>
                            {t(`estado.${appt.estado}`)}
                          </StyledClusterRowEstado>
                          <StyledClusterRowTime>
                            {appt.startTime}–{appt.endTime}
                          </StyledClusterRowTime>
                        </StyledClusterRowTop>
                        <StyledClusterRowClient $struck={struck}>
                          {clientLabel}
                        </StyledClusterRowClient>
                        <StyledClusterRowMeta>{meta}</StyledClusterRowMeta>
                      </StyledClusterRowMain>
                      <StyledClusterRowChevron $optimistic={isOptimistic} aria-hidden="true">
                        ›
                      </StyledClusterRowChevron>
                    </StyledClusterRow>
                  </div>
                );
              })}
            </StyledClusterList>
          </PopoverBody>
        </div>
      }
    >
      {children}
    </Popover>
  );
};
