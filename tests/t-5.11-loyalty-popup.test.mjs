/**
 * T-5.11 — the points-earned popup.
 *
 * The criterion is «triggered by a real loyalty event, never on a timer», and
 * the platform has no `points earned` event to hang that on — `salla.event.loyalty`
 * carries a redemption, a programme, a reset and a balance, and nothing that
 * announces an award. So the trigger is a conjunction of two things the platform
 * does state, and these cases exist to hold both halves in place:
 *
 *   · a rating alone must not open it — a store may award nothing for reviews
 *   · a balance increase alone must not open it — any page may refresh a balance
 *
 * and to hold the number honest: the figure in the sentence is the difference
 * between two platform values, never an estimate of what a rating is worth.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/loyalty-popup.js';

/** T-2.11's dialog, as `customer.twig` renders it into the account shell. */
const DIALOG = `
  <dialog id="loyalty-earned-dialog" class="sheet sheet--dialog dialog" data-sheet>
    <div class="sheet__panel">
      <h2 class="sheet__title">مبارك!</h2>
      <p class="dialog__message"></p>
    </div>
  </dialog>`;

/**
 * `balance: null` means «the page rendered without one», which is a different
 * case from «the page rendered with zero» and has to be reachable as such.
 */
async function boot(html = DIALOG, balance = 1000) {
  const dom = createDom({
    html,
    translations: { 'theme.loyalty.earned_message': 'لقد ربحت {points} نقطة ولاء جديدة!' },
  });

  // The platform's own copy of the customer, which is where the rendered
  // balance comes from — `syncUserData` puts it there, so this is the same
  // number the template printed rather than a second source for it.
  globalThis.salla.config.get = (key) =>
    (key === 'user.loyalty_points' && balance !== null ? balance : undefined);

  await loadFresh(SOURCE);
  await flush();
  return dom;
}

const dialog = () => document.getElementById('loyalty-earned-dialog');

afterEach(teardownDom);

describe('T-5.11 · it opens only on a real award', () => {
  test('a rating followed by a higher balance opens it, with the difference', async () => {
    const { control } = await boot();

    control.emit('rating::products.rated', {});
    control.emit('loyalty::points.fetched', { data: { points: 1100 } });
    await flush();

    assert.equal(dialog().open, true);
    assert.equal(dialog().querySelector('.dialog__message').textContent, 'لقد ربحت 100 نقطة ولاء جديدة!');
  });

  test('a rating that awards nothing does not open it', async () => {
    const { control } = await boot();

    control.emit('rating::store.rated', {});
    control.emit('loyalty::points.fetched', { data: { points: 1000 } });
    await flush();

    assert.equal(dialog().open, false, 'a store may award no points for a review');
  });

  test('a balance that went UP on its own does not open it', async () => {
    const { control } = await boot();

    control.emit('loyalty::points.fetched', { data: { points: 1500 } });
    await flush();

    assert.equal(dialog().open, false, 'an increase with no award event behind it is not this popup');
  });

  test('a balance that went down never opens it', async () => {
    const { control } = await boot();

    control.emit('rating::shipping.rated', {});
    control.emit('loyalty::points.fetched', { data: { points: 900 } });
    await flush();

    assert.equal(dialog().open, false);
  });

  test('the rating asks the platform rather than assuming a figure', async () => {
    const { control } = await boot();

    control.emit('rating::products.rated', {});

    assert.equal(control.calls.getPoints.length, 1);
  });

  test('with no rendered balance to compare against, it stays shut', async () => {
    const { control } = await boot(DIALOG, null);

    control.emit('rating::products.rated', {});
    control.emit('loyalty::points.fetched', { data: { points: 1100 } });
    await flush();

    assert.equal(
      dialog().open,
      false,
      'the artboard\'s sentence has a number in it; a blank where the number goes is not a sentence',
    );
  });

  test('it does not fire twice for one award', async () => {
    const { control } = await boot();

    control.emit('rating::products.rated', {});
    control.emit('loyalty::points.fetched', { data: { points: 1100 } });
    await flush();

    dialog().close();

    control.emit('loyalty::points.fetched', { data: { points: 1100 } });
    await flush();

    assert.equal(dialog().open, false, 'the second fetch is not a second award');
  });

  test('a second, genuine award after the first is still announced', async () => {
    const { control } = await boot();

    control.emit('rating::products.rated', {});
    control.emit('loyalty::points.fetched', { data: { points: 1100 } });
    await flush();
    dialog().close();

    control.emit('rating::store.rated', {});
    control.emit('loyalty::points.fetched', { data: { points: 1150 } });
    await flush();

    assert.equal(dialog().open, true);
    assert.equal(dialog().querySelector('.dialog__message').textContent, 'لقد ربحت 50 نقطة ولاء جديدة!');
  });
});

describe('T-5.11 · the partial is inert where the shell did not render it', () => {
  test('a page with no dialog boots without throwing', async () => {
    const { control } = await boot('<div></div>');

    control.emit('rating::products.rated', {});
    await flush();

    assert.equal(control.calls.getPoints.length, 0, 'no dialog means no reason to ask');
  });
});
