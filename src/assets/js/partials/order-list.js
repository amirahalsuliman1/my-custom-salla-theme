/**
 * T-6.01 — the orders list: the grouping the filter applies, and the card's own
 * collapse.
 *
 * THE THREE GROUPS ARE DERIVED FROM FLAGS, BECAUSE THE ALTERNATIVE IS A GUESS
 * THAT FAILS SILENTLY. «طلبات بانتظار الدفع», «طلبات قيد التنفيذ» and «الطلبات
 * السابقة» are not statuses — no status is named «سابقة» — so something has to
 * decide which group an order is in. Two ways were available and only one of
 * them is honest:
 *
 *   · **by status slug.** The theme would need to know which of the store's
 *     statuses count as finished. Status *ids* are per-store, slugs are not
 *     enumerated in the SDK, and a merchant can add statuses of their own. A map
 *     written here would silently misfile every status it had not been told
 *     about.
 *   · **by the order's own booleans**, which is what this does:
 *
 *       is_pending_payment  → بانتظار الدفع
 *       can_cancel          → قيد التنفيذ    (still cancellable ⇒ not finished)
 *       neither             → سابقة
 *
 * **The second rule has a known edge and it is stated rather than hidden:** a
 * store that forbids cancellation outright leaves `can_cancel` false everywhere,
 * and every paid order then reads as «سابقة». That is a wrong grouping, not a
 * crash, and it is visible to the merchant the moment they look at the page —
 * which is a better failure than a URL parameter the platform ignores, where the
 * page reloads and nothing changes at all. Raised as OP-10.
 *
 * IT FILTERS WHAT IS LOADED, AND SAYS SO BY RE-FILTERING. `salla-infinite-scroll`
 * appends the next page into the same container, so new cards would arrive
 * ignoring the current group. The observer below re-applies on every append,
 * which is the difference between a filter and a one-off sweep.
 */
class OrderList {
  static get GROUPS() {
    return ['previous', 'in_progress', 'pending_payment'];
  }

  static get DEFAULT_GROUP() {
    return 'previous';
  }

  static boot() {
    const list = document.querySelector('[data-orders-list]');

    if (!list) {
      return;
    }

    OrderList.bindToggles();
    OrderList.bindFilter(list);
    OrderList.apply(list, OrderList.groupFromUrl());
  }

  /**
   * THE COLLAPSE. The button ships `hidden` so a card without this script is a
   * card rather than a dead control; revealing it here is the enhancement, and
   * it is the first thing done so it happens even if nothing else does.
   *
   * Delegated on the document for the reason the disclosure is: the next page of
   * orders is appended after this runs, and its buttons must work too.
   */
  static bindToggles() {
    document.querySelectorAll('[data-order-toggle]').forEach(button => button.removeAttribute('hidden'));

    document.addEventListener('click', event => {
      const toggle = event.target.closest?.('[data-order-toggle]');

      if (!toggle) {
        return;
      }

      const body = document.getElementById(toggle.getAttribute('aria-controls'));
      const open = toggle.getAttribute('aria-expanded') === 'true';

      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');

      // `hidden` rather than a class: a collapsed card must leave the
      // accessibility tree, or it is only visually collapsed.
      if (body) {
        body.hidden = open;
      }
    });
  }

  static bindFilter(list) {
    document.addEventListener('sort-disclosure::applied', event => {
      if (event.detail?.param === 'orders') {
        OrderList.apply(list, event.detail.value);
      }
    });

    /**
     * «ITS SELECTION SURVIVES BACK-NAVIGATION» — the disclosure pushes the choice
     * into the URL, so Back restores a URL this page can read. Without this
     * listener Back would change the address bar and leave the list as it was.
     */
    window.addEventListener('popstate', () => OrderList.apply(list, OrderList.groupFromUrl()));

    document.addEventListener('click', event => {
      if (event.target.closest?.('[data-orders-reset]')) {
        OrderList.select(OrderList.DEFAULT_GROUP);
        OrderList.apply(list, OrderList.DEFAULT_GROUP);
      }
    });

    // Re-apply when infinite scroll appends the next page.
    new MutationObserver(() => OrderList.apply(list, OrderList.current)).observe(list, { childList: true });
  }

  static groupFromUrl() {
    const value = new URL(window.location.href).searchParams.get('orders');

    return OrderList.GROUPS.includes(value) ? value : OrderList.DEFAULT_GROUP;
  }

  /** Which group one card belongs to. The whole classification, in one place. */
  static groupOf(card) {
    if (card.dataset.orderPendingPayment === 'true') {
      return 'pending_payment';
    }

    return card.dataset.orderCancellable === 'true' ? 'in_progress' : 'previous';
  }

  static apply(list, group) {
    OrderList.current = group;

    let shown = 0;

    list.querySelectorAll('[data-order-card]').forEach(card => {
      const matches = OrderList.groupOf(card) === group;

      card.hidden = !matches;
      shown += matches ? 1 : 0;
    });

    const empty = document.querySelector('[data-orders-empty-filter]');

    if (empty) {
      empty.hidden = shown > 0;
    }

    OrderList.select(group);
  }

  /**
   * Keeps the control saying what the list is showing. It matters on load and on
   * Back, where the choice came from the URL and the disclosure never saw a
   * click — the same reason the pressed state is set here rather than only in
   * `SortDisclosure.apply`.
   */
  static select(group) {
    const panel = document.querySelector('[data-sort-param="orders"]');

    if (!panel) {
      return;
    }

    let label = '';

    panel.querySelectorAll('[data-sort-option]').forEach(option => {
      const selected = option.getAttribute('data-sort-option') === group;

      option.setAttribute('aria-pressed', selected ? 'true' : 'false');

      if (selected) {
        label = option.textContent.trim();
      }
    });

    const current = panel.querySelector('[data-sort-current]');

    if (current && label) {
      current.textContent = label;
    }
  }
}

OrderList.current = OrderList.DEFAULT_GROUP;

salla.onReady(() => OrderList.boot());

export default OrderList;
