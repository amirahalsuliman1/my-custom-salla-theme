import Swal from 'sweetalert2';
import Anime from './partials/anime';
import initTootTip from './partials/tooltip';
import initSocialLinks from './partials/social-links';
import AppHelpers from "./app-helpers";

class App extends AppHelpers {
  constructor() {
    super();
    window.app = this;
  }

  loadTheApp() {
    this.commonThings();
    this.initiateNotifier();
    // T-3.06, on adoption: `header_is_sticky` was a bare global read, which is
    // an implicit dependency on `master.twig` having emitted it and a ReferenceError
    // if it ever does not. It is the same value, read from where it actually lives.
    if (window.header_is_sticky) {
      this.initiateStickyMenu();
    }
    this.initAddToCart();
    this.initiateDropdowns();
    this.initiateModals();
    this.initiateCollapse();

    initTootTip();
    // T-3.11 — the footer is on every page, so this is.
    initSocialLinks();
    this.loadModalImgOnclick();

    salla.comment.event.onAdded(() => window.location.reload());

    this.status = 'ready';
    document.dispatchEvent(new CustomEvent('theme::ready'));
    this.log('Theme Loaded 🎉');
  }

  log(message) {
    salla.log(`ThemeApp(Raed)::${message}`);
    return this;
  }

  loadModalImgOnclick(){
    document.querySelectorAll('.load-img-onclick').forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const modal = document.querySelector('#' + link.dataset.modalId),
          img = modal.querySelector('img'),
          imgSrc = img.dataset.src;
        modal.open();

        if (img.classList.contains('loaded')) return;

        img.src = imgSrc;
        img.classList.add('loaded');
      })
    })
  }

  commonThings() {
    this.cleanContentArticles('.content-entry');
  }

  cleanContentArticles(elementsSelector) {
    const articleElements = document.querySelectorAll(elementsSelector);

    if (articleElements.length) {
      articleElements.forEach(article => {
        article.innerHTML = article.innerHTML.replace(/&nbsp;/g, ' ')
      })
    }
  }

isElementLoaded(selector){
  return new Promise((resolve=>{
    const interval=setInterval(()=>{
    if(document.querySelector(selector)){
      clearInterval(interval)
      return resolve(document.querySelector(selector))
    }
   },160)
}))

  
  };

  copyToClipboard(event) {
    event.preventDefault();
    const aux = document.createElement("input"),
    btn = event.currentTarget;
    aux.setAttribute("value", btn.dataset.content);
    document.body.appendChild(aux);
    aux.select();
    document.execCommand("copy");
    document.body.removeChild(aux);
    this.toggleElementClassIf(btn, 'copied', 'code-to-copy', () => true);
    setTimeout(() => {
      this.toggleElementClassIf(btn, 'code-to-copy', 'copied', () => true)
    }, 1000);
  }

  initiateNotifier() {
    salla.notify.setNotifier(function (message, type, data) {
      if (window.enable_add_product_toast && data?.data?.googleTags?.event === "addToCart") {
        return;
      }
      if (typeof message == 'object') {
        return Swal.fire(message).then(type);
      }

      return Swal.mixin({
        toast: true,
        position: salla.config.get('theme.is_rtl') ? 'top-start' : 'top-end',
        showConfirmButton: false,
        timer: 2000,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      }).fire({
        icon: type,
        title: message,
        showCloseButton: true,
        timerProgressBar: true
      })
    });
  }


  initiateStickyMenu() {
    const header = this.element('#mainnav'),
      height = this.element('#mainnav .inner')?.clientHeight;
    //when it's landing page, there is no header
    if (!header) {
      return;
    }

    window.addEventListener('load', () => setTimeout(() => this.setHeaderHeight(), 500))
    window.addEventListener('resize', () => this.setHeaderHeight())

    window.addEventListener('scroll', () => {
      window.scrollY >= header.offsetTop + height ? header.classList.add('fixed-pinned', 'animated') : header.classList.remove('fixed-pinned');
      window.scrollY >= 200 ? header.classList.add('fixed-header') : header.classList.remove('fixed-header', 'animated');
    }, { passive: true });
  }

  setHeaderHeight() {
    const height = this.element('#mainnav .inner').clientHeight,
      header = this.element('#mainnav');
    header.style.height = height + 'px';
  }

  initiateDropdowns() {
    this.onClick('.dropdown__trigger', ({ target: btn }) => {
      btn.parentElement.classList.toggle('is-opened');
      document.body.classList.toggle('dropdown--is-opened');
      // Click Outside || Click on close btn
      window.addEventListener('click', ({ target: element }) => {
        if (!element.closest('.dropdown__menu') && element !== btn || element.classList.contains('dropdown__close')) {
          btn.parentElement.classList.remove('is-opened');
          document.body.classList.remove('dropdown--is-opened');
        }
      });
    });
  }

  initiateModals() {
    this.onClick('[data-modal-trigger]', e => {
      const id = '#' + e.target.dataset.modalTrigger;
      this.removeClass(id, 'hidden');
      setTimeout(() => this.toggleModal(id, true)); //small amont of time to running toggle After adding hidden
    });
    salla.event.document.onClick("[data-close-modal]", e => this.toggleModal('#' + e.target.dataset.closeModal, false));
  }

  toggleModal(id, isOpen) {
    this.toggleClassIf(`${id} .s-salla-modal-overlay`, 'ease-out duration-300 opacity-100', 'opacity-0', () => isOpen)
      .toggleClassIf(`${id} .s-salla-modal-body`,
        'ease-out duration-300 opacity-100 translate-y-0 sm:scale-100', //add these classes
        'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95', //remove these classes
        () => isOpen)
      .toggleElementClassIf(document.body, 'modal-is-open', 'modal-is-closed', () => isOpen);
    if (!isOpen) {
      setTimeout(() => this.addClass(id, 'hidden'), 350);
    }
  }

  initiateCollapse() {
    document.querySelectorAll('.btn--collapse')
      .forEach((trigger) => {
        const content = document.querySelector('#' + trigger.dataset.show);
        if (!content) return;

        const state = { isOpen: false }

        const toggleState = (isOpen) => {
          state.isOpen = !isOpen;
          this.toggleElementClassIf([content, trigger], 'is-closed', 'is-opened', () => isOpen);
        }

        trigger.addEventListener('click', () => {
          const { isOpen } = state;
          toggleState(isOpen);
        });
      });
  }


  /**
   * Workaround for seeking to simplify & clean, There are three ways to use this method:
   * 1- direct call: `this.anime('.my-selector')` - will use default values
   * 2- direct call with overriding defaults: `this.anime('.my-selector', {duration:3000})`
   * 3- return object to play it letter: `this.anime('.my-selector', false).duration(3000).play()` - will not play animation unless calling play method.
   * @param {string|HTMLElement} selector
   * @param {object|undefined|null|null} options - in case there is need to set attributes one by one set it `false`;
   * @return {Anime|*}
   */
  anime(selector, options = null) {
    const anime = new Anime(selector, options);
    return options === false ? anime : anime.play();
  }

  /**
   * These actions are responsible for pressing "add to cart" button,
   * they can be from any page, especially when mega-menu is enabled
   */
  initAddToCart() {
    salla.cart.event.onUpdated(summary => {
      document.querySelectorAll('[data-cart-total]').forEach(el => el.innerHTML = salla.money(summary.total));
      document.querySelectorAll('[data-cart-count]').forEach(el => el.innerText = salla.helpers.number(summary.count));
    });

    salla.cart.event.onItemAdded((response, prodId) => {
      app.element('salla-cart-summary').animateToCart(app.element(`#product-${prodId} img`));
    });

    /**
     * T-4.11 — the loading state, which the component owns and never triggers.
     *
     * `salla-button` ships `load()`/`stop()`, and `salla-add-product-button`
     * even renders it with `loader-position="center"` — the centred spinner is
     * already configured. But the add path calls `disable()` alone: nine other
     * components in the same package call `btn.load()`, this one does not. So
     * the request flew with nothing but a greyed button to show for it, and on
     * a slow connection that reads as a dead control, which is how a customer
     * ends up adding the same product three times.
     *
     * `disabled` is the component's own signal, so it drives the spinner rather
     * than a second guess at when the request starts and stops. Every ending
     * path — validation refused, request resolved, request rejected — calls
     * `enable()`, so the attribute going away is the one reliable terminator;
     * listening for the `success`/`failed` events instead would hang the
     * spinner forever on a validation failure, which emits neither. Booking and
     * `type="submit"` never call `disable()`, so they never spin: correct by
     * construction rather than by a special case.
     *
     * The observer is attached on first click because that is the first moment
     * the element is certain to be hydrated and to have its inner button.
     */
    document.addEventListener('click', (event) => {
      const host = event.target?.closest?.('salla-add-product-button');
      const btn = host?.querySelector('salla-button');

      if (!btn || btn.dataset.busyBound) {
        return;
      }

      btn.dataset.busyBound = 'true';

      new MutationObserver(() => {
        const isBusy = btn.hasAttribute('disabled');

        // `aria-busy` is what carries the spinner to a screen reader; the
        // spinner itself is decorative and announces nothing on its own.
        host.setAttribute('aria-busy', isBusy ? 'true' : 'false');
        isBusy ? btn.load?.() : btn.stop?.();
      }).observe(btn, { attributes: true, attributeFilter: ['disabled'] });
    }, true);

    /**
     * T-4.11 — the success state. Doc 04 asks for loading, success and error to
     * be "implemented consistently", and the failure below is a toast, so this
     * is a toast. Nothing in the platform sends one: the SDK's only
     * `notify.success` references are the `salla.success` alias, not a call on
     * this path.
     *
     * Registered as its own listener rather than folded into the animation
     * above, because that line dereferences `salla-cart-summary` unguarded and
     * throws on any page without one — which would take the confirmation down
     * with it, on exactly the pages most likely to lack a cart summary.
     */
    salla.cart.event.onItemAdded(() => {
      salla.notify.success(salla.lang.get('theme.cart.add_success'));
    });

    /**
     * T-4.11 — the failure that was a silent no-op.
     *
     * `salla-add-product-button` catches an add failure, emits its `failed`
     * event and calls `btn.enable()` — and shows nothing. The SDK dispatches
     * `cart.event.itemAddedFailed` and does not notify either: the whole
     * twilight bundle contains **one** `notify.error` call, and it is not on
     * this path. Nothing in this theme listened. So a customer whose add failed
     * — out of stock between page load and click, an unselected required
     * option, a network error — got a button that flickered and went back to
     * how it was, which reads as "nothing happened" rather than as an error.
     *
     * The message is the platform's own wherever it sends one; the catalogue
     * string is the fallback for the cases that carry no message, because an
     * empty toast is the same silence in a different shape.
     */
    salla.cart.event.onItemAddedFailed((error) => {
      const message =
        (typeof error === 'string' && error) ||
        error?.response?.data?.error?.message ||
        error?.error?.message ||
        error?.message ||
        salla.lang.get('theme.cart.add_failed');

      salla.notify.error(message);
    });
  }
}

salla.onReady(() => (new App).loadTheApp());
