/**
 * The chrome audit (2026-10-15) — the announcement bars, the header hairlines,
 * the footer and the floating WhatsApp button, against the mobile PDFs and the
 * Desktop artboards supplied 2026-10-13. One test per confirmed item.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (f) => fs.readFileSync(f, 'utf8')
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const MASTER = read('src/views/layouts/master.twig')
const HEADER = read('src/views/components/header/header.twig')
const BAR = read('src/views/components/announcement-bar.twig')
const ACSS = strip(read('src/assets/styles/04-components/announcement.scss'))
const FCSS = strip(read('src/assets/styles/04-components/footer.scss'))
const HCSS = strip(read('src/assets/styles/04-components/store-header.scss'))
const GLOBAL = read('src/assets/styles/01-settings/global.scss')
const MANIFEST = JSON.parse(read('twilight.json'))
const setting = (id) => MANIFEST.settings.find((s) => s.id === id)
// Everything after the first `@include from-laptop` in a file.
const fromLaptop = (css) => css.slice(css.indexOf('@include from-laptop'))
const footerDesktop = fromLaptop(FCSS)

test('#19 the lower bar is on every page — desktop-only off Home', () => {
  assert.doesNotMatch(MASTER, /\{% if is_page\('index'\) %\}\s*\{% include 'components\.announcement-bar' with \{ position: 'bottom' \} %\}/)
  assert.match(MASTER, /\{% include 'components\.announcement-bar' with \{\s*position: 'bottom',\s*desktop_only: not is_page\('index'\)\s*\} %\}/)
  // the include sits after </main> and before the footer
  const at = MASTER.indexOf("position: 'bottom'")
  assert.ok(at > MASTER.indexOf('</main>') && at < MASTER.indexOf("{% component 'footer.footer' %}"))
  assert.match(setting('announcement_bottom_enabled').description, /الشاشات الكبيرة/)
})

test('#19/#95 the bar is the container content box, as wide as the footer panel', () => {
  const base = ACSS.slice(ACSS.indexOf('.announcement-bar {'))
  const rule = base.slice(0, base.indexOf('}'))
  assert.doesNotMatch(rule, /@apply[^;]*\bcontainer\b/)
  assert.match(rule, /margin-inline: max\(var\(--page-gutter, 16px\), calc\(\(100% - 1280px\) \/ 2 \+ var\(--page-gutter, 16px\)\)\);/)
})

test('#21 the inner-page top bar is a full-width ruled band from 1024px; Home keeps the strip', () => {
  assert.match(HEADER, /band: not header_is_overlay/)
  assert.match(BAR, /\{\{ band is defined and band \? 'announcement-bar--band' : '' \}\}/)
  const d = fromLaptop(ACSS)
  assert.match(d, /\.announcement-bar--band\.card \{\s*margin: 0;\s*border-radius: 0;\s*border-block: 1px solid var\(--border-interactive\);\s*\}/)
  // only from 1024px: nothing above the first from-laptop block names it
  assert.ok(!ACSS.slice(0, ACSS.indexOf('@include from-laptop')).includes('--band'))
})

test('#95 the bar is the warm section tone with no stroke, in light, dark and the setting', () => {
  const lines = GLOBAL.match(/--announcement-bg:[^;]*;/g)
  assert.deepEqual(lines, ['--announcement-bg: var(--surface-section);', '--announcement-bg: var(--surface-section);'])
  assert.equal(setting('announcement_bg').value, '#F7F6F4')
  assert.match(ACSS, /\.announcement-bar\.card \{\s*background-color: var\(--announcement-bg\);\s*border: 0;\s*\}/)
})

test('#20 the desktop footer packs social, SBC and payments into one row', () => {
  assert.match(footerDesktop, /\.store-footer__inner \{\s*@apply grid items-center gap-x-8 gap-y-6;\s*grid-template-columns: 1fr 1fr 1fr;\s*grid-auto-flow: row dense;/)
  // the badges host is still between the two in the DOM — the reason for dense
  const FOOTER = read('src/views/components/footer/footer.twig')
  const social = FOOTER.indexOf('<salla-social')
  const badges = FOOTER.indexOf('<salla-trust-badges')
  const payments = FOOTER.indexOf('<salla-payments')
  assert.ok(social < badges && badges < payments)
})

test('#22 the mobile links flow row by row; desktop stays one row', () => {
  const base = FCSS.slice(FCSS.indexOf('.store-footer__links .s-menu-footer-list {'))
  const rule = base.slice(0, base.indexOf('}'))
  assert.match(rule, /display: grid;\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);\s*column-gap: 2rem;/)
  assert.doesNotMatch(FCSS, /column-count|break-inside/)
  assert.match(footerDesktop, /\.store-footer__links \.s-menu-footer-list \{\s*@apply flex max-w-none flex-wrap justify-between gap-x-8;\s*\}/)
})

test('#93 both footer hairlines are the drawn #646361 ink', () => {
  assert.match(FCSS, /\.store-footer__rule \{\s*@apply w-full;\s*border-color: var\(--border-interactive\);/)
})

test('#94 the desktop header and band hairlines are the drawn #646361 ink', () => {
  const d = fromLaptop(HCSS)
  assert.match(d, /\.store-header--solid \{\s*background-color: var\(--surface-card\);\s*border-block-end: 1px solid var\(--border-interactive\);/)
  assert.match(d, /\.store-header__band \{[^}]*border-block-end: 1px solid var\(--border-interactive\);/)
  // the mobile floating bar keeps the subtle trim its export draws
  assert.match(HCSS, /\.store-header--solid \.store-header__bar \{[^}]*border: 1px solid var\(--border-subtle\);/)
})

test('#96 the SBC mark stands above its caption from 1024px; pills on the caption line', () => {
  assert.match(footerDesktop, /\.store-footer__payments \.store-footer__sbc a \{\s*@apply flex-col gap-2;/)
  assert.match(footerDesktop, /\.store-footer__payments \.s-payments-list \{\s*@apply flex-nowrap items-end justify-end;/)
  assert.match(footerDesktop, /> \.store-footer__social \{\s*grid-column: 1;\s*align-self: end;/)
  // mobile keeps the mark beside the caption
  const mobile = FCSS.slice(0, FCSS.indexOf('@include from-laptop'))
  assert.match(mobile, /\.store-footer__payments \.store-footer__sbc a \{\s*@apply mx-auto flex min-h-11 w-auto items-center justify-center gap-3/)
})

test('#97 the social pills are filled with the drawn #FDFDFD tile', () => {
  assert.match(FCSS, /\.store-footer__social a \{[^}]*border: 1px solid var\(--border-interactive\);\s*background-color: var\(--surface-page\);/)
})

test('#98 no WhatsApp disc from 1024px, and back-to-top drops its stack there', () => {
  const fab = strip(read('src/assets/styles/04-components/whatsapp-fab.scss'))
  assert.match(fromLaptop(fab), /\.whatsapp-fab \{\s*display: none;\s*\}/)
  // still shown below 1024px
  assert.match(fab.slice(0, fab.indexOf('@include from-laptop')), /\.whatsapp-fab \{\s*@apply fixed z-30 inline-flex/)
  const btt = strip(read('src/assets/styles/04-components/back-to-top.scss'))
  assert.match(fromLaptop(btt), /body:has\(\[data-whatsapp-fab\]\[data-side='end'\]\) \.back-to-top--end,\s*body:has\(\[data-whatsapp-fab\]\[data-side='start'\]\) \.back-to-top--start \{\s*--back-to-top-stack: 0rem;/)
  assert.match(setting('whatsapp_fab_enabled').description, /الشاشات الكبيرة/)
})
