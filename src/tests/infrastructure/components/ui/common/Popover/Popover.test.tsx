/**
 * Popover.test.tsx — shared-kit a11y contract for the surface `role` and the
 * trigger `aria-haspopup` (WCAG 4.1.2 name/role/value).
 *
 * Regression context: the container used to hardcode role="tooltip" and
 * buildTriggerProps used to hardcode aria-haspopup="true", clobbering whatever
 * the caller declared on its trigger child. These tests lock in:
 *   - the surface role defaults to 'tooltip' and follows the `role` prop;
 *   - a child's own aria-haspopup is PRESERVED (never overwritten);
 *   - when the child declares none, aria-haspopup is DERIVED from `role`
 *     ('dialog' → "dialog", default tooltip → "true");
 *   - aria-expanded / aria-controls injection is unchanged and aria-controls
 *     points at the surface id.
 *
 * Mock strategy: NONE — Popover is self-contained. The surface renders into a
 * document.body portal, so role queries hit `screen`. Plain-string content keeps
 * the trigger the only button in the tree. styled-components needs the theme.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { Popover } from '@infra/components/ui/common/Popover';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
);

// ── Surface role (the portaled container) ──────────────────────────────────────

describe('Popover — surface role', () => {
  it('defaults the open surface to role="tooltip"', () => {
    render(
      <Popover open trigger="manual" content="Tooltip copy">
        <button type="button">Trigger</button>
      </Popover>,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('applies role="dialog" to the open surface when role="dialog"', () => {
    render(
      <Popover open trigger="manual" role="dialog" content="Dialog body">
        <button type="button">Trigger</button>
      </Popover>,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

// ── Surface accessible name (ariaLabel) ────────────────────────────────────────
// axe-core: "ARIA dialog and alertdialog nodes should have an accessible name".
// PopoverHeader's visible title is NOT wired to the container, so the name is
// supplied via the `ariaLabel` prop → aria-label on the portaled surface.

describe('Popover — surface accessible name (ariaLabel)', () => {
  it('names the dialog surface via ariaLabel (resolvable by getByRole name)', () => {
    render(
      <Popover
        open
        trigger="manual"
        role="dialog"
        ariaLabel="Detalle de la cita"
        content="Dialog body"
      >
        <button type="button">Trigger</button>
      </Popover>,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('dialog', { name: 'Detalle de la cita' })).toBeInTheDocument();
  });

  it('emits no aria-label on the surface when ariaLabel is omitted', () => {
    render(
      <Popover open trigger="manual" role="dialog" content="Dialog body">
        <button type="button">Trigger</button>
      </Popover>,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-label');
  });
});

// ── Trigger aria-haspopup (no longer clobbered) ────────────────────────────────

describe('Popover — trigger aria-haspopup', () => {
  it('preserves the child’s own aria-haspopup instead of clobbering it', () => {
    // role left at the tooltip default → without the fix the trigger would report
    // "true"; the child explicitly asks for "dialog" and must win.
    render(
      <Popover content="body">
        <button type="button" aria-haspopup="dialog">
          Trigger
        </button>
      </Popover>,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
  });

  it('derives aria-haspopup="dialog" from role when the child declares none', () => {
    render(
      <Popover role="dialog" content="body">
        <button type="button">Trigger</button>
      </Popover>,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
  });

  it('falls back to aria-haspopup="true" for the default tooltip role (backward compatible)', () => {
    render(
      <Popover content="body">
        <button type="button">Trigger</button>
      </Popover>,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute(
      'aria-haspopup',
      'true',
    );
  });
});

// ── aria-expanded / aria-controls injection preserved ──────────────────────────

describe('Popover — aria-expanded / aria-controls', () => {
  it('keeps injecting aria-expanded reflecting the open state', () => {
    const { rerender } = render(
      <Popover open={false} trigger="manual" role="dialog" content="body">
        <button type="button">Trigger</button>
      </Popover>,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    rerender(
      <Popover open trigger="manual" role="dialog" content="body">
        <button type="button">Trigger</button>
      </Popover>,
    );
    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('wires aria-controls on the trigger to the id of the open surface', () => {
    render(
      <Popover open trigger="manual" role="dialog" content="body">
        <button type="button">Trigger</button>
      </Popover>,
      { wrapper: Wrapper },
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const surface = screen.getByRole('dialog');
    const controls = trigger.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(surface).toHaveAttribute('id', controls);
  });
});

// ── Composition: the popover's own handler does not drop the child's ───────────

describe('Popover — trigger handler composition (unchanged)', () => {
  it('toggles open on click while still firing the child onClick', () => {
    let childClicks = 0;
    render(
      <Popover content="body" role="dialog">
        <button
          type="button"
          onClick={() => {
            childClicks += 1;
          }}
        >
          Trigger
        </button>
      </Popover>,
      { wrapper: Wrapper },
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    // Closed initially → no dialog surface.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(childClicks).toBe(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
