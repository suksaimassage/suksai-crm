/**
 * Flex.test.tsx
 *
 * Full automated test suite for the Flex layout compound component.
 * Covers: helper unit tests, DOM rendering, ARIA forwarding, polymorphic `as`,
 * context-driven default tags, ref forwarding, and edge cases.
 *
 * No snapshot tests (project rule).
 * No CSS value assertions via getComputedStyle (jsdom does not execute
 * styled-components CSS-in-JS — only className injection is testable).
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { theme } from '@infra/styles/themes/light.theme';
import { resolveSpacing, resolveResponsive, resolveResponsiveDouble } from './Flex.styles';
import { Flex } from './Flex';
import type { DefaultTheme } from 'styled-components';

// ---------------------------------------------------------------------------
// Test wrapper — provides the styled-components theme to all components
// ---------------------------------------------------------------------------

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const renderWithTheme = (ui: React.ReactElement) => render(ui, { wrapper: TestWrapper });

// ---------------------------------------------------------------------------
// Minimal theme stub for pure helper unit tests (avoids importing full theme)
// ---------------------------------------------------------------------------

const stubTheme = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
  breakpoint: {
    xs: '320px',
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
    '4xl': '2560px',
  },
} as unknown as DefaultTheme;

// ===========================================================================
// 1. resolveSpacing — unit tests
// ===========================================================================

describe('resolveSpacing', () => {
  it('resolves spacing token key "md" to the theme pixel value', () => {
    expect(resolveSpacing('md', stubTheme)).toBe('16px');
  });

  it('resolves spacing token key "sm" to the theme pixel value', () => {
    expect(resolveSpacing('sm', stubTheme)).toBe('8px');
  });

  it('resolves spacing token key "xs" to the theme pixel value', () => {
    expect(resolveSpacing('xs', stubTheme)).toBe('4px');
  });

  it('passes through a raw CSS rem string unchanged', () => {
    expect(resolveSpacing('1.5rem', stubTheme)).toBe('1.5rem');
  });

  it('passes through a raw CSS clamp() string unchanged', () => {
    expect(resolveSpacing('clamp(8px, 2vw, 24px)', stubTheme)).toBe('clamp(8px, 2vw, 24px)');
  });

  it('passes through "0" unchanged (not a spacing key)', () => {
    expect(resolveSpacing('0', stubTheme)).toBe('0');
  });

  it('passes through an arbitrary pixel string not in theme unchanged', () => {
    expect(resolveSpacing('999px', stubTheme)).toBe('999px');
  });
});

// ===========================================================================
// 2. resolveResponsive — unit tests
// ===========================================================================

describe('resolveResponsive', () => {
  it('returns empty string when value is undefined', () => {
    expect(resolveResponsive(undefined, 'flex-direction', stubTheme)).toBe('');
  });

  it('returns a plain CSS rule for a scalar string value', () => {
    const result = resolveResponsive('row', 'flex-direction', stubTheme);
    expect(result).toBe('flex-direction: row;');
  });

  it('returns a plain CSS rule for a scalar numeric value with a resolver', () => {
    const result = resolveResponsive(2, 'flex-grow', stubTheme, (v) => String(v));
    expect(result).toBe('flex-grow: 2;');
  });

  it('emits only base CSS when responsive object has only base key', () => {
    const result = resolveResponsive({ base: 'column' }, 'flex-direction', stubTheme);
    expect(result).toBe('flex-direction: column;');
    expect(result).not.toContain('@media');
  });

  it('emits base CSS and one @media block when object has base + md', () => {
    const result = resolveResponsive({ base: 'column', md: 'row' }, 'flex-direction', stubTheme);
    expect(result).toContain('flex-direction: column;');
    expect(result).toContain('@media (min-width: 768px)');
    expect(result).toContain('flex-direction: row;');
  });

  it('emits only a @media block when object has no base key, only md', () => {
    const result = resolveResponsive({ md: 'row' }, 'flex-direction', stubTheme);
    expect(result).not.toMatch(/^flex-direction/);
    expect(result).toContain('@media (min-width: 768px)');
    expect(result).toContain('flex-direction: row;');
  });

  it('emits breakpoints in mobile-first order (xs before md before lg)', () => {
    const result = resolveResponsive(
      { xs: 'column', md: 'row', lg: 'column-reverse' },
      'flex-direction',
      stubTheme,
    );
    const xsIdx = result.indexOf('320px');
    const mdIdx = result.indexOf('768px');
    const lgIdx = result.indexOf('1024px');
    expect(xsIdx).toBeLessThan(mdIdx);
    expect(mdIdx).toBeLessThan(lgIdx);
  });

  it('stringifies numeric values via resolver (grow = 0)', () => {
    const result = resolveResponsive(0, 'flex-grow', stubTheme, (v) => String(v));
    expect(result).toBe('flex-grow: 0;');
  });

  it('does not emit @media for a breakpoint key absent from theme.breakpoint', () => {
    // 'base' is not a real breakpoint — it should have no @media block emitted
    const result = resolveResponsive({ base: 'wrap', md: 'nowrap' }, 'flex-wrap', stubTheme);
    // 'base' produces bare rule, not @media
    const mediaCount = (result.match(/@media/g) ?? []).length;
    expect(mediaCount).toBe(1);
  });
});

// ===========================================================================
// 3. resolveResponsiveDouble — unit tests
// ===========================================================================

describe('resolveResponsiveDouble', () => {
  it('returns empty string when value is undefined', () => {
    expect(resolveResponsiveDouble(undefined, 'padding-left', 'padding-right', stubTheme)).toBe('');
  });

  it('emits both CSS properties for a scalar spacing token key', () => {
    const result = resolveResponsiveDouble('md', 'padding-left', 'padding-right', stubTheme);
    expect(result).toContain('padding-left: 16px;');
    expect(result).toContain('padding-right: 16px;');
    expect(result).not.toContain('@media');
  });

  it('resolves spacing token for both properties in scalar form', () => {
    const result = resolveResponsiveDouble('sm', 'padding-left', 'padding-right', stubTheme);
    expect(result).toContain('padding-left: 8px;');
    expect(result).toContain('padding-right: 8px;');
  });

  it('passes raw CSS string through to both properties', () => {
    const result = resolveResponsiveDouble('2rem', 'padding-left', 'padding-right', stubTheme);
    expect(result).toContain('padding-left: 2rem;');
    expect(result).toContain('padding-right: 2rem;');
  });

  it('emits both properties inside a @media block for responsive object', () => {
    const result = resolveResponsiveDouble(
      { base: 'sm', md: 'lg' },
      'padding-left',
      'padding-right',
      stubTheme,
    );
    // base rule
    expect(result).toContain('padding-left: 8px;');
    expect(result).toContain('padding-right: 8px;');
    // md breakpoint
    expect(result).toContain('@media (min-width: 768px)');
    expect(result).toContain('padding-left: 24px;');
    expect(result).toContain('padding-right: 24px;');
  });

  it('emits only @media block when responsive object has no base key', () => {
    const result = resolveResponsiveDouble(
      { md: 'md' },
      'padding-top',
      'padding-bottom',
      stubTheme,
    );
    expect(result).not.toMatch(/^padding-top/);
    expect(result).toContain('@media (min-width: 768px)');
    expect(result).toContain('padding-top: 16px;');
    expect(result).toContain('padding-bottom: 16px;');
  });
});

// ===========================================================================
// 4. Flex root — DOM rendering
// ===========================================================================

describe('Flex root — DOM rendering', () => {
  it('renders a div by default', () => {
    renderWithTheme(<Flex data-testid="flex-root" />);
    expect(screen.getByTestId('flex-root').tagName).toBe('DIV');
  });

  it('renders as section when as="section"', () => {
    renderWithTheme(<Flex as="section" data-testid="flex-section" />);
    expect(screen.getByTestId('flex-section').tagName).toBe('SECTION');
  });

  it('renders as nav when as="nav"', () => {
    renderWithTheme(<Flex as="nav" data-testid="flex-nav" />);
    expect(screen.getByTestId('flex-nav').tagName).toBe('NAV');
  });

  it('renders as ul when as="ul"', () => {
    renderWithTheme(<Flex as="ul" data-testid="flex-ul" />);
    expect(screen.getByTestId('flex-ul').tagName).toBe('UL');
  });

  it('renders children correctly', () => {
    renderWithTheme(
      <Flex>
        <span>child text</span>
      </Flex>,
    );
    expect(screen.getByText('child text')).toBeInTheDocument();
  });

  it('forwards data-testid to the DOM element', () => {
    renderWithTheme(<Flex data-testid="my-flex" />);
    expect(screen.getByTestId('my-flex')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    renderWithTheme(
      <Flex>
        <span>first</span>
        <span>second</span>
        <span>third</span>
      </Flex>,
    );
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.getByText('third')).toBeInTheDocument();
  });
});

// ===========================================================================
// 5. Flex root — ARIA attribute forwarding
// ===========================================================================

describe('Flex root — ARIA attributes', () => {
  it('forwards aria-label to the DOM element', () => {
    renderWithTheme(<Flex aria-label="layout container" data-testid="flex" />);
    expect(screen.getByTestId('flex')).toHaveAttribute('aria-label', 'layout container');
  });

  it('forwards aria-labelledby to the DOM element', () => {
    renderWithTheme(<Flex aria-labelledby="heading-id" data-testid="flex" />);
    expect(screen.getByTestId('flex')).toHaveAttribute('aria-labelledby', 'heading-id');
  });

  it('forwards aria-describedby to the DOM element', () => {
    renderWithTheme(<Flex aria-describedby="desc-id" data-testid="flex" />);
    expect(screen.getByTestId('flex')).toHaveAttribute('aria-describedby', 'desc-id');
  });

  it('forwards aria-hidden={true} to the DOM element', () => {
    renderWithTheme(<Flex aria-hidden={true} data-testid="flex" />);
    expect(screen.getByTestId('flex')).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards aria-live="polite" to the DOM element', () => {
    renderWithTheme(<Flex aria-live="polite" data-testid="flex" />);
    expect(screen.getByTestId('flex')).toHaveAttribute('aria-live', 'polite');
  });

  it('forwards role="region" to the DOM element', () => {
    renderWithTheme(<Flex role="region" data-testid="flex" />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('forwards tabIndex={0} to the DOM element', () => {
    renderWithTheme(<Flex tabIndex={0} data-testid="flex" />);
    expect(screen.getByTestId('flex')).toHaveAttribute('tabindex', '0');
  });

  it('forwards id to the DOM element', () => {
    renderWithTheme(<Flex id="my-flex" data-testid="flex" />);
    expect(screen.getByTestId('flex')).toHaveAttribute('id', 'my-flex');
  });
});

// ===========================================================================
// 6. Flex root — styled-components class injection (display)
// ===========================================================================

describe('Flex root — styled-components class injection', () => {
  it('renders with a styled-components class (display: flex base style injected)', () => {
    renderWithTheme(<Flex data-testid="flex" />);
    const el = screen.getByTestId('flex');
    // styled-components always injects at least one class onto the element
    expect(el.className.length).toBeGreaterThan(0);
  });

  it('renders without errors when display="inline-flex" is provided', () => {
    expect(() => renderWithTheme(<Flex display="inline-flex" data-testid="flex" />)).not.toThrow();
  });

  it('renders without errors when display prop is omitted (defaults to flex)', () => {
    expect(() => renderWithTheme(<Flex data-testid="flex" />)).not.toThrow();
  });
});

// ===========================================================================
// 7. Flex.Item — DOM rendering
// ===========================================================================

describe('Flex.Item — DOM rendering', () => {
  it('renders a div by default when outside any Flex container', () => {
    renderWithTheme(<Flex.Item data-testid="item" />);
    expect(screen.getByTestId('item').tagName).toBe('DIV');
  });

  it('renders as li by default when parent Flex has as="ul"', () => {
    renderWithTheme(
      <Flex as="ul">
        <Flex.Item data-testid="item">text</Flex.Item>
      </Flex>,
    );
    expect(screen.getByTestId('item').tagName).toBe('LI');
  });

  it('renders as li by default when parent Flex has as="ol"', () => {
    renderWithTheme(
      <Flex as="ol">
        <Flex.Item data-testid="item">text</Flex.Item>
      </Flex>,
    );
    expect(screen.getByTestId('item').tagName).toBe('LI');
  });

  it('renders as div when parent Flex has as="section" (non-list)', () => {
    renderWithTheme(
      <Flex as="section">
        <Flex.Item data-testid="item">text</Flex.Item>
      </Flex>,
    );
    expect(screen.getByTestId('item').tagName).toBe('DIV');
  });

  it('renders as div when parent Flex has as="nav" (non-list)', () => {
    renderWithTheme(
      <Flex as="nav">
        <Flex.Item data-testid="item">text</Flex.Item>
      </Flex>,
    );
    expect(screen.getByTestId('item').tagName).toBe('DIV');
  });

  it('consumer-provided as="div" overrides context-derived li inside ul parent', () => {
    renderWithTheme(
      <Flex as="ul">
        <Flex.Item as="div" data-testid="item">
          text
        </Flex.Item>
      </Flex>,
    );
    expect(screen.getByTestId('item').tagName).toBe('DIV');
  });

  it('consumer-provided as="span" is respected regardless of context', () => {
    renderWithTheme(
      <Flex as="ul">
        <Flex.Item as="span" data-testid="item">
          text
        </Flex.Item>
      </Flex>,
    );
    expect(screen.getByTestId('item').tagName).toBe('SPAN');
  });

  it('renders children correctly', () => {
    renderWithTheme(
      <Flex>
        <Flex.Item>item content</Flex.Item>
      </Flex>,
    );
    expect(screen.getByText('item content')).toBeInTheDocument();
  });
});

// ===========================================================================
// 8. Flex.Item — ARIA attribute forwarding
// ===========================================================================

describe('Flex.Item — ARIA attributes', () => {
  it('forwards aria-label to the DOM element', () => {
    renderWithTheme(
      <Flex>
        <Flex.Item aria-label="item label" data-testid="item" />
      </Flex>,
    );
    expect(screen.getByTestId('item')).toHaveAttribute('aria-label', 'item label');
  });

  it('forwards aria-hidden to the DOM element', () => {
    renderWithTheme(
      <Flex>
        <Flex.Item aria-hidden={true} data-testid="item" />
      </Flex>,
    );
    expect(screen.getByTestId('item')).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards tabIndex to the DOM element', () => {
    renderWithTheme(
      <Flex>
        <Flex.Item tabIndex={-1} data-testid="item" />
      </Flex>,
    );
    expect(screen.getByTestId('item')).toHaveAttribute('tabindex', '-1');
  });
});

// ===========================================================================
// 9. Flex.Item — context interaction
// ===========================================================================

describe('Flex.Item — context interaction', () => {
  it('Flex.Item outside any Flex uses context default and renders as div', () => {
    renderWithTheme(<Flex.Item data-testid="standalone" />);
    expect(screen.getByTestId('standalone').tagName).toBe('DIV');
  });

  it('FlexContext is provided by FlexRoot and consumed by FlexItem (ul → li)', () => {
    renderWithTheme(
      <Flex as="ul" data-testid="list">
        <Flex.Item data-testid="list-item" />
      </Flex>,
    );
    expect(screen.getByTestId('list-item').tagName).toBe('LI');
  });

  it('nested Flex inside Flex.Item uses inner context (inner item renders as li)', () => {
    renderWithTheme(
      <Flex as="section" data-testid="outer">
        <Flex.Item data-testid="outer-item">
          <Flex as="ul" data-testid="inner">
            <Flex.Item data-testid="inner-item" />
          </Flex>
        </Flex.Item>
      </Flex>,
    );
    // outer item is inside section → div
    expect(screen.getByTestId('outer-item').tagName).toBe('DIV');
    // inner item is inside ul → li
    expect(screen.getByTestId('inner-item').tagName).toBe('LI');
  });

  it('inner Flex.Item does not pick up outer ul context (no context leakage)', () => {
    renderWithTheme(
      <Flex as="ul" data-testid="outer-ul">
        <Flex.Item data-testid="outer-item">
          <Flex as="div" data-testid="inner-flex">
            <Flex.Item data-testid="inner-item" />
          </Flex>
        </Flex.Item>
      </Flex>,
    );
    // inner item is inside a plain div Flex, not ul → should be div
    expect(screen.getByTestId('inner-item').tagName).toBe('DIV');
  });
});

// ===========================================================================
// 10. Compound component API
// ===========================================================================

describe('Flex — compound component', () => {
  it('Flex.Item is accessible as a property of Flex', () => {
    expect(Flex.Item).toBeDefined();
    expect(typeof Flex.Item).toBe('function');
  });

  it('Flex and Flex.Item can be used from the barrel index import', async () => {
    // Dynamic import of the barrel to verify the named export resolves
    const module = await import('./index');
    expect(module.Flex).toBeDefined();
    expect(module.Flex.Item).toBeDefined();
  });

  it('Flex itself is a function (callable component)', () => {
    expect(typeof Flex).toBe('function');
  });
});

// ===========================================================================
// 11. Ref forwarding (React 19 ref-as-prop)
// ===========================================================================

describe('Flex — ref forwarding', () => {
  it('ref on Flex points to the underlying DOM element', () => {
    const ref = React.createRef<HTMLDivElement>();
    renderWithTheme(<Flex ref={ref} data-testid="flex-ref" />);
    const el = screen.getByTestId('flex-ref');
    expect(ref.current).toBe(el);
  });

  it('ref on Flex with as="section" points to the section element', () => {
    const ref = React.createRef<HTMLElement>();
    renderWithTheme(<Flex as="section" ref={ref} data-testid="flex-section-ref" />);
    const el = screen.getByTestId('flex-section-ref');
    expect(ref.current).toBe(el);
  });

  it('ref on Flex.Item points to the underlying DOM element', () => {
    const ref = React.createRef<HTMLDivElement>();
    renderWithTheme(
      <Flex>
        <Flex.Item ref={ref} data-testid="item-ref" />
      </Flex>,
    );
    const el = screen.getByTestId('item-ref');
    expect(ref.current).toBe(el);
  });

  it('ref on Flex.Item inside ul points to the li element', () => {
    const ref = React.createRef<HTMLLIElement>();
    renderWithTheme(
      <Flex as="ul">
        <Flex.Item as="li" ref={ref} data-testid="li-ref" />
      </Flex>,
    );
    const el = screen.getByTestId('li-ref');
    expect(ref.current).toBe(el);
    expect(el.tagName).toBe('LI');
  });
});

// ===========================================================================
// 12. Polymorphic `as` with native HTML attributes
// ===========================================================================

describe('Flex — polymorphic as with native attributes', () => {
  it('when as="form", onSubmit handler is called on form submission', () => {
    const handleSubmit = vi.fn((e: React.SyntheticEvent) => {
      e.preventDefault();
    });
    renderWithTheme(
      <Flex as="form" onSubmit={handleSubmit} data-testid="flex-form">
        <button type="submit">Submit</button>
      </Flex>,
    );
    fireEvent.submit(screen.getByTestId('flex-form'));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('when as="button", onClick handler fires on click', () => {
    const handleClick = vi.fn();
    renderWithTheme(
      <Flex as="button" onClick={handleClick} data-testid="flex-button">
        Click me
      </Flex>,
    );
    fireEvent.click(screen.getByTestId('flex-button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('when as="form" renders with correct tag', () => {
    renderWithTheme(<Flex as="form" data-testid="flex-form" />);
    expect(screen.getByTestId('flex-form').tagName).toBe('FORM');
  });

  it('when as="button" renders with correct tag', () => {
    renderWithTheme(<Flex as="button" data-testid="flex-button" />);
    expect(screen.getByTestId('flex-button').tagName).toBe('BUTTON');
  });
});

// ===========================================================================
// 13. Edge cases
// ===========================================================================

describe('Flex — edge cases', () => {
  it('Flex with no children renders without error', () => {
    expect(() => renderWithTheme(<Flex />)).not.toThrow();
  });

  it('Flex with null children renders without error', () => {
    expect(() => renderWithTheme(<Flex>{null}</Flex>)).not.toThrow();
  });

  it('Flex.Item with no children renders without error', () => {
    expect(() =>
      renderWithTheme(
        <Flex>
          <Flex.Item />
        </Flex>,
      ),
    ).not.toThrow();
  });

  it('multiple Flex.Item inside Flex as="ul" all render as li', () => {
    renderWithTheme(
      <Flex as="ul" data-testid="list">
        <Flex.Item data-testid="item-a" />
        <Flex.Item data-testid="item-b" />
        <Flex.Item data-testid="item-c" />
      </Flex>,
    );
    expect(screen.getByTestId('item-a').tagName).toBe('LI');
    expect(screen.getByTestId('item-b').tagName).toBe('LI');
    expect(screen.getByTestId('item-c').tagName).toBe('LI');
  });

  it('Flex > Flex.Item > Flex > Flex.Item — each item uses its direct parent context', () => {
    renderWithTheme(
      <Flex as="ul" data-testid="depth-outer">
        <Flex.Item data-testid="depth-outer-item">
          <Flex as="ol" data-testid="depth-inner">
            <Flex.Item data-testid="depth-inner-item" />
          </Flex>
        </Flex.Item>
      </Flex>,
    );
    expect(screen.getByTestId('depth-outer-item').tagName).toBe('LI');
    expect(screen.getByTestId('depth-inner-item').tagName).toBe('LI');
  });

  it('Flex.Item inside a non-list Flex with null as prop falls back to div', () => {
    renderWithTheme(
      <Flex data-testid="plain-flex">
        <Flex.Item data-testid="plain-item" />
      </Flex>,
    );
    expect(screen.getByTestId('plain-item').tagName).toBe('DIV');
  });

  it('Flex renders correctly with all layout props passed (smoke test)', () => {
    expect(() =>
      renderWithTheme(
        <Flex
          direction="row"
          wrap="wrap"
          justify="center"
          align="stretch"
          alignContent="flex-start"
          gap="md"
          rowGap="sm"
          columnGap="lg"
          padding="md"
          paddingX="sm"
          paddingY="lg"
          display="flex"
          width="100%"
          height="auto"
          minWidth="0"
          maxWidth="1200px"
          overflow="hidden"
          data-testid="full-flex"
        />,
      ),
    ).not.toThrow();
  });

  it('Flex.Item renders correctly with all item props passed (smoke test)', () => {
    expect(() =>
      renderWithTheme(
        <Flex>
          <Flex.Item
            grow={1}
            shrink={0}
            basis="auto"
            order={2}
            alignSelf="center"
            flex="1 0 auto"
            width="50%"
            minWidth="0"
            maxWidth="100%"
            data-testid="full-item"
          />
        </Flex>,
      ),
    ).not.toThrow();
  });
});
