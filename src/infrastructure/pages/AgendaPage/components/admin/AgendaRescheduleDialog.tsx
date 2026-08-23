/**
 * AgendaRescheduleDialog — confirm-before-persist gate for drag & drop reschedule
 * (Surface A; Analyst §1, Designer §4.4).
 *
 * Thin wrapper over the `Dialog` confirm primitive, mirroring AgendaCancelDialog:
 *  - `type="confirm"`, composed `message` ReactNode (summary + FROM/TO + optional
 *    advisory overlap hint + a `role="alert"` domain-error block).
 *  - `loading` driven by the reschedule mutation's `isPending`.
 *  - On a domain failure after Confirm the Dialog stays OPEN and renders the
 *    (already-localized) `error.message` (Analyst OQ-A10 / E-A4).
 *
 * A reschedule is NOT a delete, so `Dialog` (not DeleteGuardDialog) is correct —
 * the same rationale as AgendaCancelDialog.
 *
 * All display strings are passed pre-formatted by the parent so the summary is a
 * self-contained snapshot (Analyst §3 / E-A8): a background refetch that mutates
 * `weekDays` cannot corrupt the rendered "from → to".
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@infra/components/ui/common/Dialog';
import {
  StyledRescheduleBody,
  StyledRescheduleSummary,
  StyledRescheduleMove,
  StyledRescheduleRow,
  StyledRescheduleLabel,
  StyledRescheduleFromValue,
  StyledRescheduleToValue,
  StyledRescheduleHint,
  StyledRescheduleError,
  StyledRescheduleReassign,
  StyledRescheduleReassignValue,
  StyledRescheduleReassignBadge,
} from './AgendaRescheduleDialog.styles';

export interface IAgendaRescheduleDialogProps {
  readonly open: boolean;
  /** Client display name (may be '—'). */
  readonly clientName: string;
  /** Service display name. */
  readonly serviceName: string;
  /** Origin day label (e.g. "Lun 12") — captured at drop time. */
  readonly fromDate: string;
  readonly fromTime: string;
  /** Destination day label + snapped start time. */
  readonly toDate: string;
  readonly toTime: string;
  /**
   * Origin therapist display name. Day view only — when both `fromTherapist` and
   * `toTherapist` are present AND differ, a reassignment row is shown above the
   * From/To time rows. Absent (week view) → the summary renders unchanged.
   */
  readonly fromTherapist?: string;
  /** Destination therapist display name (see `fromTherapist`). */
  readonly toTherapist?: string;
  /** Advisory only: a client-detected visual overlap in the target column. */
  readonly showOverlapHint: boolean;
  readonly submitting: boolean;
  /** Localized domain-error message shown in `role="alert"`; undefined = none. */
  readonly errorMessage?: string;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
}

export const AgendaRescheduleDialog = ({
  open,
  clientName,
  serviceName,
  fromDate,
  fromTime,
  toDate,
  toTime,
  fromTherapist,
  toTherapist,
  showOverlapHint,
  submitting,
  errorMessage,
  onConfirm,
  onClose,
}: IAgendaRescheduleDialogProps): React.ReactElement => {
  const { t } = useTranslation('agenda');

  // Show the reassignment fact only when the drag actually crossed therapist
  // columns. Both names must be present and different (week view passes neither).
  const isReassignment =
    fromTherapist !== undefined && toTherapist !== undefined && fromTherapist !== toTherapist;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      type="confirm"
      autoButtonColor
      title={t('reschedule.title')}
      loading={submitting}
      confirmText={t('reschedule.confirm')}
      cancelText={t('reschedule.cancel')}
      onConfirm={onConfirm}
      onCancel={onClose}
      message={
        <StyledRescheduleBody>
          <StyledRescheduleSummary>
            {t('reschedule.summary', { cliente: clientName, servicio: serviceName })}
          </StyledRescheduleSummary>

          {isReassignment && (
            <StyledRescheduleReassign>
              <StyledRescheduleLabel>{t('reschedule.therapistLabel')}</StyledRescheduleLabel>
              <StyledRescheduleReassignValue>
                {fromTherapist} → {toTherapist}
              </StyledRescheduleReassignValue>
              <StyledRescheduleReassignBadge>
                {t('reschedule.reassignBadge')}
              </StyledRescheduleReassignBadge>
            </StyledRescheduleReassign>
          )}

          <StyledRescheduleMove>
            <StyledRescheduleRow>
              <StyledRescheduleLabel>{t('reschedule.fromLabel')}</StyledRescheduleLabel>
              <StyledRescheduleFromValue>
                {t('reschedule.fromValue', { fecha: fromDate, hora: fromTime })}
              </StyledRescheduleFromValue>
            </StyledRescheduleRow>
            <StyledRescheduleRow>
              <StyledRescheduleLabel>{t('reschedule.toLabel')}</StyledRescheduleLabel>
              <StyledRescheduleToValue>
                {t('reschedule.toValue', { fecha: toDate, hora: toTime })}
              </StyledRescheduleToValue>
            </StyledRescheduleRow>
          </StyledRescheduleMove>

          {showOverlapHint && (
            <StyledRescheduleHint>{t('reschedule.overlapHint')}</StyledRescheduleHint>
          )}

          {errorMessage !== undefined && (
            <StyledRescheduleError role="alert">{errorMessage}</StyledRescheduleError>
          )}
        </StyledRescheduleBody>
      }
    />
  );
};
