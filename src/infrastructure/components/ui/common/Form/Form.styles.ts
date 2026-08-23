/**
 * Form — Styled Components
 *
 * Mismos tokens visuales que Card para coherencia.
 * SRP: solo estilos, cero lógica.
 */

import styled, { css } from 'styled-components';
import type { TCardVariant, TCardSize } from '@infra/components/ui/common/Card/Card.types';

// ─── Helpers (espejo de Card.styles) ─────────────────────────────────────────

const paddingBySize = (size: TCardSize = 'md') => {
  const map = {
    sm: css`
      padding: ${({ theme }) => theme.spacing.sm};
    `,
    md: css`
      padding: ${({ theme }) => theme.spacing.md};
    `,
    lg: css`
      padding: ${({ theme }) => theme.spacing.lg};
    `,
  };
  return map[size];
};

const variantStyles = (variant: TCardVariant = 'default') => {
  const map = {
    default: css`
      background: ${({ theme }) => theme.color.background.card};
      border: ${({ theme }) => theme.border.width.xs} solid
        ${({ theme }) => theme.border.color.neutral.light};
      box-shadow: none;
    `,
    outlined: css`
      background: transparent;
      border: ${({ theme }) => theme.border.width.md} solid
        ${({ theme }) => theme.border.color.neutral.medium};
      box-shadow: none;
    `,
    elevated: css`
      background: ${({ theme }) => theme.color.background.card};
      border: none;
      box-shadow: ${({ theme }) => theme.effect.shadow.inner?.md};
    `,
    filled: css`
      background: ${({ theme }) => theme.color.background.neutral};
      border: none;
      box-shadow: ${({ theme }) => theme.effect.shadow.inner?.sm};
    `,
    ghost: css`
      background: transparent;
      border: none;
      box-shadow: none;
      border-radius: 0;
    `,
  };
  return map[variant];
};

// ─── StyledForm ───────────────────────────────────────────────────────────────

export const StyledForm = styled.form<{
  $variant: TCardVariant;
  $size: TCardSize;
  $fullWidth: boolean;
}>`
  display: flex;
  flex-direction: column;
  border-radius: ${({ theme }) => theme.border.radius.lg};
  overflow: hidden;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  max-width: 100%;

  ${({ $variant }) => variantStyles($variant)}

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    border-radius: ${({ theme }) => theme.border.radius.xl};
  }
`;

// ─── FormHeader ───────────────────────────────────────────────────────────────

export const StyledFormHeader = styled.div<{ $size: TCardSize }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  ${({ $size }) => paddingBySize($size)}
  border-bottom: ${({ theme }) => theme.border.width.xs} solid
    ${({ theme }) => theme.border.color.neutral.light};
`;

export const StyledFormHeaderContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const StyledFormHeaderTitle = styled.h3`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.type.headline.fontFamily};
  font-size: ${({ theme }) => theme.typography.type.headline.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.type.headline.fontWeight};
  color: ${({ theme }) => theme.color.text.primary};
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledFormHeaderSubtitle = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0 0 0;
  font-size: ${({ theme }) => theme.typography.type.subtitle.fontSize.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  line-height: 1.5;
`;

export const StyledFormHeaderAction = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

// ─── FormBody ─────────────────────────────────────────────────────────────────

export const StyledFormBody = styled.div<{ $size: TCardSize }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  ${({ $size }) => paddingBySize($size)}
`;

// ─── FormFooter ───────────────────────────────────────────────────────────────

export const StyledFormFooter = styled.div<{
  $size: TCardSize;
  $align: 'left' | 'center' | 'right' | 'between';
}>`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  ${({ $size }) => paddingBySize($size)}
  border-top: ${({ theme }) => theme.border.width.xs} solid
    ${({ theme }) => theme.border.color.neutral.light};

  justify-content: ${({ $align }) =>
    ({
      left: 'flex-start',
      center: 'center',
      right: 'flex-end',
      between: 'space-between',
    })[$align]};

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    flex-wrap: nowrap;
  }
`;
