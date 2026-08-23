import styled from 'styled-components';
import type { TEstadoCita } from '@domain/types';
import { estadoDotColor } from '../shared/agendaEstado';

export const StyledEstadoTrigger = styled.button<{ $disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.color.neutralWarm[200]};
  background: ${({ theme }) => theme.color.background.card};
  color: ${({ $disabled, theme }) =>
    $disabled ? theme.color.brand.ink[500] : theme.color.brand.ink[900]};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 12.5px;
  font-weight: 600;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};
  transition: border-color 150ms;

  &:hover {
    border-color: ${({ $disabled, theme }) =>
      $disabled ? theme.color.neutralWarm[200] : theme.color.brand.gold[300]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }
`;

export const StyledEstadoMenuLabel = styled.span`
  white-space: nowrap;
`;

export const StyledEstadoTriggerChevron = styled.svg`
  width: 13px;
  height: 13px;
  flex-shrink: 0;
`;

export const StyledEstadoDot = styled.span<{ $estado: TEstadoCita }>`
  width: 9px;
  height: 9px;
  border-radius: 999px;
  flex-shrink: 0;
  display: inline-block;
  background: ${({ $estado, theme }) => estadoDotColor($estado, theme)};
`;
