/**
 * CitaModal — create / edit an appointment.
 *
 * Mirrors the TerapeutaModal precedent: `useActionState` form, `TFormState`
 * success/error shape, `useToast`, Zod parse. All cita mutations route through
 * the Pass-1 hooks (useCreateCita / useRescheduleCita) which call the domain
 * service — overlap and schedule rules are enforced server-side, this modal
 * only collects + pre-filters.
 *
 * Key invariants (Analyst §4–5, Designer §1.4 / §3.1):
 *  - End time is DERIVED from servicio.duracionMinutos and read-only (edge #2).
 *  - Start time is a Select of AvailabilityService slots (no free time field).
 *  - Price is display-only (calculateFinalPrice) — not a form field, not stored.
 *  - States: loading-options, options-empty, validating, submitting,
 *    submit-success, submit-error-rule, submit-error-network, edit-prefilling.
 */

import { useState, useEffect, useActionState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@infra/components/ui/common/Modal';
import { Button } from '@infra/components/ui/common/Button';
import { FormField } from '@infra/components/ui/common/FormField';
import { Select } from '@infra/components/ui/common/Select';
import { DatePicker } from '@infra/components/ui/common/DatePicker';
import { Textarea } from '@infra/components/ui/common/Textarea';
import { Avatar } from '@infra/components/ui/common/Avatar';
import { Empty } from '@infra/components/ui/common/Empty';
import { Spinner } from '@infra/components/ui/common/Spinner';
import { useToast } from '@infra/components/ui/common/Toast';
import { useCentrosActivos } from '@infra/hooks/useCentrosActivos';
import { useClientesActivos } from '@infra/hooks/useClientesActivos';
import { useServiciosActivosCentro } from '@infra/hooks/useServiciosActivosCentro';
import { useSalasActivas } from '@infra/hooks/useSalasActivas';
import { useCentroMasajistas } from '@infra/hooks/useCentroMasajistas';
import { useTherapistAvailability } from '@infra/hooks/useTherapistAvailability';
import { useCitaById } from '@infra/hooks/useCitaById';
import { useCreateCita } from '@infra/hooks/useCreateCita';
import { useRescheduleCita } from '@infra/hooks/useRescheduleCita';
import { useChangeCitaEstado } from '@infra/hooks/useChangeCitaEstado';
import { citaService } from '@infra/services/agendaServices';
import { legalNextEstados, isTerminalEstado, DomainError } from '@domain/index';
import { citaCreateSchema, citaEditSchema } from '@app/schemas/cita.schema';
import type { TCentroId, TClienteId, TCitaId, TEstadoCita, TUserId } from '@domain/types';
import * as S from './CitaModal.styles';

// ── Types ─────────────────────────────────────────────────────────────────────

type TCitaModalAction = 'created' | 'updated';

export interface ICitaModalPrefill {
  readonly usuarioId?: TUserId;
  readonly fecha?: string;
  readonly horaInicio?: string;
  /** Pre-seleccionar cliente en el formulario de nueva cita (ej. desde ClientesPage). */
  readonly clienteId?: TClienteId;
}

export interface ICitaModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess: (action: TCitaModalAction, clienteName: string) => void;
  readonly mode: 'create' | 'edit';
  readonly centroId: TCentroId;
  /** Edit mode: the cita being edited (its values pre-fill the form). */
  readonly citaId?: TCitaId;
  /** Create mode: optional empty-slot pre-fill (therapist + start). */
  readonly prefill?: ICitaModalPrefill;
  /**
   * Presentation surface. `'modal'` (default) renders the self-contained dialog
   * with its own backdrop/focus-trap/close. `'inline'` renders ONLY the form
   * body + a flat action footer inside a plain pane (no dialog chrome), so a
   * host overlay can embed it without nesting a dialog inside a dialog
   * (WCAG 2.1.2). Retro-compatible: omitting the prop keeps the modal behaviour.
   */
  readonly presentation?: 'modal' | 'inline';
  /**
   * Fired the first time the user changes ANY field after the form is open —
   * never fired by the prefill/edit-sync effects (props → state syncs are not
   * "user input"). Lets a hosting surface (e.g. AgendaCalendarOverlay, which
   * remounts this modal via a `key` change when the kanban selection changes)
   * warn before silently discarding in-progress input.
   */
  readonly onDirty?: () => void;
}

type TFormState =
  | { status: 'success'; action: TCitaModalAction; clienteName: string; isSinAsignar: boolean }
  | { status: 'error'; kind: 'rule' | 'network'; message: string }
  | null;

// ── Helpers ─────────────────────────────────────────────────────────────────────

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Error de validación';
}

/** Builds a local Date from a YYYY-MM-DD date string + HH:MM time string. */
function buildLocalDate(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00`);
}

/** Formats a Date to a HH:MM wall-clock string. */
function toHoraString(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/** Formats a Date to a YYYY-MM-DD string (local). */
function toFechaString(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const CitaModal = ({
  open,
  onClose,
  onSuccess,
  mode,
  centroId: propCentroId,
  citaId,
  prefill,
  presentation = 'modal',
  onDirty,
}: ICitaModalProps) => {
  const { t } = useTranslation('agenda');
  const { success: toastSuccess } = useToast();

  // Fires on every genuine field edit (never from the prefill/edit-sync
  // effects below) — see the `onDirty` prop doc.
  const markDirty = () => onDirty?.();

  // ── Controlled field state ────────────────────────────────────────────────
  // The centro is a controlled field on create (it scopes servicio/sala/masajista);
  // it seeds from the active centro (prop) and is read-only on edit.
  const [centroId, setCentroId] = useState<TCentroId | null>(propCentroId);
  const [clienteId, setClienteId] = useState<string>('');
  const [servicioId, setServicioId] = useState<string>('');
  const [usuarioId, setUsuarioId] = useState<string>('');
  const [salaId, setSalaId] = useState<string>('');
  const [fecha, setFecha] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [estado, setEstado] = useState<string>('');
  const [priceLabel, setPriceLabel] = useState<string | null>(null);

  // ── Data hooks (pickers) ────────────────────────────────────────────────────
  // Centro picker: ALL active centros — superadmin/recepcionista manage citas
  // across any centro, not just the ones they're personally assigned to.
  const { data: centros = [], isLoading: centrosLoading } = useCentrosActivos();
  const { clientes, isLoading: clientesLoading } = useClientesActivos(open);
  const { servicios, isLoading: serviciosLoading } = useServiciosActivosCentro(
    open ? centroId : null,
  );
  const { salas, isLoading: salasLoading } = useSalasActivas(open ? centroId : null);
  const { masajistas, isLoading: masajistasLoading } = useCentroMasajistas(open ? centroId : null);

  // ── Edit prefill ─────────────────────────────────────────────────────────────
  const { cita: editingCita, isLoading: citaLoading } = useCitaById(
    mode === 'edit' && open ? (citaId ?? null) : null,
  );

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useCreateCita();
  const rescheduleMutation = useRescheduleCita();
  const changeEstadoMutation = useChangeCitaEstado();

  // ── Derived values ───────────────────────────────────────────────────────────
  const selectedServicio = servicios.find((s) => String(s.id) === servicioId) ?? null;
  const duracionMinutos = selectedServicio?.duracionMinutos ?? null;

  const {
    slots,
    isLoading: slotsLoading,
    isError: slotsError,
    hadSchedule,
  } = useTherapistAvailability({
    usuarioId: usuarioId !== '' ? Number(usuarioId) : null,
    centroId: open ? centroId : null,
    fecha: fecha !== '' ? fecha : null,
    duracionMinutos,
    salaId: salaId !== '' ? Number(salaId) : null,
    excludeCitaId: mode === 'edit' ? citaId : undefined,
  });

  const optionsLoading =
    centrosLoading || clientesLoading || serviciosLoading || salasLoading || masajistasLoading;
  const prefilling = mode === 'edit' && citaLoading;

  // Which prerequisite option sets are empty (only meaningful once loaded).
  // cliente, masajista and sala are optional — their absence never blocks the form.
  const missingClientes = !clientesLoading && clientes.length === 0;
  const missingServicios = !serviciosLoading && servicios.length === 0;
  const missingSalas = !salasLoading && salas.length === 0;
  const missingMasajistas = !masajistasLoading && masajistas.length === 0;
  // Only a missing service catalogue is a true blocker — everything else is optional.
  const allPrereqsMissing = !optionsLoading && missingServicios;

  // Derived end time from start + service duration (read-only display).
  const derivedEnd =
    horaInicio !== '' && duracionMinutos !== null && fecha !== ''
      ? toHoraString(
          new Date(buildLocalDate(fecha, horaInicio).getTime() + duracionMinutos * 60_000),
        )
      : null;

  // Block picking past days in create mode (same-day stays allowed for walk-in
  // logging); editing an existing cita keeps any date.
  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  // ── Option lists ─────────────────────────────────────────────────────────────
  const centroOptions = centros.map((c) => ({
    value: String(c.id),
    label: c.nombre,
  }));
  // Edit mode: the centro is read-only — resolve its display name and guarantee it
  // is present as an option so the disabled Select renders the label (not the placeholder).
  const editCentroName = centros.find((c) => c.id === centroId)?.nombre ?? '';
  const centroSelectOptions =
    mode === 'edit' && centroId !== null && !centroOptions.some((o) => o.value === String(centroId))
      ? [...centroOptions, { value: String(centroId), label: editCentroName || String(centroId) }]
      : centroOptions;
  const clienteOptions = clientes.map((c) => ({
    value: String(c.id),
    label: `${c.nombre} ${c.apellidos}`.trim(),
    description: c.telefono,
  }));
  const servicioOptions = servicios.map((sv) => ({
    value: String(sv.id),
    label: sv.nombre,
    description: t('modal.cita.horaFin.value', {
      end: '',
      duration: sv.duracionMinutos,
    }).replace('· ', ''),
  }));
  const masajistaOptions = masajistas.map((m) => ({
    value: String(m.id),
    label: m.nombre,
    icon: <Avatar name={m.nombre} size="xs" />,
  }));
  const salaOptions = salas.map((sl) => ({
    value: String(sl.id),
    label: sl.nombre,
  }));
  const slotOptions = slots.map((slot) => {
    const hhmm = toHoraString(slot.start);
    return { value: hhmm, label: hhmm };
  });

  // ── Reset / prefill on open ──────────────────────────────────────────────────
  const resetState = () => {
    setCentroId(propCentroId);
    setClienteId('');
    setServicioId('');
    setUsuarioId('');
    setSalaId('');
    setFecha('');
    setHoraInicio('');
    setObservaciones('');
    setEstado('');
    setPriceLabel(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Seed the controlled centro from the active-centro prop each time the modal
  // opens (props → controlled field sync — the canonical valid use of an effect).
  // On create the user may then change it; on edit it stays read-only.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync prop → controlled field
    setCentroId(propCentroId);
  }, [open, propCentroId]);

  // Apply create-mode empty-slot prefill (therapist + date + start time).
  // Mirrors props into the controlled form fields — a deliberate external→React
  // sync (the canonical valid use of an effect per the React docs).
  useEffect(() => {
    if (!open || mode !== 'create' || !prefill) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync props → controlled fields
    if (prefill.usuarioId !== undefined) setUsuarioId(String(prefill.usuarioId));
    if (prefill.fecha !== undefined) setFecha(prefill.fecha);
    if (prefill.horaInicio !== undefined) setHoraInicio(prefill.horaInicio);
    if (prefill.clienteId !== undefined) setClienteId(String(prefill.clienteId));
  }, [open, mode, prefill]);

  // Apply edit-mode prefill once the cita resolves from React Query (external
  // store) into the controlled form fields — the documented sync exception.
  useEffect(() => {
    if (mode !== 'edit' || !open || !editingCita) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync server data → controlled fields
    setClienteId(editingCita.clienteId != null ? String(editingCita.clienteId) : '');
    setServicioId(String(editingCita.servicioId));
    setUsuarioId(editingCita.usuarioId != null ? String(editingCita.usuarioId) : '');
    setSalaId(editingCita.salaId != null ? String(editingCita.salaId) : '');
    setFecha(toFechaString(editingCita.fechaHoraInicio));
    setHoraInicio(toHoraString(editingCita.fechaHoraInicio));
    setObservaciones(editingCita.notas ?? '');
    setEstado(editingCita.estado);
  }, [mode, open, editingCita]);

  // ── Price preview (display-only) ─────────────────────────────────────────────
  // Async derive: resets to null then fills from the service. setState lives in
  // the promise callbacks; the synchronous reset clears a stale price first.
  useEffect(() => {
    if (!open || servicioId === '' || centroId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale price when no service/centro
      setPriceLabel(null);
      return;
    }
    let cancelled = false;
    setPriceLabel(null);
    void citaService
      .calculateFinalPrice(Number(servicioId), centroId)
      .then((money) => {
        if (!cancelled) setPriceLabel(money.format());
      })
      .catch(() => {
        if (!cancelled) setPriceLabel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, servicioId, centroId]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const formAction = async (_prev: TFormState, _formData: FormData): Promise<TFormState> => {
    // Centro is required to create — surface an i18n message before schema parse.
    if (mode === 'create' && centroId === null) {
      return { status: 'error', kind: 'rule', message: t('modal.cita.centro.required') };
    }
    // The therapist picker is already scoped to the selected centro
    // (useCentroMasajistas), but a stale prefill/edit value can still point at
    // a therapist from another centro — catch it before hitting the network
    // with the same rule the domain layer enforces (CitaService rule 4).
    if (
      usuarioId !== '' &&
      !masajistasLoading &&
      !masajistas.some((m) => String(m.id) === usuarioId)
    ) {
      return { status: 'error', kind: 'rule', message: t('modal.cita.therapist.centroMismatch') };
    }

    const raw = {
      // Centro — required on create, stripped by the (base) edit schema.
      centroId: centroId ?? NaN,
      // Optional — pass null when not selected so schema .nullish() accepts them.
      clienteId: clienteId !== '' ? Number(clienteId) : null,
      usuarioId: usuarioId !== '' ? Number(usuarioId) : null,
      salaId: salaId !== '' ? Number(salaId) : null,
      // Required.
      servicioId: servicioId !== '' ? Number(servicioId) : NaN,
      fecha,
      horaInicio,
      observaciones: observaciones !== '' ? observaciones : undefined,
    };

    const schema = mode === 'create' ? citaCreateSchema : citaEditSchema;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return { status: 'error', kind: 'rule', message: firstIssueMessage(parsed.error) };
    }
    if (duracionMinutos === null) {
      return { status: 'error', kind: 'rule', message: t('modal.cita.servicio.placeholder') };
    }

    const inicio = buildLocalDate(parsed.data.fecha, parsed.data.horaInicio);
    const fin = new Date(inicio.getTime() + duracionMinutos * 60_000);
    const clienteName = clienteOptions.find((o) => o.value === clienteId)?.label ?? '';
    const isSinAsignar =
      parsed.data.clienteId == null || parsed.data.usuarioId == null || parsed.data.salaId == null;

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          clienteId: parsed.data.clienteId ?? null,
          usuarioId: parsed.data.usuarioId ?? null,
          // Guarded non-null above; fall back to the active-centro prop for the type-checker.
          centroId: centroId ?? propCentroId,
          salaId: parsed.data.salaId ?? null,
          servicioId: parsed.data.servicioId,
          fechaHoraInicio: inicio,
          fechaHoraFin: fin,
          notas: parsed.data.observaciones,
        });
        return { status: 'success', action: 'created', clienteName, isSinAsignar };
      }
      if (citaId === undefined) {
        return { status: 'error', kind: 'rule', message: t('modal.cita.idRequired') };
      }
      await rescheduleMutation.mutateAsync({
        citaId,
        changes: {
          clienteId: parsed.data.clienteId ?? null,
          usuarioId: parsed.data.usuarioId ?? null,
          salaId: parsed.data.salaId ?? null,
          servicioId: parsed.data.servicioId,
          fechaHoraInicio: inicio,
          fechaHoraFin: fin,
          notas: parsed.data.observaciones,
        },
      });
      if (estado !== '' && editingCita !== null && estado !== editingCita.estado) {
        await changeEstadoMutation.mutateAsync({ citaId, estado: estado as TEstadoCita });
      }
      return { status: 'success', action: 'updated', clienteName, isSinAsignar };
    } catch (err) {
      // BusinessRuleViolation / ValidationError carry a domain message; anything
      // else is treated as a transport/network error with a retry affordance.
      const name = err instanceof Error ? err.name : '';
      const isRule = name === 'BusinessRuleViolation' || name === 'ValidationError';
      // CitaService rule 4 (therapist must be assigned to centro) has a friendlier
      // client-facing message than the raw domain string.
      const isTherapistCentroMismatch =
        err instanceof DomainError && err.code === 'USUARIO_NOT_ASSIGNED_TO_CENTRO';
      return {
        status: 'error',
        kind: isRule ? 'rule' : 'network',
        message: isTherapistCentroMismatch
          ? t('modal.cita.therapist.centroMismatch')
          : isRule && err instanceof Error
            ? err.message
            : t('modal.cita.errorNetwork'),
      };
    }
  };

  const [state, dispatch, isPending] = useActionState<TFormState, FormData>(formAction, null);

  useEffect(() => {
    if (state?.status !== 'success') return;
    const toastKey =
      state.action === 'created'
        ? state.isSinAsignar
          ? 'toast.citaSinAsignarCreada'
          : 'toast.created'
        : 'toast.updated';
    toastSuccess(t(toastKey));
    onSuccess(state.action, state.clienteName);
    // Close via the parent callback only — the parent unmounts this modal, which
    // discards local field state, so no local reset (setState) runs in the effect.
    onClose();
    // Effect reacts to the terminal success transition only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ── Estado selector (edit mode) ──────────────────────────────────────────────
  const currentEstado = estado !== '' ? (estado as TEstadoCita) : null;
  const estadoOptions =
    currentEstado !== null
      ? [
          { value: currentEstado, label: t(`estado.${currentEstado}`) },
          ...legalNextEstados(currentEstado).map((s) => ({ value: s, label: t(`estado.${s}`) })),
        ]
      : [];
  const isTerminalCurrentEstado = currentEstado !== null && isTerminalEstado(currentEstado);

  // ── Render gating ─────────────────────────────────────────────────────────────
  const fieldsDisabled = isPending || prefilling;
  // Slots only need a service + date; masajista/sala are optional and refine the results.
  const slotFieldDisabled = fieldsDisabled || servicioId === '' || fecha === '';
  const submitDisabled = isPending || prefilling || optionsLoading || allPrereqsMissing;

  // Slot-field state taxonomy (Designer §4.4). Only meaningful once the field is
  // enabled and not loading. `error` locks the field (a failed availability check
  // must not look like "no slots"); `noScheduleFallback` keeps it usable (the
  // service returned the full open–close grid because no window applied that day,
  // which is distinct from ready-empty = worked-but-booked).
  const slotReady = !slotFieldDisabled && !slotsLoading;
  const slotErrorState = slotReady && slotsError;
  // `hadSchedule=false` covers TWO distinct situations the copy must tell
  // apart: no masajista picked at all (generic 10:00–20:00 window) vs. a
  // picked masajista with no active window that day (full open–close grid).
  const slotNoTherapistFallback =
    slotReady && !slotsError && !hadSchedule && usuarioId === '' && slotOptions.length > 0;
  const slotNoScheduleFallback =
    slotReady && !slotsError && !hadSchedule && usuarioId !== '' && slotOptions.length > 0;

  const title = mode === 'create' ? t('modal.cita.createTitle') : t('modal.cita.editTitle');
  const submitLabel = mode === 'create' ? t('modal.cita.submitCreate') : t('modal.cita.submitEdit');

  const errorBanner =
    state?.status === 'error' ? (
      <S.StyledFormBanner role="alert" tabIndex={-1}>
        <S.StyledFormBannerText>{state.message}</S.StyledFormBannerText>
        {state.kind === 'network' && (
          <S.StyledBannerRetry type="submit" form="cita-form">
            {t('modal.cita.retry')}
          </S.StyledBannerRetry>
        )}
      </S.StyledFormBanner>
    ) : null;

  // ── Reusable body + actions (shared by modal + inline presentations) ─────────
  const body = allPrereqsMissing ? (
    <Empty
      preset="no-results"
      title={t('modal.cita.missingPrereqsTitle')}
      description={t('modal.cita.missingPrereqsDescription')}
    />
  ) : (
    <form id="cita-form" action={dispatch}>
      <S.StyledCitaFormGrid>
        {errorBanner}

        <FormField
          id="cita-centro"
          label={t('modal.cita.centro.label')}
          required={mode === 'create'}
        >
          {(ctrl) => (
            <Select
              id={ctrl.id}
              value={centroId !== null ? String(centroId) : ''}
              onChange={(v) => {
                markDirty();
                setCentroId(v !== '' ? Number(v) : null);
                // Changing centro invalidates the dependent selections (they belong
                // to the previous centro); the pickers re-scope on the new centroId.
                setServicioId('');
                setSalaId('');
                setUsuarioId('');
                setHoraInicio('');
              }}
              options={centroSelectOptions}
              placeholder={
                centrosLoading
                  ? t('modal.cita.loadingOptions')
                  : centroOptions.length === 0
                    ? t('modal.cita.centro.empty')
                    : t('modal.cita.centro.placeholder')
              }
              disabled={mode === 'edit' || fieldsDisabled || centrosLoading}
              required={mode === 'create'}
            />
          )}
        </FormField>

        <FormField
          id="cita-cliente"
          label={
            <>
              {t('modal.cita.cliente.label')}
              <S.StyledOptionalHint>{t('modal.cita.observaciones.optional')}</S.StyledOptionalHint>
            </>
          }
        >
          {(ctrl) => (
            <>
              <Select
                id={ctrl.id}
                value={clienteId}
                onChange={(v) => {
                  markDirty();
                  setClienteId(v);
                }}
                options={clienteOptions}
                searchable
                placeholder={
                  clientesLoading
                    ? t('modal.cita.loadingOptions')
                    : missingClientes
                      ? t('modal.cita.cliente.empty')
                      : t('modal.cita.cliente.placeholder')
                }
                disabled={fieldsDisabled || clientesLoading}
              />
            </>
          )}
        </FormField>

        <S.StyledFormRow>
          <FormField id="cita-servicio" label={t('modal.cita.servicio.label')} required>
            {(ctrl) => (
              <>
                <Select
                  id={ctrl.id}
                  value={servicioId}
                  onChange={(v) => {
                    markDirty();
                    setServicioId(v);
                    setHoraInicio('');
                  }}
                  options={servicioOptions}
                  placeholder={
                    serviciosLoading
                      ? t('modal.cita.loadingOptions')
                      : missingServicios
                        ? t('modal.cita.servicio.empty')
                        : t('modal.cita.servicio.placeholder')
                  }
                  disabled={fieldsDisabled || serviciosLoading || missingServicios}
                  required
                />
                {missingServicios && (
                  <S.StyledFormHint>{t('modal.cita.servicio.hint')}</S.StyledFormHint>
                )}
              </>
            )}
          </FormField>

          <FormField
            id="cita-therapist"
            label={
              <>
                {t('modal.cita.therapist.label')}
                <S.StyledOptionalHint>
                  {t('modal.cita.observaciones.optional')}
                </S.StyledOptionalHint>
              </>
            }
          >
            {(ctrl) => (
              <Select
                id={ctrl.id}
                value={usuarioId}
                onChange={(v) => {
                  markDirty();
                  setUsuarioId(v);
                  setHoraInicio('');
                }}
                options={masajistaOptions}
                placeholder={
                  masajistasLoading
                    ? t('modal.cita.loadingOptions')
                    : missingMasajistas
                      ? t('modal.cita.therapist.empty')
                      : t('modal.cita.therapist.placeholder')
                }
                disabled={fieldsDisabled || masajistasLoading}
              />
            )}
          </FormField>
        </S.StyledFormRow>

        {/* ROW 2 — Fecha + Sala: the remaining prerequisites that gate the
                  start-time field. Sala precedes Hora (source + visual order) so
                  every input unlocking Hora is reached before it (Designer §1.1). */}
        <S.StyledFormRow>
          <FormField id="cita-fecha" label={t('modal.cita.fecha.label')} required>
            {(ctrl) => (
              <DatePicker
                name="fecha"
                min={mode === 'create' ? minDate : undefined}
                value={fecha !== '' ? new Date(`${fecha}T00:00:00`) : null}
                onChange={(d) => {
                  markDirty();
                  setFecha(d ? toFechaString(d) : '');
                  setHoraInicio('');
                }}
                placeholder={t('modal.cita.fecha.placeholder')}
                disabled={fieldsDisabled}
                required
                aria-describedby={ctrl['aria-describedby']}
              />
            )}
          </FormField>

          <FormField
            id="cita-sala"
            label={
              <>
                {t('modal.cita.sala.label')}
                <S.StyledOptionalHint>
                  {t('modal.cita.observaciones.optional')}
                </S.StyledOptionalHint>
              </>
            }
          >
            {(ctrl) => (
              <Select
                id={ctrl.id}
                value={salaId}
                onChange={(v) => {
                  markDirty();
                  setSalaId(v);
                  setHoraInicio('');
                }}
                options={salaOptions}
                placeholder={
                  salasLoading
                    ? t('modal.cita.loadingOptions')
                    : missingSalas
                      ? t('modal.cita.sala.empty')
                      : t('modal.cita.sala.placeholder')
                }
                disabled={fieldsDisabled || salasLoading}
              />
            )}
          </FormField>
        </S.StyledFormRow>

        {/* ROW 3 — Hora de inicio + derived end time (cause beside effect). */}
        <S.StyledFormRow>
          <FormField id="cita-hora" label={t('modal.cita.horaInicio.label')} required>
            {(ctrl) => (
              <>
                <Select
                  id={ctrl.id}
                  value={horaInicio}
                  onChange={(v) => {
                    markDirty();
                    setHoraInicio(v);
                  }}
                  options={slotOptions}
                  placeholder={
                    slotFieldDisabled
                      ? t('modal.cita.horaInicio.needsFields')
                      : slotsLoading
                        ? t('modal.cita.horaInicio.loading')
                        : slotErrorState
                          ? t('modal.cita.horaInicio.error')
                          : slotOptions.length === 0
                            ? t('modal.cita.horaInicio.empty')
                            : t('modal.cita.horaInicio.placeholder')
                  }
                  disabled={slotFieldDisabled || slotsLoading || slotErrorState}
                  required
                />
                {!slotFieldDisabled && slotsLoading && (
                  <S.StyledValidatingNote aria-live="polite">
                    <Spinner size="xs" />
                    {t('modal.cita.validating')}
                  </S.StyledValidatingNote>
                )}
                {/* No-schedule fallback: field is USABLE (full grid). A
                          distinct status line so a non-visual user knows WHY the
                          list is the full open–close grid, not a restricted
                          window — and so it is not confused with ready-empty. */}
                {slotNoTherapistFallback && (
                  <S.StyledSlotStatus aria-live="polite">
                    {t('modal.cita.horaInicio.noTherapistFallback')}
                  </S.StyledSlotStatus>
                )}
                {slotNoScheduleFallback && (
                  <S.StyledSlotStatus aria-live="polite">
                    {t('modal.cita.horaInicio.noSchedule')}
                  </S.StyledSlotStatus>
                )}
              </>
            )}
          </FormField>

          <S.StyledDerivedField>
            <S.StyledDerivedLabel id="cita-fin-label">
              {t('modal.cita.horaFin.label')}
            </S.StyledDerivedLabel>
            <S.StyledDerivedValue aria-live="polite" aria-labelledby="cita-fin-label">
              {derivedEnd !== null && duracionMinutos !== null
                ? t('modal.cita.horaFin.value', {
                    end: derivedEnd,
                    duration: duracionMinutos,
                  })
                : t('modal.cita.horaFin.pending')}
            </S.StyledDerivedValue>
          </S.StyledDerivedField>
        </S.StyledFormRow>

        <S.StyledPriceSummary>
          <S.StyledPriceLabel>{t('modal.cita.precio.label')}</S.StyledPriceLabel>
          <S.StyledPriceValue>
            {priceLabel ?? (servicioId !== '' ? t('modal.cita.precio.loading') : '—')}
          </S.StyledPriceValue>
        </S.StyledPriceSummary>

        <FormField
          id="cita-observaciones"
          label={
            <>
              {t('modal.cita.observaciones.label')}
              <S.StyledOptionalHint>{t('modal.cita.observaciones.optional')}</S.StyledOptionalHint>
            </>
          }
        >
          {(ctrl) => (
            <Textarea
              id={ctrl.id}
              name="observaciones"
              value={observaciones}
              onChange={(e) => {
                markDirty();
                setObservaciones(e.target.value);
              }}
              placeholder={t('modal.cita.observaciones.placeholder')}
              disabled={fieldsDisabled}
              rows={3}
            />
          )}
        </FormField>

        {mode === 'edit' && currentEstado !== null && (
          <FormField id="cita-estado" label={t('modal.cita.estado.label')}>
            {(ctrl) => (
              <>
                <Select
                  id={ctrl.id}
                  value={estado}
                  onChange={(v) => {
                    markDirty();
                    setEstado(v);
                  }}
                  options={estadoOptions}
                  disabled={fieldsDisabled || isTerminalCurrentEstado}
                />
                {isTerminalCurrentEstado && (
                  <S.StyledFormHint>{t('modal.cita.estado.terminal')}</S.StyledFormHint>
                )}
              </>
            )}
          </FormField>
        )}
      </S.StyledCitaFormGrid>
    </form>
  );

  const actions = (
    <>
      <Button
        variant="ghost"
        color="neutral"
        type="button"
        disabled={isPending}
        onClick={handleClose}
      >
        {t('modal.cita.cancel')}
      </Button>
      <Button
        variant="solid"
        color="primary"
        type="submit"
        form="cita-form"
        loading={isPending}
        disabled={submitDisabled}
      >
        {submitLabel}
      </Button>
    </>
  );

  // ── Inline presentation: flat pane, no dialog chrome (WCAG 2.1.2) ─────────────
  if (presentation === 'inline') {
    return (
      <S.StyledFormPane>
        <S.StyledFormSectionTitle id="cita-inline-title">{title}</S.StyledFormSectionTitle>
        {body}
        <S.StyledInlineActions>{actions}</S.StyledInlineActions>
      </S.StyledFormPane>
    );
  }

  // ── Modal presentation (default, retro-compatible) ────────────────────────────
  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      position="center"
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <Modal.Header title={title} showCloseButton onClose={handleClose} />
      <Modal.Body padding="md" scrollable>
        {body}
      </Modal.Body>
      <Modal.Footer align="right">
        <S.StyledFooterRight>{actions}</S.StyledFooterRight>
      </Modal.Footer>
    </Modal>
  );
};
