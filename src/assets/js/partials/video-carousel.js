/**
 * T-4.23 — the in-page players, and the product line under each slide.
 *
 * NO COVER AND NO NEW TAB — the owner's ruling of 2026-10-12, which replaced the
 * façade this file used to be. Each slide's player is mounted when the slide
 * comes near the screen: an iframe for YouTube, TikTok and Instagram, a native
 * <video> for a direct file. Mounting near the screen rather than on load keeps
 * a carousel of five videos from fetching five players up front; the cost the
 * owner accepted is that a visitor who scrolls to a slide reaches the platform
 * without pressing anything. Recorded in /docs/DERIVED-DECISIONS.md.
 *
 * THE URL MAPPING IS THE WHOLE OF THE COMPLEXITY, and it is deliberately small.
 * A merchant pastes the address from the browser's bar, which is not the address
 * an iframe wants. Anything that is not one of the three platforms is tried as a
 * video file; if the browser cannot play it, the slide says so — which is what
 * a merchant previewing the section needs to see.
 */
import { escapeHtml, fetchProduct, hideCurrencyGlyphs } from './product-runtime';

const EMBED_PATTERNS = [
  [/youtube\.com\/watch\?(?:.*&)?v=([\w-]+)/i, id => `https://www.youtube.com/embed/${id}?playsinline=1`],
  [/youtu\.be\/([\w-]+)/i, id => `https://www.youtube.com/embed/${id}?playsinline=1`],
  [/youtube\.com\/shorts\/([\w-]+)/i, id => `https://www.youtube.com/embed/${id}?playsinline=1`],
  [/tiktok\.com\/.*\/video\/(\d+)/i, id => `https://www.tiktok.com/embed/v2/${id}`],
  [/instagram\.com\/(?:reel|p|tv)\/([\w-]+)/i, code => `https://www.instagram.com/reel/${code}/embed`],
];

// How far ahead of the screen a slide's player is mounted.
const MOUNT_MARGIN = '200px';

class VideoCarousel {
  static boot() {
    const slides = [...document.querySelectorAll('[data-video-slide]')];

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries
          .filter(entry => entry.isIntersecting)
          .forEach((entry) => {
            observer.unobserve(entry.target);
            VideoCarousel.mount(entry.target);
          });
      }, { rootMargin: MOUNT_MARGIN });

      slides.forEach(slide => observer.observe(slide));
    } else {
      slides.forEach(slide => VideoCarousel.mount(slide));
    }

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

  static mount(slide) {
    const url = slide.dataset.embedUrl;

    if (!url || slide.querySelector('.video-carousel__embed')) {
      return;
    }

    const embed = VideoCarousel.toEmbed(url);
    const title = slide.dataset.videoTitle || '';
    let player;

    if (embed) {
      player = document.createElement('iframe');
      player.src = embed;
      player.title = title;
      player.allow = 'autoplay; encrypted-media; picture-in-picture';
      player.allowFullscreen = true;
    } else {
      player = document.createElement('video');
      player.src = url;
      player.controls = true;
      player.playsInline = true;
      player.preload = 'metadata';
      player.setAttribute('aria-label', title);
      player.addEventListener('error', () => VideoCarousel.unplayable(slide, player), { once: true });
    }

    player.className = 'video-carousel__embed';
    // Under the poster's name, which sits over the top of the frame.
    slide.prepend(player);
  }

  static unplayable(slide, player) {
    const message = document.createElement('p');

    message.className = 'video-carousel__unplayable';
    message.textContent = salla.lang.get('theme.video.unplayable');
    player.replaceWith(message);
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
