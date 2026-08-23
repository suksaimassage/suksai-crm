/**
 * useTableState — Estado interno de la tabla con useReducer
 *
 * SRP: solo estado. No renderiza nada.
 * Usa useReducer para garantizar actualizaciones atómicas y evitar
 * el warning "Cannot update a component while rendering another".
 */

import { useReducer, useMemo, useCallback } from 'react';
import type {
  ITableColumnDef,
  ITableSortState,
  ITablePaginationState,
  TTablePageSize,
} from '@infra/components/ui/common/Table/Table.types';

// ─── State shape ──────────────────────────────────────────────────────────────

interface ITableState {
  query: string;
  sort: ITableSortState;
  pagination: ITablePaginationState;
  hiddenCols: Set<string>;
  selectedKeys: Set<string>;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type TableAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'TOGGLE_SORT'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'TOGGLE_COL'; payload: string }
  | { type: 'TOGGLE_ROW'; payload: string }
  | { type: 'TOGGLE_ALL'; payload: string[] };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function tableReducer(state: ITableState, action: TableAction): ITableState {
  switch (action.type) {
    case 'SET_QUERY':
      return {
        ...state,
        query: action.payload,
        pagination: { ...state.pagination, page: 1 },
      };

    case 'TOGGLE_SORT': {
      const { key, direction } = state.sort;
      if (key !== action.payload)
        return { ...state, sort: { key: action.payload, direction: 'asc' } };
      if (direction === 'asc')
        return { ...state, sort: { key: action.payload, direction: 'desc' } };
      return { ...state, sort: { key: '', direction: null } };
    }

    case 'SET_PAGE':
      return {
        ...state,
        pagination: { ...state.pagination, page: action.payload },
      };

    case 'SET_PAGE_SIZE':
      return { ...state, pagination: { page: 1, pageSize: action.payload } };

    case 'TOGGLE_COL': {
      const next = new Set(state.hiddenCols);
      if (next.has(action.payload)) {
        next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return { ...state, hiddenCols: next };
    }

    case 'TOGGLE_ROW': {
      const next = new Set(state.selectedKeys);
      if (next.has(action.payload)) {
        next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return { ...state, selectedKeys: next };
    }

    case 'TOGGLE_ALL': {
      const allSelected = action.payload.every((k) => state.selectedKeys.has(k));
      const next = new Set(state.selectedKeys);
      if (allSelected) {
        action.payload.forEach((k) => {
          next.delete(k);
        });
      } else {
        action.payload.forEach((k) => {
          next.add(k);
        });
      }
      return { ...state, selectedKeys: next };
    }

    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface IUseTableStateOptions<T> {
  data: T[];
  columns: ITableColumnDef<T>[];
  defaultPageSize?: TTablePageSize;
  paginated?: boolean;
  onSelectionChange?: (keys: string[]) => void;
  rowKey: keyof T;
}

export function useTableState<T extends Record<string, unknown>>({
  data,
  columns,
  defaultPageSize = 10,
  paginated = false,
  onSelectionChange,
  rowKey,
}: IUseTableStateOptions<T>) {
  const [st, dispatch] = useReducer(tableReducer, undefined, () => ({
    query: '',
    sort: { key: '', direction: null },
    pagination: {
      page: 1,
      pageSize: defaultPageSize,
    },
    hiddenCols: new Set(columns.filter((c) => c.visible === false).map((c) => c.key)),
    selectedKeys: new Set<string>(),
  }));

  const { query, sort, pagination, hiddenCols, selectedKeys } = st;

  // ── Dispatchers ────────────────────────────────────────────────────────────

  const setQuery = useCallback((q: string) => {
    dispatch({ type: 'SET_QUERY', payload: q });
  }, []);

  const handleSort = useCallback((key: string) => {
    dispatch({ type: 'TOGGLE_SORT', payload: key });
  }, []);

  const setPage = useCallback((p: number) => {
    dispatch({ type: 'SET_PAGE', payload: p });
  }, []);

  const setPageSize = useCallback((ps: number) => {
    dispatch({ type: 'SET_PAGE_SIZE', payload: ps });
  }, []);

  const toggleCol = useCallback((key: string) => {
    dispatch({ type: 'TOGGLE_COL', payload: key });
  }, []);

  const toggleRow = useCallback(
    (key: string) => {
      dispatch({ type: 'TOGGLE_ROW', payload: key });
      if (onSelectionChange) {
        const next = new Set(selectedKeys);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        onSelectionChange([...next]);
      }
    },
    [selectedKeys, onSelectionChange],
  );

  const toggleAll = useCallback(
    (pageRows: T[]) => {
      const pageKeys = pageRows.map((r) => String(r[rowKey]));
      dispatch({ type: 'TOGGLE_ALL', payload: pageKeys });
      if (onSelectionChange) {
        const allSelected = pageKeys.every((k) => selectedKeys.has(k));
        const next = new Set(selectedKeys);
        if (allSelected) {
          pageKeys.forEach((k) => {
            next.delete(k);
          });
        } else {
          pageKeys.forEach((k) => {
            next.add(k);
          });
        }
        onSelectionChange([...next]);
      }
    },
    [selectedKeys, onSelectionChange, rowKey],
  );

  // ── Column visibility ──────────────────────────────────────────────────────

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenCols.has(c.key)),
    [columns, hiddenCols],
  );

  // ── Derived data ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, query]);

  const sorted = useMemo(() => {
    if (!sort.key || !sort.direction) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      const toStr = (v: unknown): string => {
        if (v === null || v === undefined) return '';
        if (typeof v === 'object') return JSON.stringify(v);
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return String(v);
      };
      const cmp = toStr(av).localeCompare(toStr(bv), undefined, {
        numeric: true,
      });
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sort]);

  const totalRows = sorted.length;
  const totalPages = paginated ? Math.max(1, Math.ceil(totalRows / pagination.pageSize)) : 1;

  const pageRows = useMemo(() => {
    if (!paginated) return sorted;
    const start = (pagination.page - 1) * pagination.pageSize;
    return sorted.slice(start, start + pagination.pageSize);
  }, [sorted, paginated, pagination]);

  return {
    query,
    setQuery,
    sort,
    handleSort,
    pagination,
    setPage,
    setPageSize,
    totalRows,
    totalPages,
    hiddenCols,
    toggleCol,
    visibleColumns,
    selectedKeys,
    toggleRow,
    toggleAll,
    pageRows,
  };
}
