/**
 * T-5.01 — the sign-in sheet's bridge.
 *
 * This file is the reason T-5.01 has a test at all. The template is markup and
 * the stylesheet is a box, but `auth.js` makes one assertion about somebody
 * else's component — that `salla-login-modal[inline]` drives its visibility
 * through an unassigned `this.modal` — and **the whole task collapses if that
 * assertion stops being true.** An SDK upgrade that assigns `modal` in the inline
 * branch, or renames it, would leave the sign-in link on every page silently
 * doing nothing. These cases fail loudly instead.
 *
 * The `salla-login-modal` here is a stand-in that reproduces the two behaviours
 * read out of the real component's source — `open()`/`openModal()` reaching for
 * `this.modal`, and `close()` tearing down — because the real one is a Stencil
 * build that wants an iframe and a cross-origin `postMessage` partner. What is
 * under test is this theme's bridge, not Salla's login page.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/auth.js';

/** T-2.10's sheet, as `bottom-sheet.twig` renders it, wrapping the component. */
const PAGE = `
  <dialog id="login-sheet" class="sheet sheet--sheet sheet--login" aria-labelledby="login-sheet-title" data-sheet>
    <div class="sheet__panel">
      <div class="sheet__header">
        <h2 class="sheet__title" id="login-sheet-title">تسجيل الدخول</h2>
        <button type="button" class="sheet__close" data-sheet-close autofocus aria-label="إغلاق"></button>
      </div>
      <div class="sheet__body">
        <div class="login-sheet__frame">
          <salla-login-modal inline data-testid="store-login-modal"></salla-login-modal>
        </div>
      </div>
    </div>
  </dialog>`;

/**
 * The parts of `salla-login-modal` this bridge depends on, transcribed from its
 * source. Not a convenience: each line here is a claim about the real component,
 * and a comment naming where it came from is what makes it checkable.
 */
function defineLoginModalStub(window) {
  const teardowns = [];

  class LoginModalStub extends window.HTMLElement {
    constructor() {
      super();
      // Real: `canRenderIframe = false` until openModal() flips it, which is
      // what gates the iframe into existence.
      this.canRenderIframe = false;
      this.closed = 0;
    }

    /** Real: the `login::open` handler calls `open(data)` then `openModal()`. */
    signIn() {
      this.open();
      this.openModal();
    }

    /** Real: `if (Salla.config.isGuest()) return this.modal.open();` */
    open() {
      return this.modal.open();
    }

    /** Real: sets the flag, then `this.modal.open()`. */
    openModal() {
      if (!this.canRenderIframe) {
        this.canRenderIframe = true;
      }
      return this.modal.open();
    }

    /** Real: resets state, closes, emits `salla-login::closed`. */
    close() {
      this.closed += 1;
      this.canRenderIframe = false;
      teardowns.push('close');
      return this.modal.close();
    }
  }

  window.customElements.define('salla-login-modal', LoginModalStub);
  return teardowns;
}

function setup(html = PAGE) {
  const context = createDom({ html, translations: { 'theme.common.close': 'إغلاق' } });

  defineLoginModalStub(context.window);
  return context;
}

const sheet = (document) => document.getElementById('login-sheet');
const login = (document) => document.querySelector('salla-login-modal[inline]');

/** Both partials boot off `salla.onReady`; the sheet primitive has to be first. */
async function bootAll() {
  await loadFresh('src/assets/js/partials/bottom-sheet.js');
  await loadFresh(SOURCE);
}

afterEach(teardownDom);

describe('T-5.01 · the component is given the modal its inline branch never assigns', () => {
  test('`modal` is undefined before the bridge runs — the defect this exists for', async () => {
    const { document } = setup();

    assert.equal(login(document).modal, undefined);
  });

  test('the bridge supplies the three methods the component expects', async () => {
    const { document } = setup();

    await bootAll();

    const { modal } = login(document);

    // The same shape `salla-verify` assigns for its own inline display.
    assert.equal(typeof modal.open, 'function');
    assert.equal(typeof modal.close, 'function');
    assert.equal(typeof modal.setTitle, 'function');
  });

  test('without the bridge, signing in throws — so this is not a decoration', async () => {
    const { document } = setup();

    // No boot. This is what ships if the bridge is deleted or stops matching.
    assert.throws(() => login(document).signIn(), TypeError);
  });
});

describe('T-5.01 · the platform opens this theme’s sheet', () => {
  test('a sign-in opens the dialog', async () => {
    const { document } = setup();

    await bootAll();

    assert.equal(sheet(document).open, false);

    login(document).signIn();

    assert.equal(sheet(document).open, true);
  });

  test('the double call on one sign-in does not throw', async () => {
    const { document } = setup();

    await bootAll();

    // `open()` and `openModal()` both reach for `modal.open()`; a second
    // `showModal()` on an open dialog is an InvalidStateError.
    assert.doesNotThrow(() => login(document).signIn());
    assert.equal(sheet(document).open, true);
  });

  test('the component still decides when — the bridge never opens it unasked', async () => {
    const { document } = setup();

    await bootAll();

    assert.equal(sheet(document).open, false, 'nothing opens at boot');
  });

  test('the platform closing the flow closes the sheet', async () => {
    const { document } = setup();

    await bootAll();
    login(document).signIn();
    login(document).close();

    assert.equal(sheet(document).open, false);
  });

  test('the sheet is named by the artboard’s title and is a real dialog', async () => {
    const { document } = setup();

    await bootAll();
    login(document).signIn();

    const dialog = sheet(document);

    assert.equal(dialog.getAttribute('aria-labelledby'), 'login-sheet-title');
    assert.equal(document.getElementById('login-sheet-title').textContent, 'تسجيل الدخول');
  });
});

describe('T-5.01 · closing the sheet tells the component', () => {
  /**
   * Esc, the backdrop and the ✕ all arrive here as one thing: the dialog's
   * `close` event. **Esc itself is the browser's** — it is one of the four
   * behaviours T-2.10 chose `<dialog>` in order to get, and the harness
   * deliberately does not simulate it, so what is asserted is the event every
   * one of those paths produces rather than a re-enactment of one of them.
   */
  test('closing the dialog reaches the component, so the iframe is torn down', async () => {
    const { document } = setup();

    await bootAll();
    login(document).signIn();

    assert.equal(login(document).canRenderIframe, true);

    // What `showModal()` does on Esc: the dialog closes and fires `close`.
    sheet(document).close();

    assert.equal(login(document).closed, 1);
    assert.equal(login(document).canRenderIframe, false, 'state reset, not left half-open');
  });

  test('the close round trip does not recurse', async () => {
    const { document } = setup();

    await bootAll();
    login(document).signIn();
    sheet(document).close();

    // sheet close → component.close() → modal.close() → dialog already closed,
    // which the platform defines as doing nothing and firing no event.
    assert.equal(login(document).closed, 1);
  });

  test('T-2.10’s own close button goes through the same path', async () => {
    const { document } = setup();

    await bootAll();
    login(document).signIn();

    document.querySelector('[data-sheet-close]').click();

    assert.equal(sheet(document).open, false);
    assert.equal(login(document).closed, 1);
  });

  test('a second sign-in after a close works', async () => {
    const { document } = setup();

    await bootAll();

    login(document).signIn();
    sheet(document).close();
    login(document).signIn();

    assert.equal(sheet(document).open, true);
    assert.equal(login(document).canRenderIframe, true);
  });
});

describe('T-5.01 · the bridge is inert where it does not apply', () => {
  test('a page with no sheet boots without throwing', async () => {
    setup('<salla-login-modal inline></salla-login-modal>');

    await assert.doesNotReject(bootAll);
  });

  test('a page with no login component boots without throwing', async () => {
    setup('<dialog id="login-sheet" data-sheet><div class="sheet__panel"></div></dialog>');

    await assert.doesNotReject(bootAll);
  });

  test('a non-inline login modal is left entirely alone', async () => {
    const { document } = setup(`
      ${PAGE}
      <salla-login-modal data-testid="other"></salla-login-modal>`);

    await bootAll();

    // Without `inline` the component renders its own salla-modal and assigns
    // `this.modal` itself. Supplying one would replace the platform's.
    assert.equal(document.querySelector('salla-login-modal:not([inline])').modal, undefined);
  });
});
