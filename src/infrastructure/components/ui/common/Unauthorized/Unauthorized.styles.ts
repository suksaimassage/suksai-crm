import styled, { keyframes, css } from 'styled-components';

// ── Keyframes ─────────────────────────────────────────────────────────────────

const fadeInScale = keyframes`
  from { opacity: 0; transform: scale(0.94); }
  to   { opacity: 1; transform: scale(1); }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

// ── Root ──────────────────────────────────────────────────────────────────────

export const StyledUnauthorizedRoot = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 480px;
  padding: ${({ theme }) => theme.spacing['2xl']};
`;

// ── Ornament ──────────────────────────────────────────────────────────────────

export const StyledOrnament = styled.div`
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  @media (prefers-reduced-motion: no-preference) {
    animation: ${fadeInScale} 200ms ease-out both;
    animation-delay: 0ms;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: ${fadeIn} 120ms ease-out both;
  }
`;

// ── Content wrapper ───────────────────────────────────────────────────────────

export const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 480px;
  width: 100%;

  @media (max-width: 639px) {
    text-align: center;
  }
`;

// ── Label (overline / caption2 mono) ─────────────────────────────────────────

export const StyledLabel = styled.p`
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: ${({ theme }) => theme.typography.size['2xs']};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};

  @media (prefers-reduced-motion: no-preference) {
    animation: ${fadeInUp} 180ms ease-out both;
    animation-delay: 40ms;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: ${fadeIn} 120ms ease-out both;
  }
`;

// ── Title (h2 serif) ──────────────────────────────────────────────────────────

export const StyledTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size['3xl']};
  font-weight: 300;
  line-height: 1.25;
  color: ${({ theme }) => theme.color.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.md};

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 4px;
    border-radius: ${({ theme }) => theme.border.radius.sm};
  }

  @media (prefers-reduced-motion: no-preference) {
    animation: ${fadeInUp} 180ms ease-out both;
    animation-delay: 40ms;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: ${fadeIn} 120ms ease-out both;
  }
`;

// ── Message ───────────────────────────────────────────────────────────────────

export const StyledMessage = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.md};
  line-height: 1.65;
  color: ${({ theme }) => theme.color.text.secondary};
  max-width: 48ch;
  margin: 0 0 ${({ theme }) => theme.spacing.xl};

  @media (prefers-reduced-motion: no-preference) {
    animation: ${fadeInUp} 180ms ease-out both;
    animation-delay: 80ms;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: ${fadeIn} 120ms ease-out both;
  }
`;

// ── Action wrapper ────────────────────────────────────────────────────────────

export const StyledAction = styled.div<{ $fullWidth: boolean }>`
  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}

  @media (prefers-reduced-motion: no-preference) {
    animation: ${fadeInUp} 180ms ease-out both;
    animation-delay: 80ms;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: ${fadeIn} 120ms ease-out both;
  }
`;
