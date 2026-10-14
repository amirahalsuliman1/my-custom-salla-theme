/**
 * Preview links (2026-10-14) — in a theme preview, links Salla's data points at
 * the store's own domain are kept inside the preview; on a real store, where
 * the links and the page share a host, nothing is touched.
 */
import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createDom, teardownDom, loadFresh } from './harness/dom.mjs'

afterEach(() => teardownDom())

test('a link to the store path on another host stays in the preview', async () => {
  createDom()
  const { previewTarget } = await loadFresh('src/assets/js/partials/preview-links.js')
  assert.equal(
    previewTarget('https://live.example/dev-x/%D8%A7%D9%84%D9%81%D8%B3%D8%A7%D8%AA%D9%8A%D9%86/c770218866', '/dev-x'),
    'https://example.test/dev-x/%D8%A7%D9%84%D9%81%D8%B3%D8%A7%D8%AA%D9%8A%D9%86/c770218866',
  )
})

test('a same-host link, a foreign path and a non-http link are left alone', async () => {
  createDom()
  const { previewTarget } = await loadFresh('src/assets/js/partials/preview-links.js')
  assert.equal(previewTarget('https://example.test/dev-x/cart', '/dev-x'), null)
  assert.equal(previewTarget('https://instagram.com/am1als', '/dev-x'), null)
  assert.equal(previewTarget('mailto:a@b.c', '/dev-x'), null)
  assert.equal(previewTarget('https://live.example/dev-x/cart', ''), null)
})

test('it ships in the app bundle', () => {
  assert.match(fs.readFileSync('webpack.config.js', 'utf8'), /asset\('js\/partials\/preview-links\.js'\)/)
})
