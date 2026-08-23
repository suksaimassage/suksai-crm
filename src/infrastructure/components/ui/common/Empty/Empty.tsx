/**
 * Empty
 *
 * Premium design-system-grade empty state component.
 * Supports sizes, variants, presets, illustrations, animations, and DnD.
 *
 * @example
 * <Empty preset="no-results" size="md" variant="card">
 *   <Button>Clear filters</Button>
 * </Empty>
 */

import React, { isValidElement, type ComponentType, type SVGProps } from 'react';
import type { IEmptyProps, TEmptyAnimation } from './Empty.types';
import { EMPTY_PRESETS, EMPTY_SIZES } from './Empty.config';
import { PRESET_ILLUSTRATIONS } from './Empty.illustrations';
import {
  StyledEmpty,
  StyledIllustration,
  StyledIcon,
  StyledContent,
  StyledActions,
  StyledDragLabel,
} from './Empty.styles';
import { Typography } from '@infra/components/ui/core/Typography';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve animation: explicit prop > preset default > "none"
 */
const resolveAnimation = (
  animationProp: TEmptyAnimation | undefined,
  preset: IEmptyProps['preset'],
): TEmptyAnimation => {
  if (animationProp !== undefined) return animationProp;
  if (preset) return EMPTY_PRESETS[preset].animation ?? 'none';
  return 'none';
};

/**
 * Render illustration: custom SVG component, image URL, or preset SVG.
 */
const IllustrationRenderer = ({
  illustration,
  preset,
  size,
  animation,
  isDragOver,
}: Pick<IEmptyProps, 'illustration' | 'preset' | 'size' | 'isDragOver'> & {
  animation: TEmptyAnimation;
  size: NonNullable<IEmptyProps['size']>;
}) => {
  const sizeValue = EMPTY_SIZES[size].illustrationSize;

  let content: React.ReactNode = null;

  if (illustration) {
    if (typeof illustration === 'string') {
      // Image URL fallback
      content = <img src={illustration} alt="" width={sizeValue} height={sizeValue} aria-hidden />;
    } else {
      // SVG component
      const IllustrationComponent = illustration;
      content = <IllustrationComponent width={sizeValue} height={sizeValue} />;
    }
  } else if (preset && preset in PRESET_ILLUSTRATIONS) {
    const PresetIllustration = PRESET_ILLUSTRATIONS[preset];
    content = <PresetIllustration width={sizeValue} height={sizeValue} />;
  }

  if (!content) return null;

  return (
    <StyledIllustration $size={size} $animation={animation} $isDragOver={!!isDragOver}>
      {content}
    </StyledIllustration>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

const EmptyComponent = ({
  size = 'md',
  variant = 'default',
  preset,
  title,
  description,
  icon,
  illustration,
  animation: animationProp,
  isDragOver = false,
  children,
  className,
  ariaLabel,
}: IEmptyProps) => {
  const presetConfig = preset ? EMPTY_PRESETS[preset] : undefined;

  const resolvedTitle = title ?? presetConfig?.title;
  const resolvedDescription = description ?? presetConfig?.description;
  const animation = resolveAnimation(animationProp, preset);

  // Fullscreen variant uses role="dialog" semantics; others use "region" or "status"
  const role = variant === 'fullscreen' ? 'region' : preset === 'error' ? 'alert' : 'status';

  const ariaLabelResolved = ariaLabel ?? resolvedTitle ?? 'Empty state';

  // Show illustration when: explicit illustration, or preset with illustrated variant, or drag-drop preset
  const showIllustration =
    illustration !== undefined ||
    variant === 'illustrated' ||
    preset === 'drag-drop' ||
    (preset !== undefined && !icon);

  return (
    <StyledEmpty
      $size={size}
      $variant={variant}
      $isDragOver={isDragOver}
      className={className}
      role={role}
      aria-label={ariaLabelResolved}
      aria-live={preset === 'error' ? 'assertive' : 'polite'}
    >
      {/* Illustration */}
      {showIllustration && (
        <IllustrationRenderer
          illustration={illustration}
          preset={preset}
          size={size}
          animation={animation}
          isDragOver={isDragOver}
        />
      )}

      {/* Icon (when no illustration) */}
      {!showIllustration && icon && (
        <StyledIcon $size={size} $animation={animation} aria-hidden>
          {isValidElement(icon)
            ? icon
            : (() => {
                const IconComponent = icon as ComponentType<SVGProps<SVGSVGElement>>;
                return <IconComponent />;
              })()}
        </StyledIcon>
      )}

      {/* Text content */}
      {(resolvedTitle ?? resolvedDescription) && (
        <StyledContent $size={size}>
          {resolvedTitle && (
            <Typography size={size} weight="bold">
              {resolvedTitle}
            </Typography>
          )}
          {resolvedDescription && (
            <Typography size="sm" family="body" align="center">
              {resolvedDescription}
            </Typography>
          )}
        </StyledContent>
      )}

      {/* Drag-over CTA */}
      {isDragOver && <StyledDragLabel aria-live="polite">↓ Release to drop</StyledDragLabel>}

      {/* Actions slot */}
      {children && <StyledActions $size={size}>{children}</StyledActions>}
    </StyledEmpty>
  );
};

EmptyComponent.displayName = 'Empty';

export const Empty = EmptyComponent;
