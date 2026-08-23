import type { IDataPoint } from '@infra/components/ui/common/KPI/KPI.types';

// ─────────────────────────────────────────────────────────────
// SVG VIEWPORT
// All charts use a fixed viewBox (VW × vh) rendered at 100%
// container width via width="100%" on the <svg> element.
// Every coordinate is computed in this viewBox space.
// ─────────────────────────────────────────────────────────────

/** Fixed horizontal viewport width. Charts scale horizontally via CSS. */
export const VW = 600;

/** Chart margins — define the inner drawable rectangle */
export const MARGIN = { top: 12, right: 16, bottom: 36, left: 52 } as const;

/** Inner drawable dimensions for a given viewBox height */
export function innerDims(vh: number) {
  return {
    iW: VW - MARGIN.left - MARGIN.right, // e.g. 532
    iH: vh - MARGIN.top - MARGIN.bottom, // e.g. 172 for vh=220
  };
}

// ─────────────────────────────────────────────────────────────
// SCALE FUNCTIONS
// All outputs are in INNER chart space.
// Use inside <g transform="translate(MARGIN.left, MARGIN.top)">
// ─────────────────────────────────────────────────────────────

/**
 * Value → Y pixel (inner space).
 * SVG Y is inverted: high values → small Y (near top).
 */
export function yPx(value: number, yMin: number, yMax: number, iH: number): number {
  if (yMax === yMin) return iH / 2;
  return iH * (1 - (value - yMin) / (yMax - yMin));
}

/**
 * Series index → X pixel for line/area charts.
 * Points span the full inner width evenly.
 */
export function xPxLine(i: number, count: number, iW: number): number {
  if (count <= 1) return iW / 2;
  return (i / (count - 1)) * iW;
}

/** Group index → left X pixel for bar groups */
export function xPxBarGroup(groupIdx: number, numGroups: number, iW: number): number {
  return (groupIdx / numGroups) * iW;
}

/** Width of a single bar group in pixels */
export function barGroupPx(numGroups: number, iW: number): number {
  return iW / numGroups;
}

// ─────────────────────────────────────────────────────────────
// Y-DOMAIN UTILITIES
// ─────────────────────────────────────────────────────────────

/**
 * Round a raw maximum up to the nearest clean tick boundary.
 * Adds ~8% headroom so the top value never touches the chart edge.
 */
export function niceMax(rawMax: number): number {
  if (rawMax <= 0) return 10;
  const headroom = rawMax * 1.08;
  const mag = Math.pow(10, Math.floor(Math.log10(headroom)));
  const n = headroom / mag;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * mag;
}

/** Evenly-spaced Y tick values from 0 → niceMax */
export function yTickValues(niceMaxVal: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (niceMaxVal / count) * i);
}

// ─────────────────────────────────────────────────────────────
// POINT HELPERS
// ─────────────────────────────────────────────────────────────

export interface IPoint {
  x: number;
  y: number;
}

/**
 * Convert an IDataPoint array to {x,y} pixel pairs in inner chart space.
 * This is the single source of truth for coordinate mapping.
 */
export function dataToPoints(
  data: IDataPoint[],
  iW: number,
  iH: number,
  yMin: number,
  yMax: number,
): IPoint[] {
  return data.map((d, i) => ({
    x: xPxLine(i, data.length, iW),
    y: yPx(d.value, yMin, yMax, iH),
  }));
}

// ─────────────────────────────────────────────────────────────
// SVG PATH BUILDERS
// Input: IPoint[] already in inner chart space.
// Output: SVG path `d` string — ready to use directly inside
//         <g transform="translate(MARGIN.left, MARGIN.top)">.
// NO post-processing, NO regex offsetting.
// ─────────────────────────────────────────────────────────────

/** Straight-line path (M + L commands only) */
export function linearPath(pts: IPoint[]): string {
  if (!pts.length) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

/**
 * Smooth Catmull-Rom → cubic bezier path.
 * All commands are C (cubic bezier) — no mixed M/L/C that
 * would require regex patching to apply a coordinate offset.
 */
export function smoothPath(pts: IPoint[], tension = 0.3): string {
  if (pts.length < 2) return linearPath(pts);

  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];

    // Catmull-Rom control points
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  return d;
}

/**
 * Closed area fill path: line → baseline → back to start.
 * iH is the inner height (Y coordinate of the X-axis baseline).
 */
export function areaClosedPath(pts: IPoint[], iH: number, lineD: string): string {
  if (!pts.length) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${lineD} L${last.x.toFixed(2)},${iH.toFixed(2)} L${first.x.toFixed(2)},${iH.toFixed(2)} Z`;
}

// ─────────────────────────────────────────────────────────────
// FORMATTING
// ─────────────────────────────────────────────────────────────

export function formatAxisValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  if (v !== Math.floor(v)) return v.toFixed(1);
  return `${v}`;
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────────

export const CHART_COLORS = [
  '#735BFE', // primary
  '#4DB0D6', // secondary
  '#73C12A', // success
  '#FFA100', // warning
  '#FF3877', // error
  '#75AEFF', // info
  '#9b0dd3', // tertiary
];

export function resolveChartColor(color: string | undefined, index: number): string {
  return color ?? CHART_COLORS[index % CHART_COLORS.length];
}

// ─────────────────────────────────────────────────────────────
// MOCK DATA GENERATOR
// ─────────────────────────────────────────────────────────────

export function generateTimeSeries(
  points: number,
  base: number,
  variance: number,
  daysBack = 30,
): IDataPoint[] {
  const now = Date.now();
  const step = (daysBack * 86_400_000) / points;
  let val = base;

  return Array.from({ length: points }, (_, i) => {
    val = Math.max(0, val + (Math.random() - 0.47) * variance);
    return {
      timestamp: now - (points - 1 - i) * step,
      value: Math.round(val * 100) / 100,
    };
  });
}
