/**
 * safeArea.ts — iOS/Android safe area inset helpers
 *
 * Requires `viewport-fit=cover` in the HTML meta viewport tag.
 * Use these constants when positioning elements near screen edges
 * (bottom FABs, fixed navbars, sticky headers) so they clear the
 * device's notch and home indicator.
 *
 * Usage:
 *   import { safeArea } from '@infra/styles/safeArea';
 *
 *   const StyledFab = styled.button`
 *     bottom: calc(${({ theme }) => theme.spacing.md} + ${safeArea.bottom});
 *   `;
 */

export const safeArea = {
  top: 'env(safe-area-inset-top, 0px)',
  bottom: 'env(safe-area-inset-bottom, 0px)',
  left: 'env(safe-area-inset-left, 0px)',
  right: 'env(safe-area-inset-right, 0px)',
} as const;
