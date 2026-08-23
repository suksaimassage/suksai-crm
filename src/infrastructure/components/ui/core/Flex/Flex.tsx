import type React from 'react';
import { FlexContext, useFlexContext } from './Flex.context';
import { StyledFlex, StyledFlexItem } from './Flex.styles';
import type {
  TFlexDirection,
  TFlexWrap,
  TJustifyContent,
  TAlignItems,
  TAlignContent,
  TAlignSelf,
  TResponsive,
  TSpacingValue,
} from './Flex.styles';

// ---------------------------------------------------------------------------
// Flex (root) — own props
// ---------------------------------------------------------------------------

interface IFlexOwnProps {
  readonly direction?: TResponsive<TFlexDirection>;
  readonly wrap?: TResponsive<TFlexWrap>;
  readonly justify?: TResponsive<TJustifyContent>;
  readonly align?: TResponsive<TAlignItems>;
  readonly alignContent?: TResponsive<TAlignContent>;
  readonly gap?: TResponsive<TSpacingValue>;
  readonly rowGap?: TResponsive<TSpacingValue>;
  readonly columnGap?: TResponsive<TSpacingValue>;
  readonly flex?: string;
  readonly display?: 'flex' | 'inline-flex';
  readonly width?: TResponsive<string>;
  readonly height?: TResponsive<string>;
  readonly minWidth?: TResponsive<string>;
  readonly minHeight?: TResponsive<string>;
  readonly maxWidth?: TResponsive<string>;
  readonly maxHeight?: TResponsive<string>;
  readonly padding?: TResponsive<TSpacingValue>;
  readonly paddingX?: TResponsive<TSpacingValue>;
  readonly paddingY?: TResponsive<TSpacingValue>;
  readonly overflow?: TResponsive<string>;
  readonly overflowX?: TResponsive<string>;
  readonly overflowY?: TResponsive<string>;
  readonly children?: React.ReactNode;
}

type IFlexProps<TElement extends React.ElementType = 'div'> = IFlexOwnProps &
  Omit<React.ComponentPropsWithRef<TElement>, keyof IFlexOwnProps> & {
    readonly as?: TElement;
  };

// ---------------------------------------------------------------------------
// FlexRoot
// ---------------------------------------------------------------------------

function FlexRoot<TElement extends React.ElementType = 'div'>({
  as,
  ref,
  children,
  direction,
  wrap,
  justify,
  align,
  alignContent,
  gap,
  rowGap,
  columnGap,
  flex,
  display,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  padding,
  paddingX,
  paddingY,
  overflow,
  overflowX,
  overflowY,
  ...rest
}: IFlexProps<TElement>): React.ReactElement {
  const Tag = StyledFlex as React.ElementType;
  return (
    <FlexContext.Provider value={{ parentTag: as as string | undefined }}>
      <Tag
        as={as}
        ref={ref}
        $direction={direction}
        $wrap={wrap}
        $justify={justify}
        $align={align}
        $alignContent={alignContent}
        $gap={gap}
        $rowGap={rowGap}
        $columnGap={columnGap}
        $flex={flex}
        $display={display}
        $width={width}
        $height={height}
        $minWidth={minWidth}
        $minHeight={minHeight}
        $maxWidth={maxWidth}
        $maxHeight={maxHeight}
        $padding={padding}
        $paddingX={paddingX}
        $paddingY={paddingY}
        $overflow={overflow}
        $overflowX={overflowX}
        $overflowY={overflowY}
        {...(rest as Record<string, unknown>)}
      >
        {children}
      </Tag>
    </FlexContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Flex.Item — own props
// ---------------------------------------------------------------------------

interface IFlexItemOwnProps {
  readonly grow?: TResponsive<number>;
  readonly shrink?: TResponsive<number>;
  readonly basis?: TResponsive<string>;
  readonly order?: TResponsive<number>;
  readonly alignSelf?: TResponsive<TAlignSelf>;
  readonly flex?: string;
  readonly width?: TResponsive<string>;
  readonly height?: TResponsive<string>;
  readonly minWidth?: TResponsive<string>;
  readonly minHeight?: TResponsive<string>;
  readonly maxWidth?: TResponsive<string>;
  readonly maxHeight?: TResponsive<string>;
  readonly children?: React.ReactNode;
}

type IFlexItemProps<TElement extends React.ElementType = 'div'> = IFlexItemOwnProps &
  Omit<React.ComponentPropsWithRef<TElement>, keyof IFlexItemOwnProps> & {
    readonly as?: TElement;
  };

// ---------------------------------------------------------------------------
// FlexItem — reads context to choose default element tag
// ---------------------------------------------------------------------------

function FlexItem<TElement extends React.ElementType = 'div'>({
  as,
  ref,
  children,
  grow,
  shrink,
  basis,
  order,
  alignSelf,
  flex,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  ...rest
}: IFlexItemProps<TElement>): React.ReactElement {
  const { parentTag } = useFlexContext();
  const defaultTag: React.ElementType = parentTag === 'ul' || parentTag === 'ol' ? 'li' : 'div';
  const Tag = StyledFlexItem as React.ElementType;
  return (
    <Tag
      as={as ?? defaultTag}
      ref={ref}
      $grow={grow}
      $shrink={shrink}
      $basis={basis}
      $order={order}
      $alignSelf={alignSelf}
      $flex={flex}
      $width={width}
      $height={height}
      $minWidth={minWidth}
      $minHeight={minHeight}
      $maxWidth={maxWidth}
      $maxHeight={maxHeight}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Flex = Object.assign(FlexRoot, { Item: FlexItem });
export type { IFlexProps, IFlexItemProps };
