import styled from 'styled-components';

// ── TSalaStatus — backward-compat re-export ───────────────────────────────────
// The canonical type lives in components/centros.types.ts.
// Re-exported here so any consumer that imported it from this path continues to
// compile without changes.
export type { TSalaStatus } from './components/centros.types';

// ── Page wrapper ──────────────────────────────────────────────────────────────

export const StyledCentrosPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => `${theme.spacing.xl} 0`};
`;

// ── Content grid ──────────────────────────────────────────────────────────────

export const StyledContentGrid = styled.div`
  display: grid;
  /* Mobile: columna única — lista arriba, detalle debajo */
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  align-items: start;

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    grid-template-columns: 260px 1fr;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.xl}) {
    grid-template-columns: 300px 1fr;
  }
`;
