/**
 * T-4.09 — the PDP gallery's two behaviours.
 *
 * `salla-slider type="thumbs"` builds two Swipers and links them with Swiper's
 * thumbs module. It does **not** enable Swiper's `a11y` module, so the strip it
 * produces has no tab stop, no name and nothing announcing which thumbnail is
 * showing. The markup in `single.twig` supplies the button and the name; this
 * supplies the state and the indicator.
 *
 * WHY A MutationObserver AND NOT AN EVENT. The thing that has to be mirrored is
 * `swiper-slide-thumb-active`, a class Swiper writes directly. Listening for a
 * slide-change event would mean re-deriving the active index from a second
 * source and hoping the two agree — and they would not, on a loop or a
 * programmatic `slideTo`. Observing the class means `aria-current` cannot drift
 * from what is on screen, because it IS what is on screen.
 *
 * The indicator is T-4.03's control and is driven the way T-4.03 drives it: two
 * custom properties, `--carousel-visible` and `--carousel-progress`. Nothing
 * about its appearance is decided here.
 */

const ACTIVE = 'swiper-slide-thumb-active';

/** Mirror swiper's active class onto the button's `aria-current`. */
function syncCurrent(root) {
  root.querySelectorAll('.product-gallery__thumb-slide').forEach((slide) => {
    const button = slide.querySelector('.product-gallery__thumb');
    if (button) button.setAttribute('aria-current', slide.classList.contains(ACTIVE) ? 'true' : 'false');
  });
}

/**
 * Drive the indicator from the thumbs swiper.
 *
 * `progress` is 0..1 across the scrollable range and is 0 when nothing scrolls,
 * so a strip that fits needs no indicator at all — hiding it is more honest than
 * drawing a full-width bar that can never move.
 */
function bindIndicator(indicator, swiper) {
  const update = () => {
    const visible = swiper.slides.length ? Math.min(1, swiper.params.slidesPerView / swiper.slides.length) : 1;
    indicator.hidden = visible >= 1;
    indicator.style.setProperty('--carousel-visible', String(visible));
    indicator.style.setProperty('--carousel-progress', String(swiper.progress || 0));
  };

  update();
  swiper.on('progress', update);
  swiper.on('resize', update);
  swiper.on('slidesLengthChange', update);
}

export default function initProductGallery() {
  const slider = document.querySelector('salla-slider.image-slider[type="thumbs"]');
  if (!slider) return;

  const thumbs = slider.querySelector('[slot="thumbs"]');
  if (!thumbs) return;

  syncCurrent(thumbs);

  const observer = new MutationObserver(() => syncCurrent(thumbs));
  observer.observe(thumbs, { attributes: true, attributeFilter: ['class'], subtree: true });

  // `thumbsSliderInstance()` is the component's own public accessor, and it
  // resolves only once Swiper exists — so nothing here races the upgrade.
  const indicator = document.querySelector('.product-gallery__indicator');
  if (indicator && typeof slider.thumbsSliderInstance === 'function') {
    slider
      .thumbsSliderInstance()
      .then((swiper) => {
        if (swiper) bindIndicator(indicator, swiper);
      })
      .catch(() => {
        // A gallery without an indicator is a gallery; a thrown promise is a
        // broken page. The thumbnails and their state do not depend on this.
        indicator.hidden = true;
      });
  }
}
