/**
 * The visitor's colour-mode switch (owner request, 2026-10-13) — the header
 * button master.twig renders when the merchant turns on `dark_mode_toggle`.
 *
 * The mode itself is decided by the inline script at the top of <head>, before
 * paint; this only flips it afterwards. The choice is kept in this browser
 * under the same key that script reads, so the next page opens in it.
 */
const KEY = 'am1als:color-mode';

function sync(button) {
  const dark = document.documentElement.classList.contains('dark');

  button.setAttribute('aria-pressed', String(dark));
  button.setAttribute('aria-label', salla.lang.get(dark ? 'theme.color_mode.to_light' : 'theme.color_mode.to_dark'));
}

function boot() {
  const buttons = [...document.querySelectorAll('[data-color-mode-toggle]')];

  if (!buttons.length) {
    return;
  }

  buttons.forEach((button) => {
    sync(button);
    button.addEventListener('click', () => {
      const dark = document.documentElement.classList.toggle('dark');

      try {
        window.localStorage.setItem(KEY, dark ? 'dark' : 'light');
      } catch {
        // Storage unavailable: the switch still works for this page.
      }

      buttons.forEach(sync);
    });
  });
}

salla.onReady(() => salla.lang.onLoaded(boot));

export default boot;
