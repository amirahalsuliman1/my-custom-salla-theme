import BasePage from './base-page';
import initItemListSchema from './partials/item-list-schema';

class Products extends BasePage {
    onReady() {
        // T-8.04, second pass — the ItemList node. It is built in the browser
        // because this page's Twig context carries no products at all; see the
        // header of that file for why that is not the BreadcrumbList case.
        initItemListSchema();

        const productsList = app.element('salla-products-list'),
            urlParams = new URLSearchParams(window.location.search)


        // Set Sort
        if (urlParams.has('sort')) {
            app.element('#product-filter').value = urlParams.get('sort');
        }


        // Sort Products
        app.on('change', '#product-filter', async event => {
            /**
             * T-4.18 — `pushState`, where this was `replaceState`.
             *
             * «Filter state must survive back-navigation» cannot be true of
             * `replaceState`: it overwrites the current entry, so sorting five
             * times leaves one entry and Back leaves the listing entirely.
             * Pushing gives each state somewhere to go back TO, and `popstate`
             * below is what puts the page into the state it goes back to —
             * without it the URL would change and the grid would not.
             */
            window.history.pushState(null, null, salla.helpers.addParamToUrl('sort', event.currentTarget.value));
            productsList.sortBy = event.currentTarget.value;
            await productsList.reload();
            productsList.setAttribute('filters', `{"sort": "${event.currentTarget.value}"}`)
        });

        this.restoreOnBackNavigation(productsList);

        /**
         * T-4.18 — the drawer closes when a filter is actually applied, which is
         * the behaviour upstream had and the one thing worth keeping from it.
         * Below laptop the results are behind the panel, so leaving it open
         * after a choice hides the very thing the choice changed. Above laptop
         * the filters are a column in the page and there is nothing to close —
         * `bottom-sheet::close` on a dialog that was never opened is a no-op.
         */
        salla.event.on('salla-filters::changed', filters => {
            if (Object.entries(filters || {}).length) {
                salla.event.dispatch('bottom-sheet::close', 'filters-sheet');
            }
        });

        salla.event.on('salla-products-list::products.fetched', res=>{
            this.setPageTitle(res);
            this.toggleEmptyState(res);
            this.announceCount(res);
        });


    }

    /**
     * T-4.20 — the fetched title, and why it stopped being `innerHTML`.
     *
     * This line used to be `element.innerHTML = res.title`. On a category page
     * that is upstream's intent — the docblock says the title «could be html»,
     * and a merchant's category title is authored content. **On the search page
     * the title carries the visitor's own query**, so assigning it as HTML
     * reflects whatever was put in the URL straight into the document.
     *
     * The search page therefore takes the query as text and nothing else. Every
     * other slug keeps upstream's behaviour, because narrowing it everywhere
     * would silently strip markup merchants are entitled to use.
     */
    setPageTitle(res) {
        const title = app.element('#page-main-title');

        if (!title || !res?.title) {
            return;
        }

        if (salla.config.get('page.slug') === 'product.index.search') {
            title.textContent = res.title;
            return;
        }

        title.innerHTML = res.title;
    }

    /**
     * T-4.20 — the result count, announced.
     *
     * A filter or a sort replaces the grid under someone who cannot see it
     * change; without this the only signal that anything happened is that the
     * cards are different. `polite`, because the change was asked for.
     *
     * Left empty until a count actually arrives, so the region announces a
     * change rather than reading a starting value at page load. Re-announcing
     * the same number is suppressed — it says nothing new and interrupts
     * whatever is being read.
     */
    announceCount(res) {
        const region = document.querySelector('[data-listing-count]');

        if (!region) {
            return;
        }

        const total = res?.total ?? res?.data?.length ?? res?.products?.length ?? 0;

        if (region.dataset.last === String(total)) {
            return;
        }

        region.dataset.last = String(total);
        region.textContent = salla.lang.get('theme.search.result_count', { count: total });
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

    /**
     * T-4.18 — back-navigation, which `pushState` alone does not give you.
     *
     * Pushing a state changes the URL; it does not change the page. Without
     * this, Back would step through five sort URLs while the grid stayed on
     * whichever sort was applied last — the address bar telling one story and
     * the products another, which is worse than not supporting Back at all.
     *
     * The URL is the single source of truth on the way back: whatever `sort`
     * says is put into the select and into the list, and the list is reloaded
     * once. `salla-filters` reads its own params from the same URL, so a filter
     * restored by Back arrives through its own path rather than a second one
     * kept in step here.
     */
    restoreOnBackNavigation(productsList) {
        if (!productsList) {
            return;
        }

        window.addEventListener('popstate', async () => {
            const sort = new URLSearchParams(window.location.search).get('sort');
            const select = app.element('#product-filter');

            if (select && sort && select.value !== sort) {
                select.value = sort;
            }

            productsList.sortBy = sort || '';
            await productsList.reload();
        });
    }
}

Products.initiateWhenReady([
    'product.index',
    'product.index.latest',
    'product.index.offers', 'product.index.search',
    'product.index.tag',
]);
