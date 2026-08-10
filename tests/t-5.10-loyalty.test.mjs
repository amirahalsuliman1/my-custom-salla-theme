/**
 * T-5.10 — the loyalty page's script.
 *
 * Two behaviours, and both exist because the page cannot get them any other way.
 *
 * The balance changes **off this page** — `salla-loyalty` runs the exchange
 * inside its own modal — so the figure in the card is stale the moment a
 * redemption succeeds. What is asserted here is that the new number comes from
 * the platform's `getPoints()` and not from arithmetic on the prize's cost:
 * CLAUDE.md forbids recomputing a total the platform owns, and a theme that
 * subtracted `cost_points` itself would be right until the first time it was not.
 *
 * And the history rows are missing the artboard's direction word and icon.
 * `salla-loyalty-points-history` renders the points, the date, the expiry, the
 * translated note and the status — never the machine `key`. The direction *is*
 * recoverable, because the component writes the sign in front of the amount, so
 * these cases pin that derivation rather than the five per-type icons, which are
 * recorded as unmet.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/loyalty.js';

/** One transaction row, in the shape the component's table renders. */
function historyRow(points) {
  return `
    <tr class="s-loyalty-points-history-table-tbody-tr">
      <td class="s-loyalty-points-history-table-tbody-tr-td"><div><span class="s-loyalty-points-history-mobile-title">النقاط:</span><span>${points} نقطة</span></div></td>
      <td class="s-loyalty-points-history-table-tbody-tr-td"><div><span>١٩ سبتمبر</span></div></td>
      <td class="s-loyalty-points-history-table-tbody-tr-td"><div><span></span></div></td>
      <td class="s-loyalty-points-history-table-tbody-tr-td"><div><span>شراء منتجات</span></div></td>
      <td class="s-loyalty-points-history-table-tbody-tr-td"><div><span>مكتملة</span></div></td>
    </tr>`;
}

function page(rows = '') {
  return `
    <section class="account-panel loyalty-balance">
      <strong class="loyalty-balance__points" data-testid="store-loyalty-points-count">1225</strong>
    </section>
    <span class="sr-only" role="status" aria-live="polite" data-loyalty-status></span>
    <section class="account-panel loyalty-history">
      <salla-loyalty-points-history>
        <table class="s-loyalty-points-history-table"><tbody>${rows}</tbody></table>
      </salla-loyalty-points-history>
    </section>`;
}

async function boot(html, translations = {}) {
  const dom = createDom({ html, pageSlug: 'loyalty', translations });

  await loadFresh(SOURCE);
  await flush();
  return dom;
}

afterEach(teardownDom);

describe('T-5.10 · the balance is the platform\'s number, not ours', () => {
  test('a successful exchange asks the platform for the new balance', async () => {
    const { control } = await boot(page());

    control.emit('loyalty::exchange.succeeded', { data: {} });

    assert.equal(control.calls.getPoints.length, 1, 'asked once');
  });

  test('the figure is replaced with what the platform returned', async () => {
    const { control } = await boot(page());

    control.emit('loyalty::points.fetched', { data: { points: 1175 } });

    assert.equal(
      document.querySelector('[data-testid="store-loyalty-points-count"]').textContent,
      '1175',
    );
  });

  test('the change is announced in the live region', async () => {
    const { control } = await boot(page(), {
      'theme.loyalty.balance_now': 'رصيدك الآن {points} نقطة.',
    });

    control.emit('loyalty::points.fetched', { data: { points: 1175 } });

    assert.equal(
      document.querySelector('[data-loyalty-status]').textContent,
      'رصيدك الآن 1175 نقطة.',
    );
  });

  test('a response with no points leaves the rendered figure alone', async () => {
    const { control } = await boot(page());

    control.emit('loyalty::points.fetched', { data: {} });

    assert.equal(
      document.querySelector('[data-testid="store-loyalty-points-count"]').textContent,
      '1225',
      'a balance the platform did not send is not a balance to display',
    );
  });

  test('a failed refresh does not blank the balance', async () => {
    const { control } = await boot(page());

    control.emit('loyalty::exchange.succeeded', { data: {} });
    control.rejectGetPoints();
    await flush();

    assert.equal(
      document.querySelector('[data-testid="store-loyalty-points-count"]').textContent,
      '1225',
    );
  });
});

describe('T-5.10 · the history row gains what the component does not render', () => {
  test('an earned row is read off the sign the component already wrote', async () => {
    await boot(page(historyRow('+120')), {
      'theme.loyalty.earned': 'كسب',
      'theme.loyalty.deducted': 'خصم',
    });

    assert.equal(document.querySelector('.loyalty-history__direction').textContent, 'كسب');
  });

  test('a deducted row takes the other word', async () => {
    await boot(page(historyRow('-50')), {
      'theme.loyalty.earned': 'كسب',
      'theme.loyalty.deducted': 'خصم',
    });

    assert.equal(document.querySelector('.loyalty-history__direction').textContent, 'خصم');
  });

  test('the two directions take different icons, and both are decorative', async () => {
    await boot(page(historyRow('+120') + historyRow('-50')));

    const tiles = [...document.querySelectorAll('.loyalty-history__icon')];

    assert.equal(tiles.length, 2);
    assert.notEqual(
      tiles[0].querySelector('i').className,
      tiles[1].querySelector('i').className,
    );
    tiles.forEach((tile) =>
      assert.equal(
        tile.getAttribute('aria-hidden'),
        'true',
        'the row already says «كسب» or «خصم» in text beside it',
      ),
    );
  });

  test('rows appended by «load more» are decorated too', async () => {
    await boot(page(historyRow('+120')));

    document
      .querySelector('.s-loyalty-points-history-table tbody')
      .insertAdjacentHTML('beforeend', historyRow('-50'));
    await flush();

    assert.equal(document.querySelectorAll('.loyalty-history__direction').length, 2);
  });

  test('a row is never decorated twice', async () => {
    await boot(page(historyRow('+120')));

    document.querySelector('.loyalty-history').append(document.createElement('span'));
    await flush();

    assert.equal(document.querySelectorAll('.loyalty-history__direction').length, 1);
  });
});

describe('T-5.10 · the script is inert off its own page', () => {
  test('a page whose slug is not loyalty is left alone', async () => {
    const dom = createDom({ html: page(historyRow('+120')), pageSlug: 'notifications' });

    await loadFresh(SOURCE);
    await flush();

    assert.equal(document.querySelector('.loyalty-history__direction'), null);
    assert.equal(dom.control.calls.getPoints.length, 0);
  });
});

/**
 * T-5.12 — the points-value sheet, which is `salla-loyalty`'s own prize picker
 * in its two drawn states.
 *
 * Two criteria, and neither is reachable from a stylesheet. «The inactive state
 * explains why rather than only disabling the control» is a sentence that has to
 * exist and be pointed at; and the rows the artboard draws are bare
 * `<div onClick>` in the component — **no `tabindex`, no `role`, no
 * `aria-checked`** — so a customer using a keyboard cannot redeem points at all.
 * These cases hold both fixes in place.
 */
function prizeSheet({ selected = -1, count = 3 } = {}) {
  const items = Array.from({ length: count }, (_, i) =>
    `<div class="s-loyalty-prize-item${i === selected ? ' s-loyalty-prize-item-selected' : ''}">
       <div class="s-loyalty-prize-item-title">${(i + 1) * 500} نقطة</div>
     </div>`).join('');

  return `<salla-loyalty><div class="s-loyalty-prizes">${items}</div>
    <button class="s-loyalty-program-redeem-btn">استبدل الآن</button></salla-loyalty>`;
}

describe('T-5.12 · the inactive state says why', () => {
  test('with nothing chosen, a reason is rendered and pointed at from the button', async () => {
    await boot(page() + prizeSheet(), { 'theme.loyalty.redeem_blocked': 'اختر مكافأة.' });

    const reason = document.querySelector('.loyalty-redeem__reason');
    const button = document.querySelector('.s-loyalty-program-redeem-btn');

    assert.ok(reason, 'a dead button with nothing beside it is a dead end');
    assert.equal(reason.textContent, 'اختر مكافأة.');
    assert.equal(button.getAttribute('aria-describedby'), reason.id);
  });

  test('choosing a prize removes it — a stale reason is worse than none', async () => {
    await boot(page() + prizeSheet({ selected: 1 }));

    assert.equal(document.querySelector('.loyalty-redeem__reason'), null);
    assert.equal(
      document.querySelector('.s-loyalty-program-redeem-btn').hasAttribute('aria-describedby'),
      false,
    );
  });

  test('the reason is not added twice', async () => {
    await boot(page() + prizeSheet());

    document.querySelector('salla-loyalty').append(document.createElement('span'));
    await flush();

    assert.equal(document.querySelectorAll('.loyalty-redeem__reason').length, 1);
  });
});

describe('T-5.12 · the prize rows become a real radio group', () => {
  test('each row is announced as a radio, and the group as a group', async () => {
    await boot(page() + prizeSheet({ selected: 0 }));

    const items = [...document.querySelectorAll('.s-loyalty-prize-item')];

    assert.deepEqual(items.map((i) => i.getAttribute('role')), ['radio', 'radio', 'radio']);
    assert.deepEqual(
      items.map((i) => i.getAttribute('aria-checked')),
      ['true', 'false', 'false'],
    );
    assert.equal(items[0].parentElement.getAttribute('role'), 'radiogroup');
  });

  test('the group is one tab stop — a roving tabindex, as a radio group has', async () => {
    await boot(page() + prizeSheet({ selected: 1 }));

    const items = [...document.querySelectorAll('.s-loyalty-prize-item')];

    assert.deepEqual(items.map((i) => i.getAttribute('tabindex')), ['-1', '0', '-1']);
  });

  test('with nothing chosen, the first row is the way in', async () => {
    await boot(page() + prizeSheet());

    assert.equal(
      document.querySelector('.s-loyalty-prize-item').getAttribute('tabindex'),
      '0',
      'an unreachable group is the defect this fixes',
    );
  });

  test('Enter activates the component\'s own handler rather than a second one', async () => {
    await boot(page() + prizeSheet());

    const item = document.querySelector('.s-loyalty-prize-item');
    let clicked = 0;

    item.addEventListener('click', () => {
      clicked += 1;
    });
    item.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    assert.equal(clicked, 1, 'keyboard and pointer must run the same code');
  });

  test('the arrows move within the group and wrap', async () => {
    await boot(page() + prizeSheet({ selected: 0 }));

    const items = [...document.querySelectorAll('.s-loyalty-prize-item')];
    let clicked = null;

    items.forEach((item, i) => item.addEventListener('click', () => {
      clicked = i;
    }));

    // RTL: ArrowLeft steps forward through the list.
    items[0].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    assert.equal(clicked, 1);

    items[0].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.equal(clicked, 2, 'and wraps');
  });
});

/**
 * T-5.13 — one redemption per confirmation.
 *
 * The component's own guard has a window in it: `exchangeLoyaltyPoint()` sets
 * `buttonLoading = true` and then awaits, and that flag reaches the button
 * through an **asynchronous** Stencil re-render — so two clicks in the same
 * frame both find a button that is not yet loading. On a points balance that is
 * a customer paying twice for one reward.
 *
 * The other half of the criteria is that a *failure* must be retryable, which is
 * why the flag clears on `exchange.failed` as well as on success.
 */
function confirmationSheet() {
  return `<salla-loyalty>
    <div class="s-loyalty-confirmation-actions">
      <salla-button fill="outline" class="cancel"><button type="button">إلغاء</button></salla-button>
      <salla-button class="confirm"><button type="button">تأكيد</button></salla-button>
    </div>
  </salla-loyalty>`;
}

/** Stands in for the component's own handler, which is bound on the button. */
function countConfirms() {
  const seen = { confirm: 0, cancel: 0 };

  document.querySelector('.confirm').addEventListener('click', () => {
    seen.confirm += 1;
  });
  document.querySelector('.cancel').addEventListener('click', () => {
    seen.cancel += 1;
  });
  return seen;
}

const click = (selector) =>
  document.querySelector(`${selector} button`).dispatchEvent(
    new window.MouseEvent('click', { bubbles: true, cancelable: true }),
  );

describe('T-5.13 · a double submission cannot double-spend', () => {
  test('the first confirmation reaches the component', async () => {
    await boot(page() + confirmationSheet());

    const seen = countConfirms();

    click('.confirm');

    assert.equal(seen.confirm, 1);
  });

  test('a second click in the same frame is swallowed', async () => {
    await boot(page() + confirmationSheet());

    const seen = countConfirms();

    click('.confirm');
    click('.confirm');
    click('.confirm');

    assert.equal(seen.confirm, 1, 'the window Stencil\'s async re-render leaves open');
  });

  test('a failed exchange is retryable — the guard clears on failure too', async () => {
    const { control } = await boot(page() + confirmationSheet());
    const seen = countConfirms();

    click('.confirm');
    control.emit('loyalty::exchange.failed', {});
    click('.confirm');

    assert.equal(seen.confirm, 2);
  });

  test('a successful exchange also clears it', async () => {
    const { control } = await boot(page() + confirmationSheet());
    const seen = countConfirms();

    click('.confirm');
    control.emit('loyalty::exchange.succeeded', { data: {} });
    click('.confirm');

    assert.equal(seen.confirm, 2);
  });

  test('cancel is never blocked, even mid-flight', async () => {
    await boot(page() + confirmationSheet());

    const seen = countConfirms();

    click('.confirm');
    click('.cancel');

    assert.equal(
      seen.cancel,
      1,
      'a customer who cannot leave a confirmation is worse off than one who submits twice',
    );
  });
});
