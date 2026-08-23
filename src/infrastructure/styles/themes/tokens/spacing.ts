/**
 * tokens/spacing.ts — Spacing design tokens
 *
 * Base unit: 4px — all values are multiples of 4.
 * Named semantically so callsites communicate intent, not pixels.
 */

export const spacing = {
  xxs: '2px', // micro gap — icon padding
  xs: '4px', // tight — badge padding
  sm: '8px', // small — internal component padding
  md: '16px', // base — standard padding, gap
  lg: '24px', // loose — section padding
  xl: '32px', // extra — card padding, vertical rhythm
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
  '5xl': '128px',
  '6xl': '192px',
  '7xl': '256px',
  '8xl': '384px',
} as const;

export type SpacingToken = typeof spacing;
export type SpacingKey = keyof SpacingToken;
