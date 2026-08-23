/**
 * Table / DataGrid — Types
 * ISP: interfaces mínimas por responsabilidad.
 */
import type { ISelectOption } from '@infra/components/ui/common/Select';
import type { TSizes } from '@infra/styles/themes/theme.types';
import type { ReactNode, CSSProperties } from 'react';

// ─── Variantes ────────────────────────────────────────────────────────────────

export type TTableVariant = 'default' | 'striped' | 'bordered';
export type TTableSize = Extract<TSizes, 'sm' | 'md' | 'lg'>;
export type TTableSortDirection = 'asc' | 'desc' | null;
export type TTableContentAlign = 'left' | 'center' | 'right';
export type TTablePageSizeOption = ISelectOption;
export type TTablePageSize = 5 | 10 | 25 | 50 | 100;

// ─── Definición de columna ────────────────────────────────────────────────────

export interface ITableColumnDef<T = Record<string, unknown>> {
  /** Clave única — también usada para acceder a row[key] */
  readonly key: string;
  /** Header label */
  readonly header: string;
  /** Render personalizado. Si omitido usa row[key] */
  readonly render?: (value: unknown, row: T, index: number) => ReactNode;
  /** Ancho CSS (px, %, fr). Default: auto */
  readonly width?: string;
  /** Mínimo ancho */
  readonly minWidth?: string;
  /** Alineación del contenido */
  readonly align?: TTableContentAlign;
  /** Permite ordenar por esta columna */
  readonly sortable?: boolean;
  /** Columna fija (sticky) al scroll horizontal */
  readonly sticky?: boolean;
  /** Columna no ocultable por el usuario */
  readonly pinned?: boolean;
  /** Columna visible inicialmente */
  readonly visible?: boolean;
}

// ─── Ordenación ───────────────────────────────────────────────────────────────

export interface ITableSortState {
  key: string;
  direction: TTableSortDirection;
}

// ─── Paginación ───────────────────────────────────────────────────────────────

export interface ITablePaginationState {
  page: number;
  pageSize: number;
}

// ─── Selección ────────────────────────────────────────────────────────────────

export interface ITableSelectionState {
  selectedKeys: Set<string>;
}

// ─── Table props ─────────────────────────────────────────────────────────────

export interface ITableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Datos a mostrar */
  readonly data: T[];
  /** Definición de columnas */
  readonly columns: ITableColumnDef<T>[];
  /** Clave única por fila (default: "id") */
  readonly rowKey?: keyof T;

  // ── Variante ──
  readonly variant?: TTableVariant;
  readonly size?: TTableSize;

  // ── Header ────
  /** Título de la tabla */
  readonly title?: string;
  /** Habilitar búsqueda en Header */
  readonly searchable?: boolean;
  /** Placeholder del SearchInput */
  readonly searchPlaceholder?: string;
  /** Acciones extra en el header (botones, filtros…) */
  readonly headerActions?: ReactNode;

  // ── Body ──────
  /** Mensaje cuando data está vacía */
  readonly emptyText?: string;
  /** Estado de carga */
  readonly loading?: boolean;

  // ── Columnas ──
  /** Mostrar botón para ocultar/mostrar columnas */
  readonly columnToggle?: boolean;

  // ── Sort ──────
  /** Habilitar ordenación en columnas marcadas sortable */
  readonly sortable?: boolean;

  // ── Paginación ─
  /** Habilitar paginación */
  readonly paginated?: boolean;
  /** Opciones de tamaño de página */
  readonly pageSizeOptions?: ISelectOption[];
  /** Tamaño de página inicial */
  readonly defaultPageSize?: TTablePageSize;

  // ── Controlled pagination (server-side mode) ──
  // When these props are supplied the table operates in controlled mode:
  // internal page state is ignored, `data` contains only the current page's rows,
  // and `totalRows` drives the pagination footer count.
  // Existing consumers that omit these props continue to work unchanged.
  /** Current page number (1-based). When set, enables controlled mode. */
  readonly controlledPage?: number;
  /** Total row count across all pages (used for footer display). */
  readonly controlledTotalRows?: number;
  /** Callback fired when the user navigates to a different page. */
  readonly onControlledPageChange?: (page: number) => void;

  // ── Selección ─
  /** Habilitar selección de filas con Checkbox */
  readonly selectable?: boolean;
  /** Callback con las claves seleccionadas */
  readonly onSelectionChange?: (keys: string[]) => void;

  // ── Row click ─
  /** Callback when a row is clicked. Enables cursor: pointer on rows. */
  readonly onRowClick?: (row: T, key: string) => void;

  // ── Form ──────
  readonly className?: string;
  readonly style?: CSSProperties;
}
