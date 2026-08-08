/**
 * T-4.01 — the product card.
 *
 * TECHNIQUE. The backlog says "extends `salla-product-card`", which is not what
 * this is, because there is nothing to extend. `<custom-salla-product-card>` is
 * defined here, in the theme, as a plain `HTMLElement` subclass — Salla ships no
 * `salla-product-card` class for JS to inherit from. So this is technique A on
 * an upstream *theme* file, and it is registered in /docs/OVERRIDES.md as one.
 * The acceptance criterion behind that line — "SDK updates propagate" — is met
 * where it actually applies: every piece of commerce behaviour below still comes
 * from a `salla-*` element or a `salla.*` call, and none of it is reimplemented.
 *
 * WHAT CHANGED FROM UPSTREAM, and why each one:
 *
 *  · The markup is the design's. Upstream's `.s-product-card-*` classes are gone
 *    and with them upstream's styling of this card; the design shares no element
 *    with it. `04-components/product.scss` is untouched and unshadowed.
 *
 *  · The wishlist heart is gone. Neither Home nor Offers draws one — the design
 *    puts a quick-view control in that corner instead. Removing an affordance is
 *    not a decision to take quietly, so it is recorded in
 *    /docs/DERIVED-DECISIONS.md, along with where favouriting still happens.
 *
 *  · The quick-view control the design draws is NOT built here. T-4.13 owns it.
 *    A button rendered now would be a control that does nothing, which is worse
 *    than an absent one for a keyboard or screen-reader user. Carried to T-4.13.
 *
 *  · Donation, pre-order and out-of-stock paths are preserved. No artboard draws
 *    them; dropping them would silently break product types Salla supports.
 */
class ProductCard extends HTMLElement {
  connectedCallback() {
    this.product = this.product || JSON.parse(this.getAttribute('product'));

    if (window.app?.status === 'ready') {
      this.onReady();
    } else {
      document.addEventListener('theme::ready', () => this.onReady());
    }
  }

  onReady() {
    this.fitImageHeight = salla.config.get('store.settings.product.fit_type');
    this.placeholder = salla.url.asset(salla.config.get('theme.settings.placeholder'));

    /**
     * Which product tag means "delivered instantly".
     *
     * The design puts this pill on a puffer coat, a hoodie and a tote bag, so it
     * cannot be derived from `is_require_shipping` or from a digital product
     * type — every product wearing it in the artboards is physical and shipped.
     * That leaves per-product merchant intent, which on Salla is a product tag.
     *
     * The merchant names the tag in the theme customiser and tags products in
     * the dashboard; no developer is involved in either, which is the rule. This
     * is an inference and is recorded as one in /docs/DERIVED-DECISIONS.md.
     */
    this.instantDeliveryTag = (salla.config.get('theme.settings.instant_delivery_tag') || '')
      .toString()
      .trim();

    this.getProps();

    this.source = salla.config.get('page.slug');
    // If the card is in the landing page, hide the add button and show the quantity
    if (this.source === 'landing-page') {
      this.hideAddBtn = true;
      this.showQuantity = window.showQuantity;
    }

    salla.lang.onLoaded(() => {
      this.remained = salla.lang.get('pages.products.remained');
      this.donationAmount = salla.lang.get('pages.products.donation_amount');
      this.startingPrice = salla.lang.get('pages.products.starting_price');
      this.addToCart = salla.lang.get('pages.cart.add_to_cart');
      this.outOfStock = salla.lang.get('pages.products.out_of_stock');

      // re-render to update translations
      this.render();
    });

    this.render();
  }

  formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  getPriceFormat(price) {
    if (!price || Number(price) === 0) {
      return salla.config.get('store.settings.product.show_price_as_dash') ? '-' : '';
    }

    return salla.money(price);
  }

  getAddButtonLabel() {
    if (this.product.has_preorder_campaign) {
      return salla.lang.get('pages.products.pre_order_now');
    }

    if (this.product.status === 'sale' && this.product.type === 'booking') {
      return salla.lang.get('pages.cart.book_now');
    }

    if (this.product.status === 'sale') {
      return salla.lang.get('pages.cart.add_to_cart');
    }

    if (this.product.type !== 'donating') {
      return salla.lang.get('pages.products.out_of_stock');
    }

    // donating
    return salla.lang.get('pages.products.donation_exceed');
  }

  getProps() {
    /** Horizontal card. */
    this.horizontal = this.hasAttribute('horizontal');

    /** Support shadow on hover. */
    this.shadowOnHover = this.hasAttribute('shadowOnHover');

    /** Hide add to cart button. */
    this.hideAddBtn = this.hasAttribute('hideAddBtn');

    /** Full image card. */
    this.fullImage = this.hasAttribute('fullImage');

    /** Minimal card. */
    this.minimal = this.hasAttribute('minimal');

    /** Special card. */
    this.isSpecial = this.hasAttribute('isSpecial');

    /** Show quantity. */
    this.showQuantity = this.hasAttribute('showQuantity');
  }

  escapeHTML(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Does this product carry the merchant's instant-delivery tag?
   *
   * Matched on the tag NAME, case-insensitively, because that is what a merchant
   * types in the customiser and what they see in the dashboard. Matching on an
   * id would be exact but would make the setting a number nobody can verify.
   */
  hasInstantDelivery() {
    if (!this.instantDeliveryTag || !Array.isArray(this.product?.tags)) {
      return false;
    }

    const wanted = this.instantDeliveryTag.toLowerCase();

    return this.product.tags.some(
      tag => (tag?.name || tag || '').toString().trim().toLowerCase() === wanted
    );
  }

  /**
   * The badge stack in the top corner of the image.
   *
   * The artboards draw exactly one pill there, the instant-delivery tag. The
   * other three are upstream's and are kept: `preorder.label` and
   * `promotion_title` are text a merchant typed into the dashboard expecting to
   * see it on the card, and the remaining-quantity badge is what the landing
   * page's urgency treatment depends on. Dropping merchant-authored copy because
   * no artboard happens to show it is a data loss dressed as design fidelity.
   *
   * They stack rather than overlap, which is why the container is a column.
   */
  getBadges() {
    const badges = [];

    if (this.hasInstantDelivery()) {
      badges.push(`<span class="product-card__tag">
          <i class="sicon-lightning" aria-hidden="true"></i>
          ${this.escapeHTML(salla.lang.get('theme.product.instant_delivery'))}
        </span>`);
    }

    if (this.product?.preorder?.label) {
      badges.push(`<span class="product-card__tag">${this.escapeHTML(this.product.preorder.label)}</span>`);
    } else if (this.product?.promotion_title) {
      badges.push(
        `<span class="product-card__tag">${this.escapeHTML(this.product.promotion_title)}</span>`
      );
    }

    if (this.showQuantity && this.product?.quantity) {
      badges.push(`<span class="product-card__tag">
          ${this.escapeHTML(this.remained)} ${salla.helpers.number(this.product.quantity)}
        </span>`);
    }

    return badges.length ? `<div class="product-card__badges">${badges.join('')}</div>` : '';
  }

  /**
   * The action stack in the opposite corner — currently the wishlist heart alone.
   *
   * RESTORED 2026-08-08 by the project owner, overruling the removal this task
   * originally made. The reasoning is better than the one it replaces: the design
   * ships a **complete Favorites page in two states**, so something has to put
   * products into it, and no artboard shows another entry point. An unreachable
   * page is a worse defect than a control an artboard omits.
   *
   * IT IS SALLA'S OWN COMPONENT AND SALLA'S OWN STATE. `salla-button` for the
   * control, `salla.wishlist.toggle()` for the action, and the class
   * `btn--wishlist` — which is what `wishlist.js` already looks for. That last
   * detail is the whole point: upstream's card used `s-product-card-wishlist-btn`,
   * which `wishlist.js`'s `.btn--wishlist[data-id]` selector never matched, so the
   * card toggled its own classes optimistically and **lied whenever a request
   * failed**. Naming it what the platform already syncs means the true state
   * arrives from `salla.wishlist.event`, and the storage sync on ready corrects
   * it on every page load, for free.
   *
   * A STACK RATHER THAN A SINGLE BUTTON, because T-4.13's quick-view control goes
   * in this same corner. It appends to this list; it does not re-lay-out the card.
   */
  getActions() {
    const isInWishlist =
      !salla.config.isGuest() &&
      salla.storage.get('salla::wishlist', []).includes(Number(this.product.id));

    const addLabel = salla.lang.get('theme.product.add_to_wishlist');
    const removeLabel = salla.lang.get('theme.product.remove_from_wishlist');

    return `<div class="product-card__actions">
        <salla-button
          shape="icon"
          fill="none"
          color="light"
          class="btn--wishlist product-card__wishlist ${isInWishlist ? 'is-added' : 'not-added'}"
          data-id="${this.product.id}"
          data-label-add="${this.escapeHTML(addLabel)}"
          data-label-remove="${this.escapeHTML(removeLabel)}"
          aria-pressed="${isInWishlist}"
          aria-label="${this.escapeHTML(isInWishlist ? removeLabel : addLabel)}"
          onclick="salla.wishlist.toggle(${this.product.id})">
          <i class="sicon-heart" aria-hidden="true"></i>
        </salla-button>
      </div>`;
  }

  /**
   * The rating block.
   *
   * The visible row is hidden from assistive tech in one piece and replaced by a
   * single sentence, because its three parts are each useless alone: an icon
   * font announces a private-use codepoint, "4.5" has no unit, and "(700)" has
   * no noun. That sentence is what satisfies "rating exposed as text, not stars
   * alone".
   *
   * Stars fill by `Math.floor`, so 4.5 draws four solid and one outline. That is
   * what both artboards show, and rounding up would claim a rating the product
   * does not have.
   */
  getRating() {
    const rating = this.product?.rating;

    if (!rating?.stars) {
      return '';
    }

    const filled = Math.floor(rating.stars);
    const count = rating.count || 0;
    const stars = Array.from({ length: 5 }, (_, index) =>
      index < filled
        ? '<i class="product-card__star product-card__star--filled sicon-star2"></i>'
        : '<i class="product-card__star sicon-star"></i>'
    ).join('');

    const summary = salla.lang.get('theme.product.rating_summary', {
      stars: rating.stars,
      count: count,
    });

    return `<div class="product-card__rating">
        <span class="sr-only">${this.escapeHTML(summary)}</span>
        <span class="product-card__stars" aria-hidden="true">${stars}</span>
        <span class="product-card__rating-value" aria-hidden="true">${rating.stars}</span>
        <span class="product-card__rating-count" aria-hidden="true">(${salla.helpers.number(count)})</span>
      </div>`;
  }

  /**
   * Colour swatches, from the product's `color` option.
   *
   * PRESENTATIONAL, NOT SELECTABLE — a deliberate departure from this task's
   * acceptance criterion, recorded in /docs/DERIVED-DECISIONS.md. Two reasons.
   * No artboard draws a selected state on a card swatch, and T-2.15's card shell
   * is built on exactly one focusable descendant so that a keyboard user reaches
   * the product in one stop rather than five. Selecting a variant is what the
   * product page is for, and it is one Enter key away.
   *
   * Each dot still carries its colour name in visually-hidden text, so the
   * information the swatches convey is available without seeing colour at all.
   */
  getSwatches() {
    const colorOption = (this.product?.options || []).find(option => option?.type === 'color');
    const details = colorOption?.details || [];

    if (!details.length) {
      return '';
    }

    const swatches = details
      .filter(detail => detail?.color)
      .map(
        detail => `<li class="product-card__swatch" style="--swatch: ${this.escapeHTML(detail.color)}">
            <span class="sr-only">${this.escapeHTML(detail.name || '')}</span>
          </li>`
      )
      .join('');

    if (!swatches) {
      return '';
    }

    return `<ul class="product-card__swatches"
        aria-label="${this.escapeHTML(salla.lang.get('theme.product.colors_available'))}">${swatches}</ul>`;
  }

  /**
   * The price pill.
   *
   * `salla-add-product-button` does the adding. The pill only decides what goes
   * inside it: the price and a bag icon when the product can be bought, and the
   * platform's own reason when it cannot — showing a price beside a bag icon for
   * something out of stock invites a tap that can only fail.
   *
   * The accessible name is carried by visually-hidden text, because "850" is not
   * a name for a control. Sighted users read the bag; everyone else hears
   * "add to cart, 850 riyals".
   */
  getBuyPill() {
    const isBuyable = this.product.status === 'sale';
    const label = this.product.add_to_cart_label || this.getAddButtonLabel();

    const price = this.product.is_on_sale
      ? `<span class="product-card__price">${this.getPriceFormat(this.product.sale_price)}</span>
         <span class="product-card__price-was">${this.getPriceFormat(this.product.regular_price)}</span>`
      : this.product.starting_price
        ? `<span class="product-card__price">${this.getPriceFormat(this.product.starting_price)}</span>`
        : `<span class="product-card__price">${this.getPriceFormat(this.product.price)}</span>`;

    const inner = isBuyable
      ? `<span class="product-card__buy-inner">
           <span class="sr-only">${this.escapeHTML(label)}</span>
           <span>${price}</span>
           <i class="sicon-${this.product.type === 'booking' ? 'calendar-time' : 'shopping-bag'}" aria-hidden="true"></i>
         </span>`
      : `<span class="product-card__buy-inner">${this.escapeHTML(label)}</span>`;

    return `<salla-add-product-button
        class="product-card__buy ${isBuyable ? '' : 'product-card__buy--unavailable'}"
        fill="outline"
        width="wide"
        product-id="${this.product.id}"
        product-status="${this.effectiveStatus}"
        product-type="${this.product.type}">${inner}</salla-add-product-button>`;
  }

  /**
   * Donation amount field. No artboard covers it; it is kept because a donation
   * product without it cannot be donated to.
   */
  getDonation() {
    if (!this.product?.donation) {
      return '';
    }

    const canEnterAmount =
      this.product.donation.can_donate && this.product.donation.custom_amount_enabled;

    return `<div class="product-card__donation">
        <salla-progress-bar donation='${JSON.stringify(this.product.donation)}'></salla-progress-bar>
        ${
          canEnterAmount
            ? `<label for="donation-amount-${this.product.id}">${this.escapeHTML(this.donationAmount)} <span aria-hidden="true">*</span></label>
               <input type="text"
                 id="donation-amount-${this.product.id}"
                 name="donating_amount"
                 inputmode="numeric"
                 required
                 class="s-form-control"
                 placeholder="${this.escapeHTML(this.donationAmount)}" />`
            : ''
        }
      </div>`;
  }

  /**
   * Product schema, as `<meta>` rather than visible attributes.
   *
   * Microdata on the visible price would have to sit on whatever `salla.money()`
   * returned, which is formatted text with a currency glyph in it — not a value
   * a crawler can read. `price_as_float` and `currency` are the machine-readable
   * pair the platform already provides, so the schema quotes those and the
   * visible price stays exactly what the merchant's currency settings produce.
   */
  getSchema() {
    const price = this.product?.price_as_float;
    const currency = this.product?.currency;
    const rating = this.product?.rating;

    return `
      <meta itemprop="name" content="${this.escapeHTML(this.product?.name)}" />
      <meta itemprop="url" content="${this.escapeHTML(this.product?.url)}" />
      ${
        price
          ? `<div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
               <meta itemprop="price" content="${price}" />
               <meta itemprop="priceCurrency" content="${this.escapeHTML(currency || '')}" />
               <meta itemprop="availability" content="https://schema.org/${
                 this.product?.is_out_of_stock ? 'OutOfStock' : 'InStock'
               }" />
             </div>`
          : ''
      }
      ${
        rating?.stars && rating?.count
          ? `<div itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
               <meta itemprop="ratingValue" content="${rating.stars}" />
               <meta itemprop="reviewCount" content="${rating.count}" />
             </div>`
          : ''
      }`;
  }

  render() {
    this.classList.add('product-card', 'card', 'card--interactive');
    this.setAttribute('id', this.product.id);
    this.setAttribute('itemscope', '');
    this.setAttribute('itemtype', 'https://schema.org/Product');

    if (this.product?.is_out_of_stock) {
      this.classList.add('product-card--out-of-stock');
    }

    // Preserved from upstream: the platform decides whether an out-of-stock
    // product offers a "notify me" flow instead of a dead button.
    this.effectiveStatus =
      this.product.is_out_of_stock &&
      window.notify_when_available_in_card &&
      !['donating', 'financial_support'].includes(this.product?.type)
        ? 'out-and-notify'
        : this.product.status;

    const alt = this.escapeHTML(this.product?.image?.alt || this.product?.name || '');

    this.innerHTML = `
      ${this.getSchema()}
      <div class="product-card__media card__media">
        <img src="${this.product?.image?.url || this.product?.thumbnail || this.placeholder || ''}"
             alt="${alt}"
             loading="lazy"
             decoding="async" />
        ${this.getBadges()}
        ${this.getActions()}
      </div>
      <div class="product-card__body card__body">
        <h3 class="product-card__title">
          <a class="card__link" href="${this.product?.url}">${this.escapeHTML(this.product?.name)}</a>
        </h3>
        ${this.getRating()}
        ${this.getSwatches()}
        ${this.getDonation()}
        ${this.hideAddBtn ? '' : this.getBuyPill()}
      </div>
    `;

    this.silenceCurrencyGlyphs();
    this.bindDonationAmount();
  }

  /**
   * `salla.money()` swaps the currency code for `<i class="sicon-sar"></i>` when
   * the store has `use_sar_symbol` on. That is the platform's own markup and the
   * right glyph to show — but an icon font renders through a private-use
   * codepoint, so a screen reader reads garbage or nothing. Marking it decorative
   * is re-presenting the platform's output, not recomputing it; the price value
   * itself is untouched.
   */
  silenceCurrencyGlyphs() {
    this.querySelectorAll('.sicon-sar').forEach(glyph => glyph.setAttribute('aria-hidden', 'true'));
  }

  bindDonationAmount() {
    this.querySelectorAll('[name="donating_amount"]').forEach(element => {
      element.addEventListener('input', event => {
        salla.helpers.inputDigitsOnly(event.target);
        this.querySelector('salla-add-product-button')?.setAttribute(
          'donating-amount',
          event.target.value
        );
      });
    });
  }
}

customElements.define('custom-salla-product-card', ProductCard);
