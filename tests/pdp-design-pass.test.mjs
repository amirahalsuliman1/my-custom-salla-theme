/**
 * The PDP against `Product Details Page.pdf` and its «On Scroll» state,
 * checked on the demo store 2026-10-14.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const INFO = fs.readFileSync('src/assets/styles/04-components/product-info.scss', 'utf8')
const PRODUCT = fs.readFileSync('src/assets/js/product.js', 'utf8')
const DOCK = fs.readFileSync('src/assets/js/partials/pdp-sticky-actions.js', 'utf8')

test('the section stays in the panel; only the action row docks', () => {
  assert.match(INFO, /body\.is-sticky-product-bar \.sticky-product-bar \{\s*@apply static/)
  assert.match(INFO, /body\.pdp-actions-docked \.sticky-product-bar \.product-actions \{\s*@apply fixed/)
})

test('the section carries no transform, so the docked row is fixed to the screen', () => {
  assert.match(INFO, /body\.is-sticky-product-bar\.product-single \.sticky-product-bar \{\s*transform: none;/)
})

test('the page reserves the docked row and the safe area', () => {
  assert.match(INFO, /--sticky-product-bar-size:\s*4\.5rem/)
  assert.match(INFO, /padding-block-end:\s*calc\(var\(--sticky-product-bar-size\) \+ env\(safe-area-inset-bottom/)
})

test('docking waits until the section is above the viewport, on phones only', () => {
  assert.match(PRODUCT, /import initStickyActions from '\.\/partials\/pdp-sticky-actions'/)
  assert.match(PRODUCT, /initStickyActions\(\)/)
  assert.match(DOCK, /!entry\.isIntersecting && entry\.boundingClientRect\.top < 0/)
  assert.match(DOCK, /max-width: 767\.98px/)
  assert.match(DOCK, /minBlockSize/)
})

test('a sale price is set in the page ink, not red', () => {
  assert.match(INFO, /\.product-entry__price \.total-price \{\s*color: var\(--main-text-color\)/)
})

test('an unbroken description wraps inside the screen', () => {
  assert.match(INFO, /\.product__description \{\s*overflow-wrap: anywhere;/)
})
