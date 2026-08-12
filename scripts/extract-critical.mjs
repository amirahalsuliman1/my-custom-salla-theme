#!/usr/bin/env node
/**
 * T-8.01, second half — the above-fold rules, cut out of `app.css` so first
 * paint no longer waits for a network round trip.
 *
 * WHAT THE OWNER RULED, AND WHY IT MATTERS HERE. The fold on Home is **the
 * announcement bar, the header and the hero cover** — not the header alone. The
 * hero is a full-bleed image directly under the bar, and shipping it unstyled
 * means the visitor's first frame is a raw `<img>` with no scrim, no overlay
 * header and no quote. That ruling is what this file encodes, in `SURFACE`.
 *
 * ── THE METHOD, STATED PLAINLY BECAUSE IT IS NOT THE OBVIOUS ONE ────────────
 *
 * The usual way to do this is to render the page in a headless browser and ask
 * it which rules the above-fold boxes actually used. **There is no browser in
 * this repository** — no Chromium, no Playwright, only `jsdom`, which parses
 * markup and never lays anything out. So this script does NOT observe a
 * rendered page. It derives the above-fold DOM **statically, from the Twig
 * templates that produce it**, and keeps every rule that could match it.
 *
 * That difference is the whole safety argument, and it runs in one direction:
 *
 *   · A browser tells you the *minimum* set. Anything it missed — a hover
 *     state, a breakpoint you did not render at, a class JavaScript adds a
 *     second later — is simply absent, and the page paints wrong.
 *   · Static matching gives a *superset*. Every rule whose selector could
 *     match the above-fold markup is kept, at every breakpoint and in every
 *     state, whether or not that state was reachable on the day it ran.
 *
 * **Over-inclusion costs bytes. Under-inclusion costs a wrong first frame.**
 * Every judgement call below is resolved toward over-inclusion, deliberately,
 * and each one says so at the point it is made.
 *
 * WHAT THIS CANNOT SEE, AND WHAT COVERS IT. Markup injected by a script — the
 * platform's web components hydrating, a class added on scroll — is invisible
 * to a template scan. Two things cover it: `SURFACE` lists the JavaScript that
 * runs above the fold alongside the templates, so the classes it toggles are
 * scanned like any other; and the `s-*` rules those components need already
 * live in `salla-components.css`, which is a separate sheet and not this
 * script's business. What remains is on the manual checklist, because a repo
 * that cannot render a page also cannot prove one painted correctly.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

// Both outputs are arguments, for the same reason `split-css.mjs` takes one: a
// test that wrote the real `public/` — or, worse, the real Twig partial — would
// leave the working tree holding a stylesheet built out of fixtures, and the
// partial is the file the whole store's first paint comes from.
const PUBLIC = path.resolve(process.argv[2] || 'public')
const SOURCE = path.join(PUBLIC, 'app.css')
const TARGET = path.join(PUBLIC, 'critical.css')
const PARTIAL = path.resolve(process.argv[3] || 'src/views/components/critical-css.twig')

/**
 * THE ABOVE-FOLD SURFACE. Each entry is here for a stated reason; this list is
 * the task's ruling written down, and changing it changes what first paint
 * gets. It is checked for existence at run time — a renamed template that
 * silently dropped out of the scan would shrink the critical sheet without
 * failing anything, which is the quiet way this kind of file rots.
 */
const SURFACE = [
  // The document shell itself: the classes on <html>, <body> and `.app-inner`,
  // which every above-fold box is laid out inside.
  'src/views/layouts/master.twig',
  // The bar above the header. First thing drawn on Home.
  'src/views/components/announcement-bar.twig',
  // The header, and the skip link that precedes it.
  'src/views/components/header/header.twig',
  // The icon entry point, included by the header's burger and search buttons.
  // Its Tailwind size classes are written here and nowhere else.
  'src/views/components/ui/icon.twig',
  // The cover. The owner's ruling is that this is above the fold.
  'src/views/components/home/hero.twig',
  // Not a template. `sticky-header.js` toggles `store-header--stuck` on scroll,
  // and that class appears in no Twig file — the one above-fold class a
  // template-only scan would miss.
  'src/assets/js/partials/sticky-header.js',
]

/**
 * Names assembled at render time from a setting, so they appear in no file as
 * a whole word and the token scan cannot see them. Every case is listed with
 * the interpolation that produces it. These are the only three.
 */
const COMPOSED = [
  // master.twig: button-style-{{ theme.settings.get('button_style', 'rounded') }}
  'button-style-rounded',
  'button-style-pill',
  'button-style-square',
  // master.twig: footer_is_dark ? ' footer-is-dark' : ' footer-is-light'
  'footer-is-dark',
  'footer-is-light',
  // master.twig: sticky_add_to_cart ? ' is-sticky-product-bar' : ''
  'is-sticky-product-bar',
]

const kb = (n) => (n / 1024).toFixed(1) + ' KB'
const gzip = (s) => zlib.gzipSync(Buffer.from(s), { level: 9 }).length

if (!fs.existsSync(SOURCE)) {
  console.error(
    `✗ extract-critical: ${path.relative(process.cwd(), SOURCE)} not found — run the build first.`,
  )
  process.exit(1)
}

const missing = SURFACE.filter((f) => !fs.existsSync(path.resolve(f)))
if (missing.length) {
  console.error('✗ extract-critical: the above-fold surface names files that do not exist:')
  for (const f of missing) console.error(`    ${f}`)
  console.error('  A renamed template must be renamed here too, or first paint quietly loses it.')
  process.exit(1)
}

// ── the surface ────────────────────────────────────────────────────────────

/**
 * Comments are stripped before tokenising, and it is worth saying why rather
 * than treating it as hygiene. The templates in this theme carry long prose
 * headers that name other components by their class — `.s-block__panel`,
 * `floating-menu.scss`, `product-card`. Tokenising the comments would pull
 * every one of those into the surface and quietly drag their stylesheets into
 * the critical path. The comment is documentation; the markup is the surface.
 */
const stripComments = (src) =>
  src
    .replace(/\{#[\s\S]*?#\}/g, ' ') // Twig
    .replace(/\/\*[\s\S]*?\*\//g, ' ') // block
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ') // line, without eating `https://`

/**
 * Deliberately every token, not only the contents of `class="…"`.
 *
 * A narrower scan would have to understand `{% include … with { class: … } %}`,
 * `{{ cond ? 'a' : 'b' }}` and `{% set body %}…{% endset %}` — three forms this
 * header alone uses — and would drop a class the moment a fourth appeared. The
 * cost of the wide scan is a few rules kept for a word that merely looked like
 * a class name; the cost of the narrow one is a missing style. Same direction
 * as everything else in this file. It is also exactly the test Tailwind itself
 * used to decide to generate the class in the first place.
 */
const CANDIDATE = /[A-Za-z0-9_@:/[\]().,%#!-]{2,}/g

const surfaceTokens = new Set(COMPOSED)
for (const file of SURFACE) {
  const src = stripComments(fs.readFileSync(path.resolve(file), 'utf8'))
  for (const t of src.match(CANDIDATE) || []) surfaceTokens.add(t)
}

/**
 * Element names are gathered from the same files, from anything that reads as
 * a tag. Custom elements matter as much as HTML ones: `salla-slider` carries
 * the hero and `salla-cart-summary` sits in the header, and a rule targeting
 * either is above-fold whether or not it has hydrated.
 */
const surfaceElements = new Set()
for (const file of SURFACE) {
  const src = stripComments(fs.readFileSync(path.resolve(file), 'utf8'))
  for (const m of src.matchAll(/<\/?([a-zA-Z][\w-]*)/g)) surfaceElements.add(m[1].toLowerCase())
}
// The four the shell emits that no scanned template writes as a literal tag.
for (const e of ['html', 'body', 'main', 'dialog']) surfaceElements.add(e)

// ── selector analysis ──────────────────────────────────────────────────────

/**
 * Pseudo-class functions are removed **with their contents**, innermost first.
 *
 * `.btn:not(.is-disabled)` must be judged on `.btn` alone: `.is-disabled` is a
 * class the rule applies in the ABSENCE of, so requiring it in the surface
 * would drop a rule that does apply. `:is()`, `:where()` and `:has()` are
 * removed on the mirror argument — their contents are alternatives, and any one
 * of them matching is enough, so gating on all of them is the wrong test.
 * Dropping the lot leaves the compound outside the parens to decide, which is
 * the over-inclusive answer in both cases.
 */
const stripPseudoFunctions = (sel) => {
  let out = sel,
    prev
  do {
    prev = out
    out = out.replace(/::?[\w-]+\([^()]*\)/g, ' ')
  } while (out !== prev)
  return out
}

const classesOf = (sel) =>
  [...sel.matchAll(/\.((?:[\w-]|\\.)+)/g)].map((m) => m[1].replace(/\\/g, ''))

const idsOf = (sel) => [...sel.matchAll(/#((?:[\w-]|\\.)+)/g)].map((m) => m[1].replace(/\\/g, ''))

const elementsOf = (sel) =>
  [
    ...sel
      // classes, ids and the remaining bare pseudos go first, so what is left
      // is only tag names and combinators.
      .replace(/\.(?:[\w-]|\\.)+/g, ' ')
      .replace(/#(?:[\w-]|\\.)+/g, ' ')
      .replace(/::?[\w-]+/g, ' ')
      .matchAll(/(?:^|[\s>+~,])([a-zA-Z][\w-]*)/g),
  ].map((m) => m[1].toLowerCase())

/**
 * ONE SELECTOR'S VERDICT.
 *
 * A selector that names no element at all — `*`, `:root`, `::backdrop`, and the
 * `*,::before,::after` that carries Tailwind's box model — is kept
 * unconditionally. Deciding which resets the fold depends on is not knowable
 * from a template and is catastrophic to get wrong: a missing `box-sizing`
 * moves every box on the page.
 *
 * A selector that names elements and no class must name **only above-fold
 * elements**. «No class means base rule, keep it» was the first version of this
 * test and it was wrong: `lite-youtube{…}` has no class either, and so the
 * video-carousel façade — a component that appears far below the fold on one
 * section — rode into the critical sheet on a rule meant for `html` and `body`.
 * It cost 22 KB. Grouped preflight selectors are unaffected, because a group is
 * judged member by member and `h1` in `blockquote,dd,dl,figure,h1,…` still
 * carries the whole rule.
 *
 * Otherwise every class and id in the selector must be in the surface. Note the
 * quantifier: **every**, not any. `.hero .product-card__title` is not an
 * above-fold rule just because `.hero` is above the fold — it needs a product
 * card inside the hero, and there is none.
 *
 * Attribute selectors are stripped and never gate the decision. `[data-…]`
 * hooks are written by scripts as often as by templates, and a rule that turns
 * on an attribute this scan cannot see is exactly the kind of thing that should
 * be kept rather than dropped.
 */
const selectorMatches = (raw) => {
  // Comments are stripped FIRST. A prelude reaches this function carrying
  // whatever sat between the previous rule's closing brace and this one's
  // selector, and in `app.css` that includes the `__THEME_CSS_STARTS_HERE__`
  // marker. Left in, its words parse as element names, no element named
  // `THEME_CSS_STARTS_HERE` is in the surface, and the rule after the marker is
  // dropped — an under-inclusion, which is the direction that breaks a page.
  const sel = stripPseudoFunctions(raw.replace(/\/\*[\s\S]*?\*\//g, ' ')).replace(
    /\[[^\]]*\]/g,
    ' ',
  )
  if (!sel.trim()) return true

  const classes = classesOf(sel)
  const ids = idsOf(sel)
  const elements = elementsOf(sel)

  if (!classes.every((c) => surfaceTokens.has(c))) return false
  if (!ids.every((i) => surfaceTokens.has(i))) return false
  return elements.every((e) => surfaceElements.has(e))
}

// ── the walk ───────────────────────────────────────────────────────────────

/**
 * A selector list is split on TOP-LEVEL commas only, and this is not a detail.
 *
 * `postcss-preset-env` compiles this theme's logical properties into pairs like
 * `.store-footer__inner:where([dir=rtl],[dir=rtl] *)`, and **that comma is
 * inside the pseudo-class**. Splitting the prelude naively cut it into
 * `.store-footer__inner:where([dir=rtl]` and `[dir=rtl] *)` — and the second
 * fragment has no class in it at all, so it read as a base rule and was kept
 * unconditionally. Since almost every rule in this theme is compiled that way,
 * the naive split quietly kept most of the stylesheet: the footer, the story
 * cards, the product page. It failed toward over-inclusion rather than toward a
 * broken page, which is why it produced a plausible-looking sheet instead of an
 * error, and why it is called out here rather than fixed silently.
 */
const splitSelectorList = (prelude) => {
  const parts = []
  let depth = 0,
    start = 0,
    quote = null
  for (let i = 0; i < prelude.length; i++) {
    const c = prelude[i]
    if (quote) {
      if (c === quote && prelude[i - 1] !== '\\') quote = null
      continue
    }
    if (c === '"' || c === "'") quote = c
    else if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (c === ',' && depth === 0) {
      parts.push(prelude.slice(start, i))
      start = i + 1
    }
  }
  parts.push(prelude.slice(start))
  return parts.filter((s) => s.trim())
}

/** Top-level rules, brace-counted, quote-aware. Same walker as split-css.mjs. */
const splitTopLevel = (source) => {
  const rules = []
  let depth = 0,
    start = 0,
    quote = null
  for (let i = 0; i < source.length; i++) {
    const c = source[i]
    if (quote) {
      if (c === quote && source[i - 1] !== '\\') quote = null
      continue
    }
    if (c === '"' || c === "'") {
      quote = c
      continue
    }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) {
        rules.push([start, i + 1])
        start = i + 1
      }
    }
  }
  if (start < source.length) rules.push([start, source.length])
  return rules
}

/**
 * `@media`, `@layer`, `@container` and `@supports` are opened and their bodies
 * filtered, then re-wrapped in the same condition. **Every breakpoint is kept,
 * not just the mobile one** — the critical sheet has to be correct on a phone,
 * a tablet and a desktop, and there is no viewport at build time to choose
 * between them. `@media print` is the one condition dropped: it cannot affect
 * a first paint on screen by definition.
 */
const SPLITTABLE_AT = /^@(media|layer|container|supports)\b/
const PRINT_ONLY = /^@media\s*print\b/

const collect = (source) => {
  let out = ''
  for (const [from, to] of splitTopLevel(source)) {
    const chunk = source.slice(from, to)
    const braceAt = chunk.indexOf('{')
    if (braceAt === -1) continue // stray comment or whitespace between rules
    const prelude = chunk.slice(0, braceAt).trim()

    if (prelude.startsWith('@')) {
      if (PRINT_ONLY.test(prelude)) continue
      if (SPLITTABLE_AT.test(prelude)) {
        const body = chunk.slice(braceAt + 1, chunk.lastIndexOf('}'))
        const inner = collect(body)
        if (inner.trim()) out += prelude + '{' + inner + '}'
        continue
      }
      // `@font-face`, `@keyframes`, `@property`, `@charset`. Their bodies are
      // declarations, not selector lists, so a partial copy is not a smaller
      // version of the rule but a broken one. Keyframes are settled in the
      // second pass below; the rest are kept whole and are small.
      if (/^@keyframes\b/.test(prelude)) continue
      out += chunk
      continue
    }

    const selectors = splitSelectorList(prelude)
    if (!selectors.length) continue
    // ANY, not every: a grouped selector is a list of alternatives, and one
    // above-fold member is enough to make the declarations above-fold. The
    // group is kept intact rather than rewritten to the matching members —
    // rewriting it would change nothing that paints and would make the output
    // impossible to diff against `app.css`.
    if (selectors.some(selectorMatches)) out += chunk
  }
  return out
}

const css = fs.readFileSync(SOURCE, 'utf8')
let critical = collect(css)

/**
 * SECOND PASS — the keyframes the kept rules actually name.
 *
 * Animations are the one thing that breaks in a way nobody notices: an
 * `animation: marquee 30s linear infinite` whose `@keyframes marquee` was left
 * behind does not error, it simply sits still. The announcement bar is a
 * marquee and it is the first thing on the page, so this is not hypothetical.
 * Names are read back out of the kept CSS rather than listed by hand.
 */
const named = new Set()
for (const m of critical.matchAll(/animation(?:-name)?\s*:\s*([^;}]+)/g)) {
  for (const t of m[1].split(/[\s,]+/)) if (/^[A-Za-z_-][\w-]*$/.test(t)) named.add(t)
}
let keyframes = ''
for (const [from, to] of splitTopLevel(css)) {
  const chunk = css.slice(from, to)
  const m = chunk.match(/^\s*(@(?:-\w+-)?keyframes)\s+([\w-]+)/)
  if (m && named.has(m[2])) keyframes += chunk
}
critical += keyframes

// ── output ─────────────────────────────────────────────────────────────────

const banner =
  '/*! T-8.01 — above-fold CSS for the announcement bar, header and hero.\n' +
  '    Generated by scripts/extract-critical.mjs. Do not edit; edit the script. */\n'

const out = banner + critical
fs.writeFileSync(TARGET, out)

/**
 * The Twig partial exists because a template cannot read a file out of
 * `public/`. Twilight gives Twig `|asset`, which returns a URL — the very
 * round trip this task is removing — and no filter that returns contents. So
 * the build writes the `<style>` element itself, and `master.twig` includes it
 * like any other component.
 *
 * `{% verbatim %}` is not decoration. Twig parses the body of every template it
 * loads, and a stylesheet is a document full of braces; the day a minifier
 * emits two of them adjacently, an un-escaped partial stops being CSS and
 * becomes a Twig syntax error on every page of the store. The tag costs
 * nothing and removes the whole class of failure.
 */
fs.writeFileSync(
  PARTIAL,
  '{#\n' +
    '  GENERATED BY `scripts/extract-critical.mjs` — DO NOT EDIT THIS FILE.\n' +
    '  Edit the script, or the SURFACE list in it, and rebuild.\n' +
    '\n' +
    '  It is committed rather than gitignored for the same reason `public/app.css`\n' +
    '  is: this repository ships built output, and a theme whose first paint\n' +
    '  depended on a file the deploy did not carry would paint unstyled.\n' +
    '#}\n' +
    '<style id="critical-css">{% verbatim %}' +
    critical +
    '{% endverbatim %}</style>\n',
)

const rules = (s) => (s.match(/\{/g) || []).length
console.log('Critical CSS — T-8.01\n')
console.log(
  `  app.css        ${kb(css.length).padStart(9)} raw  ${kb(gzip(css)).padStart(9)} gzip   ${String(rules(css)).padStart(5)} blocks`,
)
console.log(
  `  critical.css   ${kb(out.length).padStart(9)} raw  ${kb(gzip(out)).padStart(9)} gzip   ${String(rules(out)).padStart(5)} blocks   inlined`,
)
console.log(
  `\n  Surface: ${SURFACE.length} files, ${surfaceTokens.size} tokens, ${surfaceElements.size} elements.`,
)
console.log('  Derived from templates, not from a rendered page — see the header of this file.')
