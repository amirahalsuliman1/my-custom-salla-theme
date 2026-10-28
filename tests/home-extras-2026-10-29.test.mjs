/**
 * Owner option (a), 2026-10-29: Salla's reviews and store-features sections,
 * offered on Home in the theme's own language.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = path => fs.readFileSync(path, 'utf8')
const twilight = JSON.parse(read('twilight.json'))

test('«آراء العملاء» is a registered component with its own fields', () => {
  const component = twilight.components.find(c => c.path === 'home.custom-testimonials')
  assert.ok(component)
  const items = component.fields.find(f => f.id === 'items')
  assert.deepEqual(items.fields.map(f => f.id), ['items.name', 'items.text', 'items.stars', 'items.avatar'])
  const stars = items.fields.find(f => f.id === 'items.stars')
  assert.equal(stars.minValue, 1)
  assert.equal(stars.maxValue, 5)
})

test('the reviews template uses the panel, the header and the card star row', () => {
  const twig = read('src/views/components/home/custom-testimonials.twig').replace(/\{#[\s\S]*?#\}/g, '')
  assert.match(twig, /class="s-block__panel"/)
  assert.match(twig, /components\.ui\.section-header/)
  assert.match(twig, /class="product-card__rating testimonials__rating"/)
  assert.match(twig, /trans\('theme\.testimonials\.rating'/)
  assert.doesNotMatch(twig, /<h1/)
  assert.doesNotMatch(twig, /salla-slider/)
  assert.match(twig, /width="40"\s+height="40"/)
})

test('store features sit in the section panel as a list of cards', () => {
  const twig = read('src/views/components/home/store-features.twig')
  assert.match(twig, /class="s-block__panel"/)
  assert.match(twig, /<ul class="features__grid" role="list">/)
  assert.ok(twilight.features.includes('component-store-features'))
})

test('both are styled from tokens, and the stylesheet is imported', () => {
  const css = read('src/assets/styles/04-components/home-extras.scss')
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i)
  assert.match(css, /var\(--surface-card\)/)
  assert.match(read('src/assets/styles/app.scss'), /@import '\.\/04-components\/home-extras';/)
})

test('the rating sentence exists in both locales', () => {
  assert.equal(JSON.parse(read('src/locales/ar.json')).theme.testimonials.rating, 'تقييم :stars من 5')
  assert.equal(JSON.parse(read('src/locales/en.json')).theme.testimonials.rating, 'Rated :stars out of 5')
})
