/**
 * useTherapistAvailability.ts — available start slots for a therapist on a date.
 *
 * Wraps `availabilityService.getAvailableSlots` (composition root) so the
 * CitaModal can pre-fill / restrict the start-time Select to slots where BOTH
 * the therapist and the SELECTED sala are free. `usuario` and `sala` are
 * OPTIONAL — when omitted, the service falls back to a generic studio window
 * (see AvailabilityService's UNASSIGNED_OPEN_MIN/UNASSIGNED_CLOSE_MIN). Only
 * centro, fecha and duración are required before the query fires.
 *
 * In edit mode the modal passes `excludeCitaId` so the cita being rescheduled
 * is dropped from the overlap sets and its own current slot stays selectable.
 *
 * Read-only — no cache invalidation here.
 */

import { useQuery } from '@tanstack/react-query';
import { availabilityService } from '@infra/services/agendaServices';
import type { IAvailableSlot, IAvailabilityResult } from '@domain/index';
import type { TUserId, TCentroId, TSalaId, TCitaId } from '@domain/types';

export interface IUseTherapistAvailabilityResult {
  readonly slots: readonly IAvailableSlot[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  /**
   * Whether the therapist had an active working window that day. Lets the modal
   * distinguish a genuine "no free slots" (worked but booked/absent) from the
   * "no schedule → full-grid fallback" state. Defaults to `true` while loading /
   * before data so the field never flashes the no-schedule caption prematurely.
   */
  readonly hadSchedule: boolean;
}

export interface IUseTherapistAvailabilityParams {
  readonly usuarioId: TUserId | null;
  readonly centroId: TCentroId | null;
  /** ISO date string (YYYY-MM-DD) the modal's DatePicker produced. */
  readonly fecha: string | null;
  readonly duracionMinutos: number | null;
  /** Selected sala — slots are computed against THIS room's bookings. */
  readonly salaId: TSalaId | null;
  /** Edit mode: the cita being rescheduled, excluded from the overlap sets. */
  readonly excludeCitaId?: TCitaId;
}

export const useTherapistAvailability = ({
  usuarioId,
  centroId,
  fecha,
  duracionMinutos,
  salaId,
  excludeCitaId,
}: IUseTherapistAvailabilityParams): IUseTherapistAvailabilityResult => {
  // usuarioId and salaId are structurally optional in the service (null →
  // studio fallback / no-sala check) — only centro, fecha and duración are
  // required before the query fires.
  const enabled =
    centroId !== null && fecha !== null && duracionMinutos !== null && duracionMinutos > 0;

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'agenda',
      'availability',
      usuarioId,
      centroId,
      fecha,
      duracionMinutos,
      salaId,
      excludeCitaId ?? null,
    ] as const,
    queryFn: (): Promise<IAvailabilityResult> => {
      // centroId/fecha/duracionMinutos are guaranteed non-null by `enabled`
      // above. usuarioId/salaId are passed through as-is — the service treats
      // them as optional (null → generic studio fallback / no-sala check).
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const parsedDate = new Date(fecha! + 'T00:00:00');
      return availabilityService.getAvailableSlots(
        usuarioId,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        centroId!,
        parsedDate,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        duracionMinutos!,
        salaId,
        excludeCitaId,
      );
    },
    enabled,
    staleTime: 30_000,
  });

  return {
    slots: data?.slots ?? [],
    isLoading,
    isError,
    // Assume a schedule exists until proven otherwise (no premature no-schedule
    // caption while loading / before the first result).
    hadSchedule: data?.hadSchedule ?? true,
  };
};

/**
 * Spec alias — the functional spec refers to this hook as `useAvailableSlots`.
 * It is the SAME hook; do not build a parallel implementation.
 */
export const useAvailableSlots = useTherapistAvailability;
