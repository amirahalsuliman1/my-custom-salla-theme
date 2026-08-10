import BasePage from './base-page';
import {validateProductOptions} from './partials/validate-product-options';
class Cart extends BasePage {
    onReady() {
        // keep update the dom base in the events
        salla.event.cart.onUpdated(data => this.updateCartPageInfo(data));

        app.watchElements({
            freeShipping: '#free-shipping',
            freeShippingBar: '#free-shipping-bar',
            freeShippingMsg: '#free-shipping-msg',
            freeShipApplied: '#free-shipping-applied',
            cartGifting: '#cart-gifting',
            sallaGifting:'#salla-gifting'
        });

        this.initSubmitCart();
        this.initCartItemControls();
        this.initCouponAccessibility();
        validateProductOptions();
    }

    /**
     * T-4.15 — one live region for everything this page has to say.
     *
     * Quantity already has its own in T-2.09's `quantity.js`; this one carries
     * what that file cannot know about — a product leaving the cart. Created
     * once and left in the DOM, because a live region inserted at the moment it
     * fills is not reliably read.
     */
    announce(message) {
        if (!this._region) {
            this._region = document.createElement('span');
            this._region.className = 'sr-only';
            this._region.setAttribute('role', 'status');
            this._region.setAttribute('aria-live', 'polite');
            document.body.append(this._region);
        }

        this._region.textContent = message;
    }

    /**
     * T-4.15 — the bin that lives in the quantity pill.
     *
     * THE ARTBOARD'S PILL HAS THREE SLOTS, NOT FOUR: bin, number, plus. At
     * quantity 1 there is nothing for «−» to do, so the design puts a remove
     * there instead — and `salla-quantity-input` turns out to expose a
     * `decrement-button` slot for precisely this kind of substitution, with a
     * `hasDecrementSlot` flag that suppresses its own minus when one is passed.
     * That is why this is a slot and a listener rather than a control of ours.
     *
     * THE CLICK IS TAKEN IN THE CAPTURE PHASE, which is the whole trick. The
     * component binds its own `onClick` to that button; stopping propagation
     * while the event is still descending means `decrease()` never runs, so the
     * value cannot be clamped to 1 and silently do nothing behind the bin.
     * Above 1 the event is left alone and the component decrements as normal.
     *
     * The button's accessible name moves with the glyph. A control that reads
     * "decrease quantity" while showing a bin would describe an action it no
     * longer performs, and colour is never the only channel by which the change
     * is announced — the name changes, and so does the shape.
     */
    initCartItemControls() {
        const inputOf = (quantity) => quantity?.querySelector('.s-quantity-input-input');

        const syncMinState = (quantity) => {
            const input = inputOf(quantity);
            if (!input) return;

            const atMin = Number(input.value) <= 1;
            const button = quantity.querySelector('.s-quantity-input-decrease-button');

            quantity.toggleAttribute('data-at-min', atMin);
            // `getWithDefault` for the platform key, matching how the component
            // itself reads it — `get` would render the key when it is absent.
            button?.setAttribute('aria-label', atMin
                ? salla.lang.get('theme.cart.remove_item')
                : salla.lang.getWithDefault('common.elements.decrease_quantity', 'Decrease quantity'));
        };

        const syncAll = () => document.querySelectorAll('.cart-item salla-quantity-input').forEach(syncMinState);

        /**
         * Delegated and re-run on `cart::updated`, because rows are re-rendered
         * by the component after this file runs — binding each control once at
         * boot would leave every later row without a bin.
         */
        document.addEventListener('input', (event) => {
            const quantity = event.target.closest?.('salla-quantity-input');
            if (quantity) syncMinState(quantity);
        });

        document.addEventListener('click', (event) => {
            const button = event.target.closest?.('.s-quantity-input-decrease-button');
            const quantity = button?.closest('salla-quantity-input');
            const input = inputOf(quantity);
            const itemId = quantity?.getAttribute('cart-item-id');

            if (!input || !itemId || Number(input.value) > 1) {
                return;
            }

            event.stopPropagation();
            event.preventDefault();

            const name = quantity.getAttribute('data-item-name') || '';

            salla.cart.deleteItem(itemId)
                .then(() => {
                    this.announce(salla.lang.get('theme.cart.item_removed', { name }));
                    document.querySelector(`#item-${itemId}`)?.remove();
                })
                .catch(() => salla.notify.error(salla.lang.get('theme.cart.remove_failed')));
        }, true);

        salla.event.cart.onUpdated(() => syncAll());
        salla.lang.onLoaded(() => syncAll());
        syncAll();
    }

    /**
     * T-4.15 — the coupon error, made reachable.
     *
     * `salla-cart-coupons` renders its failure as a bare
     * `<span class="s-cart-coupons-coupon-error">`: no `role`, no `aria-live`,
     * no `aria-describedby` binding it to the field, no `aria-invalid` on the
     * field. Read in the component's source. So a rejected code is a red line
     * for people who can see red lines, and for everyone else the form simply
     * does not proceed and never says why.
     *
     * Three separate gaps, three fixes: the text is mirrored into a live region
     * so it is spoken, the field is marked invalid so the state is exposed, and
     * the two are associated so moving to the field reads the reason. The
     * component is not modified and its own element is left where it is.
     */
    initCouponAccessibility() {
        const coupons = document.querySelector('salla-cart-coupons');
        if (!coupons) return;

        const ERROR_ID = 'cart-coupon-error';
        let lastMessage = null;

        new MutationObserver(() => {
            const error = coupons.querySelector('.s-cart-coupons-coupon-error');
            const field = coupons.querySelector('input');
            const message = error?.textContent?.trim() || '';

            if (field) {
                field.setAttribute('aria-invalid', message ? 'true' : 'false');

                if (message) {
                    error.id = ERROR_ID;
                    field.setAttribute('aria-describedby', ERROR_ID);
                } else {
                    field.removeAttribute('aria-describedby');
                }
            }

            // Only when it changes: repeating the same rejection interrupts
            // whatever is being read to say nothing new.
            if (message !== lastMessage) {
                lastMessage = message;
                if (message) this.announce(message);
            }
        }).observe(coupons, { childList: true, subtree: true, characterData: true });
    }

    initSubmitCart() {
        const submitBtn = document.querySelector('#cart-submit');
        
        if (!submitBtn) {
            return;
        }
        
        app.onClick(submitBtn, event => {
            const cartForms = document.querySelectorAll('form[id^="item-"]');
            let isValid = true;
            cartForms.forEach(form => {
                isValid = isValid && form.reportValidity();
                if (!isValid) {
                    event.preventDefault();
                    salla.notify.error(salla.lang.get('common.messages.required_fields'));
                    return;
                }
            });
    
            if (isValid) {
                /** @type HTMLSallaButtonElement */
                const btn = event.currentTarget;

                // Keep loading state (also disables the button) until the page redirects.
                const keepLoading = new MutationObserver(() => {
                    if (!btn.hasAttribute('loading')) {
                        btn.setAttribute('loading', '');
                    }
                });
                // Release it if we won't redirect (guest gets a login modal, or submit fails),
                // so the spinner never gets stuck.
                const stopLoading = () => {
                    keepLoading.disconnect();
                    btn.stop();
                };
                salla.event.once('login::open', stopLoading);
                salla.event.once('cart::submit.failed', stopLoading);

                btn.load();
                keepLoading.observe(btn, { attributes: true, attributeFilter: ['loading'] });
                salla.cart.submit();
            }
        });
    }

    updateCartOptions(options) {
      if (!options || !options.length) return;

      const arrayTwoId = options.map((item) => (item.id));

      document.querySelectorAll('.cart-options form')?.forEach((form) => {
        if (!arrayTwoId.includes(form.id.value)) {
          form.remove();
        }
      })
    }
    
    /**
     * @param {import("@salla.sa/twilight/types/api/cart").CartSummary} cartData
     */
    updateCartPageInfo(cartData) {
        //if item deleted & there is no more items, just reload the page
        if (!cartData.count) {
            // clear cart options from the dom before page reload
            document.querySelector('.cart-options')?.remove();
            return window.location.reload();
        }
        // toggle physical gifting depned on giftable flag
        app.toggleElementClassIf(app.cartGifting, 'active', 'hidden', () => cartData?.gift?.enabled);
        // Use toggleAttribute to handle the `physical-products` attribute
        app.sallaGifting?.toggleAttribute('physical-products', cartData?.gift?.type === 'physical');
        app.sallaGifting?.toggleAttribute('digital-products', cartData?.gift?.type === 'digital');

        // update the dom for cart options
        this.updateCartOptions(cartData?.options);
        // update each item data
        cartData.items?.forEach(item => this.updateItemInfo(item));

        // Summary totals (subtotal, discount, shipping, tax, options) are owned by
        // <salla-cart-summary-card> now; the theme only manages the free-shipping bar.
        app.toggleElementClassIf(app.freeShipping, 'has_free', 'hidden', () => !!cartData.free_shipping_bar);

        if (!cartData.free_shipping_bar) {
            return;
        }

        const isFree = cartData.free_shipping_bar.has_free_shipping;
        app.toggleElementClassIf(app.freeShippingBar, 'active', 'hidden', () => !isFree)
            .toggleElementClassIf(app.freeShipApplied, 'active', 'hidden', () => isFree);

        app.freeShippingMsg.innerHTML = isFree
            ? salla.lang.get('pages.cart.has_free_shipping')
            : salla.lang.get('pages.cart.free_shipping_alert', { amount: salla.money(cartData.free_shipping_bar.remaining) });
        app.freeShippingBar.children[0].style.width = cartData.free_shipping_bar.percent + '%';

    }

    /**
     * @param {import("@salla.sa/twilight/types/api/cart").CartItem} item
     */
    updateItemInfo(item) {
        // lets get the elements for this item
        const cartItem = document.querySelector('#item-' + item.id);
        if (!cartItem) {
            salla.log(`Can't get the cart item dom for ${item.id}!`);
            return;
        }
        const totalElement = cartItem.querySelector('.item-total'),
            priceElement = cartItem.querySelector('.item-price'),
            regularPriceElement = cartItem.querySelector('.item-regular-price'),
            itemOriginalPrice = cartItem.querySelector('.item-original-price'),
            weightRow = cartItem.querySelector('.item-weight-row'),
            weightElement = cartItem.querySelector('.item-weight'),
            offerElement = cartItem.querySelector('.offer-name'),
            oldOffers = cartItem.querySelector('.old-offers'),
            freeRibbon = cartItem.querySelector('.free-ribbon'),
            offerIconElement = cartItem.querySelector('.offer-icon'),
            hasSpecialPrice = item.offer || item.special_price > 0,
            hasSalePrice = item.is_on_sale,
            newOffersActive = item.detailed_offers?.length > 0 ;
        const item_total = item.detailed_offers?.length > 0 ? item.total_special_price : item.total;
        const total = salla.money(item_total);
        if (total !== totalElement.innerHTML) {
            totalElement.innerHTML = total;
            // app.anime(totalElement, { scale: [.88, 1] });
        }

        app.toggleElementClassIf([offerElement, oldOffers], 'offer-applied', 'hidden', () => hasSpecialPrice && !newOffersActive)
            .toggleElementClassIf([regularPriceElement, offerIconElement], 'offer-applied', 'hidden', () => hasSpecialPrice)
            .toggleElementClassIf([itemOriginalPrice], 'offer-applied', 'hidden', () => hasSalePrice)
            /**
             * T-4.15 — was `'text-red-400'` / `'text-sm text-gray-400'`. Those
             * are raw Tailwind palette values landing on an element the template
             * colours from a token, so after the first `cart::updated` the price
             * stopped matching the design — and only then, which is the kind of
             * drift that never shows up on a first look at the page.
             *
             * The artboard draws the current price in the same dark whether or
             * not an offer applies, so the modifier changes no colour. It is
             * kept as the hook the state is expressed through rather than
             * dropped, because losing it would take the discounted state out of
             * the DOM entirely.
             */
            .toggleElementClassIf(priceElement, 'cart-item__price--discounted', 'cart-item__price--regular', () => hasSpecialPrice)
            // `Number(...)`: `item.price` arrives as a Money object on some
            // paths, so the loose `== 0` upstream relied on was doing real
            // coercion work. Stated rather than removed.
            .toggleElementClassIf(freeRibbon, 'active', 'hidden', () => Number(item.price) === 0);

        priceElement.innerHTML = salla.money(item.price);

        if (weightElement) {
            weightElement.innerHTML = item.weight_label || '';
        }
        app.toggleElementClassIf(weightRow, 'has-weight', 'hidden', () => !!item.weight_label);

        // Update original price when item is on sale
        if (hasSalePrice) {
            itemOriginalPrice.innerHTML = salla.money(item.original_price);
        }

        if (!hasSpecialPrice){return;}
        if (!newOffersActive) {offerElement.innerHTML = item.offer.names;}
        regularPriceElement.innerHTML = salla.money(item.product_price);
    }
}

Cart.initiateWhenReady(['cart']);
