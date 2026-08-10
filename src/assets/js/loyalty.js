import BasePage from './base-page';

/**
 * T-5.10 — the loyalty page.
 *
 * WHAT UPSTREAM'S VERSION OF THIS FILE DID, AND WHY NONE OF IT SURVIVES. It ran
 * an `anime.js` timeline over `.loyality-item`, `.star-anime`, `.count-anime`
 * and `.btn-anime` — four selectors belonging to the gradient banner and the
 * ways-to-earn grid, **none of which the artboard draws** and none of which this
 * page now emits. Left in place it would have been a timeline over an empty set
 * on every visit. The counter is the part worth naming: it animated the balance
 * from `0`, so the accessible name of a customer's points was «0» until the
 * animation finished, and stayed «0» for anyone with reduced motion. The
 * criterion «points expressed as text» is met by the number simply being the
 * number.
 *
 * WHAT REPLACES IT IS TWO THINGS THE PAGE CANNOT DO WITHOUT SCRIPT.
 *
 * ONE — the balance has to be announced when it changes, and it changes off the
 * page: `salla-loyalty` runs the exchange inside its own modal, and on success
 * the number in the card above is stale. The platform says so through
 * `loyalty::exchange.succeeded`; the new figure comes from the platform's own
 * `getPoints()`, so nothing is recomputed here — a redemption's arithmetic stays
 * Salla's, which CLAUDE.md requires.
 *
 * TWO — the history rows need a direction word and an icon, and the component
 * renders neither. See `decorateHistory`.
 */
class Loyalty extends BasePage {
  onReady() {
    Loyalty.decorateHistory();
    Loyalty.watchHistory();
  }

  registerEvents() {
    salla.event.on('loyalty::exchange.succeeded', () => Loyalty.refreshBalance());
    salla.event.on('loyalty::points.fetched', response => Loyalty.showBalance(response));
  }

  /**
   * Ask the platform, do not do the arithmetic. A redemption's cost, any
   * rounding and any pending state are the loyalty programme's, and a theme that
   * subtracted the prize's `cost_points` from the number on screen would be
   * right until the first time it was not.
   */
  static refreshBalance() {
    salla.api.loyalty.getPoints().catch(() => {
      // The platform surfaces its own failure; what must not happen is the page
      // showing a balance it has invented in the meantime, and it does not —
      // the figure simply stays as it was rendered.
    });
  }

  static showBalance(response) {
    const points = response?.data?.points;
    const figure = document.querySelector('[data-testid="store-loyalty-points-count"]');
    const status = document.querySelector('[data-loyalty-status]');

    if (points === undefined || !figure) {
      return;
    }

    figure.textContent = points;

    if (status) {
      status.textContent = salla.lang.get('theme.loyalty.balance_now', { points });
    }
  }

  /**
   * THE HISTORY ROWS ARE MISSING TWO THINGS THE ARTBOARD DRAWS, AND ONLY ONE OF
   * THEM CAN BE RECOVERED.
   *
   * The artboard puts «كسب» or «خصم» under each amount and an icon tile at the
   * end of each row. The component renders neither: its cells are the points,
   * the date, the expiry, the translated note and the status.
   *
   * The direction **is** recoverable, because the component writes the sign
   * itself — `point.type === 'plus' ? '+' : ''` in front of the amount, and a
   * deduction carries its own minus. So earn and spend are read off the rendered
   * text rather than guessed at, and the word is a locale string rather than a
   * glyph in a stylesheet.
   *
   * The artboard's **five distinct icons** are not recoverable and are not
   * approximated with five guesses. They correspond to the transaction's `key`
   * — purchase, redemption, review, referral, rating — and the component renders
   * `translateKey(key)`, the *translated* note, never the key itself. Nothing in
   * the DOM carries it, `/balance/points` is fetched by the component rather
   * than by this theme, and fetching it a second time to decorate rows is a
   * second network request for data already on the page. **What ships is the two
   * states the data does support**, earn and spend, derived under B8 from the
   * sign; the five are recorded as unmet in /docs/DERIVED-DECISIONS.md with the
   * exact condition that would unblock them.
   */
  static decorateHistory() {
    document
      .querySelectorAll('.loyalty-history .s-loyalty-points-history-table-tbody-tr:not([data-loyalty-done])')
      .forEach(row => {
        const amount = row.querySelector('.s-loyalty-points-history-table-tbody-tr-td');

        if (!amount) {
          return;
        }

        row.setAttribute('data-loyalty-done', '');

        const earned = amount.textContent.includes('+');
        const direction = document.createElement('span');

        direction.className = 'loyalty-history__direction';
        direction.textContent = salla.lang.get(
          earned ? 'theme.loyalty.earned' : 'theme.loyalty.deducted',
        );
        amount.append(direction);

        const tile = document.createElement('span');

        tile.className = 'account-tile loyalty-history__icon';
        // Decorative: the row already says «كسب» or «خصم» in text beside it, and
        // an icon that restates its neighbour is read twice.
        tile.setAttribute('aria-hidden', 'true');
        tile.innerHTML = `<i class="ui-icon sicon-${earned ? 'dollar-coin-stack' : 'ticket'} text-xl"></i>`;
        row.append(tile);
      });
  }

  /**
   * The component fetches on mount and appends more on «load more», so the rows
   * arrive after this page's `onReady` and again later. `childList` with
   * `subtree` on the one section, rather than on the document.
   */
  static watchHistory() {
    const host = document.querySelector('.loyalty-history');

    if (!host) {
      return;
    }

    new MutationObserver(() => Loyalty.decorateHistory()).observe(host, {
      childList: true,
      subtree: true,
    });
  }
}

Loyalty.initiateWhenReady(['loyalty']);

export default Loyalty;
