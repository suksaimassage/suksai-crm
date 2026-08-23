import { useEffect, useActionState, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@infra/components/ui/common/Modal';
import { Form } from '@infra/components/ui/common/Form';
import { Button } from '@infra/components/ui/common/Button';
import { Switch } from '@infra/components/ui/common/Switch';
import { Dialog } from '@infra/components/ui/common/Dialog';
import { useToast } from '@infra/components/ui/common/Toast';
import { useCreateCentro } from '@infra/hooks/useCreateCentro';
import { useUpdateCentro } from '@infra/hooks/useUpdateCentro';
import { useDeleteCentro } from '@infra/hooks/useDeleteCentro';
import { centroCreateSchema, centroUpdateSchema } from '@app/schemas/centro.schema';
import type { TCentroId } from '@domain/types';
import type { ICentro } from '@domain/models';
import * as S from './EntityModal.styles';

// ── Types ─────────────────────────────────────────────────────────────────────

type TModalAction = 'created' | 'updated' | 'deleted';

export interface ICentroModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess: (action: TModalAction) => void;
  readonly mode: 'create' | 'edit';
  readonly centroId?: TCentroId;
  readonly initialData?: ICentro;
}

type TFormState =
  | { status: 'success'; action: TModalAction }
  | { status: 'error'; message: string }
  | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function toOptional(s: string): string | undefined {
  return s !== '' ? s : undefined;
}

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Error de validación';
}

// ── Component ─────────────────────────────────────────────────────────────────

export const CentroModal = ({
  open,
  onClose,
  onSuccess,
  mode,
  centroId,
  initialData,
}: ICentroModalProps) => {
  const { t } = useTranslation('dashboard');
  const { success: toastSuccess, error: toastError } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activoChecked, setActivoChecked] = useState(initialData?.activo ?? true);

  const createMutation = useCreateCentro();
  const updateMutation = useUpdateCentro();
  const deleteMutation = useDeleteCentro();

  const handleClose = () => {
    setIsDeleteDialogOpen(false);
    onClose();
  };

  const formAction = async (_prev: TFormState, formData: FormData): Promise<TFormState> => {
    const raw = {
      nombre: formData.get('nombre') as string,
      direccion: toOptional(formData.get('direccion') as string),
      ciudad: formData.get('ciudad') as string,
      codigoPostal: toOptional(formData.get('codigoPostal') as string),
      telefono: toOptional(formData.get('telefono') as string),
      email: toOptional(formData.get('email') as string),
    };

    try {
      if (mode === 'create') {
        const parsed = centroCreateSchema.safeParse(raw);
        if (!parsed.success) {
          return { status: 'error', message: firstIssueMessage(parsed.error) };
        }
        await createMutation.mutateAsync({
          nombre: parsed.data.nombre,
          direccion: parsed.data.direccion ?? '',
          ciudad: parsed.data.ciudad,
          codigoPostal: parsed.data.codigoPostal ?? '',
          telefono: parsed.data.telefono,
          email: parsed.data.email,
        });
        return { status: 'success', action: 'created' };
      } else {
        if (centroId === undefined) return { status: 'error', message: 'ID requerido' };
        const activoValue = formData.get('activo') === 'true';
        const rawWithActivo = { ...raw, activo: activoValue };
        const parsed = centroUpdateSchema.safeParse(rawWithActivo);
        if (!parsed.success) {
          return { status: 'error', message: firstIssueMessage(parsed.error) };
        }
        await updateMutation.mutateAsync({
          id: centroId,
          dto: {
            nombre: parsed.data.nombre,
            direccion: parsed.data.direccion,
            ciudad: parsed.data.ciudad,
            codigoPostal: parsed.data.codigoPostal,
            telefono: parsed.data.telefono,
            email: parsed.data.email,
            activo: parsed.data.activo,
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
      if (state.action === 'created') toastSuccess(t('centros.toast.created'));
      else if (state.action === 'updated') toastSuccess(t('centros.toast.updated'));
      onSuccess(state.action);
      onClose();
    }
  }, [state, onSuccess, onClose, toastSuccess, t]);

  const handleDelete = async () => {
    if (centroId === undefined) return;
    try {
      await deleteMutation.mutateAsync(centroId);
      toastSuccess(t('centros.toast.deleted'));
      onSuccess('deleted');
      handleClose();
    } catch (err) {
      // Keep the confirmation dialog open so the user can retry (D1).
      toastError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const title = mode === 'create' ? t('centros.modal.create.title') : t('centros.modal.edit.title');
  const submitLabel =
    mode === 'create' ? t('centros.modal.submit.create') : t('centros.modal.submit.edit');

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        size="md"
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

            <Form.Input
              name="nombre"
              type="text"
              label={t('centros.form.nombre.label')}
              placeholder={t('centros.form.nombre.placeholder')}
              defaultValue={initialData?.nombre ?? ''}
              disabled={isPending}
              required
              validationRules={{ required: t('centros.validation.nombre.required') }}
            />

            <Form.Input
              name="direccion"
              type="text"
              label={t('centros.form.direccion.label')}
              placeholder={t('centros.form.direccion.placeholder')}
              defaultValue={initialData?.direccion ?? ''}
              disabled={isPending}
            />

            <S.StyledFormRow>
              <Form.Input
                name="ciudad"
                type="text"
                label={t('centros.form.ciudad.label')}
                placeholder={t('centros.form.ciudad.placeholder')}
                defaultValue={initialData?.ciudad ?? ''}
                disabled={isPending}
                required
                validationRules={{ required: t('centros.validation.ciudad.required') }}
              />
              <Form.Input
                name="codigoPostal"
                type="text"
                label={t('centros.form.codigoPostal.label')}
                placeholder={t('centros.form.codigoPostal.placeholder')}
                defaultValue={initialData?.codigoPostal ?? ''}
                disabled={isPending}
              />
            </S.StyledFormRow>

            <S.StyledFormRow>
              <Form.Input
                name="telefono"
                type="tel"
                label={t('centros.form.telefono.label')}
                placeholder={t('centros.form.telefono.placeholder')}
                defaultValue={initialData?.telefono ?? ''}
                disabled={isPending}
              />
              <Form.Input
                name="email"
                type="email"
                label={t('centros.form.email.label')}
                placeholder={t('centros.form.email.placeholder')}
                defaultValue={initialData?.email ?? ''}
                disabled={isPending}
                validationRules={{
                  pattern: {
                    value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: t('centros.validation.email.pattern'),
                  },
                }}
              />
            </S.StyledFormRow>

            {mode === 'edit' && (
              <S.StyledModalDividerSection>
                <input type="hidden" name="activo" value={String(activoChecked)} />
                <Switch
                  label={t('centros.form.activo.label')}
                  description={t('centros.form.activo.helperText')}
                  checked={activoChecked}
                  onChange={setActivoChecked}
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
                  disabled={isPending || deleteMutation.isPending}
                  onClick={() => {
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  {t('centros.modal.delete.label')}
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
                {t('centros.modal.cancel')}
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

      {mode === 'edit' && (
        <Dialog
          open={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
          }}
          type="error"
          showCancel
          title={t('centros.modal.deleteDialog.title')}
          message={t('centros.modal.deleteDialog.message')}
          confirmText={t('centros.modal.deleteDialog.confirm')}
          cancelText={t('centros.modal.deleteDialog.cancel')}
          loading={deleteMutation.isPending}
          onConfirm={() => {
            void handleDelete();
          }}
        />
      )}
    </>
  );
};
