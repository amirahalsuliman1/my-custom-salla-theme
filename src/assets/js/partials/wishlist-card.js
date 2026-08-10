/**
 * T-4.02 — the favorites card, which is the product card.
 *
 * WHAT THE ARTBOARD ACTUALLY DRAWS. `Favorites Page - Floating Menu.pdf` shows a
 * two-column grid of **the same cards as every other listing** — image, name,
 * rating, the price pill, the instant-delivery tag, the corner controls. It does
 * not draw a favorites-specific card at all. Upstream's `custom-wishlist-card`
 * was a horizontal row — image, name, price, add button, a remove ✕ — which is a
 * different component answering a question the design does not ask.
 *
 * SO THIS CLASS RENDERS T-4.01's CARD AND OWNS NO MARKUP. «Shares the T-4.01
 * shell; no duplicated card logic» is the criterion, and the only way to be
 * certain of it is to have nothing here to drift: no image tag, no price
 * formatting, no rating, no swatches. If T-4.01 changes, this changes with it,
 * because it *is* T-4.01.
 *
 * The element stays in the tree as a `display: contents` wrapper rather than
 * replacing itself, because `salla-products-list` created it and holds the
 * reference — swapping it out from under the list is how you get a grid that
 * cannot re-render itself.
 */
class WishlistCard extends HTMLElement {
  connectedCallback() {
    if (!this.product) {
      return salla.logger.warn('custom-wishlist-card:: product does not exist!');
    }

    salla.onReady(() => this.render());
  }

  render() {
    // Guard against a second render: the list re-appends cards on reload, and
    // two nested product cards would be two of every control.
    if (this.firstElementChild) {
      return;
    }

    this.setAttribute('id', `wishlist-product-${this.product.id}`);

    const card = document.createElement('custom-salla-product-card');

    card.product = this.product;
    this.append(card);
  }

  /**
   * T-4.02 — «remove action confirms before destructive removal and announces
   * the result».
   *
   * The remove action on this page is the card's own heart, which T-4.01 wires
   * straight to `salla.wishlist.toggle`. Everywhere else that is right —
   * un-favouriting from a listing is one tap and one tap back. **On the
   * favorites page it is destructive in a way it is not elsewhere:** the item
   * leaves the grid, and if it was the last one the page empties. So here, and
   * only here, it goes through T-2.11's dialog first.
   *
   * Taken in the CAPTURE phase, because the card's handler is an inline
   * `onclick` — stopping the event while it is still descending is what
   * prevents it running. The dialog's confirm then performs the same toggle,
   * so the removal itself is still the platform's and is not reimplemented.
   */
  static bootRemoveConfirmation() {
    const dialog = document.getElementById('wishlist-remove-dialog');

    if (!dialog) {
      return;
    }

    let pendingId = null;

    document.addEventListener('click', (event) => {
      const heart = event.target.closest?.('.btn--wishlist[data-id]');

      if (!heart || !heart.closest('custom-wishlist-card')) {
        return;
      }

      // Only removal is confirmed. Re-adding something is not destructive, and
      // a dialog in front of it would be a toll booth on the way back.
      if (heart.getAttribute('aria-pressed') !== 'true') {
        return;
      }

      event.stopPropagation();
      event.preventDefault();

      pendingId = heart.getAttribute('data-id');
      salla.event.dispatch('bottom-sheet::open', 'wishlist-remove-dialog');
    }, true);

    dialog.querySelector('[data-dialog-confirm]')?.addEventListener('click', () => {
      if (!pendingId) {
        return;
      }

      salla.wishlist.toggle(pendingId);
      pendingId = null;
    });

    /**
     * The result is announced from the platform's own event rather than from
     * the click, so what is spoken is what actually happened — a removal that
     * failed says nothing, which is correct, instead of claiming success.
     */
    salla.wishlist.event.onRemoved(() => {
      const region = document.getElementById('wishlist-status');

      if (region) {
        region.textContent = salla.lang.get('theme.wishlist.removed');
      }
    });
  }
}

if (!customElements.get('custom-wishlist-card')) {
  customElements.define('custom-wishlist-card', WishlistCard);
}

salla.onReady(() => salla.lang.onLoaded(() => WishlistCard.bootRemoveConfirmation()));

export default WishlistCard;
