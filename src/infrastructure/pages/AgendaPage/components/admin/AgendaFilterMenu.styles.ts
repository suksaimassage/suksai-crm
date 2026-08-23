import styled from 'styled-components';
import type { TEstadoCita } from '@domain/types';
import { estadoDotColor } from '../shared/agendaEstado';

/** Chip trigger — extends the existing filter-chip look with an open-state chevron. */
export const StyledFilterChip = styled.button<{ $active: boolean; $open: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px 7px 11px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.color.brand.gold[300] : theme.color.neutralWarm[200]};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  cursor: pointer;
  transition:
    border-color 150ms,
    background 150ms;
  background: ${({ $active, theme }) =>
    $active ? theme.color.brand.gold[50] : theme.color.background.card};
  color: ${({ $active, theme }) =>
    $active ? theme.color.brand.gold[700] : theme.color.brand.ink[500]};

  &:hover {
    border-color: ${({ theme }) => theme.color.brand.gold[300]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    transition: transform 150ms ${({ theme }) => theme.transition.timing.easeOut};
    transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  }

  @media (prefers-reduced-motion: reduce) {
    svg {
      transition: none;
    }
  }
`;

export const StyledChipValue = styled.span`
  font-weight: 600;
`;

export const StyledMenuList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 280px;
  overflow-y: auto;
`;

export const StyledMenuOption = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.border.radius.md};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 13px;
  color: ${({ theme }) => theme.color.brand.ink[900]};
  background: ${({ $selected, theme }) => ($selected ? theme.color.brand.gold[50] : 'transparent')};
  min-height: 36px;

  &:hover {
    background: ${({ theme }) => theme.color.neutralWarm[100]};
  }

  &:focus-within {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }

  /* The Radio/Checkbox's own <label> IS the clickable row (native label→input
     association — clicking anywhere in it, including the text, toggles the
     input in one native step; no manual click handler / label duplication). */
  & > label {
    flex: 1;
    min-width: 0;
  }

  input {
    flex-shrink: 0;
  }
`;

export const StyledOptionDot = styled.span<{ $estado: TEstadoCita }>`
  width: 9px;
  height: 9px;
  border-radius: 999px;
  flex-shrink: 0;
  background: ${({ $estado, theme }) => estadoDotColor($estado, theme)};
`;

export const StyledMenuFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.xs};
  padding-top: ${({ theme }) => theme.spacing.xs};
  border-top: 1px solid ${({ theme }) => theme.color.neutralWarm[200]};
`;

export const StyledClearButton = styled.button`
  background: none;
  border: none;
  padding: 6px 8px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.brand.ink[500]};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.border.radius.sm};

  &:hover {
    color: ${({ theme }) => theme.color.brand.ink[900]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }
`;

export const StyledMenuEmpty = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  color: ${({ theme }) => theme.color.brand.ink[500]};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.md} 0;
  margin: 0;
`;
