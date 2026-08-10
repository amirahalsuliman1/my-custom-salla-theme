/**
 * T-1.07 — what the pre-commit hook runs, and the reason lint is affordable here.
 *
 * lint-staged passes only the staged files, which is the ratchet: untouched
 * upstream code is never linted, and code the theme adopts always is. A full-repo
 * run today reports 443 SCSS problems and 80 JS problems, all of them upstream's.
 * Gating on that would mean either fixing the whole scaffold in a Phase 1 task or
 * turning lint off, and both are worse than linting what you touch.
 */
export default {
  '*.scss': (files) => `stylelint ${files.map((f) => JSON.stringify(f)).join(' ')}`,

  '{src/assets/js/**/*.js,scripts/**/*.mjs,tests/**/*.mjs,*.config.js,eslint.config.mjs}': (
    files,
  ) => `eslint --max-warnings 0 ${files.map((f) => JSON.stringify(f)).join(' ')}`,

  /**
   * T-1.09 — the suite takes no file arguments, and that is deliberate.
   *
   * A test file names the task it covers, not the source file it imports, so
   * there is no mapping from a staged `.js` to «its» test. The whole suite runs
   * in about seven seconds, which is cheaper than maintaining that mapping and
   * cheaper than being wrong about it.
   */
  '{src/assets/js/**/*.js,tests/**/*.mjs}': () => 'pnpm test',

  // The catalogue check validates ar.json against en.json as a pair, so it takes
  // no file arguments — staging either file re-checks both.
  'src/locales/*.json': () => 'node scripts/check-locales.mjs',

  // Lexing all 65 templates takes about as long as starting PHP, so this takes
  // no file arguments either: a template can be broken by an edit to the one it
  // includes, and the whole-tree run costs nothing worth ratcheting.
  'src/views/**/*.twig': () => 'php scripts/lint-twig.php',

  '{*.json,*.mjs,.github/**/*.{yml,yaml},scripts/**}': (files) =>
    `prettier --check --ignore-unknown ${files.map((f) => JSON.stringify(f)).join(' ')}`,
}
