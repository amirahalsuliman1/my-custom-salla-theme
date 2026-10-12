/**
 * T-6.06 — keeping the tracked status current.
 *
 * «LIVE STATUS WITHOUT A FULL RELOAD WHERE THE API SUPPORTS IT» — THE API
 * SUPPORTS FETCHING, AND NOTHING MORE, SO THAT IS WHAT THIS DOES. There is no
 * push channel: no websocket, no server-sent events, no `order::status.changed`
 * in the SDK's event namespaces. What exists is `salla.order.api.getDetails(id)`,
 * a plain request. So the question is not *whether* to poll but *when*, and the
 * answer is: when the customer comes back to the page.
 *
 * **A TIMER WAS THE OBVIOUS IMPLEMENTATION AND IT IS THE WRONG ONE.** Polling
 * every thirty seconds spends a request per interval on a page a customer may
 * leave open for an hour, on a status that changes a handful of times over
 * several days — and it keeps a phone's radio busy for a value that almost never
 * moves. `visibilitychange` fires exactly when the answer could newly matter: the
 * customer has switched back to this tab, which is the moment they are looking.
 * One request per return, none while away.
 *
 * IT UPDATES THE LABEL AND NOTHING ELSE. A status change also changes which
 * actions the order offers and what its history should say — none of which this
 * file can know without the history that does not exist (OP-12). Rewriting the
 * step's text is the honest limit of what a fetched status can support; anything
 * further would be the theme inferring a page state from one field.
 */
class OrderTracking {
  static boot() {
    const section = document.querySelector('[data-order-tracking]');
    const orderId = section?.getAttribute('data-order-id');

    if (!section || !orderId) {
      return;
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        OrderTracking.refresh(section, orderId);
      }
    });
  }

  static refresh(section, orderId) {
    salla.order.api
      ?.getDetails?.(orderId)
      .then(response => OrderTracking.apply(section, response?.data?.status || response?.status))
      /**
       * A failed refresh is silent on purpose. The page already shows a status
       * the server sent when it rendered; replacing it with an error message
       * would make a working page look broken because a background check the
       * customer never asked for did not come back.
       */
      .catch(() => {});
  }

  static apply(section, status) {
    const step = section.querySelector('.order-timeline__step--current .order-timeline__label');

    if (!step || !status?.name) {
      return;
    }

    // The `sr-only` sibling states which step this is; only the visible text is
    // the status, so only that node is replaced.
    const [text] = step.childNodes;

    if (text && text.nodeType === Node.TEXT_NODE && text.textContent.trim() !== status.name) {
      text.textContent = status.name;
    }
  }
}

salla.onReady(() => OrderTracking.boot());

export default OrderTracking;
