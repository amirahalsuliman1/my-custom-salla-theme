# Changelog — Am1als (أملاس)

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this theme follows [Semantic Versioning](https://semver.org/).

> ⚠ **This file previously contained only upstream `theme-raed`'s release history**, which documented Salla's releases and not this theme's. That history is real and worth keeping — it is what the base was built from — so it has been moved below the divider under its own heading rather than deleted. **Everything above the divider is this theme.**

## [Unreleased] — prepared, NOT published

**T-8.12 is prepared and deliberately not closed.** Publishing is the project owner's decision and is gated on the manual QA in [`/docs/MANUAL-QA.md`](docs/MANUAL-QA.md), none of which has been executed. See §"Pre-publish checklist" in the T-8.12 backlog entry.

## [1.0.0] — first release, pending

The first Am1als release. Built by extending the official Twilight theme
[`SallaApp/theme-raed`](https://github.com/SallaApp/theme-raed) at tag **`1.365.0`**.

### Added

**Design system**
- A semantic colour token layer in `01-settings/global.scss` — surfaces, ink, borders, error/success pairs and the overlay scrim — every value measured from the SVG exports rather than inferred, with a recorded contrast table.
- One overlay primitive: a `<dialog>`-based bottom sheet that becomes a centred dialog above tablet, carrying focus trap, `Esc`, focus return and inertness from the browser. Every sheet, dialog and modal in the theme is built on it.
- One icon entry point, decorative by default, so an icon-only control cannot ship without an accessible name.
- One shared card shell, one skeleton, one empty state, one section header.
- A `prefers-reduced-motion` clamp applied at the token layer, with a marquee-specific rule because a marquee's "finished" state is off-screen rather than still.

**Storefront**
- A one-row header that sits transparent over the hero on Home and solid elsewhere, with a skip link, a sticky sentinel, and the store name as the page's single `<h1>` on Home.
- A full-bleed hero with a derived scrim strong enough to carry white text over a merchant-supplied photograph — 5.74:1 against a pure white image.
- An announcement marquee in two positions, read once by a screen reader however many times it scrolls.
- A shoppable image with percentage-anchored hotspots, a shoppable video carousel behind a façade, a customer-stories masonry feed with per-story hotspots, and a partner banner.
- A product page with gallery, options, sticky add-to-cart, related products and reviews; a listing page with filters, sort and infinite scroll; cart, checkout hand-off, and the full customer account area including orders, tracking, loyalty and notifications.
- CMS page shell, search, brands, offers, 404 and empty states derived from the established visual language.

**Merchant control**
- 44 functional settings and 6 configurable Home sections.
- A ten-field colour panel — page, text, header, footer, buttons, icons and the announcement bar — where every setting fills a token and none replaces one, so a store that changes nothing is byte-identical to the design.
- Announcement bar: colour, link, pin-to-every-page, and shopper-dismissible.
- WhatsApp button: colour, label, and which corner it lives in.

**Performance**
- Above-fold CSS inlined at 4.9 KB; `app.css` and the platform's component CSS both fetched non-blocking. No stylesheet blocks first paint.
- Route-split JavaScript with a shared media chunk, first-load JS at 37.9 KB.
- `srcset` on every image whose URL the theme controls, with the hero preload carrying a matching candidate list.
- Byte budgets enforced in CI against the shipped files.

**SEO and accessibility**
- `Organization`, `Product`, `Offer`, `AggregateRating`, `BreadcrumbList`, `FAQPage` and `ItemList` structured data, every field guarded so no node claims a value it does not have.
- 22 contrast pairs recomputed from the token layer on every build.
- RTL throughout with logical properties; no bare `left`/`right` in theme code.

### Changed
- The breakpoint mixins were converted from upstream's desktop-first `max-width` to mobile-first `min-width`.
- Upstream's two-row header, desktop hover menu and mmenu drawer were replaced by the design's single row and the overlay primitive.

### Known limitations
- ⚠ **`app.css` ships at 59.2 KB gzip against a 50 KB target.** Closing it needs route-splitting the theme's own SCSS, which is a design with real risk and has not been authorised. The 100 KB ceiling is met.
- ⚠ **Assets are not fingerprinted.** Entry filenames are referenced literally in Twig, so a `[contenthash]` would break every reference. Whether the CDN fingerprints is question **Q1**.
- ⚠ **The merchant can set colours that fail contrast**, accepted in writing as **AC-13**. The theme records the risk in each field's description and cannot enforce it.
- ⚠ **`ItemList` is built in the browser**, because the listing page's Twig context carries no products (**AC-14**, question **Q3**).
- ⚠ **The stories section cannot link to its own page from a page id** (**AC-16**, question **Q6**).
- ⚠ **The theme emits no `robots` tag** by decision (**AC-15**); keeping demo stores out of the index is the platform's (**Q4**).
- ⚠ **The partner form is not built** — Salla's contact path has no verified destination for it (**OP-13**), and T-7.09 is stopped on it.

### Not verified
**No manual QA has been executed.** Core Web Vitals, the WCAG 2.1 AA audit, cross-browser and device testing, visual regression across breakpoints, and settings toggling on a real store are all written up in [`/docs/MANUAL-QA.md`](docs/MANUAL-QA.md) — 46 items, 60 stated failure conditions — and none is claimed here.

---

# Upstream history — `SallaApp/theme-raed`

*Everything below documents Salla's releases of the base theme, not Am1als. It is kept because `1.365.0` is the version this theme extends and diffs against.*

# ⚡️ [1.352.0]( https://github.com/SallaApp/theme-raed/compare/1.351.0...1.352.0) (23-06-2026)
### Enhancement
- Hide branch pickup section for non-pickable orders.

# 🎶 [1.351.0]( https://github.com/SallaApp/theme-raed/compare/1.342.0...1.351.0) (21-06-2026)
### Enhancement
- Support `is_default` for homepage components

# 🌟 [1.342.0]( https://github.com/SallaApp/theme-raed/compare/1.336.0...1.342.0) (19-05-2026)
### Enhancement
- Reflect option SKU on storefront endpoint.

# 🪮 [1.336.0]( https://github.com/SallaApp/theme-raed/compare/1.322.0...1.336.0) (07-05-2026)
### Enhancement
- Upgraded Twilight to apply a new feature " Login Cycle IP-based Auto-fill for Country, Region, and City".

# 💣 [1.322.0]( https://github.com/SallaApp/theme-raed/compare/1.310.0...1.322.0) (08-04-2026)
### Enhancement
- Upgraded twilight for Delivery Promise v2.

# 📩 [1.310.0]( https://github.com/SallaApp/theme-raed/compare/1.308.0...1.310.0) (25-02-2026)
### Enhancement
- Support Free Product Conditional Offers.

# 📌 [1.308.0]( https://github.com/SallaApp/theme-raed/compare/1.307.0...1.308.0) (15-02-2026)
### Bug Fixes
- Optimize Enhanced Slider when there is only one slide
- Support New Flag `slides.without_overlay`


# ⛱ [1.307.0]( https://github.com/SallaApp/theme-raed/compare/1.306.0...1.307.0) (12-02-2026)
### Bug Fixes
- Enhance digital file calling place.

# ⚓️ [1.306.0]( https://github.com/SallaApp/theme-raed/compare/1.305.0...1.306.0) (12-02-2026)
### Bug Fixes
- Resolve product card images not displaying issue.

# 🔨 [1.305.0]( https://github.com/SallaApp/theme-raed/compare/1.304.0...1.305.0) (11-02-2026)
### Enhancements
- Use native loading="lazy" instead of custom lazyload.
# 🪑 [1.304.0]( https://github.com/SallaApp/theme-raed/compare/1.302.0...1.304.0) (10-02-2026)
### Enhancements
- Support responsive mobile/desktop images for fixed banner.
# 🧸 [1.302.0]( https://github.com/SallaApp/theme-raed/compare/1.301.0...1.302.0) (28-01-2026)
### Enhancements
- Refactor fixed banner image logic and cleanup styles.
# 🧷 [1.301.0]( https://github.com/SallaApp/theme-raed/compare/1.300.0...1.301.0) (27-01-2026)
### Bug Fixes
- Fix payment method logo in bank offer logo.
# 🔆 [1.300.0]( https://github.com/SallaApp/theme-raed/compare/1.299.0...1.300.0) (26-01-2026)
### Enhancements
- Add explicit dimensions to testimonial avatar images to improve Lighthouse performance score.
# 🔍 [1.299.0]( https://github.com/SallaApp/theme-raed/compare/1.298.0...1.299.0) (26-01-2026)
### Bug Fixes
- Fix overflow product option content.
# 🌐 [1.298.0]( https://github.com/SallaApp/theme-raed/compare/1.296.0...1.298.0) (21-01-2026)
### Enhancements
- Remove hero slider controls on single slide to improve LCP.

# 📢 [1.296.0]( https://github.com/SallaApp/theme-raed/compare/1.294.0...1.296.0) (20-01-2026)
### Bug Fixes
- Remove initial loader screen && add crossorigin to app and product-card scripts.

# 📦 [1.294.0]( https://github.com/SallaApp/theme-raed/compare/1.284.0...1.294.0) (07-01-2026)
### Bug Fixes
- Show free product ribbon only for discounted items with zero prices.

# 🪩 [1.284.0]( https://github.com/SallaApp/theme-raed/compare/1.282.0...1.284.0) (31-12-2025)
### Bug Fixes
- Support add product toast component.

# 🔖 [1.282.0]( https://github.com/SallaApp/theme-raed/compare/1.279.0...1.282.0) (21-12-2025)
### Enhancements
- Additional options now support digital files.

# 📭  [1.279.0]( https://github.com/SallaApp/theme-raed/compare/1.278.0...1.279.0) (07-12-2025)
### Enhancements
-  Scopes moved out from header.

# 📕  [1.278.0]( https://github.com/SallaApp/theme-raed/compare/1.276.0...1.278.0) (01-12-2025)
### Enhancements
-  Display donation-amount based on option custom_amount_enabled.

# 📘  [1.276.0]( https://github.com/SallaApp/theme-raed/compare/1.271.0...1.276.0) (20-11-2025)
### Enhancements
-  Build theme assets.

# 📙 [1.271.0]( https://github.com/SallaApp/theme-raed/compare/1.267.0...1.271.0) (11-11-2025)
### Bug Fixes
-  Fix safari `on-paste` issue.

# 🔓 [1.267.0]( https://github.com/SallaApp/theme-raed/compare/1.265.0...1.267.0) (06-11-2025)

### Bug Fixes
-  Fix updating `itemOriginalPrice` if `hasSalePrice`.
-  Fix price icon direction.

# ⭕️ [1.265.0]( https://github.com/SallaApp/theme-raed/compare/1.264.0...1.265.0) (30-10-2025)

### Bug Fixes
-  Partial payment breakdown for the customer.

# 🌀 [1.264.0]( https://github.com/SallaApp/theme-raed/compare/1.263.0...1.264.0) (27-10-2025)

### Bug Fixes
-  Prevent Accumulating Overlays On Data Changes.

# 🗺️ [1.263.0]( https://github.com/SallaApp/theme-raed/compare/1.262.0...1.263.0) (23-10-2025)

### Enhancements
- Added support for multi-item bundle products.

# ⚜️ [1.262.0]( https://github.com/SallaApp/theme-raed/compare/1.256.0...1.262.0) (21-10-2025)

### Bug Fixes
- Update WhatsApp link to use wa.me format

# 🪁 [1.257.0]( https://github.com/SallaApp/theme-raed/compare/1.256.0...1.257.0) (06-10-2025)
## Fixes
- Fix sticky label for mobile by add flag for preorder.


# ♠️ [1.256.0]( https://github.com/SallaApp/theme-raed/compare/1.252.0...1.256.0) (05-10-2025)
### Enhancements
- Profile page changed to twig.


# 🌅 [1.253.0]( https://github.com/SallaApp/theme-raed/compare/1.250.0...1.252.0) (14-09-2025)

### Bug Fixes

- Unify PreOrder and Promotion handling
- Display square banners info in mobile screen

# 🥊 [1.252.0]( https://github.com/SallaApp/theme-raed/compare/1.250.0...1.252.0) (14-09-2025)

### Bug Fixes
Handle PreOrder Label As Promotion label

# 🏁 [1.250.0]( https://github.com/SallaApp/theme-raed/compare/1.249.0...1.250.0) (11-09-2025)
### Enhancements

- Set configs in webpack.config.js to minify css

# 💭 [1.249.0]( https://github.com/SallaApp/theme-raed/compare/1.237.0...1.249.0) (11-09-2025)
### Enhancements

- Added Tiered offer component. This commit as a reference.

#  🪁 [1.229.0](https://github.com/SallaApp/theme-raed/compare/1.228.0...1.229.0) (03-08-2025)

### Bug Fixes

- Avoid Casting a Cart Item to an integer

#  ⚙️ [1.228.0](https://github.com/SallaApp/theme-raed/compare/1.227.0...1.228.0) (30-07-2025)

### Enhancements & Required Updates

- Standardized ID usage as strings in JavaScript calls across theme files to avoid parsing issues.

#### Code changes:

- File: `src/views/pages/cart.twig`

- From:
   - salla.cart.deleteItem({{ item.id }}).then(() => document.querySelector('#item-{{ item.id }}').remove())

- To:
   - salla.cart.deleteItem('{{ item.id }}').then(() => document.querySelector('#item-{{ item.id }}').remove())

- File: `src/views/pages/customer/orders/single.twig`

- From:
   - salla.event.dispatch('rating::edit', {type: 'product', feedback_id: {{item.rating.id}} })
   - salla.event.dispatch('rating::delete', {feedback_id: {{item.rating.id}} })
   - salla.event.dispatch('rating::edit', {type: 'store', feedback_id: {{order.rating.store.id}} })
   - salla.event.dispatch('rating::delete', {feedback_id: {{order.rating.store.id}} })
   - salla.event.dispatch('rating::edit', {type: 'shipping', feedback_id: {{order.rating.shipping.id}} })
   - salla.event.dispatch('rating::delete', {feedback_id: {{order.rating.shipping.id}} })


- To:
   - salla.event.dispatch('rating::edit', {type: 'product', feedback_id: '{{item.rating.id}}' })
   - salla.event.dispatch('rating::delete', {feedback_id: '{{item.rating.id}}' })
   - salla.event.dispatch('rating::edit', {type: 'store', feedback_id: '{{order.rating.store.id}}' })
   - salla.event.dispatch('rating::delete', {feedback_id: '{{order.rating.store.id}}' })
   - salla.event.dispatch('rating::edit', {type: 'shipping', feedback_id: '{{order.rating.shipping.id}}' })
   - salla.event.dispatch('rating::delete', {feedback_id: '{{order.rating.shipping.id}}' })


- File: `src/views/pages/product/single.twig`

- From:
   - salla.wishlist.toggle({{ product.id }})
   - salla.event.dispatch('scopes::open', {mode: 'availability', product_id: {{ product.id }} })

- To:
   - salla.wishlist.toggle('{{ product.id }}')
   - salla.event.dispatch('scopes::open', {mode: 'availability', product_id: '{{ product.id }}' })

- File: `src/views/pages/thank-you.twig`

- From:
   - <salla-button onclick="salla.order.show({order_id:{{ order.id }}, url:'{{ order.url }}'})">

- To:
   - <salla-button onclick="salla.order.show({order_id:'{{ order.id }}', url:'{{ order.url }}'})">

# 📦 [1.227.0](https://github.com/SallaApp/theme-raed/compare/1.226.0...1.227.0)(23-06-2025)
### Enhancements
- Enhance default content for the `customize-testimonials` block

# 🌅 [1.226.0](https://github.com/SallaApp/theme-raed/compare/1.224.0...1.226.0)(23-06-2025)
### Bug Fixes
- Support the product sale within price in cart

# ⛲️ [1.224.0](https://github.com/SallaApp/theme-raed/compare/1.223.0...1.224.0)(17-06-2025)
### Enhancements
- Upgrade outdated packages

# 🪁 [1.223.0](https://github.com/SallaApp/theme-raed/compare/1.222.0...1.223.0)(25-05-2025)
### Bug Fixes
- Add image alternative information for thumbnails in the product details' slider.

# 🥊 [1.222.0](https://github.com/SallaApp/theme-raed/compare/1.220.0...1.222.0)(18-05-2025)
### Enhancements
- Enhanced slider note in options.
- Enhanced preview images for inside blocks.

# ✨ [1.220.0](https://github.com/SallaApp/theme-raed/compare/1.214.0...1.220.0)(13-05-2025)
### Enhancements
- Update default content for homepage elements.

# 🪐 [1.214.0](https://github.com/SallaApp/theme-raed/compare/1.212.0...1.214.0)(21-04-2025)
### Enhancements
- Update preview images to enhance content display and user experience.

# 🎩 [1.212.0](https://github.com/SallaApp/theme-raed/compare/1.210.0...1.212.0)(16-04-2025)
### Bug Fixes
- Show custom fields in a user profile.

# 🧶[1.210.0](https://github.com/SallaApp/theme-raed/compare/1.208.0...1.210.0)(15-04-2025)

### Enhancements
- Support custom testimonials component.

# ⛓️‍💥 [1.218.0](https://github.com/SallaApp/theme-raed/compare/1.208.0...1.218.0)(05-05-2025)
### Enhancement
- Support a new option to select bg-size in square-photos section.



# 🎩 [1.208.0](https://github.com/SallaApp/theme-raed/compare/1.190.0...1.208.0)(12-03-2025)
  ### Bug Fixes
  - Tax amount issue in cart.

# 🏅 [1.190.0](https://github.com/SallaApp/theme-raed/compare/1.189.0...1.190.0)(23-02-2025)
### Feature
- Support the new SAR currency symbol.

# ⛵ [1.189.0](https://github.com/SallaApp/theme-raed/compare/1.187.0...1.189.0)(29-12-2024)
### Feature

- Support the `is_default` property for homepage components as well as default data for some components.
- Add preview images for each component in Theme Raed using the image key in the `twilight.json` file.

# 🧶 [1.187.0](https://github.com/SallaApp/theme-raed/compare/1.185.0...1.187.0)(17-12-2024)
### Enhancement

- Upgrade the `twilight-components` to fix the style of product's options.

# 🪐 [1.185.0](https://github.com/SallaApp/theme-raed/compare/1.184.0...1.185.0)(09-10-2024)
### Enhancement
- Update Preview Images

# 🌪️ [1.184.0](https://github.com/SallaApp/theme-raed/compare/1.183.0...1.184.0)(25-09-2024)
### Feature
- Support Blog Interaction with Comments and Likes:
  - Support for liking and unliking on the blog single page.
  - Display likes count and comments count on blog cards.
  - Enable comments and replies on the blog post page. 

# 🌂 [1.183.0](https://github.com/SallaApp/theme-raed/compare/1.182.0...1.183.0)(25-09-2024)
### Feature
- Support comments and like in the Merchant blog.

# 🎓 [1.182.0](https://github.com/SallaApp/theme-raed/compare/1.181.0...1.182.0)(24-09-2024)
### Bug Fixes
- Display rating in the `product-card`.

# 👔 [1.181.0](https://github.com/SallaApp/theme-raed/compare/1.180.0...1.181.0)(24-09-2024)
### Bug Fixes
- Display rating in the `product-card`.

# 💈 [1.180.0](https://github.com/SallaApp/theme-raed/compare/1.179.0...1.180.0)(31-08-2024)
### Enhancement
- Enhancements in the Menus.

# 🪡 [1.179.0](https://github.com/SallaApp/theme-raed/compare/1.178.0...1.179.0)(30-08-2024)
### Bug Fixes
- Avoid storing menu items in the browser.

# 👣 [1.178.0](https://github.com/SallaApp/theme-raed/compare/1.177.0...1.178.0)(29-08-2024)
### Bug Fixes
- Fix align of text in the My Account page.


# 🃏 [1.177.0](https://github.com/SallaApp/theme-raed/compare/1.176.0...1.177.0)(19-08-2024)
### Bug Fixes
-  Fix memory leak error in the `product-card`.

# 🔅 [1.176.0](https://github.com/SallaApp/theme-raed/compare/1.175.0...1.176.0)(12-08-2024)
### Bug Fixes
- Fix the error message style when a user uploads an avatar with size more than **2MB**.

# 🧮 [1.175.0](https://github.com/SallaApp/theme-raed/compare/1.174.0...1.175.0)(08-08-2024)
### Enhancement
- Enhance the reviews system.

# 📊 [1.174.0](https://github.com/SallaApp/theme-raed/compare/1.173.0...1.174.0)(06-08-2024)
### Bug Fixes
- Fix unavailable options.

# 🪞 [1.173.0](https://github.com/SallaApp/theme-raed/compare/1.172.0...1.173.0)(05-08-2024)
### Bug Fixes
- Update Product Price with unavailable option.

# 🔮 [1.172.0](https://github.com/SallaApp/theme-raed/compare/1.171.0...1.172.0)(01-08-2024)
### Bug Fixes
- Upgrade to the `twilight-components`.

# 🖼️ [1.171.0](https://github.com/SallaApp/theme-raed/compare/1.170.0...1.171.0)(01-08-2024)
### Bug Fixes
- Fix the product's image in the product's details page.

# 🔦 [1.170.0](https://github.com/SallaApp/theme-raed/compare/1.169.0...1.170.0)(25-07-2024)
### Bug Fixes
- Upgrade twilight-components package.


# 🖲️ [1.169.0](https://github.com/SallaApp/theme-raed/compare/1.168.0...1.169.0)(23-07-2024)
### Enhancements 
- Upgrade Twilight & Twilight components.

#💈[1.168.0](https://github.com/SallaApp/theme-raed/compare/1.167.0...1.168.0)(17-07-2024)
### Enhancements 
- Handle protected digital files.

# ⛓️‍💥 [1.167.0](https://github.com/SallaApp/theme-raed/compare/1.165.0...1.167.0)(10-07-2024)
### Features
- Support digital product option.

# 💈 [1.165.0](https://github.com/SallaApp/theme-raed/compare/1.164.0...1.165.0)(02-07-2024)
### Enhancements
- Support order option book appointment field in the `salla-booking-field` JS Web Component.

# 🖼️ [1.164.0](https://github.com/SallaApp/theme-raed/compare/1.163.0...1.164.0)(29-06-2024)
### Bug Fixes
- Update price based on product's options.
  
# 🛎️ [1.163.0](https://github.com/SallaApp/theme-raed/compare/1.162.0...1.163.0)(27-06-2024)
### Bug Fixes
- Fix the product options validation.

# 🎁 [1.162.0](https://github.com/SallaApp/theme-raed/compare/1.161.0...1.162.0)(12-06-2024)
### Bug Fixes
- Fix console errors due to hover action on the `menu-item` variable.

# 🎈 [1.161.0](https://github.com/SallaApp/theme-raed/compare/1.160.0...1.161.0)(12-06-2024)
### Bug Fixes
- Fix Style of the product's description.

# 📎 [1.160.0](https://github.com/SallaApp/theme-raed/compare/1.160.0...1.161.0)(20-06-2024)
### Enhancements
- Enhancements for the Testimonials Page.

# 🧲 [1.158.0](https://github.com/SallaApp/theme-raed/compare/1.154.0...1.158.0)(29-05-2024)
### Bug Fixes
 - Eager Loading on the `WishlistCard`.

# 🏷️ [1.154.0](https://github.com/SallaApp/theme-raed/compare/1.150.0...1.154.0)(23-05-2024)
### Enhancements
 - Support the [`salla-comments`](https://docs.salla.dev/doc-482455/?nav=01HNFTE06J4QC24T0D5BPRYKMD) JS Web component in the product single page.
 - Use the [`salla-products-list`](https://docs.salla.dev/doc-422719/?nav=01HNFTE06J4QC24T0D5BPRYKMD) JS Web component on the Wishlist page using custom components.
 - Cart options fixes and enhancements.
 
### Features
 - Support new component, the [`salla-conditional-offer`](https://docs.salla.dev/doc-537931/?nav=01HNFTE06J4QC24T0D5BPRYKMD) JS Web component.
   
# 📰 [1.149.0](https://github.com/SallaApp/theme-raed/compare/1.149.0...1.150.0)(21-05-2024)
### Enhancement
- Custom Component enabled for the Product Card on the Wishlist page.
### Bug Fixes
- Typographical error found on the Wishlist page.

# 💎 [1.148.0](https://github.com/SallaApp/theme-raed/compare/1.148.0...1.150.0)(21-05-2024)
### Features
- Support the [`salla-comments`](https://docs.salla.dev/doc-482455/?nav=01HNFTE06J4QC24T0D5BPRYKMD) JS Web Component.
- Support cart options total on both cart and order pages.
### Bug Fixes
- Fix the cart options price issue on the order page.

# 🏹 [1.147.0](https://github.com/SallaApp/theme-raed/compare/1.147.0...1.150.0)(16-05-2024)
### Enhancements
- Unused files removed
  - Footer's files 
    - contacts.twig
    - menu.twig
    - mobile-apps.twig
    - payment-methods.twig
    - social.twig
  - Header's files 
    - menu-item.twig
    - breadcrumbs.twig
    - menu.twig
  - Product's file
    - offer.twig
      
# 🛠 [1.146.0](https://github.com/SallaApp/theme-raed/compare/1.145.0...1.147.1)(06-05-2024)
### Bug Fixes
- Fixes and enhancements on the [`salla-reviews`](https://docs.salla.dev/doc-508226/?nav=01HNFTE06J4QC24T0D5BPRYKMD) JS Web component
- Support `salla-notifications` component

# ✨ [1.145.0](https://github.com/SallaApp/theme-raed/compare/1.143.0...1.145.0)(29-04-2024)
### Features:
- Support `main menus` via API
- Support the [`salla-reviews`](https://docs.salla.dev/doc-508226/?nav=01HNFTE06J4QC24T0D5BPRYKMD) JS Web component
- Support the [`salla-breadcrumb`](https://docs.salla.dev/doc-482370/?nav=01HNFTE06J4QC24T0D5BPRYKMD) JS Web component
- Support the [`salla-order`](https://docs.salla.dev/doc-508225/?nav=01HNFTE06J4QC24T0D5BPRYKMD) JS Web component

# 🏎️ 1.144.0 (2024-04-25)
### Features
- Validate all product options before updating the price request with better words such as "`Don't call update price request unless all product options are valid.`"
- Make quantity input as `readonly` when the maximum quantity is equal to the value `1`
  
# 🖌️ [1.143.0](https://github.com/SallaApp/theme-raed/compare/1.142.0...1.143.0) (27-03-2024)
### Features
- Support new Twilight Components using `salla.config` and Ajax requests.

# 🚀 [1.142.0](https://github.com/SallaApp/theme-raed/compare/1.141.0...1.142.0) (21-03-2024)
### Features
- Support the [`salla-offer`](https://docs.salla.dev/doc-440408/?nav=01HNFTE06J4QC24T0D5BPRYKMD) JS Web component

# 🌟 [1.141.0](https://github.com/SallaApp/theme-raed/compare/1.140.8...1.141.0) (19-03-2024)
### Features
- Support product specifications.

# 🔖 [1.140.8](https://github.com/SallaApp/theme-raed/compare/1.140.2...1.140.8) (13-02-2024)
### Features
- Support infinite scroll in the wishlist.
- Replace 'images/s-empty.png' asset to 'images/s-empty.png' CDN.
- Disable loading on the submit button and open the login modal directly if the user is a guest on the cart page.
### Bug Fixes
- Cover missed case of price update on the Product details page.
- Fix off-screen dropdown sub-menus.
  
# ⚡ [1.140.2](https://github.com/SallaApp/theme-raed/compare/1.140.0...1.140.2) (05-03-2024)
### Features
- Enhance best practices score for SEO.

# 🗳️ [1.140.0](https://github.com/SallaApp/theme-raed/compare/1.139.0...1.140.0) (15-02-2024)
### Bug Fixes
- Fix product option price with discount.

# 📜 [1.139.0](https://github.com/SallaApp/theme-raed/compare/1.138.7...1.139.0) (14-02-2024)
### Enhancements
- Enhance Cart options.

# 🔧 [1.138.7](https://github.com/SallaApp/theme-raed/compare/1.138.3...1.138.7) (11-02-2024)
### Features
- Twilight Upgrade, supporting Apple Pay with required shipping property.

# 🌐 [1.138.3](https://github.com/SallaApp/theme-raed/compare/1.138.0...1.138.3) (08-02-2024)
### Features
- Card options feature released.

<!-- # 🔥 [1.137.43](https://github.com/SallaApp/theme-raed/compare/1.137.39...1.137.43) (07-02-2024)
### Added
- Release New Feature: Card options. -->

# 🔄 [1.137.39](https://github.com/SallaApp/theme-raed/compare/1.8.0...1.137.39) (29-01-2024)
### Features
- Start of documentation
