/**
 * T-8.14 — the back-to-top button.
 *
 * THREE OF THESE ARE THE TASK AND THE REST IS PLUMBING.
 *
 *   · THE STACKING RULE MUST READ THE HOOK, NOT THE SETTING. T-3.10 renders
 *     nothing when the store has no WhatsApp number, switch on or not. A rule
 *     driven by `whatsapp_fab_enabled` would raise this button above an empty
 *     corner, and no build step would ever notice.
 *   · THE NAVIGATION MUST STAY THE BROWSER'S. `href="#top"` scrolls to the top
 *     *and* resets the focus navigation starting point. The moment somebody
 *     "improves" it with `preventDefault()` + `scrollTo()`, keyboard users get
 *     the pixels and lose the focus — which looks identical in review.
 *   · THE THRESHOLD MUST STAY GEOMETRY. A hard-coded pixel count is wrong on
 *     some viewport and needs a resize listener to stay right.
 *
 * WHAT THESE TESTS CANNOT DO. Nothing here proves the observer fires at the
 * right moment on a real page, that the two discs clear each other on a notched
 * device, or that Tab after Enter lands in the header. /docs/MANUAL-QA.md §5.10.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const MANIFEST = JSON.parse(fs.readFileSync('twilight.json', 'utf8'))
const TWIG = fs.readFileSync('src/views/components/ui/back-to-top.twig', 'utf8')
const CSS = fs.readFileSync('src/assets/styles/04-components/back-to-top.scss', 'utf8')
const JS = fs.readFileSync('src/assets/js/partials/back-to-top.js', 'utf8')
const MASTER = fs.readFileSync('src/views/layouts/master.twig', 'utf8')
const APP_SCSS = fs.readFileSync('src/assets/styles/app.scss', 'utf8')
const WEBPACK = fs.readFileSync('webpack.config.js', 'utf8')
const AR = JSON.parse(fs.readFileSync('src/locales/ar.json', 'utf8'))
const EN = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'))

const setting = (id) => MANIFEST.settings.find((s) => s.id === id)
/**
 * Comments carry the words these rules are checked for — the SCSS explains at
 * length why it does NOT read `whatsapp_fab_enabled` — so they are stripped
 * before any assertion about what the code does. All three comment syntaxes,
 * because the same helper is pointed at SCSS, JS and Twig.
 */
const code = (source) =>
  source
    .replace(/\{#[\s\S]*?#\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

describe('T-8.14 — the two settings, and the default that keeps the design intact', () => {
  test('the switch is off, because no artboard draws this control', () => {
    const s = setting('back_to_top_enabled')
    assert.equal(s.format, 'switch')
    assert.equal(s.value, false)
    assert.equal(s.selected, false)
  })

  test('the template default agrees with the manifest default', () => {
    // A `get(id, true)` beside a manifest default of `false` is the defect this
    // catches: the panel says off, a fresh install renders it anyway.
    assert.match(TWIG, /theme\.settings\.get\('back_to_top_enabled', false\)/)
  })

  test('the side is a dropdown defaulting to the inline end', () => {
    const s = setting('back_to_top_side')
    assert.equal(s.format, 'dropdown-list')
    assert.equal(s.selected[0].value, 'end')
    assert.deepEqual(
      s.options.map((o) => o.value),
      ['end', 'start'],
    )
  })

  test('⚠ the side labels are character-identical to the WhatsApp button’s', () => {
    // A merchant reading the panel must not have to work out whether
    // «يسار الشاشة» means the same thing in two places. Two settings that pick
    // the same corner in the same store have to say it with the same words.
    const ours = setting('back_to_top_side')
    const theirs = setting('whatsapp_fab_side')
    assert.deepEqual(
      ours.options.map((o) => o.label),
      theirs.options.map((o) => o.label),
    )
    assert.equal(ours.selected[0].label, theirs.selected[0].label)
  })

  test('the option keys are its own, so the two dropdowns cannot collide', () => {
    const keys = setting('back_to_top_side').options.map((o) => o.key)
    assert.deepEqual(keys, ['back-to-top-side-end', 'back-to-top-side-start'])
  })
})

describe('T-8.14 — the navigation belongs to the browser', () => {
  test('it is an anchor to the specified `#top` fragment', () => {
    // `top` is an ASCII case-insensitive special fragment: the browser scrolls
    // to the top of the document and no element needs that id.
    assert.match(TWIG, /<a class="back-to-top[\s\S]*?href="#top"/)
  })

  test('⚠ the script never intercepts the click', () => {
    // The whole accessibility of this control is the focus-navigation reset that
    // fragment navigation performs. preventDefault() throws it away and the
    // difference is invisible to anyone testing with a mouse.
    const source = code(JS)
    assert.ok(!/preventDefault/.test(source), 'the click is being intercepted')
    assert.ok(!/scrollTo|scrollIntoView/.test(source), 'the scroll is being re-implemented')
    assert.ok(!/addEventListener\(\s*'click'/.test(source), 'a click handler was added')
  })

  test('no global smooth scrolling was introduced to fake it', () => {
    // `scroll-behavior: smooth` on the root would change every in-page anchor in
    // the store — a UX change no artboard asks for.
    assert.ok(!/scroll-behavior/.test(code(CSS)))
  })

  test('it carries a real accessible name from the catalogue, in both locales', () => {
    assert.match(TWIG, /aria-label="\{\{ trans\('theme\.common\.back_to_top'\) \}\}"/)
    assert.ok(AR.theme.common.back_to_top)
    assert.ok(EN.theme.common.back_to_top)
  })
})

describe('T-8.14 — visibility is one observer, and the threshold is geometry', () => {
  test('the sentinel is at the top of the document, not beside the button', () => {
    // Rendered from the button's own partial it would sit after the footer and
    // answer a completely different question.
    const sentinel = MASTER.indexOf('data-back-to-top-sentinel')
    const button = MASTER.indexOf("include 'components.ui.back-to-top'")
    const footer = MASTER.indexOf("component 'footer.footer'")
    assert.ok(sentinel > -1 && button > -1)
    assert.ok(sentinel < footer, 'the sentinel is not above the footer')
    assert.ok(button > footer, 'the button is not last in the tab order')
  })

  test('the root margin grows the top edge by exactly one viewport', () => {
    assert.match(JS, /rootMargin:\s*'100% 0px 0px 0px'/)
  })

  test('⚠ no pixel constant is used as the threshold', () => {
    // The failure this catches is a `scrollY > 600` that works on the reviewer's
    // laptop and is wrong on every phone and every rotation.
    const source = code(JS)
    assert.ok(!/scrollY|pageYOffset|scrollTop/.test(source), 'a scroll position is being read')
    assert.ok(!/'scroll'/.test(source), 'a scroll listener was added')
  })

  test('a missing observer or sentinel shows the button rather than hiding it forever', () => {
    // A control the merchant switched on and nobody can ever see is worse than
    // one that is always available.
    assert.match(JS, /!sentinel \|\| !\('IntersectionObserver' in window\)[\s\S]*?classList\.add\('is-visible'\)/)
  })

  test('hidden means untabbable, not merely transparent', () => {
    // `opacity: 0` alone leaves a keyboard user landing on an invisible control.
    assert.match(CSS, /\.back-to-top\s*\{[\s\S]*?visibility: hidden;/)
    assert.match(CSS, /\.back-to-top\.is-visible\s*\{[\s\S]*?visibility: visible;/)
  })
})

describe('T-8.14 — the stack, which is the promise T-3.10 made in the panel', () => {
  test('both same-side combinations are lifted', () => {
    assert.match(CSS, /body:has\(\[data-whatsapp-fab\]\[data-side='end'\]\) \.back-to-top--end/)
    assert.match(CSS, /body:has\(\[data-whatsapp-fab\]\[data-side='start'\]\) \.back-to-top--start/)
  })

  test('⚠ the lift is keyed to the rendered button, never to the setting', () => {
    // T-3.10 renders nothing without a WhatsApp number. Reading the setting
    // would raise this button above an empty corner in exactly that case.
    assert.ok(!/whatsapp_fab_enabled/.test(code(CSS)))
    assert.ok(!/whatsapp_fab_enabled/.test(code(JS)))
    assert.ok(!/whatsapp_fab/.test(code(TWIG)), 'the template is guessing at the other button')
  })

  test('the offset clears the disc plus a gap, and rides on the base inset', () => {
    assert.match(CSS, /--back-to-top-stack:\s*3\.5rem;/)
    assert.match(CSS, /inset-block-end:\s*calc\(1rem \+ var\(--back-to-top-stack\)/)
  })

  test('it does not repaint itself from another control’s setting', () => {
    // The WhatsApp colour pickers must not silently colour a second button.
    assert.ok(!/--whatsapp-fab-(bg|icon)/.test(code(CSS)))
    assert.match(CSS, /background-color: var\(--surface-card\);/)
    assert.match(CSS, /color: var\(--main-text-color\);/)
  })
})

describe('T-8.14 — the four rules T-3.10 established for anything that floats', () => {
  test('the safe area comes from the shared token, in both directions', () => {
    assert.match(CSS, /\.back-to-top--end\s*\{[\s\S]*?var\(--floating-inset-inline\)/)
    assert.match(CSS, /\.back-to-top--start\s*\{[\s\S]*?var\(--floating-inset-inline\)/)
    assert.match(CSS, /env\(safe-area-inset-bottom, 0px\)/)
  })

  test('the product bar lifts it, and the stack still applies on top', () => {
    assert.match(
      CSS,
      /body\.is-sticky-product-bar \.back-to-top\s*\{[\s\S]*?calc\(5rem \+ var\(--back-to-top-stack\)/,
    )
  })

  test('an open sheet removes it', () => {
    assert.match(CSS, /body\.has-open-sheet \.back-to-top/)
  })

  test('the target is 44px and no physical side is used', () => {
    assert.match(CSS, /\.back-to-top\s*\{[\s\S]*?h-11 w-11/)
    assert.ok(!/inset-(left|right)|(?:^|\s)(?:left|right):/.test(code(CSS)))
  })
})

describe('T-8.14 — it is actually wired into the build', () => {
  test('the stylesheet is imported after the button it stacks on', () => {
    const fab = APP_SCSS.indexOf("@import './04-components/whatsapp-fab'")
    const ours = APP_SCSS.indexOf("@import './04-components/back-to-top'")
    assert.ok(ours > fab, 'back-to-top.scss is missing or imported too early')
  })

  test('the script ships in the bundle every page loads', () => {
    assert.match(WEBPACK, /app\s*:\s*\[[^\]]*js\/partials\/back-to-top\.js/)
  })
})
