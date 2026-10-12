/**
 * T-8.15 — the discount popup: when it opens, and copying the code.
 *
 * IT OPENS NOTHING ITSELF. `bottom-sheet::open` is T-2.10's own event, so the
 * scroll lock, the focus trap, `Esc`, the backdrop and focus restoration are all
 * that task's and none of them is written twice here. This file decides *whether
 * and when*, and handles one button.
 *
 * ── THE STORAGE KEY IS DERIVED FROM THE OFFER, NOT FIXED ────────────────────
 *
 * The same mechanism T-3.03 uses for the announcement bar, and it buys one
 * specific behaviour: the key is a hash of the popup's own content, so **editing
 * the offer shows it again to everyone who dismissed the old one.** A constant
 * key would silently withhold a new offer from every visitor who ever saw the
 * previous one — a merchant would change the code, see nothing, and have no way
 * to find out why.
 *
 * djb2 rather than a hash from a library, for the reason `master.twig` gives:
 * eight lines that depend on nothing beat a dependency for this.
 */
const STORAGE_PREFIX = 'am1als:discount-popup:';

class DiscountPopup {
  static boot() {
    const config = document.querySelector('[data-discount-popup]');

    // Disabled in the customiser, or no title, means the template rendered
    // neither this element nor the dialog. Nothing to do.
    if (!config) {
      return;
    }

    DiscountPopup.bindCopy();

    const once = config.getAttribute('data-once') === '1';
    const key = STORAGE_PREFIX + DiscountPopup.hash(config.getAttribute('data-signature') || '');

    if (once && DiscountPopup.seen(key)) {
      return;
    }

    /**
     * `Number()` and not `parseInt`: the manifest constrains this to 0–60, but a
     * value that somehow arrives as `''` or `null` must not become `NaN` and
     * schedule a timer that fires immediately. An unreadable delay falls back to
     * the same 5 seconds the customiser offers.
     */
    const delay = Number(config.getAttribute('data-delay'));
    const seconds = Number.isFinite(delay) && delay >= 0 ? delay : 5;

    window.setTimeout(() => DiscountPopup.open(once, key), seconds * 1000);
  }

  /**
   * ⚠ IT REFUSES TO OPEN OVER ANOTHER SHEET, AND IT DOES NOT QUEUE ITSELF.
   *
   * Quick view, sign-in and the filters drawer are all `[data-sheet][open]`. A
   * timer firing over one of them would either stack two modals or take focus
   * out of a task the visitor started. Waiting for the other to close is worse
   * still: a promotional overlay that ambushes someone the moment they dismiss a
   * product is more damaging than one they never saw.
   */
  static open(once, key) {
    if (document.querySelector('[data-sheet][open]')) {
      return;
    }

    /**
     * Marked seen on OPEN, not on close. A visitor who reads the code and
     * navigates away without pressing «إغلاق» has seen the offer, and
     * interrupting them again on the next page is the thing the setting exists
     * to prevent.
     */
    if (once) {
      DiscountPopup.remember(key);
    }

    salla.event.dispatch('bottom-sheet::open', 'discount-popup');
  }

  /**
   * THE FALLBACK IS REAL, NOT A SWALLOWED ERROR. `navigator.clipboard` needs a
   * secure context and can be refused outright. When it is unavailable or
   * rejects, the code is SELECTED and the live region says so, so a visitor on
   * an insecure origin can still press ⌘C. A button that silently does nothing
   * is worse than no button at all.
   */
  static bindCopy() {
    const button = document.querySelector('[data-discount-copy]');

    if (!button) {
      return;
    }

    button.addEventListener('click', () => {
      const code = button.getAttribute('data-code') || '';

      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        DiscountPopup.offerManualCopy();
        return;
      }

      navigator.clipboard.writeText(code).then(
        () => DiscountPopup.announce(salla.lang.get('theme.discount.copied')),
        () => DiscountPopup.offerManualCopy(),
      );
    });
  }

  static offerManualCopy() {
    const code = document.querySelector('[data-discount-code]');
    const selection = window.getSelection();

    if (code && selection) {
      const range = document.createRange();

      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    DiscountPopup.announce(salla.lang.get('theme.discount.copy_manually'));
  }

  static announce(message) {
    const status = document.querySelector('[data-discount-status]');

    if (status) {
      status.textContent = message;
    }
  }

  /**
   * Both storage calls are wrapped, because Safari's private mode throws on
   * `localStorage` access rather than returning null. The failure direction is
   * deliberate and matches T-3.03's: storage unavailable means the popup SHOWS.
   * A merchant's offer going unseen is a worse outcome than seeing it twice.
   */
  static seen(key) {
    try {
      return Boolean(window.localStorage.getItem(key));
    } catch {
      return false;
    }
  }

  static remember(key) {
    try {
      window.localStorage.setItem(key, '1');
    } catch {
      /* storage unavailable — the popup will show again, which is the safe side */
    }
  }

  static hash(text) {
    let value = 5381;

    for (let i = 0; i < text.length; i++) {
      value = ((value * 33) ^ text.charCodeAt(i)) >>> 0;
    }

    return value.toString(36);
  }
}

salla.onReady(() => DiscountPopup.boot());

export default DiscountPopup;
