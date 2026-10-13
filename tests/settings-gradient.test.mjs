/**
 * Owner request 2026-10-13 — the gradient, off until both colours and a place
 * are chosen; and the button colour reaching the platform's primary buttons.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const MANIFEST = JSON.parse(fs.readFileSync('twilight.json', 'utf8'))
const MASTER = fs.readFileSync('src/views/layouts/master.twig', 'utf8')
const CSS = fs.readFileSync('src/assets/styles/04-components/gradient.scss', 'utf8')
const BUTTONS = fs.readFileSync('src/assets/styles/04-components/buttons.scss', 'utf8')
const APP = fs.readFileSync('src/assets/styles/app.scss', 'utf8')
const setting = (id) => MANIFEST.settings.find((s) => s.id === id)

test('every gradient setting defaults to off or empty', () => {
  assert.equal(setting('gradient_color_start')?.value, null)
  assert.equal(setting('gradient_color_end')?.value, null)
  for (const id of ['gradient_on_buttons', 'gradient_on_quantity', 'gradient_on_bars']) {
    assert.equal(setting(id)?.value, false, id)
  }
})

test('a place switches on only when both colours are set', () => {
  assert.match(MASTER, /set gradient_ready = theme\.settings\.get\('gradient_color_start'\) and theme\.settings\.get\('gradient_color_end'\)/)
  for (const place of ['buttons', 'quantity', 'bars']) {
    assert.match(MASTER, new RegExp(`gradient_ready and theme\\.settings\\.get\\('gradient_on_${place}'\\) \\? ' gradient-${place}'`), place)
    assert.match(CSS, new RegExp(`body\\.gradient-${place} `), place)
  }
})

test('the gradient file loads after the components it repaints', () => {
  for (const before of ['buttons', 'announcement', 'marquee', 'forms', 'cart']) {
    assert.ok(APP.indexOf(`04-components/${before}'`) < APP.indexOf("04-components/gradient'"), before)
  }
})

test('the button colour reaches the platform solid primary button', () => {
  assert.match(BUTTONS, /\.s-button-solid\.s-button-primary:not\(:disabled\) \{\s*background-color: var\(--color-button-bg\);/)
})
