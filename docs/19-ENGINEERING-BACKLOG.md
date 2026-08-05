# 19 — ENGINEERING BACKLOG
## Am1als (أملاس) — Salla Twilight Theme
### The implementation plan of record. No code written.

---

## How to read this backlog

**Task ID:** `T-<phase>.<seq>`. Tasks are ordered by dependency, not by priority.

**Complexity:** XS = under half a day · S = ~1 day · M = ~2 days · L = ~3–4 days · XL = 5+ days, split further before starting.

**Blocked marker:** ⛔ B*n* means the task cannot start until Blocker *n* (Section 10) is resolved. A blocked task may be groomed but not committed to a sprint.

**Override technique** — Twilight offers three distinct mechanisms, and every override task names which one applies:
- **(A) Twig replacement** — copy the Twilight `.twig` into the theme and edit. Used for page shells and layouts.
- **(B) Web component extension** — subclass or replace a `salla-*` custom element in JS (the `custom-salla-product-card` pattern). Used where Salla owns the rendering.
- **(C) CSS/part styling** — style the Salla web component from outside via its exposed parts and CSS custom properties. Always preferred over (B) when it is sufficient, because it survives SDK upgrades.

**Definition of done** — every task, no exceptions: Production Ready · Clean Code · Responsive · SEO · Accessibility · Performance · Maintainability · Twilight Compatible. The per-task Acceptance Criteria below are *additional* to this, not a replacement for it.

**Baseline verified from source** (`SallaApp/theme-raed`): structure is `src/views/{layouts,components,pages}`, `src/assets/{js,styles,images}`, `src/locales`, `twilight.json`. Styling is Tailwind + SCSS in ITCSS layers `01-settings` → `05-utilities`. Existing breakpoint mixins in `01-settings/breakpoints.scss` are **max-width** (desktop-first), which contradicts the mobile-first mandate in doc 10 — see T-1.06.

---

## Phase 0 — Decision Gate

No development starts until these close. They are tracked as tasks because they have owners, outputs and acceptance criteria.

#### T-0.01 — Resolve typography source ⛔ B1
- **Objective:** Obtain binding font family, weight, size, line-height and letter-spacing values for Arabic UI, Latin product text and the display wordmark.
- **Files affected:** none (input gathering)
- **Twilight components:** `src/assets/styles/01-settings/fonts.scss` (currently empty), `twilight.json` `features: ["fonts"]`
- **New components:** none · **New sections:** none · **Dynamic data:** none
- **Theme settings:** determines whether `font_family` is exposed as a merchant setting
- **Dependencies:** none
- **Acceptance criteria:** Figma file access, a variables/token export, or the font files plus a written type scale. Licensing for web embedding confirmed. Arabic and Latin fallback stacks agreed.
- **Complexity:** XS (client-side effort, blocking)

#### T-0.02 — Resolve spacing, radius, elevation and motion values ⛔ B2
- **Objective:** Obtain binding numeric values, or written authority to measure from raster and treat the result as the specification.
- **Files affected:** none
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** none
- **Acceptance criteria:** A spacing scale, radius scale, shadow definitions and motion durations/easings exist in writing and are signed off.
- **Complexity:** XS (blocking)

#### T-0.03 — Rule on the architecture conflict — ✅ CLOSED 2026-08-05
- **Ruling (project owner, 2026-08-05):** The theme follows the real Twilight structure as it already exists in this repo. Docs 02/18 are wrong on this point and will be amended separately. B3 is closed and T-1.01 is unblocked by it.
- **Objective:** Decide whether the theme follows the documented tree (docs 02/18) or real Twilight structure.
- **Files affected:** `02-THEME-ARCHITECTURE.docx`, `18-FINAL-PROJECT-STRUCTURE.docx` (amendment)
- **Twilight components:** whole-repo structure · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** none
- **Acceptance criteria:** Written ruling. Recommendation on record: adopt real Twilight structure and amend docs 02/18, because a non-conforming tree cannot be published to Salla.
- **Complexity:** XS (blocking)

#### T-0.04 — Supply desktop and tablet designs ⛔ B4
- **Objective:** Close the gap between doc 10's four breakpoints and 50/50 exports at 393pt width (measured 2026-08-05).
- **Files affected:** none
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** none
- **Acceptance criteria:** Desktop artboards supplied for at least Home, PDP, Cart, Account, Orders — or written authority to derive desktop layouts, which suspends "never change layout" above 768px.
- **Complexity:** XS (blocking)

#### T-0.05 — Confirm data sources for non-native features ⛔ B6
- **Objective:** Establish whether Stories, shoppable hotspots, the partner form and tracking timeline are Salla-native, app-backed, or custom.
- **Files affected:** none
- **Twilight components:** `salla-order-shipments` (candidate for tracking)
- **New components:** none · **New sections:** none
- **Dynamic data:** Stories, hotspot coordinates, partner submissions, shipment events
- **Theme settings:** determines whether Stories/hotspots are settings-driven or CMS-driven
- **Dependencies:** none
- **Acceptance criteria:** Each of the four has a named data source and a confirmed read/write path.
- **Complexity:** S (blocking)

---

## Phase 1 — Setup & Architecture

#### T-1.01 — Scaffold theme from `theme-raed`
- **Objective:** Working local build of the official theme, unmodified, as the baseline commit.
- **Files affected:** whole repo, `package.json`, `webpack.config.js`
- **Twilight components:** all (baseline) · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-0.03
- **Acceptance criteria:** `pnpm install` and production build (`pnpm production`) both succeed. The theme is pnpm-only — `package.json` enforces this with `"preinstall": "npx only-allow pnpm"`, so `npm install` fails by design. Theme previews in Salla Partners against a test store. Baseline tagged in git so every later override is diffable against upstream.
- **Complexity:** S

#### T-1.02 — Establish override and upgrade policy
- **Objective:** Write the rule for when to use technique A, B or C, and record every upstream file the theme shadows.
- **Files affected:** `/docs/OVERRIDES.md` (new)
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-1.01
- **Acceptance criteria:** A register exists listing each shadowed upstream file with its upstream version. Policy states CSS-part styling is preferred over web-component replacement. Reviewers can check compliance in PR.
- **Complexity:** S

#### T-1.03 — Theme metadata and feature flags
- **Objective:** Configure `twilight.json` identity and enable required platform features.
- **Files affected:** `twilight.json`
- **Twilight components:** feature flags `fonts`, `color`, `breadcrumb`, `filters`, `menu-images`, `unite-cards-height`
- **New components:** none · **New sections:** none · **Dynamic data:** none
- **Theme settings:** container for all later settings
- **Dependencies:** T-1.01
- **Acceptance criteria:** Theme name, author and description set. Unused upstream component flags removed so merchants aren't offered sections the design has no layout for.
- **Complexity:** XS

#### T-1.04 — RTL baseline
- **Objective:** Arabic-first document direction with correct logical properties throughout.
- **Files affected:** `src/views/layouts/master.twig`, `src/assets/styles/02-generic/`, `tailwind.config.js`
- **Twilight components:** `master.twig`
- **New components:** none · **New sections:** none · **Dynamic data:** `salla.config` locale · **Theme settings:** none
- **Dependencies:** T-1.01
- **Acceptance criteria:** `dir="rtl"` and `lang="ar"` set from store locale. Logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline`) used in all new code; no bare `left`/`right`. Latin product names render LTR inside RTL context without bidi bleed.
- **Complexity:** M

#### T-1.05 — Locale files
- **Objective:** Arabic and English string catalogues for all theme-authored copy.
- **Files affected:** `src/locales/ar.json`, `src/locales/en.json`
- **Twilight components:** `salla.lang` · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-1.01
- **Acceptance criteria:** Zero hard-coded user-facing strings in any Twig or JS. Every key present in both files. Pluralisation handled where Arabic requires it.
- **Complexity:** S

#### T-1.06 — Convert breakpoint system to mobile-first ⛔ B4
- **Objective:** Replace desktop-first max-width mixins with min-width mixins matching doc 10's four tiers.
- **Files affected:** `src/assets/styles/01-settings/breakpoints.scss`, all consuming SCSS
- **Twilight components:** breakpoint mixins consumed across `04-components/`
- **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-1.01, T-0.04
- **Acceptance criteria:** Mobile/Tablet/Laptop/Desktop min-width mixins defined. Upstream call sites migrated or shimmed without visual regression. Base styles are the 393pt design.
- **Complexity:** M

#### T-1.07 — Tooling and CI
- **Objective:** Lint, format and commit standards enforced automatically.
- **Files affected:** `.eslintrc`, `.stylelintrc`, `.prettierrc`, `.editorconfig`, CI config
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-1.01
- **Acceptance criteria:** Lint and build run on every PR. Doc 15's naming and nesting rules encoded as lint rules rather than prose. Pre-commit hook blocks failing commits.
- **Complexity:** S

#### T-1.08 — Performance and accessibility budgets
- **Objective:** Set the numeric targets that Phase 8 will audit against, before code exists to bias them.
- **Files affected:** `/docs/BUDGETS.md`, CI config
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-1.07
- **Acceptance criteria:** LCP, CLS, INP and JS/CSS byte budgets agreed and recorded. WCAG 2.1 AA named as the conformance target. CI fails on budget breach.
- **Complexity:** S

---

## Phase 2 — Design System

#### T-2.01 — Colour tokens
- **Objective:** Encode the recovered palette as the single source of colour truth.
- **Files affected:** `tailwind.config.js`, `src/assets/styles/01-settings/global.scss`
- **Twilight components:** `twilight.json` `features: ["color"]`
- **New components:** none · **New sections:** none · **Dynamic data:** none
- **Theme settings:** `primary_color`, `secondary_color` (doc 08)
- **Dependencies:** T-1.01
- **Acceptance criteria:** Tokens defined semantically (`surface/page` `#F7F6F4`, `surface/card` `#FFFFFF`, `text/secondary` `#646361`, `border/subtle` `#EDEBE8`, `accent/soft` `#F9E6E7`), not by appearance. Merchant colour overrides cascade without editing SCSS. No raw hex outside this layer.
- **Complexity:** S

#### T-2.02 — Typography tokens ⛔ B1
- **Objective:** Font faces, scale and weights as tokens.
- **Files affected:** `src/assets/styles/01-settings/fonts.scss`, `tailwind.config.js`, `src/assets/fonts/`
- **Twilight components:** `features: ["fonts"]`
- **New components:** none · **New sections:** none · **Dynamic data:** none
- **Theme settings:** `font_family` select
- **Dependencies:** T-0.01, T-2.01
- **Acceptance criteria:** Arabic and Latin faces self-hosted, subset, `font-display: swap`, preloaded for the LCP text. Scale matches Figma exactly. No layout shift on font swap.
- **Complexity:** M

#### T-2.03 — Spacing, radius, elevation, motion tokens ⛔ B2
- **Objective:** Remaining visual primitives as tokens.
- **Files affected:** `tailwind.config.js`, `src/assets/styles/01-settings/global.scss`
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-0.02, T-2.01
- **Acceptance criteria:** Scales defined; motion tokens respect `prefers-reduced-motion` at the token layer so no component has to remember. Doc 14's durations encoded.
- **Complexity:** M

#### T-2.04 — Icon system
- **Objective:** Extract and standardise the outline icon family from the exports.
- **Files affected:** `src/assets/images/icons/`, SVG sprite, `src/assets/styles/03-elements/`
- **Twilight components:** `salla-apps-icons`, upstream `sicon-*` font
- **New components:** icon partial · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.01
- **Acceptance criteria:** Single sprite, sizing scale, `currentColor` inheritance, decorative icons `aria-hidden`, meaningful icons labelled. Decision recorded on whether the upstream icon font is retained or replaced.
- **Complexity:** M

#### T-2.05 — Button component, all states
- **Objective:** Primary, secondary, ghost, icon-only across the nine states in doc 04.
- **Files affected:** `src/assets/styles/04-components/buttons.scss` (new), `src/views/components/ui/button.twig` (new)
- **Twilight components:** `salla-button` — technique C preferred
- **New components:** button wrapper if C proves insufficient · **New sections:** none · **Dynamic data:** none
- **Theme settings:** `button_style` select (doc 08)
- **Dependencies:** T-2.01, T-2.03, T-2.04
- **Acceptance criteria:** Default/hover/pressed/focus/disabled/loading/success/error/empty all implemented. Focus ring visible against every surface token and meets 3:1. Minimum 44×44 touch target. Loading state announces to assistive tech.
- **Complexity:** M

#### T-2.06 — Text, phone and textarea inputs
- **Objective:** Base form controls with validation states.
- **Files affected:** `src/assets/styles/04-components/forms.scss` (new), `src/views/components/ui/input.twig` (new)
- **Twilight components:** upstream form styles in `03-elements/`
- **New components:** input, textarea · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.05
- **Acceptance criteria:** Labels programmatically associated. Errors linked via `aria-describedby` and announced. Required state conveyed non-visually. RTL-correct including phone fields with LTR numerals. `autocomplete` set.
- **Complexity:** M

#### T-2.07 — OTP input
- **Objective:** Segmented verification-code field per the Step 3 sheet.
- **Files affected:** `src/views/components/ui/otp.twig` (new), `src/assets/js/partials/otp.js` (new)
- **Twilight components:** none
- **New components:** OTP input · **New sections:** none
- **Dynamic data:** verification state via `salla.auth` · **Theme settings:** none
- **Dependencies:** T-2.06
- **Acceptance criteria:** Paste of a full code distributes across segments. Arrow/backspace navigation works. `inputmode="numeric"`, `autocomplete="one-time-code"`. Screen reader announces position and errors. LTR digit flow inside RTL layout.
- **Complexity:** M

#### T-2.08 — Checkbox, radio, switch
- **Objective:** Selection controls.
- **Files affected:** `src/assets/styles/04-components/forms.scss`, `src/views/components/ui/`
- **Twilight components:** upstream element styles
- **New components:** three controls · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.06
- **Acceptance criteria:** Native semantics preserved; no `div` with role hacks. Keyboard operable. State not conveyed by colour alone.
- **Complexity:** S

#### T-2.09 — Quantity selector
- **Objective:** Increment/decrement control.
- **Files affected:** `src/assets/styles/04-components/forms.scss`
- **Twilight components:** `salla-quantity-input` — technique C
- **New components:** none · **New sections:** none
- **Dynamic data:** stock limits · **Theme settings:** none
- **Dependencies:** T-2.08
- **Acceptance criteria:** Restyled without replacing the element. Min/max respected. Value change announced. Buttons labelled.
- **Complexity:** S

#### T-2.10 — Bottom Sheet primitive
- **Objective:** The foundational overlay used by auth, filters and actions.
- **Files affected:** `src/views/components/ui/bottom-sheet.twig` (new), `src/assets/js/partials/bottom-sheet.js` (new), `src/assets/styles/04-components/bottom-sheet.scss` (new)
- **Twilight components:** `salla-modal` evaluated first — technique C if it can be re-presented as a sheet
- **New components:** Bottom Sheet · **New sections:** none · **Dynamic data:** runtime · **Theme settings:** none
- **Dependencies:** T-2.03, T-2.05
- **Acceptance criteria:** Focus moves in on open and returns to trigger on close. Focus trapped while open. `Esc` and backdrop close it. Background scroll locked without layout shift. `role="dialog"`, `aria-modal`, labelled. Slide-up honours reduced-motion. Becomes a centred dialog above tablet per doc 10.
- **Complexity:** L

#### T-2.11 — Confirmation dialog
- **Objective:** Destructive-action confirmation (cancel order, remove item).
- **Files affected:** `src/views/components/ui/dialog.twig` (new), `src/assets/styles/04-components/dialog.scss` (new)
- **Twilight components:** `salla-modal`
- **New components:** Dialog · **New sections:** none · **Dynamic data:** runtime · **Theme settings:** none
- **Dependencies:** T-2.10
- **Acceptance criteria:** Shares focus management with T-2.10. Destructive action is not the default focus target. Scale+fade per doc 14, reduced-motion respected.
- **Complexity:** S

#### T-2.12 — Toast bridge
- **Objective:** Route all feedback through Salla's notifier with the design's visual treatment.
- **Files affected:** `src/assets/styles/04-components/add-product-toast.scss`, `src/assets/js/partials/add-product-toast.js`
- **Twilight components:** `salla.notify`, `salla-add-product-toast` — technique C
- **New components:** none · **New sections:** none · **Dynamic data:** runtime · **Theme settings:** none
- **Dependencies:** T-2.05
- **Acceptance criteria:** Success/error/info variants match the five toast screens supplied. Announced via a live region. Not the sole channel for critical information. Auto-dismiss pausable on hover/focus.
- **Complexity:** S

#### T-2.13 — Skeleton and loading states
- **Objective:** Placeholder treatment for every async surface.
- **Files affected:** `src/assets/styles/04-components/skeleton.scss` (new)
- **Twilight components:** upstream `no-content-placeholder.scss`
- **New components:** skeleton · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.03
- **Acceptance criteria:** Dimensions reserved so skeleton→content causes zero CLS. Shimmer disabled under reduced-motion. `aria-busy` set.
- **Complexity:** S

#### T-2.14 — Empty states ⛔ B8
- **Objective:** Empty treatments for cart, favorites, orders, notifications, search.
- **Files affected:** `src/views/components/ui/empty-state.twig` (new)
- **Twilight components:** `no-content-placeholder`
- **New components:** empty state · **New sections:** none · **Dynamic data:** none
- **Theme settings:** none
- **Dependencies:** T-2.13, T-0.05
- **Acceptance criteria:** One reusable component covering all five contexts. **No design supplied — cannot start until artboards arrive or a derivation is authorised.**
- **Complexity:** S

#### T-2.15 — Card shells
- **Objective:** Shared container treatment behind product/brand/order/story/loyalty/notification cards.
- **Files affected:** `src/assets/styles/04-components/cards.scss` (new)
- **Twilight components:** none · **New components:** card shell · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.03
- **Acceptance criteria:** Radius, border and elevation drawn from tokens only. One shell, six variants — no duplicated variants (doc 04 rule).
- **Complexity:** S

#### T-2.16 — Design system review gate
- **Objective:** Sign-off before any page consumes the system.
- **Files affected:** `/docs/DESIGN-SYSTEM.md`
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.01 → T-2.15
- **Acceptance criteria:** Every component demonstrated in all nine states. Contrast validated. Keyboard pass completed. Doc 17 Phase 2 checklist signed.
- **Complexity:** S

---

## Phase 3 — Core Layout

#### T-3.01 — Master layout override
- **Objective:** Document shell, meta, asset loading order.
- **Files affected:** `src/views/layouts/master.twig`
- **Twilight components:** `master.twig`, `salla-metadata` — technique A
- **New components:** none · **New sections:** none · **Dynamic data:** store config, locale · **Theme settings:** none
- **Dependencies:** T-1.04, T-2.16
- **Acceptance criteria:** One `<h1>` per page enforced by template contract. Landmarks present. Critical CSS inlined, rest deferred. Upstream hooks preserved so Salla injects correctly.
- **Complexity:** M

#### T-3.02 — Customer layout override
- **Objective:** Shell for account-area pages.
- **Files affected:** `src/views/layouts/customer.twig`
- **Twilight components:** `customer.twig` — technique A
- **New components:** none · **New sections:** none · **Dynamic data:** customer session · **Theme settings:** none
- **Dependencies:** T-3.01
- **Acceptance criteria:** Consistent navigation across all customer pages (doc 06 principle). Unauthenticated access redirects correctly.
- **Complexity:** S

#### T-3.03 — Announcement marquee bar ⛔ B6
- **Objective:** Scrolling promotional bar above the hero.
- **Files affected:** `src/views/components/announcement-bar.twig` (new), `src/assets/styles/04-components/announcement.scss` (new)
- **Twilight components:** none
- **New components:** marquee · **New sections:** registered in `twilight.json`
- **Dynamic data:** announcement text (setting or CMS — unresolved)
- **Theme settings:** `announcement_text`, enable toggle
- **Dependencies:** T-3.01, T-0.05
- **Acceptance criteria:** Animation pauses on hover and stops entirely under reduced-motion. Content readable by screen readers without repetition. RTL scroll direction correct. No CLS on load.
- **Complexity:** M

#### T-3.04 — Header, transparent-over-hero
- **Objective:** Overlay header: avatar, cart badge, wordmark, search, burger.
- **Files affected:** `src/views/components/header/header.twig`, `src/assets/styles/04-components/header.scss`
- **Twilight components:** `header.twig` — technique A; `salla-menu`
- **New components:** none · **New sections:** none
- **Dynamic data:** cart count, customer avatar, menus
- **Theme settings:** `logo`
- **Dependencies:** T-3.03
- **Acceptance criteria:** White-on-image contrast meets 4.5:1 against the darkest and lightest hero frames, or a scrim is applied. Cart count announced as it changes. Skip link precedes it. Works when hero is absent.
- **Complexity:** L

#### T-3.05 — Sticky header on scroll
- **Objective:** The `Home_Page__Scroll_` and PDP on-scroll states.
- **Files affected:** `src/assets/js/partials/sticky-header.js` (new), header SCSS
- **Twilight components:** header · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-3.04
- **Acceptance criteria:** Transition driven by `IntersectionObserver`, not scroll listeners. No layout shift at the transition point. Reduced-motion honoured. Focus order unchanged when state flips.
- **Complexity:** M

#### T-3.06 — Navigation menu
- **Objective:** Burger-triggered menu.
- **Files affected:** `src/assets/js/partials/main-menu.js`, `src/assets/styles/04-components/menus.scss`
- **Twilight components:** `salla-menu`, `main-menu.js` — technique C then B
- **New components:** none · **New sections:** none
- **Dynamic data:** store menus · **Theme settings:** `menu-images` feature
- **Dependencies:** T-3.04, T-2.10
- **Acceptance criteria:** Full keyboard operation. Focus trapped when open, returned on close. Submenu state exposed via `aria-expanded`. RTL slide direction correct.
- **Complexity:** M

#### T-3.07 — Floating Menu component
- **Objective:** The overlay menu appearing on Favorites, Account and Tracking screens.
- **Files affected:** `src/views/components/ui/floating-menu.twig` (new), `src/assets/js/partials/floating-menu.js` (new)
- **Twilight components:** none
- **New components:** Floating Menu · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.10
- **Acceptance criteria:** Single implementation serves all three screens. Focus management shared with the sheet primitive. Dismisses on outside click and `Esc`.
- **Complexity:** M

#### T-3.08 — Footer
- **Objective:** Wordmark, two-column links, six social pills, Maroof badge, six payment marks.
- **Files affected:** `src/views/components/footer/footer.twig`, `src/assets/styles/04-components/footer.scss`
- **Twilight components:** `footer.twig` — technique A; `salla-contacts`
- **New components:** none · **New sections:** none
- **Dynamic data:** footer menu, social links, store info
- **Theme settings:** `social_links`, `footer_menu`
- **Dependencies:** T-3.01, T-2.04
- **Acceptance criteria:** Links from store menus, not hard-coded. Social icons labelled. Expands to multi-column above tablet per doc 10.
- **Complexity:** M

#### T-3.09 — Payment and trust marks ⛔ B9
- **Objective:** Tabby, Google Pay, Apple Pay, Visa, Mastercard, mada, Maroof.
- **Files affected:** `src/assets/images/`, footer template
- **Twilight components:** `salla-payments`
- **New components:** none · **New sections:** none
- **Dynamic data:** enabled payment methods, if Salla exposes them
- **Theme settings:** possibly none if platform-driven
- **Dependencies:** T-3.08, T-0.05
- **Acceptance criteria:** Marks reflect actually-enabled methods rather than a fixed image strip. Third-party mark usage rights confirmed. Maroof badge links to the real registration.
- **Complexity:** S

#### T-3.10 — Floating WhatsApp button
- **Objective:** Persistent contact affordance.
- **Files affected:** `src/views/components/ui/whatsapp-fab.twig` (new)
- **Twilight components:** `salla-contacts`
- **New components:** FAB · **New sections:** none
- **Dynamic data:** store WhatsApp number · **Theme settings:** enable toggle, number
- **Dependencies:** T-3.08
- **Acceptance criteria:** Does not obscure interactive content at any breakpoint. Labelled. Reachable in tab order at a sensible position. Respects safe-area insets.
- **Complexity:** XS

---

## Phase 4 — Commerce

#### T-4.01 — Product card override
- **Objective:** Rebuild the card: image, title, rating with count, colour swatches, price pill with bag icon, instant-delivery tag.
- **Files affected:** `src/assets/js/partials/product-card.js`, `src/assets/styles/04-components/product.scss`
- **Twilight components:** `custom-salla-product-card` extending `salla-product-card` — technique B
- **New components:** none (extends existing) · **New sections:** none
- **Dynamic data:** product, price, rating, review count, variant colours, badges
- **Theme settings:** `unite-cards-height`, placeholder image
- **Dependencies:** T-2.15, T-2.05, T-2.04
- **Acceptance criteria:** Extends the upstream class rather than forking it, so SDK updates propagate. Image dimensions reserved — zero CLS. Title links carry accessible names. Rating exposed as text, not stars alone. Swatches keyboard-selectable with non-colour state indication. Price marked up for Product schema.
- **Complexity:** L

#### T-4.02 — Wishlist card override
- **Objective:** Favorites-grid card variant.
- **Files affected:** `src/assets/js/partials/wishlist-card.js`, product SCSS
- **Twilight components:** `custom-wishlist-card`, `salla-products-list` — technique B
- **New components:** none · **New sections:** none
- **Dynamic data:** wishlist items · **Theme settings:** none
- **Dependencies:** T-4.01
- **Acceptance criteria:** Shares the T-4.01 shell; no duplicated card logic. Remove action confirms before destructive removal and announces the result.
- **Complexity:** S

#### T-4.03 — Horizontal product carousel
- **Objective:** Scroll-snap carousel with the custom progress indicator seen on Home.
- **Files affected:** `src/views/components/home/products-slider.twig`, `src/assets/styles/04-components/slider.scss`
- **Twilight components:** `products-slider.twig`, `slider-products-with-header.twig` — technique A
- **New components:** scroll indicator · **New sections:** none
- **Dynamic data:** product collection
- **Theme settings:** `products_count`, source collection
- **Dependencies:** T-4.01
- **Acceptance criteria:** Native scroll-snap, not a JS carousel library. Keyboard scrollable. Indicator is decorative and hidden from assistive tech. RTL scroll direction correct. No layout shift as images load.
- **Complexity:** M

#### T-4.04 — Section header
- **Objective:** Title plus underlined "عرض الكل" action.
- **Files affected:** `src/views/components/ui/section-header.twig` (new)
- **Twilight components:** none · **New components:** section header · **New sections:** none · **Dynamic data:** none
- **Theme settings:** per-section title text
- **Dependencies:** T-2.02
- **Acceptance criteria:** Heading level is a parameter so document outline stays valid wherever it is placed. Link has a descriptive accessible name, not bare "view all".
- **Complexity:** XS

#### T-4.05 — Hero banner section
- **Objective:** Full-bleed hero with overlaid quote and three-item strip.
- **Files affected:** `src/views/components/home/hero.twig` (new), `twilight.json`
- **Twilight components:** `enhanced-slider.twig` evaluated as base — technique A
- **New components:** none if slider is adaptable · **New sections:** Hero (registered)
- **Dynamic data:** slide images, links
- **Theme settings:** `banner_images` (multiple), `cta_text`
- **Dependencies:** T-3.04, T-4.04
- **Acceptance criteria:** Hero image is the LCP element — preloaded, `fetchpriority="high"`, correctly sized, never lazy-loaded. Overlay text meets contrast against the actual images supplied. Autoplay pausable and disabled under reduced-motion.
- **Complexity:** L

#### T-4.06 — Shoppable lookbook section ⛔ B6
- **Objective:** Editorial image with hotspot markers opening product pills.
- **Files affected:** `src/views/components/home/lookbook.twig` (new), `src/assets/js/partials/lookbook.js` (new)
- **Twilight components:** none
- **New components:** hotspot marker, product pill · **New sections:** Lookbook (registered)
- **Dynamic data:** image, hotspot coordinates, linked products — **source unresolved**
- **Theme settings:** image, per-hotspot coordinate and product picker
- **Dependencies:** T-4.01, T-0.05
- **Acceptance criteria:** Hotspots are real buttons, keyboard reachable in reading order, labelled with the product name. Coordinates stored as percentages so they survive responsive scaling. A non-visual equivalent product list exists. Merchant can place hotspots without editing code.
- **Complexity:** XL — split before starting

#### T-4.07 — Brands strip section
- **Objective:** Brand logos row on Home.
- **Files affected:** `src/views/components/home/brands.twig`, `src/assets/styles/04-components/brands.scss`
- **Twilight components:** `brands.twig` — technique A
- **New components:** brand card · **New sections:** Brands (already registered upstream)
- **Dynamic data:** brands
- **Theme settings:** `show_brand_section` toggle
- **Dependencies:** T-4.03
- **Acceptance criteria:** Logos have brand-name alt text. Section hidden cleanly when no brands exist. Toggle respected.
- **Complexity:** S

#### T-4.08 — Home page assembly
- **Objective:** Compose Home from registered sections in the design's order.
- **Files affected:** `src/views/pages/index.twig`, `twilight.json`
- **Twilight components:** `index.twig` — technique A
- **New components:** none · **New sections:** none (consumes prior)
- **Dynamic data:** all Home sections
- **Theme settings:** section order and enable toggles
- **Dependencies:** T-4.03 → T-4.07
- **Acceptance criteria:** Merchant can reorder and disable sections without code. Page renders correctly with any section disabled. Below-fold sections lazy-load. Matches both Home artboards.
- **Complexity:** M

#### T-4.09 — PDP gallery
- **Objective:** Product image gallery with the documented transition.
- **Files affected:** `src/views/pages/product/single.twig`, product SCSS, `image-zoom.js`
- **Twilight components:** `single.twig` — technique A; `image-zoom.js`
- **New components:** none · **New sections:** none
- **Dynamic data:** product images · **Theme settings:** image fit type
- **Dependencies:** T-3.05, T-2.13
- **Acceptance criteria:** Main image reserved and preloaded as LCP. Thumbnails keyboard navigable with current selection exposed. Zoom does not trap keyboard focus. Meaningful alt text.
- **Complexity:** L

#### T-4.10 — PDP info, price and options
- **Objective:** Title, price block, rating, variant options.
- **Files affected:** `src/views/pages/product/single.twig`, `src/views/pages/partials/product/options.twig`
- **Twilight components:** `options.twig`, `salla-installment`, `validate-product-options.js` — technique A
- **New components:** price block · **New sections:** none
- **Dynamic data:** product, variants, stock, offers · **Theme settings:** none
- **Dependencies:** T-4.09, T-2.08
- **Acceptance criteria:** Single `<h1>` is the product name. Option selection updates price with an announced live region. Out-of-stock conveyed non-visually. Product + AggregateRating + Offer schema emitted.
- **Complexity:** L

#### T-4.11 — PDP add-to-cart
- **Objective:** Primary conversion action.
- **Files affected:** product template, `src/assets/js/product.js`
- **Twilight components:** `salla-add-product-button`, `salla-quantity-input` — technique C
- **New components:** none · **New sections:** none
- **Dynamic data:** cart · **Theme settings:** none
- **Dependencies:** T-4.10, T-2.12
- **Acceptance criteria:** Loading and success states per doc 04. Failure surfaces a real message, never a silent no-op. Cart count updates and is announced.
- **Complexity:** M

#### T-4.12 — PDP sticky action bar
- **Objective:** The on-scroll state in `Product_Details_Page__On_Scroll_`.
- **Files affected:** product template, `src/assets/js/partials/sticky-header.js`
- **Twilight components:** none · **New components:** sticky bar · **New sections:** none · **Dynamic data:** product, cart · **Theme settings:** none
- **Dependencies:** T-4.11, T-3.05
- **Acceptance criteria:** Does not obscure content at the bottom of scroll. Respects safe-area insets. No duplicate accessible names against the in-page button. Zero CLS on appearance.
- **Complexity:** M

#### T-4.13 — Quick product view
- **Objective:** The `Quick_Product_View_Pop-up` overlay.
- **Files affected:** `src/views/components/ui/quick-view.twig` (new), `src/assets/js/partials/quick-view.js` (new)
- **Twilight components:** `salla-modal`
- **New components:** quick view · **New sections:** none
- **Dynamic data:** product, fetched on demand · **Theme settings:** none
- **Dependencies:** T-4.10, T-2.10
- **Acceptance criteria:** Product data fetched on open, not preloaded for every card. Shares focus management with T-2.10. Reuses PDP option and add-to-cart logic — no duplicated business logic (doc 15). Skeleton while loading.
- **Complexity:** L

#### T-4.14 — PDP recommendations
- **Objective:** Related products below the fold.
- **Files affected:** product template
- **Twilight components:** `products-slider.twig`, `salla-infinite-scroll`
- **New components:** none · **New sections:** none
- **Dynamic data:** related products · **Theme settings:** products count
- **Dependencies:** T-4.03, T-4.10
- **Acceptance criteria:** Lazy-loaded below the fold per doc 11. Absent cleanly when no recommendations exist.
- **Complexity:** S

#### T-4.15 — Cart page
- **Objective:** Items, coupon, summary, checkout per `Cart_Page`.
- **Files affected:** `src/views/pages/cart.twig`, `src/assets/js/cart.js`
- **Twilight components:** `cart.twig` — technique A; `salla-cart-summary`, `salla-cart-coupons`, `salla-cart-item-offers`, `salla-quantity-input`, `salla-loyalty-panel`
- **New components:** cart item row · **New sections:** none
- **Dynamic data:** cart, offers, coupons, loyalty · **Theme settings:** none
- **Dependencies:** T-4.11, T-2.09, T-2.11
- **Acceptance criteria:** Quantity and removal update totals with announcement. Coupon errors accessible. Empty cart uses T-2.14. Checkout handoff to Salla unmodified. Zero CLS on total recalculation.
- **Complexity:** L

#### T-4.16 — Offers page
- **Objective:** `Offers_Page` — banner plus discounted products.
- **Files affected:** `src/views/pages/offers.twig` (new), `twilight.json`
- **Twilight components:** `salla-offer`, `salla-count-down`
- **New components:** offer banner · **New sections:** Offers (registered)
- **Dynamic data:** offers, discounted products
- **Theme settings:** `offer_banner` image
- **Dependencies:** T-4.03, T-4.01
- **Acceptance criteria:** Countdown timers accessible and correct across timezones. Discount conveyed as text, not colour alone. Expired offers handled.
- **Complexity:** M

#### T-4.17 — Brand page ⛔ B7
- **Objective:** Brand header plus catalogue, per `Ariana_Grande`.
- **Files affected:** `src/views/pages/brands/single.twig`, `src/views/pages/brands/index.twig`
- **Twilight components:** `brands/single.twig` — technique A
- **New components:** brand header · **New sections:** none
- **Dynamic data:** brand, brand products · **Theme settings:** none
- **Dependencies:** T-4.07, T-4.01
- **Acceptance criteria:** **Confirm `Ariana_Grande.pdf` is the brand template and not a one-off campaign page** before starting. Brand schema emitted. Pagination or infinite scroll accessible.
- **Complexity:** M

#### T-4.18 — Filter panel — **UNBLOCKED 2026-08-05**
- **Objective:** Faceted filtering on listing pages, per `Show Filter.pdf` (393×852, an overlay state).
- **Files affected:** `src/assets/styles/04-components/filters.scss`, listing template
- **Twilight components:** `salla-filters` — technique C
- **New components:** filter sheet · **New sections:** none
- **Dynamic data:** filters, results · **Theme settings:** filters feature flag
- **Dependencies:** T-2.10, T-4.01
- **Acceptance criteria:** Matches `Show Filter.pdf`. Result count changes must be announced; filter state must survive back-navigation. Note the artboard is a 393×852 overlay, so it presents as a bottom sheet over the listing — build it on T-2.10 rather than as a separate overlay implementation. The listing page it filters is still missing (B8), so verify against a listing built from live store data.
- **Complexity:** L

---

## Phase 5 — Customer Area

#### T-5.01 — Auth step 1: method selection
- **Objective:** SMS / email choice in a bottom sheet.
- **Files affected:** `src/views/components/auth/login-sheet.twig` (new), `src/assets/js/partials/auth.js` (new)
- **Twilight components:** `salla-login-modal` — technique C preferred, B if presentation cannot be overridden
- **New components:** auth sheet · **New sections:** none
- **Dynamic data:** `salla.auth` · **Theme settings:** none
- **Dependencies:** T-2.10, T-2.05
- **Acceptance criteria:** Salla's auth flow is never reimplemented — only re-presented. Segmented choice is a labelled radio group. Sheet is dismissible without stranding a partial session.
- **Complexity:** L

#### T-5.02 — Auth step 2: identifier entry
- **Objective:** Phone or email input.
- **Files affected:** auth sheet, `auth.js`
- **Twilight components:** `salla-login-modal`
- **New components:** none · **New sections:** none · **Dynamic data:** `salla.auth` · **Theme settings:** none
- **Dependencies:** T-5.01, T-2.06
- **Acceptance criteria:** Country code handling correct for Saudi numbers. Validation errors announced. Back returns to step 1 preserving state. `autocomplete` set.
- **Complexity:** M

#### T-5.03 — Auth step 3: OTP verification
- **Objective:** Verification code entry and resend.
- **Files affected:** auth sheet, `auth.js`
- **Twilight components:** `salla-login-modal`
- **New components:** none (uses T-2.07) · **New sections:** none · **Dynamic data:** `salla.auth` · **Theme settings:** none
- **Dependencies:** T-5.02, T-2.07
- **Acceptance criteria:** Resend timer announced, not visual-only. Failure states distinct and actionable. Success redirects to the pre-auth destination. Rate-limit responses surfaced honestly.
- **Complexity:** M

#### T-5.04 — Account page
- **Objective:** `My_Account_Page` profile hub.
- **Files affected:** `src/views/pages/customer/profile.twig`, `src/assets/styles/04-components/user-pages.scss`
- **Twilight components:** `profile.twig` — technique A
- **New components:** none · **New sections:** none
- **Dynamic data:** customer profile · **Theme settings:** none
- **Dependencies:** T-3.02, T-2.06
- **Acceptance criteria:** Form save states per doc 04. Validation accessible. No PII in URLs or logs.
- **Complexity:** M

#### T-5.05 — Account date picker
- **Objective:** The `My_Account_Page_-_Calendar` state.
- **Files affected:** profile template, user-pages SCSS
- **Twilight components:** `salla-datetime-picker` — technique C
- **New components:** none · **New sections:** none · **Dynamic data:** profile field · **Theme settings:** none
- **Dependencies:** T-5.04
- **Acceptance criteria:** Restyled, not replaced. Keyboard navigable by day/month/year. Hijri/Gregorian handling confirmed against store locale. Selected date announced.
- **Complexity:** M

#### T-5.06 — Account floating menu state
- **Objective:** `My_Account_Page_-_Floating_Menu`.
- **Files affected:** profile template
- **Twilight components:** none · **New components:** none (uses T-3.07) · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-5.04, T-3.07
- **Acceptance criteria:** Reuses the Phase 3 component with no forked copy.
- **Complexity:** XS

#### T-5.07 — Favorites page
- **Objective:** Wishlist grid with actions.
- **Files affected:** `src/views/pages/customer/wishlist.twig`
- **Twilight components:** `wishlist.twig` — technique A; `salla-products-list`
- **New components:** none · **New sections:** none
- **Dynamic data:** wishlist · **Theme settings:** none
- **Dependencies:** T-4.02, T-3.07
- **Acceptance criteria:** Matches both Favorites artboards including the toast state. Removal announced and undoable if the toast offers it. Empty state via T-2.14.
- **Complexity:** M

#### T-5.08 — Notifications page
- **Objective:** `Notifications_Page` list.
- **Files affected:** `src/views/pages/customer/notifications.twig`
- **Twilight components:** `notifications.twig` — technique A; `salla-notifications`
- **New components:** notification card · **New sections:** none
- **Dynamic data:** notifications, time-ordered · **Theme settings:** none
- **Dependencies:** T-2.15, T-3.02
- **Acceptance criteria:** Timestamps use `<time datetime>` with relative text. Read/unread not conveyed by colour alone. Empty state handled.
- **Complexity:** M

#### T-5.09 — In-app notification overlay ⛔ B7
- **Objective:** The `Notification.pdf` overlay state.
- **Newly blocked 2026-08-05:** three distinct artboards carry this name — `Notification.pdf` (393×852), `نسخة من Notification.pdf` (393×2208, a full-page capture, so not an overlay at all) and `نسخة ٢ من Notification.pdf` (393×852). They are not copies of one another. Which one specifies this overlay is unknown, and the 2208-tall one may belong to a different task entirely.
- **Files affected:** notification component
- **Twilight components:** `salla-notifications`
- **New components:** none · **New sections:** none · **Dynamic data:** runtime · **Theme settings:** none
- **Dependencies:** T-5.08, T-2.12
- **Acceptance criteria:** Announced without stealing focus. Dismissible by keyboard.
- **Complexity:** S

#### T-5.10 — Loyalty page
- **Objective:** `Loyalty_Points_Page` — balance card and redemption entry.
- **Files affected:** `src/views/pages/loyalty.twig`, `src/assets/styles/04-components/loyalty.scss`
- **Twilight components:** `loyalty.twig` — technique A; `salla-loyalty`, `salla-loyalty-panel`
- **New components:** loyalty points card · **New sections:** none
- **Dynamic data:** points balance, tier, history
- **Theme settings:** `enable_loyalty` toggle
- **Dependencies:** T-2.15, T-3.02
- **Acceptance criteria:** Balance announced on change. Section hidden entirely when loyalty is disabled store-side, not merely visually. Points expressed as text.
- **Complexity:** M

#### T-5.11 — Points earned popup
- **Objective:** `Points_Earned_Pop-up`.
- **Files affected:** loyalty templates
- **Twilight components:** `salla-modal`
- **New components:** none (uses T-2.11) · **New sections:** none · **Dynamic data:** points event · **Theme settings:** none
- **Dependencies:** T-5.10, T-2.11
- **Acceptance criteria:** Triggered by a real loyalty event, never on a timer. Focus returns on dismiss.
- **Complexity:** S

#### T-5.12 — Points value popup, active and inactive
- **Objective:** `Points_Value_Pop-up_-_InActive` and its active counterpart `Points Value Pop-up -  Active.pdf` (note the double space in the filename). Both 393×852.
- **Files affected:** loyalty templates
- **Twilight components:** `salla-loyalty-panel`
- **New components:** none · **New sections:** none · **Dynamic data:** redemption eligibility · **Theme settings:** none
- **Dependencies:** T-5.11
- **Acceptance criteria:** Inactive state explains *why* redemption is unavailable rather than only disabling the control. Disabled state announced.
- **Complexity:** S

#### T-5.13 — Redemption flow and toast ⛔ B7
- **Objective:** Redemption completion per the two `Redemption_-_Successful_Toast_Notification` files.
- **Files affected:** loyalty templates, `src/assets/js/loyalty.js`
- **Twilight components:** `salla-loyalty` · **New components:** none · **New sections:** none
- **Dynamic data:** redemption transaction · **Theme settings:** none
- **Dependencies:** T-5.12, T-2.12
- **Acceptance criteria:** **Identify what each of the two artboards specifies — they are not duplicates.** Both are 393×852 but differ in content; assume both states are required until Design says otherwise. Redemption is idempotent — double submission cannot double-spend. Failure is recoverable and explained.
- **Complexity:** M

#### T-5.14 — Notifications floating menu state
- **Objective:** `Notifications Page - Floating Menu.pdf` (393×852).
- **Files affected:** `src/views/pages/customer/notifications.twig`
- **Twilight components:** none · **New components:** none (uses T-3.07) · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-5.08, T-3.07
- **Acceptance criteria:** Reuses the Phase 3 floating menu with no forked copy, exactly as T-5.06 does for the account page. Added 2026-08-05: the artboard had no task.
- **Complexity:** XS

#### T-5.15 — Loyalty floating menu state
- **Objective:** `Loyalty Points Page - Floating Menu.pdf` (393×852).
- **Files affected:** loyalty templates
- **Twilight components:** none · **New components:** none (uses T-3.07) · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-5.10, T-3.07
- **Acceptance criteria:** Reuses the Phase 3 floating menu with no forked copy. Renders correctly when loyalty is disabled store-side, per T-5.10. Added 2026-08-05: the artboard had no task.
- **Complexity:** XS

---

## Phase 6 — Orders

#### T-6.01 — Orders list
- **Objective:** `Orders_In_Progress` and `Orders_Pending_Payment`.
- **Files affected:** `src/views/pages/customer/orders/index.twig`
- **Twilight components:** `orders/index.twig` — technique A; `salla-orders`
- **New components:** order card · **New sections:** none
- **Dynamic data:** customer orders, statuses · **Theme settings:** none
- **Dependencies:** T-2.15, T-3.02
- **Acceptance criteria:** Status conveyed as text plus colour. Both supplied status variants covered by one component. Empty state handled. Pagination accessible.
- **Complexity:** M

#### T-6.02 — Order detail
- **Objective:** `Order_Confirmation` and its close-dropdown state.
- **Files affected:** `src/views/pages/customer/orders/single.twig`
- **Twilight components:** `orders/single.twig` — technique A; `salla-order-details`, `salla-order-totals-card`
- **New components:** none · **New sections:** none
- **Dynamic data:** order, items, totals, payment · **Theme settings:** none
- **Dependencies:** T-6.01
- **Acceptance criteria:** Expand/collapse uses `aria-expanded` with keyboard support. Totals match Salla's computation exactly — no client-side arithmetic.
- **Complexity:** M

#### T-6.03 — Cancel order flow
- **Objective:** `01_Cancel_Order_Confirmation_Pop-up`.
- **Files affected:** order templates, `src/assets/js/order.js`
- **Twilight components:** `salla-edit-order-button`
- **New components:** none (uses T-2.11) · **New sections:** none
- **Dynamic data:** order cancellation · **Theme settings:** none
- **Dependencies:** T-6.02, T-2.11
- **Acceptance criteria:** Destructive action is not default-focused. Cancellation eligibility checked server-side before the dialog offers it. Result announced; list refreshes.
- **Complexity:** M

#### T-6.04 — Reorder action and toast
- **Objective:** `Reorder_-_Successful_Toast_Notification`.
- **Files affected:** order templates, `order.js`
- **Twilight components:** cart API · **New components:** none · **New sections:** none
- **Dynamic data:** cart · **Theme settings:** none
- **Dependencies:** T-6.02, T-2.12
- **Acceptance criteria:** Unavailable or out-of-stock items reported rather than silently dropped. Cart count announced.
- **Complexity:** S

#### T-6.05 — Order timeline component
- **Objective:** Shipment progress visualisation.
- **Files affected:** `src/views/components/ui/order-timeline.twig` (new)
- **Twilight components:** `salla-order-shipments` — evaluate technique C before building new
- **New components:** timeline, only if the Salla component cannot be restyled
- **New sections:** none · **Dynamic data:** shipment events · **Theme settings:** none
- **Dependencies:** T-6.02
- **Acceptance criteria:** **Evaluate `salla-order-shipments` first and record the finding** — doc 07 assumes a new component, but the platform may already provide this. Timeline is an ordered list semantically. Current step programmatically indicated. Progress not conveyed by colour alone.
- **Complexity:** M

#### T-6.06 — Order tracking page
- **Objective:** Both artboards: `Order Tracking Page.pdf` (393×2675, the default state) and `Order Tracking Page - Floating Menu.pdf` (393×2303, the menu-open state). One template, two states — do not fork.
- **Files affected:** `src/views/pages/customer/orders/tracking.twig` (new)
- **Twilight components:** `salla-order-shipments`, `salla-order-branch`
- **New components:** none (uses T-6.05, T-3.07) · **New sections:** none
- **Dynamic data:** shipment status, carrier · **Theme settings:** none
- **Dependencies:** T-6.05, T-3.07
- **Acceptance criteria:** Live status without a full reload where the API supports it. Carrier link opens safely. Degrades gracefully when tracking data is unavailable.
- **Complexity:** M

#### T-6.07 — Thank-you page
- **Objective:** `Thank_You` post-purchase screen.
- **Files affected:** `src/views/pages/thank-you.twig`
- **Twilight components:** `thank-you.twig` — technique A; `salla-mini-checkout-widget`
- **New components:** none · **New sections:** none
- **Dynamic data:** completed order · **Theme settings:** none
- **Dependencies:** T-6.02
- **Acceptance criteria:** Conversion tracking fires exactly once, not on refresh. Order reference clearly presented. Next actions offered.
- **Complexity:** S

#### T-6.08 — Order rating — **UNBLOCKED 2026-08-05**
- **Objective:** Post-delivery review capture (doc 16 Phase 6), per `Rate Your Order.pdf` (393×2891, full-page).
- **Files affected:** order templates
- **Twilight components:** `salla-comments`
- **New components:** rating block · **New sections:** none
- **Dynamic data:** reviews · **Theme settings:** none
- **Dependencies:** T-6.02, T-0.05
- **Acceptance criteria:** Matches `Rate Your Order.pdf`. Star input keyboard operable, labelled, and not conveying its value by shape alone — the selected rating must be readable as text. Submission is idempotent and the result announced. Reuses `salla-comments` rather than a bespoke review store.
- **Complexity:** M

#### T-6.09 — Return and exchange request
- **Objective:** Customer-initiated return per `Return___Exchange`.
- **Files affected:** `src/views/pages/customer/orders/return.twig` (new)
- **Twilight components:** `salla-file-upload` if evidence upload is required
- **New components:** return form · **New sections:** none
- **Dynamic data:** return eligibility, reasons · **Theme settings:** none
- **Dependencies:** T-6.02, T-2.06
- **Acceptance criteria:** Confirm whether this artboard is a *policy page* or an *interactive request form* — the export is ambiguous. Eligibility enforced server-side. Upload accessible and size-limited.
- **Complexity:** M

---

## Phase 7 — Content

#### T-7.01 — Static page template
- **Objective:** Shared shell for all CMS pages.
- **Files affected:** `src/views/pages/page-single.twig`
- **Twilight components:** `page-single.twig` — technique A
- **New components:** none · **New sections:** none
- **Dynamic data:** CMS page content · **Theme settings:** none
- **Dependencies:** T-3.01
- **Acceptance criteria:** One template serves Shipping, Return, How-to-Order and future pages (doc 06 principle). Merchant rich-text renders with correct heading hierarchy. Prose styles defined once.
- **Complexity:** S

#### T-7.02 — FAQ accordion
- **Objective:** Both artboards: `FAQ Page.pdf` (393×1824, entries expanded) and `FAQ Page - Close Dropdown.pdf` (393×1541, entries collapsed). The 283pt delta is the disclosure animation's start and end — build one accordion covering both, not two templates.
- **Files affected:** `src/views/pages/faq.twig` (new), `src/assets/styles/04-components/accordion.scss` (new)
- **Twilight components:** upstream accordion — technique A
- **New components:** accordion · **New sections:** FAQ (registered)
- **Dynamic data:** FAQ entries
- **Theme settings:** `faq_title`
- **Dependencies:** T-7.01, T-2.03
- **Acceptance criteria:** Button-based disclosure with `aria-expanded` and `aria-controls`. Height transition honours reduced-motion. FAQPage schema emitted. Deep-linking to an entry opens it.
- **Complexity:** M

#### T-7.03 — Shipping policy page
- **Objective:** `Shipping_Policy_Page`.
- **Files affected:** content template
- **Twilight components:** `page-single.twig` · **New components:** none · **New sections:** none
- **Dynamic data:** CMS page · **Theme settings:** none
- **Dependencies:** T-7.01
- **Acceptance criteria:** Content merchant-editable, not hard-coded. Heading hierarchy valid.
- **Complexity:** XS

#### T-7.04 — How to order / warranty page
- **Objective:** `How_to_Order___Warrant_Page`.
- **Files affected:** content template
- **Twilight components:** `page-single.twig` · **New components:** step list · **New sections:** none
- **Dynamic data:** CMS page · **Theme settings:** none
- **Dependencies:** T-7.01
- **Acceptance criteria:** Numbered steps are an ordered list semantically. Icons decorative and hidden from assistive tech.
- **Complexity:** S

#### T-7.05 — Return and exchange policy page
- **Objective:** Static half of `Return___Exchange`, if T-6.09 determines it is policy content.
- **Files affected:** content template
- **Twilight components:** `page-single.twig` · **New components:** none · **New sections:** none · **Dynamic data:** CMS page · **Theme settings:** none
- **Dependencies:** T-7.01, T-6.09
- **Acceptance criteria:** Scope agreed with T-6.09 so the work is not done twice.
- **Complexity:** XS

#### T-7.06 — Stories masonry feed ⛔ B6
- **Objective:** `Customer_Stories___Pinterest_Style` feed.
- **Files affected:** `src/views/pages/stories/index.twig` (new), `src/assets/styles/04-components/stories.scss` (new)
- **Twilight components:** `testimonials.twig` / `custom-testimonials.twig` evaluated as base; `salla-infinite-scroll`
- **New components:** story card, masonry grid · **New sections:** Stories (registered)
- **Dynamic data:** **unresolved — blog, testimonials, or custom**
- **Theme settings:** `enable_stories` toggle
- **Dependencies:** T-2.15, T-0.05
- **Acceptance criteria:** Data source confirmed before build. Masonry via CSS columns or grid, not a JS layout library. Reading order matches visual order. Images lazy-loaded with reserved dimensions.
- **Complexity:** L

#### T-7.07 — Story detail view ⛔ B6
- **Objective:** `Story_Page___Pinterest_Style`.
- **Files affected:** `src/views/pages/stories/single.twig` (new)
- **Twilight components:** blog single as base candidate
- **New components:** story viewer · **New sections:** none
- **Dynamic data:** story content · **Theme settings:** none
- **Dependencies:** T-7.06
- **Acceptance criteria:** Horizontal navigation keyboard operable. Article schema emitted. Back returns to the feed at the prior scroll position.
- **Complexity:** M

#### T-7.08 — Story share toast ⛔ B6
- **Objective:** `Story_Page___Toast_Notification`.
- **Files affected:** story templates
- **Twilight components:** `salla.notify` · **New components:** none · **New sections:** none · **Dynamic data:** runtime · **Theme settings:** none
- **Dependencies:** T-7.07, T-2.12
- **Acceptance criteria:** Share uses the Web Share API with clipboard fallback. Result announced.
- **Complexity:** XS

#### T-7.09 — Partner / brand-join page ⛔ B6 ⛔ B7
- **Objective:** `Do_you_have_a_brand_or_want_to_join_us_`.
- **Files affected:** `src/views/pages/partner.twig` (new)
- **Twilight components:** `salla-file-upload` if attachments are required
- **New components:** partner form · **New sections:** none
- **Dynamic data:** **submission destination unresolved**
- **Theme settings:** page enable toggle
- **Dependencies:** T-2.06, T-0.05
- **Acceptance criteria:** **Identify what each of the two artboards specifies — they are not duplicates.** `..._.pdf` is 393×2712 and `..._-1.pdf` is 393×1660, a 1052pt difference, so they are different screens or different states of the flow, not one superseding the other. Submissions reach a real, confirmed destination. Spam protection that does not rely on a CAPTCHA barrier for assistive-tech users. Success and failure both communicated.
- **Complexity:** M

#### T-7.10 — Identify `Full_Page.pdf` ⛔ B7
- **Objective:** Determine what this artboard specifies.
- **Files affected:** unknown
- **Twilight components:** unknown · **New components:** unknown · **New sections:** unknown · **Dynamic data:** unknown · **Theme settings:** unknown
- **Dependencies:** T-0.05
- **Acceptance criteria:** Screen identified and either folded into an existing task or given its own. **This is the one export in the set with no determinable purpose.**
- **Complexity:** unknown until identified

---

## Phase 8 — Optimization, QA and Release

#### T-8.01 — Critical CSS and asset pipeline
- **Objective:** Meet the CSS budget from T-1.08.
- **Files affected:** `webpack.config.js`, `postcss.config.js`, `tailwind.config.js`
- **Twilight components:** build pipeline · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** all page tasks
- **Acceptance criteria:** Above-fold CSS inlined, remainder deferred. Unused Tailwind purged without stripping dynamically-generated classes. Assets fingerprinted. Budget met.
- **Complexity:** M

#### T-8.02 — Image strategy audit
- **Objective:** Enforce doc 11's image rules everywhere.
- **Files affected:** all templates
- **Twilight components:** all · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** image fit type
- **Dependencies:** all page tasks
- **Acceptance criteria:** Every image has explicit dimensions or aspect-ratio. Modern formats served with fallback. Only the LCP image is eager. Measured CLS at or near zero on every template.
- **Complexity:** M

#### T-8.03 — JavaScript code-splitting
- **Objective:** Meet the JS budget.
- **Files affected:** `webpack.config.js`, `src/assets/js/*`
- **Twilight components:** all JS modules · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** all page tasks
- **Acceptance criteria:** Feature-based chunks per doc 15. Customer-only code loads after authentication. No duplicated logic across bundles. Budget met.
- **Complexity:** M

#### T-8.04 — Structured data
- **Objective:** Product, BreadcrumbList, Organization, FAQPage schema.
- **Files affected:** `master.twig`, product, FAQ, brand templates
- **Twilight components:** `salla-metadata`, `salla-breadcrumb`
- **New components:** none · **New sections:** none · **Dynamic data:** product, breadcrumb, store · **Theme settings:** none
- **Dependencies:** T-4.10, T-7.02
- **Acceptance criteria:** Validates in Google Rich Results with zero errors. No schema for content absent from the page.
- **Complexity:** M

#### T-8.05 — Metadata and canonicals
- **Objective:** Titles, descriptions, canonicals, robots, Open Graph, Twitter Card.
- **Files affected:** `master.twig`, all page templates
- **Twilight components:** `salla-metadata`
- **New components:** none · **New sections:** none · **Dynamic data:** page metadata · **Theme settings:** none
- **Dependencies:** T-8.04
- **Acceptance criteria:** Unique title and description per template. Canonicals correct on filtered and paginated URLs. OG images resolve. Arabic metadata renders correctly in previews.
- **Complexity:** M

#### T-8.06 — Accessibility audit, WCAG 2.1 AA
- **Objective:** Conformance across every screen.
- **Files affected:** all
- **Twilight components:** all · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** all page tasks
- **Acceptance criteria:** Keyboard-only pass on every flow. Screen reader pass in Arabic with RTL focus order verified. Contrast validated against final tokens. Automated scan clean; manual findings triaged and fixed. Doc 13 checklist signed.
- **Complexity:** L

#### T-8.07 — Reduced-motion pass
- **Objective:** Every animation in doc 14 respects the preference.
- **Files affected:** all SCSS and JS with motion
- **Twilight components:** all animated · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-8.06
- **Acceptance criteria:** With `prefers-reduced-motion: reduce`, no non-essential motion plays and no functionality is lost.
- **Complexity:** S

#### T-8.08 — Core Web Vitals verification
- **Objective:** Prove the T-1.08 budgets on real templates.
- **Files affected:** none (measurement)
- **Twilight components:** all · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-8.01 → T-8.03
- **Acceptance criteria:** LCP, CLS and INP within budget on Home, PDP and Cart, measured on throttled mobile, not desktop.
- **Complexity:** M

#### T-8.09 — Cross-breakpoint regression ⛔ B4
- **Objective:** Verify all four tiers from doc 10.
- **Files affected:** all
- **Twilight components:** all · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-8.08, T-0.04
- **Acceptance criteria:** Every commerce-critical flow tested at every breakpoint (doc 10 requirement). Blocked above 768px until desktop designs exist.
- **Complexity:** L

#### T-8.10 — Merchant settings validation
- **Objective:** Prove every exposed setting works.
- **Files affected:** `twilight.json`
- **Twilight components:** all configurable · **New components:** none · **New sections:** none · **Dynamic data:** none
- **Theme settings:** all
- **Dependencies:** all section tasks
- **Acceptance criteria:** Every setting toggled in a real store and verified. Theme renders correctly with all optional sections disabled, and with all enabled. Defaults sensible for a fresh install.
- **Complexity:** M

#### T-8.11 — Cross-browser and device testing
- **Objective:** Verify on the real target set.
- **Files affected:** none
- **Twilight components:** all · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-8.09
- **Acceptance criteria:** Safari iOS, Chrome Android, Chrome and Safari desktop. Safe-area insets correct on notched devices. Target matrix agreed in advance.
- **Complexity:** M

#### T-8.12 — Release
- **Objective:** Publish to the store.
- **Files affected:** `twilight.json`, CHANGELOG
- **Twilight components:** all · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** all
- **Dependencies:** T-8.01 → T-8.11
- **Acceptance criteria:** Salla theme review passed. Doc 17 fully signed off. Rollback plan documented. Override register (T-1.02) current so the next SDK upgrade is tractable.
- **Complexity:** M

---

## 9. Summary

| Phase | Tasks | Blocked |
|---|---|---|
| 0 — Decision gate | 5 | 4 |
| 1 — Setup & Architecture | 8 | 1 |
| 2 — Design System | 16 | 3 |
| 3 — Core Layout | 10 | 2 |
| 4 — Commerce | 18 | 2 |
| 5 — Customer Area | 15 | 2 |
| 6 — Orders | 9 | 0 |
| 7 — Content | 10 | 5 |
| 8 — Optimization & QA | 12 | 1 |
| **Total** | **103** | **20** |

Roughly a fifth of the backlog cannot start on supplied inputs.

**Revised 2026-08-05.** Changes against the original 101/22: T-0.03 closed (B3 ruled); T-4.18 and T-6.08 unblocked (their artboards were found present, B8 narrowed); T-5.09 newly blocked (three distinct artboards share the `Notification` name, B7); T-5.14 and T-5.15 added for floating-menu states that had no task. Phase 6 now has no blocked task at all.

**Critical path:** T-0.01/02/03 → T-1.01 → T-1.04 → T-2.01/02/03 → T-2.16 → T-3.01 → T-3.04 → T-4.01 → T-4.08. Everything downstream of T-2.02 depends on typography being resolved, which makes Blocker 1 the single highest-value thing to unblock.

**Largest items, split before starting:** T-4.06 (shoppable lookbook, XL), T-2.10, T-3.04, T-4.01, T-4.05, T-4.09, T-4.10, T-4.13, T-4.15, T-5.01, T-7.06, T-8.06, T-8.09.

---

## 10. Blocker register

| # | Blocker | Blocks | Owner |
|---|---|---|---|
| B1 | Typography values unrecoverable — exports embed outlined Type 3 glyphs with no font names; doc 03 records none | T-0.01, T-2.02, and everything downstream | Design |
| B2 | Spacing, radius, elevation, motion values absent | T-0.02, T-2.03 | Design |
| ~~B3~~ | ~~Documented folder structure conflicts with real Twilight structure~~ — **CLOSED 2026-08-05: follow real Twilight structure; docs 02/18 to be amended** | — | Architecture |
| B4 | No desktop or tablet designs — **50/50 exports are 393pt wide** (measured 2026-08-05). 22 are 393×852, the iPhone 14/15 Pro viewport, and are overlay/state frames; the other 28 are full-page scroll captures ranging 393×1213 (`Thank You`) to 393×5131 (`Home Page (No Scroll)`). Not one tablet or desktop artboard exists | T-0.04, T-1.06, T-8.09, all responsive AC | Design |
| B5 | Phase numbering conflict between doc 01 and docs 16/17 | Backlog sequencing — this backlog follows docs 16/17 | PM |
| B6 | Data sources unconfirmed: Stories, hotspots, partner form, tracking | T-3.03, T-4.06, T-6.05, T-7.06–7.09 | Platform |
| B7 | Unidentified exports. **Corrected 2026-08-05: the "duplicate" pairs are not duplicates.** Each differs in page height and file size, so each is a distinct screen with no name telling us which. Three clusters: (a) partner — `Do you have a brand or want to join us_.pdf` 393×2712 vs `..._-1.pdf` 393×1660; (b) redemption — the two `Redemption - Successful Toast Notification` files, both 393×852 but different byte sizes; (c) notification — `Notification.pdf` 393×852, `نسخة من Notification.pdf` 393×2208 (a full-page capture), `نسخة ٢ من Notification.pdf` 393×852. The Arabic filenames say "copy of" but the artboards are not copies. Also unresolved: `Full_Page.pdf` (393×2435) unidentified, `Ariana_Grande.pdf` purpose unconfirmed. **Needed: a name and a purpose for each file, not a choice between them** | T-4.17, T-5.09, T-5.13, T-7.09, T-7.10 | Design |
| B8 | Missing screens — **narrowed 2026-08-05 after auditing `docs/design/`**: search results, collection/category listing, empty states, 404. The filter panel (`Show Filter.pdf`) and order rating (`Rate Your Order.pdf`) were **found present**, so T-4.18 and T-6.08 are unblocked | T-2.14 | Design |
| B9 | Third-party payment and trust mark provenance and usage rights | T-3.09 | Legal / Platform |
