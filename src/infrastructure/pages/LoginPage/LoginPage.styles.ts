import styled, { keyframes } from 'styled-components';

// ── ZEN entrance keyframes ────────────────────────────────────────────────────

const zenFadeDown = keyframes`
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const zenFadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const zenFadeUpHeading = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const zenFadeRight = keyframes`
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const zenFadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

// ── Layout ────────────────────────────────────────────────────────────────────

export const StyledLoginPage = styled.main`
  display: grid;
  grid-template-columns: 1fr;
  min-height: 100dvh;

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    grid-template-columns: 1.1fr 1fr;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`;

// ── Brand panel (left) ────────────────────────────────────────────────────────

/*
 * Documented exception: jungle-green gradient values are brand-specific and
 * not available as semantic theme tokens. The gold overlay uses alpha of
 * intent.primary (oklch 0.76 0.07 67), and the green uses the botanical
 * palette (hue 150) intrinsic to the Suksai brand identity.
 */
export const StyledBrandPanel = styled.section`
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 28px 22px 32px;
  /* Documented exception: brand panel always uses dark botanical bg — text must be light-invariant */
  color: oklch(0.97 0.01 67);
  background:
    /* 1. Reflejo suave (simula el pulido mate del grafito) */
    radial-gradient(
      ellipse at 20% 15%,
      ${({ theme }) => theme.color.neutral[700]} 0%,
      /* oklch(0.42 0.02 67) - Gris cálido medio */ transparent 55%
    ),
    /* 2. Sombra profunda para dar volumen */
    radial-gradient(
        ellipse at 85% 90%,
        ${({ theme }) => theme.color.neutral[900]} 0%,
        /* oklch(0.22 0.01 67) - Grafito casi negro */ transparent 65%
      ),
    /* 3. Base sólida de carbón/grafito */
    linear-gradient(
        145deg,
        ${({ theme }) => theme.color.neutral[800]} 0%,
        /* oklch(0.32 0.02 67) - Grafito oscuro */ ${({ theme }) => theme.color.neutral[900]} 100%
      );

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding: 36px 40px 44px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    padding: 48px;
    min-height: 100dvh;
  }
`;

/* Large decorative ring — top-right corner of brand panel */
export const StyledBrandOrnament = styled.span`
  pointer-events: none;
  position: absolute;
  top: -120px;
  right: -160px;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  /* Documented exception: alpha of intent.primary gold */
  border: 1px solid oklch(0.76 0.07 67 / 0.18);
  box-shadow: inset 0 0 0 80px oklch(0.76 0.07 67 / 0.05);

  @media (max-width: 600px) {
    display: none;
  }
`;

export const StyledBrandLogo = styled.div`
  position: relative;
  z-index: 1;
  width: 200px;
  /* Documented exception: brand panel always uses dark botanical bg — text must be light-invariant */
  color: oklch(0.97 0.01 67);
  animation: ${zenFadeDown} 600ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both;

  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    width: 260px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    width: 320px;
  }
`;

export const StyledBrandQuote = styled.div`
  position: relative;
  z-index: 1;
  margin-top: ${({ theme }) => theme.spacing.xl};
  max-width: 460px;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    margin-top: ${({ theme }) => theme.spacing['2xl']};
    max-width: 560px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    margin-top: 0;
    max-width: 460px;
  }
`;

export const StyledBrandEyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  letter-spacing: 0.24em;
  text-transform: uppercase;
  /* Documented exception: gold accent on dark bg = intent.primary token */
  color: oklch(0.76 0.07 67);
  margin-bottom: 22px;
  animation: ${zenFadeUp} 500ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;

  &::before {
    content: '';
    width: 24px;
    height: 1px;
    background: oklch(0.76 0.07 67);
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    font-size: 11px;
    gap: 10px;

    &::before {
      width: 18px;
    }
  }
`;

export const StyledBrandHeading = styled.h1`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  font-size: 32px;
  line-height: 1.1;
  letter-spacing: -0.02em;
  /* Documented exception: brand panel always uses dark botanical bg — text must be light-invariant */
  color: oklch(0.97 0.01 67);
  margin: 0 0 18px;
  animation: ${zenFadeUpHeading} 550ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both;

  em {
    font-style: italic;
    font-weight: ${({ theme }) => theme.typography.weight.regular};
    /* Documented exception: gold on dark = intent.primary */
    color: oklch(0.76 0.07 67);
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    font-size: 40px;
    margin: 0 0 14px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    font-size: 56px;
    line-height: 1.08;
    margin: 0 0 18px;
  }
`;

export const StyledBrandDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 15.5px;
  line-height: 1.75;
  font-weight: ${({ theme }) => theme.typography.weight.light};
  color: oklch(0.97 0.01 67 / 0.9);
  margin: 0;
  max-width: 420px;
  animation: ${zenFadeIn} 450ms ease 320ms both;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    font-size: 16.5px;
    max-width: 560px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    font-size: 16px;
    max-width: 420px;
  }
`;

export const StyledBrandFooter = styled.div`
  position: relative;
  z-index: 1;
  display: none;
  animation: ${zenFadeIn} 300ms ease 480ms both;

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    font-family: ${({ theme }) => theme.typography.font.body};
    font-size: ${({ theme }) => theme.typography.size.xs};
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    color: oklch(0.97 0.01 67 / 0.65);
  }
`;

// ── Form panel (right) ────────────────────────────────────────────────────────

export const StyledFormPanel = styled.div`
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px 22px 48px;
  background: ${({ theme }) => theme.color.background.light};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding: 48px 40px 64px;
    align-items: center;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    padding: 48px;
    min-height: 100dvh;
  }
`;

export const StyledThemeToggle = styled.button`
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: transparent;
  color: ${({ theme }) => theme.color.text.secondary};
  cursor: pointer;
  transition:
    color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    border-color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut};

  &:hover {
    color: ${({ theme }) => theme.color.text.primary};
    border-color: ${({ theme }) => theme.border.color.neutral.medium};
    background: ${({ theme }) => theme.color.background.neutral};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    top: 32px;
    left: 40px;
  }
`;

export const StyledLangToggle = styled.div`
  position: absolute;
  top: 18px;
  right: 18px;
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  z-index: 5;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    top: 32px;
    right: 40px;
  }
`;

export const StyledLangButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  border-bottom: 1px solid transparent;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  font: inherit;
  letter-spacing: inherit;
  color: ${({ theme, $active }) => ($active ? theme.color.text.primary : theme.color.text.muted)};
  border-bottom-color: ${({ theme, $active }) =>
    $active ? theme.color.intent.primary : 'transparent'};
  transition: color ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.easeOut};

  &:hover {
    color: ${({ theme }) => theme.color.text.primary};
  }
`;

export const StyledFormCardWrapper = styled.div`
  width: 100%;
  max-width: 440px;
  margin-top: ${({ theme }) => theme.spacing['2xl']};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    margin-top: 0;
  }
`;

export const StyledCrumbs = styled.div`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 10.5px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.text.muted};
  animation: ${zenFadeRight} 480ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    font-size: 11px;
  }
`;

export const StyledFormTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  font-size: 32px;
  line-height: 1.08;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.color.text.primary};
  margin: 12px 0 6px;
  animation: ${zenFadeRight} 520ms cubic-bezier(0.22, 1, 0.36, 1) 260ms both;

  em {
    font-style: italic;
    font-weight: ${({ theme }) => theme.typography.weight.regular};
    color: ${({ theme }) => (theme.isDark ? theme.color.primary[300] : theme.color.primary[700])};
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    font-size: 44px;
    margin: 14px 0 8px;
  }
`;

export const StyledFormLead = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 14.5px;
  line-height: 1.6;
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing.xl};
  animation: ${zenFadeIn} 450ms ease 340ms both;

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    font-size: 15.5px;
    margin-bottom: ${({ theme }) => theme.spacing['2xl']};
  }
`;

export const StyledForm = styled.form<{ $isPending?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  animation: ${zenFadeIn} 350ms ease 440ms both;

  ${({ $isPending }) =>
    $isPending === true &&
    `
    cursor: wait;
    & input, & button[type="button"] {
      pointer-events: none;
      opacity: 0.6;
    }
  `}
`;

// ── Remember me row ───────────────────────────────────────────────────────────

export const StyledRememberRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: ${({ theme }) => theme.spacing.xs} 0 ${({ theme }) => theme.spacing.md};
`;

export const StyledCheckLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};

  input[type='checkbox'] {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  input[type='checkbox']:checked + span {
    background: ${({ theme }) => (theme.isDark ? 'oklch(0.84 0.06 67)' : theme.color.text.primary)};
    border-color: ${({ theme }) =>
      theme.isDark ? 'oklch(0.84 0.06 67)' : theme.color.text.primary};
  }

  input[type='checkbox']:checked + span::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 8px;
    border-style: solid;
    border-color: ${({ theme }) =>
      theme.isDark ? 'oklch(0.11 0.03 204)' : theme.color.intent.primary};
    border-width: 0 2px 2px 0;
    transform: translate(-50%, -60%) rotate(45deg);
  }

  input[type='checkbox']:focus-visible + span {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }
`;

export const StyledCheckBox = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.border.color.neutral.light};
  border-radius: ${({ theme }) => theme.border.radius.xs};
  transition:
    background ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut},
    border-color ${({ theme }) => theme.transition.duration.fast}
      ${({ theme }) => theme.transition.timing.easeOut};
`;

// ── Submit button (dark pill — specific to login page) ────────────────────────

export const StyledSubmitButton = styled.button<{ $isPending?: boolean }>`
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 16px ${({ theme }) => theme.spacing.lg};
  border: none;
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: ${({ theme }) => theme.color.background.dark};
  /* Documented exception: pill button uses hardcoded light text for contrast in both themes */
  color: oklch(0.97 0.01 67);
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: 14.5px;
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.transition.duration.base}
      ${({ theme }) => theme.transition.timing.easeOut},
    transform 100ms ${({ theme }) => theme.transition.timing.easeOut},
    box-shadow ${({ theme }) => theme.transition.duration.base}
      ${({ theme }) => theme.transition.timing.easeOut};

  &:hover:not(:disabled) {
    /* Documented exception: jungle-green hover matches brand panel — no semantic token */
    background: oklch(0.25 0.04 150);
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.effect.shadow.outer.sm};
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${({ $isPending }) => $isPending === true && 'cursor: wait; pointer-events: none;'}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:active:not(:disabled) {
      transform: none;
    }
  }
`;

// ── Below-form elements ───────────────────────────────────────────────────────

export const StyledRequestAccess = styled.p`
  margin-top: ${({ theme }) => theme.spacing.xl};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  text-align: center;
  animation: ${zenFadeIn} 350ms ease 440ms both;

  a {
    color: ${({ theme }) => (theme.isDark ? theme.color.primary[300] : theme.color.primary[700])};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => (theme.isDark ? theme.color.primary[400] : theme.color.primary[600])};
    }
    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
      outline-offset: 2px;
      border-radius: ${({ theme }) => theme.border.radius.xs};
    }
  }

  @media (max-width: 600px) {
    font-size: 13.5px;
    margin-top: ${({ theme }) => theme.spacing.lg};
  }
`;

export const StyledLegal = styled.p`
  margin-top: ${({ theme }) => theme.spacing['2xl']};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
  text-align: center;
  letter-spacing: 0.03em;
  line-height: 1.55;
  animation: ${zenFadeIn} 350ms ease 440ms both;

  @media (max-width: 600px) {
    margin-top: ${({ theme }) => theme.spacing.xl};
    font-size: 10.5px;
  }
`;

/*
 * StyledLegalLink — anchor used inside the dense StyledLegal paragraph.
 * Underline stays visible at rest (unlike StyledRequestAccess's hover-only
 * underline) because color alone isn't enough affordance at 10.5-12px inside
 * muted text.
 */
export const StyledLegalLink = styled.a`
  color: ${({ theme }) => (theme.isDark ? theme.color.primary[300] : theme.color.primary[700])};
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: ${({ theme }) => (theme.isDark ? theme.color.primary[400] : theme.color.primary[600])};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.border.radius.xs};
  }
`;

export const StyledInputIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.color.text.muted};
`;

export const StyledPasswordToggle = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.color.text.muted};
  cursor: pointer;
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.typography.size.md};
  pointer-events: auto;
  padding: 0 ${({ theme }) => theme.spacing.xs};
  transition: color ${({ theme }) => theme.transition.duration.fast}
    ${({ theme }) => theme.transition.timing.easeOut};

  &:hover {
    color: ${({ theme }) => theme.color.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: -2px;
  }
`;
