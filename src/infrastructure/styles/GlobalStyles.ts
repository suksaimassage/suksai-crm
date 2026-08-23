/**
 * GlobalStyles.ts — Application-wide CSS baseline
 *
 * SRP: CSS reset + body baseline + accessibility primitives.
 * Component-level styling lives in component .styles.ts files.
 */

import { createGlobalStyle } from 'styled-components';

import ManropeVariable from '@infra/styles/fonts/Manrope/static/Manrope-Regular.woff2';
import CormorantVariable from '@infra/styles/fonts/Cormorant_Garamond/static/CormorantGaramond-Regular.woff2';
import CormorantItalicVariable from '@infra/styles/fonts/Cormorant_Garamond/static/CormorantGaramond-Italic.woff2';
import JetBrainsMonoVariable from '@infra/styles/fonts/JetBrains_Mono/static/JetBrainsMono-Regular.woff2';

export const GlobalStyles = createGlobalStyle`
  /* ── Local font-face declarations ──────────────────────────────────────── */

  @font-face {
    font-family: 'Manrope';
    src: url(${ManropeVariable}) format('woff2');
    font-weight: 200 800;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Cormorant Garamond';
    src: url(${CormorantVariable}) format('woff2');
    font-weight: 300 700;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Cormorant Garamond';
    src: url(${CormorantItalicVariable}) format('woff2');
    font-weight: 300 700;
    font-style: italic;
    font-display: swap;
  }

  @font-face {
    font-family: 'JetBrains Mono';
    src: url(${JetBrainsMonoVariable}) format('woff2');
    font-weight: 100 800;
    font-style: normal;
    font-display: swap;
  }

  /* ── Reset ──────────────────────────────────────────────────────────────── */

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    /* Standard (Firefox + modern) scrollbar styling — keep thin and themed.
       WebKit equivalents live in the ::-webkit-scrollbar rules below. */
    scrollbar-width: thin;
    scrollbar-color: ${({ theme }) => theme.color.scrollbar.scrollbarThumb} transparent;
  }

  html {
    font-size: 16px;
    height: 100%;
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  body {
    font-family: ${({ theme }) => theme.typography.font.body};
    font-size: ${({ theme }) => theme.typography.size.md};
    font-weight: ${({ theme }) => theme.typography.weight.regular};
    line-height: 1.5;
    color: ${({ theme }) => theme.color.text.primary};
    background-color: ${({ theme }) => theme.color.background.neutral};
    min-height: 100%;
    overflow-x: hidden;
    transition:
      background-color ${({ theme }) => theme.transition.duration.base} ${({ theme }) => theme.transition.timing.easeOut},
      color ${({ theme }) => theme.transition.duration.base} ${({ theme }) => theme.transition.timing.easeOut};
    font-feature-settings: 'kern' 1;
    font-kerning: normal;
  }

  #root {
    min-height: 100dvh;
    isolation: isolate;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${({ theme }) => theme.typography.font.display};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    line-height: 1.2;
    color: ${({ theme }) => theme.color.text.primary};
  }

  p {
    line-height: 1.6;
    color: ${({ theme }) => theme.color.text.secondary};
  }

  a {
    color: ${({ theme }) => theme.color.text.link};
    text-decoration: none;
    transition: opacity ${({ theme }) => theme.transition.duration.fast} ${({ theme }) => theme.transition.timing.easeOut};
  }

  a:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  code, pre, kbd, samp {
    font-family: ${({ theme }) => theme.typography.font.mono};
    font-size: ${({ theme }) => theme.typography.size.sm};
  }

  pre {
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  button {
    cursor: pointer;
    font-family: inherit;
    border: none;
    background: transparent;
  }

  button:disabled {
    cursor: not-allowed;
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  img, picture, video, canvas, svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.intent.focusRing};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.border.radius.xs};
  }

  :focus:not(:focus-visible) {
    outline: none;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.color.scrollbar.scrollbarThumb};
    border-radius: ${({ theme }) => theme.border.radius.full};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.color.scrollbar.scrollbarThumbHover};
  }

  ::selection {
    background-color: ${({ theme }) => theme.color.intent.primary};
    color: ${({ theme }) => theme.color.text.inverse};
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;
