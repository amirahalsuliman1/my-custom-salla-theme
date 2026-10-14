/**
 * The PDP action row, docked only once the customer has scrolled past it.
 *
 * `Product Details Page.pdf` draws quantity and the action row inside the
 * product panel; `Product Details Page (On Scroll).pdf` draws the action row
 * alone — add-to-cart with its price, and the heart — fixed to the bottom.
 * Upstream instead fixed the whole section, quantity included, from the first
 * paint (demo store, 2026-10-14).
 *
 * WHEN. The section is observed, and the row docks while the section is out of
 * view ABOVE the viewport. Below it — not reached yet — the row stays where it
 * is, which is the first artboard's state.
 *
 * NO JUMP. Taking the row out of the flow would shorten the panel under the
 * reader's thumb, so the section keeps its own height while the row is away.
 *
 * At every width: `Desktop Product Details Page (on Scroll).svg` draws the
 * same docked row from 1024px, as a floating card with the product's photo and
 * name (product-info.scss).
 */
const DOCKED = 'pdp-actions-docked';

export default function initStickyActions() {
  const body = document.body;
  const section = document.querySelector('.sticky-product-bar');

  if (!section || !body.classList.contains('is-sticky-product-bar') || !('IntersectionObserver' in window)) {
    return;
  }

  const set = docked => {
    if (docked === body.classList.contains(DOCKED)) {
      return;
    }

    section.style.minBlockSize = docked ? `${section.offsetHeight}px` : '';
    body.classList.toggle(DOCKED, docked);
  };

  new IntersectionObserver(([entry]) => {
    set(!entry.isIntersecting && entry.boundingClientRect.top < 0);
  }).observe(section);
}
