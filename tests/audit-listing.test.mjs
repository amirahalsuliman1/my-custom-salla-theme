/**
 * The listing audit (2026-10-15) — the design-against-code defects on the offers,
 * category, search and brand pages, each pinned so it cannot drift back.
 *
 * Most of these are layout facts that only a browser can see, so what is pinned
 * here is the source that produces them: the order of two controls, the class
 * that lifts a row, the scope of a surface rule. The filter panel's count and
 * reset are behaviour, and are driven through the DOM harness against the real
 * partial.
 */
import { test, describe, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs'

const read = (f) => fs.readFileSync(f, 'utf8')
const INDEX = read('src/views/pages/product/index.twig')
const BRAND = read('src/views/pages/brands/single.twig')
const SHEET = read('src/views/components/ui/filters-sheet.twig')
const BOTTOM = read('src/views/components/ui/bottom-sheet.twig')
const LISTING = read('src/assets/styles/04-components/listing.scss')
const FILTERS = read('src/assets/styles/04-components/filters.scss')
const CARD_CSS = read('src/assets/styles/04-components/product-card.scss')
const CARD_JS = read('src/assets/js/partials/product-card.js')
const PRODUCTS = read('src/assets/js/products.js')
const MASTER = read('src/views/layouts/master.twig')
const BG = read('src/assets/styles/04-components/page-background.scss')
const WEBPACK = read('webpack.config.js')
const AR = JSON.parse(read('src/locales/ar.json'))
const EN = JSON.parse(read('src/locales/en.json'))

/** The body of a `@include from-laptop { … }` block, by matching braces. */
function laptopBlocks(css) {
  const blocks = []
  let at = css.indexOf('@include from-laptop')
  while (at !== -1) {
    let depth = 0
    let i = css.indexOf('{', at)
    const start = i
    for (; i < css.length; i += 1) {
      if (css[i] === '{') depth += 1
      if (css[i] === '}' && --depth === 0) break
    }
    blocks.push(css.slice(start, i))
    at = css.indexOf('@include from-laptop', i)
  }
  return blocks.join('\n')
}

describe('#30 / #36 — the brand page filters', () => {
  test('the drawer, the funnel and filters-Results, all gated on the platform', () => {
    assert.match(BRAND, /\{% set brand_filters = filters\|default\(false\) and products\|length %\}/)
    assert.match(BRAND, /\{% if brand_filters %\}\s*\{% include 'components\.ui\.filters-sheet'/)
    assert.match(BRAND, /data-sheet-open="filters-sheet"[\s\S]*?class="filters-trigger lg:hidden"/)
    assert.match(BRAND, /<salla-products-list[^>]*\{\{ brand_filters \? 'filters-Results' : '' \}\}/)
  })

  test('the same container-products-list row, so the column and three-up grid reach it', () => {
    assert.match(BRAND, /<div class="container--products-list flex items-start flex-col md:flex-row">/)
    assert.match(LISTING, /\.container--products-list:has\(\.filters-sheet\) \.listing__products/)
  })

  test('the funnel follows the sort disclosure, so it sits at the inline end', () => {
    const toolbar = BRAND.slice(BRAND.indexOf('class="listing-toolbar'))
    assert.ok(toolbar.indexOf('sort-disclosure') < toolbar.indexOf('filters-trigger'))
  })

  test('one drawer partial, used by both listings — not a second copy', () => {
    assert.match(INDEX, /\{% include 'components\.ui\.filters-sheet'/)
    assert.doesNotMatch(INDEX, /<salla-filters/)
    assert.doesNotMatch(BRAND, /<salla-filters/)
    assert.match(SHEET, /<salla-filters [^>]*id="filters-menu">/)
    assert.match(SHEET, /\{% include 'components\.ui\.bottom-sheet'[\s\S]*variant:\s*'drawer'/)
  })
})

describe('#31 — the offers toolbar order and fill', () => {
  test('the select comes before the funnel in source', () => {
    const toolbar = INDEX.slice(INDEX.indexOf('<div class="listing-toolbar'))
    assert.ok(toolbar.indexOf('id="product-filter"') < toolbar.indexOf('filters-trigger lg:hidden'))
  })

  test('beside a cover the sort wrapper grows to fill the row', () => {
    assert.match(INDEX, /listing-toolbar__sort flex items-center\{\{ listing_cover \? ' flex-1 min-w-0' : '' \}\}/)
    assert.match(INDEX, /listing-toolbar__controls flex items-center gap-2\{\{ listing_cover \? ' w-full' : '' \}\}/)
  })

  test('the select is rendered once', () => {
    assert.equal(INDEX.match(/id="product-filter"/g).length, 1)
  })
})

describe('#32 — desktop: the sort control on the cover\'s title row', () => {
  const desk = laptopBlocks(LISTING)

  test('the cover case marks the toolbar to be lifted', () => {
    assert.match(INDEX, /\{\{ listing_cover \? ' listing-toolbar--over-cover' : ' justify-between' \}\}/)
    assert.match(BRAND, /\{\{ brand\.banner \? ' listing-toolbar--over-cover' : '' \}\}/)
  })

  test('from laptop it is positioned on the cover foot, at the inline end', () => {
    assert.match(desk, /main:has\(> \.listing-cover:first-child\) \{\s*@apply relative;/)
    assert.match(desk, /\.listing-toolbar--over-cover \{\s*@apply absolute z-10 justify-end;/)
    assert.match(desk, /margin-block-start: calc\(100% \* 17 \/ 36 - 1\.5rem\);/)
    assert.match(desk, /transform: translateY\(-100%\);/)
    assert.match(desk, /inset-inline: max\(var\(--page-gutter, 16px\), calc\(\(100% - 1280px\) \/ 2 \+ var\(--page-gutter, 16px\)\)\);/)
  })

  test('the ratio the offset assumes is the cover\'s desktop ratio', () => {
    assert.match(desk, /\.listing-cover__image \{\s*aspect-ratio: 36 \/ 17;/)
  })

  test('the drawn width, from the shipped scale', () => {
    assert.match(desk, /\.listing-toolbar--over-cover \.listing-toolbar__sort,\s*\.listing-toolbar--over-cover > \.sort-disclosure \{\s*@apply w-96 flex-none;/)
  })

  test('no selector names .container, which other files @apply', () => {
    assert.doesNotMatch(LISTING, /\s\.container[\s{,]/)
  })
})

describe('#33 / #108 — listing surfaces and the cover fade', () => {
  test('the listing slugs carry a body class, painted with the warm ground', () => {
    assert.match(MASTER, /\(page\.slug starts with 'product\.index' or page\.slug == 'brands\.single'\) \? ' page--listing' : ''/)
    assert.match(BG, /body\.page--listing \{\s*background-color: var\(--surface-section\);/)
  })

  test('the listing card is white below laptop and has no surface above it', () => {
    assert.match(LISTING, /\.listing__products \.product-card \{\s*background-color: var\(--surface-card\);/)
    const desk = laptopBlocks(LISTING)
    assert.match(desk, /\.listing__products \.product-card \{\s*@apply bg-transparent;/)
    assert.match(desk, /\.listing__products \.product-card__media \{\s*@apply m-0 rounded-large;/)
    assert.match(desk, /\.listing__products \.product-card__body \{\s*padding-inline: 0;/)
    assert.match(desk, /inset-block-start: calc\(100cqw \* 1\.25 - 3\.5rem\);/)
  })

  test('Home keeps T-2.19\'s warm card', () => {
    assert.match(CARD_CSS, /\.product-card \{\s*@apply relative flex flex-col border-0 bg-surface-section;/)
  })

  test('the cover fades into the ground token at 95%, with a white fallback', () => {
    assert.match(LISTING, /rgb\(255 255 255 \/ 90%\) 100%\s*\);\s*background: linear-gradient\(/)
    assert.match(LISTING, /color-mix\(in srgb, var\(--surface-section\) 95%, transparent\) 100%/)
    // No hard-coded brand grey in the rules (the comment names it to say why).
    assert.doesNotMatch(LISTING.replace(/\/\*[\s\S]*?\*\//g, ''), /#[0-9a-f]{3,8}\b/i)
  })
})

describe('#34 / #35 — the filter panel header', () => {
  test('bottom-sheet takes an optional header_extra, placed before the close button', () => {
    const header = BOTTOM.slice(BOTTOM.indexOf('<div class="sheet__header">'))
    assert.ok(header.indexOf('header_extra') < header.indexOf('class="sheet__close"'))
  })

  test('the logo, the count inside the heading, and the reset button', () => {
    assert.match(SHEET, /<span class="filters-count" data-filters-count hidden><\/span>/)
    assert.match(SHEET, /<span class="filters-sheet__logo">\s*<img src="\{\{ brand_logo\|cdn\(175\) \}\}"[\s\S]*?alt="" width="175" height="40"/)
    assert.match(SHEET, /<button type="button" class="filters-reset" data-filters-reset hidden>\{\{ trans\('theme\.filters\.reset'\) \}\}<\/button>/)
  })

  test('the locale keys exist in both languages', () => {
    for (const locale of [AR, EN]) {
      assert.equal(locale.theme.filters.count, '(:count)')
      assert.ok(locale.theme.filters.reset)
    }
    assert.equal(AR.theme.filters.reset, 'إعادة تعيين')
  })

  test('the component\'s applied block is hidden; the hidden reset stays hidden', () => {
    assert.match(FILTERS, /\.filters-sheet \.s-filters-applied \{\s*display: none;/)
    assert.match(FILTERS, /\.filters-reset\[hidden\] \{\s*display: none;/)
  })

  test('from laptop the heading stays and only the drawer chrome goes', () => {
    const desk = laptopBlocks(FILTERS)
    assert.doesNotMatch(desk, /\.filters-sheet \.sheet__header \{\s*@apply hidden;/)
    assert.match(desk, /\.filters-sheet__logo,\s*\.filters-sheet \.sheet__close \{\s*@apply hidden;/)
  })

  test('the panel behaviour lives in the app entry, not the product bundle', () => {
    assert.match(WEBPACK, /app\s*:\s*\[[^\]]*js\/partials\/filters-panel\.js/)
    assert.doesNotMatch(PRODUCTS, /salla\.event\.on\('salla-filters::changed'/)
  })
})

describe('#34 — filters-panel.js against the DOM', () => {
  afterEach(() => teardownDom())

  const PANEL = `
    <h2>تصفية النتائج <span data-filters-count hidden></span></h2>
    <button type="button" data-filters-reset hidden>إعادة تعيين</button>
    <salla-filters id="filters-menu"></salla-filters>`

  async function boot() {
    const dom = createDom({ html: PANEL, translations: { 'theme.filters.count': '(:count)' } })
    await loadFresh('src/assets/js/partials/filters-panel.js')
    await flush()
    return dom
  }

  const chips = (n) => {
    document.getElementById('filters-menu').innerHTML =
      `<div class="s-filters-applied">${'<div class="s-filters-applied-item"></div>'.repeat(n)}</div>`
  }

  test('nothing applied: no count, no reset', async () => {
    await boot()
    assert.equal(document.querySelector('[data-filters-count]').hidden, true)
    assert.equal(document.querySelector('[data-filters-reset]').hidden, true)
  })

  test('three chips read as «(3)» and show the reset', async () => {
    await boot()
    chips(3)
    await flush()
    const count = document.querySelector('[data-filters-count]')
    assert.equal(count.hidden, false)
    assert.equal(count.textContent, '(3)')
    assert.equal(document.querySelector('[data-filters-reset]').hidden, false)
  })

  test('the reset calls the component\'s own resetFilters()', async () => {
    await boot()
    let called = 0
    document.getElementById('filters-menu').resetFilters = () => { called += 1 }
    chips(1)
    await flush()
    document.querySelector('[data-filters-reset]').click()
    assert.equal(called, 1)
  })

  test('an applied filter closes the drawer; an empty change does not', async () => {
    const { control } = await boot()
    control.emit('salla-filters::changed', {})
    assert.deepEqual(control.calls.dispatched, [])
    control.emit('salla-filters::changed', { brand_id: [1] })
    assert.deepEqual(control.calls.dispatched, [{ name: 'bottom-sheet::close', payload: 'filters-sheet' }])
  })

  test('a page without the panel subscribes to nothing', async () => {
    const { control } = createDom({ html: '<main></main>' })
    await loadFresh('src/assets/js/partials/filters-panel.js')
    await flush()
    assert.deepEqual(control.calls.events.filter((e) => e.name === 'salla-filters::changed'), [])
  })
})

describe('#109 — the sort disclosure is the floating menu', () => {
  test('a content-sized panel at the inline end, with the menu\'s tokens', () => {
    assert.match(LISTING, /\.sort-disclosure__list \{\s*@apply absolute z-10 m-0 rounded-large p-0 shadow-floating;/)
    assert.match(LISTING, /inline-size: max-content;\s*max-inline-size: 100%;/)
    assert.doesNotMatch(LISTING, /\.sort-disclosure__list \{[^}]*inset-inline: 0;/)
  })

  test('the caret, filled when the first row is the current one', () => {
    assert.match(LISTING, /\.sort-disclosure__list::before \{/)
    assert.match(LISTING, /\.sort-disclosure__list:has\(> li:first-child \[aria-pressed='true'\]\)::before \{\s*border-block-end-color: var\(--surface-section\);/)
  })

  test('the pressed row is filled and 44px tall', () => {
    assert.match(LISTING, /\.sort-disclosure__option\[aria-pressed='true'\],[\s\S]*?background-color: var\(--surface-section\);/)
    assert.match(LISTING, /\.sort-disclosure__option \{\s*@apply flex min-h-11/)
  })

  test('a circled check before the label, in all three disclosures', () => {
    const orders = read('src/views/pages/customer/orders/index.twig')
    const stories = read('src/assets/js/partials/stories-filter.js')
    for (const [name, src] of [['brand', BRAND], ['orders', orders], ['stories', stories]]) {
      assert.match(src, /<i class="sicon-check-circle sort-disclosure__check" aria-hidden="true"><\/i>\s*<span/, name)
      assert.doesNotMatch(src, /sicon-check sort-disclosure__check/, name)
    }
  })
})

describe('#110 — the buy pill sits on the card\'s foot', () => {
  test('mt-auto in the body column, and the desktop bag resets the padding', () => {
    assert.match(CARD_CSS, /\.product-card__buy \{\s*@apply mt-auto block pt-3;/)
    assert.match(CARD_CSS, /\.product-card__buy:not\(\.product-card__buy--unavailable\) \{\s*@apply absolute m-0 p-0;/)
  })
})

describe('#112 — price before swatches', () => {
  test('render() puts the price line straight after the rating', () => {
    assert.match(CARD_JS, /\$\{this\.getRating\(\)\}\s*\$\{this\.getPriceLine\(\)\}\s*\$\{this\.getSwatches\(\)\}\s*\$\{this\.getDonation\(\)\}/)
  })
})

describe('#114 — the result count is shown on search only', () => {
  test('sr-only elsewhere, still a live region everywhere', () => {
    assert.match(INDEX, /<p class="listing-count \{\{ is_search_page \? 'listing-count--visible' : 'sr-only' \}\}" data-listing-count role="status" aria-live="polite"><\/p>/)
  })

  test('only the visible variant is styled and collapses empty', () => {
    assert.match(LISTING, /\.listing-count--visible:empty \{\s*@apply hidden;/)
    assert.doesNotMatch(LISTING, /\.listing-count:empty/)
    assert.doesNotMatch(LISTING, /\.sr-only/)
  })
})

describe('#115 — the cover trail stops at the parent', () => {
  test('the last crumb and the arrow before it are hidden, only over the cover', () => {
    assert.match(LISTING, /\.listing-cover__breadcrumbs \.s-breadcrumb-wrapper > :last-child,\s*\.listing-cover__breadcrumbs \.s-breadcrumb-wrapper > \.s-breadcrumb-arrow:nth-last-child\(2\) \{\s*display: none;/)
  })
})
