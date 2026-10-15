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
 *
 * The rating row at the end is the one piece of rendering here, and for the
 * same reason: the card and the quick view draw the identical row.
 */

/** Product data is merchant content going into `innerHTML`. It gets escaped. */
export const escapeHtml = (value = '') =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * The SDK has returned both shapes across versions; this normalises them.
 * `withItems` is the SDK's own `with` list (`'rating'`, `'images'`, …): the
 * details call leaves those relations out unless asked.
 */
export const fetchProduct = (id, withItems = []) =>
  salla.product.getDetails(id, withItems).then(response => response?.data || response);

/**
 * `salla.money()` injects the currency as an icon-font glyph, so a screen reader
 * reads a private-use codepoint out loud. Every price this theme renders has to
 * do this, which is exactly why it is here and not written out a second time.
 */
export const hideCurrencyGlyphs = root =>
  root.querySelectorAll('.sicon-sar').forEach(glyph => glyph.setAttribute('aria-hidden', 'true'));

/**
 * The rating row — T-4.01's card, the Home lookbook's desktop card (`Desktop
 * Home Page - After.svg`) and, from 1024px, the quick view (`Desktop Quick
 * Product View Pop-up.svg` draws «(7000) 4.5» under the title). One markup, so
 * one look; a second copy in the quick view is doc 15's defect.
 *
 * The visible row is hidden from assistive tech in one piece and replaced by a
 * single sentence, because its three parts are each useless alone: an icon
 * font announces a private-use codepoint, "4.5" has no unit, and "(700)" has
 * no noun. That sentence is what satisfies "rating exposed as text, not stars
 * alone".
 *
 * Stars fill by `Math.floor`, so 4.5 draws four solid and one outline. That is
 * what every artboard shows, and rounding up would claim a rating the product
 * does not have.
 *
 * `rating.stars` is the field both callers receive: Salla's own
 * `salla-product-card-embed` hands a `getDetails()` product straight to the
 * card, which reads it the same way.
 */
export const ratingMarkup = (rating, className = '') => {
  if (!rating?.stars) {
    return '';
  }

  const filled = Math.floor(rating.stars);
  const count = rating.count || 0;
  const stars = Array.from({ length: 5 }, (_, index) =>
    index < filled
      ? '<i class="product-card__star product-card__star--filled sicon-star2"></i>'
      : '<i class="product-card__star sicon-star"></i>'
  ).join('');

  const summary = salla.lang.get('theme.product.rating_summary', {
    stars: rating.stars,
    count: count,
  });

  return `<div class="product-card__rating${className ? ` ${className}` : ''}">
      <span class="sr-only">${escapeHtml(summary)}</span>
      <span class="product-card__stars" aria-hidden="true">${stars}</span>
      <span class="product-card__rating-value" aria-hidden="true">${escapeHtml(rating.stars)}</span>
      <span class="product-card__rating-count" aria-hidden="true">(${salla.helpers.number(count)})</span>
    </div>`;
};
