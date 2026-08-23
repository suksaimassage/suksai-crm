/**
 * CitaQuickEditModal.tsx — therapist quick-edit modal.
 *
 * A deliberately narrow alternative to the heavy CitaModal: the therapist (or an
 * admin viewing a therapist's agenda) edits ONLY the observation note and may
 * arm "mark as completada". It RECEIVES the row data (IAgendaAppointment) — it
 * never fetches.
 *
 * Behaviour (final spec):
 *  - "Marcar como completada" is an ARMED TOGGLE, not an immediate mutation. It
 *    is shown only when the estado can legally transition to 'completada'
 *    (confirmada | en_curso). For pendiente / sin_asignar it renders DISABLED
 *    with a hint. For completada it is replaced by a read-only Badge. For
 *    cancelada / no_presentado a subtle context line is shown. The observation
 *    textarea stays editable in every case.
 *  - Save is the single commit: note first (if changed), then estado (if armed),
 *    both awaited in sequence. On full success → one toast, onSuccess, onClose.
 *  - `savedNotas` tracks the last persisted note so a partial failure (note OK,
 *    estado failed) does not re-write the note on retry.
 *
 * Composition root: useUpdateCitaNotas → citaService.updateNotas (no schedule
 * rules); useChangeCitaEstado → citaService.changeEstado (legality enforced).
 */

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isLegalEstadoTransition } from '@domain/index';
import type { IAgendaAppointment } from '@domain/models/agenda.models';
import { Modal } from '@infra/components/ui/common/Modal';
import { FormField } from '@infra/components/ui/common/FormField';
import { Textarea } from '@infra/components/ui/common/Textarea';
import { Button } from '@infra/components/ui/common/Button';
import { Badge } from '@infra/components/ui/common/Badge';
import { useToast } from '@infra/components/ui/common/Toast';
import { useUpdateCitaNotas } from '@infra/hooks/useUpdateCitaNotas';
import { useChangeCitaEstado } from '@infra/hooks/useChangeCitaEstado';
import * as S from './CitaQuickEditModal.styles';

const MODAL_ID = 'cita-quick-edit';
const NOTES_MAX_LENGTH = 1000;

/** Outcome reported to the parent view for announcing / focus restoration. */
export type TQuickEditOutcome = 'note' | 'completed';

export interface ICitaQuickEditModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** The row data the modal edits. The modal never fetches. */
  readonly appointment: IAgendaAppointment;
  /** Fired after a successful save (note-only or completion). */
  readonly onSuccess?: (kind: TQuickEditOutcome) => void;
}

// ── Decorative status icons (icon + text, never colour-alone — WCAG 1.4.1) ─────

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="m8.5 12 2.5 2.5 4.5-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const InfoCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="7.75" r="1" fill="currentColor" />
  </svg>
);

export const CitaQuickEditModal = ({
  open,
  onClose,
  appointment,
  onSuccess,
}: ICitaQuickEditModalProps) => {
  const { t } = useTranslation('agenda');
  const { success, error } = useToast();

  const updateNotas = useUpdateCitaNotas();
  const changeEstado = useChangeCitaEstado();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Note draft, seeded from the row. `savedNotas` holds the last persisted value
  // (normalised: '' means "no note") so a retry after a partial failure does not
  // re-write an already-saved note.
  const originalNotas = appointment.notes ?? '';
  const [notas, setNotas] = useState<string>(originalNotas);
  const [savedNotas, setSavedNotas] = useState<string>(originalNotas);
  const [isCompleteArmed, setIsCompleteArmed] = useState<boolean>(false);

  const isPending = updateNotas.isPending || changeEstado.isPending;

  // ── Estado-driven completion affordance ───────────────────────────────────
  const estado = appointment.estado;
  const canComplete = isLegalEstadoTransition(estado, 'completada'); // confirmada | en_curso
  const isAlreadyCompleted = estado === 'completada';
  const isCancelled = estado === 'cancelada';
  const isNoShow = estado === 'no_presentado';
  // pendiente / sin_asignar → toggle is shown but DISABLED with a hint.
  const showDisabledToggle = !canComplete && !isAlreadyCompleted && !isCancelled && !isNoShow;
  const disabledHint =
    estado === 'sin_asignar'
      ? t('therapist.quickEdit.hintAssignFirst')
      : t('therapist.quickEdit.hintConfirmFirst');

  // ── Derived values ────────────────────────────────────────────────────────
  const trimmedNotas = notas.trim();
  const noteChanged = trimmedNotas !== savedNotas.trim();
  const nothingToSave = !noteChanged && !isCompleteArmed;

  const hintId = `${MODAL_ID}-complete-hint`;

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleSave = async () => {
    try {
      // 1) Persist the note first — only when it actually changed since the last
      //    successful write. Empty → null clears the observation.
      if (noteChanged) {
        const payload = trimmedNotas === '' ? null : trimmedNotas;
        await updateNotas.mutateAsync({ citaId: appointment.id, notas: payload });
        setSavedNotas(trimmedNotas);
      }

      // 2) Then move the estado to completada when armed.
      if (isCompleteArmed) {
        await changeEstado.mutateAsync({ citaId: appointment.id, estado: 'completada' });
      }

      const outcome: TQuickEditOutcome = isCompleteArmed ? 'completed' : 'note';
      success(
        outcome === 'completed'
          ? t('therapist.quickEdit.toastCompleted')
          : t('therapist.quickEdit.toastSaved'),
      );
      onSuccess?.(outcome);
      onClose();
    } catch (err) {
      // Domain errors (BusinessRuleViolation / ValidationError) carry a usable
      // message; anything else falls back to the generic copy. The modal stays
      // open with inputs + armed state intact so the user can retry.
      const name = err instanceof Error ? err.name : '';
      const message =
        (name === 'BusinessRuleViolation' || name === 'ValidationError') && err instanceof Error
          ? err.message
          : t('therapist.quickEdit.toastError');
      error(message);
    }
  };

  // ── Subtitle (client · time) — Modal.Header supports `subtitle` ────────────
  const subtitle = t('therapist.quickEdit.subtitle', {
    client: appointment.clientName ?? '—',
    start: appointment.startTime,
    end: appointment.endTime,
  });

  return (
    <Modal
      id={MODAL_ID}
      open={open}
      onClose={handleClose}
      size="md"
      position="center"
      closeOnBackdropClick={false}
      closeOnEscape={false}
      onAfterOpen={() => {
        textareaRef.current?.focus({ preventScroll: true });
      }}
    >
      <Modal.Header
        title={t('therapist.quickEdit.title')}
        subtitle={subtitle}
        showCloseButton
        onClose={handleClose}
      />

      <Modal.Body padding="md" scrollable>
        <S.StyledQuickEditBody>
          <FormField id={`${MODAL_ID}-notes`} label={t('therapist.quickEdit.observationLabel')}>
            {(ctrl) => (
              // Textarea owns its own char counter (maxLength → built-in counter +
              // self-managed aria-describedby/aria-live). We pass NO aria-describedby
              // here: this field has no FormField helper/error (ctrl describedby is
              // undefined), and overriding would clobber the Textarea's counter link.
              <Textarea
                id={ctrl.id}
                ref={textareaRef}
                name="observacion"
                value={notas}
                onChange={(e) => {
                  setNotas(e.target.value);
                }}
                placeholder={t('therapist.quickEdit.observationPlaceholder')}
                maxLength={NOTES_MAX_LENGTH}
                rows={4}
                disabled={isPending}
              />
            )}
          </FormField>

          <S.StyledCompletionSection>
            {isAlreadyCompleted && (
              <S.StyledStatusRow>
                <Badge color="success" variant="soft" size="sm">
                  {t('therapist.quickEdit.statusCompleted')}
                </Badge>
              </S.StyledStatusRow>
            )}

            {isCancelled && (
              <S.StyledContextLine>
                <S.StyledStatusIcon>
                  <InfoCircleIcon />
                </S.StyledStatusIcon>
                {t('therapist.quickEdit.contextCancelled')}
              </S.StyledContextLine>
            )}

            {isNoShow && (
              <S.StyledContextLine>
                <S.StyledStatusIcon>
                  <InfoCircleIcon />
                </S.StyledStatusIcon>
                {t('therapist.quickEdit.contextNoShow')}
              </S.StyledContextLine>
            )}

            {canComplete && (
              <Button
                type="button"
                color="success"
                variant={isCompleteArmed ? 'solid' : 'outlined'}
                size="md"
                aria-pressed={isCompleteArmed}
                disabled={isPending}
                iconStart={
                  <S.StyledStatusIcon>
                    <CheckCircleIcon />
                  </S.StyledStatusIcon>
                }
                onClick={() => {
                  setIsCompleteArmed((armed) => !armed);
                }}
              >
                {isCompleteArmed
                  ? t('therapist.quickEdit.markCompletedArmed')
                  : t('therapist.quickEdit.markCompleted')}
              </Button>
            )}

            {showDisabledToggle && (
              <>
                <Button
                  type="button"
                  color="success"
                  variant="outlined"
                  size="md"
                  disabled
                  aria-describedby={hintId}
                  iconStart={
                    <S.StyledStatusIcon>
                      <CheckCircleIcon />
                    </S.StyledStatusIcon>
                  }
                >
                  {t('therapist.quickEdit.markCompleted')}
                </Button>
                <S.StyledCompletionHint id={hintId}>
                  <S.StyledStatusIcon>
                    <InfoCircleIcon />
                  </S.StyledStatusIcon>
                  {disabledHint}
                </S.StyledCompletionHint>
              </>
            )}
          </S.StyledCompletionSection>
        </S.StyledQuickEditBody>
      </Modal.Body>

      <Modal.Footer align="right">
        <S.StyledFooterActions>
          <Button
            type="button"
            variant="ghost"
            color="neutral"
            disabled={isPending}
            onClick={handleClose}
          >
            {t('therapist.quickEdit.cancel')}
          </Button>
          <Button
            type="button"
            variant="solid"
            color="primary"
            loading={isPending}
            loadingText={t('therapist.quickEdit.saving')}
            disabled={nothingToSave || isPending}
            onClick={() => {
              void handleSave();
            }}
          >
            {isCompleteArmed
              ? t('therapist.quickEdit.saveAndComplete')
              : t('therapist.quickEdit.save')}
          </Button>
        </S.StyledFooterActions>
      </Modal.Footer>
    </Modal>
  );
};

CitaQuickEditModal.displayName = 'CitaQuickEditModal';
