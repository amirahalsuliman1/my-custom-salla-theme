#!/usr/bin/env node
/**
 * T-8.01 — split the built stylesheet into what first paint needs and what it
 * does not.
 *
 * WHY THIS EXISTS. `app.css` measured 100.1 KB gzip on 2026-08-11 — over its
 * 100 KB ceiling and twice the 50 KB target T-1.08 set. The sheet was analysed
 * rule by rule: **515 KB of the 780 KB raw is `s-*`**, the classes Salla's own
 * web components render into the page and expect the theme to have styled.
 *
 * THEY CANNOT BE PURGED, AND THAT IS MEASURED. Of the 1860 distinct `s-*`
 * classes, **only 79 are defined in the CSS `@salla.sa/twilight-components`
 * ships**. The other 1781 exist nowhere else, so removing them un-styles the
 * platform's cart, checkout, filters and reviews on a live store — silently, at
 * runtime, which is the worst way for CSS to fail. So none of them are removed.
 *
 * WHAT CHANGES IS WHEN THEY ARRIVE. Every `salla-*` element is an empty custom
 * element until `twilight.js` hydrates it, so this CSS paints nothing during
 * first paint. It is «the remainder» in this task's first criterion, and
 * `master.twig` loads it non-blocking.
 *
 * WHY THE OUTPUT IS CUT RATHER THAN COMPILED TWICE. A second Tailwind pass over
 * the safe-list alone fails: the plugin's `s-*` components `@apply` classes the
 * theme's own SCSS defines — `single-order-header-item`, from
 * `04-components/user-pages.scss` — and `@apply` can only reach what is in the
 * same PostCSS document. One compile, then a cut, is the only order that works.
 *
 * THE TWO RULES OF THE CUT:
 *   1. Only rules **above** the `__THEME_CSS_STARTS_HERE__` marker move. Below
 *      it are the theme's own files, including ones that deliberately override
 *      an `s-*` class (`floating-menu.scss`, `notifications.scss`). Moving those
 *      would send an override to a sheet that loads *before* the thing it
 *      overrides.
 *   2. A rule moves only when **every** selector in it is `s-*` or a `salla-*`
 *      element. A grouped selector with one theme class in it stays, because
 *      splitting the group would change which sheet that class lands in.
 *
 * Cascade order is preserved by `master.twig` linking `salla-components.css`
 * BEFORE `app.css`: CSSOM order follows document order, not load order, so the
 * relative order of these rules against the theme's own is exactly what it was
 * when they shared a file.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { execFileSync } from 'node:child_process'

// The output directory is an argument so the tests can drive the splitter
// against a scratch copy. A test that rewrote the real `public/` would leave
// the working tree holding a stylesheet built from fixtures.
const PUBLIC = path.resolve(process.argv[2] || 'public')
const SOURCE = path.join(PUBLIC, 'app.css')
const TARGET = path.join(PUBLIC, 'salla-components.css')
const MARKER = '__THEME_CSS_STARTS_HERE__'

const kb = (n) => (n / 1024).toFixed(1) + ' KB'
const gzip = (s) => zlib.gzipSync(Buffer.from(s), { level: 9 }).length

if (!fs.existsSync(SOURCE)) {
  console.error(
    `✗ split-css: ${path.relative(process.cwd(), SOURCE)} not found — run the build first.`,
  )
  process.exit(1)
}

const css = fs.readFileSync(SOURCE, 'utf8')
const markerAt = css.indexOf(MARKER)

if (markerAt === -1) {
  // Loud rather than silent. Without the marker the splitter cannot tell
  // Tailwind's output from the theme's, and shipping one unsplit sheet would
  // put app.css back over its ceiling with nothing to say why.
  console.error(`✗ split-css: marker ${MARKER} not found in app.css.`)
  console.error('  It lives in src/assets/styles/app.scss, directly after the tailwind import.')
  console.error('  Nothing was written. Restore the marker or update this script deliberately.')
  process.exit(1)
}

/** Walk top-level rules, tracking whether we are before or after the marker. */
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
 * THE SECOND CUT: utilities only the platform's components ask for.
 *
 * `s-*` is not the whole of the deferred half. Salla's components are built out
 * of ordinary Tailwind utilities too, and the safe-list names every one of them
 * so the purge keeps it. Measured on 2026-08-11, **93.9 KB raw of the built
 * sheet is utilities whose class name appears in the safe-list and in no `.twig`
 * or `.js` this theme owns** — generated solely so the platform's markup has
 * something to match, and never written by the theme.
 *
 * The test is literal-token membership, which is sound because it is the same
 * test Tailwind itself used to decide to generate the class. If a name reaches
 * the built sheet at all, it was found verbatim in some scanned file; if the
 * only file it was found in is the safe-list, no theme markup can be using it.
 * A utility named in both stays in `app.css`.
 */
const CANDIDATE = /[A-Za-z0-9_@:/[\]().,%#!-]{2,}/g
const tokensOf = (source) => new Set(source.match(CANDIDATE) || [])

const readTokenSet = (files) => {
  const set = new Set()
  for (const file of files) for (const t of tokensOf(fs.readFileSync(file, 'utf8'))) set.add(t)
  return set
}

const listFiles = () =>
  execFileSync(
    'find',
    [
      'src/views',
      'src/assets/js',
      '-type',
      'f',
      '(',
      '-name',
      '*.twig',
      '-o',
      '-name',
      '*.js',
      ')',
    ],
    { encoding: 'utf8' },
  )
    .trim()
    .split('\n')
    .filter(Boolean)

const SAFE_LIST = 'node_modules/@salla.sa/twilight-tailwind-theme/safe-list-css.txt'
const safelistTokens = fs.existsSync(SAFE_LIST)
  ? tokensOf(fs.readFileSync(SAFE_LIST, 'utf8'))
  : new Set()
const themeTokens = readTokenSet(listFiles())

const isPlatformOnlyUtility = (cls) => safelistTokens.has(cls) && !themeTokens.has(cls)

/** A selector belongs to the platform when it is only `s-*` / `salla-*`. */
const isPlatformSelector = (sel) => {
  const s = sel.trim()
  if (!s) return false
  // Ignore pseudo/attr noise, then require at least one platform token and no
  // token that is a theme class or a bare element/utility.
  const classes = [...s.matchAll(/\.((?:[\w-]|\\.)+)/g)].map((m) => m[1].replace(/\\/g, ''))
  const elements = [...s.matchAll(/(?:^|[\s>+~(])([a-z][\w-]*)/g)].map((m) => m[1])
  const platformClass = (c) => c.startsWith('s-') || isPlatformOnlyUtility(c)
  const hasPlatform = classes.some(platformClass) || elements.some((e) => e.startsWith('salla-'))
  if (!hasPlatform) return false
  const foreignClass = classes.some((c) => !platformClass(c))
  const foreignElement = elements.some((e) => !e.startsWith('salla-'))
  return !foreignClass && !foreignElement
}

const isPlatformRule = (chunk) => {
  const braceAt = chunk.indexOf('{')
  if (braceAt === -1) return false
  const prelude = chunk.slice(0, braceAt).trim()
  if (prelude.startsWith('@')) return false
  const selectors = prelude.split(',').filter((s) => s.trim())
  if (!selectors.length) return false
  return selectors.every(isPlatformSelector)
}

/**
 * Conditional at-rules are opened rather than skipped, because 41 KB of the
 * head is `@media` holding the platform's responsive rules — the breakpoint
 * variants of the very components being deferred. A block is split into two
 * copies of the same condition, one per sheet, and an empty copy is not
 * emitted. `@keyframes`, `@font-face` and `@supports` are left whole: their
 * bodies are not lists of selectors, and a partial copy of either is not a
 * smaller version of it but a broken one.
 */
const SPLITTABLE_AT = /^@(media|layer|container)\b/

const partitionRules = (source) => {
  let moved = '',
    kept = '',
    count = 0

  for (const [from, to] of splitTopLevel(source)) {
    const chunk = source.slice(from, to)
    const braceAt = chunk.indexOf('{')
    const prelude = braceAt === -1 ? chunk : chunk.slice(0, braceAt)

    if (braceAt !== -1 && SPLITTABLE_AT.test(prelude.trim())) {
      const body = chunk.slice(braceAt + 1, chunk.lastIndexOf('}'))
      const inner = partitionRules(body)
      if (inner.moved) {
        moved += prelude + '{' + inner.moved + '}'
        count += inner.count
      }
      if (inner.kept.trim()) kept += prelude + '{' + inner.kept + '}'
      continue
    }

    if (isPlatformRule(chunk)) {
      moved += chunk
      count++
    } else kept += chunk
  }

  return { moved, kept, count }
}

const head = css.slice(0, markerAt)
const tail = css.slice(markerAt)

const { moved, kept, count: movedCount } = partitionRules(head)

const banner =
  '/*! T-8.01 — Salla component CSS, split out of app.css and loaded non-blocking.\n' +
  '    Generated by scripts/split-css.mjs. Do not edit; edit the script. */\n'

const appOut = kept + tail
const sallaOut = banner + moved

fs.writeFileSync(SOURCE, appOut)
fs.writeFileSync(TARGET, sallaOut)

const beforeGz = gzip(css)
console.log('CSS split — T-8.01\n')
console.log(
  `  before          app.css              ${kb(css.length).padStart(9)} raw  ${kb(beforeGz).padStart(9)} gzip`,
)
console.log(
  `  after           app.css              ${kb(appOut.length).padStart(9)} raw  ${kb(gzip(appOut)).padStart(9)} gzip   render-blocking`,
)
console.log(
  `                  salla-components.css ${kb(sallaOut.length).padStart(9)} raw  ${kb(gzip(sallaOut)).padStart(9)} gzip   deferred`,
)
console.log(
  `\n  ${movedCount} platform rules moved. Every one is still shipped — see the header of this file.`,
)
