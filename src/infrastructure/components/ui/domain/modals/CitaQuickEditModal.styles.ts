/**
 * CitaQuickEditModal.styles.ts — styled primitives for the therapist quick-edit
 * modal (edit observation + optionally mark completada).
 *
 * The modal composes existing primitives (Modal / FormField / Textarea / Button /
 * Badge), so these styles only cover the modal-specific layout: the body stack,
 * the completion-control row, the disabled-toggle hint, the terminal context
 * line and the small status signal (icon + text). All values are theme tokens;
 * transient props use the `$` prefix.
 */
import styled from 'styled-components';

/** Vertical stack of the modal body sections. */
export const StyledQuickEditBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

/** Completion section — wraps the toggle/badge/context line. */
export const StyledCompletionSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.border.color.neutral.light};
`;

/** Hint shown beside a disabled completion toggle (confirm/assign first). */
export const StyledCompletionHint = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin: 0;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
`;

/** Context line for terminal estados (cancelled / no-show). */
export const StyledContextLine = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin: 0;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
`;

/**
 * Small status signal (icon + label) — never colour-alone (WCAG 1.4.1). Used for
 * the read-only "Completada" badge row and as the icon slot in hints/context.
 */
export const StyledStatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/** Inline icon wrapper — sizes the decorative SVG and inherits the line colour. */
export const StyledStatusIcon = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  color: currentColor;

  svg {
    display: block;
  }
`;

/** Footer button cluster (mirrors CitaModal's right-aligned footer). */
export const StyledFooterActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;
