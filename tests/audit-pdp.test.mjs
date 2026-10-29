/**
 * The PDP audit, 2026-10-15 — design-vs-code defects confirmed against
 * `Product Details Page.pdf`, its «On Scroll» state and both desktop SVGs.
 *
 * Each test pins one fix by reading the source, the way the other design-pass
 * tests do; the related-products removal runs through the DOM harness, because
 * what it guards is a node that must leave the document.
 */
import { test, describe, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createDom, teardownDom, loadFresh, observers } from './harness/dom.mjs'
import { updateScrollIndicator } from '../src/assets/js/partials/scroll-indicator.js'

const read = (path) => fs.readFileSync(path, 'utf8')

const TWIG = read('src/views/pages/product/single.twig')
const INFO = read('src/assets/styles/04-components/product-info.scss')
const STORIES = read('src/assets/js/partials/pdp-stories.js')
const HOME = read('src/assets/js/home.js')
const AR = JSON.parse(read('src/locales/ar.json'))
const EN = JSON.parse(read('src/locales/en.json'))
const SETTINGS = JSON.parse(read('twilight.json'))

/** Twig with its `{# … #}` comments removed, so prose cannot satisfy a test. */
const MARKUP = TWIG.replace(/\{#[\s\S]*?#\}/g, '')

afterEach(teardownDom)

describe('#58 · the low-stock line', () => {
  test('is the bell line under the options, not upstream\'s white pill', () => {
    const options = MARKUP.indexOf("{% include 'pages.partials.product.options' %}")
    const stock = MARKUP.indexOf('<p class="product-stock">')
    const bar = MARKUP.indexOf('<section class="sticky-product-bar')

    assert.ok(options > 0 && stock > options && stock < bar, 'after the options, before the quantity')
    assert.match(MARKUP, /<i class="sicon-bell" aria-hidden="true"><\/i>\s*<span>\{\{ trans\('theme\.product\.only_left', \{'count': product\.quantity\}\) \}\}<\/span>/)
    assert.doesNotMatch(MARKUP, /sicon-box-bankers|pages\.products\.remained/)
    assert.doesNotMatch(MARKUP, /bg-white py-2\.5 mb-5 rounded-md inline-flex/)
  })

  test('is bold error red with no box', () => {
    const rule = INFO.match(/\.product-stock \{([^}]*)\}/)

    assert.ok(rule)
    assert.match(rule[1], /@apply [^;]*\bflex\b[^;]*\bfont-bold\b/)
    assert.match(rule[1], /color: var\(--color-error\)/)
    assert.doesNotMatch(rule[1], /background|border|rounded|justify-center/)
  })
})

describe('#59 · the options block', () => {
  test('sits on the panel, title over swatches, hairline under', () => {
    assert.match(INFO, /\.product-details-panel \.product-form \.s-product-options-wrapper \{\s*@apply rounded-none bg-transparent p-0;/)
    assert.match(INFO, /\.product-details-panel \.product-form \.s-product-options-option:not\(div\.s-product-options-option-booking\) \{\s*display: block;/)
    assert.match(INFO, /\.product-details-panel \.product-form \.s-product-options-option-label \{\s*@apply mb-2\.5;/)
    assert.match(INFO, /\.product-details-panel \.product-form \.s-product-options-option-container \{\s*@apply pb-4;\s*border-block-end: 1px solid var\(--border-interactive\);/)
  })
})

describe('#61 · price and label inside the add-to-cart button', () => {
  test('price at the inline start, label pushed to the inline end', () => {
    assert.match(INFO, /\.product-actions salla-add-product-button \.s-button-text \{\s*@apply flex min-w-0 flex-auto items-center justify-center gap-3;/)
    assert.match(INFO, /\.product-actions salla-add-product-button \.product-actions__price \{\s*margin-inline-end: auto;/)
    assert.doesNotMatch(INFO, /\.s-button-text \{[^}]*space-between/)
  })
})

describe('#62 #140 · the reviews heading', () => {
  test('is the drawn title, from the locales', () => {
    assert.match(MARKUP, /<salla-comments[^>]*block-title="\{\{ trans\('theme\.product\.reviews_title'\) \}\}"/)
    assert.equal(AR.theme.product.reviews_title, 'آراء من قلب التجربة')
    assert.ok(EN.theme.product.reviews_title)
  })

  test('is start aligned', () => {
    assert.match(INFO, /\.product-reviews \.s-comments-title \{[^}]*text-align: start;/)
  })
})

describe('#63 · the reviews panel and window', () => {
  test('the component sits in a section panel, inside the ratings guard', () => {
    assert.match(MARKUP, /\{% if store\.settings\.rating\.show_on_product %\}\s*<section class="s-block container product-reviews"[^>]*>\s*<div class="s-block__panel">\s*<salla-comments/)
  })

  test('upstream\'s cool grey band and inner container are cancelled', () => {
    assert.match(INFO, /\.product-reviews \.s-comments-product \{\s*background-color: transparent;\s*padding-block: 0;/)
    assert.match(INFO, /\.product-reviews \.s-comments-container \{[^}]*max-inline-size: none;\s*padding-inline: 0;/)
  })

  test('the list scrolls inside a named window, in the drawn colours', () => {
    assert.match(INFO, /\.product-reviews \{\s*--reviews-window: 31\.5rem;/)
    const rule = INFO.match(/\.product-reviews \.s-comments-header \+ div \{([^}]*)\}/)

    assert.ok(rule)
    assert.match(rule[1], /max-block-size: var\(--reviews-window\)/)
    assert.match(rule[1], /overflow-y: auto/)
    assert.match(rule[1], /scrollbar-color: var\(--text-secondary\) transparent/)
  })
})

describe('#64 #65 · «قد يعجبك أيضًا»', () => {
  test('the title is the theme\'s, not Salla\'s «منتجات مشابهة»', () => {
    assert.match(MARKUP, /data-related-title="\{\{ trans\('theme\.product\.related_title'\) \}\}"/)
    assert.doesNotMatch(MARKUP, /pages\.products\.similar_products/)
    assert.equal(AR.theme.product.related_title, 'قد يعجبك أيضًا')
    assert.ok(EN.theme.product.related_title)
  })

  test('the slider mounts in a section panel, with white cards on it', () => {
    assert.match(MARKUP, /<section class="s-block container product-related[^"]*"[^>]*>\s*<div class="s-block__panel"\s+data-related-slider/)
    assert.match(INFO, /\.product-related \.product-card \{\s*background-color: var\(--surface-card\);/)
  })

  test('an empty slider takes the whole section with it', async () => {
    const { document } = createDom({
      pageSlug: 'product.single',
      html: `
        <div class="price-wrapper"><span class="total-price"></span></div>
        <div class="out-of-stock hidden"></div>
        <section class="s-block product-related">
          <div class="s-block__panel" data-related-slider data-related-id="55" data-related-title="قد يعجبك أيضًا"></div>
        </section>`,
    })

    await loadFresh('src/assets/js/product.js')
    observers.intersection.at(-1).trigger()

    const slot = document.createElement('div')
    slot.setAttribute('slot', 'items')
    document.querySelector('salla-products-slider').append(slot)
    await new Promise((resolve) => setTimeout(resolve, 200))

    assert.equal(document.querySelector('.product-related'), null)
  })
})

describe('#139 · the panels under the product', () => {
  test('are full bleed at rx24 below 1024px and T-2.18\'s panel from there', () => {
    assert.match(INFO, /\.product-notes \.s-block__panel,\s*\.product-stories \.s-block__panel,\s*\.product-reviews \.s-block__panel,\s*\.product-related \.s-block__panel \{\s*@apply rounded-3xl px-4;\s*margin-inline: calc\(-1 \* var\(--page-gutter, 16px\)\);/)
    assert.match(INFO, /@include from-laptop \{\s*\.product-notes \.s-block__panel,[\s\S]*?\{\s*@apply rounded-large px-2;\s*margin-inline: 0;/)
  })

  test('the shared section panel is untouched', () => {
    const panel = read('src/assets/styles/04-components/section-panel.scss')
    assert.match(panel, /\.s-block__panel \{\s*@apply rounded-large px-2 py-4;/)
  })
})

describe('#140 · the hairline under each section heading', () => {
  test('stories, reviews and related, PDP only', () => {
    assert.match(INFO, /\.product-stories \.section-header,\s*\.product-reviews \.s-comments-title,\s*\.product-related \.s-slider-block__title \{\s*@apply pb-3;\s*border-block-end: 1px solid var\(--border-interactive\);/)
    const header = read('src/assets/styles/04-components/section-header.scss')
    assert.doesNotMatch(header, /border/)
  })
})

describe('#141 · the breadcrumb row', () => {
  test('is 56 tall over a hairline on the PDP, without upstream\'s py-5', () => {
    assert.match(MARKUP, /<nav class="breadcrumbs product-breadcrumbs w-full">/)
    assert.match(INFO, /\.product-breadcrumbs \{\s*@apply flex items-center;\s*min-block-size: 3\.5rem;\s*border-block-end: 1px solid var\(--border-interactive\);/)
  })
})

describe('#142 · the notes\' hairlines', () => {
  test('every block, the last included, at every width', () => {
    assert.match(INFO, /\.product-notes \.faq__item,\s*\.product-notes \.faq__item:last-child \{\s*@apply pb-4;\s*border-block-end: 1px solid var\(--border-interactive\);/)
    assert.doesNotMatch(INFO, /\.product-notes__grid \.faq__item \{[^}]*border-b-0/)
  })

  test('the FAQ draws the same rule under its last entry (content audit #99)', () => {
    const accordion = read('src/assets/styles/04-components/accordion.scss')
    assert.doesNotMatch(accordion, /\.faq__item:last-child/)
  })
})

describe('#143 · the stories row', () => {
  test('carries T-4.03\'s indicator, hidden until measured', () => {
    assert.match(MARKUP, /<div class="product-carousel__indicator product-stories__indicator" data-pdp-stories-indicator aria-hidden="true" hidden>\s*<span class="product-carousel__thumb"><\/span>/)
    assert.match(STORIES, /import bindScrollIndicator from '\.\/scroll-indicator'/)
    assert.ok(STORIES.indexOf('section.hidden = false') < STORIES.indexOf('bindScrollIndicator(track, indicator)'), 'measured once shown')
  })

  test('one driver for Home and the PDP', () => {
    assert.match(HOME, /import \{ updateScrollIndicator \} from "\.\/partials\/scroll-indicator"/)
    assert.match(HOME, /updateScrollIndicator\(track, indicator\)/)
  })

  test('the helper reports position with the RTL correction, and hides when nothing scrolls', () => {
    const props = {}
    const indicator = { hidden: true, dataset: {}, style: { setProperty: (k, v) => { props[k] = v } } }

    updateScrollIndicator({ scrollWidth: 400, clientWidth: 100, scrollLeft: -150 }, indicator)
    assert.equal(indicator.hidden, false)
    assert.equal(props['--carousel-visible'], 0.25)
    assert.equal(props['--carousel-progress'], 0.5)

    updateScrollIndicator({ scrollWidth: 100, clientWidth: 100, scrollLeft: 0 }, indicator)
    assert.equal(indicator.hidden, true)
  })

  test('no native scrollbar, about three and a third cards on a phone', () => {
    assert.match(INFO, /\.product-stories__track \{[^}]*scrollbar-width: none;/)
    assert.match(INFO, /\.product-stories__track::-webkit-scrollbar \{\s*display: none;/)
    assert.match(INFO, /\.product-stories__track \.story-card \{\s*@apply shrink-0;\s*flex-basis: 28%;/)
  })
})

describe('#144 · the docked action row', () => {
  test('floats with no strip behind it on a phone', () => {
    const rule = INFO.match(/body\.pdp-actions-docked \.sticky-product-bar \.product-actions \{([^}]*)\}/)

    assert.ok(rule)
    assert.match(rule[1], /background-color: transparent/)
    assert.doesNotMatch(rule[1], /box-shadow|--surface-page/)
    assert.match(INFO, /body\.pdp-actions-docked \.sticky-product-bar \.product-actions > \* \{\s*pointer-events: auto;/)
  })

  test('from 1024px it is still the floating card', () => {
    assert.match(INFO, /@include from-laptop \{[\s\S]*?background-color: var\(--surface-card\);\s*box-shadow: 0 8px 28px/)
  })
})

describe('#146 · the desktop column split', () => {
  test('3/5 gallery, 2/5 info from 1024px; half and half below', () => {
    assert.match(MARKUP, /class="sidebar product-gallery[^"]*md:!w-2\/4 lg:!w-3\/5/)
    assert.match(MARKUP, /class="main-content[^"]*md:w-2\/4 lg:w-2\/5"/)
  })
})

describe('#147 · upstream extras the artboards do not draw', () => {
  test('no share control', () => {
    assert.doesNotMatch(MARKUP, /salla-social-share/)
  })

  test('tags are off unless the merchant turns them on', () => {
    assert.match(MARKUP, /theme\.settings\.get\('show_tags', false\)/)
    const setting = SETTINGS.settings.find((s) => s.id === 'show_tags')
    assert.equal(setting.value, false)
    assert.equal(setting.selected, false)
  })

  test('the tax note stays — a disclosure, T-3.08\'s reasoning', () => {
    assert.match(MARKUP, /pages\.products\.tax_included/)
  })
})

describe('#148 · accessible names', () => {
  test('no English literal names a control', () => {
    assert.doesNotMatch(MARKUP, /aria-label="(Quantity|social share)"/)
  })
})
