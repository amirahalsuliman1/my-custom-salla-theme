/**
 * Owner request 2026-10-13 — numbered setting groups, the logo sizes, the page
 * gutter and the animation switch.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const MANIFEST = JSON.parse(fs.readFileSync('twilight.json', 'utf8'))
const MASTER = fs.readFileSync('src/views/layouts/master.twig', 'utf8')
const TAILWIND = fs.readFileSync('tailwind.config.js', 'utf8')
const MOTION = fs.readFileSync('src/assets/styles/02-generic/motion.scss', 'utf8')
const ANIME = fs.readFileSync('src/assets/js/partials/anime.js', 'utf8')
const setting = (id) => MANIFEST.settings.find((s) => s.id === id)

test('the group titles are numbered 1, 2, 3 … in order', () => {
  const numbers = MANIFEST.settings
    .filter((s) => s.type === 'static' && s.format === 'title')
    .map((s) => Number(s.value.match(/>(\d+)<\/span>/)?.[1]))
  assert.deepEqual(numbers, numbers.map((_, i) => i + 1))
})

test('the three sizes are bounded numbers whose defaults are the design', () => {
  for (const [id, value] of [['header_logo_height', 32], ['footer_logo_height', 40], ['page_gutter', 16]]) {
    const s = setting(id)
    assert.equal(s?.type, 'number', id)
    assert.equal(s.value, value, id)
    assert.ok(s.minValue <= value && value <= s.maxValue, id)
  }
})

test('master.twig writes each size into its custom property', () => {
  assert.match(MASTER, /--logo-height: \{\{ theme\.settings\.get\('header_logo_height'\)\|default\(32\) \}\}px;/)
  assert.match(MASTER, /--footer-logo-height: \{\{ theme\.settings\.get\('footer_logo_height'\)\|default\(40\) \}\}px;/)
  assert.match(MASTER, /--page-gutter: \{\{ theme\.settings\.get\('page_gutter'\)\|default\(16\) \}\}px;/)
  assert.match(TAILWIND, /padding: 'var\(--page-gutter, 16px\)'/)
})

test('the animation switch reaches CSS and anime.js', () => {
  assert.equal(setting('enable_animations')?.value, true)
  assert.match(MASTER, /theme\.settings\.get\('enable_animations', true\) \? '' : ' motion-off'/)
  assert.match(MOTION, /\.motion-off \*,/)
  assert.match(ANIME, /classList\.contains\('motion-off'\)/)
})
