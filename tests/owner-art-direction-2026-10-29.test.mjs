/**
 * Owner feedback of 2026-10-29, with art direction handed to us: the store
 * features strip, glass slider arrows, the menu as a side drawer, a masonry
 * that staggers when the feed is short, and the product page fixes.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = path => fs.readFileSync(path, 'utf8')
const extras = read('src/assets/styles/04-components/home-extras.scss')

test('store features are a hairline-divided strip, not white boxes', () => {
  assert.match(extras, /\.features__item \+ \.features__item \{\n {2}border-block-start: 1px solid var\(--border-subtle\);/)
  assert.match(extras, /outline-offset: 4px;/)
  assert.doesNotMatch(extras, /\.features__item \{[^}]*--surface-card/)
})

test('slider arrows are translucent glass from tokens', () => {
  assert.match(extras, /salla-slider \.s-slider-nav-arrow \{[^}]*color-mix\(in srgb, var\(--surface-card\) 28%, transparent\)/)
  assert.match(extras, /backdrop-filter: blur\(8px\);/)
})

test('the main menu opens as a side drawer', () => {
  assert.match(read('src/views/components/header/header.twig'), /id: {6}'main-menu-sheet',[\s\S]*?variant: 'drawer'/)
})

test('the stories masonry takes half the count in columns, two to five', () => {
  const twig = read('src/views/components/home/stories.twig')
  assert.match(twig, /round\(0, 'ceil'\)/)
  assert.match(twig, /style="--stories-columns: \{\{ stories_columns \}\}"/)
  assert.match(read('src/assets/styles/04-components/stories.scss'), /column-count: min\(3, var\(--stories-columns, 3\)\);/)
})

test('product page: white gallery stage, ink quick-buy label, a framed size table', () => {
  assert.match(read('src/assets/styles/04-components/product-gallery.scss'), /swiper-slide img \{[\s\S]*?background-color: var\(--surface-card\);/)
  const info = read('src/assets/styles/04-components/product-info.scss')
  assert.match(info, /\.s-add-product-button-mini-checkout-content \{\n {2}color: var\(--main-text-color\);/)
  assert.match(info, /\.size-guide__table tbody tr:nth-child\(even\)/)
})

test('a theme logo can stand in for the store logo in header, footer and filters', () => {
  const settings = JSON.parse(read('twilight.json')).settings
  assert.ok(settings.find(s => s.id === 'logo_main' && s.format === 'image'))
  for (const file of ['src/views/components/header/header.twig', 'src/views/components/footer/footer.twig', 'src/views/components/ui/filters-sheet.twig']) {
    assert.match(read(file), /theme\.settings\.get\('logo_main'\)\|default\(store\.logo\)/, file)
  }
})

test('a story card cannot be split across columns', () => {
  assert.match(read('src/assets/styles/04-components/stories.scss'), /\.story-card \{[^}]*display: inline-block;[^}]*inline-size: 100%;/)
})

test('a laptop shows four story columns', () => {
  assert.match(read('src/assets/styles/04-components/stories.scss'), /column-count: min\(4, var\(--stories-columns, 4\)\);/)
})

test('a review card contains its sr-only rating, so the page does not widen on a phone', () => {
  assert.match(extras, /\.testimonials__card \{\n {2}@apply relative /)
})

test('the light logo shows only over the hero; the solid bar shows the brand logo', () => {
  const header = read('src/views/components/header/header.twig')
  const css = read('src/assets/styles/04-components/store-header.scss')
  assert.match(header, /<img class="brand-logo--overlay"/)
  assert.match(header, /loading="\{\{ overlay_logo \? 'lazy' : 'eager' \}\}"/)
  assert.match(css, /\.store-header--solid \.brand-logo--overlay,/)
  assert.match(css, /body:not\(:has\(\.hero\)\) \.brand-logo--overlay \{\n {2}display: none;/)
})

test('recently viewed on Home sits on a clipping section panel, and its section hides when empty', () => {
  assert.match(read('src/views/components/home/recently-viewed.twig'), /<div class="s-block__panel" data-recently-viewed/)
  assert.match(extras, /\.recently-viewed \.s-block__panel \{\n {2}overflow: hidden;/)
  assert.match(extras, /\.recently-viewed:not\(:has\(\[data-recently-viewed\]\)\) \{\n {2}display: none;/)
})
