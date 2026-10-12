/**
 * T-7.08 — the toast the story artboard actually draws.
 *
 * `Story Page – Toast Notification.pdf` shows «تمت إضافة المنتج إلى المفضلة
 * بنجاح» over the open story view — a **wishlist** result, not a share one. The
 * task's Web Share API and clipboard criteria describe a control no story
 * artboard contains.
 *
 * WHAT IS WORTH PINNING IS THAT IT FIRES FROM THE EVENT AND NOT FROM THE CLICK.
 * The button calls `salla.wishlist.toggle()`, which may fail — an unauthenticated
 * customer, a network error — and a toast raised on the press would claim a
 * success the platform never confirmed. Subscribing to `onAdded` / `onRemoved`
 * means the sentence and the fact come from the same place.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/wishlist.js';

/** The story view's own button, as `story-modal.twig` renders it. */
const HTML = `
  <button type="button" class="btn btn--wishlist not-added" data-id="42"
          data-label-add="أضف للمفضلة" data-label-remove="أزل من المفضلة"
          aria-pressed="false">
    <span data-wishlist-text>أضف للمفضلة</span>
  </button>`;

async function boot(html = HTML) {
  const dom = createDom({
    html,
    translations: {
      'theme.product.wishlist_added': 'تمت إضافة المنتج إلى المفضلة بنجاح',
      'theme.product.wishlist_removed': 'أُزيل المنتج من المفضلة.',
    },
  });

  const calls = { success: [] };

  globalThis.salla.notify = { success: (message) => calls.success.push(message) };
  globalThis.salla.storage = { get: () => [] };

  let onAdded = () => {};
  let onRemoved = () => {};

  globalThis.salla.wishlist = {
    event: {
      onAdded: (cb) => { onAdded = cb; },
      onRemoved: (cb) => { onRemoved = cb; },
    },
  };

  await loadFresh(SOURCE);
  await flush();

  return { ...dom, calls, add: (id) => onAdded({}, id), remove: (id) => onRemoved({}, id) };
}

const button = () => document.querySelector('.btn--wishlist');

afterEach(teardownDom);

describe('T-7.08 · the result is announced, from the event', () => {
  test('an add announces the artboard\'s sentence', async () => {
    const { calls, add } = await boot();

    add(42);

    assert.deepEqual(calls.success, ['تمت إضافة المنتج إلى المفضلة بنجاح']);
  });

  test('a removal announces its own sentence rather than reusing the add', async () => {
    const { calls, remove } = await boot();

    remove(42);

    assert.deepEqual(calls.success, ['أُزيل المنتج من المفضلة.']);
  });

  test('nothing is announced merely by pressing the button', async () => {
    const { calls } = await boot();

    button().click();
    await flush();

    // The toast follows the platform's confirmation, never the press — otherwise
    // a failed toggle would still claim success.
    assert.deepEqual(calls.success, []);
  });
});

describe('T-7.08 · the announcement rides alongside the state it already synced', () => {
  test('the button state and the toast move together on add', async () => {
    const { calls, add } = await boot();

    add(42);

    assert.equal(button().getAttribute('aria-pressed'), 'true');
    assert.equal(button().querySelector('[data-wishlist-text]').textContent, 'أزل من المفضلة');
    assert.equal(calls.success.length, 1);
  });

  test('and together on removal', async () => {
    const { add, remove } = await boot();

    add(42);
    remove(42);

    assert.equal(button().getAttribute('aria-pressed'), 'false');
    assert.equal(button().querySelector('[data-wishlist-text]').textContent, 'أضف للمفضلة');
  });
});
