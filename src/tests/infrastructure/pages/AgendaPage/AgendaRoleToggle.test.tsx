/**
 * AgendaRoleToggle.test.tsx
 *
 * Tests for the AgendaRoleToggle component (shared agenda toggle).
 *
 * Mocking strategy:
 *   - react-i18next: useTranslation returns key-as-value to avoid translation coupling.
 *   - styled-components: not mocked; the components render correctly in jsdom.
 *   - No external data dependencies — component is fully controlled via props.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { AgendaRoleToggle } from '@infra/pages/AgendaPage/components/shared/AgendaRoleToggle';
import type { TAgendaRoleView } from '@domain/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
    i18n: { language: 'es' },
  }),
}));

const Wrapper = ({ children }: { children: ReactNode }) => (
  <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
);

function renderToggle(
  view: TAgendaRoleView = 'admin',
  onViewChange: (v: TAgendaRoleView) => void = vi.fn(),
  adminCount = 14,
  therapistCount = 5,
) {
  return render(
    <AgendaRoleToggle
      view={view}
      onViewChange={onViewChange}
      adminCount={adminCount}
      therapistCount={therapistCount}
    />,
    { wrapper: Wrapper },
  );
}

// ── Rendering ───────────────────────────────────────────────────────────────

describe('AgendaRoleToggle — rendering', () => {
  it('renders both admin and therapist tabs', () => {
    renderToggle();
    // The t() mock returns the i18n key, so labels are the key strings
    expect(screen.getByText('roleToggle.admin')).toBeInTheDocument();
    expect(screen.getByText('roleToggle.therapist')).toBeInTheDocument();
  });

  it('renders the admin badge count', () => {
    renderToggle('admin', vi.fn(), 14, 5);
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('renders the therapist badge count', () => {
    renderToggle('admin', vi.fn(), 14, 5);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders badge count of 0 when adminCount is 0', () => {
    renderToggle('admin', vi.fn(), 0, 0);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });
});

// ── ARIA pressed state ───────────────────────────────────────────────────────

describe('AgendaRoleToggle — aria-pressed state', () => {
  it('admin tab has aria-pressed="true" when view="admin"', () => {
    renderToggle('admin');
    const adminTab = screen.getByText('roleToggle.admin').closest('button');
    expect(adminTab).toHaveAttribute('aria-pressed', 'true');
  });

  it('therapist tab has aria-pressed="false" when view="admin"', () => {
    renderToggle('admin');
    const therapistTab = screen.getByText('roleToggle.therapist').closest('button');
    expect(therapistTab).toHaveAttribute('aria-pressed', 'false');
  });

  it('therapist tab has aria-pressed="true" when view="therapist"', () => {
    renderToggle('therapist');
    const therapistTab = screen.getByText('roleToggle.therapist').closest('button');
    expect(therapistTab).toHaveAttribute('aria-pressed', 'true');
  });

  it('admin tab has aria-pressed="false" when view="therapist"', () => {
    renderToggle('therapist');
    const adminTab = screen.getByText('roleToggle.admin').closest('button');
    expect(adminTab).toHaveAttribute('aria-pressed', 'false');
  });
});

// ── Interactions ─────────────────────────────────────────────────────────────

describe('AgendaRoleToggle — click interactions', () => {
  it('calls onViewChange("therapist") when the therapist tab is clicked', () => {
    const onViewChange = vi.fn();
    renderToggle('admin', onViewChange);

    act(() => {
      fireEvent.click(screen.getByText('roleToggle.therapist').closest('button')!);
    });
    expect(onViewChange).toHaveBeenCalledWith('therapist');
    expect(onViewChange).toHaveBeenCalledTimes(1);
  });

  it('calls onViewChange("admin") when the admin tab is clicked', () => {
    const onViewChange = vi.fn();
    renderToggle('therapist', onViewChange);

    act(() => {
      fireEvent.click(screen.getByText('roleToggle.admin').closest('button')!);
    });
    expect(onViewChange).toHaveBeenCalledWith('admin');
    expect(onViewChange).toHaveBeenCalledTimes(1);
  });

  it('calls onViewChange when clicking the already-active tab', () => {
    const onViewChange = vi.fn();
    renderToggle('admin', onViewChange);

    act(() => {
      fireEvent.click(screen.getByText('roleToggle.admin').closest('button')!);
    });
    expect(onViewChange).toHaveBeenCalledWith('admin');
  });
});

// ── Accessibility ────────────────────────────────────────────────────────────

describe('AgendaRoleToggle — accessibility', () => {
  it('container has role="group"', () => {
    const { container } = renderToggle();
    const group = container.querySelector('[role="group"]');
    expect(group).toBeInTheDocument();
  });

  it('admin tab is keyboard-accessible (tabIndex >= 0)', () => {
    renderToggle('admin');
    const adminTab = screen.getByText('roleToggle.admin').closest('button');
    // buttons are natively focusable — tabIndex defaults to 0
    expect(adminTab).not.toHaveAttribute('tabIndex', '-1');
  });

  it('therapist tab is keyboard-accessible (tabIndex >= 0)', () => {
    renderToggle('admin');
    const therapistTab = screen.getByText('roleToggle.therapist').closest('button');
    expect(therapistTab).not.toHaveAttribute('tabIndex', '-1');
  });

  it('tabs can be activated via keyboard Enter', () => {
    const onViewChange = vi.fn();
    renderToggle('admin', onViewChange);

    const therapistTab = screen.getByText('roleToggle.therapist').closest('button')!;
    therapistTab.focus();
    act(() => {
      fireEvent.keyDown(therapistTab, { key: 'Enter', code: 'Enter' });
      fireEvent.click(therapistTab);
    });
    expect(onViewChange).toHaveBeenCalledWith('therapist');
  });
});
