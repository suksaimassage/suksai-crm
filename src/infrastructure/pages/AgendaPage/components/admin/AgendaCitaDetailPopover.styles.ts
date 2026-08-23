import styled from 'styled-components';

export const StyledDetailBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  min-width: 0;
`;

export const StyledDetailClient = styled.h4`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0;
  line-height: 1.3;
`;

export const StyledCoupleTag = styled.span`
  display: inline-block;
  margin-left: ${({ theme }) => theme.spacing.xs};
  padding: 1px 8px;
  border-radius: 999px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.brand.lotus.text};
  background: ${({ theme }) => theme.color.brand.lotus.bg};
  border: 1px solid ${({ theme }) => theme.color.brand.lotus.border};
`;

export const StyledDetailMetaList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const StyledDetailMetaRow = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 13px;
  color: ${({ theme }) => theme.color.brand.ink[700]};
`;

export const StyledDetailMetaIcon = styled.span`
  display: inline-flex;
  width: 16px;
  flex-shrink: 0;
  justify-content: center;
  color: ${({ theme }) => theme.color.brand.ink[500]};
`;

export const StyledDetailMetaTime = styled.span`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: 12.5px;
`;

export const StyledDetailNotes = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  color: ${({ theme }) => theme.color.brand.ink[500]};
  margin: 0;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) => theme.color.background.light};
  line-height: 1.45;
`;

export const StyledDetailActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export const StyledDetailActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;

/** Skeleton placeholder rows for the loading state. */
export const StyledDetailSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const StyledSkeletonLine = styled.span<{ $w: string }>`
  display: block;
  height: 12px;
  width: ${({ $w }) => $w};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  background: ${({ theme }) => theme.color.neutralWarm[100]};
`;
