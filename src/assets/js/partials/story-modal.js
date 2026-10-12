/**
 * T-7.07 — the story view's one piece of behaviour.
 *
 * EVERYTHING ELSE IS ALREADY DONE BY SOMETHING ELSE, and that is the point of
 * the file being this short. Opening, closing, Esc, the backdrop, the focus trap
 * and the return of focus to the card belong to T-2.10 and, under it, to
 * `<dialog>`. The pill and the marker belong to T-4.06. This module exists for
 * the one thing neither of them can know: **when** the hotspot inside a story
 * should resolve.
 *
 * THE COST IT AVOIDS IS REAL. A merchant may publish two dozen stories, each
 * modal carrying a hotspot with a product id. Booting them with the page would
 * mean two dozen `salla.product.getDetails()` calls on Home, for products behind
 * a modal nobody has opened. Mounting on first open turns that into at most one
 * call per story the visitor actually looks at, and `Hotspots.mount()` is
 * idempotent so re-opening costs nothing.
 *
 * The image pays for itself the same way: it is `loading="lazy"` inside a closed
 * dialog, which is `display: none`, so the browser does not fetch it until the
 * modal is shown.
 */
import Hotspots from './hotspots';

class StoryModal {
  static boot() {
    document.querySelectorAll('.story-modal').forEach(modal => {
      const deferred = modal.querySelector('[data-hotspot-defer]');

      if (!deferred) {
        return;
      }

      // `showModal()` flips this attribute before anything paints, so the
      // lookup starts in the same frame the modal becomes visible.
      new MutationObserver(() => modal.open && Hotspots.mount(deferred))
        .observe(modal, { attributes: true, attributeFilter: ['open'] });
    });
  }
}

salla.onReady(() => salla.lang.onLoaded(() => StoryModal.boot()));

export default StoryModal;
