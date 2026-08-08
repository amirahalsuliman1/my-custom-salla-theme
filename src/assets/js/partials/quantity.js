/**
 * T-2.09 — the one thing `salla-quantity-input` does not do: say the number out
 * loud.
 *
 * THE COMPONENT IS NOT REPLACED AND BARELY TOUCHED. It already renders real
 * buttons with `aria-label`s, labels its input, sets `inputmode="numeric"` and
 * clamps to `min` — all checked in its source before a line was written here,
 * and all of it is why T-2.09 is a stylesheet plus this file rather than a
 * component of our own.
 *
 * WHAT IS MISSING IS THE ANNOUNCEMENT. Pressing «+» changes a value the user is
 * not focused on: focus stays on the button, the input's contents change
 * silently, and a screen-reader user has no way to know what the quantity now
 * is short of going to find it. One live region fixes that for every quantity
 * control on the page.
 *
 * It is `polite` and not `assertive`: the change was expected — they pressed the
 * button — so it should wait its turn rather than interrupt.
 */
class Quantity {
  static boot() {
    if (!document.querySelector('salla-quantity-input')) {
      return;
    }

    const region = document.createElement('span');

    region.className = 'sr-only';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);

    /**
     * Delegated, because quantity inputs arrive with cart items that are
     * rendered after this runs — binding each one would miss every row the
     * cart adds later.
     */
    document.addEventListener('input', event => {
      const input = event.target.closest?.('.s-quantity-input-input');

      if (!input) {
        return;
      }

      // Re-announcing the same number says nothing and interrupts something.
      if (region.dataset.last === input.value) {
        return;
      }

      region.dataset.last = input.value;
      region.textContent = salla.lang.get('theme.form.quantity_is', { value: input.value });
    });
  }
}

salla.onReady(() => salla.lang.onLoaded(() => Quantity.boot()));

export default Quantity;
