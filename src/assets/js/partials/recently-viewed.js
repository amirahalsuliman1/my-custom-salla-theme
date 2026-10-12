/**
 * «شاهدته مؤخراً» — the products this visitor opened, newest first.
 *
 * Added at the owner's request on 2026-10-12. No artboard draws it, so it is
 * built from what the design already has (B8): Salla's own products slider,
 * which renders the theme's product card — the same carrier «منتجات مشابهة»
 * uses on the product page. Recorded in /docs/DERIVED-DECISIONS.md.
 *
 * THE LIST LIVES IN THIS BROWSER ONLY. Product pages record their id in
 * localStorage; nothing is sent anywhere, and a visitor on a new device simply
 * has no list yet. Storage can be unavailable (private mode, blocked site
 * data), in which case nothing is recorded and every section hides itself.
 *
 * Markup contract:
 *   [data-recently-viewed-record="ID"]   on the product page — records ID
 *   [data-recently-viewed]               a place to render the slider, with
 *     data-recently-viewed-title         the slider's heading
 *     data-recently-viewed-limit         how many products at most
 *     data-recently-viewed-exclude       an id to leave out (the current product)
 */
const STORAGE_KEY = 'am1als:recently-viewed';
const MAX_STORED = 20;
const DEFAULT_LIMIT = 8;

function read() {
  try {
    const ids = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(ids) ? ids.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function record(id) {
  if (!id) {
    return;
  }

  const ids = [String(id), ...read().filter(stored => stored !== String(id))].slice(0, MAX_STORED);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable: the visitor simply has no history.
  }
}

/**
 * The slider renders a `<salla-slider>` with an items slot; products that no
 * longer exist leave that slot empty. Wait for the render to settle, then drop
 * the whole section rather than leave a heading over nothing — the same rule
 * «منتجات مشابهة» follows.
 */
function dropWhenEmpty(container, slider) {
  let settle;

  const observer = new MutationObserver(() => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      const rendered = slider.querySelector('[slot="items"]');

      if (!rendered) {
        return;
      }

      if (!rendered.children.length) {
        container.remove();
      }

      observer.disconnect();
    }, 150);
  });

  observer.observe(slider, { childList: true, subtree: true });
}

function render(container) {
  const limit = parseInt(container.dataset.recentlyViewedLimit, 10) || DEFAULT_LIMIT;
  const exclude = container.dataset.recentlyViewedExclude;
  const ids = read().filter(id => id !== exclude).slice(0, limit);

  if (!ids.length) {
    container.remove();
    return;
  }

  const slider = document.createElement('salla-products-slider');

  slider.setAttribute('data-testid', 'store-recently-viewed');
  slider.setAttribute('source', 'selected');
  slider.setAttribute('source-value', `[${ids.join(',')}]`);
  slider.setAttribute('block-title', container.dataset.recentlyViewedTitle || ' ');
  slider.setAttribute('display-all-url', '');

  container.append(slider);
  dropWhenEmpty(container, slider);
}

function boot() {
  // The product being viewed is recorded straight away (below) while its slider
  // renders later, on approach — so it is the exclude attribute, not ordering,
  // that keeps a product out of its own «recently viewed».
  document.querySelectorAll('[data-recently-viewed]').forEach((container) => {
    if (!('IntersectionObserver' in window)) {
      render(container);
      return;
    }

    new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting) return;

      observer.disconnect();
      render(container);
    }, { rootMargin: '200px' }).observe(container);
  });

  document.querySelectorAll('[data-recently-viewed-record]').forEach(el => record(el.dataset.recentlyViewedRecord));
}

salla.onReady(boot);

export { read, record, render, STORAGE_KEY, MAX_STORED };
