/**
 * Dashboard.brand.tsx
 *
 * Botanical brand primitives for the Suksai Thai Massage CRM sidebar.
 * SVG paths extracted from the approved static concept (suksaidashboardconcept.html).
 *
 * Colors expressed in OKLCH to preserve perceptual luminance.
 *   gold-400 ≈ oklch(0.74 0.10 75)   → #C9A96E
 *   sand-50  ≈ oklch(0.98 0.01 67)   → #FAF7F2
 *   jungle-900 ≈ oklch(0.15 0.022 143) → #1A2419
 */

import styled, { css } from 'styled-components';
import { useTranslation } from 'react-i18next';

// ─── Brand mark (botanical plant paths) ────────────────────────────────────

interface IBrandMarkProps {
  readonly size?: number;
  readonly color?: string;
}

export const SuksaiBrandMark = ({ size = 42, color = 'currentColor' }: IBrandMarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 56 56"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <g stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M28 48 C 28 30, 22 18, 10 14 C 14 30, 18 42, 28 48 Z" />
      <path d="M28 48 C 28 30, 34 18, 46 14 C 42 30, 38 42, 28 48 Z" />
      <path d="M28 48 C 22 34, 14 28, 4 30 C 8 40, 16 46, 28 48 Z" />
      <path d="M28 48 C 34 34, 42 28, 52 30 C 48 40, 40 46, 28 48 Z" />
      <path d="M28 48 C 28 32, 28 22, 28 10" />
    </g>
  </svg>
);

// ─── Sidebar brand logo (mark + wordmark + subtitle) ───────────────────────

interface ISuksaiBrandLogoProps {
  readonly collapsed?: boolean;
}

const StyledBrandLogoRoot = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
`;

const StyledBrandText = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  line-height: 1;
  min-width: 0;
  overflow: hidden;
  ${({ $collapsed, theme }) => {
    const slow = `${theme.transition.duration.slow} ${theme.transition.timing.easeInOut}`;
    const base = `${theme.transition.duration.base} ${theme.transition.timing.easeInOut}`;
    return css`
      opacity: ${$collapsed ? 0 : 1};
      max-width: ${$collapsed ? '0' : '160px'};
      transition:
        opacity ${base},
        max-width ${slow};
    `;
  }}
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StyledWordmark = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: oklch(0.98 0.01 67); /* sand-50 */
  white-space: nowrap;
`;

const StyledSubtitle = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: oklch(0.98 0.01 67 / 0.55); /* sand-50 at 55% */
  white-space: nowrap;
  margin-top: 2px;
`;

export const SuksaiBrandLogo = ({ collapsed = false }: ISuksaiBrandLogoProps) => (
  <StyledBrandLogoRoot>
    <SuksaiBrandMark size={40} color="oklch(0.74 0.10 75)" />
    <StyledBrandText $collapsed={collapsed}>
      <StyledWordmark>SUKSAI</StyledWordmark>
      <StyledSubtitle>CRM · Estudio</StyledSubtitle>
    </StyledBrandText>
  </StyledBrandLogoRoot>
);

// ─── Sidebar user footer ────────────────────────────────────────────────────

interface ISidebarUserFooterProps {
  readonly initials: string;
  readonly name: string;
  /** Resolved primary-center display name; null when the user has none (or on error). */
  readonly centroNombre?: string | null;
  /** True while the primary-center query is in flight — renders a skeleton line. */
  readonly isCentroLoading?: boolean;
  readonly collapsed?: boolean;
}

const StyledUserRoot = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
  width: 100%;
`;

const StyledUserAvatar = styled.div`
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  /* gold-400 bg, jungle-900 text */
  background: oklch(0.74 0.1 75);
  color: oklch(0.15 0.022 143);
  display: grid;
  place-items: center;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  font-size: 13px;
  letter-spacing: 0.03em;
  flex-shrink: 0;
  user-select: none;
`;

const StyledUserInfo = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  ${({ $collapsed, theme }) => {
    const slow = `${theme.transition.duration.slow} ${theme.transition.timing.easeInOut}`;
    const base = `${theme.transition.duration.base} ${theme.transition.timing.easeInOut}`;
    return css`
      opacity: ${$collapsed ? 0 : 1};
      max-width: ${$collapsed ? '0' : '160px'};
      transition:
        opacity ${base},
        max-width ${slow};
    `;
  }}
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StyledUserName = styled.strong`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: oklch(0.98 0.01 67); /* sand-50 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

const StyledUserStudio = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  color: oklch(0.98 0.01 67 / 0.55); /* sand-50 at 55% */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

/**
 * Loading placeholder for the centre line. Sized to the exact line-box of
 * StyledUserStudio (11px × line-height 1.3) so resolving the query causes zero
 * layout shift. Fill is a dim sand tint sitting between the jungle panel and the
 * 55% text — kept as an OKLCH literal co-located with the file's sidebar palette
 * (there is no semantic theme token for "muted placeholder on a dark surface").
 * Decorative only → aria-hidden.
 */
const StyledUserCentroSkeleton = styled.span`
  display: block;
  width: 70%;
  height: 11px;
  margin: calc((11px * 1.3 - 11px) / 2) 0; /* centre within the text line-box */
  border-radius: ${({ theme }) => theme.border.radius.sm};
  background: oklch(0.98 0.01 67 / 0.14); /* sand-50 at 14% */
  animation: pulse 1.4s ${({ theme }) => theme.transition.timing.easeInOut} infinite;
`;

export const SidebarUserFooter = ({
  initials,
  name,
  centroNombre,
  isCentroLoading = false,
  collapsed = false,
}: ISidebarUserFooterProps) => {
  const { t } = useTranslation(['dashboard']);

  return (
    <StyledUserRoot>
      <StyledUserAvatar aria-hidden="true">{initials}</StyledUserAvatar>
      <StyledUserInfo $collapsed={collapsed}>
        <StyledUserName>{name}</StyledUserName>
        {isCentroLoading ? (
          <StyledUserCentroSkeleton aria-hidden="true" />
        ) : (
          <StyledUserStudio
            title={
              centroNombre ? `${t('dashboard:sidebar.centroLabel')} ${centroNombre}` : undefined
            }
          >
            {centroNombre
              ? `${t('dashboard:sidebar.centroLabel')} ${centroNombre}`
              : t('dashboard:sidebar.noCentro')}
          </StyledUserStudio>
        )}
      </StyledUserInfo>
    </StyledUserRoot>
  );
};
