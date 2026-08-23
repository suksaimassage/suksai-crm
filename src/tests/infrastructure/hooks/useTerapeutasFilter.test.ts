/**
 * useTerapeutasFilter.test.ts
 *
 * Tests the filter/sort/count logic of useTerapeutasFilter hook.
 * No mocking needed — the hook has no adapter dependency (pure state + derivation).
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTerapeutasFilter } from '@infra/hooks/useTerapeutasFilter';
import type { ITerapeutaAggregate } from '@infra/hooks/useTerapeutas';
import type { TTerapeutaEstado } from '@domain/types';

// ── Fixture factory ────────────────────────────────────────────────────────────

let _idCounter = 1;

function makeAggregate(
  overrides: Partial<ITerapeutaAggregate> & { estadoActual: TTerapeutaEstado },
): ITerapeutaAggregate {
  const id = _idCounter++;
  return {
    usuarioId: id,
    nombre: `Terapeuta ${id}`,
    apellidos: '',
    email: '',
    telefono: null,
    activo: true,
    createdAt: new Date('2024-01-01'),
    salaActual: null,
    proximaCita: null,
    proximaCitaSala: null,
    horariosSemanales: [],
    totalHorasSemana: 0,
    sesionesEstaSemana: 0,
    ingresosSemana: 0,
    valoracionMedia: null,
    especialidades: [],
    roles: [],
    servicioMasRealizado: null,
    ...overrides,
  };
}

// Deterministic fixture list
const enSala1 = makeAggregate({
  estadoActual: 'en_sala',
  nombre: 'Zara López',
  sesionesEstaSemana: 5,
  ingresosSemana: 300,
});
const disponible1 = makeAggregate({
  estadoActual: 'disponible',
  nombre: 'Ana García',
  sesionesEstaSemana: 3,
  ingresosSemana: 150,
  especialidades: ['Masaje Tailandés'],
});
const disponible2 = makeAggregate({
  estadoActual: 'disponible',
  nombre: 'María Torres',
  sesionesEstaSemana: 1,
  ingresosSemana: 50,
  especialidades: ['Reflexología', 'Masaje Tailandés'],
});
const descanso1 = makeAggregate({
  estadoActual: 'descanso',
  nombre: 'Pablo Ruiz',
  sesionesEstaSemana: 0,
  ingresosSemana: 0,
});
const ausente1 = makeAggregate({
  estadoActual: 'ausente',
  nombre: 'Carmen Vega',
  sesionesEstaSemana: 0,
  ingresosSemana: 0,
});
const inactivo1 = makeAggregate({
  estadoActual: 'inactivo',
  nombre: 'Bruno Díaz',
  activo: false,
  sesionesEstaSemana: 0,
  ingresosSemana: 0,
});

const ALL_AGGREGATES: readonly ITerapeutaAggregate[] = [
  enSala1,
  disponible1,
  disponible2,
  descanso1,
  ausente1,
  inactivo1,
];

// ── Default state ─────────────────────────────────────────────────────────────

describe('useTerapeutasFilter — initial state', () => {
  it('isDirty is false with default state', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    expect(result.current.isDirty).toBe(false);
  });

  it('filterState defaults match expected values', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    expect(result.current.filterState.tab).toBe('todos');
    expect(result.current.filterState.search).toBe('');
    expect(result.current.filterState.especialidad).toBeNull();
    expect(result.current.filterState.sort).toBe('nombre_asc');
  });

  it('returns all aggregates in todos tab by default', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    expect(result.current.filtered).toHaveLength(ALL_AGGREGATES.length);
  });
});

// ── Tab filter ────────────────────────────────────────────────────────────────

describe('useTerapeutasFilter — tab filter', () => {
  it('todos tab shows all aggregates', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setTab('todos');
    });
    expect(result.current.filtered).toHaveLength(6);
  });

  it('en_sala tab shows only en_sala aggregates', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setTab('en_sala');
    });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].estadoActual).toBe('en_sala');
  });

  it('disponibles tab shows only disponible aggregates', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setTab('disponibles');
    });
    expect(result.current.filtered).toHaveLength(2);
    result.current.filtered.forEach((a) => {
      expect(a.estadoActual).toBe('disponible');
    });
  });

  it('descanso tab shows BOTH descanso AND ausente aggregates', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setTab('descanso');
    });
    expect(result.current.filtered).toHaveLength(2);
    const estados = result.current.filtered.map((a) => a.estadoActual);
    expect(estados).toContain('descanso');
    expect(estados).toContain('ausente');
  });

  it('inactivos tab shows only inactivo aggregates', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setTab('inactivos');
    });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].estadoActual).toBe('inactivo');
  });
});

// ── Search filter ─────────────────────────────────────────────────────────────

describe('useTerapeutasFilter — search', () => {
  it('filters by case-insensitive nombre match', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setSearch('ana');
    });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].nombre).toBe('Ana García');
  });

  it('matches partial text in apellidos', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setSearch('García');
    });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].nombre).toBe('Ana García');
  });

  it('empty search shows all aggregates', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setSearch('nonexistent');
    });
    expect(result.current.filtered).toHaveLength(0);
    act(() => {
      result.current.setSearch('');
    });
    expect(result.current.filtered).toHaveLength(6);
  });

  it('search is case-insensitive (uppercase)', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setSearch('ZARA');
    });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].nombre).toBe('Zara López');
  });

  it('search with no matches returns empty filtered', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setSearch('xyz-not-found-99');
    });
    expect(result.current.filtered).toHaveLength(0);
  });
});

// ── Especialidad filter ───────────────────────────────────────────────────────

describe('useTerapeutasFilter — especialidad filter', () => {
  it('filters by exact especialidad match', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setEspecialidad('Reflexología');
    });
    // Only disponible2 has Reflexología
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].nombre).toBe('María Torres');
  });

  it('returns multiple results when several aggregates share the especialidad', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setEspecialidad('Masaje Tailandés');
    });
    // Both disponible1 and disponible2 have Masaje Tailandés
    expect(result.current.filtered).toHaveLength(2);
  });

  it('null especialidad clears the filter (returns all)', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setEspecialidad('Reflexología');
    });
    expect(result.current.filtered).toHaveLength(1);
    act(() => {
      result.current.setEspecialidad(null);
    });
    expect(result.current.filtered).toHaveLength(6);
  });

  it('returns empty when especialidad does not match any aggregate', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setEspecialidad('Acupuntura');
    });
    expect(result.current.filtered).toHaveLength(0);
  });

  it('allEspecialidades returns deduplicated sorted list from all aggregates', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    expect(result.current.allEspecialidades).toEqual(['Masaje Tailandés', 'Reflexología']);
  });
});

// ── Sort ──────────────────────────────────────────────────────────────────────

describe('useTerapeutasFilter — sort', () => {
  it('nombre_asc sorts alphabetically ascending', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setSort('nombre_asc');
    });
    const nombres = result.current.filtered.map((a) => a.nombre);
    expect(nombres).toEqual([...nombres].sort((a, b) => a.localeCompare(b)));
  });

  it('nombre_desc sorts alphabetically descending', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setSort('nombre_desc');
    });
    const nombres = result.current.filtered.map((a) => a.nombre);
    expect(nombres).toEqual([...nombres].sort((a, b) => b.localeCompare(a)));
  });

  it('sesiones_desc sorts by sesionesEstaSemana descending', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setSort('sesiones_desc');
    });
    const sesiones = result.current.filtered.map((a) => a.sesionesEstaSemana);
    for (let i = 0; i < sesiones.length - 1; i++) {
      expect(sesiones[i]).toBeGreaterThanOrEqual(sesiones[i + 1] ?? 0);
    }
  });

  it('ingresos_desc sorts by ingresosSemana descending', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setSort('ingresos_desc');
    });
    const ingresos = result.current.filtered.map((a) => a.ingresosSemana);
    for (let i = 0; i < ingresos.length - 1; i++) {
      expect(ingresos[i]).toBeGreaterThanOrEqual(ingresos[i + 1] ?? 0);
    }
  });
});

// ── isDirty ───────────────────────────────────────────────────────────────────

describe('useTerapeutasFilter — isDirty', () => {
  it('isDirty is true when tab is changed from default', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setTab('en_sala');
    });
    expect(result.current.isDirty).toBe(true);
  });

  it('isDirty is true when search is set', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setSearch('Ana');
    });
    expect(result.current.isDirty).toBe(true);
  });

  it('isDirty is true when especialidad is set', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setEspecialidad('Reflexología');
    });
    expect(result.current.isDirty).toBe(true);
  });

  it('isDirty is true when sort is changed from default', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setSort('nombre_desc');
    });
    expect(result.current.isDirty).toBe(true);
  });

  it('isDirty returns to false after clearFilters', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setTab('en_sala');
      result.current.setSearch('Ana');
      result.current.setEspecialidad('Reflexología');
      result.current.setSort('nombre_desc');
    });
    expect(result.current.isDirty).toBe(true);
    act(() => {
      result.current.clearFilters();
    });
    expect(result.current.isDirty).toBe(false);
  });
});

// ── clearFilters ──────────────────────────────────────────────────────────────

describe('useTerapeutasFilter — clearFilters', () => {
  it('resets all filter state to defaults', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setTab('en_sala');
      result.current.setSearch('test');
      result.current.setEspecialidad('Reflexología');
      result.current.setSort('nombre_desc');
    });
    act(() => {
      result.current.clearFilters();
    });
    expect(result.current.filterState.tab).toBe('todos');
    expect(result.current.filterState.search).toBe('');
    expect(result.current.filterState.especialidad).toBeNull();
    expect(result.current.filterState.sort).toBe('nombre_asc');
  });

  it('returns all aggregates after clearFilters', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setTab('en_sala');
    });
    expect(result.current.filtered).toHaveLength(1);
    act(() => {
      result.current.clearFilters();
    });
    expect(result.current.filtered).toHaveLength(ALL_AGGREGATES.length);
  });
});

// ── counts ────────────────────────────────────────────────────────────────────

describe('useTerapeutasFilter — counts', () => {
  it('counts are always based on the unfiltered set', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));

    // Apply a search that reduces filtered to 0
    act(() => {
      result.current.setSearch('xyz-nomatch');
    });
    expect(result.current.filtered).toHaveLength(0);

    // Counts must still reflect the full unfiltered set
    expect(result.current.counts.todos).toBe(6);
    expect(result.current.counts.en_sala).toBe(1);
    expect(result.current.counts.disponibles).toBe(2);
    expect(result.current.counts.descanso).toBe(2); // descanso + ausente
    expect(result.current.counts.inactivos).toBe(1);
  });

  it('counts.descanso includes both descanso AND ausente', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    expect(result.current.counts.descanso).toBe(2);
  });

  it('counts.todos equals total aggregates length', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    expect(result.current.counts.todos).toBe(ALL_AGGREGATES.length);
  });

  it('counts are 0 for all tabs when aggregates is empty', () => {
    const { result } = renderHook(() => useTerapeutasFilter([]));
    expect(result.current.counts.todos).toBe(0);
    expect(result.current.counts.en_sala).toBe(0);
    expect(result.current.counts.disponibles).toBe(0);
    expect(result.current.counts.descanso).toBe(0);
    expect(result.current.counts.inactivos).toBe(0);
  });

  it('tab change does NOT change the counts', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    const initialCounts = { ...result.current.counts };
    act(() => {
      result.current.setTab('en_sala');
    });
    expect(result.current.counts).toEqual(initialCounts);
  });
});

// ── Combination filtering ──────────────────────────────────────────────────────

describe('useTerapeutasFilter — combined filters', () => {
  it('tab + search: only shows results matching both conditions', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setTab('disponibles');
      result.current.setSearch('Ana');
    });
    // disponibles tab + search "Ana" → only "Ana García" (disponible)
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].nombre).toBe('Ana García');
  });

  it('tab + especialidad: intersects correctly', () => {
    const { result } = renderHook(() => useTerapeutasFilter(ALL_AGGREGATES));
    act(() => {
      result.current.setTab('disponibles');
      result.current.setEspecialidad('Reflexología');
    });
    // Only María Torres is disponible and has Reflexología
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].nombre).toBe('María Torres');
  });
});

// ── Empty input ───────────────────────────────────────────────────────────────

describe('useTerapeutasFilter — empty aggregates', () => {
  it('returns empty filtered when aggregates is empty', () => {
    const { result } = renderHook(() => useTerapeutasFilter([]));
    expect(result.current.filtered).toHaveLength(0);
  });

  it('allEspecialidades is empty when aggregates is empty', () => {
    const { result } = renderHook(() => useTerapeutasFilter([]));
    expect(result.current.allEspecialidades).toHaveLength(0);
  });
});
