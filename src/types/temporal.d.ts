/**
 * temporal.d.ts — Minimal ambient declarations for the Temporal API subset used in this project.
 *
 * Temporal is available in Chrome 121+, Safari 17.4+, Node 22+.
 * These declarations make it available to TypeScript without changing the lib target
 * (tsconfig.app.json targets ES2023, which does not include Temporal types).
 *
 * Only the subset actually used in production code is declared here.
 */

declare namespace Temporal {
  interface Instant {
    readonly epochMilliseconds: number;
    toString(): string;
  }

  const Now: {
    instant(): Instant;
  };
}
