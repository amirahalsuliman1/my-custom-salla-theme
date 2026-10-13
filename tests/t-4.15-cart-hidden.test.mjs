/**
 * T-4.15 — a row part that cart.js hides with `hidden` stays hidden.
 *
 * `.free-ribbon` sets `display: block` and `.cart-item__meta` `display: flex`,
 * both after Tailwind's `.hidden` at equal specificity, so on the demo store
 * (2026-10-13) every row showed «منتج مجاني» and an empty «الوزن». cart.scss
 * must carry a scoped `.cart-item .hidden` that outranks them.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const CSS = fs.readFileSync('src/assets/styles/04-components/cart.scss', 'utf8')
const TWIG = fs.readFileSync('src/views/pages/cart.twig', 'utf8')

test('the row parts cart.js toggles are rendered with `hidden`', () => {
  assert.match(TWIG, /class="free-ribbon \{\{/)
  assert.match(TWIG, /item-weight-row/)
})

test('cart.scss scopes `hidden` above the row rules that set a display', () => {
  assert.match(CSS, /\.cart-item \[class~='hidden'\]\s*\{\s*display: none;\s*\}/)
})

test('no rule names the bare .hidden class, which @apply hidden would copy', () => {
  assert.doesNotMatch(CSS, /\.hidden\s*\{/)
})
