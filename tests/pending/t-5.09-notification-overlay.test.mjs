/**
 * T-5.09 — the in-app notification over an open sheet.
 *
 * The toast itself is T-2.12's and is not retested here. What this file covers
 * is the one thing the three `Notification` artboards add to it: `نسخة ٢ من
 * Notification.pdf` draws the toast **over an open sign-in sheet**, and T-2.10's
 * sheet is a `<dialog>` opened with `showModal()` — which is in the browser's
 * top layer, above every z-index on the page. Without the promotion under test
 * here, «تم إرسال رمز التحقق بنجاح» is painted behind the sheet that asked for
 * the code.
 *
 * The cases are about the *decision*, not the paint: jsdom has no top layer, so
 * what is assertable is that the container is declared a manual popover and told
 * to show exactly when a modal is open, and left alone otherwise. The failure
 * mode being guarded is specific — `[popover]:not(:popover-open)` is
 * `display: none`, so a container marked as a popover that never opened would
 * hide the message outright.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/toast.js';

/** T-2.10's sheet, as `bottom-sheet.twig` renders it once `showModal()` has run. */
const OPEN_SHEET = '<dialog id="login-sheet" class="sheet" data-sheet open><div class="sheet__panel"></div></dialog>';
const CLOSED_SHEET = '<dialog id="login-sheet" class="sheet" data-sheet><div class="sheet__panel"></div></dialog>';

/** The container sweetalert2 appends to `<body>` for every message. */
function appendToast({ showPopover } = {}) {
  const container = document.createElement('div');

  container.className = 'swal2-container swal2-top';
  container.innerHTML =
    '<div class="swal2-popup swal2-toast"><button class="swal2-close"></button><div class="swal2-html-container"></div></div>';

  if (showPopover !== undefined) {
    container.showPopover = showPopover;
  }

  document.body.append(container);
  return container;
}

/** jsdom may or may not ship the popover API; the tests state which they want. */
function withoutPopoverSupport() {
  const proto = window.HTMLElement.prototype;
  const had = Object.hasOwn(proto, 'showPopover');
  const previous = proto.showPopover;

  delete proto.showPopover;
  return () => {
    if (had) {
      proto.showPopover = previous;
    }
  };
}

async function boot(html) {
  const dom = createDom({ html, translations: { 'theme.common.close': 'إغلاق' } });

  await loadFresh(SOURCE);
  await flush();
  return dom;
}

afterEach(teardownDom);

describe('T-5.09 · the toast joins the top layer when a modal is open', () => {
  test('a toast raised over an open sheet is promoted', async () => {
    await boot(OPEN_SHEET);

    const shown = [];
    const container = appendToast({ showPopover() { shown.push(this); } });

    await flush();

    assert.equal(container.getAttribute('popover'), 'manual', 'manual, so it traps nothing');
    assert.deepEqual(shown, [container], 'and it was actually shown');
  });

  test('a toast raised with no modal open is left exactly where T-2.12 put it', async () => {
    await boot(CLOSED_SHEET);

    const shown = [];
    const container = appendToast({ showPopover() { shown.push(this); } });

    await flush();

    assert.equal(container.hasAttribute('popover'), false);
    assert.deepEqual(shown, []);
  });

  test('a browser with no top layer to offer is not asked for one', async () => {
    await boot(OPEN_SHEET);

    const restore = withoutPopoverSupport();

    try {
      const container = appendToast();

      await flush();

      assert.equal(
        container.hasAttribute('popover'),
        false,
        'declaring a popover that can never open would hide the message',
      );
    } finally {
      restore();
    }
  });

  /**
   * The guard that matters most. `[popover]:not(:popover-open)` is
   * `display: none`, so a refused promotion must not leave the attribute behind
   * — the toast would vanish rather than merely sit too low.
   */
  test('a refused promotion takes the attribute back off', async () => {
    await boot(OPEN_SHEET);

    const container = appendToast({
      showPopover() {
        throw new Error('not allowed');
      },
    });

    await flush();

    assert.equal(container.hasAttribute('popover'), false);
  });

  test('a container already promoted is not promoted twice', async () => {
    await boot(OPEN_SHEET);

    let calls = 0;
    const container = appendToast({ showPopover() { calls += 1; } });

    await flush();
    container.append(document.createElement('span'));
    await flush();

    assert.equal(calls, 1);
  });
});

describe('T-5.09 · T-2.12\'s behaviour survives the extension', () => {
  test('the close button is still given a translated name', async () => {
    await boot(OPEN_SHEET);

    appendToast({ showPopover() {} });
    await flush();

    assert.equal(document.querySelector('.swal2-close').getAttribute('aria-label'), 'إغلاق');
  });

  test('nothing takes focus — the toast is announced, not visited', async () => {
    await boot(OPEN_SHEET);

    const before = document.activeElement;

    appendToast({ showPopover() {} });
    await flush();

    assert.equal(document.activeElement, before);
  });
});
