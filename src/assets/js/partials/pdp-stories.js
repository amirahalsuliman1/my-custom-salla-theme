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
import { homeDocument } from './home-document';
import StoryModal from './story-modal';
import bindScrollIndicator from './scroll-indicator';

/** Split a tag list the way story-tags.twig does: Latin or Arabic commas. */
const tagsOf = card => (card.dataset.storyTags || '').split(/[,،]/).map(tag => tag.trim()).filter(Boolean);

/**
 * Which stories a strip shows (public-theme pass, 2026-10-19).
 *
 *   · `data-filter-product` (the product page): the stories whose hotspot names
 *     this product, under «شوفيه عند عملائنا»; with none, the latest stories
 *     under the section's own title, as before.
 *   · `data-filter-tag` (a category page): only the stories tagged with the
 *     category's name; with none, nothing — the strip stays hidden.
 */
function pick(all, section) {
  const product = section.dataset.filterProduct;
  const tag = section.dataset.filterTag?.trim();

  if (tag) {
    return all.filter(card => tagsOf(card).includes(tag));
  }

  if (product) {
    const matched = all.filter(card => card.dataset.storyProduct === product);

    if (matched.length) {
      const title = section.querySelector('h2');

      if (title && section.dataset.titleMatched) {
        title.textContent = section.dataset.titleMatched;
      }

      return matched;
    }
  }

  return all;
}

async function fill(section) {
  const track = section.querySelector('[data-pdp-stories-track]');
  const limit = Number(section.dataset.limit) || 8;

  const page = await homeDocument();

  if (!page) {
    return;
  }
  const source = page.querySelector('[data-testid="store-home-stories"]');
  const all = source ? [...source.querySelectorAll('.story-card')] : [];
  const cards = pick(all, section).slice(0, limit);

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

  // T-4.03's indicator under the row, as both PDP artboards draw it. Measured
  // after the section is shown — a hidden row has no width — and in the same
  // task, so the bar arrives with the cards rather than a frame later.
  const indicator = section.querySelector('[data-pdp-stories-indicator]');

  if (indicator) {
    bindScrollIndicator(track, indicator);
  }
}

export default function initPdpStories() {
  document.querySelectorAll('[data-pdp-stories]').forEach(watch);
}

function watch(section) {
  if (!('IntersectionObserver' in window)) {
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
