/**
 * AgendaCalendarOverlay — the Calendar overlay for creating / editing a cita.
 *
 * A dedicated modal surface (scrim + card, own a11y contract: role="dialog",
 * aria-modal, aria-labelledby, focus-trap, focus return, close via ✕ / Escape /
 * backdrop) hosting a 2×2 grid: the week strip spans the full top row, the day
 * kanban sits bottom-left and the embedded inline `CitaModal` bottom-right.
 *
 * The active date is decoupled (`overlayDate` local state) — switching days never
 * mutates the background agenda's `filters.activeDate`; on close it is simply
 * discarded. In create mode the selected day drives `prefill.fecha`; in edit mode
 * it only re-scopes the kanban (never rewrites the cita's date). Saving routes
 * through `CitaModal`'s existing mutations (which invalidate `['agenda']`, covering
 * both the day and week caches) and closes the overlay.
 *
 * React 19 ref-as-prop (no `forwardRef`); memoisation is deliberate (Compiler NOT
 * active): stable `onSelectDay` / `onCardEdit` (`useCallback`) feed the memoised
 * strip + kanban, and the day fusion is `useMemo`d.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { CitaModal } from '@infra/components/ui/domain/modals';
import type { ICitaModalPrefill } from '@infra/components/ui/domain/modals';
import { Dialog } from '@infra/components/ui/common/Dialog';
import { useAdminAgendaData } from '@infra/hooks/useAdminAgendaData';
import { useAdminWeekData } from '@infra/hooks/useAdminWeekData';
import { useCitaById } from '@infra/hooks/useCitaById';
import {
  useEscapeKey,
  useFocusTrap,
  useLockScroll,
} from '@infra/components/ui/common/Modal/Modal.hooks';
import { getTodayKey, getWeekStart, stepPeriod, toLocalDateKey } from '@infra/utils/agenda.utils';
import type { TCentroId, TCitaId } from '@domain/types';

import { CalendarWeekStrip } from './CalendarWeekStrip';
import { CalendarDayKanban } from './CalendarDayKanban';
import { mergeDayCitas } from './calendarOverlay.utils';
import * as S from './AgendaCalendarOverlay.styles';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface IAgendaCalendarOverlayProps {
  readonly open: boolean;
  readonly mode: 'create' | 'edit';
  /** Guaranteed non-null by the trigger guard (AdminAgendaView early-returns on null). */
  readonly centroId: TCentroId;
  readonly centroName: string;
  readonly citaId?: TCitaId;
  readonly prefill?: ICitaModalPrefill;
  /** YYYY-MM-DD — the day the overlay opens on (repositioned to the cita's day in edit). */
  readonly initialDate: string;
  readonly canManage: boolean;
  readonly onClose: () => void;
  readonly onSuccess: (action: 'created' | 'updated', clienteName: string) => void;
  readonly ref?: React.Ref<HTMLDivElement>;
}

interface IActiveForm {
  readonly mode: 'create' | 'edit';
  readonly citaId?: TCitaId;
}

/**
 * An exit the user attempted while the embedded CitaModal had unsaved input —
 * held here until they confirm discarding it (see `formDirtyRef` below).
 * `'close'` = leaving the overlay entirely; `'switch'` = picking a different
 * kanban card while a form is mid-fill.
 */
type TPendingExit =
  | { readonly kind: 'close' }
  | { readonly kind: 'switch'; readonly citaId: TCitaId };

const OVERLAY_TITLE_ID = 'agenda-calendar-overlay-title';

// ── Date formatting (locale-aware — never en-US hardcoded) ────────────────────
function formatLongDate(dateStr: string, locale: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

function formatWeekRange(weekStartStr: string, locale: string): string {
  const start = new Date(`${weekStartStr}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

// ── Icons (decorative) ────────────────────────────────────────────────────────
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export const AgendaCalendarOverlay = ({
  open,
  mode,
  centroId,
  centroName,
  citaId,
  prefill,
  initialDate,
  canManage,
  onClose,
  onSuccess,
  ref,
}: IAgendaCalendarOverlayProps): React.ReactElement | null => {
  const { t, i18n } = useTranslation('agenda');
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);

  const [overlayDate, setOverlayDate] = useState(initialDate);
  const [activeForm, setActiveForm] = useState<IActiveForm>(() =>
    mode === 'edit' ? { mode: 'edit', citaId } : { mode: 'create' },
  );
  const [liveMessage, setLiveMessage] = useState('');

  // ── Unsaved-input guard ──────────────────────────────────────────────────────
  // The embedded CitaModal is keyed by activeForm (line ~310) — picking a
  // DIFFERENT kanban card, closing via ✕/Escape/backdrop, or Cancel inside the
  // form all used to discard whatever the user had typed with no warning. A
  // ref (not state) because it must be read synchronously inside event
  // handlers without waiting for a re-render.
  const formDirtyRef = useRef(false);
  const [pendingExit, setPendingExit] = useState<TPendingExit | null>(null);

  // Re-arms the guard for the CitaModal instance that (re)mounts under the
  // new key whenever activeForm changes (covers the initial mount too).
  useEffect(() => {
    formDirtyRef.current = false;
  }, [activeForm]);

  const onFormDirty = useCallback(() => {
    formDirtyRef.current = true;
  }, []);

  // Any close attempt (✕ / Escape / backdrop / the form's own Cancel button —
  // all wired to this) is deferred behind a confirmation when the form is
  // dirty, instead of silently discarding it.
  const guardedClose = useCallback(() => {
    if (formDirtyRef.current) {
      setPendingExit({ kind: 'close' });
      return;
    }
    onClose();
  }, [onClose]);

  // ── Modal a11y (reuse the Modal hooks) ──────────────────────────────────────
  useLockScroll(open);
  // Disabled while the discard-confirmation Dialog is up — that Dialog owns
  // Escape itself (bound to onCancelDiscard) so the two don't double-handle it.
  useEscapeKey(open && pendingExit === null, guardedClose, true);
  useFocusTrap(open, cardRef);

  // ── Data ─────────────────────────────────────────────────────────────────────
  const weekData = useAdminWeekData(centroId, getWeekStart(overlayDate), open);
  const dayData = useAdminAgendaData(centroId, overlayDate);
  const dayCitas = useMemo(
    () => mergeDayCitas(dayData.appointments, dayData.unassignedAppointments),
    [dayData.appointments, dayData.unassignedAppointments],
  );

  // Edit reposition: once the cita resolves, snap the week + kanban to its day
  // (kanban context only — CitaModal keeps the cita's date). Runs once per citaId.
  const editCitaId = activeForm.mode === 'edit' ? (activeForm.citaId ?? null) : null;
  const { cita: editingCita } = useCitaById(open ? editCitaId : null);
  const repositionedRef = useRef<TCitaId | null>(null);
  useEffect(() => {
    if (editCitaId === null || editingCita === null) return;
    if (repositionedRef.current === editCitaId) return;
    repositionedRef.current = editCitaId;
    setOverlayDate(toLocalDateKey(editingCita.fechaHoraInicio));
  }, [editCitaId, editingCita]);

  // ── Day-change announcement (polite live region) ────────────────────────────
  const announcedDateRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open || announcedDateRef.current === overlayDate) return;
    announcedDateRef.current = overlayDate;
    const day = weekData.weekDays.find((d) => d.dateStr === overlayDate);
    setLiveMessage(
      t('calendarOverlay.a11y.dayChanged', {
        fecha: formatLongDate(overlayDate, i18n.language),
        count: day?.citaCount ?? dayCitas.length,
      }),
    );
  }, [open, overlayDate, weekData.weekDays, dayCitas.length, t, i18n.language]);

  // ── Defense-in-depth: close if write permission is lost while open ──────────
  // Returning null (below) only hides the surface — the parent still holds the
  // modal open in its state. Notifying it via onClose restores that invariant
  // (RLS is the real barrier; this is a UI safeguard). §6 SIN PERMISO.
  useEffect(() => {
    if (open && !canManage) onClose();
  }, [open, canManage, onClose]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const onSelectDay = useCallback((dateStr: string) => {
    setOverlayDate(dateStr);
  }, []);

  const onCardEdit = useCallback(
    (id: TCitaId) => {
      // Re-clicking the card already being edited is a no-op, not a "switch".
      if (activeForm.mode === 'edit' && activeForm.citaId === id) return;
      if (formDirtyRef.current) {
        setPendingExit({ kind: 'switch', citaId: id });
        return;
      }
      setActiveForm({ mode: 'edit', citaId: id });
    },
    [activeForm],
  );

  // The form's own save succeeded — its input is now persisted, so the close
  // that immediately follows (CitaModal calls onClose() right after onSuccess)
  // must NOT be treated as "discarding" it.
  const handleFormSuccess = useCallback(
    (action: 'created' | 'updated', clienteName: string) => {
      formDirtyRef.current = false;
      onSuccess(action, clienteName);
    },
    [onSuccess],
  );

  const onConfirmDiscard = useCallback(() => {
    if (pendingExit === null) return;
    if (pendingExit.kind === 'close') onClose();
    else setActiveForm({ mode: 'edit', citaId: pendingExit.citaId });
    setPendingExit(null);
  }, [pendingExit, onClose]);

  const onCancelDiscard = useCallback(() => {
    setPendingExit(null);
  }, []);

  const onPrevWeek = useCallback(() => {
    setOverlayDate((d) => stepPeriod(d, 'week', -1));
  }, []);
  const onNextWeek = useCallback(() => {
    setOverlayDate((d) => stepPeriod(d, 'week', 1));
  }, []);
  const onToday = useCallback(() => {
    setOverlayDate(getTodayKey());
  }, []);

  const onRetry = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['agenda'] });
  }, [queryClient]);

  const onScrimClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) guardedClose();
    },
    [guardedClose],
  );

  // Create-mode prefill for the embedded CitaModal. Memoised by [prefill,
  // overlayDate] so its identity only changes when the selected day or the
  // incoming prefill actually change — never on an unrelated overlay re-render
  // (e.g. a background refetch settle from useAdminWeekData/useAdminAgendaData,
  // refetchOnWindowFocus defaults to true). A fresh inline object literal would
  // re-fire CitaModal's prefill effect (deps [open, mode, prefill]), rewriting
  // fecha (always) plus usuarioId/horaInicio/clienteId when supplied — pisando
  // the user's mid-form entries. Deliberate memo (Compiler NOT active).
  const createPrefill = useMemo<ICitaModalPrefill>(
    () => ({ ...prefill, fecha: overlayDate }),
    [prefill, overlayDate],
  );

  // ── Render gating ─────────────────────────────────────────────────────────────
  // Losing write permission (or a closed overlay) renders nothing (§3.8).
  if (!open || !canManage) return null;

  const title =
    activeForm.mode === 'create'
      ? t('calendarOverlay.titleCreate')
      : t('calendarOverlay.titleEdit');
  const subtitle = t('calendarOverlay.subtitle', {
    centro: centroName,
    rango: formatWeekRange(getWeekStart(overlayDate), i18n.language),
  });
  const dateLabel = formatLongDate(overlayDate, i18n.language);

  return createPortal(
    <S.StyledOverlayScrim onClick={onScrimClick} role="presentation">
      <S.StyledOverlayCard
        ref={mergeRefs(cardRef, ref)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={OVERLAY_TITLE_ID}
      >
        <S.StyledOverlayClose
          type="button"
          onClick={guardedClose}
          aria-label={t('calendarOverlay.close')}
        >
          <IconClose />
        </S.StyledOverlayClose>

        <S.StyledOverlayHeader>
          <S.StyledOverlayHeaderMain>
            <S.StyledOverlayTitle id={OVERLAY_TITLE_ID}>{title}</S.StyledOverlayTitle>
            <S.StyledOverlaySubtitle>{subtitle}</S.StyledOverlaySubtitle>
          </S.StyledOverlayHeaderMain>

          <S.StyledOverlayNav>
            <S.StyledOverlayNavButton
              type="button"
              onClick={onPrevWeek}
              aria-label={t('calendarOverlay.weekNav.prev')}
            >
              <IconChevronLeft />
            </S.StyledOverlayNavButton>
            <S.StyledOverlayTodayChip type="button" onClick={onToday}>
              {t('calendarOverlay.weekNav.today')}
            </S.StyledOverlayTodayChip>
            <S.StyledOverlayNavButton
              type="button"
              onClick={onNextWeek}
              aria-label={t('calendarOverlay.weekNav.next')}
            >
              <IconChevronRight />
            </S.StyledOverlayNavButton>
          </S.StyledOverlayNav>
        </S.StyledOverlayHeader>

        <S.StyledOverlayGrid>
          <CalendarWeekStrip
            weekDays={weekData.weekDays}
            selectedDate={overlayDate}
            onSelectDay={onSelectDay}
          />

          <CalendarDayKanban
            dayCitas={dayCitas}
            therapists={dayData.therapists}
            colorMap={weekData.colorMap}
            centroName={centroName}
            dateLabel={dateLabel}
            isLoading={dayData.isLoading}
            isError={dayData.isError}
            onRetry={onRetry}
            onCardEdit={onCardEdit}
          />

          <S.StyledFormArea aria-label={t('calendarOverlay.formSectionLabel')}>
            <CitaModal
              key={`${activeForm.mode}-${activeForm.citaId ?? 'new'}`}
              open
              presentation="inline"
              mode={activeForm.mode}
              centroId={centroId}
              citaId={activeForm.mode === 'edit' ? activeForm.citaId : undefined}
              prefill={activeForm.mode === 'create' ? createPrefill : undefined}
              onClose={guardedClose}
              onSuccess={handleFormSuccess}
              onDirty={onFormDirty}
            />
          </S.StyledFormArea>
        </S.StyledOverlayGrid>

        <S.StyledLiveRegion role="status" aria-live="polite">
          {liveMessage}
        </S.StyledLiveRegion>
      </S.StyledOverlayCard>

      {pendingExit !== null && (
        <Dialog
          open
          type="warning"
          title={t('calendarOverlay.discardDialog.title')}
          message={
            pendingExit.kind === 'close'
              ? t('calendarOverlay.discardDialog.messageClose')
              : t('calendarOverlay.discardDialog.messageSwitch')
          }
          confirmText={t('calendarOverlay.discardDialog.confirm')}
          cancelText={t('calendarOverlay.discardDialog.cancel')}
          onConfirm={onConfirmDiscard}
          onCancel={onCancelDiscard}
          onClose={onCancelDiscard}
        />
      )}
    </S.StyledOverlayScrim>,
    document.body,
  );
};

// Merges the internal focus-trap ref with an optional forwarded ref (ref-as-prop).
function mergeRefs(
  internal: React.RefObject<HTMLDivElement | null>,
  external: React.Ref<HTMLDivElement> | undefined,
): (node: HTMLDivElement | null) => void {
  return (node) => {
    internal.current = node;
    if (typeof external === 'function') external(node);
    else if (external !== null && external !== undefined) {
      external.current = node;
    }
  };
}
