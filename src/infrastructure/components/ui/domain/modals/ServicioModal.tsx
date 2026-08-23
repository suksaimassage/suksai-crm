import { useState, useEffect, useActionState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '@infra/components/ui/common/Modal';
import { Button } from '@infra/components/ui/common/Button';
import { FormField } from '@infra/components/ui/common/FormField';
import { Input } from '@infra/components/ui/common/Input';
import { Checkbox } from '@infra/components/ui/common/Checkbox';
import { CentroCheckboxList } from '@infra/components/ui/common/CentroCheckboxList';
import { Dialog } from '@infra/components/ui/common/Dialog';
import { useTipoServicios } from '@infra/hooks/useTipoServicios';
import { useCentrosActivos } from '@infra/hooks/useCentrosActivos';
import { useServicioCentros } from '@infra/hooks/useServicioCentros';
import { useCreateServicio } from '@infra/hooks/useCreateServicio';
import { useUpdateServicio } from '@infra/hooks/useUpdateServicio';
import { useDeleteServicio } from '@infra/hooks/useDeleteServicio';
import { servicioCreateSchema, servicioUpdateSchema } from '@app/schemas/servicio.schema';
import type { TServicioId, TCentroId } from '@domain/types';
import type { IServicio } from '@domain/models';
import * as S from './EntityModal.styles';
import styled from 'styled-components';

const StyledSelect = styled.select`
  width: 100%;
  height: 40px;
  padding: 0 ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) => theme.color.background.card};
  color: ${({ theme }) => theme.color.text.primary};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ── Types ─────────────────────────────────────────────────────────────────────

type TModalAction = 'created' | 'updated' | 'deleted';

export interface IServicioModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess: (action: TModalAction) => void;
  readonly mode: 'create' | 'edit';
  readonly servicioId?: TServicioId;
  readonly initialData?: IServicio;
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

export const ServicioModal = ({
  open,
  onClose,
  onSuccess,
  mode,
  servicioId,
  initialData,
}: IServicioModalProps) => {
  const { t } = useTranslation('rituales');
  const qc = useQueryClient();

  const { tipoServicios } = useTipoServicios();
  const { data: centros = [], isLoading: centrosLoading } = useCentrosActivos();
  const { data: existingCentroIds = [] } = useServicioCentros(
    mode === 'edit' ? servicioId : undefined,
  );

  // User-modified centro selection. Empty means "not yet changed by user" —
  // in that case, fall back to existingCentroIds loaded by React Query.
  const [userSelectedCentroIds, setUserSelectedCentroIds] = useState<readonly TCentroId[]>([]);
  const [hasUserChangedCentros, setHasUserChangedCentros] = useState(false);
  const selectedCentroIds = hasUserChangedCentros ? userSelectedCentroIds : existingCentroIds;

  // initialData-derived booleans — initialized once; modal is remounted when initialData changes
  const [esBono, setEsBono] = useState(initialData?.esBono ?? false);
  const [tieneDescuento, setTieneDescuento] = useState(initialData?.tieneDescuento ?? false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const createMutation = useCreateServicio();
  const updateMutation = useUpdateServicio();
  const deleteMutation = useDeleteServicio();

  const handleClose = () => {
    setIsDeleteDialogOpen(false);
    onClose();
  };

  const handleCentroChange = (ids: readonly TCentroId[]) => {
    setHasUserChangedCentros(true);
    setUserSelectedCentroIds(ids);
  };

  const formAction = async (_prev: TFormState, formData: FormData): Promise<TFormState> => {
    const raw = {
      nombre: formData.get('nombre') as string,
      tipoServicioId: Number(formData.get('tipoServicioId')),
      duracionMinutos: Number(formData.get('duracionMinutos')),
      precioBase: formData.get('precioBase') as string,
      esBono,
      sesionesTotales: esBono ? Number(formData.get('sesionesTotales')) : undefined,
      tieneDescuento,
      porcentajeDescuento: tieneDescuento ? Number(formData.get('porcentajeDescuento')) : undefined,
      centroIds: [...selectedCentroIds],
    };

    try {
      if (mode === 'create') {
        const parsed = servicioCreateSchema.safeParse(raw);
        if (!parsed.success) {
          return {
            status: 'error',
            message: firstIssueMessage(parsed.error),
          };
        }
        const precioBase = parseFloat(parsed.data.precioBase.replace(',', '.'));
        await createMutation.mutateAsync({
          dto: {
            nombre: parsed.data.nombre,
            tipoServicioId: parsed.data.tipoServicioId,
            duracionMinutos: parsed.data.duracionMinutos,
            precioBase,
            esBono: parsed.data.esBono,
            sesionesTotales: parsed.data.sesionesTotales,
            tieneDescuento: parsed.data.tieneDescuento,
            porcentajeDescuento: parsed.data.porcentajeDescuento,
          },
          centroIds: parsed.data.centroIds,
        });
        return { status: 'success', action: 'created' };
      } else {
        if (servicioId === undefined) return { status: 'error', message: 'ID requerido' };
        const parsed = servicioUpdateSchema.safeParse(raw);
        if (!parsed.success) {
          return {
            status: 'error',
            message: firstIssueMessage(parsed.error),
          };
        }
        const precioBase =
          parsed.data.precioBase !== undefined
            ? parseFloat(parsed.data.precioBase.replace(',', '.'))
            : undefined;
        await updateMutation.mutateAsync({
          id: servicioId,
          dto: {
            nombre: parsed.data.nombre,
            duracionMinutos: parsed.data.duracionMinutos,
            precioBase,
            esBono: parsed.data.esBono,
            sesionesTotales: parsed.data.sesionesTotales,
            tieneDescuento: parsed.data.tieneDescuento,
            porcentajeDescuento: parsed.data.porcentajeDescuento,
          },
          centroIds: parsed.data.centroIds ?? selectedCentroIds,
          previousCentroIds: existingCentroIds,
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
      void qc.invalidateQueries({ queryKey: ['servicios'] });
      onSuccess(state.action);
      onClose();
    }
  }, [state, onSuccess, qc, onClose]);

  const handleDelete = async () => {
    if (servicioId === undefined) return;
    try {
      await deleteMutation.mutateAsync(servicioId);
      setIsDeleteDialogOpen(false);
      onSuccess('deleted');
      handleClose();
    } catch {
      // silent — error shown via mutation state
    }
  };

  const precioToDisplay = (precio: number): string => precio.toFixed(2).replace('.', ',');

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
          <form id="servicio-form" action={dispatch}>
            <S.StyledFormGrid>
              {state?.status === 'error' && (
                <S.StyledErrorBanner role="alert">
                  <S.StyledErrorBannerText>{state.message}</S.StyledErrorBannerText>
                </S.StyledErrorBanner>
              )}

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

              <S.StyledFormRow>
                <FormField id="tipoServicioId" label={t('form.tipoServicio.label')} required>
                  {(ctrl) => (
                    <StyledSelect
                      id={ctrl.id}
                      name="tipoServicioId"
                      defaultValue={String(initialData?.tipoServicioId ?? '')}
                      disabled={isPending}
                      aria-required={ctrl['aria-required']}
                      aria-invalid={ctrl['aria-invalid']}
                      aria-describedby={ctrl['aria-describedby']}
                    >
                      <option value="">{t('form.tipoServicio.placeholder')}</option>
                      {tipoServicios.map((ts) => (
                        <option key={ts.id} value={String(ts.id)}>
                          {ts.nombre}
                        </option>
                      ))}
                    </StyledSelect>
                  )}
                </FormField>

                <FormField id="duracionMinutos" label={t('form.duracion.label')} required>
                  {(ctrl) => (
                    <Input
                      {...ctrl}
                      name="duracionMinutos"
                      type="number"
                      min={15}
                      step={5}
                      placeholder="60"
                      defaultValue={String(initialData?.duracionMinutos ?? '')}
                      disabled={isPending}
                    />
                  )}
                </FormField>
              </S.StyledFormRow>

              <FormField id="precioBase" label={t('form.precio.label')} required>
                {(ctrl) => (
                  <Input
                    {...ctrl}
                    name="precioBase"
                    placeholder="0,00"
                    defaultValue={initialData ? precioToDisplay(initialData.precioBase) : ''}
                    disabled={isPending}
                  />
                )}
              </FormField>

              <Checkbox
                label={t('form.esBono.label')}
                checked={esBono}
                onChange={setEsBono}
                disabled={isPending}
              />

              <S.StyledConditionalField $visible={esBono}>
                <FormField
                  id="sesionesTotales"
                  label={t('form.sesionesTotales.label')}
                  required={esBono}
                >
                  {(ctrl) => (
                    <Input
                      {...ctrl}
                      name="sesionesTotales"
                      type="number"
                      min={2}
                      placeholder="10"
                      defaultValue={String(initialData?.sesionesTotales ?? '')}
                      disabled={isPending || !esBono}
                    />
                  )}
                </FormField>
              </S.StyledConditionalField>

              <Checkbox
                label={t('form.tieneDescuento.label')}
                checked={tieneDescuento}
                onChange={setTieneDescuento}
                disabled={isPending}
              />

              <S.StyledConditionalField $visible={tieneDescuento}>
                <FormField
                  id="porcentajeDescuento"
                  label={t('form.porcentajeDescuento.label')}
                  required={tieneDescuento}
                >
                  {(ctrl) => (
                    <Input
                      {...ctrl}
                      name="porcentajeDescuento"
                      type="number"
                      min={1}
                      max={100}
                      placeholder="10"
                      defaultValue={String(initialData?.porcentajeDescuento ?? '')}
                      disabled={isPending || !tieneDescuento}
                    />
                  )}
                </FormField>
              </S.StyledConditionalField>

              <CentroCheckboxList
                centros={centros}
                selected={selectedCentroIds}
                onChange={handleCentroChange}
                isLoading={centrosLoading}
                label={t('form.centros.label')}
              />
            </S.StyledFormGrid>
          </form>
        </Modal.Body>
        <Modal.Footer align="right">
          <S.StyledFooterLeft>
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
                {t('modal.delete.label')}
              </Button>
            )}
          </S.StyledFooterLeft>
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
              form="servicio-form"
              loading={isPending}
              disabled={isPending}
            >
              {submitLabel}
            </Button>
          </S.StyledFooterRight>
        </Modal.Footer>
      </Modal>

      {mode === 'edit' && (
        <Dialog
          open={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
          }}
          type="error"
          showCancel
          title={t('modal.delete.label')}
          message={`¿Seguro que quieres eliminar ${t('modal.delete.entityLabel')}? Esta acción no se puede deshacer.`}
          confirmText={t('modal.delete.label')}
          cancelText={t('modal.cancel')}
          loading={deleteMutation.isPending}
          onConfirm={() => {
            void handleDelete();
          }}
          onCancel={() => {
            setIsDeleteDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
