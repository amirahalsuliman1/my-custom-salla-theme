/**
 * Salla's Marketplace review, 2026-10-18: the order page carries
 * `salla-review-order-item` for a product's rating (theme-raed#963).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const SINGLE = fs.readFileSync('src/views/pages/customer/orders/single.twig', 'utf8')
const CSS = fs.readFileSync('src/assets/styles/04-components/order-card.scss', 'utf8')

test('a product rating is salla-review-order-item, keyed by the product id', () => {
  assert.match(SINGLE, /<salla-review-order-item product-id="\{\{ item\.product\.id \}\}"><\/salla-review-order-item>/)
  assert.match(SINGLE, /\{% if item\.rating and item\.product %\}/)
  assert.doesNotMatch(SINGLE, /product_rating_extra/)
})

test('it sits in the rating panel, restyled from outside', () => {
  assert.match(SINGLE, /class="account-panel order-rating order-rating--product"/)
  assert.match(CSS, /\.order-rating--product salla-review-order-item > section \{/)
})
