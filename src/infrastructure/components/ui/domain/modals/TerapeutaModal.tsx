import { useState, useEffect, useActionState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@infra/components/ui/common/Modal';
import { Button } from '@infra/components/ui/common/Button';
import { FormField } from '@infra/components/ui/common/FormField';
import { Input } from '@infra/components/ui/common/Input';
import { Select } from '@infra/components/ui/common/Select';
import { CentroCheckboxList } from '@infra/components/ui/common/CentroCheckboxList';
import { Dialog } from '@infra/components/ui/common/Dialog';
import { DeleteGuardDialog } from '@infra/components/ui/common/DeleteGuardDialog';
import { useToast } from '@infra/components/ui/common/Toast';
import { useCentrosActivos } from '@infra/hooks/useCentrosActivos';
import { useCreateTerapeuta } from '@infra/hooks/useCreateTerapeuta';
import { useUpdateTerapeuta } from '@infra/hooks/useUpdateTerapeuta';
import { useActiveCitasByTerapeuta } from '@infra/hooks/useActiveCitasByTerapeuta';
import { useUsuarioCentroAssignments } from '@infra/hooks/useUsuarioCentroAssignments';
import { useRoles } from '@infra/hooks/useRoles';
import { terapeutaCreateSchema, terapeutaUpdateSchema } from '@app/schemas/terapeuta.schema';
import type { TUserId, TCentroId } from '@domain/types';
import type { IUsuario } from '@domain/models';
import * as S from './EntityModal.styles';

// ── Types ─────────────────────────────────────────────────────────────────────

type TModalAction = 'created' | 'updated' | 'deleted' | 'reactivated';

export interface ITerapeutaModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess: (action: TModalAction) => void;
  readonly mode: 'create' | 'edit';
  readonly usuarioId?: TUserId;
  readonly initialData?: IUsuario;
  readonly initialRol?: string;
}

type TFormState =
  | { status: 'success'; action: TModalAction }
  | { status: 'error'; message: string; field?: string }
  | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Error de validación';
}

function toOptional(s: string): string | undefined {
  return s !== '' ? s : undefined;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const TerapeutaModal = ({
  open,
  onClose,
  onSuccess,
  mode,
  usuarioId,
  initialData,
  initialRol,
}: ITerapeutaModalProps) => {
  const { t } = useTranslation('terapeutas');
  const { success: toastSuccess, warning: toastWarning, error: toastError } = useToast();

  const { data: centros = [], isLoading: centrosLoading } = useCentrosActivos();
  const [selectedCentroIds, setSelectedCentroIds] = useState<readonly TCentroId[]>([]);
  const [previousCentroIds, setPreviousCentroIds] = useState<readonly TCentroId[]>([]);
  const [principalCentroId, setPrincipalCentroId] = useState<TCentroId | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [guardOpen, setGuardOpen] = useState(false);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);
  const [guardCount, setGuardCount] = useState(0);
  const [isCheckingGuard, setIsCheckingGuard] = useState(false);
  const [selectedRolNombre, setSelectedRolNombre] = useState('');
  const [rolErrorCleared, setRolErrorCleared] = useState(false);

  const createMutation = useCreateTerapeuta();
  const updateMutation = useUpdateTerapeuta();
  const { check: checkCitas } = useActiveCitasByTerapeuta();
  const { data: roles = [], isLoading: rolesLoading, isError: rolesError } = useRoles();

  const rolOptions = roles.map((r) => ({
    value: r.nombre,
    label: t(`roles.${r.nombre}`, { defaultValue: r.nombre }),
  }));

  const resetState = () => {
    setConfirmDeleteOpen(false);
    setGuardOpen(false);
    setGuardCount(0);
    setIsReactivateDialogOpen(false);
    setSelectedCentroIds([]);
    setPreviousCentroIds([]);
    setPrincipalCentroId(null);
    setSelectedRolNombre('');
    setRolErrorCleared(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const { centroIds: fetchedCentroIds, principalCentroId: fetchedPrincipalId } =
    useUsuarioCentroAssignments(usuarioId, mode === 'edit' && open);

  // Syncing server-fetched centro assignments into local form state when the edit modal
  // opens. The double-render is acceptable (modal-open only) and refactoring to a
  // key-based remount would discard transition animations.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (mode !== 'edit' || !open) return;
    setSelectedCentroIds(fetchedCentroIds);
    setPreviousCentroIds(fetchedCentroIds);
    const firstCentro = fetchedCentroIds.length > 0 ? fetchedCentroIds[0] : null;
    setPrincipalCentroId(fetchedPrincipalId ?? firstCentro);
  }, [fetchedCentroIds, fetchedPrincipalId, mode, open]);

  useEffect(() => {
    if (mode !== 'edit' || !open) return;
    setSelectedRolNombre(initialRol ?? '');
  }, [initialRol, mode, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Centro selection handler — recomputes the principal in the SAME update so
  // principalCentroId never points at an unchecked centro at submit time:
  //  • 0→1 selection auto-defaults the new centro as principal
  //  • unchecking the principal auto-reassigns to the first remaining (or null)
  const handleCentroChange = (ids: readonly TCentroId[]) => {
    setSelectedCentroIds(ids);
    setPrincipalCentroId((prev) => {
      const first = ids.length > 0 ? ids[0] : null;
      if (ids.length === 0) return null;
      if (prev === null) return ids.length === 1 ? first : null;
      if (!ids.includes(prev)) return first;
      return prev;
    });
  };

  const handlePrincipalChange = (id: TCentroId) => {
    setPrincipalCentroId(id);
  };

  const handleDeleteClick = async () => {
    if (usuarioId === undefined) return;
    setIsCheckingGuard(true);
    try {
      const count = await checkCitas(usuarioId);
      if (count > 0) {
        setGuardCount(count);
        setGuardOpen(true);
      } else {
        setConfirmDeleteOpen(true);
      }
    } catch {
      toastError(t('guard.check_error'));
    } finally {
      setIsCheckingGuard(false);
    }
  };

  const handleDelete = async () => {
    if (usuarioId === undefined) return;
    try {
      await updateMutation.mutateAsync({
        id: usuarioId,
        dto: { activo: false },
        centroIds: selectedCentroIds,
        previousCentroIds,
        principalCentroId,
      });
      toastWarning(t('toast.deleted'));
      setConfirmDeleteOpen(false);
      onSuccess('deleted');
      handleClose();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Error al desactivar');
    }
  };

  const handleReactivate = async () => {
    if (usuarioId === undefined) return;
    try {
      await updateMutation.mutateAsync({
        id: usuarioId,
        dto: { activo: true },
        centroIds: selectedCentroIds,
        previousCentroIds,
        principalCentroId,
      });
      toastSuccess(t('toast.reactivated'));
      onSuccess('reactivated');
      handleClose();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Error al reactivar');
    }
  };

  const formAction = async (_prev: TFormState, formData: FormData): Promise<TFormState> => {
    const raw = {
      nombre: formData.get('nombre') as string,
      apellidos: toOptional(formData.get('apellidos') as string),
      email: formData.get('email') as string,
      telefono: toOptional(formData.get('telefono') as string),
      centroIds: [...selectedCentroIds],
      principalCentroId,
      // rol only applies to create mode; omit when empty so the update schema's
      // optional rolNombre stays undefined (an empty string would fail .min(1)).
      rolNombre: toOptional(selectedRolNombre),
    };

    try {
      if (mode === 'create') {
        // Early field guard for role selection — avoids Zod parse with empty rol
        if (selectedRolNombre === '') {
          return { status: 'error', message: t('form.rol.error_required'), field: 'rolNombre' };
        }

        const parsed = terapeutaCreateSchema.safeParse(raw);
        if (!parsed.success) {
          return {
            status: 'error',
            message: firstIssueMessage(parsed.error),
          };
        }
        await createMutation.mutateAsync({
          nombre: parsed.data.nombre,
          apellidos: parsed.data.apellidos,
          email: parsed.data.email,
          telefono: parsed.data.telefono,
          centroIds: parsed.data.centroIds,
          principalCentroId: parsed.data.principalCentroId,
          rolNombre: selectedRolNombre,
        });
        toastSuccess(t('toast.created'));
        return { status: 'success', action: 'created' };
      } else {
        if (usuarioId === undefined) return { status: 'error', message: 'ID requerido' };
        const parsed = terapeutaUpdateSchema.safeParse(raw);
        if (!parsed.success) {
          return {
            status: 'error',
            message: firstIssueMessage(parsed.error),
          };
        }
        const rolCambiado =
          selectedRolNombre !== '' && selectedRolNombre !== initialRol
            ? selectedRolNombre
            : undefined;
        await updateMutation.mutateAsync({
          id: usuarioId,
          dto: {
            nombre: parsed.data.nombre,
            apellidos: parsed.data.apellidos,
            telefono: parsed.data.telefono,
          },
          centroIds: selectedCentroIds,
          previousCentroIds,
          principalCentroId,
          rolNombre: rolCambiado,
        });
        toastSuccess(t('toast.updated'));
        return { status: 'success', action: 'updated' };
      }
    } catch (err) {
      return { status: 'error', message: err instanceof Error ? err.message : 'Error inesperado' };
    }
  };

  const [state, dispatch, isPending] = useActionState<TFormState, FormData>(formAction, null);

  useEffect(() => {
    if (state?.status === 'success') {
      onSuccess(state.action);
      onClose();
    }
  }, [state, onSuccess, onClose]);

  // Derive rol field error from action state; cleared once user makes a selection.
  const rolDisplayError =
    rolErrorCleared || !(state?.status === 'error' && state.field === 'rolNombre')
      ? undefined
      : state.message;

  const title = mode === 'create' ? t('modal.create.title') : t('modal.edit.title');
  const submitLabel = mode === 'create' ? t('modal.submit.create') : t('modal.submit.edit');

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
        <Modal.Header title={title} showCloseButton onClose={handleClose} />
        <Modal.Body padding="md" scrollable>
          <form id="terapeuta-form" action={dispatch}>
            <S.StyledFormGrid>
              {state?.status === 'error' && state.field === undefined && (
                <S.StyledErrorBanner role="alert">
                  <S.StyledErrorBannerText>{state.message}</S.StyledErrorBannerText>
                </S.StyledErrorBanner>
              )}

              <S.StyledFormRow>
                <FormField id="nombre" label={t('form.nombre.label')} required>
                  {(ctrl) => (
                    <Input
                      {...ctrl}
                      name="nombre"
                      placeholder={t('form.nombre.placeholder')}
                      defaultValue={initialData?.nombre ?? ''}
                      disabled={isPending}
                    />
                  )}
                </FormField>

                <FormField id="apellidos" label={t('form.apellidos.label')}>
                  {(ctrl) => (
                    <Input
                      {...ctrl}
                      name="apellidos"
                      placeholder={t('form.apellidos.placeholder')}
                      defaultValue={initialData?.apellidos ?? ''}
                      disabled={isPending}
                    />
                  )}
                </FormField>
              </S.StyledFormRow>

              <FormField id="email" label={t('form.email.label')} required={mode === 'create'}>
                {(ctrl) => (
                  <>
                    <Input
                      {...ctrl}
                      name="email"
                      type="email"
                      placeholder={t('form.email.placeholder')}
                      defaultValue={initialData?.email ?? ''}
                      disabled={isPending && mode === 'create'}
                      readOnly={mode === 'edit'}
                    />
                    {mode === 'edit' && (
                      <S.StyledReadOnlyHint>{t('form.email.readonly_hint')}</S.StyledReadOnlyHint>
                    )}
                  </>
                )}
              </FormField>

              <FormField
                id="telefono"
                label={
                  <>
                    {t('form.telefono.label')}
                    <S.StyledOptionalHint>(opcional)</S.StyledOptionalHint>
                  </>
                }
              >
                {(ctrl) => (
                  <Input
                    {...ctrl}
                    name="telefono"
                    type="tel"
                    placeholder={t('form.telefono.placeholder')}
                    defaultValue={initialData?.telefono ?? ''}
                    disabled={isPending}
                  />
                )}
              </FormField>

              <FormField
                id="rol"
                label={t('form.rol.label')}
                required={mode === 'create'}
                errorText={rolDisplayError}
              >
                {(ctrl) => (
                  <Select
                    id={ctrl.id}
                    value={selectedRolNombre}
                    onChange={(val) => {
                      setSelectedRolNombre(val);
                      setRolErrorCleared(true);
                    }}
                    options={rolOptions}
                    placeholder={rolesError ? t('form.rol.error_load') : t('form.rol.placeholder')}
                    required={mode === 'create'}
                    disabled={rolesLoading || rolesError}
                    error={rolDisplayError}
                  />
                )}
              </FormField>

              <CentroCheckboxList
                centros={centros}
                selected={selectedCentroIds}
                onChange={handleCentroChange}
                isLoading={centrosLoading}
                label={t('form.centros.label')}
                principalId={principalCentroId}
                onPrincipalChange={handlePrincipalChange}
                principalLabel={t('form.principal.label')}
                principalHelp={t('form.principal.help')}
                principalRadioAriaLabel={(centro) => t('form.principal.radioAriaLabel', { centro })}
              />
            </S.StyledFormGrid>
          </form>
        </Modal.Body>
        <Modal.Footer align="right">
          <S.StyledFooterLeft>
            {mode === 'edit' && initialData?.activo !== false && (
              <Button
                variant="ghost"
                color="error"
                type="button"
                loading={isCheckingGuard}
                disabled={isPending || isCheckingGuard || updateMutation.isPending}
                onClick={() => {
                  void handleDeleteClick();
                }}
              >
                {t('modal.delete.label')}
              </Button>
            )}
            {mode === 'edit' && initialData?.activo === false && (
              <Button
                variant="ghost"
                color="success"
                type="button"
                disabled={isPending || updateMutation.isPending}
                onClick={() => {
                  setIsReactivateDialogOpen(true);
                }}
              >
                {t('modal.reactivate.label')}
              </Button>
            )}
          </S.StyledFooterLeft>
          <S.StyledFooterRight>
            <Button
              variant="ghost"
              color="neutral"
              type="button"
              disabled={isPending || updateMutation.isPending}
              onClick={handleClose}
            >
              {t('modal.cancel')}
            </Button>
            <Button
              variant="solid"
              color="primary"
              type="submit"
              form="terapeuta-form"
              loading={isPending}
              disabled={isPending || updateMutation.isPending}
            >
              {submitLabel}
            </Button>
          </S.StyledFooterRight>
        </Modal.Footer>
      </Modal>

      <DeleteGuardDialog
        open={guardOpen}
        onClose={() => {
          setGuardOpen(false);
        }}
        entityName={initialData?.nombre ?? t('modal.delete.entityLabel')}
        activeCitasCount={guardCount}
        message={t('guard.description', { count: guardCount })}
      />

      <Dialog
        open={confirmDeleteOpen}
        type="warning"
        title={t('modal.delete.confirmTitle')}
        message={t('modal.delete.confirmMessage', {
          nombre: initialData?.nombre ?? t('modal.delete.entityLabel'),
        })}
        confirmText={t('modal.delete.confirmCta')}
        cancelText={t('modal.cancel')}
        loading={updateMutation.isPending}
        // All close reasons (Esc / backdrop / X / Cancel) are treated as cancel —
        // never deactivate on close. The edit modal stays open underneath.
        onClose={() => {
          setConfirmDeleteOpen(false);
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      {mode === 'edit' && initialData?.activo === false && (
        <Dialog
          open={isReactivateDialogOpen}
          onClose={() => {
            setIsReactivateDialogOpen(false);
          }}
          type="success"
          showCancel
          title={t('modal.reactivate.label')}
          message={`¿Seguro que quieres reactivar a ${initialData.nombre}? Podrá volver a operar en el sistema.`}
          confirmText={t('modal.reactivate.label')}
          cancelText={t('modal.cancel')}
          loading={updateMutation.isPending}
          onConfirm={() => {
            void handleReactivate();
          }}
          onCancel={() => {
            setIsReactivateDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
