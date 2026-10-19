/**
 * The public-theme pass, 2026-10-19: what sets the theme apart from Raed on the
 * product page, the category pages and the product card (Salla's review).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (f) => fs.readFileSync(f, 'utf8')
const MANIFEST = JSON.parse(read('twilight.json'))
const setting = (id) => MANIFEST.settings.find((s) => s.id === id)
const CARD = read('src/assets/js/partials/product-card.js')
const LISTING = read('src/views/pages/product/index.twig')
const PDP = read('src/views/pages/product/single.twig')
const LOOKBOOK = read('src/views/components/home/lookbook.twig')
const STORIES = read('src/assets/js/partials/pdp-stories.js')
const ELSEWHERE = read('src/assets/js/partials/lookbook-elsewhere.js')

test('no default names the Almas store', () => {
  assert.doesNotMatch(JSON.stringify(MANIFEST.settings.map((s) => s.value)), /أملاس|Am1als/i)
})

test('the card fetches the details once per product, on the first hover, from 1024px', () => {
  assert.match(CARD, /const hoverDetails = new Map\(\)/)
  assert.match(CARD, /\(hover: hover\) and \(min-width: 1024px\)/)
  assert.match(CARD, /addEventListener\('pointerenter', \(\) => this\.loadHoverLook\(media\), \{ once: true \}\)/)
  assert.match(CARD, /fetchProduct\(id, \['images', 'options'\]\)/)
})

test('the grid toggle: two pressable sizes, a merchant default, the shopper\'s choice kept', () => {
  assert.match(LISTING, /data-grid-density="\{\{ theme\.settings\.get\('listing_grid_default', 'small'\) \}\}"/)
  assert.match(LISTING, /data-grid-density-set="large" aria-pressed="false"/)
  assert.match(read('src/assets/js/partials/grid-density.js'), /localStorage\.setItem\(KEY, value\)/)
  assert.equal(setting('listing_grid_toggle').value, true)
  assert.equal(setting('listing_grid_default').value, 'small')
})

test('stories strips filter: this product on the PDP, the category tag on its page', () => {
  assert.match(PDP, /data-filter-product="\{\{ product\.id \}\}"/)
  assert.match(LISTING, /data-filter-tag="\{\{ page\.title\|striptags\|trim \}\}"/)
  assert.match(STORIES, /card\.dataset\.storyProduct === product/)
  assert.match(read('src/views/components/stories/story-card.twig'), /data-story-tags=/)
})

test('a Home shoppable image carries where else it shows, and can hide from Home', () => {
  assert.match(LOOKBOOK, /data-lookbook-products="\{\{ lookbook_product_ids\|join\(','\) \}\}"/)
  assert.match(LOOKBOOK, /data-lookbook-category="\{\{ lookbook_category_id \}\}"/)
  assert.match(LOOKBOOK, /\{% if lookbook_hidden %\}<template data-lookbook-store>\{% endif %\}/)
  const fields = MANIFEST.components.find((c) => c.path === 'home.lookbook').fields.map((f) => f.id)
  for (const id of ['show_on_products', 'category', 'hide_on_home']) assert.ok(fields.includes(id), id)
  assert.match(ELSEWHERE, /template\.content\.querySelectorAll\('\[data-lookbook\]'\)/)
  assert.match(PDP, /data-lookbook-mount data-for-product="\{\{ product\.id \}\}"/)
  assert.match(LISTING, /data-lookbook-mount data-for-category="\{\{ page\.id \}\}"/)
})

test('the size guide opens in the shared sheet, for tagged products or all', () => {
  assert.match(PDP, /data-sheet-open="size-guide-sheet"/)
  assert.match(PDP, /id: {4}'size-guide-sheet'/)
  for (const id of ['size_guide_image', 'size_guide_text', 'size_guide_title', 'size_guide_tag']) assert.ok(setting(id), id)
})

test('every page that loads the product bundle loads media.js before it (dependOn)', () => {
  const config = read('webpack.config.js')
  assert.match(config, /product : \{import: \[[^\]]*\], dependOn: \['app', 'media'\]\}/)
  for (const file of ['src/views/pages/product/index.twig', 'src/views/pages/product/single.twig']) {
    const twig = read(file)
    const media = twig.indexOf("'media.js' | asset")
    const product = twig.indexOf("'product.js' | asset")
    assert.ok(media !== -1 && media < product, `${file} loads media.js before product.js`)
  }
})

test('empty mounts stay rendered (watched by the scripts) and only lose their margin', () => {
  const css = read('src/assets/styles/04-components/hotspot.scss')
  assert.match(css, /\.product-stories-mount:has\(> \[hidden\]\) \{\s*margin-block-start: 0 !important;/)
  assert.doesNotMatch(css, /-mount:has\(> \[hidden\]\)[^{]*\{\s*display: none/)
})

test('size-guide lines with «|» render as a table, the first one its header', () => {
  assert.match(PDP, /<table class="size-guide__table">/)
  assert.match(PDP, /\{% if '\|' in line %\}/)
})
