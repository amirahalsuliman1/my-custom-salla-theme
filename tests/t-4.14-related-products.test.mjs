/**
 * T-4.14 — the recommendations, created when they are nearly in view.
 *
 * Both criteria are about non-existence, which is why they need a test rather
 * than a look at the page. «Lazy-loaded below the fold» is not a class or an
 * attribute here — `salla-products-slider` fetches in `componentWillLoad` and
 * strips `loading="lazy"` off its own images, so the only available lever is
 * whether the element exists yet. The assertion is therefore literally «there is
 * no slider in the DOM», and it is worth nothing unless something also proves
 * one appears afterwards.
 *
 * IntersectionObserver is the harness's, and it has to be: a real one needs a
 * layout engine, and jsdom gives every element a height of zero, so a real
 * observer would either never fire or always fire. The fake fires when the test
 * says so, which is what turns «created on intersection» into a fact.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush, observers } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/product.js';

/** The container `single.twig` renders in place of the slider. */
function pdp({ limit = '', id = '55', title = 'منتجات مشابهة' } = {}) {
  return `
    <div class="price-wrapper"><span class="total-price"></span></div>
    <div class="out-of-stock hidden"></div>
    <div data-related-slider
         data-related-id="${id}"
         data-related-title="${title}"
         ${limit ? `data-related-limit="${limit}"` : ''}></div>`;
}

const setup = (html = pdp()) => createDom({ html, pageSlug: 'product.single' });

const sliderIn = (document) => document.querySelector('salla-products-slider');
const observer = () => observers.intersection.at(-1);

/** What the component leaves behind once it has fetched. */
function componentRenders(document, itemCount) {
  const slot = document.createElement('div');

  slot.setAttribute('slot', 'items');

  for (let i = 0; i < itemCount; i += 1) {
    slot.append(document.createElement('custom-salla-product-card'));
  }

  sliderIn(document).append(slot);
}

/** `dropWhenEmpty` waits 150ms for the render to settle before deciding. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 200));

afterEach(teardownDom);

describe('T-4.14 · nothing exists until it is nearly in view', () => {
  test('no slider is created at boot', async () => {
    const { document } = setup();

    await loadFresh(SOURCE);

    assert.equal(sliderIn(document), null);
    assert.equal(observers.intersection.length, 1, 'but it is being watched');
  });

  test('a non-intersecting entry creates nothing', async () => {
    const { document } = setup();

    await loadFresh(SOURCE);
    observer().trigger(false);

    assert.equal(sliderIn(document), null);
  });

  test('intersecting creates the slider', async () => {
    const { document } = setup();

    await loadFresh(SOURCE);
    observer().trigger();

    assert.ok(sliderIn(document));
  });

  test('the observer is watching the container, with room to load before it is reached', async () => {
    const { document } = setup();

    await loadFresh(SOURCE);

    assert.deepEqual(observer().targets, [document.querySelector('[data-related-slider]')]);
    assert.equal(observer().options.rootMargin, '200px');
  });

  test('the observer disconnects after firing, so the slider is created once', async () => {
    const { document } = setup();

    await loadFresh(SOURCE);
    observer().trigger();

    assert.equal(observer().disconnected, true);

    // A disconnected observer cannot fire again, so a second scroll past the
    // block cannot produce a second rail — and the fake refuses to fire it,
    // rather than letting this pass against something a browser would not do.
    assert.equal(observer().trigger(), false);
    assert.equal(document.querySelectorAll('salla-products-slider').length, 1);
  });

  test('a page with no related container is a clean no-op', async () => {
    setup('<div class="price-wrapper"></div><div class="out-of-stock"></div>');

    await assert.doesNotReject(() => loadFresh(SOURCE));
    assert.equal(observers.intersection.length, 0);
  });
});

describe('T-4.14 · the slider is configured from the template, not from a literal', () => {
  test('source, id and title are passed through', async () => {
    const { document } = setup(pdp({ id: '77', title: 'قد يعجبك أيضًا' }));

    await loadFresh(SOURCE);
    observer().trigger();

    const slider = sliderIn(document);

    assert.equal(slider.getAttribute('source'), 'related');
    assert.equal(slider.getAttribute('source-value'), '77');
    assert.equal(slider.getAttribute('block-title'), 'قد يعجبك أيضًا');
    assert.equal(slider.getAttribute('display-all-url'), '');
  });

  test('the merchant’s count is passed when it is set', async () => {
    const { document } = setup(pdp({ limit: '8' }));

    await loadFresh(SOURCE);
    observer().trigger();

    assert.equal(sliderIn(document).getAttribute('limit'), '8');
  });

  test('no limit attribute at all when the setting is unset', async () => {
    const { document } = setup(pdp({ limit: '' }));

    await loadFresh(SOURCE);
    observer().trigger();

    // Omitted rather than guessed: hard-coding a number here would be the theme
    // overruling a platform default it does not own.
    assert.equal(sliderIn(document).hasAttribute('limit'), false);
  });
});

describe('T-4.14 · absent cleanly when there is nothing to recommend', () => {
  test('the block is kept when products arrive', async () => {
    const { document } = setup();

    await loadFresh(SOURCE);
    observer().trigger();
    componentRenders(document, 4);
    await settle();

    assert.ok(document.querySelector('[data-related-slider]'));
  });

  test('the block is removed when the slider settles with no items', async () => {
    const { document } = setup();

    await loadFresh(SOURCE);
    observer().trigger();

    // The component sets `isReady` on an empty response exactly as on a full
    // one, so without this the heading renders over an empty rail.
    componentRenders(document, 0);
    await settle();

    assert.equal(document.querySelector('[data-related-slider]'), null);
  });

  test('nothing is removed before the component has rendered anything', async () => {
    const { document } = setup();

    await loadFresh(SOURCE);
    observer().trigger();
    await settle();

    // No `[slot="items"]` yet means the answer is not in, not that it is empty.
    assert.ok(document.querySelector('[data-related-slider]'));
  });

  test('a slot filled after a first empty pass still keeps the block', async () => {
    const { document } = setup();

    await loadFresh(SOURCE);
    observer().trigger();

    const slot = document.createElement('div');

    slot.setAttribute('slot', 'items');
    sliderIn(document).append(slot);

    // Still rendering: cards land inside the same slot a tick later, which is
    // exactly why the check waits for the mutations to stop.
    await flush();
    slot.append(document.createElement('custom-salla-product-card'));
    await settle();

    assert.ok(document.querySelector('[data-related-slider]'));
  });
});
