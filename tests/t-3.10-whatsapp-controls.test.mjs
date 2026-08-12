/**
 * T-3.10, second pass — the WhatsApp button's four controls.
 *
 * TWO OF THESE ARE NOT COSMETIC, AND BOTH ARE THE REASON THIS FILE EXISTS.
 *
 *   · THE LABEL CHANGES THE ACCESSIBLE NAME. With no label the button is an
 *     icon in a circle and `aria-label` is the only name it can have; with one,
 *     keeping that attribute would make a screen reader announce something
 *     different from what the button says. WCAG 2.5.3 is exactly about those
 *     two not disagreeing.
 *   · THE SIDE MAKES A DORMANT BUG LIVE. The old rule paired the logical
 *     `inset-inline-end` with the physical `env(safe-area-inset-left)` —
 *     correct in Arabic by coincidence, wrong the moment the button moves or
 *     the store runs LTR. T-8.11 recorded it as a thing to watch; letting the
 *     merchant choose a side is what turns it into a thing to fix.
 *
 * WHAT THESE TESTS CANNOT DO. Nothing here proves the button clears the home
 * indicator on a notched phone — `env()` is `0px` until `viewport-fit=cover`
 * exists, which is T-8.11's call. /docs/MANUAL-QA.md §5.7 and §6.2.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const MANIFEST = JSON.parse(fs.readFileSync('twilight.json', 'utf8'))
const TWIG = fs.readFileSync('src/views/components/ui/whatsapp-fab.twig', 'utf8')
const CSS = fs.readFileSync('src/assets/styles/04-components/whatsapp-fab.scss', 'utf8')
const GLOBAL = fs.readFileSync('src/assets/styles/01-settings/global.scss', 'utf8')
const MASTER = fs.readFileSync('src/views/layouts/master.twig', 'utf8')

const setting = (id) => MANIFEST.settings.find((s) => s.id === id)

describe('T-3.10 — the four settings default to the button as drawn', () => {
  test('the two colours are pickers defaulting to today’s values', () => {
    assert.equal(setting('whatsapp_fab_bg').format, 'color')
    assert.equal(setting('whatsapp_fab_bg').value, '#FFFFFF')
    assert.equal(setting('whatsapp_fab_icon_color').format, 'color')
    assert.equal(setting('whatsapp_fab_icon_color').value, '#1B1B1B')
  })

  test('both tokens alias, so an untouched button is unchanged', () => {
    assert.match(GLOBAL, /--whatsapp-fab-bg:\s*var\(--surface-card\);/)
    assert.match(GLOBAL, /--whatsapp-fab-icon:\s*var\(--main-text-color\);/)
  })

  test('the label ships empty, because the artboard draws a bare disc', () => {
    assert.equal(setting('whatsapp_fab_label').value, '')
    assert.equal(setting('whatsapp_fab_label').multilanguage, true)
  })

  test('the side defaults to the inline end, which is what the design draws', () => {
    const s = setting('whatsapp_fab_side')
    assert.equal(s.format, 'dropdown-list')
    assert.equal(s.selected[0].value, 'end')
    assert.deepEqual(
      s.options.map((o) => o.value),
      ['end', 'start'],
    )
  })

  test('the colours are emitted guarded', () => {
    for (const [id, token] of [
      ['whatsapp_fab_bg', '--whatsapp-fab-bg'],
      ['whatsapp_fab_icon_color', '--whatsapp-fab-icon'],
    ]) {
      const line = `${token}: {{ theme.settings.get('${id}') }};`
      assert.ok(MASTER.includes(line), `${id} never reaches CSS`)
    }
  })
})

describe('T-3.10 — the label and the accessible name cannot disagree', () => {
  test('aria-label is emitted ONLY when there is no visible text', () => {
    // WCAG 2.5.3, Label in Name. With both, a screen reader announces
    // «تواصل عبر واتساب» while the button reads «راسلنا» — and voice control
    // users cannot activate it by saying what they can see.
    assert.match(TWIG, /\{% if not whatsapp_label %\}aria-label=/)
  })

  test('the label is rendered inside the anchor, so it names the control', () => {
    assert.match(TWIG, /\{% if whatsapp_label %\}\s*<span class="whatsapp-fab__label">/)
  })

  test('the button stays a 44px circle when there is no label', () => {
    // `min-w-11`, not `w-11`: a fixed width clips the text rather than widening
    // the pill. The floor is T-2.05's touch target and must survive both cases.
    assert.match(CSS, /\.whatsapp-fab\s*\{[\s\S]*?min-w-11/)
    assert.ok(
      !/\.whatsapp-fab\s*\{[^}]*\sw-11\b/.test(CSS.replace(/\/\*[\s\S]*?\*\//g, '')),
      'a fixed width would clip the label',
    )
  })

  test('the horizontal padding hangs off the label, not off the button', () => {
    // Otherwise an icon-only button is a slightly-too-wide oval rather than the
    // disc the artboard draws.
    assert.match(
      CSS,
      /\.whatsapp-fab:has\(\.whatsapp-fab__label\)\s*\{[\s\S]*?padding-inline-start/,
    )
  })
})

describe('T-3.10 — the side, and the safe-area bug it would have exposed', () => {
  test('both sides are declared, each with a logical inset', () => {
    assert.match(CSS, /\.whatsapp-fab--end\s*\{[\s\S]*?inset-inline-end:/)
    assert.match(CSS, /\.whatsapp-fab--start\s*\{[\s\S]*?inset-inline-start:/)
  })

  test('the physical safe-area inset is no longer paired with a logical side', () => {
    // THE FIX. `env(safe-area-inset-left)` beside `inset-inline-end` is right in
    // Arabic only because inline-end IS the left there. A merchant moving the
    // button, or an LTR store, breaks that coincidence.
    const code = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    assert.ok(
      !/inset-inline-(?:end|start):[^;]*env\(safe-area-inset-(?:left|right)/.test(code),
      'a logical inset is still compensating with a physical env()',
    )
  })

  test('the shared token takes the larger of the two physical insets', () => {
    // Only one is ever non-zero — a notch is on one side at a time — so the
    // maximum IS the inset that matters, in any direction, with no [dir] branch.
    assert.match(
      GLOBAL,
      /--floating-inset-inline:\s*max\(env\(safe-area-inset-left[^)]*\),\s*env\(safe-area-inset-right[^)]*\)\)/,
    )
    assert.match(CSS, /\.whatsapp-fab--end\s*\{[\s\S]*?var\(--floating-inset-inline\)/)
    assert.match(CSS, /\.whatsapp-fab--start\s*\{[\s\S]*?var\(--floating-inset-inline\)/)
  })

  test('the side is exposed to scripts, for the control that stacks on top of it', () => {
    // T-8.14's back-to-top button has to know where this one is, and the owner
    // ruled it raises itself rather than refusing the merchant's choice.
    assert.match(TWIG, /data-whatsapp-fab/)
    assert.match(TWIG, /data-side="\{\{ whatsapp_side \}\}"/)
  })

  test('the product-page and open-sheet rules still hold', () => {
    // Both predate this pass and both are load-bearing: without the first the
    // button sits on the add-to-cart bar, without the second it floats over a
    // modal backdrop looking pressable.
    assert.match(CSS, /body\.is-sticky-product-bar \.whatsapp-fab/)
    assert.match(CSS, /body\.has-open-sheet \.whatsapp-fab/)
  })
})
