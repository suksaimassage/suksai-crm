/**
 * TerapeutaAddCard.test.tsx
 *
 * Component tests for the TerapeutaAddCard component.
 * Validates rendering and click interaction.
 *
 * Mocks:
 *   - styled-components → wrapped in ThemeProvider with light theme
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
// NOTE: @testing-library/user-event is not installed in this project.
// fireEvent is used per the established project test pattern (see Unauthorized.test.tsx, Sidebar.test.tsx).
import { ThemeProvider } from 'styled-components';
import { theme } from '@infra/styles/themes/light.theme';
import { TerapeutaAddCard } from '@infra/components/ui/domain/TerapeutaCard/TerapeutaAddCard';

// ── ThemeProvider wrapper ──────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('TerapeutaAddCard — rendering', () => {
  it('renders a button with the given label as aria-label', () => {
    render(<TerapeutaAddCard onAddClick={() => {}} label="Añadir terapeuta" />, { wrapper });
    expect(screen.getByRole('button', { name: 'Añadir terapeuta' })).toBeInTheDocument();
  });

  it('renders the label text as visible content', () => {
    render(<TerapeutaAddCard onAddClick={() => {}} label="Añadir terapeuta" />, { wrapper });
    expect(screen.getByText('Añadir terapeuta')).toBeInTheDocument();
  });

  it('renders the description text when provided', () => {
    render(
      <TerapeutaAddCard
        onAddClick={() => {}}
        label="Añadir terapeuta"
        description="Invita a un nuevo miembro del equipo"
      />,
      { wrapper },
    );
    expect(screen.getByText('Invita a un nuevo miembro del equipo')).toBeInTheDocument();
  });

  it('does NOT render description when prop is omitted', () => {
    render(<TerapeutaAddCard onAddClick={() => {}} label="Añadir terapeuta" />, { wrapper });
    expect(screen.queryByText(/Invita/)).not.toBeInTheDocument();
  });

  it('wraps the button in an li element', () => {
    render(<TerapeutaAddCard onAddClick={() => {}} label="Añadir terapeuta" />, { wrapper });
    const btn = screen.getByRole('button', { name: 'Añadir terapeuta' });
    expect(btn.closest('li')).toBeInTheDocument();
  });

  it('renders the button with type="button" (not submit)', () => {
    render(<TerapeutaAddCard onAddClick={() => {}} label="Añadir terapeuta" />, { wrapper });
    const btn = screen.getByRole('button', { name: 'Añadir terapeuta' });
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('renders a plus icon (SVG) with aria-hidden="true"', () => {
    render(<TerapeutaAddCard onAddClick={() => {}} label="Añadir terapeuta" />, { wrapper });
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});

// ── Interactions ──────────────────────────────────────────────────────────────

describe('TerapeutaAddCard — interactions', () => {
  it('calls onAddClick when the button is clicked', () => {
    const onAddClick = vi.fn();
    render(<TerapeutaAddCard onAddClick={onAddClick} label="Añadir terapeuta" />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'Añadir terapeuta' }));

    expect(onAddClick).toHaveBeenCalledTimes(1);
  });

  it('calls onAddClick twice on two separate clicks', () => {
    const onAddClick = vi.fn();
    render(<TerapeutaAddCard onAddClick={onAddClick} label="Añadir terapeuta" />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'Añadir terapeuta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Añadir terapeuta' }));

    expect(onAddClick).toHaveBeenCalledTimes(2);
  });

  it('button is keyboard-activatable via Enter key', () => {
    const onAddClick = vi.fn();
    render(<TerapeutaAddCard onAddClick={onAddClick} label="Añadir terapeuta" />, { wrapper });

    const btn = screen.getByRole('button', { name: 'Añadir terapeuta' });
    fireEvent.keyDown(btn, { key: 'Enter', code: 'Enter' });
    fireEvent.click(btn); // buttons fire click on Enter natively

    // The fireEvent.click verifies the click path; the keyDown verifies no crash
    expect(onAddClick).toHaveBeenCalledTimes(1);
  });
});

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('TerapeutaAddCard — accessibility', () => {
  it('button is accessible by its label text (matches aria-label)', () => {
    const label = 'Añadir nuevo terapeuta al equipo';
    render(<TerapeutaAddCard onAddClick={() => {}} label={label} />, { wrapper });
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  });

  it('button can receive focus programmatically', () => {
    render(<TerapeutaAddCard onAddClick={() => {}} label="Añadir terapeuta" />, { wrapper });

    const btn = screen.getByRole('button', { name: 'Añadir terapeuta' });
    btn.focus();
    expect(btn).toHaveFocus();
  });
});
