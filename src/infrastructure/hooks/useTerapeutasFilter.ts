/**
 * useTerapeutasFilter.ts
 *
 * Manages filter + sort state for the Terapeutas page.
 * Counts are computed from the full unfiltered aggregate list so that
 * tab badges reflect total counts, not search-reduced counts.
 */

import { useState } from 'react';
import type { ITerapeutaAggregate } from './useTerapeutas';
import type { TTerapeutaEstado } from '@domain/types';

export type TTerapeutasTab = 'todos' | 'en_sala' | 'disponibles' | 'descanso' | 'inactivos';
export type TTerapeutasSort = 'nombre_asc' | 'nombre_desc' | 'sesiones_desc' | 'ingresos_desc';

export interface ITerapeutasFilterState {
  readonly tab: TTerapeutasTab;
  readonly search: string;
  readonly especialidad: string | null;
  readonly sort: TTerapeutasSort;
}

const DEFAULT_STATE: ITerapeutasFilterState = {
  tab: 'todos',
  search: '',
  especialidad: null,
  sort: 'nombre_asc',
};

function matchesTab(estado: TTerapeutaEstado, tab: TTerapeutasTab): boolean {
  switch (tab) {
    case 'todos':
      return true;
    case 'en_sala':
      return estado === 'en_sala';
    case 'disponibles':
      return estado === 'disponible';
    case 'descanso':
      return estado === 'descanso' || estado === 'ausente';
    case 'inactivos':
      return estado === 'inactivo';
  }
}

function sortAggregates(
  list: readonly ITerapeutaAggregate[],
  sort: TTerapeutasSort,
): readonly ITerapeutaAggregate[] {
  const arr = [...list];
  switch (sort) {
    case 'nombre_asc':
      return arr.sort((a, b) => a.nombre.localeCompare(b.nombre));
    case 'nombre_desc':
      return arr.sort((a, b) => b.nombre.localeCompare(a.nombre));
    case 'sesiones_desc':
      return arr.sort((a, b) => b.sesionesEstaSemana - a.sesionesEstaSemana);
    case 'ingresos_desc':
      return arr.sort((a, b) => b.ingresosSemana - a.ingresosSemana);
  }
}

export interface IUseTerapeutasFilterResult {
  readonly filtered: readonly ITerapeutaAggregate[];
  readonly filterState: ITerapeutasFilterState;
  readonly setTab: (tab: TTerapeutasTab) => void;
  readonly setSearch: (search: string) => void;
  readonly setEspecialidad: (e: string | null) => void;
  readonly setSort: (s: TTerapeutasSort) => void;
  readonly clearFilters: () => void;
  readonly isDirty: boolean;
  readonly counts: Record<TTerapeutasTab, number>;
  readonly allEspecialidades: readonly string[];
}

export const useTerapeutasFilter = (
  aggregates: readonly ITerapeutaAggregate[],
): IUseTerapeutasFilterResult => {
  const [filterState, setFilterState] = useState<ITerapeutasFilterState>(DEFAULT_STATE);

  const setTab = (tab: TTerapeutasTab): void => {
    setFilterState((s) => ({ ...s, tab }));
  };

  const setSearch = (search: string): void => {
    setFilterState((s) => ({ ...s, search }));
  };

  const setEspecialidad = (especialidad: string | null): void => {
    setFilterState((s) => ({ ...s, especialidad }));
  };

  const setSort = (sort: TTerapeutasSort): void => {
    setFilterState((s) => ({ ...s, sort }));
  };

  const clearFilters = (): void => {
    setFilterState(DEFAULT_STATE);
  };

  const isDirty =
    filterState.tab !== DEFAULT_STATE.tab ||
    filterState.search !== DEFAULT_STATE.search ||
    filterState.especialidad !== DEFAULT_STATE.especialidad ||
    filterState.sort !== DEFAULT_STATE.sort;

  const counts: Record<TTerapeutasTab, number> = {
    todos: aggregates.length,
    en_sala: aggregates.filter((a) => a.estadoActual === 'en_sala').length,
    disponibles: aggregates.filter((a) => a.estadoActual === 'disponible').length,
    descanso: aggregates.filter(
      (a) => a.estadoActual === 'descanso' || a.estadoActual === 'ausente',
    ).length,
    inactivos: aggregates.filter((a) => a.estadoActual === 'inactivo').length,
  };

  const allEspecialidades = Array.from(
    new Set(aggregates.flatMap((a) => [...a.especialidades])),
  ).sort();

  const searchLower = filterState.search.toLowerCase();

  const filtered = sortAggregates(
    aggregates.filter((a) => {
      if (!matchesTab(a.estadoActual, filterState.tab)) return false;
      if (
        filterState.search !== '' &&
        !(a.nombre + ' ' + a.apellidos).toLowerCase().includes(searchLower)
      ) {
        return false;
      }
      if (
        filterState.especialidad !== null &&
        !a.especialidades.includes(filterState.especialidad)
      ) {
        return false;
      }
      return true;
    }),
    filterState.sort,
  );

  return {
    filtered,
    filterState,
    setTab,
    setSearch,
    setEspecialidad,
    setSort,
    clearFilters,
    isDirty,
    counts,
    allEspecialidades,
  };
};
