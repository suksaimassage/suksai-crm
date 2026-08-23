import type { JSX } from 'react';
import type { ISala } from '@domain/models';
import {
  BotanicLotus,
  BotanicLeaf,
  BotanicDrop,
  BotanicFlame,
  BotanicHand,
} from './centros.botanic';

// ── Sala status ───────────────────────────────────────────────────────────────
// Re-exported here so all sub-components import from one location.
// TSalaStatus is also exported from CentrosPage.styles.ts for legacy usage —
// both point to the same union.

export type TSalaStatus = 'en_sesion' | 'disponible' | 'mantenimiento';

// ── Sala view mode ────────────────────────────────────────────────────────────

export type TSalaViewMode = 'grid' | 'list';

// ── Tab type ──────────────────────────────────────────────────────────────────

export type TTab = 'todos' | 'abiertos' | 'suite_pareja' | 'incidencias';

// ── Color variant for sala hero area ─────────────────────────────────────────

export type TColorVariant = 0 | 1 | 2 | 3 | 4;

// ── Sala table row (used by DetailPanel in list mode) ─────────────────────────

export interface ISalaTableRow {
  readonly key: string;
  readonly nombre: string;
  readonly statusLabel: string;
  readonly capacidad: string;
  readonly slotsHoy: string;
  readonly _status: TSalaStatus;
  [key: string]: unknown;
}

// ── Per-centro stats (passed from useCentrosPage into CenterList) ──────────────

export interface ICentroStatsEntry {
  readonly salaCount: number;
  readonly staffCount: number;
  readonly ocupacionPct: number;
}

// ── Shared constants ──────────────────────────────────────────────────────────

export const TOTAL_SLOTS = 11;

export const STATUS_KEY: Record<TSalaStatus, string> = {
  en_sesion: 'enSesion',
  disponible: 'disponible',
  mantenimiento: 'mantenimiento',
};

export const TABS: readonly TTab[] = ['todos', 'abiertos', 'suite_pareja', 'incidencias'];

export const TAB_I18N_KEY: Record<TTab, string> = {
  todos: 'todos',
  abiertos: 'abiertos',
  suite_pareja: 'suitePareja',
  incidencias: 'incidencias',
};

// ── Sala status derivation ────────────────────────────────────────────────────

export function deriveSalaStatus(sala: ISala, hasActiveCita: boolean): TSalaStatus {
  if (!sala.activa) return 'mantenimiento';
  if (hasActiveCita) return 'en_sesion';
  return 'disponible';
}

// ── Botanic ornament array ────────────────────────────────────────────────────
// Placed here (non-component file) to satisfy react-refresh/only-export-components.

export const BOTANIC_ORNAMENTS: readonly [
  () => JSX.Element,
  () => JSX.Element,
  () => JSX.Element,
  () => JSX.Element,
  () => JSX.Element,
] = [BotanicLotus, BotanicLeaf, BotanicDrop, BotanicFlame, BotanicHand];
