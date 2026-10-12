/**
 * T-4.06 follow-up — the editor-only position picker (partials/hotspot-picker.js).
 *
 * The merchant asked to place a point by clicking the image. The customiser
 * cannot take a click, so in the editor preview a click shows — and copies —
 * the two numbers for that spot. These tests hold the three things that make
 * it worth having: the numbers land the marker where the click was, a click on
 * a marker still opens its product, and shoppers never see any of it.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/hotspot-picker.js';

const PAGE = `
  <div class="hotspot hotspot--overlay" data-hotspot-root>
    <figure class="hotspot__figure">
      <img class="hotspot__image" alt="">
      <button type="button" class="hotspot__marker" data-hotspot-marker style="--x: 50%; --y: 50%"></button>
    </figure>
  </div>`;

const TRANSLATIONS = {
  'theme.hotspot.picker_position': 'أفقي :x% · رأسي :y%',
  'theme.hotspot.picker_copied': 'أفقي :x% · رأسي :y% — تم النسخ',
};

// The figure is 200 × 400, its left edge at 100 and top at 50.
const RECT = { left: 100, right: 300, top: 50, bottom: 450, width: 200, height: 400 };

async function setup({ framed = true, dir = 'rtl', clipboard = true } = {}) {
  const env = createDom({ html: PAGE, translations: TRANSLATIONS });

  env.document.documentElement.setAttribute('dir', dir);
  if (framed) {
    env.window.parent = {};
  }

  const written = [];
  Object.defineProperty(env.window.navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text) => {
        if (!clipboard) throw new Error('denied');
        written.push(text);
      },
    },
  });

  const figure = env.document.querySelector('.hotspot__figure');
  figure.getBoundingClientRect = () => RECT;

  await loadFresh(SOURCE);
  return { ...env, figure, written };
}

const click = (window, target, clientX, clientY) =>
  target.dispatchEvent(new window.MouseEvent('click', { bubbles: true, clientX, clientY }));

afterEach(teardownDom);

describe('T-4.06 · the hotspot position picker', () => {
  test('outside the editor frame it does nothing at all', async () => {
    const { window, document, figure } = await setup({ framed: false });

    click(window, figure, 150, 150);
    await flush();

    assert.equal(document.querySelector('.hotspot--picker'), null);
    assert.equal(document.querySelector('.hotspot__picker-chip'), null);
  });

  test('in RTL the horizontal number is measured from the right, as the marker is placed', async () => {
    const { window, document, figure, written } = await setup();

    // 50px in from the right edge of a 200px figure, 100px down a 400px one.
    click(window, figure, 250, 150);
    await flush();

    assert.deepEqual(written, ['25, 25']);
    const chip = document.querySelector('.hotspot__picker-chip');
    assert.equal(chip.textContent, 'أفقي 25% · رأسي 25% — تم النسخ');
    assert.equal(chip.style.getPropertyValue('--x'), '25%');
    assert.equal(chip.style.getPropertyValue('--y'), '25%');
  });

  test('in LTR it is measured from the left', async () => {
    const { window, figure, written } = await setup({ dir: 'ltr' });

    click(window, figure, 250, 150);
    await flush();

    assert.deepEqual(written, ['75, 25']);
  });

  test('a click on a marker is left to the marker', async () => {
    const { window, document, written } = await setup();

    click(window, document.querySelector('[data-hotspot-marker]'), 200, 250);
    await flush();

    assert.deepEqual(written, []);
    assert.equal(document.querySelector('.hotspot__picker-chip'), null);
  });

  test('without clipboard access the numbers are still shown', async () => {
    const { window, document, figure } = await setup({ clipboard: false });

    click(window, figure, 300, 450);
    await flush();

    assert.equal(document.querySelector('.hotspot__picker-chip').textContent, 'أفقي 0% · رأسي 100%');
  });

  test('a second click replaces the chip rather than adding one', async () => {
    const { window, document, figure } = await setup();

    click(window, figure, 250, 150);
    click(window, figure, 150, 350);
    await flush();

    assert.equal(document.querySelectorAll('.hotspot__picker-chip').length, 1);
  });
});
