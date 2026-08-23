import type { ReactNode, ElementType } from 'react';
import { StyledVisuallyHidden } from './VisuallyHidden.styles';

export interface IVisuallyHiddenProps {
  readonly as?: 'span' | 'div' | 'p' | 'label';
  readonly children: ReactNode;
}

export const VisuallyHidden = ({ as = 'span', children }: IVisuallyHiddenProps) => {
  const Tag = StyledVisuallyHidden as unknown as ElementType;
  return <Tag as={as}>{children}</Tag>;
};
