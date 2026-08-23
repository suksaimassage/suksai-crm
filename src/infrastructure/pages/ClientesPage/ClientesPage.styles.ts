/**
 * ClientesPage.styles.ts — Layout primitives for the Clientes master-detail page.
 */

import styled from 'styled-components';

// ── Page wrapper ──────────────────────────────────────────────────────────────

export const StyledClientesPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => `${theme.spacing.xl} 0`};
`;

// ── Master-Detail layout ──────────────────────────────────────────────────────

export const StyledMasterDetailLayout = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
`;

export const StyledTableColumn = styled.div`
  flex: 1;
  min-width: 0;
  /* overflow: hidden eliminado — TableRoot gestiona su propio overflow/border-radius
     y StyledPanelWrapper su propio clip. El hidden aquí crea un BFC que impide al
     Table ocupar todo el ancho disponible. */
`;

interface IStyledPanelWrapperProps {
  readonly $isOpen: boolean;
}

export const StyledPanelWrapper = styled.div<IStyledPanelWrapperProps>`
  width: ${({ $isOpen }) => ($isOpen ? '380px' : '0')};
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  overflow: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  transition:
    width 220ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 180ms ease-out;
  flex-shrink: 0;
`;

// ── Page header ───────────────────────────────────────────────────────────────

export const StyledPageHeader = styled.header`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

export const StyledPageMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StyledPageActions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-shrink: 0;
`;

export const StyledEyebrow = styled.p`
  font-size: 11px; /* [TOKEN GAP] no 11px typography token */
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.intent.primary};
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.font.body};
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 10px;

  &::before {
    content: '';
    display: block;
    width: 24px;
    height: 1px;
    background: ${({ theme }) => theme.color.intent.primary};
    flex-shrink: 0;
  }
`;

export const StyledH1 = styled.h1`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 42px; /* [TOKEN GAP] display heading size — theme.typography.size maxes below 42px */
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;
  line-height: 1.08;
  letter-spacing: -0.02em;
`;

/* reserved for future keyword accent inside StyledH1 */
export const StyledH1Accent = styled.span`
  font-style: italic;
  color: ${({ theme }) => theme.color.intent.primary};
`;

export const StyledPageDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 0;
  max-width: 480px;
`;

// ── KPI strip ─────────────────────────────────────────────────────────────────

export const StyledKPIStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.lg};
  overflow: hidden;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const StyledKPICell = styled.div`
  padding: 20px 22px;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  border-right: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};

  &:last-child {
    border-right: none;
  }

  @media (max-width: 900px) {
    border-bottom: ${({ theme }) => theme.border.width.xs}
      ${({ theme }) => theme.border.style.solid} ${({ theme }) => theme.border.color.neutral.subtle};

    &:nth-child(2),
    &:last-child {
      border-right: none;
    }
  }
`;

export const StyledKPIIco = styled.div`
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 22px;
  background: ${({ theme }) => theme.color.background.neutral};
  color: ${({ theme }) => theme.color.intent.primary};
`;

export const StyledKPIText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StyledKPILabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10.5px; /* [TOKEN GAP] no 10.5px typography token */
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.secondary};
  line-height: 1;
`;

export const StyledKPIValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 30px; /* [TOKEN GAP] no 30px typography token */
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1;
`;

// ── Toolbar ───────────────────────────────────────────────────────────────────

export const StyledToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

export const StyledToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  flex: 1 1 100%;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    flex: 0 1 auto;
  }
`;

export const StyledTabStrip = styled.div`
  /* Mobile: full-width + wrap para que los pills no salgan del contenedor */
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: 4px;
  background: ${({ theme }) => theme.color.background.neutral};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};
  padding: 4px;
  border-radius: ${({ theme }) => theme.border.radius.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    display: inline-flex;
    flex-wrap: wrap;
    width: 100%;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    display: inline-flex;
    flex-wrap: nowrap;
    width: auto;
    border-radius: ${({ theme }) => theme.border.radius.full};
  }
`;

export const StyledTab = styled.button<{ readonly $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: ${({ theme, $active }) =>
    $active
      ? theme.isDark
        ? theme.border.color.neutral.light
        : theme.color.background.card
      : 'transparent'};
  box-shadow: ${({ theme, $active }) => ($active ? theme.effect.elevation.raised : 'none')};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.border.radius.md};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: 600;
  color: ${({ theme, $active }) =>
    $active ? theme.color.text.primary : theme.color.text.secondary};
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition:
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.ease},
    color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.ease};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding: 8px 14px; /* [TOKEN GAP] */
    font-size: 12.5px; /* [TOKEN GAP] */
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    border-radius: ${({ theme }) => theme.border.radius.full};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

export const StyledTabCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: ${({ theme }) => theme.color.background.neutral};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-size: 10px; /* [TOKEN GAP] no 10px typography token */
  font-weight: 700;
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledSearchWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  height: 38px;
  padding: 0 14px;
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.full};
  min-width: 260px;
  transition: border-color ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.ease};

  &:focus-within {
    border-color: ${({ theme }) => theme.color.intent.primary};
  }
`;

export const StyledSearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 13px; /* [TOKEN GAP] no 13px typography token */
  color: ${({ theme }) => theme.color.text.primary};

  &::placeholder {
    color: ${({ theme }) => theme.color.text.placeholder};
  }
`;

// ── Table section header ──────────────────────────────────────────────────────

export const StyledTableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} 0;
`;

export const StyledTableMeta = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  color: ${({ theme }) => theme.color.text.tertiary};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
`;

// ── Client avatar cell (used inside table render) ─────────────────────────────

export const StyledClientCellWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
`;

export const StyledClientCellName = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// ── Service cell (single-line, ellipsis + native title for full value) ─────────

export const StyledServiceCell = styled.span`
  display: block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// ── Row click affordance ──────────────────────────────────────────────────────

export const StyledClickableRow = styled.div`
  cursor: pointer;
`;

// ── Page-level list error banner ──────────────────────────────────────────────

export const StyledListErrorBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) =>
    theme.color.intent.error}18; /* [TOKEN GAP] error tint, no exact token */
  border: 1px solid ${({ theme }) => theme.color.intent.error}40;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const StyledListErrorText = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;
`;

// ── Mobile / tablet client detail modal ──────────────────────────────────────

export const StyledClienteDetailModal = styled.div`
  position: fixed;
  inset: 0;
  z-index: 500;
  background: ${({ theme }) => theme.color.text.primary}3d; /* [TOKEN GAP] ~24% overlay */
  display: flex;
  align-items: flex-end;
`;

export const StyledClienteDetailModalContent = styled.div`
  width: 100%;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.border.radius.lg} ${({ theme }) => theme.border.radius.lg} 0
    0;

  /* Reset ClienteDetailPanel aside constraints for the modal context */
  aside {
    min-width: unset;
    width: 100%;
    height: auto;
    max-height: 92dvh;
    overflow-y: auto;
    border-left: none;
    border-radius: ${({ theme }) => theme.border.radius.lg} ${({ theme }) => theme.border.radius.lg}
      0 0;
    box-shadow: none;
  }

  @media (min-width: 480px) {
    border-radius: ${({ theme }) => theme.border.radius.lg};
    max-width: 420px;
    margin: ${({ theme }) => theme.spacing.lg} auto;
    align-self: center;

    aside {
      border-radius: ${({ theme }) => theme.border.radius.lg};
      max-height: 88dvh;
    }
  }
`;

// ── Empty filtered state ──────────────────────────────────────────────────────

export const StyledEmptyFiltersBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
`;

export const StyledEmptyFiltersText = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 0;
  text-align: center;
`;
