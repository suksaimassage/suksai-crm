import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';

import { Typography } from '@infra/components/ui/core/Typography';
import { StyledArticle } from '@infra/components/ui/core/Layout/Layout.styles';
import { LegalToc } from '@infra/components/ui/shared/LegalToc';
import { useIsDark, useThemeActions } from '@app/stores/useThemeStore';
import type { SupportedLanguage } from '@infra/i18n';
import { loadNamespaces } from '@infra/i18n/namespace-loader';
import suksaiLogo from '@infra/assets/images/suksai-massage-logo.png';

import type { ILegalSection, TLegalSlug } from './LegalPage.types';
import {
  BackLink,
  StyledBackToTop,
  StyledLegalBody,
  StyledLegalBrandLink,
  StyledLegalBrandLogo,
  StyledLegalDateline,
  StyledLegalFooter,
  StyledLegalHeader,
  StyledLegalHeaderActions,
  StyledLegalHero,
  StyledLegalLangBtn,
  StyledLegalLangToggle,
  StyledLegalMain,
  StyledLegalPage,
  StyledLegalThemeToggle,
  StyledLegalTitle,
  StyledLegalTocWrapper,
} from './LegalPage.styles';

const LEGAL_NS = 'legal' as const;
const BACK_TO_TOP_THRESHOLD = 600;

// ── Icons (inline, matching LoginPage's icon recipe) ─────────────────────────

const LotusSunIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="3" />
    {([0, 45, 90, 135, 180, 225, 270, 315] as const).map((deg) => (
      <path
        key={deg}
        d="M12 9C12.8 7.5 12.8 5.5 12 4C11.2 5.5 11.2 7.5 12 9Z"
        transform={`rotate(${deg} 12 12)`}
      />
    ))}
  </svg>
);

const CrescentMoonIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

interface ILegalPageProps {
  readonly slug: TLegalSlug;
}

export const LegalPage = ({ slug }: ILegalPageProps) => {
  const { t, i18n } = useTranslation(LEGAL_NS);
  const isDark = useIsDark();
  const { toggleTheme } = useThemeActions();
  const currentLang = i18n.language.startsWith('es') ? 'es' : 'en';

  const mainRef = useRef<HTMLElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const title = t(`${slug}.title`);
  const lastUpdated = t(`${slug}.lastUpdated`);
  const sections = t(`${slug}.sections`, {
    returnObjects: true,
  }) as unknown as readonly ILegalSection[];

  useEffect(() => {
    mainRef.current?.focus();
  }, []);

  useEffect(() => {
    let frameId: number | null = null;

    const handleScroll = () => {
      if (frameId !== null) return;
      frameId = requestAnimationFrame(() => {
        setShowBackToTop(window.scrollY > BACK_TO_TOP_THRESHOLD);
        frameId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, []);

  const handleChangeLang = (lang: SupportedLanguage) => {
    void loadNamespaces(i18n, lang, ['common', LEGAL_NS]).then(() => {
      void i18n.changeLanguage(lang).then(() => {
        document.documentElement.setAttribute('lang', lang);
      });
    });
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tocItems = sections.map((section) => ({ id: section.id, heading: section.heading }));

  return (
    <StyledLegalPage>
      <StyledLegalHeader role="banner">
        <StyledLegalBrandLink as={Link} to="/" aria-label={t('header.brandAriaLabel')}>
          <StyledLegalBrandLogo src={suksaiLogo} alt="" />
        </StyledLegalBrandLink>

        <StyledLegalHeaderActions>
          <StyledLegalThemeToggle
            type="button"
            aria-label={isDark ? t('header.themeToggle.toLight') : t('header.themeToggle.toDark')}
            onClick={toggleTheme}
          >
            {isDark ? <LotusSunIcon /> : <CrescentMoonIcon />}
          </StyledLegalThemeToggle>

          <StyledLegalLangToggle role="group" aria-label={t('header.langGroupAriaLabel')}>
            <StyledLegalLangBtn
              type="button"
              $active={currentLang === 'es'}
              aria-pressed={currentLang === 'es'}
              onClick={() => {
                handleChangeLang('es');
              }}
            >
              ES
            </StyledLegalLangBtn>
            <StyledLegalLangBtn
              type="button"
              $active={currentLang === 'en'}
              aria-pressed={currentLang === 'en'}
              onClick={() => {
                handleChangeLang('en');
              }}
            >
              EN
            </StyledLegalLangBtn>
          </StyledLegalLangToggle>
        </StyledLegalHeaderActions>
      </StyledLegalHeader>

      <StyledLegalMain ref={mainRef} id="main-content" role="main" aria-label={title} tabIndex={-1}>
        <StyledLegalHero>
          <StyledLegalTitle>{title}</StyledLegalTitle>
          <StyledLegalDateline>{lastUpdated}</StyledLegalDateline>
        </StyledLegalHero>

        <StyledLegalBody>
          <StyledLegalTocWrapper>
            <summary>
              {t('toc.label')}
              <ChevronDownIcon />
            </summary>
            <LegalToc items={tocItems} ariaLabel={t('toc.ariaLabel')} label={t('toc.label')} />
          </StyledLegalTocWrapper>

          <StyledArticle $prose>
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <Typography variant="h2" as="h2">
                  {section.heading}
                </Typography>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </StyledArticle>
        </StyledLegalBody>
      </StyledLegalMain>

      <StyledBackToTop
        type="button"
        $visible={showBackToTop}
        aria-label={t('backToTop')}
        tabIndex={showBackToTop ? 0 : -1}
        aria-hidden={!showBackToTop}
        onClick={handleBackToTop}
      >
        <ArrowUpIcon />
      </StyledBackToTop>

      <StyledLegalFooter role="contentinfo">
        <BackLink as={Link} to="/">
          {t('backLink')}
        </BackLink>
      </StyledLegalFooter>
    </StyledLegalPage>
  );
};
