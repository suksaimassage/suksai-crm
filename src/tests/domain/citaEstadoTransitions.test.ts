/**
 * citaEstadoTransitions.test.ts
 *
 * Pure unit tests for the cita estado state machine (Analyst §5).
 * No mocks — the module is a pure transition graph over TEstadoCita.
 *
 * Covers, for ALL 6 estados:
 *   legalNextEstados      — the exact outgoing edge set
 *   isLegalEstadoTransition — every (from → to) pair, legal and illegal
 *   isTerminalEstado      — terminal vs non-terminal classification
 *
 * Target: 100% (statements / branches / functions / lines).
 */

import { describe, it, expect } from 'vitest';
import {
  legalNextEstados,
  isLegalEstadoTransition,
  isTerminalEstado,
} from '@domain/services/citaEstadoTransitions';
import type { TEstadoCita } from '@domain/types';

// The authoritative graph from Analyst §5, duplicated here as the test oracle.
const EXPECTED_GRAPH: Readonly<Record<TEstadoCita, readonly TEstadoCita[]>> = {
  sin_asignar: ['cancelada'],
  pendiente: ['confirmada', 'cancelada', 'no_presentado'],
  confirmada: ['en_curso', 'completada', 'cancelada', 'no_presentado'],
  en_curso: ['completada', 'cancelada'],
  completada: [],
  cancelada: [],
  no_presentado: [],
};

const ALL_ESTADOS: readonly TEstadoCita[] = [
  'sin_asignar',
  'pendiente',
  'confirmada',
  'en_curso',
  'completada',
  'cancelada',
  'no_presentado',
];

// ── legalNextEstados ────────────────────────────────────────────────────────

describe('legalNextEstados', () => {
  it.each(ALL_ESTADOS)('returns the exact legal next-state set for "%s"', (estado) => {
    // toEqual on arrays is order-sensitive; the graph order is part of the contract
    expect(legalNextEstados(estado)).toEqual(EXPECTED_GRAPH[estado]);
  });

  it('pendiente can transition to confirmada, cancelada, no_presentado (3 edges)', () => {
    expect(legalNextEstados('pendiente')).toHaveLength(3);
  });

  it('confirmada has the widest fan-out (4 edges)', () => {
    expect(legalNextEstados('confirmada')).toEqual([
      'en_curso',
      'completada',
      'cancelada',
      'no_presentado',
    ]);
  });

  it('en_curso can only reach completada or cancelada (2 edges)', () => {
    expect(legalNextEstados('en_curso')).toEqual(['completada', 'cancelada']);
  });

  it.each(['completada', 'cancelada', 'no_presentado'] as const)(
    'terminal estado "%s" has zero outgoing edges',
    (estado) => {
      expect(legalNextEstados(estado)).toEqual([]);
    },
  );
});

// ── isLegalEstadoTransition (full matrix) ───────────────────────────────────

describe('isLegalEstadoTransition — full transition matrix', () => {
  // Build every (from, to) pair and assert against the oracle graph.
  const pairs: [TEstadoCita, TEstadoCita, boolean][] = [];
  for (const from of ALL_ESTADOS) {
    for (const to of ALL_ESTADOS) {
      pairs.push([from, to, EXPECTED_GRAPH[from].includes(to)]);
    }
  }

  it.each(pairs)('%s → %s is legal=%s', (from, to, expected) => {
    expect(isLegalEstadoTransition(from, to)).toBe(expected);
  });
});

describe('isLegalEstadoTransition — representative legal edges', () => {
  it('allows sin_asignar → cancelada (only legal exit from unassigned)', () => {
    expect(isLegalEstadoTransition('sin_asignar', 'cancelada')).toBe(true);
  });

  it('allows pendiente → confirmada', () => {
    expect(isLegalEstadoTransition('pendiente', 'confirmada')).toBe(true);
  });

  it('allows confirmada → en_curso → completada chain', () => {
    expect(isLegalEstadoTransition('confirmada', 'en_curso')).toBe(true);
    expect(isLegalEstadoTransition('en_curso', 'completada')).toBe(true);
  });

  it('allows pendiente → no_presentado (no-show before confirmation)', () => {
    expect(isLegalEstadoTransition('pendiente', 'no_presentado')).toBe(true);
  });
});

describe('isLegalEstadoTransition — representative illegal edges', () => {
  it('rejects sin_asignar → pendiente (must be cancelled, not advanced)', () => {
    expect(isLegalEstadoTransition('sin_asignar', 'pendiente')).toBe(false);
  });

  it('rejects en_curso → no_presentado (cannot no-show an in-progress cita)', () => {
    expect(isLegalEstadoTransition('en_curso', 'no_presentado')).toBe(false);
  });

  it('rejects completada → confirmada (no resurrection of a terminal state)', () => {
    expect(isLegalEstadoTransition('completada', 'confirmada')).toBe(false);
  });

  it('rejects cancelada → pendiente (terminal is terminal)', () => {
    expect(isLegalEstadoTransition('cancelada', 'pendiente')).toBe(false);
  });

  it('rejects a no-op self-transition pendiente → pendiente', () => {
    // The graph never lists a state as its own successor; self-edges are illegal.
    expect(isLegalEstadoTransition('pendiente', 'pendiente')).toBe(false);
  });

  it('rejects confirmada → pendiente (cannot move backwards)', () => {
    expect(isLegalEstadoTransition('confirmada', 'pendiente')).toBe(false);
  });
});

// ── isTerminalEstado ────────────────────────────────────────────────────────

describe('isTerminalEstado', () => {
  it.each(['completada', 'cancelada', 'no_presentado'] as const)(
    'classifies "%s" as terminal',
    (estado) => {
      expect(isTerminalEstado(estado)).toBe(true);
    },
  );

  it.each(['sin_asignar', 'pendiente', 'confirmada', 'en_curso'] as const)(
    'classifies "%s" as non-terminal',
    (estado) => {
      expect(isTerminalEstado(estado)).toBe(false);
    },
  );

  it('terminal classification is consistent with an empty legalNextEstados', () => {
    for (const estado of ALL_ESTADOS) {
      expect(isTerminalEstado(estado)).toBe(legalNextEstados(estado).length === 0);
    }
  });
});
