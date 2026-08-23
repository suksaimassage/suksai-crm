import { useActionState, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import type { z } from 'zod';

import { Alert } from '@infra/components/ui/common/Alert';
import { FormField } from '@infra/components/ui/common/FormField';
import { Input } from '@infra/components/ui/common/Input';
import { VisuallyHidden } from '@infra/components/ui/shared/VisuallyHidden';

import { loginSchema } from '@app/schemas/loginSchema';
import { Email } from '@domain/value-objects/Email';
import { signIn } from '@infra/hooks/useAuth';
import { mapAuthErrorToI18nKey } from '@infra/utils/auth-error-mapping';
import { getRoleHomePath } from '@app/routes/home-by-role';
import { useUserStore } from '@app/stores/useUserStore';
import type { ISignInDTO } from '@domain/ports';
import type { SupportedLanguage } from '@infra/i18n';
import { loadNamespaces } from '@infra/i18n/namespace-loader';
import { useIsDark, useThemeActions } from '@app/stores/useThemeStore';

import {
  StyledBrandDescription,
  StyledBrandEyebrow,
  StyledBrandFooter,
  StyledBrandHeading,
  StyledBrandLogo,
  StyledBrandOrnament,
  StyledBrandPanel,
  StyledBrandQuote,
  StyledCheckBox,
  StyledCheckLabel,
  StyledCrumbs,
  StyledFormCardWrapper,
  StyledFormLead,
  StyledFormPanel,
  StyledFormTitle,
  StyledInputIcon,
  StyledLangButton,
  StyledLangToggle,
  StyledLegal,
  StyledLegalLink,
  StyledThemeToggle,
  StyledLoginPage,
  StyledPasswordToggle,
  StyledRememberRow,
} from './LoginPage.styles';
import { Button } from '@infra/components/ui/common/Button';
import { Form } from '@infra/components/ui/common/Form';
import { useForm } from '@infra/hooks/useForm';

interface IFieldErrors {
  email?: string;
  password?: string;
}

interface ILoginActionState {
  readonly fieldErrors: IFieldErrors;
  readonly formError: string | null;
}

const INITIAL_STATE: ILoginActionState = {
  fieldErrors: {},
  formError: null,
};

const resolveFieldErrors = (issues: readonly z.core.$ZodIssue[]): IFieldErrors => {
  const next: IFieldErrors = {};
  for (const issue of issues) {
    const path = issue.path[0];
    if (path === 'email' && !next.email) next.email = issue.message;
    if (path === 'password' && !next.password) next.password = issue.message;
  }
  return next;
};

const SuksaiLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" fill="none" aria-hidden="true">
    <g
      transform="translate(8, 16)"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M24 44 C 24 28, 18 18, 8 14 C 12 28, 16 38, 24 44 Z" />
      <path d="M24 44 C 24 28, 30 18, 40 14 C 36 28, 32 38, 24 44 Z" />
      <path d="M24 44 C 18 32, 12 26, 4 28 C 8 36, 14 42, 24 44 Z" />
      <path d="M24 44 C 30 32, 36 26, 44 28 C 40 36, 34 42, 24 44 Z" />
      <path d="M24 44 C 24 30, 24 22, 24 12" />
      <ellipse cx="24" cy="46" rx="12" ry="1.5" strokeWidth="0.8" />
    </g>
    <text
      x="68"
      y="52"
      fontFamily="'Cormorant Garamond', 'Cormorant', Georgia, serif"
      fontSize="36"
      fontWeight="500"
      letterSpacing="0.04em"
      fill="currentColor"
    >
      SUKSAI
    </text>
    <text
      x="69"
      y="68"
      fontFamily="Manrope, sans-serif"
      fontSize="9"
      fontWeight="600"
      letterSpacing="0.36em"
      fill="currentColor"
      opacity="0.7"
    >
      THAI · MASSAGE
    </text>
  </svg>
);

const EnvelopeIcon = () => (
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
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
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
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M2.036 12.322a1 1 0 0 1 0-.644C3.888 6.987 7.607 4 12 4c4.393 0 8.112 2.987 9.964 7.678a1 1 0 0 1 0 .644C20.112 17.013 16.393 20 12 20c-4.393 0-8.112-2.987-9.964-7.678Z" />
    <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M3 3l18 18" />
    <path d="M10.477 10.477a3 3 0 0 0 4.243 3.244M6.228 6.228A10.45 10.45 0 0 0 2.46 12c1.852 4.691 5.57 7.678 9.964 7.678a9.98 9.98 0 0 0 4.666-1.148M9.122 6.346A10.061 10.061 0 0 1 12 6c4.393 0 8.112 2.987 9.964 7.678-.434.976-1.01 1.885-1.709 2.688" />
  </svg>
);

const ArrowRightIcon = () => (
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
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

// Lotus sun: 8 petal-shaped rays around a circle — Zen Thai aesthetic
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

// Crescent moon — clean silhouette for light-mode toggle
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

const createLoginAction =
  (navigate: ReturnType<typeof useNavigate>, searchRedirect: string | undefined) =>
  async (_prevState: ILoginActionState, formData: FormData): Promise<ILoginActionState> => {
    const rawEmail = (formData.get('email') as string | null) ?? '';
    const rawPassword = (formData.get('password') as string | null) ?? '';

    const parsed = loginSchema.safeParse({ email: rawEmail, password: rawPassword });
    if (!parsed.success) {
      return { fieldErrors: resolveFieldErrors(parsed.error.issues), formError: null };
    }

    try {
      const dto: ISignInDTO = {
        email: Email.create(parsed.data.email),
        password: parsed.data.password,
      };
      const session = await signIn(dto);
      useUserStore.getState().setSession(session);
      const destination = searchRedirect ?? getRoleHomePath(session.user.roles);
      void navigate({ to: destination, replace: true });
      return { fieldErrors: {}, formError: null };
    } catch (err) {
      return { fieldErrors: {}, formError: mapAuthErrorToI18nKey(err) };
    }
  };

export const LoginPage = () => {
  const { t, i18n } = useTranslation(['login', 'common']);
  const navigate = useNavigate();
  const search = useSearch({ from: '/login' });

  const loginForm = useForm();

  const [showPassword, setShowPassword] = useState(false);
  const currentLang = i18n.language.startsWith('es') ? 'es' : 'en';
  const isDark = useIsDark();
  const { toggleTheme } = useThemeActions();

  const handleChangeLang = (lang: SupportedLanguage) => {
    void loadNamespaces(i18n, lang, ['common', 'login']).then(() => {
      void i18n.changeLanguage(lang).then(() => {
        document.documentElement.setAttribute('lang', lang);
      });
    });
  };

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const loginAction = createLoginAction(navigate, search.redirect);
  const [state, dispatch, isPending] = useActionState(loginAction, INITIAL_STATE);

  useEffect(() => {
    if (state.formError) alertRef.current?.focus();
  }, [state.formError]);

  useEffect(() => {
    if (state.fieldErrors.email) emailRef.current?.focus();
    else if (state.fieldErrors.password) passwordRef.current?.focus();
  }, [state.fieldErrors]);

  return (
    <StyledLoginPage>
      {/* ── LEFT: Brand panel ── */}
      <StyledBrandPanel aria-hidden="true">
        <StyledBrandOrnament />

        <StyledBrandLogo>
          <SuksaiLogo />
        </StyledBrandLogo>

        <StyledBrandQuote>
          <StyledBrandEyebrow>{t('login:brandEyebrow')}</StyledBrandEyebrow>
          <StyledBrandHeading>
            {t('login:brandTitle')} <em>{t('login:brandTitleEm')}</em>
          </StyledBrandHeading>
          <StyledBrandDescription>{t('login:brandDescription')}</StyledBrandDescription>
        </StyledBrandQuote>

        <StyledBrandFooter>
          <span>{t('login:footer.copyright')}</span>
        </StyledBrandFooter>
      </StyledBrandPanel>

      {/* ── RIGHT: Form panel ── */}
      <StyledFormPanel>
        <StyledThemeToggle
          type="button"
          aria-label={isDark ? t('login:themeToggle.toLight') : t('login:themeToggle.toDark')}
          onClick={toggleTheme}
        >
          {isDark ? <LotusSunIcon /> : <CrescentMoonIcon />}
        </StyledThemeToggle>

        <StyledLangToggle>
          <StyledLangButton
            $active={currentLang === 'es'}
            onClick={() => {
              handleChangeLang('es');
            }}
          >
            {t('login:lang.es')}
          </StyledLangButton>
          <StyledLangButton
            $active={currentLang === 'en'}
            onClick={() => {
              handleChangeLang('en');
            }}
          >
            {t('login:lang.en')}
          </StyledLangButton>
        </StyledLangToggle>

        <StyledFormCardWrapper>
          <StyledCrumbs>{t('login:crumbs')}</StyledCrumbs>
          <StyledFormTitle>
            {t('login:titlePrefix')} <em>{t('login:titleEm')}</em>
          </StyledFormTitle>
          <StyledFormLead>{t('login:lead')}</StyledFormLead>

          <Form
            id="login-form"
            form={loginForm}
            noValidate
            variant="default"
            action={dispatch}
            aria-label={t('login:aria.formLabel')}
          >
            {state.formError ? (
              <Form.Header>
                <Alert ref={alertRef} variant="error" title={t('login:error.title')}>
                  {t(state.formError)}
                </Alert>
              </Form.Header>
            ) : null}
            <Form.Body>
              <FormField
                id="login-email"
                label={t('login:field.email.label')}
                required
                requiredAriaSuffix={t('login:aria.requiredSuffix')}
                errorText={state.fieldErrors.email ? t(state.fieldErrors.email) : undefined}
              >
                {(controlProps) => (
                  <Input
                    {...controlProps}
                    ref={emailRef}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    maxLength={254}
                    placeholder={t('login:field.email.placeholder')}
                    defaultValue=""
                    hasError={Boolean(state.fieldErrors.email)}
                    disabled={isPending}
                    leadingSlot={
                      <StyledInputIcon>
                        <EnvelopeIcon />
                      </StyledInputIcon>
                    }
                  />
                )}
              </FormField>

              <FormField
                id="login-password"
                label={t('login:field.password.label')}
                required
                requiredAriaSuffix={t('login:aria.requiredSuffix')}
                errorText={state.fieldErrors.password ? t(state.fieldErrors.password) : undefined}
              >
                {(controlProps) => (
                  <Input
                    {...controlProps}
                    ref={passwordRef}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    enterKeyHint="go"
                    maxLength={128}
                    defaultValue=""
                    hasError={Boolean(state.fieldErrors.password)}
                    disabled={isPending}
                    leadingSlot={
                      <StyledInputIcon>
                        <LockIcon />
                      </StyledInputIcon>
                    }
                    trailingSlot={
                      <StyledPasswordToggle
                        type="button"
                        aria-pressed={showPassword}
                        aria-label={
                          showPassword
                            ? t('login:field.password.toggle.hide')
                            : t('login:field.password.toggle.show')
                        }
                        onClick={() => {
                          setShowPassword((v) => !v);
                        }}
                        tabIndex={isPending ? -1 : 0}
                      >
                        {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                      </StyledPasswordToggle>
                    }
                  />
                )}
              </FormField>

              <StyledRememberRow>
                <StyledCheckLabel>
                  <input type="checkbox" name="rememberMe" defaultChecked />
                  <StyledCheckBox />
                  <span>{t('login:rememberMe')}</span>
                </StyledCheckLabel>
              </StyledRememberRow>

              <Button type="submit" shape="rounded" variant="solid" size="md" loading={isPending}>
                {isPending ? t('login:submitLoading') : t('login:submit')}
                {!isPending && <ArrowRightIcon />}
              </Button>
            </Form.Body>
          </Form>

          <StyledLegal>
            <Trans
              i18nKey="login:legalWithLinks"
              components={{
                termsLink: (
                  <StyledLegalLink
                    as={Link}
                    to="/legal/terminos-uso"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
                privacyLink: (
                  <StyledLegalLink
                    as={Link}
                    to="/legal/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
                vh: <VisuallyHidden>{''}</VisuallyHidden>,
              }}
            />
          </StyledLegal>
        </StyledFormCardWrapper>
      </StyledFormPanel>
    </StyledLoginPage>
  );
};
