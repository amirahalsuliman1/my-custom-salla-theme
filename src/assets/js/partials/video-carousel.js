/**
 * T-4.23 — the façade, and the product line under each slide.
 *
 * TWO JOBS, AND THE FIRST ONE IS THE POINT OF THE SECTION. Nothing third-party
 * is requested until the viewer presses play: what the page ships is the
 * merchant's own cover image. That is a performance criterion — three embedded
 * players on one Home page would cost more than everything above them combined —
 * and a privacy one, since an embed that loads on sight reports the visitor to
 * YouTube, TikTok or Instagram whether or not they were interested.
 *
 * THE URL MAPPING IS THE WHOLE OF THE COMPLEXITY, and it is deliberately small.
 * A merchant pastes the address from the browser's bar, which is not the address
 * an iframe wants. Three platforms, three shapes, and **anything unrecognised
 * opens in a new tab instead of being guessed at** — a wrong embed URL renders a
 * blank rectangle, which is worse than a link that works.
 */
import { escapeHtml, fetchProduct, hideCurrencyGlyphs } from './product-runtime';

const EMBED_PATTERNS = [
  [/youtube\.com\/watch\?(?:.*&)?v=([\w-]+)/i, id => `https://www.youtube.com/embed/${id}?autoplay=1`],
  [/youtu\.be\/([\w-]+)/i, id => `https://www.youtube.com/embed/${id}?autoplay=1`],
  [/youtube\.com\/shorts\/([\w-]+)/i, id => `https://www.youtube.com/embed/${id}?autoplay=1`],
  [/tiktok\.com\/.*\/video\/(\d+)/i, id => `https://www.tiktok.com/embed/v2/${id}`],
  [/instagram\.com\/(?:reel|p|tv)\/([\w-]+)/i, code => `https://www.instagram.com/reel/${code}/embed`],
];

class VideoCarousel {
  static boot() {
    document.querySelectorAll('[data-video-slide]').forEach(slide => VideoCarousel.bindPlay(slide));
    document.querySelectorAll('[data-video-product]').forEach(row => VideoCarousel.fill(row));
  }

  static toEmbed(url = '') {
    for (const [pattern, build] of EMBED_PATTERNS) {
      const match = url.match(pattern);

      if (match) {
        return build(match[1]);
      }
    }

    return null;
  }

  static bindPlay(slide) {
    const button = slide.querySelector('[data-video-play]');

    if (!button) {
      return;
    }

    button.addEventListener('click', () => {
      const embed = VideoCarousel.toEmbed(slide.dataset.embedUrl);

      // Not a platform this knows: hand the visitor the post rather than an
      // empty frame. `noopener` because the tab we open can otherwise reach back.
      if (!embed) {
        window.open(slide.dataset.embedUrl, '_blank', 'noopener');
        return;
      }

      const frame = document.createElement('iframe');

      frame.className = 'video-carousel__embed';
      frame.src = embed;
      frame.title = button.getAttribute('aria-label');
      frame.allow = 'autoplay; encrypted-media; picture-in-picture';
      frame.allowFullscreen = true;

      // The cover and the button have done their job; replacing them rather than
      // covering them keeps the tab order honest — there is no longer a play
      // button to reach, because there is no longer anything to play.
      slide.replaceChildren(frame);
      frame.focus();
    });
  }

  /**
   * The product line: name, price, and the platform's own add-to-cart button.
   *
   * Same contract as the hotspot pill — a stored id, resolved at runtime, and a
   * row that removes itself if the id no longer resolves. A merchant sees the
   * line disappear, which is the correct signal that the id is wrong.
   */
  static fill(row) {
    const id = row.dataset.productId;

    if (!id) {
      return row.remove();
    }

    fetchProduct(id)
      .then(product => VideoCarousel.render(row, product))
      .catch(() => row.remove());
  }

  static render(row, product) {
    if (!product?.name) {
      return row.remove();
    }

    const name = escapeHtml(product.name);

    row.innerHTML = `
      <a class="video-carousel__product-link" href="${escapeHtml(product.url)}">
        <span class="video-carousel__product-name">${name}</span>
        <span class="video-carousel__product-price">${salla.money(product.price)}</span>
      </a>
      <salla-add-product-button
        class="video-carousel__buy"
        fill="none"
        product-id="${escapeHtml(product.id)}"
        product-status="${escapeHtml(product.status)}"
        product-type="${escapeHtml(product.type)}">
        <span class="sr-only">${escapeHtml(salla.lang.get('pages.cart.add_to_cart'))} — ${name}</span>
        <i class="sicon-shopping-bag" aria-hidden="true"></i>
      </salla-add-product-button>`;

    row.hidden = false;
    hideCurrencyGlyphs(row);
  }
}

salla.onReady(() => salla.lang.onLoaded(() => VideoCarousel.boot()));

export default VideoCarousel;
