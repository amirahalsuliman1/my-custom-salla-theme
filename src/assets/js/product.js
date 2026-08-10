import 'lite-youtube-embed';
import BasePage from './base-page';
import Fslightbox from 'fslightbox';
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
      const button = document.querySelector('salla-add-product-button');
      if (!button) return;

      let currentPrice = null;
      const stamp = () => currentPrice !== null && button
        .querySelectorAll('.total-price')
        .forEach(el => { if (el.innerHTML !== currentPrice) el.innerHTML = currentPrice; });

      new MutationObserver(stamp).observe(button, { childList: true, subtree: true });

      salla.product.event.onPriceUpdated((res) => {
        currentPrice = salla.money(res.data.price);
        stamp();
      });
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
