/**
 * WorkScheduleSection.styles.ts
 *
 * Styles for the page-local schedule wrapper. The section is focusable
 * (tabIndex=-1) so focus can land here after a menu-driven tab switch; the
 * focus outline is suppressed because the panel itself is not an interactive
 * control (focus is programmatic, not a tab stop).
 */

import styled from 'styled-components';

export const StyledScheduleSection = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  /* Contain the Day grid's residual width at the panel so the internal-scroll
     guarantee does not depend on a body overflow-x:hidden backstop (AC-B3).
     clip (not hidden) avoids creating a scroll container that would swallow
     the calendar's own sticky positioning. */
  overflow-x: clip;

  &:focus {
    outline: none;
  }
`;

export const StyledScheduleStatus = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing['3xl']} ${({ theme }) => theme.spacing.xl};
  text-align: center;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
`;

export const StyledScheduleErrorTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size['2xl']};
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.intent.error};
  margin: 0;
`;
