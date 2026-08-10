import BasePage from './base-page';
import MobileMenu from 'mmenu-light';
class Products extends BasePage {
    onReady() {
        const productsList = app.element('salla-products-list'),
            urlParams = new URLSearchParams(window.location.search)


        // Set Sort
        if (urlParams.has('sort')) {
            app.element('#product-filter').value = urlParams.get('sort');
        }


        // Sort Products
        app.on('change', '#product-filter', async event => {
            window.history.replaceState(null, null, salla.helpers.addParamToUrl('sort', event.currentTarget.value));
            productsList.sortBy = event.currentTarget.value;
            await productsList.reload();
            productsList.setAttribute('filters', `{"sort": "${event.currentTarget.value}"}`)
        });

        salla.event.on('salla-products-list::products.fetched', res=>{
            res.title && (app.element('#page-main-title').innerHTML = res.title);
            this.toggleEmptyState(res);
        });


        this.initiateMobileMenu()
    }

    /**
     * T-4.19 — the empty result, swapped for T-2.14's.
     *
     * `salla-products-list` renders its own placeholder — a bag and a sentence,
     * and **no way onward**. It does not emit `.no-content-placeholder` either,
     * so T-2.14's retune, which reaches five upstream templates without editing
     * any of them, misses this one. Rather than replace the component, its
     * placeholder is hidden and T-2.14's is shown in its place: a future SDK
     * that gives it an action needs only this hiding removed.
     *
     * `hidden` rather than a class, so the inactive one leaves the accessibility
     * tree as well as the page — an empty state read out underneath a full grid
     * would be worse than no empty state at all.
     *
     * The count comes from the response rather than from counting cards in the
     * DOM: the cards are web components and may not have upgraded yet at the
     * moment this runs.
     */
    toggleEmptyState(res) {
        const empty = document.querySelector('[data-listing-empty]');
        const list = app.element('salla-products-list');

        if (!empty || !list) {
            return;
        }

        const total = res?.data?.length ?? res?.products?.length ?? 0;
        const isEmpty = total === 0;

        empty.hidden = !isEmpty;
        list.classList.toggle('listing--has-empty-state', isEmpty);
    }

    initiateMobileMenu() {
        const trigger = app.element("a[href='#filters-menu']"),
            close = app.element("button.close-filters");
        let filters = app.element("#filters-menu");

        if (!filters) {
            return;
        }
        filters = new MobileMenu(filters, "(max-width: 1024px)", "( slidingSubmenus: false)");
        const drawer = filters.offcanvas({ position: salla.config.get('theme.is_rtl') ? "right" : 'left' });
        trigger.addEventListener('click', event => {
            document.body.classList.add('filters-opened');
            event.preventDefault() || drawer.close() || drawer.open()
        });
        close.addEventListener('click', event => {
            document.body.classList.remove('filters-opened');
            event.preventDefault() || drawer.close()
        });
        salla.event.on('salla-filters::changed', filters => {
            if (!Object.entries(filters).length) {
                return
            }
            document.body.classList.remove('filters-opened');
            drawer.close()
        })
    }
}

Products.initiateWhenReady([
    'product.index',
    'product.index.latest',
    'product.index.offers', 'product.index.search',
    'product.index.tag',
]);
