/**
 * Grid Component
 *
 * Responsabilidad: Proporcionar un sistema de grid flexible y responsive
 *
 * Principios SOLID:
 * - Single Responsibility: Solo maneja layout de grid
 * - Open/Closed: Extensible mediante props
 * - Liskov Substitution: Acepta cualquier children React
 * - Dependency Inversion: Depende de abstracciones (IGridProps)
 *
 * Ejemplos de uso:
 *
 * // Grid básico
 * <Grid columns={3} gap="md">
 *   <Grid.Item>Content</Grid.Item>
 * </Grid>
 *
 * // Grid responsive
 * <Grid
 *   columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
 *   gap={{ xs: 'sm', md: 'lg' }}
 * >
 *   <Grid.Item>Content</Grid.Item>
 * </Grid>
 *
 * // Grid auto-fit
 * <Grid autoFlow="fit" minColumnWidth="250px" gap="md">
 *   <Grid.Item>Content</Grid.Item>
 * </Grid>
 */

import React, { Children, createContext, isValidElement, useContext } from 'react';
import type { IGridProps, IGridItemProps } from './Grid.types';
import * as S from './Grid.styles';

interface IGridContextValue {
  readonly hasItem?: boolean;
}

const GridContext = createContext<IGridContextValue | null>(null);

/**
 * Hook interno para consumir el CardContext.
 * Centraliza el acceso y permite detectar uso fuera del contexto.
 */
const useGridContext = (): IGridContextValue => {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error('Grid components must be used within <Grid>');
  }
  return context;
};

// ========================================
// GRID ITEM COMPONENT
// ========================================

const GridItem: React.FC<IGridItemProps> = ({ children, as, ...props }) => {
  useGridContext();
  return (
    <S.GridItem as={as} {...props}>
      {children}
    </S.GridItem>
  );
};

GridItem.displayName = 'Grid.Item';

// ========================================
// GRID COMPONENT
// ========================================

type TGridComponent = React.FC<IGridProps> & {
  Item: React.FC<IGridItemProps>;
};

export const Grid: TGridComponent = ({ children, as, ...props }) => {
  const childrenArray = Children.toArray(children);

  const hasItem = childrenArray.some(
    (child) => isValidElement(child) && (child.type as React.FC).displayName === 'Grid.Item',
  );

  if (!hasItem) {
    throw new Error('Grid must include a Grid.Item');
  }

  return (
    <GridContext.Provider value={{}}>
      <S.Grid as={as} {...props}>
        {children}
      </S.Grid>
    </GridContext.Provider>
  );
};

Grid.displayName = 'Grid';
Grid.Item = GridItem;
