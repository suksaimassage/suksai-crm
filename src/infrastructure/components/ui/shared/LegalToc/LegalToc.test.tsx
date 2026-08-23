/**
 * LegalToc.test.tsx (colocated — design-system component under components/ui/**)
 *
 * LegalToc is a static table-of-contents nav: one <nav aria-label> wrapping an
 * eyebrow label + <ol> of plain <a href="#{id}"> anchor links. No scroll-spy /
 * active-state logic (intentionally out of scope — see LegalToc.tsx comment).
 *
 * No router mocking needed: the anchors are plain <a> tags, not
 * @tanstack/react-router <Link> components.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { LegalToc } from './LegalToc';
import type { ILegalTocItem } from './LegalToc.types';

const ITEMS: readonly ILegalTocItem[] = [
  { id: 'introduccion', heading: 'Introducción y aceptación de los términos' },
  { id: 'descripcion-servicio', heading: 'Descripción del servicio' },
  { id: 'acceso-cuentas', heading: 'Acceso y cuentas' },
];

const renderToc = (items: readonly ILegalTocItem[] = ITEMS) =>
  render(
    <StyledThemeProvider theme={lightTheme}>
      <LegalToc items={items} ariaLabel="Tabla de contenidos" label="En esta página" />
    </StyledThemeProvider>,
  );

describe('LegalToc — nav landmark', () => {
  it('renders a nav with the given aria-label', () => {
    renderToc();
    expect(screen.getByRole('navigation', { name: 'Tabla de contenidos' })).toBeInTheDocument();
  });
});

describe('LegalToc — list items', () => {
  it('renders one <li><a> per item in the same order', () => {
    renderToc();
    const nav = screen.getByRole('navigation', { name: 'Tabla de contenidos' });
    const links = within(nav).getAllByRole('link');

    expect(links).toHaveLength(ITEMS.length);
    links.forEach((link, index) => {
      expect(link).toHaveTextContent(ITEMS[index].heading);
    });
  });

  it('each link has the correct href matching "#{id}"', () => {
    renderToc();
    const nav = screen.getByRole('navigation', { name: 'Tabla de contenidos' });

    for (const item of ITEMS) {
      const link = within(nav).getByRole('link', { name: item.heading });
      expect(link).toHaveAttribute('href', `#${item.id}`);
    }
  });

  it('renders no links when items is empty', () => {
    renderToc([]);
    const nav = screen.getByRole('navigation', { name: 'Tabla de contenidos' });
    expect(within(nav).queryAllByRole('link')).toHaveLength(0);
  });
});

describe('LegalToc — eyebrow label', () => {
  it('renders the label text', () => {
    renderToc();
    expect(screen.getByText('En esta página')).toBeInTheDocument();
  });
});
