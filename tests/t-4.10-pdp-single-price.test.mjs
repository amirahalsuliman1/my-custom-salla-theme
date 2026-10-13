/**
 * T-4.10 — the PDP shows its price once, under the title, and it is the live one.
 *
 * Found on the demo store 2026-10-13: upstream printed a static price under the
 * title and the live one again in a «السعر» box above the quantity, which no
 * artboard draws. product.js targets `.price-wrapper`, `.total-price`,
 * `.price_is_on_sale`, `.starting-or-normal-price` and `.out-of-stock`
 * page-wide, so the live block can sit anywhere — but exactly once.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const PDP = fs.readFileSync('src/views/pages/product/single.twig', 'utf8')
const count = (re) => (PDP.match(re) || []).length

test('one price block, one live wrapper, one out-of-stock line', () => {
  assert.equal(count(/data-testid="store-product-price"/g), 1)
  assert.equal(count(/price-wrapper/g), 1)
  assert.equal(count(/class="out-of-stock /g), 1)
})

test('the live wrapper is inside the price block under the title', () => {
  const title = PDP.indexOf('data-testid="store-product-title"')
  const block = PDP.indexOf('data-testid="store-product-price"')
  const live = PDP.indexOf('price-wrapper')
  const form = PDP.indexOf('data-testid="store-product-form"')
  assert.ok(title < block && block < live && live < form)
})

test('the «السعر» box is gone', () => {
  assert.doesNotMatch(PDP, /trans\('pages\.products\.price'\)/)
})
