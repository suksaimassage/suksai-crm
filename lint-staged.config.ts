/**
 * lint-staged configuration
 *
 * Runs only on staged files — keeps pre-commit hooks fast.
 * Add "lint-staged" to devDependencies and add to package.json:
 *
 *   "prepare": "husky"
 *
 * Then: npx husky init && echo "npx lint-staged" > .husky/pre-commit
 */

/** @type {import('lint-staged').Config} */
export default {
  // TypeScript + TSX: lint then format
  'src/**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  // JSON, MD: format only
  '*.{json,md,yaml,yml}': ['prettier --write'],
};
