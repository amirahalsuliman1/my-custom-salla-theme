/**
 * T-7.01 — the stories feed's controls.
 *
 * THE OPTIONS ARE DERIVED FROM THE RENDERED CARDS, WHICH IS THE PART THAT CAN GO
 * WRONG QUIETLY. A page template cannot reach the `home.stories` component's
 * collection, so the chips and the brand list are read out of the markup
 * `story-tags.twig` produced — and the only thing separating a brand from a
 * category in that markup is the `<bdi>` the brand is wrapped in for bidi
 * reasons. If that discriminator ever breaks, brands appear as category chips and
 * the two axes stop being two axes, which looks like a design choice rather than
 * a bug.
 *
 * The rest is the criterion: real controls, an AND across the two axes, and a
 * count that is announced rather than only drawn.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/stories-filter.js';

/** One card, in the shape `story-card.twig` + `story-tags.twig` emit. */
const card = (brand, tags) => `
  <li class="story-card">
    <button type="button" class="story-card__trigger"></button>
    <ul class="story-card__tags">
      ${brand ? `<li class="story-card__tag"><bdi>${brand}</bdi></li>` : ''}
      ${tags.map((t) => `<li class="story-card__tag">${t}</li>`).join('')}
    </ul>
  </li>`;

const FEED = `
  <div data-stories-controls></div>
  <ul class="stories__grid">
    ${card('Rhode', ['ميكاب', 'عروض'])}
    ${card('Rhode', ['هدايا'])}
    ${card('Merit', ['ميكاب'])}
  </ul>`;

async function boot(html = FEED) {
  const dom = createDom({
    html,
    translations: {
      'theme.stories.filter_label': 'تصفية حسب التصنيف',
      'theme.stories.filter_all': 'الكل',
      'theme.stories.brand_label': 'تصفية حسب البراند',
      'theme.stories.brand_all': 'كل البراندات',
      'theme.stories.count': '{count} قصة',
    },
  });

  await loadFresh(SOURCE);
  await flush();
  return dom;
}

const chips = () => [...document.querySelectorAll('[data-stories-tag]')];
const options = () => [...document.querySelectorAll('[data-sort-option]')];
const cards = () => [...document.querySelectorAll('.story-card')];
const visible = () => cards().filter((c) => !c.hidden).length;
const chip = (value) => document.querySelector(`[data-stories-tag="${value}"]`);

/** What `sort-disclosure.js` emits once the brand disclosure has been used. */
const chooseBrand = (value) =>
  document.dispatchEvent(
    new CustomEvent('sort-disclosure::applied', { bubbles: true, detail: { param: 'brand', value } }),
  );

afterEach(teardownDom);

describe('T-7.01 · the options come from the stories that are actually there', () => {
  test('one chip per distinct category, in first-appearance order, behind «الكل»', async () => {
    await boot();

    assert.deepEqual(chips().map((c) => c.textContent), ['الكل', 'ميكاب', 'عروض', 'هدايا']);
  });

  test('brands are the `<bdi>` tags and never appear as category chips', async () => {
    await boot();

    // The bidi wrapper is the only thing distinguishing the two in the markup.
    assert.equal(chips().some((c) => c.textContent === 'Rhode'), false);
    assert.deepEqual(options().map((o) => o.textContent.trim()), ['كل البراندات', 'Rhode', 'Merit']);
  });

  test('an axis with nothing to choose between renders no control', async () => {
    await boot(`
      <div data-stories-controls></div>
      <ul class="stories__grid">${card('Rhode', ['ميكاب'])}${card('Rhode', ['ميكاب'])}</ul>`);

    // Every story is «ميكاب» by «Rhode» — two controls offering one option each
    // would be two controls that do nothing.
    assert.equal(document.querySelector('[data-stories-controls]').children.length, 0);
  });

  test('it is inert where there is no feed', async () => {
    await boot('<div data-stories-controls></div>');

    assert.equal(document.querySelector('[data-stories-controls]').children.length, 0);
  });
});

describe('T-7.01 · filtering is category AND brand', () => {
  test('a category chip narrows the grid', async () => {
    await boot();

    chip('ميكاب').click();

    assert.equal(visible(), 2);
  });

  test('a brand narrows it on the other axis', async () => {
    await boot();

    chooseBrand('Merit');

    assert.equal(visible(), 1);
  });

  test('the two combine rather than replacing each other', async () => {
    await boot();

    chip('ميكاب').click();
    chooseBrand('Rhode');

    // «ميكاب» matches two cards and «Rhode» matches two; only one is both.
    assert.equal(visible(), 1);
  });

  test('«الكل» widens the category axis and leaves the brand alone', async () => {
    await boot();

    chooseBrand('Rhode');
    chip('هدايا').click();
    assert.equal(visible(), 1);

    chip('__all__').click();
    assert.equal(visible(), 2);
  });
});

describe('T-7.01 · the controls are real controls', () => {
  test('exactly one chip is pressed at a time', async () => {
    await boot();

    chip('عروض').click();

    assert.deepEqual(
      chips().map((c) => c.getAttribute('aria-pressed')),
      ['false', 'false', 'true', 'false'],
    );
  });

  test('the filtered count is announced, not only drawn', async () => {
    await boot();

    const status = document.querySelector('[data-stories-count]');

    assert.equal(status.getAttribute('role'), 'status');
    assert.equal(status.getAttribute('aria-live'), 'polite');

    chip('ميكاب').click();
    assert.equal(status.textContent, '2 قصة');
  });

  test('the brand control is T-4.17 markup, so one implementation drives it', async () => {
    await boot();

    const panel = document.querySelector('[data-sort-param="brand"]');

    assert.equal(panel.tagName, 'DETAILS');
    assert.equal(panel.hasAttribute('data-sort-disclosure'), true);
    assert.equal(panel.classList.contains('sort-disclosure'), true);
  });
});
