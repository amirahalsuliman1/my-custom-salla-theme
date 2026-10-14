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
 * Phones only: from 768px the section stays in the flow, as the desktop
 * artboards draw it.
 */
const DOCKED = 'pdp-actions-docked';

export default function initStickyActions() {
  const body = document.body;
  const section = document.querySelector('.sticky-product-bar');

  if (!section || !body.classList.contains('is-sticky-product-bar') || !('IntersectionObserver' in window)) {
    return;
  }

  const phone = window.matchMedia('(max-width: 767.98px)');

  const set = docked => {
    if (docked === body.classList.contains(DOCKED)) {
      return;
    }

    section.style.minBlockSize = docked ? `${section.offsetHeight}px` : '';
    body.classList.toggle(DOCKED, docked);
  };

  let last = null;

  new IntersectionObserver(([entry]) => {
    last = entry;
    set(phone.matches && !entry.isIntersecting && entry.boundingClientRect.top < 0);
  }).observe(section);

  phone.addEventListener('change', () => {
    set(phone.matches && !!last && !last.isIntersecting && last.boundingClientRect.top < 0);
  });
}
