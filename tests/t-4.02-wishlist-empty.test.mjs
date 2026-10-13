/**
 * T-4.02 — the favorites page with nothing on it, and its scripts.
 *
 * Found on the demo store 2026-10-13: an empty favorites list drew a blank page.
 * `salla-products-list` never asks for a first page when the stored wishlist is
 * empty, so its own placeholder never appears; the theme shows T-2.14's empty
 * state instead. The page also loaded product-card.js a second time, after
 * master.twig had, and the second copy threw on `customElements.define`.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const PAGE = fs.readFileSync('src/views/pages/customer/wishlist.twig', 'utf8')
const MASTER = fs.readFileSync('src/views/layouts/master.twig', 'utf8')
const JS = fs.readFileSync('src/assets/js/partials/wishlist-card.js', 'utf8')
const AR = JSON.parse(fs.readFileSync('src/locales/ar.json', 'utf8'))
const EN = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'))

test('product-card.js is loaded once, by master.twig, not again by the page', () => {
  assert.match(MASTER, /'product-card\.js'\|asset/)
  assert.doesNotMatch(PAGE, /'product-card\.js'\|asset/)
})

test('the page carries the empty state, hidden until the script decides', () => {
  assert.match(PAGE, /<div data-wishlist-empty hidden>/)
  assert.match(PAGE, /components\.ui\.empty-state/)
  assert.match(PAGE, /trans\('theme\.wishlist\.empty'\)/)
})

test('the script reads the synced wishlist and re-reads it on every change', () => {
  assert.match(JS, /salla\.storage\.get\('salla::wishlist'\)/)
  assert.match(JS, /'wishlist::storage\.synced'/)
  assert.match(JS, /onAdded\(update\)/)
  assert.match(JS, /onRemoved\(update\)/)
})

test('the sentence exists in both locales', () => {
  assert.ok(AR.theme.wishlist.empty)
  assert.ok(EN.theme.wishlist.empty)
})

test('the share bar hides with the same flag as the empty state', () => {
  const css = fs.readFileSync('src/assets/styles/04-components/empty-state.scss', 'utf8')
  assert.match(JS, /classList\.toggle\('wishlist--empty', !empty\.hidden\)/)
  assert.match(css, /\.wishlist--empty salla-wishlist-actions,\s*\.wishlist--empty \.s-products-list-placeholder\s*\{\s*@apply hidden;/)
})
