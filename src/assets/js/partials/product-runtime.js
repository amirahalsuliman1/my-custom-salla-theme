/**
 * T-4.23 — the three things every runtime-resolved product needs, in one place.
 *
 * EXTRACTED, NOT INVENTED. All three were written in `partials/hotspots.js` under
 * T-4.06, which was the first component to resolve a product from a stored id at
 * runtime. T-4.23 is the second, and doc 15 forbids the second copy — so the
 * shared part moved here and both import it. The rendering stays with each
 * component, because a hotspot pill and a carousel caption are not the same
 * shape and pretending otherwise would produce a partial that serves neither.
 *
 * The pattern this preserves: **the merchant stores an id and nothing else.** A
 * renamed or repriced product needs no edit to the theme settings, because
 * nothing about it is stored there.
 */

/** Product data is merchant content going into `innerHTML`. It gets escaped. */
export const escapeHtml = (value = '') =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** The SDK has returned both shapes across versions; this normalises them. */
export const fetchProduct = id =>
  salla.product.getDetails(id).then(response => response?.data || response);

/**
 * `salla.money()` injects the currency as an icon-font glyph, so a screen reader
 * reads a private-use codepoint out loud. Every price this theme renders has to
 * do this, which is exactly why it is here and not written out a second time.
 */
export const hideCurrencyGlyphs = root =>
  root.querySelectorAll('.sicon-sar').forEach(glyph => glyph.setAttribute('aria-hidden', 'true'));
