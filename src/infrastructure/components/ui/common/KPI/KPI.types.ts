// ============================================================
// KPI TYPES — Core data contracts for the analytics system
// ============================================================

export type TTrend = 'up' | 'down' | 'neutral';
export type TTimeRange = '24h' | '7d' | '30d' | '90d' | 'custom';
export type TChartVariant = 'line' | 'bar' | 'area' | 'sparkline';

export interface IDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface IKPIComparison {
  previousValue: number;
  percentChange: number;
  trend: TTrend;
  label?: string; // e.g. "vs last week"
  /**
   * Unit appended to the delta value. Defaults to '%'. Use 'pts' for
   * point-deltas (e.g. occupancy percentage-point change) so the badge and its
   * accessible label read "+4 pts" instead of a misleading "+4%".
   */
  deltaUnit?: string;
  /**
   * When true the delta is rendered as an em-dash and the trend reads as
   * "no comparison available" — used when the baseline (previousValue) is 0,
   * where a percentage change would be infinite/misleading. The period label
   * still renders so the user keeps context.
   */
  suppressed?: boolean;
}

export interface IKPICard {
  id: string;
  title: string;
  value: number | string;
  unit?: string; // e.g. "$", "%", "ms"
  prefix?: string;
  suffix?: string;
  comparison?: IKPIComparison;
  sparklineData?: IDataPoint[];
  updatedAt?: number; // timestamp for real-time highlight
  isLoading?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  description?: string;
}

export interface IChartDataset {
  id: string;
  label: string;
  data: IDataPoint[];
  color?: string;
}

export interface IChartConfig {
  width?: number;
  height?: number;
  animated?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  curve?: 'linear' | 'smooth';
  datasets: IChartDataset[];
}

// ============================================================
// FILTER TYPES
// ============================================================
export interface IFilterState {
  timeRange: TTimeRange;
  customFrom?: Date;
  customTo?: Date;
  category?: string;
  segment?: string;
}

export type TFilterAction =
  | { type: 'SET_TIME_RANGE'; payload: TTimeRange }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_SEGMENT'; payload: string }
  | { type: 'SET_CUSTOM_RANGE'; payload: { from: Date; to: Date } }
  | { type: 'RESET' };

// ============================================================
// REALTIME TYPES
// ============================================================
export interface IRealtimeConfig {
  interval?: number; // ms, default 3000
  enabled?: boolean;
  jitter?: number; // random variance ±jitter%
}

export interface IRealtimeState<T> {
  data: T;
  isLive: boolean;
  lastUpdated: number;
  updatedFields: string[]; // ids of recently updated KPIs
}
