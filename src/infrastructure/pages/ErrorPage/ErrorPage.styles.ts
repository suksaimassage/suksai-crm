/**
 * NotFoundPage Styles
 *
 * ✅ CAMBIO: `BackButton` → `BackLink`
 *    El elemento era un `<button>` que navegaba via JS.
 *    Al usar `<Link>` de TanStack Router, el elemento es un `<a>`.
 *    El nombre `BackLink` refleja la semántica correcta.
 *    Los estilos son equivalentes — solo se añade `display: inline-flex`
 *    para que `<a>` se comporte igual que `<button>`.
 */

import styled from 'styled-components';

export const Page = styled.main`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${({ theme }) => theme.color.background.light};
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing['2xl']};
`;

export const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.color.primary[500]};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.border.radius.md};
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: all ${({ theme }) => theme.transition.duration.base}
    ${({ theme }) => theme.transition.timing.easeOut};

  &:hover {
    background: ${({ theme }) => theme.color.primary[600]};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.effect.shadow.primary?.md};
    text-decoration: none;
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }

  /* Focus ring para accesibilidad — token mode-aware, nunca un color fijo */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover,
    &:active {
      transform: none;
    }
  }
`;
