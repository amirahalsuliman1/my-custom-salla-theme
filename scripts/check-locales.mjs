#!/usr/bin/env node
/**
 * T-1.05 — locale catalogue check.
 *
 * Validates `src/locales/ar.json` against `src/locales/en.json`. Run directly
 * with `node scripts/check-locales.mjs`; T-1.07 wires it into lint and CI.
 *
 * ── The catalogue contract ────────────────────────────────────────────────
 *
 * Consumption, verified against the SDK rather than assumed:
 *
 *   Twig  {{ trans('pages.cart.total') }}
 *         {{ trans('pages.cart.free_shipping_alert', {'amount': x|money}) }}
 *   JS    salla.lang.get('pages.cart.add_to_cart')
 *         salla.lang.get('pages.cart.free_shipping_alert', {amount: '...'})
 *
 * Replacements are Laravel-style `:name` tokens in the message body. A token
 * present in one locale and absent in the other is a live bug — the
 * substitution silently leaves `:name` on screen — which is why placeholder
 * parity is checked below and not left to review.
 *
 * PLURALISATION. `salla.lang` extends `Lang` from lang.js@1.1.14, whose
 * `_getPluralForm` implements the full Arabic rule: SIX ordered forms
 * separated by `|`, selected as
 *
 *   0 → zero · 1 → one · 2 → two · n%100 in 3..10 → few
 *   n%100 in 11..99 → many · otherwise → other
 *
 * so an Arabic plural message must carry exactly six segments and an English
 * one exactly two. Reached with `salla.lang.choice(key, count, replacements)`.
 *
 * ⚠ `choice()` is a JS-side API. Twig's `trans()` takes a key and a
 * replacements map — no count argument appears anywhere in the 150 upstream
 * call sites, and no Twig choice form could be confirmed. **Treat Twig
 * pluralisation as unavailable.** Where a count-dependent noun is needed in a
 * template, either render it through JS with `choice()`, or write copy that
 * does not inflect on the count. Do not guess a Twig syntax for it.
 *
 * NAMESPACES. `blocks.*`, `pages.*` and `common.*` are upstream's and stay
 * byte-identical to the pinned baseline. **All theme-authored copy goes under
 * a single `theme.*` root.** These two files are shadowed upstream files, and
 * keeping our additions in one subtree is what makes reconciling them on an
 * SDK upgrade a merge of one key rather than a three-way diff through
 * upstream's own namespaces.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const LOCALES = { ar: 'src/locales/ar.json', en: 'src/locales/en.json' }

/** Arabic selects between six plural forms; English between two. */
const PLURAL_FORMS = { ar: 6, en: 2 }

/** Laravel-style `:token` replacements, as used by `trans()` and `lang.get()`. */
const PLACEHOLDER = /:[a-zA-Z_][a-zA-Z0-9_]*/g

/**
 * The only top-level roots either file may carry. The first three are
 * upstream's and are frozen at the pinned baseline; `theme` is ours. A fourth
 * root means theme copy has been filed somewhere an upgrade will have to
 * untangle it from.
 */
const ROOTS = { upstream: ['blocks', 'pages', 'common'], theme: 'theme' }

const problems = []
const fail = (msg) => problems.push(msg)

/** Flatten a nested catalogue to `{ 'a.b.c': 'value' }`, rejecting non-strings. */
function flatten(node, prefix, locale, out = new Map()) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, path, locale, out)
    } else if (typeof value === 'string') {
      out.set(path, value)
    } else {
      fail(
        `${locale}: ${path} is ${Array.isArray(value) ? 'an array' : typeof value} — leaves must be strings`,
      )
    }
  }
  return out
}

function load(locale) {
  const path = LOCALES[locale]
  try {
    const catalogue = JSON.parse(readFileSync(join(ROOT, path), 'utf8'))
    const allowed = [...ROOTS.upstream, ROOTS.theme]

    for (const root of Object.keys(catalogue)) {
      if (!allowed.includes(root)) {
        fail(
          `${locale}: top-level "${root}" is not a known root — theme copy belongs under "${ROOTS.theme}.*"`,
        )
      }
    }

    return flatten(catalogue, '', locale)
  } catch (error) {
    fail(`${locale}: ${path} — ${error.message}`)
    return new Map()
  }
}

const catalogues = { ar: load('ar'), en: load('en') }

// ── Parity: every key present in both files ──────────────────────────────────
for (const [locale, other] of [
  ['ar', 'en'],
  ['en', 'ar'],
]) {
  for (const key of catalogues[locale].keys()) {
    if (!catalogues[other].has(key))
      fail(`${key} — present in ${locale}.json, missing from ${other}.json`)
  }
}

// ── Per-message checks ───────────────────────────────────────────────────────
for (const [locale, catalogue] of Object.entries(catalogues)) {
  for (const [key, message] of catalogue) {
    if (message.trim() === '')
      fail(`${locale}: ${key} — empty string; delete the key or translate it`)

    // A `|` means the message pluralises, and each locale has a fixed arity.
    if (message.includes('|')) {
      const forms = message.split('|').length
      const expected = PLURAL_FORMS[locale]
      if (forms !== expected) {
        fail(
          `${locale}: ${key} — ${forms} plural form${forms === 1 ? '' : 's'}, expected ${expected}`,
        )
      }
    }
  }
}

// ── Placeholder parity: a token in one locale must exist in the other ────────
for (const [key, message] of catalogues.ar) {
  if (!catalogues.en.has(key)) continue // already reported as a parity failure

  const inAr = new Set(message.match(PLACEHOLDER) ?? [])
  const inEn = new Set(catalogues.en.get(key).match(PLACEHOLDER) ?? [])

  for (const token of inAr)
    if (!inEn.has(token)) fail(`${key} — ${token} used in ar.json but not en.json`)
  for (const token of inEn)
    if (!inAr.has(token)) fail(`${key} — ${token} used in en.json but not ar.json`)
}

// ── Report ───────────────────────────────────────────────────────────────────
const total = catalogues.ar.size

if (problems.length) {
  console.error(
    `✗ locale check failed — ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n`,
  )
  for (const problem of problems) console.error(`  · ${problem}`)
  console.error('')
  process.exit(1)
}

console.log(`✓ locale check passed — ${total} keys, ar/en in parity`)
