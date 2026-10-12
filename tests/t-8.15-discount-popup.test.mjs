/**
 * T-8.15 — the discount popup's script (partials/discount-popup.js).
 *
 * It had no automated test on master; these hold the behaviour a merchant
 * relies on: it waits the configured seconds, it shows once per visitor when
 * told to, a changed offer shows again, and the code copies.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/discount-popup.js';

const page = ({ delay = 3, once = '1', signature = 'خصم|نص|AM10' } = {}) => `
  <p data-discount-code>AM10</p>
  <button type="button" data-discount-copy data-code="AM10"><span>نسخ</span></button>
  <p data-discount-status></p>
  <div data-discount-popup hidden data-delay="${delay}" data-once="${once}" data-signature="${signature}"></div>`;

const TRANSLATIONS = {
  'theme.discount.copied': 'تم نسخ الكود',
  'theme.discount.copy_manually': 'انسخ الكود يدويًا',
};

async function setup(t, options, { storage = {}, clipboard = true } = {}) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const env = createDom({ html: page(options), translations: TRANSLATIONS });
  for (const [k, v] of Object.entries(storage)) env.window.localStorage.setItem(k, v);
  const written = [];
  Object.defineProperty(env.window.navigator, 'clipboard', {
    configurable: true,
    value: clipboard ? { writeText: async (text) => { written.push(text); } } : undefined,
  });
  await loadFresh(SOURCE);
  const opened = () => env.control.calls.dispatched.filter(d => d.name === 'bottom-sheet::open' && d.payload === 'discount-popup');
  return { ...env, written, opened };
}

afterEach(teardownDom);

describe('T-8.15 · the discount popup', () => {
  test('waits the configured seconds before opening', async (t) => {
    const { opened } = await setup(t, { delay: 3 });

    t.mock.timers.tick(2999);
    assert.equal(opened().length, 0);
    t.mock.timers.tick(1);
    assert.equal(opened().length, 1);
  });

  test('shown once per visitor: a returning visitor does not see it again', async (t) => {
    const first = await setup(t, { delay: 0 });
    t.mock.timers.tick(0);
    assert.equal(first.opened().length, 1);

    const storage = { ...first.window.localStorage };
    const keys = Object.keys(storage).filter(k => k.startsWith('am1als:discount-popup:'));
    assert.equal(keys.length, 1);
    teardownDom();
    t.mock.timers.reset();

    const again = await setup(t, { delay: 0 }, { storage: { [keys[0]]: '1' } });
    t.mock.timers.tick(10_000);
    assert.equal(again.opened().length, 0);
  });

  test('a changed offer shows again to a visitor who saw the old one', async (t) => {
    const first = await setup(t, { delay: 0, signature: 'old|offer|A' });
    t.mock.timers.tick(0);
    const key = Object.keys({ ...first.window.localStorage }).find(k => k.startsWith('am1als:discount-popup:'));
    teardownDom();
    t.mock.timers.reset();

    const changed = await setup(t, { delay: 0, signature: 'new|offer|B' }, { storage: { [key]: '1' } });
    t.mock.timers.tick(0);
    assert.equal(changed.opened().length, 1);
  });

  test('with "once" off it shows on every visit', async (t) => {
    const { window, opened } = await setup(t, { delay: 0, once: '0' });
    t.mock.timers.tick(0);

    assert.equal(opened().length, 1);
    assert.equal(Object.keys({ ...window.localStorage }).length, 0);
  });

  test('it does not open over another open sheet', async (t) => {
    const { document, opened } = await setup(t, { delay: 1 });
    const other = document.createElement('dialog');
    other.setAttribute('data-sheet', '');
    other.setAttribute('open', '');
    document.body.append(other);

    t.mock.timers.tick(1000);
    assert.equal(opened().length, 0);
  });

  test('the copy button copies the code and says so', async (t) => {
    const { document, written } = await setup(t, { delay: 60 });
    document.querySelector('[data-discount-copy]').click();
    // setTimeout is mocked here, so wait on the clipboard promise chain directly.
    for (let i = 0; i < 3; i += 1) await Promise.resolve();

    assert.deepEqual(written, ['AM10']);
    assert.equal(document.querySelector('[data-discount-status]').textContent, 'تم نسخ الكود');
  });

  test('without clipboard access it selects the code and asks for a manual copy', async (t) => {
    const { document } = await setup(t, { delay: 60 }, { clipboard: false });
    document.querySelector('[data-discount-copy]').click();

    assert.equal(document.querySelector('[data-discount-status]').textContent, 'انسخ الكود يدويًا');
  });
});
