import React, { useEffect, useRef, useState } from 'react';
import type { IKPICard } from './KPI.types';
import {
  KPICardWrapper,
  KPITopRow,
  KPITitle,
  KPISparklineSlot,
  KPIValueRow,
  KPIValue,
  KPIUnit,
  KPIComparisonRow,
  KPITrendBadge,
  KPIComparisonLabel,
  KPIDescription,
  KPISkeletonTopRow,
  KPISkeletonTitle,
  KPISkeletonSparkline,
  KPISkeletonValue,
  KPISkeletonTrend,
} from './KPICard.styles';
import { Sparkline } from '@infra/components/ui/common/Charts/Sparkline';

// ============================================================
// TREND ICONS — inline SVG, no external dep
// ============================================================
const TrendArrowUp = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path
      d="M5 8.5V1.5M5 1.5L1.5 5M5 1.5L8.5 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrendArrowDown = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path
      d="M5 1.5V8.5M5 8.5L1.5 5M5 8.5L8.5 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrendNeutral = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M1.5 5H8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TREND_ICONS = {
  up: <TrendArrowUp />,
  down: <TrendArrowDown />,
  neutral: <TrendNeutral />,
};

const TREND_LABELS = { up: 'increase', down: 'decrease', neutral: 'no change' };

// ============================================================
// FORMAT VALUE
// ============================================================
function formatValue(value: number | string, prefix?: string, suffix?: string): string {
  if (typeof value === 'string') return value;

  const formatted =
    value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1)}M`
      : value >= 1_000
        ? `${(value / 1_000).toFixed(1)}K`
        : value.toLocaleString('en-US', { maximumFractionDigits: 2 });

  return `${prefix ?? ''}${formatted}${suffix ?? ''}`;
}

/** Build the signed delta label honoring deltaUnit ('%' default, 'pts', …). */
function formatDelta(percentChange: number, deltaUnit: string): string {
  const sign = percentChange > 0 ? '+' : '';
  const unit = deltaUnit === '%' ? '%' : ` ${deltaUnit}`;
  return `${sign}${percentChange.toFixed(1)}${unit}`;
}

// ============================================================
// SKELETON — mirrors the editorial layout to avoid CLS
// ============================================================
const KPICardSkeleton = () => (
  <>
    <KPISkeletonTopRow>
      <KPISkeletonTitle />
      <KPISkeletonSparkline />
    </KPISkeletonTopRow>
    <KPISkeletonValue />
    <KPISkeletonTrend />
  </>
);

// ============================================================
// KPICARD COMPONENT
// ============================================================
interface IKPICardProps extends IKPICard {
  onDrillDown?: (id: string) => void;
}

export const KPICard: React.FC<IKPICardProps> = ({
  id,
  title,
  value,
  unit,
  prefix,
  suffix,
  comparison,
  sparklineData,
  updatedAt,
  isLoading = false,
  color = 'primary',
  description,
  onDrillDown,
}) => {
  const prevUpdatedAt = useRef<number | undefined>(undefined);
  const [isUpdated, setIsUpdated] = useState(false);
  const [pop, setPop] = useState(false);

  // Detect real-time updates → trigger pulse + pop
  useEffect(() => {
    if (updatedAt && updatedAt !== prevUpdatedAt.current) {
      prevUpdatedAt.current = updatedAt;
      setIsUpdated(true);
      setPop(true);
      const t1 = setTimeout(() => {
        setIsUpdated(false);
      }, 900);
      const t2 = setTimeout(() => {
        setPop(false);
      }, 400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [updatedAt]);

  if (isLoading) {
    return (
      <KPICardWrapper
        $updated={false}
        $color={color}
        as="article"
        aria-busy="true"
        aria-label={`Loading ${title}`}
      >
        <KPICardSkeleton />
      </KPICardWrapper>
    );
  }

  const displayValue = formatValue(value, prefix, suffix);
  const trend = comparison?.trend ?? 'neutral';
  const isSuppressed = comparison?.suppressed === true;
  const deltaUnit = comparison?.deltaUnit ?? '%';
  // Suppressed (zero baseline) → em-dash, no misleading percentage.
  const deltaLabel =
    comparison && !isSuppressed ? formatDelta(comparison.percentChange, deltaUnit) : '—';

  // Accessible value includes the unit so SR users hear the denominator/suffix.
  const ariaValue = `${displayValue}${unit ? ` ${unit}` : ''}`;
  const comparisonClause = comparison
    ? isSuppressed
      ? ', no comparison available'
      : `, ${TREND_LABELS[trend]} of ${deltaLabel}`
    : '';

  const hasSparkline = sparklineData !== undefined && sparklineData.length > 0;

  return (
    <KPICardWrapper
      $updated={isUpdated}
      $color={color}
      onClick={
        onDrillDown
          ? () => {
              onDrillDown(id);
            }
          : undefined
      }
      style={{ cursor: onDrillDown ? 'pointer' : 'default' }}
      aria-label={`${title}: ${ariaValue}${comparisonClause}`}
      role={onDrillDown ? 'button' : undefined}
      tabIndex={onDrillDown ? 0 : undefined}
      onKeyDown={
        onDrillDown
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onDrillDown(id);
            }
          : undefined
      }
    >
      <KPITopRow>
        <KPITitle>{title}</KPITitle>
        {hasSparkline && (
          <KPISparklineSlot aria-hidden="true">
            <Sparkline
              data={sparklineData}
              color={color}
              trend={trend}
              variant="bare"
              width={96}
              height={28}
              animated
            />
          </KPISparklineSlot>
        )}
      </KPITopRow>

      <KPIValueRow>
        <KPIValue $pop={pop} aria-live="polite" aria-atomic="true">
          {displayValue}
        </KPIValue>
        {unit && <KPIUnit>{unit}</KPIUnit>}
      </KPIValueRow>

      {comparison && (
        <KPIComparisonRow>
          <KPITrendBadge
            $trend={trend}
            aria-label={
              isSuppressed ? 'no comparison available' : `${TREND_LABELS[trend]}: ${deltaLabel}`
            }
          >
            {TREND_ICONS[trend]}
            {deltaLabel}
          </KPITrendBadge>
          {comparison.label && <KPIComparisonLabel>{comparison.label}</KPIComparisonLabel>}
        </KPIComparisonRow>
      )}

      {description && <KPIDescription>{description}</KPIDescription>}
    </KPICardWrapper>
  );
};
