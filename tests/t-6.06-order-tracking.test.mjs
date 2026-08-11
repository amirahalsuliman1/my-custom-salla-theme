/**
 * T-6.06 — keeping the tracked status current.
 *
 * TWO THINGS ARE WORTH HOLDING IN PLACE. The first is *when* it asks: the
 * criterion says «live status without a full reload where the API supports it»,
 * and the API supports fetching only — so the choice was a timer or
 * `visibilitychange`, and a timer spends a request a minute on a value that
 * changes a handful of times a week. A regression to polling would be invisible
 * in a browser and obvious here.
 *
 * The second is *what* it writes. The current step's label holds the status text
 * **and** an `sr-only` sibling saying which step it is; replacing the whole label
 * would delete that sibling and leave a screen-reader user with a status and no
 * indication that it is the current one.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/order-tracking.js';

/** The section as `single.twig` renders it, with T-6.05's markup inside. */
const HTML = `
  <section class="account-panel" data-order-tracking data-order-id="4410">
    <div class="order-timeline">
      <ol class="order-timeline__list">
        <li class="order-timeline__step order-timeline__step--done">
          <div class="order-timeline__content">
            <p class="order-timeline__label">تم إنشاء الطلب<span class="sr-only"> — مكتملة</span></p>
          </div>
        </li>
        <li class="order-timeline__step order-timeline__step--current" aria-current="step">
          <div class="order-timeline__content">
            <p class="order-timeline__label">قيد التجهيز<span class="sr-only"> — الخطوة الحالية</span></p>
          </div>
        </li>
      </ol>
    </div>
  </section>`;

async function boot(html = HTML, result = { data: { status: { name: 'تم الشحن' } } }) {
  const dom = createDom({ html, pageSlug: 'customer.orders.single' });

  const calls = { details: [] };

  globalThis.salla.order = {
    api: {
      getDetails: (id) => {
        calls.details.push(id);
        return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
      },
    },
  };

  await loadFresh(SOURCE);
  await flush();

  return { ...dom, calls };
}

/** jsdom reports `visible` by default; this drives the other half too. */
function setVisibility(state) {
  Object.defineProperty(globalThis.document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new CustomEvent('visibilitychange'));
}

const currentLabel = () => document.querySelector('.order-timeline__step--current .order-timeline__label');

afterEach(teardownDom);

describe('T-6.06 · it asks when the customer comes back, and not on a timer', () => {
  test('returning to the tab refreshes the status', async () => {
    const { calls } = await boot();

    setVisibility('visible');
    await flush();

    assert.deepEqual(calls.details, ['4410']);
  });

  test('leaving the tab asks for nothing', async () => {
    const { calls } = await boot();

    setVisibility('hidden');
    await flush();

    assert.deepEqual(calls.details, []);
  });

  test('nothing is requested on load alone — no poll, no opening fetch', async () => {
    const { calls } = await boot();

    await flush();

    // The page was rendered with a status the server sent; asking again
    // immediately would be a request for something already on screen.
    assert.deepEqual(calls.details, []);
  });
});

describe('T-6.06 · what it writes into the step', () => {
  test('a changed status replaces the visible text', async () => {
    await boot();

    setVisibility('visible');
    await flush();

    assert.match(currentLabel().textContent, /تم الشحن/);
  });

  test('the sr-only «current step» sibling survives the update', async () => {
    await boot();

    setVisibility('visible');
    await flush();

    // Replacing the label wholesale would take this with it, leaving a status
    // with nothing saying it is the one the order has reached.
    assert.equal(currentLabel().querySelector('.sr-only').textContent, ' — الخطوة الحالية');
  });

  test('an unchanged status leaves the node alone', async () => {
    await boot(HTML, { data: { status: { name: 'قيد التجهيز' } } });

    setVisibility('visible');
    await flush();

    assert.match(currentLabel().textContent, /قيد التجهيز/);
    assert.equal(currentLabel().querySelectorAll('.sr-only').length, 1);
  });

  test('a failed refresh leaves the rendered status standing', async () => {
    await boot(HTML, new Error('network'));

    setVisibility('visible');
    await flush();

    // A background check the customer never asked for must not make a working
    // page look broken.
    assert.match(currentLabel().textContent, /قيد التجهيز/);
  });
});

describe('T-6.06 · it is inert where the section is absent', () => {
  test('a page without the tracking section boots without throwing', async () => {
    const { calls } = await boot('<div class="not-an-order"></div>');

    setVisibility('visible');
    await flush();

    assert.deepEqual(calls.details, []);
  });
});
