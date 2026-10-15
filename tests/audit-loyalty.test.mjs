/**
 * The loyalty screens against their artboards — the 2026-10 audit pass.
 *
 * `Loyalty Points Page.pdf`, the two `Points Value Pop-up` states, `Points
 * Earned Pop-up.pdf`, and the desktop twins of each. Every case names the item
 * it pins. The stylesheet cases read the source, as the other design-pass files
 * do; the script cases run `loyalty.js` in jsdom against the DOM the platform
 * leaves on a live store — **including the prize sheet sitting at `<body>` level,
 * where `salla-modal` moves itself**, which is what the T-5.12 cases before
 * this never modelled.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SCSS = fs.readFileSync('src/assets/styles/04-components/loyalty-page.scss', 'utf8');
const CARDS = fs.readFileSync('src/assets/styles/04-components/account-cards.scss', 'utf8');
const DIALOG_SCSS = fs.readFileSync('src/assets/styles/04-components/dialog.scss', 'utf8');
const TWIG = fs.readFileSync('src/views/pages/loyalty.twig', 'utf8');
const DIALOG_TWIG = fs.readFileSync('src/views/components/ui/dialog.twig', 'utf8');
const CUSTOMER = fs.readFileSync('src/views/layouts/customer.twig', 'utf8');
const AR = JSON.parse(fs.readFileSync('src/locales/ar.json', 'utf8')).theme.loyalty;
const EN = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8')).theme.loyalty;

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The from-laptop block, so a desktop rule cannot pass by matching a mobile one. */
const LAPTOP = SCSS.slice(SCSS.indexOf('@include from-laptop'));
const MOBILE = SCSS.slice(0, SCSS.indexOf('@include from-laptop'));

/** The body of the first rule whose selector is exactly `selector`. */
function rule(css, selector) {
  const match = css.match(new RegExp(`(?:^|\\n)\\s*${escape(selector)} \\{([^}]*)\\}`));

  assert.ok(match, `no rule for ${selector}`);
  return match[1];
}

describe('Loyalty Points Page · mobile', () => {
  test('#1 the history tile sits at the inline start, the amount at the inline end', () => {
    assert.match(
      rule(MOBILE, '.loyalty-history .s-loyalty-points-history-table-tbody-tr-td:nth-child(1)'),
      /grid-area: 1 \/ 3 \/ 3 \/ 4;/,
    );
    assert.match(rule(MOBILE, '.loyalty-history .loyalty-history__icon'), /grid-area: 1 \/ 1 \/ 3 \/ 2;/);
  });

  test('#1 the component\'s own cell padding and text-xs no longer reach the row', () => {
    const content = rule(MOBILE, '.loyalty-history .s-loyalty-points-history-table-tbody-tr-td-content');

    assert.match(content, /@apply block p-0;/);
    assert.match(content, /font-size: inherit;/);
  });

  test('#2 the coin badge is at the inline start — DOM order, no row-reverse', () => {
    const row = rule(SCSS, '.loyalty-balance__row');

    assert.match(row, /@apply flex items-center gap-4;/);
    assert.doesNotMatch(row, /row-reverse/);
  });

  test('#116 the history card is the white card surface, the balance card stays warm', () => {
    assert.match(rule(MOBILE, '.loyalty-history'), /background-color: var\(--surface-card\);/);
    assert.match(CARDS, /background-color: var\(--surface-section\);/);
  });

  test('#117 the history tiles take the light edge, and a rail joins them', () => {
    assert.match(rule(MOBILE, '.loyalty-history .loyalty-history__icon'), /border-color: var\(--border-subtle\);/);

    const rail = rule(MOBILE, '.loyalty-history .s-loyalty-points-history-table-tbody-tr::before');

    assert.match(rail, /inset-block: 0;/);
    assert.match(rail, /inline-size: 2px;/);
    assert.match(rail, /background-color: var\(--border-subtle\);/);
    assert.match(
      rule(MOBILE, '.loyalty-history .s-loyalty-points-history-table-tbody-tr:first-child::before'),
      /inset-block-start: 50%;/,
    );
    // The shared tile is not touched: the balance badge and the notification
    // tiles keep the dark edge.
    assert.match(rule(CARDS, '.account-tile'), /border-color: var\(--border-interactive\);/);
  });

  test('#117 the row meets the next one with no platform border to break the rail', () => {
    assert.match(
      rule(MOBILE, '.loyalty-history .s-loyalty-points-history-table-tbody-tr'),
      /@apply relative grid items-center gap-x-4 rounded-none border-0 p-4;/,
    );
  });

  test('#118 the balance badge is a circle, on its own class', () => {
    assert.match(TWIG, /<span class="account-tile loyalty-balance__badge" aria-hidden="true">/);
    assert.match(rule(SCSS, '.loyalty-balance__badge'), /@apply rounded-full;/);
  });

  test('#119 the programme line is start-aligned under the dark rule', () => {
    const note = rule(MOBILE, '.loyalty-balance__note');

    assert.match(note, /text-start/);
    assert.doesNotMatch(note, /text-center/);
    assert.match(note, /border-block-start: 1px solid var\(--border-interactive\);/);
  });
});

describe('Loyalty Points Page · desktop', () => {
  test('#38 one wrapper holds the card and the single salla-loyalty', () => {
    const open = TWIG.indexOf('<div class="loyalty-summary">');
    const section = TWIG.indexOf('<section class="account-panel loyalty-balance"');
    const element = TWIG.indexOf('<salla-loyalty ');
    const close = TWIG.indexOf('</salla-loyalty>');

    assert.ok(open > -1 && open < section && section < element, 'card and button share the wrapper');
    assert.equal(TWIG.match(/<salla-loyalty /g).length, 1, 'a second salla-loyalty would miss loyalty.js');
    assert.ok(TWIG.indexOf('</div>', close) > close);
  });

  test('#38 the label is page.title and the unit sits outside the live figure', () => {
    assert.match(TWIG, /<span class="loyalty-balance__kicker">\{\{ page\.title \}\}<\/span>/);
    assert.match(
      TWIG,
      /<\/strong>\s*<span class="loyalty-balance__unit">\{\{ trans\('theme\.loyalty\.points_unit'\) \}\}<\/span>/,
    );
    assert.equal(AR.points_unit, 'نقطة');
    assert.ok(EN.points_unit);
  });

  test('#38 the illustration is the programme image, decorative, its box reserved', () => {
    assert.match(TWIG, /\{% if loyalty\.image %\}/);
    assert.match(
      TWIG,
      /<img class="loyalty-summary__art"\s+src="\{\{ loyalty\.image \}\}"\s+width="192" height="128"\s+alt="" loading="lazy"/,
    );
    assert.match(rule(MOBILE, '.loyalty-balance__kicker,\n.loyalty-balance__unit,\n.loyalty-summary__art'), /display: none;/);
  });

  test('#38 from 1024px the wrapper is the card: text at the start, art and button at the end', () => {
    const card = rule(LAPTOP, '.loyalty-summary');

    assert.match(card, /grid-template-columns: minmax\(0, 1fr\) 12rem;/);
    assert.match(card, /background-color: var\(--surface-section\);/);
    assert.match(card, /border-color: var\(--border-interactive\);/);
    assert.match(rule(LAPTOP, '.loyalty-summary > .loyalty-balance'), /grid-row: 1 \/ span 2;/);
    assert.match(rule(LAPTOP, '.loyalty-summary__art'), /grid-column: 2;\s*grid-row: 1;/);
    assert.match(rule(LAPTOP, '.loyalty-summary > salla-loyalty'), /grid-column: 2;\s*grid-row: 2;/);
    assert.match(rule(LAPTOP, '.loyalty-balance__badge,\n  .loyalty-balance__label'), /display: none;/);
    // OP-6: no hairline, because the notice it separates is not built.
    assert.match(rule(LAPTOP, '.loyalty-balance__note'), /border-block-start: 0;/);
  });

  test('#4 the history becomes a table: a band, no panel, no tiles, dark hairlines', () => {
    assert.match(rule(LAPTOP, '.loyalty-history'), /background-color: transparent;/);

    const head = rule(LAPTOP, '.loyalty-history__head');

    assert.match(head, /background-color: var\(--surface-section\);/);
    assert.match(head, /min-block-size: 4rem;/);

    const row = rule(LAPTOP, '.loyalty-history .s-loyalty-points-history-table-tbody-tr');

    assert.match(row, /border-block-end: 1px solid var\(--border-interactive\);/);
    assert.match(rule(LAPTOP, '.loyalty-history .loyalty-history__icon'), /display: none;/);
    assert.match(rule(LAPTOP, '.loyalty-history .s-loyalty-points-history-table-tbody-tr::before'), /content: none;/);
    assert.match(
      rule(LAPTOP, '.loyalty-history .s-loyalty-points-history-table-tbody-tr-td:nth-child(1)'),
      /display: contents;/,
    );
  });

  test('#4 the band is the theme\'s, from the locale, hidden from the accessibility tree', () => {
    assert.match(TWIG, /<div class="loyalty-history__head" aria-hidden="true">/);
    ['column_activity', 'column_status', 'column_points', 'column_date'].forEach((key) => {
      assert.match(TWIG, new RegExp(`trans\\('theme\\.loyalty\\.${key}'\\)`));
      assert.ok(AR[key] && EN[key], `${key} in both locales`);
    });
    assert.equal(AR.column_activity, 'النشاط');
    assert.match(LAPTOP, /\.loyalty-history:not\(:has\(\.s-loyalty-points-history-table-tbody-tr\)\) \.loyalty-history__head \{\s*display: none;/);
  });

  test('#4 the direction is a pill in the success or error pair', () => {
    assert.match(rule(LAPTOP, '.loyalty-history .loyalty-history__direction'), /grid-area: 1 \/ 2;/);

    const earn = rule(LAPTOP, '.loyalty-history .loyalty-history__direction--earn');
    const deduct = rule(LAPTOP, '.loyalty-history .loyalty-history__direction--deduct');

    assert.match(earn, /background-color: var\(--accent-success-soft\);/);
    assert.match(earn, /border-color: var\(--color-success\);/);
    // The green is 2.66:1 on its wash — a graphic, never the word's ink.
    assert.match(earn, /color: var\(--text-secondary\);/);
    assert.match(deduct, /background-color: var\(--accent-soft\);/);
    assert.match(deduct, /color: var\(--color-error\);/);
  });
});

describe('Points Value Pop-up · the stylesheet', () => {
  test('#3 the carousel is a flat column, its paging controls gone', () => {
    const wrapper = rule(SCSS, '.s-loyalty-slider .swiper-wrapper');

    assert.match(wrapper, /flex-direction: column;/);
    assert.match(wrapper, /transform: none !important;/);
    assert.match(rule(SCSS, '.s-loyalty-slider .s-slider-block__title'), /display: none;/);
  });

  test('#3 the row beats the platform\'s two-class carousel card', () => {
    const row = rule(SCSS, '.s-loyalty-prize-item,\n.s-loyalty-slider .s-loyalty-prize-item.swiper-slide');

    assert.match(row, /flex flex-row items-center justify-between/);
    assert.match(row, /inline-size: 100%;/);
    assert.match(row, /padding: 1rem !important;/);
    assert.match(
      rule(SCSS, '.s-loyalty-slider .s-loyalty-prize-item.swiper-slide > :not([hidden]) ~ :not([hidden])'),
      /margin-block: 0;/,
    );
    assert.match(
      rule(SCSS, '.s-loyalty-prize-item-selected,\n.s-loyalty-slider .s-loyalty-prize-item-selected.swiper-slide'),
      /border-width: 2px;[\s\S]*transform: none !important;/,
    );
  });

  test('#3 the points sentence leads, regular; the value follows, bold', () => {
    const points = rule(SCSS, '.s-loyalty-prize-item-points');

    assert.match(points, /order-first/);
    assert.match(points, /font-normal/);
    assert.match(points, /margin-block-start: 0 !important;/);
    assert.match(rule(SCSS, '.s-loyalty-prize-item-title'), /font-bold/);
    assert.match(rule(SCSS, '.s-loyalty-prize-item-subtitle'), /@apply sr-only;/);
  });

  test('#3 a single prize group shows no tab row', () => {
    assert.match(
      SCSS,
      /\.s-loyalty-header ~ salla-tabs \.s-tabs-header:has\(> salla-tab-header:only-of-type\) \{\s*display: none;/,
    );
  });

  test('#41 the header is the centred title: no gift badge, the promotion copy screen-reader only', () => {
    assert.match(rule(SCSS, '.s-loyalty-header .s-list-tile-item-icon'), /display: none;/);
    assert.match(rule(SCSS, '.s-loyalty-header .s-list-tile-item-content'), /text-center/);
    assert.match(rule(SCSS, '.s-loyalty-header-title'), /text-lg font-bold/);
    assert.match(rule(SCSS, '.s-loyalty-header-subtitle'), /@apply sr-only;/);
  });

  test('#40 the footer pair is two equal halves on one line', () => {
    const pair = rule(SCSS, '.loyalty-redeem__close,\n.s-loyalty-program-redeem-btn');

    assert.match(pair, /inline-size: calc\(50% - 0\.375rem\);/);
    assert.match(rule(SCSS, '.loyalty-redeem__close'), /margin-inline-end: 0\.75rem;/);
  });

  test('no sheet selector is scoped under salla-loyalty, which the modal leaves', () => {
    assert.doesNotMatch(SCSS, /salla-loyalty [.\w]/);
  });
});

/* ── the script ─────────────────────────────────────────────────────────── */

const SOURCE = 'src/assets/js/loyalty.js';

/** The page, with `salla-loyalty` holding only its widget — as after load. */
function page(points = '1225') {
  return `
    <section class="account-panel loyalty-balance">
      <strong data-testid="store-loyalty-points-count">${points}</strong>
    </section>
    <span data-loyalty-status></span>
    <salla-loyalty customer-points="${points}"><div slot="widget"></div></salla-loyalty>`;
}

/**
 * The prize sheet as it stands on a live store: a `salla-modal` at `<body>`
 * level, NOT inside `salla-loyalty`.
 */
function sheet({ selected = -1, count = 3, groups = 1 } = {}) {
  const group = (g) => `<salla-tab-content><salla-slider class="s-loyalty-slider"><div class="swiper"><div class="swiper-wrapper">${
    Array.from({ length: count }, (_, i) =>
      `<div class="s-loyalty-prize-item swiper-slide${i === selected && g === 0 ? ' s-loyalty-prize-item-selected' : ''}">
         <div class="s-loyalty-prize-item-title">${(i + 1) * 0.5} ريال</div>
         <div class="s-loyalty-prize-item-points">${(i + 1) * 500} نقطة</div>
       </div>`).join('')
  }</div></div></salla-slider></salla-tab-content>`;

  return `<salla-modal><div class="s-modal-body">
      <div class="s-loyalty-skeleton"><div class="s-loyalty-skeleton-cards"><div class="s-loyalty-prize-item swiper-slide"></div></div></div>
      <salla-list-tile class="s-loyalty-header"><div class="s-loyalty-header-title">قيمة نقاطك</div></salla-list-tile>
      <salla-tabs>${Array.from({ length: groups }, (_, g) => group(g)).join('')}</salla-tabs>
      <salla-button class="s-loyalty-program-redeem-btn"><button>استبدل الآن</button></salla-button>
    </div></salla-modal>`;
}

const STRINGS = {
  'theme.loyalty.current_balance': 'رصيدك الحالي: :points نقطة ولاء.',
  'theme.common.close': 'إغلاق',
  'theme.loyalty.earned': 'كسب',
  'theme.loyalty.deducted': 'خصم',
};

async function boot(html) {
  const dom = createDom({ html, pageSlug: 'loyalty', translations: STRINGS });

  await loadFresh(SOURCE);
  await flush();
  return dom;
}

afterEach(teardownDom);

describe('Points Value Pop-up · the sheet at <body> level', () => {
  test('salla-modal\'s move to <body> no longer hides the sheet from the script', async () => {
    await boot(page() + sheet({ selected: 1 }));

    const items = [...document.querySelectorAll('.swiper-wrapper .s-loyalty-prize-item')];

    assert.deepEqual(items.map((i) => i.getAttribute('role')), ['radio', 'radio', 'radio']);
    assert.deepEqual(items.map((i) => i.getAttribute('aria-checked')), ['false', 'true', 'false']);
  });

  test('a sheet that arrives at <body> after the page booted is still upgraded', async () => {
    await boot(page());

    document.body.insertAdjacentHTML('beforeend', sheet());
    await flush();

    assert.equal(document.querySelector('.swiper-wrapper .s-loyalty-prize-item').getAttribute('role'), 'radio');
    assert.ok(document.querySelector('.loyalty-redeem__close'));
  });

  test('the skeleton\'s placeholder cards are never announced as choices', async () => {
    await boot(page() + sheet());

    assert.equal(document.querySelector('.s-loyalty-skeleton .s-loyalty-prize-item').hasAttribute('role'), false);
  });
});

describe('Points Value Pop-up · #39 the balance sentence', () => {
  test('it is inserted once, ahead of the tabs, from the rendered balance', async () => {
    await boot(page('1225') + sheet());

    const sentence = document.getElementById('loyalty-redeem-balance');

    assert.ok(sentence, 'the artboards draw it in both states');
    assert.equal(sentence.textContent, 'رصيدك الحالي: 1225 نقطة ولاء.');
    assert.equal(sentence.nextElementSibling.tagName, 'SALLA-TABS');

    document.querySelector('salla-modal .s-modal-body').append(document.createElement('span'));
    await flush();

    assert.equal(document.querySelectorAll('.loyalty-redeem__balance').length, 1);
  });

  test('the choices point at it', async () => {
    await boot(page() + sheet());

    assert.equal(
      document.querySelector('.swiper-wrapper').getAttribute('aria-describedby'),
      'loyalty-redeem-balance',
    );
  });

  test('after an exchange it says what the platform said, never a sum of ours', async () => {
    const { control } = await boot(page('1225') + sheet());

    control.emit('loyalty::points.fetched', { data: { points: 225 } });

    assert.equal(document.getElementById('loyalty-redeem-balance').textContent, 'رصيدك الحالي: 225 نقطة ولاء.');
  });

  test('with no rendered balance there is no sentence, rather than one with a blank', async () => {
    await boot(page('') + sheet());

    assert.equal(document.getElementById('loyalty-redeem-balance'), null);
  });
});

describe('Points Value Pop-up · #40 the «إغلاق» button', () => {
  test('it is the neutral button, before the redeem button, added once', async () => {
    await boot(page() + sheet());

    const close = document.querySelector('.loyalty-redeem__close');
    const redeem = document.querySelector('.s-loyalty-program-redeem-btn');

    assert.ok(close);
    assert.equal(close.getAttribute('type'), 'button');
    assert.match(close.className, /\bbtn btn--neutral\b/);
    assert.equal(close.textContent, 'إغلاق');
    assert.equal(close.nextElementSibling, redeem, 'the inline start in RTL, as drawn');

    document.querySelector('salla-modal .s-modal-body').append(document.createElement('span'));
    await flush();

    assert.equal(document.querySelectorAll('.loyalty-redeem__close').length, 1);
  });

  test('it closes through the component\'s own close()', async () => {
    await boot(page() + sheet());

    let closed = 0;

    document.querySelector('salla-loyalty').close = () => {
      closed += 1;
    };
    document.querySelector('.loyalty-redeem__close').click();

    assert.equal(closed, 1);
  });
});

describe('Loyalty Points Page · #4 the direction carries its modifier', () => {
  const row = (points) => `
    <tr class="s-loyalty-points-history-table-tbody-tr">
      <td class="s-loyalty-points-history-table-tbody-tr-td"><div><span>${points} نقطة</span></div></td>
      <td class="s-loyalty-points-history-table-tbody-tr-td"></td>
    </tr>`;

  test('earn and deduct are told apart by class, for the desktop pill', async () => {
    await boot(`<section class="loyalty-history"><table><tbody>${row('+120')}${row('-50')}</tbody></table></section>`);

    const words = [...document.querySelectorAll('.loyalty-history__direction')];

    assert.ok(words[0].classList.contains('loyalty-history__direction--earn'));
    assert.ok(words[1].classList.contains('loyalty-history__direction--deduct'));
  });
});

describe('T-5.13 · the double-submit guard reaches the relocated confirmation', () => {
  const confirmation = `<salla-modal><div class="s-loyalty-confirmation-actions">
      <salla-button class="confirm"><button type="button">تأكيد</button></salla-button>
    </div></salla-modal>`;

  test('a second click in the same frame is swallowed though the modal is at <body>', async () => {
    await boot(page() + confirmation);

    let seen = 0;
    const button = document.querySelector('.confirm button');

    document.querySelector('.confirm').addEventListener('click', () => {
      seen += 1;
    });
    button.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    button.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

    assert.equal(seen, 1, 'a listener on salla-loyalty would never have seen either click');
  });
});

describe('Points Earned Pop-up · #42 the headline is its own line', () => {
  test('the dialog takes an optional headline, a paragraph above the message', () => {
    assert.match(DIALOG_TWIG, /\{% if headline is defined and headline is not empty %\}\s*<p class="dialog__headline">\{\{ headline \}\}<\/p>/);
    assert.ok(DIALOG_TWIG.indexOf('dialog__headline">') < DIALOG_TWIG.indexOf('<p class="dialog__message">'));
    assert.match(rule(DIALOG_SCSS, '.dialog__headline'), /text-base font-bold/);
    assert.match(rule(DIALOG_SCSS, '.dialog__headline'), /color: var\(--text-secondary\);/);
  });

  test('the shell passes the two halves of the old sentence', () => {
    assert.match(CUSTOMER, /headline:\s+trans\('theme\.loyalty\.earned_headline'\)/);
    assert.match(CUSTOMER, /message:\s+trans\('theme\.loyalty\.earned_body'\)/);
    assert.equal(AR.earned_headline, 'لقد ربحت :points نقطة ولاء جديدة!');
    assert.equal(AR.earned_body, 'مكافأتك بانتظارك، استبدلها الآن وتمتع بعروض خاصة.');
    assert.equal(AR.earned_message, undefined, 'one key per line, not one for both');
  });
});
