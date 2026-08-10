/**
 * T-5.01 — the bridge between Salla's login component and T-2.10's sheet.
 *
 * THE ONE THING THIS FILE DOES. `salla-login-modal` opens and closes itself
 * through `this.modal`, a reference its `render()` assigns from the
 * `<salla-modal>` it draws around the iframe. With `inline` set there is no
 * `<salla-modal>`, so that reference is never assigned — and the component's
 * `login::open` handler calls `this.modal.open()` regardless. Left alone, the
 * first sign-in attempt on any page throws a TypeError.
 *
 * **Supplying the object is the platform's own answer to this, not a hack around
 * it.** `salla-verify` does exactly the same thing for its own inline display:
 *
 *     if (this.display == 'inline') {
 *       this.modal = { open: () => '', close: () => '', setTitle: () => '' };
 *     }
 *
 * The difference is that `salla-verify` stubs the three methods to nothing,
 * because inline means «already on the page». Here inline means «inside our
 * sheet», so the same three methods drive the sheet. The component keeps
 * deciding *when* it is visible; this file only changes *what* becomes visible.
 *
 * WHY THIS IS REACHABLE FROM OUTSIDE AT ALL. The components ship as
 * `proxyCustomElement(class SallaLoginModal extends HTMLElement { … })`, so the
 * component instance **is** the element. `element.modal = …` sets the instance
 * field. This is the one property this file touches, and it touches it because
 * the inline branch leaves it undefined — not to override behaviour.
 *
 * EVERY EXISTING CALLER KEEPS WORKING UNCHANGED. `customer.twig`'s sign-in link
 * and `cart.js`'s guest checkout both dispatch `login::open`; the component still
 * listens for it and still decides what to do. Nothing here re-routes an event
 * or reimplements a step of the flow.
 */
import BottomSheet from './bottom-sheet';

const SHEET_ID = 'login-sheet';

class Auth {
  static boot() {
    const sheet = document.getElementById(SHEET_ID);
    const login = document.querySelector('salla-login-modal[inline]');

    if (!sheet || !login) {
      return;
    }

    /**
     * `open` is called twice on a single `login::open` — once from `open()` and
     * once from `openModal()`. `BottomSheet.open` returns early on an already
     * open dialog, so the second is a no-op rather than a second `showModal()`,
     * which would throw.
     */
    login.modal = {
      open: () => BottomSheet.open(SHEET_ID),
      close: () => BottomSheet.close(SHEET_ID),
      /**
       * The heading is the artboard's «تسجيل الدخول» and is rendered by
       * `bottom-sheet.twig`, where it also serves as the dialog's accessible
       * name. Nothing in `salla-login-modal` calls this — only `salla-verify`
       * does — so this exists to complete the shape the component expects, not
       * to discard a title that was going to arrive.
       */
      setTitle: () => {},
    };

    /**
     * Esc, the backdrop and T-2.10's own ✕ all close the dialog directly, and
     * the component would otherwise never learn that its UI had gone. Telling it
     * is what resets `canRenderIframe`, tears the iframe down and emits
     * `salla-login::closed` for anything listening.
     *
     * No loop: `close()` calls our `modal.close()`, which calls `close()` on a
     * dialog that is already closed, which the platform defines as doing nothing
     * and firing no event.
     */
    sheet.addEventListener('close', () => login.close());
  }
}

salla.onReady(() => Auth.boot());

export default Auth;
