import styled from 'styled-components';

// ── Detail panel layout ───────────────────────────────────────────────────────

export const StyledDetailPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

export const StyledDetailCard = styled.div`
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  /* Mobile: padding compacto */
  padding: ${({ theme }) => theme.spacing.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    padding: ${({ theme }) => theme.spacing.xl};
  }
`;

export const StyledDetailCardTop = styled.div`
  display: flex;
  /* Mobile: imagen arriba, detalle+botón abajo */
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
`;

export const StyledDetailCardLeft = styled.div`
  display: flex;
  /* Mobile: imagen primero (column), info debajo */
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  flex: 1;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    flex-direction: row;
  }
`;

export const StyledDetailImagePlaceholder = styled.div`
  /* Mobile: imagen full-width, más alta para destacar */
  width: 100%;
  height: 160px; /* [TOKEN GAP] */
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.border.radius.md};
  overflow: hidden;
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  display: flex;
  align-items: center;
  justify-content: center;
  /* Plate stays a light/paper surface in BOTH themes — neutralWarm is never
     overridden by dark.theme.ts (only the neutral alias is), so this keeps
     the dark-inked logos legible regardless of mode. */
  background-color: ${({ theme }) => theme.color.neutralWarm[100]};

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    width: 140px; /* [TOKEN GAP] no fixed-width token */
    height: 100px;
  }
`;

export const StyledDetailImageLogo = styled.img`
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  padding: ${({ theme }) => theme.spacing.sm};
`;

export const StyledDetailInfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  flex: 1;
  min-width: 0;
`;

export const StyledDetailEyebrow = styled.p`
  font-size: 10px; /* [TOKEN GAP] */
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.tertiary};
  font-family: ${({ theme }) => theme.typography.font.body};
  margin: 0;
`;

export const StyledDetailH2 = styled.h2`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 22px; /* [TOKEN GAP] mobile */
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;
  line-height: 1.15;

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    font-size: 28px; /* [TOKEN GAP] */
  }
`;

export const StyledDetailTitleAccent = styled.em`
  font-style: italic;
  color: ${({ theme }) => theme.color.intent.primary};
`;

export const StyledDetailInfoRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: 4px; /* [TOKEN GAP] */

  &:last-child {
    margin-bottom: 0;
  }
`;

export const StyledDetailInfoIcon = styled.span`
  color: ${({ theme }) => theme.color.text.tertiary};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  position: relative;
  top: 1px; /* optical alignment with cap-height */
`;

export const StyledDetailInfoText = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.primary};
`;

export const StyledOpenNowPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px; /* [TOKEN GAP] */
  padding: 2px 8px; /* [TOKEN GAP] */
  border-radius: ${({ theme }) => theme.border.radius.full};
  margin-left: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.color.intent.success + '1a'};
  color: ${({ theme }) => theme.color.intent.success};
  font-size: 10px; /* [TOKEN GAP] */
  font-weight: 700;
  font-family: ${({ theme }) => theme.typography.font.body};
`;

export const StyledDetailActionRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.sm};
  /* Mobile: botón a la izquierda, junto al detalle */
  align-items: center;
  align-self: flex-start;
  flex-shrink: 0;

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    flex-direction: column;
    align-items: flex-end;
    align-self: auto;
  }
`;

export const StyledDetailKPIRow = styled.div<{ readonly $cellCount: number }>`
  display: grid;
  /* Mobile: máximo 2 columnas para que quepan en 320px */
  grid-template-columns: repeat(2, 1fr);
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.md};
  overflow: hidden;
  margin-top: ${({ theme }) => theme.spacing.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    grid-template-columns: ${({ $cellCount }) => `repeat(${$cellCount}, 1fr)`};
    margin-top: ${({ theme }) => theme.spacing.lg};
  }
`;

export const StyledDetailKPICell = styled.div`
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
  border-right: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};

  &:last-child {
    border-right: none;
  }
`;

export const StyledDetailKPILabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px; /* [TOKEN GAP] */
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledDetailKPIValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 24px; /* [TOKEN GAP] no 24px typography display token */
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1;
`;

// ── Salas section ─────────────────────────────────────────────────────────────

export const StyledSalasSection = styled.div``;

export const StyledSalasSectionHeader = styled.div`
  display: flex;
  /* Mobile: título arriba, toggle debajo */
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

export const StyledSalasSectionLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px; /* [TOKEN GAP] */
`;

export const StyledSalasSectionTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 22px; /* [TOKEN GAP] no 22px typography token */
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;
  line-height: 1.2;
`;

export const StyledSalasTitleAccent = styled.em`
  font-style: italic;
  color: ${({ theme }) => theme.color.intent.primary};
`;

export const StyledSalasSectionSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 0;
`;

// ── Status dot (for list mode table) ─────────────────────────────────────────

import type { TSalaStatus } from './centros.types';

export const StyledStatusDot = styled.span<{ readonly $status: TSalaStatus }>`
  display: inline-block;
  width: 8px; /* [TOKEN GAP] */
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $status }) =>
    $status === 'en_sesion'
      ? theme.color.intent.success
      : $status === 'mantenimiento'
        ? theme.color.intent.warning
        : theme.border.color.neutral.medium};
  flex-shrink: 0;
`;
