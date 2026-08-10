/**
 * T-4.17 — the sort disclosure, shared.
 *
 * WHAT THE BROWSER DOES, AND WHAT IS LEFT. `<details>`/`<summary>` is a
 * disclosure: open and close, `aria-expanded` on the summary, keyboard
 * operation and `Esc` are all the UA's, and none of them is re-implemented here.
 * The same reasoning that made T-2.10 a `<dialog>` — take the element that
 * already has the behaviour, rather than build the behaviour onto a `<div>`.
 *
 * What is left is the part no element does for you: applying the choice, moving
 * the pressed state, and closing the panel afterwards.
 *
 * **IT IS SHARED BY DESIGN.** T-4.17's entry says the brand page's sort control
 * «is the same disclosure pattern as the orders status filter in T-6.01 — share
 * it». T-6.01 does not exist yet, so this is the shared one, built here and
 * bound to any `[data-sort-disclosure]` on the page. That task consumes it and
 * writes no second copy.
 *
 * It boots on every page and does nothing where the markup is absent, which is
 * what lets one file in the `app` entry serve two pages in different phases.
 */
class SortDisclosure {
  static boot() {
    if (!document.querySelector('[data-sort-disclosure]')) {
      return;
    }

    /**
     * Delegated: the brand grid is a web component and the disclosure may be
     * re-rendered around it, and T-6.01's list arrives later still.
     */
    document.addEventListener('click', (event) => {
      const option = event.target.closest?.('[data-sort-option]');
      const panel = option?.closest('[data-sort-disclosure]');

      if (!option || !panel) {
        return;
      }

      SortDisclosure.apply(panel, option);
    });
  }

  static apply(panel, option) {
    const value = option.getAttribute('data-sort-option');
    const list = document.querySelector('salla-products-list');

    // The pressed state moves rather than accumulating: exactly one option is
    // ever `aria-pressed="true"`, which is what makes the check mark a state
    // and not a decoration.
    panel.querySelectorAll('[data-sort-option]').forEach((el) => {
      el.setAttribute('aria-pressed', el === option ? 'true' : 'false');
    });

    const current = panel.querySelector('[data-sort-current]');

    if (current) {
      current.textContent = option.textContent.trim();
    }

    /**
     * The URL is pushed rather than replaced, for T-4.18's reason: replacing
     * leaves nothing to go back to, so Back would leave the page instead of
     * undoing the sort.
     */
    if (salla.helpers?.addParamToUrl) {
      window.history.pushState(null, null, salla.helpers.addParamToUrl('sort', value));
    }

    if (list) {
      list.sortBy = value;
      list.reload?.();
    }

    // Closing is the disclosure's own state, so it is one property rather than
    // a class and an attribute kept in step.
    panel.open = false;
  }
}

salla.onReady(() => SortDisclosure.boot());

export default SortDisclosure;
