/**
 * AgendaCancelDialog — cancel-with-motivo confirmation (Designer §1.7, §3.3).
 *
 * Thin wrapper over the `Dialog` confirm primitive. Two modes:
 *  - destructive (type="warning"): message + optional motivo Textarea + a
 *    "Sí, cancelar" confirm whose colour resolves to error.
 *  - blocked-completed (type="info"): no destructive button — a single
 *    "Entendido", shown when the cita is already completada/cancelada (terminal
 *    safety net even though the detail popover hides "Cancelar" for those).
 *
 * Cancellation is NOT a delete, so `Dialog` (not DeleteGuardDialog) is correct.
 */

import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@infra/components/ui/common/Dialog';
import { Textarea } from '@infra/components/ui/common/Textarea';
import {
  StyledCancelBody,
  StyledCancelMessage,
  StyledCancelLabel,
  StyledCancelOptional,
  StyledDialogError,
} from './AgendaCancelDialog.styles';

export type TCancelBlockedReason = 'completed' | 'cancelled' | null;

interface IAgendaCancelDialogProps {
  readonly open: boolean;
  readonly clienteName: string;
  readonly fecha: string;
  readonly hora: string;
  readonly motivo: string;
  readonly onMotivoChange: (value: string) => void;
  readonly submitting: boolean;
  readonly errorMessage?: string;
  /** Non-null → render the informational blocked variant instead of the confirm. */
  readonly blockedReason: TCancelBlockedReason;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
}

export const AgendaCancelDialog = ({
  open,
  clienteName,
  fecha,
  hora,
  motivo,
  onMotivoChange,
  submitting,
  errorMessage,
  blockedReason,
  onConfirm,
  onClose,
}: IAgendaCancelDialogProps): React.ReactElement => {
  const { t } = useTranslation('agenda');
  const motivoId = useId();

  if (blockedReason !== null) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        type="info"
        title={t('cancel.blockedTitle')}
        message={
          <StyledCancelBody>
            <StyledCancelMessage>
              {blockedReason === 'completed'
                ? t('cancel.blockedCompleted')
                : t('cancel.blockedCancelled')}
            </StyledCancelMessage>
          </StyledCancelBody>
        }
        showCancel={false}
        confirmText={t('cancel.blockedAck')}
        onConfirm={onClose}
      />
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      type="warning"
      title={t('cancel.title')}
      loading={submitting}
      confirmText={t('cancel.confirm')}
      cancelText={t('cancel.cancel')}
      onConfirm={onConfirm}
      onCancel={onClose}
      message={
        <StyledCancelBody>
          <StyledCancelMessage>
            {t('cancel.message', { cliente: clienteName, fecha, hora })}
          </StyledCancelMessage>
          <StyledCancelLabel htmlFor={motivoId}>
            {t('cancel.motivoLabel')}
            <StyledCancelOptional>{t('cancel.motivoOptional')}</StyledCancelOptional>
            <Textarea
              id={motivoId}
              value={motivo}
              onChange={(e) => {
                onMotivoChange(e.target.value);
              }}
              placeholder={t('cancel.motivoPlaceholder')}
              disabled={submitting}
              rows={3}
            />
          </StyledCancelLabel>
          {errorMessage !== undefined && (
            <StyledDialogError role="alert">{errorMessage}</StyledDialogError>
          )}
        </StyledCancelBody>
      }
    />
  );
};
