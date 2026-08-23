import type { ILegalTocProps } from './LegalToc.types';
import {
  StyledLegalToc,
  StyledLegalTocLabel,
  StyledLegalTocLink,
  StyledLegalTocList,
} from './LegalToc.styles';

/**
 * LegalToc — static table of contents for a legal document.
 *
 * Renders one <nav> landmark with anchor links to each section heading.
 * Scroll-spy / active-section highlighting is explicitly out of scope for
 * this pass (P2 per design spec) — anchors only.
 */
export const LegalToc = ({ items, ariaLabel, label, className }: ILegalTocProps) => (
  <StyledLegalToc aria-label={ariaLabel} className={className}>
    <StyledLegalTocLabel>{label}</StyledLegalTocLabel>
    <StyledLegalTocList>
      {items.map((item) => (
        <li key={item.id}>
          <StyledLegalTocLink href={`#${item.id}`}>{item.heading}</StyledLegalTocLink>
        </li>
      ))}
    </StyledLegalTocList>
  </StyledLegalToc>
);
