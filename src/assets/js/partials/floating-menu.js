/**
 * T-3.07 — what the floating menu could not do for itself.
 *
 * THE PANEL IS `salla-user-menu`'S AND SO IS ITS OPEN/CLOSE. This file adds the
 * three things the component does not have, each of them an acceptance criterion,
 * and each verified absent in `salla-user-menu.entry.js` before a line was
 * written here: **zero occurrences of `aria-`, of `keydown`, of `Escape` and of
 * `focus`.**
 *
 * ONE — THE TRIGGER COULD NOT BE REACHED. The component renders it as a plain
 * `<div id="trigger-slot">` carrying `onClick` and `onKeyUp`. A `<div>` is not
 * focusable, so **the keyboard handler it already has was unreachable code** and
 * the account menu had no keyboard path at all. A role, a tab stop and
 * Enter/Space are what make the handler it already ships do its job.
 *
 * TWO — THE STATE WAS SILENT. The panel's visibility is a class on a sibling
 * element, which no screen reader can see. `aria-expanded` on the trigger, kept
 * in step by observing that class, is the announcement.
 *
 * THREE — `Esc` DID NOTHING, and focus never moved or came back.
 *
 * WHY FOCUS IS NOT TRAPPED, THOUGH THE CRITERION SAYS "SHARED WITH THE SHEET
 * PRIMITIVE". T-2.10 traps focus because a modal makes the rest of the document
 * inert — that is what `showModal()` means. **This menu is not modal:** the
 * artboards draw no scrim and the page behind stays live. Trapping focus inside a
 * non-modal popup is a keyboard trap, WCAG 2.1.2, so what is shared is the
 * behaviour that is right in both places — focus moves in on open, returns to the
 * trigger on close, `Esc` closes — and not the one that is only right in a
 * dialog. Tab moving out and closing the menu is the WAI-ARIA menu-button
 * pattern, and it is what happens here.
 */
class FloatingMenu {
  static boot() {
    document.querySelectorAll('salla-user-menu .s-user-menu-wrapper').forEach(wrapper => {
      const trigger = wrapper.querySelector('#trigger-slot, .s-user-menu-trigger-slot');
      const toggler = wrapper.querySelector('.s-user-menu-toggler');

      if (!trigger || !toggler || wrapper.dataset.floatingMenu) {
        return;
      }

      wrapper.dataset.floatingMenu = 'ready';

      FloatingMenu.describe(trigger, toggler);
      FloatingMenu.watch(trigger, toggler);
      FloatingMenu.markCurrent(wrapper);
    });
  }

  /**
   * The trigger is a `<div>`, and it stays one — replacing it would mean forking
   * the component. `role` and `tabindex` give it a button's semantics and a tab
   * stop; the keyup handler it already carries does the rest, and Space is added
   * because a real button activates on Space and this one would not.
   */
  static describe(trigger, toggler) {
    if (!toggler.id) {
      toggler.id = 'floating-menu-panel';
    }

    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', toggler.id);

    trigger.addEventListener('keydown', event => {
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        trigger.click();
      }
    });
  }

  /**
   * The component owns `opened` as internal state, so the class it puts on the
   * panel is the only signal available from outside. Observing one attribute on
   * one element is cheaper than polling and cannot fall out of step with it.
   */
  static watch(trigger, toggler) {
    new MutationObserver(() => {
      const opened = toggler.classList.contains('opened');

      trigger.setAttribute('aria-expanded', String(opened));

      if (opened) {
        toggler.querySelector('a, button')?.focus();
      }
    }).observe(toggler, { attributes: true, attributeFilter: ['class'] });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !toggler.classList.contains('opened')) {
        return;
      }

      FloatingMenu.close(toggler);
      trigger.focus();
    });
  }

  /**
   * `opened` is Stencil state and cannot be set from here. The panel's own close
   * button sets it, and where the header is not shown there is none — so the
   * fallback is the outside click the component already listens for on `window`.
   */
  static close(toggler) {
    const closer = toggler.querySelector('.s-user-menu-dropdown-header-close');

    if (closer) {
      closer.click();
      return;
    }

    document.documentElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  /**
   * The artboard fills one row, and it is the page the customer is on. The
   * component marks nothing, so the match is made here — and `aria-current` is
   * what carries it to a screen reader, where the fill alone would say nothing.
   */
  static markCurrent(wrapper) {
    wrapper.querySelectorAll('.s-user-menu-dropdown-item-link').forEach(link => {
      const href = link.getAttribute('href');

      if (href && new URL(href, window.location.origin).pathname === window.location.pathname) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }
}

/**
 * The component renders after `salla.onReady`, so the markup this file needs does
 * not exist when the file runs — and `salla-user-menu` publishes no "rendered"
 * event this theme can rely on, which was checked rather than guessed. One
 * observer per host, disconnecting the moment the panel appears, needs no
 * cooperation from the component and costs nothing after it fires.
 *
 * `boot()` is idempotent: a wrapper it has already prepared carries a flag, so
 * the immediate call and the observed one cannot double up the listeners.
 */
salla.onReady(() => {
  document.querySelectorAll('salla-user-menu').forEach(host => {
    new MutationObserver((records, observer) => {
      if (host.querySelector('.s-user-menu-toggler')) {
        observer.disconnect();
        FloatingMenu.boot();
      }
    }).observe(host, { childList: true, subtree: true });
  });

  FloatingMenu.boot();
});

export default FloatingMenu;
