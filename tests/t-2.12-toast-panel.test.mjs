/**
 * T-2.12 — the toast panel stays the design's card in every state.
 *
 * Upstream's 05-utilities/swal.scss paints a success toast green and an error
 * toast red with `.swal2-container .swal2-popup.swal2-toast.swal2-icon-*` —
 * one class more than toast.scss's base panel rule, so it won on the demo store
 * (2026-10-13) although toast.scss is imported after it. toast.scss must restate
 * the panel colour at that specificity for both states.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const UPSTREAM = fs.readFileSync('src/assets/styles/05-utilities/swal.scss', 'utf8')
const TOAST = fs.readFileSync('src/assets/styles/05-utilities/toast.scss', 'utf8')
const APP = fs.readFileSync('src/assets/styles/app.scss', 'utf8')

function ruleBodies(css, selector) {
  const bodies = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  for (const [, selectors, body] of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(re)) {
    if (selectors.split(',').map(s => s.trim()).includes(selector)) bodies.push(body)
  }
  return bodies
}

test('upstream still paints the two states — the reason the override exists', () => {
  assert.match(UPSTREAM, /&\.swal2-icon-success\s*\{\s*@apply bg-green-500/)
  assert.match(UPSTREAM, /&\.swal2-icon-error\s*\{\s*@apply bg-red-400/)
})

test('toast.scss is imported after swal.scss', () => {
  assert.ok(APP.indexOf("05-utilities/swal'") < APP.indexOf("05-utilities/toast'"))
})

for (const state of ['success', 'error']) {
  test(`a ${state} toast keeps the card surface`, () => {
    const selector = `.swal2-container .swal2-popup.swal2-toast.swal2-icon-${state}`
    const bodies = ruleBodies(TOAST, selector)
    assert.ok(
      bodies.some(body => /background-color:\s*var\(--surface-card\)/.test(body)),
      `${selector} must restate background-color: var(--surface-card)`,
    )
  })
}
