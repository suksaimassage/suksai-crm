/**
 * WorkScheduleSection.tsx
 *
 * Page-local wrapper (NOT a design-system component) that adapts domain data to
 * the WorkScheduleCalendar black-box primitive for the Terapeutas "Horarios" tab:
 *   - employees ← useTerapeutas(centroId) aggregates
 *   - shifts    ← useCentroHorarios(centroId) mapped via the pure horarioShiftMapper
 *   - writes    ← useCreateHorario / useUpdateHorario / useDeleteHorario
 *
 * It owns the read loading/error/empty gate BEFORE mounting the heavy calendar,
 * and is the enforcement point for RBAC + the recurrente read-only contract.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RECURRENTE READ-ONLY WRITE CONTRACT  (Analyst RESOLVED DECISION §8)
 * ─────────────────────────────────────────────────────────────────────────────
 * The calendar edits `especifico` horarios ONLY. `recurrente` rows render as
 * repeating, read-only shifts (color 'secondary', id prefix 'rec:'). We cannot
 * stop the calendar's foreign Edit modal from opening on a recurrente shift, so
 * the SAVE / DELETE handlers are the enforcement point: they detect the 'rec:'
 * id and return WITHOUT calling any mutation. A silent rewrite of a recurrente
 * row would corrupt the weekly template for every future week. Creating /
 * managing recurrente templates is out of scope for this surface ([FOLLOW-UP]:
 * a dedicated weekly-template editor).
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTerapeutas } from '@infra/hooks/useTerapeutas';
import { useCentroHorarios } from '@infra/hooks/useCentroHorarios';
import { useCreateHorario } from '@infra/hooks/useCreateHorario';
import { useUpdateHorario } from '@infra/hooks/useUpdateHorario';
import { useDeleteHorario } from '@infra/hooks/useDeleteHorario';
import { useScheduleViewportConfig } from '@infra/hooks/useScheduleViewportConfig';
import { useUserStore } from '@app/stores/useUserStore';
import { useToast } from '@infra/components/ui/common/Toast';
import { Spinner } from '@infra/components/ui/common/Spinner';
import { Button } from '@infra/components/ui/common/Button';
import { WorkScheduleCalendar } from '@infra/components/ui/shared/WorkScheduleCalendar';
import {
  mapHorariosToShifts,
  isRecurrenteShiftId,
  parseEspecificoHorarioId,
} from '@infra/utils/horarioShiftMapper';
import { findScheduleConflict, FeaturePermissionService } from '@domain/index';
import * as S from './WorkScheduleSection.styles';
import type { Employee, Shift, ShiftDraft } from '@infra/components/ui/shared/WorkScheduleCalendar';
import type { TCentroId, TDiaSemana } from '@domain/types';
import type { IScheduleConflictCandidate } from '@domain/index';

interface IWorkScheduleSectionProps {
  readonly centroId: TCentroId | null;
  /**
   * Move focus to the schedule panel on mount — ONLY for the menu-driven entry
   * (the originating card unmounts under destroyOnHide, so focus must not fall to
   * a detached node). A direct tab-header click leaves focus on the tab
   * (WCAG 3.2.2 — no unexpected focus move).
   */
  readonly autoFocus?: boolean;
}

// NOTE [BLOCKING-1]: RoutePermissionService gates the `terapeutas` route to
// superadmin only, so the recepcionista branch is currently unobservable. The
// check is kept correct + future-proof; widening the route is out of scope.

// Initial recurrente-expansion / especifico-display window before the calendar
// emits its first onVisibleRangeChange (synchronously on mount). The current
// month is a safe seed; the calendar then drives the real shown period reactively
// (a shift created/viewed in another month no longer disappears — the read range
// follows the calendar instead of being pinned to today's month).
function getInitialMonthBounds(now: Date): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of month
  return { start, end };
}

/** "YYYY-MM-DD" in local time (matches the calendar's Shift.date convention). */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const WorkScheduleSection = ({ centroId, autoFocus = false }: IWorkScheduleSectionProps) => {
  const { t, i18n } = useTranslation('terapeutas');
  const toast = useToast();
  const panelRef = useRef<HTMLDivElement>(null);

  // Responsive Day-view geometry: shrinks slotWidth + label density on narrow
  // viewports so the fixed-pixel Day grid fits the content column at tablet
  // landscape instead of overflowing ~2×. Stable per band (preserves the
  // calendar's Day-view memoization).
  const { slotWidth, density } = useScheduleViewportConfig();

  const roles = useUserStore((state) => state.user?.roles ?? []);
  const canWrite = FeaturePermissionService.canEditWorkSchedule(roles);

  // The calendar's currently-shown day range. Seeded to the current month, then
  // driven reactively by the calendar's onVisibleRangeChange so shifts in other
  // months remain visible (state-loss bug fix #2). Stored as ISO date keys so the
  // identity only changes when the range actually changes (avoids effect churn).
  const [rangeKeys, setRangeKeys] = useState<{ startKey: string; endKey: string }>(() => {
    const { start, end } = getInitialMonthBounds(new Date());
    return { startKey: toDateKey(start), endKey: toDateKey(end) };
  });

  const { data: terapeutas, isLoading: terapeutasLoading } = useTerapeutas(centroId);
  const {
    data: horarios,
    isLoading: horariosLoading,
    isError,
    refetch,
  } = useCentroHorarios(centroId);

  const createHorario = useCreateHorario();
  const updateHorario = useUpdateHorario();
  const deleteHorario = useDeleteHorario();

  // Focus the schedule panel after mount ONLY when opened via the card menu (the
  // originating card unmounts under destroyOnHide, so focus must not drop to
  // <body>). A direct tab-header click keeps focus on the tab (WCAG 3.2.2).
  useEffect(() => {
    if (autoFocus) panelRef.current?.focus();
  }, [autoFocus]);

  const isLoading = terapeutasLoading || horariosLoading;

  // ── Derived: employees + shifts ──────────────────────────────────────────
  const employees: Employee[] = terapeutas.map((aggregate) => ({
    id: String(aggregate.usuarioId),
    name: aggregate.nombre,
    role: aggregate.especialidades[0],
  }));

  const employeeIds = new Set(employees.map((e) => e.id));
  const rangeStart = new Date(`${rangeKeys.startKey}T00:00:00`);
  const rangeEnd = new Date(`${rangeKeys.endKey}T00:00:00`);
  const shifts: Shift[] = mapHorariosToShifts({
    horarios,
    employeeIds,
    rangeStart,
    rangeEnd,
    recurrenteLabel: t('schedule.recurrente_label'),
    recurrenteNote: t('schedule.recurrente_note'),
  });

  // Reactive read window: expand state only when the calendar's shown range
  // actually changes (compared by date-key identity). Drives the mapper above so
  // especifico shifts and recurrente expansion follow the visible period.
  const handleVisibleRangeChange = (start: Date, end: Date) => {
    const startKey = toDateKey(start);
    const endKey = toDateKey(end);
    setRangeKeys((prev) =>
      prev.startKey === startKey && prev.endKey === endKey ? prev : { startKey, endKey },
    );
  };

  // ── Write handlers (especifico only; recurrente is read-only) ────────────
  // Time-range guard mirrors DB CHECK check_horario_logico (hora_inicio < hora_fin).
  const isValidRange = (start: string, end: string): boolean => start < end;

  // Overlap guard (actively-enforced layer; the 004 SQL trigger is defense-in-
  // depth). Runs BEFORE any mutation so a rejected write never flashes an
  // optimistic shift that then vanishes. Calendar writes are always especifico,
  // so a conflict is another active especifico for the SAME therapist on the SAME
  // date with a half-open time overlap (cross-tipo recurrente is never a
  // conflict — the override model lets especifico win at read time). `excludeId`
  // drops the row being edited so it never conflicts with itself. Returns true
  // when a conflict toast was shown and the caller must abort.
  const isOverlapping = (candidate: IScheduleConflictCandidate): boolean => {
    const conflict = findScheduleConflict(horarios, candidate);
    if (conflict === null) return false;
    toast.error(t('schedule.error.overlap.title'), {
      description: t('schedule.error.overlap.description'),
    });
    return true;
  };

  const handleCreate = (draft: ShiftDraft) => {
    if (centroId === null) return; // centro_id is NOT NULL — impossible by gating
    if (!isValidRange(draft.startTime, draft.endTime)) {
      toast.error(t('schedule.error.title'));
      return;
    }

    const tipo = draft.tipo ?? 'especifico';

    if (tipo === 'recurrente') {
      const diaSemana = draft.diaSemana;
      if (!diaSemana || diaSemana < 1 || diaSemana > 7) {
        toast.error(t('schedule.error.title'));
        return;
      }
      createHorario.mutate(
        {
          usuarioId: Number(draft.employeeId),
          centroId,
          tipo: 'recurrente',
          diaSemana: diaSemana as TDiaSemana,
          horaInicio: draft.startTime,
          horaFin: draft.endTime,
        },
        {
          onSuccess: () => toast.success(t('schedule.toast.created')),
          onError: () => toast.error(t('schedule.error.title')),
        },
      );
      return;
    }

    // tipo === 'especifico'
    if (
      isOverlapping({
        usuarioId: Number(draft.employeeId),
        tipo: 'especifico',
        fecha: new Date(`${draft.date}T00:00:00`),
        horaInicio: draft.startTime,
        horaFin: draft.endTime,
      })
    ) {
      return;
    }
    createHorario.mutate(
      {
        usuarioId: Number(draft.employeeId),
        centroId,
        tipo: 'especifico',
        fecha: new Date(draft.date),
        horaInicio: draft.startTime,
        horaFin: draft.endTime,
      },
      {
        onSuccess: () => toast.success(t('schedule.toast.created')),
        onError: () => toast.error(t('schedule.error.title')),
      },
    );
  };

  const handleUpdate = (shift: Shift) => {
    // recurrente shifts are read-only — never rewrite the weekly template.
    if (isRecurrenteShiftId(shift.id)) {
      toast.info(t('schedule.recurrente_readonly'));
      return;
    }
    const horarioId = parseEspecificoHorarioId(shift.id);
    if (horarioId === null || centroId === null) return;
    if (!isValidRange(shift.startTime, shift.endTime)) {
      toast.error(t('schedule.error.title'));
      return;
    }
    if (
      isOverlapping({
        id: horarioId,
        usuarioId: Number(shift.employeeId),
        tipo: 'especifico',
        fecha: new Date(`${shift.date}T00:00:00`),
        horaInicio: shift.startTime,
        horaFin: shift.endTime,
      })
    ) {
      return;
    }
    updateHorario.mutate(
      {
        id: horarioId,
        data: {
          tipo: 'especifico',
          fecha: new Date(shift.date),
          horaInicio: shift.startTime,
          horaFin: shift.endTime,
          centroId,
        },
      },
      {
        onSuccess: () => toast.success(t('schedule.toast.updated')),
        onError: () => toast.error(t('schedule.error.title')),
      },
    );
  };

  const handleDelete = (id: string) => {
    // recurrente shifts are read-only — refuse delete of a template occurrence.
    if (isRecurrenteShiftId(id)) {
      toast.info(t('schedule.recurrente_readonly'));
      return;
    }
    const horarioId = parseEspecificoHorarioId(id);
    if (horarioId === null) return;
    deleteHorario.mutate(horarioId, {
      onSuccess: () => toast.success(t('schedule.toast.deleted')),
      onError: () => toast.error(t('schedule.error.title')),
    });
  };

  // ── Drag-reschedule commit (called by the calendar ONLY after the user
  //    confirms the drag in the confirmation Dialog) ───────────────────────────
  // Returns whether the change was ACCEPTED (mutation dispatched). The calendar
  // uses the boolean to avoid a false success: `false` → it shows nothing extra
  // (we already toasted the reason) and leaves the card at origin.
  //
  // This is today's handleUpdate body with two reschedule-specific differences
  // mandated by the owner decision to KEEP cross-row reassignment:
  //  1. the overlap check already runs against the TARGET therapist (the
  //     candidate's usuarioId = Number(shift.employeeId) — the dropped-on row);
  //  2. the update payload now includes usuarioId so a reassignment persists
  //     (was previously dropped → the card jumped back after refetch).
  const handleReschedule = (shift: Shift): boolean => {
    // Defense-in-depth: recurrente can no longer be dragged (calendar gates it),
    // but never rewrite the weekly template even if one slips through.
    if (isRecurrenteShiftId(shift.id)) {
      toast.info(t('schedule.recurrente_readonly'));
      return false;
    }
    const horarioId = parseEspecificoHorarioId(shift.id);
    if (horarioId === null || centroId === null) return false;
    if (!isValidRange(shift.startTime, shift.endTime)) {
      toast.error(t('schedule.error.title'));
      return false;
    }
    if (
      isOverlapping({
        id: horarioId,
        usuarioId: Number(shift.employeeId),
        tipo: 'especifico',
        fecha: new Date(`${shift.date}T00:00:00`),
        horaInicio: shift.startTime,
        horaFin: shift.endTime,
      })
    ) {
      return false;
    }
    updateHorario.mutate(
      {
        id: horarioId,
        data: {
          usuarioId: Number(shift.employeeId),
          tipo: 'especifico',
          fecha: new Date(shift.date),
          horaInicio: shift.startTime,
          horaFin: shift.endTime,
          centroId,
        },
      },
      {
        onSuccess: () => toast.success(t('schedule.toast.updated')),
        onError: () => toast.error(t('schedule.error.title')),
      },
    );
    return true;
  };

  // Read-only predicate for the calendar (Shift → boolean). recurrente shift
  // occurrences (id prefix 'rec:') are read-only: non-draggable + lock cue.
  const isShiftReadOnlyShift = (shift: Shift): boolean => isRecurrenteShiftId(shift.id);

  // ── Read gate: loading / error before mounting the heavy calendar ────────
  if (isLoading) {
    return (
      <S.StyledScheduleSection ref={panelRef} tabIndex={-1} aria-busy="true">
        <S.StyledScheduleStatus role="status">
          <Spinner />
          <span>{t('schedule.loading')}</span>
        </S.StyledScheduleStatus>
      </S.StyledScheduleSection>
    );
  }

  if (isError) {
    return (
      <S.StyledScheduleSection ref={panelRef} tabIndex={-1}>
        <S.StyledScheduleStatus role="alert">
          <S.StyledScheduleErrorTitle>{t('schedule.error.title')}</S.StyledScheduleErrorTitle>
          <Button
            variant="solid"
            color="primary"
            onClick={() => {
              void refetch();
            }}
          >
            {t('schedule.error.retry')}
          </Button>
        </S.StyledScheduleStatus>
      </S.StyledScheduleSection>
    );
  }

  if (employees.length === 0) {
    return (
      <S.StyledScheduleSection ref={panelRef} tabIndex={-1}>
        <S.StyledScheduleStatus aria-live="polite">
          <span>{t('schedule.empty')}</span>
        </S.StyledScheduleStatus>
      </S.StyledScheduleSection>
    );
  }

  // Read-only roles receive NO write callbacks → the calendar's create/edit/
  // delete affordances are inert; navigation + DetailPanel remain available.
  return (
    <S.StyledScheduleSection ref={panelRef} tabIndex={-1}>
      <WorkScheduleCalendar
        employees={employees}
        shifts={shifts}
        slotWidth={slotWidth}
        density={density}
        onShiftCreate={canWrite ? handleCreate : undefined}
        onShiftUpdate={canWrite ? handleUpdate : undefined}
        onShiftDelete={canWrite ? handleDelete : undefined}
        onShiftReschedule={canWrite ? handleReschedule : undefined}
        isShiftReadOnly={isShiftReadOnlyShift}
        rescheduleSubmitting={updateHorario.isPending}
        onVisibleRangeChange={handleVisibleRangeChange}
        locale={i18n.language}
      />
    </S.StyledScheduleSection>
  );
};
