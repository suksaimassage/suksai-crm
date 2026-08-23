/**
 * KPIStrip — Horizontal strip of icon + label + value cells.
 *
 * Use the compound API:
 *
 *   <KPIStrip>
 *     <KPIStrip.Cell icon={<SomeIcon />} label="Clientes activos" value="128" />
 *     <KPIStrip.Cell label="Ingresos" value="€4.200" />
 *   </KPIStrip>
 *
 * The container is a CSS grid that auto-fits up to 4 columns and collapses to
 * 2 columns below 900 px and 1 column below 480 px. All tokens come from the
 * theme — no hardcoded values.
 */

import type { ReactNode } from 'react';
import {
  StyledKPIStrip,
  StyledKPIStripCell,
  StyledKPIStripIcon,
  StyledKPIStripLabel,
  StyledKPIStripText,
  StyledKPIStripValue,
} from './KPIStrip.styles';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IKPIStripProps {
  readonly children: ReactNode;
  /** Optional accessible label for the landmark region */
  readonly 'aria-label'?: string;
}

interface IKPIStripCellProps {
  /** Optional icon node rendered in the left icon slot */
  readonly icon?: ReactNode;
  /** All-caps label above the value */
  readonly label: string;
  /** Formatted value string or number */
  readonly value: string | number;
}

type TKPIStripComponent = React.FC<IKPIStripProps> & {
  Cell: React.FC<IKPIStripCellProps>;
};

// ─── KPIStrip (root) ──────────────────────────────────────────────────────────

export const KPIStrip: TKPIStripComponent = ({ children, 'aria-label': ariaLabel }) => (
  <StyledKPIStrip role="region" aria-label={ariaLabel}>
    {children}
  </StyledKPIStrip>
);

KPIStrip.displayName = 'KPIStrip';

// ─── KPIStrip.Cell ────────────────────────────────────────────────────────────

const KPIStripCell: React.FC<IKPIStripCellProps> = ({ icon, label, value }) => (
  <StyledKPIStripCell>
    {icon !== undefined && <StyledKPIStripIcon aria-hidden="true">{icon}</StyledKPIStripIcon>}
    <StyledKPIStripText>
      <StyledKPIStripLabel>{label}</StyledKPIStripLabel>
      <StyledKPIStripValue>{value}</StyledKPIStripValue>
    </StyledKPIStripText>
  </StyledKPIStripCell>
);

KPIStripCell.displayName = 'KPIStrip.Cell';

KPIStrip.Cell = KPIStripCell;
