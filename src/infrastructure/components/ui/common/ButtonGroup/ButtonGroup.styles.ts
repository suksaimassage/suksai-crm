import styled, { css } from 'styled-components';
import type { TButtonGroupOrientation } from './ButtonGroup.types';

// ========================================
// STYLED COMPONENTS
// ========================================
const isVertical = (o: TButtonGroupOrientation) => o === 'vertical';

const getRadiusStyles = (orientation: TButtonGroupOrientation, radius: string) => {
  if (isVertical(orientation)) {
    return css`
      &:first-child {
        border-top-left-radius: ${radius};
        border-top-right-radius: ${radius};
      }

      &:last-child {
        border-bottom-left-radius: ${radius};
        border-bottom-right-radius: ${radius};
      }
    `;
  }

  return css`
    &:first-child {
      border-top-left-radius: ${radius};
      border-bottom-left-radius: ${radius};
    }

    &:last-child {
      border-top-right-radius: ${radius};
      border-bottom-right-radius: ${radius};
    }
  `;
};

const getBorderStyles = (orientation: TButtonGroupOrientation) =>
  isVertical(orientation)
    ? css`
        &:not(:last-child) {
          border-bottom-width: 1px;
        }
      `
    : css`
        &:not(:last-child) {
          border-right-width: 1px;
        }
      `;

export const StyledButtonGroup = styled.div<{
  $orientation: TButtonGroupOrientation;
  $attached: boolean;
}>`
  ${({ theme, $orientation, $attached }) => {
    const radius = theme.border.radius.md;

    return css`
      display: inline-flex;
      flex-direction: ${$orientation === 'vertical' ? 'column' : 'row'};

      /* Gap */
      ${!$attached &&
      css`
        gap: ${theme.spacing.sm};
      `}

      /* Attached */
      ${$attached &&
      css`
        & > button,
        & > a {
          border-radius: 0;

          ${getRadiusStyles($orientation, radius)}
          ${getBorderStyles($orientation)}
        }
      `}
    `;
  }}
`;
