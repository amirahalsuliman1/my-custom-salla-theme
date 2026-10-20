/**
 * Salla support's answer, 2026-10-20 (PES-22097): the preview store's Home
 * lacked visual consistency. These hold the theme defects their screenshot
 * showed. The unplayable-video case is in t-4.23-video-carousel.test.mjs.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = path => fs.readFileSync(path, 'utf8')

test('the Home fixed-products section is always the vertical grid', () => {
  const twig = read('src/views/components/home/fixed-products.twig')
  assert.match(twig, /class="vertical-products">/)
  assert.doesNotMatch(twig, /horizontal-cards/)
  assert.doesNotMatch(twig, /theme\.settings\.get\('vertical_fixed_products'/)
  // The landing page still owns the setting.
  assert.match(read('src/views/pages/landing-page.twig'), /vertical_fixed_products/)
})

test('the lookbook card image fills its column and covers its box', () => {
  const css = read('src/assets/styles/04-components/hotspot.scss')
  assert.match(css, /\.lookbook \.hotspot__pill-link \{\n {4}@apply flex-1 flex-col items-stretch;/)
  assert.match(css, /\.lookbook \.hotspot__pill-thumb \{\n {4}@apply w-full flex-1 rounded-large object-cover;/)
  assert.doesNotMatch(css, /\n {4}block-size: 18rem;/)
})

test('the Home FAQ is a borderless panel; the FAQ page keeps its outlined card', () => {
  const css = read('src/assets/styles/04-components/accordion.scss')
  assert.match(css, /\.s-block\.faq \.faq__panel \{\n {2}border-color: transparent;/)
  assert.match(css, /\.s-information-page \.s-block\.faq \.faq__panel \{\n {2}border-color: var\(--border-interactive\);/)
})

test('the photos pause control sits on the stage over the photographs', () => {
  const twig = read('src/views/components/home/photos-slider.twig')
  const stage = twig.indexOf('class="photos-carousel__stage"')
  assert.notEqual(stage, -1)
  assert.ok(twig.indexOf('data-autoplay-toggle', stage) > twig.indexOf('</salla-slider>', stage))
  assert.match(read('src/assets/styles/04-components/photos-carousel.scss'), /\.photos-carousel__stage \{\n {2}@apply relative;/)
})

test('the card eye takes the heart disc', () => {
  const css = read('src/assets/styles/04-components/quick-view.scss')
  assert.match(css, /\.product-card__quick-view \{\n {2}@apply inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-card shadow-light;/)
})
