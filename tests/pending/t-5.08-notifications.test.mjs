/**
 * T-5.08 — the notifications page's three pieces of behaviour.
 *
 * The template is markup and the stylesheet is a box; what is worth a test is
 * everything `partials/notifications.js` does, because each of the three is a
 * claim about a component this theme does not own.
 *
 *   · the switch writes `{name, value}` through `salla.profile.updateSettings`,
 *     and **reverts when the platform says no** — the one behaviour Salla's own
 *     `salla-user-settings` does not have, on a consent setting where a control
 *     showing the opposite of what is stored is the worst possible outcome
 *   · `<time datetime>` is joined to a row from the raw API response, by url and
 *     title rather than by arrival order, and is **absent rather than invented**
 *     when the response carries no `created_at`
 *   · an unread row carries «غير مقروء» in its accessible name
 *
 * `salla-notification-item` here is inert markup, not a stub of the real Stencil
 * component: what is under test is the theme sweeping rows the component has
 * already rendered, so the rows only have to be shaped the way it renders them.
 * That shape is transcribed from `salla-notification-item.js` — an `<a>` on
 * `.s-notifications-item`, `-read` when the notification is not new, the title
 * in an `<h4>`, and the date in a bare `<span>` inside `-content-trailing`.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/notifications.js';

/** One row, in the shape `salla-notification-item` renders. */
function row({ url, title, body, read = false, date = 'منذ يومين' }) {
  return `
    <salla-notification-item class="s-block">
      <a href="${url}" class="s-notifications-item s-notifications-item-shadow${read ? ' s-notifications-item-read' : ''}">
        <span class="s-notifications-item-icon"><i class="s-notifications-item-icon sicon-bell-ring"></i></span>
        <div class="s-notifications-item-content">
          <div class="s-notifications-item-content-leading"><h4>${title}</h4><p>${body}</p></div>
          <span class="s-notifications-item-content-trailing">
            <i class="sicon-time s-notifications-item-content-trailing-icon"></i>
            <span>${date}</span>
          </span>
        </div>
      </a>
    </salla-notification-item>`;
}

function page(rows = '') {
  return `
    <section class="notify-panel notify-prefs">
      <div class="notify-prefs__row">
        <label class="choice choice--switch" for="promotional-messages">
          <input class="choice__control" type="checkbox" id="promotional-messages" role="switch" checked>
          <span class="choice__body"><span class="choice__label">الرسائل الترويجية</span></span>
        </label>
      </div>
    </section>
    <span class="sr-only" role="status" aria-live="polite" data-notify-status></span>
    <section class="notify-panel notifications">
      <salla-notifications data-testid="store-notifications">
        <div class="s-notifications-wrapper"><div class="s-notifications-container">${rows}</div></div>
      </salla-notifications>
    </section>`;
}

async function boot(html) {
  const dom = createDom({ html, pageSlug: 'notifications' });

  await loadFresh(SOURCE);
  await flush();
  return dom;
}

afterEach(teardownDom);

describe('T-5.08 · the promotional-messages switch', () => {
  test('a change writes the platform\'s own payload shape', async () => {
    const { control } = await boot(page());
    const input = document.getElementById('promotional-messages');

    input.checked = false;
    input.dispatchEvent(new window.Event('change'));

    assert.deepEqual(control.calls.updateSettings, [{ name: 'is_notifiable', value: false }]);
  });

  test('the control is disabled while the write is in flight, so a second click cannot race it', async () => {
    const { control } = await boot(page());
    const input = document.getElementById('promotional-messages');

    input.checked = false;
    input.dispatchEvent(new window.Event('change'));

    assert.equal(input.disabled, true, 'disabled while pending');

    control.resolveUpdateSettings();
    await flush();

    assert.equal(input.disabled, false, 'released once settled');
  });

  test('success is announced in the live region and the switch keeps its new state', async () => {
    const { control } = await boot(page());
    const input = document.getElementById('promotional-messages');

    input.checked = false;
    input.dispatchEvent(new window.Event('change'));
    control.resolveUpdateSettings();
    await flush();

    assert.equal(input.checked, false);
    assert.equal(
      document.querySelector('[data-notify-status]').textContent,
      'theme.notifications.promotional_off',
    );
  });

  test('turning it ON announces the on message, not the off one', async () => {
    const { control } = await boot(page());
    const input = document.getElementById('promotional-messages');

    input.checked = true;
    input.dispatchEvent(new window.Event('change'));
    control.resolveUpdateSettings();
    await flush();

    assert.equal(
      document.querySelector('[data-notify-status]').textContent,
      'theme.notifications.promotional_on',
    );
  });

  /**
   * The case this file exists for. A rejected write must leave the switch
   * showing what is actually stored — the opposite is a customer believing they
   * opted out of marketing when they did not.
   */
  test('a rejected write reverts the switch and surfaces the failure visibly', async () => {
    const { control } = await boot(page());
    const input = document.getElementById('promotional-messages');

    input.checked = false;
    input.dispatchEvent(new window.Event('change'));
    control.rejectUpdateSettings();
    await flush();

    assert.equal(input.checked, true, 'reverted to the stored value');
    assert.deepEqual(control.calls.notifyError, ['theme.notifications.promotional_failed']);
    assert.equal(
      document.querySelector('[data-notify-status]').textContent,
      '',
      'not also announced in the live region — one failure, one message',
    );
  });
});

describe('T-5.08 · the timestamp', () => {
  const NOTIFICATION = {
    url: 'https://example.test/n/1',
    title: 'تم تسليم الطلب',
    body: 'تم تسليم طلبك',
    time_ago: 'منذ يومين',
    created_at: 1757289600,
    is_read: true,
  };

  test('the raw created_at becomes a datetime, and the platform\'s relative text is kept', async () => {
    const { control } = await boot(page(row({ ...NOTIFICATION, read: true })));

    control.emit('notifications::fetched', { cursor: { next: null }, data: [NOTIFICATION] });
    await flush();

    const time = document.querySelector('.s-notifications-item-content-trailing time');

    assert.ok(time, 'the bare span became a <time>');
    assert.equal(time.getAttribute('datetime'), new Date(1757289600 * 1000).toISOString());
    assert.equal(time.textContent.trim(), 'منذ يومين', 'relative text untouched');
  });

  test('a later page arrives through infiniteScroll::load and is stamped too', async () => {
    const { control } = await boot(page(row({ ...NOTIFICATION, read: true })));

    control.emit('infiniteScroll::load', { cursor: { next: null }, data: [NOTIFICATION] });
    await flush();

    assert.ok(document.querySelector('.s-notifications-item-content-trailing time'));
  });

  /**
   * The join is by url and title. If it were by arrival order, a response that
   * resolved out of order would put one notification's date on another — and a
   * wrong timestamp is worse than no timestamp.
   */
  test('a row with no matching response entry keeps its text and gains no datetime', async () => {
    const { control } = await boot(page(row({ ...NOTIFICATION, read: true })));

    control.emit('notifications::fetched', {
      cursor: { next: null },
      data: [{ ...NOTIFICATION, url: 'https://example.test/n/999' }],
    });
    await flush();

    assert.equal(document.querySelector('.s-notifications-item-content-trailing time'), null);
    assert.match(
      document.querySelector('.s-notifications-item-content-trailing').textContent,
      /منذ يومين/,
    );
  });

  test('a legacy response with no created_at fabricates nothing', async () => {
    const { control } = await boot(page(row({ ...NOTIFICATION, read: true })));

    control.emit('notifications::fetched', {
      data: [{ url: NOTIFICATION.url, title: NOTIFICATION.title, date: 'منذ يومين' }],
    });
    await flush();

    assert.equal(document.querySelector('.s-notifications-item-content-trailing time'), null);
  });

  test('a row rendered after the response is still stamped', async () => {
    const { control } = await boot(page());

    control.emit('notifications::fetched', { cursor: { next: null }, data: [NOTIFICATION] });
    await flush();

    document.querySelector('.s-notifications-container').innerHTML = row({
      ...NOTIFICATION,
      read: true,
    });
    await flush();

    assert.ok(
      document.querySelector('.s-notifications-item-content-trailing time'),
      'the observer swept the row the component appended later',
    );
  });
});

describe('T-5.08 · read and unread', () => {
  test('an unread row says so in text, not only in colour', async () => {
    await boot(page(row({ url: '/n/1', title: 'تأكيد الطلب', body: 'تم', read: false })));

    const link = document.querySelector('.s-notifications-item');

    assert.equal(link.firstElementChild.className, 'sr-only');
    assert.equal(link.firstElementChild.textContent, 'theme.notifications.unread');
  });

  test('a read row carries no such label', async () => {
    await boot(page(row({ url: '/n/1', title: 'تأكيد الطلب', body: 'تم', read: true })));

    assert.equal(document.querySelector('.s-notifications-item .sr-only'), null);
  });

  test('the sweep is idempotent — the label is not added twice', async () => {
    const { control } = await boot(page(row({ url: '/n/1', title: 'ت', body: 'ت', read: false })));

    control.emit('notifications::fetched', { cursor: { next: null }, data: [] });
    await flush();

    assert.equal(document.querySelectorAll('.s-notifications-item .sr-only').length, 1);
  });
});

describe('T-5.08 · the partial is inert where it does not apply', () => {
  test('a page with neither the switch nor the list boots without throwing', async () => {
    await boot('<div></div>');

    assert.ok(true);
  });
});
