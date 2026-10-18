/**
 * Home, parsed once per page (public-theme pass, 2026-10-19).
 *
 * The stories and the shoppable images are Home sections' data, which no other
 * Twig template can read. The pages that show them elsewhere — the product
 * page, a category page — read Home's own rendered markup instead, so the
 * merchant keeps one list. Every caller shares this one request.
 */
import { previewTarget, storePrefix } from './preview-links';

let pending = null;

function homeUrl() {
  const store = salla.config.get('store.url') || `${window.location.origin}/`;

  return previewTarget(store, storePrefix()) || store;
}

export function homeDocument() {
  if (!pending) {
    pending = fetch(homeUrl(), { credentials: 'same-origin' })
      .then(response => (response.ok ? response.text() : Promise.reject(new Error(String(response.status)))))
      .then(html => new DOMParser().parseFromString(html, 'text/html'))
      .catch(() => null);
  }

  return pending;
}
