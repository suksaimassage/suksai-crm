/**
 * TerapeutaStatsService.ts
 *
 * Pure domain functions — no framework, no async, no I/O.
 * Computes weekly performance statistics for a single therapist from
 * pre-fetched collections of citas and horarios.
 */

import type { IHorarioTrabajo } from '../models';
import type { TUserId } from '../types';

export interface ICitaForStats {
  readonly usuarioId: TUserId;
  readonly estado: string | null;
  readonly fechaInicio: string | null;
  readonly precio: number | null;
}

function toMinutes(hhmm: string): number {
  const parts = hhmm.split(':');
  return parseInt(parts[0] ?? '0', 10) * 60 + parseInt(parts[1] ?? '0', 10);
}

export function computeSesionesEstaSemana(
  usuarioId: TUserId,
  citas: readonly ICitaForStats[],
  weekStart: Date,
  weekEnd: Date,
): number {
  return citas.filter((c) => {
    if (c.usuarioId !== usuarioId) return false;
    // Count all active sessions (scheduled + in-progress + completed).
    // Only exclude cancelled and no-show so the card shows the full weekly workload.
    if (c.estado === null || c.estado === 'cancelada' || c.estado === 'no_show') return false;
    if (c.fechaInicio === null) return false;
    const d = new Date(c.fechaInicio);
    return d >= weekStart && d <= weekEnd;
  }).length;
}

export function computeTotalHorasSemana(
  usuarioId: TUserId,
  horarios: readonly IHorarioTrabajo[],
): number {
  const recurrentes = horarios.filter((h) => h.usuarioId === usuarioId && h.tipo === 'recurrente');
  return recurrentes.reduce((acc, h) => {
    const start = toMinutes(h.horaInicio);
    const end = toMinutes(h.horaFin);
    const diff = Math.max(0, end - start);
    return acc + diff / 60;
  }, 0);
}

export function computeIngresosSemana(
  usuarioId: TUserId,
  citas: readonly ICitaForStats[],
  weekStart: Date,
  weekEnd: Date,
): number {
  return citas
    .filter((c) => {
      if (c.usuarioId !== usuarioId) return false;
      if (c.estado !== 'completada' && c.estado !== 'en_curso') return false;
      if (c.fechaInicio === null) return false;
      const d = new Date(c.fechaInicio);
      return d >= weekStart && d <= weekEnd;
    })
    .reduce((acc, c) => acc + (c.precio ?? 0), 0);
}

export function deriveEspecialidades(
  usuarioId: TUserId,
  servicioNombreByUsuario: readonly { readonly usuarioId: TUserId; readonly nombre: string }[],
): readonly string[] {
  const nombres = servicioNombreByUsuario
    .filter((s) => s.usuarioId === usuarioId)
    .map((s) => s.nombre);
  const unique = Array.from(new Set(nombres)).sort();
  return unique.slice(0, 3);
}

export function computeServicioMasRealizado(
  usuarioId: TUserId,
  servicioNombreByUsuario: readonly { readonly usuarioId: TUserId; readonly nombre: string }[],
): string | null {
  const nombres = servicioNombreByUsuario
    .filter((s) => s.usuarioId === usuarioId)
    .map((s) => s.nombre)
    .filter((n) => n !== '');

  if (nombres.length === 0) return null;

  const counts = new Map<string, number>();
  for (const nombre of nombres) {
    counts.set(nombre, (counts.get(nombre) ?? 0) + 1);
  }

  let topName: string | null = null;
  let topCount = 0;
  for (const [name, count] of counts) {
    if (count > topCount) {
      topCount = count;
      topName = name;
    }
  }

  return topName;
}
