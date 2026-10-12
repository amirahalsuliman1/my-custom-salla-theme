/**
 * T-6.08 — the rating flow, and the T-5.11 loop it is supposed to close.
 *
 * TWO DIFFERENT THINGS ARE PINNED HERE AND THE SECOND IS THE REASON THE FILE
 * EXISTS.
 *
 * The first is the star input. `salla-rating-modal` renders `Rate Your Order.pdf`
 * and is not rebuilt — but `renderEditableStars()` emits five `<button>`s whose
 * only content is an SVG, so each has **no accessible name at all**. What is
 * added from outside is a name per star, a name for the group, and `role="status"`
 * on the reaction word the component already computes.
 *
 * The second is **the loop**: T-5.11's points popup fires on `rating::store.rated`,
 * `rating::products.rated` and `rating::shipping.rated` **plus** a balance that
 * actually rose. Those three event names were written months before anything
 * could dispatch them, and this phase is where they finally have a sender. The
 * last suite drives the popup with the event names read out of the shipped SDK
 * bundle — `this.events = {storeRated: "store.rated", productsRated:
 * "products.rated", shippingRated: "shipping.rated"}` — rather than the names
 * T-5.11 happened to guess. If the two ever disagree, the popup silently never
 * opens, and nothing in a browser would say so.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/order-rating.js';
const POPUP = 'src/assets/js/partials/loyalty-popup.js';

/** The modal's editable stars, as `renderEditableStars()` emits them. */
const STARS = `
  <salla-rating-modal data-testid="store-order-rating-modal">
    <div class="s-rating-stars-wrapper s-rating-stars-wrapper--with-label">
      <div class="s-rating-stars-element">
        <input type="hidden" class="rating_hidden_input" name="rating" value="">
        <button class="s-rating-stars-btn-star" data-star="1"><span></span></button>
        <button class="s-rating-stars-btn-star" data-star="2"><span></span></button>
        <button class="s-rating-stars-btn-star" data-star="3"><span></span></button>
        <button class="s-rating-stars-btn-star" data-star="4"><span></span></button>
        <button class="s-rating-stars-btn-star" data-star="5"><span></span></button>
      </div>
      <span class="s-rating-stars-label" aria-hidden="true">&nbsp;</span>
    </div>
  </salla-rating-modal>`;

async function boot(html = STARS) {
  const dom = createDom({
    html,
    pageSlug: 'customer.orders.single',
    translations: {
      'theme.orders.rating_group': 'تقييمك بالنجوم',
      'theme.orders.rating_star': '{stars} من 5',
    },
  });

  await loadFresh(SOURCE);
  await flush();
  return dom;
}

const stars = () => [...document.querySelectorAll('[data-star]')];

afterEach(teardownDom);

describe('T-6.08 · the stars are named, because the component names none of them', () => {
  test('every star gets an accessible name carrying its value', async () => {
    await boot();

    // Without this, a screen reader announces «button» five times and there is
    // no way to tell which one is «3».
    assert.deepEqual(
      stars().map((s) => s.getAttribute('aria-label')),
      ['1 من 5', '2 من 5', '3 من 5', '4 من 5', '5 من 5'],
    );
  });

  test('the group is named too, so the five buttons are one control', async () => {
    await boot();

    const group = document.querySelector('.s-rating-stars-element');

    assert.equal(group.getAttribute('role'), 'group');
    assert.equal(group.getAttribute('aria-label'), 'تقييمك بالنجوم');
  });

  test('each star is type=button, so a star press can never submit a form', async () => {
    await boot();

    assert.deepEqual(stars().map((s) => s.getAttribute('type')), Array(5).fill('button'));
  });

  test('the reaction word announces itself instead of only being drawn', async () => {
    await boot();

    // «غير راضٍ» … «تحفة» — the component computes and displays these, and says
    // none of them.
    assert.equal(document.querySelector('.s-rating-stars-label').getAttribute('role'), 'status');
  });

  test('a step rendered later is named too', async () => {
    await boot();

    const step = document.createElement('div');

    step.className = 's-rating-stars-element';
    step.innerHTML = '<button data-star="1"></button>';
    document.body.appendChild(step);

    // The modal renders step two only after step one is submitted, so a one-off
    // pass at boot would name the first set of stars and none of the rest.
    await flush();

    assert.equal(step.querySelector('[data-star]').getAttribute('aria-label'), '1 من 5');
  });

  test('it is inert on a page with no rating modal', async () => {
    await boot('<div class="s-rating-stars-element"><button data-star="1"></button></div>');

    assert.equal(document.querySelector('[data-star]').hasAttribute('aria-label'), false);
  });
});

/**
 * THE LOOP. T-5.11 built the popup; this phase built the page that can trigger
 * it. These cases run the popup against the event names the shipped SDK actually
 * dispatches.
 */
describe('T-6.08 · the T-5.11 points loop closes on the real event names', () => {
  /** Read out of `twilight.min.js`: `this.events = {storeRated: "store.rated", …}`. */
  const SDK_EVENTS = ['rating::store.rated', 'rating::products.rated', 'rating::shipping.rated'];

  const DIALOG = `
    <dialog id="loyalty-earned-dialog" class="sheet sheet--dialog dialog" data-sheet>
      <div class="sheet__panel"><p class="dialog__message"></p></div>
    </dialog>`;

  async function bootPopup(balance = 1000) {
    const dom = createDom({
      html: DIALOG,
      translations: { 'theme.loyalty.earned_message': 'لقد ربحت {points} نقطة ولاء جديدة!' },
    });

    globalThis.salla.config.get = (key) => (key === 'user.loyalty_points' ? balance : undefined);

    await loadFresh(POPUP);
    await flush();
    return dom;
  }

  for (const event of SDK_EVENTS) {
    test(`«${event}» followed by a higher balance opens the popup`, async () => {
      const { control } = await bootPopup();

      control.emit(event, {});
      control.emit('loyalty::points.fetched', { data: { points: 1150 } });
      await flush();

      const dialog = document.getElementById('loyalty-earned-dialog');

      assert.equal(dialog.open, true, `${event} did not reach the popup`);
      assert.equal(dialog.querySelector('.dialog__message').textContent, 'لقد ربحت 150 نقطة ولاء جديدة!');
    });
  }

  test('an event name the SDK does not dispatch reaches nothing — which is the failure being guarded', async () => {
    const { control } = await bootPopup();

    // `onProductRated` reads singular in the SDK's TypeScript, and the shipped
    // bundle dispatches the plural. Had T-5.11 followed the types, this is
    // exactly what would have happened — silently, on a live store.
    control.emit('rating::product.rated', {});
    control.emit('loyalty::points.fetched', { data: { points: 1150 } });
    await flush();

    assert.equal(document.getElementById('loyalty-earned-dialog').open, false);
  });
});
