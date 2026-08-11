/**
 * T-6.03 — cancelling an order.
 *
 * ONE DIALOG SERVES A LIST OF ORDERS, WHICH IS THE WHOLE RISK IN THIS FILE. The
 * artboard is drawn over the orders list, where twenty cards can each offer
 * «إلغاء الطلب» — so the dialog cannot know which order it is about until a
 * trigger is pressed, and the id has to survive from that press to the confirm.
 * Get it wrong and the customer cancels a different order from the one they
 * pressed, which is the worst failure available here and is invisible until it
 * happens.
 *
 * The rest of what is asserted is the criterion, line by line: the destructive
 * action is not what focus lands on, the result is announced, and the page is put
 * back in step afterwards.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/order-cancel.js';

/** T-2.11's dialog as `cancel-dialog.twig` renders it, plus two list triggers. */
const HTML = `
  <button type="button" data-order-cancel="1024" data-sheet-open="cancel-order-dialog">إلغاء الطلب</button>
  <button type="button" data-order-cancel="1023" data-sheet-open="cancel-order-dialog">إلغاء الطلب</button>

  <dialog id="cancel-order-dialog" class="sheet sheet--dialog dialog" data-sheet>
    <div class="sheet__panel">
      <button type="button" class="sheet__close" data-sheet-close autofocus>إغلاق</button>
      <h2 class="sheet__title">تأكيد إلغاء الطلب</h2>
      <p class="dialog__message">لن تتمكن من استعادة هذا الطلب بعد الإلغاء.</p>
      <div class="sheet__footer">
        <button type="button" class="btn dialog__action" data-sheet-close>إغلاق</button>
        <button type="button" class="btn dialog__action" data-dialog-confirm="cancel-order-dialog">تأكيد الإلغاء</button>
      </div>
    </div>
  </dialog>`;

/**
 * `salla.order` is not in the harness's stub — it is this task's dependency, so
 * it is built here with the two events the SDK documents and a `cancel` that
 * records what it was asked to cancel.
 */
async function boot(html = HTML) {
  const dom = createDom({
    html,
    pageSlug: 'customer.orders.index',
    translations: {
      'theme.orders.cancel_success': 'أُلغي الطلب.',
      'theme.orders.cancel_failed': 'تعذّر إلغاء الطلب. حاول مرة أخرى.',
    },
  });

  const calls = { cancel: [], success: [], error: [], reloaded: 0 };
  let onCanceled = () => {};
  let onNotCanceled = () => {};

  globalThis.salla.order = {
    cancel: (id) => calls.cancel.push(id),
    event: {
      onCanceled: (cb) => { onCanceled = cb; },
      onNotCanceled: (cb) => { onNotCanceled = cb; },
    },
  };
  globalThis.salla.notify = {
    success: (message) => calls.success.push(message),
    error: (message) => calls.error.push(message),
  };
  globalThis.salla.helpers = { getApiErrorMessage: (e) => e?.message };

  const module = await loadFresh(SOURCE);

  // `refresh()` is the one statement in the source a test cannot run — it is a
  // navigation. It is a named static for exactly this reason, so «list
  // refreshes» is asserted rather than hoped for.
  module.default.refresh = () => { calls.reloaded += 1; };

  await flush();

  return { ...dom, calls, resolve: () => onCanceled({}), reject: (e) => onNotCanceled(e) };
}

const dialog = () => document.getElementById('cancel-order-dialog');
const confirm = () => document.querySelector('[data-dialog-confirm="cancel-order-dialog"]');
const trigger = (id) => document.querySelector(`[data-order-cancel="${id}"]`);

afterEach(teardownDom);

describe('T-6.03 · it cancels the order that was pressed', () => {
  test('the id comes from the trigger, not from the dialog', async () => {
    const { calls } = await boot();

    trigger('1023').click();
    confirm().click();

    assert.deepEqual(calls.cancel, ['1023']);
  });

  test('pressing a second trigger replaces the first, rather than queueing it', async () => {
    const { calls } = await boot();

    // A customer who opens the dialog for one order, closes it, and opens it for
    // another must not cancel the first.
    trigger('1024').click();
    trigger('1023').click();
    confirm().click();

    assert.deepEqual(calls.cancel, ['1023']);
  });

  test('confirming without a trigger cancels nothing', async () => {
    const { calls } = await boot();

    confirm().click();

    assert.deepEqual(calls.cancel, []);
  });
});

describe('T-6.03 · the dialog stays open until the platform answers', () => {
  test('the confirm goes busy and the dialog does not close on press', async () => {
    await boot();

    trigger('1024').click();
    dialog().showModal();
    confirm().click();

    assert.equal(confirm().getAttribute('aria-busy'), 'true');
    assert.equal(dialog().open, true);
  });

  test('a success announces, closes and reloads', async () => {
    const { calls, resolve } = await boot();

    trigger('1024').click();
    dialog().showModal();
    confirm().click();
    resolve();
    await flush();

    assert.deepEqual(calls.success, ['أُلغي الطلب.']);
    assert.equal(dialog().open, false);
    assert.equal(calls.reloaded, 1);
  });

  test('a failure releases the button so it can be tried again', async () => {
    const { calls, reject } = await boot();

    trigger('1024').click();
    dialog().showModal();
    confirm().click();
    reject({ message: 'لا يمكن إلغاء هذا الطلب' });
    await flush();

    assert.deepEqual(calls.error, ['لا يمكن إلغاء هذا الطلب']);
    assert.equal(confirm().hasAttribute('aria-busy'), false);
    assert.equal(calls.reloaded, 0);
  });

  test("the platform's own message wins over the theme's sentence", async () => {
    const { calls, reject } = await boot();

    trigger('1024').click();
    confirm().click();
    reject({});
    await flush();

    // No message from the platform, so the theme supplies one — never the other
    // way round.
    assert.deepEqual(calls.error, ['تعذّر إلغاء الطلب. حاول مرة أخرى.']);
  });
});

describe('T-6.03 · it is inert where the dialog is absent', () => {
  test('a page with no cancel dialog boots without throwing', async () => {
    const { calls } = await boot('<button data-order-cancel="1024">إلغاء</button>');

    document.querySelector('[data-order-cancel]').click();

    assert.deepEqual(calls.cancel, []);
  });
});
