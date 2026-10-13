/**
 * The desktop header and footer, from the Desktop artboards supplied on
 * 2026-10-13 (`Desktop Product Details Page.svg`, `Desktop Home Page - After.svg`).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const HEADER = fs.readFileSync('src/views/components/header/header.twig', 'utf8')
const HCSS = fs.readFileSync('src/assets/styles/04-components/store-header.scss', 'utf8')
const FOOTER = fs.readFileSync('src/views/components/footer/footer.twig', 'utf8')
const FCSS = fs.readFileSync('src/assets/styles/04-components/footer.scss', 'utf8')
const desktop = (css) => css.slice(css.lastIndexOf('@include from-laptop'))

test('the desktop search field opens the same Salla search and is named', () => {
  assert.match(HEADER, /class="store-header__search-field"\s+onclick="salla\.event\.dispatch\('search::open'\)"\s+aria-label="\{\{ trans\('theme\.header\.search'\) \}\}"/)
  assert.match(desktop(HCSS), /\.store-header__btn--search \{\s*@apply hidden;/)
  assert.match(desktop(HCSS), /inline-size: 22\.5rem;/)
})

test('language and currency sit in the bar, gated like the menu instance', () => {
  assert.match(HEADER, /\{% if store\.settings\.is_multilingual or store\.settings\.currencies_enabled %\}\s*<salla-localization-modal data-testid="store-header-localization"/)
})

test('the bag shows its total and inner pages get the full-width band', () => {
  assert.match(desktop(HCSS), /\.s-cart-summary-content \{\s*@apply not-sr-only/)
  assert.match(desktop(HCSS), /\.store-header--solid \{\s*background-color: var\(--surface-card\);\s*border-block-end:/)
})

test('the desktop footer: links on one row, social | badge | payments, no logo', () => {
  const d = desktop(FCSS)
  assert.match(d, /\.store-footer__brand \{\s*@apply hidden;/)
  assert.match(d, /\.s-menu-footer-list \{\s*@apply flex max-w-none flex-wrap justify-between/)
  assert.match(d, /> \.store-footer__social \{\s*grid-column: 1;/)
  assert.match(d, /> \.store-footer__payments \{\s*grid-column: 2 \/ -1;/)
  assert.match(FOOTER, /<hr class="store-footer__rule store-footer__rule--bottom">/)
})
