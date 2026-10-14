/**
 * Keeps theme previews inside the preview (2026-10-14).
 *
 * In a theme preview the page is served from the preview host, but the links
 * Salla's data carries — the menu, search results, product cards — point at
 * the store's own domain, which still runs the PUBLISHED theme. One click and
 * the owner was out of the theme she was testing: categories and search
 * «did not work» because they opened the live store (found 2026-10-14).
 *
 * The rule, and why it is a no-op on a real store: a link is rewritten only
 * when its host is NOT this page's host but its path is inside this store's
 * path (the first segment of `store.url`, e.g. `/dev-…`). On the published
 * store the links and the page share a host, so nothing ever matches. The
 * query of the current page (`?preview=true`) is carried over.
 */
function storePrefix() {
  try {
    const path = new URL(salla.config.get('store.url') || window.location.href).pathname;
    const first = path.split('/').filter(Boolean)[0];
    return first ? `/${first}` : '';
  } catch {
    return '';
  }
}

function previewTarget(href, prefix) {
  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }

  if (url.host === window.location.host || !/^https?:$/.test(url.protocol)) return null;
  if (prefix && !decodeURI(url.pathname).startsWith(prefix)) return null;
  if (!prefix) return null;

  const here = new URLSearchParams(window.location.search);
  here.forEach((value, key) => {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  });

  return `${window.location.origin}${url.pathname}${url.search}${url.hash}`;
}

function boot() {
  const prefix = storePrefix();

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;

    const link = event.target.closest?.('a[href]');
    if (!link || link.target === '_blank') return;

    const target = previewTarget(link.getAttribute('href'), prefix);
    if (!target) return;

    event.preventDefault();
    window.location.assign(target);
  }, true);
}

salla.onReady(boot);

export { previewTarget, storePrefix };
export default boot;
