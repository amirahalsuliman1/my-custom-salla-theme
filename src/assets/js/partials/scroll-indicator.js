/**
 * T-4.03's scroll indicator, driven from a native scroll row.
 *
 * The indicator is one control with one stylesheet (`product-carousel.scss`):
 * a track and a thumb sized from two custom properties. This is the one place
 * that writes them for a row that scrolls natively — Home's product carousel and
 * the PDP's «تجارب عملائنا» strip. The gallery's own indicator reads Swiper's
 * progress instead (`product-gallery.js`), because Swiper, not the browser,
 * scrolls it.
 *
 * `Math.abs` is the RTL correction recorded under T-4.03: in a right-to-left
 * row `scrollLeft` runs from 0 to a negative number.
 */
export function updateScrollIndicator(track, indicator) {
  const scrollable = track.scrollWidth - track.clientWidth;

  // Nothing to scroll means nothing to report (T-4.09).
  indicator.hidden = scrollable <= 1;

  if (indicator.hidden) {
    return;
  }

  indicator.style.setProperty('--carousel-visible', track.clientWidth / track.scrollWidth);
  indicator.style.setProperty('--carousel-progress', Math.abs(track.scrollLeft) / scrollable);
  // The thumb is drawn only once it has a real size — product-carousel.scss.
  indicator.dataset.carouselReady = 'true';
}

/** Keeps `indicator` in step with `track` from now on, and draws it once. */
export default function bindScrollIndicator(track, indicator) {
  const update = () => updateScrollIndicator(track, indicator);

  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();

  return update;
}
