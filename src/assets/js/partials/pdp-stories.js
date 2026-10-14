/**
 * «تجارب عملائنا» under the product — the latest stories, in a row.
 *
 * Ruled by the owner on 2026-10-14: the strip shows the latest stories on the
 * product page itself, as both PDP artboards draw it, rather than a link away.
 *
 * WHERE THE STORIES COME FROM. They are the Home section's collection
 * (`home.stories`, a component setting), which a product page cannot read in
 * Twig. Copying them into a second setting would give the merchant two lists to
 * keep in step, so the strip reads the one that exists: it fetches Home and
 * takes the first N rendered cards, with the story view (`.story-modal`) each
 * card opens. Same card, same modal, same hotspot — one implementation.
 *
 * WHEN. Only as the strip nears the viewport (600px ahead) — or once it is
 * already behind the reader — so the extra
 * request never competes with the product itself. Nothing found — no stories
 * section, a failed request — leaves the strip hidden, with nothing behind.
 */
import { previewTarget, storePrefix } from './preview-links';
import StoryModal from './story-modal';

function homeUrl() {
  const store = salla.config.get('store.url') || `${window.location.origin}/`;

  return previewTarget(store, storePrefix()) || store;
}

async function fill(section) {
  const track = section.querySelector('[data-pdp-stories-track]');
  const limit = Number(section.dataset.limit) || 8;

  const response = await fetch(homeUrl(), { credentials: 'same-origin' });

  if (!response.ok) {
    return;
  }

  const page = new DOMParser().parseFromString(await response.text(), 'text/html');
  const source = page.querySelector('[data-testid="store-home-stories"]');
  const cards = source ? [...source.querySelectorAll('.story-card')].slice(0, limit) : [];

  if (!cards.length) {
    return;
  }

  cards.forEach(card => {
    const id = card.querySelector('[data-sheet-open]')?.getAttribute('data-sheet-open');
    const modal = id ? source.querySelector(`#${CSS.escape(id)}`) : null;

    track.append(document.adoptNode(card));

    if (modal) {
      section.append(document.adoptNode(modal));
      salla.event.emit('bottom-sheet::bind', modal);
      StoryModal.bind(modal);
    }
  });

  section.hidden = false;
}

export default function initPdpStories() {
  const section = document.querySelector('[data-pdp-stories]');

  if (!section || !('IntersectionObserver' in window)) {
    return;
  }

  const observer = new IntersectionObserver(entries => {
    // Near the viewport, or already passed: a jump (an anchor, a restored
    // scroll position) can carry the reader beyond the margin in one frame.
    if (entries.some(entry => entry.isIntersecting || entry.boundingClientRect.top < 0)) {
      observer.disconnect();
      fill(section).catch(() => {});
    }
  }, { rootMargin: '600px 0px' });

  // The section is `hidden` and has no box, so its wrapper is what is watched.
  observer.observe(section.parentElement);
}
