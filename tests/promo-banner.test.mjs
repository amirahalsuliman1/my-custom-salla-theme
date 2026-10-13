/**
 * Owner request 2026-10-13 — the merchant banners on the cart and on listings.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const BANNER = fs.readFileSync('src/views/components/ui/promo-banner.twig', 'utf8')
const CART = fs.readFileSync('src/views/pages/cart.twig', 'utf8')
const LISTING = fs.readFileSync('src/views/pages/product/index.twig', 'utf8')
const MANIFEST = JSON.parse(fs.readFileSync('twilight.json', 'utf8'))

test('the banner renders nothing without an image', () => {
  assert.match(BANNER, /^\{% if image %\}/m)
})

test('a linked banner always has a name, and the box is reserved', () => {
  assert.match(BANNER, /alt="\{\{ url and not banner_alt \? store\.name : banner_alt \}\}"/)
  assert.match(BANNER, /width="1200"\s+height="400"/)
  assert.match(BANNER, /srcset="[^"]*450w[^"]*900w[^"]*1350w"/)
})

test('the cart and the listing include it with their own settings', () => {
  for (const [src, prefix] of [[CART, 'cart'], [LISTING, 'listing']]) {
    for (const part of ['image', 'url', 'alt']) {
      assert.match(src, new RegExp(`theme\\.settings\\.get\\('${prefix}_banner_${part}'\\)`), `${prefix} ${part}`)
      assert.ok(MANIFEST.settings.some((s) => s.id === `${prefix}_banner_${part}`), `${prefix}_banner_${part} declared`)
    }
  }
})

test('the listing banner stays off the offers and search pages', () => {
  assert.match(LISTING, /\{% if not is_offers_page and not is_search_page %\}\s*<div class="container">\s*\{% include 'components\.ui\.promo-banner'/)
})
