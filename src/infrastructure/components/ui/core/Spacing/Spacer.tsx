/**
 * Spacer Component
 *
 * Componente para crear espacio flexible entre elementos
 *
 * Principios SOLID:
 * - Single Responsibility: Solo crea espacio
 * - Open/Closed: Extensible via props
 *
 * @example
 * // Espacio flexible (crece para llenar espacio disponible)
 * <div style={{ display: 'flex' }}>
 *   <button>Left</button>
 *   <Spacer />
 *   <button>Right</button>
 * </div>
 *
 * @example
 * // Espacio de tamaño fijo
 * <Spacer size="lg" />
 *
 * @example
 * // Espacio horizontal
 * <div style={{ display: 'flex' }}>
 *   <span>Item 1</span>
 *   <Spacer direction="horizontal" size="md" />
 *   <span>Item 2</span>
 * </div>
 */

import React from 'react';
import styled from 'styled-components';
import type { ISpacerProps } from './Spacing.types';
import { getSpacingValue } from './Spacing.utils';

// ========================================
// STYLED COMPONENT
// ========================================

const StyledSpacer = styled.div<{
  $direction: 'horizontal' | 'vertical';
  $size?: string;
}>`
  /* Si no tiene size, es flexible */
  ${({ $size }) =>
    !$size &&
    `
    flex: 1;
  `}

  /* Si tiene size, es fijo */
  ${({ $size, $direction }) =>
    $size &&
    $direction === 'horizontal' &&
    `
    width: ${$size};
    min-width: ${$size};
    flex-shrink: 0;
  `}

  ${({ $size, $direction }) =>
    $size &&
    $direction === 'vertical' &&
    `
    height: ${$size};
    min-height: ${$size};
    flex-shrink: 0;
  `}

  /* Invisible */
  pointer-events: none;
  user-select: none;
`;

// ========================================
// COMPONENT
// ========================================

/**
 * Spacer - Crea espacio flexible o fijo entre elementos
 *
 * Responsabilidad: Proveer espacio visual entre elementos
 *
 * Uso:
 * - Sin `size`: Espacio flexible (flex: 1)
 * - Con `size`: Espacio fijo
 */
export const Spacer: React.FC<ISpacerProps> = ({ size, direction = 'horizontal', className }) => {
  // Convertir size a CSS value si existe
  const sizeValue = size ? getSpacingValue(size) : undefined;

  return (
    <StyledSpacer
      $direction={direction}
      $size={sizeValue}
      className={className}
      aria-hidden="true"
    />
  );
};

Spacer.displayName = 'Spacer';
