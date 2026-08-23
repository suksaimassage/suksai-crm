/**
 * SidebarUserFooter.test.tsx
 *
 * Spec item 5 (view). SidebarUserFooter renders Avatar (initials) + Name
 * synchronously from props, and a state-driven third line for the user's primary
 * centre:
 *   isCentroLoading ? <skeleton bar> : (centroNombre ?? t('dashboard:sidebar.noCentro'))
 *
 * Design contract (verified as behaviour, not CSS):
 *   - avatar + name always paint (independent of the centre query),
 *   - loading → a skeleton placeholder that is aria-hidden (decorative), no text,
 *   - loaded → the centro name text (+ title attr for truncation tooltip),
 *   - null (no centre OR error normalised at the hook) → the i18n fallback,
 *   - collapsed → info block still in the DOM (visibility is CSS-only; jsdom
 *     cannot evaluate the opacity/max-width transition), renders without throwing.
 *
 * No snapshot tests, no CSS string assertions (project policy).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esDashboard from '@infra/i18n/locales/es/dashboard.json';
import { SidebarUserFooter } from '@infra/pages/DashboardPage/Dashboard.brand';

// ── i18next test instance ────────────────────────────────────────────────────
const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['dashboard'],
  defaultNS: 'dashboard',
  resources: { es: { dashboard: esDashboard } },
  interpolation: { escapeValue: false },
});

// ── Wrapper ──────────────────────────────────────────────────────────────────
const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

const renderFooter = (props: Partial<React.ComponentProps<typeof SidebarUserFooter>> = {}) =>
  render(<SidebarUserFooter initials="NA" name="Naree A." {...props} />, { wrapper: Wrapper });

// ────────────────────────────────────────────────────────────────────────────

describe('SidebarUserFooter — avatar + name (synchronous)', () => {
  it('renders the initials immediately', () => {
    renderFooter({ initials: 'SB', name: 'Suda Boonsri' });
    expect(screen.getByText('SB')).toBeInTheDocument();
  });

  it('renders the display name immediately, independent of the centre state', () => {
    renderFooter({ name: 'Naree A.', isCentroLoading: true });
    expect(screen.getByText('Naree A.')).toBeInTheDocument();
  });

  it('marks the avatar as decorative (aria-hidden) so the initials are not announced redundantly', () => {
    renderFooter({ initials: 'NA' });
    const avatar = screen.getByText('NA');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('SidebarUserFooter — centre line: loading', () => {
  it('does NOT render the fallback text while loading', () => {
    renderFooter({ isCentroLoading: true });
    expect(screen.queryByText(/sin centro asignado/i)).toBeNull();
  });

  it('renders a decorative skeleton placeholder (aria-hidden, no readable text) while loading', () => {
    const { container } = renderFooter({
      isCentroLoading: true,
      centroNombre: 'Ignored While Loading',
    });
    // The loaded name must NOT appear while loading.
    expect(screen.queryByText('Ignored While Loading')).toBeNull();
    // A decorative aria-hidden placeholder element sits where the text line will be.
    const decorative = container.querySelectorAll('[aria-hidden="true"]');
    // Avatar is also aria-hidden, so expect at least 2 (avatar + skeleton).
    expect(decorative.length).toBeGreaterThanOrEqual(2);
  });
});

describe('SidebarUserFooter — centre line: loaded', () => {
  // The component renders `${t('dashboard:sidebar.centroLabel')} ${centroNombre}`,
  // which produces "Centro: Centro Chamartín" with the es locale loaded in the test
  // wrapper. Assertions must match the full formatted string.
  it('renders the primary centre name when resolved', () => {
    renderFooter({ centroNombre: 'Centro Chamartín', isCentroLoading: false });
    expect(screen.getByText('Centro: Centro Chamartín')).toBeInTheDocument();
  });

  it('exposes the centre name via a title attribute (truncation tooltip)', () => {
    renderFooter({ centroNombre: 'Centro Chamartín', isCentroLoading: false });
    const centro = screen.getByText('Centro: Centro Chamartín');
    expect(centro).toHaveAttribute('title', 'Centro: Centro Chamartín');
  });
});

describe('SidebarUserFooter — centre line: fallback', () => {
  it('renders the i18n "Sin centro asignado" fallback when centroNombre is null', () => {
    renderFooter({ centroNombre: null, isCentroLoading: false });
    expect(screen.getByText('Sin centro asignado')).toBeInTheDocument();
  });

  it('renders the fallback when centroNombre is undefined (prop omitted)', () => {
    renderFooter({ isCentroLoading: false });
    expect(screen.getByText('Sin centro asignado')).toBeInTheDocument();
  });

  it('does NOT set a title attribute on the fallback (only on real centre names)', () => {
    renderFooter({ centroNombre: null, isCentroLoading: false });
    const fallback = screen.getByText('Sin centro asignado');
    expect(fallback).not.toHaveAttribute('title');
  });
});

describe('SidebarUserFooter — collapsed variant', () => {
  it('renders the info content in the DOM when collapsed (visibility is CSS-only)', () => {
    // The name/centre live inside StyledUserInfo, which hides via opacity/max-width.
    // jsdom cannot evaluate that transition, so we assert DOM presence + no throw.
    // The component renders "Centro: <nombre>" via the centroLabel i18n prefix.
    expect(() => renderFooter({ collapsed: true, centroNombre: 'Centro Chamartín' })).not.toThrow();
    expect(screen.getByText('Naree A.')).toBeInTheDocument();
    expect(screen.getByText('Centro: Centro Chamartín')).toBeInTheDocument();
  });

  it('renders the avatar when collapsed', () => {
    renderFooter({ collapsed: true, initials: 'NA' });
    expect(screen.getByText('NA')).toBeInTheDocument();
  });
});
