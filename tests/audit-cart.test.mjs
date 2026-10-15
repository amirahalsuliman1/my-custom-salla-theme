/**
 * The cart against its artboards — the 2026-10-15 audit pass.
 *
 * `Cart Page.pdf` (the phone) and `Desktop Cart Page.svg` (1024px and up) were
 * re-rendered and read against the template and the stylesheet. Each block
 * below pins one confirmed difference, by reading the source the way the
 * other cart tests do: the phone rule must still be the phone's, and a desktop
 * rule must live inside `from-laptop` and nowhere else.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')

const CSS = read('src/assets/styles/04-components/cart.scss')
const TWIG = read('src/views/pages/cart.twig')
const OPTIONS = read('src/views/pages/partials/product/options.twig')
const VALIDATE = read('src/assets/js/partials/validate-product-options.js')
const SUMMARY = read('node_modules/@salla.sa/twilight-components/dist/collection/components/salla-cart-summary-card/salla-cart-summary-card.js')
const AR = JSON.parse(read('src/locales/ar.json'))
const EN = JSON.parse(read('src/locales/en.json'))

/** Twig comments blanked, so prose about markup is never matched as markup. */
const MARKUP = TWIG.replace(/\{#[\s\S]*?#\}/g, '')
const OPTIONS_MARKUP = OPTIONS.replace(/\{#[\s\S]*?#\}/g, '')

/** The body of the first `{…}` that opens at or after `from`, braces matched. */
function blockAt(source, from) {
  const open = source.indexOf('{', from)
  let depth = 0
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i)
  }
  throw new Error('unbalanced braces')
}

/** A top-level rule's body, by its exact selector line. */
function rule(selector) {
  const at = CSS.search(new RegExp(`^${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{`, 'm'))
  assert.notEqual(at, -1, `cart.scss has a top-level \`${selector}\` rule`)
  return blockAt(CSS, at)
}

/** Every `@include from-laptop { … }` body in the file, nested ones included. */
function laptopBlocks() {
  const blocks = []
  let at = CSS.indexOf('@include from-laptop')
  while (at !== -1) {
    blocks.push(blockAt(CSS, at))
    at = CSS.indexOf('@include from-laptop', at + 1)
  }
  return blocks
}

/** The stylesheet with every from-laptop block removed: what the phone gets. */
function phoneOnly() {
  let out = CSS
  for (const block of laptopBlocks()) out = out.replace(block, '')
  return out
}

/** One item row of the template: from its `<form` to its `</form>`. */
const ITEM_FORM = MARKUP.slice(MARKUP.indexOf('<form class="cart-items__row"'), MARKUP.indexOf('</form>') + 7)

describe('audit · cart · the hairline under every item', () => {
  test('no `:last-child` exception — each row is its form’s only child, so it matched every row', () => {
    assert.doesNotMatch(CSS, /\.cart-item:last-child/)
  })

  test('the line is the row’s form’s, so it falls under the note, the last item included', () => {
    assert.match(ITEM_FORM, /^<form class="cart-items__row"/)
    assert.match(rule('.cart-items__row'), /border-block-end: 1px solid var\(--border-subtle\);/)
    assert.doesNotMatch(rule('.cart-item'), /border-block-end/)
  })

  test('the desktop artboard draws none, so it goes from 1024px only', () => {
    assert.match(rule('.cart-items__row'), /@include from-laptop \{\s*border-block-end: 0;\s*\}/)
  })
})

describe('audit · cart · the current price comes first', () => {
  test('the current price is the first span of the price line, before both struck ones', () => {
    const line = blockOf(ITEM_FORM, '<p class="cart-item__prices">', '</p>')
    const current = line.indexOf('item-price')
    assert.ok(current !== -1)
    assert.ok(current < line.indexOf('item-regular-price'))
    assert.ok(current < line.indexOf('item-original-price'))
  })

  test('it is bold from 1024px, as the desktop artboard sets it, and regular on the phone', () => {
    assert.match(rule('.cart-item__price'), /@include from-laptop \{\s*@apply font-bold;\s*\}/)
    assert.doesNotMatch(phoneOnly(), /\.cart-item__price \{[^}]*font-bold/)
  })
})

function blockOf(source, start, end) {
  const from = source.indexOf(start)
  assert.notEqual(from, -1, `found ${start}`)
  return source.slice(from, source.indexOf(end, from))
}

describe('audit · cart · the rule under the breadcrumb', () => {
  test('the breadcrumb is the account shell’s 56-tall row with its rule, not upstream’s bare nav', () => {
    assert.match(MARKUP, /<nav class="customer-layout__breadcrumb" aria-label="\{\{ trans\('theme\.customer\.breadcrumb'\) \}\}">\s*<salla-breadcrumb><\/salla-breadcrumb>/)
    assert.doesNotMatch(MARKUP, /breadcrumbs w-full py-5/)
  })

  test('that class draws the rule and does not depend on the account wrapper', () => {
    const shell = read('src/assets/styles/04-components/customer-layout.scss')
    const own = blockAt(shell, shell.search(/^\.customer-layout__breadcrumb \{/m))
    assert.match(own, /border-block-end: 1px solid var\(--border-interactive\);/)
    assert.match(own, /min-block-size: 3\.5rem;/)
  })
})

describe('audit · cart · the per-item note under each row', () => {
  test('rendered after the row, inside the same form, only where Salla allows notes', () => {
    const afterRow = ITEM_FORM.slice(ITEM_FORM.indexOf('</section>\n'))
    assert.match(afterRow, /\{% if item\.can_add_note %\}\s*<div class="field cart-item__note">/)
  })

  test('a real label, from the locale, named for the field it labels', () => {
    assert.match(ITEM_FORM, /<label class="field__label cart-item__note-label" for="cart-note-\{\{ item\.id \}\}">\s*\{\{ trans\('theme\.cart\.note_label'\) \}\}/)
    assert.match(ITEM_FORM, /<span class="cart-item__note-optional">\{\{ trans\('theme\.cart\.note_optional'\) \}\}<\/span>/)
    assert.match(ITEM_FORM, /<textarea id="cart-note-\{\{ item\.id \}\}"/)
    for (const locale of [AR, EN]) {
      assert.ok(locale.theme.cart.note_label)
      assert.ok(locale.theme.cart.note_optional)
    }
    assert.equal(AR.theme.cart.note_label, 'أضف ملاحظاتك للطلب')
  })

  test('the field is T-2.06’s, and keeps the id options.twig’s button opens', () => {
    assert.match(ITEM_FORM, /class="collapse-content cart-item__note-field" id="note_\{\{ item\.id \}\}"/)
    assert.match(ITEM_FORM, /class="field__input cart-item__note-input"\s+name="notes"/)
  })

  test('the form submits one `notes`: options.twig leaves its own field out when told', () => {
    assert.equal((MARKUP.match(/name="notes"/g) || []).length, 1)
    assert.match(MARKUP, /\{% include 'pages\.partials\.product\.options' with \{product: item, note_below_row: true\} %\}/)
    assert.match(OPTIONS_MARKUP, /\{% set note_below_row = note_below_row\|default\(false\) %\}/)
    assert.match(OPTIONS_MARKUP, /\{% if product\.can_add_note and not note_below_row %\}\s*<div class="collapse-content" id="note_\{\{ product\.id \}\}">/)
  })

  test('elsewhere options.twig is upstream’s — the cart’s own option forms pass no flag', () => {
    assert.match(MARKUP, /\{% include 'pages\.partials\.product\.options' with \{ product: product_option \} %\}/)
    assert.match(OPTIONS_MARKUP, /btn--collapse\{\{ note_below_row \? ' cart-item__note-toggle' : '' \}\}/)
    assert.match(OPTIONS_MARKUP, /note_below_row and not product\.can_upload_file \? ' cart-item__attachments--note-only' : ''/)
  })

  test('from 1024px the label shows, the field is open, and the opener and its empty card go', () => {
    const desktop = laptopBlocks().join('\n')
    assert.match(desktop, /\.cart-item__note-label \{\s*@apply not-sr-only;/)
    assert.match(desktop, /\.cart-item__note-field \{\s*grid-template-rows: 1fr;\s*opacity: 1;/)
    assert.match(desktop, /\.cart-item \.cart-item__note-toggle,\s*\.cart-item \.cart-item__attachments--note-only \{\s*display: none;/)
  })

  test('below 1024px it stays closed behind the button, its label for screen readers', () => {
    const phone = phoneOnly()
    assert.match(phone, /\.cart-item__note-label \{\s*@apply sr-only;/)
    assert.doesNotMatch(phone, /\.cart-item__note-field \{/)
    assert.doesNotMatch(phone, /cart-item__note-toggle/)
  })

  test('a closed note adds no height: its spacing is a margin inside the collapse', () => {
    assert.match(rule('.cart-item__note-input'), /@apply mb-4 block py-2\.5;/)
    assert.doesNotMatch(ITEM_FORM, /<div class="collapse-content[^"]*"[^>]*>\s*<div class="[^"]*p[tby]?-/)
  })
})

describe('audit · cart · coupon and summary are one card from 1024px', () => {
  test('the coupon block and the summary card share one wrapper, hooks kept inside it', () => {
    const box = blockOf(MARKUP, '<div class="cart-summary-box">', '{% hook \'cart:summary.end\' %}')
    assert.match(box, /<salla-cart-coupons data-testid="store-cart-coupons">/)
    assert.match(box, /\{% hook 'cart:summary-card\.start' %\}\s*<salla-cart-summary-card data-testid="store-cart-summary"><\/salla-cart-summary-card>\s*\{% hook 'cart:summary-card\.end' %\}/)
  })

  test('the wrapper holds on desktop: the component returns itself to the parent it first rendered in', () => {
    assert.match(SUMMARY, /this\.originalParent = this\.host\.parentElement;/)
    assert.match(SUMMARY, /this\.originalParent\.insertBefore\(this\.host, ref\);/)
    assert.match(SUMMARY, /breakpointPx\(\) \{\s*return 1024;/)
  })

  test('the card is drawn from 1024px only — the card tone, the trim edge, the floating shadow', () => {
    const desktop = laptopBlocks().join('\n')
    const box = blockAt(desktop, desktop.search(/\.cart-summary-box \{/))
    assert.match(box, /@apply mb-5 rounded-large p-4 shadow-floating;/)
    assert.match(box, /background-color: var\(--surface-card\);/)
    assert.match(box, /border: 1px solid var\(--border-subtle\);/)
    assert.doesNotMatch(phoneOnly(), /\.cart-summary-box/)
  })

  test('inside it the coupon gives up its panel and the platform card its box', () => {
    const desktop = laptopBlocks().join('\n')
    assert.match(desktop, /\.cart-summary-box \.cart-coupon \{\s*@apply mb-0 rounded-none p-0;\s*background-color: transparent;/)
    assert.match(desktop, /\.cart-summary-box \.s-cart-summary-card--desktop \{\s*@apply mb-0 rounded-none p-0;\s*background-color: transparent;\s*box-shadow: none;/)
    assert.match(desktop, /\.cart-summary-box \.s-cart-summary-card-sheet-header \{[^}]*border-block-end: 1px solid var\(--border-interactive\);/)
  })
})

describe('audit · cart · the loading veil covers its row only', () => {
  test('the row is positioned, as upstream’s was', () => {
    assert.match(rule('.cart-item'), /@apply relative flex items-start gap-4 py-4;/)
  })

  test('which is what the veil validate-product-options.js appends to it needs', () => {
    assert.match(VALIDATE, /document\.querySelector\(`#item-\$\{itemId\} \.cart-item`\)/)
    assert.match(VALIDATE, /'loading-overlay', 'absolute', 'inset-0'/)
  })
})

describe('audit · cart · the quantity pill', () => {
  test('dashed on the phone, solid from 1024px, colour untouched (T-2.06/T-2.11)', () => {
    const pill = rule('.cart-item__controls .s-quantity-input-container')
    assert.match(pill, /^\s*border-style: dashed;/)
    assert.match(pill, /@include from-laptop \{\s*border-style: solid;\s*\}/)
    assert.doesNotMatch(pill, /border-subtle|border-color|#/)
  })

  test('from 1024px the minus stays at quantity 1; the bin is the phone’s', () => {
    const desktop = laptopBlocks().join('\n')
    assert.match(desktop, /salla-quantity-input\[data-at-min\] \.cart-item__minus-glyph \{\s*@apply block;/)
    assert.match(desktop, /salla-quantity-input\[data-at-min\] \.cart-item__remove-glyph \{\s*@apply hidden;/)
    assert.match(phoneOnly(), /salla-quantity-input\[data-at-min\] \.cart-item__remove-glyph \{\s*@apply block;/)
  })

  test('the click at quantity 1 still removes the item at every width', () => {
    const js = read('src/assets/js/cart.js')
    assert.match(js, /salla\.cart\.deleteItem\(itemId\)/)
    assert.doesNotMatch(js, /matchMedia|innerWidth/)
  })

  test('from 1024px it centres on the image: the controls column is the image’s height', () => {
    assert.match(rule('.cart-items'), /--cart-item-media-size: 6\.25rem;/)
    assert.match(rule('.cart-item__media'), /inline-size: var\(--cart-item-media-size\);/)
    assert.match(rule('.cart-item__controls'), /@include from-laptop \{\s*block-size: var\(--cart-item-media-size\);\s*\}/)
    assert.match(rule('.cart-item'), /items-start/)
  })
})

describe('audit · cart · no visible per-row total', () => {
  test('the total line is for screen readers while the item can be bought', () => {
    assert.match(ITEM_FORM, /<p class="cart-item__meta \{\{ item\.is_available \? 'sr-only' : '' \}\}">\s*<span>\{\{ trans\('pages\.cart\.total'\) \}\}:<\/span>\s*<span data-testid="store-cart-item-total" class="item-total">/)
  })

  test('and the element cart.js rewrites is still there', () => {
    assert.match(read('src/assets/js/cart.js'), /cartItem\.querySelector\('\.item-total'\)/)
  })
})
