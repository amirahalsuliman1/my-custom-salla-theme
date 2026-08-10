/**
 * T-4.02 — the favorites card.
 *
 * The task's claim is that there is no favorites card: the element renders
 * T-4.01's product card and owns no markup of its own. These cases are written
 * to hold that claim to account — the first three would all pass just as well
 * against a hand-built card, so the fourth asserts the *absence* of one.
 *
 * The second half is the removal criterion, which has two halves the artboard
 * makes look like one: removal is confirmed, re-adding is not, and the result is
 * announced from the platform's event rather than from the click.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/wishlist-card.js';

/** The page: the removal dialog T-2.11 renders, the live region, and a grid. */
const PAGE = `
  <div id="wishlist-status" role="status" aria-live="polite"></div>
  <div id="wishlist-remove-dialog">
    <button type="button" data-dialog-confirm>confirm</button>
    <button type="button" data-dialog-cancel>cancel</button>
  </div>
  <salla-products-list></salla-products-list>
`;

const TRANSLATIONS = { 'theme.wishlist.removed': 'Removed from favorites' };

/** A card in the favorites grid, in the state T-4.01 leaves it: already favourited. */
function favoritesCard(document, id) {
  const wrapper = document.createElement('custom-wishlist-card');
  const card = document.createElement('custom-salla-product-card');
  const heart = document.createElement('button');

  heart.className = 'btn--wishlist';
  heart.setAttribute('data-id', String(id));
  heart.setAttribute('aria-pressed', 'true');

  card.append(heart);
  wrapper.append(card);
  document.querySelector('salla-products-list').append(wrapper);

  return { wrapper, card, heart };
}

afterEach(teardownDom);

describe('T-4.02 · the card is T-4.01, not a copy of it', () => {
  test('renders a product card and passes the product through untouched', async () => {
    const { document } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    const product = { id: 42, name: 'عباية' };
    const element = document.createElement('custom-wishlist-card');

    element.product = product;
    document.querySelector('salla-products-list').append(element);

    const card = element.querySelector('custom-salla-product-card');

    assert.ok(card, 'the wrapper renders a product card');
    assert.equal(card.product, product, 'the same object, not a copy or a subset');
  });

  test('owns no markup of its own — no image, price, rating or swatch', async () => {
    const { document } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    const element = document.createElement('custom-wishlist-card');

    element.product = { id: 7, name: 'حقيبة', price: 250 };
    document.querySelector('salla-products-list').append(element);

    // The whole of the criterion «no duplicated card logic», stated as a fact
    // about the DOM: one child, and it is somebody else's component.
    assert.equal(element.children.length, 1);
    assert.equal(element.firstElementChild.tagName.toLowerCase(), 'custom-salla-product-card');
    assert.equal(element.querySelectorAll('img, .price, .rating, [class*="swatch"]').length, 0);
  });

  test('carries an id derived from the product, for the grid to target', async () => {
    const { document } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    const element = document.createElement('custom-wishlist-card');

    element.product = { id: 99 };
    document.querySelector('salla-products-list').append(element);

    assert.equal(element.getAttribute('id'), 'wishlist-product-99');
  });

  test('a second render does not double the card', async () => {
    const { document } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    const element = document.createElement('custom-wishlist-card');

    element.product = { id: 3 };
    document.querySelector('salla-products-list').append(element);

    // What `salla-products-list` does on reload: the same element, re-appended.
    element.remove();
    document.querySelector('salla-products-list').append(element);

    assert.equal(element.querySelectorAll('custom-salla-product-card').length, 1);
  });

  test('stays in the tree rather than replacing itself, so the list keeps its reference', async () => {
    const { document } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    const list = document.querySelector('salla-products-list');
    const element = document.createElement('custom-wishlist-card');

    element.product = { id: 5 };
    list.append(element);

    assert.equal(list.firstElementChild, element, 'the element the list created is still the one in the grid');
  });

  test('a card with no product warns instead of rendering an empty shell', async () => {
    const { document, control } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    const element = document.createElement('custom-wishlist-card');

    document.querySelector('salla-products-list').append(element);

    assert.equal(element.children.length, 0);
    assert.equal(control.calls.warned.length, 1);
  });
});

describe('T-4.02 · removal is confirmed, re-adding is not', () => {
  test('un-favouriting opens the dialog and does not remove yet', async () => {
    const { document, control } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    const { heart } = favoritesCard(document, 12);

    heart.click();

    assert.deepEqual(control.calls.dispatched, [
      { name: 'bottom-sheet::open', payload: 'wishlist-remove-dialog' },
    ]);
    assert.deepEqual(control.calls.wishlistToggled, [], 'nothing is removed before the dialog is answered');
  });

  test('the click is stopped while it descends, so the card’s own handler never runs', async () => {
    const { document } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    const { card, heart } = favoritesCard(document, 12);
    let reachedTheCard = false;

    // T-4.01 wires the heart with an inline onclick; this stands in for it, in
    // the same phase. If interception were on bubble, this would already have run.
    card.addEventListener('click', () => { reachedTheCard = true; });

    heart.click();

    assert.equal(reachedTheCard, false);
  });

  test('confirming performs the platform’s own toggle', async () => {
    const { document, control } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    const { heart } = favoritesCard(document, 12);

    heart.click();
    document.querySelector('[data-dialog-confirm]').click();

    assert.deepEqual(control.calls.wishlistToggled, ['12']);
  });

  test('confirming twice removes once — the pending id is consumed', async () => {
    const { document, control } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    const { heart } = favoritesCard(document, 12);
    const confirm = document.querySelector('[data-dialog-confirm]');

    heart.click();
    confirm.click();
    confirm.click();

    assert.deepEqual(control.calls.wishlistToggled, ['12']);
  });

  test('re-adding is not gated — no dialog, no interception', async () => {
    const { document, control } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    const { card, heart } = favoritesCard(document, 12);
    let reachedTheCard = false;

    heart.setAttribute('aria-pressed', 'false');
    card.addEventListener('click', () => { reachedTheCard = true; });

    heart.click();

    assert.deepEqual(control.calls.dispatched, [], 'no toll booth on the way back');
    assert.equal(reachedTheCard, true, 'the card’s own toggle is left to run');
  });

  test('hearts on ordinary listing cards elsewhere are not intercepted', async () => {
    const { document, control } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    // The same control, the same pressed state — but not inside a favorites card.
    const stray = document.createElement('button');

    stray.className = 'btn--wishlist';
    stray.setAttribute('data-id', '77');
    stray.setAttribute('aria-pressed', 'true');
    document.body.append(stray);

    stray.click();

    assert.deepEqual(control.calls.dispatched, []);
  });
});

describe('T-4.02 · the announcement describes what happened', () => {
  test('speaks only when the platform says the item was removed', async () => {
    const { document, control } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    const region = document.getElementById('wishlist-status');
    const { heart } = favoritesCard(document, 12);

    heart.click();
    document.querySelector('[data-dialog-confirm]').click();

    assert.equal(region.textContent, '', 'the click alone claims nothing');

    control.emitWishlistRemoved({ id: 12 });
    await flush();

    assert.equal(region.textContent, 'Removed from favorites');
  });

  test('a removal that fails says nothing', async () => {
    const { document } = createDom({ html: PAGE, translations: TRANSLATIONS });

    await loadFresh(SOURCE);

    const { heart } = favoritesCard(document, 12);

    heart.click();
    document.querySelector('[data-dialog-confirm]').click();
    await flush();

    // `onRemoved` never fires, so the region is never written to.
    assert.equal(document.getElementById('wishlist-status').textContent, '');
  });

  test('a page with no dialog boots without throwing', async () => {
    const { document } = createDom({ html: '<salla-products-list></salla-products-list>' });

    await assert.doesNotReject(() => loadFresh(SOURCE));

    // And the element still works, because the dialog is the page's, not the card's.
    const element = document.createElement('custom-wishlist-card');

    element.product = { id: 1 };
    document.querySelector('salla-products-list').append(element);

    assert.ok(element.querySelector('custom-salla-product-card'));
  });
});
