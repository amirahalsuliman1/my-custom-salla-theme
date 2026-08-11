/**
 * T-7.02 — the FAQ accordion.
 *
 * THIS THEME NORMALLY TAKES THE ELEMENT THAT ALREADY HAS THE BEHAVIOUR, and here
 * it does not — the criterion asks for `aria-controls`, which `<summary>` cannot
 * give, plus a height transition and deep-linking, which `<details>` cannot
 * support either. So everything `<details>` would have supplied free is code now,
 * and code that replaces a browser behaviour is exactly the code that needs
 * pinning down.
 *
 * The case that matters most is `hidden`: a collapsed answer has to leave the
 * accessibility tree. An accordion that only loses its height still reads every
 * answer on the page to a screen reader, and it looks completely correct.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/accordion.js';

const entry = (n) => `
  <div class="faq__item">
    <h3 class="faq__question">
      <button type="button" class="faq__trigger" id="faq-0-${n}-trigger"
              aria-expanded="false" aria-controls="faq-0-${n}" data-faq-trigger>
        <span class="faq__text">سؤال ${n}</span>
        <span class="disclosure-mark"></span>
      </button>
    </h3>
    <div class="faq__answer" id="faq-0-${n}" role="region" aria-labelledby="faq-0-${n}-trigger" hidden>
      <div class="faq__answer-inner"><p>إجابة ${n}</p></div>
    </div>
  </div>`;

const FAQ = `<div class="faq__list">${entry(1)}${entry(2)}${entry(3)}</div>`;

async function boot(html = FAQ) {
  const dom = createDom({ html });

  await loadFresh(SOURCE);
  await flush();
  return dom;
}

const trigger = (n) => document.getElementById(`faq-0-${n}-trigger`);
const panel = (n) => document.getElementById(`faq-0-${n}`);

afterEach(teardownDom);

describe('T-7.02 · the disclosure is a real disclosure', () => {
  test('it opens closed, which is the collapsed artboard', async () => {
    await boot();

    assert.equal(trigger(1).getAttribute('aria-expanded'), 'false');
    assert.equal(panel(1).hidden, true);
  });

  test('pressing it takes the answer INTO the accessibility tree, not just into view', async () => {
    await boot();

    trigger(1).click();

    assert.equal(trigger(1).getAttribute('aria-expanded'), 'true');
    assert.equal(panel(1).hidden, false);
  });

  test('pressing again takes it back out', async () => {
    await boot();

    trigger(1).click();
    trigger(1).click();

    assert.equal(trigger(1).getAttribute('aria-expanded'), 'false');

    // The close is animated, so `hidden` returns on `transitionend`; jsdom fires
    // no transitions, which is why the handler is driven directly here.
    panel(1).dispatchEvent(new CustomEvent('transitionend'));
    assert.equal(panel(1).hidden, true);
  });

  test('entries are independent — this is an accordion, not a radio group', async () => {
    await boot();

    trigger(1).click();
    trigger(2).click();

    // Nothing in the criterion asks for one-at-a-time, and closing someone's
    // answer because they opened another is a behaviour, not an absence of one.
    assert.equal(panel(1).hidden, false);
    assert.equal(panel(2).hidden, false);
  });

  test('the height is driven by a custom property, because `auto` cannot animate', async () => {
    await boot();

    trigger(1).click();

    assert.match(panel(1).style.getPropertyValue('--faq-height'), /px$/);
  });
});

describe('T-7.02 · deep-linking opens the entry', () => {
  test('a hash naming the panel opens it on load', async () => {
    createDom({ html: FAQ });
    window.location.hash = 'faq-0-2';

    await loadFresh(SOURCE);
    await flush();

    assert.equal(trigger(2).getAttribute('aria-expanded'), 'true');
    assert.equal(panel(2).hidden, false);
  });

  test('a hash naming the trigger opens it too', async () => {
    createDom({ html: FAQ });
    window.location.hash = 'faq-0-3-trigger';

    await loadFresh(SOURCE);
    await flush();

    // A hand-written link is as likely to point at one as the other, and a deep
    // link that silently does nothing is worse than no deep link.
    assert.equal(trigger(3).getAttribute('aria-expanded'), 'true');
  });

  test('navigating to a hash after load opens it as well', async () => {
    await boot();

    window.location.hash = 'faq-0-1';
    window.dispatchEvent(new CustomEvent('hashchange'));

    assert.equal(trigger(1).getAttribute('aria-expanded'), 'true');
  });

  test('a hash that names nothing here is ignored', async () => {
    createDom({ html: FAQ });
    window.location.hash = 'something-else';

    await loadFresh(SOURCE);
    await flush();

    assert.equal(trigger(1).getAttribute('aria-expanded'), 'false');
  });
});

describe('T-7.02 · it is inert where there is no accordion', () => {
  test('a page with no FAQ boots without throwing', async () => {
    await boot('<div class="not-an-faq"></div>');

    assert.equal(document.querySelector('[data-faq-trigger]'), null);
  });
});
