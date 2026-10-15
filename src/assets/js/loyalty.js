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
    Loyalty.watchRedeemSheet();
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

    if (points === undefined) {
      return;
    }

    // The sheet's «رصيدك الحالي» sentence follows the same platform figure, so
    // it never states a balance the card beside it has already corrected.
    Loyalty.balance = points;

    const sentence = document.getElementById('loyalty-redeem-balance');

    if (sentence) {
      sentence.textContent = salla.lang.get('theme.loyalty.current_balance', { points });
    }

    const figure = document.querySelector('[data-testid="store-loyalty-points-count"]');
    const status = document.querySelector('[data-loyalty-status]');

    if (!figure) {
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
   * start of each row. The component renders neither: its cells are the points,
   * the date, the expiry, the translated note and the status. (The tile is
   * appended last in the DOM; the stylesheet places it at the inline start.)
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

        // The modifier is what the desktop table's pill is coloured by — green
        // for an award, red for a deduction, as `Desktop Loyalty Points Page`
        // draws it. The word itself carries the meaning; the colour repeats it.
        direction.className = `loyalty-history__direction loyalty-history__direction--${earned ? 'earn' : 'deduct'}`;
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

  /* ── T-5.12 · the points-value sheet ─────────────────────────────────── */

  /**
   * `salla-loyalty`'s prize picker IS the two artboards. It already renders its
   * redeem control `disabled={!this.selectedItem}`, so «InActive» and «Active»
   * are its own pair rather than a second component. What it does not do is the
   * two things this task's criteria ask for, and neither is reachable from a
   * stylesheet.
   *
   * ONE — «the inactive state explains WHY rather than only disabling the
   * control». A dead button with nothing beside it is a dead end: the customer
   * can see that they cannot redeem and cannot see what to do about it. A line
   * is added next to it and pointed at with `aria-describedby`, so the reason
   * reaches a screen reader **at the control** rather than merely sitting near it
   * on screen.
   *
   * TWO — the rows are not operable by keyboard at all, and that is a defect in
   * the component rather than a gap in the design. Each prize is a bare
   * `<div onClick>`: no `tabindex`, no `role`, no `aria-checked`. **A customer
   * using a keyboard cannot redeem points in this store**, and no amount of CSS
   * changes that. They are promoted to a real radio group here — focusable,
   * announced, and operable with Enter, Space and the arrow keys.
   */
  static watchRedeemSheet() {
    const host = document.querySelector('salla-loyalty');

    if (!host) {
      return;
    }

    Loyalty.guardDoubleSubmit();

    // Nothing to upgrade once the page's own `salla-loyalty` has gone.
    const sweep = () => host.isConnected && Loyalty.upgradeRedeemSheet(host);
    const observer = new MutationObserver(sweep);
    const watched = new Set();
    const adopt = () =>
      Loyalty.sheetRoots(host).forEach(root => {
        if (watched.has(root)) {
          return;
        }

        watched.add(root);
        observer.observe(root, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'disabled'],
        });
      });

    adopt();

    // The modals reach `<body>` after this page boots — `salla-modal` moves
    // itself there in its own `componentDidLoad` — so `<body>`'s own children
    // are watched, one level deep, for them to arrive.
    new MutationObserver(() => {
      if (host.isConnected) {
        adopt();
        sweep();
      }
    }).observe(document.body, { childList: true });

    sweep();
  }

  /**
   * WHERE THE SHEET ACTUALLY IS. `salla-loyalty` renders its prize picker and its
   * confirmation step into two `salla-modal`s, and **`salla-modal` moves itself
   * to `<body>` in its own `componentDidLoad`** — «we need the modal to be
   * outside the forms», says the component (twilight-components 2.14). So by the
   * time a customer can open either one, it is no longer inside `salla-loyalty`,
   * and a search of that element finds nothing. Both are found by what they
   * hold: the loyalty header or skeleton, the prize rows, or the confirmation
   * actions — classes only `salla-loyalty` writes.
   */
  static sheetRoots(host) {
    const marks = '.s-loyalty-header, .s-loyalty-skeleton, .s-loyalty-prize-item, .s-loyalty-confirmation-actions';
    const modals = [...document.querySelectorAll('salla-modal')].filter(
      modal => !host.contains(modal) && modal.querySelector(marks),
    );

    return [host, ...modals];
  }

  static find(roots, selector) {
    return roots.flatMap(root => [...root.querySelectorAll(selector)]);
  }

  static upgradeRedeemSheet(host) {
    const roots = Loyalty.sheetRoots(host);
    // The loading skeleton draws three placeholder cards with the row's own
    // class. They are not choices, and are never announced as radios.
    const items = Loyalty.find(roots, '.s-loyalty-prize-item').filter(item => !item.closest('.s-loyalty-skeleton'));
    const button = Loyalty.find(roots, '.s-loyalty-program-redeem-btn')[0];

    if (items.length) {
      Loyalty.upgradeChoices(items);
      Loyalty.statePoints(host, items);
    }

    Loyalty.explainRedeem(button, items);
    Loyalty.addDismiss(host, button);
  }

  /**
   * «رصيدك الحالي: 1225 نقطة ولاء.» — what all four artboards draw between the
   * sheet's title and its first row. The component's header carries the
   * programme's promotion copy and no balance, so the sentence is added here,
   * once, ahead of the prize group. The figure is never worked out: it is the
   * balance the page was rendered with (`customer-points`, the same value the
   * card shows), and after an exchange it is whatever the platform's own
   * `getPoints()` said — see `showBalance`. A page rendered without a balance
   * gets no sentence rather than one with a blank in it.
   *
   * The radio group points at it with `aria-describedby`, so a screen reader
   * entering the choices hears what there is to spend.
   */
  static statePoints(host, items) {
    const group = items[0].parentElement;
    const points = Loyalty.balance ?? host.getAttribute('customer-points');

    if (!group || points === null || points === undefined || points === '') {
      return;
    }

    let sentence = document.getElementById('loyalty-redeem-balance');

    if (!sentence) {
      sentence = document.createElement('p');
      sentence.className = 'loyalty-redeem__balance';
      sentence.id = 'loyalty-redeem-balance';
      sentence.textContent = salla.lang.get('theme.loyalty.current_balance', { points });
      // Ahead of the tabs, not inside them: the sentence is about the whole
      // catalogue, and it must not page away with one group.
      (group.closest('salla-tabs') || group).before(sentence);
    }

    group.setAttribute('aria-describedby', sentence.id);
  }

  /**
   * «إغلاق», the neutral half of the footer every artboard draws — beside the
   * redeem button, at the inline start. The component renders only the redeem
   * button, and its modal's header ✕ is the one way out; the design draws both.
   *
   * It is the theme's own neutral `.btn`, inserted as the redeem button's
   * sibling rather than wrapping it: Stencil re-renders that button on every
   * selection and would lose a node it no longer finds where it left it. It
   * closes through the component's own `close()`, so nothing about the modal's
   * state is decided here.
   */
  static addDismiss(host, button) {
    if (!button || button.parentElement?.querySelector(':scope > .loyalty-redeem__close')) {
      return;
    }

    const close = document.createElement('button');
    const label = document.createElement('span');

    close.type = 'button';
    close.className = 'btn btn--neutral loyalty-redeem__close';
    label.className = 'btn__label';
    label.textContent = salla.lang.get('theme.common.close');
    close.append(label);
    close.addEventListener('click', () => host.close());
    button.before(close);
  }

  /**
   * A radio group rather than a list of buttons, because exactly one prize can
   * be chosen — which is what `aria-checked` says and what the arrow keys imply.
   * The click handler is the component's own and is never replaced: keyboard
   * activation calls `click()` so both paths run the same code, and a future
   * change to `setSelectedPrizeItem` needs no change here.
   */
  static upgradeChoices(items) {
    items.forEach((item, index) => {
      const selected = item.classList.contains('s-loyalty-prize-item-selected');

      item.setAttribute('role', 'radio');
      item.setAttribute('aria-checked', selected ? 'true' : 'false');
      // Roving tabindex: the group is one tab stop, and the arrows move within
      // it — the pattern a radio group is expected to have.
      item.setAttribute('tabindex', selected || (index === 0 && !items.some(Loyalty.isSelected)) ? '0' : '-1');

      // `hasAttribute` and not the dataset value: an empty-string marker is
      // falsy, and a truthiness check on it would re-bind the handler on every
      // sweep — which the observer runs often, because this method's own
      // sibling adds a node.
      if (item.hasAttribute('data-loyalty-keys')) {
        return;
      }

      item.setAttribute('data-loyalty-keys', '');
      item.addEventListener('keydown', event => Loyalty.onChoiceKey(event, item));
    });

    const group = items[0]?.parentElement;

    if (group && !group.hasAttribute('role')) {
      group.setAttribute('role', 'radiogroup');
      group.setAttribute('aria-label', salla.lang.get('theme.loyalty.redeem_options'));
    }
  }

  /* ── T-5.13 · one redemption per confirmation ────────────────────────── */

  /**
   * «REDEMPTION IS IDEMPOTENT — DOUBLE SUBMISSION CANNOT DOUBLE-SPEND», and the
   * component's own guard has a window in it.
   *
   * `exchangeLoyaltyPoint()` sets `buttonLoading = true` and then awaits the
   * request. That flag reaches the button through a **Stencil re-render, which
   * is asynchronous** — so two clicks landing in the same frame both find a
   * button that is not yet loading, and both fire the exchange. On a points
   * balance that is a customer paying twice for one reward.
   *
   * The guard is a capture-phase listener, which runs **before** the
   * component's own handler on the button and can therefore stop it. The first
   * confirmation goes through untouched; anything after it is swallowed until
   * the platform says the flow ended, either way. **Nothing is re-implemented:**
   * this cancels a duplicate event, it does not perform, retry or reconcile an
   * exchange.
   *
   * It listens on the document, not on `salla-loyalty`: the confirmation is a
   * `salla-modal`, which moves itself to `<body>` once loaded (see
   * `sheetRoots`), so a click on it never passes through `salla-loyalty` at all
   * — a listener there would never have run on a live store.
   *
   * It clears on `exchange.succeeded` **and** on `exchange.failed`, because a
   * failed redemption must be retryable — which is the second half of this
   * task's criteria, and the reason the flag is not simply set once and left.
   */
  static guardDoubleSubmit() {
    if (Loyalty.guarded) {
      return;
    }

    Loyalty.guarded = true;

    document.addEventListener(
      'click',
      event => {
        if (!event.target.closest?.('.s-loyalty-confirmation-actions')) {
          return;
        }

        // The cancel control shares that container and must never be blocked:
        // a customer who cannot get out of a confirmation is worse off than one
        // who can submit it twice.
        if (event.target.closest('salla-button')?.getAttribute('fill') === 'outline') {
          return;
        }

        if (Loyalty.exchanging) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }

        Loyalty.exchanging = true;
      },
      true,
    );

    ['exchange.succeeded', 'exchange.failed'].forEach(event =>
      salla.event.on(`loyalty::${event}`, () => {
        Loyalty.exchanging = false;
      }),
    );
  }

  static isSelected(item) {
    return item.classList.contains('s-loyalty-prize-item-selected');
  }

  static onChoiceKey(event, item) {
    const items = [...item.parentElement.querySelectorAll('.s-loyalty-prize-item')];
    const index = items.indexOf(item);
    const step = { ArrowRight: -1, ArrowLeft: 1, ArrowDown: 1, ArrowUp: -1 }[event.key];

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      item.click();
      return;
    }

    if (step === undefined) {
      return;
    }

    event.preventDefault();

    // Wraps, as a radio group does. `ArrowRight` steps backwards because the
    // sheet is RTL — the theme's own direction, not a browser default to lean on.
    const next = items[(index + step + items.length) % items.length];

    next.focus();
    next.click();
  }

  /**
   * The reason, and only while there is one. It is removed as soon as a prize is
   * chosen, because a stale explanation beside a live button is worse than none.
   */
  static explainRedeem(button, items) {
    if (!button) {
      return;
    }

    const blocked = items.length > 0 && !items.some(Loyalty.isSelected);
    const existing = document.getElementById('loyalty-redeem-reason');

    if (!blocked) {
      existing?.remove();
      button.removeAttribute('aria-describedby');
      return;
    }

    if (existing) {
      return;
    }

    const reason = document.createElement('p');

    reason.className = 'loyalty-redeem__reason';
    reason.id = 'loyalty-redeem-reason';
    reason.textContent = salla.lang.get('theme.loyalty.redeem_blocked');
    button.after(reason);
    button.setAttribute('aria-describedby', reason.id);
  }
}

/** T-5.13 — one exchange in flight at a time. See `guardDoubleSubmit`. */
Loyalty.exchanging = false;
Loyalty.guarded = false;

/**
 * The last balance the platform stated on this page, once it has stated one —
 * `undefined` until then, and the sheet reads the rendered `customer-points`.
 */
Loyalty.balance = undefined;

Loyalty.initiateWhenReady(['loyalty']);

export default Loyalty;
