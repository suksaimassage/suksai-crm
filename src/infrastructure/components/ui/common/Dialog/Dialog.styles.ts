import styled, { css } from 'styled-components';
import type { TDialogType } from './Dialog.types';

// ========================================
// DIALOG ICON
// ========================================

export const DialogIcon = styled.div<{
  $type: TDialogType;
}>`
  ${({ theme, $type }) => {
    const { border, spacing, color } = theme;

    const typeTokens = {
      info: {
        bg: color.info[100],
        fg: color.info[600],
      },
      success: {
        bg: color.success[100],
        fg: color.success[600],
      },
      warning: {
        bg: color.warning[100],
        fg: color.warning[600],
      },
      error: {
        bg: color.error[100],
        fg: color.error[600],
      },
      confirm: {
        bg: color.primary[100],
        fg: color.primary[600],
      },
    };

    const t = typeTokens[$type];

    return css`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      margin: 0 auto ${spacing.md} auto;
      border-radius: ${border.radius.full};
      flex-shrink: 0;
      background: ${t.bg};
      color: ${t.fg};

      svg {
        width: 24px;
        height: 24px;
      }
    `;
  }}
`;
