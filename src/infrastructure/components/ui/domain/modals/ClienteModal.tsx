import { useEffect, useActionState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@infra/components/ui/common/Modal';
import { Button } from '@infra/components/ui/common/Button';
import { FormField } from '@infra/components/ui/common/FormField';
import { Input } from '@infra/components/ui/common/Input';
import { Textarea } from '@infra/components/ui/common/Textarea';
import { useToast } from '@infra/components/ui/common/Toast';
import { useCreateCliente } from '@infra/hooks/useCreateCliente';
import { useUpdateCliente } from '@infra/hooks/useUpdateCliente';
import { useClienteById } from '@infra/hooks/useClienteById';
import { clienteCreateSchema, clienteUpdateSchema } from '@app/schemas/cliente.schema';
import type { TClienteId } from '@domain/types';
import * as S from './EntityModal.styles';

// ── Types ─────────────────────────────────────────────────────────────────────

type TModalAction = 'created' | 'updated';

export interface IClienteModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess: (action: TModalAction) => void;
  readonly mode: 'create' | 'edit';
  readonly clienteId?: TClienteId;
}

type TFieldName = 'nombre' | 'apellidos' | 'email' | 'telefono' | 'observaciones';

type TFormState =
  | { status: 'success'; action: TModalAction }
  | {
      status: 'error';
      message: string;
      fieldErrors?: Partial<Record<TFieldName, string>>;
    }
  | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildFieldErrors(error: { issues: { path: readonly PropertyKey[]; message: string }[] }): {
  status: 'error';
  message: string;
  fieldErrors: Partial<Record<TFieldName, string>>;
} {
  const fieldErrors: Partial<Record<TFieldName, string>> = {};
  for (const issue of error.issues) {
    // .at(0) returns string | number | undefined — safe when path is empty
    const rawField = issue.path.at(0);
    if (rawField === undefined) continue;
    const field = String(rawField) as TFieldName;
    if (!(field in fieldErrors)) {
      fieldErrors[field] = issue.message;
    }
  }
  return {
    status: 'error',
    message: error.issues[0]?.message ?? 'Error de validación',
    fieldErrors,
  };
}

function toOptional(s: string): string | undefined {
  return s !== '' ? s : undefined;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const ClienteModal = ({ open, onClose, onSuccess, mode, clienteId }: IClienteModalProps) => {
  const { t } = useTranslation('clientes');
  const { success: toastSuccess } = useToast();

  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();

  // Load cliente data via React Query — no manual effect needed
  const { data: initialData, isLoading: isLoadingData } = useClienteById(
    mode === 'edit' ? clienteId : undefined,
  );

  const handleClose = () => {
    onClose();
  };

  const formAction = async (_prev: TFormState, formData: FormData): Promise<TFormState> => {
    const raw = {
      nombre: formData.get('nombre') as string,
      apellidos: formData.get('apellidos') as string,
      email: toOptional(formData.get('email') as string),
      telefono: toOptional(formData.get('telefono') as string),
      observaciones: toOptional(formData.get('observaciones') as string),
    };

    try {
      if (mode === 'create') {
        const parsed = clienteCreateSchema.safeParse(raw);
        if (!parsed.success) {
          return buildFieldErrors(parsed.error);
        }
        await createMutation.mutateAsync({
          nombre: parsed.data.nombre,
          apellidos: parsed.data.apellidos,
          email: parsed.data.email ?? undefined,
          telefono: parsed.data.telefono ?? '',
          observaciones: parsed.data.observaciones ?? undefined,
        });
        return { status: 'success', action: 'created' };
      } else {
        if (clienteId === undefined) return { status: 'error', message: 'ID requerido' };
        const parsed = clienteUpdateSchema.safeParse(raw);
        if (!parsed.success) {
          return buildFieldErrors(parsed.error);
        }
        await updateMutation.mutateAsync({
          id: clienteId,
          dto: {
            nombre: parsed.data.nombre,
            apellidos: parsed.data.apellidos,
            email: parsed.data.email ?? undefined,
            telefono: parsed.data.telefono ?? undefined,
            observaciones: parsed.data.observaciones ?? undefined,
          },
        });
        return { status: 'success', action: 'updated' };
      }
    } catch (err) {
      return { status: 'error', message: err instanceof Error ? err.message : 'Error inesperado' };
    }
  };

  const [state, dispatch, isPending] = useActionState<TFormState, FormData>(formAction, null);

  // Success — show toast, notify parent, close
  useEffect(() => {
    if (state?.status === 'success') {
      toastSuccess(t(state.action === 'created' ? 'toast.created' : 'toast.updated'));
      onClose();
      onSuccess(state.action);
    }
  }, [state, onSuccess, onClose, toastSuccess, t]);

  const title = mode === 'create' ? t('modal.create.title') : t('modal.edit.title');
  const submitLabel = mode === 'create' ? t('modal.submit.create') : t('modal.submit.edit');

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      position="center"
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <Modal.Header title={title} showCloseButton onClose={handleClose} />
      <Modal.Body padding="md" scrollable>
        <form id="cliente-form" action={dispatch} aria-busy={isPending}>
          <S.StyledFormGrid>
            {state?.status === 'error' && (
              <S.StyledErrorBanner role="alert">
                <S.StyledErrorBannerText>{state.message}</S.StyledErrorBannerText>
              </S.StyledErrorBanner>
            )}

            <S.StyledFormRow>
              <FormField id="nombre" label={t('form.nombre.label')} required>
                {(ctrl) => (
                  <>
                    <Input
                      {...ctrl}
                      name="nombre"
                      placeholder={t('form.nombre.placeholder')}
                      defaultValue={initialData?.nombre ?? ''}
                      disabled={isPending || isLoadingData}
                      hasError={state?.status === 'error' && !!state.fieldErrors?.nombre}
                      aria-describedby={
                        state?.status === 'error' && state.fieldErrors?.nombre
                          ? 'field-error-nombre'
                          : undefined
                      }
                    />
                    {state?.status === 'error' && state.fieldErrors?.nombre && (
                      <S.StyledFieldError id="field-error-nombre">
                        {state.fieldErrors.nombre}
                      </S.StyledFieldError>
                    )}
                  </>
                )}
              </FormField>

              <FormField id="apellidos" label={t('form.apellidos.label')} required>
                {(ctrl) => (
                  <>
                    <Input
                      {...ctrl}
                      name="apellidos"
                      placeholder={t('form.apellidos.placeholder')}
                      defaultValue={initialData?.apellidos ?? ''}
                      disabled={isPending || isLoadingData}
                      hasError={state?.status === 'error' && !!state.fieldErrors?.apellidos}
                      aria-describedby={
                        state?.status === 'error' && state.fieldErrors?.apellidos
                          ? 'field-error-apellidos'
                          : undefined
                      }
                    />
                    {state?.status === 'error' && state.fieldErrors?.apellidos && (
                      <S.StyledFieldError id="field-error-apellidos">
                        {state.fieldErrors.apellidos}
                      </S.StyledFieldError>
                    )}
                  </>
                )}
              </FormField>
            </S.StyledFormRow>

            <FormField id="email" label={t('form.email.label')}>
              {(ctrl) => (
                <>
                  <Input
                    {...ctrl}
                    name="email"
                    type="email"
                    placeholder={t('form.email.placeholder')}
                    defaultValue={initialData?.email ?? ''}
                    disabled={isPending || isLoadingData}
                    hasError={state?.status === 'error' && !!state.fieldErrors?.email}
                    aria-describedby={
                      state?.status === 'error' && state.fieldErrors?.email
                        ? 'field-error-email'
                        : undefined
                    }
                  />
                  {state?.status === 'error' && state.fieldErrors?.email && (
                    <S.StyledFieldError id="field-error-email">
                      {state.fieldErrors.email}
                    </S.StyledFieldError>
                  )}
                </>
              )}
            </FormField>

            <FormField id="telefono" label={t('form.telefono.label')}>
              {(ctrl) => (
                <>
                  <Input
                    {...ctrl}
                    name="telefono"
                    type="tel"
                    placeholder={t('form.telefono.placeholder')}
                    defaultValue={initialData?.telefono ?? ''}
                    disabled={isPending || isLoadingData}
                    hasError={state?.status === 'error' && !!state.fieldErrors?.telefono}
                    aria-describedby={
                      state?.status === 'error' && state.fieldErrors?.telefono
                        ? 'field-error-telefono'
                        : undefined
                    }
                  />
                  {state?.status === 'error' && state.fieldErrors?.telefono && (
                    <S.StyledFieldError id="field-error-telefono">
                      {state.fieldErrors.telefono}
                    </S.StyledFieldError>
                  )}
                </>
              )}
            </FormField>

            <FormField id="observaciones" label={t('form.observaciones.label')}>
              {(ctrl) => (
                <>
                  <Textarea
                    {...ctrl}
                    name="observaciones"
                    placeholder={t('form.observaciones.placeholder')}
                    defaultValue={initialData?.observaciones ?? ''}
                    disabled={isPending || isLoadingData}
                    hasError={state?.status === 'error' && !!state.fieldErrors?.observaciones}
                    maxLength={1000}
                    showCounter
                    rows={4}
                    aria-describedby={
                      state?.status === 'error' && state.fieldErrors?.observaciones
                        ? 'field-error-observaciones observaciones-counter'
                        : undefined
                    }
                  />
                  {state?.status === 'error' && state.fieldErrors?.observaciones && (
                    <S.StyledFieldError id="field-error-observaciones">
                      {state.fieldErrors.observaciones}
                    </S.StyledFieldError>
                  )}
                </>
              )}
            </FormField>
          </S.StyledFormGrid>
        </form>
      </Modal.Body>
      <Modal.Footer align="right">
        <S.StyledFooterLeft />
        <S.StyledFooterRight>
          <Button
            variant="ghost"
            color="neutral"
            type="button"
            disabled={isPending}
            onClick={handleClose}
          >
            {t('modal.cancel')}
          </Button>
          <Button
            variant="solid"
            color="primary"
            type="submit"
            form="cliente-form"
            loading={isPending}
            disabled={isPending || isLoadingData}
          >
            {submitLabel}
          </Button>
        </S.StyledFooterRight>
      </Modal.Footer>
    </Modal>
  );
};
