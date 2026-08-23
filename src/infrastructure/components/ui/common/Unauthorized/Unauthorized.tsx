import { useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@infra/components/ui/common/Button';
import * as S from './Unauthorized.styles';

// ── Botanical ornament SVG ─────────────────────────────────────────────────────
// Thin ring + small leaf — mirrors the sidebar botanical ring motif.
const BotanicalOrnament = () => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="1" opacity="0.18" />
    <circle
      cx="60"
      cy="60"
      r="46"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeDasharray="3 6"
      opacity="0.12"
    />
    {/* Leaf detail — top center */}
    <path d="M60 6 C54 14 52 22 60 28 C68 22 66 14 60 6Z" fill="currentColor" opacity="0.55" />
    <path d="M60 6 L60 28" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
    {/* Small accent leaves — left and right */}
    <path d="M6 60 C14 54 22 52 28 60 C22 68 14 66 6 60Z" fill="currentColor" opacity="0.28" />
    <path
      d="M114 60 C106 54 98 52 92 60 C98 68 106 66 114 60Z"
      fill="currentColor"
      opacity="0.28"
    />
  </svg>
);

// ── Props ──────────────────────────────────────────────────────────────────────

interface IUnauthorizedProps {
  /**
   * Pre-resolved route label. Prefer `routeKey` so the label reacts to language
   * switches; `routeLabel` remains for callers that already hold a literal.
   */
  readonly routeLabel?: string;
  /**
   * Key under `dashboard:breadcrumbs.*` (e.g. 'agenda'). When provided, the label
   * is resolved with `t()` inside the component and takes precedence over
   * `routeLabel`.
   */
  readonly routeKey?: string;
  readonly fallbackPath: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface IUnauthorizedOrnamentProps {
  readonly children?: React.ReactNode;
}

const UnauthorizedOrnament = ({ children }: IUnauthorizedOrnamentProps) => (
  <S.StyledOrnament>{children ?? <BotanicalOrnament />}</S.StyledOrnament>
);

interface IUnauthorizedContentProps {
  readonly children: React.ReactNode;
}

const UnauthorizedContent = ({ children }: IUnauthorizedContentProps) => (
  <S.StyledContent>{children}</S.StyledContent>
);

interface IUnauthorizedLabelProps {
  readonly children: React.ReactNode;
}

const UnauthorizedLabel = ({ children }: IUnauthorizedLabelProps) => (
  <S.StyledLabel>{children}</S.StyledLabel>
);

interface IUnauthorizedTitleProps {
  readonly children: React.ReactNode;
  readonly ref?: React.Ref<HTMLHeadingElement>;
}

const UnauthorizedTitle = ({ children, ref }: IUnauthorizedTitleProps) => (
  <S.StyledTitle ref={ref} tabIndex={-1}>
    {children}
  </S.StyledTitle>
);

interface IUnauthorizedMessageProps {
  readonly children: React.ReactNode;
}

const UnauthorizedMessage = ({ children }: IUnauthorizedMessageProps) => (
  <S.StyledMessage>{children}</S.StyledMessage>
);

interface IUnauthorizedActionProps {
  readonly children: React.ReactNode;
  readonly fullWidth?: boolean;
}

const UnauthorizedAction = ({ children, fullWidth = false }: IUnauthorizedActionProps) => (
  <S.StyledAction $fullWidth={fullWidth}>{children}</S.StyledAction>
);

// ── Root ───────────────────────────────────────────────────────────────────────

const UnauthorizedRoot = ({ routeLabel, routeKey, fallbackPath }: IUnauthorizedProps) => {
  const { t } = useTranslation('errors');
  const navigate = useNavigate();
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Resolve the label inside the component so it reacts to language switches.
  // `routeKey` (a dashboard breadcrumb key) wins; otherwise fall back to a
  // pre-resolved `routeLabel` literal.
  const resolvedRouteLabel = routeKey ? t(`dashboard:breadcrumbs.${routeKey}`) : (routeLabel ?? '');

  // Move programmatic focus to the heading on mount for screen readers
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleGoToDashboard = () => {
    void navigate({ to: fallbackPath });
  };

  return (
    <S.StyledUnauthorizedRoot role="alert">
      <UnauthorizedOrnament />
      <UnauthorizedContent>
        <UnauthorizedLabel>403</UnauthorizedLabel>
        <UnauthorizedTitle ref={titleRef}>{t('unauthorized.heading')}</UnauthorizedTitle>
        <UnauthorizedMessage>
          {t('unauthorized.message', { routeLabel: resolvedRouteLabel })}
        </UnauthorizedMessage>
        <UnauthorizedAction fullWidth={false}>
          <Button color="primary" variant="solid" size="md" onClick={handleGoToDashboard}>
            {t('unauthorized.action')}
          </Button>
        </UnauthorizedAction>
      </UnauthorizedContent>
    </S.StyledUnauthorizedRoot>
  );
};

// ── Compound export ───────────────────────────────────────────────────────────

export const Unauthorized = Object.assign(UnauthorizedRoot, {
  Ornament: UnauthorizedOrnament,
  Content: UnauthorizedContent,
  Label: UnauthorizedLabel,
  Title: UnauthorizedTitle,
  Message: UnauthorizedMessage,
  Action: UnauthorizedAction,
});
