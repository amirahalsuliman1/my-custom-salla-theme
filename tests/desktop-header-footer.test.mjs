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
const desktop = (css) => css.slice(css.indexOf('── DESKTOP (1024px'))

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

test('the desktop hero is a 31:20 card with an optional landscape image', () => {
  const HERO = fs.readFileSync('src/views/components/home/hero.twig', 'utf8')
  const CSS = fs.readFileSync('src/assets/styles/04-components/hero.scss', 'utf8')
  const MANIFEST = JSON.parse(fs.readFileSync('twilight.json', 'utf8'))
  assert.match(HERO, /\{% if slide\.image_desktop %\}\s*<source media="\(min-width: 1024px\)"/)
  assert.match(desktop(CSS), /\.hero__slide \{\s*aspect-ratio: 31 \/ 20;/)
  const slides = MANIFEST.components.find((c) => c.path === 'home.hero').fields.find((f) => f.id === 'slides')
  assert.ok(slides.fields.some((f) => f.id === 'slides.image_desktop' && f.required === false))
})

test('desktop Home sections follow the artboard', () => {
  const read = (f) => fs.readFileSync(f, 'utf8')
  const fromLaptop = (css) => css.slice(css.indexOf('@include from-laptop'))
  // products: wider cards on desktop; fixed products share the centred header
  assert.match(fromLaptop(read('src/assets/styles/04-components/product-carousel.scss')), /> \* \{\s*@apply w-96;/)
  assert.match(read('src/views/components/home/fixed-products.twig'), /include 'components\.ui\.section-header'/)
  // lookbook: photo + product column, markers off, scoped away from the stories modal
  const hot = read('src/assets/styles/04-components/hotspot.scss')
  assert.match(hot, /\.lookbook \.hotspot \{\s*@apply grid items-stretch gap-4;\s*grid-template-columns: 1\.9fr 1fr;/)
  assert.match(hot, /\.lookbook \.hotspot__marker \{\s*@apply hidden;/)
  // video: three in a row from 1024px, not centred
  assert.match(read('src/views/components/home/video-carousel.twig'), /"breakpoints":\{"1024":\{"centeredSlides":false,"slidesPerView":3,"spaceBetween":16\}\}/)
  // stories: five columns, a scrolling window on Home only
  const stories = read('src/assets/styles/04-components/stories.scss')
  assert.match(stories, /column-count: 5;/)
  assert.match(stories, /\.s-block\.stories \.stories__grid \{[^}]*max-block-size: 31rem;/)
})

test('desktop Home: photos three in a row, lookbook side, landscape partner banner', () => {
  const read = (f) => fs.readFileSync(f, 'utf8')
  assert.match(read('src/views/components/home/photos-slider.twig'), /"breakpoints":\{"1024":\{"centeredSlides":false,"slidesPerView":3/)
  const MANIFEST = JSON.parse(read('twilight.json'))
  const side = MANIFEST.components.find((c) => c.path === 'home.lookbook').fields.find((f) => f.id === 'desktop_side')
  assert.deepEqual(side.options.map((o) => o.value), ['right', 'left'])
  assert.equal(side.selected[0].value, 'right')
  assert.match(read('src/views/components/home/lookbook.twig'), /lookbook_side == 'left' \? ' lookbook--image-left'/)
  assert.match(read('src/assets/styles/04-components/hotspot.scss'), /\.lookbook--image-left \.hotspot__figure \{\s*order: 2;/)
})

test('desktop listing: three columns beside the filters, 20rem column, wide cover', () => {
  const read = (f) => fs.readFileSync(f, 'utf8')
  const listing = read('src/assets/styles/04-components/listing.scss')
  assert.match(listing, /:has\(\.filters-sheet\) \.listing__products \.s-products-list-vertical-cards \{\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/)
  assert.match(listing, /aspect-ratio: 36 \/ 17;/)
  assert.match(read('src/assets/styles/04-components/filters.scss'), /inline-size: 20rem;/)
})

test('PDP notes: two merchant blocks, open by default, hidden without text', () => {
  const read = (f) => fs.readFileSync(f, 'utf8')
  const pdp = read('src/views/pages/product/single.twig')
  assert.match(pdp, /\{% if theme\.settings\.get\('pdp_shipping_text'\) %\}/)
  assert.match(pdp, /\{% if theme\.settings\.get\('pdp_notice_text'\) %\}/)
  assert.match(pdp, /\{% if pdp_notes\|length %\}/)
  assert.match(pdp, /aria-expanded="true"[\s\S]*?data-faq-trigger/)
  assert.doesNotMatch(pdp.slice(pdp.indexOf('product-notes')), /\|split|nl2br/)
  assert.match(read('src/assets/js/partials/accordion.js'), /getAttribute\('aria-expanded'\) === 'true'/)
  const MANIFEST = JSON.parse(read('twilight.json'))
  for (const id of ['pdp_shipping_title', 'pdp_shipping_text', 'pdp_notice_title', 'pdp_notice_text']) {
    assert.equal(MANIFEST.settings.find((s) => s.id === id)?.value, null, id)
  }
})

test('desktop account: wide breadcrumb, 64rem content, order tabs, quick view gallery', () => {
  const read = (f) => fs.readFileSync(f, 'utf8')
  assert.match(read('src/assets/styles/04-components/customer-layout.scss'), /\.customer-layout__content \{\s*@apply mx-auto;\s*max-inline-size: 64rem;/)
  const orders = read('src/views/pages/customer/orders/index.twig')
  assert.match(orders, /class="order-tabs"[^>]*>|<div class="order-tabs"/)
  assert.match(orders, /data-sort-disclosure data-sort-param="orders">\s*\{% for group in \['previous', 'in_progress', 'pending_payment'\] %\}/)
  assert.match(read('src/assets/js/partials/order-list.js'), /querySelectorAll\('\[data-sort-param="orders"\]'\)\.forEach/)
  const qv = read('src/assets/js/partials/quick-view.js')
  assert.match(qv, /class="quick-view__media"/)
  assert.match(qv, /data-quick-view-thumb/)
  assert.match(read('src/assets/styles/04-components/quick-view.scss'), /\.quick-view__media \{\s*@apply hidden;/)
})

test('desktop content pages and the stories page', () => {
  const read = (f) => fs.readFileSync(f, 'utf8')
  assert.match(read('src/assets/styles/04-components/prose.scss'), /\.static-page \{\s*@apply max-w-none;\s*max-inline-size: 64rem;/)
  const stories = read('src/assets/styles/04-components/stories.scss')
  assert.match(stories, /\[data-stories-controls\] \{\s*@apply mb-4 flex items-center justify-between/)
  assert.match(stories, /\.s-information-page \.s-block\.stories \.stories__grid \{[^}]*max-block-size: none;/)
})
