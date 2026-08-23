import { useState, useEffect, useActionState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@infra/components/ui/common/Modal';
import { Form } from '@infra/components/ui/common/Form';
import { Button } from '@infra/components/ui/common/Button';
import { Switch } from '@infra/components/ui/common/Switch';
import { Dialog } from '@infra/components/ui/common/Dialog';
import { DeleteGuardDialog } from '@infra/components/ui/common/DeleteGuardDialog';
import { useToast } from '@infra/components/ui/common/Toast';
import { useCreateSala } from '@infra/hooks/useCreateSala';
import { useUpdateSala } from '@infra/hooks/useUpdateSala';
import { useSalaDeletion } from '@infra/hooks/useSalaDeletion';
import { salaCreateSchema, salaUpdateSchema } from '@app/schemas/sala.schema';
import type { TSalaId, TCentroId } from '@domain/types';
import type { ISala } from '@domain/models';
import * as S from './EntityModal.styles';

// ── Types ─────────────────────────────────────────────────────────────────────

type TModalAction = 'created' | 'updated' | 'deleted';

export interface ISalaModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess: (action: TModalAction) => void;
  readonly mode: 'create' | 'edit';
  readonly centroId: TCentroId;
  readonly centroNombre: string;
  readonly salaId?: TSalaId;
  readonly initialData?: ISala;
}

type TFormState =
  | { status: 'success'; action: TModalAction }
  | { status: 'error'; message: string }
  | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Error de validación';
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SalaModal = ({
  open,
  onClose,
  onSuccess,
  mode,
  centroId,
  centroNombre,
  salaId,
  initialData,
}: ISalaModalProps) => {
  const { t } = useTranslation('dashboard');
  const { success: toastSuccess, error: toastError } = useToast();

  const [activaChecked, setActivaChecked] = useState(initialData?.activa ?? true);

  const createMutation = useCreateSala(centroId);
  const updateMutation = useUpdateSala(centroId);
  const deletion = useSalaDeletion(centroId);

  const handleClose = () => {
    deletion.reset();
    onClose();
  };

  const handleDeleteClick = () => {
    if (salaId === undefined) return;
    void deletion.requestDelete(salaId);
  };

  const handleConfirmDelete = async () => {
    const ok = await deletion.confirmDelete();
    if (ok) {
      toastSuccess(t('salas.toast.deleted'));
      onSuccess('deleted');
      handleClose();
    } else {
      toastError(t('salas.toast.errorDelete'));
    }
  };

  const formAction = async (_prev: TFormState, formData: FormData): Promise<TFormState> => {
    const raw = {
      nombre: formData.get('nombre') as string,
      capacidad: formData.get('capacidad') as string,
      descripcion: (formData.get('descripcion') as string) || undefined,
    };

    try {
      if (mode === 'create') {
        const parsed = salaCreateSchema.safeParse(raw);
        if (!parsed.success) {
          return { status: 'error', message: firstIssueMessage(parsed.error) };
        }
        await createMutation.mutateAsync({
          centroId,
          nombre: parsed.data.nombre,
          capacidad: parsed.data.capacidad,
          descripcion: parsed.data.descripcion !== '' ? parsed.data.descripcion : undefined,
        });
        return { status: 'success', action: 'created' };
      } else {
        if (salaId === undefined) return { status: 'error', message: 'ID requerido' };
        const activaValue = formData.get('activa') === 'true';
        const rawWithActiva = { ...raw, activa: activaValue };
        const parsed = salaUpdateSchema.safeParse(rawWithActiva);
        if (!parsed.success) {
          return { status: 'error', message: firstIssueMessage(parsed.error) };
        }
        await updateMutation.mutateAsync({
          id: salaId,
          dto: {
            nombre: parsed.data.nombre,
            capacidad: parsed.data.capacidad,
            descripcion: parsed.data.descripcion !== '' ? parsed.data.descripcion : undefined,
            activa: parsed.data.activa,
          },
        });
        return { status: 'success', action: 'updated' };
      }
    } catch (err) {
      return { status: 'error', message: err instanceof Error ? err.message : 'Error inesperado' };
    }
  };

  const [state, dispatch, isPending] = useActionState<TFormState, FormData>(formAction, null);

  useEffect(() => {
    if (state?.status === 'success') {
      if (state.action === 'created') toastSuccess(t('salas.toast.created'));
      else if (state.action === 'updated') toastSuccess(t('salas.toast.updated'));
      onSuccess(state.action);
      onClose();
    }
  }, [state, onSuccess, onClose, toastSuccess, t]);

  const title = mode === 'create' ? t('salas.modal.create.title') : t('salas.modal.edit.title');
  const submitLabel =
    mode === 'create' ? t('salas.modal.submit.create') : t('salas.modal.submit.edit');

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        size="sm"
        position="center"
        closeOnBackdropClick={false}
        closeOnEscape={false}
      >
        <Modal.Header title={title} onClose={handleClose} />
        <Form action={dispatch} variant="ghost" fullWidth>
          <Form.Body>
            {state?.status === 'error' && (
              <S.StyledErrorBanner role="alert">
                <S.StyledErrorBannerText>{state.message}</S.StyledErrorBannerText>
              </S.StyledErrorBanner>
            )}

            <S.StyledContextBadge aria-label={t('salas.form.centro.ariaLabel')}>
              <S.StyledContextBadgeLabel>{t('salas.form.centro.label')}</S.StyledContextBadgeLabel>
              <S.StyledContextBadgeValue title={centroNombre}>
                {centroNombre}
              </S.StyledContextBadgeValue>
            </S.StyledContextBadge>

            <Form.Input
              name="nombre"
              type="text"
              label={t('salas.form.nombre.label')}
              placeholder={t('salas.form.nombre.placeholder')}
              defaultValue={initialData?.nombre ?? ''}
              disabled={isPending}
              required
              validationRules={{ required: t('salas.validation.nombre.required') }}
            />

            <S.StyledFormRowAsymmetric>
              <Form.Input
                name="capacidad"
                type="number"
                min={1}
                step={1}
                label={t('salas.form.capacidad.label')}
                placeholder={t('salas.form.capacidad.placeholder')}
                defaultValue={initialData?.capacidad ?? 1}
                disabled={isPending}
                validate={(value) => {
                  const n = Number(value);
                  if (isNaN(n) || n < 1) return t('salas.validation.capacidad.min');
                  return null;
                }}
              />
              <Form.Input
                name="descripcion"
                type="textarea"
                minRows={3}
                label={t('salas.form.descripcion.label')}
                placeholder={t('salas.form.descripcion.placeholder')}
                defaultValue={initialData?.descripcion ?? ''}
                disabled={isPending}
              />
            </S.StyledFormRowAsymmetric>

            {mode === 'edit' && (
              <S.StyledModalDividerSection>
                <input type="hidden" name="activa" value={String(activaChecked)} />
                <Switch
                  label={t('salas.form.activa.label')}
                  description={t('salas.form.activa.helperText')}
                  checked={activaChecked}
                  onChange={setActivaChecked}
                  disabled={isPending}
                />
              </S.StyledModalDividerSection>
            )}
          </Form.Body>

          <Form.Footer align="between">
            <div>
              {mode === 'edit' && (
                <Button
                  variant="ghost"
                  color="error"
                  type="button"
                  loading={deletion.isChecking}
                  disabled={isPending || deletion.isChecking}
                  onClick={handleDeleteClick}
                >
                  {t('salas.modal.delete.label')}
                </Button>
              )}
            </div>
            <S.StyledFooterRight>
              <Button
                variant="ghost"
                color="neutral"
                type="button"
                disabled={isPending}
                onClick={handleClose}
              >
                {t('salas.modal.cancel')}
              </Button>
              <Button
                variant="solid"
                color="primary"
                type="submit"
                loading={isPending}
                disabled={isPending}
              >
                {submitLabel}
              </Button>
            </S.StyledFooterRight>
          </Form.Footer>
        </Form>
      </Modal>

      <DeleteGuardDialog
        open={deletion.guardOpen}
        onClose={deletion.closeGuard}
        entityName={initialData?.nombre ?? t('salas.modal.delete.entityLabel')}
        activeCitasCount={deletion.guardCount}
        message={t('salas.guard.description', { count: deletion.guardCount })}
      />

      <Dialog
        open={deletion.confirmOpen}
        onClose={deletion.cancelConfirm}
        type="error"
        showCancel
        title={t('centros.sala.deleteDialog.title')}
        message={t('centros.sala.deleteDialog.message', {
          nombre: initialData?.nombre ?? '',
        })}
        confirmText={t('centros.sala.deleteDialog.confirm')}
        cancelText={t('centros.sala.deleteDialog.cancel')}
        loading={deletion.isDeleting}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </>
  );
};
