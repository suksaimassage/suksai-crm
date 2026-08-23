import styled, { css, keyframes } from 'styled-components';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const sizeMap = {
  xs: { diameter: '16px', borderWidth: '2px' },
  sm: { diameter: '20px', borderWidth: '2px' },
  md: { diameter: '24px', borderWidth: '2px' },
  lg: { diameter: '32px', borderWidth: '3px' },
} as const;

export type TSpinnerSize = keyof typeof sizeMap;
export type TSpinnerTone = 'inherit' | 'primary' | 'inverse';

export interface IStyledSpinnerProps {
  readonly $size: TSpinnerSize;
  readonly $tone: TSpinnerTone;
}

const toneStyles = ($tone: TSpinnerTone) => css`
  color: ${({ theme }) => {
    if ($tone === 'primary') return theme.color.intent.primary;
    if ($tone === 'inverse') return theme.color.text.inverse;
    return 'currentColor';
  }};
`;

export const StyledSpinnerVisual = styled.span<IStyledSpinnerProps>`
  display: inline-block;
  width: ${({ $size }) => sizeMap[$size].diameter};
  height: ${({ $size }) => sizeMap[$size].diameter};
  border: ${({ $size }) => sizeMap[$size].borderWidth} solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  ${({ $tone }) => toneStyles($tone)}

  @media (prefers-reduced-motion: reduce) {
    animation: ${pulse} 1.5s ease-in-out infinite;
    border-top-color: currentColor;
  }
`;

export const StyledSpinnerWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;
