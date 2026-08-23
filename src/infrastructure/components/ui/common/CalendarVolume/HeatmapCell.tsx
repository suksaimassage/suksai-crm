import React, { useRef } from 'react';
import type { IGridCell, ICellRenderProps } from './CalendarVolume.types';
import { SCell } from './CalendarVolume.styles';
import { formatHourLabel } from './useTimeGrid';

interface IHeatmapCellProps {
  cell: IGridCell;
  bgColor: string;
  textColor: string;
  isSelected: boolean;
  ariaLabel?: string;
  renderCell?: (props: ICellRenderProps) => React.ReactNode;
  onCellClick?: (cell: IGridCell, el: HTMLElement | null) => void;
  onCellMouseEnter?: (cell: IGridCell, el: HTMLElement | null) => void;
  onCellFocus?: (cell: IGridCell, el: HTMLElement | null) => void;
  onCellBlur?: (cell: IGridCell, el: HTMLElement | null) => void;
}

export const HeatmapCell: React.FC<IHeatmapCellProps> = ({
  cell,
  bgColor,
  textColor,
  isSelected,
  ariaLabel,
  renderCell,
  onCellClick,
  onCellMouseEnter,
  onCellFocus,
  onCellBlur,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isEmpty = cell.value === 0;
  const hourLabel = formatHourLabel(cell.hour);
  const internalAriaLabel = `${cell.dayLabel} ${hourLabel}: ${cell.value} appointment${
    cell.value !== 1 ? 's' : ''
  }`;

  const resolvedAriaLabel = ariaLabel ?? internalAriaLabel;

  if (renderCell) {
    return (
      <div
        ref={ref}
        role="gridcell"
        aria-label={resolvedAriaLabel}
        tabIndex={0}
        onClick={() => onCellClick?.(cell, ref.current)}
        onMouseEnter={() => onCellMouseEnter?.(cell, ref.current)}
        onFocus={() => onCellFocus?.(cell, ref.current)}
        onBlur={() => onCellBlur?.(cell, ref.current)}
      >
        {renderCell({
          day: cell.day,
          dayLabel: cell.dayLabel,
          hour: cell.hour,
          value: cell.value,
          intensity: cell.intensity,
          bgColor,
          textColor,
          isEmpty,
        })}
      </div>
    );
  }

  return (
    <SCell
      ref={ref}
      $bgColor={bgColor}
      $textColor={textColor}
      $isEmpty={isEmpty}
      $selected={isSelected}
      role="gridcell"
      aria-label={resolvedAriaLabel}
      aria-selected={isSelected}
      tabIndex={0}
      onClick={() => onCellClick?.(cell, ref.current)}
      onMouseEnter={() => onCellMouseEnter?.(cell, ref.current)}
      onFocus={() => onCellFocus?.(cell, ref.current)}
      onBlur={() => onCellBlur?.(cell, ref.current)}
    >
      {!isEmpty && cell.value}
    </SCell>
  );
};

HeatmapCell.displayName = 'HeatmapCell';
