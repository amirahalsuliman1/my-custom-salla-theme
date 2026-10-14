/**
 * Design audit — the orders screens (list card, cancel dialog, desktop tabs).
 *
 * Each block pins one confirmed design-vs-code defect against the artboard it
 * came from, so a later edit that quietly undoes it fails here rather than on a
 * customer's screen. Most are source assertions, because the card is Twig and a
 * stylesheet; the desktop collapse is behaviour, so it runs in the DOM harness.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const read = (file) => fs.readFileSync(file, 'utf8');
const ITEM = read('src/views/components/orders/item.twig');
const CARD = read('src/views/components/orders/card.twig');
const CSS = read('src/assets/styles/04-components/order-card.scss');
const DIALOG_CSS = read('src/assets/styles/04-components/dialog.scss');
const CANCEL = read('src/views/components/orders/cancel-dialog.twig');
const INDEX = read('src/views/pages/customer/orders/index.twig');

/** The body of the last `@include from-laptop { … }` block that contains `needle`. */
function laptopBlock(css, needle) {
  const blocks = [];
  let at = css.indexOf('@include from-laptop {');

  while (at !== -1) {
    let depth = 0;
    let end = at;

    for (let i = css.indexOf('{', at); i < css.length; i += 1) {
      if (css[i] === '{') depth += 1;
      if (css[i] === '}') depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
    blocks.push(css.slice(at, end + 1));
    at = css.indexOf('@include from-laptop {', end);
  }

  return blocks.find((block) => block.includes(needle)) ?? '';
}

/** Everything outside any `@include from-*` block. */
const base = (css) => css.replace(/@include from-[a-z]+ \{[\s\S]*?\n\}/g, '');

describe('#53 · the price paid comes first, the struck price after it', () => {
  test('the current price precedes .order-item__was in the markup', () => {
    const price = ITEM.slice(ITEM.indexOf('<p class="order-item__price">'), ITEM.indexOf('</p>', ITEM.indexOf('<p class="order-item__price">')));

    assert.ok(price.indexOf('item.price|money') < price.indexOf('order-item__was'));
  });

  test('no CSS reorder stands in for it', () => {
    assert.doesNotMatch(CSS, /\.order-item__price[^{]*\{[^}]*(row-reverse|order:)/);
  });
});

describe('#54 · «تحميل الفاتورة» sits at the inline start with one rule under it', () => {
  test('inline-flex, no justify-end, a border rather than text-decoration', () => {
    const rule = CSS.match(/\.order-card__invoice \{([^}]*)\}/)[1];

    assert.match(rule, /@apply inline-flex/);
    assert.doesNotMatch(rule, /justify-end/);
    assert.match(rule, /no-underline/);
    assert.match(rule, /border-block-end: 1px solid currentcolor;/);
  });
});

describe('#55 · the desktop status pill lives in the header', () => {
  test('the summary carries a second status include between the total and the toggle', () => {
    const summary = CARD.slice(CARD.indexOf('<div class="order-card__summary">'), CARD.indexOf('</button>', CARD.indexOf('<div class="order-card__summary">')));

    assert.ok(summary.indexOf('order-card__total') < summary.indexOf('order-card__summary-status'));
    assert.ok(summary.indexOf('order-card__summary-status') < summary.indexOf('data-order-toggle'));
    assert.match(summary, /include 'components\.orders\.status' with \{ status: order\.status \} only/);
  });

  test('only one pill is displayed at any width', () => {
    assert.match(base(CSS), /\.order-card__summary-status \{\s*display: none;/);

    const laptop = laptopBlock(CSS, '.order-card__summary-status');

    assert.match(laptop, /\.order-card__summary-status \{\s*display: inline-flex;/);
    assert.match(laptop, /\.order-card__shipping \.order-status \{\s*display: none;/);
  });
});

describe('#56 · desktop puts the secondary action at the inline start', () => {
  test('the list card\'s actions reverse from 1024px only', () => {
    assert.match(laptopBlock(CSS, '.order-card .order-card__actions'), /\.order-card \.order-card__actions \{\s*flex-direction: row-reverse;/);
    assert.doesNotMatch(base(CSS), /row-reverse/);
  });
});

describe('#57 · the desktop cancel dialog\'s fuller policy sentence', () => {
  test('rendered inside the policy condition, WhatsApp line gated on the store\'s own field', () => {
    const policy = CANCEL.slice(CANCEL.indexOf('{% if cancel_policy_url %}'), CANCEL.indexOf('{% endset %}'));

    assert.match(policy, /class="dialog__intro dialog__details"/);
    assert.match(policy, /trans\('theme\.orders\.cancel_policy_details'\)/);
    assert.match(policy, /\{% if store\.contacts\.whatsapp %\}[\s\S]*trans\('theme\.orders\.cancel_help_whatsapp'\)/);
  });

  test('both keys exist in both locales', () => {
    for (const file of ['src/locales/ar.json', 'src/locales/en.json']) {
      const orders = JSON.parse(read(file)).theme.orders;

      assert.ok(orders.cancel_policy_details, `${file} cancel_policy_details`);
      assert.ok(orders.cancel_help_whatsapp, `${file} cancel_help_whatsapp`);
    }
    assert.equal(JSON.parse(read('src/locales/ar.json')).theme.orders.cancel_policy_details, 'لمعرفة الشروط الكاملة، الرسوم المترتبة، ومدة استرجاع المبلغ.');
  });

  test('hidden below 1024px, shown from it', () => {
    assert.match(base(DIALOG_CSS), /\.dialog__details \{[^}]*display: none;/);
    assert.match(laptopBlock(DIALOG_CSS, '.dialog__details'), /\.dialog__details \{\s*display: block;/);
  });
});

describe('#129 · the confirmation dialog\'s close sits at the inline start on mobile', () => {
  test('inline start below 1024px, inline end from it, for the dialog family only', () => {
    assert.match(base(DIALOG_CSS), /\.dialog \.sheet__close \{\s*inset-inline: 0 auto;/);
    assert.match(laptopBlock(DIALOG_CSS, '.dialog .sheet__close'), /\.dialog \.sheet__close \{\s*inset-inline: auto 0;/);
    assert.match(read('src/assets/styles/04-components/bottom-sheet.scss'), /\.sheet__close \{[^}]*inset-inline-end: 0;/);
  });
});

describe('#130 · the card edge is the artboards\' white rim', () => {
  test('.order-card re-declares the edge as --surface-page', () => {
    assert.match(CSS, /\.order-card \{[^}]*border-color: var\(--surface-page\);/);
  });
});

describe('#131 · the header is a raised panel on top of the card', () => {
  test('the card clips and carries no padding; the header and body do', () => {
    const card = CSS.match(/\n\.order-card \{([^}]*)\}/)[1];

    assert.match(card, /overflow-hidden/);
    assert.doesNotMatch(card, /p-4/);
    assert.match(CSS, /\.order-card > \.order-card__header \{\s*@apply rounded-large border p-4 shadow-floating;\s*background-color: var\(--surface-section\);\s*border-color: var\(--surface-page\);/);
    assert.match(CSS, /\.order-card__body \{\s*@apply space-y-4 p-4;/);
  });
});

describe('#133 · no quantity chip on the desktop list card', () => {
  test('visually hidden from 1024px, written out rather than @apply sr-only', () => {
    const laptop = laptopBlock(CSS, '.order-card .order-item__qty');
    const rule = laptop.match(/\.order-card \.order-item__qty \{([^}]*)\}/)[1];

    assert.match(rule, /position: absolute;/);
    assert.match(rule, /clip: rect\(0, 0, 0, 0\);/);
    assert.doesNotMatch(rule, /@apply sr-only/);
  });
});

describe('#134 · a text option is a chip on desktop', () => {
  test('the span has its own class and the chip is laptop-only', () => {
    assert.match(ITEM, /<span class="order-item__option">\{\{ option\.value \}\}<\/span>/);
    assert.doesNotMatch(base(CSS), /\.order-item__option \{/);
    assert.match(laptopBlock(CSS, '.order-item__option {'), /\.order-item__option \{[^}]*border: 1px solid var\(--border-interactive\);/);
  });
});

describe('#135 · every totals row is drawn alike', () => {
  test('no bold total, no band; labels semibold, values regular', () => {
    assert.doesNotMatch(CSS, /\.s-order-totals-card-total \{\s*@apply font-bold;/);
    assert.match(CSS, /\.order-card__totals \.s-order-totals-card-total \{\s*@apply mx-0 rounded-none bg-transparent px-0;/);
    assert.match(CSS, /\.s-order-totals-card-row-inner dt \{\s*@apply text-sm font-semibold;/);
    assert.match(CSS, /\.s-order-totals-card-row-inner dd b \{\s*@apply text-sm font-normal;/);
  });
});

describe('#136 · the invoice icon is a receipt', () => {
  test('sicon-receipt, not printer2, on the list card', () => {
    assert.match(CARD, /name: 'receipt', size: 'md'/);
    assert.doesNotMatch(CARD, /printer2/);
  });
});

describe('#137 · the desktop tabs span the container with only the pressed rule', () => {
  test('the tabs render in inner_title, outside the 64rem content column', () => {
    const title = INDEX.slice(INDEX.indexOf('{% block inner_title %}'), INDEX.indexOf('{% endblock %}', INDEX.indexOf('{% block inner_title %}')));
    const content = INDEX.slice(INDEX.indexOf('{% block inner_content %}'));

    assert.match(title, /<h1 class="sr-only">\{\{ page\.title \}\}<\/h1>/);
    assert.match(title, /\{% if user\.type == 'user' and orders\|length %\}[\s\S]*class="order-tabs"/);
    assert.doesNotMatch(content, /class="order-tabs"/);
  });

  test('no row hairline; a 4px --border-interactive rule on the pressed tab', () => {
    const laptop = laptopBlock(CSS, '.order-tabs__tab');
    const row = laptop.match(/\.order-tabs \{([^}]*)\}/)[1];

    assert.doesNotMatch(row, /border-block-end/);
    assert.match(laptop, /\.order-tabs__tab \{[^}]*border-block-end: 4px solid transparent;/);
    assert.doesNotMatch(laptop, /margin-block-end: -1px/);
    assert.match(laptop, /\[aria-pressed='true'\] \{[^}]*border-block-end-color: var\(--border-interactive\);/);
  });
});

describe('#138 · the desktop confirmation dialog is the drawn 600px panel', () => {
  test('39.5rem on the <dialog> (600 + its 2×1rem inset) from 1024px', () => {
    assert.match(laptopBlock(DIALOG_CSS, '.sheet--dialog.dialog'), /\.sheet--dialog\.dialog \{\s*max-inline-size: 39\.5rem;/);
  });
});

/* ---------------------------------------------------------------- #132 */

const SOURCE = 'src/assets/js/partials/order-list.js';

const CARD_HTML = (id, { cancellable = false } = {}) => `
  <article class="order-card" data-order-card data-order-pending-payment="false" data-order-cancellable="${cancellable}">
    <button type="button" data-order-toggle aria-expanded="true" aria-controls="order-body-${id}" hidden></button>
    <div class="order-card__body" id="order-body-${id}"></div>
  </article>`;

const LIST = `
  <div data-sort-disclosure data-sort-param="orders">
    <button data-sort-option="previous" aria-pressed="true">a</button>
    <button data-sort-option="in_progress" aria-pressed="false">b</button>
  </div>
  <div data-orders-list>
    ${CARD_HTML(1)}${CARD_HTML(2)}${CARD_HTML(3)}${CARD_HTML(4, { cancellable: true })}${CARD_HTML(5, { cancellable: true })}
  </div>`;

async function boot(desktop) {
  const env = createDom({ html: LIST, pageSlug: 'customer.orders.index' });

  env.window.matchMedia = (query) => ({ matches: desktop && query.includes('1024'), addEventListener() {} });
  await loadFresh(SOURCE);
  await flush();
  return env;
}

const expanded = (id) => document.querySelector(`[aria-controls="order-body-${id}"]`).getAttribute('aria-expanded');
const bodyHidden = (id) => document.getElementById(`order-body-${id}`).hidden;
const choose = (value) =>
  document.dispatchEvent(new CustomEvent('sort-disclosure::applied', { detail: { param: 'orders', value } }));

afterEach(teardownDom);

describe('#132 · desktop opens only the first card', () => {
  test('from 1024px the first visible card is open and the rest closed', async () => {
    await boot(true);

    assert.deepEqual([1, 2, 3].map(expanded), ['true', 'false', 'false']);
    assert.deepEqual([1, 2, 3].map(bodyHidden), [false, true, true]);
  });

  test('below 1024px every card stays open, as the mobile artboards draw', async () => {
    await boot(false);

    assert.deepEqual([1, 2, 3, 4, 5].map(expanded), ['true', 'true', 'true', 'true', 'true']);
  });

  test('a tab change settles the newly shown group the same way', async () => {
    await boot(true);

    choose('in_progress');
    assert.deepEqual([4, 5].map(expanded), ['true', 'false']);
  });

  test('the customer\'s own toggles survive a tab round trip', async () => {
    await boot(true);

    document.querySelector('[aria-controls="order-body-2"]').click();
    choose('in_progress');
    choose('previous');

    assert.deepEqual([1, 2, 3].map(expanded), ['true', 'true', 'false']);
  });
});
