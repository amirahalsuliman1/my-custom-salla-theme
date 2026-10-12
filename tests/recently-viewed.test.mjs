/**
 * «شاهدته مؤخراً» (owner request, 2026-10-12) — partials/recently-viewed.js.
 *
 * What makes the feature trustworthy: the list is newest-first with no
 * repeats and a ceiling, a product never shows in its own list, a visitor with
 * no history sees no empty heading, and broken storage costs nothing.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, observers } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/recently-viewed.js';
const KEY = 'am1als:recently-viewed';

async function setup(html, stored) {
  const env = createDom({ html });
  if (stored) env.window.localStorage.setItem(KEY, JSON.stringify(stored));
  const mod = await loadFresh(SOURCE);
  return { ...env, mod, reveal: () => observers.intersection.forEach(o => o.trigger(true)) };
}

const stored = (window) => JSON.parse(window.localStorage.getItem(KEY) || '[]');

afterEach(teardownDom);

describe('recently viewed', () => {
  test('a product page records its product first, without repeating it', async () => {
    const { window } = await setup('<span hidden data-recently-viewed-record="7"></span>', ['3', '7', '5']);

    assert.deepEqual(stored(window), ['7', '3', '5']);
  });

  test('the list stops at its ceiling, dropping the oldest', async () => {
    const many = Array.from({ length: 25 }, (_, i) => String(i + 1));
    const { window, mod } = await setup('<span hidden data-recently-viewed-record="99"></span>', many);

    const list = stored(window);
    assert.equal(list.length, mod.MAX_STORED);
    assert.equal(list[0], '99');
    assert.equal(list.at(-1), String(mod.MAX_STORED - 1));
  });

  test('the slider gets the stored products, newest first, up to the limit, minus the current one', async () => {
    const { document, reveal } = await setup(
      `<div data-recently-viewed data-recently-viewed-exclude="5" data-recently-viewed-limit="2"
            data-recently-viewed-title="شاهدته مؤخراً"></div>`,
      ['5', '9', '4', '1'],
    );
    reveal();

    const slider = document.querySelector('salla-products-slider');
    assert.equal(slider.getAttribute('source'), 'selected');
    assert.equal(slider.getAttribute('source-value'), '[9,4]');
    assert.equal(slider.getAttribute('block-title'), 'شاهدته مؤخراً');
  });

  test('nothing renders until the section comes near the screen', async () => {
    const { document } = await setup('<div data-recently-viewed></div>', ['9']);

    assert.equal(document.querySelector('salla-products-slider'), null);
  });

  test('a visitor with no history gets no section at all', async () => {
    const { document, reveal } = await setup('<div data-recently-viewed></div>');
    reveal();

    assert.equal(document.querySelector('[data-recently-viewed]'), null);
  });

  test('having viewed only the current product counts as no history', async () => {
    const { document, reveal } = await setup('<div data-recently-viewed data-recently-viewed-exclude="5"></div>', ['5']);
    reveal();

    assert.equal(document.querySelector('[data-recently-viewed]'), null);
  });

  test('corrupt storage is treated as empty, not as an error', async () => {
    const env = createDom({ html: '<div data-recently-viewed></div>' });
    env.window.localStorage.setItem(KEY, '{not json');
    const mod = await loadFresh(SOURCE);

    assert.deepEqual(mod.read(), []);
  });
});
