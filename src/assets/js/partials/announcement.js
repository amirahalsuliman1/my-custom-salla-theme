/**
 * T-3.03, second pass — closing the announcement bar.
 *
 * THE HARD PART OF THIS FEATURE IS NOT HERE. Whether the bar appears at all for
 * a returning visitor is decided in `master.twig`'s head script, before the
 * element is parsed, because the bar is above the fold and occupies a fixed
 * height — hiding it from this deferred bundle would paint it and then remove
 * it, shifting everything below it on every load. This file only handles the
 * click, and it runs after the decision it cannot make in time.
 *
 * BOTH BARS CLOSE TOGETHER, and that follows from what they are. T-3.03 renders
 * one announcement in two positions, deliberately sharing a single
 * `announcement_text` so a merchant cannot let them drift apart. They are one
 * message, so dismissing is one act; closing the top bar and leaving the same
 * sentence scrolling above the footer would read as a bug.
 */

const STORAGE_KEY = () => window.announcement_dismiss_key;

class Announcement {
  static boot() {
    const buttons = document.querySelectorAll('[data-announcement-dismiss]');

    if (!buttons.length) {
      return;
    }

    buttons.forEach(button => button.addEventListener('click', () => Announcement.dismiss()));
  }

  static dismiss() {
    // The class goes on <html>, matching the head script exactly, so there is
    // one selector in `announcement.scss` rather than two ways to be hidden.
    document.documentElement.classList.add('announcement-dismissed');
    Announcement.restoreFocus();

    const key = STORAGE_KEY();

    if (!key) {
      return;
    }

    try {
      window.localStorage.setItem(key, '1');
    } catch {
      // Safari private mode, or storage full. The bar is already hidden for
      // this page view; it will simply come back on the next one. Failing to
      // remember is not a reason to fail to close.
    }
  }

  /**
   * Focus has to go somewhere, and the default is wrong.
   *
   * The button that was just pressed is being removed from the page, so without
   * this the browser drops focus to `<body>` and a keyboard user is silently
   * returned to the top of the document — losing their place. `<main>` is where
   * the page's own content starts, and `master.twig` already gives it an id.
   */
  static restoreFocus() {
    const main = document.getElementById('main-content');

    if (!main) {
      return;
    }

    // -1 rather than 0: `<main>` should be reachable programmatically here
    // without joining the tab order permanently.
    main.setAttribute('tabindex', '-1');
    main.focus();
  }
}

document.addEventListener('DOMContentLoaded', () => Announcement.boot());

export default Announcement;
