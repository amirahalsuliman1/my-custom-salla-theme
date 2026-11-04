# 20 — REACT BACKLOG
## Am1als (أملاس) — the React rebuild and redesign

---

## Why this exists

On 2026-11-04 Salla rejected the Twig theme for the sixth time, with a UI/UX report written from one desktop screenshot of the home page. Salla support recommended moving to React. The owner ruled the same day: **rebuild on Salla's React framework and redesign to the approved-theme baseline in the same pass**, with a bronze-gold default accent the merchant can change.

This backlog is the plan of record for that work. It supersedes `19-ENGINEERING-BACKLOG.md` for anything not yet shipped; the Twig repository stays as the behavioural reference and is not deleted. The design targets live in `REDESIGN-2026-11.md`.

## How to read this backlog

**Task ID:** `R-<seq>`, ordered by dependency. One task at a time; each is presented and approved before the next starts.

**Complexity:** XS under half a day · S ~1 day · M ~2 days · L ~3–4 days · XL 5+ days, split before starting.

**Override technique.** The React framework has its own mechanisms, in this order of preference:
- **(R1) Engine component, styled.** Use the engine's React component or a `@salla.sa/twilight-components-react` wrapper and style it from the theme. Survives engine upgrades.
- **(R2) Registry override.** Replace a slot with `registry.register` + `registry.override` (e.g. `product:card`, `product:list-page`).
- **(R3) Fork.** Copy an engine component into `app/components/` and edit. Every fork is recorded in `FORKS.md` with its engine base version.

**Definition of done**, every task: production ready · clean code · responsive · SEO · WCAG 2.1 AA · performance · maintainability · Salla React compatible · every merchant-editable value is a setting or a locale string · logical CSS properties only · zero CLS · `prefers-reduced-motion` honoured · dark mode correct. The criteria below are additional.

**Verification**, every task: `salla theme dev` against the demo store (almas test, 300043750); the built-in browser at 1440 and 393 wide; computed type sizes checked against `REDESIGN-2026-11.md`; dark mode and RTL; no console errors.

**Framework facts** (read from `SallaApp/theme-raed-react` @ `7990287`, 2026-11-04; engine `@salla.sa/twilight-theme-engine` 1.0.151):
- TanStack Start + Vite 8, React 19, SSR in workerd. Tailwind 3.4 + SCSS in ITCSS layers under `app/styles/`.
- Routes are `app/routes/{-$locale}/…`; most are engine-generated. The theme forks product (`$slug.p$id.tsx`), cart and page.
- Home blocks register through `registerHomeComponents` in `app/router.tsx`; `twilight.json` (`"type": "react"`) still declares settings and components.
- Data comes from route loaders over the engine's REST API modules; `window.salla` handles cart, wishlist and events. Salla web components remain available through React wrappers.
- Dark mode: the engine adds `color-mode-dark` / `color-mode-light` to `body`; the theme styles it.
- Publish: `salla theme publish` pushes to the theme's GitHub repository and Salla builds from source.

---

## R-00 — Backlog and redesign spec
- **Objective:** Write this backlog and `REDESIGN-2026-11.md`; record the owner's ruling in `DERIVED-DECISIONS.md`.
- **Files:** `docs/20-REACT-BACKLOG.md`, `docs/REDESIGN-2026-11.md`, `docs/DERIVED-DECISIONS.md`, `CLAUDE.md` (current state).
- **Acceptance:** every later task names its files, technique and checkable criteria; every redesign target is a Tailwind scale step, not a measured pixel.
- **Complexity:** S

## R-01 — Scaffold the React theme
- **Objective:** Create the React theme in the Partners portal and its repository, bound to the demo store.
- **Steps:** the owner signs in to the Salla CLI (Claude never enters credentials). Then `npx @salla.sa/cli@beta theme create -t react -n "أملاس"`, choosing the demo store. Pin the engine version; keep `FORKS.md`.
- **Files:** a new repository (name chosen by the owner at creation). The Twig repository is untouched.
- **Open:** whether the existing theme 484045095 can change type. Assume not: the React theme is a new portal entry with its own ID.
- **Acceptance:** `salla theme dev` renders stock Raed React against store 300043750 in Arabic, RTL, with no console errors; `pnpm check:manifest` passes; the repository is pushed.
- **Complexity:** S

## R-02 — Foundations: tokens, accent, dark mode, fonts, locales
- **Objective:** Port the design tokens and the theme-level plumbing.
- **Source:** `src/assets/styles/01-settings/global.scss` (surfaces, text, borders, motion, focus ring), its `html.dark` block, `04-components/dark-mode.scss`, `src/locales/{ar,en}.json` (211 keys each).
- **Files:** `app/styles/01-settings/*`, `tailwind.config.cjs`, `locales/{ar,en}.json`.
- **Rules:**
  - The accent is the platform's `--color-primary` (the `color` feature); the theme never hard-codes it. Interactive elements, prices and «عرض الكل» use it.
  - Dark mode keys off `body.color-mode-dark`. Card and section surfaces differ by a visible step, so cards never sit black on black.
  - Fonts come only from the `fonts` feature; no family is pinned.
  - Locale keys become flat dotted keys; no user-facing literal in TSX.
- **Acceptance:** tokens exist for light and dark; the accent follows the dashboard colour live; the body text/surface pairs pass AA in both modes; `ar` and `en` key sets match.
- **Complexity:** M

## R-03 — Theme settings
- **Objective:** Decide the fate of every theme-level setting in the Twig `twilight.json`, add the theme-wide ones now, and add the colour mode the owner approved on 2026-11-04 (store / light / dark / device, default store).
- **Rule:** a setting that belongs to one component is added in that component's task, so no setting ships before something reads it.
- **Files:** `twilight.json`, `app/components/layout/ThemeTokens.tsx`, `app/lib/colorMode.ts`, `app/hooks/useColorMode.ts`, `docs/SETTINGS-MAP.md`.
- **Acceptance:** every Twig setting is in `SETTINGS-MAP.md` as added, dropped with a reason, engine-owned, or assigned to a task; the manifest validates; the colour mode switches live in the local editor and a dark page never paints light first.
- **Complexity:** M

## R-04 — Layout: header, footer, menu, sheet
- **Objective:** The page shell, redesigned.
- **Header:** top bar (announcement), a prominent logo (`logo_main`, `logo_light`, height settings), a desktop category row from the store menu at `text-base`, search, account, cart and colour-mode icons with 40px hit areas. Sticky and overlay behaviour as the Twig header.
- **Footer:** four groups (about and contact, store links, help and policies, social and payment marks from Salla), headings `text-lg font-bold`, links `text-base`, social icons 40px.
- **Menu and sheet:** the side-drawer menu and the bottom-sheet/dialog primitive with the Twig behaviour (`src/assets/js/partials/bottom-sheet.js`: focus trap, scroll lock without reflow, Escape, return focus).
- **Technique:** R3 for `layout/Header.tsx`, `layout/Footer.tsx` (already forks in Raed); R1 for `common/BottomSheet.tsx` where it suffices.
- **Acceptance:** sizes match the spec at both widths; keyboard and screen reader pass on menu and sheet; no CLS from the logo or the sticky header.
- **Split (2026-11-04):** R-04a header bar (category row, logo, actions, tokens) · R-04b top announcement bar and the visitor's colour-mode toggle · R-04c footer and the bottom announcement bar · R-04d drawer menu and the sheet/dialog primitive. The header's transparent state over the hero (`logo_light`) moves to R-07, which builds the hero it sits on.
- **Complexity:** L, as four tasks

## R-05 — Product card
- **Objective:** One card everywhere, redesigned.
- **Anatomy:** image (fixed ratio), wishlist and quick-view buttons (40px), name `text-base font-semibold` two lines, price `text-lg font-bold` in the accent, old price struck through, saving badge, and an add-to-cart button that is always visible. Card on a surface distinct from its section.
- **Source behaviour:** `src/assets/js/partials/product-card.js` (heart state, swatches, stepper, out-of-stock, price in the button).
- **Technique:** R2 — `registry.register('product:card', Card)` then `registry.override`.
- **Acceptance:** the same card renders on home, listing, related, wishlist and search; spec sizes at both widths; out-of-stock, on-sale and option-required states; wishlist state survives navigation.
- **Complexity:** L

## R-06 — Section header
- **Objective:** One section header for every home block and page section.
- **Spec:** title `text-2xl` / `text-3xl` bold, optional subtitle in `--text-secondary`, «عرض الكل» in the accent with an arrow, all from block settings and locales.
- **Acceptance:** used by every block in R-07 to R-18; no block draws its own title.
- **Complexity:** S

## R-07 — Hero
- **Source:** `home.hero` (slides: image, image_desktop, alt, quote, url, strips).
- **Redesign:** each slide carries a headline (`text-3xl` / `text-5xl` bold), a subline and a filled accent CTA whose label and link are slide settings. Image area and text area balanced on desktop.
- **Acceptance:** headline and CTA visible on the first screen at 1440 and 393; LCP image eager with reserved size; autoplay respects reduced motion.
- **Complexity:** M

## R-08 — Highlights
- **Source:** `home.highlights` (items: title, cover, slides 1–6, product, url).
- **Acceptance:** circles open the story viewer; each slide can link a product with «تسوّق»; keyboard operable.
- **Complexity:** M

## R-09 — Marquee
- **Source:** `home.marquee` (items, separator, speed, colours).
- **Acceptance:** pauses on hover and focus; static under reduced motion; colours are settings.
- **Complexity:** S

## R-10 — Product rows
- **Source:** the Twig products slider and the engine's `ProductsSlider`, `LatestProducts`, `FixedProducts`, `FeaturedProducts`.
- **Acceptance:** rows use the R-05 card and R-06 header; no drawn scroll bar; each row has a distinct purpose set by the merchant (category, latest, offers).
- **Complexity:** M

## R-11 — Shoppable hotspots (one component) and the lookbook
- **Source:** `src/assets/js/partials/hotspots.js`, `components/ui/hotspot-image.twig`, `home.lookbook` (image, hotspots x%/y% + product, layout, caption).
- **Rule:** one hotspot-and-pill component, reused by R-13 and the product page. A second implementation is a defect.
- **Redesign:** the section has a title from settings and a visible label explaining the points; pills show name, price in the accent and an add button.
- **Acceptance:** positions in percentages; keyboard and screen-reader reachable points; pills never leave the image.
- **Complexity:** L

## R-12 — Video carousel
- **Source:** `home.video-carousel` (embed_url, poster, product).
- **Acceptance:** posters reserve size; video loads on interaction; each item links its product.
- **Complexity:** M

## R-13 — Customer stories and the story modal
- **Source:** `home.stories`, `components/stories/*`, `story-modal.js`, `stories-filter.js`.
- **Acceptance:** masonry feed; the modal is built on the R-04 sheet/dialog primitive; hotspots use R-11; no `Article` schema.
- **Complexity:** L

## R-14 — Partner banner
- **Source:** `home.partner-banner`.
- **Rule:** the partner form still posts through Salla's contact page and message system. If that path cannot carry the form, stop and ask.
- **Acceptance:** text and CTAs balanced against the image; both CTAs are settings.
- **Complexity:** S

## R-15 — Testimonials
- **Source:** `home.custom-testimonials`.
- **Acceptance:** cards on a distinct surface; star rating announced once; no horizontal page overflow on a phone.
- **Complexity:** S

## R-16 — Store features
- **Source:** the Twig store-features restyle.
- **Redesign:** icons 48px, title `text-lg font-bold`, text `text-base`; shipping and payment promises first by default.
- **Complexity:** S

## R-17 — FAQ
- **Source:** `home.faq`.
- **Acceptance:** accessible accordion; `FAQPage` schema only when items exist.
- **Complexity:** S

## R-18 — Recently viewed
- **Source:** `home.recently-viewed`, `recently-viewed.js`.
- **Acceptance:** hidden with no history; uses the R-05 card.
- **Complexity:** S

## R-19 — Product page
- **Source:** `pages/product/single.twig`, `product-gallery.js`, `pdp-sticky-actions.js`, `pdp-stories.js`, size guide settings.
- **Technique:** R3 on the forks Raed already keeps (`ProductPage`, `ProductDetails`, `ProductGallery`, `AddToCartForm`).
- **Acceptance:** gallery with zoom setting; the action row has one frame per control; sticky actions; size guide; shipping and notice blocks; PDP stories; related products with R-05; reviews window without a drawn bar.
- **Complexity:** XL (split: gallery / actions / details / below-the-fold)

## R-20 — Listing page
- **Source:** `pages/product/index.twig`, `filters-panel.js`, `sort-disclosure.js`, `grid-density.js`, category stories.
- **Technique:** R2 via `product:list-page`.
- **Acceptance:** filters sheet on mobile, panel on desktop; sort; grid toggle setting; empty state; `ItemList` schema.
- **Complexity:** L

## R-21 — Cart, account and remaining pages
- **Scope:** cart, profile, orders and order detail (tracking via `salla-order-shipments`), wishlist, wallet, notifications, loyalty, thank-you, blog, brands, testimonials, 404.
- **Rule:** never recompute totals; re-present Salla's.
- **Complexity:** XL (split per page group)

## R-22 — Extras
- **Scope:** discount popup, WhatsApp button, back to top, add-to-cart toast, announcement bars, quick view.
- **Acceptance:** each is behind its existing setting; floating controls stack without overlap and respect the safe area.
- **Complexity:** L

## R-23 — Tests and quality
- **Objective:** Port the behaviour of the 33 jsdom test files as Vitest specs; add a manifest check and an archive-size budget (1 MB public limit assumed until Salla states the React rule).
- **Acceptance:** the suite runs in CI; axe pass on home, listing, product, cart; Lighthouse performance and CLS recorded in `docs/BUDGETS.md`.
- **Complexity:** L

## R-24 — Demo store and submission
- **Objective:** A preview store the reviewer cannot misread.
- **Steps:** default colour mode light; bronze-gold accent; sections in commercial priority, each with a distinct purpose and no repeated products; fresh screenshots; a changelog the owner approves; the publish request only on the owner's word.
- **Acceptance:** a full-page 1440 capture beside تمارا and ترف meets every row of the baseline table in `REDESIGN-2026-11.md`.
- **Complexity:** M
