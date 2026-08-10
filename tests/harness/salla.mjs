/**
 * T-1.09 — the platform, stubbed to the surface the theme actually touches.
 *
 * WHY A STUB AND NOT THE REAL SDK. `@salla.sa/twilight` is a browser bundle that
 * expects a store, a session and a network. Loading it would make every test
 * here a test of Salla's SDK, which is not this theme's to verify and not this
 * theme's to break. What the theme owns is its *use* of that surface — that it
 * calls `salla.cart.deleteItem` rather than deleting a row itself, that it reads
 * a price through `salla.money`, that it announces from `onRemoved` rather than
 * from a click. A recording stub is what makes those assertable.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO. It does not simulate the platform's
 * behaviour. `deleteItem` does not remove anything; it records the id and hands
 * back a promise the test resolves. Every stub that would otherwise have to
 * guess at platform semantics instead exposes a lever, so a test states the
 * platform response it is testing against rather than inheriting one from here.
 *
 * TRANSLATIONS RETURN THEIR KEY unless the test supplies one. That is on
 * purpose: an assertion reading `theme.cart.remove_item` names the locale entry
 * it depends on, so deleting that key from `ar.json` fails a test rather than
 * shipping a blank label. `{placeholder}` interpolation is applied when a test
 * does supply a string, because the announcements are graded on carrying a
 * product name and a key alone cannot show that.
 */

/** A deferred promise, so a test drives the platform's timing rather than racing it. */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  // An unhandled rejection here would fail the whole run for a promise the code
  // under test is expected to `.catch()`. This keeps the failure local.
  promise.catch(() => {});

  return { promise, resolve, reject };
}

export function createSalla({ pageSlug = null, translations = {} } = {}) {
  /** Every listener the theme registers, so tests fire the real platform events. */
  const listeners = {
    ready: [],
    langLoaded: [],
    cartUpdated: [],
    wishlistRemoved: [],
    priceUpdated: [],
  };

  const calls = {
    dispatched: [],
    events: [],
    once: [],
    wishlistToggled: [],
    getDetails: [],
    deleteItem: [],
    notifyError: [],
    warned: [],
    logged: [],
    updateSettings: [],
  };

  /** Pending platform promises, newest last, for the test to settle. */
  const pending = {
    getDetails: [],
    deleteItem: [],
    updateSettings: [],
  };

  const translate = (key, params) => {
    const template = Object.hasOwn(translations, key) ? translations[key] : key;

    if (!params) {
      return template;
    }

    return Object.entries(params).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template,
    );
  };

  const salla = {
    /**
     * `onReady` fires immediately rather than deferring. Two of the files under
     * test do their whole registration inside it, and a stub that queued would
     * make every test await a tick to observe a synchronous boot.
     */
    onReady: (callback) => {
      listeners.ready.push(callback);
      callback();
    },

    log: (message) => calls.logged.push(message),
    logger: {
      warn: (message) => calls.warned.push(message),
      error: (message) => calls.warned.push(message),
    },

    config: {
      get: (key) => (key === 'page.slug' ? pageSlug : undefined),
    },

    lang: {
      get: translate,
      getWithDefault: (key, fallback) =>
        (Object.hasOwn(translations, key) ? translations[key] : fallback),
      onLoaded: (callback) => {
        listeners.langLoaded.push(callback);
        callback();
      },
    },

    /**
     * Deliberately not a currency formatter. The theme is graded on passing the
     * platform's number through untouched, so a recognisable wrapper makes a
     * hand-formatted price visible in a diff instead of plausible.
     */
    money: (value) => `SAR ${value}`,

    event: {
      dispatch: (name, payload) => calls.dispatched.push({ name, payload }),
      on: (name, callback) => calls.events.push({ name, callback }),
      once: (name, callback) => calls.once.push({ name, callback }),
      cart: {
        onUpdated: (callback) => listeners.cartUpdated.push(callback),
      },
    },

    cart: {
      deleteItem: (id) => {
        const d = deferred();

        calls.deleteItem.push(id);
        pending.deleteItem.push(d);
        return d.promise;
      },
      submit: () => {},
    },

    wishlist: {
      toggle: (id) => calls.wishlistToggled.push(id),
      event: {
        onRemoved: (callback) => listeners.wishlistRemoved.push(callback),
      },
    },

    product: {
      api: {
        getDetails: (id) => {
          const d = deferred();

          calls.getDetails.push(id);
          pending.getDetails.push(d);
          return d.promise;
        },
      },
      event: {
        onPriceUpdated: (callback) => listeners.priceUpdated.push(callback),
      },
    },

    /**
     * T-5.08. Deferred rather than resolved, because the behaviour under test is
     * what the theme does *after* the platform answers — and the interesting
     * answer is the rejection, where a consent switch must go back to what is
     * actually stored.
     */
    profile: {
      updateSettings: (payload) => {
        const d = deferred();

        calls.updateSettings.push(payload);
        pending.updateSettings.push(d);
        return d.promise;
      },
    },

    notify: {
      error: (message) => calls.notifyError.push(message),
      success: () => {},
    },

    comment: { event: { onAdded: () => {} } },
  };

  /** The levers. Kept off `salla` itself so a test cannot mistake one for platform API. */
  const control = {
    calls,
    pending,
    listeners,
    translations,

    /** Fire `salla.event.cart.onUpdated` with the payload the platform would carry. */
    emitCartUpdated: (data = {}) => listeners.cartUpdated.forEach((cb) => cb(data)),

    /** Fire `salla.wishlist.event.onRemoved`. */
    emitWishlistRemoved: (data = {}) => listeners.wishlistRemoved.forEach((cb) => cb(data)),

    /** Fire `salla.product.event.onPriceUpdated`, in the shape the SDK sends. */
    emitPriceUpdated: (data = {}) => listeners.priceUpdated.forEach((cb) => cb({ data })),

    /** Settle the oldest unsettled `getDetails` / `deleteItem` call. */
    resolveGetDetails: (value) => pending.getDetails.shift().resolve(value),
    rejectGetDetails: (error = new Error('failed')) => pending.getDetails.shift().reject(error),
    resolveDeleteItem: (value = {}) => pending.deleteItem.shift().resolve(value),
    rejectDeleteItem: (error = new Error('failed')) => pending.deleteItem.shift().reject(error),
    resolveUpdateSettings: (value = {}) => pending.updateSettings.shift().resolve(value),
    rejectUpdateSettings: (error = new Error('failed')) =>
      pending.updateSettings.shift().reject(error),

    /**
     * Fire a platform event the theme subscribed to with `salla.event.on(name)`.
     * The stub records those rather than dispatching them, so this is how a test
     * plays the platform's side of a named event.
     */
    emit: (name, payload) =>
      calls.events.filter((entry) => entry.name === name).forEach((entry) => entry.callback(payload)),
  };

  return { salla, control };
}
