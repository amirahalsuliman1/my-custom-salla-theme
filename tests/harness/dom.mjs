/**
 * T-1.09 — a document per test, and the reason it has to be per test.
 *
 * THE FILES UNDER TEST RUN AT IMPORT. `wishlist-card.js` calls
 * `customElements.define` at module scope; `cart.js` and `product.js` end with
 * `initiateWhenReady`, which constructs the page object outright. That is not
 * incidental — it is how a Twilight theme boots, and a test that reached past it
 * to call a method directly would be testing a function the browser never calls
 * that way.
 *
 * So the import *is* the boot, and everything a test wants to observe has to be
 * in place first: the DOM the page will query, the `salla` it will register
 * against, the `app` it will watch elements with. The module then has to be
 * evaluated **again** for the next test, against the next document — which is
 * what `loadFresh` is for, and why a shared window will not do. A class created
 * by `class X extends HTMLElement` is bound to the `HTMLElement` that was global
 * when it was evaluated; hand it to a second jsdom and the upgrade throws.
 *
 * WHAT IS POLYFILLED AND WHY IT IS NOT A SHORTCUT. jsdom has no
 * IntersectionObserver, and T-4.14's whole design is «create the element on
 * intersection». A fake one is not a workaround for the missing API — it is the
 * only way to test the behaviour at all, since a real observer needs a layout
 * engine and would fire on jsdom's zero-height everything. The fake records its
 * targets and fires when the test says so, which is what makes «nothing exists
 * before intersection» an assertion rather than a hope.
 */
import { JSDOM } from 'jsdom';
import AppHelpers from '../../src/assets/js/app-helpers.js';
import { createSalla } from './salla.mjs';

/** Globals a browser has and Node does not; installed and removed as a set. */
const FROM_WINDOW = [
  'window', 'document', 'navigator', 'location', 'history', 'localStorage', 'sessionStorage',
  'Node', 'Element', 'HTMLElement', 'HTMLInputElement', 'HTMLFormElement', 'HTMLAnchorElement',
  'DocumentFragment', 'ShadowRoot', 'HTMLDialogElement', 'DOMException',
  'CustomEvent', 'Event', 'MouseEvent', 'KeyboardEvent',
  'MutationObserver', 'customElements', 'FormData', 'DOMParser', 'getComputedStyle',
  'requestAnimationFrame', 'cancelAnimationFrame', 'matchMedia',
];

/**
 * A controllable IntersectionObserver.
 *
 * `instances` is a module-level list rather than a global so a test reaches it
 * by import, and `createDom` clears it — otherwise an observer from test 3 is
 * still visible to test 4 and «the observer disconnected after firing» passes
 * against the wrong object.
 */
export const observers = { intersection: [] };

class FakeIntersectionObserver {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.options = options;
    this.targets = [];
    this.disconnected = false;
    observers.intersection.push(this);
  }

  observe(target) {
    this.targets.push(target);
  }

  unobserve(target) {
    this.targets = this.targets.filter((t) => t !== target);
  }

  disconnect() {
    this.disconnected = true;
    this.targets = [];
  }

  /**
   * What the browser does when the target scrolls into view — including doing
   * nothing once disconnected. Firing a disconnected observer would let a test
   * pass against code no browser would ever run.
   */
  trigger(isIntersecting = true) {
    if (this.disconnected || !this.targets.length) {
      return false;
    }

    this.callback(
      this.targets.map((target) => ({ target, isIntersecting })),
      this,
    );
    return true;
  }
}

/**
 * `<dialog>`, which jsdom 29 reflects but does not operate.
 *
 * It gives `HTMLDialogElement` the `open` attribute and nothing else — no
 * `showModal`, no `close`. T-2.10 is built on exactly those two methods, and
 * every overlay in this theme is built on T-2.10, so without this the sheets
 * simply never open and every assertion about them passes vacuously.
 *
 * WHAT IT IMPLEMENTS: `show()`, `showModal()`, `close()`, the `open` property,
 * `returnValue`, and the `close` event — the observable contract the theme's own
 * code uses, including `showModal()` on an already-open dialog throwing
 * `InvalidStateError` and `close()` on a closed one doing nothing silently. That
 * last one is load-bearing: `auth.js` depends on it to stop a close round trip
 * from recursing.
 *
 * WHAT IT DELIBERATELY DOES NOT IMPLEMENT: the focus trap, Esc-to-close, focus
 * return to the opener, the top layer, and document inertness. Those are the
 * four reasons T-2.10 chose `<dialog>` over `salla-modal` in the first place, and
 * they belong to the browser. Simulating them here would produce tests that pass
 * against a simulation of the very thing under discussion — a test asserting
 * «Esc closes the sheet» would be asserting that this function works. **They are
 * verified by hand in T-8.06 and T-8.11, and are not claimed here.**
 */
function installDialog(window) {
  const { HTMLDialogElement, Event: WindowEvent } = window;

  if (typeof HTMLDialogElement.prototype.showModal === 'function') {
    return; // A future jsdom implements it; defer to the real thing.
  }

  Object.defineProperties(HTMLDialogElement.prototype, {
    open: {
      configurable: true,
      get() {
        return this.hasAttribute('open');
      },
      set(value) {
        this.toggleAttribute('open', Boolean(value));
      },
    },
    returnValue: {
      configurable: true,
      writable: true,
      value: '',
    },
    show: {
      configurable: true,
      writable: true,
      value() {
        this.setAttribute('open', '');
      },
    },
    showModal: {
      configurable: true,
      writable: true,
      value() {
        if (this.hasAttribute('open')) {
          throw new window.DOMException(
            'The element already has an "open" attribute, and therefore cannot be opened modally.',
            'InvalidStateError',
          );
        }

        this.setAttribute('open', '');
        this.__isModal = true;
      },
    },
    close: {
      configurable: true,
      writable: true,
      value(returnValue) {
        // Spec: a dialog that is not open is not closed again, and fires nothing.
        if (!this.hasAttribute('open')) {
          return;
        }

        if (returnValue !== undefined) {
          this.returnValue = returnValue;
        }

        this.removeAttribute('open');
        this.__isModal = false;
        this.dispatchEvent(new WindowEvent('close'));
      },
    },
  });
}

/**
 * The `app` global. Upstream's real `App` extends `AppHelpers` but also imports
 * SweetAlert, the notifier and the sticky menu — none of which any file under
 * test calls. The helpers are the part the page modules use, so they are the
 * real ones; `log` is App's and is the only method added back.
 */
class TestApp extends AppHelpers {
  constructor() {
    super();
    this.status = 'ready';
    this.logs = [];
  }

  log(message) {
    this.logs.push(message);
    return this;
  }
}

let installed = null;

/**
 * Globals are installed and restored through descriptors, not assignment.
 *
 * Node 24 defines `navigator` as an accessor with no setter, so `globalThis.navigator = …`
 * throws — and `Event`, `CustomEvent` and `FormData` are Node's own, which means
 * teardown has to put back what was there rather than delete it, or the test
 * runner loses the runtime it is standing on.
 */
function captureGlobals(names) {
  return names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
}

function defineGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
    enumerable: true,
  });
}

function restoreGlobals(captured) {
  for (const [name, descriptor] of captured) {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor);
    } else {
      delete globalThis[name];
    }
  }
}

/**
 * Build a document, install the browser globals, and return the levers.
 *
 * @param {object}  options
 * @param {string}  options.html          Body markup the page module will find.
 * @param {string}  options.pageSlug      What `salla.config.get('page.slug')` answers.
 * @param {object}  options.translations  Locale entries this test asserts against.
 */
export function createDom({ html = '', pageSlug = null, translations = {} } = {}) {
  teardownDom();

  const dom = new JSDOM(`<!doctype html><html dir="rtl" lang="ar"><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    url: 'https://example.test/',
  });

  const { window } = dom;
  const previous = captureGlobals([...FROM_WINDOW, 'IntersectionObserver', 'salla', 'app']);

  installDialog(window);

  for (const name of FROM_WINDOW) {
    const value = window[name];

    // Bare functions (`getComputedStyle`, `matchMedia`) lose their receiver when
    // lifted off the window; constructors must not be bound or `new` breaks.
    defineGlobal(name, typeof value === 'function' && !/^[A-Z]/.test(name)
      ? value.bind(window)
      : value);
  }

  window.IntersectionObserver = FakeIntersectionObserver;
  defineGlobal('IntersectionObserver', FakeIntersectionObserver);
  observers.intersection.length = 0;

  const { salla, control } = createSalla({ pageSlug, translations });

  defineGlobal('salla', salla);
  window.salla = salla;

  const app = new TestApp();

  defineGlobal('app', app);
  window.app = app;

  installed = { dom, window, previous };

  return { dom, window, document: window.document, salla, control, app, observers };
}

export function teardownDom() {
  if (!installed) {
    return;
  }

  installed.window.close();
  restoreGlobals(installed.previous);

  observers.intersection.length = 0;
  installed = null;
}

/**
 * Import a source file so that it evaluates **now**, against the document that
 * was just built, however many times it has been imported before.
 *
 * The query string is the whole mechanism: ESM caches by resolved URL, so a
 * unique one is a new module instance. It is a real cost — every version stays
 * in the registry for the life of the process — and it is the price of testing
 * files whose boot is their public behaviour.
 *
 * @param {string} relativePath Path from the repository root, e.g. `src/assets/js/cart.js`.
 */
let generation = 0;

export function loadFresh(relativePath) {
  const url = new URL(`../../${relativePath}`, import.meta.url);

  url.search = `?fresh=${(generation += 1)}`;
  return import(url.href);
}

/** Let queued microtasks (a settled platform promise, a MutationObserver) run. */
export function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
