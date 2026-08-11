import BasePage from './base-page';

class Order extends BasePage {
    onReady() {
        app.onClick('salla-button#btn-reorder', ({currentTarget: btn}) => btn.load()
            .then(() => salla.order.createCartFromOrder())
            .then(() => btn.stop())
            .then(() => app.element('#reorder-modal').hide()));

        /**
         * T-6.03 — the cancel binding is gone from here, and it had to be.
         * `#confirm-cancel` lived inside a `salla-modal` this theme no longer
         * renders; `01 Cancel Order Confirmation Pop-up.pdf` is T-2.11's dialog,
         * and `partials/order-cancel.js` owns the flow because it serves the
         * orders **list** as well as this page. Leaving the binding would have
         * left a handler watching for an element that never appears.
         *
         * It also called `salla.order.cancel()` with no argument, which the
         * order page could get away with and a list of twenty orders cannot.
         */

    }
}

Order.initiateWhenReady(['customer.orders.single']);
