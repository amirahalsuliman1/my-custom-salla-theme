/**
 * T-1.07 — JS rules.
 *
 * The backlog named `.eslintrc`. ESLint 10 removed eslintrc support entirely, so
 * this is flat config; the deliverable is the same and the filename is not.
 *
 * Same restraint as .stylelintrc.js, for the same reason: nothing here reformats
 * code, because a reformatted upstream file cannot be diffed against the pinned
 * baseline and /docs/OVERRIDES.md reconciliation depends on that diff. The rules
 * state facts about correctness and about doc 15's architecture.
 *
 * Lint is ratcheted to files a commit or PR touches — see `lint:changed` in
 * package.json.
 */
import js from '@eslint/js'
import globals from 'globals'

export default [
  {
    ignores: ['node_modules/**', 'public/**', 'docs/**'],
  },

  js.configs.recommended,

  {
    files: ['src/assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // Injected by the platform at runtime, not imported. Twilight's SDK,
        // its web components, and the globals master.twig sets on window.
        salla: 'readonly',
        app: 'readonly',
      },
    },
    rules: {
      // Doc 15 — "Single responsibility" / "Keep components small and reusable."
      // Depth and parameter count are the two parts of that which a linter can
      // actually see. Both are generous: they catch the outliers, not the norm.
      'max-depth': ['error', 4],
      'max-params': ['error', 4],

      // Doc 15 — "Avoid duplicated logic." A redeclared binding is the cheapest
      // form of it and the easiest to miss in a long file.
      'no-var': 'error',
      'prefer-const': 'error',

      // Correctness, and the recommended set is not strict enough on these two:
      // an unused parameter is usually a signature that drifted from its caller.
      'no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      eqeqeq: ['error', 'smart'],
    },
  },

  {
    // Build and tooling config: Node, CommonJS, and none of the above.
    files: [
      '*.config.js',
      '.*rc.js',
      'webpack.config.js',
      'postcss.config.js',
      'tailwind.config.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },

  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },

  {
    /**
     * T-1.09 — the tests.
     *
     * Node *and* browser globals, because that is what a test here genuinely
     * has: it runs under Node, and `harness/dom.mjs` installs a jsdom window
     * over the top of it before the code under test is imported.
     *
     * `max-depth` and `max-params` are doc 15 rules about the shape of theme
     * code and say nothing useful about a test fixture, so they are not applied
     * here rather than being suppressed case by case in the files.
     */
    files: ['tests/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],
    },
  },
]
