/**
 * SegmentoBadge.styles.ts
 *
 * Uses direct OKLCH values for segment-specific colors because these
 * semantic stops do not exist in the current theme token set.
 * TOKEN GAP — segment-specific colors, not in theme yet.
 */

import styled from 'styled-components';
import type { TClienteSegmento } from '@infra/pages/ClientesPage/Clientes.types';

/* [TOKEN GAP] — segment-specific colors, not in theme yet */
const SEGMENT_STYLES: Record<
  TClienteSegmento,
  { background: string; color: string; border: string }
> = {
  vip: {
    background: 'oklch(0.95 0.05 56)',
    color: 'oklch(0.44 0.14 56)',
    border: 'oklch(0.84 0.13 56)',
  },
  activo: {
    background: 'oklch(0.93 0.04 132)',
    color: 'oklch(0.39 0.10 132)',
    border: 'oklch(0.76 0.10 132)',
  },
  nuevo: {
    /* [TOKEN GAP] rose variant — no theme token yet */
    background: 'oklch(0.95 0.04 350)',
    color: 'oklch(0.42 0.18 350)',
    border: 'oklch(0.76 0.15 350)',
  },
  en_riesgo: {
    background: 'oklch(0.95 0.05 56)',
    color: 'oklch(0.44 0.14 56)',
    border: 'oklch(0.84 0.13 56)',
  },
  inactivo: {
    background: 'oklch(0.94 0.01 67)',
    color: 'oklch(0.52 0.03 67)',
    border: 'oklch(0.82 0.02 67)',
  },
} as const;

export const StyledSegmentoBadge = styled.span<{
  $segment: TClienteSegmento;
  $size: 'sm' | 'md';
}>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: ${({ $size }) => ($size === 'sm' ? '2px 6px' : '3px 8px')};
  border-radius: 9999px;
  border: 1px solid ${({ $segment }) => SEGMENT_STYLES[$segment].border};
  background: ${({ $segment }) => SEGMENT_STYLES[$segment].background};
  color: ${({ $segment }) => SEGMENT_STYLES[$segment].color};
  font-size: ${({ $size }) => ($size === 'sm' ? '11px' : '12px')};
  font-weight: 500;
  font-family: ${({ theme }) => theme.typography.font.body};
  white-space: nowrap;
  line-height: 1.4;
  /* theme.typography.size used for font-size via the $size prop above */
`;

export const StyledSegmentoGlyph = styled.span`
  font-size: 10px;
  line-height: 1;
`;
