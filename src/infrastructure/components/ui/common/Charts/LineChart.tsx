import React, { useId, useState } from 'react';
import type { IChartConfig } from '@infra/components/ui/common/KPI/KPI.types';
import {
  VW,
  MARGIN,
  innerDims,
  niceMax,
  yTickValues,
  yPx,
  dataToPoints,
  smoothPath,
  linearPath,
  areaClosedPath,
  resolveChartColor,
  formatAxisValue,
  formatTimestamp,
} from './chart.utils';
import { ChartRoot, ChartLegend, ChartLegendItem, ChartLegendSwatch } from './Charts.styles';

// ─────────────────────────────────────────────────────────────
// SHARED SUB-COMPONENTS (SVG, rendered inside <g transform>)
// ─────────────────────────────────────────────────────────────

/** Horizontal grid lines + left Y-axis labels */
const YGrid: React.FC<{
  ticks: number[];
  niceMax: number;
  iW: number;
  iH: number;
}> = ({ ticks, niceMax: maxVal, iW, iH }) => (
  <g aria-hidden="true">
    {ticks.map((val) => {
      const y = yPx(val, 0, maxVal, iH);
      return (
        <g key={val}>
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
  </g>
);

/** Bottom X-axis date labels — shows ~6 labels evenly spaced */
const XAxis: React.FC<{
  timestamps: number[];
  iW: number;
  iH: number;
  maxLabels?: number;
}> = ({ timestamps, iW, iH, maxLabels = 6 }) => {
  const n = timestamps.length;
  const step = Math.max(1, Math.round(n / maxLabels));

  // Always include first and last index
  const indices = new Set<number>([0, n - 1]);
  for (let i = step; i < n - 1; i += step) indices.add(i);
  const sorted = Array.from(indices).sort((a, b) => a - b);

  return (
    <g aria-hidden="true">
      {sorted.map((i) => {
        const x = (i / (n - 1)) * iW; // same formula as xPxLine
        return (
          <text
            key={i}
            x={x}
            y={iH + 20}
            textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
            fontSize={10}
            fontFamily="Lato, sans-serif"
            fill="#9d9ca2"
          >
            {formatTimestamp(timestamps[i])}
          </text>
        );
      })}
    </g>
  );
};

// ─────────────────────────────────────────────────────────────
// SVG TOOLTIP (rendered as SVG elements — no coordinate
// conversion needed)
// ─────────────────────────────────────────────────────────────

interface ISVGTooltip {
  x: number;
  y: number;
  lines: string[];
  iW: number;
}

const SVGTooltip: React.FC<ISVGTooltip> = ({ x, y, lines, iW }) => {
  const PAD_H = 10;
  const PAD_V = 7;
  const LINE_H = 14;
  const tw = Math.max(...lines.map((l) => l.length)) * 6.2 + PAD_H * 2;
  const th = lines.length * LINE_H + PAD_V * 2;

  // Clamp so tooltip never overflows right/left edge
  const rx = Math.min(Math.max(x - tw / 2, 0), iW - tw);
  const ry = y - th - 10;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Drop shadow */}
      <rect x={rx + 2} y={ry + 2} width={tw} height={th} rx={5} fill="rgba(0,0,0,0.12)" />
      <rect x={rx} y={ry} width={tw} height={th} rx={5} fill="rgba(21,20,24,0.92)" />
      {lines.map((line, i) => (
        <text
          key={i}
          x={rx + PAD_H}
          y={ry + PAD_V + i * LINE_H + 10}
          fontSize={11}
          fontFamily="Lato, sans-serif"
          fontWeight={i === 0 ? 400 : 500}
          fill={i === 0 ? 'rgba(255,255,255,0.55)' : '#ffffff'}
        >
          {line}
        </text>
      ))}
      {/* Caret */}
      <polygon
        points={`${x - 5},${y - 8} ${x + 5},${y - 8} ${x},${y - 2}`}
        fill="rgba(21,20,24,0.92)"
      />
    </g>
  );
};

// ─────────────────────────────────────────────────────────────
// LINE CHART
// ─────────────────────────────────────────────────────────────

export const LineChart: React.FC<IChartConfig> = ({
  datasets,
  height = 220,
  animated = true,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  showXAxis = true,
  curve = 'smooth',
}) => {
  const id = useId();

  // ── Tooltip state ───────────────────────────────────────────
  // Must be unconditional — placed before any early return
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    lines: string[];
  } | null>(null);

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const vh = typeof height === 'number' ? height : 220;
  const { iW, iH } = innerDims(vh);

  // ── Y domain ────────────────────────────────────────────────
  const allValues = datasets.flatMap((ds) => ds.data.map((d) => d.value));
  if (!allValues.length) return null;

  const rawMax = Math.max(...allValues);
  const yMax = niceMax(rawMax);
  const yMin = 0;
  const ticks = yTickValues(yMax);

  // Build all dataset paths (in inner chart space)
  const seriesData = datasets.map((ds, dsIdx) => {
    const color = resolveChartColor(ds.color, dsIdx);
    const pts = dataToPoints(ds.data, iW, iH, yMin, yMax);
    const lineD = curve === 'smooth' ? smoothPath(pts) : linearPath(pts);
    const areaD = areaClosedPath(pts, iH, lineD);
    const gradId = `lg-${id}-${dsIdx}`;
    return { ds, color, pts, lineD, areaD, gradId };
  });

  /**
   * On mouse move over the SVG, find the nearest data column and
   * update the tooltip. Uses SVGPoint to convert from screen → viewBox.
   */
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());

    // Coordinates relative to inner chart (subtract margin)
    const localX = svgPt.x - MARGIN.left;

    // Find the closest data index
    const n = datasets[0]?.data.length ?? 0;
    if (!n) return;

    const ratio = Math.max(0, Math.min(1, localX / iW));
    const idx = Math.round(ratio * (n - 1));

    const x = (idx / (n - 1)) * iW; // inner x for the vertical guide
    const lines = [
      formatTimestamp(datasets[0].data[idx].timestamp),
      ...datasets.map((ds) => `${ds.label}: ${formatAxisValue(ds.data[idx]?.value ?? 0)}`),
    ];
    // y: position tooltip above the first dataset's point
    const firstY = seriesData[0]?.pts[idx]?.y ?? iH / 2;

    setTooltip({ x, y: firstY, lines });
    setActiveIdx(idx);
  };

  const handleMouseLeave = () => {
    setTooltip(null);
    setActiveIdx(null);
  };

  return (
    <ChartRoot>
      <svg
        viewBox={`0 0 ${VW} ${vh}`}
        height={vh}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Line chart: ${datasets.map((d) => d.label).join(', ')}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: showTooltip ? 'crosshair' : 'default' }}
      >
        <defs>
          {seriesData.map(({ gradId, color }) => (
            <linearGradient key={gradId} id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>

        {/*
          ─────────────────────────────────────────────────────
          INNER CHART GROUP — all children use inner chart coords
          ─────────────────────────────────────────────────────
        */}
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {/* Grid + Y labels */}
          {showGrid && <YGrid ticks={ticks} niceMax={yMax} iW={iW} iH={iH} />}

          {/* Vertical hover guide */}
          {activeIdx !== null &&
            (() => {
              const x = (activeIdx / (datasets[0].data.length - 1)) * iW;
              return (
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={iH}
                  stroke="rgba(0,0,0,0.12)"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                  style={{ pointerEvents: 'none' }}
                />
              );
            })()}

          {/* Area fills (rendered below lines) */}
          {seriesData.map(({ ds, gradId, areaD }, i) => (
            <path
              key={`area-${ds.id}`}
              d={areaD}
              fill={`url(#${gradId})`}
              style={
                animated
                  ? {
                      animation: `lcFadeIn 0.7s ease ${i * 0.1}s both`,
                    }
                  : undefined
              }
            />
          ))}

          {/* Lines */}
          {seriesData.map(({ ds, color, lineD }, i) => (
            <path
              key={`line-${ds.id}`}
              d={lineD}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1000"
              style={
                animated
                  ? {
                      strokeDasharray: 1000,
                      strokeDashoffset: 1000,
                      animation: `lcDrawLine 1.1s ease-out ${i * 0.15}s both`,
                    }
                  : undefined
              }
            />
          ))}

          {/* Active column dots */}
          {activeIdx !== null &&
            seriesData.map(({ ds, color, pts }) => {
              const pt = pts[activeIdx];
              return (
                <g key={`dot-${ds.id}`}>
                  <circle cx={pt.x} cy={pt.y} r={6} fill={color} fillOpacity="0.2" />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={3.5}
                    fill={color}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}

          {/* X-axis labels */}
          {showXAxis && (
            <XAxis timestamps={datasets[0].data.map((d) => d.timestamp)} iW={iW} iH={iH} />
          )}

          {/* SVG tooltip (in inner chart space — no coordinate conversion) */}
          {showTooltip && tooltip && (
            <SVGTooltip x={tooltip.x} y={tooltip.y} lines={tooltip.lines} iW={iW} />
          )}
        </g>

        <style>{`
          @keyframes lcDrawLine {
            to { stroke-dashoffset: 0; }
          }
          @keyframes lcFadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; }
          }
        `}</style>
      </svg>

      {showLegend && datasets.length > 1 && (
        <ChartLegend>
          {seriesData.map(({ ds, color }) => (
            <ChartLegendItem key={ds.id}>
              <ChartLegendSwatch $color={color} />
              {ds.label}
            </ChartLegendItem>
          ))}
        </ChartLegend>
      )}
    </ChartRoot>
  );
};

// ─────────────────────────────────────────────────────────────
// AREA CHART
// Identical to LineChart but fills are more prominent and
// multiple datasets are stacked visually.
// ─────────────────────────────────────────────────────────────

export const AreaChart: React.FC<IChartConfig> = (props) => (
  // Reuse LineChart — the area fill is always rendered.
  // Datasets have their own gradient fill already.
  <LineChart {...props} />
);
