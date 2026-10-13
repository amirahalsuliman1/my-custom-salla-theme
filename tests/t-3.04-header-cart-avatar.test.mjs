/**
 * T-3.04 — the header's cart and avatar, as the artboards draw them.
 *
 * Found on the demo store 2026-10-13: `salla-cart-summary` drew the total over
 * a 15px bag with the count covering it, and `salla-user-menu` drew a white
 * 68px box behind the avatar. These pin the overrides that undo both.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const HEADER = fs.readFileSync('src/assets/styles/04-components/store-header.scss', 'utf8')
const MENU = fs.readFileSync('src/assets/styles/04-components/floating-menu.scss', 'utf8')

test('the cart total is off screen, not removed', () => {
  assert.match(HEADER, /\.store-header \.store-header__btn \.s-cart-summary-content\s*\{\s*@apply sr-only;/)
})

test('the count sits at the bag corner with logical offsets', () => {
  const rule = HEADER.match(/\.store-header \.store-header__btn \.s-cart-summary-count\s*\{([^}]*)\}/)
  assert.ok(rule)
  assert.match(rule[1], /inset-inline-start:\s*auto/)
  assert.match(rule[1], /inset-inline-end:/)
})

test('the avatar trigger has no box and the photo is round', () => {
  assert.match(MENU, /\.s-user-menu-trigger-avatar-only \.s-user-menu-trigger\s*\{\s*@apply[^;]*bg-transparent[^;]*p-0/)
  assert.match(MENU, /\.s-user-menu-trigger-avatar \{\s*@apply[^;]*rounded-full[^;]*object-cover/)
})
