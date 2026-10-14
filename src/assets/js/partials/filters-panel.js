/**
 * T-4.18 — the filter panel's behaviour, for every listing that has one.
 *
 * It was in `products.js`, which only the `product` bundle carries — and the
 * brand page, which now filters too (both brand artboards draw it), loads
 * `pages`. A panel built from one partial (`components/ui/filters-sheet.twig`)
 * gets one behaviour, here in the `app` entry, and it does nothing on a page
 * without `#filters-menu`.
 *
 * Three things, and none of them reimplements `salla-filters`:
 *
 *   · the drawer closes once a filter is applied — below laptop the results
 *     are behind the panel, so leaving it open hides what the choice changed;
 *   · the heading's count, `Show Filter.pdf`'s «(3)». It is read from the chips
 *     the component renders itself (`.s-filters-applied-item`, light DOM, kept
 *     while their block is hidden): one chip per value and one for a price
 *     range, which is exactly the drawn three, and the base category the
 *     component appends on a category page is already left out. Counting URL
 *     params would get both of those wrong;
 *   · the reset calls the component's own `resetFilters()`.
 *
 * The count and the reset are hidden at zero — no artboard draws that state.
 */
class FiltersPanel {
  static boot() {
    const menu = document.getElementById('filters-menu');

    if (!menu) {
      return;
    }

    /**
     * Above laptop the filters are a column in the page and there is nothing to
     * close — `bottom-sheet::close` on a dialog that was never opened is a no-op.
     */
    salla.event.on('salla-filters::changed', filters => {
      if (Object.entries(filters || {}).length) {
        salla.event.dispatch('bottom-sheet::close', 'filters-sheet');
      }
    });

    // The chips are re-rendered by the component on every change and on reset,
    // so watching them is the one signal that covers load, change and reset.
    new MutationObserver(() => FiltersPanel.sync(menu)).observe(menu, { childList: true, subtree: true });
    FiltersPanel.sync(menu);

    document.addEventListener('click', event => {
      if (event.target.closest?.('[data-filters-reset]')) {
        menu.resetFilters?.();
      }
    });
  }

  static sync(menu) {
    const count = menu.querySelectorAll('.s-filters-applied-item').length;

    document.querySelectorAll('[data-filters-count]').forEach(element => {
      element.hidden = count === 0;
      element.textContent = count ? salla.lang.get('theme.filters.count', { count }) : '';
    });

    document.querySelectorAll('[data-filters-reset]').forEach(element => {
      element.hidden = count === 0;
    });
  }
}

salla.onReady(() => FiltersPanel.boot());

export default FiltersPanel;
