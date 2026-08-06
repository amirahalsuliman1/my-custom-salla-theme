/**
 * T-1.07 — SCSS rules. Doc 15's prose, encoded.
 *
 * This is a small, deliberate rule set rather than stylelint-config-standard-scss.
 * Two reasons, and the second is the decisive one.
 *
 * Doc 15's SCSS section is about architecture — design tokens, nesting depth,
 * reusable utilities — not about whitespace. One architectural rule that fails a
 * build is worth more than fifty formatting rules that teach nothing.
 *
 * And: reconciling a shadowed upstream file on an SDK upgrade means diffing it
 * against the pinned baseline. A linter that reformats such a file destroys that
 * diff, and with it the only mechanism /docs/OVERRIDES.md has. So nothing here
 * rewrites code. Every rule below states an architectural fact instead.
 *
 * Lint is ratcheted — only files a commit or PR touches are checked, so untouched
 * upstream code is never linted and adopted code always is. See `lint:changed` in
 * package.json. A full-repo run today reports 443 problems in upstream SCSS; that
 * is the debt the ratchet exists to avoid paying all at once.
 */
module.exports = {
  customSyntax: 'postcss-scss',

  rules: {
    // Doc 15 — "Avoid deeply nested selectors."
    'max-nesting-depth': [
      3,
      {
        ignore: ['blockless-at-rules', 'pseudo-classes'],
        message:
          'Nested more than 3 deep. Doc 15: avoid deeply nested selectors — extract a class.',
      },
    ],

    // CLAUDE.md — "RTL and Arabic first. Never bare left/right."
    // This is the rule T-1.04 could only state as prose. Here it fails a build.
    'property-disallowed-list': [
      [
        'left',
        'right',
        '/^margin-(left|right)$/',
        '/^padding-(left|right)$/',
        '/^border-(left|right)(-.+)?$/',
        '/^scroll-margin-(left|right)$/',
        '/^scroll-padding-(left|right)$/',
      ],
      {
        message:
          'Physical property in an RTL-first theme. Use the logical equivalent — margin-inline-start, padding-inline-end, inset-inline-start, border-inline-end.',
      },
    ],

    // The same rule, for where the side hides in the value rather than the property.
    'declaration-property-value-disallowed-list': [
      {
        'text-align': ['/^(left|right)$/'],
        float: ['/^(left|right)$/'],
        clear: ['/^(left|right)$/'],
      },
      {
        message: 'Physical direction in an RTL-first theme. Use start / end.',
      },
    ],

    // T-1.06 — the theme is mobile-first. A max-width query says "undo this above X",
    // which is the desktop-first shape that task removed.
    'media-feature-name-disallowed-list': [
      ['max-width'],
      {
        message:
          'max-width query. This theme is mobile-first — write the base rule, then @include from-tablet / from-laptop / from-desktop.',
      },
    ],

    // CLAUDE.md — "No raw hex outside the token layer." 01-settings is that layer
    // and is exempted below; everywhere else consumes a token or a CSS variable.
    'color-no-hex': [
      true,
      {
        message: 'Raw hex outside the token layer. Define it in 01-settings and consume the token.',
      },
    ],

    // Doc 15 — "Use consistent folder and file naming" / "Use semantic component names."
    'selector-class-pattern': [
      '^[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$',
      {
        resolveNestedSelectors: true,
        message: 'Class names are kebab-case BEM: block, block__element, block--modifier.',
      },
    ],

    // Doc 15 — "Avoid duplicated logic."
    'no-duplicate-selectors': true,
  },

  overrides: [
    {
      // 01-settings IS the token layer — defining raw colour is its whole job.
      files: ['src/assets/styles/01-settings/**/*.scss'],
      rules: { 'color-no-hex': null },
    },
    {
      // breakpoints.scss holds the max-width shim T-1.06 kept for virtooal.scss.
      // It is the one file allowed a max-width query: it is where the rule against
      // them is implemented.
      files: ['src/assets/styles/01-settings/breakpoints.scss'],
      rules: { 'media-feature-name-disallowed-list': null },
    },
  ],

  ignoreFiles: ['node_modules/**', 'public/**'],
}
