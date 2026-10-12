/**
 * T-2.10 — the overlay primitive's behaviour.
 *
 * DELIBERATELY SMALL, BECAUSE THE BROWSER DOES THE HARD PART. `<dialog>` opened
 * with `showModal()` already traps focus, closes on Esc, returns focus to
 * whatever opened it, and makes the rest of the document inert — the four things
 * `salla-modal` does not do and the four this task is graded on. See
 * `components/ui/bottom-sheet.twig` for that evaluation in full.
 *
 * What is left is the remainder the platform does not cover: closing on a
 * backdrop click, and locking the background scroll without moving the page.
 *
 * It rides in the `app` webpack entry rather than being imported by `app.js`.
 * That is not a detail: importing it into `app.js` would adopt that file under
 * the T-1.07 ratchet along with its sixteen pre-existing lint problems, for one
 * line. The entry array takes a second file at no such cost, and a primitive
 * that auth, filters, quick view and the story modal all need has to be in the
 * bundle every page loads.
 */
class BottomSheet {
  static boot() {
    document.addEventListener('click', event => {
      const opener = event.target.closest('[data-sheet-open]');

      if (opener) {
        event.preventDefault();
        BottomSheet.open(opener.getAttribute('data-sheet-open'));
        return;
      }

      const closer = event.target.closest('[data-sheet-close]');

      if (closer) {
        event.preventDefault();
        closer.closest('[data-sheet]')?.close();
      }
    });

    document.querySelectorAll('[data-sheet]').forEach(sheet => BottomSheet.bind(sheet));

    // Parity with the platform's own vocabulary, so a caller can open a sheet
    // the same way it opens a salla-modal.
    salla.event.on('bottom-sheet::open', id => BottomSheet.open(id));
    salla.event.on('bottom-sheet::close', id => BottomSheet.close(id));
  }

  static bind(sheet) {
    /**
     * A click on the backdrop reaches the dialog element itself; a click on
     * anything inside reports that descendant as the target. `.sheet__panel`
     * covers the whole dialog box, so this comparison is the whole test — no
     * geometry, no `getBoundingClientRect`.
     */
    sheet.addEventListener('click', event => {
      if (event.target === sheet) {
        sheet.close();
      }
    });

    sheet.addEventListener('close', () => BottomSheet.unlockScroll());
  }

  static open(id) {
    const sheet = document.getElementById(id);

    if (!sheet?.showModal || sheet.open) {
      return;
    }

    BottomSheet.lockScroll();
    sheet.showModal();
  }

  static close(id) {
    document.getElementById(id)?.close();
  }

  /**
   * The scroll lock, and why it measures.
   *
   * `overflow: hidden` on the body removes the scrollbar, and on a platform with
   * a classic scrollbar that is a several-pixel reflow of the entire page behind
   * the sheet — the layout shift the criterion forbids. The gutter is measured
   * and given back as padding, so nothing moves. On touch platforms the
   * scrollbar is an overlay, the measurement is zero, and this costs nothing.
   */
  static lockScroll() {
    const gutter = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.setProperty('--scroll-gutter', `${gutter}px`);
    document.body.classList.add('has-open-sheet');
  }

  static unlockScroll() {
    // Sheets can stack — a confirmation over a filter panel. The lock lifts only
    // when the last one has gone.
    if (document.querySelector('[data-sheet][open]')) {
      return;
    }

    document.body.classList.remove('has-open-sheet');
    document.body.style.removeProperty('--scroll-gutter');
  }
}

salla.onReady(() => BottomSheet.boot());

export default BottomSheet;
