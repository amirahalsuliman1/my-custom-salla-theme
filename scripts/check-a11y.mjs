#!/usr/bin/env node
/**
 * T-8.06 — the machine-checkable third of WCAG, made a build failure.
 *
 * BUDGETS.md §1 says it plainly: automated checks find roughly a third of WCAG
 * issues at best, and this script does not pretend otherwise. The keyboard pass,
 * the screen-reader pass and the RTL focus order are in `/docs/MANUAL-QA.md` §2
 * and are the substance of T-8.06. **This is the part that can run on every
 * commit**, so that the two thirds a person has to check by hand do not have to
 * be re-checked because of a regression a regex could have caught.
 *
 * WHAT THE AUDIT FOUND, WHICH IS WHY THIS IS A RATCHET AND NOT A FIX-UP. Every
 * `<img>` in `src/views` already carries `alt`. Every link and every button
 * already has an accessible name. There is no positive `tabindex` anywhere and
 * no `aria-hidden` on a focusable element. The theme passes today; the value
 * here is that it cannot stop passing quietly.
 *
 * TWO HALVES, AND THE FIRST IS THE ONE WORTH READING.
 *
 *   §1 CONTRAST, RECOMPUTED FROM THE TOKENS THEMSELVES rather than trusted from
 *      a table. `/docs/DERIVED-DECISIONS.md` carries a contrast table computed by
 *      hand under T-2.01 and recomputed under T-2.17. A table is a claim about
 *      values as they were on the day it was written. This reads the hexes out
 *      of `01-settings/global.scss`, resolves the `var()` aliases, and computes
 *      WCAG 2.1 relative luminance — so editing a token to a prettier shade
 *      fails the build naming the criterion it broke, instead of silently
 *      falsifying a document.
 *
 *   §2 THE STATIC SCAN — the handful of WCAG failures that are visible in markup
 *      without rendering it: a missing `alt`, a control with no accessible name,
 *      a positive `tabindex`, `aria-hidden` on something focusable, a misspelled
 *      ARIA attribute.
 *
 * TWO PARSING TRAPS, BOTH HIT WHILE WRITING THIS, BOTH WORTH KNOWING:
 *
 *   · **Twig comments must be blanked, not deleted.** `{# ... #}` blocks in this
 *     repository are long and discuss markup at length — the first draft matched
 *     two `<img>` tags that exist only inside prose. They are replaced with
 *     spaces so line numbers in an error message point at the real line.
 *   · **`<img alt>` IS an accessible name.** A link wrapping nothing but an image
 *     is named by that image. Stripping tags before checking for text makes every
 *     logo link in the theme look nameless, which is six false positives and a
 *     script nobody trusts.
 *
 * Run by `pnpm run lint:a11y`, and inside `pnpm run lint`.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const VIEWS = path.join(ROOT, 'src/views')
const TOKENS = path.join(ROOT, 'src/assets/styles/01-settings/global.scss')

const problems = []
const fail = (where, message) => problems.push(`${where}\n    ${message}`)

/* ────────────────────────────────────────────────────────────────────────────
 * §1 — Contrast, against the tokens as they are right now.
 * ──────────────────────────────────────────────────────────────────────────── */

/** WCAG 2.1 relative luminance. The 0.03928/12.92 form, not an approximation. */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Contrast ratio, rounded to two places the way the documented table states it. */
function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
}

/** Expand `#abc` so the luminance slicing above is safe on either form. */
const expand = (hex) =>
  hex.length === 4 ? `#${[1, 2, 3].map((i) => hex[i].repeat(2)).join('')}` : hex.toLowerCase()

/**
 * Read `--token: value` out of the settings layer and resolve one level of
 * `var(--other)`. `--border-interactive` and `--surface-control` are both
 * aliases of `--text-secondary` on purpose — T-2.19's "three roles, one value" —
 * so a checker that could not follow an alias would skip the two tokens most
 * likely to be edited.
 */
function readTokens() {
  const source = fs.readFileSync(TOKENS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ')
  const raw = new Map()

  /**
   * ONLY THE `:root` BLOCK, AND THIS WAS A REAL BUG BEFORE IT WAS A COMMENT.
   * The file ends with `.dark { --focus-ring-color: var(--surface-card); }`, so
   * a scan of the whole file takes the *last* definition and resolves the light
   * ring to white — which then "fails" at 1:1 on a white card. The ratio was
   * right and the token was wrong. Dark mode has its own surfaces and is not
   * modelled here; these pairs are the light palette, which is what the
   * documented table measures.
   */
  const start = source.indexOf(':root')
  const open = source.indexOf('{', start)
  let depth = 0
  let end = open
  while (end < source.length) {
    if (source[end] === '{') depth += 1
    else if (source[end] === '}' && --depth === 0) break
    end += 1
  }
  const rootBlock = source.slice(open, end)

  for (const [, name, value] of rootBlock.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    raw.set(name, value.trim())
  }

  const resolve = (name, depth = 0) => {
    const value = raw.get(name)
    if (value === undefined || depth > 4) return undefined
    const alias = value.match(/^var\(\s*(--[\w-]+)\s*\)$/)
    if (alias) return resolve(alias[1], depth + 1)
    return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value) ? expand(value) : undefined
  }

  return { get: (name) => resolve(name), has: (name) => raw.has(name) }
}

/**
 * THE PAIRS ARE THE ONES `/docs/DERIVED-DECISIONS.md` STATES, and each carries
 * the threshold and the criterion it is held to — so a failure message says
 * *which rule* broke rather than only that a number moved.
 *
 * `min: null` marks a pair the documentation deliberately exempts. Those are
 * still computed and still compared against the recorded figure: the exemption
 * is an argument about 1.4.11's scope, and it stops being valid if the number
 * itself drifts from the one the argument was made about.
 */
const PAIRS = [
  // Foreground · background · documented ratio · threshold · why
  ['--main-text-color', '--surface-page', 16.93, 4.5, '1.4.3 — ink on the page'],
  ['--main-text-color', '--surface-section', 15.95, 4.5, '1.4.3 — ink on a section panel'],
  ['--main-text-color', '--surface-card', 17.22, 4.5, '1.4.3 — ink on a card'],
  ['--main-text-color', '--accent-soft', 14.35, 4.5, '1.4.3 — ink on the soft wash'],
  ['--text-secondary', '--surface-page', 5.9, 4.5, '1.4.3 — secondary text on the page'],
  ['--text-secondary', '--surface-section', 5.56, 4.5, '1.4.3 — secondary text on a panel'],
  ['--text-secondary', '--surface-card', 6.0, 4.5, '1.4.3 — secondary text on a card'],
  ['--text-secondary', '--accent-soft', 5.0, 4.5, '1.4.3 — secondary text on the wash'],
  ['--border-interactive', '--surface-page', 5.9, 3, '1.4.11 — control boundary on the page'],
  ['--border-interactive', '--surface-section', 5.56, 3, '1.4.11 — control boundary on a panel'],
  ['--border-interactive', '--surface-card', 6.0, 3, '1.4.11 — control boundary on a card'],
  ['--border-interactive', '--accent-soft', 5.0, 3, '1.4.11 — control boundary on the wash'],
  ['--focus-ring-color', '--surface-page', 16.93, 3, '1.4.11 + 2.4.7 — focus ring on the page'],
  ['--focus-ring-color', '--surface-card', 17.22, 3, '1.4.11 + 2.4.7 — focus ring on a card'],
  ['--surface-card', '--color-error', 6.36, 4.5, '1.4.3 — white on the destructive button'],
  ['--surface-card', '--surface-control', 6.0, 4.5, '1.4.3 — white on the filled neutral control'],
  /**
   * T-8.13 — the two merchant pairs that CAN be pinned.
   *
   * Both resolve today to ink on the section panel, because `--text-header`
   * aliases `--main-text-color` and `--surface-header` aliases
   * `--surface-section`. Pinning them is not redundant with the rows above:
   * those alias chains are exactly what a future edit would break, and a header
   * whose ink and surface drifted toward each other would fail here rather than
   * on a merchant's store.
   *
   * ⚠ THIS CHECKS THE DEFAULTS AND CANNOT CHECK A MERCHANT'S VALUES. AC-13 is
   * the full argument; the short version is that these settings are chosen in
   * Salla's dashboard months after this script last ran.
   *
   * ⚠ THE BUTTON AND ICON PAIRS ARE DELIBERATELY ABSENT, and their absence is a
   * decision rather than an oversight. `--color-button-bg` and
   * `--color-button-text` alias `--color-primary` / `--color-primary-reverse`,
   * whose values in this file are the scaffold's fallbacks — **the platform
   * overwrites both on every real store**, from the merchant's own store
   * colour. Pinning a ratio between two values that never ship together would
   * fail the build the day someone corrected a fallback, while proving nothing
   * about any storefront. `--color-icon` is `currentColor` and has no ratio at
   * all until it is in a context.
   */
  ['--text-header', '--surface-header', 15.95, 4.5, '1.4.3 — header ink on the header bar'],
  ['--text-footer', '--surface-footer', 15.95, 4.5, '1.4.3 — footer ink on the footer panel'],
  /**
   * T-3.03 and T-3.10 — two more merchant pairs, pinned for the same reason as
   * the two above: the alias chain is what a future edit breaks.
   *
   * ⚠ The announcement bar is the one pair in this table that starts closest to
   * the line. Its ink is `--text-secondary` (#646361) rather than the page ink,
   * because the artboard draws the bar as secondary text — so it ships at
   * **6.00:1** where every other text pair here is above 15. It still clears
   * 1.4.3 comfortably, but it has the least room, and a merchant darkening the
   * bar's background is the likeliest way anything in this theme goes under 4.5.
   */
  ['--announcement-text', '--announcement-bg', 6.0, 4.5, '1.4.3 — the announcement bar'],
  ['--whatsapp-fab-icon', '--whatsapp-fab-bg', 17.22, 4.5, '1.4.3 — the floating button'],
  // Exempt by recorded argument, still pinned to their documented values.
  [
    '--border-subtle',
    '--surface-page',
    1.17,
    null,
    'decorative trim — never a control boundary (T-2.01 ruling)',
  ],
  [
    '--color-success',
    '--accent-success-soft',
    2.66,
    null,
    '1.4.11 exempt — redundant with the sentence beside it at 5.90:1 (T-2.12)',
  ],
]

function checkContrast() {
  const tokens = readTokens()

  for (const [fg, bg, documented, min, why] of PAIRS) {
    const a = tokens.get(fg)
    const b = tokens.get(bg)

    if (!a || !b) {
      fail(
        `contrast · ${fg} on ${bg}`,
        `token missing or no longer a hex in 01-settings/global.scss. If it was ` +
          `renamed, rename it here too — a pair that cannot be read is not a pair that passes.`,
      )
      continue
    }

    const measured = ratio(a, b)

    if (min !== null && measured < min) {
      fail(
        `contrast · ${fg} (${a}) on ${bg} (${b})`,
        `${measured}:1 — below the ${min}:1 that WCAG ${why} requires.`,
      )
      continue
    }

    // The documented figure is checked even where the pair is exempt: the
    // exemption is an argument about a specific number, and it expires with it.
    if (Math.abs(measured - documented) > 0.01) {
      fail(
        `contrast · ${fg} (${a}) on ${bg} (${b})`,
        `measures ${measured}:1, but /docs/DERIVED-DECISIONS.md records ${documented}:1. ` +
          `A token moved. Update the table and this row together, or put the token back — ` +
          `context: ${why}.`,
      )
    }
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * §2 — The static scan.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * UPSTREAM TEMPLATES THIS THEME HAS NEVER ADOPTED, listed rather than fixed —
 * the same policy `check-images.mjs` states and for the same reason: editing one
 * means shadowing it and buying `/docs/OVERRIDES.md` a row that has to be
 * reconciled by hand on every SDK upgrade. That is a real, recurring cost, and
 * it is not worth paying for a page this theme's design does not contain.
 *
 * Each entry names the defect, so the list cannot quietly grow into a way of
 * silencing the checker on files the theme *does* own.
 */
const EXCEPTIONS = new Map([
  [
    'pages/blog/index.twig',
    'upstream — the search-clear button is an icon with no accessible name. ' +
      'The blog was ruled out entirely by B6 on 2026-08-06; this template is not reachable ' +
      'from this theme’s design and has never been adopted.',
  ],
])

/** Replace a match with spaces, preserving newlines, so line numbers stay true. */
const blank = (match) => match.replace(/[^\n]/g, ' ')

/** The ARIA attributes and roles this theme uses. A typo is silent in a browser. */
const ARIA_ATTRIBUTES = new Set([
  'aria-atomic',
  'aria-busy',
  'aria-checked',
  'aria-controls',
  'aria-current',
  'aria-describedby',
  'aria-details',
  'aria-disabled',
  'aria-expanded',
  'aria-haspopup',
  'aria-hidden',
  'aria-invalid',
  'aria-label',
  'aria-labelledby',
  'aria-level',
  'aria-live',
  'aria-modal',
  'aria-orientation',
  'aria-placeholder',
  'aria-posinset',
  'aria-pressed',
  'aria-readonly',
  'aria-relevant',
  'aria-required',
  'aria-roledescription',
  'aria-selected',
  'aria-setsize',
  'aria-sort',
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
  'aria-valuetext',
])

const ROLES = new Set([
  'alert',
  'alertdialog',
  'banner',
  'button',
  'checkbox',
  'complementary',
  'contentinfo',
  'dialog',
  'group',
  'img',
  'link',
  'list',
  'listitem',
  'main',
  'menu',
  'menuitem',
  'navigation',
  'none',
  'presentation',
  'progressbar',
  'region',
  'search',
  'separator',
  'status',
  'switch',
  'tab',
  'tablist',
  'tabpanel',
  'toolbar',
  'tooltip',
])

const INTERACTIVE = /^(a|button|input|select|textarea|summary)$/i

function templates(dir = VIEWS) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return templates(full)
    return entry.name.endsWith('.twig') ? [full] : []
  })
}

/**
 * Does this element have an accessible name? Text content counts, a Twig
 * expression counts (it renders to text), `aria-label`/`aria-labelledby`/`title`
 * count, and — the case worth stating — a nested `<img>` with a non-empty `alt`
 * counts, because that is exactly how every logo and brand link in this theme
 * is named.
 */
function hasAccessibleName(attributes, body) {
  const attrs = attributes.toLowerCase()
  if (/\baria-label(ledby)?\s*=|(^|\s)title\s*=/.test(attrs)) return true
  if (/<img[^>]*\balt\s*=\s*["'][^"']/i.test(body)) return true

  const text = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{\{[\s\S]*?\}\}/g, 'X') // a rendered expression is text
    .replace(/\{%[\s\S]*?%\}/g, ' ') // a control tag is not
    .trim()

  return text.length > 0
}

function scanTemplates() {
  for (const file of templates()) {
    const name = path.relative(VIEWS, file).split(path.sep).join('/')

    if (EXCEPTIONS.has(name)) continue

    const source = fs
      .readFileSync(file, 'utf8')
      .replace(/\{#[\s\S]*?#\}/g, blank) // prose about markup is not markup
      .replace(/<svg[\s\S]*?<\/svg>/gi, blank) // SVG <title> is a name, not a doc title

    const line = (index) => source.slice(0, index).split('\n').length
    const at = (index) => `${name}:${line(index)}`

    for (const match of source.matchAll(/<img\b[^>]*>/gi)) {
      if (!/\balt\s*=/.test(match[0])) {
        fail(
          at(match.index),
          '<img> with no alt attribute. WCAG 1.1.1. A decorative image needs alt="" — ' +
            'explicitly empty, so a screen reader knows to skip it rather than read the filename.',
        )
      }
    }

    for (const match of source.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
      const [, tag, attributes, body] = match
      if (!hasAccessibleName(attributes, body)) {
        fail(
          at(match.index),
          `<${tag}> with no accessible name. WCAG 4.1.2 / 2.4.4. Give it text, an ` +
            'aria-label, or a nested <img> with real alt text.',
        )
      }
    }

    for (const match of source.matchAll(/\btabindex\s*=\s*["']?(-?\d+)/gi)) {
      if (Number(match[1]) > 0) {
        fail(
          at(match.index),
          `tabindex="${match[1]}". WCAG 2.4.3 — a positive tabindex jumps ahead of the ` +
            'document order and reorders the tab sequence for the whole page, not just here.',
        )
      }
    }

    for (const match of source.matchAll(
      /<(\w+)\b([^>]*\baria-hidden\s*=\s*["']true["'][^>]*)>/gi,
    )) {
      const [, tag, attributes] = match
      /**
       * `tabindex="-1"` TAKES IT OUT OF THE TAB ORDER, WHICH MAKES THE PAIRING
       * CORRECT RATHER THAN WRONG. `cart.twig`'s media link is the second link
       * to the same product — the title beside it is the first — so it is hidden
       * from assistive technology *and* removed from the sequence. That is the
       * textbook treatment of a duplicate link, and flagging it was this
       * checker's bug, not the template's.
       */
      const removed = /\btabindex\s*=\s*["']?-\d/.test(attributes)
      const focusable =
        !removed && (INTERACTIVE.test(tag) || /\btabindex\s*=\s*["']?0/.test(attributes))
      if (focusable) {
        fail(
          at(match.index),
          `<${tag} aria-hidden="true"> is still focusable. WCAG 4.1.2 — the element stays ` +
            'in the tab order but has no name and no role, so a screen-reader user lands ' +
            'on nothing. Remove aria-hidden or take it out of the tab order.',
        )
      }
    }

    for (const match of source.matchAll(/\b(aria-[a-z]+)\s*=/gi)) {
      const attribute = match[1].toLowerCase()
      if (!ARIA_ATTRIBUTES.has(attribute)) {
        fail(
          at(match.index),
          `${attribute} is not an ARIA attribute. A misspelled one is silent — the browser ` +
            'keeps it, the accessibility tree ignores it, and nothing reports it. If it is ' +
            'real and new to this theme, add it to ARIA_ATTRIBUTES here.',
        )
      }
    }

    for (const match of source.matchAll(/\brole\s*=\s*["']([a-z][a-z ]*)["']/gi)) {
      for (const role of match[1].trim().split(/\s+/)) {
        if (!ROLES.has(role)) {
          fail(
            at(match.index),
            `role="${role}" is not a role this theme knows. Same silence as a misspelled ` +
              'aria-* attribute. If it is real, add it to ROLES here.',
          )
        }
      }
    }
  }
}

/* ──────────────────────────────────────────────────────────────────────────── */

checkContrast()
scanTemplates()

if (problems.length > 0) {
  console.error(`\n✖ check-a11y — ${problems.length} problem(s)\n`)
  for (const problem of problems) console.error(`  ${problem}\n`)
  console.error(
    '  This script covers roughly a third of WCAG. The keyboard, screen-reader and\n' +
      '  RTL focus-order passes are /docs/MANUAL-QA.md §2 and are not checked here.\n',
  )
  process.exit(1)
}

const skipped = EXCEPTIONS.size === 0 ? '' : `, ${EXCEPTIONS.size} upstream template(s) excepted`
console.log(
  `✔ check-a11y — ${PAIRS.length} contrast pairs recomputed from the token layer, ` +
    `${templates().length} templates scanned${skipped}.`,
)
