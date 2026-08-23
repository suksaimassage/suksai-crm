/**
 * TerapeutaStatusService.ts
 *
 * Pure domain service — no framework, no async, no I/O.
 * Derives the real-time operational status of a therapist from aggregated
 * data (citas, horarios, ausencias) + the current timestamp.
 *
 * Priority order (highest → lowest):
 *   inactivo  — user.activo === false
 *   ausente   — any approved ausencia covering today
 *   en_sala   — any ICita with estado 'en_curso' spanning now
 *   disponible — any IHorarioTrabajo (fijo) covering current day + time
 *   descanso  — fallback when none of the above match
 */

import type { IUsuario, IAusencia, ICita, IHorarioTrabajo } from '../models';
import type { TTerapeutaEstado } from '../types';

export interface IDeriveEstadoParams {
  readonly usuario: IUsuario;
  readonly ausencias: readonly IAusencia[];
  readonly citasActuales: readonly ICita[];
  readonly horarios: readonly IHorarioTrabajo[];
  readonly now: Date;
}

function toMinutesSinceMidnight(hhmm: string): number {
  const parts = hhmm.split(':');
  return parseInt(parts[0] ?? '0', 10) * 60 + parseInt(parts[1] ?? '0', 10);
}

function isoDateStr(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

export function deriveEstado(params: IDeriveEstadoParams): TTerapeutaEstado {
  const { usuario, ausencias, citasActuales, horarios, now } = params;

  if (!usuario.activo) return 'inactivo';

  const todayStr = isoDateStr(now);
  const isAusente = ausencias.some((a) => {
    const inicio = isoDateStr(a.fechaInicio);
    const fin = isoDateStr(a.fechaFin);
    return inicio <= todayStr && todayStr <= fin;
  });
  if (isAusente) return 'ausente';

  const isEnSala = citasActuales.some(
    (c) =>
      c.usuarioId === usuario.id &&
      c.estado === 'en_curso' &&
      c.fechaHoraInicio <= now &&
      now <= c.fechaHoraFin,
  );
  if (isEnSala) return 'en_sala';

  // ISO weekday: Mon=1 … Sun=7
  const rawDay = now.getDay();
  const isoDay = rawDay === 0 ? 7 : rawDay;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const isDisponible = horarios.some((h) => {
    if (h.tipo !== 'recurrente') return false;
    if (h.diaSemana !== isoDay) return false;
    const start = toMinutesSinceMidnight(h.horaInicio);
    const end = toMinutesSinceMidnight(h.horaFin);
    return nowMinutes >= start && nowMinutes < end;
  });
  if (isDisponible) return 'disponible';

  return 'descanso';
}
