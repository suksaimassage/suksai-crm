import styled, { css } from 'styled-components';

export type THeadingVisualSize =
  | 'largeTitle'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'headline'
  | 'subtitle';
export type THeadingTone = 'default' | 'muted' | 'inverse';
export type THeadingAlign = 'start' | 'center' | 'end';
export type THeadingWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface IStyledHeadingProps {
  readonly $visualSize: THeadingVisualSize;
  readonly $tone: THeadingTone;
  readonly $align: THeadingAlign;
  readonly $weight?: THeadingWeight;
}

const toneStyles = ($tone: THeadingTone) => css`
  color: ${({ theme }) => {
    if ($tone === 'muted') return theme.color.text.muted;
    if ($tone === 'inverse') return theme.color.text.inverse;
    return theme.color.text.primary;
  }};
`;

const alignMap: Record<THeadingAlign, string> = {
  start: 'left',
  center: 'center',
  end: 'right',
};

const fallbackSize = '1rem';
const fallbackLh = '1.3';

const pickSize = (
  size: { xs?: string; sm?: string; md?: string; lg?: string; xl?: string },
  key: 'xs' | 'sm' | 'md',
): string => {
  if (key === 'md') return size.md ?? size.sm ?? size.xs ?? fallbackSize;
  if (key === 'sm') return size.sm ?? size.xs ?? fallbackSize;
  return size.xs ?? fallbackSize;
};

const pickLh = (lh: { xs?: string; md?: string }, key: 'xs' | 'md'): string => {
  if (key === 'md') return lh.md ?? lh.xs ?? fallbackLh;
  return lh.xs ?? fallbackLh;
};

export const StyledHeading = styled.h1<IStyledHeadingProps>`
  margin: 0;
  font-family: ${({ theme, $visualSize }) => theme.typography.type[$visualSize].fontFamily};
  font-size: ${({ theme, $visualSize }) =>
    pickSize(theme.typography.type[$visualSize].fontSize, 'xs')};
  line-height: ${({ theme, $visualSize }) =>
    pickLh(theme.typography.type[$visualSize].lineHeight, 'xs')};
  font-weight: ${({ theme, $visualSize, $weight }) =>
    $weight ? theme.typography.weight[$weight] : theme.typography.type[$visualSize].fontWeight};
  text-align: ${({ $align }) => alignMap[$align]};
  overflow-wrap: break-word;
  ${({ $tone }) => toneStyles($tone)}

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    font-size: ${({ theme, $visualSize }) =>
      pickSize(theme.typography.type[$visualSize].fontSize, 'sm')};
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.md}) {
    font-size: ${({ theme, $visualSize }) =>
      pickSize(theme.typography.type[$visualSize].fontSize, 'md')};
    line-height: ${({ theme, $visualSize }) =>
      pickLh(theme.typography.type[$visualSize].lineHeight, 'md')};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 4px;
    border-radius: ${({ theme }) => theme.border.radius.xs};
  }
`;
