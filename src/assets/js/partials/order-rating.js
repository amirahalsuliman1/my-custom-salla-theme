/**
 * T-6.08 — naming the stars.
 *
 * `Rate Your Order.pdf` IS `salla-rating-modal`, SO ALMOST NOTHING IS BUILT HERE.
 * The component renders the artboard: three steps with dots, gated on the order's
 * own `testimonials_enabled` / `products_enabled` / `shipping_enabled`; a
 * per-product list with image, name, editable stars and a comment; a store step
 * with the store logo; a shipping step with the carrier's; and a thanks tab which
 * is `Thank You.pdf`. Rebuilding any of that would be a bespoke review store,
 * which this task's own criterion forbids.
 *
 * **WHAT THE COMPONENT DOES NOT DO IS NAME ITS STARS, AND THAT IS THE WHOLE OF
 * THIS FILE.** `renderEditableStars()` emits five `<button>` elements whose only
 * content is a star SVG. A button with no text has no accessible name — a screen
 * reader announces «button» five times over, and there is no way to tell which
 * one is «3». The criterion asks for the star input to be «keyboard operable,
 * labelled, and not conveying its value by shape alone», and of the three only
 * the first is already true: they are real `<button>`s, so Tab and Enter work,
 * which is more than T-5.12 found on the loyalty prize rows.
 *
 * SO THREE THINGS ARE ADDED FROM OUTSIDE AND NOTHING IS REIMPLEMENTED. Each star
 * gets a name. The group gets one. And the reaction word the component already
 * computes — «غير راضٍ», «عادي», «أعجبني», «رهيب», «تحفة», the artboard's own
 * labels — is given `role="status"` so choosing a rating **says** the rating
 * instead of only drawing it. The component's own click handling, its
 * `aria-pressed` bookkeeping and its submission are untouched.
 *
 * IT RUNS ON MUTATION BECAUSE THE MODAL RENDERS ITS STEPS LAZILY. Step two does
 * not exist in the DOM until step one is submitted, so a one-off pass at boot
 * would name the first set of stars and none of the rest.
 */
class OrderRating {
  static boot() {
    if (!document.querySelector('salla-rating-modal')) {
      return;
    }

    OrderRating.label();

    // Stencil re-renders each step into the modal as the customer advances.
    new MutationObserver(() => OrderRating.label()).observe(document.body, {
      childList: true,
      subtree: true,
    });

    // The component announces itself once it is listening; by then its first
    // step is rendered.
    salla.event.on('rating::ready', () => OrderRating.label());
  }

  static label() {
    document.querySelectorAll('.s-rating-stars-element').forEach(group => {
      // Idempotent by construction: naming the same group twice is harmless but
      // pointless, and the observer fires on every render.
      if (group.dataset.rateLabelled) {
        return;
      }

      const stars = group.querySelectorAll('[data-star]');

      if (!stars.length) {
        return;
      }

      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', salla.lang.get('theme.orders.rating_group'));

      stars.forEach(star => {
        // The placeholder key is bare and the colon lives in the locale value —
        // `:stars` in `ar.json`, `{ stars }` here. T-5.11's `earned_message` set
        // the precedent, and getting it backwards prints the placeholder.
        star.setAttribute('aria-label', salla.lang.get('theme.orders.rating_star', {
          stars: star.getAttribute('data-star'),
        }));

        /**
         * A `<button>` with no `type` inside a form defaults to `submit`. These
         * sit in the modal's `.rating-outer-form` blocks, and one future change
         * turning that div into a real `<form>` would make every star press
         * submit the review. One attribute removes the whole class of bug.
         */
        if (!star.hasAttribute('type')) {
          star.setAttribute('type', 'button');
        }
      });

      group.dataset.rateLabelled = 'true';
      OrderRating.announce(group);
    });
  }

  /**
   * The reaction word is rendered beside the stars and updated by the component
   * on hover and on selection. It is visible and silent; `role="status"` is what
   * makes «تحفة» arrive for someone who cannot see it.
   *
   * `s-rating-stars-label` and its `-without-tag` variant are both real class
   * names — `getLabelClassName()` picks between them on whether the element has
   * a `tag` — so both are matched rather than one guessed.
   */
  static announce(group) {
    const label = group.parentElement?.querySelector(
      '.s-rating-stars-label, .s-rating-stars-label-without-tag',
    );

    if (label) {
      label.setAttribute('role', 'status');
    }
  }
}

salla.onReady(() => OrderRating.boot());

export default OrderRating;
