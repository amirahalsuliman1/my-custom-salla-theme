/**
 * T-4.06a — the shoppable hotspot primitive.
 *
 * ONE IMPLEMENTATION, BY RULING. The project owner closed B6 on 2026-08-06 with
 * "one hotspot-and-pill component serves T-4.06 and T-7.07; a second
 * implementation is a defect". This file is that one implementation. T-7.07's
 * story modal consumes the same partial and the same script; it does not get its
 * own.
 *
 * WHY THE PILLS ARE BUILT HERE AND NOT IN TWIG. The customiser has no product
 * picker — every documented field format was checked under T-2.01 and none of
 * them is one — so the merchant stores a product **id**, and Twig cannot resolve
 * an id to a product. `salla.product.getDetails()` can, at runtime. That is
 * precisely what makes the acceptance criterion true: a renamed or repriced
 * product needs no edit to the theme settings, because nothing about it is
 * stored there beyond the id.
 *
 * FAILURE IS SILENT AND CLEAN. A deleted or mistyped id leaves its pill hidden
 * and removes its marker, rather than leaving a button that points at nothing and
 * a card with no name. A merchant sees the hotspot disappear, which is the
 * correct signal that the id is wrong.
 */
class Hotspots {
  /**
   * Every root on the page EXCEPT the deferred ones.
   *
   * T-7.07 added the exception. A stories feed holds one story modal per item,
   * each with a hotspot inside it, and resolving them at load would fire a
   * product lookup for every story on a page where not one of them is on screen.
   * Those roots are marked `data-hotspot-defer` and their owner calls `mount()`
   * when the modal opens. There is still exactly one implementation, which is
   * the ruling; what changed is when it runs.
   */
  static boot() {
    document.querySelectorAll('[data-hotspot-root]:not([data-hotspot-defer])')
      .forEach(root => Hotspots.mount(root));
  }

  /** Idempotent: a modal can be opened twice and must not resolve twice. */
  static mount(root) {
    if (root.dataset.hotspotMounted) {
      return;
    }

    root.dataset.hotspotMounted = 'true';
    return new Hotspots(root);
  }

  constructor(root) {
    this.root = root;
    this.pills = [...root.querySelectorAll('[data-hotspot-pill]')];
    this.markers = [...root.querySelectorAll('[data-hotspot-marker]')];

    this.pills.forEach(pill => this.fill(pill));
    this.markers.forEach(marker => this.bind(marker));
  }

  /**
   * Resolve one id and render its pill.
   *
   * The pill is the design's own card — thumbnail at the inline start, name, and
   * a price row whose bag icon is the add-to-cart control. It is
   * `salla-add-product-button` for the same reason the product card's price pill
   * is: adding to a cart is the platform's job and is not reimplemented.
   */
  fill(pill) {
    const id = pill.dataset.productId;

    if (!id) {
      return this.drop(pill);
    }

    salla.product
      .getDetails(id)
      .then(response => this.render(pill, response?.data || response))
      .catch(() => this.drop(pill));
  }

  render(pill, product) {
    if (!product?.name) {
      return this.drop(pill);
    }

    const name = Hotspots.escape(product.name);
    const image = product.image?.url || product.thumbnail || '';

    pill.innerHTML = `
      <a class="hotspot__pill-link" href="${Hotspots.escape(product.url)}">
        <img class="hotspot__pill-thumb" src="${Hotspots.escape(image)}" alt="" width="72" height="72" loading="lazy">
        <span class="hotspot__pill-body">
          <span class="hotspot__pill-name">${name}</span>
          <span class="hotspot__pill-price">${salla.money(product.price)}</span>
        </span>
      </a>
      <salla-add-product-button
        class="hotspot__pill-buy"
        fill="none"
        product-id="${Hotspots.escape(product.id)}"
        product-status="${Hotspots.escape(product.status)}"
        product-type="${Hotspots.escape(product.type)}">
        <span class="sr-only">${Hotspots.escape(salla.lang.get('pages.cart.add_to_cart'))} — ${name}</span>
        <i class="sicon-shopping-bag" aria-hidden="true"></i>
      </salla-add-product-button>`;

    pill.hidden = false;

    // The currency glyph salla.money() injects is an icon font, so a screen
    // reader would read a private-use codepoint. Same fix as the product card's.
    pill.querySelectorAll('.sicon-sar').forEach(glyph => glyph.setAttribute('aria-hidden', 'true'));

    // "Labelled with the product name" — the criterion. Until the lookup returns
    // there is no name to label it with, which is why this happens here.
    const marker = this.markerFor(pill.id);

    if (marker) {
      marker.setAttribute('aria-label', salla.lang.get('theme.hotspot.marker_named', { name: product.name }));
      marker.hidden = false;
    }
  }

  /** A hotspot whose product no longer resolves leaves nothing behind. */
  drop(pill) {
    pill.hidden = true;
    pill.remove();

    const marker = this.markerFor(pill.id);
    marker?.remove();
  }

  markerFor(pillId) {
    return this.markers.find(marker => marker.getAttribute('aria-controls') === pillId);
  }

  /**
   * A marker is a shortcut to its pill, not the only route to it.
   *
   * Both artboards draw every pill visible at once, so the markers do not
   * disclose anything — activating one moves focus to the matching pill and marks
   * it current. That keeps the markers useful for pointing at a product in a busy
   * photograph without making the pills depend on them, which is what lets the
   * pill list stand as the non-visual equivalent the criterion asks for.
   */
  bind(marker) {
    marker.addEventListener('click', () => {
      const pill = this.root.querySelector(`#${CSS.escape(marker.getAttribute('aria-controls'))}`);

      if (!pill) {
        return;
      }

      this.pills.forEach(other => other.removeAttribute('aria-current'));
      pill.setAttribute('aria-current', 'true');
      pill.querySelector('a')?.focus();
    });
  }

  static escape(value = '') {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

salla.onReady(() => salla.lang.onLoaded(() => Hotspots.boot()));

export default Hotspots;
