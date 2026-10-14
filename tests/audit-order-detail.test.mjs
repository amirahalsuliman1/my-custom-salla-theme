/**
 * Audit pass, screen group «order-detail» (2026-10-15) — the order page against
 * `Order Tracking Page.pdf`, its floating-menu state and
 * `Desktop Order Tracking Page - Floating Menu.svg`, plus the shared order row
 * and the post-purchase page's one hard-coded string.
 *
 * Most of it is source order, which no stylesheet can be trusted to restore on a
 * phone, so the assertions read the templates the way the page reads them: top
 * to bottom. The collapse is behaviour, so it is booted against a real DOM.
 */
import { test, describe, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs'

const read = (file) => fs.readFileSync(file, 'utf8')

const SINGLE = read('src/views/pages/customer/orders/single.twig')
const ITEM = read('src/views/components/orders/item.twig')
const CARD = read('src/views/components/orders/card.twig')
const THANKS = read('src/views/pages/thank-you.twig')
const CSS = read('src/assets/styles/04-components/order-card.scss')
const AR = JSON.parse(read('src/locales/ar.json')).theme
const EN = JSON.parse(read('src/locales/en.json')).theme

/** The markup only — comments quote class names and would fool an `indexOf`. */
const markup = (twig) => twig.replace(/\{#[\s\S]*?#\}/g, '')
const PAGE = markup(SINGLE)
const ROW = markup(ITEM)

/** The from-laptop block that arranges the order page. */
const desktop = CSS.slice(CSS.lastIndexOf('@include from-laptop'))
/** Everything before the first from-laptop block: the phone's rules. */
const mobile = CSS.slice(0, CSS.indexOf('@include from-laptop'))

const at = (needle, haystack = PAGE) => {
  const index = haystack.indexOf(needle)

  assert.notEqual(index, -1, `missing: ${needle}`)
  return index
}

describe('#50 · the tracking steps lead the page, in the markup', () => {
  test('hook, then tracking, then the summary', () => {
    const hook = at("{% hook 'customer:orders.single.details.start' %}")
    const tracking = at('data-order-tracking')
    const summary = at('<section class="account-panel order-page__summary">')

    assert.ok(hook < tracking && tracking < summary)
  })

  test('the desktop grid still pins tracking first, and its gap is the only rhythm', () => {
    assert.match(desktop, /> \[data-order-tracking\] \{\s*order: -1;/)
    assert.match(desktop, /:has\(> \.order-page__summary\) > :not\(\[hidden\]\) ~ :not\(\[hidden\]\) \{\s*margin-block-start: 0;/)
  })
})

describe('#51 · the price paid first, the struck original after it', () => {
  test('in the shared row, the current price precedes the struck one', () => {
    const paid = at('<span>{{ item.price|money }}</span>', ROW)
    const was = at('<span class="order-item__was">', ROW)

    assert.ok(paid < was)
    assert.ok(ROW.includes("trans('theme.common.was_price')"), 'the struck price keeps its sr-only label')
  })

  test('both pages render that one row', () => {
    assert.ok(CARD.includes("{% include 'components.orders.item'"))
    assert.ok(SINGLE.includes("{% include 'components.orders.item'"))
  })
})

describe('#52 · «المنتجات» with T-6.01\'s collapse control', () => {
  test('a heading and the shared toggle sit over each package\'s list', () => {
    const head = at('<div class="order-package__products-head">')
    const title = at("<h2 class=\"order-package__products-title\">{{ trans('theme.orders.products_title') }}</h2>")
    const list = at('<ul class="order-card__items" id="order-items-{{ loop.index }}">')

    assert.ok(head < title && title < list)
    assert.match(PAGE, /class="order-card__toggle"\s+aria-expanded="true"\s+aria-controls="order-items-\{\{ loop\.index \}\}"\s+data-order-toggle\s+hidden>/)
    assert.match(PAGE, /<span class="disclosure-mark" aria-hidden="true"><\/span>\s*<span class="sr-only">\{\{ trans\('theme\.orders\.toggle_products'\) \}\}<\/span>/)
  })

  test('dashed on the phone, solid from 1024px, and a collapsed list stays collapsed', () => {
    assert.match(mobile, /\.order-package__products-head \{[^}]*border-block-end: 1px dashed var\(--border-interactive\);/)
    assert.match(desktop, /\.order-package__header,\s*\.order-package__products-head \{\s*border-block-end-style: solid;/)
    assert.ok(desktop.includes('> .order-package__products > .order-card__items:not([hidden]) {'))
  })
})

describe('#52 · the order page\'s toggle is driven by the list\'s own handler', () => {
  afterEach(teardownDom)

  const PRODUCTS = `
    <section class="order-package">
      <div class="order-package__products-head">
        <h2>المنتجات</h2>
        <button type="button" class="order-card__toggle" aria-expanded="true"
                aria-controls="order-items-1" data-order-toggle hidden>
          <span class="disclosure-mark"></span>
        </button>
      </div>
      <ul class="order-card__items" id="order-items-1"><li>row</li></ul>
    </section>`

  test('with no orders list on the page, the control appears and collapses its list', async () => {
    createDom({ html: PRODUCTS, pageSlug: 'customer.orders.single' })
    await loadFresh('src/assets/js/partials/order-list.js')
    await flush()

    const button = document.querySelector('[data-order-toggle]')
    const list = document.getElementById('order-items-1')

    assert.equal(button.hidden, false)

    button.click()
    assert.equal(button.getAttribute('aria-expanded'), 'false')
    assert.equal(list.hidden, true)

    button.click()
    assert.equal(button.getAttribute('aria-expanded'), 'true')
    assert.equal(list.hidden, false)
  })
})

describe('#125 · «تفاصيل الشحنة» and visible label rows', () => {
  test('a heading carries the title and the shipment number', () => {
    assert.match(PAGE, /<h2 class="order-package__title">\s*<span class="order-package__title-label">\{\{ trans\('theme\.orders\.shipment_details'\) \}\}<\/span>/)
    assert.match(PAGE, /<span class="order-package__number" dir="ltr">\{\{ package\.shipping_company\.number\|raw \}\}<\/span>/)
  })

  test('the carrier is a labelled row, the tracking label is visible, the link says «تتبع شحنتك»', () => {
    assert.match(PAGE, /<dt>\{\{ trans\('theme\.orders\.shipping_company'\) \}\}<\/dt>/)
    assert.match(PAGE, /<dt>\{\{ trans\('theme\.orders\.tracking_link'\) \}\}<\/dt>/)
    assert.match(PAGE, /rel="noopener">\s*\{\{ trans\('theme\.orders\.track_shipment'\) \}\}\s*<\/a>/)
    assert.ok(!PAGE.includes('order-package__carrier'))
    assert.ok(!PAGE.includes("<dt class=\"sr-only\">{{ trans('pages.orders.tracking_url') }}</dt>"))
    assert.ok(!/name: 'shipping'/.test(PAGE), 'the undrawn shipping icon is gone')
  })

  test('a dashed legend box on the phone, a heading over a solid rule on desktop', () => {
    assert.match(mobile, /\.order-package__title \{[^}]*border: 1px dashed var\(--border-interactive\);/)
    assert.match(mobile, /\.order-package__title-label \{[^}]*background-color: var\(--surface-section\);/)
    assert.match(desktop, /\.order-package__title \{[^}]*border-block-end: 1px solid var\(--border-interactive\);/)
    assert.ok(!CSS.includes('.order-package__carrier'))
  })
})

describe('#126 · the total sits above the products', () => {
  test('after the rating prompt, before the package loop', () => {
    const rate = at('<section class="account-panel order-page__rate">')
    const totals = at('<salla-order-totals-card class="account-panel order-card__totals"')
    const packages = at('{% for package in order.packages %}')

    assert.ok(rate < totals && totals < packages)
    assert.equal(PAGE.split('<salla-order-totals-card').length, 2, 'rendered once')
  })
})

describe('#127 · the order date in full, with its time', () => {
  test('words come from the locales, numbers from PHP format characters', () => {
    assert.ok(PAGE.includes("datetime=\"{{ order.created_at|date('Y-m-d\\\\TH:i') }}\""))
    assert.ok(PAGE.includes("trans('theme.orders.date_time', {"))
    assert.ok(PAGE.includes("trans('theme.date.weekday_' ~ order.created_at|date('w'))"))
    assert.ok(PAGE.includes("trans('theme.date.month_' ~ order.created_at|date('n'))"))
    assert.ok(PAGE.includes("trans('theme.date.' ~ order.created_at|date('A')|lower)"))
    assert.ok(!PAGE.includes("order.created_at|date('d/m/Y')"))
  })

  test('every weekday, month and meridiem exists in both locales', () => {
    for (const theme of [AR, EN]) {
      for (let day = 0; day < 7; day++) assert.ok(theme.date[`weekday_${day}`], `weekday_${day}`)
      for (let month = 1; month <= 12; month++) assert.ok(theme.date[`month_${month}`], `month_${month}`)
      assert.ok(theme.date.am && theme.date.pm)
      for (const token of [':weekday', ':day', ':month', ':year', ':time', ':meridiem']) {
        assert.ok(theme.orders.date_time.includes(token), token)
      }
    }

    assert.equal(AR.date.month_2, 'فبراير')
    assert.equal(AR.date.weekday_5, 'الجمعة')
    assert.equal(AR.date.am, 'صباحًا')
  })

  test('the list card keeps its numeric date, as its artboards draw it', () => {
    assert.ok(CARD.includes("|date('d/m/Y')"))
  })
})

describe('#128 · the post-purchase email placeholder is copy', () => {
  test('a locale key, not upstream\'s literal', () => {
    assert.ok(!THANKS.includes('placeholder="your@email.com"'))
    assert.ok(THANKS.includes("placeholder=\"{{ trans('theme.thank_you.email_placeholder') }}\""))
    assert.ok(AR.thank_you.email_placeholder)
    assert.ok(EN.thank_you.email_placeholder)
  })
})

describe('the new copy exists in both locales', () => {
  test('every key this pass added', () => {
    for (const key of ['products_title', 'toggle_products', 'shipment_details', 'shipping_company', 'tracking_link', 'track_shipment', 'date_time']) {
      assert.ok(AR.orders[key], `ar ${key}`)
      assert.ok(EN.orders[key], `en ${key}`)
    }

    assert.equal(AR.orders.shipment_details, 'تفاصيل الشحنة')
    assert.equal(AR.orders.track_shipment, 'تتبع شحنتك')
  })
})
