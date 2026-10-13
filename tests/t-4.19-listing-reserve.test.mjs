/**
 * T-4.19 — the listing grid holds its space until its first answer.
 *
 * Found on the demo store 2026-10-13: until the first page came back the list
 * was 32px tall, so the footer painted at the top and then dropped. The rule
 * must release on a card or on the component's placeholder (an empty answer).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const CSS = fs.readFileSync('src/assets/styles/04-components/listing.scss', 'utf8')

test('the listing and brand grids carry the hook', () => {
  for (const file of ['src/views/pages/product/index.twig', 'src/views/pages/brands/single.twig']) {
    assert.match(fs.readFileSync(file, 'utf8'), /<salla-products-list[^>]*class="listing__products/, file)
  }
})

test('the reservation releases on a card or on the placeholder', () => {
  const rule = CSS.match(/\.listing__products:not\(:has\(([^)]*)\)\)\s*\{([^}]*)\}/)
  assert.ok(rule, 'no reservation rule')
  for (const part of ['custom-salla-product-card', 'salla-product-card', '.s-products-list-placeholder']) {
    assert.ok(rule[1].includes(part), `releases on ${part}`)
  }
  assert.match(rule[2], /min-block-size:/)
})
