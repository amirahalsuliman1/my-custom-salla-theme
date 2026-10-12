/**
 * T-6.04 — reordering.
 *
 * WHAT IS WORTH PINNING HERE IS THE MESSAGE PRECEDENCE. The criterion asks that
 * unavailable or out-of-stock items be «reported rather than silently dropped»,
 * and the API gives exactly one channel for that: `data.message` on the success
 * response. So the rule is that the platform's sentence replaces the artboard's
 * whenever one arrives — and it is a rule that would be very easy to write
 * backwards, producing a theme that cheerfully says «تمت إضافة المنتجات إلى
 * السلة بنجاح!» over a cart missing half the order.
 *
 * The id-on-the-trigger cases are here for T-6.03's reason: one dialog serves a
 * list, so the wrong id means the wrong order is reordered.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/order-reorder.js';

const HTML = `
  <button type="button" data-order-reorder="1024" data-sheet-open="reorder-order-dialog">إعادة الطلب</button>
  <button type="button" data-order-reorder="1023" data-sheet-open="reorder-order-dialog">إعادة الطلب</button>

  <dialog id="reorder-order-dialog" class="sheet sheet--dialog dialog" data-sheet>
    <div class="sheet__panel">
      <button type="button" class="sheet__close" data-sheet-close autofocus>إغلاق</button>
      <h2 class="sheet__title">إعادة الطلب</h2>
      <p class="dialog__message">هل تريد إعادة هذا الطلب؟</p>
      <div class="sheet__footer">
        <button type="button" class="btn dialog__action" data-sheet-close>إغلاق</button>
        <button type="button" class="btn dialog__action" data-dialog-confirm="reorder-order-dialog">إعادة الطلب</button>
      </div>
    </div>
  </dialog>`;

async function boot(html = HTML) {
  const dom = createDom({
    html,
    pageSlug: 'customer.orders.index',
    translations: {
      'theme.orders.reorder_success': 'تمت إضافة المنتجات إلى السلة بنجاح!',
      'theme.orders.reorder_failed': 'تعذّرت إعادة الطلب. حاول مرة أخرى.',
    },
  });

  const calls = { created: [], success: [], error: [], refreshed: 0 };
  let onOrderCreated = () => {};
  let onOrderCreationFailed = () => {};

  globalThis.salla.order = {
    createCartFromOrder: (id) => calls.created.push(id),
    event: {
      onOrderCreated: (cb) => { onOrderCreated = cb; },
      onOrderCreationFailed: (cb) => { onOrderCreationFailed = cb; },
    },
  };
  globalThis.salla.notify = {
    success: (message) => calls.success.push(message),
    error: (message) => calls.error.push(message),
  };
  globalThis.salla.helpers = { getApiErrorMessage: (e) => e?.message };
  globalThis.salla.cart = { api: { latest: () => { calls.refreshed += 1; } } };

  await loadFresh(SOURCE);
  await flush();

  return {
    ...dom,
    calls,
    resolve: (response = {}) => onOrderCreated(response),
    reject: (e) => onOrderCreationFailed(e),
  };
}

const dialog = () => document.getElementById('reorder-order-dialog');
const confirm = () => document.querySelector('[data-dialog-confirm="reorder-order-dialog"]');
const trigger = (id) => document.querySelector(`[data-order-reorder="${id}"]`);

afterEach(teardownDom);

describe('T-6.04 · it reorders the order that was pressed', () => {
  test('the id comes from the trigger', async () => {
    const { calls } = await boot();

    trigger('1023').click();
    confirm().click();

    assert.deepEqual(calls.created, ['1023']);
  });

  test('confirming without a trigger reorders nothing', async () => {
    const { calls } = await boot();

    confirm().click();

    assert.deepEqual(calls.created, []);
  });
});

describe('T-6.04 · what the customer is told', () => {
  test("the artboard's sentence, where the platform sends none", async () => {
    const { calls, resolve } = await boot();

    trigger('1024').click();
    dialog().showModal();
    confirm().click();
    resolve({ data: {} });
    await flush();

    assert.deepEqual(calls.success, ['تمت إضافة المنتجات إلى السلة بنجاح!']);
    assert.equal(dialog().open, false);
  });

  test('the platform\'s own message wins — this is how a dropped item gets reported', async () => {
    const { calls, resolve } = await boot();

    trigger('1024').click();
    confirm().click();
    resolve({ data: { message: 'بعض المنتجات غير متوفرة ولم تُضف.' } });
    await flush();

    // Written the other way round, the theme would announce a clean success over
    // a cart missing half the order.
    assert.deepEqual(calls.success, ['بعض المنتجات غير متوفرة ولم تُضف.']);
  });

  test('a failure announces and leaves the button usable', async () => {
    const { calls, reject } = await boot();

    trigger('1024').click();
    confirm().click();
    reject({ message: 'تعذّر إنشاء السلة' });
    await flush();

    assert.deepEqual(calls.error, ['تعذّر إنشاء السلة']);
    assert.equal(confirm().hasAttribute('aria-busy'), false);
    assert.deepEqual(calls.success, []);
  });
});

describe('T-6.04 · the cart count is refreshed rather than counted', () => {
  test('a success asks the platform to re-read its own cart', async () => {
    const { calls, resolve } = await boot();

    trigger('1024').click();
    confirm().click();
    resolve({ data: {} });
    await flush();

    // T-3.04's header announces `[data-cart-count]`, which `app.js` writes on
    // `cart.event.onUpdated`. Nothing here counts anything.
    assert.equal(calls.refreshed, 1);
  });

  test('a failure does not', async () => {
    const { calls, reject } = await boot();

    trigger('1024').click();
    confirm().click();
    reject({});
    await flush();

    assert.equal(calls.refreshed, 0);
  });
});

describe('T-6.04 · it is inert where the dialog is absent', () => {
  test('a page with no reorder dialog boots without throwing', async () => {
    const { calls } = await boot('<button data-order-reorder="1024">إعادة الطلب</button>');

    document.querySelector('[data-order-reorder]').click();

    assert.deepEqual(calls.created, []);
  });
});
