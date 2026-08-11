# OVERRIDES — shadowed upstream files

**Task:** T-1.02 · **Status:** register empty, and that is the correct starting state.

This file is the single record of every upstream Twilight file this theme shadows. If a file is not in the register below, the theme does not own it and an SDK upgrade may replace it freely. If a file **is** in the register, someone must reconcile it by hand on every upgrade. Keeping the register short is the point.

---

## 1. Baseline

| | |
|---|---|
| Upstream repository | `SallaApp/theme-raed` |
| Git remote | `upstream` |
| **Pinned baseline tag** | **`1.365.0`** |
| Verified | 2026-08-05, by tree comparison — `git rev-parse d5ca1cb:src` matches `1.365.0:src` byte for byte |

> **Do not trust `package.json`.** It declares `"version": "1.358.0"`. That is wrong. The scaffold's source tree is identical to upstream `1.365.0`, not `1.358.0`. Diffing against `1.358.0` produces 46 files of phantom drift that has nothing to do with this theme. Always diff against `1.365.0`.

One nuance worth knowing before you diff: upstream `1.365.0`, `1.366.0` and `1.367.0` have **identical** `src/` and `twilight.json`. The releases differ only outside the source tree. Real source drift starts at `1.368.0`.

If the `upstream` remote is missing on a fresh clone:

```bash
git remote add upstream https://github.com/SallaApp/theme-raed.git
git fetch upstream
```

---

## 2. Override technique policy

Three mechanisms, in strict order of preference. **Always use the highest letter that is sufficient.** Escalating from C to B, or B to A, requires a one-line justification in the PR description.

### (C) CSS / part styling — preferred

Style the Salla web component from outside, through its exposed CSS parts and custom properties. Nothing is shadowed, nothing is forked, and the component keeps receiving upstream fixes.

Use for: restyling `salla-button`, `salla-quantity-input`, `salla-filters`, `salla-modal`, `salla-datetime-picker`, and every other `salla-*` element whose markup we do not need to change.

**A technique-C change adds no row to the register.** That is precisely why it is preferred.

### (B) Web component extension

Subclass the custom element in JS when C cannot reach what needs changing — new markup, new behaviour, different data binding.

Use for: `custom-salla-product-card` extending `salla-product-card`, and `custom-wishlist-card`. Extend the upstream class; do not copy its body into the theme. A subclass inherits upstream fixes to the methods it does not override.

**Adds a row to the register.**

### (A) Twig replacement — last resort

Copy the upstream `.twig` into the theme and edit it. The copy is frozen at the moment it is taken and receives no upstream fix ever again.

Use for: page shells and layouts — `master.twig`, `customer.twig`, page templates under `src/views/pages/`.

**Adds a row to the register, and is the expensive kind of row.** Every technique-A file is permanent manual reconciliation work on every upgrade.

---

## 3. The register

| Path | Technique | Upstream version at override | Task | Last reconciled with upstream |
|---|---|---|---|---|
| `twilight.json` | A | `1.365.0` | T-1.03 — the theme manifest is necessarily theme-owned: identity, feature flags and section registrations are the theme's own configuration, not upstream code we could have left alone. Recorded because an upgrade that adds a platform feature flag or a new upstream section will not reach us. **T-2.12 changed one shipped default rather than adding a setting:** `enable_add_product_toast` is `false`, so a store installed and left alone shows the slim toast the artboards draw instead of upstream's enhanced product card. **The `features` array inside this file is NOT ours — see §3.1 below** | — |
| `tailwind.config.js` | A | `1.365.0` | T-1.04 — the build's design-token configuration, theme-owned for the same reason as the manifest. Currently holds one addition: the four `.bidi-*` isolation utilities. T-2.01 onward will add the colour, spacing and type scales here | — |
| `src/assets/styles/01-settings/breakpoints.scss` | A | `1.365.0` | T-1.06 — upstream ships five **max-width** mixins, which contradicts doc 10's mobile-first mandate. Replaced with four min-width tiers. **This is the one row that keeps eleven others out of the register:** the alternative was migrating every consuming stylesheet | — |
| `package.json` | A | `1.365.0` | T-1.07 — lint and CI scripts, the Husky `prepare` hook, and the lint dev-dependencies. Reconcile by taking upstream's dependency bumps and keeping our `scripts` block; `"version"` stays untrustworthy either way, see the baseline note above | — |
| `src/assets/styles/01-settings/global.scss` | A | `1.365.0` | T-2.01 — the colour token layer, necessarily theme-owned. Adds the Am1als semantic tokens and the focus-ring tokens; also deletes a dead duplicate `--color-primary: #5cd5c4` that upstream immediately overrode on the next line | — |
| `src/views/components/footer/footer.twig`, `src/assets/styles/04-components/footer.scss` | A | `1.365.0` | T-3.08 — both replaced. **This is the one case so far where adopting the stylesheet was cheaper than avoiding it:** upstream's `footer.scss` styles `.store-footer` itself, in 48 lines, so a new file would have left the same element half-styled from two places. Contrast with T-4.01/T-3.04/T-4.03/T-4.21, where the upstream stylesheet targeted classes the design no longer uses and was left alone. Reconcile the template for **new `salla-*` elements**, not for layout. **T-3.09 added `payment`, `sbc` and `cod` slot templates plus C-technique rules for `.s-payments-list*`** — the base look for those classes ships in `@salla.sa/twilight-tailwind-theme`'s safelist, not in the component (whose entire stylesheet is `:host{display:block}`), so **an upgrade of that package is what can move this, not an upgrade of the component** | — |
| `src/views/components/home/photos-slider.twig` | A | `1.365.0` | T-4.21 — upstream's `salla-slider type="carousel" centered` carrier is **kept unchanged**; what changed is a real heading, merchant alt text in place of `"{store.name}} image-slider-{index}}"`, reserved dimensions, a progress-bar pagination and a pause control. **`04-components/slider.scss` is not shadowed.** Reconcile by checking upstream for **new slider attributes** | — |
| `src/views/components/home/products-slider.twig` | A | `1.365.0` | T-4.03 — upstream delegates the whole section to `salla-products-slider`, which is swiper, and the acceptance criterion is "native scroll-snap, **not** a JS carousel library". Replaced with `salla-products-list` plus CSS scrolling. **`04-components/slider.scss` is deliberately NOT shadowed** — 190 lines styling a component this section no longer uses. Reconcile by checking upstream for **new list attributes**, not for the slider | — |
| `src/views/pages/product/single.twig`, `src/assets/js/product.js` | A | `1.365.0` | T-4.09 — the gallery region only. `salla-slider type="thumbs"` is **kept**; what changed is a keyboard-reachable thumbnail with `aria-current`, an `aspect-ratio` reservation in place of `auto-height`, an `alt` fallback to the product name, and the T-4.03 indicator. **`04-components/product.scss` is NOT shadowed** — 436 lines of upstream PDP styling holding one gallery selector; the gallery lives in the new `product-gallery.scss`, the call T-4.01 made for the card. `product.js` was adopted for one import and inherited four lint errors, now fixed with no behaviour change. Reconcile by checking upstream for **new slider attributes and new slots**, and for anything that re-adds `auto-height` | — |
| `src/assets/js/wishlist.js` | A | `1.365.0` | T-4.01 — one added method, `syncFavoriteState()`, called from upstream's `toggleFavoriteIcon()`, plus the one `prefer-const` fix the lint ratchet obliged on adoption. It sets `aria-pressed` and swaps the button's label; upstream conveyed wishlist state by fill and colour alone. **Extended in T-7.07** to also update `[data-wishlist-text]`, so a *text* wishlist button's visible label and accessible name cannot disagree — WCAG 2.5.3. Reconcile by taking upstream's version and re-adding the call and the method | — |
| `src/assets/js/home.js` | A | `1.365.0` | T-4.05 — one added method, `initHeroAutoplay()`, plus the four `eqeqeq`/`prefer-const` fixes the lint ratchet obliged the moment the file was adopted. Upstream's `initFeaturedTabs()` is otherwise untouched. Reconcile by taking upstream's version and re-adding the method | — |
| `src/views/components/header/header.twig` | A | `1.365.0` | T-3.04 — replaced wholesale. Upstream ships a two-row header (top navbar plus main nav); the design is one row, and no artboard draws any part of the top navbar. **`04-components/header.scss` is deliberately NOT shadowed**: it styles `.top-navbar` and `.main-nav-container`, never `.store-header`, so the design's header could be styled in a new file and 294 upstream lines left alone. Reconcile by reading upstream's header for **new `salla-*` elements**, not for layout | — |
| `src/locales/ar.json`, `src/locales/en.json` | A | `1.365.0` | T-2.05 introduced the first theme-authored key and **the rows were missed then; added 2026-08-08 under T-4.01**, which added three more. Two rows would be honest but the pair is only ever edited together. Reconciliation is unusually cheap by design: T-1.05's contract confines every theme key to the single `theme.*` subtree, so an upgrade is a merge of one key rather than a three-way diff through upstream's own namespaces. `pnpm run lint:locales` proves ar/en parity | — |
| `src/assets/styles/01-settings/fonts.scss` | A | `1.365.0` | T-2.02 — shipped **empty**; now carries the typography contract and the `--font-fallback` stack. Nothing upstream to reconcile against unless upstream starts using the file | — |
| `src/assets/styles/05-utilities/font-customization.scss` | A | `1.365.0` | T-2.02 — the `body.font-dinnextltarabic-regular` gate was removed so the rule binds to the button rather than one font face. Expected to disappear entirely in T-2.05 | — |
| `src/assets/js/partials/product-card.js` | A | `1.365.0` | T-4.01 — the product card's markup is the design's, so upstream's `render()` is replaced wholesale. **Technique A by necessity, not by choice:** the backlog calls this technique B, "extend `salla-product-card`", but Salla ships no such class — `<custom-salla-product-card>` is defined in this very file as a plain `HTMLElement` subclass, and there is nothing to inherit from. Commerce behaviour is still not reimplemented: every action goes through a `salla-*` element or a `salla.*` call. Reconcile by re-reading upstream's `render()` for **new product fields**, not for markup | — |
| `webpack.config.js` | A | `1.365.0` | T-2.10 — **files added to the `app` entry array and nothing else.** `bottom-sheet.js` first, then `sticky-header.js`, `otp.js`, `quantity.js` and — T-2.12 — `toast.js`. Each has to be in the bundle every page loads, and importing them from `app.js` would have adopted that file, and its sixteen pre-existing lint problems, under the T-1.07 ratchet. **`toast.js` also depends on the array for a second reason:** it imports `sweetalert2`, which `app.js` already pulls into the same chunk, so the import costs nothing. Reconcile by taking upstream's config and re-adding the array elements | — |
| `src/views/layouts/master.twig` | A | `1.365.0` | T-3.01 — the document shell, theme-owned by definition: there is no C or B path to a layout. **The delta is deliberately small and every part of it is a value only a template can carry** — the `button-style-*` body class, `--color-brand-secondary` in the inline `:root`, and the `<noscript>` copy routed through `theme.common.*`. Upstream's variable table, all six hooks, the `lang`/`dir` line and the `<main>` conditional class are untouched. **T-2.12 added a fourth, and it is a default rather than a line:** `enable_add_product_toast` falls back to `false` in all three places this file reads it, because upstream's enhanced add-to-cart toast appears in no artboard and the design's add message is the slim notifier toast. **T-5.01 added a fifth:** the bare `<salla-login-modal>` is replaced by an include of `components.auth.login-sheet`, which renders the same component `inline` inside T-2.10's sheet — the element is still present on every page and still listens for `login::open`, so this is a change of wrapper, not of wiring. Reconcile by taking upstream's version and re-applying those five, then re-reading the head for **new asset tags** | — |
| `src/views/layouts/customer.twig`, `src/views/pages/customer/profile.twig` | A | `1.365.0` | **T-5.04 rewrote `profile.twig` to the artboard** — two `.account-panel` cards, the six fields routed through T-2.06's `components.ui.input`, the gender `<select>` replaced by a T-2.08 radio group in a `<fieldset>`, and the avatar sized as T-3.02 said this task would. Every `salla-*` element upstream mounted is **kept** (`salla-file-upload`, `salla-datetime-picker`, `salla-tel-input`, `salla-user-settings`, `salla-verify`) and every hook is preserved; `salla-button type="submit"` is kept deliberately, because `salla.form.onSubmit` drives its `load()`/`stop()`. **T-5.11 added the points-earned dialog to `customer.twig`.** · T-3.02 — the account shell, theme-owned for the same reason as `master.twig`: there is no C or B path to a layout. **Two upstream elements are removed rather than restyled** — the gradient `.profile-header` band and the `hidden lg:block` sidebar, neither of which appears in any of the five account artboards, the second forbidden outright by B4. **No upstream stylesheet was touched to remove them:** their rules hang off the dropped classes. `profile.twig` carries a single relocation — the avatar uploader the sidebar used to hold — with its markup unchanged. Reconcile by re-reading upstream's layout for **new `salla-*` elements**, not for layout | — |
| `src/assets/js/app.js`, `src/assets/js/partials/main-menu.js` | A | `1.365.0` | T-3.06 — **the file the ratchet had made expensive, adopted deliberately.** `app.js` loses `import MobileMenu from 'mmenu-light'`, `initiateMobileMenu()`, `changeMenuDirection()` and the `#more-menu-dropdown` poll — all four served either mmenu or the desktop menu bar B4 forbids — and with them **two forever-running intervals**. Its sixteen pre-existing lint problems were fixed on adoption, including `header_is_sticky` read as a bare global. `main-menu.js` is rewritten: one accessible disclosure list, no desktop bar, no mega-menu, no overflow measurement, and merchant titles escaped where upstream interpolated them raw. Reconcile `app.js` by taking upstream's version and re-applying these four removals; reconcile `main-menu.js` for **new menu fields**, not for markup | — |
| `src/views/pages/cart.twig`, `src/assets/js/cart.js` | A | `1.365.0` | T-4.15 — the cart page. **The item row is the whole of the template delta:** upstream's white `rounded-md` card per item becomes the artboard's flat list — image at the inline end, quantity pill at the inline start, a hairline between rows — and the separate corner delete button is gone, folded into the quantity control's `decrement-button` slot as the artboard draws it. **Every class `cart.js` writes into on `cart::updated` is preserved** (`item-total`, `item-price`, `item-regular-price`, `item-original-price`, `item-weight-row`, `item-weight`, `offer-name`, `offer-icon`, `old-offers`, `free-ribbon`); dropping one would leave a row whose price silently stops updating. The empty branch now calls T-2.14's component. `cart.js` gains the bin-at-minimum listener, the removal announcement and the coupon's missing `aria` wiring, and **its twenty-one pre-existing lint problems were fixed on adoption** under the T-1.07 ratchet — including a `text-red-400`/`text-gray-400` toggle that was writing raw Tailwind palette onto a tokenised price after the first cart update. Reconcile by re-reading upstream's row for **new `salla-*` elements and new item fields**, not for markup | — |
| `src/views/pages/customer/notifications.twig` | A | `1.365.0` | T-5.08 — upstream's template is `<salla-notifications>` and two hooks, and **both survive unchanged**. What is added around them is the promotional-messages card the artboard draws, a live region, and the page's own script tag. **The list itself is technique C and adds no row of its own:** `salla-notifications` and `salla-notification-item` both register with Stencil encapsulation flag `0` and ship a zero-byte stylesheet, so the whole list is restyled from `04-components/notifications.scss` with no shadow root in the way and nothing forked. Reconcile by re-reading upstream's template for **new `salla-*` elements and new hooks**, not for layout | — |
| `src/views/pages/loyalty.twig`, `src/assets/js/loyalty.js` | A | `1.365.0` | T-5.10 — the page is rebuilt on `layouts.customer`, because `Loyalty Points Page.pdf` draws T-3.02's shell and none of upstream's gradient banner, ways-to-earn grid or prize carousels. **`salla-loyalty` is mounted exactly as upstream mounts it** — same element, same `customer-points`, same `slot="widget"`, same `open()` — so the prize catalogue, the confirmation step and the exchange request stay the platform's; only the widget inside the slot became the theme's button. `loyalty.js` was adopted because every selector it animated (`.loyality-item`, `.star-anime`, `.count-anime`, `.btn-anime`) belongs to markup this page no longer emits — it would have been a timeline over an empty set on every visit. **`04-components/loyalty.scss` is deliberately NOT shadowed:** 300 upstream lines styling `.loyalty__banner`, `.points-ways`, `.way-item` and `.loyalty-star`, none of which this page emits, so none of it applies and none had to be edited — the call T-3.04 made with `header.scss`. Reconcile the template by re-reading upstream for **new `salla-*` elements**, not for layout | — |
| `src/views/pages/customer/orders/index.twig` | A | `1.365.0` | T-6.01 — upstream's template is `{% if orders|length %}<salla-orders>{% else %}.no-content-placeholder{% endif %}`, and **the component cannot carry this design at any technique below A.** It renders a four-column table — number, total, date, status — built in `getSingleOrderItem()` with `document.createElement`, with no items, no address, no totals and no per-order actions; a stylesheet cannot add rows a component never draws, and its API route trims `items[]` to `{name, quantity}` so a subclass would have nothing to draw them with either. The replacement iterates the Twig collection into `components.orders.card`. **`salla-infinite-scroll` is kept**, mounted as upstream mounted it, so pagination stays the platform's. **`salla-order-totals-card` renders the totals inside each card**, which is why no arithmetic appears in this theme's path. Reconcile by re-reading upstream for **new `salla-*` elements and new hooks**, not for layout | `webpack.config.js` — `order-list.js` added to the existing `order` entry |
| `src/assets/styles/app.scss` | A | `1.365.0` | T-2.01 — **one added `@import` line, nothing else.** `02-generic/focus` must load after `02-generic/reset`, because it overrides reset's `a:focus { outline: none }` at equal specificity and therefore wins only on order. Reconcile by re-adding that import wherever upstream's list has moved to | — |

**What T-1.07 added to this file's job.** Two things, both worth knowing before you shadow anything.

**Lint is ratcheted to the files a change touches.** Untouched upstream code is never linted; adopted code always is. So **the moment you copy an upstream file down under technique A, its 443-problem share of the scaffold's debt becomes yours** — the file will be linted from that commit onward, and `.stylelintrc.js` will have opinions about its nesting, its physical properties and its raw hex. Budget for that when you estimate an escalation from C to A. It is not an argument against adopting a file; it is the cost of adopting one, made visible at the moment of adoption rather than at review.

**Nothing in the toolchain reformats a file under `src/`, and that is deliberate.** Reconciliation here is a diff against the pinned baseline. A formatter run over a shadowed file turns a three-line change into a whole-file rewrite and makes the diff useless, so Prettier is fenced off from `src/`, from upstream's build configs and from upstream's repository furniture, and no lint rule rewrites code. **If you are tempted to "just tidy" a shadowed file, that instinct is the one this paragraph exists to stop.**

**On `tailwind.config.js`.** Like the manifest, a technique-A row by definition — there is no C or B path to a build config. Its reconciliation is the mirror of the manifest's: on each upgrade, diff upstream's config for **newly added theme keys and plugins**, and merge those in. Do not merge our config over upstream's or the reverse; from T-2.01 this file carries the design system, and a blind merge in either direction loses one side of it.

**On `twilight.json`.** It is a technique-A row by definition rather than by choice — there is no C or B path to a manifest. The reconciliation it obliges is real but narrow: on each upgrade, diff upstream's manifest for **newly added feature flags and component registrations**, and decide for each whether the design wants it. Do not merge upstream's manifest over ours; T-1.03 deliberately removed nine flags and five sections, and a blind merge restores every one of them.

**⚠ `twilight.json` can be edited from outside this repository, and such an edit silently deletes documented decisions.** On 2026-08-08 commit **`6df8a3a2`** — *"⚙️ Update features in twilight.json"* — landed on `origin/master` from outside a normal development session and **restored all ten flags T-1.03 had deliberately removed**: `component-testimonials`, `component-square-photos`, `component-random-testimonials`, `component-parallax-background`, `component-store-features`, `component-youtube`, `component-fixed-products`, `component-fixed-banner`, `component-featured-products` and `mega-menu`. It also stripped the file's trailing newline, which `prettier --check` fails on. **The project owner confirmed on 2026-08-08 that the change was unintended**, and the eight-flag list was restored. **That restoration is history rather than policy — it happened again on 2026-08-09 and the owner has since ruled the array dashboard-owned. Read §3.1 before acting on anything in this paragraph.**

This is the failure mode the paragraph above describes, arriving from a direction it did not anticipate: not an upstream merge, but a write to the manifest that never passed through the repo's own review. Three things follow.

1. **The manifest is source code.** Every flag in it and every section registration is a recorded decision, and the reasoning lives in T-1.03 and in [DERIVED-DECISIONS.md](DERIVED-DECISIONS.md) — nine flags and five sections were removed because **no artboard draws them**, on a section-by-section table the owner approved. A tool that rewrites the file cannot know any of that.
2. **After any dashboard, portal or editor session that could touch theme configuration, diff the manifest before doing anything else:** `git diff origin/master -- twilight.json`. A flag list that grew is the signature.
3. **The trailing newline is part of the file.** `lint-staged` runs `prettier --check` on `twilight.json`, so an externally-truncated file fails the next commit that touches it — which is a useful alarm, and the only automated one this file has.

### 3.1 — `features` is the dashboard's, not the repository's

**Ruled 2026-08-10 by the project owner, and this supersedes the restoration recorded above.**

It happened twice. **`6df8a3a2`** on 2026-08-08 and **`907f2162`** on 2026-08-09, both titled *"⚙️ Update features in twilight.json"*, both from the Salla dashboard rather than a development session, and the second re-added eleven flags after the first had been reverted to eight. **Two occurrences from the same source is not an accident; it is how the platform works.** The dashboard writes the `features` array on every toggle, and it will keep doing so.

**The ruling.** The `features` array in `twilight.json` is **owned by the dashboard**. The repository does not curate it, does not revert it, and **does not restore it to eight**.

**What follows, and these are rules now:**

1. **Never "fix" a flag in the repo.** A flag that should not be enabled is turned off **in the theme editor**, which is the only writer whose value survives. Editing it here produces a change the next dashboard save silently reverses — and a diff that looks like vandalism to whoever reads the history next.
2. **A `features` diff arriving from outside is expected traffic, not an alarm.** The instruction in §3 point 2 — diff the manifest after an editor session — still stands, but its purpose changes: it is to notice edits to **everything else** in the manifest. `features` growing is normal.
3. **`settings` and the component registrations are still ours**, and §3's warning applies to them undiminished. `enable_add_product_toast`'s default (T-2.12), the three mandatory root keys, and every `components` entry are recorded decisions. **If a dashboard write ever touches those**, that *is* the alarm.
4. **An enabled flag is not an instruction to build the section.** T-1.03 removed nine flags because no artboard draws those sections; the sections are still not drawn, and re-enabling `component-youtube` or `mega-menu` from a dashboard toggle does not add them to the design. **The backlog remains the plan of record** — a flag is a switch, not a task.
5. **The trailing-newline alarm stays useful** and is unaffected: `prettier --check` still fails the next commit that touches a truncated file, whoever truncated it.

**Three root keys in `twilight.json` are mandatory, and omitting any of them breaks the link with Salla.** Established 2026-08-08 in commit `59bea10a`, after the theme failed to link:

| Key | Value here | Why it is not optional |
|---|---|---|
| `version` | `"1.0.0"` | The platform versions the theme by this string. Absent, there is nothing to publish *against* and the manifest is rejected before any other key is read. |
| `theme_name` | `"Am1als"` | The machine identifier, and **distinct from the `name` object** beside it. `name` is the pair of display labels shown to a merchant in ar/en; `theme_name` is the single slug the platform links by. Having one is not having the other, which is exactly how this went missing. |
| `repo_url` | the GitHub URL | The source the platform pulls from. **Also distinct from `repository`**, which sat in the manifest already and did not substitute for it. |

The trap in all three is duplication that looks like redundancy: `theme_name`/`name` and `repo_url`/`repository` read as the same fact written twice, so a tidying pass deletes one of each and the theme stops linking with no error that names the cause. **Do not delete any of the four.** They are two pairs, not two facts.

Two rules follow. **The upgrade procedure in §5 must confirm these keys survive** — they are theme-owned and upstream's manifest carries its own values, so a careless merge in either direction loses them. And **any manifest edit is verified by an actual link attempt**, not by the file parsing: `twilight.json` was valid JSON throughout the failure.

**Correction, 2026-08-08.** This paragraph previously said the same commit's **`"name": "enhanced-slider"`** was what binds a component entry to its template. **That was wrong and is retracted.** Salla's documentation shows **`path`** carrying the template binding — `home.hero` → `src/views/components/home/hero.twig` — with `name` as the component's identifier. The evidence against the original claim was already in the repo: **not one of upstream `1.365.0`'s six component registrations has a `name` key**, and all six render in the customiser. `name` is documented and harmless; it is not load-bearing.

**What every upstream component does carry is `image`** — all six, including the two that omit `is_default`. It is the preview card the customiser draws in the section picker. The hero was registered without it on 2026-08-08 and did not appear in the editor; adding it, together with a non-empty default for its `required`/`minLength: 1` slide collection, is the fix. **Registering a home component without `image` is the failure mode to remember here**, because nothing rejects the manifest — the section is simply absent, with no error naming the cause.

**Column definitions**

- **Path** — repo-relative path of the shadowing file, e.g. `src/views/layouts/master.twig`.
- **Technique** — `A`, `B` or `C`. A row should almost never be `C`; if it is, say in the Task column why the row exists at all.
- **Upstream version at override** — the upstream tag whose content the override was written against. Usually `1.365.0` for the first wave. This is the *left-hand side* of every future diff for this file, and it changes only when the row is reconciled.
- **Task** — the backlog task ID that introduced or last changed the override, e.g. `T-3.01`.
- **Last reconciled with upstream** — ISO date of the last time someone diffed this file against a newer upstream tag and either confirmed no change or merged the change in. Empty until the first upgrade.

**Rules**

1. A PR that shadows a file and does not add its row is incomplete. Reviewers reject it.
2. One row per file. If one task shadows four templates, that is four rows.
3. When an override is deleted, delete the row. Do not keep tombstones — git history holds them.
4. After reconciling a row during an upgrade, update **both** its version column and its date column.
5. **A derived screen goes in [DERIVED-DECISIONS.md](DERIVED-DECISIONS.md) as well.** Screens built without an artboard — search results, category listing, empty states, 404, and every layout above the 393pt breakpoint — carry visual decisions that no design specifies. Those decisions are recorded there. If such a screen *also* shadows an upstream Twig, it needs an entry in **both** files: a row here for the shadowed file, and rows there for the visual calls. The two registers answer different questions — this one asks *what will an SDK upgrade break*, that one asks *what did we make up* — so neither substitutes for the other.

---

## 4. Adding an override

1. Confirm C is genuinely insufficient. Write the reason in the PR description.
2. Copy the file from the pinned baseline, never from `upstream/master` and never from memory:
   ```bash
   git show 1.365.0:src/views/layouts/master.twig > src/views/layouts/master.twig
   ```
   Commit that untouched copy **first**, then edit it in a second commit. This makes the theme's actual delta reviewable in isolation, forever.
3. Add the row to the register in the same PR.

---

## 5. SDK upgrade procedure

Run this whenever the theme moves to a newer upstream release. `<NEW>` is the target tag.

**Step 1 — fetch and pick the target**

```bash
git fetch upstream --tags
git tag -l '1.*' | sort -V | tail -5
```

**Step 2 — does the upgrade touch anything we shadow?**

This is the whole question. Compare the baseline against the target and intersect with the register:

```bash
git diff --name-only 1.365.0..<NEW> -- src twilight.json
```

Cross-reference the output against the Path column. Files in the output but **not** in the register need no action — nothing shadows them, so the upgrade carries them for free. Files in **both** lists are the work.

Worked example, verified 2026-08-05 against `upstream/master`:

```
$ git diff --name-only 1.365.0..upstream/master -- src twilight.json
src/assets/js/product.js
src/views/components/home/brands.twig
```

Two files drifted. The register is empty, so neither is shadowed, so this upgrade needs zero manual reconciliation.

**Step 3 — reconcile each shadowed file that drifted**

For each such row, read what upstream changed:

```bash
git diff <VERSION-IN-REGISTER>..<NEW> -- <PATH>
```

Apply the upstream change into our copy by hand. Do **not** check out the upstream file over ours — that silently discards the theme's own edits.

Then read our resulting delta against the new upstream, which is what the next upgrade will start from:

```bash
git diff <NEW>..HEAD -- <PATH>
```

If that delta no longer contains a change we still need, delete the override entirely and remove its row. Overrides that have quietly become no-ops are the cheapest wins available in this file.

**Step 4 — update the register**

For every row touched: set the version column to `<NEW>`, set the date column to today. For rows whose file did not drift, update only the date — that records "checked, no change", which is different from "not checked".

**Step 5 — update this document's baseline**

Once every row reads `<NEW>`, change the pinned baseline in §1 to `<NEW>` and note the date. Until then the baseline stays where it is; a half-migrated register with a moved baseline is worse than no register.

**Step 6 — rebuild and verify**

```bash
pnpm install
pnpm production
```

The build must succeed, and `git status` must show no unexpected change outside `public/`.

---

## 6. PR compliance check

Any reviewer can verify the register is complete with one command. Every path it prints must appear in the register:

```bash
git diff --name-only 1.365.0 HEAD -- src twilight.json
```

Silence means the theme shadows nothing. Output that is absent from the register above means the register is stale and the PR is not mergeable.
