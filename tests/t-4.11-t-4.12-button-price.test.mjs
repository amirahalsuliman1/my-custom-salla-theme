/**
 * T-4.11 and T-4.12 — the price inside the add-to-cart button.
 *
 * These two tasks are tested together because they are one method.
 * `keepButtonPriceInSync` exists because `salla-add-product-button` captures
 * `host.innerHTML` once and rewrites it on every render (T-4.11), and it
 * re-creates the span rather than only updating it because with the sticky bar
 * on — the default — the component stops honouring that captured markup at all
 * and writes its label from `getLabel()` (T-4.12). Splitting the cases across
 * two files would put the two halves of one guard in two places.
 *
 * **The component is not stubbed; its destructive behaviour is performed.** A
 * test that politely left the price span alone would pass against a method that
 * does nothing. So each case rewrites the button the way the component does and
 * then asks what survived.
 *
 * The module is `product.js`, imported whole, because `initiateWhenReady` is how
 * this method is reached in a browser and a test that called it directly would
 * be testing a path the page does not take.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/product.js';

/**
 * The product page, reduced to what this method touches plus what the sibling
 * `registerEvents` price listener dereferences — both listeners fire on one
 * `onPriceUpdated`, so a fixture missing `.out-of-stock` would fail in the
 * other one and blame this task.
 */
function pdp({ price = 'SAR 100', label = 'أضف للسلة', disabled = false } = {}) {
  return `
    <div class="price-wrapper">
      <span class="total-price">SAR 100</span>
      <span class="before-price"></span>
      <span class="product-weight"></span>
      <span class="product-sku"></span>
      <span class="starting-price-title"></span>
      <span class="price_is_on_sale"></span>
      <span class="starting-or-normal-price"></span>
    </div>
    <div class="out-of-stock hidden"></div>

    <div class="product-actions" data-price="${price}">
      <salla-add-product-button product-id="1"${disabled ? ' disabled' : ''}>
        <span class="s-button-text"
          ><span class="product-actions__price total-price" aria-hidden="true">${price}</span
          ><span>${label}</span></span>
      </salla-add-product-button>
    </div>`;
}

const boot = () => loadFresh(SOURCE);

/** What the component does on every render: rewrite the label it decided on. */
function componentRewritesLabel(document, label = 'أضف للسلة') {
  const button = document.querySelector('salla-add-product-button');

  button.innerHTML = `<span class="s-button-text">${label}</span>`;
  return button;
}

const priceOf = (document) =>
  document.querySelector('salla-add-product-button .total-price')?.innerHTML ?? null;

afterEach(teardownDom);

describe('T-4.11 · the price is kept true against the component that rewrites it', () => {
  test('the starting price comes from the template, not from the button', async () => {
    const { document, control } = createDom({ html: pdp({ price: 'SAR 250' }), pageSlug: 'product.single' });

    await boot();

    // Nothing has re-rendered yet, so the proof is what happens when it does:
    // the value re-stamped is the server's, which only `data-price` carries.
    componentRewritesLabel(document);
    await flush();

    assert.equal(priceOf(document), 'SAR 250');
    assert.deepEqual(control.calls.warned, []);
  });

  test('a price update reaches every .total-price inside the button', async () => {
    const { document, control } = createDom({ html: pdp(), pageSlug: 'product.single' });

    await boot();

    control.emitPriceUpdated({ price: 320, regular_price: 400, has_sale_price: true });
    await flush();

    assert.equal(priceOf(document), 'SAR 320');
  });

  test('the price is formatted by the platform, never by the theme', async () => {
    const { document, control } = createDom({ html: pdp(), pageSlug: 'product.single' });

    await boot();

    control.emitPriceUpdated({ price: 99.5, regular_price: 99.5 });
    await flush();

    // `salla.money` is the only thing that turns 99.5 into a displayed string.
    assert.equal(priceOf(document), 'SAR 99.5');
  });

  test('re-stamping does not feed itself — the node survives an unchanged write', async () => {
    const { document, control } = createDom({ html: pdp(), pageSlug: 'product.single' });

    await boot();

    const span = document.querySelector('salla-add-product-button .total-price');

    control.emitPriceUpdated({ price: 100 });
    await flush();

    // Same value as `data-price`, so the guard should have skipped the write and
    // left the node — and its children — untouched rather than churning them.
    assert.equal(
      document.querySelector('salla-add-product-button .total-price'),
      span,
    );
    assert.equal(document.querySelectorAll('salla-add-product-button .total-price').length, 1);
  });

  test('a page with no add-to-cart button is a clean no-op', async () => {
    createDom({ html: '<div class="price-wrapper"></div><div class="out-of-stock"></div>', pageSlug: 'product.single' });

    await assert.doesNotReject(boot);
  });

  test('the method does not run on other pages', async () => {
    const { document } = createDom({ html: pdp(), pageSlug: 'cart' });

    await boot();

    componentRewritesLabel(document);
    await flush();

    // `initiateWhenReady(['product.single'])` gated it, so nothing was restored.
    assert.equal(priceOf(document), null);
  });
});

describe('T-4.12 · the span is re-created when the component destroys it', () => {
  test('a rewritten label gets the price back', async () => {
    const { document } = createDom({ html: pdp({ price: 'SAR 250' }), pageSlug: 'product.single' });

    await boot();

    componentRewritesLabel(document);

    assert.equal(priceOf(document), null, 'the component really did destroy it');

    await flush();

    assert.equal(priceOf(document), 'SAR 250');
  });

  test('the label the component chose is kept, and the price goes in front of it', async () => {
    const { document } = createDom({ html: pdp(), pageSlug: 'product.single' });

    await boot();

    // `getLabel()` also says «نفد المخزون» and «اطلب مسبقًا». Overwriting the
    // label would put a buy price on a button that cannot buy.
    componentRewritesLabel(document, 'اطلب مسبقًا');
    await flush();

    const text = document.querySelector('.s-button-text');

    assert.equal(text.firstElementChild.classList.contains('total-price'), true, 'price at the inline start');
    assert.match(text.textContent, /اطلب مسبقًا/, 'the component’s own label survives');
  });

  test('nothing is added while the button is disabled', async () => {
    const { document } = createDom({ html: pdp({ disabled: true }), pageSlug: 'product.single' });

    await boot();

    componentRewritesLabel(document);
    await flush();

    // Out of stock: a price beside an unavailable product is an offer the store
    // is not making.
    assert.equal(priceOf(document), null);
  });

  test('the re-created span is hidden from assistive technology', async () => {
    const { document } = createDom({ html: pdp(), pageSlug: 'product.single' });

    await boot();

    componentRewritesLabel(document);
    await flush();

    const span = document.querySelector('salla-add-product-button .total-price');

    // The price is already in the page and in the button's own accessible name;
    // a second reading of it inside the label is noise.
    assert.equal(span.getAttribute('aria-hidden'), 'true');
    assert.equal(span.className, 'product-actions__price total-price');
  });

  test('a rewrite after a price change restores the new price, not the load-time one', async () => {
    const { document, control } = createDom({ html: pdp({ price: 'SAR 100' }), pageSlug: 'product.single' });

    await boot();

    control.emitPriceUpdated({ price: 480 });
    await flush();

    // This is the T-4.11 failure exactly: the component re-renders on
    // `product-options::change`, which is when the price changed.
    componentRewritesLabel(document);
    await flush();

    assert.equal(priceOf(document), 'SAR 480');
  });

  test('repeated rewrites leave exactly one price span', async () => {
    const { document } = createDom({ html: pdp(), pageSlug: 'product.single' });

    await boot();

    for (let i = 0; i < 3; i += 1) {
      componentRewritesLabel(document);
      await flush();
    }

    assert.equal(document.querySelectorAll('salla-add-product-button .total-price').length, 1);
  });

  test('a button with no .s-button-text yet is left alone rather than guessed at', async () => {
    const { document } = createDom({ html: pdp(), pageSlug: 'product.single' });

    await boot();

    const button = document.querySelector('salla-add-product-button');

    // Mid-upgrade: the component has emptied the host and not yet rendered.
    button.innerHTML = '';
    await flush();

    assert.equal(priceOf(document), null);
    assert.equal(button.innerHTML, '', 'nothing invented into an element still rendering');
  });
});
