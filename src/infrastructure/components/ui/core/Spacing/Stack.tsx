/**
 * Stack Component
 *
 * Componente para apilar elementos con espaciado consistente
 *
 * Principios SOLID:
 * - Single Responsibility: Solo maneja apilamiento y espaciado entre elementos
 * - Open/Closed: Extensible via props
 *
 * @example
 * // Stack vertical con espaciado
 * <Stack spacing="md">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Stack>
 *
 * @example
 * // Stack horizontal
 * <Stack direction="horizontal" spacing="sm">
 *   <button>Action 1</button>
 *   <button>Action 2</button>
 * </Stack>
 *
 * @example
 * // Con divisor
 * <Stack spacing="md" divider={<hr />}>
 *   <div>Section 1</div>
 *   <div>Section 2</div>
 * </Stack>
 */

import React, { Children } from 'react';
import styled from 'styled-components';
import type { IStackProps } from './Spacing.types';
import { getSpacingValue } from './Spacing.utils';

// ========================================
// STYLED COMPONENTS
// ========================================

const StyledStack = styled.div<{
  $direction: 'vertical' | 'horizontal';
  $spacing: string;
  $align: string;
  $wrap: boolean;
}>`
  display: flex;
  flex-direction: ${({ $direction }) => ($direction === 'vertical' ? 'column' : 'row')};

  /* Alineación */
  align-items: ${({ $align }) => {
    switch ($align) {
      case 'start':
        return 'flex-start';
      case 'center':
        return 'center';
      case 'end':
        return 'flex-end';
      case 'stretch':
        return 'stretch';
      default:
        return 'flex-start';
    }
  }};

  /* Wrap */
  ${({ $wrap }) => $wrap && 'flex-wrap: wrap;'}

  /* Gap entre elementos */
  gap: ${({ $spacing }) => $spacing};
`;

// ========================================
// COMPONENT
// ========================================

/**
 * Stack - Apila elementos con espaciado consistente
 *
 * Responsabilidad: Manejar espaciado vertical u horizontal entre elementos
 */
export const Stack: React.FC<IStackProps> = ({
  children,
  spacing = 'md',
  align = 'stretch',
  direction = 'vertical',
  divider,
  wrap = false,
  className,
  as = 'div',
}) => {
  // Convertir spacing value a CSS
  const spacingValue = getSpacingValue(spacing) ?? '16px';

  // Si hay divider, insertar entre elementos
  if (divider) {
    const childrenArray = Children.toArray(children);
    const childrenWithDivider: React.ReactNode[] = [];

    childrenArray.forEach((child, index) => {
      childrenWithDivider.push(child);

      // No añadir divider después del último elemento
      if (index < childrenArray.length - 1) {
        childrenWithDivider.push(
          <React.Fragment key={`divider-${index}`}>{divider}</React.Fragment>,
        );
      }
    });

    return (
      <StyledStack
        as={as}
        $direction={direction}
        $spacing="0" // Sin gap cuando hay divider
        $align={align}
        $wrap={wrap}
        className={className}
      >
        {childrenWithDivider}
      </StyledStack>
    );
  }

  // Sin divider, usar gap normal
  return (
    <StyledStack
      as={as}
      $direction={direction}
      $spacing={spacingValue}
      $align={align}
      $wrap={wrap}
      className={className}
    >
      {children}
    </StyledStack>
  );
};

Stack.displayName = 'Stack';
