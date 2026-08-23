/**
 * ButtonGroup Component
 *
 * Agrupa múltiples botones con estilos consistentes
 *
 * Principios SOLID:
 * - Single Responsibility: Solo maneja agrupación de botones
 * - Open/Closed: Extensible via props
 *
 * @example
 * <ButtonGroup>
 *   <Button>First</Button>
 *   <Button>Second</Button>
 *   <Button>Third</Button>
 * </ButtonGroup>
 *
 * @example
 * <ButtonGroup attached orientation="horizontal">
 *   <Button>Left</Button>
 *   <Button>Center</Button>
 *   <Button>Right</Button>
 * </ButtonGroup>
 */

import React, { Children, cloneElement, isValidElement } from 'react';

import type { IButtonGroupProps, IButtonProps } from './ButtonGroup.types';
import { StyledButtonGroup } from './ButtonGroup.styles';

// ========================================
// COMPONENT
// ========================================

export const ButtonGroup: React.FC<IButtonGroupProps> = ({
  children,
  size,
  variant,
  color,
  orientation = 'horizontal',
  attached = false,
  className,
}) => {
  // Clonar botones hijos con props heredadas
  const enhancedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;

    // In React 19 isValidElement narrows to ReactElement<unknown> — cast to access button props
    const btnChild = child as React.ReactElement<IButtonProps>;

    // Si el child es un Button, pasarle las props del grupo
    const childProps: Partial<IButtonProps> = {};

    if (size && !btnChild.props.size) {
      childProps.size = size;
    }

    if (variant && !btnChild.props.variant) {
      childProps.variant = variant;
    }

    if (color && !btnChild.props.color) {
      childProps.color = color;
    }

    // Si no hay props que sobrescribir, retornar el child original
    if (Object.keys(childProps).length === 0) {
      return child;
    }

    return cloneElement(btnChild, childProps);
  });

  return (
    <StyledButtonGroup
      $orientation={orientation}
      $attached={attached}
      className={className}
      role="group"
    >
      {enhancedChildren}
    </StyledButtonGroup>
  );
};

ButtonGroup.displayName = 'ButtonGroup';
