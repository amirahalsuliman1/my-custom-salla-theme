/**
 * T-6.03 — cancelling an order.
 *
 * WHAT THIS FILE OWNS, AND WHAT IT DELIBERATELY DOES NOT. Opening the dialog,
 * trapping focus, `Esc`, the backdrop and the scroll lock are T-2.10's, which are
 * the browser's `<dialog>`. The cancellation itself is `salla.order.cancel` —
 * **the theme never decides whether an order may be cancelled and never
 * reimplements the request.** What is left is the join: which order the customer
 * pressed, telling them how it went, and putting the page back in step.
 *
 * «CANCELLATION ELIGIBILITY CHECKED SERVER-SIDE BEFORE THE DIALOG OFFERS IT» IS
 * MET BEFORE THIS FILE RUNS. `order.can_cancel` is the platform's own flag, and
 * both templates render the trigger only where it is true — so there is no path
 * from a page to this dialog for an order the server has not already said may be
 * cancelled. Nothing here re-checks it, because a second opinion computed in the
 * browser would be the client deciding, which is the thing being avoided.
 *
 * WHY THE ORDER ID LIVES ON THE TRIGGER. One dialog serves a list of twenty
 * cancellable orders (see `cancel-dialog.twig` for why there is only one), so the
 * dialog cannot know which order it is about until something is pressed. The id
 * is read off the button at that moment and held until the request resolves.
 */
class OrderCancel {
  static get DIALOG_ID() {
    return 'cancel-order-dialog';
  }

  static boot() {
    const dialog = document.getElementById(OrderCancel.DIALOG_ID);

    if (!dialog) {
      return;
    }

    OrderCancel.pending = null;

    // Delegated: on the list, cards arrive from infinite scroll after this runs.
    document.addEventListener('click', event => {
      const trigger = event.target.closest?.('[data-order-cancel]');

      if (trigger) {
        OrderCancel.pending = trigger.getAttribute('data-order-cancel');
        return;
      }

      if (event.target.closest?.(`[data-dialog-confirm="${OrderCancel.DIALOG_ID}"]`)) {
        OrderCancel.confirm(dialog, event.target.closest('[data-dialog-confirm]'));
      }
    });

    OrderCancel.watch(dialog);
  }

  /**
   * T-2.11 does not close the dialog on confirm, on purpose — a caller that must
   * show progress before the request resolves needs it open. This is that
   * caller: the button goes busy, and the dialog stays until the platform has
   * answered one way or the other.
   */
  static confirm(dialog, button) {
    if (!OrderCancel.pending) {
      return;
    }

    button?.setAttribute('aria-busy', 'true');
    button?.setAttribute('aria-disabled', 'true');

    salla.order.cancel(OrderCancel.pending);
  }

  static watch(dialog) {
    salla.order.event.onCanceled(() => {
      OrderCancel.release(dialog);

      /**
       * «RESULT ANNOUNCED; LIST REFRESHES» — and the reload is what refreshes it.
       * A cancelled order changes its status, its available actions and, on the
       * list, which filter group it belongs to; patching all three in the DOM
       * would be the theme recomputing what the server just decided. Upstream
       * reloads here too, and it is the honest option.
       *
       * The announcement has to survive that reload, which a toast raised now
       * would not — so it is `salla.notify`'s own success path, which the
       * platform persists across the navigation it is about to perform.
       */
      salla.notify.success(salla.lang.get('theme.orders.cancel_success'));
      OrderCancel.refresh();
    });

    salla.order.event.onNotCanceled(error => {
      OrderCancel.release(dialog);

      // The platform's own message where it sent one, and the theme's sentence
      // only where it did not — never a generic message over a specific one.
      salla.notify.error(salla.helpers?.getApiErrorMessage?.(error) || salla.lang.get('theme.orders.cancel_failed'));
    });
  }

  /**
   * The refresh, named rather than inlined. It is one statement, and it is the
   * one statement in this file that cannot run in a test — `location.reload` is
   * a navigation. Giving it a name is what lets «list refreshes» be asserted
   * instead of hoped for.
   */
  static refresh() {
    window.location.reload();
  }

  /** Puts the confirm button back and lets the dialog close. */
  static release(dialog) {
    const button = dialog.querySelector(`[data-dialog-confirm="${OrderCancel.DIALOG_ID}"]`);

    button?.removeAttribute('aria-busy');
    button?.removeAttribute('aria-disabled');

    OrderCancel.pending = null;

    if (dialog.open) {
      dialog.close();
    }
  }
}

OrderCancel.pending = null;

salla.onReady(() => OrderCancel.boot());

export default OrderCancel;
