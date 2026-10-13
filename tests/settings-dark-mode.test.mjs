/**
 * Owner request 2026-10-13 — the dark mode and the store background image.
 * Off by default; decided before paint; tokens re-pointed rather than
 * components restyled.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const MANIFEST = JSON.parse(fs.readFileSync('twilight.json', 'utf8'))
const MASTER = fs.readFileSync('src/views/layouts/master.twig', 'utf8')
const HEADER = fs.readFileSync('src/views/components/header/header.twig', 'utf8')
const GLOBAL = fs.readFileSync('src/assets/styles/01-settings/global.scss', 'utf8')
const DARK = fs.readFileSync('src/assets/styles/04-components/dark-mode.scss', 'utf8')
const JS = fs.readFileSync('src/assets/js/partials/color-mode.js', 'utf8')
const setting = (id) => MANIFEST.settings.find((s) => s.id === id)

test('the store opens light unless the merchant says otherwise', () => {
  assert.equal(setting('dark_mode')?.selected?.[0]?.value, 'light')
  assert.deepEqual(setting('dark_mode').options.map((o) => o.value), ['light', 'dark', 'auto'])
  assert.equal(setting('dark_mode_toggle')?.value, false)
})

test('the mode is decided in <head> before any stylesheet', () => {
  const script = MASTER.indexOf("document.documentElement.classList.add('dark')")
  assert.ok(script > -1)
  assert.ok(script < MASTER.indexOf('components.critical-css'), 'must run before the first styles')
  assert.match(MASTER, /localStorage\.getItem\('am1als:color-mode'\)/)
  assert.match(JS, /const KEY = 'am1als:color-mode'/)
})

test('the dark tokens outrank the merchant light colours', () => {
  assert.match(GLOBAL, /^html\.dark \{/m)
  for (const token of ['--surface-page', '--surface-card', '--main-text-color', '--text-secondary', '--border-subtle', '--focus-ring-color']) {
    assert.match(GLOBAL.slice(GLOBAL.indexOf('html.dark {')), new RegExp(`${token}:`), token)
  }
  assert.match(MASTER, /html\.dark \{\s*\{% if theme\.settings\.get\('dark_color_page'\) %\}/)
})

test('the switch is a real toggle and only rendered when allowed', () => {
  assert.match(HEADER, /\{% if theme\.settings\.get\('dark_mode_toggle', false\) %\}[\s\S]*data-color-mode-toggle[\s\S]*aria-pressed="false"/)
  assert.match(JS, /setAttribute\('aria-pressed', String\(dark\)\)/)
})

test('gray utilities and the dark logo are covered', () => {
  assert.match(DARK, /html\.dark \[class~='bg-white'\] \{/)
  assert.match(DARK, /html\.dark \.brand-logo--dark \{\s*display: block;/)
})

test('the background images are off without an image', () => {
  assert.equal(setting('store_background_image')?.value, '')
  assert.match(MASTER, /\{% if theme\.settings\.get\('store_background_image'\) %\}\s*--store-bg-image:/)
})

test('no dark rule names a utility class that @apply would copy', () => {
  assert.doesNotMatch(DARK, /html\.dark \.(bg|text|border)-(white|black|gray)/)
})

test('the page behind the panels reads the page token', () => {
  const bg = fs.readFileSync('src/assets/styles/04-components/page-background.scss', 'utf8')
  assert.match(bg, /body \{[^}]*background-color: var\(--surface-page\);/)
})
