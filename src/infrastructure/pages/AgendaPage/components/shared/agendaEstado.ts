/**
 * agendaEstado.ts — single source for estado → visual mapping (Designer §4.1).
 *
 * Maps a cita estado to (a) the calendar event variant token family, (b) a
 * non-color glyph, and (c) the dot fill/border colours used by badges, the
 * estado menu and the filter menu. Keeping this in one place guarantees the
 * grid, list, detail popover, estado menu and legend all agree — and that every
 * status carries a second, non-color cue (WCAG 1.4.1).
 *
 * Pure data + a tiny token resolver — no React, framework-agnostic shape.
 */

import type { TEstadoCita, TAgendaEvtVariant } from '@domain/types';
import type { TTheme } from '@infra/styles/themes/light.theme';
import type { TColorName } from '@infra/styles/themes/theme.types';

/** Estado → calendar event variant (tint family). */
export const ESTADO_VARIANT: Readonly<Record<TEstadoCita, TAgendaEvtVariant>> = {
  sin_asignar: 'unassigned',
  pendiente: 'pending',
  confirmada: 'gold',
  en_curso: 'clay',
  completada: 'jungle',
  cancelada: 'sand',
  no_presentado: 'lotus',
};

/**
 * Estado → non-color glyph (rendered aria-hidden; meaning lives in the text /
 * aria-label). Plain unicode marks, no icon dependency.
 */
export const ESTADO_GLYPH: Readonly<Record<TEstadoCita, string>> = {
  sin_asignar: '○',
  pendiente: '⏳',
  confirmada: '✓',
  en_curso: '▶',
  completada: '✓✓',
  cancelada: '✕',
  no_presentado: '⊘',
};

/**
 * Estado → DS `Tag` color. Drives the differential status Tag in the detail
 * popover: each estado maps to a distinct theme color so the tag reads its own
 * intent at a glance (the localized label + `ESTADO_GLYPH` carry the non-color
 * cue, WCAG 1.4.1).
 */
export const ESTADO_TAG_COLOR: Readonly<Record<TEstadoCita, TColorName>> = {
  sin_asignar: 'neutral',
  pendiente: 'warning',
  confirmada: 'primary',
  en_curso: 'info',
  completada: 'success',
  cancelada: 'neutralDark',
  no_presentado: 'error',
};

/** Estados that should render the client name with a strikethrough (cancelled). */
export function isStruckEstado(estado: TEstadoCita): boolean {
  return estado === 'cancelada';
}

/** Resolves the dot fill colour for an estado from theme tokens. */
export function estadoDotColor(estado: TEstadoCita, theme: TTheme): string {
  switch (estado) {
    case 'sin_asignar':
      return theme.color.text.tertiary;
    case 'pendiente':
      return theme.color.brand.gold[400];
    case 'confirmada':
      return theme.color.brand.gold[700];
    case 'en_curso':
      return theme.color.brand.clay[500];
    case 'completada':
      return theme.color.brand.jungle[700];
    case 'cancelada':
      return theme.color.brand.ink[500];
    case 'no_presentado':
      return theme.color.brand.lotus.text;
  }
}
