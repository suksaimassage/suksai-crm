/**
 * domain/services/citaEstadoTransitions.ts — Cita estado state machine
 *
 * Pure, framework-agnostic transition graph for appointment lifecycle.
 * Source of truth: Analyst spec §5 (Estado transition legality).
 *
 *   sin_asignar   → cancelada
 *   pendiente     → confirmada | cancelada | no_presentado
 *   confirmada    → en_curso   | completada | cancelada | no_presentado
 *   en_curso      → completada | cancelada
 *   completada    → (terminal)
 *   cancelada     → (terminal)
 *   no_presentado → (terminal)
 *
 * Used by CitaService.changeEstado as the legality guard. Kept separate so it
 * can be unit-tested in isolation and reused by the UI to render only legal
 * next states.
 */

import type { TEstadoCita } from '../types';

const TRANSITION_GRAPH: Readonly<Record<TEstadoCita, readonly TEstadoCita[]>> = {
  sin_asignar: ['cancelada'],
  pendiente: ['confirmada', 'cancelada', 'no_presentado'],
  confirmada: ['en_curso', 'completada', 'cancelada', 'no_presentado'],
  en_curso: ['completada', 'cancelada'],
  completada: [],
  cancelada: [],
  no_presentado: [],
};

/** The estados a cita in `current` may legally transition to. Empty = terminal. */
export function legalNextEstados(current: TEstadoCita): readonly TEstadoCita[] {
  return TRANSITION_GRAPH[current];
}

/** True if `current → next` is a permitted transition in the lifecycle graph. */
export function isLegalEstadoTransition(current: TEstadoCita, next: TEstadoCita): boolean {
  return TRANSITION_GRAPH[current].includes(next);
}

/** True if the estado is terminal (no legal outgoing transitions). */
export function isTerminalEstado(estado: TEstadoCita): boolean {
  return TRANSITION_GRAPH[estado].length === 0;
}
