/**
 * T-7.02 — the accordion, and the three things `<details>` would not have given.
 *
 * This theme's standing preference is to take the element that already has the
 * behaviour — T-2.10 took `<dialog>`, T-4.17 took `<details>`. The criterion
 * overrides it here for reasons that are all consequences of what it asks for:
 *
 *   · **`aria-controls`.** `<summary>` gives `aria-expanded` free and cannot
 *     give this: a `<details>` panel has no id relationship to the state.
 *   · **a height transition.** `<details>` toggles `display`, which no
 *     transition can interpolate.
 *   · **deep-linking.** An entry opened from the URL has to be opened *by* the
 *     page, and the UA has already decided about a `<details>`.
 *
 * So this file is exactly what `<details>` would have supplied, and nothing more.
 *
 * `hidden` IS THE STATE, AND THE ANIMATION IS DRAPED OVER IT. A collapsed answer
 * has to leave the accessibility tree — otherwise a screen reader reads every
 * answer on the page at once, which is the failure a visually-collapsed
 * accordion hides. So the panel is `hidden` when closed and the height is
 * animated between the two, rather than the height being the state.
 *
 * REDUCED MOTION IS NOT CHECKED HERE, ON PURPOSE. T-2.03's clamp sets
 * `transition-duration` to 0.01ms globally under `prefers-reduced-motion`, so the
 * transition still fires and still ends — which is what this code waits on — and
 * simply arrives instantly. A second check in JS would be a second source for one
 * decision, and the kind that falls out of step.
 */
class Accordion {
  static boot() {
    const triggers = document.querySelectorAll('[data-faq-trigger]');

    if (!triggers.length) {
      return;
    }

    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => Accordion.toggle(trigger));
    });

    Accordion.openFromUrl();

    // Back and forward through in-page links land here too.
    window.addEventListener('hashchange', () => Accordion.openFromUrl());
  }

  static panelOf(trigger) {
    return document.getElementById(trigger.getAttribute('aria-controls'));
  }

  static toggle(trigger, force) {
    const panel = Accordion.panelOf(trigger);

    if (!panel) {
      return;
    }

    const open = force === undefined ? trigger.getAttribute('aria-expanded') !== 'true' : force;

    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (open) {
      panel.hidden = false;
      // The panel has to be in the layout before it can be measured, which is
      // why the height is set after `hidden` comes off rather than with it.
      Accordion.animate(panel, panel.scrollHeight);
    } else {
      Accordion.animate(panel, 0, () => {
        panel.hidden = true;
      });
    }
  }

  /**
   * `block-size` rather than `height`: the logical property is the rule in this
   * theme, and an accordion is one of the few places a physical one would still
   * have worked — which is exactly why it is worth not writing.
   */
  static animate(panel, to, done) {
    const from = panel.style.getPropertyValue('--faq-height');

    panel.style.setProperty('--faq-height', `${to}px`);

    if (!done) {
      return;
    }

    if (from === `${to}px`) {
      done();
      return;
    }

    panel.addEventListener('transitionend', done, { once: true });
  }

  /**
   * «DEEP-LINKING TO AN ENTRY OPENS IT.» The hash may name the panel or its
   * trigger, because a link written by hand is as likely to point at one as the
   * other, and a deep link that silently does nothing is worse than no deep
   * link.
   */
  static openFromUrl() {
    const hash = window.location.hash.slice(1);

    if (!hash) {
      return;
    }

    const target = document.getElementById(hash);
    const trigger = target?.matches?.('[data-faq-trigger]')
      ? target
      : document.querySelector(`[aria-controls="${hash}"]`);

    if (trigger) {
      Accordion.toggle(trigger, true);
      trigger.focus();
    }
  }
}

salla.onReady(() => Accordion.boot());

export default Accordion;
