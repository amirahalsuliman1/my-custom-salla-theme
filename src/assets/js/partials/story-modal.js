/**
 * T-7.07 — the story view's behaviour.
 *
 * MOST OF IT IS ALREADY DONE BY SOMETHING ELSE. Opening, closing, Esc, the
 * backdrop, the focus trap and the return of focus to the card belong to T-2.10
 * and, under it, to `<dialog>`. The pill and the marker belong to T-4.06. This
 * module does the two things neither of them can know.
 *
 * ONE — **WHEN** THE HOTSPOT INSIDE A STORY SHOULD RESOLVE. A merchant may
 * publish two dozen stories, each modal carrying a hotspot with a product id.
 * Booting them with the page would mean two dozen `salla.product.getDetails()`
 * calls on Home, for products behind a modal nobody has opened. Mounting on
 * first open turns that into at most one call per story the visitor actually
 * looks at, and `Hotspots.mount()` is idempotent so re-opening costs nothing.
 *
 * The image pays for itself the same way: it is `loading="lazy"` inside a closed
 * dialog, which is `display: none`, so the browser does not fetch it until the
 * modal is shown.
 *
 * TWO — STEPPING BETWEEN STORIES, which only the desktop pop-up draws.
 * `Desktop Customer Stories - Story Pop-up.svg` puts a chevron each side of the
 * story and the neighbouring stories beyond them. The order is the feed's own:
 * the cards beside this story's card, in reading order, less any the stories
 * filter has hidden — so the chevrons never step into a story the reader has
 * just filtered out. A step closes this dialog and opens the next one; there is
 * still one dialog per story, and each keeps everything T-2.10 gives it. Below
 * 1024px the chevrons are not displayed and the arrow keys do nothing, because
 * the phone artboards draw no stepping.
 */
import Hotspots from './hotspots';

class StoryModal {
  static boot() {
    document.querySelectorAll('.story-modal').forEach(modal => StoryModal.bind(modal));
  }

  /** One modal — also called for modals the PDP inserts after boot. */
  static bind(modal) {
    if (modal.dataset.storyBound) {
      return;
    }

    modal.dataset.storyBound = 'true';

    const deferred = modal.querySelector('[data-hotspot-defer]');

    // `showModal()` flips this attribute before anything paints, so the
    // lookup starts — and the chevrons and neighbours are set — in the same
    // frame the modal becomes visible.
    new MutationObserver(() => {
      if (!modal.open) {
        return;
      }

      if (deferred) {
        Hotspots.mount(deferred);
      }

      StoryModal.refresh(modal);
    }).observe(modal, { attributes: true, attributeFilter: ['open'] });

    // The chevrons and the neighbour pictures both carry the offset they step by.
    modal.addEventListener('click', event => {
      const control = event.target.closest('[data-story-step]');

      if (control && modal.contains(control)) {
        StoryModal.step(modal, Number(control.getAttribute('data-story-step')));
      }
    });

    modal.addEventListener('keydown', event => StoryModal.key(modal, event));
    modal.addEventListener('close', () => StoryModal.returnFocus(modal));
  }

  /** The stories this one steps between, in the feed's reading order. */
  static sequence(modal) {
    const scope = modal.parentElement;

    if (!scope) {
      return [];
    }

    return [...scope.querySelectorAll('[data-sheet-open]')]
      .filter(trigger => !trigger.closest('[hidden]'))
      .map(trigger => document.getElementById(trigger.getAttribute('data-sheet-open')))
      .filter(dialog => dialog?.classList.contains('story-modal'));
  }

  /** The feed card that opens a story view. */
  static trigger(dialog) {
    return [...document.querySelectorAll('[data-sheet-open]')]
      .find(trigger => trigger.getAttribute('data-sheet-open') === dialog.id);
  }

  /**
   * Shows the chevrons that have somewhere to go and draws the neighbours.
   *
   * A chevron at the end of the list is hidden rather than disabled: a control
   * that is there and does nothing is a dead stop for a keyboard. The
   * neighbours are pictures of the cards' own images — already loaded in the
   * feed, so this is usually no request at all.
   */
  static refresh(modal) {
    const list = StoryModal.sequence(modal);
    const index = list.indexOf(modal);
    const at = offset => (index < 0 ? undefined : list[index + offset]);

    modal.querySelectorAll('.story-modal__nav').forEach(button => {
      button.hidden = !at(Number(button.getAttribute('data-story-step')));
    });

    // Nearest last on the previous side and first on the next, so in both the
    // nearest neighbour is the one beside the story.
    const fill = (slot, offsets) => slot?.replaceChildren(
      ...offsets.filter(offset => at(offset)).map(offset => StoryModal.preview(at(offset), offset)),
    );

    fill(modal.querySelector('[data-story-peek="prev"]'), [-2, -1]);
    fill(modal.querySelector('[data-story-peek="next"]'), [1, 2]);
  }

  static preview(dialog, offset) {
    const item = document.createElement('span');
    const source = StoryModal.trigger(dialog)?.querySelector('img');

    item.className = 'story-modal__peek-item';
    item.setAttribute('data-story-step', String(offset));

    if (source) {
      const image = document.createElement('img');

      image.src = source.currentSrc || source.getAttribute('src');
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      item.append(image);
    }

    return item;
  }

  /**
   * Closes this story and opens the one `offset` away.
   *
   * The scroll lock stays as the first open set it: `bottom-sheet.js` lifts it
   * only once no sheet is open, and the next one opens in the same task this
   * one closes, so the page behind never moves. Opening through
   * `BottomSheet.open()` would re-measure the scrollbar with the lock still on,
   * read zero, and shift the page by its width.
   */
  static step(modal, offset) {
    const list = StoryModal.sequence(modal);
    const index = list.indexOf(modal);
    const target = index < 0 ? undefined : list[index + offset];

    if (!target || target.open || !modal.open) {
      return;
    }

    // Leaving by a step is not a dismissal, so this one returns no focus.
    delete modal.dataset.storyStepped;
    modal.close();

    StoryModal.refresh(target);
    target.dataset.storyStepped = 'true';
    target.showModal();

    // Keep the keyboard where it was: the same chevron in the new view, or the
    // other one when this step reached the end of the list.
    const same = target.querySelector(`.story-modal__nav[data-story-step="${Math.sign(offset)}"]`);
    const other = target.querySelector(`.story-modal__nav[data-story-step="${-Math.sign(offset)}"]`);

    (same && !same.hidden ? same : other)?.focus();
  }

  /**
   * ← and → step, in the direction they point: in Arabic ← is the next story,
   * because next stands on the left. Only where a chevron is displayed for
   * that direction — from 1024px, and not past either end.
   */
  static key(modal, event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    const rtl = modal.closest('[dir]')?.getAttribute('dir') === 'rtl';
    const offset = (event.key === 'ArrowLeft') === rtl ? 1 : -1;
    const button = modal.querySelector(`.story-modal__nav[data-story-step="${offset}"]`);

    if (!button || button.hidden || getComputedStyle(button).display === 'none') {
      return;
    }

    event.preventDefault();
    StoryModal.step(modal, offset);
  }

  /**
   * A story reached by stepping was opened from another story's chevron, which
   * is the element `<dialog>` would hand focus back to — inside a closed
   * dialog, so focus would fall to the page. It goes to this story's own card
   * instead: the last story the reader looked at.
   */
  static returnFocus(modal) {
    if (!modal.dataset.storyStepped) {
      return;
    }

    delete modal.dataset.storyStepped;

    if (document.querySelector('.story-modal[open]')) {
      return;
    }

    StoryModal.trigger(modal)?.focus();
  }
}

salla.onReady(() => salla.lang.onLoaded(() => StoryModal.boot()));

export default StoryModal;
