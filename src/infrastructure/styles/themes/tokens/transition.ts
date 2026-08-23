/**
 * tokens/transition.ts — Motion timing tokens
 *
 * All durations in ms. All timing functions expressed as CSS cubic-bezier
 * strings so they can be dropped directly into transition shorthand.
 *
 * Rule: enter transitions use easeOut, exit transitions use easeIn.
 * Rule: no animation exceeds 500ms (the `slower` token is the ceiling).
 */

export const transitionDuration = {
  fast: '150ms', // micro-interactions: hover color, focus ring
  base: '200ms', // button press, toggle, input focus border
  slow: '300ms', // dropdown open, tab switch, card expand
  slower: '500ms', // page transition, modal enter/exit
} as const;

export const transitionTiming = {
  ease: 'ease',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  drawer: 'cubic-bezier(0.32, 0.72, 0, 1)', // panel slide-in — deceleration curve
} as const;

export type TransitionDurationToken = typeof transitionDuration;
export type TransitionTimingToken = typeof transitionTiming;
