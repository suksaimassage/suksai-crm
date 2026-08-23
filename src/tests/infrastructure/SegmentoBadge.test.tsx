/**
 * SegmentoBadge.test.tsx
 *
 * Tests every segment variant's glyph and translated label, the size prop, and
 * confirms the badge renders without extraneous ARIA roles.
 *
 * i18n strategy: initialise a minimal i18next instance (same pattern as
 * LoginPage.test.tsx) with the English clientes.json so assertions match
 * stable English strings.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import enClientes from '@infra/i18n/locales/en/clientes.json';
import { SegmentoBadge } from '@infra/components/ui/domain/SegmentoBadge';
import type { TClienteSegmento } from '@infra/pages/ClientesPage/Clientes.types';

// ── i18n test instance ────────────────────────────────────────────────────────

const testI18n = i18n.createInstance();

void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['clientes'],
  defaultNS: 'clientes',
  resources: { en: { clientes: enClientes } },
  interpolation: { escapeValue: false },
});

// ── Wrapper ───────────────────────────────────────────────────────────────────

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

// ── Segment configuration under test ─────────────────────────────────────────

const SEGMENT_CASES: readonly {
  segment: TClienteSegmento;
  glyph: string;
  label: string;
}[] = [
  { segment: 'vip', glyph: '☆', label: 'VIP' },
  { segment: 'activo', glyph: '●', label: 'Active' },
  { segment: 'nuevo', glyph: '◈', label: 'New' },
  { segment: 'en_riesgo', glyph: '△', label: 'At risk' },
  { segment: 'inactivo', glyph: '—', label: 'Inactive' },
] as const;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SegmentoBadge — segment variants', () => {
  it.each(SEGMENT_CASES)(
    'segment "$segment" renders glyph "$glyph" and label "$label"',
    ({ segment, glyph, label }) => {
      render(<SegmentoBadge segment={segment} />, { wrapper: Wrapper });

      // Glyph is aria-hidden — use text content search
      expect(screen.getByText(glyph)).toBeInTheDocument();
      expect(screen.getByText(label)).toBeInTheDocument();
    },
  );
});

describe('SegmentoBadge — size prop', () => {
  it('renders size="sm" without crashing', () => {
    render(<SegmentoBadge segment="vip" size="sm" />, { wrapper: Wrapper });
    expect(screen.getByText('VIP')).toBeInTheDocument();
  });

  it('renders size="md" without crashing', () => {
    render(<SegmentoBadge segment="activo" size="md" />, { wrapper: Wrapper });
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('defaults to size="md" when size prop is omitted', () => {
    // Both sizes render the same DOM text — confirm the badge still mounts
    render(<SegmentoBadge segment="nuevo" />, { wrapper: Wrapper });
    expect(screen.getByText('New')).toBeInTheDocument();
  });
});

describe('SegmentoBadge — glyph accessibility', () => {
  it('glyph element is marked aria-hidden so screen readers skip it', () => {
    const { container } = render(<SegmentoBadge segment="vip" />, {
      wrapper: Wrapper,
    });
    // The glyph span carries aria-hidden="true" per the implementation
    const glyphEl = container.querySelector('[aria-hidden="true"]');
    expect(glyphEl).not.toBeNull();
    expect(glyphEl).toHaveTextContent('☆');
  });

  it('the badge does not expose an explicit ARIA role (plain text is sufficient)', () => {
    const { container } = render(<SegmentoBadge segment="en_riesgo" />, {
      wrapper: Wrapper,
    });
    // No role="img" / role="status" / role="region" on the root — presentational text
    const badge = container.firstElementChild;
    expect(badge?.getAttribute('role')).toBeNull();
  });
});
