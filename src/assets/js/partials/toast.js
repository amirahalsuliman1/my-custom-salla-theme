import Swal from 'sweetalert2';

/**
 * T-2.12 — the two things the toast's stylesheet cannot reach.
 *
 * The toast itself is not built here. `salla.notify` already routes every
 * message in the theme and in the SDK into a sweetalert2 toast, and
 * `05-utilities/toast.scss` restyles that toast to the design — technique C, and
 * no call site anywhere had to change. This file exists for the two acceptance
 * criteria that are behaviour rather than appearance.
 *
 * ONE — PAUSE ON FOCUS. The notifier upstream pauses the dismiss timer on
 * `mouseenter` and resumes on `mouseleave`. A keyboard user has no mouseenter:
 * they tab to the toast's close button and the toast keeps counting down
 * underneath them. Two delegated listeners fix that for every toast the store
 * will ever show.
 *
 * TWO — THE CLOSE BUTTON'S NAME. sweetalert2 labels it "Close this dialog", in
 * English, from its own defaults. On an Arabic storefront that is the one string
 * in the toast that never translates. The theme has «إغلاق» already, and this
 * puts it on the button.
 *
 * T-5.09 ADDED A THIRD, AND IT IS A STACKING PROBLEM RATHER THAN A STYLE ONE.
 * `نسخة ٢ من Notification.pdf` draws this toast **over an open sign-in sheet**.
 * T-2.10's sheet is a `<dialog>` opened with `showModal()`, which puts it in the
 * browser's top layer — above every z-index on the page, including this
 * container's. So the message announcing that a verification code was sent would
 * have been painted *behind* the sheet that asked for it. See `promoteAboveDialogs`.
 *
 * WHY NOT SET BOTH IN THE NOTIFIER INSTEAD. `initiateNotifier()` lives in
 * `js/app.js`, which is upstream and carries sixteen pre-existing lint problems;
 * the T-1.07 ratchet lints any file a commit touches, so editing it to pass two
 * options would mean adopting all sixteen. This file rides in the `app` webpack
 * entry array — the same route `bottom-sheet.js` takes, and for the same reason
 * — which puts it in the chunk that already contains sweetalert2, so importing
 * `Swal` here adds the two calls below and nothing else to the bundle.
 */
class Toast {
  static boot() {
    /**
     * Delegated rather than bound per toast: a toast is created and destroyed
     * for every message, so there is never an element to bind to at boot.
     * `focusin` and `focusout` bubble where `focus` and `blur` do not, which is
     * the whole reason they are the two events used here.
     */
    document.addEventListener('focusin', event => {
      if (event.target.closest?.('.swal2-toast')) {
        Swal.stopTimer();
      }
    });

    document.addEventListener('focusout', event => {
      if (event.target.closest?.('.swal2-toast')) {
        Swal.resumeTimer();
      }
    });

    Toast.watchToasts();
  }

  /**
   * The library writes its markup into `<body>` when a message fires, so the
   * observer watches that one level and not the subtree: `childList` on the body
   * is a handful of callbacks over a page's life, where a subtree observer would
   * be called for every DOM change the store makes.
   *
   * Two jobs per toast now — the close button's name (T-2.12) and the top layer
   * (T-5.09) — because they need the same signal and a second observer on the
   * same node would only be a second way to be told the same thing.
   */
  static watchToasts() {
    const label = salla.lang.get('theme.common.close');

    new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes.forEach(node => {
          if (!node.querySelector) {
            return;
          }

          node.querySelector('.swal2-toast .swal2-close')?.setAttribute('aria-label', label);
          Toast.promoteAboveDialogs(node);
        });
      });
    }).observe(document.body, { childList: true });
  }

  /**
   * T-5.09 — put the toast in the top layer when a modal is open.
   *
   * THE TOP LAYER IS NOT A Z-INDEX AND CANNOT BE OUT-STACKED. `showModal()`
   * promotes a `<dialog>` out of the page's paint order entirely, so no value on
   * this container — the library's, the theme's, or any number at all — can put
   * it in front. The only way in is to enter the top layer too, and the only
   * things that may are a modal dialog and a popover. `popover="manual"` is the
   * one that does not also trap focus, close on Esc or dismiss on outdoor
   * clicks — a toast must do none of those.
   *
   * Ordering inside the top layer is by entry, so a toast raised while a sheet
   * is open lands in front of it. **The reverse is a known gap and is not
   * closed here:** a sheet opened *after* a toast is already showing covers it,
   * which is a two-second overlap in a sequence no artboard draws.
   *
   * IT ONLY PROMOTES WHEN A MODAL IS ACTUALLY OPEN, deliberately. Promoting
   * every toast would be simpler and would put the theme's whole notifier behind
   * a set of UA styles on every page; confining it to the case that is otherwise
   * broken keeps the blast radius the size of the bug. `04-components` cannot
   * neutralise what it cannot see, so those UA styles are undone explicitly in
   * `05-utilities/toast.scss`.
   *
   * `dialog[open]` rather than `dialog:modal`, because the theme opens every one
   * of its dialogs through `showModal()` — T-2.10's sheets and T-2.11's
   * confirmations alike — and `[open]` is the attribute both a browser and a
   * test can see.
   */
  static promoteAboveDialogs(node) {
    const container = node.matches?.('.swal2-container')
      ? node
      : node.querySelector('.swal2-container');

    if (!container || container.hasAttribute('popover')) {
      return;
    }

    // No open modal means nothing to get above, and no `showPopover` means the
    // browser has no top layer to offer — in both cases the toast stays exactly
    // where T-2.12 put it rather than being moved for no gain.
    if (!document.querySelector('dialog[open]') || typeof container.showPopover !== 'function') {
      return;
    }

    container.setAttribute('popover', 'manual');

    try {
      container.showPopover();
    } catch {
      // A container the browser refuses to promote must not be left declared as
      // a popover: `[popover]:not(:popover-open)` is `display: none`, which
      // would hide the message outright.
      container.removeAttribute('popover');
    }
  }
}

salla.onReady(() => salla.lang.onLoaded(() => Toast.boot()));

export default Toast;
