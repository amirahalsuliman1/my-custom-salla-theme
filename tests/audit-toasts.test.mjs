/**
 * Audit «toasts» — the design-vs-code defects fixed for the toast group.
 *
 * 76  the status icon is two layers: a solid 20px accent disc inside the 32px
 *     pale one, with a pale 1.5px glyph — not an accent glyph on a pale disc.
 * 77  the add-to-cart toast reads the artboards' sentence word for word.
 * 78  from 1024px the toast sits at the inline end, 4rem in, under the header
 * 88  stack — six desktop artboards agree (78 and 88 are the same defect).
 * 155 over an open dialog it is centred, 2rem below the dialog's top edge.
 *
 * Read from source, as the T-2.12 test reads toast.scss; the placement is
 * also exercised in jsdom, since the edge it hangs from is measured by script.
 */
import { test, describe, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs'

const TOAST = fs.readFileSync('src/assets/styles/05-utilities/toast.scss', 'utf8')
const UPSTREAM = fs.readFileSync('src/assets/styles/05-utilities/swal.scss', 'utf8')
const AR = JSON.parse(fs.readFileSync('src/locales/ar.json', 'utf8'))
const EN = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'))

const CSS = TOAST.replace(/\/\*[\s\S]*?\*\//g, '')

/** Every rule body whose selector list contains `selector`, at any depth. */
function ruleBodies(css, selector) {
  const bodies = []
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors.split(',').map(s => s.trim()).includes(selector)) bodies.push(body)
  }
  return bodies
}

/** The text inside the first `@include <mixin> { … }` block. */
function mixinBlock(css, mixin) {
  const start = css.indexOf(`@include ${mixin} {`)
  assert.ok(start >= 0, `toast.scss has an @include ${mixin} block`)
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++
    if (css[i] === '}' && --depth === 0) return css.slice(css.indexOf('{', start) + 1, i)
  }
  throw new Error(`unclosed @include ${mixin}`)
}

const ICON = '.swal2-container .swal2-popup.swal2-toast .swal2-icon'

describe('76 · the status icon is a pale glyph on a solid disc inside a pale ring', () => {
  test('the icon paints the solid 20px accent disc over the pale 32px one', () => {
    const body = ruleBodies(CSS, ICON).join('\n')
    assert.match(
      body,
      /radial-gradient\(\s*circle closest-side,\s*var\(--toast-accent\) 0 0\.625rem,\s*var\(--toast-soft\)/,
    )
  })

  test("upstream's scale-50 is undone, so the icon is 32px and not 16", () => {
    assert.match(UPSTREAM, /scale-50/, 'the reason for the reset')
    assert.match(ruleBodies(CSS, ICON).join('\n'), /transform:\s*none/)
  })

  for (const [state, soft] of [
    ['success', '--accent-success-soft'],
    ['error', '--accent-soft'],
    ['info', '--surface-section'],
  ]) {
    test(`the ${state} variant names its pale colour once, as --toast-soft`, () => {
      const body = ruleBodies(CSS, `.swal2-container .swal2-popup.swal2-toast.swal2-icon-${state}`).join('\n')
      assert.match(body, new RegExp(`--toast-soft:\\s*var\\(${soft}\\)`))
    })
  }

  test('the soft fill is no longer painted as the whole icon background', () => {
    assert.doesNotMatch(CSS, /swal2-icon-(success|error|info|warning|question) \.swal2-icon\s*[,{]/)
  })

  test("the strokes are pale, 1.5px, and outweigh upstream's white at (0,6,0)", () => {
    for (const selector of [
      `${ICON}.swal2-success [class^='swal2-success-line']`,
      `${ICON}.swal2-error [class^='swal2-x-mark-line']`,
    ]) {
      const body = ruleBodies(CSS, selector).join('\n')
      assert.match(body, /background-color:\s*var\(--toast-soft\)/, selector)
      assert.match(body, /height:\s*1\.5px/, selector)
      assert.match(body, /animation:\s*none/, selector)
    }
    assert.doesNotMatch(CSS, /\[class\^='swal2-(success|x-mark)-line'\][^{]*\{[^}]*--toast-accent/)
  })

  test('the strokes are placed without a physical left or right', () => {
    const glyph = CSS.slice(CSS.indexOf("[class^='swal2-success-line']"), CSS.indexOf('.swal2-success-ring'))
    assert.doesNotMatch(glyph, /(^|[\s;{])(left|right)\s*:/)
    assert.match(glyph, /\.swal2-success-line-tip\s*\{[^}]*width:\s*5\.5px[^}]*rotate\(45deg\)/)
    assert.match(glyph, /\.swal2-success-line-long\s*\{[^}]*width:\s*9\.5px[^}]*rotate\(-45deg\)/)
  })

  test('info, warning and question follow the same pale-on-solid scheme', () => {
    const body = ruleBodies(CSS, `.swal2-container .swal2-popup.swal2-toast .swal2-icon-content`).join('\n')
    assert.match(body, /color:\s*var\(--toast-soft\)/)
  })
})

describe('77 · the add-to-cart toast reads the artboards’ sentence', () => {
  test('Arabic is «تمت إضافة المنتج إلى السلة بنجاح», with no trailing period', () => {
    assert.equal(AR.theme.cart.add_success, 'تمت إضافة المنتج إلى السلة بنجاح')
  })

  test('English carries the same meaning', () => {
    assert.equal(EN.theme.cart.add_success, 'The product was added to your cart successfully.')
  })
})

describe('78 / 88 / 155 · the desktop placement, from 1024px only', () => {
  const laptop = mixinBlock(CSS, 'from-laptop')
  const tablet = mixinBlock(CSS, 'from-tablet')

  test('tablet keeps B4: 24rem and centred', () => {
    assert.match(tablet, /max-inline-size:\s*24rem/)
    assert.doesNotMatch(tablet, /margin-inline/)
  })

  test('on a page the panel is the drawn width, at the inline end, 4rem in', () => {
    assert.match(ruleBodies(laptop, '.swal2-container .swal2-popup.swal2-toast').join(''), /max-inline-size:\s*21\.5rem/)
    assert.match(
      ruleBodies(laptop, '.swal2-container:not([data-toast-over-modal]) .swal2-popup.swal2-toast').join(''),
      /margin-inline:\s*auto 0/,
    )
    const container = ruleBodies(laptop, 'html body.swal2-toast-shown .swal2-container').join('')
    assert.match(container, /padding-inline:\s*4rem/)
    assert.match(container, /padding-block-start:\s*calc\(var\(--toast-edge, 0px\) \+ 1rem\)/)
  })

  test('over an open dialog it stays centred, 2rem under the dialog’s top', () => {
    const body = ruleBodies(laptop, 'html body.swal2-toast-shown .swal2-container[data-toast-over-modal]').join('')
    assert.match(body, /padding-block-start:\s*calc\(var\(--toast-edge, 0px\) \+ 2rem\)/)
    assert.match(body, /padding-inline:\s*1\.5rem/)
  })

  test('no physical left/right or top is stated for the placement', () => {
    assert.doesNotMatch(laptop, /(^|[\s;{])(left|right|top)\s*:/)
  })
})

describe('78 / 88 / 155 · toast.js measures the edge the toast hangs from', () => {
  afterEach(teardownDom)

  async function boot(html) {
    createDom({ html, translations: { 'theme.common.close': 'إغلاق' } })
    await loadFresh('src/assets/js/partials/toast.js')
    await flush()
  }

  function rectOf(selector, rect) {
    document.querySelector(selector).getBoundingClientRect = () => ({ top: 0, bottom: 0, ...rect })
  }

  async function raiseToast() {
    const container = document.createElement('div')
    container.className = 'swal2-container swal2-top-start'
    container.innerHTML = '<div class="swal2-popup swal2-toast"><button class="swal2-close"></button></div>'
    document.body.append(container)
    await flush()
    return container
  }

  const HEADER = '<header data-sticky-header><p class="store-header__band"></p></header>'

  test('on a page it is the bottom of the header stack', async () => {
    await boot(HEADER)
    rectOf('[data-sticky-header]', { top: 40, bottom: 152.4 })

    const container = await raiseToast()

    assert.equal(container.style.getPropertyValue('--toast-edge'), '152px')
    assert.equal(container.hasAttribute('data-toast-over-modal'), false)
  })

  test('a header scrolled out of view leaves the toast at the top, never above it', async () => {
    await boot(HEADER)
    rectOf('[data-sticky-header]', { top: -300, bottom: -150 })

    assert.equal((await raiseToast()).style.getPropertyValue('--toast-edge'), '0px')
  })

  test('over one of the theme’s open dialogs it is the panel’s top edge', async () => {
    await boot(`${HEADER}<dialog class="sheet" open><div class="sheet__panel"></div></dialog>`)
    rectOf('[data-sticky-header]', { bottom: 152 })
    rectOf('.sheet__panel', { top: 257 })

    const container = await raiseToast()

    assert.equal(container.style.getPropertyValue('--toast-edge'), '257px')
    assert.equal(container.hasAttribute('data-toast-over-modal'), true)
  })

  test('over the platform’s open sign-in modal it is the modal body’s top edge', async () => {
    await boot(`${HEADER}<salla-modal class="s-modal-container"><div class="s-modal-body"></div></salla-modal>`)
    rectOf('.s-modal-body', { top: 260 })

    const container = await raiseToast()

    assert.equal(container.style.getPropertyValue('--toast-edge'), '260px')
    assert.equal(container.hasAttribute('data-toast-over-modal'), true)
  })

  test('a closed platform modal is not mistaken for an open one', async () => {
    await boot(`${HEADER}<salla-modal class="s-modal-container s-hidden"><div class="s-modal-body"></div></salla-modal>`)
    rectOf('[data-sticky-header]', { bottom: 120 })

    const container = await raiseToast()

    assert.equal(container.style.getPropertyValue('--toast-edge'), '120px')
    assert.equal(container.hasAttribute('data-toast-over-modal'), false)
  })
})
