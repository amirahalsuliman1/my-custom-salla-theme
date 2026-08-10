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

    Toast.nameCloseButton();
  }

  /**
   * The library writes its markup into `<body>` when a message fires, so the
   * observer watches that one level and not the subtree: `childList` on the body
   * is a handful of callbacks over a page's life, where a subtree observer would
   * be called for every DOM change the store makes.
   */
  static nameCloseButton() {
    const label = salla.lang.get('theme.common.close');

    new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes.forEach(node => {
          node.querySelector?.('.swal2-toast .swal2-close')?.setAttribute('aria-label', label);
        });
      });
    }).observe(document.body, { childList: true });
  }
}

salla.onReady(() => salla.lang.onLoaded(() => Toast.boot()));

export default Toast;
