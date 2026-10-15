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
import { escapeHtml, ratingMarkup } from './product-runtime';

/**
 * The tier at which the desktop artboard takes over — `from-laptop` in
 * `01-settings/breakpoints.scss`. Read here only to choose which drawn state an
 * option row opens in; everything that is layout stays in the stylesheet.
 */
const DESKTOP = '(min-width: 1024px)';

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
     * «متبقي 5 قطع فقط!» — the artboards draw the line at five and say nothing
     * about when it appears, so the count is the merchant's
     * (`low_stock_threshold`, written onto the root by `quick-view.twig`). Five
     * is that setting's default, kept here only for a root without it.
     */
    const threshold = Number(QuickView.root?.getAttribute('data-low-stock-threshold'));

    QuickView.lowStock = Number.isFinite(threshold) && threshold > 0 ? threshold : 5;
    QuickView.optionCount = 0;

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

    // The sheet's own controls: a thumbnail, the rail's up/down, an option row.
    sheet.addEventListener('click', (event) => {
      const thumb = event.target.closest?.('[data-quick-view-thumb]');
      const step = event.target.closest?.('[data-quick-view-step]');
      const option = event.target.closest?.('[data-quick-view-option]');

      if (thumb) {
        QuickView.select(thumb);
      } else if (step) {
        QuickView.step(Number(step.getAttribute('data-quick-view-step')));
      } else if (option) {
        QuickView.toggleOption(option);
      }
    });

    /**
     * The desktop stepper's value rides on the add button as its `quantity`,
     * which is what `salla-add-product-button` sends — the sheet is not a form,
     * so nothing else would carry it. `salla-quantity-input` fires `change` on
     * its own input, bubbling, once its value has settled.
     */
    sheet.addEventListener('change', (event) => {
      const stepper = event.target.closest?.('.quick-view__quantity');
      const button = QuickView.content.querySelector('salla-add-product-button');
      const quantity = parseInt(event.detail?.quantity ?? event.target.value, 10);

      if (stepper && button && quantity > 0) {
        button.setAttribute('quantity', String(quantity));
      }
    });

    /**
     * A REQUIRED OPTION IS NEVER LEFT CLOSED. `salla-product-options` validates
     * with `reportValidity()`, which fires `invalid` on the field before the
     * browser points at it. Caught on the way down, the row is open by the time
     * the browser looks — so a collapsed «+» row cannot block the add silently.
     */
    sheet.addEventListener('invalid', (event) => {
      const row = event.target.closest?.('.s-product-options-option');
      const toggle = row?.querySelector('[data-quick-view-option]');

      if (toggle) {
        QuickView.toggleOption(toggle, true);
      }
    }, true);

    /**
     * `salla-product-options` fetches its own options and renders after this
     * file has written the sheet, and again whenever its options change, so its
     * rows are taken as they arrive rather than at render.
     */
    if (typeof MutationObserver === 'function' && QuickView.content) {
      new MutationObserver(() => QuickView.discloseOptions())
        .observe(QuickView.content, { childList: true, subtree: true });
    }
  }

  /**
   * A thumbnail shows its image in the main slot; the pressed state moves, the
   * rail's ends say whether there is anything further, and the four-thumbnail
   * window follows the selection.
   */
  static select(thumb) {
    const main = QuickView.sheet.querySelector('[data-quick-view-image]');
    const thumbs = [...QuickView.sheet.querySelectorAll('[data-quick-view-thumb]')];
    const index = thumbs.indexOf(thumb);

    if (!main || index < 0) {
      return;
    }

    main.src = thumb.getAttribute('data-quick-view-thumb');
    thumbs.forEach((el) => el.setAttribute('aria-pressed', el === thumb ? 'true' : 'false'));

    QuickView.sheet.querySelectorAll('[data-quick-view-step]').forEach((button) => {
      const end = Number(button.getAttribute('data-quick-view-step')) < 0 ? 0 : thumbs.length - 1;

      button.setAttribute('aria-disabled', index === end ? 'true' : 'false');
    });

    QuickView.reveal(thumb);
  }

  /**
   * `aria-disabled` rather than `disabled` at either end: a focused button that
   * becomes disabled drops focus to the page, and a keyboard user pressing
   * «down» to the last image would be thrown out of the dialog's flow.
   */
  static step(direction) {
    const thumbs = [...QuickView.sheet.querySelectorAll('[data-quick-view-thumb]')];
    const current = thumbs.findIndex((el) => el.getAttribute('aria-pressed') === 'true');
    const next = thumbs[current + direction];

    if (next) {
      QuickView.select(next);
    }
  }

  /**
   * Only the thumbnail list scrolls — `scrollIntoView` would move the dialog
   * and the page behind it too. No `behavior` is passed, so the list's own
   * `scroll-behavior` decides, and T-2.03's reduced-motion clamp reaches it.
   */
  static reveal(thumb) {
    const list = thumb.closest('.quick-view__thumbs');

    if (!list?.scrollBy) {
      return;
    }

    const box = thumb.getBoundingClientRect();
    const frame = list.getBoundingClientRect();

    if (box.top < frame.top) {
      list.scrollBy({ top: box.top - frame.top });
    } else if (box.bottom > frame.bottom) {
      list.scrollBy({ top: box.bottom - frame.bottom });
    }
  }

  /**
   * «اختر لون الـ …» AS A DISCLOSURE. `Quick Product View Pop-up.pdf` draws each
   * option row closed, a «+» at its end and a hairline under it; the desktop
   * artboard draws the same row open, «−» and the swatches. Two states of one
   * control (B7), so each row opens in the state its viewport's artboard draws.
   *
   * The control is added beside Salla's own label, not made out of it: the
   * `<label for>` keeps naming its field, and is only hidden from the eye
   * (quick-view.scss) because the button now carries the same words. The
   * panel's state is `hidden`, never a class — `salla-product-options` skips
   * validating any field inside `.hidden`, which would let a required option be
   * skipped. The mark is T-7.02's `.disclosure-mark`, keyed off `aria-expanded`.
   */
  static discloseOptions() {
    const rows = QuickView.content.querySelectorAll('salla-product-options .s-product-options-option');

    if (!rows.length) {
      return;
    }

    const open = Boolean(globalThis.matchMedia?.(DESKTOP)?.matches);

    rows.forEach((row) => {
      const label = [...row.children].find((el) => el.matches('.s-product-options-option-label'));
      const panel = [...row.children].find((el) => el.matches('.s-product-options-option-content'));
      const name = label?.querySelector('b')?.textContent.trim() || label?.textContent.trim();

      if (row.querySelector('[data-quick-view-option]') || !panel || !name
        || label.classList.contains('s-product-options-option-label-hidden')) {
        return;
      }

      QuickView.optionCount += 1;
      panel.id = panel.id || `quick-view-option-${QuickView.optionCount}`;

      const toggle = document.createElement('button');

      toggle.type = 'button';
      toggle.className = 'quick-view__option-toggle';
      toggle.setAttribute('data-quick-view-option', '');
      toggle.setAttribute('aria-controls', panel.id);
      toggle.innerHTML = `<span>${QuickView.escape(name)}</span><span class="disclosure-mark" aria-hidden="true"></span>`;
      row.insertBefore(toggle, label);
      QuickView.toggleOption(toggle, open);
    });
  }

  static toggleOption(toggle, force) {
    const panel = document.getElementById(toggle.getAttribute('aria-controls'));
    const open = force === undefined ? toggle.getAttribute('aria-expanded') !== 'true' : force;

    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (panel) {
      panel.hidden = !open;
    }
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
     * The remaining count is shown only where the merchant shows it — Salla's
     * `can_show_remained_quantity`, the switch the product page honours — and
     * only once it is at or under the merchant's threshold, which is what makes
     * «فقط» true.
     */
    const lowStock = product.can_show_remained_quantity && !product.is_hidden_quantity
      && Number.isFinite(remaining) && remaining > 0 && remaining <= QuickView.lowStock;

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
     *
     * The thumbnails are a rail laid over the photograph's inline-start edge,
     * four at a time between a «previous» and a «next» button, as drawn. The
     * buttons step the selection, so they move the main image too — a pair
     * that only scrolled the strip would leave a keyboard user two stops from
     * the thing that changed.
     */
    const images = (product.images || [])
      .map(image => image?.url || image)
      .filter(url => typeof url === 'string' && url);

    if (!images.length && (product.image?.url || product.thumbnail)) {
      images.push(product.image?.url || product.thumbnail);
    }

    const thumbs = images.slice(0, 5);
    const railButton = (step, icon, key, disabled) => `
          <button type="button" class="quick-view__rail-btn" data-quick-view-step="${step}"
                  aria-disabled="${disabled ? 'true' : 'false'}"
                  aria-label="${QuickView.escape(salla.lang.get(key))}">
            <i class="sicon-${icon}" aria-hidden="true"></i>
          </button>`;

    const media = images.length ? `
      <div class="quick-view__media">
        <img class="quick-view__image" src="${QuickView.escape(images[0])}" alt="${QuickView.escape(product.name)}"
             width="600" height="750" decoding="async" data-quick-view-image>
        ${thumbs.length > 1 ? `<div class="quick-view__rail">
          ${railButton(-1, 'keyboard_arrow_up', 'theme.product.quick_view_previous_image', true)}
          <ul class="quick-view__thumbs">${thumbs.map((url, index) => `
          <li>
            <button type="button" class="quick-view__thumb" data-quick-view-thumb="${QuickView.escape(url)}"
                    aria-pressed="${index === 0 ? 'true' : 'false'}"
                    aria-label="${QuickView.escape(salla.lang.get('theme.product.quick_view_image', { number: index + 1 }))}">
              <img src="${QuickView.escape(url)}" alt="" width="48" height="48" loading="lazy" decoding="async">
            </button>
          </li>`).join('')}</ul>
          ${railButton(1, 'keyboard_arrow_down', 'theme.product.quick_view_next_image', false)}
        </div>` : ''}
      </div>` : '';

    /**
     * The desktop artboard's stepper, «− 1 +» on its own row above the buy row;
     * the mobile artboard draws none, so it is not displayed below 1024px. It
     * is the product page's own `salla-quantity-input`, under the product
     * page's own condition — a product with a hidden quantity, or a booking,
     * gets none there either. The component names its input itself.
     */
    const quantity = product.is_hidden_quantity || product.type === 'booking' ? '' : `
      <salla-quantity-input class="quick-view__quantity" value="1" name="quantity"${product.max_quantity ? ` max="${QuickView.escape(product.max_quantity)}"` : ''}></salla-quantity-input>`;

    /**
     * The current price comes first, so it takes the inline start — right in
     * Arabic, as both artboards draw «595» before the struck «700» — and is the
     * first price a screen reader hears, as on the product page.
     *
     * The rating is the desktop artboard's «(7000) 4.5» under the title; mobile
     * draws none, so it is not displayed below 1024px. It renders only for a
     * product with a rating, which needs the store's ratings switched on.
     *
     * «عرض تفاصيل المنتج» ends in the diagonal arrow both artboards draw — the
     * RTL/LTR pair `orders/cancel-dialog.twig` already uses, chosen by
     * direction rather than mirrored in CSS. Decorative: the words name the page.
     */
    QuickView.content.innerHTML = `${media}
      <div class="quick-view__info">
      <div class="quick-view__head">
        ${product.brand?.name ? `<a class="quick-view__brand" href="${QuickView.escape(product.brand.url || '#')}">${QuickView.escape(product.brand.name)}</a>` : ''}
        <h3 class="quick-view__title">${QuickView.escape(product.name)}</h3>
        ${ratingMarkup(product.rating, 'quick-view__rating')}
        <p class="quick-view__prices">
          <span class="quick-view__price">${salla.money(product.price)}</span>
          ${hasSale ? `<span class="quick-view__price--was"><span class="sr-only">${QuickView.escape(salla.lang.get('theme.common.was_price'))}</span>${salla.money(product.regular_price)}</span>` : ''}
        </p>
      </div>

      <salla-product-options product-id="${QuickView.escape(product.id)}"></salla-product-options>

      ${lowStock
        ? `<p class="quick-view__stock"><i class="sicon-bell" aria-hidden="true"></i>${QuickView.escape(salla.lang.get('theme.product.only_left', { count: remaining }))}</p>`
        : ''}
      ${quantity}

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
        <span>${QuickView.escape(salla.lang.get('theme.product.view_details'))}</span>
        <i class="ui-icon sicon-arrow-up-${document.documentElement.dir === 'rtl' ? 'left' : 'right'} text-base" aria-hidden="true"></i>
      </a>
      </div>`;

    QuickView.setState('ready');
  }
}

salla.onReady(() => salla.lang.onLoaded(() => QuickView.boot()));

export default QuickView;
