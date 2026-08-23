import styled from 'styled-components';
import type { TSalaStatus } from './centros.types';

export const StyledSalaGrid = styled.div`
  display: grid;
  /* Mobile: columna única */
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
`;

export const StyledSalaCard = styled.article<{ readonly $status: TSalaStatus }>`
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme, $status }) =>
      $status === 'en_sesion'
        ? theme.color.intent.primary + '66'
        : $status === 'mantenimiento'
          ? theme.color.intent.warning + '66'
          : theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition:
    transform 150ms ease-out,
    /* [TOKEN GAP] inline duration */ box-shadow 150ms ease-out;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-1px);
      box-shadow: ${({ theme }) => theme.effect.elevation.raised};
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

export const StyledSalaHeroArea = styled.div<{ readonly $colorVariant: 0 | 1 | 2 | 3 | 4 }>`
  height: 100px; /* [TOKEN GAP] */
  position: relative;
  display: grid;
  place-items: center;
  background: ${({ theme, $colorVariant }) => {
    const palettes: [string, string, string, string, string] = [
      theme.color.intent.primary + '33',
      theme.color.intent.success + '33',
      theme.color.intent.secondary + '33',
      theme.color.intent.warning + '33',
      theme.color.intent.info + '33',
    ];
    return palettes[$colorVariant];
  }};
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledSalaStatusPill = styled.div<{
  readonly $status: TSalaStatus;
  readonly $static?: boolean;
}>`
  ${({ $static }) => ($static !== true ? 'position: absolute; top: 10px; left: 10px;' : '')}
  display: inline-flex;
  align-items: center;
  gap: 4px; /* [TOKEN GAP] */
  padding: 3px 8px; /* [TOKEN GAP] */
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-size: 10px; /* [TOKEN GAP] */
  font-weight: 700;
  font-family: ${({ theme }) => theme.typography.font.body};
  background: ${({ theme, $status }) =>
    $status === 'en_sesion'
      ? theme.color.intent.error + '1a'
      : $status === 'mantenimiento'
        ? theme.color.intent.warning + '1a'
        : theme.color.intent.success + '1a'};
  color: ${({ theme, $status }) =>
    $status === 'en_sesion'
      ? theme.color.intent.error
      : $status === 'mantenimiento'
        ? theme.color.intent.warning
        : theme.color.intent.success};
`;

/* Absolute anchor for the sala-card context menu (top-right of the hero area).
   Holds the DropdownMenu trigger + isolates click/keydown from the card body. */
export const StyledSalaMenuAnchor = styled.span`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  z-index: 1;
  display: inline-flex;
`;

export const StyledSalaMoreBtn = styled.button`
  position: relative;
  width: 24px; /* [TOKEN GAP] no 24px icon-size token — visual glyph box */
  height: 24px;
  border: none;
  background: transparent;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  cursor: pointer;
  color: ${({ theme }) => theme.color.text.tertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut};

  /* Expand the interactive hit area to ≥44px (WCAG 2.5.5) without enlarging the
     24px glyph box. [TOKEN GAP] no 44px touch-target sizing token. */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }

  &:hover {
    background: ${({ theme }) => theme.color.background.neutral};
    color: ${({ theme }) => theme.color.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StyledSalaCardBody = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StyledSalaCode = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px; /* [TOKEN GAP] */
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledSalaCardNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
`;

export const StyledSalaName = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: 700;
  color: ${({ theme }) => theme.color.text.primary};
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledSalaNameAccent = styled.em`
  font-style: italic;
  color: ${({ theme }) => theme.color.intent.primary};
`;

export const StyledSalaEquipmentTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.xs};
  min-width: 0;

  /* Each chip is a Tag (renders as <span>). Tag hardcodes flex-shrink:0 +
     white-space:nowrap, so constrain it from the owned container: cap width to
     the card body and allow the chip to shrink. (Tag.styles.ts is not owned.) */
  > span {
    max-width: 100%;
    min-width: 0;
    flex-shrink: 1;
    overflow: hidden;
  }

  /* Inner label (Typography as="span") — truncate long single words / phrases. */
  > span > span {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const StyledSalaSlotSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing.xs};
  margin-top: auto;
  border-top: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
`;

export const StyledSalaSlotLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledSalaSlotCount = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledSlotBar = styled.div`
  display: flex;
  gap: 2px; /* [TOKEN GAP] */
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export const StyledSlotSegment = styled.div<{ readonly $status: 'used' | 'free' }>`
  flex: 1;
  height: 4px; /* [TOKEN GAP] */
  border-radius: 2px; /* [TOKEN GAP] */
  background: ${({ theme, $status }) =>
    $status === 'used' ? theme.color.intent.primary : theme.border.color.neutral.subtle};
`;

export const StyledAddSalaCard = styled.button`
  background: transparent;
  border: ${({ theme }) => theme.border.width.sm} ${({ theme }) => theme.border.style.dashed}
    ${({ theme }) => theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  min-height: 160px; /* [TOKEN GAP] */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  color: ${({ theme }) => theme.color.text.disabled};
  transition:
    border-color 150ms,
    /* [TOKEN GAP] */ color 150ms;

  &:hover {
    border-color: ${({ theme }) => theme.color.intent.primary};
    color: ${({ theme }) => theme.color.intent.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;
