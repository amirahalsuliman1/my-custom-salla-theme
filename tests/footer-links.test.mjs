/**
 * The footer's «روابط مهمة» in two columns — on the markup salla-menu really
 * renders. The rules targeted ul/li, which the footer menu never emits, so the
 * links stacked in one column (owner, 2026-10-13).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const CSS = fs.readFileSync('src/assets/styles/04-components/footer.scss', 'utf8')

test('salla-menu footer still renders div.s-menu-footer-list > a.s-menu-footer-item', () => {
  const dir = fs.readdirSync('node_modules/.pnpm').find((d) => d.startsWith('@salla.sa+twilight-components@'))
  const file = path.join('node_modules/.pnpm', dir, 'node_modules/@salla.sa/twilight-components/dist/esm/salla-menu.entry.js')
  const src = fs.readFileSync(file, 'utf8')
  assert.match(src, /"s-menu-footer-list": !this\.topnav/)
  assert.match(src, /"s-menu-footer-item": !this\.topnav/)
})

test('the two columns are on the list the component draws', () => {
  // A two-column grid since 2026-10-15 (chrome audit): every mobile footer
  // reads the links row by row, which column-count could not do.
  assert.match(CSS, /\.store-footer__links \.s-menu-footer-list \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/)
  assert.match(CSS, /\.store-footer__links \.s-menu-footer-item \{[^}]*min-block-size: 2\.75rem;/)
  assert.doesNotMatch(CSS, /\.store-footer__links (ul|li)\b/)
})
