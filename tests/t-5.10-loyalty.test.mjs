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
