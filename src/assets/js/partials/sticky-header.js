/**
 * T-3.05 — the header's state change on Home, and nothing else.
 *
 * IT RUNS ON ONE PAGE, AND THAT IS THE POINT. Everywhere except Home the header
 * is in normal flow and `position: sticky` pins it — no script, no observer, no
 * layout shift, because a sticky element keeps its space in the flow it came
 * from. There is nothing to compute there.
 *
 * Home is different because its header is absolutely positioned over the hero
 * with no bar of its own, so pinning it means **changing what it looks like**:
 * transparent-over-image becomes the solid bar. That is a state swap, and a
 * state swap needs something to trigger it.
 *
 * THE TRIGGER IS AN IntersectionObserver ON A SENTINEL, not a scroll listener —
 * the acceptance criterion, and also the only version of this that does not run
 * code on every scroll frame. The sentinel is a zero-height marker rendered at
 * exactly the header's own top edge, so "the sentinel has left the viewport" and
 * "the header would have scrolled away" are the same event, with no measurement
 * and no magic number.
 *
 * NO LAYOUT SHIFT, AND NOTHING IS COMPENSATED FOR. The overlay header is
 * `absolute` and the stuck one is `fixed`; both are out of flow, so the page
 * behind them never learns that anything happened. This is why the two states
 * were worth keeping distinct rather than making the header sticky everywhere.
 */
class StickyHeader {
  static boot() {
    const sentinel = document.querySelector('[data-sticky-sentinel]');
    const header = document.querySelector('[data-sticky-header]');

    if (!sentinel || !header || !('IntersectionObserver' in window)) {
      return;
    }

    new IntersectionObserver(
      ([entry]) => StickyHeader.setStuck(header, !entry.isIntersecting),
      { threshold: 0 },
    ).observe(sentinel);
  }

  /**
   * The swap itself: the classes T-3.04 already defined, exchanged.
   *
   * `--stuck` carries position and nothing else, so neither state is restyled
   * here — the stuck header looks solid because it *is* the solid state, not
   * because a third appearance was written for it.
   */
  static setStuck(header, isStuck) {
    header.classList.toggle('store-header--overlay', !isStuck);
    header.classList.toggle('store-header--solid', isStuck);
    header.classList.toggle('store-header--stuck', isStuck);
  }
}

salla.onReady(() => StickyHeader.boot());

export default StickyHeader;
