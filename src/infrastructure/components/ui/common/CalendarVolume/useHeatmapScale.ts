import type { IHeatmapScale } from './CalendarVolume.types';

interface IRGB {
  r: number;
  g: number;
  b: number;
}

const TEXT_HIGH = 'oklch(0.97 0.01 67)'; // theme.color.text.inverse
const TEXT_LOW = 'oklch(0.11 0.03 204)'; // theme.color.text.primary

/** 5-stop teal gradient: near-white → deep ocean teal */
const STOPS: readonly { at: number; color: IRGB }[] = [
  { at: 0, color: { r: 246, g: 237, b: 224 } }, // primary 100 (#f6ede0)
  { at: 0.25, color: { r: 227, g: 200, b: 172 } }, // primary 300 (#e3c8ac)
  { at: 0.5, color: { r: 192, g: 145, b: 90 } }, // primary 500 (#c0915a)
  { at: 0.75, color: { r: 135, g: 87, b: 48 } }, // primary 700 (#875730)
  { at: 1, color: { r: 63, g: 36, b: 16 } }, // primary 900 (#3f2410)
] as const;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerpN = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

const interpolate = (intensity: number): IRGB => {
  const t = clamp(intensity, 0, 1);
  for (let i = 0; i < STOPS.length - 1; i++) {
    const lo = STOPS[i];
    const hi = STOPS[i + 1];
    if (t >= lo.at && t <= hi.at) {
      const f = (t - lo.at) / (hi.at - lo.at);
      return {
        r: lerpN(lo.color.r, hi.color.r, f),
        g: lerpN(lo.color.g, hi.color.g, f),
        b: lerpN(lo.color.b, hi.color.b, f),
      };
    }
  }
  return STOPS[STOPS.length - 1].color;
};

export const useHeatmapScale = (maxValue: number): IHeatmapScale => {
  const gradientCss = `linear-gradient(to right, ${STOPS.map((s) => `rgb(${s.color.r}, ${s.color.g}, ${s.color.b}) ${s.at * 100}%`).join(', ')})`;

  return {
    maxValue,
    gradientCss,
    getColor: (intensity: number): string => {
      if (intensity <= 0) return 'transparent';
      const { r, g, b } = interpolate(intensity);
      return `rgb(${r}, ${g}, ${b})`;
    },
    getTextColor: (intensity: number): string => (intensity >= 0.45 ? TEXT_HIGH : TEXT_LOW),
  };
};
