/**
 * TerapeutasPage.styles.ts
 *
 * Layout styles for the Terapeutas management page. The page header, KPI strip
 * and toolbar replicate the RitualesPage visual language (token-for-token) into
 * Terapeutas' own styled-components: editorial serif H1 with italic accent,
 * .24em eyebrow with a hairline rule, pill tab strip, and a rounded pill search.
 * Functional especialidad/sort/clear controls keep their behavior and sit in
 * the right toolbar slot — they do NOT inherit the Rituales decorative-chip
 * disabled treatment.
 *
 * Card grid is 3 columns on desktop, 2 on tablet, 1 on small mobile.
 */

import styled from 'styled-components';

// ── Page header ────────────────────────────────────────────────────────────

export const StyledPageHeader = styled.header`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
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

export const StyledPageEyebrow = styled.p`
  font-size: 11px;
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

export const StyledPageTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-weight: 400;
  font-size: 42px;
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    font-size: ${({ theme }) => theme.typography.size['3xl']};
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    font-size: ${({ theme }) => theme.typography.size['2xl']};
  }
`;

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

// ── Toolbar (tabs + search on the left, filters on the right) ───────────────

export const StyledToolbar = styled.div`
  display: flex;
  /* Mobile: filtros arriba, acciones (select/clear) abajo */
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  @media (min-width: 1280px) {
    flex-wrap: nowrap;
  }
`;

export const StyledToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  /* Mobile: ancho completo heredado del padre en columna */
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    width: auto;
    flex: 1 1 auto;
  }

  @media (min-width: 1280px) {
    flex-wrap: nowrap;
  }
`;

export const StyledToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

// ── Pill status-filter strip ──────────────────────────────────────────────────
// NOTE: this is a STATUS FILTER control (role="group" + aria-pressed toggles),
// NOT a tablist. The page-level navigation tabs (Directorio / Horarios) are the
// common/Tabs component (variant="enclosed"). Two distinct controls — keep the
// pill look here so it never reads as the same control as the page tabs.

export const StyledFilterStrip = styled.div`
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
    flex-shrink: 0;
    flex-wrap: wrap;
    width: 100%;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    display: inline-flex;
    flex-shrink: 0;
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

  @media (hover: hover) {
    &:hover {
      color: ${({ theme }) => theme.color.text.primary};
    }
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
  font-size: 10px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.text.secondary};
`;

// ── Pill search ─────────────────────────────────────────────────────────────

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
  /* Allow shrinking below 260px on the narrowest viewports so a wrapped
     toolbar never forces horizontal page scroll (≤320px safe). */
  min-width: min(260px, 100%);
  transition: border-color ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.ease};

  &:focus-within {
    border-color: ${({ theme }) => theme.color.intent.primary};
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.color.text.secondary};
    width: 16px;
    height: 16px;
  }
`;

export const StyledSearchInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 13px;
  color: ${({ theme }) => theme.color.text.primary};

  &::placeholder {
    color: ${({ theme }) => theme.color.text.placeholder};
  }
`;

// ── Functional filter controls (especialidad / sort / clear) ────────────────

export const StyledSelectWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const StyledSelect = styled.select`
  appearance: none;
  height: 38px;
  padding: 0 ${({ theme }) => theme.spacing.xl} 0 14px;
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) =>
      theme.isDark ? theme.border.color.neutral.light : theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.text.secondary};
  cursor: pointer;
  min-width: 150px;
  transition: border-color ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.ease};

  @media (hover: hover) {
    &:hover {
      border-color: ${({ theme }) => theme.border.color.neutral.medium};
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

export const StyledSelectChevron = styled.span`
  position: absolute;
  right: 12px;
  pointer-events: none;
  color: ${({ theme }) => theme.color.text.secondary};
  display: flex;
  align-items: center;

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const StyledClearFiltersBtn = styled.button`
  height: 38px;
  padding: 0 14px;
  background: ${({ theme }) => theme.color.background.card};
  border: ${({ theme }) => theme.border.width.xs} ${({ theme }) => theme.border.style.solid}
    ${({ theme }) => theme.border.color.neutral.subtle};
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.text.secondary};
  cursor: pointer;
  white-space: nowrap;
  transition:
    border-color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.ease},
    color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.ease};

  @media (hover: hover) {
    &:hover {
      color: ${({ theme }) => theme.color.text.primary};
      border-color: ${({ theme }) => theme.border.color.neutral.medium};
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

// ── Card grid ──────────────────────────────────────────────────────────────

export const StyledCardGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing['2xl']};
  list-style: none;
  margin: 0;
  padding: 0;

  /* 1025–1279px: 2 columns */
  @media (max-width: 1279px) {
    grid-template-columns: repeat(2, 1fr);
  }

  /* ≤ 640px: 1 column */
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.xl};
  }
`;

export const StyledCardItem = styled.li`
  min-width: 0;
`;

// ── Empty state ────────────────────────────────────────────────────────────

export const StyledEmptyState = styled.div.attrs({
  'aria-live': 'polite',
  'aria-atomic': 'true',
})`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing['3xl']} ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

export const StyledEmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: ${({ theme }) => theme.color.background.neutral};
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.color.text.muted};

  svg {
    width: 28px;
    height: 28px;
  }
`;

export const StyledEmptyTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 1.5rem;
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;
`;

export const StyledEmptyDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
  margin: 0;
  max-width: 360px;
`;

// ── Error state ────────────────────────────────────────────────────────────

export const StyledErrorState = styled(StyledEmptyState)``;

export const StyledErrorTitle = styled(StyledEmptyTitle)`
  color: ${({ theme }) => theme.color.intent.error};
`;
