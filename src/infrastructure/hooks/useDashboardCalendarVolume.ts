/**
 * useDashboardCalendarVolume.ts
 *
 * Fetches citas for the current week and transforms them into IVolumeData[]
 * for the CalendarVolume heatmap component.
 *
 * Week boundaries: Monday 00:00 → Sunday 23:59 of the current week.
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseCitaAdapter } from '@infra/adapters/SupabaseCitaAdapter';
import type { IVolumeData } from '@infra/components/ui/common/CalendarVolume';
import type { TCentroId } from '@domain/types';

const citaAdapter = new SupabaseCitaAdapter();

// ── Week boundary helper ──────────────────────────────────────────────────────

function currentWeekBounds(): { weekStart: Date; weekEnd: Date; weekStartISO: string } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Date.toISOString() always produces 'YYYY-MM-DDTHH:...' — split[0] is string
  const weekStartISO = weekStart.toISOString().split('T')[0];

  return { weekStart, weekEnd, weekStartISO };
}

// ── Transform helpers ─────────────────────────────────────────────────────────

function citasToVolumeData(citas: readonly { readonly fechaHoraInicio: Date }[]): IVolumeData[] {
  // Count occurrences per (day, hour) pair
  const volumeMap = new Map<string, number>();

  for (const cita of citas) {
    // Date.toISOString() always produces 'YYYY-MM-DDTHH:...' — split[0] is string
    const day = cita.fechaHoraInicio.toISOString().split('T')[0];
    const hour = cita.fechaHoraInicio.getHours();
    const key = `${day}_${hour}`;
    volumeMap.set(key, (volumeMap.get(key) ?? 0) + 1);
  }

  const result: IVolumeData[] = [];
  for (const [key, value] of volumeMap.entries()) {
    // key format is 'YYYY-MM-DD_HH' — slice on last underscore is safe
    const underscoreIndex = key.lastIndexOf('_');
    const day = key.slice(0, underscoreIndex);
    const hourStr = key.slice(underscoreIndex + 1);
    const hour = parseInt(hourStr, 10);
    result.push({ day, hour, value });
  }
  return result;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface IUseDashboardCalendarVolumeResult {
  readonly data: readonly IVolumeData[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export const useDashboardCalendarVolume = (
  centroId: TCentroId | null,
): IUseDashboardCalendarVolumeResult => {
  const { weekStart, weekEnd, weekStartISO } = currentWeekBounds();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'calendar-volume', centroId, weekStartISO],
    queryFn: async () => {
      if (centroId === null) return [];
      const citas = await citaAdapter.findByCentroAndRange(centroId, {
        from: weekStart,
        to: weekEnd,
      });
      return citasToVolumeData(citas);
    },
    enabled: centroId !== null,
    staleTime: 120_000, // 2 min
  });

  return {
    data: data ?? [],
    isLoading,
    isError,
  };
};
