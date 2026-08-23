import React, { useId } from 'react';
import { useTheme } from 'styled-components';
import type { IDataPoint, TTrend } from '@infra/components/ui/common/KPI/KPI.types';
import { dataToPoints, smoothPath, areaClosedPath, niceMax } from './chart.utils';

type TSparklineVariant = 'full' | 'bare';
type TColorKey = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

const COLOR_KEYS: ReadonlySet<string> = new Set<TColorKey>([
  'primary',
  'secondary',
  'success',
  'warning',
  'error',
  'info',
]);

/**
 * Resolve the stroke + gradient colors from theme tokens.
 *
 * `bare` variant: tinted by TREND first (reinforces the direction the trend pill
 * also shows); falls back to the card accent / palette color when trend is
 * neutral. `full` variant: tinted by the KPI color (legacy behavior), now from
 * tokens instead of hardcoded hex.
 */
function useSparklineColors(
  variant: TSparklineVariant,
  trend: TTrend,
  color: string,
): { line: string; grad0: string; grad1: string } {
  const theme = useTheme();

  if (variant === 'bare') {
    if (trend === 'up')
      return { line: theme.color.success[500], grad0: 'transparent', grad1: 'transparent' };
    if (trend === 'down')
      return { line: theme.color.error[500], grad0: 'transparent', grad1: 'transparent' };
    // neutral → carry brand identity via the card color / accent.
    if (color === 'secondary')
      return { line: theme.color.secondary[500], grad0: 'transparent', grad1: 'transparent' };
    if (COLOR_KEYS.has(color) && color !== 'primary')
      return {
        line: theme.color[color as Exclude<TColorKey, 'primary'>][500],
        grad0: 'transparent',
        grad1: 'transparent',
      };
    return { line: theme.color.accent.primary, grad0: 'transparent', grad1: 'transparent' };
  }

  // full variant — token-backed line + soft area gradient.
  const key: TColorKey = COLOR_KEYS.has(color) ? (color as TColorKey) : 'primary';
  return {
    line: theme.color[key][500],
    grad0: theme.color[key][100],
    grad1: 'transparent',
  };
}

interface ISparklineProps {
  data: IDataPoint[];
  trend?: TTrend;
  /** KPI color name */
  color?: string;
  animated?: boolean;
  width?: number;
  height?: number;
  /**
   * 'full' (default) renders line + area fill + endpoint dot with role="img".
   * 'bare' renders a stroke-only line, no fill/dot, aria-hidden — for the KPI
   * card's decorative top-right micro-sparkline.
   */
  variant?: TSparklineVariant;
}

export const Sparkline: React.FC<ISparklineProps> = ({
  data,
  trend = 'neutral',
  color = 'primary',
  animated = true,
  width,
  height = 48,
  variant = 'full',
}) => {
  const id = useId();
  const { line, grad0, grad1 } = useSparklineColors(variant, trend, color);
  if (data.length < 2) return null;

  const isBare = variant === 'bare';

  // Fixed inner viewport for sparkline (no margins needed — very compact).
  const W = width ?? 200;
  const H = height;
  const PAD_V = 3; // small vertical padding so stroke doesn't clip

  const allValues = data.map((d) => d.value);
  const yMax = niceMax(Math.max(...allValues));
  const yMin = 0;

  const pts = dataToPoints(data, W, H - PAD_V * 2, yMin, yMax);
  const ptsShifted = pts.map((p) => ({ x: p.x, y: p.y + PAD_V }));

  const lineD = smoothPath(ptsShifted);
  const areaD = areaClosedPath(ptsShifted, H - PAD_V, lineD);
  const last = ptsShifted[ptsShifted.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      role={isBare ? undefined : 'img'}
      aria-hidden={isBare ? true : undefined}
      aria-label={isBare ? undefined : `Trend: ${trend}`}
    >
      {!isBare && (
        <>
          <defs>
            <linearGradient id={`sk-g-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={grad0} />
              <stop offset="100%" stopColor={grad1} />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={areaD}
            fill={`url(#sk-g-${id})`}
            style={animated ? { animation: 'skFade 0.7s ease both' } : undefined}
          />
        </>
      )}

      {/* Line */}
      <path
        d={lineD}
        fill="none"
        stroke={line}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1000"
        style={
          animated
            ? {
                strokeDasharray: 1000,
                strokeDashoffset: 1000,
                animation: 'skDraw 0.9s ease-out both',
              }
            : undefined
        }
      />

      {/* Endpoint dot — full variant only */}
      {!isBare && (
        <circle cx={last.x} cy={last.y} r="3" fill={line} stroke="white" strokeWidth="1.5" />
      )}

      <style>{`
        @keyframes skDraw { to { stroke-dashoffset: 0; } }
        @keyframes skFade { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>
    </svg>
  );
};
