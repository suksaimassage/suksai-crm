/**
 * ESLint Flat Config — Hexagonal Architecture Project
 *
 * Priority stack (last rule wins):
 *   1. JS recommended
 *   2. TypeScript strict
 *   3. React Hooks + Refresh
 *   4. Prettier (MUST be last — disables all formatting rules)
 *
 * SRP: each config block owns exactly one concern.
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // ── 1. Global ignores ────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '.tanstack/**',
      'src/routeTree.gen.ts', // auto-generated — never lint
      'scripts/**',
      '.agents/**', // skill tooling scripts (e.g. impeccable) — not project source; type-aware rules have no tsconfig for them
      '.claude/**', // project tooling/docs — not application source
    ],
  },

  // ── 2. Base JS recommended ────────────────────────────────────────
  js.configs.recommended,

  // ── 3. TypeScript strict (type-aware) ────────────────────────────
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // ── 4. React + DX rules ──────────────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ── React Hooks ──────────────────────────────────────────────
      ...reactHooks.configs.recommended.rules,

      // ── React Refresh (HMR safety) ───────────────────────────────
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // ── TypeScript quality ───────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // ── Nullish / safety ─────────────────────────────────────────
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // ── Async correctness ────────────────────────────────────────
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // ── Code hygiene ─────────────────────────────────────────────
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      // logger.ts is the sole authorised console wrapper (eslint-disable inside).
      'no-console': 'error',

      // ── Allow numbers in template literals (styled-components fontWeight tokens) ──
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],

      // ── Hexagonal Architecture guard ─────────────────────────────
      // Prevents domain layer from importing React or infrastructure.
      // Uses @typescript-eslint/no-restricted-imports which supports
      // the `patterns` API in ESLint 10 flat config.
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '.*/infrastructure/.*',
              message: '[Hex] domain/ must not import from infrastructure/. Use ports instead.',
            },
            {
              regex: '.*/application/.*',
              message: '[Hex] domain/ must not import from application/. Use ports instead.',
            },
          ],
        },
      ],

      // ── Prettier (formatting — always last) ──────────────────────
      'prettier/prettier': 'error',
    },
  },

  // ── 4b. Domain purity — alias-aware + framework-free ────────────
  // The deep-path regex in block 4 cannot see the `@infra` / `@app` path
  // aliases, so an aliased import from domain/ slipped through. domain/ may
  // import ONLY from domain/; this scoped rule enforces that against the
  // aliases too. (domain/ depends on adapters via injected ports, never imports.)
  // Additionally, domain/ must be pure TypeScript — no React, styled-components,
  // Zustand, i18next, Supabase, or TanStack packages allowed.
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message:
                '[Hex] domain/ must not import framework packages. Domain is pure TypeScript.',
            },
            {
              name: 'react-dom',
              message:
                '[Hex] domain/ must not import framework packages. Domain is pure TypeScript.',
            },
            {
              name: 'styled-components',
              message:
                '[Hex] domain/ must not import framework packages. Domain is pure TypeScript.',
            },
            {
              name: 'zustand',
              message:
                '[Hex] domain/ must not import framework packages. Domain is pure TypeScript.',
            },
            {
              name: 'i18next',
              message:
                '[Hex] domain/ must not import framework packages. Domain is pure TypeScript.',
            },
            {
              name: 'react-i18next',
              message:
                '[Hex] domain/ must not import framework packages. Domain is pure TypeScript.',
            },
          ],
          patterns: [
            {
              regex: '^@infra(/|$)',
              message: '[Hex] domain/ must not import from infrastructure (@infra). Use a port.',
            },
            {
              regex: '^@app(/|$)',
              message: '[Hex] domain/ must not import from application (@app). Use a port.',
            },
            {
              regex: '.*/infrastructure/.*',
              message: '[Hex] domain/ must not import from infrastructure/. Use a port.',
            },
            {
              regex: '.*/application/.*',
              message: '[Hex] domain/ must not import from application/. Use a port.',
            },
            {
              regex: '^@supabase(/|$)',
              message:
                '[Hex] domain/ must not import framework packages. Domain is pure TypeScript.',
            },
            {
              regex: '^@tanstack(/|$)',
              message:
                '[Hex] domain/ must not import framework packages. Domain is pure TypeScript.',
            },
          ],
        },
      ],
    },
  },

  // ── 5. Test files — relaxed rules ────────────────────────────────
  {
    files: ['src/tests/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // Tests legitimately use console for debugging output.
      'no-console': 'off',
      // Test setup files use intentional noop functions as browser API polyfills
      // (ResizeObserver, matchMedia, etc.) — empty bodies are by design.
      '@typescript-eslint/no-empty-function': 'off',
      // vi.fn() and vi.spyOn() return `any`-typed values; the unsafe-* family
      // of rules fires on every mock call/return. Production code is fully typed;
      // these relaxations are scoped to test files only.
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // Mocks that simulate thenables use async callbacks in .mockImplementation;
      // the void-return constraint is not meaningful in this context.
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },

  // ── 5b. Route files — TanStack Router throw-redirect pattern ─────
  // TanStack Router's canonical navigation pattern inside beforeLoad/loader
  // is `throw redirect(...)` and `throw notFound()` — these are not Error
  // instances but are the officially documented API. The only-throw-error rule
  // must be relaxed for route files where this pattern is used.
  {
    files: ['src/application/routes/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/only-throw-error': 'off',
    },
  },

  // ── 6. Config files (vite, eslint itself) ────────────────────────
  {
    files: ['*.config.{ts,js,mjs}', '.eslintrc.*'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // ── 6b. Disable type-aware rules where there is no type info ──────
  // Type-aware configs (block 3) apply globally, but parserOptions.project
  // (block 4) only covers src/**. Root config files and plain JS have no
  // tsconfig type info, so type-aware rules crash on them. Turning those
  // rules off for exactly these files leaves src/** fully type-checked.
  {
    files: ['**/*.{js,mjs,cjs}', '**/*.config.{ts,cts,mts}'],
    ...tseslint.configs.disableTypeChecked,
  },

  // ── 7. Prettier config disables all ESLint formatting rules ──────
  // MUST be the final spread — never add formatting rules after this
  prettierConfig,
);
