/**
 * styled.d.ts — styled-components DefaultTheme augmentation
 *
 * Extends the styled-components module so that every
 * styled component has fully-typed access to the theme.
 *
 * Usage in components:
 *   const Button = styled.button`
 *     background: ${({ theme }) => theme.color.intent.primary};
 *     padding: ${({ theme }) => theme.spacing.md};
 *   `;
 *
 * Full autocompletion works with zero extra imports.
 */

import 'styled-components';
import type { TTheme } from '@infra/styles/themes/light.theme';

declare module 'styled-components' {
  // DefaultTheme is what styled-components uses internally.
  // By extending it here, every `theme` prop is fully typed.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends TTheme {}
}
