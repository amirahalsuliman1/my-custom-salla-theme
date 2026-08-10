/**
 * T-4.15 — the cart page.
 *
 * Two of this task's behaviours are corrections to components the theme does not
 * own, and both are tested by performing the component's behaviour rather than
 * describing it: `salla-quantity-input`'s decrement button, whose click has to
 * be stopped in the capture phase before `decrease()` clamps at 1 and silently
 * does nothing behind a bin; and `salla-cart-coupons`, whose failure is a bare
 * `<span>` with no role, no live region and no association to the field.
 *
 * «17 cases exercised against the extracted method bodies» is what the task note
 * claimed, and it is not what these do. The whole module is imported and booted
 * through `initiateWhenReady`, so the code under test is the code that ships,
 * reached the way the browser reaches it. Extraction was a workaround for not
 * having a harness; T-1.09 is the harness.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/cart.js';

const TRANSLATIONS = {
  'theme.cart.remove_item': 'إزالة المنتج',
  'theme.cart.item_removed': 'تمت إزالة {name} من السلة',
  'theme.cart.remove_failed': 'تعذّرت الإزالة',
  'common.elements.decrease_quantity': 'تقليل الكمية',
};

/** One cart row, in the shape `cart.twig` renders it. */
function row({ id = '1', quantity = 1, name = 'عباية' } = {}) {
  return `
    <div class="cart-item" id="item-${id}">
      <salla-quantity-input cart-item-id="${id}" data-item-name="${name}">
        <button type="button" class="s-quantity-input-decrease-button"></button>
        <input class="s-quantity-input-input" value="${quantity}" />
        <button type="button" class="s-quantity-input-increase-button"></button>
      </salla-quantity-input>
    </div>`;
}

const page = (rows) => `<div class="cart-items">${rows}</div>
  <salla-cart-coupons>
    <input type="text" name="coupon" />
  </salla-cart-coupons>`;

const setup = (html = page(row())) =>
  createDom({ html, pageSlug: 'cart', translations: TRANSLATIONS });

const boot = () => loadFresh(SOURCE);

const quantityOf = (document, id = '1') =>
  document.querySelector(`#item-${id} salla-quantity-input`);
const decreaseOf = (document, id = '1') =>
  document.querySelector(`#item-${id} .s-quantity-input-decrease-button`);

/** The live region `announce()` creates on first use. */
const announcement = (document) => document.querySelector('body > .sr-only[role="status"]')?.textContent;

/** What `salla-cart-coupons` does on a rejected code: a bare span, nothing else. */
function couponRejected(document, message) {
  const coupons = document.querySelector('salla-cart-coupons');
  let error = coupons.querySelector('.s-cart-coupons-coupon-error');

  if (!error) {
    error = document.createElement('span');
    error.className = 's-cart-coupons-coupon-error';
    coupons.append(error);
  }

  error.textContent = message;
}

function couponCleared(document) {
  document.querySelector('.s-cart-coupons-coupon-error')?.remove();
}

afterEach(teardownDom);

describe('T-4.15 · the bin is the decrement slot', () => {
  test('at quantity 1 the row is marked at-min and the control is named for removal', async () => {
    const { document } = setup();

    await boot();

    assert.equal(quantityOf(document).hasAttribute('data-at-min'), true);
    assert.equal(decreaseOf(document).getAttribute('aria-label'), 'إزالة المنتج');
  });

  test('above 1 it is the platform’s decrease control, with the platform’s name', async () => {
    const { document } = setup(page(row({ quantity: 3 })));

    await boot();

    assert.equal(quantityOf(document).hasAttribute('data-at-min'), false);
    assert.equal(decreaseOf(document).getAttribute('aria-label'), 'تقليل الكمية');
  });

  test('the name and the state follow the value as it is typed', async () => {
    const { document } = setup(page(row({ quantity: 2 })));

    await boot();

    const input = document.querySelector('.s-quantity-input-input');

    input.value = '1';
    input.dispatchEvent(new document.defaultView.Event('input', { bubbles: true }));

    assert.equal(quantityOf(document).hasAttribute('data-at-min'), true);
    assert.equal(decreaseOf(document).getAttribute('aria-label'), 'إزالة المنتج');

    input.value = '4';
    input.dispatchEvent(new document.defaultView.Event('input', { bubbles: true }));

    assert.equal(quantityOf(document).hasAttribute('data-at-min'), false);
    assert.equal(decreaseOf(document).getAttribute('aria-label'), 'تقليل الكمية');
  });

  test('at quantity 1 the component never sees the click', async () => {
    const { document } = setup();

    await boot();

    let componentSawIt = false;

    // The component's own onClick, bound to the same button. If interception
    // were on bubble, `decrease()` would already have run and clamped to 1.
    decreaseOf(document).addEventListener('click', () => { componentSawIt = true; });
    decreaseOf(document).click();

    assert.equal(componentSawIt, false);
  });

  test('at quantity 1 the click deletes through the platform', async () => {
    const { document, control } = setup();

    await boot();
    decreaseOf(document).click();

    assert.deepEqual(control.calls.deleteItem, ['1']);
  });

  test('above 1 the event is left alone and nothing is deleted', async () => {
    const { document, control } = setup(page(row({ quantity: 2 })));

    await boot();

    let componentSawIt = false;

    decreaseOf(document).addEventListener('click', () => { componentSawIt = true; });
    decreaseOf(document).click();

    assert.equal(componentSawIt, true, 'the component decrements as normal');
    assert.deepEqual(control.calls.deleteItem, []);
  });

  test('a row added after boot still gets a bin', async () => {
    const { document, control } = setup();

    await boot();

    // What `cart::updated` does: the component re-renders rows this file has
    // already run past. Binding each control at boot would leave these bare.
    document.querySelector('.cart-items').insertAdjacentHTML('beforeend', row({ id: '2', name: 'حقيبة' }));
    control.emitCartUpdated({ count: 2, items: [] });

    assert.equal(quantityOf(document, '2').hasAttribute('data-at-min'), true);
    assert.equal(decreaseOf(document, '2').getAttribute('aria-label'), 'إزالة المنتج');

    decreaseOf(document, '2').click();
    assert.deepEqual(control.calls.deleteItem, ['2']);
  });

  test('a quantity input with no cart-item-id is left to the component', async () => {
    const { document, control } = setup(`
      <div class="cart-item" id="item-9">
        <salla-quantity-input>
          <button type="button" class="s-quantity-input-decrease-button"></button>
          <input class="s-quantity-input-input" value="1" />
        </salla-quantity-input>
      </div>`);

    await boot();
    document.querySelector('.s-quantity-input-decrease-button').click();

    assert.deepEqual(control.calls.deleteItem, []);
  });
});

describe('T-4.15 · removal is announced, and only when it happened', () => {
  test('the announcement names the product', async () => {
    const { document, control } = setup(page(row({ name: 'عباية سوداء' })));

    await boot();
    decreaseOf(document).click();

    assert.equal(announcement(document), undefined, 'nothing claimed before the platform answers');

    control.resolveDeleteItem();
    await flush();

    assert.equal(announcement(document), 'تمت إزالة عباية سوداء من السلة');
  });

  test('the row leaves the page once the platform confirms', async () => {
    const { document, control } = setup();

    await boot();
    decreaseOf(document).click();
    control.resolveDeleteItem();
    await flush();

    assert.equal(document.querySelector('#item-1'), null);
  });

  test('a failed removal keeps the row and surfaces a real message', async () => {
    const { document, control } = setup();

    await boot();
    decreaseOf(document).click();
    control.rejectDeleteItem();
    await flush();

    assert.ok(document.querySelector('#item-1'), 'the row is still there, because it is still in the cart');
    assert.deepEqual(control.calls.notifyError, ['تعذّرت الإزالة']);
    assert.equal(announcement(document), undefined, 'and nothing was announced as removed');
  });

  test('the live region exists before it is filled', async () => {
    const { document, control } = setup();

    await boot();
    decreaseOf(document).click();
    control.resolveDeleteItem();
    await flush();

    const region = document.querySelector('body > .sr-only[role="status"]');

    assert.equal(region.getAttribute('aria-live'), 'polite');

    // Reused rather than re-created: a region inserted at the moment it fills is
    // not reliably read, and a second one would be a second thing to read from.
    document.querySelector('.cart-items').insertAdjacentHTML('beforeend', row({ id: '3' }));
    decreaseOf(document, '3').click();
    control.resolveDeleteItem();
    await flush();

    assert.equal(document.querySelectorAll('body > .sr-only[role="status"]').length, 1);
  });
});

describe('T-4.15 · the coupon error is made reachable', () => {
  test('a rejection is announced', async () => {
    const { document } = setup();

    await boot();
    couponRejected(document, 'الكوبون غير صالح');
    await flush();

    assert.equal(announcement(document), 'الكوبون غير صالح');
  });

  test('the field is marked invalid and associated with the reason', async () => {
    const { document } = setup();

    await boot();
    couponRejected(document, 'الكوبون غير صالح');
    await flush();

    const field = document.querySelector('salla-cart-coupons input');

    assert.equal(field.getAttribute('aria-invalid'), 'true');
    assert.equal(field.getAttribute('aria-describedby'), 'cart-coupon-error');
    assert.equal(document.getElementById('cart-coupon-error').textContent, 'الكوبون غير صالح');
  });

  test('clearing the error clears the invalid state and the association', async () => {
    const { document } = setup();

    await boot();
    couponRejected(document, 'الكوبون غير صالح');
    await flush();

    couponCleared(document);
    await flush();

    const field = document.querySelector('salla-cart-coupons input');

    assert.equal(field.getAttribute('aria-invalid'), 'false');
    assert.equal(field.hasAttribute('aria-describedby'), false);
  });

  test('the same rejection twice is not announced twice', async () => {
    const { document } = setup();

    await boot();
    couponRejected(document, 'الكوبون غير صالح');
    await flush();

    // Repeating an identical message interrupts whatever is being read in order
    // to say nothing new.
    const region = document.querySelector('body > .sr-only[role="status"]');

    region.textContent = 'SENTINEL';
    couponRejected(document, 'الكوبون غير صالح');
    await flush();

    assert.equal(region.textContent, 'SENTINEL');
  });

  test('a different rejection is announced', async () => {
    const { document } = setup();

    await boot();
    couponRejected(document, 'الكوبون غير صالح');
    await flush();

    couponRejected(document, 'الكوبون منتهي الصلاحية');
    await flush();

    assert.equal(announcement(document), 'الكوبون منتهي الصلاحية');
  });

  test('a page with no coupon component is a clean no-op', async () => {
    setup('<div class="cart-items"></div>');

    await assert.doesNotReject(boot);
  });
});

describe('T-4.15 · the price colour is a token, not a palette value', () => {
  test('cart::updated does not write raw Tailwind onto the price', async () => {
    const { document, control } = setup(`
      <div class="cart-items">
        <div class="cart-item" id="item-1">
          <span class="item-total">SAR 100</span>
          <span class="item-price cart-item__price--regular">SAR 100</span>
          <span class="item-regular-price hidden"></span>
          <span class="item-original-price hidden"></span>
          <span class="offer-name hidden"></span>
          <span class="old-offers hidden"></span>
          <span class="offer-icon hidden"></span>
          <span class="free-ribbon hidden"></span>
        </div>
      </div>`);

    await boot();

    control.emitCartUpdated({
      count: 1,
      items: [{ id: 1, total: 200, price: 200, product_price: 200, is_on_sale: false }],
    });

    const price = document.querySelector('.item-price');

    // The defect this task fixed on adoption: after the first `cart::updated`,
    // and only then, the price stopped matching the design.
    assert.equal(price.classList.contains('text-red-400'), false);
    assert.equal(price.classList.contains('text-gray-400'), false);
    assert.equal(price.classList.contains('cart-item__price--regular'), true);
    assert.equal(price.innerHTML, 'SAR 200');
  });
});
