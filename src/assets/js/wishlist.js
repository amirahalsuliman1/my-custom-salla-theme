import BasePage from './base-page';

class Wishlist extends BasePage {

    onReady() {
        // init wishlist icons in product cards
        salla.storage.get('salla::wishlist', []).forEach(id => this.toggleFavoriteIcon(id));
    }

    registerEvents() {

        salla.wishlist.event.onAdded((event, id) => this.toggleFavoriteIcon(id));

        salla.wishlist.event.onRemoved((response, id) => {

            this.toggleFavoriteIcon(id, false);

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

        if (label) {
            btn.setAttribute('aria-label', label);
        }
    }
}

Wishlist.initiateWhenReady();
