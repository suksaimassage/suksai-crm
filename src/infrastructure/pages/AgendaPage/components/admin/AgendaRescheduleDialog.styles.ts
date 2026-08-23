import styled from 'styled-components';

/**
 * Styled body parts for AgendaRescheduleDialog — mirrors AgendaCancelDialog.styles
 * (single left-aligned column, `spacing.md` between groups) and applies the
 * Designer's §6 visual hierarchy: the destination (TO) value is the loudest text
 * because it answers "where is it going?".
 */

export const StyledRescheduleBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  text-align: left;
`;

/** Client + service line — who/what is moving. */
export const StyledRescheduleSummary = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;
  line-height: 1.5;
  /* Long client+service must read in full — wrap, never truncate (§6 / §10). */
  overflow-wrap: anywhere;
`;

/** Container for the FROM/TO label-value pairs. */
export const StyledRescheduleMove = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

/** One "De / A" row: a muted label followed by the day · time value. */
export const StyledRescheduleRow = styled.p`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.sm};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  margin: 0;
  line-height: 1.5;
`;

export const StyledRescheduleLabel = styled.span`
  flex-shrink: 0;
  min-width: 1.75rem;
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.text.muted};
`;

/** FROM value — present but de-emphasised relative to the destination. */
export const StyledRescheduleFromValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.secondary};
`;

/** TO value — the emphasis: where the cita is going. */
export const StyledRescheduleToValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
`;

/** Optional advisory overlap hint (muted, never a blocker). */
export const StyledRescheduleHint = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
  margin: 0;
  line-height: 1.5;
`;

/** Domain-failure message — same role="alert" idiom as AgendaCancelDialog. */
export const StyledRescheduleError = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.intent.error};
  margin: 0;
  line-height: 1.5;
`;

// ── Therapist reassignment row (Surface A — day view only) ──────────────────────
// Only rendered when the drag crossed therapist columns (fromTherapist !==
// toTherapist). Sits ABOVE the De/A time rows and reuses the same label/value
// idiom; a small badge flags that this move also changes the assignee. Absent in
// the week path, so that summary renders exactly as before (additive, §3).

/** "Terapeuta: {from} → {to}" line — the reassignment fact. */
export const StyledRescheduleReassign = styled.p`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  margin: 0;
  line-height: 1.5;
`;

/** The "{from} → {to}" therapist names — destination emphasised like the TO value. */
export const StyledRescheduleReassignValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
`;

/** Small "Reasignación" pill — a non-color-only flag that the assignee changes. */
export const StyledRescheduleReassignBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 1px ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.border.radius.full};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) =>
    theme.isDark ? theme.color.brand.gold[300] : theme.color.brand.gold[700]};
  background: ${({ theme }) => theme.color.brand.gold.bg};
`;
