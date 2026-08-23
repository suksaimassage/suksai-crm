import type { ReactNode, Ref, ElementType } from 'react';
import {
  StyledHeading,
  type THeadingAlign,
  type THeadingTone,
  type THeadingVisualSize,
  type THeadingWeight,
} from './Heading.styles';

type THeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface IHeadingProps {
  readonly level: THeadingLevel;
  readonly visualSize?: THeadingVisualSize;
  readonly tone?: THeadingTone;
  readonly align?: THeadingAlign;
  readonly weight?: THeadingWeight;
  readonly children: ReactNode;
  readonly id?: string;
  readonly tabIndex?: number;
  readonly className?: string;
  readonly ref?: Ref<HTMLHeadingElement>;
}

const DEFAULT_VISUAL_SIZE: Record<THeadingLevel, THeadingVisualSize> = {
  1: 'largeTitle',
  2: 'headline',
  3: 'subtitle',
  4: 'h4',
  5: 'h5',
  6: 'h6',
};

export const Heading = ({
  level,
  visualSize,
  tone = 'default',
  align = 'start',
  weight,
  children,
  ref,
  ...rest
}: IHeadingProps) => {
  const Tag = StyledHeading as unknown as ElementType;
  const elementTag = `h${String(level)}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return (
    <Tag
      as={elementTag}
      ref={ref}
      $visualSize={visualSize ?? DEFAULT_VISUAL_SIZE[level]}
      $tone={tone}
      $align={align}
      $weight={weight}
      {...rest}
    >
      {children}
    </Tag>
  );
};
