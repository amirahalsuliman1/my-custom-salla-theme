/**
 * T-5.08 — the three things the notifications page needs that CSS cannot do.
 *
 * `salla-notifications` and `salla-notification-item` render into the light DOM,
 * so almost the whole design is reachable from a stylesheet and lives in
 * `04-components/notifications.scss`. What is left here is an attribute, a
 * string and a network write — none of which a stylesheet can add.
 *
 *   1. the promotional-messages switch's write path
 *   2. `<time datetime>` on every notification's date
 *   3. «غير مقروء» in the accessible name of an unread row
 *
 * Nothing here reimplements platform behaviour. The switch calls
 * `salla.profile.updateSettings({name, value})` — the same call, with the same
 * payload, that `salla-user-settings` makes. The timestamps come from the same
 * API response the component itself consumed.
 */
class Notifications {
  static boot() {
    Notifications.bootSwitch();
    Notifications.bootList();
  }

  /* ── the promotional-messages switch ─────────────────────────────────── */

  /**
   * `is_notifiable` is the customer's marketing-consent flag. The initial state
   * is server-rendered in the template from `user.is_notifiable`, so this only
   * ever handles the change.
   *
   * IT REVERTS ON FAILURE, WHICH SALLA'S OWN COMPONENT DOES NOT DO.
   * `salla-user-settings.toggleSetting()` fires the request and never looks at
   * the result, so a rejected write leaves a switch showing the opposite of
   * what was saved — and this is a consent setting, where that is the worst
   * possible thing for it to do. The control is disabled while the write is in
   * flight, so a fast second click cannot race it.
   */
  static bootSwitch() {
    const input = document.getElementById('promotional-messages');
    const status = document.querySelector('[data-notify-status]');

    if (!input) {
      return;
    }

    input.addEventListener('change', () => {
      const value = input.checked;

      input.disabled = true;

      salla.profile
        .updateSettings({ name: 'is_notifiable', value })
        .then(() => {
          if (status) {
            status.textContent = salla.lang.get(
              value ? 'theme.notifications.promotional_on' : 'theme.notifications.promotional_off',
            );
          }
        })
        .catch(() => {
          // The visible state has to go back to what is actually stored.
          input.checked = !value;

          // The failure is announced by the notifier rather than the live
          // region: it needs to be seen as well as heard, and T-2.12 already
          // made that toast the design's.
          salla.notify.error(salla.lang.get('theme.notifications.promotional_failed'));
        })
        .finally(() => {
          input.disabled = false;
        });
    });
  }

  /* ── the list ────────────────────────────────────────────────────────── */

  /**
   * THE MACHINE TIMESTAMP EXISTS AND THE COMPONENT THROWS IT AWAY. Salla's v2
   * notifications payload carries `created_at` (a Unix timestamp) alongside
   * `time_ago`, and `salla-notifications.normalizeNotification()` keeps only
   * `time_ago` — a human string. So the rendered row has relative text and no
   * machine-readable date, and `<time datetime>` cannot be produced from what
   * is in the DOM.
   *
   * It can be produced from what is on the wire. Both of the component's fetch
   * paths announce themselves globally: the first page through
   * `notifications::fetched`, and every page after it through
   * `infiniteScroll::load`. Both carry the raw, un-normalised response. This
   * keeps a lookup from that response and joins it to the rendered rows.
   *
   * **The join is by url + title, not by position.** A queue matched by arrival
   * order would silently attach the wrong date to a row if a request ever
   * resolved out of order, and a wrong timestamp is worse than none. A row with
   * no match keeps the platform's text and gains no `datetime` — nothing is
   * fabricated.
   *
   * The relative text is left exactly as the platform wrote it. Reformatting it
   * would be recomputing a value the platform owns, which this theme does not
   * do — and it is why the criterion asks for `<time datetime>` *with* relative
   * text rather than instead of it.
   */
  static bootList() {
    const host = document.querySelector('salla-notifications');

    if (!host) {
      return;
    }

    const stamps = new Map();

    const absorb = (response) => {
      const items = response?.data;

      if (!Array.isArray(items)) {
        return;
      }

      items.forEach((item) => {
        if (item?.created_at) {
          stamps.set(Notifications.key(item.url, item.title), item.created_at);
        }
      });

      // The response arrives before the rows do, but a re-render or a cached
      // response could reverse that, so sweep on both.
      Notifications.decorate(host, stamps);
    };

    salla.event.on('notifications::fetched', absorb);
    salla.event.on('infiniteScroll::load', absorb);

    new MutationObserver(() => Notifications.decorate(host, stamps)).observe(host, {
      childList: true,
      subtree: true,
    });

    Notifications.decorate(host, stamps);
  }

  static key(url, title) {
    return `${url || ''}\n${title || ''}`;
  }

  /**
   * THE TWO HALVES ARE IDEMPOTENT SEPARATELY, AND THEY HAVE TO BE.
   *
   * A single «this row is done» marker looks tidier and is wrong: the rows and
   * the response are two arrivals with no guaranteed order, and a row swept
   * before its stamp existed would be marked finished and never stamped. So the
   * label half marks itself, and the date half is idempotent by *its own
   * result* — a row that already holds a `<time>` is skipped, a row that does
   * not is tried again on the next sweep. Sweeping is cheap; a permanently
   * unstamped row is not recoverable.
   *
   * A row is touched only once its own `<a>` exists: the component appends the
   * custom element first and Stencil renders into it a tick later, so the
   * element can be in the DOM with nothing inside it.
   */
  static decorate(host, stamps) {
    host.querySelectorAll('salla-notification-item').forEach((item) => {
      const link = item.querySelector('.s-notifications-item');

      if (!link) {
        return;
      }

      Notifications.markUnread(link);
      Notifications.stampDate(link, stamps);
    });
  }

  /**
   * Unread is the absence of the component's own `-read` class. The stylesheet
   * carries this in weight as well as colour; this is the third channel, and
   * the only one a screen reader can use — an unread row would otherwise be
   * announced identically to a read one.
   */
  static markUnread(link) {
    const done = link.hasAttribute('data-notify-labelled');

    if (done || link.classList.contains('s-notifications-item-read')) {
      return;
    }

    const label = document.createElement('span');

    label.className = 'sr-only';
    label.textContent = salla.lang.get('theme.notifications.unread');
    link.setAttribute('data-notify-labelled', '');
    link.prepend(label);
  }

  static stampDate(link, stamps) {
    const trailing = link.querySelector('.s-notifications-item-content-trailing');

    // Idempotent by its own result rather than by a marker: see `decorate`.
    if (!trailing || trailing.querySelector('time')) {
      return;
    }

    const current = trailing.querySelector('span');
    const title = link.querySelector('h4')?.textContent?.trim();
    const stamp = stamps.get(Notifications.key(link.getAttribute('href'), title));

    if (!current || !stamp) {
      return;
    }

    const time = document.createElement('time');

    // The platform's own convention for this field, taken from the SDK rather
    // than assumed: a value above 1e12 is already milliseconds.
    time.dateTime = new Date(stamp > 1e12 ? stamp : stamp * 1000).toISOString();
    time.textContent = current.textContent;
    current.replaceWith(time);
  }
}

salla.onReady(() => Notifications.boot());

export default Notifications;
