// T-8.03 — see `vendor/media.js`. `product/single.twig` loads that bundle
// before this one; the `window` assignment below stays here, because upstream
// markup reaches for the global and its timing must not move.
import BasePage from './base-page';
import { Fslightbox } from './vendor/media';
window.fslightbox = Fslightbox;
import { zoom } from './partials/image-zoom';
import initProductGallery from './partials/product-gallery';

class Product extends BasePage {
    onReady() {
        app.watchElements({
            totalPrice: '.total-price',
            productWeight: '.product-weight',
            beforePrice: '.before-price',
            startingPriceTitle: '.starting-price-title',
            productSku: '.product-sku',
        });

        this.initProductOptionValidations();
        this.keepButtonPriceInSync();
        this.initRelatedProducts();

        // T-4.09 — the thumbnails' announced state and the scroll indicator.
        // Runs regardless of the zoom setting: keyboard access to the gallery is
        // not an enhancement a merchant toggles.
        initProductGallery();

        if (window.imageZoom) {
            // call the function when the page is ready
            this.initImagesZooming();
            // listen to screen resizing
            window.addEventListener('resize', () => this.initImagesZooming());
        }
    }

    initProductOptionValidations() {
      document.querySelector('.product-form')?.addEventListener('change', function(){
        // reportValidity() natively focuses/scrolls to the first empty required option mid-edit; read validity instead
        const isComplete = Array.from(this.elements).every(el => el.validity.valid);
        isComplete && salla.product.getPrice(new FormData(this));
      });
    }

    /**
     * T-4.11 — the price inside the add-to-cart button, kept true.
     *
     * The artboard puts the price inside the button, and the button is a
     * component that owns its own label: `salla-add-product-button` reads
     * `host.innerHTML` ONCE, at `componentWillLoad`, and re-writes that captured
     * string into `.s-button-text` on EVERY render. Two consequences, both of
     * which break the price and neither of which is visible in the markup:
     *
     *   · the `.total-price` node the template wrote is discarded and replaced
     *     by a clone, so `app.watchElements` — which caches at `onReady` — can
     *     be holding a detached node, and writing to it updates nothing;
     *   · any later re-render restores the LOAD-TIME price. The component
     *     re-renders on `product-options::change` whenever the merchant has
     *     notify-on-availability enabled, which is precisely the moment the
     *     price changes. The button would show a stale price for the variant
     *     the customer just chose — the wrong number on the buy action.
     *
     * So the node is never held onto and never trusted: the current price is
     * kept here, and re-stamped whenever the component rewrites its label. The
     * value check makes the write idempotent, so re-stamping cannot feed itself.
     */
    keepButtonPriceInSync() {
      const actions = document.querySelector('.product-actions');
      const button = actions?.querySelector('salla-add-product-button');
      if (!button) return;

      /**
       * T-4.12 — the starting value, and the reason it has to come from the
       * template rather than from the button.
       *
       * With `support-sticky-bar` set and a mobile viewport — the DEFAULT, since
       * `sticky_add_to_cart` ships on — the component stops honouring the markup
       * it captured and rewrites its label from `getLabel()` on every render.
       * The price span does not survive that, so there is nothing to read a
       * starting price out of, and nothing to re-stamp either. `data-price` is
       * the value the server already rendered.
       */
      let currentPrice = actions.dataset.price || null;

      const stamp = () => {
        if (currentPrice === null) return;

        const existing = button.querySelectorAll('.total-price');

        if (existing.length) {
          existing.forEach(el => { if (el.innerHTML !== currentPrice) el.innerHTML = currentPrice; });
          return;
        }

        /**
         * The span is gone, so the component has just rewritten its own label.
         * Put the price back at the inline start, in front of whatever label it
         * chose — never replacing it. `getLabel()` is also what says «نفد
         * المخزون» and «اطلب مسبقًا», and overwriting those would put a buy
         * price on a button that cannot buy.
         *
         * Nothing is added while the button is disabled, which is exactly the
         * out-of-stock case: a price beside an unavailable product is an offer
         * the store is not making.
         */
        const label = button.querySelector('.s-button-text');
        if (!label || button.hasAttribute('disabled')) return;

        const price = document.createElement('span');
        price.className = 'product-actions__price total-price';
        price.setAttribute('aria-hidden', 'true');
        price.innerHTML = currentPrice;
        label.prepend(price);
      };

      new MutationObserver(stamp).observe(button, { childList: true, subtree: true });

      salla.product.event.onPriceUpdated((res) => {
        currentPrice = salla.money(res.data.price);
        stamp();
      });

      stamp();
    }

    /**
     * T-4.14 — the recommendations, created when they are nearly in view.
     *
     * TWO THINGS MADE THIS A SCRIPT RATHER THAN AN ATTRIBUTE, and both are in
     * `salla-products-slider`'s own lifecycle:
     *
     *   · it fetches in `componentWillLoad`, so the request leaves with the page
     *     no matter how far down the block sits;
     *   · `componentDidRender` then **removes `loading="lazy"` from every image
     *     it rendered** — on a `setInterval`, ten times — so the images cannot be
     *     left lazy either.
     *
     * Neither is reachable from CSS or from a prop. The only lever is *when the
     * element exists*, so the element is created here, on intersection. `200px`
     * of root margin means it is already loading by the time it is reached
     * rather than starting blank underneath the reader.
     *
     * ABSENT CLEANLY WHEN THERE IS NOTHING TO SHOW. The component sets
     * `isReady = true` on an empty response as readily as on a full one, so a
     * product with no related products still renders «منتجات مشابهة» over an
     * empty rail. The container is removed when the slider has settled with no
     * items — measured from the DOM rather than from the global
     * `products.fetched` event, which carries no way to tell whose slider it is.
     */
    initRelatedProducts() {
      const container = document.querySelector('[data-related-slider]');

      if (!container || !('IntersectionObserver' in window)) {
        return;
      }

      const create = () => {
        const slider = document.createElement('salla-products-slider');

        slider.setAttribute('data-testid', 'store-product-related');
        slider.setAttribute('source', 'related');
        slider.setAttribute('source-value', container.dataset.relatedId);
        slider.setAttribute('block-title', container.dataset.relatedTitle);
        slider.setAttribute('display-all-url', '');

        if (container.dataset.relatedLimit) {
          slider.setAttribute('limit', container.dataset.relatedLimit);
        }

        container.append(slider);
        Product.dropWhenEmpty(container, slider);
      };

      new IntersectionObserver((entries, observer) => {
        if (!entries[0].isIntersecting) return;

        observer.disconnect();
        create();
      }, { rootMargin: '200px' }).observe(container);
    }

    /**
     * The slider renders a `<salla-slider>` with an items slot; an empty result
     * gives that slot no children. Watching the container until it has stopped
     * changing is what tells the two apart without racing the render — a single
     * check straight after `append` would always see nothing.
     */
    static dropWhenEmpty(container, slider) {
      let settle;

      const check = () => {
        const rendered = slider.querySelector('[slot="items"]');

        if (!rendered) return;

        if (!rendered.children.length) {
          container.remove();
        }

        observer.disconnect();
      };

      const observer = new MutationObserver(() => {
        clearTimeout(settle);
        settle = setTimeout(check, 150);
      });

      observer.observe(slider, { childList: true, subtree: true });
    }

    initImagesZooming() {
      // skip if the screen is not desktop or if glass magnifier
      // is already crated for the image before
      const imageZoom = document.querySelector('.image-slider .magnify-wrapper.swiper-slide-active .img-magnifier-glass');
      if (window.innerWidth  < 1024 || imageZoom) return;
      setTimeout(() => {
          // set delay after the resizing is done, start creating the glass
          // to create the glass in the proper position
          const image = document.querySelector('.image-slider .swiper-slide-active img');
          zoom(image?.id, 2);
      }, 250);
  

      document.querySelector('salla-slider.details-slider').addEventListener('slideChange', () => {
          // set delay till the active class is ready
          setTimeout(() => {
              const imageZoom = document.querySelector('.image-slider .swiper-slide-active .img-magnifier-glass');
    
              // if the zoom glass is already created skip
              if (window.innerWidth  < 1024 || imageZoom) return;
              const image = document.querySelector('.image-slider .magnify-wrapper.swiper-slide-active img');
              zoom(image?.id, 2);
          }, 250)
      })
    }

    registerEvents() {
      salla.event.on('product::price.updated.failed',()=>{
        app.element('.price-wrapper').classList.add('hidden');
        const outOfStock = app.element('.out-of-stock');
        outOfStock.classList.remove('hidden');
        outOfStock.classList.remove('scale-pulse');
        void outOfStock.offsetWidth; // trigger reflow
        outOfStock.classList.add('scale-pulse');
      })
      salla.product.event.onPriceUpdated((res) => {

        app.element('.out-of-stock').classList.add('hidden')
        app.element('.price-wrapper').classList.remove('hidden')

        const data = res.data,
            is_on_sale = data.has_sale_price && data.regular_price > data.price;

        app.startingPriceTitle?.classList.add('hidden');

        app.productWeight.forEach((el) => {el.innerHTML = data.weight || ''});
        app.totalPrice.forEach((el) => {el.innerHTML = salla.money(data.price)});
        app.beforePrice.forEach((el) => {el.innerHTML = salla.money(data.regular_price)});
        app.productSku.forEach((el) => {el.innerHTML = data.sku || ''});

        app.toggleClassIf('.price_is_on_sale','showed','hidden', ()=> is_on_sale)
        app.toggleClassIf('.starting-or-normal-price','hidden','showed', ()=> is_on_sale)

        document.querySelectorAll('.total-price, .product-weight').forEach(el => {
          el.classList.remove('scale-pulse');
          void el.offsetWidth; // trigger reflow
          el.classList.add('scale-pulse');
        });
      });

      app.onClick('#btn-show-more', e => app.all('#more-content', div => {
        e.target.classList.add('is-expanded');
        div.style = `max-height:${div.scrollHeight}px`;
      }) || e.target.remove());
    }
}

Product.initiateWhenReady(['product.single']);
