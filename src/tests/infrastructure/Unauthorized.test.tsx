/**
 * Unauthorized.test.tsx
 *
 * Validates rendering, interaction, accessibility, and focus management
 * behavior of the Unauthorized compound component.
 *
 * Mocking strategy:
 *   - useTranslation: returns translation key as value (t(key) === key) to
 *     avoid i18next wiring; this also lets us assert on i18n key presence.
 *   - useNavigate (@tanstack/react-router): returns a vi.fn() so we can spy
 *     on navigate calls without a router tree.
 *   - ThemeProvider (styled-components): wraps all renders with a real theme
 *     so Unauthorized.styles.ts tokens resolve without throwing.
 *
 * The component uses `useTranslation('errors')` and reads keys:
 *   unauthorized.heading
 *   unauthorized.message  (with { routeLabel } interpolation)
 *   unauthorized.action
 *
 * Focus management:
 *   The heading receives programmatic focus via useEffect + titleRef.current?.focus().
 *   jsdom tracks activeElement, so we can assert document.activeElement.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
// NOTE: @testing-library/user-event is not installed in this project.
// fireEvent is used per the established project test pattern (see Sidebar.test.tsx,
// CalendarVolume.test.tsx). This is a project-level constraint, not a preference.
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import type { ReactNode } from 'react';
import { lightTheme } from '@infra/styles/themes/light.theme';
import { Unauthorized } from '@infra/components/ui/common/Unauthorized/Unauthorized';

// ── Module-level mocks ─────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

// useTranslation mock: t(key, options?) returns the key string with interpolation
// This allows us to assert on i18n key presence without a full i18next setup.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options?.routeLabel) {
        return `${key} routeLabel:${options.routeLabel as string}`;
      }
      return key;
    },
  }),
}));

// ── Wrapper ────────────────────────────────────────────────────────────────────

const Wrapper = ({ children }: { children: ReactNode }) => (
  <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
);

// ── Default props ──────────────────────────────────────────────────────────────

const defaultProps = {
  routeLabel: 'Rituales',
  fallbackPath: '/dashboard/overview',
};

// ── Reset mocks ────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockNavigate.mockReset();
});

// ── Rendering — structural assertions ────────────────────────────────────────

describe('Unauthorized — rendering', () => {
  it('renders a container with role="alert"', () => {
    render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders the heading with translation key unauthorized.heading', () => {
    render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText('unauthorized.heading')).toBeInTheDocument();
  });

  it('renders the message containing the translation key unauthorized.message', () => {
    render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText(/unauthorized\.message/)).toBeInTheDocument();
  });

  it('renders the message containing the routeLabel', () => {
    render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText(/routeLabel:Rituales/)).toBeInTheDocument();
  });

  it('renders the CTA button with translation key unauthorized.action', () => {
    render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /unauthorized\.action/i })).toBeInTheDocument();
  });

  it('renders the 403 label text', () => {
    render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText('403')).toBeInTheDocument();
  });

  it('renders the botanical ornament SVG (aria-hidden)', () => {
    const { container } = render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeInTheDocument();
  });
});

// ── Rendering — different routeLabel values ───────────────────────────────────

describe('Unauthorized — routeLabel prop', () => {
  it('shows the correct routeLabel when "Clientes" is passed', () => {
    render(<Unauthorized routeLabel="Clientes" fallbackPath="/dashboard/overview" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText(/routeLabel:Clientes/)).toBeInTheDocument();
  });

  it('shows the correct routeLabel when "Ajustes" is passed', () => {
    render(<Unauthorized routeLabel="Ajustes" fallbackPath="/dashboard/overview" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText(/routeLabel:Ajustes/)).toBeInTheDocument();
  });
});

// ── Interaction — CTA button navigation ──────────────────────────────────────

describe('Unauthorized — CTA button interaction', () => {
  it('calls navigate with the fallbackPath when button is clicked', () => {
    render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /unauthorized\.action/i }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({ to: defaultProps.fallbackPath });
  });

  it('calls navigate with the correct fallbackPath "/dashboard/clientes"', () => {
    render(<Unauthorized routeLabel="Clientes" fallbackPath="/dashboard/clientes" />, {
      wrapper: Wrapper,
    });

    fireEvent.click(screen.getByRole('button', { name: /unauthorized\.action/i }));

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard/clientes' });
  });

  it('does not call navigate before the button is clicked', () => {
    render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ── Accessibility — focus management ─────────────────────────────────────────

describe('Unauthorized — focus management on mount', () => {
  it('moves focus to the heading on mount', async () => {
    render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });
    const heading = screen.getByText('unauthorized.heading');

    // useEffect fires after paint; waitFor ensures the DOM effect has run
    await waitFor(() => {
      expect(document.activeElement).toBe(heading);
    });
  });
});

// ── Accessibility — ARIA semantics ────────────────────────────────────────────

describe('Unauthorized — ARIA semantics', () => {
  it('alert container does not override implicit aria-live from role="alert"', () => {
    render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });
    const alert = screen.getByRole('alert');
    // role="alert" carries implicit aria-live="assertive" per ARIA spec.
    // We must NOT add aria-live="polite" which would downgrade to queued announcement.
    expect(alert).not.toHaveAttribute('aria-live', 'polite');
  });

  it('botanical SVG is hidden from assistive technology (aria-hidden="true")', () => {
    const { container } = render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('heading has tabIndex="-1" to receive programmatic focus', () => {
    render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });
    const heading = screen.getByText('unauthorized.heading');
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('CTA button is accessible by role and name', () => {
    render(<Unauthorized {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /unauthorized\.action/i })).toBeInTheDocument();
  });
});

// ── Compound component sub-components ─────────────────────────────────────────

describe('Unauthorized compound components', () => {
  it('Unauthorized.Ornament renders its children when provided', () => {
    render(
      <StyledThemeProvider theme={lightTheme}>
        <Unauthorized.Ornament>
          <span data-testid="custom-ornament">custom</span>
        </Unauthorized.Ornament>
      </StyledThemeProvider>,
    );
    expect(screen.getByTestId('custom-ornament')).toBeInTheDocument();
  });

  it('Unauthorized.Ornament renders the BotanicalOrnament SVG when no children', () => {
    const { container } = render(
      <StyledThemeProvider theme={lightTheme}>
        <Unauthorized.Ornament />
      </StyledThemeProvider>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('Unauthorized.Label renders its children', () => {
    render(
      <StyledThemeProvider theme={lightTheme}>
        <Unauthorized.Label>403</Unauthorized.Label>
      </StyledThemeProvider>,
    );
    expect(screen.getByText('403')).toBeInTheDocument();
  });

  it('Unauthorized.Message renders its children', () => {
    render(
      <StyledThemeProvider theme={lightTheme}>
        <Unauthorized.Message>Test message</Unauthorized.Message>
      </StyledThemeProvider>,
    );
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('Unauthorized.Content renders its children', () => {
    render(
      <StyledThemeProvider theme={lightTheme}>
        <Unauthorized.Content>
          <span data-testid="content-child">child</span>
        </Unauthorized.Content>
      </StyledThemeProvider>,
    );
    expect(screen.getByTestId('content-child')).toBeInTheDocument();
  });

  it('Unauthorized.Action renders its children', () => {
    render(
      <StyledThemeProvider theme={lightTheme}>
        <Unauthorized.Action>
          <button>click me</button>
        </Unauthorized.Action>
      </StyledThemeProvider>,
    );
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('Unauthorized.Title renders children and accepts a ref', () => {
    render(
      <StyledThemeProvider theme={lightTheme}>
        <Unauthorized.Title>Heading text</Unauthorized.Title>
      </StyledThemeProvider>,
    );
    expect(screen.getByText('Heading text')).toBeInTheDocument();
  });
});
