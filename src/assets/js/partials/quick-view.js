/**
 * T-4.13 — the quick product view.
 *
 * WHAT THIS FILE IS NOT. It is not an overlay: T-2.10's sheet is, and every
 * focus, `Esc`, backdrop, scroll-lock and above-tablet-dialog behaviour this
 * task is graded on belongs to that primitive already. It is not an add-to-cart
 * or an options widget either — those are `salla-add-product-button` and
 * `salla-product-options`, the same two elements the product page uses, given
 * the same product id. **Doc 15's "no duplicated business logic" is met by not
 * writing any:** nothing here decides a price, validates an option, or adds
 * anything to a cart. This file fetches a product and arranges four components.
 *
 * FETCHED ON OPEN, WHICH IS THE POINT. A category grid holds thirty cards; a
 * quick view that preloaded would make thirty product requests to serve the one
 * a customer might open. `salla.product.api.getDetails(id)` runs on the click
 * and the result is cached per id, so reopening the same card costs nothing and
 * opening a different one costs exactly one request.
 */
import { escapeHtml } from './product-runtime';

class QuickView {
  static boot() {
    const sheet = document.getElementById('quick-view-sheet');

    if (!sheet) {
      return;
    }

    QuickView.sheet = sheet;
    QuickView.cache = new Map();
    QuickView.root = sheet.querySelector('[data-quick-view-root]');
    QuickView.loading = sheet.querySelector('[data-quick-view-loading]');
    QuickView.content = sheet.querySelector('[data-quick-view-content]');
    QuickView.error = sheet.querySelector('[data-quick-view-error]');
    QuickView.title = sheet.querySelector('.sheet__title');

    /**
     * Delegated, because cards are web components rendered after this runs —
     * and on an infinite-scroll grid they keep arriving. Binding each button
     * would cover only the first screenful.
     */
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest?.('[data-quick-view]');

      if (!trigger) {
        return;
      }

      event.preventDefault();
      QuickView.open(trigger.getAttribute('data-quick-view'));
    });

    // A thumbnail shows its image in the main slot; the pressed state moves.
    sheet.addEventListener('click', (event) => {
      const thumb = event.target.closest?.('[data-quick-view-thumb]');
      const main = sheet.querySelector('[data-quick-view-image]');

      if (!thumb || !main) {
        return;
      }

      main.src = thumb.getAttribute('data-quick-view-thumb');
      sheet.querySelectorAll('[data-quick-view-thumb]').forEach((el) => {
        el.setAttribute('aria-pressed', el === thumb ? 'true' : 'false');
      });
    });
  }

  static open(productId) {
    if (!productId) {
      return;
    }

    QuickView.setState('loading');
    salla.event.dispatch('bottom-sheet::open', 'quick-view-sheet');

    if (QuickView.cache.has(productId)) {
      QuickView.render(QuickView.cache.get(productId));
      return;
    }

    salla.product.api.getDetails(productId)
      .then((response) => {
        const product = response?.data || response;

        QuickView.cache.set(productId, product);
        QuickView.render(product);
      })
      .catch(() => QuickView.setState('error'));
  }

  /**
   * One place decides which of the three states is showing, so they cannot
   * both be visible and cannot both be hidden. `hidden` rather than a class:
   * it takes the inactive states out of the accessibility tree as well as out
   * of the page, which a `display:none` class would also do but less obviously.
   */
  static setState(state) {
    QuickView.loading.hidden = state !== 'loading';
    QuickView.content.hidden = state !== 'ready';
    QuickView.error.hidden = state !== 'error';

    if (state === 'error') {
      QuickView.error.textContent = salla.lang.get('theme.product.quick_view_failed');
      QuickView.title.textContent = salla.lang.get('theme.product.quick_view');
    }
  }

  /**
   * T-1.09, on writing the tests this file never had — **the escape was wrong
   * for the context it is used in, and this is the fix.**
   *
   * It used to build a `<span>`, set `textContent` and read `innerHTML` back.
   * That is a correct escape for *text*, and the serializer deliberately leaves
   * `"` and `'` alone there because they need no escaping between tags. Nine of
   * this file's ten uses are inside a **quoted attribute** — two of them `href`
   * — where a bare `"` closes the attribute early. A product url of
   * `" onmouseover="…` therefore injected a real event handler.
   *
   * `escapeHtml` is `product-runtime.js`'s, which escapes both quotes, and is
   * already what `product-card.js`, `add-product-toast.js` and
   * `video-carousel.js` do. This file was the only one doing something else.
   * Importing it rather than writing a fourth copy is doc 15's rule.
   */
  static escape(value) {
    return escapeHtml(value);
  }

  static render(product) {
    if (!product) {
      QuickView.setState('error');
      return;
    }

    /**
     * The dialog's accessible name becomes the product's, which is the whole
     * reason the title is hidden rather than removed. Until this line runs the
     * sheet is announced as «عرض سريع» — generic, but true while it is loading.
     */
    QuickView.title.textContent = product.name || salla.lang.get('theme.product.quick_view');

    const hasSale = product.regular_price && product.regular_price > product.price;
    const remaining = Number(product.quantity);

    /**
     * `salla-product-options` and `salla-add-product-button` are given the
     * product id and left alone. They fetch, validate and add exactly as they
     * do on the product page — which is what stops this sheet from becoming a
     * second implementation of the buy flow that drifts from the first.
     *
     * The price rides inside the button as it does in T-4.11, carrying
     * `total-price` so the option-change price update reaches it through the
     * same path rather than a second binding.
     */
    /**
     * The desktop gallery (`Desktop Quick Product View Pop-up.svg`, 2026-10-14):
     * the main image and up to five thumbnails, beside the details from 1024px.
     * The mobile artboard draws no image, so the block is not displayed below
     * that — it is written either way, so a resize needs no second render.
     */
    const images = (product.images || [])
      .map(image => image?.url || image)
      .filter(url => typeof url === 'string' && url);

    if (!images.length && (product.image?.url || product.thumbnail)) {
      images.push(product.image?.url || product.thumbnail);
    }

    const media = images.length ? `
      <div class="quick-view__media">
        <img class="quick-view__image" src="${QuickView.escape(images[0])}" alt="${QuickView.escape(product.name)}"
             width="600" height="750" decoding="async" data-quick-view-image>
        ${images.length > 1 ? `<ul class="quick-view__thumbs">${images.slice(0, 5).map((url, index) => `
          <li>
            <button type="button" class="quick-view__thumb" data-quick-view-thumb="${QuickView.escape(url)}"
                    aria-pressed="${index === 0 ? 'true' : 'false'}"
                    aria-label="${QuickView.escape(salla.lang.get('theme.product.quick_view_image', { number: index + 1 }))}">
              <img src="${QuickView.escape(url)}" alt="" width="64" height="64" loading="lazy" decoding="async">
            </button>
          </li>`).join('')}</ul>` : ''}
      </div>` : '';

    QuickView.content.innerHTML = `${media}
      <div class="quick-view__info">
      <div class="quick-view__head">
        ${product.brand?.name ? `<a class="quick-view__brand" href="${QuickView.escape(product.brand.url || '#')}">${QuickView.escape(product.brand.name)}</a>` : ''}
        <h3 class="quick-view__title">${QuickView.escape(product.name)}</h3>
        <p class="quick-view__prices">
          ${hasSale ? `<span class="quick-view__price--was"><span class="sr-only">${QuickView.escape(salla.lang.get('theme.common.was_price'))}</span>${salla.money(product.regular_price)}</span>` : ''}
          <span class="quick-view__price">${salla.money(product.price)}</span>
        </p>
      </div>

      <salla-product-options product-id="${QuickView.escape(product.id)}"></salla-product-options>

      ${Number.isFinite(remaining) && remaining > 0 && remaining <= 5
        ? `<p class="quick-view__stock"><i class="sicon-bell" aria-hidden="true"></i>${QuickView.escape(salla.lang.get('theme.product.only_left', { count: remaining }))}</p>`
        : ''}

      <div class="product-actions quick-view__actions" data-price="${QuickView.escape(salla.money(product.price))}">
        <salla-add-product-button
          product-id="${QuickView.escape(product.id)}"
          product-status="${QuickView.escape(product.status || 'sale')}"
          product-type="${QuickView.escape(product.type || 'product')}"
          width="wide">
          <span class="product-actions__price total-price" aria-hidden="true">${salla.money(product.price)}</span>
          <span>${QuickView.escape(salla.lang.getWithDefault('pages.cart.add_to_cart', 'Add to cart'))}</span>
        </salla-add-product-button>

        <salla-button
          class="btn--wishlist product-actions__wishlist"
          data-id="${QuickView.escape(product.id)}"
          onclick="salla.wishlist.toggle('${QuickView.escape(product.id)}')"
          aria-pressed="false"
          aria-label="${QuickView.escape(salla.lang.get('theme.product.add_to_wishlist'))}"
          shape="icon"
          fill="outline"
          color="light">
          <i class="sicon-heart" aria-hidden="true"></i>
        </salla-button>
      </div>

      <a class="quick-view__details" href="${QuickView.escape(product.url || '#')}">
        ${QuickView.escape(salla.lang.get('theme.product.view_details'))}
      </a>
      </div>`;

    QuickView.setState('ready');
  }
}

salla.onReady(() => salla.lang.onLoaded(() => QuickView.boot()));

export default QuickView;
