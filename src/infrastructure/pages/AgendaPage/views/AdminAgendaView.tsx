import React, { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  IAgendaCalendarFilters,
  IAgendaAppointment,
  IAgendaWeekDay,
} from '@domain/models/agenda.models';
import type { TAgendaDateMode, TCentroId, TCitaId, TEstadoCita, TUserId } from '@domain/types';
import { isTerminalEstado } from '@domain/index';
import { useUserStore } from '@app/stores/useUserStore';
import { useDashboardCentroId } from '@infra/hooks/useDashboardCentroId';
import { useCentrosActivos } from '@infra/hooks/useCentrosActivos';
import { useAdminAgendaData } from '@infra/hooks/useAdminAgendaData';
import { useAdminWeekData } from '@infra/hooks/useAdminWeekData';
import { useAdminMonthData } from '@infra/hooks/useAdminMonthData';
import { useServiciosActivosCentro } from '@infra/hooks/useServiciosActivosCentro';
import { useConfirmCita } from '@infra/hooks/useConfirmCita';
import { useChangeCitaEstado } from '@infra/hooks/useChangeCitaEstado';
import { useCancelCita } from '@infra/hooks/useCancelCita';
import { useRescheduleCita } from '@infra/hooks/useRescheduleCita';
import { useToast } from '@infra/components/ui/common/Toast';
import { Empty } from '@infra/components/ui/common/Empty';
import type { ICitaModalPrefill } from '@infra/components/ui/domain/modals';
import { AgendaCalendarOverlay } from '../components/admin/AgendaCalendarOverlay';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { AgendaKpiStrip } from '../components/admin/AgendaKpiStrip';
import { AgendaFilterBar } from '../components/admin/AgendaFilterBar';
import { AgendaCalendarGrid } from '../components/admin/AgendaCalendarGrid';
import { AgendaWeekGrid } from '../components/admin/AgendaWeekGrid';
import type { IWeekRescheduleDrop } from '../components/admin/useWeekCitaDnD';
import type { IDayRescheduleDrop } from '../components/admin/useDayCitaDnD';
import type { IMonthRescheduleDrop } from '../components/admin/useMonthCitaDnD';
import { AgendaRescheduleDialog } from '../components/admin/AgendaRescheduleDialog';
import { AgendaMonthGrid } from '../components/admin/AgendaMonthGrid';
import { AgendaListView } from '../components/admin/AgendaListView';
import { AgendaAdminRail } from '../components/admin/AgendaAdminRail';
import {
  AgendaCancelDialog,
  type TCancelBlockedReason,
} from '../components/admin/AgendaCancelDialog';
import type { IAgendaFilterOption } from '../components/admin/AgendaFilterMenu';
import {
  StyledAdminGrid,
  StyledModeEmptyState,
  StyledNullCentroWrap,
} from './AdminAgendaView.styles';
import { getWeekStart, stepPeriod, getTodayKey } from '@infra/utils/agenda.utils';
import { clusterDayAppointments } from '@infra/utils/agenda.cluster';
import { AGENDA_DAY_START_HOUR } from '../agenda.constants';

// 'sin_asignar' is intentionally excluded: fetchDayCitas filters those citas out
// (they have no therapist column), so selecting that filter would empty the grid.
// Sin_asignar citas are handled separately via the admin rail.
const ESTADO_FILTER_VALUES: readonly TEstadoCita[] = [
  'pendiente',
  'confirmada',
  'en_curso',
  'completada',
  'cancelada',
  'no_presentado',
];

type TModalState =
  | { kind: 'closed' }
  | { kind: 'create'; prefill?: ICitaModalPrefill }
  | { kind: 'edit'; citaId: TCitaId };

/**
 * Self-contained snapshot of a proposed drag & drop reschedule (Surface A,
 * Analyst §3 / E-A8). Captured at drop time so a background `['agenda']` refetch
 * that mutates `weekDays` underneath cannot corrupt the Dialog summary or the
 * mutation payload. Display labels are pre-formatted; the Dates are built from
 * LOCAL parts for the mutation.
 */
interface IPendingReschedule {
  readonly citaId: TCitaId;
  readonly clientName: string;
  readonly serviceName: string;
  readonly fromDateLabel: string;
  readonly fromTime: string;
  readonly toDateLabel: string;
  readonly toTime: string;
  /** Advisory client-detected visual overlap in the target column. */
  readonly showOverlapHint: boolean;
  /** Proposed start/end as LOCAL Dates for the reschedule mutation. */
  readonly fechaHoraInicio: Date;
  readonly fechaHoraFin: Date;
  /**
   * Destination therapist id — day view only, and ONLY set when the drag crossed
   * therapist columns. `undefined` keeps the current assignee (no reassignment).
   * Included in the mutation `changes` (rules 1–10 re-validate the new therapist).
   */
  readonly usuarioId?: TUserId;
  /** Origin therapist display name (day view) → Dialog reassignment row. */
  readonly fromTherapist?: string;
  /** Destination therapist display name (day view) → Dialog reassignment row. */
  readonly toTherapist?: string;
}

export const AdminAgendaView = (): React.ReactElement => {
  const { t, i18n } = useTranslation('agenda');
  const user = useUserStore((s) => s.user);
  const { success: toastSuccess, error: toastError } = useToast();

  const canManageCitas = (user?.roles ?? []).some(
    (r) => r === 'superadmin' || r === 'recepcionista',
  );

  const [filters, setFilters] = useState<IAgendaCalendarFilters>(() => {
    const today = getTodayKey();
    return {
      dateMode: 'day',
      activeDate: today,
      selectedTerapeutas: [],
      selectedServicio: null,
      selectedEstado: null,
      selectedSala: null,
    };
  });

  // Detail popover + lifecycle UI state.
  const [selectedCitaId, setSelectedCitaId] = useState<TCitaId | null>(null);
  // Week-view cluster ("folder") popup — mutually exclusive with selectedCitaId.
  const [openClusterKey, setOpenClusterKey] = useState<string | null>(null);
  const [optimisticId, setOptimisticId] = useState<TCitaId | null>(null);
  const [modal, setModal] = useState<TModalState>({ kind: 'closed' });
  const [cancelTarget, setCancelTarget] = useState<TCitaId | null>(null);
  // Surface A — drag & drop reschedule confirmation snapshot + in-Dialog error.
  const [pendingReschedule, setPendingReschedule] = useState<IPendingReschedule | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const { clienteId: clienteIdParam } = useSearch({ from: '/dashboard/agenda' });

  useEffect(() => {
    if (clienteIdParam === undefined) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync URL param → modal open
    setModal({ kind: 'create', prefill: { clienteId: clienteIdParam } });
    void navigate({ to: '/dashboard/agenda', replace: true });
  }, [clienteIdParam, navigate]);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancelError, setCancelError] = useState<string | undefined>(undefined);
  const [liveMessage, setLiveMessage] = useState('');

  // Default (primary) centre for the user + the full list of centres they can
  // switch between. `selectedCentroId` is the user's explicit pick; until they
  // touch the selector it stays null and `activeCentroId` falls back to the
  // default primary centre, so the selector shows the current centre out of the
  // box. Switching centres re-fetches the agenda (Día/Semana/Mes) for that centre.
  const { centroId } = useDashboardCentroId(user?.id ?? null);
  // superadmin/recepcionista manage citas across ANY active centro — not just
  // their own assignment — so the selector is sourced from ALL active centros
  // (same hook TerapeutaModal/ServicioModal use), not the user-scoped list.
  const { data: centros = [] } = useCentrosActivos();
  const [selectedCentroId, setSelectedCentroId] = useState<TCentroId | null>(null);
  const activeCentroId = selectedCentroId ?? centroId;

  // Day / List view data.
  // This hook is always enabled (centroId guard only) because its output feeds
  // always-visible UI: AgendaKpiStrip, AgendaAdminRail, terapeutaOptions filter,
  // and the cancel sub-flow. Gating it by dateMode would break those.
  const { therapists, appointments, unassignedAppointments, kpis, alerts, legendItems, isLoading } =
    useAdminAgendaData(activeCentroId, filters.activeDate);

  // Week view data — fetched while week OR list mode is active (list is
  // week-scoped and, unlike day data, already includes unassigned citas).
  const weekStartStr = getWeekStart(filters.activeDate);
  const {
    weekDays,
    therapists: weekTherapists,
    colorMap,
    isLoading: isWeekLoading,
  } = useAdminWeekData(
    activeCentroId,
    weekStartStr,
    filters.dateMode === 'week' || filters.dateMode === 'list',
  );

  // Month view data — only fetched while the month mode is active.
  const activeDateObj = new Date(filters.activeDate + 'T00:00:00');
  const {
    cells,
    footerKpis,
    isLoading: isMonthLoading,
  } = useAdminMonthData(
    activeCentroId,
    activeDateObj.getFullYear(),
    activeDateObj.getMonth() + 1,
    filters.dateMode === 'month',
  );

  // Filter option sources.
  const { servicios } = useServiciosActivosCentro(activeCentroId);

  // Active centre name derived from the active-centros list (matched by
  // activeCentroId) — the source of truth for the selector + overlay header.
  const centroName = centros.find((c) => c.id === activeCentroId)?.nombre;

  // ── Mutations ────────────────────────────────────────────────────────────────
  const confirmMutation = useConfirmCita();
  const changeEstadoMutation = useChangeCitaEstado();
  const cancelMutation = useCancelCita();
  const rescheduleMutation = useRescheduleCita();
  // Destructured mutate functions — stable across renders from React Query 5.
  // Used in useCallback dep arrays so the exhaustive-deps rule sees a stable ref.
  const confirmMutate = confirmMutation.mutate;
  const changeEstadoMutate = changeEstadoMutation.mutate;

  // ── Filter option lists ──────────────────────────────────────────────────────
  // All active centros (system-wide, not just the user's own assignment) — the
  // selector switches the active centre (view one at a time, switchable).
  const centroOptions: IAgendaFilterOption[] = centros.map((c) => ({
    value: String(c.id),
    label: c.nombre,
  }));
  const terapeutaOptions: IAgendaFilterOption[] = therapists.map((th) => ({
    value: String(th.id),
    label: th.nombre,
  }));
  const servicioOptions: IAgendaFilterOption[] = servicios.map((sv) => ({
    value: sv.nombre,
    label: sv.nombre,
  }));
  const estadoOptions: IAgendaFilterOption[] = ESTADO_FILTER_VALUES.map((estado) => ({
    value: estado,
    label: t(`estado.${estado}`),
    estado,
  }));

  // ── Filtering (Designer §1.3 — chips actually filter rendered citas) ─────────
  // Single predicate shared by day/list (visibleAppointments) AND the week view
  // (RESOLVED OQ-1: filter BEFORE clustering) so a folder never shows citas the
  // user filtered out elsewhere. Stable via useCallback so the week-day useMemo
  // below only recomputes when the actual filter values change.
  const matchesFilters = useCallback(
    (a: IAgendaAppointment): boolean => {
      if (
        filters.selectedTerapeutas.length > 0 &&
        !filters.selectedTerapeutas.includes(String(a.therapistId))
      ) {
        return false;
      }
      if (filters.selectedServicio !== null && a.serviceName !== filters.selectedServicio) {
        return false;
      }
      if (filters.selectedEstado !== null && a.estado !== filters.selectedEstado) {
        return false;
      }
      return true;
    },
    [filters.selectedTerapeutas, filters.selectedServicio, filters.selectedEstado],
  );

  // useMemo: stabilizes the array reference so memo(AgendaCalendarGrid) and
  // memo(AgendaWeekGrid) skip re-renders when only selection/modal state flips.
  const visibleAppointments = useMemo(
    () => appointments.filter(matchesFilters),
    [appointments, matchesFilters],
  );

  // Unassigned citas (sin_asignar) are shown in the day grid's leading column
  // REGARDLESS of the therapist chip filter — they have no therapist, so a
  // therapist filter must not hide "needs attention" work. The servicio/estado
  // chips still apply. useMemo stabilizes the prop for memo(AgendaCalendarGrid).
  const visibleUnassigned = useMemo(
    () =>
      unassignedAppointments.filter(
        (a) =>
          (filters.selectedServicio === null || a.serviceName === filters.selectedServicio) &&
          (filters.selectedEstado === null || a.estado === filters.selectedEstado),
      ),
    [unassignedAppointments, filters.selectedServicio, filters.selectedEstado],
  );

  // Week view: apply the SAME predicate to each day column before clustering, and
  // recompute each day's citaCount from the filtered list so the column header
  // count stays truthful (RESOLVED OQ-1).
  const filteredWeekDays = useMemo<readonly IAgendaWeekDay[]>(
    () =>
      weekDays.map((day) => {
        const filtered = day.appointments.filter(matchesFilters);
        return { ...day, appointments: filtered, citaCount: filtered.length };
      }),
    [weekDays, matchesFilters],
  );

  // The set of cluster keys that actually exist after filtering+grouping. Used by
  // the D12 close-on-vanish guard below. Only meaningful in week mode.
  const derivedClusterKeys = useMemo<ReadonlySet<string>>(() => {
    if (filters.dateMode !== 'week') return new Set<string>();
    const keys = new Set<string>();
    for (const day of filteredWeekDays) {
      for (const slot of clusterDayAppointments(
        day.appointments,
        day.dateStr,
        AGENDA_DAY_START_HOUR,
      )) {
        if (slot.kind === 'cluster') keys.add(slot.key);
      }
    }
    return keys;
  }, [filteredWeekDays, filters.dateMode]);

  // D12 close-on-vanish: if the open cluster no longer matches any derived cluster
  // (cancel/reschedule, OR a filter chip dropped the group to 1 — E7), close it.
  useEffect(() => {
    if (openClusterKey !== null && !derivedClusterKeys.has(openClusterKey)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- D12: reset invalid open cluster after re-derivation
      setOpenClusterKey(null);
    }
  }, [openClusterKey, derivedClusterKeys]);

  // Reschedule close-on-vanish (E-A8): if a background refetch removed the pending
  // cita or flipped it to a terminal estado while the Dialog is open, discard the
  // pending snapshot (a Confirm would otherwise reschedule a stale target). Skip
  // while the mutation is in flight so we don't tear down our own optimistic dim.
  //
  // The guard checks BOTH active datasets so it covers the day view (`appointments`)
  // and the week view (`weekDays`): the drop can originate from either grid, and
  // each view fetches its own slice. "Still valid" = present AND non-terminal in at
  // least one of them; otherwise the Dialog closes.
  const pendingCitaStillValid =
    pendingReschedule === null
      ? true
      : appointments.some(
          (a) => a.id === pendingReschedule.citaId && !isTerminalEstado(a.estado),
        ) ||
        unassignedAppointments.some(
          (a) => a.id === pendingReschedule.citaId && !isTerminalEstado(a.estado),
        ) ||
        weekDays.some((day) =>
          day.appointments.some(
            (a) => a.id === pendingReschedule.citaId && !isTerminalEstado(a.estado),
          ),
        ) ||
        // Month view drop: the dragged chip lives in the month cells dataset, which
        // day/week don't cover. Without this the guard would discard a valid month
        // reschedule the instant its Dialog opens.
        cells.some((cell) =>
          cell.chips.some(
            (chip) => chip.id === pendingReschedule.citaId && !isTerminalEstado(chip.estado),
          ),
        );
  useEffect(() => {
    if (pendingReschedule !== null && !rescheduleMutation.isPending && !pendingCitaStillValid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- E-A8: discard stale pending reschedule + clear dim/error after re-derivation
      setPendingReschedule(null);
      setRescheduleError(undefined);
      setOptimisticId(null);
    }
  }, [pendingReschedule, pendingCitaStillValid, rescheduleMutation.isPending]);

  // When the terapeuta chip filter is active, hide columns for excluded therapists
  // so empty columns don't pollute the day grid.
  // In day mode, also hide masajistas without a work schedule on the active date.
  // useMemo: stabilizes the array reference so memo(AgendaCalendarGrid) only
  // re-renders when the therapist list or filter selection actually changes.
  const visibleTherapists = useMemo(
    () =>
      therapists
        .filter(
          (th) =>
            filters.selectedTerapeutas.length === 0 ||
            filters.selectedTerapeutas.includes(String(th.id)),
        )
        .filter((th) => filters.dateMode !== 'day' || th.isAvailableOnDate),
    [therapists, filters.selectedTerapeutas, filters.dateMode],
  );

  // useMemo: depends on visibleAppointments (already memoized); stabilizes the prop
  // passed to AgendaAdminRail for the same reason.
  const pendingAppointments = useMemo(
    () => visibleAppointments.filter((a) => a.estado === 'pendiente'),
    [visibleAppointments],
  );

  const anyActionPending =
    confirmMutation.isPending ||
    changeEstadoMutation.isPending ||
    cancelMutation.isPending ||
    rescheduleMutation.isPending;

  // While a reschedule is pending confirmation OR its mutation is in flight, no
  // new drag may begin (Analyst E-A7). The dimmed source + open Dialog signal busy.
  const rescheduleBusy = pendingReschedule !== null || rescheduleMutation.isPending;

  // ── Date navigation ────────────────────────────────────────────────────────
  const handleDateModeChange = (mode: TAgendaDateMode) => {
    setSelectedCitaId(null);
    setFilters((prev) => ({
      ...prev,
      dateMode: mode,
    }));
  };
  const handlePrevPeriod = () => {
    setSelectedCitaId(null);
    setFilters((prev) => ({ ...prev, activeDate: stepPeriod(prev.activeDate, prev.dateMode, -1) }));
  };
  const handleNextPeriod = () => {
    setSelectedCitaId(null);
    setFilters((prev) => ({ ...prev, activeDate: stepPeriod(prev.activeDate, prev.dateMode, 1) }));
  };
  const handleTodayClick = () => {
    const now = getTodayKey();
    setFilters((prev) => ({
      ...prev,
      activeDate: now,
    }));
  };

  const handleActiveDateChange = (dateStr: string) => {
    setSelectedCitaId(null);
    setFilters((prev) => ({
      ...prev,
      activeDate: dateStr,
    }));
  };

  // Switching the active centre (single-select). A "Limpiar"/null from the menu is
  // ignored — the agenda always needs a concrete centre. Resets the centre-scoped
  // filters (terapeutas + servicio) so we don't carry a selection that yields an
  // empty grid in the new centre; date + view mode are preserved.
  const handleCentroChange = (value: string | null) => {
    if (value === null) return;
    const next = Number(value);
    setSelectedCitaId(null);
    setSelectedCentroId(next);
    setFilters((prev) => ({
      ...prev,
      selectedTerapeutas: [],
      selectedServicio: null,
    }));
  };

  // Shared by the Week header's day-click and the Month grid's cell-click —
  // both mean "switch to Day view for this date". useCallback: stability
  // consumer is memo(AgendaWeekGrid) / memo(AgendaMonthGrid).
  const handleDayNavigate = useCallback((dateStr: string) => {
    setSelectedCitaId(null);
    setFilters((prev) => ({ ...prev, dateMode: 'day', activeDate: dateStr }));
  }, []);

  // Double-click on an empty Day/Week cell → open the create modal prefilled
  // with the clicked slot. useCallback: stability consumer is
  // memo(AgendaCalendarGrid) / memo(AgendaWeekGrid).
  const handleCreateAtDaySlot = useCallback(
    ({ therapistId, horaInicio }: { therapistId: TUserId | null; horaInicio: string }) => {
      setModal({
        kind: 'create',
        // therapistId null (double-click in the "Sin asignación" column) → omit
        // usuarioId so the cita is created without a therapist (sin_asignar).
        prefill: {
          ...(therapistId !== null ? { usuarioId: therapistId } : {}),
          fecha: filters.activeDate,
          horaInicio,
        },
      });
    },
    [filters.activeDate],
  );

  const handleCreateAtWeekSlot = useCallback(
    ({ dateStr, horaInicio }: { dateStr: string; horaInicio: string }) => {
      setModal({ kind: 'create', prefill: { fecha: dateStr, horaInicio } });
    },
    [],
  );

  // ── Detail / lifecycle handlers ──────────────────────────────────────────────
  // useCallback: each handler below is a prop of memo(AgendaCalendarGrid) or
  // memo(AgendaWeekGrid). Stable identity prevents those components from
  // re-rendering when only unrelated state (modal, cancel, etc.) changes.
  const handleActivate = useCallback((id: TCitaId) => {
    // Selecting a singleton clears any open cluster (D7: mutually exclusive).
    setOpenClusterKey(null);
    // Diferir la selección: montar el popover de detalle + re-render del grid
    // es trabajo no urgente. startTransition lo hace interrumpible y evita que
    // bloquee el hilo principal como una tarea larga en el tick del click.
    startTransition(() => {
      setSelectedCitaId(id);
    });
  }, []);

  const handleDetailOpenChange = useCallback((open: boolean) => {
    if (!open) setSelectedCitaId(null);
  }, []);

  // Opening a cluster clears the detail selection (D7: mutually exclusive).
  const handleClusterOpenChange = useCallback((key: string | null) => {
    if (key !== null) setSelectedCitaId(null);
    setOpenClusterKey(key);
  }, []);

  const handleConfirm = useCallback(
    (id: TCitaId) => {
      setOptimisticId(id);
      confirmMutate(id, {
        onSuccess: () => {
          toastSuccess(t('toast.confirmed'));
          setLiveMessage(t('a11y.confirmedAnnounce'));
          setSelectedCitaId(null);
        },
        onError: () => {
          toastError(t('toast.confirmError'));
        },
        onSettled: () => {
          setOptimisticId(null);
        },
      });
    },
    [confirmMutate, t, toastSuccess, toastError],
  );

  const handleChangeEstado = useCallback(
    (id: TCitaId, estado: TEstadoCita) => {
      changeEstadoMutate(
        { citaId: id, estado },
        {
          onSuccess: () => {
            toastSuccess(t('toast.estadoChanged'));
            setLiveMessage(t('a11y.estadoAnnounce', { estado: t(`estado.${estado}`) }));
            if (isTerminalEstado(estado)) setSelectedCitaId(null);
          },
          onError: (err) => {
            toastError(err instanceof Error ? err.message : t('toast.errorGeneric'));
          },
        },
      );
    },
    [changeEstadoMutate, t, toastSuccess, toastError],
  );

  const handleEdit = useCallback((id: TCitaId) => {
    setSelectedCitaId(null);
    // Cluster rows reuse this handler — close any open folder popup on edit.
    setOpenClusterKey(null);
    setModal({ kind: 'edit', citaId: id });
  }, []);

  const handleReassign = useCallback((id: TCitaId) => {
    // Reassignment is a therapist-focused edit; open the edit modal on that cita.
    setSelectedCitaId(null);
    setModal({ kind: 'edit', citaId: id });
  }, []);

  const handleNewAppointment = useCallback(() => {
    setModal({ kind: 'create' });
  }, []);

  const handleModalSuccess = (action: 'created' | 'updated', clienteName: string) => {
    setLiveMessage(
      action === 'created'
        ? t('a11y.createdAnnounce', { cliente: clienteName })
        : t('a11y.updatedAnnounce'),
    );
  };

  // ── Cancel sub-flow ────────────────────────────────────────────────────────
  const cancelAppointment =
    cancelTarget !== null ? (appointments.find((a) => a.id === cancelTarget) ?? null) : null;
  const cancelBlockedReason: TCancelBlockedReason =
    cancelAppointment === null
      ? null
      : cancelAppointment.estado === 'completada'
        ? 'completed'
        : cancelAppointment.estado === 'cancelada'
          ? 'cancelled'
          : null;

  // useCallback: stability consumer is memo(AgendaCalendarGrid/AgendaWeekGrid)
  // where this is passed as `onCancel`.
  const handleOpenCancel = useCallback((id: TCitaId) => {
    setCancelTarget(id);
    setCancelMotivo('');
    setCancelError(undefined);
  }, []);
  const handleCloseCancel = () => {
    setCancelTarget(null);
    setCancelMotivo('');
    setCancelError(undefined);
  };
  const handleConfirmCancel = () => {
    if (cancelTarget === null) return;
    setCancelError(undefined);
    cancelMutation.mutate(
      { citaId: cancelTarget, motivo: cancelMotivo !== '' ? cancelMotivo : undefined },
      {
        onSuccess: () => {
          toastSuccess(t('toast.cancelled'));
          setLiveMessage(t('a11y.cancelledAnnounce'));
          setSelectedCitaId(null);
          handleCloseCancel();
        },
        onError: (err) => {
          setCancelError(err instanceof Error ? err.message : t('toast.errorGeneric'));
        },
      },
    );
  };

  // ── Reschedule (drag & drop) sub-flow — Surface A ────────────────────────────
  // A human-readable "Lun 12" day label from the week-day data captured at drop
  // time, so the Dialog summary + announcements stay self-contained (E-A8).
  // useCallback: inlined as a stable helper consumed by handleRescheduleDrop below.
  const dayLabelFor = useCallback(
    (dateStr: string): string => {
      const day = filteredWeekDays.find((d) => d.dateStr === dateStr);
      return day !== undefined ? `${day.label} ${day.dateNumber}` : dateStr;
    },
    [filteredWeekDays],
  );

  // A drop with a net change (Analyst OQ-A2) → open the confirm Dialog. The block
  // is NOT moved; it is dimmed via optimisticId while the Dialog is open and the
  // mutation runs (pessimistic commit, §5).
  // useCallback: stability consumer is memo(AgendaWeekGrid) where this is onRescheduleDrop.
  const handleRescheduleDrop = useCallback(
    (drop: IWeekRescheduleDrop) => {
      const toDateLabel = dayLabelFor(drop.proposed.dateStr);
      setRescheduleError(undefined);
      setSelectedCitaId(null);
      setOpenClusterKey(null);
      setPendingReschedule({
        citaId: drop.citaId,
        clientName: drop.clientName ?? '—',
        serviceName: drop.serviceName,
        fromDateLabel: dayLabelFor(drop.origin.dateStr),
        fromTime: drop.origin.startTime,
        toDateLabel,
        toTime: drop.proposed.startTime,
        showOverlapHint: false,
        // Build the new schedule from LOCAL parts (codebase convention) so a
        // date string round-trips to the same calendar day in any timezone (E-A9).
        fechaHoraInicio: new Date(`${drop.proposed.dateStr}T${drop.proposed.startTime}:00`),
        fechaHoraFin: new Date(`${drop.proposed.dateStr}T${drop.proposed.endTime}:00`),
      });
      setOptimisticId(drop.citaId);
      setLiveMessage(
        t('a11y.rescheduleProposedAnnounce', { fecha: toDateLabel, hora: drop.proposed.startTime }),
      );
    },
    [dayLabelFor, t],
  );

  // Day-view label for the FIXED active date (e.g. "lun 12") — derived from the
  // date itself since the day grid has no week-day list to read from. Uses the
  // active i18n language so the weekday matches the rest of the UI.
  // useCallback: consumed by handleDayRescheduleDrop below.
  const dayModeLabel = useCallback(
    (dateStr: string): string => {
      const d = new Date(`${dateStr}T00:00:00`);
      return new Intl.DateTimeFormat(i18n.language, {
        weekday: 'short',
        day: 'numeric',
      }).format(d);
    },
    [i18n.language],
  );

  // Day-view drop (Surface A). Mirrors handleRescheduleDrop but the DATE is fixed
  // (= activeDate) and the columns are THERAPISTS: a net change is a new hour
  // AND/OR a new therapist. usuarioId is set ONLY when the therapist changed, so a
  // pure time move keeps the current assignee. The Dates are built from LOCAL parts
  // off the fixed activeDate (E-A9).
  // useCallback: stability consumer is memo(AgendaCalendarGrid) where this is onRescheduleDrop.
  const handleDayRescheduleDrop = useCallback(
    (drop: IDayRescheduleDrop) => {
      const dateLabel = dayModeLabel(drop.dateStr);
      const reassigned = drop.proposed.therapistId !== drop.origin.therapistId;
      setRescheduleError(undefined);
      setSelectedCitaId(null);
      setOpenClusterKey(null);
      setPendingReschedule({
        citaId: drop.citaId,
        clientName: drop.clientName ?? '—',
        serviceName: drop.serviceName,
        // The day never changes in this view → from/to share the same date label.
        fromDateLabel: dateLabel,
        fromTime: drop.origin.startTime,
        toDateLabel: dateLabel,
        toTime: drop.proposed.startTime,
        showOverlapHint: false,
        fechaHoraInicio: new Date(`${drop.dateStr}T${drop.proposed.startTime}:00`),
        fechaHoraFin: new Date(`${drop.dateStr}T${drop.proposed.endTime}:00`),
        // Reassignment includes assign-from-unassigned (origin therapistId null →
        // proposed a real therapist). `?? undefined` keeps the payload well-typed:
        // a null proposed only happens on an unassigned→unassigned pure time move,
        // where `reassigned` is already false, so usuarioId is omitted (no change).
        usuarioId: reassigned ? (drop.proposed.therapistId ?? undefined) : undefined,
        fromTherapist: drop.origin.therapistName,
        toTherapist: drop.proposed.therapistName,
      });
      setOptimisticId(drop.citaId);
      setLiveMessage(
        t('a11y.rescheduleProposedAnnounce', { fecha: dateLabel, hora: drop.proposed.startTime }),
      );
    },
    [dayModeLabel, t],
  );

  // Month-view drop (Surface A). Mirrors handleRescheduleDrop but the columns are
  // whole DAYS and the time-of-day is preserved (a month drag only changes the
  // date). Both day labels use the Intl formatter since a month drop can span any
  // two dates in (or adjacent to) the grid, not just the current week.
  // useCallback: stability consumer is AgendaMonthGrid where this is onRescheduleDrop.
  const handleMonthRescheduleDrop = useCallback(
    (drop: IMonthRescheduleDrop) => {
      const toDateLabel = dayModeLabel(drop.proposed.dateStr);
      setRescheduleError(undefined);
      setSelectedCitaId(null);
      setOpenClusterKey(null);
      setPendingReschedule({
        citaId: drop.citaId,
        clientName: drop.clientName ?? '—',
        serviceName: drop.serviceName,
        fromDateLabel: dayModeLabel(drop.origin.dateStr),
        fromTime: drop.origin.startTime,
        toDateLabel,
        toTime: drop.proposed.startTime,
        showOverlapHint: false,
        fechaHoraInicio: new Date(`${drop.proposed.dateStr}T${drop.proposed.startTime}:00`),
        fechaHoraFin: new Date(`${drop.proposed.dateStr}T${drop.proposed.endTime}:00`),
      });
      setOptimisticId(drop.citaId);
      setLiveMessage(
        t('a11y.rescheduleProposedAnnounce', { fecha: toDateLabel, hora: drop.proposed.startTime }),
      );
    },
    [dayModeLabel, t],
  );

  const handleCloseReschedule = () => {
    if (pendingReschedule !== null) {
      setLiveMessage(
        t('a11y.rescheduleCancelledAnnounce', {
          fecha: pendingReschedule.fromDateLabel,
          hora: pendingReschedule.fromTime,
        }),
      );
    }
    setPendingReschedule(null);
    setRescheduleError(undefined);
    setOptimisticId(null);
  };

  const handleConfirmReschedule = () => {
    if (pendingReschedule === null) return;
    const snapshot = pendingReschedule;
    setRescheduleError(undefined);
    rescheduleMutation.mutate(
      {
        citaId: snapshot.citaId,
        changes: {
          fechaHoraInicio: snapshot.fechaHoraInicio,
          fechaHoraFin: snapshot.fechaHoraFin,
          // Reassignment (day view only): include usuarioId ONLY when the drag
          // crossed therapist columns. citaService.reschedule re-runs rules 1–10
          // against the new therapist (availability + overlap). Omitted → the
          // current assignee is preserved.
          ...(snapshot.usuarioId !== undefined ? { usuarioId: snapshot.usuarioId } : {}),
        },
      },
      {
        onSuccess: () => {
          toastSuccess(t('toast.updated'));
          setLiveMessage(
            t('a11y.rescheduledAnnounce', {
              fecha: snapshot.toDateLabel,
              hora: snapshot.toTime,
            }),
          );
          // Hook owns ['agenda'] invalidation — the block re-renders at its new
          // slot from fresh server data. Clear the pending snapshot + dim.
          setPendingReschedule(null);
          setOptimisticId(null);
        },
        onError: (err) => {
          // Domain rule violation → keep the Dialog OPEN with the localized
          // message; the source stays dimmed at origin (Analyst OQ-A10 / E-A4).
          setRescheduleError(err instanceof Error ? err.message : t('reschedule.genericError'));
        },
      },
    );
  };

  // ── activeCentroId === null → explicit configuration empty state (§3.8) ───────
  if (activeCentroId === null) {
    return (
      <>
        <AgendaFilterBar
          filters={filters}
          centroOptions={[]}
          centroValue={null}
          terapeutaOptions={[]}
          servicioOptions={[]}
          estadoOptions={estadoOptions}
          optionsLoading={false}
          canManage={canManageCitas}
          disabled
          onDateModeChange={handleDateModeChange}
          onPrevPeriod={handlePrevPeriod}
          onNextPeriod={handleNextPeriod}
          onTodayClick={handleTodayClick}
          onActiveDateChange={handleActiveDateChange}
          onCentroChange={() => undefined}
          onTerapeutasChange={() => undefined}
          onServicioChange={() => undefined}
          onEstadoChange={() => undefined}
          onNewAppointment={handleNewAppointment}
        />
        <StyledNullCentroWrap>
          <Empty
            preset="no-results"
            title={t('nullCentro.title')}
            description={t('nullCentro.description')}
          />
        </StyledNullCentroWrap>
      </>
    );
  }

  const renderMainContent = (): React.ReactElement => {
    switch (filters.dateMode) {
      case 'day':
        return isLoading ? (
          <StyledModeEmptyState role="status" aria-live="polite">
            <span>{t('loading')}</span>
          </StyledModeEmptyState>
        ) : (
          <AgendaCalendarGrid
            therapists={visibleTherapists}
            appointments={visibleAppointments}
            unassignedAppointments={visibleUnassigned}
            activeDate={filters.activeDate}
            selectedId={selectedCitaId}
            optimisticId={optimisticId}
            canManage={canManageCitas}
            actionPending={anyActionPending}
            rescheduleBusy={rescheduleBusy}
            centroName={centroName}
            onActivate={handleActivate}
            onDetailOpenChange={handleDetailOpenChange}
            onConfirm={handleConfirm}
            onChangeEstado={handleChangeEstado}
            onEdit={handleEdit}
            onCancel={handleOpenCancel}
            onRescheduleDrop={handleDayRescheduleDrop}
            onCreateAtSlot={handleCreateAtDaySlot}
          />
        );

      case 'week':
        return isWeekLoading ? (
          <StyledModeEmptyState role="status" aria-live="polite">
            <span>{t('loading')}</span>
          </StyledModeEmptyState>
        ) : (
          <AgendaWeekGrid
            weekDays={filteredWeekDays}
            colorMap={colorMap}
            therapists={weekTherapists}
            selectedId={selectedCitaId}
            openClusterKey={openClusterKey}
            optimisticId={optimisticId}
            canManage={canManageCitas}
            actionPending={anyActionPending}
            rescheduleBusy={rescheduleBusy}
            centroName={centroName}
            onActivate={handleActivate}
            onDetailOpenChange={handleDetailOpenChange}
            onClusterOpenChange={handleClusterOpenChange}
            onConfirm={handleConfirm}
            onChangeEstado={handleChangeEstado}
            onEdit={handleEdit}
            onCancel={handleOpenCancel}
            onRescheduleDrop={handleRescheduleDrop}
            onCreateAtSlot={handleCreateAtWeekSlot}
            onDayHeaderClick={handleDayNavigate}
          />
        );

      case 'month':
        return isMonthLoading ? (
          <StyledModeEmptyState role="status" aria-live="polite">
            <span>{t('loading')}</span>
          </StyledModeEmptyState>
        ) : (
          <AgendaMonthGrid
            cells={cells}
            footerKpis={footerKpis}
            onDayClick={handleDayNavigate}
            canManage={canManageCitas}
            rescheduleBusy={rescheduleBusy}
            onRescheduleDrop={handleMonthRescheduleDrop}
          />
        );

      case 'list':
        return isWeekLoading ? (
          <StyledModeEmptyState role="status" aria-live="polite">
            <span>{t('loading')}</span>
          </StyledModeEmptyState>
        ) : (
          <AgendaListView
            weekDays={filteredWeekDays}
            selectedId={selectedCitaId}
            optimisticId={optimisticId}
            canManage={canManageCitas}
            actionPending={anyActionPending}
            centroName={centroName}
            onActivate={handleActivate}
            onDetailOpenChange={handleDetailOpenChange}
            onConfirm={handleConfirm}
            onChangeEstado={handleChangeEstado}
            onEdit={handleEdit}
            onCancel={handleOpenCancel}
          />
        );
    }
  };

  return (
    <>
      {/* Mutation announcements (polite) for screen readers (§5). */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>

      <AgendaKpiStrip kpis={kpis} />

      <AgendaFilterBar
        filters={filters}
        centroOptions={centroOptions}
        centroValue={String(activeCentroId)}
        terapeutaOptions={terapeutaOptions}
        servicioOptions={servicioOptions}
        estadoOptions={estadoOptions}
        optionsLoading={isLoading}
        canManage={canManageCitas}
        disabled={false}
        onDateModeChange={handleDateModeChange}
        onPrevPeriod={handlePrevPeriod}
        onNextPeriod={handleNextPeriod}
        onTodayClick={handleTodayClick}
        onActiveDateChange={handleActiveDateChange}
        onCentroChange={handleCentroChange}
        onTerapeutasChange={(v) => {
          setFilters((prev) => ({ ...prev, selectedTerapeutas: v }));
        }}
        onServicioChange={(v) => {
          setFilters((prev) => ({ ...prev, selectedServicio: v }));
        }}
        onEstadoChange={(v) => {
          setFilters((prev) => ({ ...prev, selectedEstado: v }));
        }}
        onNewAppointment={handleNewAppointment}
      />

      <StyledAdminGrid>
        {renderMainContent()}

        <AgendaAdminRail
          pendingAppointments={pendingAppointments}
          alerts={alerts}
          legendItems={legendItems}
          therapists={therapists}
          canManage={canManageCitas}
          optimisticId={optimisticId}
          onConfirm={handleConfirm}
          onReassign={handleReassign}
        />
      </StyledAdminGrid>

      {modal.kind !== 'closed' && (
        <AgendaCalendarOverlay
          open
          mode={modal.kind === 'create' ? 'create' : 'edit'}
          centroId={activeCentroId}
          centroName={centroName ?? ''}
          citaId={modal.kind === 'edit' ? modal.citaId : undefined}
          prefill={modal.kind === 'create' ? modal.prefill : undefined}
          initialDate={filters.activeDate}
          canManage={canManageCitas}
          onClose={() => {
            setModal({ kind: 'closed' });
          }}
          onSuccess={handleModalSuccess}
        />
      )}

      <AgendaCancelDialog
        open={cancelTarget !== null}
        clienteName={cancelAppointment?.clientName ?? ''}
        fecha={filters.activeDate}
        hora={cancelAppointment?.startTime ?? ''}
        motivo={cancelMotivo}
        onMotivoChange={setCancelMotivo}
        submitting={cancelMutation.isPending}
        errorMessage={cancelError}
        blockedReason={cancelBlockedReason}
        onConfirm={handleConfirmCancel}
        onClose={handleCloseCancel}
      />

      {pendingReschedule !== null && (
        <AgendaRescheduleDialog
          open
          clientName={pendingReschedule.clientName}
          serviceName={pendingReschedule.serviceName}
          fromDate={pendingReschedule.fromDateLabel}
          fromTime={pendingReschedule.fromTime}
          toDate={pendingReschedule.toDateLabel}
          toTime={pendingReschedule.toTime}
          fromTherapist={pendingReschedule.fromTherapist}
          toTherapist={pendingReschedule.toTherapist}
          showOverlapHint={pendingReschedule.showOverlapHint}
          submitting={rescheduleMutation.isPending}
          errorMessage={rescheduleError}
          onConfirm={handleConfirmReschedule}
          onClose={handleCloseReschedule}
        />
      )}
    </>
  );
};
