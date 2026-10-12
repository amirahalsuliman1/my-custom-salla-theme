import BasePage from './base-page';

class Wishlist extends BasePage {

    onReady() {
        // init wishlist icons in product cards
        salla.storage.get('salla::wishlist', []).forEach(id => this.toggleFavoriteIcon(id));
    }

    registerEvents() {

        salla.wishlist.event.onAdded((event, id) => {
            this.toggleFavoriteIcon(id);
            this.announce('theme.product.wishlist_added');
        });

        salla.wishlist.event.onRemoved((response, id) => {

            this.toggleFavoriteIcon(id, false);
            this.announce('theme.product.wishlist_removed');

            // just an animation when the item removed from wishlist page
            const item = document.querySelector('#wishlist-product-' + id);

            if(!item){
                return;
            }

            item.style.height = item.offsetHeight + 'px';
            void item.offsetWidth; // trigger reflow
            item.classList.add('fade-out-collapse');

            item.addEventListener('transitionend', function handler(e) {
                if (e.propertyName === 'opacity') {
                    item.removeEventListener('transitionend', handler);
                    item.remove();
                    if (!document.querySelector('#wishlist>*')) {
                        window.location.reload();
                    }
                }
            });
        });
    }

    /**
     * T-7.08 — the toast `Story Page – Toast Notification.pdf` draws.
     *
     * **THAT ARTBOARD IS A WISHLIST TOAST, NOT A SHARE ONE.** It shows the story
     * view open over the feed with «تمت إضافة المنتج إلى المفضلة بنجاح» above it —
     * the result of the modal's own «أضف للمفضلة», which T-7.07 built. There is no
     * share control anywhere in any story artboard, so the task's Web Share API
     * and clipboard criteria describe something the design does not draw.
     *
     * IT LIVES HERE AND NOT IN THE STORY MODAL, AND THAT IS THE POINT. This file
     * already owns every wishlist subscription and ships in the `app` bundle, so
     * one addition announces the result **wherever a wishlist button is** — the
     * story view, the product card's heart, the PDP. Wiring it into the story
     * modal alone would have left the same action silent everywhere else, which
     * is two behaviours for one thing.
     *
     * It is `salla.notify`, which is T-2.12's restyled notifier — no second
     * toast implementation, and nothing here decides what a toast looks like.
     */
    announce(key) {
        salla.notify?.success?.(salla.lang.get(key));
    }

    toggleFavoriteIcon(id, isAdded = true) {
        document.querySelectorAll('.btn--wishlist[data-id="' + id + '"]')
            .forEach(btn => {
                app.toggleElementClassIf(btn, 'is-added', 'not-added', () => isAdded);
                // app.toggleElementClassIf(btn, 'pulse', 'un-favorited', () => isAdded);
                this.syncFavoriteState(btn, isAdded);
            });
    }

    /**
     * T-4.01 — the same state, for people who cannot see a filled heart.
     *
     * Upstream toggles two classes and stops there, so a screen-reader user
     * activating this button gets no confirmation that anything happened — colour
     * and fill are the only channels, which doc 13 forbids as the sole carrier.
     * `aria-pressed` is announced by the screen reader the moment it flips, with
     * focus already on the button, so the confirmation needs no live region.
     *
     * The two labels ride on the button as data attributes rather than being
     * looked up here. That keeps the copy in the template, where `trans()` lives
     * and where the locale files can see it, and it means this method works for
     * any wishlist button in the theme without knowing which page it is on.
     */
    syncFavoriteState(btn, isAdded) {
        btn.setAttribute('aria-pressed', String(isAdded));

        const label = isAdded ? btn.dataset.labelRemove : btn.dataset.labelAdd;

        if (!label) {
            return;
        }

        btn.setAttribute('aria-label', label);

        /**
         * T-7.07 — the same label, visibly, where the button has text.
         *
         * The product card's control is an icon, so `aria-label` alone was the
         * whole story. The story view's is a text button reading «أضف للمفضلة»,
         * and setting only the accessible name there would leave the two
         * disagreeing — WCAG 2.5.3 asks that the accessible name contain the
         * visible label, and a sighted screen-reader user would hear "remove"
         * while reading "add". Text buttons mark their label
         * `[data-wishlist-text]`; icon buttons have none and are unaffected.
         */
        const text = btn.querySelector('[data-wishlist-text]');

        if (text) {
            text.textContent = label;
        }
    }
}

Wishlist.initiateWhenReady();
