/**
 * T-5.11 — the points-earned popup, and the one thing its criterion actually asks.
 *
 * «TRIGGERED BY A REAL LOYALTY EVENT, NEVER ON A TIMER» IS THE WHOLE TASK, and
 * the platform makes it harder than it sounds: **there is no `points earned`
 * event.** `salla.event.loyalty` carries `exchangeSucceeded`, `programFetched`,
 * `resetSucceeded` and `loyaltyPointsFetched` — a redemption, a programme, a
 * reset, and a balance. Nothing announces an award.
 *
 * So the trigger is built out of two facts the platform *does* state, and no
 * third one is invented:
 *
 *   1. **something happened that awards points** — `rating::store.rated`,
 *      `rating::products.rated` or `rating::shipping.rated`, which is the flow
 *      `Points Earned Pop-up.pdf` draws it over («تقييم الطلب»);
 *   2. **the balance actually went up** — read from `getPoints()`, compared with
 *      the balance the page was rendered with.
 *
 * **Both are required.** A rating alone is not an award: a store may not award
 * points for reviews at all, or may have already awarded them for this order,
 * and a popup saying «لقد ربحت 100 نقطة» when nothing was earned is worse than
 * no popup. An increase alone is not enough either — it would fire on any page
 * that happened to refresh the balance.
 *
 * **The number in the message is a subtraction of two platform values, not an
 * estimate.** The theme never decides how many points a rating is worth; it
 * reports the difference between what the platform said before and what it says
 * after. Where the difference cannot be computed — the page was rendered without
 * a balance — the dialog does not open, because the artboard's sentence has a
 * number in it and a sentence with a blank where the number goes is not a
 * sentence.
 */
class LoyaltyPopup {
  static boot() {
    const dialog = document.getElementById('loyalty-earned-dialog');

    if (!dialog) {
      return;
    }

    // The balance the page was rendered with. `salla.config` is the platform's
    // own copy of the customer, synced by `syncUserData`, so this is the same
    // number the template printed rather than a second source for it.
    let known = salla.config.get('user.loyalty_points');
    let awaiting = false;

    ['store.rated', 'products.rated', 'shipping.rated'].forEach(event => {
      salla.event.on(`rating::${event}`, () => {
        awaiting = true;
        salla.api.loyalty.getPoints().catch(() => {
          awaiting = false;
        });
      });
    });

    salla.event.on('loyalty::points.fetched', response => {
      const points = response?.data?.points;

      if (!awaiting || points === undefined) {
        // Still worth keeping the balance current: a fetch this popup did not
        // ask for is exactly how it learns what «before» means next time.
        if (points !== undefined) {
          known = points;
        }

        return;
      }

      awaiting = false;

      const earned = LoyaltyPopup.difference(known, points);

      known = points;

      if (!earned) {
        return;
      }

      LoyaltyPopup.open(dialog, earned);
    });
  }

  /** The award, or nothing. Never a negative, and never a guess. */
  static difference(before, after) {
    if (before === undefined || before === null) {
      return 0;
    }

    return Math.max(0, Number(after) - Number(before));
  }

  /**
   * Focus return costs nothing here and that is not luck: `showModal()` restores
   * focus to whatever had it, and T-2.10's lock is `overflow: hidden` rather than
   * `position: fixed`, so the rating form is still where the customer left it.
   * The same two properties T-7.07 relied on.
   */
  static open(dialog, earned) {
    const message = dialog.querySelector('.dialog__message');

    if (message) {
      message.textContent = salla.lang.get('theme.loyalty.earned_message', { points: earned });
    }

    if (dialog.showModal && !dialog.open) {
      dialog.showModal();
    }
  }
}

salla.onReady(() => LoyaltyPopup.boot());

export default LoyaltyPopup;
