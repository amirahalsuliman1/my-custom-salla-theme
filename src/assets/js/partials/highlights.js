/**
 * «هايلايت» — the story viewer behind the Home highlight circles (owner
 * request, 2026-10-13). See components/home/highlights.twig.
 *
 * ONE NATIVE <dialog> PER SECTION. `showModal()` gives the focus trap, `Esc` and
 * the inert page for free — the same reason the theme's sheet primitive uses
 * one. Each circle carries its slides as JSON; nothing is fetched until a
 * circle is opened, and the product pill is resolved through the shared product
 * runtime, as the hotspot pill is.
 *
 * MOVEMENT. A slide advances after SLIDE_MS unless the visitor holds it (press
 * and hold, as on Instagram) or prefers reduced motion — then it never advances
 * on its own and the side buttons are the only way on. The edges are logical:
 * on an RTL page the «next» half is the left one, because that is where the
 * story is read toward.
 *
 * SEEN. An opened highlight is remembered in this browser, and its ring dims —
 * Instagram's signal for «you have watched this». The key hashes the slides, so
 * a highlight the merchant changes shows as new again.
 */
import { escapeHtml, fetchProduct, hideCurrencyGlyphs } from './product-runtime';

const SLIDE_MS = 5000;
const SEEN_KEY = 'am1als:highlights-seen';

// The visitor's preference, or the merchant's `enable_animations` switched off.
const reducedMotion = () => document.body.classList.contains('motion-off')
  || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function hash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function readSeen() {
  try {
    const list = JSON.parse(window.localStorage.getItem(SEEN_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function markSeen(id) {
  const list = [id, ...readSeen().filter(seen => seen !== id)].slice(0, 100);
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable: the ring simply does not dim.
  }
}

class Highlights {
  constructor(section) {
    this.section = section;
    this.viewer = section.querySelector('[data-highlight-viewer]');
    this.slideEl = section.querySelector('[data-highlight-slide]');
    this.progress = section.querySelector('[data-highlight-progress]');
    this.titleEl = section.querySelector('[data-highlight-viewer-title]');
    this.shop = section.querySelector('[data-highlight-shop]');
    this.link = section.querySelector('[data-highlight-link]');
    this.bubbles = [...section.querySelectorAll('[data-highlight]')];
    this.timer = null;
    this.held = false;

    const seen = readSeen();
    this.bubbles.forEach((bubble) => {
      bubble.dataset.highlightId = hash(bubble.dataset.highlightSlides || '');
      if (seen.includes(bubble.dataset.highlightId)) bubble.classList.add('highlights__bubble--seen');
      bubble.addEventListener('click', () => this.open(bubble));
    });

    section.querySelector('[data-highlight-close]')?.addEventListener('click', () => this.close());
    section.querySelector('[data-highlight-next]')?.addEventListener('click', () => this.step(1));
    section.querySelector('[data-highlight-prev]')?.addEventListener('click', () => this.step(-1));
    this.viewer?.addEventListener('close', () => this.stop());
    this.viewer?.addEventListener('keydown', (event) => this.onKey(event));

    const stage = section.querySelector('[data-highlight-stage]');
    stage?.addEventListener('pointerdown', () => this.hold(true));
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => stage?.addEventListener(type, () => this.hold(false)));
  }

  open(bubble) {
    let slides;
    try {
      slides = JSON.parse(bubble.dataset.highlightSlides || '[]');
    } catch {
      slides = [];
    }
    if (!slides.length || !this.viewer) return;

    this.current = { bubble, slides };
    this.index = 0;
    this.titleEl.textContent = bubble.dataset.highlightTitle || '';
    this.progress.replaceChildren(...slides.map(() => {
      const bar = document.createElement('span');
      bar.className = 'highlights__bar';
      bar.append(document.createElement('span'));
      return bar;
    }));

    this.setLink(bubble.dataset.highlightUrl);
    this.setProduct(bubble.dataset.highlightProduct);

    markSeen(bubble.dataset.highlightId);
    bubble.classList.add('highlights__bubble--seen');

    if (typeof this.viewer.showModal === 'function') this.viewer.showModal();
    else this.viewer.setAttribute('open', '');
    this.show();
  }

  close() {
    this.stop();
    if (this.viewer?.open) this.viewer.close();
    this.current?.bubble.focus();
  }

  show() {
    const { slides } = this.current;
    this.slideEl.src = slides[this.index];
    this.slideEl.alt = `${this.current.bubble.dataset.highlightTitle || ''} — ${this.index + 1}/${slides.length}`;

    [...this.progress.children].forEach((bar, i) => {
      bar.classList.toggle('highlights__bar--done', i < this.index);
      bar.classList.toggle('highlights__bar--active', i === this.index);
    });

    this.schedule();
  }

  step(direction) {
    if (!this.current) return;
    const next = this.index + direction;

    if (next < 0) {
      this.index = 0;
      this.show();
      return;
    }
    if (next >= this.current.slides.length) {
      this.close();
      return;
    }
    this.index = next;
    this.show();
  }

  schedule() {
    this.stop();
    const active = this.progress.children[this.index];
    if (reducedMotion()) {
      active?.classList.add('highlights__bar--static');
      return;
    }
    if (this.held) return;
    this.timer = window.setTimeout(() => this.step(1), SLIDE_MS);
  }

  stop() {
    window.clearTimeout(this.timer);
    this.timer = null;
  }

  hold(on) {
    if (!this.current || !this.viewer?.open) return;
    this.held = on;
    this.viewer.classList.toggle('highlights__viewer--held', on);
    if (on) this.stop();
    else this.schedule();
  }

  onKey(event) {
    const rtl = document.documentElement.dir === 'rtl';
    if (event.key === 'ArrowLeft') this.step(rtl ? 1 : -1);
    if (event.key === 'ArrowRight') this.step(rtl ? -1 : 1);
  }

  setLink(url) {
    if (!this.link) return;
    this.link.hidden = !url;
    if (url) this.link.href = url;
    else this.link.removeAttribute('href');
  }

  setProduct(id) {
    if (!this.shop) return;
    this.shop.hidden = true;
    this.shop.removeAttribute('href');
    if (!id) return;

    const asked = this.current;
    fetchProduct(id)
      .then((product) => {
        // A slow answer for a highlight the visitor has already left is dropped.
        if (this.current !== asked || !product?.name) return;
        this.shop.href = product.url;
        this.shop.innerHTML =
          `<span class="highlights__shop-label">${escapeHtml(salla.lang.get('theme.highlights.shop'))}</span>` +
          `<span class="highlights__shop-name">${escapeHtml(product.name)}</span>` +
          `<span class="highlights__shop-price">${salla.money(product.price)}</span>`;
        hideCurrencyGlyphs(this.shop);
        this.shop.hidden = false;
      })
      .catch(() => {});
  }

  static boot() {
    document.querySelectorAll('[data-highlights]').forEach(section => new Highlights(section));
  }
}

salla.onReady(() => salla.lang.onLoaded(() => Highlights.boot()));

export default Highlights;
