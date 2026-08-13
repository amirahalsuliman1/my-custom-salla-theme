/**
 * T-8.14 — when the back-to-top button is visible, and nothing else.
 *
 * THIS FILE DELIBERATELY DOES NOT SCROLL. The control is an `<a href="#top">`,
 * and `#top` is a specified fragment: the browser scrolls to the top of the
 * document and resets the sequential focus navigation starting point with it.
 * Intercepting that click to call `scrollTo()` would move the pixels and lose
 * the focus reset — a keyboard user would land visually at the top and resume
 * tabbing from the footer. See `components/ui/back-to-top.twig`.
 *
 * So the only question left is *when the button is on screen*, and that is one
 * IntersectionObserver.
 *
 * ── WHY AN OBSERVER, AND WHAT THE rootMargin IS DOING ───────────────────────
 *
 * `sticky-header.js` established the instrument: an observer on a sentinel runs
 * no code on the scroll frame, where a scroll listener runs on every one.
 *
 * The margin is the part worth reading twice. `rootMargin: '100% 0px 0px 0px'`
 * grows the root box's TOP edge upward by one viewport height. The sentinel sits
 * at the document's top, so it keeps intersecting that grown box until the page
 * has scrolled a full screen — and stops at exactly `scrollY >= innerHeight`.
 *
 * **The threshold is therefore "one screenful", expressed as geometry rather
 * than as a number.** It needs no recalculation on resize, on rotation, or on a
 * tablet, all of which a hard-coded `600` would get wrong.
 */
class BackToTop {
  static boot() {
    const button = document.querySelector('[data-back-to-top]');

    // Off in the customiser means the anchor is never rendered. Nothing to do,
    // and no sentinel to find either.
    if (!button) {
      return;
    }

    const sentinel = document.querySelector('[data-back-to-top-sentinel]');

    /**
     * No sentinel, or no observer support: show the button rather than hide it
     * forever. A control that is always available is a minor deviation; one the
     * merchant switched on and nobody can ever see is a defect.
     */
    if (!sentinel || !('IntersectionObserver' in window)) {
      button.classList.add('is-visible');
      return;
    }

    new IntersectionObserver(
      ([entry]) => button.classList.toggle('is-visible', !entry.isIntersecting),
      { rootMargin: '100% 0px 0px 0px', threshold: 0 },
    ).observe(sentinel);
  }
}

salla.onReady(() => BackToTop.boot());

export default BackToTop;
