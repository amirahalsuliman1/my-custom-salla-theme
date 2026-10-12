/**
 * T-6.04 — reordering, and the toast the artboard draws.
 *
 * THE SHAPE IS T-6.03'S, DELIBERATELY. Same one-dialog-per-page arrangement, same
 * id-on-the-trigger, same busy-until-the-platform-answers. Two flows that differ
 * only in which API they call should not differ in how they are written, and a
 * reader who has understood `order-cancel.js` has understood this file.
 *
 * «UNAVAILABLE OR OUT-OF-STOCK ITEMS REPORTED RATHER THAN SILENTLY DROPPED» IS
 * MET AS FAR AS THE PLATFORM ALLOWS, AND THE LIMIT IS STATED. `createCartFromOrder`
 * resolves to `{cart_id, url}` — it does not enumerate what it could not add. The
 * one channel that exists is `data.message`, which `SuccessResponse` declares and
 * which the platform fills when it has something to say, so **the platform's own
 * sentence is shown in place of the artboard's whenever one arrives.** What is
 * *not* done is the tempting thing: comparing the order's item count with the new
 * cart's and announcing the difference. `createCartFromOrder` returns a new cart
 * id, and whether that replaces or merges with an existing cart is not documented
 * anywhere available here — so the difference could be a customer's own basket
 * rather than a dropped item, and «بعض المنتجات لم تُضف» printed over a correct
 * cart is worse than saying nothing. Raised as OP-11.
 *
 * «CART COUNT ANNOUNCED» IS ALREADY BUILT AND IS NOT REBUILT HERE. T-3.04's header
 * carries `<span class="sr-only" role="status" aria-atomic>` around
 * `[data-cart-count]`, and `app.js` writes that element on `cart.event.onUpdated`.
 * So the announcement exists on every page; what this file adds is the one thing
 * missing — asking the platform to refresh the summary, because a cart created
 * from an order does not necessarily emit an update on its own. **The number is
 * the platform's, read after the fact, never a count this file maintains.**
 */
class OrderReorder {
  static get DIALOG_ID() {
    return 'reorder-order-dialog';
  }

  static boot() {
    const dialog = document.getElementById(OrderReorder.DIALOG_ID);

    if (!dialog) {
      return;
    }

    OrderReorder.pending = null;

    document.addEventListener('click', event => {
      const trigger = event.target.closest?.('[data-order-reorder]');

      if (trigger) {
        OrderReorder.pending = trigger.getAttribute('data-order-reorder');
        return;
      }

      if (event.target.closest?.(`[data-dialog-confirm="${OrderReorder.DIALOG_ID}"]`)) {
        OrderReorder.confirm(dialog);
      }
    });

    OrderReorder.watch(dialog);
  }

  static confirm(dialog) {
    if (!OrderReorder.pending) {
      return;
    }

    const button = dialog.querySelector(`[data-dialog-confirm="${OrderReorder.DIALOG_ID}"]`);

    button?.setAttribute('aria-busy', 'true');
    button?.setAttribute('aria-disabled', 'true');

    salla.order.createCartFromOrder(OrderReorder.pending);
  }

  static watch(dialog) {
    salla.order.event.onOrderCreated(response => {
      OrderReorder.release(dialog);

      /**
       * The platform's sentence where it sent one, the artboard's where it did
       * not. This is the whole of «reported rather than silently dropped» that
       * the API makes available — see the header note and OP-11.
       */
      salla.notify.success(response?.data?.message || salla.lang.get('theme.orders.reorder_success'));

      /**
       * Bring the header's count — and therefore its live region — up to date.
       * `latest()` is the platform re-reading its own cart; nothing here counts
       * anything.
       */
      salla.cart.api?.latest?.();
    });

    salla.order.event.onOrderCreationFailed(error => {
      OrderReorder.release(dialog);

      salla.notify.error(salla.helpers?.getApiErrorMessage?.(error) || salla.lang.get('theme.orders.reorder_failed'));
    });
  }

  static release(dialog) {
    const button = dialog.querySelector(`[data-dialog-confirm="${OrderReorder.DIALOG_ID}"]`);

    button?.removeAttribute('aria-busy');
    button?.removeAttribute('aria-disabled');

    OrderReorder.pending = null;

    if (dialog.open) {
      dialog.close();
    }
  }
}

OrderReorder.pending = null;

salla.onReady(() => OrderReorder.boot());

export default OrderReorder;
