/**
 * T-6.01 — the orders list.
 *
 * TWO THINGS IN THIS FILE ARE WORTH TESTING AND THE REST IS MARKUP. The card is
 * Twig and a stylesheet, and neither can be wrong in a way a unit test would
 * catch. What can be wrong is the part that had to be *derived*:
 *
 *   · **which group an order is in.** «الطلبات السابقة», «طلبات قيد التنفيذ» and
 *     «طلبات بانتظار الدفع» are not statuses, and the classification is built
 *     out of two booleans rather than a status map (see `order-list.js` for why).
 *     A rule that exists only because no better one was available is exactly the
 *     rule that should be pinned down.
 *   · **that the choice survives Back.** The criterion says so outright, and it
 *     is the kind of thing that silently stops working the day someone swaps
 *     `pushState` for `replaceState`.
 *
 * The collapse control is here for one reason too: it ships `hidden`, and a card
 * whose control never appears is indistinguishable from one that has none.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/order-list.js';

/**
 * Three orders, one per group, in the shape `card.twig` emits: a pending-payment
 * order, one that is still cancellable, and one that is neither.
 */
const CARD = (id, { pending = false, cancellable = false } = {}) => `
  <article class="order-card" data-order-card
           data-order-pending-payment="${pending}"
           data-order-cancellable="${cancellable}">
    <button type="button" data-order-toggle aria-expanded="true" aria-controls="order-body-${id}" hidden>
      <span class="disclosure-mark"></span>
    </button>
    <div class="order-card__body" id="order-body-${id}"></div>
  </article>`;

const LIST = `
  <details class="sort-disclosure" data-sort-disclosure data-sort-param="orders">
    <summary><span data-sort-current>الطلبات السابقة</span></summary>
    <ul>
      <li><button data-sort-option="previous" aria-pressed="true">الطلبات السابقة</button></li>
      <li><button data-sort-option="in_progress" aria-pressed="false">طلبات قيد التنفيذ</button></li>
      <li><button data-sort-option="pending_payment" aria-pressed="false">طلبات بانتظار الدفع</button></li>
    </ul>
  </details>

  <div data-orders-list>
    ${CARD(1, { pending: true, cancellable: true })}
    ${CARD(2, { cancellable: true })}
    ${CARD(3)}
  </div>

  <div data-orders-empty-filter hidden>
    <button data-orders-reset>الطلبات السابقة</button>
  </div>`;

async function boot(html = LIST) {
  const dom = createDom({ html, pageSlug: 'customer.orders.index' });

  await loadFresh(SOURCE);
  await flush();
  return dom;
}

const cards = () => [...document.querySelectorAll('[data-order-card]')];
const visible = () => cards().filter((card) => !card.hidden).length;
const panel = () => document.querySelector('[data-sort-param="orders"]');

/**
 * What `sort-disclosure.js` emits once it has applied a choice. Dispatched on
 * the document rather than the panel because the listener sits there — and
 * because one case below renders a list with no disclosure above it, which is
 * what a page whose script loaded before its markup looks like.
 */
const choose = (value) =>
  document.dispatchEvent(
    new CustomEvent('sort-disclosure::applied', { bubbles: true, detail: { param: 'orders', value } }),
  );

afterEach(teardownDom);

describe('T-6.01 · the grouping is the two booleans, and nothing else', () => {
  test('it opens on «الطلبات السابقة», which is the artboard\'s checked option', async () => {
    await boot();

    assert.equal(visible(), 1);
    assert.equal(cards()[2].hidden, false);
  });

  test('an order still cancellable is «قيد التنفيذ»', async () => {
    await boot();

    choose('in_progress');
    assert.deepEqual(cards().map((c) => c.hidden), [true, false, true]);
  });

  test('pending payment wins over cancellable, because an unpaid order is both', async () => {
    await boot();

    // Card 1 is pending AND cancellable. If the tests were ordered the other way
    // round it would file under «قيد التنفيذ» and never appear in its own group.
    choose('pending_payment');
    assert.deepEqual(cards().map((c) => c.hidden), [false, true, true]);
  });

  test('the control says what the list is showing', async () => {
    await boot();

    choose('pending_payment');

    assert.equal(panel().querySelector('[data-sort-current]').textContent, 'طلبات بانتظار الدفع');
    assert.equal(
      panel().querySelector('[data-sort-option="pending_payment"]').getAttribute('aria-pressed'),
      'true',
    );
    assert.equal(
      panel().querySelector('[data-sort-option="previous"]').getAttribute('aria-pressed'),
      'false',
    );
  });
});

describe('T-6.01 · an emptied group says so rather than looking broken', () => {
  test('the second empty state appears only when the filter hides everything', async () => {
    await boot(`
      <div data-orders-list>${CARD(1, { cancellable: true })}</div>
      <div data-orders-empty-filter hidden><button data-orders-reset></button></div>`);

    const empty = document.querySelector('[data-orders-empty-filter]');

    // One order, still cancellable — «السابقة» is empty and «قيد التنفيذ» is not.
    assert.equal(empty.hidden, false);

    choose('in_progress');
    assert.equal(empty.hidden, true);
  });

  test('its action puts the list back rather than only hiding the message', async () => {
    await boot();

    choose('pending_payment');
    document.querySelector('[data-orders-reset]').click();

    assert.equal(visible(), 1);
    assert.equal(panel().querySelector('[data-sort-current]').textContent, 'الطلبات السابقة');
  });
});

describe('T-6.01 · the selection survives back-navigation', () => {
  test('a URL carrying a group is honoured on load', async () => {
    const dom = createDom({ html: LIST, pageSlug: 'customer.orders.index' });

    window.history.pushState(null, '', '/orders?orders=in_progress');
    await loadFresh(SOURCE);
    await flush();

    assert.deepEqual(cards().map((c) => c.hidden), [true, false, true]);
    assert.ok(dom);
  });

  test('going Back re-applies the group the URL returns to', async () => {
    await boot();

    window.history.pushState(null, '', '/orders?orders=pending_payment');
    window.dispatchEvent(new CustomEvent('popstate'));
    assert.deepEqual(cards().map((c) => c.hidden), [false, true, true]);

    window.history.pushState(null, '', '/orders');
    window.dispatchEvent(new CustomEvent('popstate'));
    assert.deepEqual(cards().map((c) => c.hidden), [true, true, false]);
  });

  test('a group that is not one of the three falls back rather than hiding everything', async () => {
    createDom({ html: LIST, pageSlug: 'customer.orders.index' });

    window.history.pushState(null, '', '/orders?orders=nonsense');
    await loadFresh(SOURCE);
    await flush();

    assert.equal(visible(), 1);
  });
});

describe('T-6.01 · the collapse control is an enhancement, not a promise', () => {
  test('it is hidden in the markup and revealed by the script', async () => {
    await boot();

    assert.equal(document.querySelector('[data-order-toggle]').hasAttribute('hidden'), false);
  });

  test('pressing it takes the body out of the accessibility tree, not just out of view', async () => {
    await boot();

    const toggle = document.querySelector('[data-order-toggle]');
    const body = document.getElementById('order-body-1');

    toggle.click();
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(body.hidden, true);

    toggle.click();
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(body.hidden, false);
  });
});

describe('T-6.01 · it is inert where the list is absent', () => {
  test('a page with no orders list boots without throwing', async () => {
    await boot('<div class="no-orders-here"></div>');

    assert.equal(document.querySelector('[data-orders-list]'), null);
  });

  test('a filter event on such a page does nothing', async () => {
    await boot('<div class="no-orders-here"></div>');

    document.dispatchEvent(
      new CustomEvent('sort-disclosure::applied', { bubbles: true, detail: { param: 'orders', value: 'previous' } }),
    );
  });
});
