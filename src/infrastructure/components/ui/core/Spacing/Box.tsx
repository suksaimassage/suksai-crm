/**
 * Box Component
 *
 * Componente de layout con padding/margin flexible
 *
 * Principios SOLID:
 * - Single Responsibility: Solo maneja espaciado y layout básico
 * - Open/Closed: Extensible via props, cerrado a modificación
 *
 * @example
 * // Con spacing tokens
 * <Box p="md" m="lg">Content</Box>
 *
 * @example
 * // Con valores numéricos (múltiplos de 4px)
 * <Box p={4} m={2}>Content</Box>
 *
 * @example
 * // Con CSS values directos
 * <Box p="2rem" m="20px">Content</Box>
 *
 * @example
 * // Direccional
 * <Box pt="lg" px="md" mb="sm">Content</Box>
 */

import styled from 'styled-components';
import type { IBoxProps } from './Spacing.types';
import { getSpacingProps } from './Spacing.utils';
import {
  getBorderColorIntensity,
  getBorderRadius,
  getBorderStyle,
  getBorderWidth,
} from '@infra/styles/themes/theme.helpers';

/**
 * Box - Contenedor con espaciado flexible
 *
 * Responsabilidad: Proveer padding y margin usando el spacing system
 */
export const Box = styled.div<IBoxProps>`
  /* Aplicar spacing dinámicamente */
  ${(props) => {
    const spacingStyles = getSpacingProps(props);
    return spacingStyles;
  }}

  /* Box sizing */
  box-sizing: border-box;

  /* Layout props */
  ${({ width }) => width && `width: ${width};`}
  ${({ height }) => height && `height: ${height};`}
  ${({ display }) => display && `display: ${display};`}

  ${({ $backgroundColor }) => $backgroundColor && `background-color: ${$backgroundColor};`}

  ${({ theme, $border }) => $border && getBorderWidth(theme, $border)}

  ${({ theme, radius }) => radius && getBorderRadius(theme, radius)}

  ${({ theme, $borderColor, $borderColorIntensity }) =>
    $borderColor &&
    $borderColorIntensity &&
    getBorderColorIntensity(theme, $borderColor, $borderColorIntensity)}

  ${({ theme, $borderStyle }) => $borderStyle && getBorderStyle(theme, $borderStyle)}
`;
