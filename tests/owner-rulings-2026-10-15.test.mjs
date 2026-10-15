/**
 * The owner's rulings of 2026-10-15 on four deferred audit items.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (f) => fs.readFileSync(f, 'utf8')
const PDP = read('src/views/pages/product/single.twig')
const INFO = read('src/assets/styles/04-components/product-info.scss')
const CARD = read('src/assets/js/partials/product-card.js')
const CARD_CSS = read('src/assets/styles/04-components/product-card.scss')
const STATE = read('src/assets/js/partials/cart-state.js')

test('#145 — docked on desktop, the bar\'s button opens the cart', () => {
  assert.match(PDP, /<a href="\{\{ link\('cart'\) \}\}" class="product-actions__view-cart">/)
  assert.match(PDP, /trans\('theme\.product\.view_cart'\)/)
  assert.match(INFO, /body\.pdp-actions-docked \.product-actions__view-cart \{/)
  assert.match(INFO, /\.product-actions__view-cart \{\s*display: none;/)
})

test('#37 — the card steps a product already in the cart, through salla.cart', () => {
  assert.match(STATE, /salla\.storage\.get\('cart\.id'\)/)
  assert.match(STATE, /salla\.cart\.updateItem\(\{ id: line\.itemId, quantity \}\)/)
  assert.match(STATE, /salla\.cart\.deleteItem\(line\.itemId\)/)
  assert.match(CARD, /this\.renderedQuantity \? this\.getStepper\(this\.renderedQuantity\) : this\.getBuyPill\(\)/)
  assert.match(CARD, /aria-live="polite"/)
  assert.match(CARD_CSS, /\.product-card__stepper \{/)
})

test('#111 — the quick preview shows on hover only, from 1024px, and opens the quick view', () => {
  assert.match(CARD, /class="product-card__quick-preview"[^>]*\s+data-quick-view="\$\{this\.product\.id\}"/)
  assert.match(CARD_CSS, /\.product-card__quick-preview \{\s*display: none;/)
  assert.match(CARD_CSS, /@media \(hover: hover\) \{\s*\.product-card:hover \.product-card__quick-preview/)
})
