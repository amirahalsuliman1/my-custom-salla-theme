/**
 * T-8.04, second pass — the `ItemList` node on the listing pages.
 *
 * WHY THIS ONE NODE IS BUILT IN THE BROWSER, ASSERTED HERE SO NOBODY "FIXES" IT
 * INTO TWIG. `pages/product/index.twig` receives `page`, `category`, `filters`,
 * `sort_options` and `search_query` — **and no product collection**. The grid is
 * `<salla-products-list source="…">`, which fetches over the API after load. A
 * server-rendered `ItemList` there is not a thing that was skipped; it is a
 * thing there is no data for.
 *
 * THE RULES THAT MATTER ARE THE TWO NEGATIVE ONES. An `ItemList` claiming zero
 * items is the «empty claim» T-8.04 rules out across every other node, and a
 * list describing products the visitor is not looking at — after a filter, a
 * sort, or the second page of an infinite scroll — is worse than no list at all.
 *
 * WHAT THESE TESTS CANNOT DO. They cannot confirm Google executes the script,
 * renders the node, or accepts it. That is /docs/MANUAL-QA.md §1.6, and it is
 * the only step that can say this node is seen at all.
 */
import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { JSDOM } from 'jsdom'

const SOURCE = 'src/assets/js/partials/item-list-schema.js'

/** A listing page with `count` rendered product cards. */
const page = (count) => `<!doctype html><html><head></head><body>
  <salla-products-list>
    ${Array.from(
      { length: count },
      (_, i) =>
        `<custom-salla-product-card><h3 class="product-card__title">
           <a class="card__link" href="https://shop.test/p/${i + 1}">منتج ${i + 1}</a>
         </h3></custom-salla-product-card>`,
    ).join('')}
  </salla-products-list>
</body></html>`

let dom
let init

/** Load the module fresh against a given document — the harness's own rule. */
async function boot(html) {
  dom = new JSDOM(html, { url: 'https://shop.test/category/x' })
  global.window = dom.window
  global.document = dom.window.document
  global.MutationObserver = dom.window.MutationObserver
  const mod = await import(`../${SOURCE}?t=${Math.random()}`)
  init = mod.default
  init()
  // The module coalesces bursts behind a 200 ms timer.
  await new Promise((r) => setTimeout(r, 260))
}

const node = () => document.getElementById('itemlist-schema')
const parsed = () => JSON.parse(node().textContent)

beforeEach(() => {
  dom?.window?.close?.()
})

describe('T-8.04 — the node describes what the page is showing', () => {
  test('a listing with products emits a parsable ItemList', async () => {
    await boot(page(3))
    assert.ok(node(), 'no ItemList node was emitted')
    const data = parsed()
    assert.equal(data['@context'], 'https://schema.org')
    assert.equal(data['@type'], 'ItemList')
    assert.equal(data.itemListElement.length, 3)
  })

  test('positions are 1-based and follow the order on screen', async () => {
    await boot(page(3))
    const items = parsed().itemListElement
    assert.deepEqual(
      items.map((i) => i.position),
      [1, 2, 3],
    )
    assert.equal(items[0].url, 'https://shop.test/p/1')
    assert.equal(items[0].name, 'منتج 1')
    assert.equal(items[0]['@type'], 'ListItem')
  })

  test('the node lives in the head, once, not once per rebuild', async () => {
    await boot(page(2))
    const list = document.querySelector('salla-products-list')
    list.innerHTML += `<h3 class="product-card__title">
      <a class="card__link" href="https://shop.test/p/9">تاسع</a></h3>`
    await new Promise((r) => setTimeout(r, 260))
    assert.equal(document.querySelectorAll('#itemlist-schema').length, 1)
    assert.equal(parsed().itemListElement.length, 3)
  })
})

describe('T-8.04 — the two negative rules', () => {
  test('an empty listing emits NO node rather than an empty list', async () => {
    // The «empty claim» rule this theme applies to every other node: an absent
    // key beats a key asserting nothing.
    await boot(page(0))
    assert.equal(node(), null)
  })

  test('a listing that empties out removes the node it had', async () => {
    // A filter that matches nothing must not leave the previous page's products
    // described in the head.
    await boot(page(2))
    assert.ok(node())
    document.querySelector('salla-products-list').innerHTML = ''
    await new Promise((r) => setTimeout(r, 260))
    assert.equal(node(), null)
  })

  test('a half-rendered card is skipped rather than described as blank', async () => {
    await boot(page(1))
    const list = document.querySelector('salla-products-list')
    list.innerHTML += `<h3 class="product-card__title"><a class="card__link" href=""></a></h3>`
    await new Promise((r) => setTimeout(r, 260))
    assert.equal(parsed().itemListElement.length, 1)
  })

  test('nothing is emitted on a page with no products list at all', async () => {
    // The module ships in the listing bundle; it must be inert on any page that
    // bundle also happens to reach.
    await boot('<!doctype html><html><head></head><body><main></main></body></html>')
    assert.equal(node(), null)
  })
})

describe('T-8.04 — merchant data cannot break the node', () => {
  test('a product name with quotes still parses', async () => {
    // The Twig side uses `json_encode|raw` for this; the browser side gets it
    // from `JSON.stringify` and `textContent`, never `innerHTML`.
    //
    // The name carries a literal U+2028 LINE SEPARATOR, written as an escape so
    // eslint's no-irregular-whitespace rule does not have to be argued with.
    // It is the exact character T-4.10's note names as the one that turns a
    // node into JSON that does not parse — and a node that does not parse is
    // silently ignored, which is this whole file's failure mode.
    await boot(`<!doctype html><html><head></head><body><salla-products-list>
      <h3 class="product-card__title"><a class="card__link" href="https://shop.test/p/1">Sam's "Shop"${'\u2028'}</a></h3>
    </salla-products-list></body></html>`)
    assert.doesNotThrow(() => parsed())
    assert.match(parsed().itemListElement[0].name, /Sam's "Shop"/)
  })

  test('the script is written with textContent, never innerHTML', async () => {
    const src = fs.readFileSync(SOURCE, 'utf8')
    assert.match(src, /\.textContent\s*=/)
    assert.ok(!/\.innerHTML\s*=/.test(src), 'a script element must never be filled with innerHTML')
  })
})

describe('T-8.04 — it stays in the browser, deliberately', () => {
  test('no Twig template emits an ItemList', async () => {
    // If this ever fails, someone has server-rendered one — which means they
    // found a product collection in the listing page's context. That would be
    // better, and this test should be deleted in the same change.
    const twigs = fs
      .readdirSync('src/views/pages/product')
      .map((f) => `src/views/pages/product/${f}`)
      .filter((f) => f.endsWith('.twig'))
    for (const f of twigs) {
      assert.ok(!fs.readFileSync(f, 'utf8').includes('ItemList'), `${f} emits an ItemList`)
    }
  })

  test('the listing bundle boots it', async () => {
    const products = fs.readFileSync('src/assets/js/products.js', 'utf8')
    assert.match(products, /import initItemListSchema from '\.\/partials\/item-list-schema'/)
    assert.match(products, /initItemListSchema\(\)/)
  })
})
