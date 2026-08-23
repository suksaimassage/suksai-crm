/**
 * Avatar Component - Public API
 *
 * Sistema completo de avatares
 *
 * @example
 * import { Avatar, AvatarGroup, AvatarBadge } from '@components/ui/Avatar';
 */

// Default export
export { Avatar } from './Avatar';
// Components
export { AvatarGroup } from './AvatarGroup';
export { AvatarBadge } from './AvatarBadge';
export { StatusBadge } from './Avatar.styles';

// Types
export type {
  IAvatarProps,
  IAvatarGroupProps,
  IAvatarBadgeProps,
  TAvatarSize,
  TAvatarColor,
  TAvatarShape,
  TAvatarState,
} from './Avatar.types';

// Utilities
export { getInitials, getColorFromName, isValidImageUrl } from './Avatar.utils';
