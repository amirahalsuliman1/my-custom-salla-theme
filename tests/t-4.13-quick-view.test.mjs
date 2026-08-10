/**
 * T-4.13 — the quick product view.
 *
 * The task is graded on four things, and three of them are claims about what the
 * file does *not* do: it does not preload, it does not implement an overlay, and
 * it does not reimplement the buy flow. Those are asserted here as absences —
 * request counts, and the tag names the sheet renders.
 *
 * The fourth is escaping, and it is the only case here that is a security test
 * rather than a behaviour one. A product name is merchant data arriving through
 * an API and written into `innerHTML`; if it were not escaped, the sheet would
 * be a stored-XSS sink on every listing page in the store.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/quick-view.js';

/** The sheet as `master.twig` includes it, once for the document. */
const PAGE = `
  <div id="quick-view-sheet">
    <h2 class="sheet__title"></h2>
    <div data-quick-view-root>
      <div data-quick-view-loading></div>
      <div data-quick-view-content hidden></div>
      <div data-quick-view-error hidden></div>
    </div>
  </div>
  <div class="grid">
    <custom-salla-product-card>
      <button type="button" data-quick-view="10">عرض سريع</button>
    </custom-salla-product-card>
    <custom-salla-product-card>
      <button type="button" data-quick-view="20">عرض سريع</button>
    </custom-salla-product-card>
  </div>`;

const TRANSLATIONS = {
  'theme.product.quick_view': 'عرض سريع',
  'theme.product.quick_view_failed': 'تعذّر تحميل المنتج',
  'theme.product.view_details': 'عرض التفاصيل',
  'theme.product.add_to_wishlist': 'أضف للمفضلة',
  'theme.cart.was_price': 'السعر قبل الخصم',
  'theme.product.only_left': 'بقي {count} فقط',
};

const product = (overrides = {}) => ({
  id: 10,
  name: 'عباية سوداء',
  price: 350,
  regular_price: 350,
  status: 'sale',
  type: 'product',
  url: 'https://example.test/p/10',
  quantity: 50,
  ...overrides,
});

const setup = (html = PAGE) => createDom({ html, translations: TRANSLATIONS });

const state = (document) => ({
  loading: !document.querySelector('[data-quick-view-loading]').hidden,
  ready: !document.querySelector('[data-quick-view-content]').hidden,
  error: !document.querySelector('[data-quick-view-error]').hidden,
});

/** Exactly one of the three is showing. Asserted everywhere, so it is one call. */
function assertExclusive(document, expected) {
  assert.deepEqual(state(document), {
    loading: expected === 'loading',
    ready: expected === 'ready',
    error: expected === 'error',
  });
}

afterEach(teardownDom);

describe('T-4.13 · fetched on open, never preloaded', () => {
  test('no request at boot, however many cards are on the page', async () => {
    const { control } = setup();

    await loadFresh(SOURCE);

    assert.deepEqual(control.calls.getDetails, []);
  });

  test('exactly one request on first open', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();

    assert.deepEqual(control.calls.getDetails, ['10']);
  });

  test('reopening the same product costs nothing', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);

    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product() });
    await flush();

    document.querySelector('[data-quick-view="10"]').click();
    await flush();

    assert.deepEqual(control.calls.getDetails, ['10'], 'served from the per-id cache');
    assertExclusive(document, 'ready');
  });

  test('a different product costs exactly one more', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);

    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product() });
    await flush();

    document.querySelector('[data-quick-view="20"]').click();

    assert.deepEqual(control.calls.getDetails, ['10', '20']);
  });

  test('the trigger is delegated, so a card added after boot works', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);

    const late = document.createElement('button');

    late.setAttribute('data-quick-view', '99');
    document.querySelector('.grid').append(late);
    late.click();

    assert.deepEqual(control.calls.getDetails, ['99']);
  });

  test('the sheet is opened through T-2.10, not by this file', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();

    assert.deepEqual(control.calls.dispatched, [
      { name: 'bottom-sheet::open', payload: 'quick-view-sheet' },
    ]);
  });

  test('a click with no product id does nothing at all', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);

    const empty = document.createElement('button');

    empty.setAttribute('data-quick-view', '');
    document.body.append(empty);
    empty.click();

    assert.deepEqual(control.calls.getDetails, []);
    assert.deepEqual(control.calls.dispatched, []);
  });

  test('a page with no sheet boots without throwing', async () => {
    setup('<div class="grid"></div>');

    await assert.doesNotReject(() => loadFresh(SOURCE));
  });
});

describe('T-4.13 · the three states are mutually exclusive', () => {
  test('loading, on open', async () => {
    const { document } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();

    assertExclusive(document, 'loading');
  });

  test('ready, once the product arrives', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product() });
    await flush();

    assertExclusive(document, 'ready');
  });

  test('error, when the request fails', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.rejectGetDetails();
    await flush();

    assertExclusive(document, 'error');
    assert.equal(document.querySelector('[data-quick-view-error]').textContent, 'تعذّر تحميل المنتج');
  });

  test('error, when the response carries no product', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails(null);
    await flush();

    assertExclusive(document, 'error');
  });

  test('a failure then a success returns to ready — the error is not sticky', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);

    document.querySelector('[data-quick-view="10"]').click();
    control.rejectGetDetails();
    await flush();

    document.querySelector('[data-quick-view="20"]').click();
    control.resolveGetDetails({ data: product({ id: 20 }) });
    await flush();

    assertExclusive(document, 'ready');
  });

  test('reopening after a failure retries rather than serving the failure', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);

    document.querySelector('[data-quick-view="10"]').click();
    control.rejectGetDetails();
    await flush();

    document.querySelector('[data-quick-view="10"]').click();

    // Nothing was cached, because nothing arrived.
    assert.deepEqual(control.calls.getDetails, ['10', '10']);
  });

  test('a bare response with no data envelope is accepted', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails(product());
    await flush();

    assertExclusive(document, 'ready');
  });
});

describe('T-4.13 · the dialog is named by the product', () => {
  test('generic while loading, the product’s once it arrives', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product({ name: 'عباية سوداء' }) });
    await flush();

    assert.equal(document.querySelector('.sheet__title').textContent, 'عباية سوداء');
  });

  test('a product with no name falls back rather than leaving the dialog unnamed', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product({ name: '' }) });
    await flush();

    assert.equal(document.querySelector('.sheet__title').textContent, 'عرض سريع');
  });

  test('a failure names the dialog too', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.rejectGetDetails();
    await flush();

    assert.equal(document.querySelector('.sheet__title').textContent, 'عرض سريع');
  });
});

describe('T-4.13 · no business logic is duplicated', () => {
  test('options and the buy action are the platform’s own components', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product() });
    await flush();

    const content = document.querySelector('[data-quick-view-content]');

    assert.equal(content.querySelector('salla-product-options')?.getAttribute('product-id'), '10');
    assert.equal(content.querySelector('salla-add-product-button')?.getAttribute('product-id'), '10');
  });

  test('the sheet contains no form, no price arithmetic and no cart call', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product() });
    await flush();

    const content = document.querySelector('[data-quick-view-content]');

    assert.equal(content.querySelectorAll('form, input[type="number"]').length, 0);
    assert.deepEqual(control.calls.deleteItem, []);
  });

  test('the price rides inside the button on T-4.11’s hook', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product({ price: 350 }) });
    await flush();

    const price = document.querySelector('salla-add-product-button .total-price');

    assert.equal(price?.innerHTML, 'SAR 350');
    assert.equal(price.getAttribute('aria-hidden'), 'true');
    assert.equal(document.querySelector('.product-actions')?.dataset.price, 'SAR 350');
  });

  test('a sale price is shown with its previous price labelled, not just struck through', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product({ price: 250, regular_price: 400 }) });
    await flush();

    const was = document.querySelector('.quick-view__price--was');

    assert.match(was.textContent, /السعر قبل الخصم/, 'colour and a line through are not the only channel');
    assert.match(was.textContent, /SAR 400/);
    assert.equal(document.querySelector('.quick-view__price').textContent, 'SAR 250');
  });

  test('no previous price when the product is not on sale', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product({ price: 350, regular_price: 350 }) });
    await flush();

    assert.equal(document.querySelector('.quick-view__price--was'), null);
  });

  test('low stock is announced only when it is low', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product({ quantity: 3 }) });
    await flush();

    assert.match(document.querySelector('.quick-view__stock').textContent, /بقي 3 فقط/);
  });

  test('a well-stocked product says nothing about stock', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product({ quantity: 50 }) });
    await flush();

    assert.equal(document.querySelector('.quick-view__stock'), null);
  });

  test('an out-of-stock product says nothing about stock either', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product({ quantity: 0 }) });
    await flush();

    assert.equal(document.querySelector('.quick-view__stock'), null);
  });

  test('a brand renders as a link and its absence renders nothing', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);

    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product({ brand: { name: 'أملاس', url: '/b/1' } }) });
    await flush();

    assert.equal(document.querySelector('.quick-view__brand')?.getAttribute('href'), '/b/1');

    document.querySelector('[data-quick-view="20"]').click();
    control.resolveGetDetails({ data: product({ id: 20, brand: null }) });
    await flush();

    assert.equal(document.querySelector('.quick-view__brand'), null);
  });
});

describe('T-4.13 · merchant data is escaped, not injected', () => {
  test('a <script> in a product name renders as text', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product({ name: '<script>alert(1)</script>' }) });
    await flush();

    const content = document.querySelector('[data-quick-view-content]');

    assert.equal(content.querySelector('script'), null, 'no element was created');
    assert.match(content.querySelector('.quick-view__title').textContent, /alert\(1\)/);
  });

  /**
   * The case that found the defect. Before T-1.09 the escape was
   * `textContent` → `innerHTML`, which is correct between tags and leaves `"`
   * untouched — and nine of this file's ten uses are inside a quoted attribute.
   * This asserts the property directly so a future «simplification» back to the
   * serializer trick fails here rather than in a store.
   */
  test('both quote characters are escaped, because the uses are attributes', async () => {
    setup();

    const { default: QuickView } = await loadFresh(SOURCE);

    assert.equal(QuickView.escape('a"b'), 'a&quot;b');
    assert.equal(QuickView.escape("a'b"), 'a&#39;b');
    assert.equal(QuickView.escape('<b>&'), '&lt;b&gt;&amp;');
    assert.equal(QuickView.escape(null), '');
  });

  test('an attribute cannot be broken out of by a crafted url', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({
      data: product({ url: '" onmouseover="alert(1)' }),
    });
    await flush();

    const link = document.querySelector('.quick-view__details');

    assert.equal(link.getAttribute('onmouseover'), null);
    assert.equal(link.getAttribute('href'), '" onmouseover="alert(1)');
  });

  test('a crafted brand name cannot close its own tag', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({
      data: product({ brand: { name: '</a><img src=x onerror=alert(1)>', url: '/b/1' } }),
    });
    await flush();

    assert.equal(document.querySelector('[data-quick-view-content] img'), null);
  });

  test('the wishlist control carries an accessible name and a pressed state', async () => {
    const { document, control } = setup();

    await loadFresh(SOURCE);
    document.querySelector('[data-quick-view="10"]').click();
    control.resolveGetDetails({ data: product() });
    await flush();

    const heart = document.querySelector('.btn--wishlist');

    assert.equal(heart.getAttribute('aria-label'), 'أضف للمفضلة');
    assert.equal(heart.getAttribute('aria-pressed'), 'false');
    assert.equal(heart.querySelector('i').getAttribute('aria-hidden'), 'true');
  });
});
