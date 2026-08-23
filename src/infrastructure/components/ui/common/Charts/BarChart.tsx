import React, { useId, useState } from 'react';
import type { IChartConfig } from '@infra/components/ui/common/KPI/KPI.types';
import {
  VW,
  MARGIN,
  innerDims,
  niceMax,
  yTickValues,
  yPx,
  barGroupPx,
  resolveChartColor,
  formatAxisValue,
  formatTimestamp,
} from '@infra/components/ui/common/Charts/chart.utils';
import {
  ChartRoot,
  ChartLegend,
  ChartLegendItem,
  ChartLegendSwatch,
} from '@infra/components/ui/common/Charts/Charts.styles';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

/** Fraction of group width used for bars (rest is inter-group gap) */
const BAR_FILL_RATIO = 0.75;

/** Minimum rendered bar height in pixels so zero-ish values are still visible */
const MIN_BAR_PX = 2;

/** Radius for top corners of each bar */
const BAR_RADIUS = 3;

// ─────────────────────────────────────────────────────────────
// SVG TOOLTIP (inline SVG — no DOM coordinate conversion)
// ─────────────────────────────────────────────────────────────

interface IBarTooltip {
  x: number;
  y: number;
  label: string;
  value: string;
  iW: number;
}

const BarTooltip: React.FC<IBarTooltip> = ({ x, y, label, value, iW }) => {
  const text = `${label}: ${value}`;
  const tw = text.length * 6.2 + 20;
  const th = 28;
  const rx = Math.min(Math.max(x - tw / 2, 0), iW - tw);
  const ry = y - th - 10;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={rx + 2} y={ry + 2} width={tw} height={th} rx={5} fill="rgba(0,0,0,0.12)" />
      <rect x={rx} y={ry} width={tw} height={th} rx={5} fill="rgba(21,20,24,0.92)" />
      <text
        x={rx + 10}
        y={ry + 18}
        fontSize={11}
        fontFamily="Lato, sans-serif"
        fontWeight={500}
        fill="#ffffff"
      >
        {text}
      </text>
      <polygon
        points={`${x - 5},${y - 8} ${x + 5},${y - 8} ${x},${y - 2}`}
        fill="rgba(21,20,24,0.92)"
      />
    </g>
  );
};

// ─────────────────────────────────────────────────────────────
// BAR CHART
// ─────────────────────────────────────────────────────────────

export const BarChart: React.FC<IChartConfig> = ({
  datasets,
  height = 220,
  animated = true,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  showXAxis = true,
}) => {
  const id = useId();

  // ── Hover state ─────────────────────────────────────────────
  // Must be unconditional — placed before any early return
  const [hovered, setHovered] = useState<{ g: number; s: number } | null>(null);

  const vh = typeof height === 'number' ? height : 220;
  const { iW, iH } = innerDims(vh);

  // ── Guard ───────────────────────────────────────────────────
  const firstDs = datasets[0];
  if (!firstDs.data.length) return null;

  const numGroups = firstDs.data.length;
  const numSeries = datasets.length;

  // ── Y domain ────────────────────────────────────────────────
  const allValues = datasets.flatMap((ds) => ds.data.map((d) => d.value));
  const yMax = niceMax(Math.max(...allValues, 0));
  const ticks = yTickValues(yMax);

  // ── Bar geometry (all in inner chart space) ─────────────────
  const gW = barGroupPx(numGroups, iW); // pixels per group
  const barAreaW = gW * BAR_FILL_RATIO; // bars fill 75% of group
  const gap = (gW - barAreaW) / 2; // equal padding each side
  const barW = barAreaW / numSeries; // width of one bar

  /** Left X of bar at (groupIdx, seriesIdx) in inner chart space */
  const barX = (groupIdx: number, seriesIdx: number): number =>
    groupIdx * gW + gap + seriesIdx * barW;

  /**
   * Bar height in pixels.
   * Uses the full yMax so yPx(value, 0, yMax, iH) gives the top of the bar,
   * and (iH - top) gives the pixel height.
   */
  const barHeightPx = (value: number): number => {
    const top = yPx(value, 0, yMax, iH);
    return Math.max(iH - top, value > 0 ? MIN_BAR_PX : 0);
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <ChartRoot>
      <svg
        viewBox={`0 0 ${VW} ${vh}`}
        height={vh}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Bar chart: ${datasets.map((d) => d.label).join(', ')}`}
      >
        <defs>
          {datasets.map((ds, si) => {
            const color = resolveChartColor(ds.color, si);
            return (
              <linearGradient key={ds.id} id={`bg-${id}-${si}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="1" />
                <stop offset="100%" stopColor={color} stopOpacity="0.7" />
              </linearGradient>
            );
          })}
        </defs>

        {/*
          ALL CHILDREN use INNER chart coordinates.
          No manual offset math — the translate handles it.
        */}
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {/* ── Grid + Y labels ─────────────────────────────── */}
          {showGrid &&
            ticks.map((val) => {
              const y = yPx(val, 0, yMax, iH);
              return (
                <g key={val} aria-hidden="true">
                  <line
                    x1={0}
                    y1={y}
                    x2={iW}
                    y2={y}
                    stroke="rgba(0,0,0,0.07)"
                    strokeWidth={val === 0 ? 1.5 : 1}
                    strokeDasharray={val === 0 ? undefined : '4 4'}
                  />
                  <text
                    x={-8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={10}
                    fontFamily="Lato, sans-serif"
                    fill="#9d9ca2"
                  >
                    {formatAxisValue(val)}
                  </text>
                </g>
              );
            })}

          {/* ── Bars ────────────────────────────────────────── */}
          {firstDs.data.map((_groupPt, gi) =>
            datasets.map((ds, si) => {
              const value = ds.data[gi]?.value ?? 0;
              const bH = barHeightPx(value);
              const x = barX(gi, si);
              const y = iH - bH; // ← top of bar in inner space
              const isHov = hovered?.g === gi && hovered.s === si;
              const delay = animated ? `${(gi * 0.04 + si * 0.07).toFixed(2)}s` : '0s';

              return (
                <rect
                  key={`${gi}-${si}`}
                  x={x}
                  y={y} // ← CORRECT: top of bar
                  width={Math.max(barW - 2, 1)}
                  height={bH} // ← CORRECT: downward to x-axis
                  rx={BAR_RADIUS}
                  fill={`url(#bg-${id}-${si})`}
                  opacity={hovered && !isHov ? 0.55 : 1}
                  style={{
                    cursor: showTooltip ? 'pointer' : 'default',
                    transition: 'opacity 0.15s ease',
                    ...(animated && {
                      transformBox: 'fill-box' as const,
                      transformOrigin: 'bottom',
                      animation: `bcGrow 0.45s cubic-bezier(0.34,1.36,0.64,1) ${delay} both`,
                    }),
                  }}
                  onMouseEnter={() => {
                    setHovered({ g: gi, s: si });
                  }}
                  onMouseLeave={() => {
                    setHovered(null);
                  }}
                />
              );
            }),
          )}

          {/* ── SVG Tooltip ─────────────────────────────────── */}
          {showTooltip &&
            hovered &&
            (() => {
              const { g: gi, s: si } = hovered;
              const value = datasets[si]?.data[gi]?.value ?? 0;
              const bH = barHeightPx(value);
              const cx = barX(gi, si) + barW / 2;
              const ty = iH - bH;

              return (
                <BarTooltip
                  x={cx}
                  y={ty}
                  label={datasets[si].label}
                  value={formatAxisValue(value)}
                  iW={iW}
                />
              );
            })()}

          {/* ── X-axis labels ───────────────────────────────── */}
          {showXAxis &&
            firstDs.data.map((d, gi) => {
              const cx = gi * gW + gW / 2;
              return (
                <text
                  key={gi}
                  x={cx}
                  y={iH + 20}
                  textAnchor="middle"
                  fontSize={10}
                  fontFamily="Lato, sans-serif"
                  fill="#9d9ca2"
                >
                  {d.label ?? formatTimestamp(d.timestamp)}
                </text>
              );
            })}

          {/* ── X-axis baseline ─────────────────────────────── */}
          <line
            x1={0}
            y1={iH}
            x2={iW}
            y2={iH}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="1"
            aria-hidden="true"
          />
        </g>

        <style>{`
          @keyframes bcGrow {
            from { transform: scaleY(0); }
            to   { transform: scaleY(1); }
          }
          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; }
          }
        `}</style>
      </svg>

      {/* Legend */}
      {showLegend && numSeries > 1 && (
        <ChartLegend>
          {datasets.map((ds, si) => (
            <ChartLegendItem key={ds.id}>
              <ChartLegendSwatch $color={resolveChartColor(ds.color, si)} />
              {ds.label}
            </ChartLegendItem>
          ))}
        </ChartLegend>
      )}
    </ChartRoot>
  );
};
