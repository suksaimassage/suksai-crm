/**
 * Prettier Configuration
 *
 * Single source of truth for formatting.
 * ESLint delegates ALL formatting decisions to this file.
 * Do NOT duplicate any of these rules in ESLint.
 */

/** @type {import('prettier').Config} */
export default {
  // ── Core formatting ───────────────────────────────────────────────
  singleQuote: true, // 'string' not "string"
  semi: true, // Always semicolons
  trailingComma: 'all', // Trailing commas in multi-line (cleaner diffs)
  printWidth: 100, // 100-char line width — readable on split screens
  tabWidth: 2, // 2-space indent
  useTabs: false, // Spaces, not tabs

  // ── JSX ───────────────────────────────────────────────────────────
  jsxSingleQuote: false, // <Component prop="value" /> — standard JSX style
  bracketSameLine: false, // JSX closing > on new line
  bracketSpacing: true, // { key: value } not {key: value}

  // ── Arrows ───────────────────────────────────────────────────────
  arrowParens: 'always', // (x) => x  — explicit, consistent

  // ── End of line ───────────────────────────────────────────────────
  endOfLine: 'lf', // Unix line endings — consistent across OS

  // ── Overrides: file-type specific ─────────────────────────────────
  overrides: [
    {
      // JSON: no trailing commas (invalid JSON spec)
      files: ['*.json', '*.jsonc'],
      options: {
        trailingComma: 'none',
        singleQuote: false,
      },
    },
    {
      // Markdown: preserve prose wrapping
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      // YAML: single quote unnecessary
      files: ['*.yaml', '*.yml'],
      options: {
        singleQuote: false,
      },
    },
  ],
};
