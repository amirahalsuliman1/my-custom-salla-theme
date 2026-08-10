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

**Tests, and a line through the middle of this document at T-1.09.** Delivery notes on tasks completed **before T-1.09 (2026-08-10)** describe jsdom cases that were genuinely written and genuinely run — in scratch files, which were never committed. There was no `tests/` directory and `pnpm test` was upstream's `exit 1` stub, so **none of those claims can be re-run and none of them guard anything.** Read them as a record of what was checked once, not as coverage the repository holds. **From T-1.09 onward the tests are in `tests/`, `pnpm test` runs them, and CI fails on them.** T-1.09's notes name every task whose claimed tests were restored and every one whose were not.

**Baseline verified from source** (`SallaApp/theme-raed`): structure is `src/views/{layouts,components,pages}`, `src/assets/{js,styles,images}`, `src/locales`, `twilight.json`. Styling is Tailwind + SCSS in ITCSS layers `01-settings` → `05-utilities`. Existing breakpoint mixins in `01-settings/breakpoints.scss` are **max-width** (desktop-first), which contradicts the mobile-first mandate in doc 10 — see T-1.06.

---

## Phase 0 — Decision Gate

No development starts until these close. They are tracked as tasks because they have owners, outputs and acceptance criteria.

#### T-0.01 — Resolve typography source — ✅ CLOSED 2026-08-05
- **Ruling (project owner, 2026-08-05):** Typography is **Salla's platform default**, delivered through the `fonts` feature in `twilight.json` and the merchant's theme customiser. **No font is pinned in SCSS or Tailwind.** The theme consumes the font variables the platform provides, and changing the font must be possible from the merchant dashboard with no code change. This closes B1 without recovering any Figma value — the values were never needed, because the theme does not own them.
- **Objective:** ~~Obtain binding font family, weight, size, line-height and letter-spacing values.~~ Superseded: confirm the platform font pipeline is wired and merchant-switchable.
- **Files affected:** none (input gathering)
- **Twilight components:** `src/assets/styles/01-settings/fonts.scss` (currently empty), `twilight.json` `features: ["fonts"]`
- **New components:** none · **New sections:** none · **Dynamic data:** none
- **Theme settings:** **none.** ~~determines whether `font_family` is exposed as a merchant setting~~ — **resolved 2026-08-06 by the project owner: the platform's `fonts` feature already gives the merchant a font picker, so a theme-side `font_family` select would be a second, competing control. Dropped.**
- **Dependencies:** none
- **Acceptance criteria:** `fonts` is enabled in `twilight.json`. `01-settings/fonts.scss` pins no family. Switching the font in the merchant customiser changes it across every screen, Arabic and Latin, with no rebuild. No `font-family` literal exists anywhere in `src/`.
- **Complexity:** XS

#### T-0.02 — Resolve spacing, radius, elevation and motion values — ✅ CLOSED 2026-08-05
- **Ruling (project owner, 2026-08-05):** **Nothing is measured out of Figma.** The theme builds on the Tailwind scales and `@salla.sa/twilight-tailwind-theme` **as they ship**. Semantic tokens are layered on top only where a real need appears in an actual task — not pre-emptively. This closes B2.
- **Objective:** ~~Obtain binding numeric values.~~ Superseded: adopt the shipped scales as the specification.
- **Files affected:** none
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** none
- **Acceptance criteria:** No hand-measured value enters the codebase. Any semantic token added on top of the shipped scales is justified by a named task and recorded in `/docs/DERIVED-DECISIONS.md`.
- **Complexity:** XS

#### T-0.03 — Rule on the architecture conflict — ✅ CLOSED 2026-08-05
- **Ruling (project owner, 2026-08-05):** The theme follows the real Twilight structure as it already exists in this repo. Docs 02/18 are wrong on this point and will be amended separately. B3 is closed and T-1.01 is unblocked by it.
- **Objective:** Decide whether the theme follows the documented tree (docs 02/18) or real Twilight structure.
- **Files affected:** `02-THEME-ARCHITECTURE.docx`, `18-FINAL-PROJECT-STRUCTURE.docx` (amendment)
- **Twilight components:** whole-repo structure · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** none
- **Acceptance criteria:** Written ruling. Recommendation on record: adopt real Twilight structure and amend docs 02/18, because a non-conforming tree cannot be published to Salla.
- **Complexity:** XS (blocking)

#### T-0.04 — Supply desktop and tablet designs — ✅ CLOSED 2026-08-05 by written derivation authority
- **Ruling (project owner, 2026-08-05):** No further artboards will be supplied. **This entry is the written derivation authority** that this task's own acceptance criteria required. The 393pt mobile design remains the binding reference for **content, order and hierarchy**. Larger breakpoints are derived from doc 10 alone, under these five rules and no others:
  1. The container takes a bounded max-width and centres. No full-bleed stretch.
  2. Product grids gain columns. **The card itself does not change.**
  3. Bottom sheets become centred dialogs above tablet.
  4. The footer becomes multi-column.
  5. Spacing and type scale up gradually through the Tailwind scale.
  **Forbidden at every breakpoint:** adding any element or section absent from the mobile design, reordering content, or hiding content that exists on mobile.
- **Objective:** ~~Close the gap between doc 10's four breakpoints and the 393pt-only export set.~~ Superseded by the derivation authority above.
- **Files affected:** none
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** none
- **Acceptance criteria:** Every derived layout is traceable to one of the five rules above and recorded in `/docs/DERIVED-DECISIONS.md`. A reviewer can diff any breakpoint against the mobile artboard and find the same elements in the same order.
- **Complexity:** XS

#### T-0.05 — Confirm data sources for non-native features — ✅ CLOSED 2026-08-06 (B6 closed)
- **Ruling (project owner, 2026-08-06):** **The blog is ruled out.** The Stories source is a **theme setting in `twilight.json`**, on the same mechanism as T-4.06: a list of items, each carrying an image, a brand tag, category tags, and **one or more hotspots with relative coordinates (`x%`, `y%`) plus a product ID**. The hotspot marker and product pill are **one component serving T-4.06 and T-7.07 together**. The story view is a **modal over the feed grid, built on T-2.10** — not a standalone page — and **no `Article` schema is emitted**. This closes B6 entirely.
- **Accepted cost (recorded, not a defect):** Stories are managed in the **theme customiser, not a content panel**. That is the price of the hotspot mechanism — percentage coordinates and a product ID per point have no home in Salla's blog or CMS. Recorded in `/docs/DERIVED-DECISIONS.md`.
- **Ruling (project owner, 2026-08-05):** All data comes from Salla, through `salla-*` components and Twig. **Order tracking is resolved** — it is `salla-order-shipments`, platform-native. Shoppable hotspots are a theme setting; partner submissions go through Salla's contact page and message system.
- **Objective:** ~~Establish the source for the three remaining features: Stories, shoppable hotspots, the partner form.~~ All three now have a named source.
- **Files affected:** none
- **Twilight components:** `salla-order-shipments` (tracking, confirmed)
- **New components:** none · **New sections:** none
- **Dynamic data:** Stories (theme setting), hotspot coordinates (theme setting, percentages), partner submissions (Salla contact/message system), shipment events (`salla-order-shipments`)
- **Theme settings:** Stories and hotspots are **settings-driven**, not CMS-driven
- **Dependencies:** none
- **Acceptance criteria:** Each of the three has a named data source and a confirmed read/write path. ✅ Met 2026-08-06.
- **Complexity:** S

---

## Phase 1 — Setup & Architecture

#### T-1.01 — Scaffold theme from `theme-raed` — ✅ **DONE** (marker added 2026-08-06)
- **Objective:** Working local build of the official theme, unmodified, as the baseline commit.
- **Marker note:** the work landed earlier and the ✅ was simply never written here. Evidence: `src/` matched upstream `1.365.0` byte for byte at `ab6ed7a`, the production build runs green, and the baseline is recorded in `/docs/OVERRIDES.md` §1. **The one criterion not verifiable from this repo is "theme previews in Salla Partners against a test store"** — that needs a Partners account, so it is taken on the owner's word rather than checked here.
- **Files affected:** whole repo, `package.json`, `webpack.config.js`
- **Twilight components:** all (baseline) · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-0.03
- **Acceptance criteria:** `pnpm install` and production build (`pnpm production`) both succeed. The theme is pnpm-only — `package.json` enforces this with `"preinstall": "npx only-allow pnpm"`, so `npm install` fails by design. Theme previews in Salla Partners against a test store. Baseline tagged in git so every later override is diffable against upstream.
- **Complexity:** S

#### T-1.02 — Establish override and upgrade policy — ✅ **DONE** (marker added 2026-08-06)
- **Objective:** Write the rule for when to use technique A, B or C, and record every upstream file the theme shadows.
- **Marker note:** `/docs/OVERRIDES.md` exists, states the C → B → A preference order, and has been carrying real rows since T-1.03. It is now at six: `twilight.json`, `tailwind.config.js`, `breakpoints.scss`, `package.json`, `global.scss` and `app.scss`.
- **Files affected:** `/docs/OVERRIDES.md` (new)
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-1.01
- **Acceptance criteria:** A register exists listing each shadowed upstream file with its upstream version. Policy states CSS-part styling is preferred over web-component replacement. Reviewers can check compliance in PR.
- **Complexity:** S

#### T-1.03 — Theme metadata and feature flags — ✅ **DONE 2026-08-06**
- **Objective:** Configure `twilight.json` identity and enable required platform features.
- **Files affected:** `twilight.json`
- **Twilight components:** feature flags `fonts`, `color`, `breadcrumb`, `filters`, `menu-images`, `unite-cards-height`, plus **`component-products-slider`** (carries T-4.03) and **`component-photos-slider`** (carries T-4.21) — eight, not six. The six are the platform capabilities; the two component flags are kept because a design section needs each of them
- **New components:** none · **New sections:** none · **Dynamic data:** none
- **Theme settings:** container for all later settings
- **Dependencies:** T-1.01
- **Acceptance criteria:** Theme name, author and description set. Unused upstream component flags removed so merchants aren't offered sections the design has no layout for.
- **Complexity:** XS
- **What was done, approved section by section by the owner on 2026-08-06:**
  - **Identity** — `name` → أملاس / Am1als, `repository` → this repo, `support_url` → `https://am1als.com`, `description` in both languages. **`author_email` is the literal `TODO`** pending a value from the owner — recorded as **OP-1** in `/docs/DERIVED-DECISIONS.md`.
  - **Feature flags 17 → 8.** Removed: `mega-menu` (the design's navigation is a burger at 393pt, and B4 forbids adding an element absent from mobile at any larger tier) and eight `component-*` flags whose sections the design does not draw — `featured-products`, `fixed-banner`, `fixed-products`, `parallax-background`, `testimonials`, `square-photos`, `store-features`, `youtube`.
  - **Component registrations 6 → 1.** Only `home.enhanced-slider` survives, as the carrier for the T-4.05 hero. Removed: `home.main-links`, `home.slider-products-with-header`, `home.enhanced-square-banners`, `home.brands` (with T-4.07), `home.custom-testimonials` — «تجارب عملائنا» is the Stories feed in T-7.06, not a testimonials block.
  - **Settings 22 → 20.** Removed `squar_photo_bg_image_size` (only consumer was the deleted `square-photos.twig`) and `is_more_button_enabled` (only consumer was `brands.twig`). **`vertical_fixed_products` was kept** — it has a live consumer in `src/views/pages/landing-page.twig`, which is a Salla landing-page feature and not a Home component. Its label named the deleted Home section; **the owner approved rewording it on 2026-08-06** to «وضع عمودي للمنتجات في مربع المنتجات الثابتة في صفحات الهبوط», with a description saying it affects landing pages only.
  - **No `.twig` file was deleted.** Scope was `twilight.json` alone. The orphaned templates stay on disk: removing an upstream file is an override that would need a row in `/docs/OVERRIDES.md`, and it would add diff noise against the `1.365.0` baseline for no gain.

#### T-1.04 — RTL baseline — ✅ **DONE 2026-08-06**
- **Objective:** Arabic-first document direction with correct logical properties throughout.
- **Files affected:** `src/views/layouts/master.twig`, `src/assets/styles/02-generic/`, `tailwind.config.js`
- **Twilight components:** `master.twig`
- **New components:** none · **New sections:** none · **Dynamic data:** `salla.config` locale · **Theme settings:** none
- **Dependencies:** T-1.01
- **Acceptance criteria:** `dir="rtl"` and `lang="ar"` set from store locale. Logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline`) used in all new code; no bare `left`/`right`. Latin product names render LTR inside RTL context without bidi bleed.
- **Complexity:** M
- **What was done — and, as much, what was deliberately not done:**
  - **Criterion 1 was already met upstream, so nothing was written for it.** `src/views/layouts/master.twig:53` already emits `lang="{{ language.code }}" dir="{{ theme.is_rtl ? 'rtl' : 'ltr' }}"` — the language from the platform's locale and the direction from the platform's own RTL flag, which is exactly the required source. **`master.twig` was therefore not touched.** It is the most expensive technique-A file in the theme — a page shell that receives no upstream fix once shadowed — and opening a permanent reconciliation obligation on it to re-implement a line that is already correct would have been a straight loss. The backlog's "files affected" named it; that estimate was wrong and this entry supersedes it.
  - **Tailwind 3.4.19 already ships the logical-property utilities, verified rather than assumed.** `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end` were compiled against a probe template and confirmed to emit real `margin-inline-start`, `padding-inline-end`, `inset-inline-start` and `text-align: start` — not physical fallbacks. The `rtl:` and `ltr:` variants resolve through `[dir]` and also work. **No configuration was needed and none was added.**
  - **What was genuinely missing is bidi isolation, and that is the whole of the code change.** Four utilities are registered as a Tailwind plugin in `tailwind.config.js`: **`.bidi-auto`** (`unicode-bidi: plaintext` — first-strong detection, for merchant and customer data of unknown script: product names, brand names, category names, customer names, review bodies; **this is the default choice**), **`.bidi-isolate`** (isolation only, where the run already matches page direction), **`.bidi-ltr`** and **`.bidi-rtl`** (known-script technical strings — SKUs, order and tracking numbers, emails, URLs; and the mirror case of Arabic inside the English storefront, which `en.json` makes reachable).
  - **The binding rule these carry: apply them inline, on a `<span>` or `<bdi>` around the run, never on the block that contains it.** `unicode-bidi` on a block re-resolves that block's own `text-align: start`, which silently flips its alignment to the opposite edge of the page. A block-level `.bidi-ltr` in an RTL column is a defect, not a variation. **Downstream tasks — T-4.01 above all, and every task that renders a product, brand or order number — inherit this rule.**
  - **Upstream's `.unicode` in `02-generic/common.scss:45` is `.bidi-auto` under a name that says nothing.** It was left in place: upstream templates consume it, and shadowing `common.scss` to rename it would have added a register row for zero behavioural gain. New theme code uses the named utilities.
  - **Known limit, recorded not solved:** `unicode-bidi` does not inherit, so none of these can reach inside a `salla-*` component's shadow root. Where a Salla component renders merchant data itself, isolation has to come through that component's exposed parts — technique C. The theme's own `custom-salla-product-card` is light-DOM (`attachShadow` appears nowhere in `src/assets/js/`, checked), so the utilities do reach it.
  - **Enforcement is not in this task.** "No bare `left`/`right`" is a lint rule, and lint is T-1.07 — where it landed, as a `stylelint` `property-disallowed-list`. Until then the rule is prose. **The eleven upstream SCSS files that already contain physical properties are not in scope and were not touched**; the rule binds new theme code.
  - **`tailwind.config.js` becomes a technique-A row in `/docs/OVERRIDES.md`.** Build verified green before and after, with `app.css` unchanged at 701 KiB — the utilities are purged until a template uses one, which is the correct behaviour.

#### T-1.05 — Locale files — ✅ **DONE 2026-08-06**
- **Objective:** Arabic and English string catalogues for all theme-authored copy.
- **Files affected:** `src/locales/ar.json`, `src/locales/en.json`
- **Twilight components:** `salla.lang` · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-1.01
- **Acceptance criteria:** Zero hard-coded user-facing strings in any Twig or JS. Every key present in both files. Pluralisation handled where Arabic requires it.
- **Complexity:** S
- **What was done:**
  - **No copy was added to `ar.json` or `en.json`, deliberately.** There is no theme-authored copy yet — every string the design draws is written by the task that renders it, in phases 3 to 7. Transcribing the artboards now would do two bad things at once: it would invent scope ahead of the tasks that own it, and **the artboard Arabic is illustrative, not final** — the AM5 coupon copy is the clearest case. Seeding the catalogue from placeholder text and letting downstream tasks treat it as translated is worse than an empty catalogue. **The two files are therefore byte-identical to the pinned baseline and are not register rows.** What this task delivers instead is the contract those strings will be written against, and a check that enforces it.
  - **The mechanism was read out of the SDK, not recalled.** Twig consumes `{{ trans('pages.cart.total') }}` and `{{ trans('key', {'amount': …}) }}` — 150 call sites upstream. JS consumes `salla.lang.get(key, replacements)`. Replacements are Laravel-style `:name` tokens.
  - **Arabic pluralisation is available, and takes six forms.** `SallaLang extends Lang` from `lang.js@1.1.14`, whose `_getPluralForm` implements the full Arabic rule — `0 → zero · 1 → one · 2 → two · n%100 in 3..10 → few · n%100 in 11..99 → many · else → other`. An Arabic plural message carries **exactly six** `|`-separated segments, English **exactly two**, reached with `salla.lang.choice(key, count, replacements)`.
  - **⚠ Pluralisation is a JS-side capability only.** `trans()` takes a key and a replacements map; **no count argument appears in any of the 150 upstream call sites and no Twig choice form could be confirmed.** It is treated as unavailable rather than guessed at. Where a template needs a count-dependent noun, render it through JS with `choice()` or write copy that does not inflect on the count. **Downstream tasks must not invent a Twig plural syntax.**
  - **All theme-authored copy goes under a single `theme.*` root.** `blocks.*`, `pages.*` and `common.*` are upstream's and stay frozen. These files are shadowed upstream files, and confining our additions to one subtree turns an SDK upgrade into a merge of one key instead of a three-way diff through upstream's own namespaces. **This is enforced, not requested:** a fourth top-level root fails the check.
  - **`scripts/check-locales.mjs` is the enforceable half of the acceptance criteria.** It validates ar/en key parity in both directions, rejects non-string and empty leaves, checks plural arity per locale (6 for `ar`, 2 for `en`), verifies the allowed top-level roots, and checks **`:placeholder` parity** — a token present in one locale and missing from the other is a live bug, because the substitution silently leaves `:name` on screen. Verified in both directions against fixtures: passes on the real catalogue (11 keys), and fires on every planted fault. **Wiring it into lint and CI is T-1.07**, which owns `package.json` and the CI config; it runs standalone as `node scripts/check-locales.mjs` until then.
  - **The hard-coded-strings audit came back nearly clean.** JS has **zero** — every user-facing string already routes through `salla.lang.get`. Twig has **exactly one**: the English `<noscript>` block at `src/views/layouts/master.twig:104-106`, shown to an Arabic-first audience. **It is not fixed here.** `master.twig` is untouched for the same reason as in T-1.04, and **T-3.01 already owns it as a declared technique-A shadow** — that is where the fix belongs, at no extra reconciliation cost. **Carried to T-3.01.**

#### T-1.06 — Convert breakpoint system to mobile-first — ✅ **DONE 2026-08-06** (unblocked 2026-08-05, B4 closed)
- **Objective:** Replace desktop-first max-width mixins with min-width mixins matching doc 10's four tiers.
- **Files affected:** `src/assets/styles/01-settings/breakpoints.scss`, all consuming SCSS
- **Twilight components:** breakpoint mixins consumed across `04-components/`
- **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-1.01, T-0.04
- **Acceptance criteria:** Mobile/Tablet/Laptop/Desktop min-width mixins defined, matching doc 10's tiers. Upstream call sites migrated or shimmed without visual regression. Base styles are the 393pt design; every larger tier exists only to carry the five derivation rules in T-0.04.
- **Complexity:** M
- **What was done:**
  - **Doc 10 names the four tiers and gives no pixel value for any of them.** It was extracted and read in full; it has a Mobile/Tablet/Laptop/Desktop table describing layout, navigation and content per tier, and not one number. So "matching doc 10's tiers" could only mean matching its four *names* — the values had to be derived, which B4 authorises and B2 constrains to the shipped scales. **Both derivations are recorded in `/docs/DERIVED-DECISIONS.md`.**
  - **The tiers: Mobile = base, no media query · Tablet = 768px · Laptop = 1024px · Desktop = 1280px** — Tailwind's `md`, `lg` and `xl`. Picking Tailwind's own screens means every SCSS tier has an exact utility-class equivalent (`@include from-tablet` ≡ `md:`), so the two systems **cannot drift apart** — which was the deciding argument, not neatness.
  - **Upstream's 992px and 1200px were dropped.** They are Bootstrap values matching neither the Tailwind scale nor anything else in the theme. Two things confirm the replacements are continuity rather than invention: **768px is exactly the boundary upstream's own `@mixin tablet` already used**, now read from the other side; and **1280px is already the container's cap in `tailwind.config.js`**, so the widest tier and the widest container coincide — which is precisely where B4's first rule, bounded centred container with no full-bleed stretch, must land.
  - **Values live once, in a `$breakpoints` map.** `@include from($tier)` reads it and **`@error`s on an unknown tier** — verified: `from('phablet')` fails the build with `Unknown breakpoint "phablet". Known tiers: tablet, laptop, desktop.` The three named mixins are thin wrappers. `from-mobile` emits its content with no media query, so all four of doc 10's viewports are addressable by name; the file says plainly that base rules need no wrapper and omitting it is always correct.
  - **Four of upstream's five mixins were dead and are deleted, not inverted.** `mobile-xs`, `mobile`, `tablet` and `large-desktop` had **zero call sites** anywhere in `src/`. Leaving a max-width mixin named `tablet` beside `from-tablet` is a defect waiting to be written, and inverting mixins nothing calls is churn.
  - **`desktop` survives as an explicitly deprecated shim, and `virtooal.scss` was not touched.** It is the only mixin with call sites — three, in that one file — and despite its name it means *up to 992px*: small-screen rules for a third-party try-on addon. **992px is not a tier**, so re-expressing those rules at 1024px would change what renders between 992px and 1023px. That is a visual regression, which the acceptance criteria forbid, so the criteria's own "migrated **or shimmed**" was taken at its word. **This single row keeps `virtooal.scss` byte-identical to upstream and out of the register.** The file records that the shim dies when `virtooal.scss` is next opened for its own reasons.
  - **Zero visual regression, proved rather than asserted.** A production build after the change left `public/app.css` **byte-identical** — `git status` reports only the source file as modified. All four tiers, the map lookup and the shim were also compile-tested in isolation and emit exactly `@media (min-width: 768px | 1024px | 1280px)` and `@media (max-width: 992px)`.
  - **`breakpoints.scss` becomes a technique-A row.** One row, deliberately: the alternative — migrating every consuming stylesheet — would have added eleven.

#### T-1.07 — Tooling and CI — ✅ **DONE 2026-08-06**
- **Objective:** Lint, format and commit standards enforced automatically.
- **Files affected:** `.eslintrc`, `.stylelintrc`, `.prettierrc`, `.editorconfig`, CI config
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-1.01
- **Acceptance criteria:** Lint and build run on every PR. Doc 15's naming and nesting rules encoded as lint rules rather than prose. Pre-commit hook blocks failing commits.
- **Complexity:** S
- **What was done:**
  - **The governing constraint came from `/docs/OVERRIDES.md`, not from doc 15.** Reconciling a shadowed upstream file on an SDK upgrade means diffing it against the pinned `1.365.0` baseline. **Any tool that reformats such a file destroys that diff and with it the only mechanism the register has.** So no rule anywhere in this task rewrites code: the linters state architectural facts, and Prettier is fenced off from everything upstream authored. This was not theoretical — the first Prettier run reformatted upstream's `.github/dependabot.yml`, which was reverted and the ignore list widened.
  - **Lint is ratcheted to the files a change touches.** A full-repo run reports **443 SCSS problems and 80 JS problems**, every one of them upstream's. Gating CI on that leaves only two options — rewrite the scaffold inside a Phase 1 task, or switch lint off — and linting what you touch beats both. It also puts the incentive in the right place: adopting an upstream file under technique A means editing it, which means it gets linted, which is exactly when its quality becomes the theme's problem. `scripts/lint-changed.mjs` is the shared implementation; the pre-commit hook gets the same behaviour from `lint-staged`.
  - **Doc 15's prose, encoded in `.stylelintrc.js` — six rules, each traceable to a line of doc 15 or CLAUDE.md.** «Avoid deeply nested selectors» → `max-nesting-depth: 3`. «Use design tokens» / "no raw hex outside the token layer" → `color-no-hex`, with `01-settings/**` exempted because being the token layer is its job. «Consistent naming» → a kebab-case BEM `selector-class-pattern`. «Avoid duplicated logic» → `no-duplicate-selectors`. **And the two rules earlier tasks could only write as prose now fail a build:** T-1.04's "never bare `left`/`right`" is `property-disallowed-list` plus a value-level list catching `text-align: right`, `float: left` and `clear`; T-1.06's mobile-first mandate is `media-feature-name-disallowed-list: [max-width]`, with `breakpoints.scss` exempted as the one file that implements the shim. **All six were verified against a probe stylesheet and all six fire.**
  - **`eslint.config.mjs`, not `.eslintrc` — ESLint 10 removed eslintrc support entirely.** Same deliverable, different filename; the backlog's estimate predates the release. Carries the recommended set plus `max-depth`, `max-params`, `no-var`, `prefer-const`, a stricter `no-unused-vars` and `eqeqeq`, with browser globals plus the `salla` global the platform injects at runtime.
  - **Prettier governs only what the theme authored outright** — its own configs, `scripts/`, and its own workflow. `src/`, upstream's build configs, `package.json`, the docs and upstream's repository furniture are all in `.prettierignore`, each for the diff-preservation reason above. Prettier has no Twig parser in any case, so `src/views/` was never in reach.
  - **The pre-commit hook blocks, and that was tested rather than assumed.** Husky 9 plus `lint-staged`. A deliberately bad SCSS file — `.badBlock { margin-left: 4px }` — was staged and committed; the commit was **rejected** with both the naming and the physical-property errors, and `HEAD` did not move. The fixture was then removed.
  - **`.github/workflows/ci.yaml` is new and upstream's `lint-pr.yaml` is untouched.** That file validates PR titles and branch names through Salla's own actions and belongs to upstream. CI runs the ratcheted lint against the PR's merge base, the locale check in full — a key can be orphaned by a change to the template that consumed it, so that one is not ratcheted — and then the production build. Both workflow files were parsed to confirm they are valid YAML. `node-version` is pinned to 24 because `engines.node` is a range `setup-node` cannot resolve.
  - **`package.json` becomes a technique-A row** — scripts and dev dependencies. Also added: `lint`, `lint:css`, `lint:js`, `lint:locales`, `lint:format`, `lint:changed`, and the `prepare` hook that installs Husky.
  - **Deferred, deliberately:** doc 15's «single responsibility», «avoid duplicated logic» and «keep components small» are only partly reachable by a linter — `max-depth` and `max-params` are the reachable part. The rest stays a review concern, and doc 15's own Code Review Checklist is where it belongs.

- **Defect found and fixed 2026-08-08 — `ci.yaml` had never once run green, and the timing made it look like something else.** Every commit from `59bea10a` onward showed a red check, and the red began at the commit that added the three mandatory manifest keys, which made it read as fallout from that change. It was not. Two separate things happened at the same moment:
  - **The green check on the 6 August commits was never this workflow.** It was **Twilight CI**, Salla's own app, which has been passing since before Phase 2. `ci.yaml` produced **zero runs** on 6 August — not failures, no runs at all — so its first execution ever was on 8 August, and it failed immediately.
  - **The failure is `pnpm/action-setup@v4`: "No pnpm version is specified."** It resolves the version from `packageManager` in `package.json` or from a `version:` input, and **the repo had neither** — `packageManager` appears in no commit in this repo's history. Fixed by adding `"packageManager": "pnpm@10.32.1"`, matching the installed pnpm and the `lockfileVersion: '9.0'` in `pnpm-lock.yaml`. This is the canonical fix rather than pinning the version in the workflow, because it also makes a local `corepack` run agree with CI.
  - **Worth keeping in mind:** the four steps after the setup — `install --frozen-lockfile`, `lint-changed`, `lint:locales`, `production`, `check:budgets` — had therefore **never been proven in CI**, only locally. The first green run is the first evidence any of them work on a runner.

- **Second defect, found and fixed 2026-08-10 — a different check, failing for a different reason, and the two look identical from the commit list.** `✗ 1/2` had been showing on every commit for two days, and the natural reading was that the 8 August fix above had come undone. It had not: **`Lint and build` has been green on every commit since `3cb4e6ea` and is green on `HEAD`.** The red one is **Twilight CI**, Salla's own GitHub App — the check that was passing when `ci.yaml` was the broken one. The two failures are unrelated and swapped places, which is the whole reason this went unread: *the badge said the same thing both times.*
  - **The literal message, read from the check-run API rather than inferred:** `Checker output — The checker could not report ` `twig_result` · `twig_result — null`. Two of its three sub-checks pass — `twilight.json` verified, `public/` present. The remedy it prints is generic: *"usually a twig error the parser cannot recover from, such as an unclosed `{{` or `{%`."* **No file, no line.**
  - **It began at `92057882` (T-2.11), not at `59bea10a`.** Mapped by querying the check-run conclusion for all 30 commits: green through `907f2162`, red from `92057882` to `HEAD` — **nine commits, not eighteen.**
  - **The cause is one line, and Twig's own lexer names it.** T-2.11 moved the stories CTA to the new `neutral` variant and left a `{# … #}` note **inside** the `{% include %}` hash literal in `components/home/stories.twig`. `{#` opens a comment only in a template's *text*; inside a tag it is a `{` and a stray `#`, and the lexer aborts with **`Unclosed "block"` at line 96**. Reproduced against `twig/twig` v3.28 before anything was changed, and re-run against the reverted file afterwards to confirm the checker catches it.
  - **The fix is the note moved above the tag.** Nothing else in the include changed, and 64 of the 65 templates were already clean.
  - **The permanent half: nothing in this repo parsed a `.twig` file, and now every run does.** `lint:css`, `lint:js` and `lint:locales` covered SCSS, JS and the catalogues; **the templates — the theme's actual deliverable — went to the platform unread**, which is why a syntax error's first and only reader was an external app that answers in nulls. `scripts/lint-twig.php` lexes all 65 with the real `twig/twig` lexer and reports **file, line and the offending source line**. Wired into CI, into `pnpm run lint`, and into the pre-commit hook.
  - **It lexes and does not parse, and that limit is deliberate.** A full parse resolves tags, and this theme uses two that are not in Twig's grammar — `{% hook %}` (58 uses) and `{% component %}` (6), neither with an end tag anywhere in `src/views`. Writing `TokenParser`s for them means **inventing an argument grammar Salla has not published**, and a checker that rejects valid templates becomes noise — which is the exact failure this task is closing. Lexing needs no grammar, so it guesses at nothing. What that buys and what it misses is written at the top of the script.
  - **Twig lives in `scripts/twig-lint/` with its own `composer.json` and lock**, so the theme root stays a pnpm project with no PHP manifest of its own; `vendor/` is ignored and restored by `pnpm run lint:twig:install`.

#### T-1.08 — Performance and accessibility budgets — ✅ **DONE 2026-08-06**
- **Objective:** Set the numeric targets that Phase 8 will audit against, before code exists to bias them.
- **Files affected:** `/docs/BUDGETS.md`, CI config
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-1.07
- **Acceptance criteria:** LCP, CLS, INP and JS/CSS byte budgets agreed and recorded. WCAG 2.1 AA named as the conformance target. CI fails on budget breach.
- **What was done — `/docs/BUDGETS.md` is new:**
  - **Docs 11 and 13 were extracted and read; neither carries a number.** Doc 11 asks for "prioritize above-the-fold content", "near-zero layout shifts", "fast interaction response". Doc 13 does state one thing explicitly and it is the one this task needed: **WCAG 2.1 AA**. Everything numeric had to come from somewhere else, and the sources are named per row rather than asserted.
  - **CWV budgets are Google's published "good" thresholds at p75** — LCP **≤ 2.5 s**, INP **≤ 200 ms** — an external standard, not a local invention. **CLS is set at 0.05, half the published 0.1**, because three sources agree 0.1 is too loose here: doc 11's "near-zero", T-8.02's "at or near zero on every template", and CLAUDE.md's "zero CLS is a requirement, not an aspiration". It is not zero only because measurement noise is real.
  - **Byte budgets carry two numbers each, and the split is the substance of the task.** A **ceiling**, enforced by CI from today, set at the measured baseline plus headroom so it catches regression; and a **Phase 8 target**, which is what T-8.01 and T-8.03 are actually graded on. Setting the enforced number at the target today would fail CI on a green build and teach everyone to ignore it; publishing only the ceiling would let Phase 8 declare victory at the scaffold's weight. Baseline measured 2026-08-06: **`app.css` 88.4 KB gzip** — the worst asset in the build and the reason T-8.01 exists — `app.js` 31.7 KB, `product.js` 14.1 KB, `home.js` 11.7 KB, first-load JS 36.2 KB.
  - **The eight chunks under 3 KB are deliberately not budgeted.** They are individually too small for a byte budget to say anything, and are governed by the first-load aggregate instead. **A budget nobody can breach is noise, and noise is what makes people stop reading budget failures.**
  - **The numbers are not duplicated between doc and code.** `scripts/check-budgets.mjs` parses the fenced JSON block **out of `BUDGETS.md` itself**, so the documented budget and the enforced budget cannot drift. A missing asset fails rather than scoring zero bytes. Both paths verified: passes on the real build, and a temporarily lowered ceiling produced the expected breach and exit 1.
  - **CI enforces the byte budgets and says plainly that it cannot enforce the rest.** LCP, INP, CLS and WCAG conformance need a rendered storefront with real products, images and merchant settings; a runner building a theme package has no store to load, and most of WCAG is not machine-checkable at all. `BUDGETS.md` section 4 assigns each to the task that really carries it — **T-8.08** for CWV on throttled mobile, **T-8.06** for WCAG by hand.
  - **Two live accessibility risks were found while writing this and handed forward.** `tailwind.config.js` sets `corePlugins: { outline: false }`, which disables Tailwind's outline utilities and **puts WCAG 2.4.7 Focus Visible at risk** unless a deliberate focus style is supplied — **carried to T-2.01**. And because colours are merchant-configurable through the `color` feature, **1.4.3 contrast cannot be proven once**; it must hold for the shipped default palette, which **T-2.01 must check when it encodes the palette**.
  - **The one judgement call, flagged rather than buried:** the CWV numbers and the WCAG level are external standards, but the **byte ceilings and targets are an engineering estimate**. They are grounded — ceilings in the measured baseline, targets in what T-8.01 and T-8.03 should be able to reach — but they are the part of this task most open to the owner's revision, and revising a number here is cheap. Changing one to make a red build pass is not.
- **Complexity:** S

#### T-1.09 — Test infrastructure — ✅ **DONE 2026-08-10** (opened 2026-08-10 by the project owner)
- **Objective:** A real `pnpm test`, and the tests that were run but never committed.
- **Files affected:** `tests/` (new), `package.json`, `eslint.config.mjs`, `.lintstagedrc.mjs`, `scripts/lint-changed.mjs`, `.github/workflows/ci.yaml`, `src/assets/js/partials/quick-view.js`
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-1.07
- **Acceptance criteria:** `pnpm test` runs a real suite and fails on a real failure. Tests run in CI beside lint, Twig and budgets. The tests claimed by T-4.02, T-4.11, T-4.12, T-4.13, T-4.14 and T-4.15 exist in the repository. Every earlier task that claimed coverage it did not commit is named.
- **Complexity:** M
- **What was done:**
  - **THE RECORD, CORRECTED. Before T-1.09 no test was ever committed to this repository.** `package.json`'s `test` script was upstream's `echo "Error: no test specified" && exit 1` and no test file existed. Eleven tasks nonetheless describe jsdom coverage in their delivery notes — that work was really done and really run, in scratch files, and then thrown away with the session that produced it. The claims were true when written and unverifiable ever after, which for a record is the same as being wrong. **Every task from T-1.09 onward commits its tests, and CI runs them.**
  - **Which tasks are affected, named rather than summarised.** Restored here: **T-4.02, T-4.11/T-4.12, T-4.13, T-4.14, T-4.15**. Still uncommitted, claimed but never recovered: **T-3.09** (the `replaceWith(firstChild)` whitespace trap), **T-3.11** (the `salla-social` `undefined` pills), **T-4.17** (11 cases), **T-4.18** (8 cases), **T-4.19** (9 cases), **T-4.20** (11 cases, including the reflected-XSS proof). Those six are **not** re-derived on a guess — writing new tests and calling them the old ones would repeat the original error in the other direction. They are listed so the gap is visible, and any task that revisits those files should bring its tests with it.
  - **`node:test` and jsdom, and nothing else.** The runner is Node's own, so there is no framework to keep current; 92 cases run in about seven seconds. **jsdom is pinned to `^29`, and that is correctness rather than caution:** jsdom 30 requires Node `>=24.15`, which is narrower than this repo's own `engines` field (`^22.18 || >=24.11`) — installing it would make the theme uninstallable on Node versions the theme says it supports.
  - **The tests import the shipped files and boot them the way the browser does.** `wishlist-card.js` calls `customElements.define` at module scope; `cart.js` and `product.js` end in `initiateWhenReady`. That boot **is** the behaviour, so the harness builds the DOM and the `salla` stub first and lets the import run — rather than reaching past it to call a method directly, which is how T-4.15's original «extracted method bodies» had to work without a harness.
  - **A document per test, which is what forces the rest of the design.** A class from `class X extends HTMLElement` is bound to the `HTMLElement` that was global when it was evaluated, so it cannot be handed to a second jsdom. Each case therefore gets a fresh window *and* a fresh evaluation of the module, through a cache-busting query on the import URL. The cost — every version stays in the ESM registry for the life of the process — is stated in the harness rather than discovered later.
  - **Third-party modules are stubbed; first-party modules never are.** Only `fslightbox` and `lite-youtube-embed` resolve to a no-op, because both are IIFEs that register custom elements against whatever window is global and would throw on the second evaluation. Nothing under `src/` is redirected: a test that stubs the file it is testing tests nothing.
  - **The resolve hook reproduces webpack's extension resolution rather than the source being edited to suit the runner.** `src/` writes `import BasePage from './base-page'`, which webpack resolves and Node correctly does not. Adding twenty extensions to shipped files so a test runner is happier is the wrong way round; the hook retries with `.js` and the module graph webpack bundles is the module graph the tests load.
  - **The `salla` stub simulates nothing.** `deleteItem` deletes nothing and hands back a promise the test settles; `money()` returns a recognisable wrapper so a hand-formatted price is visible in a diff. Translations return their own key unless a test supplies one, so an assertion reading `theme.cart.remove_item` **names the locale entry it depends on** — deleting that key from `ar.json` now fails a test rather than shipping a blank label.
  - **⚠️ The suite found a live XSS on its first run, in T-4.13, and it is fixed here.** `QuickView.escape` built a `<span>`, set `textContent` and read `innerHTML` back. That is a correct escape **between tags**, and the serializer deliberately leaves `"` and `'` alone there because they need no escaping in text. **Nine of that file's ten uses are inside a quoted attribute, two of them `href`** — so a product `url` or `brand.url` of `" onmouseover="…` injected a real event handler into the page. It now uses `product-runtime.js`'s `escapeHtml`, which escapes both quotes and is already what `product-card.js`, `add-product-toast.js` and `video-carousel.js` use — quick-view was the only file in the theme doing something else, and the fix removes a fourth copy of an escape rather than adding one. A case asserts the quote-escaping property directly, so a future «simplification» back to the serializer trick fails in CI rather than in a store.
  - **One robustness gap found and deliberately not fixed here.** `open()` normalises with `response?.data || response`, so a response of `{ data: null }` falls back to the envelope and renders a product with no name and no price instead of the error state. A real `getDetails` rejects on a missing product rather than resolving that way, so this is hypothetical — and it belongs to T-4.13, not to the task that happened to notice it. Recorded, not silently patched and not silently left.
  - **Wired beside the existing gates, not on top of them.** CI runs `pnpm test` after the locale check and before the build, because a failure there names a behaviour and a build failure would name a bundle. The pre-commit hook runs the whole suite when any theme JS or test file is staged — there is no mapping from a staged source file to «its» test, because a test file names the task it covers, and seven seconds is cheaper than maintaining that mapping and cheaper than being wrong about it. `tests/**/*.mjs` is linted like the rest of the theme's own code rather than ratcheted in.

---

## Phase 2 — Design System

#### T-2.01 — Colour tokens — ✅ **DONE 2026-08-06**
- **Objective:** Encode the recovered palette as the single source of colour truth.
- **Files affected:** `tailwind.config.js`, `src/assets/styles/01-settings/global.scss`, **`twilight.json`** (scope expanded by the owner 2026-08-06), **`src/assets/styles/02-generic/focus.scss`** (new), **`src/assets/styles/app.scss`** (one import line)
- **Twilight components:** `twilight.json` `features: ["color"]`
- **New components:** none · **New sections:** none · **Dynamic data:** none
- **Theme settings:** `primary_color`, `secondary_color` (doc 08)
- **Dependencies:** T-1.01
- **Acceptance criteria:** Tokens defined semantically (`surface/page` `#F7F6F4`, `surface/card` `#FFFFFF`, `text/secondary` `#646361`, `border/subtle` `#EDEBE8`, `accent/soft` `#F9E6E7`), not by appearance. Merchant colour overrides cascade without editing SCSS. No raw hex outside this layer.
- **Carried from T-1.08 — two live accessibility risks this task must close:**
  - **WCAG 2.4.7 Focus Visible is at risk right now.** `tailwind.config.js` ships `corePlugins: { outline: false }`, which disables Tailwind's outline utilities. A deliberate focus style must be supplied here rather than the browser default being inherited by accident.
  - **WCAG 1.4.3 contrast cannot be proven once and forgotten**, because colours are merchant-configurable through the `color` feature. It must hold for the **shipped default palette**, so the contrast ratios of the five tokens above — 4.5:1 for body text, 3:1 for large text and UI boundaries — are checked as part of encoding them.
- **Note on the hex values above:** they are already in the acceptance criteria and are the token layer, which `.stylelintrc.js` exempts from `color-no-hex` for exactly this reason. Everywhere outside `01-settings/**` a raw hex now fails the build rather than merely breaking a convention.
- **Complexity:** S
- **What was done — every colour decision is measured and recorded in `/docs/DERIVED-DECISIONS.md`, including a full contrast table:**
  - **The five semantic tokens are in `01-settings/global.scss` as CSS custom properties**, named by role and never by appearance — a merchant who repaints the theme must not be left with a token called `--warm-grey` holding a blue. Tailwind aliases them **in the specific scales they belong to** rather than in `colors`, which yields exactly `bg-surface-page`, `text-secondary`, `border-subtle`, `border-interactive`, `bg-accent-soft` and generates nothing meaningless — putting `subtle` in `colors` would have produced `border-border-subtle`. The custom properties stay the source of truth, so a merchant override cascades without a rebuild.
  - **`border/subtle` is documented decorative-only, and a second boundary token was added.** Measured **1.10:1** on the page and **1.19:1** on a card, far under WCAG 1.4.11's 3:1. Fine for card edges and dividers where the card is identified by its background; **not** usable on a form control, where the border *is* the affordance. **`--border-interactive` `#888684`** covers that case at **3.36 / 3.63 / 3.02** across page, card and accent.
  - **That value was derived by a rule, not chosen by eye:** the lightest tone on `text/secondary`'s own near-neutral hue axis that clears 3:1 on **every** surface a control can sit on. The obvious alternative — darkening `border/subtle`'s own hue — yields `#998D7C`, which **fails on `accent/soft` at 2.71:1** and reads tan rather than neutral. Both the winner and the rejected candidate are recorded so neither is re-litigated.
  - **`surface/page` is the binding surface, not white.** Every light token scores lower against the warm page than against a white card, so a value checked only against white passes review and fails in the product. This is called out in the register because it is the trap this palette sets.
  - **The focus indicator now exists at all — and the T-1.08 diagnosis was wrong.** `corePlugins: { outline: false }` **does nothing**: Tailwind 3 has no `outline` core plugin, only `outlineStyle`/`outlineWidth`/`outlineOffset`/`outlineColor`, so it was a Tailwind 2 leftover and `.outline-none` was in the built CSS all along. **The real WCAG 2.4.7 failure is `a:focus { outline: none; }` at `02-generic/reset.scss:46`**, which strips the indicator from every link with no replacement. The dead key is removed and `02-generic/focus.scss` overrides the reset.
  - **Specificity is load-bearing in that override and was verified in the built CSS.** `a:focus` is (0,1,1), so a rule written as `:where(a, button):focus-visible` would score (0,1,0) and lose silently. Every selector is written at element level to match (0,1,1) and win on order, which requires the import to sit after `reset` in `app.scss`. Confirmed in `public/app.css`: reset's rule at byte 565361, the focus rule at 579752. `:focus-visible` rather than `:focus`, so the ring is for keyboard users and does not fire on mouse click.
  - **The ring deliberately ignores the merchant's brand colour.** It is ink at 15.12:1, inverting to white under `.dark`. The merchant can pick any primary colour including a pale tint that would fail 1.4.11 on a white card, and **a focus ring that can be configured into invisibility is not a focus ring.**
  - **`secondary_color` was added to `twilight.json`** under a new «الهوية البصرية» group, per the owner's scope expansion — Salla's `color` feature carries only one brand colour, so a secondary has no platform home. **It is `type: "string"`, `format: "text"` holding a hex, because no colour input type exists.** Verified three ways: upstream `1.365.0`'s manifest, **every commit in upstream's entire history** (`git log --all -S` for `"type": "color"` and `"format": "color"` returns nothing), and Salla's own documentation. **This is a real UX compromise — a text field, not a picker — and the owner should know it is a platform limit rather than a shortcut.** Default `#F9E6E7`, reusing `accent/soft` rather than inventing a hue.
  - **The dead duplicate `--color-primary: #5cd5c4` is gone** — upstream declared it and overrode it on the very next line with `#414042`. Confirmed absent from the built CSS.
  - **Carried to T-3.01:** the merchant's `secondary_color` still has to reach CSS, and only a template can do that. `master.twig` already emits a `:root` block for `--color-primary`; `--color-brand-secondary` joins it there. `global.scss` holds the default until then, and the cascade works because the inline `<style>` loads after `app.css` — verified.
  - **`global.scss` and `app.scss` become technique-A rows.** `app.scss` is a **one-line** row, and the row says so, because that import's position is the whole of its content.

#### T-2.02 — Typography tokens — ✅ **DONE 2026-08-06** (unblocked 2026-08-05, B1 closed)
- **Objective:** Font faces, scale and weights as tokens.
- **Files affected:** `src/assets/styles/01-settings/fonts.scss`, `tailwind.config.js`, `src/assets/fonts/`
- **Twilight components:** `features: ["fonts"]`
- **New components:** none · **New sections:** none · **Dynamic data:** none
- **Theme settings:** **none** — `font_family` was **deleted by the project owner 2026-08-06**: Salla's `fonts` feature already provides the picker, and a theme-side select would compete with it.
- **Dependencies:** T-0.01, T-2.01
- **Acceptance criteria:** Faces come from the platform `fonts` feature — **not self-hosted and not pinned in SCSS or Tailwind**. The type scale is Tailwind's as shipped. Switching the font in the merchant customiser reflows every screen with no rebuild. No layout shift on font swap. Any semantic type token added on top is recorded in `/docs/DERIVED-DECISIONS.md`.
- **Complexity:** M
- **What was done:**
  - **`01-settings/fonts.scss` shipped empty; it now carries the contract rather than a font.** The face comes from the platform: the merchant picks it, `master.twig` loads `theme.font.path` and writes the family into `--font-main` in an inline `:root` block that loads after `app.css` and therefore wins. **No family is named in SCSS or Tailwind anywhere.**
  - **Upstream pinned `--font-main: "DINNextLTArabic"` in `global.scss`** — exactly what B1 forbids. It is now `var(--font-fallback)`, so the pre-override default is a generic stack rather than one vendor's face.
  - **A fallback stack was added, and it is not decoration.** `master.twig` writes `--font-main` as a **single bare family with nothing after it**. If the platform's font stylesheet is slow or fails, the browser drops to its own default — on an Arabic page usually a serif with quite different metrics, which is a layout shift. `--font-fallback` follows `--font-main` in both Tailwind stacks; every family in it ships with an OS and covers Arabic (Segoe UI/Tahoma, Geeza Pro, Noto Naskh Arabic).
  - **The type scale is Tailwind's, untouched (B2).** No semantic type token was added, because no task has needed one. Upstream's own `fontSize` extras were left alone rather than extended.
  - **`font-customization.scss` was generalised per the owner's ruling** — bound to the button, not to a font name. Upstream gated it on `body.font-dinnextltarabic-regular`, so the correction applied to one face and silently stopped applying when a merchant chose another, which is the opposite of what the `fonts` feature promises. **Recorded while doing it: neither `.btn--add-to-cart` nor that body class appears anywhere in this theme or in any `@salla.sa` package**, so the rule may never have matched. It could only fire if the platform injects both through the `body:classes` hook, which could not be confirmed — so the declaration was kept rather than deleted on a guess. **Handed to T-2.05:** zeroing vertical padding is a one-font metric correction wearing the costume of a general rule; the font-independent fix is a min-height, which T-2.05 needs anyway for its 44×44 target.
  - **Limit, recorded not glossed:** `font-display` cannot be set from the theme. The `@font-face` rules live in the stylesheet Salla serves from `theme.font.path`, which the theme does not own. The fallback stack narrows the swap shift; it does not remove it. If T-8.08 measures it as visible, that is a platform conversation.
  - **`fonts.scss` and `font-customization.scss` join `/docs/OVERRIDES.md`.**

#### T-2.03 — Spacing, radius, elevation, motion tokens — ✅ **DONE 2026-08-06** (unblocked 2026-08-05, B2 closed)
- **Objective:** Remaining visual primitives as tokens.
- **Files affected:** `tailwind.config.js`, `src/assets/styles/01-settings/global.scss`
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-0.02, T-2.01
- **Acceptance criteria:** Tailwind and `@salla.sa/twilight-tailwind-theme` scales are used **as they ship**; nothing is measured out of Figma. Semantic tokens are added only where a real task needs one, each recorded in `/docs/DERIVED-DECISIONS.md`. Motion tokens respect `prefers-reduced-motion` at the token layer so no component has to remember. Doc 14's durations encoded.
- **Complexity:** M
- **What was done:**
  - **Nothing was added for spacing, radius or elevation, and that is the deliverable.** Tailwind's scales, `@salla.sa/twilight-tailwind-theme` and upstream's existing extensions are used exactly as they ship. B2 permits a semantic token only where a real task needs one; none did.
  - **Doc 14 contains no timing numbers.** It describes nine animations and says its values "should be finalized during development". So the three motion tokens — `--motion-fast` 150ms, `--motion-base` 300ms, `--motion-slow` 500ms — are **Tailwind's shipped durations**, each mapping 1:1 to `duration-150`/`300`/`500`, with easing on Tailwind's `ease-in-out`. Added now rather than speculatively because **T-2.05 consumes them two tasks later**.
  - **`prefers-reduced-motion` appeared nowhere in `src/` before this task** — neither doc 14's requirement nor doc 15's nor CLAUDE.md's was implemented anywhere.
  - **It is handled with a blanket clamp, not per component, and that choice is the substance of the task.** Collapsing the `--motion-*` tokens covers theme code only — and theme code is the *minority* of what animates on these pages. Upstream's own `animations.scss`, plus the bundled swiper, mmenu, sweetalert2 and lite-youtube stylesheets, animate with hard-coded durations the theme cannot edit and should not fork. "No component has to remember" has to include components that were never ours.
  - **The clamp is `0.01ms` with `animation-iteration-count: 1`, not `0` and not `animation: none`.** Animations still complete and still fire `animationend`, so scripts waiting on that event keep working — which is exactly what the blunter forms break. `!important` is the correct tool here and not laziness: it has to beat inline styles that animation libraries write at runtime.
  - **`02-generic/motion.scss` is imported last in `app.scss`, deliberately out of ITCSS order**, after the third-party stylesheets it suppresses. The `!important` clamp would win from anywhere; keeping it last makes the intent legible.

#### T-2.04 — Icon system — ✅ **DONE 2026-08-06**
- **Objective:** Extract and standardise the outline icon family from the exports.
- **Files affected:** `src/assets/images/icons/`, SVG sprite, `src/assets/styles/03-elements/`
- **Twilight components:** `salla-apps-icons`, upstream `sicon-*` font
- **New components:** icon partial · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.01
- **Acceptance criteria:** Single sprite, sizing scale, `currentColor` inheritance, decorative icons `aria-hidden`, meaningful icons labelled. Decision recorded on whether the upstream icon font is retained or replaced.
- **Complexity:** M
- **What was done:**
  - **The `sicon-*` font is retained — the owner's ruling, and the evidence agrees with it.** `master.twig` already loads `sallaicons.css`, **52 distinct glyphs** are in use, and the theme holds only 2 local SVGs. Replacing the font would mean redrawing 52 icons to gain a sprite nothing else needs. **"Single sprite" is satisfied by the font itself:** one file, one request, one source.
  - **The real gap was accessibility, not delivery.** Icons are written as `<i class="sicon-…">` in 52 places and **not one carried `aria-hidden`**. An icon font renders a private-use-area codepoint, so a screen reader announces nothing useful or announces garbage — and an icon-only button ends up with **no accessible name at all**.
  - **`components/ui/icon.twig` makes the accessible default automatic:** `aria-hidden` unless a `label` is deliberately passed. That inversion is the point. Most icons here sit beside their own text — cart beside «السلة», chevron beside a link — so labelling by default would make a screen reader **say everything twice**. `label` exists for the genuinely standalone control.
  - **No size scale was invented (B2).** The icons are a font, so Tailwind's shipped font sizes *are* the scale, mapped `xs`→`text-xs` through `xl`→`text-2xl` inside the partial. No icon colour token exists either, because the font inherits `currentColor` and takes the colour of whatever contains it.
  - **`03-elements/icons.scss` carries one rule Tailwind cannot express.** A glyph inherits the surrounding line-height, so a 20px icon inside 24px text silently grows its own line box and nudges the layout — **a shift with no visible cause.** `line-height: 1` plus explicit alignment fixes it once, centrally, instead of each component rediscovering it.
  - **Both files are new**, so neither adds a register row; only `app.scss` changed, and it is already one.

#### T-2.05 — Button component, all states — ✅ **DONE 2026-08-06**
- **Objective:** Primary, secondary, ghost, icon-only across the nine states in doc 04.
- **Files affected:** `src/assets/styles/04-components/buttons.scss` (new), `src/views/components/ui/button.twig` (new)
- **Twilight components:** `salla-button` — technique C preferred
- **New components:** button wrapper if C proves insufficient · **New sections:** none · **Dynamic data:** none
- **Theme settings:** `button_style` select (doc 08)
- **Dependencies:** T-2.01, T-2.03, T-2.04
- **Acceptance criteria:** Default/hover/pressed/focus/disabled/loading/success/error/empty all implemented. Focus ring visible against every surface token and meets 3:1. Minimum 44×44 touch target. Loading state announces to assistive tech.
- **Complexity:** M
- **What was done:**
  - **Upstream already had most of the variants, and the first draft of this task duplicated them.** `--primary`, `--outline-primary`, `--outline`, `--danger`, `--icon`, `--is-loading` and `--rounded-full` all ship in `03-elements/buttons.scss` in nested `&--` form, which is invisible to a grep for `.btn--primary`. A duplicate `--primary` was written and then removed — **the exact duplication doc 04 forbids.** The design's names now map onto upstream's classes; **only `--ghost` and `--success` are new.**
  - **Every button in the theme was under the 44×44 touch target.** Upstream's `.btn` sets no height (≈36px) and `.btn--icon` is stated as `w-10 h-10` — 40px. `min-height: 2.75rem` on `.btn` and 44px on `.btn--icon` fix it. That is a deliberate 4px change to an upstream component, made because WCAG 2.5.5 is not optional and the icon-only buttons — where a mis-tap costs most — were the ones stated in pixels.
  - **It also retires the T-2.02 hack as promised.** `font-customization.scss` zeroed vertical padding to correct one font's metrics; with a min-height the button no longer sizes from the font's box, which is what made that rule font-specific.
  - **Pressed, `aria-disabled` and `aria-busy` are the genuinely missing states.** Upstream styles `:disabled` only. The partial emits **`aria-disabled` rather than the `disabled` attribute** — a natively disabled button is skipped by keyboard navigation entirely, so a user tabbing a form never learns the submit button is there; they just run out of controls.
  - **Loading announces.** `aria-busy` alone is passive and many screen readers say nothing, so a visually-hidden `role="status"` carries the message. The visible label stays put so the button does not resize mid-action and shift the layout around it.
  - **`components/ui/button.twig` exists because three criteria cannot be met by a stylesheet:** an icon-only button needs an accessible name, a loading button needs to announce itself, and a disabled button needs to stay announceable. Each is forgettable at every call site; routing buttons through the partial makes the markup right by default.
  - **First theme-authored locale key** — `theme.common.loading` — which exercises the T-1.05 contract: the checker confirms ar/en parity at 12 keys and the `theme.*` root rule.
  - **`button_style` is present and complete in `twilight.json`, and no later task re-creates it.** The dropdown, its four options and its default all exist in the manifest; the stylesheet consumes it and does not redefine it. **Any task that adds a second `button_style` entry is writing a duplicate, not a feature.** Recorded 2026-08-08 at the owner's instruction, because the setting is visible in the manifest and would otherwise read as still-to-be-built. *(One correction to the instruction as given: the setting is not pre-existing from the scaffold. Upstream `1.365.0` has no `button_style`; it entered in `2bedd551`, this task's own commit. The operative half is unchanged — it exists, it is finished, and it is consumed rather than rebuilt.)*
  - **It is not yet live, and the stylesheet says so at the point of definition.** A theme setting reaches CSS only through a template; the body class is emitted by `master.twig`, which T-3.01 owns and which is skipped. **Carried on T-3.01** alongside `--color-brand-secondary`. The setting being complete and the setting being live are different things, and only the second is outstanding.

#### T-2.06 — Text, phone and textarea inputs — ✅ **DONE 2026-08-08**
- **Objective:** Base form controls with validation states.
- **Files affected:** `src/assets/styles/04-components/forms.scss` (new), `src/views/components/ui/input.twig` (new)
- **Twilight components:** upstream form styles in `03-elements/`
- **New components:** input, textarea · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.05
- **Acceptance criteria:** Labels programmatically associated. Errors linked via `aria-describedby` and announced. Required state conveyed non-visually. RTL-correct including phone fields with LTR numerals. `autocomplete` set.
- **Complexity:** M
- **What was done:**
  - **A placeholder cannot be used as a label here, structurally.** `label` is a required parameter and always renders. A placeholder vanishes the moment someone types, taking the field's name with it — an annoyance for everyone and a barrier for anyone using magnification or a screen reader.
  - **The error is linked, not merely red.** `aria-describedby` points at it, `aria-invalid` marks the field, and the message carries `role="alert"` — not `aria-live="polite"` — because it appears in response to something the user just did and is the reason their action did not complete. Three channels carry it: an icon, the text, and a thicker border.
  - **`autocomplete` is a parameter rather than inferred from `type`.** WCAG 1.3.5 asks that a field collecting the user's own data identify its purpose, and only the caller knows whether a `tel` field is the customer's mobile or the shop's. One word to pass; wrong on the field that matters if guessed.
  - **`dir="ltr"` goes on the input and never on the wrapper** — T-1.04's rule, and the one that bites here. A phone number is a left-to-right run in a right-to-left page; `dir` on the container would re-resolve the label's own `text-align: start` and flip it to the wrong edge.
  - **47px tall and 12px round, measured** off `SignIn Bottom Sheet Step 2.svg` and `My Account Page.svg`, where every input is `w×47 rx11.5`.
  - **The border departs from the export deliberately — the third such case.** The exports draw `#EDEBE8`, which is **1.17:1** on white, and WCAG 1.4.11 asks 3:1 of any boundary that identifies a control. On a card edge that token is right and this theme uses it everywhere; **on the one element whose border IS the affordance it is exactly the failure T-2.01's contrast table exists to prevent.** `--border-interactive` is 6.00:1. Same reasoning the owner approved twice in T-2.20, applied to a case they had not yet seen — recorded there rather than taken quietly.
  - **`--color-error: #C20013` entered the token layer**, measured: 124 occurrences across the exports, on «تأكيد الإلغاء», sale prices and validation. 6.36:1 on white, so it carries body text as well as boundaries.
  - **A new file, not upstream's `03-elements/form.scss`.** That is element-level styling for `input`/`select`/`textarea` generally and for upstream's own `.s-*` markup; adopting 200 lines to change a border colour is the trade T-4.01 and T-3.04 both declined.

#### T-2.07 — OTP input — ✅ **DONE 2026-08-08**
- **Objective:** Segmented verification-code field per the Step 3 sheet.
- **Files affected:** `src/views/components/ui/otp.twig` (new), `src/assets/js/partials/otp.js` (new)
- **Twilight components:** none
- **New components:** OTP input · **New sections:** none
- **Dynamic data:** verification state via `salla.auth` · **Theme settings:** none
- **Dependencies:** T-2.06
- **Acceptance criteria:** Paste of a full code distributes across segments. Arrow/backspace navigation works. `inputmode="numeric"`, `autocomplete="one-time-code"`. Screen reader announces position and errors. LTR digit flow inside RTL layout.
- **Complexity:** M
- **What was done:**
  - **Four inputs, not one styled to look like four.** The export draws four boxes at `≈85×47 rx11.5`. A single field cannot put the caret in the third box; four can, and each is a real field a screen reader can name.
  - **Each segment is named by position** — «الرقم 3 من 4». That is exactly what a screen-reader user needs when focus moves on its own, and focus moving on its own is the entire behaviour of this control.
  - **`autocomplete="one-time-code"` is on the first segment only.** Put on all four, several browsers fill every box with the whole code. The browser fills segment one and the paste handler distributes the rest.
  - **Anything longer than one character is treated as a paste, not dropped.** A phone keyboard can deliver more than one character to a `maxlength="1"` field and some IMEs deliver the entire code, so the `input` handler routes long values through the same distribution path as `paste`.
  - **Backspace steps back only from an EMPTY box.** Without that guard one keystroke wipes two digits: the one you are on and the one behind it.
  - **The row is `dir="ltr"` and its label is not, and this is *not* the case T-1.04 warns about.** That warning is against isolation on a block that also holds RTL text, where it re-resolves the block's own `text-align: start`. This row holds four digits and nothing else; the label sits outside it. It is also the one place in this theme where `ArrowLeft` meaning "previous" is the correct model rather than a bug.
  - **Layout is `grid` with `grid-auto-columns: 1fr`**, so a six-digit code needs no new rule — the segments stay equal at any count.

#### T-2.08 — Checkbox, radio, switch — ✅ **DONE 2026-08-08**
- **Objective:** Selection controls.
- **Files affected:** `src/assets/styles/04-components/forms.scss`, `src/views/components/ui/`
- **Twilight components:** upstream element styles
- **New components:** three controls · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.06
- **Acceptance criteria:** Native semantics preserved; no `div` with role hacks. Keyboard operable. State not conveyed by colour alone.
- **Complexity:** S
- **What was done:**
  - **All three are a native `<input>`, and the component ships no script.** Checkbox, radio, and — for the switch — a checkbox carrying `role="switch"`, the one place ARIA adds meaning the platform has no element for. Native inputs arrive keyboard-operable, form-associated and understood by every assistive technology for free, which is both the acceptance criterion and the reason there is nothing to wire.
  - **State is a shape before it is a colour.** The checkbox draws a tick, the radio a filled dot, the switch moves its knob — every one a change of *form*, so the state survives a monochrome rendering. Colour is the third channel here rather than the first.
  - **The tick is drawn in CSS, not with the icon font**, and that is deliberate: `sallaicons.css` is a network request, and a checkbox whose state is invisible for the first 200ms is a checkbox that gets clicked twice.
  - **The label wraps the input**, so the sentence is part of the target. A 20px box is a poor target; the row is 44px and the whole of it responds.
  - **Measured:** 20px box at radius 6, 24px circle for the radio, `#646361` when set — `Show Filter.svg` and `My Account Page.svg`. The boundary is `--border-interactive` for the same reason as T-2.06's field.
  - **No artboard draws a switch, and that is recorded rather than papered over.** The design's selection controls are the filter checkbox and the payment radio; the toggles that look like switches belong to Salla's customiser, which is the dashboard and not this theme. The switch is built to the same language as its two neighbours rather than invented from nothing.

#### T-2.09 — Quantity selector — ✅ **DONE 2026-08-08**
- **Objective:** Increment/decrement control.
- **Files affected:** `src/assets/styles/04-components/forms.scss`
- **Twilight components:** `salla-quantity-input` — technique C
- **New components:** none · **New sections:** none
- **Dynamic data:** stock limits · **Theme settings:** none
- **Dependencies:** T-2.08
- **Acceptance criteria:** Restyled without replacing the element. Min/max respected. Value change announced. Buttons labelled.
- **Complexity:** S
- **What was done:**
  - **Three of the four criteria were already met by the platform, and that was checked in its source before anything was written.** `salla-quantity-input` renders real `<button>`s with `aria-label`s for increase and decrease, labels its input from `common.elements.quantity`, sets `inputmode="numeric"` and clamps to `min`. **Nothing about that needed replacing**, which is why this task is a stylesheet plus twenty lines rather than a component.
  - **The fourth was missing and is the reason the twenty lines exist.** Pressing «+» changes a value the user is not focused on: focus stays on the button, the input's contents change silently, and a screen-reader user has no way to learn the new quantity short of going to find it. One `role="status"` region, `polite` rather than `assertive` because the change was expected — they pressed the button.
  - **The listener is delegated, and that is not tidiness.** Cart rows are rendered after this script runs; binding each control at boot would miss every row the cart adds later.
  - **Re-announcing the same number is suppressed.** A repeated value says nothing new and interrupts whatever was being read.
  - **Measured `101×35 rx7.5` with a 1px boundary**, from `Cart Page.svg`, at the theme's 44px height rather than the drawn 35 — the standing deviation recorded in T-2.20, applied to a control that is two buttons.

#### T-2.10 — Bottom Sheet primitive — ✅ **DONE 2026-08-08**
- **Objective:** The foundational overlay used by auth, filters and actions.
- **Files affected:** `src/views/components/ui/bottom-sheet.twig` (new), `src/assets/js/partials/bottom-sheet.js` (new), `src/assets/styles/04-components/bottom-sheet.scss` (new)
- **Twilight components:** `salla-modal` evaluated first — technique C if it can be re-presented as a sheet
- **New components:** Bottom Sheet · **New sections:** none · **Dynamic data:** runtime · **Theme settings:** none
- **Dependencies:** T-2.03, T-2.05
- **Acceptance criteria:** Focus moves in on open and returns to trigger on close. Focus trapped while open. `Esc` and backdrop close it. Background scroll locked without layout shift. `role="dialog"`, `aria-modal`, labelled. Slide-up honours reduced-motion. Becomes a centred dialog above tablet per doc 10.
- **Complexity:** L
- **What was done:**
  - **`salla-modal` was evaluated first, as the entry requires, and the evaluation is the substance of this task.** Its markup is genuinely reusable — `position="bottom"` exists, it emits `role="dialog"` and `aria-modal`, it closes on backdrop click, and it is light-DOM so technique C could restyle it freely. **Its behaviour fails four of this task's criteria, and none of the four is reachable from CSS:** `Esc` does not close it, because `handleKeyUp` compares `ev.key === "KeyUp"` — a value `key` never takes, so the branch is dead; **focus is not trapped**, since nothing handles Tab; **focus never returns to the trigger**, since the opener is never recorded; and **focus does not always move in**, because `handleAutoFocus()` looks only for `input, textarea, select` and the artboard's sign-in sheet is made of buttons. A Stencil element is not practically subclassable, so B was unavailable too.
  - **The browser implements all four, so the primitive is a native `<dialog>`.** `showModal()` traps focus, closes on `Esc`, returns focus to the opener, and makes the rest of the document inert — in the top layer, so **no z-index appears anywhere in this component**, which the stylesheet says out loud because the reflex when an overlay sits behind something is to add one.
  - **What was left for the script is the remainder, and it is 90 lines.** Backdrop click — `event.target === dialog` is the whole test, because the panel covers the box, so no geometry is measured. And the scroll lock.
  - **"Without layout shift" is why the lock measures.** `overflow: hidden` on the body removes the scrollbar, and on a platform with a classic scrollbar that reflows the entire page behind the sheet. The gutter is measured and handed back as `padding-inline-end` through a custom property. On touch platforms the measurement is zero and it costs nothing. **The lock also counts:** sheets stack — a confirmation over a filter panel — so it lifts only when the last `[data-sheet][open]` is gone.
  - **Only the entrance is animated, and that is a robustness decision rather than a taste one.** A closing animation must be awaited before `close()`, and the only signal is `animationend`, **which never fires if an animation is suppressed rather than shortened**. T-2.03's clamp shortens, so it would be safe today — but `02-generic/motion.scss` also sets `animation: none` outright in places, and one such rule reaching this component would leave a sheet that cannot be dismissed. **A dismissal must never depend on an animation firing.**
  - **Reduced motion needed no rule, and the reason is worth contrasting with T-3.03.** The clamp collapses the rise to its end state, which here is the sheet in place — correct. The marquee's end state was the text scrolled off-screen, which is why that component needed an explicit `animation: none`. Same clamp, opposite consequence.
  - **Initial focus is `autofocus` on the close button, not DOM reordering.** It gives T-2.11 "the destructive action is not the default focus target" for free, and it means a sheet of buttons still receives focus — the exact case `salla-modal` drops. The alternative, putting the button first in the DOM and moving it with `order`, would make the artboard's last control the first tab stop.
  - **It ships in the `app` webpack entry array, not through an `app.js` import.** One line either way; the import costs the adoption of `app.js` and its sixteen lint problems under the T-1.07 ratchet, and the entry array costs a register row. A primitive that auth, filters, quick view and the story modal all need has to be in the bundle every page loads.
  - **One component, two variants, because the artboards draw two shapes.** `sheet` is bottom-anchored with two rounded corners (`SignIn Bottom Sheet Step 1.pdf`); `dialog` is centred with four (`01 Cancel Order Confirmation Pop-up.pdf`). Doc 10 turns the first into the second above tablet, so both had to exist anyway.

#### T-2.11 — Confirmation dialog — ✅ **DONE 2026-08-10**
- **Objective:** Destructive-action confirmation (cancel order, remove item).
- **Files affected:** `src/views/components/ui/dialog.twig` (new), `src/assets/styles/04-components/dialog.scss` (new), `01-settings/global.scss`, `04-components/{bottom-sheet,buttons,stories}.scss`, `app.scss`, `views/components/ui/button.twig`, `views/components/home/stories.twig`
- **Twilight components:** `salla-modal` — **not used**, for the four behavioural reasons T-2.10 recorded
- **New components:** Dialog · **New sections:** none · **Dynamic data:** runtime · **Theme settings:** none
- **Dependencies:** T-2.10
- **Acceptance criteria:** Shares focus management with T-2.10. Destructive action is not the default focus target. Scale+fade per doc 14, reduced-motion respected.
- **Complexity:** S
- **What was done:**
  - **Two of the three criteria were already true before this task started, and the honest answer is that T-2.10 paid for them.** Focus in, focus trapped, focus returned, `Esc`, backdrop and the scroll lock are the primitive's, which is the browser's `<dialog>`. And **the destructive action is not the default focus target** because `autofocus` sits on the close button and the footer follows the body — so the confirm is the last thing a keyboard reaches. **That is also the artboard's own order**, «إغلاق» at the inline start and «تأكيد الإلغاء» at the inline end: reading order and safety agree here, so neither had to be traded for the other.
  - **The third — scale+fade — is four lines, and it wins by import order rather than specificity.** `.sheet--dialog[open] .sheet__panel` and `.sheet[open] .sheet__panel` both compute to (0,3,0). `dialog.scss` is imported immediately after `bottom-sheet.scss`, and both the stylesheet and `app.scss` say so, because a later tidying of that import list would otherwise silently restore the rise.
  - **The panel's geometry is measured and then not written down.** The export draws `361×230 rx16`, two buttons at `157.5×37 rx11.5`, a 12.5px gutter and a 16px inset. The primitive's `p-4`, the footer's `gap-3` and `.btn`'s `flex-1` already produce all of it — 328 of content, less 12, is 158 a side. **The only thing this file adds to the box is `basis-0`**, so a long label cannot push its neighbour narrow.
  - **The confirm carries a hook and not a handler.** `data-dialog-confirm="{id}"` is a stable selector; the component cannot know whether the caller cancels over the API, submits a form or follows a link, and **it deliberately does not close the dialog on confirm** — a caller that must show progress needs it open. No JS file was added, which is why "Files affected" still names none.
  - **Upstream's danger red was a contrast failure and is now the design's.** `.btn--danger` was `bg-red-400` — `#F87171`, white on it **3.05:1**, on the one button in the theme whose whole job is to be understood before it is pressed. The export measures `fill #C20013 stroke #B10011`: **6.36:1**. `--color-error-strong` is the only new colour token, and it is a stated value in the design rather than a filter over the fill.
  - **`.btn--neutral` exists because this is the second occurrence, not the first.** T-2.19 gave «تابعنا على وسائل التواصل» a white surface and a neutral boundary as a component-scoped override; the dialog's «إغلاق» is the same button. A second copy is the duplication doc 04 forbids, so the treatment moved into `04-components/buttons.scss` and **`.stories__cta` now consumes it** — that rule is down to placement and carries no colour at all. Neither upstream outline could serve: `--outline-primary` is the merchant's brand colour where the artboard is neutral, and `--outline` repeats the 1.4.11 failure T-2.06 corrected.
  - **Two values T-2.10 approximated are now measured.** The scrim is `#151515` at 48%, not 50% black — all three overlay exports agree — and it becomes `--overlay-scrim` because a scrim is a surface decision, not one component's private business. And **every overlay title in the design is `#646361`**, which is a real change to how the sign-in sheet and the story view will read, at 6.00:1 on a white panel.
  - **The dialog panel's hairline is kept although this one export omits it.** The sign-in sheet is drawn `stroke #E7E7E7` and the cancel dialog with no stroke at all: two overlays, one primitive, two contradictory measurements. On a 48% scrim neither is distinguishable, so the primitive keeps one treatment rather than forking `.sheet__panel` to satisfy a difference nobody can see.

#### T-2.12 — Toast bridge — ✅ **DONE 2026-08-10**
- **Objective:** Route all feedback through Salla's notifier with the design's visual treatment.
- **Files affected:** `src/assets/styles/05-utilities/toast.scss` (new), `src/assets/js/partials/toast.js` (new), `01-settings/global.scss`, `app.scss`, `tailwind.config.js`, `webpack.config.js`, `src/views/layouts/master.twig`, `twilight.json` — **not** `add-product-toast.*`, see below
- **Twilight components:** `salla.notify` — technique C · `salla-add-product-toast` — **left alone and switched off by default**
- **New components:** none · **New sections:** none · **Dynamic data:** runtime · **Theme settings:** `enable_add_product_toast` (default changed, not added)
- **Dependencies:** T-2.05
- **Acceptance criteria:** Success/error/info variants match the five toast screens supplied. Announced via a live region. Not the sole channel for critical information. Auto-dismiss pausable on hover/focus.
- **Complexity:** S
- **What was done:**
  - **The entry named the wrong two files, and the reason is worth stating.** It assumed the design's toast was upstream's `salla-add-product-toast` — a card carrying the product's image, price, options and two actions. **No artboard draws that component.** What every artboard draws for a successful add is the same slim toast every other message uses: `Add to Cart Notification`, `Shopping Cart Notification` and `Login Notification` are the identical panel, 345×56, that `Favorites`, `Reorder`, `Redemption` and `Story Page` draw. So the work is `salla.notify`'s toast, and `add-product-toast.*` is untouched.
  - **Eight exports, and they agree to the pixel.** `345×56` at the top of the viewport, inset 24 a side, radius 13, surface `#FCFBFB`; a `32×32` disc 16 from the edge, `#E8F7E9` with a `#16AE26` check or `#FBE6E8` with a `#C20013` cross; the message `#646361`, 16 from the disc; a **3px accent along the bottom edge** in the same green or red, with a soft glow; `0 -8px 28px` at 8%. The taller error export is the same toast with a message that wraps — its disc stays centred and its bar stays 3px — not a second size.
  - **The bottom bar is the library's timer, and that is not a coincidence anyone has to accept on faith.** sweetalert2 renders `timerProgressBar` as a full-width bar along the bottom edge of the toast, which is exactly where the design draws its accent and exactly the width a fresh toast would show. So the drawn bar *means* the remaining life of the message, and it is styled rather than invented.
  - **Technique C, and it is a stylesheet plus twelve lines of script.** `salla.notify` already gives `role="alert"`, `aria-live="polite"`, a 2s timer, the progress bar and pause-on-hover — checked in sweetalert2's own source, not assumed. **Nothing about `salla.notify.success(…)` changed at any call site in the theme or the SDK.**
  - **The stylesheet is a new file rather than an edit to `swal.scss`**, which carries sixteen pre-existing lint problems that the T-1.07 ratchet would force a rewrite of to restyle a toast. Same trade T-2.18 made with `home-blocks.scss`, same answer: import it after and win on order.
  - **Two selectors are heavier than they look, and the reason is in the file.** sweetalert2 ships its CSS inside its JS and injects it into `<head>` at execution time — *after* `app.css`. Order cannot be relied on against the library, only against `swal.scss`, so the container rule carries `html` to out-specify it by one element. **No `!important` was needed anywhere.**
  - **Two of the four criteria were behaviour, and are `partials/toast.js`.** The upstream notifier pauses on `mouseenter`; **a keyboard user has no mouseenter**, so `focusin`/`focusout` do the same for them. And sweetalert2 names its close button "Close this dialog" — in English, on an Arabic storefront — so a `childList` observer on `<body>` puts «إغلاق» on it. The file rides the `app` entry array, which already contains sweetalert2: `app.js` grew **0.1 KB**.
  - **The close button is hidden and returns on focus — the one place this argues with the artboard.** No artboard draws a dismiss control, and a message that vanishes on a timer with no way to hold it is a WCAG 2.2 problem for anyone who reads slowly. `sr-only` until `:focus-visible` is the pattern the theme's own skip link already uses: a pointer user sees exactly what is drawn, and a keyboard user gets a control that both dismisses the toast and stops its timer.
  - **`enable_add_product_toast` now defaults to `false`, in `twilight.json` and in all three places `master.twig` reads it.** The switch stays — the enhanced toast is a working feature a merchant may want — but a store installed and left alone must look like the design, and the design's add-to-cart message is the slim toast. The setting also gained the description it never had.
  - **Success and error are measured; info, warning and question are derived.** No artboard supplies them, so under B8 they take the design's own neutral — `--text-secondary` on `--surface-section` — rather than a colour invented for the occasion. Recorded.

#### T-2.13 — Skeleton and loading states — ✅ **DONE 2026-08-10**
- **Objective:** Placeholder treatment for every async surface.
- **Files affected:** `src/assets/styles/04-components/skeleton.scss` (new), `src/views/components/ui/skeleton.twig` (new), `01-settings/global.scss`, `app.scss`, `src/locales/{ar,en}.json`
- **Twilight components:** upstream `no-content-placeholder.scss` — **not consumed**, it is an *empty* state and belongs to T-2.14
- **New components:** skeleton · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.03
- **Acceptance criteria:** Dimensions reserved so skeleton→content causes zero CLS. Shimmer disabled under reduced-motion. `aria-busy` set.
- **Complexity:** S
- **What was done:**
  - **The one value that matters is measured, which was not a given for a state no artboard draws.** Every artboard draws what sits under an image *before* the image arrives: `fill="#EBEBEB"`, **62 occurrences across 16 export files**, always as the bed beneath a `pattern` fill — product thumbs, story media, order lines. The skeleton is that tone, as `--surface-placeholder`, rather than a grey chosen for the occasion. The sweep and its timing have no artboard and are derived under B8.
  - **Zero CLS is a usage rule, so the component states no height anywhere.** A skeleton that sizes itself is guessing at the content's size, and every guess is a shift the moment the content lands. The box must already be reserved by the layout — `.card__media`'s aspect-ratio, a grid track — and `--fill` takes it. That is why the partial takes `class` and `region_class` and offers no `height` parameter at all.
  - **A partial was added although the entry named only a stylesheet, because two of the three criteria are attributes.** `aria-busy` belongs on the region that is loading and cannot come from CSS; the bars must be `aria-hidden` or a screen reader announces a row of empty elements. Both are forgettable at every call site. The wrapper is a polite `role="status"` with one visually-hidden sentence: **told once, not interrupted again.**
  - **Reduced motion removes the sweep rather than shortening it — the one component where that is right.** T-2.03's clamp collapses animations to 0.01ms so that scripts waiting on `animationend` keep working; nothing waits on this one, and collapsing it would park a bright band across the placeholder wherever it froze. **The end state of an infinite sweep is not a resting state** — the same trap T-3.03's marquee fell into.
  - **The duration is `--motion-slow × 3` rather than `1.5s`.** A shimmer at 500ms reads as a flicker and the theme's scale has nothing longer, so it is stated as a multiple of the token it belongs to and moves with it, instead of a number from nowhere that B2 exists to prevent.
  - **Only `transform` animates**, on a pseudo-element, so the sweep never triggers layout or paint on a page that may be showing dozens of these at once.

#### T-2.14 — Empty states — ✅ **DONE 2026-08-10** (unblocked 2026-08-05, B8 closed by derivation)
- **Objective:** Empty treatments for cart, favorites, orders, notifications, search.
- **Files affected:** `src/views/components/ui/empty-state.twig` (new), `src/assets/styles/04-components/empty-state.scss` (new), `app.scss`
- **Twilight components:** `no-content-placeholder` — **consumed, not replaced**
- **New components:** empty state · **New sections:** none · **Dynamic data:** none
- **Theme settings:** none
- **Dependencies:** T-2.13, T-0.05
- **Acceptance criteria:** One reusable component covering all five contexts. **Derived** under the B8 ruling: built from existing components and upstream Twilight templates in the established visual language — warm page background, white card, subtle border, the same buttons. No new visual pattern is invented. Each derivation recorded in `/docs/DERIVED-DECISIONS.md`.
- **Complexity:** S
- **What was done:**
  - **The derivation is that nothing was derived.** B8 asks for existing components in the established language, and the component is exactly three things the theme already had: T-2.15's `.card`, upstream's own `.no-content-placeholder` column, and T-2.05's button. **The only new CSS in the task is two colours** — upstream states the icon disc as `bg-gray-100 text-gray-300`, raw Tailwind greys belonging to no palette in this theme, and they become `--surface-section` and `--text-secondary`. The disc keeps upstream's size, the column keeps upstream's rhythm.
  - **It emits `.no-content-placeholder`, which is what makes it one empty state rather than a second one.** That class is already in five upstream templates — cart, orders, blog, brands, brand detail. Reusing it means those five and this component cannot drift apart, and the retune reaches all five **without any of them being edited**.
  - **The retune is a new file rather than an edit to the upstream stylesheet, and that was a close call.** `no-content-placeholder.scss` is lint-clean, so adopting it would have been cheap — but it would put a theme decision inside a file the SDK upgrade procedure expects to take wholesale, and buy `/docs/OVERRIDES.md` a row it would carry forever. Imported after it, the retune wins on order.
  - **The component owns no copy at all.** Five contexts need five sentences, each belonging to the page that knows its own situation, and most already exist in upstream's catalogue. A component with no strings cannot put the wrong one on a page.
  - **The icon passes no label, deliberately.** It restates the message beside it, so naming it would make a screen reader say the same thing twice — T-2.04's default is correct here rather than merely convenient.
  - **Not retrofitted into the five upstream pages, and that is scope rather than omission.** `cart.twig` belongs to T-4.15, `orders/index.twig` to T-6.01, and the search and favorites pages do not exist yet. Those tasks consume it; this one built it. The colour retune already reaches them in the meantime.

#### T-2.15 — Card shells — ✅ **DONE 2026-08-06** (un-skipped by the owner: T-4.01 depends on it)
- **Objective:** Shared container treatment behind product/brand/order/story/loyalty/notification cards.
- **Files affected:** `src/assets/styles/04-components/cards.scss` (new)
- **Twilight components:** none · **New components:** card shell · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.03
- **Acceptance criteria:** Radius, border and elevation drawn from tokens only. One shell, six variants — no duplicated variants (doc 04 rule).
- **Complexity:** S
- **What was done:**
  - **`04-components/cards.scss` holds only what all six cards share** — surface, border, radius, media well, body padding. Each card's own task adds its content layout on top and **re-declares none of it.** The file states the test plainly: a second `background-color: var(--surface-card)` anywhere in `04-components/` is the duplication doc 04 forbids.
  - **Every value is a token.** Surface and border from T-2.01, radius and elevation from Tailwind's shipped scales, timing from T-2.03's `--motion-fast`/`--motion-ease` — which is the first task to consume them. Nothing measured.
  - **The border is `--border-subtle` at 1.10:1, and that is correct here.** The card is identified by its white surface against the warm page; the border is trim, not the affordance, so 1.4.11's 3:1 does not bind. Recorded because the same token on a form control **would** be a defect.
  - **`.card--interactive` solves a problem all three link-cards share, once.** The whole card should be clickable but only **one** thing inside it focusable — otherwise a keyboard user tabs through image, title and price to reach a single destination. One stretched anchor, and the ring drawn on the card via `:focus-within` so the indicator surrounds what is actually about to be activated.
  - **`aspect-ratio` sits in the shell, not in each card.** Reserving image dimensions centrally is what makes zero CLS structural rather than something six tasks must each remember. The 1/1 default is **inferred from no artboard** and overridable per type via `--card-media-ratio`; that is recorded.
  - **New file — no register row.** Only `app.scss` changed, and it is already one.

#### T-2.17 — Token reconciliation against the SVG exports — ✅ **DONE 2026-08-08** (added 2026-08-08 by the project owner)
- **Objective:** Replace every inferred colour and radius in the token layer with the value the design actually carries, now that the exports can be read as text.
- **Why it was added:** the SVG exports arrived on 2026-08-08 and, unlike the PDFs, they carry **real attribute values** — fills, strokes, radii, geometry. A census across all 51 files showed four tokens matching exactly and **three that appear in no artboard at all**. This is the first task in the four-block reconciliation the owner approved.
- **Files affected:** `src/assets/styles/01-settings/global.scss`, `tailwind.config.js`, `docs/DERIVED-DECISIONS.md`
- **Twilight components:** none · **New components:** none · **New sections:** none
- **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.01
- **Acceptance criteria:** Every changed value traceable to an occurrence count in the exports. **The contrast table recomputed in full**, not patched. No token left whose value appears nowhere in the design. Nothing regresses against WCAG 1.4.3 or 1.4.11.
- **Complexity:** S
- **What was done:**
  - **Four tokens were already exact and are untouched:** `--text-secondary #646361`, `--border-subtle #EDEBE8`, `--accent-soft #F9E6E7`, and the warm `#F7F6F4` — whose *value* T-2.01 got right and whose *role* it did not.
  - **Three had no basis in the design and are gone.** `#231F1E` (the scaffold's ink), `#888684` (T-2.01's derived boundary) and `#F7F6F4`-as-the-page each appear **zero** times in 51 files. They are replaced by `#1B1B1B` (450 occurrences), `#646361` (1629 stroke occurrences) and `#FDFDFD` (955).
  - **The derived value was not merely wrong, it was weaker.** `#888684` was chosen as the lightest tone that would still clear 1.4.11 and it scraped past at 3.36:1. The design's own boundary colour clears the same threshold at **5.90:1**. The theme had been carrying an invention built to be barely good enough while the artboards carried something comfortably better.
  - **`--surface-section: #F7F6F4` is new, and it is the token whose absence caused OP-5.** The warm tone belongs to the per-section panel; with it assigned to the page there was nowhere for those panels to come from, which is why six components have been rendering without them. T-2.18 builds the panel.
  - **`--surface-card` stays `#FFFFFF` deliberately.** Cards are `#FDFDFD` in the exports and sheets are pure white; two units per channel is below the threshold of visible difference, and a fourth token nobody could tell from its neighbour is a coin flip with documentation attached.
  - **`rounded-large` 22px → 16px.** Every section panel, the hero frame and the bottom sheet are drawn at `rx 16`; 22px was upstream's and matches nothing. **Six components inherit the fix for free** — hero, hotspot figure, story media, partner banner, sheet panel, video frame.
  - **The contrast table was recomputed in full rather than patched**, because three of its inputs changed. Every row passes, and every row passes by *more* than before: the ink went 16.05 → 16.93 on the page, and nothing regressed.

#### T-2.18 — The section panel, the container inset and the section rhythm — ✅ **DONE 2026-08-08** (added 2026-08-08 by the project owner)
- **Objective:** Give the warm tone the shape it has in the artboards — a rounded panel per section — and correct the two spacing values the exports contradict. Close OP-5.
- **Why it was added:** block 2 of the four-block SVG reconciliation. T-2.17 created `--surface-section`; without this task it would be a token nothing uses.
- **Files affected:** `src/assets/styles/04-components/section-panel.scss` (new), `src/assets/styles/app.scss`, `tailwind.config.js`, `src/views/components/home/{video-carousel,stories,photos-slider,lookbook}.twig`, `src/views/components/footer/footer.twig`, `src/assets/styles/04-components/footer.scss`
- **Twilight components:** `.s-block` — **overridden, not adopted**, see below · **New components:** section panel · **New sections:** none
- **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.17
- **Acceptance criteria:** The panel defined **once**. Container inset 16px. Section rhythm 24px. Only the sections the artboards panel are panelled. OP-5 closed.
- **Complexity:** S
- **What was done:**
  - **Not every section is a panel, and OP-5's own proposed fix would have been wrong.** That entry said "`.s-block` gains the panel treatment". Resolving every `<rect>` on the Home export shows **five panelled** — video carousel, stories, photos carousel, the *list* lookbook, the footer — and **four bare**: the hero, whose frame is the image; the product carousel, whose **cards** carry the warm tone instead; the *overlay* lookbook; and the partner banner. A blanket rule would have drawn a warm border around four full-bleed photographs.
  - **The rule behind the split is legible once seen:** a section that stacks content **around** an image gets a panel; a section that **is** one image does not. It maps exactly onto the lookbook's existing `layout` setting, which is why one component is panelled in `list` and bare in `overlay` — one conditional class, no second component.
  - **The panel is a child of the container and that is forced, not chosen.** `.container` carries the page gutter as *padding*, so a background on it paints edge to edge and the panel gets no inset at all. A child fills the content box — 16..377 on a 393 page — which is the panel's exact geometry with no second measurement anywhere in the stylesheet.
  - **The 24px rhythm is an override rather than an edit.** Three consecutive panels sit 24px apart on the artboard; upstream's `.s-block` is `mt-8 sm:mt-16`, neither of those. `home-blocks.scss` is 400 lines of upstream and editing it would adopt the whole file under the T-1.07 ratchet **to change one declaration**, so the new file is imported after it and wins on order.
  - **Container padding 10px → 16px**, in `tailwind.config.js`. Every framed box on every artboard is 361 wide inside a 393 page.
  - **The footer stopped being a band.** It is `x16 w361 rx16 #F7F6F4` — the same inset, radius and tone as every other panel — so it consumes `.s-block__panel` and declares neither surface nor radius of its own.

#### T-2.19 — Component reconciliation against the SVG exports — ✅ **DONE 2026-08-08** (added 2026-08-08 by the project owner)
- **Objective:** Correct every component value the exports contradict, now that the tokens and the panel underneath them are right.
- **Why it was added:** block 3 of the four-block reconciliation. Eleven items, each traceable to a `<rect>` or a filter stack in a named file.
- **Files affected:** `01-settings/global.scss`, `tailwind.config.js`, `04-components/{stories,partner-banner,photos-carousel,video-carousel,product-carousel,hotspot,product-card,store-header,bottom-sheet}.scss`, `components/header/header.twig`, `components/home/{stories,video-carousel}.twig`
- **Twilight components:** none · **New components:** none · **New sections:** none
- **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.17, T-2.18
- **Acceptance criteria:** Every change traceable to a measured value. No raw hex outside the token layer. Nothing regresses against the recomputed contrast table.
- **Complexity:** M
- **What was done:**
  - **«تابعنا على وسائل التواصل» is outlined, not filled.** It shipped as `btn--primary` — the merchant's brand colour, solid. The export says `344×37 rx11.5 fill #FDFDFD stroke #646361`: white with a neutral boundary.
  - **The partner banner's filled action is opaque `#646361`, replacing a derivation with a measurement.** It was `rgb(0 0 0 / 60%)` plus a translucent white hairline — a defensive construction for white text over an unseen photograph, derived from T-4.05's scrim table. **An opaque fill makes the photograph irrelevant, which is what that derivation was trying to achieve the hard way.** White on `#646361` is 6.00:1.
  - **One neutral ink, three named roles, aliased rather than repeated.** `#646361` is the design's secondary text, its every control boundary, and this one solid fill. `--border-interactive` and the new `--surface-control` now alias `--text-secondary`, so a palette change moves one decision instead of three that can drift apart.
  - **Both carousel ratios were wrong and both are now the measured pair.** Photos: `4/3` — landscape — against a portrait `300×361`. Video: `9/16`, inferred from "vertical social video", against a `300×337` window that crops the post rather than showing it full height. Written as the two numbers, unreduced, because they are a measurement and not a proportion anyone chose.
  - **Story tag chips are `rounded-lg`, not `rounded-full`.** `68×31 rx7.5` with a 1px stroke is a radius of 8 on a 31-tall box: rounded rectangles, which at that size read as pills and are not.
  - **The carousel indicator runs the full width.** The track is `345×4` — the container's whole content box — where this had `w-1/2` centred. Its two colours were already right.
  - **The hotspot pill lost a border it should never have had** (`325×88` with **no stroke**; the hairline came from `.card`'s trim habit), and its thumbnail went from 64px to `4.5rem` against a measured 71 — one pixel, on a shipped step, rather than an arbitrary value outside the scale B2 requires.
  - **The product card is warm and borderless, and it is the one place this departs from the shared shell.** `176×361 rx12 fill #F7F6F4`, no stroke. It is the *only* warm surface in its section, because the product carousel is one of the four sections T-2.18 leaves unpanelled. **`.card` itself is untouched:** the other five card types have no export to check against yet, and moving the shared shell to satisfy one would be guessing on behalf of four.
  - **The solid header became the floating bar T-3.05 said it should be.** `x16 w361 h56 rx12 fill #F7F6F4`, 1px `#EDEBE8`, and a **12px backdrop blur** — measured, and the reason the bar stays legible over whatever scrolls beneath it. `py-1.5` gets the 56px height out of the theme's 44px control floor. T-3.05 was told not to restyle either state and recorded the mismatch instead; this is the task that was allowed to.
  - **The bottom sheet gained its hairline.** `stroke #E7E7E7`, six units from `--border-subtle` — below the threshold of visible difference, so the existing token carries it rather than a fourth near-white entering the palette for one rule.
  - **Three measured shadows entered the scale**, read out of the filter stacks rather than guessed: `0 2px 40px rgb(0 0 0 / 10%)` for panels and the floating header, `0 1.5px 4px rgb(51 51 51 / 8%)` for small controls, `0 4px 8px rgb(51 51 51 / 4%)` for raised cards. `stdDeviation` is half the CSS blur radius; the colour is the last `feColorMatrix` in each stack.

#### T-2.20 — The deviations from the SVG, recorded and kept — ✅ **DONE 2026-08-08** (added 2026-08-08 by the project owner)
- **Objective:** Two places where the exports were read, understood, and **deliberately not followed**. Record them so neither is later mistaken for an oversight or "fixed" by someone reading the SVG without reading this.
- **Why it was added:** block 4 of the four-block reconciliation. **This task changes no code**, which is the point of it existing as a task rather than as a comment.
- **Files affected:** `/docs/DERIVED-DECISIONS.md` only
- **Twilight components:** none · **New components:** none · **New sections:** none
- **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.19
- **Acceptance criteria:** Each deviation states the measured value, the value shipped, and the standard that forced the difference. Neither is presented as a preference.
- **Complexity:** XS
- **What was done:**
  - **Button height stays 44px against a measured 37.** Every standard control in the exports is 37 tall (116 occurrences) and the chips are 31. **WCAG 2.5.5 asks for 44×44**, and T-2.05 put that floor under the whole theme before any of these numbers were available. Following the export would take every button in the store below the minimum. **The design is not wrong about the look — it is silent about touch targets**, and where a drawing and a standard disagree on a number the standard wins. The larger controls in the design (47px sheet buttons) already exceed the floor and are unaffected.
  - **The hero scrim stays a gradient against a measured flat 16% black.** The export draws `fill="black" fill-opacity="0.16"` over the hero image. Composited over the worst case — a white image — that is `#D6D6D6`, and **white text on it is 1.5:1**, against the 4.5:1 that WCAG 1.4.3 requires. T-4.05 derived a gradient reaching 60% at the point the text sits, giving 5.74:1. **The hero's images are merchant-supplied, so "the designer's photo was dark enough" is not a property the theme can rely on.** Recorded when it was a guess; kept now that the guess turns out to have been generous to the design.
  - **Nothing else in the exports was overridden.** Every other difference found in the census was a theme error and is fixed in T-2.17, T-2.18 and T-2.19.

#### T-2.16 — Design system review gate — ✅ **DONE 2026-08-10** · ✅ **GATE CLOSED 2026-08-10 — signed by the project owner**
- **Objective:** Sign-off before any page consumes the system.
- **Files affected:** `/docs/DESIGN-SYSTEM.md` (new), plus the one defect the audit found: `src/views/components/ui/input.twig`, `04-components/forms.scss`
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.01 → T-2.15
- **Acceptance criteria:** Every component demonstrated in all nine states. Contrast validated. Keyboard pass completed. Doc 17 Phase 2 checklist signed.
- **Complexity:** S
- **What was done:**
  - **"Demonstrated" could not mean a styleguide page, and that is OP-3 again rather than a shortcut.** Salla's page set is fixed, so `pages/styleguide/index.twig` would never be rendered by anything. The demonstration is therefore a matrix in which **every cell names the selector or attribute that implements it and the file it lives in**, and every ✅ was verified by reading that file rather than by trusting the task note that claimed it.
  - **The audit found one real defect and fixed it.** `.choice--disabled` had existed since T-2.08; the field had no disabled treatment at all, and `input.twig` had no `disabled` parameter — so the state was **unreachable**, not merely unstyled, on the control most likely to need it. The fix is deliberately the *same two declarations* as `.choice--disabled`: doc 04 asks for the state to be implemented consistently, no artboard draws a disabled field, and copying an existing answer beats inventing a design.
  - **The native attribute, where the button uses `aria-disabled`, and the difference is principled.** A disabled button must refuse activation while staying reachable and announced; a disabled **field** must additionally not submit its value, which only the attribute carries.
  - **Six more findings are recorded rather than quietly resolved.** No form control has a *success* state (doc 04 asks for one, no artboard draws one — **the one open question that touches the system rather than a page**); none has a hover state, deliberately; a card has no pressed state; the nine states cannot be shown live; **the focus ring cannot cross into a `salla-*` shadow root**, which is a system-level limit carried to every task adopting one; and `.btn`'s hover dims the whole button rather than changing a token.
  - **One section of the review is machine-enforced rather than asserted.** All 36 remaining raw-hex occurrences are in upstream files the theme has never adopted; **no theme-authored stylesheet contains one**, and the T-1.07 ratchet makes that a build failure rather than a promise.
  - **Four of doc 17's five Phase 2 lines are signed.** The fifth — "component inventory approved" — is the owner's signature and is prepared for, not forged.
- **Signed and closed 2026-08-10 by the project owner.** The fifth line is now ✅ in `/docs/DESIGN-SYSTEM.md` §7. **The gate is closed and the task carries nothing forward.** The document changes role rather than ending: it is the record later tasks read for what a component already is (§1), what state it already has (§2) and what limit not to rediscover (§6) — and any change to the system after this date changes the document with it. The signature approves the **inventory**; it does not approve what §8 says the gate never claimed — no browser, no screen reader, no device was run, and those remain T-8.06, T-8.09 and T-8.11.
  - **The gate states what it is not.** No browser, no screen reader and no device was run; that is T-8.06, T-8.09 and T-8.11. It reviews the system, not the pages built ahead of it.

---

## Phase 3 — Core Layout

#### T-3.01 — Master layout override — ✅ **DONE 2026-08-08** (built out of order at the owner's instruction: three shipped settings were inert without it)
- **Objective:** Document shell, meta, asset loading order.
- **Files affected:** `src/views/layouts/master.twig`
- **Twilight components:** `master.twig`, `salla-metadata` — technique A
- **New components:** none · **New sections:** none · **Dynamic data:** store config, locale · **Theme settings:** none
- **Dependencies:** T-1.04, T-2.16
- **Acceptance criteria:** One `<h1>` per page enforced by template contract. Landmarks present. Critical CSS inlined, rest deferred. Upstream hooks preserved so Salla injects correctly. **Carried from T-1.05:** the `<noscript>` block at `master.twig:104-106` is the theme's only hard-coded user-facing string — English prose shown to an Arabic-first audience. Move it to `theme.*` in `src/locales/`. It was left in place rather than fixed earlier because this task is the one that shadows the file. **Carried from T-1.04:** line 53 already emits `lang` and `dir` correctly from the platform; preserve it exactly when copying the file down. **Carried from T-2.05:** the `<body>` class list must also emit **`button-style-{{ theme.settings.get('button_style') }}`**, or the merchant's corner-shape choice stays inert. **Carried from T-2.01:** the `:root` block that already emits `--color-primary` must also emit **`--color-brand-secondary: {{ theme.settings.get('secondary_color') }}`** — a theme setting can only reach CSS through a template, and `global.scss` holds only the default until this lands. The cascade works because this inline `<style>` loads after `app.css`, which was verified rather than assumed.
- **Complexity:** M
- **What was done:**
  - **Three shipped features stopped being inert, which is why this was taken before T-2.16.** `button_style` was complete and validated in T-2.05 and changed nothing on the page; `secondary_color` was a token with no path to CSS; the `<noscript>` copy was the theme's only hard-coded string. **A theme setting reaches CSS only through a template**, and this is the template. The delta is three lines of output and a great deal of comment.
  - **`--color-brand-secondary` is emitted only when the merchant has set it, and no hex is written here.** The obvious version — `theme.settings.get('secondary_color', '#F9E6E7')` — puts a raw hex outside the token layer, which the coding rules forbid, and gives one colour two homes to drift between. Wrapped in `{% if %}` instead, so `global.scss` keeps the default and this line only ever carries the merchant's own value.
  - **The `<h1>` criterion was met by *not* adding one, and the first attempt was the defect.** A visually-hidden fallback `<h1>` was written into `<main>` and then removed: `header.twig` already emits the store name as `<h1>` on Home and `<h2>` elsewhere — upstream's rule, preserved by T-3.04 — and **every existing page template already has its own `<h1>`**, verified one by one. A layout-level default lands on top of both, turning a contract meant to guarantee one heading into a machine for producing two. **A layout cannot count the headings a page renders**, so what shipped is the rule stated where a page author will read it, plus the verification, plus the three pages that must add one: T-4.19, T-4.20, T-7.11.
  - **Landmarks were audited rather than added.** `<header>`, `<main id="main-content" role="main">` and `<footer>` are all present and all outside each other; the skip link is the first focusable element and already targets `#main-content`. Nothing needed changing, which is worth recording so the next reader does not go looking.
  - **"Critical CSS inlined, rest deferred" is the one criterion not met, and it is carried rather than fudged.** The theme ships **one** 92 KB stylesheet, so there is nothing to defer without an extraction step in the build. The two other render-blocking sheets are the platform's font CSS, which first paint genuinely needs, and the icon font — whose glyphs are sized by the type scale, so a late arrival reflows the controls around them, trading a CLS requirement for a paint one. A preconnect was considered and rejected: `theme.font.path` is documented as resolving to the **store's own domain**, so the CDN host is a guess, and a guessed origin hint is an invention with no measurable payoff. **Carried to T-8.01**, which already owns `app.css` being above its budget target — splitting the sheet and deferring the remainder are one job, not two.
  - **All six hooks preserved and listed in the file.** `head:start`, `head`, `head:end`, `body:classes`, `body:start`, `body:end`. A missing hook fails **silently on a live store**, so they are enumerated in the comment rather than left to be noticed.

#### T-3.02 — Customer layout override — ✅ **DONE 2026-08-10**
- **Files affected:** `src/views/layouts/customer.twig`, `src/assets/styles/04-components/customer-layout.scss` (new), `app.scss`, `src/views/pages/customer/profile.twig`, `src/views/components/ui/empty-state.twig`, `src/locales/{ar,en}.json`
- **Objective:** Shell for account-area pages.
- **Twilight components:** `customer.twig` — technique A
- **New components:** none · **New sections:** none · **Dynamic data:** customer session · **Theme settings:** none
- **Dependencies:** T-3.01
- **Acceptance criteria:** Consistent navigation across all customer pages (doc 06 principle). Unauthenticated access redirects correctly.
- **Complexity:** S
- **What was done:**
  - **Five artboards draw the identical shell, to the pixel, and that is the whole layout.** `My Account`, `Notifications`, `Orders In Progress`, `Loyalty Points` and `Favorites` all put the header's end at 186, a breadcrumb row at `x16..377` from 218 to 274 — **56 tall** — a 1px `#646361` rule along its bottom edge as the same path in all five files, and the page's own first card at **306**. So: 32 above the row, 32 below its rule, 24 between cards. Four declarations, every number measured.
  - **The gradient band and the sidebar are gone, and no upstream stylesheet was edited to remove them.** Their rules hang off `.profile-header`, `.gradient-bg` and `.sidebar`, so dropping the classes stops them applying — `02-generic/common.scss` and `04-components/user-pages.scss` stay byte-identical to upstream and reconcilable.
  - **The sidebar's removal is B4, and it costs nothing.** It was `hidden lg:block`: an element absent from the mobile design that appeared only above it, which is precisely what B4 forbids. **The `salla-user-menu` it carried is already in T-3.04's header** — the same component, on every page rather than only these — so "consistent navigation across all customer pages" is *more* true after this task than before it.
  - **The `<h1>` stays and loses only its pixels.** No account artboard draws a page heading; the breadcrumb's last item carries the name. A page with no `h1` is poor for both SEO and screen-reader navigation, so it is `sr-only` — the same trade T-7.07 made with `title_hidden`. `orders/single.twig` already overrides `inner_title` with a visible one and is unaffected.
  - **"Unauthenticated access redirects correctly" is answered by a net rather than a redirect, because a Twig layout cannot redirect and reimplementing auth is forbidden.** What the theme can guarantee is that account markup is never rendered without an account: the guard is `user.type == 'user'`, **upstream's own logged-in test** — `loyalty.twig` and `orders/single.twig` both branch on it — and the guest branch shows T-2.14's empty state with a sign-in action that dispatches `login::open`, the event `salla-add-product-button` already uses. If the platform always redirects, the branch never renders and costs nothing; if it ever does not, the page is a way in rather than an empty shell.
  - **The avatar uploader moved into `profile.twig`, and only moved.** It sat in the layout behind `{% if is_page('customer.profile') %}` — page content in a shell, gated on which page the shell was wrapping — and the sidebar it lived in is gone. Its markup is upstream's, unchanged; **sizing it to the artboard's 99px circle and putting it inside the card belong to T-5.04**, which owns that page.
  - **`empty-state` gained `action_attrs`.** Its action was a link or nothing; the sign-in prompt goes nowhere and *does* something. One parameter, forwarded to T-2.11's button `attrs`, and the component now covers both kinds.

#### T-3.03 — Announcement marquee bar — ✅ **DONE 2026-08-08** · ✅ **EXTENDED 2026-08-08: two positions, each with its own switch**
- **Objective:** Scrolling promotional bar above the hero.
- **Files affected:** `src/views/components/announcement-bar.twig` (new), `src/assets/styles/04-components/announcement.scss` (new)
- **Twilight components:** none
- **New components:** marquee · **New sections:** registered in `twilight.json`
- **Dynamic data:** announcement text — **resolved 2026-08-05: a theme setting**, per the configurability principle. Not CMS, not hard-coded.
- **Theme settings:** `announcement_text`, enable toggle
- **Dependencies:** T-3.01, T-0.05
- **Acceptance criteria:** **Carried from T-3.04:** the overlay header is absolutely positioned and reads `--header-offset` (default 0) to decide where its top edge lands. **This task must set that variable to the marquee's height**, or the header will sit on top of the marquee on Home instead of below it. Text comes from the `announcement_text` setting and the bar has an enable toggle — a merchant can change or disable it without a developer. Nothing is written into the Twig. Animation pauses on hover and stops entirely under reduced-motion. Content readable by screen readers without repetition. RTL scroll direction correct. No CLS on load.
- **Complexity:** M
- **What was done:**
  - **It is not a registered section, and that is the one line of this entry not followed.** A registered `home.*` component renders inside `<main>`, **below** the header; the artboard puts this bar **above** it. Registering it would have put it in the wrong half of the page to gain an ordering control with exactly one correct answer. Theme settings instead — which is also what B6's ruling literally says.
  - **Home-only, on the same condition as the overlay header**, so the two cannot disagree. The bar appears above the header on both Home artboards and on no other artboard; Offers and the brand page open straight onto a cover image.
  - **The `--header-offset` hook T-3.04 left is now filled**, by `body:has(.announcement-bar)` reading the `--announcement-height` this stylesheet publishes. No script, and no coupling in either direction.
  - **The global reduced-motion clamp would have BLANKED this bar, not calmed it** — the single most useful thing learned here. T-2.03's clamp collapses animations to 0.01ms with one iteration, which for most means "finish instantly and settle". **A marquee's end state is the text translated fully off-screen.** An explicit `animation: none` keeps the content where it started: **stopping is not the same as finishing.**
  - **Read once, scrolled twice.** A seamless marquee needs its content duplicated — the copy fills the gap the first leaves as it exits — so the duplicate is `aria-hidden` and a screen reader reads the announcement exactly once. It is deliberately **not** a live region: the text does not change, it merely moves, and announcing it on a timer would interrupt the reader repeatedly for no new information.
  - **Pause on hover *and* focus-within.** Hover alone meets the criterion's letter and leaves out everyone navigating by keyboard, who cannot hover at all.
  - **RTL needed a mirrored keyframe, not a sign trick.** `transform` has no logical equivalent, so `[dir="rtl"]` selects a second keyframe; otherwise the text would enter from the left and exit right, backwards for the reading direction. −50% and not −100% because the track holds the text twice, so the loop point is invisible.
  - **Zero CLS by a fixed height** — the bar must occupy its space before the font loads, or everything under it moves when it does.
- **Scope extension, ruled 2026-08-08 by the project owner.** T-4.08's third-pass audit found the bar **drawn twice** on `Home Page (No Scroll).pdf`: above the header, and again **between the partner banner and the footer**, carrying the top bar's own copy at a different animation offset. The first pass built the upper instance only. **This task now supports two positions, each with its own enable switch**, so a merchant can run either, both, or neither.
- **Added acceptance criteria:** **One component, two placements** — a second marquee implementation is a defect, as it would be for the hotspot. **Two independent toggles**, `announcement_enabled` for the top and a new setting for the bottom, over **one shared text setting**: the artboard shows the same content in both bars, and two text fields would invite them to drift apart. **`--header-offset` must react to the top bar only** — the lower bar is below `<main>` and must never displace the header. **The screen reader still reads the announcement once per bar and not four times**: each bar already duplicates its own track for the seamless loop and hides the copy, and a second bar must not undo that arithmetic.
- **What the extension did:**
  - **One component with a `position` parameter**, `top` or `bottom` — a second marquee implementation would be the same defect a second hotspot would be. The upper bar is included from `header.twig` as before; the lower one from `master.twig`, between `</main>` and the footer.
  - **It is in `master.twig` and not `footer.twig` on purpose.** The artboard draws it *outside* the footer, and a merchant turning the bar off should not be editing a footer template's business.
  - **Home-only, on the same `is_page('index')` the upper bar and the overlay header already use**, so the three cannot disagree. No other artboard draws a marquee above its footer.
  - **`--header-offset` now keys on `.announcement-bar--top`, and that change is load-bearing.** The old selector was `body:has(.announcement-bar)`; with a second bar in the document it would have pushed the header down by 2.5rem on a store running only the *bottom* bar — an offset for a bar that is not above anything.
  - **Repetition arrived by a new route, and is closed at the source.** One bar reads its announcement once, because the duplicate track is `aria-hidden`. Two bars read the same sentence twice on one page, which is the same criterion failing differently. **The lower bar is `aria-hidden` when the upper one is on, and only then** — a merchant running only the lower bar has one announcement on the page and it must still be readable. Hiding it unconditionally would delete information rather than de-duplicate it.
  - **One text, two switches.** Placement is independent; copy is not. Two text fields would have invited the bars to drift apart, which the artboard shows they do not.

#### T-3.04 — Header, transparent-over-hero — ✅ **DONE 2026-08-08**
- **Objective:** Overlay header: avatar, cart badge, wordmark, search, burger.
- **Files affected:** `src/views/components/header/header.twig`, `src/assets/styles/04-components/store-header.scss` (new — **not** upstream's `header.scss`, see below)
- **Twilight components:** `header.twig` — technique A; `salla-menu`
- **New components:** none · **New sections:** none
- **Dynamic data:** cart count, customer avatar, menus
- **Theme settings:** `logo`
- **Dependencies:** T-3.03
- **Acceptance criteria:** White-on-image contrast meets 4.5:1 against the darkest and lightest hero frames, or a scrim is applied. Cart count announced as it changes. Skip link precedes it. Works when hero is absent.
- **Complexity:** L
- **What was done:**
  - **Built out of order at the owner's instruction, and nothing was owed to the tasks skipped.** T-3.03 and T-3.01 are still open. The skip link works because `master.twig` already gives `<main>` the id `main-content` and already includes the header first; the missing marquee is handled by a `--header-offset` hook T-3.03 will set. **T-3.01 still owes the `button_style` body class and `--color-brand-secondary`** — unchanged by this.
  - **One row, not two — and the removal has a carry attached.** Upstream's top navbar holds the footer menu, the language/currency switcher, the store scope and an inline search field, and **no artboard draws any of it.** It is removed. **`salla-localization-modal` and `salla-contacts` are carried to T-3.06**, which owns the burger menu: a multilingual store left with no switcher anywhere would be a regression, so T-3.06 must not close without them.
  - **The scrim is required by the criterion's own wording, and its strength is derived.** Hero images are merchant-supplied, so "the lightest frame" is white until proven otherwise, and white-on-white is 1:1. Against a white image, **60% black composites to 5.74:1 and 45% to 4.72:1**; the gradient runs 60% → 45% across the top two-thirds of its box, which is where the bar sits. Worst case under the controls is **4.72:1**. Against a dark image it only helps.
  - **A second logo setting, because one logo cannot be both white and dark.** The design draws the wordmark white over the hero and dark on the scrolled bar; Salla carries exactly one `store.logo`. `logo_light` falls back to it when empty. The rejected alternative was a `brightness(0) invert(1)` filter, which **silently destroys any logo that is not monochrome** — a developer's trick where a merchant setting belongs.
  - **The cart count announces with no new script.** `app.js` already writes the count into every `[data-cart-count]` on the page; putting one inside a `role="status"` region is all that was missing, because a text change inside a live region is what triggers the announcement. **The number comes last** — «السلة: ٣» — since «٣ منتجات» would need Arabic's six plural forms and `trans()` cannot select between them.
  - **Upstream's `header.scss` is not shadowed, and that was checked rather than assumed.** It styles `.top-navbar` and `.main-nav-container` and **never `.store-header`**, so the design's header went into a new file and 294 upstream lines were left alone.
  - **The wordmark is centred on the page by a `1fr auto 1fr` grid, not by `justify-between`.** With two groups of unequal width a flex row drifts the logo by half the difference — and that difference changes the moment a cart badge appears.
  - **Known rough edge, recorded rather than papered over:** the overlay state is chosen by `is_page('index')`, which is a proxy for "there is a hero". A Home page with the hero section disabled shows a dark gradient band with nothing behind it. **Carried to T-4.08**, the first place the hero's presence is knowable.

#### T-3.05 — Sticky header on scroll — ✅ **DONE 2026-08-08**
- **Objective:** The `Home_Page__Scroll_` and PDP on-scroll states.
- **Files affected:** `src/assets/js/partials/sticky-header.js` (new), header SCSS
- **Twilight components:** header · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-3.04
- **Acceptance criteria:** **Carried from T-3.04:** both header states already exist as `.store-header--overlay` and `.store-header--solid`, and the solid one is styled to the scrolled artboard. This task swaps the class; it should not restyle either. Transition driven by `IntersectionObserver`, not scroll listeners. No layout shift at the transition point. Reduced-motion honoured. Focus order unchanged when state flips.
- **Complexity:** M
- **What was done:**
  - **Two mechanisms, because there are two starting positions — not because there are two designs.** Everywhere except Home the header is in normal flow, and `position: sticky` is the entire implementation: it pins at the top and **keeps its space in the flow it came from**, so "no layout shift at the transition point" is met by there being no transition to shift at, and no script runs at all. Home's header is `absolute` over the hero, which `sticky` cannot rescue, so that is where the observer lives.
  - **The trigger is a zero-height sentinel rendered at the header's own top edge.** Because the overlay header sits at `--header-offset` and the sentinel is emitted at that same point in the flow, "the sentinel has left the viewport" and "the header would have scrolled away" are the same event — **no measurement, no magic number, and no scroll listener**, which is the criterion.
  - **`absolute` → `fixed` is out-of-flow to out-of-flow**, so nothing below the header learns that anything happened. This is the reason the two states were worth keeping distinct rather than making every header sticky.
  - **Neither state was restyled, as instructed.** `--stuck` carries `position`, the inline offsets and a `z-index`. No colour, no background, no radius: the stuck header looks solid because **it is** the solid state — the script exchanges T-3.04's own two classes.
  - **One transition was added and it is colour only.** Going from white-on-photograph to ink-on-warm in a single frame reads as a flicker at the moment a reader is looking at the header. The timing comes from the T-2.03 tokens, **so reduced motion is handled at the token layer and no media query appears in this component** — the contract working as designed. Geometry is deliberately not transitioned; that would reintroduce the movement the no-shift criterion exists to prevent.
  - **Upstream's `initiateStickyMenu()` is not duplicated, because it is already dead.** It targets `#mainnav` — the two-row header T-3.04 removed — and returns at its own guard. It is also a `scroll` listener, which this criterion rules out. Left untouched in `app.js` rather than deleted: removing it means adopting that file under the lint ratchet, and it costs nothing where it is.
  - **`header_is_sticky` gates both paths.** It is upstream's own setting and it was already registered; with it off, no sentinel is rendered and no `--sticky` class is emitted, so neither mechanism exists rather than existing and being suppressed.
  - **Found while checking this against the artboard, and NOT fixed here: the scrolled header is drawn as a floating rounded bar inset from all three edges, and `.store-header--solid` is a full-bleed band.** That is T-3.04's appearance, not this task's, and this task was told in writing not to restyle either state. **It is the same finding as OP-5** — the artboards put warm panels on a white page and the theme does the reverse — and it is recorded there rather than patched here.

#### T-3.06 — Navigation menu — ✅ **DONE 2026-08-10**
- **Objective:** Burger-triggered menu.
- **Files affected:** `src/assets/js/partials/main-menu.js`, `src/assets/styles/04-components/menus.scss`
- **Twilight components:** `salla-menu`, `main-menu.js` — technique C then B
- **New components:** none · **New sections:** none
- **Dynamic data:** store menus · **Theme settings:** `menu-images` feature
- **Dependencies:** T-3.04, T-2.10
- **Acceptance criteria:** Full keyboard operation. Focus trapped when open, returned on close. Submenu state exposed via `aria-expanded`. RTL slide direction correct. **Carried from T-3.04:** the header lost upstream's top navbar, because no artboard draws it — and with it went **`salla-localization-modal` and `salla-contacts`**. Both are functionality, not decoration. **This menu is where they belong and this task must not close without them**; a multilingual store with no switcher anywhere is a regression, not a simplification.
- **Complexity:** M
- **What was done:**
  - **This was a regression fix before it was a feature, and the regression was total.** T-3.04 replaced `header.twig`, and `<custom-main-menu>` went with upstream's markup. The burger has pointed at `#mobile-menu` — **an id nothing has emitted since** — so it navigated nowhere, and `app.js`'s `isElementLoaded('#mobile-menu')` has been polling for that id **every 160ms, forever**. The store has had no navigation menu at all for two days. A second forever-timer sat beside it, polling every 100ms for `#more-menu-dropdown`.
  - **mmenu-light was evaluated first, as the entry's "technique C then B" requires, and it fails three of the four criteria with no path to any of them.** Its bundle contains **zero** occurrences of `aria`, `focus`, `keydown` and `tabindex` — counted, not assumed. Focus is neither trapped nor returned, submenus expose no state, and none of that is CSS-reachable. **T-2.10 already does all three**, which is why this task depends on it, and "RTL slide direction correct" stops being a question when the panel rises from the bottom rather than from a side.
  - **The desktop menu bar is gone, under B4.** The 393pt design has a burger and no bar; the ruling's forbidden list is explicit that no element absent from mobile may appear at a larger breakpoint. Same reasoning as the top navbar in T-3.04 and the account sidebar in T-3.02. **One navigation at every width**, in a sheet that becomes a centred dialog above tablet. The hover dropdowns, the mega-menu, the runtime overflow measurement, the resize handler and `changeMenuDirection()` went with it.
  - **Every item with children is a real disclosure.** `<button aria-expanded>` plus `aria-controls`, and the closed list is `hidden` — **not merely invisible**, because a collapsed list that stays tabbable is the commonest keyboard trap in a navigation menu. The parent's own page stays reachable through «عرض الكل», first in the sublist. One delegated listener serves every depth.
  - **The two carried elements are back, and a third that was about to be lost with them.** `salla-localization-modal show-trigger` and `salla-contacts` are in the sheet, gated exactly as upstream gated them. **`store.scope` is the third:** T-3.04 did not carry it, `salla-scopes` is still rendered by `master.twig`, and its only trigger lived in the navbar — so a store with branches had no way to open it unless the scope was a mandatory popup. One button, dispatching the event upstream dispatched. **`salla-menu source="footer" topnav` is deliberately not restored:** it repeats the «روابط مهمة» column the footer already renders on every page.
  - **Three merchant switches that configured deleted features were removed.** `enable_more_menu` configured the desktop overflow this task deleted; `topnav_is_dark` and `important_links` configured the top navbar **T-3.04 deleted and left them behind**, the second with no reader in `src/` at all. A dead switch in the customiser is a promise to the merchant that nothing keeps.
  - **`app.js` was adopted, and the cost was paid rather than dodged.** Removing mmenu means editing the file the T-1.07 ratchet had made expensive, so its sixteen problems are fixed: thirteen `prefer-const`, one needless escape, and **`header_is_sticky` read as a bare global** — an implicit dependency on `master.twig` and a `ReferenceError` the day it is not emitted. It is `window.header_is_sticky` now.
  - **Measured, not asserted: `firstLoadJs` fell 37.3 KB → 35.2 KB gzipped and `app.css` 94.9 KB → 94.3 KB**, from dropping the mmenu library and its stylesheet.
  - **The 250-line `menus.scss` was not touched.** The new markup emits neither `.main-menu` nor `.sub-menu`, so not one of its rules applies any more and none had to be deleted — the same outcome T-3.02 got by dropping `.profile-header`.

#### T-3.07 — Floating Menu component — ✅ **DONE 2026-08-10**
- **Objective:** The overlay menu appearing on Favorites, Account and Tracking screens.
- **Files affected:** `src/assets/styles/04-components/floating-menu.scss` (new), `src/assets/js/partials/floating-menu.js` (new), `tailwind.config.js`, `app.scss`, `webpack.config.js` — **no `.twig`**, see below
- **Twilight components:** `salla-user-menu` — technique C, **and the entry's "none" is superseded**
- **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-2.10
- **Acceptance criteria:** Single implementation serves all three screens. Focus management shared with the sheet primitive. Dismisses on outside click and `Esc`.
- **Complexity:** M
- **What was done:**
  - **The component already existed and was already on the page, so no new one was built.** The entry names `components/ui/floating-menu.twig` and "Twilight components: none"; Salla ships `salla-user-menu`, T-3.04 put it in the header, and CLAUDE.md's rule is to check for an existing component first. **A second implementation would have broken the criterion it was meant to satisfy** — "single implementation serves all three screens" is what the header already provides, on every page rather than on three.
  - **It had no styles at all, which is the defect this task actually found.** `salla-user-menu.entry.js` ends with `sallaUserMenuCss = ""` — **the component ships none** — and no `s-user-menu-*` selector appeared anywhere in this theme. Since T-3.04, opening the avatar menu has dropped an unstyled list into the page. There was no specificity to fight for the same reason: there was nothing to out-specify.
  - **The keyboard could not reach it at all.** The trigger is rendered as a plain `<div id="trigger-slot">` carrying `onClick` **and `onKeyUp`** — with no `tabindex`, so a `<div>` that never receives focus, and **a keyboard handler that was unreachable code**. A role, a tab stop and Space are what make the handler the component already ships do its job. `salla-user-menu.entry.js` contains zero occurrences of `aria-`, `keydown`, `Escape` and `focus`; all four were counted before anything was written.
  - **Measured from `My Account Page - Floating Menu.svg`, with four more artboards agreeing:** panel `191×252 rx16 #FDFDFD`, a `19×9` caret pointing at the trigger, rows 38 tall, the current one filled `#F7F6F4` **full-bleed**, the sign-out row in `#C20013`, shadow `0 8px 28px` at 6% — the toast's mirror — and **no scrim.**
  - **"Focus management shared with the sheet primitive" is honoured in the half that is right here, and the other half is refused with a reason.** T-2.10 traps focus because `showModal()` makes the document inert; **this menu is not modal** — the artboards draw no scrim and the page stays live — so trapping would be a keyboard trap under WCAG 2.1.2. What is shared: focus moves in on open, returns to the trigger on close, `Esc` closes. Tab moving out and closing is the WAI-ARIA menu-button pattern.
  - **Closing is done through the component's own control, not by reaching into its state.** `opened` is Stencil state and cannot be set from outside; the panel's close button sets it, so `Esc` clicks that, and falls back to the outside click the component already listens for.
  - **The highlighted row is ambiguous in the artboard and all three readings are served.** A static mockup cannot say whether a filled row means hover, focus or current page, so hover, `:focus-visible` and `[aria-current="page"]` take the same fill — true to the drawing under any reading, and adding no appearance the design does not contain. `aria-current` is set by matching each link's path, because the fill alone says nothing to a screen reader.
  - **Two measured values were deliberately not reproduced.** The artboard's panel overlaps its own avatar by 16px and puts the caret 26px off the avatar's axis. **A menu that covers its trigger hides the control that closes it**, so the panel hangs below and the caret is centred on it. Rows are 44px against a measured 38 — the standing T-2.20 deviation.

#### T-3.08 — Footer — ✅ **DONE 2026-08-08**
- **Objective:** Wordmark, two-column links, six social pills, Maroof badge, six payment marks.
- **✅ The «six social pills» question is CLOSED 2026-08-10 by the project owner — AC-7.** The row is whatever `salla-social` provides: no mail pill invented, WhatsApp not put back. The artboard's six are illustrative accounts, not a contract about supported networks, and which appear is the merchant's from the Salla dashboard. Raised by T-3.09, carried by T-3.11, answered here.
- **Files affected:** `src/views/components/footer/footer.twig`, `src/assets/styles/04-components/footer.scss`
- **Twilight components:** `footer.twig` — technique A; `salla-contacts`
- **New components:** none · **New sections:** none
- **Dynamic data:** footer menu, social links, store info
- **Theme settings:** `social_links`, `footer_menu`
- **Dependencies:** T-3.01, T-2.04
- **Acceptance criteria:** Links from store menus, not hard-coded. Social icons labelled. Expands to multi-column above tablet per doc 10.
- **Complexity:** M
- **What was done:**
  - **OP-2 is closed, and it was made moot rather than answered.** The «روابط مهمة» column is `salla-menu source="footer"`, so whether «المدونة» appears is **the merchant's own footer menu in the dashboard**. The theme neither adds the link nor removes it and **nothing in `src/` references `blog_link`** — which satisfies readings 1 and 2 at once. Only reading 3, pointing the link at the Stories feed, still wants an owner ruling, and that is a dashboard edit rather than code.
  - **Upstream's stylesheet was adopted, and this is the first time that was the cheaper option.** T-4.01, T-3.04, T-4.03 and T-4.21 all left an upstream stylesheet alone because it styled classes the design no longer uses. `footer.scss` styles `.store-footer` **itself**, in 48 lines, so a new file would have left one element half-styled from two places.
  - **The dark slab is gone.** Upstream paints `bg-darker` with white text and a second `bg-dark` panel; the artboard's footer is the warm page tone with ink text, reading as the end of the page rather than a separate region. **Loose end, recorded rather than hidden: `footer_is_dark` is still a registered setting and now has nothing to switch.** Removing it is a merchant-facing change this task was not asked to make.
  - **Two things dropped, two kept, on one test — is the information orphaned?** `salla-apps-icons` and `salla-contacts` are dropped: the artboard draws neither and their data has other homes, the T-3.10 WhatsApp FAB and Salla's contact page. **The VAT number is kept because a tax disclosure has no other home in this theme**, and the copyright hook is kept because the platform injects it.
  - **The links are `column-count: 2`, not a grid.** The artboard draws two columns of six, but a merchant's menu can hold any number and a grid leaves a ragged final row on an odd count. Columns balance themselves, so the drawn shape survives a menu the artboard never anticipated.
  - **The social pills use `--border-interactive`.** They are controls whose boundary is the affordance — the distinction the T-2.01 contrast table exists to enforce — so the 1.10:1 subtle token would be a 1.4.11 failure here. `salla-social` still labels its own links and still decides which networks exist.
  - **Multi-column above tablet is B4's fourth permitted move**, and the only structural change made: nothing added, nothing reordered, nothing hidden that exists on mobile.

#### T-3.09 — Payment and trust marks — ✅ **DONE 2026-08-10** (unblocked 2026-08-05, B9 closed)
- **Objective:** Tabby, Google Pay, Apple Pay, Visa, Mastercard, mada, Maroof.
- **Files affected:** `src/views/components/footer/footer.twig`, `src/assets/styles/04-components/footer.scss`, `src/locales/{ar,en}.json` — **`src/assets/images/` is untouched, which is the point**
- **Twilight components:** `salla-payments` — technique C, plus its own `payment`, `sbc` and `cod` slots
- **New components:** none · **New sections:** none
- **Dynamic data:** enabled payment methods via `salla-payments` and store data — **confirmed 2026-08-05**
- **Theme settings:** none — everything here is platform-driven, which the entry allowed for
- **Dependencies:** T-3.08, T-0.05
- **Acceptance criteria:** Marks are consumed from `salla-payments` and store data — **no bundled image strip**, which is what closes the usage-rights question: the theme never ships third-party marks. Marks reflect actually-enabled methods. Maroof badge links to the real registration.
- **Complexity:** S
- **What was done:**
  - **The badge this entry calls Maroof is not Maroof, and the export is what settles it.** `Home Page (No Scroll).svg` draws the **Saudi Business Center** mark with «موثق في منصة الأعمال» beside it, between the social row and the payment marks. **Maroof appears nowhere in the SDK** — grep across `@salla.sa/*` returns nothing — and exists only as a `store.social` key. SBC is a different registry with a different mark, and the two were conflated when the objective line was written.
  - **"Links to the real registration" was already true, and re-implementing it would have been the defect.** `salla-payments` gates the badge on `store.settings.certificate.id` and wraps it in `<a target="_blank" href="https://eauthenticate.saudibusiness.gov.sa/certificate-details/{id}">` — the government verification page, built from the store's own certificate id. The theme adds the caption the artboard draws and **does not touch the href.**
  - **"Marks reflect actually-enabled methods" is the component's `salla.config.get('store.settings.payments')`** — read from its source, not assumed. The row is six marks or two, and no list of methods appears anywhere in this theme.
  - **B9 holds by inspection: `src/assets/images/` contains `check.svg`, `delivery-bro.svg` and four placeholders, and not one third-party mark.** Every logo is fetched from Salla's CDN at 58×58 by the component.
  - **Measured from the SVG, and every value landed on something the theme already had.** Pill `43.83×35 rx7.5` → `w-11 h-9 rounded-lg` (44×36, 8px); fill `#FFFFFF` → `--surface-card`; border `#EDEBE8` → `--border-subtle`; gap `13` → `gap-3`; logo box `40.16×28` → `p-1` with `object-contain`, 28px tall to the pixel. **The artboard's own first pill is drawn `44.83×36 rx8`, so 44×36 rx8 is one of its values rather than a rounding of them.** No token was added.
  - **The border is `--border-subtle` where the social pills directly above use `--border-interactive`, and that inversion is the same rule applied twice.** A social pill is a link and its boundary is the affordance; a payment mark is a static image, and giving it a control's border promises a press that never happens.
  - **The badge is moved with `order`, not with JavaScript.** The component appends SBC **after** the payments loop; the artboard puts it **above** them. `order-first` and `basis-full` on the item reorder it visually without owning the render — which is the entire reason technique C was preferred. `salla-payments` registers with encapsulation flag `0`, so its light DOM is reachable from a stylesheet; that was checked in the bundle before the approach was chosen.
  - **⚠ A trap in the slot mechanism was found by reading it and then proved.** The component finishes with `el.replaceWith(el.firstChild)` — `firstChild`, **not** `firstElementChild`. A newline after `<template slot="…">` makes the first child a whitespace text node, so the wrapper is replaced by that text and **the mark is silently dropped**. Upstream's own defaults are single-line strings and never meet it. Demonstrated both ways in jsdom against the real file: indented → zero `<li>` rendered; same-line → three. **⚠️ Not committed** — run before T-1.09 existed; see T-1.09. The `<li>` now opens on the `<template>` line with a comment saying why, because this is the kind of thing a tidy-up reformat destroys.
  - **The default item's `width="100%" height="100%"` are not valid `<img>` dimensions**, so nothing was reserved and the marks could shift on load. All three slots now declare the CDN's real `58×58`. The fixed pill already reserved the box, so this is the HTML being made honest rather than a visible fix.
  - **One deviation, forced by the data and recorded.** The artboard's seventh mark is a `100.67`-wide pill on a second row, because the designer placed a wide logo in it. `salla-payments` serves **every** mark from the same 58×58 square, so a per-mark width could only come from a hard-coded slug→width map — which CLAUDE.md forbids outright and which breaks the first time a merchant enables a method the map has not heard of. Uniform pills, centred and wrapping, is what the platform's data actually draws.
  - **`salla-trust-badges` was mislabelled by T-3.08 and the comment is corrected here.** It carries **no Maroof**: it renders the commercial register number, or the freelance document number when there is no commercial one. It is kept because for `store_country === 'SA'` the component **forces its own visibility as a legal requirement**, and because the artboard draws no register number — so nothing here contradicts a design that is silent on it.
  - **`alt` stays the method slug.** It is the only per-mark identity the platform exposes, and a slug→name map goes stale the day Salla adds a method. The list carries `role="group"` and a translated name instead — the role because a bare `aria-label` on a roleless custom element is not reliably exposed.

- **🚩 Found here, NOT fixed here, and it belongs to T-3.08.** `salla-social` builds its icons from `iconsList = { instagram, twitter, facebook, youtube, snapchat, tiktok }` but filters `store.social` only for `whatsapp`. `store.social` also carries **`pinterest` and `maroof`**, so for either one the component renders `<span class="s-social-icon">undefined</span>` — **the literal word "undefined" inside a footer pill**, on any store that fills in a Maroof link. The artboard's own six pills are mail, WhatsApp, TikTok, X, Snapchat and Instagram, which **is not the set `salla-social` can produce** — it drops WhatsApp, has no mail, and adds Facebook, Pinterest and Maroof. Fixing that means deciding the whole social row's composition, which is T-3.08's «six social pills», not this task's. **Raised rather than folded in, per CLAUDE.md.**

#### T-3.10 — Floating WhatsApp button — ✅ **DONE 2026-08-08**
- **Objective:** Persistent contact affordance.
- **Files affected:** `src/views/components/ui/whatsapp-fab.twig` (new)
- **Twilight components:** `salla-contacts`
- **New components:** FAB · **New sections:** none
- **Dynamic data:** store WhatsApp number · **Theme settings:** enable toggle, number
- **Dependencies:** T-3.08
- **Acceptance criteria:** Does not obscure interactive content at any breakpoint. Labelled. Reachable in tab order at a sensible position. Respects safe-area insets.
- **Complexity:** XS
- **What was done:**
  - **The "number" theme setting this entry lists was deliberately not built.** `store.contacts.whatsapp` is where a merchant already keeps the number, and a theme setting beside it would be a **second place to write one fact** — two sources that disagree the first time somebody updates it in the obvious place. The toggle *is* a theme setting, because whether the button appears is a question the store has no opinion about. **No number means no button**, rather than a dead link.
  - **`inset-inline-end`, which is the left of the screen in Arabic** — where every artboard puts it — and the right on an LTR store, where a reader of that store would look. A physical side would have been correct in exactly one of the two.
  - **44px and not the artboard's 40.** Measured at 100 dpi the disc is 40pt across, under the floor T-2.05 set for the whole theme, and a floating button is the last control to make an exception for: it is the one a thumb reaches for without looking. Recorded in `/docs/DERIVED-DECISIONS.md` rather than taken quietly.
  - **Safe-area insets are `env()` arithmetic, not a media query.** `calc(1rem + env(safe-area-inset-bottom, 0px))` is the plain value on a desktop and the correct one on a phone, with no branch to get wrong.
  - **"Does not obscure interactive content" is keyed to a hook that already exists.** The one thing that lands in the same corner is the product page's sticky add-to-cart bar, and `master.twig` **already** emits `is-sticky-product-bar` on `<body>` from the `sticky_add_to_cart` setting — so the lift rule is real today rather than speculative. **Carried to T-4.12: keep that body class.** The button also hides itself while a T-2.10 sheet is open, since a floating control over a backdrop reads as pressable when the page behind it is inert.
  - **Last in the tab order on every page**, included from `master.twig` after the footer and outside `.app-inner`: a persistent utility should not stand in front of the page's own content.

#### T-3.11 — The social pill with no icon — ✅ **DONE 2026-08-10** (opened 2026-08-10 by the project owner, from the defect T-3.09 raised)
- **Objective:** Stop `salla-social` rendering the literal word «undefined» in a footer pill.
- **Files affected:** `src/assets/js/partials/social-links.js` (new), `src/assets/js/app.js` (adopted), `src/assets/styles/04-components/footer.scss`, `src/locales/{ar,en}.json`
- **Twilight components:** `salla-social` — technique C plus a script; **the component is not replaced**
- **New components:** none · **New sections:** none · **Dynamic data:** `store.social` · **Theme settings:** none
- **Dependencies:** T-3.08
- **Acceptance criteria:** No pill renders «undefined» for any `store.social` key. Every configured destination still renders and still links. The theme ships no third-party trust or social mark as a bundled image (B9). A network the SDK later adds an icon for needs no code change.
- **Complexity:** S
- **What was done:**
  - **Reproduced before it was fixed.** `salla-social` builds each link by string substitution — `socialSlot.replace(/\{icon\}/g, this.iconsList[link.type])`. `iconsList` holds **six** entries (instagram, twitter, facebook, youtube, snapchat, tiktok) while `getLinksArray()` returns **every** `store.social` key except `whatsapp`. `store.social` also carries **`pinterest` and `maroof`**, so `iconsList[type]` is `undefined` and `String.replace` writes those nine characters into the page. Reproduced in jsdom against the component's own render shape: two pills reading `"undefined"`, and none after the fix. **⚠️ Not committed** — run before T-1.09 existed; see T-1.09.
  - **The slot could not carry the fix, which is why this is a script.** The substitution happens inside the component before the theme's markup is live, so a `social-item` slot that uses `{icon}` inherits the same string. Only script can see which pills actually received an `<svg>`.
  - **Detection is structural, never textual.** The test is *"did this pill receive an `<svg>`"*, not *"does it say undefined"*. **A future SDK that adds a Pinterest icon fixes itself here with no code change**, and one that changes the failure string does not break this — which is the fourth acceptance criterion, and the reason a string match was refused.
  - **A translated name, not a bundled logo, and B9 is why.** Maroof is a third-party trust mark and B9 forbids shipping one as a theme image. The `sicon-*` font might carry a glyph, but it is served from Salla's CDN, **and that CDN could not be read from this environment (403)** — so building on `sicon-maroof` would have been an assumption, which CLAUDE.md forbids outright. `theme.social.*` gives «معروف» and «بنترست»; **an unknown network falls back to its own slug**, so the catalogue can never be the thing that breaks.
  - **The name goes to the accessible name too.** Upstream set `title` and `aria-label` to the raw slug, so a screen reader announced "maroof" in an Arabic storefront. Both now carry the translated name.
  - **The pill keeps its exact box** — same 44px, same border, same radius. A network without an icon is not a different kind of destination, and a different shape would claim it is.
  - **~~NOT DONE HERE, AND STILL OPEN: the social row's composition.~~ ✅ CLOSED 2026-08-10 by the project owner — AC-7.** The ruling is to take what `salla-social` gives: no mail pill is invented and WhatsApp is not put back. The artboard's six are a designer's choice of illustrative accounts rather than a contract about which networks the footer supports, and which accounts appear is the merchant's, set in the Salla dashboard. **T-3.08's «six social pills» is closed with it.** Original note follows.
  - **The composition, as it was recorded:** The artboard's six pills are mail, WhatsApp, TikTok, X, Snapchat and Instagram. `salla-social` **cannot produce that set** — it filters WhatsApp out, has no mail key, and adds Facebook, Pinterest and Maroof. This task removes the visible defect; **deciding which pills the footer should show is T-3.08's «six social pills» and needs the owner.**

---

## Phase 4 — Commerce

#### T-4.01 — Product card override — ✅ **DONE 2026-08-08**
- **Objective:** Rebuild the card: image, title, rating with count, colour swatches, price pill with bag icon, instant-delivery tag.
- **Files affected:** `src/assets/js/partials/product-card.js`, `src/assets/styles/04-components/product.scss`
- **Twilight components:** `custom-salla-product-card` extending `salla-product-card` — technique B
- **New components:** none (extends existing) · **New sections:** none
- **Dynamic data:** product, price, rating, review count, variant colours, badges
- **Theme settings:** `unite-cards-height`, placeholder image
- **Dependencies:** T-2.15, T-2.05, T-2.04
- **Acceptance criteria:** Extends the upstream class rather than forking it, so SDK updates propagate. Image dimensions reserved — zero CLS. Title links carry accessible names. Rating exposed as text, not stars alone. Swatches keyboard-selectable with non-colour state indication. Price marked up for Product schema.
- **Complexity:** L
- **What was done:**
  - **"Extends `salla-product-card`" was not possible, because there is no such class.** `<custom-salla-product-card>` is defined **in this theme**, in `product-card.js`, as a plain `HTMLElement` subclass — CLAUDE.md's verified-facts list says so and the file confirms it. The SDK exposes no product-card class for JS to inherit. So this is **technique A on an upstream theme file**, registered as one. The criterion's actual intent — that SDK updates keep propagating — is met where it applies: **every commerce action still goes through a `salla-*` element or a `salla.*` call**, and none of it is reimplemented.
  - **The stylesheet is a new file, `04-components/product-card.scss`, not the `product.scss` this task names.** Adopting `product.scss` would shadow 400 lines of upstream PDP styling to gain nothing — the design's card shares no class name with upstream's `.s-product-card-*` markup. A new file costs one `app.scss` import, which is already a register row; adopting `product.scss` would have cost a permanent reconciliation and its share of the scaffold's lint debt.
  - **The card is the T-2.15 shell plus content layout, and re-declares none of it.** Surface, border, radius and the media well come from `.card`; the only shell value overridden is `--card-media-ratio`, set to 4/5 — **which is the override that hook was added for.** T-2.15 shipped a 1/1 default recorded as "inferred from no artboard"; there is an artboard for this type, and the image is portrait on both Home and Offers.
  - **Quick view is deliberately absent, and belongs to T-4.13.** A button that does nothing is worse than no button for someone who cannot see that it is dead. It joins `.product-card__actions`, which is a stack for exactly that reason.
  - **The wishlist heart was removed, and the owner reversed that on 2026-08-08.** The removal argued from absence — no artboard draws a heart, on Home, on Offers, or on the Favorites grid itself. **The owner's counter-argument decides it and is the stronger one: the design ships a complete Favorites page in two states, so something must put products into it**, and no artboard shows another entry point. An unreachable page is a worse defect than a control an artboard omits.
  - **The restored heart is Salla's own, and naming it correctly fixed a bug that predates this theme.** `salla-button` for the control, `salla.wishlist.toggle()` for the action, and the class **`btn--wishlist`** — which `wishlist.js` already syncs from `salla.wishlist.event`. Upstream's card used `s-product-card-wishlist-btn`, which **that selector never matched**, so the card toggled its own classes optimistically and **showed a filled heart even when the request failed.** Now the true state arrives from the event stream and the storage sync corrects it on every page load.
  - **`aria-pressed` was added to `wishlist.js`, because upstream conveys wishlist state by fill and colour alone** — no confirmation at all for a screen-reader user, and colour as the sole carrier, which doc 13 forbids. It is announced the moment it flips with focus already on the button, so no live region is needed. The labels ride on the button as data attributes, keeping the copy in the template where `trans()` and the locale checker can see it.
  - **The «تسليم فوري» pill needed a data source B6 never named, and the obvious candidates are provably wrong.** `is_require_shipping` and a digital product type both fail on the evidence: **every product wearing the pill in the artboards is physical and shipped** — a puffer coat, a hoodie, a tote bag. So it is per-product merchant intent, which on Salla is a tag, driven by a new **`instant_delivery_tag` setting**. The merchant names the tag and applies it; no developer is involved in either half. **This is the one call on this task that wants the owner's confirmation.**
  - **Swatches are presentational. Ruled by the owner 2026-08-08, and the acceptance criterion moved rather than dropped: selectability belongs to T-4.10.** No artboard draws a selected state on a card swatch, and T-2.15's shell is built on **exactly one focusable descendant per card** — making five dots tabbable would undo the thing that shell exists to do. Each dot carries its colour name in visually-hidden text, so colour is never the only channel.
  - **The instant-delivery tag source is approved as the `instant_delivery_tag` setting** (owner, 2026-08-08). The derivation stands: no artboard-supported alternative exists, because every product wearing the pill is physical and shipped.
  - **The rating row is hidden from assistive tech in one piece and replaced by a sentence.** Its three parts are each useless alone: an icon font announces a private-use codepoint, "4.5" has no unit, "(700)" has no noun. Stars fill by `Math.floor`, so 4.5 draws four solid and one outline — what both artboards show, and rounding up would claim a rating the product does not have.
  - **Schema is `<meta>`, because the visible price is not machine-readable.** `salla.money()` returns formatted text with the currency glyph embedded — literally an `<i class="sicon-sar">` element when the store enables the symbol. `price_as_float` and `currency` are the readable pair the platform already provides. **That same injected glyph is marked `aria-hidden` after render:** it is the T-2.04 problem arriving through a channel T-2.04 cannot reach.
  - **Upstream's badges and the donation path are kept.** `promotion_title`, `preorder.label` and the remaining-quantity badge all carry text a merchant typed expecting to see it; a donation product with no amount field cannot be donated to. Dropping either because no artboard shows it would be data loss dressed as design fidelity.
  - **The pill is 44px where the artboard draws ~38px** — the one measurement this card departs from, for the reason and by the precedent T-2.05 set when it put a 44px floor under every button in the theme.

#### T-4.02 — Wishlist card override — ✅ **DONE 2026-08-10**
- **Objective:** Favorites-grid card variant.
- **Files affected:** `src/assets/js/partials/wishlist-card.js`, product SCSS
- **Twilight components:** `custom-wishlist-card`, `salla-products-list` — technique B
- **New components:** none · **New sections:** none
- **Dynamic data:** wishlist items · **Theme settings:** none
- **Dependencies:** T-4.01
- **Acceptance criteria:** Shares the T-4.01 shell; no duplicated card logic. Remove action confirms before destructive removal and announces the result.
- **Complexity:** S
- **Notes on delivery:**
  - **There is no favorites-specific card, and the artboard is why.** `Favorites Page - Floating Menu.pdf` draws a two-column grid of **the ordinary product card**. Upstream's `custom-wishlist-card` was a horizontal row — image, name, price, add button, a remove ✕ — a different component answering a question the design does not ask. `row-cards` on the list is what produced that shape and is gone.
  - **«No duplicated card logic» is met by owning no markup.** The class renders `<custom-salla-product-card>` and passes the product through: no image tag, no price formatting, no rating, no swatches. If T-4.01 changes, this changes with it, because it **is** T-4.01. It stays in the tree as a `display: contents` wrapper rather than replacing itself, because `salla-products-list` created it and holds the reference.
  - **Removal is confirmed only where it is destructive.** The remove action is the card's own heart, which T-4.01 wires straight to `salla.wishlist.toggle` — right on a listing, where un-favouriting is one tap and one tap back. On the favorites page the item leaves the grid, so it goes through T-2.11's dialog first. **Re-adding is deliberately not confirmed**: a dialog in front of it would be a toll booth on the way back. Taken in the capture phase, because the card's handler is an inline `onclick`.
  - **The result is announced from `salla.wishlist.event.onRemoved`, not from the click** — so what is spoken is what actually happened, and a removal that fails says nothing instead of claiming success.
  - **One dialog for the page, not one per card.** Thirty favorites would otherwise put thirty dialogs in the document describing removals nobody asked about.
  - **14 cases in jsdom**, including that a second render does not double the card, and that hearts on ordinary listing cards elsewhere are not intercepted.
  - **Tests committed by T-1.09** — `tests/t-4.02-wishlist-card.test.mjs`. The cases described above are in the repository and run in CI.

#### T-4.03 — Horizontal product carousel — ✅ **DONE 2026-08-08**
- **Objective:** Scroll-snap carousel with the custom progress indicator seen on Home.
- **Files affected:** `src/views/components/home/products-slider.twig`, `src/assets/styles/04-components/slider.scss`
- **Twilight components:** `products-slider.twig` — technique A. **Corrected 2026-08-06 under T-1.03:** this line previously named `slider-products-with-header.twig` as a second carrier. It is not one. That template forces a required full-bleed background image with the title laid over it, which the artboard does not draw; its registration was deleted in T-1.03. `products-slider.twig` alone renders the title, «عرض الكل» and the product carousel the design shows
- **New components:** scroll indicator · **New sections:** none
- **Dynamic data:** product collection
- **Theme settings:** `products_count`, source collection
- **Dependencies:** T-4.01
- **Acceptance criteria:** Native scroll-snap, not a JS carousel library. Keyboard scrollable. Indicator is decorative and hidden from assistive tech. RTL scroll direction correct. No layout shift as images load.
- **Complexity:** M
- **What was done:**
  - **The products are not available in Twig, and that decided the approach before anything else could.** `products.source` and `products.source_value` are a **descriptor, not an array** — this template never receives the products. So a Twig-rendered track was never on the table. `salla-products-list` fetches and renders the cards, exactly as the fixed-products block already drives it from the same descriptor, and **the scrolling is `overflow-x` plus `scroll-snap` in CSS**. `salla-products-slider` was rejected because it *is* the JS carousel library the criterion forbids.
  - **Remove the indicator's JavaScript and the carousel still works.** `home.js` reads the scroll position and never writes it; there is no transform driven, no drag listened for, no slide animated. That is the test the criterion is really asking for.
  - **`Math.abs()` on `scrollLeft` is the RTL fix and looks like noise.** In a right-to-left container browsers report the offset as zero at the start and increasingly **negative** as it advances, so the raw value would drive the thumb off the wrong end of the track. Recorded so nobody tidies it away.
  - **The card keeps one width everywhere — `w-40`, both the artboard's 160pt card and a shipped Tailwind step.** B4 says grids gain columns while the card is unchanged, so wider viewports show more cards, not bigger ones. `snap-start`, because the artboard's first card sits flush with the container edge.
  - **Keyboard scrolling comes from the cards, not from a `tabindex` on the track.** Every card holds a link, so tabbing scrolls them into view. `tabindex="0"` would satisfy the criterion on paper and cost a keyboard user an extra stop in front of every carousel, on every visit.
  - **One `!important`, and it is the only reach into the component.** The list sets `grid-template-columns` inline on its own wrapper and exposes no part or property to reach it. The alternative was subclassing the list — a heavier override for a smaller gain.
  - **`sub_title` survived.** The design draws no subtitle and upstream passed one to the slider component; it renders under the header rather than being dropped, on the same reasoning that kept `promotion_title` on the card.
  - **`04-components/slider.scss` is not shadowed** — 190 lines styling a component this section no longer uses.

#### T-4.04 — Section header — ✅ **DONE 2026-08-08**
- **Objective:** Title plus underlined "عرض الكل" action.
- **Files affected:** `src/views/components/ui/section-header.twig` (new), `src/assets/styles/04-components/section-header.scss` (new)
- **Twilight components:** none · **New components:** section header · **New sections:** none · **Dynamic data:** none
- **Theme settings:** per-section title text
- **Dependencies:** T-2.02
- **Acceptance criteria:** Heading level is a parameter so document outline stays valid wherever it is placed. Link has a descriptive accessible name, not bare "view all".
- **Complexity:** XS
- **What was done:**
  - **Level is an argument, size is a class, and the partial refuses to conflate them.** The same section sits under an `<h1>` on Home and under a page that already has its own heading elsewhere; a component that hard-codes `<h2>` makes the outline wrong in one of those two places. `.section-header__title` carries the size so an `h2` and an `h3` look identical wherever the outline needs one rather than the other.
  - **Two alignments, because the artboards draw two and neither is a slip.** «Winter Is Coming» is centred with the action centred beneath it; **«تجارب عملائنا» is start-aligned with no action at all.** Centre is the default, being the arrangement this task's objective describes. Recorded rather than resolved by picking one.
  - **The link says more than it shows.** «عرض الكل» repeated down a page gives a screen-reader user a list of identical links — WCAG 2.4.4 exactly. The section title is **appended** in visually-hidden text, so the name becomes «عرض الكل Winter Is Coming». Appending and not replacing: 2.5.3 asks that the accessible name *contain* the visible label, so voice input saying «عرض الكل» still matches the control.
  - **No new locale key.** The visible label is upstream's own `blocks.home.display_all`, which already exists in every locale Salla ships. A theme key here would have been a second translation of a string the platform maintains.
  - **The action carries the 44px floor** T-2.05 put under every button. A link that opens a whole listing is a target of the same kind, and `min-height` gets there without the padding that would have moved it away from where the artboard draws it.
  - **New files only** — no register row beyond `app.scss`, which is already one.

#### T-4.05 — Hero banner section — ✅ **DONE 2026-08-08**
- **Objective:** Full-bleed hero with overlaid quote and three-item strip.
- **Files affected:** `src/views/components/home/hero.twig` (new), `src/assets/styles/04-components/hero.scss` (new), `src/assets/js/home.js`, `twilight.json`
- **Twilight components:** `enhanced-slider.twig` evaluated as base — technique A
- **New components:** none if slider is adaptable · **New sections:** Hero (registered)
- **Dynamic data:** slide images, links
- **Theme settings:** `banner_images` (multiple), `cta_text`
- **Dependencies:** T-3.04, T-4.04
- **Acceptance criteria:** Hero image is the LCP element — preloaded, `fetchpriority="high"`, correctly sized, never lazy-loaded. Overlay text meets contrast against the actual images supplied. Autoplay pausable and disabled under reduced-motion.
- **Complexity:** L
- **What was done:**
  - **`enhanced-slider.twig` was evaluated as the base, as instructed, and rejected as one.** It paints the image as a **CSS background**, which cannot be preloaded, cannot carry alt text and cannot be given intrinsic dimensions — **three of this task's own acceptance criteria, all unreachable from that starting point.** `hero.twig` keeps the same `salla-slider` carrier, because the platform's slider already handles swipe, keyboard and RTL direction and none of that should be rewritten, and shares nothing else. This supersedes T-1.03's note that `enhanced-slider` is "the carrier for the hero"; **whether to deregister it is T-4.08's call**, since that task owns which sections Home offers.
  - **The hero is not full-bleed, which contradicts this task's own objective.** Both Home artboards show warm page background either side of it and a rounded top. The objective was written before the artboard was read; the artboard wins.
  - **Autoplay is off by default, and the pause control is an addition to the design rather than a reading of it.** WCAG 2.2.2 is **Level A** — the DoD's AA contains it — so a slider that moves for more than five seconds must be stoppable whether or not an artboard draws the button. It renders only when a merchant turns autoplay on, and `home.js` stops autoplay outright under `prefers-reduced-motion`, **read live rather than once**, because the theme's token-layer clamp cannot reach a JS timer.
  - **The swiper instance is read off `.swiper`'s own `el.swiper` property, not off `salla-slider`.** That is Swiper's documented API, so the control survives SDK versions that reshuffle the component's internals — which is what the override policy asks for. **If it is ever absent the toggle hides itself** rather than sitting there inert.
  - **The scrim's strength is derived and 50% was rejected on the numbers:** against a white image, 50% black gives **3.98:1 and fails**, 55% gives 4.76:1, 60% gives 5.74:1. The gradient reaches 60% at the 55% mark and holds to the bottom, and the content is bottom-anchored, so every glyph sits over at least 5.74:1. Hero images are merchant-supplied, so a white image is the honest worst case.
  - **Alt text is a merchant field and empty is a valid answer** — `alt=""` marks a banner decorative, which is right when the quote beside it carries the meaning. Deriving alt from the store name, which themes usually do, makes a screen reader say the same words on every slide.
  - **`rel="preload"` is emitted from the section, not the head.** `preload` is body-ok in HTML, so the LCP hint lands without waiting for T-3.01 to shadow `master.twig`. Only the first slide is preloaded; preloading ten would compete with the one actually on screen.
  - **The three-item strip is per-slide.** «طلب مسبق» · `Oct 14` · «تسليم فوري» are facts about the product that slide advertises, not about the section.
  - **Adopting `home.js` cost four lint fixes that had nothing to do with this task** — the ratchet OVERRIDES.md warns about, arriving exactly as described. `initFeaturedTabs()` is otherwise untouched.

#### T-4.06 — Shoppable lookbook section — ✅ **DONE 2026-08-08, split in two** (unblocked 2026-08-05, B6: source resolved)
- **Objective:** Editorial image with hotspot markers opening product pills.
- **Source ruling (project owner, 2026-08-05):** a **theme setting in `twilight.json`** — the section image, plus a list of points where each point carries two coordinates as **percentages** (`x%`, `y%`) and a product ID. **Percentages, never pixels**, so the points survive a change of viewport. No app backend, no CMS.
- **Finding from visual inspection 2026-08-05:** the same hotspot-plus-product-pill mechanic appears in `Story Page – Pinterest Style.pdf` and twice on `Home Page (No Scroll).pdf`. **Build one marker/pill component and reuse it** — do not implement it a second time for stories.
- **Files affected:** `src/views/components/home/lookbook.twig` (new), `src/assets/js/partials/lookbook.js` (new)
- **Twilight components:** none
- **New components:** hotspot marker, product pill · **New sections:** Lookbook (registered)
- **Dynamic data:** image, hotspot coordinates (percentages), linked product IDs — all from theme settings
- **Theme settings:** image, per-hotspot coordinate and product picker
- **Dependencies:** T-4.01
- **Acceptance criteria:** Hotspots are real buttons, keyboard reachable in reading order, labelled with the product name. **Coordinates are stored and applied as percentages** — a pixel value anywhere is a defect. A non-visual equivalent product list exists. The merchant places, moves and removes hotspots entirely from the theme customiser, with no code change. Product data resolves from the stored ID, so a renamed or repriced product needs no edit here.
- **Complexity:** XL — split before starting
- **The split, made before writing anything:**
  - **T-4.06a — the primitive.** `components/ui/hotspot-image.twig`, `assets/js/partials/hotspots.js`, `04-components/hotspot.scss`. Knows about an image, a list of percentage points and product ids. **Knows nothing about Home.** This is the piece the owner's ruling protects: T-7.07 consumes it and does not write a second one.
  - **T-4.06b — the section.** `components/home/lookbook.twig` plus its registration. Roughly fifteen lines: it hands the merchant's settings to the primitive and stops.
  - The seam is deliberate. Everything that was hard is in T-4.06a, and it is hard exactly once.
- **What was done:**
  - **One section is one image, and the merchant adds it twice.** The artboard shows two shoppable blocks on Home with **different layouts**. The alternative shape — a collection of images each holding a collection of points — needs a **nested collection, which the manifest schema does not support.** One image per section needs no feature the platform lacks and is simpler for the merchant.
  - **The pills are built in JavaScript because the customiser has no product picker.** Every documented field format was checked under T-2.01 and none of them is one, so the merchant stores an **id** and Twig cannot resolve an id to a product. `salla.product.getDetails()` can, at runtime — **which is exactly what makes the criterion true**: a renamed or repriced product needs no edit here, because nothing about it is stored beyond the id.
  - **Coordinates are percentages end to end.** They arrive as integers 0–100, are written as `--x`/`--y` with a literal `%` in the template, and are consumed by `inset-inline-start`/`inset-block-start`. **There is no pixel anywhere on the path**, which is the ruling.
  - **A broken id removes its hotspot rather than leaving a stub.** A deleted or mistyped product leaves no dead button and no nameless card — the marker and the pill both disappear, which is the correct signal to a merchant that the id is wrong.
  - **The pill list is the non-visual equivalent, and it is also the artboard.** Both blocks draw every pill visible at once, so the markers are a shortcut into a list that is already in the DOM — not a disclosure the list depends on. Activating a marker moves focus to its pill and marks it `aria-current`, with a border-weight change so colour is not the only channel.
  - **`hotspots.js` is imported from `home.js`, not `app.js`, and that was a cost decision.** A one-line import into `app.js` would have adopted its **sixteen pre-existing lint problems** under the T-1.07 ratchet. **T-7.07 must import this same module** when it needs hotspots on a page this bundle does not cover; writing a second one is the defect the ruling names.
  - The 44px marker target is bigger than the 24px ring it draws. A hotspot is the smallest control on the page and the most costly to miss.

#### ~~T-4.07 — Brands strip section~~ — ❌ **WITHDRAWN 2026-08-06 by the project owner**
- ~~**Objective:** Brand logos row on Home.~~
- **Why it was withdrawn:** **the section does not exist in the design.** Both Home artboards were read end to end at 100 dpi on 2026-08-06 during T-1.03 — `Home Page (No Scroll).pdf` (393×5131) and `Home Page (Scroll).pdf` (393×852) — and no brand-logo row appears at any scroll position. The task was written from an assumption about what a Home page usually contains, not from an artboard.
- **Where brands actually live in the design:** as **pages**, not as a Home strip — the `Ariana Grande.pdf` brand template with its `البراندات | Brands` breadcrumb, sort disclosure and two-column grid. **T-4.17 already carries all of it.** Nothing is lost by this withdrawal.
- **What went with it:** the `home.brands` registration was deleted from `twilight.json` in T-1.03, and with it the `is_more_button_enabled` setting, whose only consumer was `brands.twig`. **The file `src/views/components/home/brands.twig` was left on disk** — T-1.03's scope was `twilight.json` alone, and deleting an upstream file is an override that would have to be recorded in `/docs/OVERRIDES.md`.
- **To reverse this,** restore the `home.brands` entry in `twilight.json`. The template is untouched, so the section returns with one registration. Recorded in `/docs/DERIVED-DECISIONS.md`.

#### T-4.08 — Home page assembly — ✅ **DONE 2026-08-08, fourth pass** — every section the artboard draws is built, in the artboard's order; the one remaining difference is OP-5, which is the design system's and not this task's
- **Objective:** Compose Home from registered sections in the design's order.
- **Files affected:** `src/views/pages/index.twig`, `twilight.json`
- **Twilight components:** `index.twig` — technique A
- **New components:** none · **New sections:** none (consumes prior)
- **Dynamic data:** all Home sections
- **Theme settings:** section order and enable toggles
- **Dependencies:** T-4.03 → T-4.07
- **Acceptance criteria:** **Carried from T-3.04:** the overlay header picks its state from `is_page('index')`, a proxy for "there is a hero". This task is the first place the hero's presence is knowable — refine the condition or accept the rough edge in writing. **Carried from T-4.05:** `home.enhanced-slider` is still registered and is now redundant, the hero having replaced it; deregistering it is this task's call. Merchant can reorder and disable sections without code. Page renders correctly with any section disabled. Below-fold sections lazy-load. Matches both Home artboards.
- **Complexity:** M
- **What was done — and what deliberately was not:**
  - **This task was taken partially, at the project owner's instruction.** Its dependency list is T-4.03 → T-4.07 and **most of those sections do not exist yet**, so "compose Home in the design's order" has almost nothing to compose. What *was* done is the part that does not depend on them: the two items other tasks carried onto this one, both now closed.
  - **Closed the T-3.04 carry — "works when the hero is absent".** The header picks its overlay state from `is_page('index')`, a proxy for "there is a hero" and not the same question: a merchant who disables the hero section would get a dark gradient band with nothing behind it. **`body:not(:has(.hero))` answers the real question in CSS** — no script, and no coupling between the two components. It is checked at `body` because the header is the hero's *uncle* in the tree, not its sibling, so no selector from either component could reach the other.
  - **Closed the T-4.05 carry — deregistered `home.enhanced-slider`.** T-1.03 kept it as "the carrier for the T-4.05 hero"; the hero shipped without it and it is now a second, worse banner section a merchant could add by mistake. Its registration is removed. **The template stays on disk**, exactly as `brands.twig` did under T-4.07, because deleting an upstream file is an override that would earn a register row for nothing. Restoring the section is one manifest entry.
  - **`index.twig` was deliberately NOT shadowed.** It already does what this task needs — `{% component home %}` renders the merchant's enabled sections in the merchant's order, which *is* the acceptance criterion about reordering without code. Adopting it to add explanatory comments would have bought a permanent reconciliation obligation and zero behaviour. OVERRIDES.md's own rule: keeping the register short is the point.
  - **Second pass, 2026-08-08.** T-4.03, T-4.21, T-3.03 and T-4.06 have since landed, so Home now assembles the marquee, the overlay header, the hero, the «Winter Is Coming» carousel, the shoppable blocks and the photos carousel. Three more criteria were closed on this pass:
  - **"Page renders correctly with any section disabled" — audited, and it found a real defect.** Every section was checked for a whole-section guard. `lookbook`, `photos-slider` and `products-slider` had one; **the hero did not.** An empty slide collection still rendered `<section class="hero">` — an empty 5/7 box with a scrim over nothing — and, worse, **`body:has(.hero)` was therefore TRUE, so the overlay header sat on that empty box.** That is exactly the rough edge T-3.04 recorded and handed here. The guard closes both at once: no slides means no `.hero`, which means the header falls back to solid by itself.
  - **"Below-fold sections lazy-load" — met by images, and the section-level reading does not apply.** These are server-rendered Twig sections, so there is no section to defer; what costs bytes is images, and every image below the hero is `loading="lazy"`. **The hero's first slide is deliberately `eager` with `fetchpriority="high"`** — it is the LCP element, and lazy-loading it would be the opposite of this criterion.
  - **"Merchant can reorder and disable sections without code" — already true, and `index.twig` stays unshadowed.** `{% component home %}` renders the merchant's enabled sections in the merchant's order. Adopting the template to add explanatory comments would buy a permanent reconciliation obligation and no behaviour.
  - **What still blocks the close.** Two sections: **T-7.06** (تجارب عملائنا, the Stories feed) and the **partner CTA banner** recorded against this task in `/docs/DERIVED-DECISIONS.md` as the last block before the footer. Until both exist, **"matches both Home artboards" cannot be claimed** — and it is not being claimed. **Nothing was skipped quietly; this list is why the 🟡 stands.**
  - **Third pass, 2026-08-08.** Both blockers from the second pass are gone: **T-4.22** shipped the partner banner and **T-7.06** shipped the stories section. Home now assembles, in the artboard's order, the marquee · the overlay header · the hero · «Winter Is Coming» · a shoppable block · **تجارب عملائنا** · «تنسيقات جاهزة من أملاس» · a second shoppable block · **the partnership banner** · the footer. The disabled-section audit was re-run against the two new sections and both carry a whole-section guard — `{% if stories_items|length %}` and `{% if component.image and (brand_url or individual_url) %}` — so the criterion still holds with either one off, and both sections' images are `loading="lazy"`.
  - **"Matches both Home artboards" was audited section by section at 100–200 dpi, and it does not pass. Four things are missing, and the audit is the deliverable here rather than the claim.**
    1. **A section the backlog does not contain — OP-4.** Between the first shoppable block and «تجارب عملائنا» the artboard draws a **centred carousel of vertical social videos**, each slide a post with the poster's handle and «Audio unavailable» bar, and **beneath it a product name, price and bag button** (`G7 X Mark IIl`, `5999`), with a scroll-progress indicator. It is not T-4.21, which carries no product data and has a heading; not T-4.03, whose cards are product cards two-up; and not T-4.06, which has hotspot markers and pills on the image. **The 2026-08-06 order row in `/docs/DERIVED-DECISIONS.md` counted it as a third "shoppable block" and that reading is wrong** — corrected in the register. **No task covers it.** Per `CLAUDE.md` that is a stop condition, raised as **OP-4** rather than folded into a neighbour: the same route T-4.21 and T-4.22 took.
    2. **The marquee is drawn twice.** A second bar sits **between the partner banner and the footer**, same tone, same height, same type, carrying «أصالة مضمونة من الوكيل الرسمي ✨» and «كود خصم للتحويل ال…» — the second phrase is the top bar's own copy, so it is one content stream rendered at two animation offsets, not a different component. T-3.03 built the top instance only, and its entry describes the bar as sitting above the header. **A second placement is a change to that task's scope, not this one's.**
    3. **The scrolled artboard's header state needs T-3.05.** `Home Page (Scroll).pdf` shows the solid header pinned at the top mid-page. T-3.04 built both states and T-3.05 owns the swap, which is still open — so today the overlay state persists as the page scrolls.
    4. **The WhatsApp FAB is drawn on both artboards** at the bottom inline start and belongs to **T-3.10**, still open.
  - **What that means for the marker.** Every section this backlog actually contains is now built and assembles correctly; **the criterion "matches both Home artboards" remains unmet and is still not being claimed.** Items 3 and 4 close themselves when their own tasks land. Items 1 and 2 need an owner ruling before any code is written, which is exactly what the stop condition exists for.
  - **Fourth pass, 2026-08-08 — all four are closed.** The owner ruled on both open items the same day and the two dependent tasks landed: **T-4.23** built the video carousel, **T-3.03** gained its second position, **T-3.05** pinned the header, **T-3.10** added the WhatsApp button. Home now renders, top to bottom and in the artboard's order: marquee · overlay header · hero · «Winter Is Coming» · shoppable block · **shoppable videos** · **تجارب عملائنا** · «تنسيقات جاهزة من أملاس» · shoppable block · **partnership banner** · **marquee** · footer, with the floating WhatsApp button over all of it and the header swapping to solid and pinning as the page scrolls.
  - **The disabled-section audit was re-run over all five theme-registered sections and it found a real defect — in the manifest, not the templates.** Every section template guards itself. But **`lookbook`, `stories` and `video-carousel` each declared a `required` collection with `minLength: 1` and an empty default `[]`** — precisely the condition T-4.05 recorded on 2026-08-08 as the way a section **vanishes from the customiser with no error naming the cause**. The hero had been given a non-empty default for exactly this reason and the lesson had not been carried across. All three now ship one default entry. **This is the second time this trap has fired; it is now in two task entries and the override register.**
  - **What is still different from the artboard, and it is one thing: OP-5.** The artboards put warm `#F7F6F4` panels on a **white** page with white cards inside them; T-2.01 assigned the warm tone to the page and white to cards. So the per-section panels have nowhere to come from and the header's solid state is a full-bleed band where the artboard draws a floating rounded bar. **It is measured, recorded and awaiting a ruling.**
  - **Why this task closes anyway.** OP-5 is a **design-system** question — one token assignment that every page inherits equally — and it is not answerable from Home assembly: no arrangement of sections fixes it, and no section can fix it locally without five sections disagreeing. What this task owns is **which sections Home offers, in what order, with what guards, and whether the page survives any of them being switched off**, and all of that is now true. **"Matches both Home artboards" is claimed at the level of composition and behaviour, and explicitly not claimed at the level of surface tone**, which OP-5 holds against T-2.01.

#### T-4.09 — PDP gallery — ✅ **DONE 2026-08-10**
- **Objective:** Product image gallery with the documented transition.
- **Files affected:** `src/views/pages/product/single.twig` (adopted), `src/assets/styles/04-components/product-gallery.scss` (new), `src/assets/js/partials/product-gallery.js` (new), `src/assets/js/product.js` (adopted), `app.scss`, `src/locales/{ar,en}.json` — **`image-zoom.js` was not changed, see below**
- **Twilight components:** `single.twig` — technique A; `salla-slider type="thumbs"` — technique C
- **New components:** none · **New sections:** none
- **Dynamic data:** product images · **Theme settings:** image fit type (`slider_background_size`), `imageZoom` — both already registered
- **Dependencies:** T-3.05, T-2.13
- **Acceptance criteria:** Main image reserved and preloaded as LCP. Thumbnails keyboard navigable with current selection exposed. Zoom does not trap keyboard focus. Meaningful alt text.
- **Complexity:** L
- **What was done:**
  - **The gallery was reachable by pointer only, and that is the defect this task found.** `salla-slider type="thumbs"` builds two Swipers and links them with Swiper's thumbs module, **without enabling Swiper's `a11y` module** — read from the component's source. Upstream's thumbnails are therefore bare `<div>`s: no tab stop, no role, no accessible name, and nothing at all saying which one is showing. A `<button>` now sits **inside** each slide rather than replacing it, because the component stamps `swiper-slide` onto every direct child of that container and a `<button>` carrying swiper's layout is a fight worth avoiding; the click still reaches Swiper by bubbling, so the thumbs module is untouched.
  - **The current thumbnail is said twice, and the two cannot drift, because they are one fact.** `aria-current` is mirrored from Swiper's own `swiper-slide-thumb-active` class by a `MutationObserver`, and the border is selected off **the attribute** rather than off the class. Listening for a slide-change event instead would have meant re-deriving the index from a second source and hoping the two agreed — which they would not on a programmatic `slideTo`.
  - **`auto-height` was removed, and that is what "reserved" required.** Upstream sizes the frame to whichever image has loaded, so the page reflows on every product — the CLS the definition of done forbids. The reservation is an `aspect-ratio` on the slide, defaulting to the measured `360 / 247` and exposed as `--pdp-media-ratio` on the same principle as T-2.15's `--card-media-ratio`: **a merchant whose photography is square should be able to say so without this file changing.**
  - **LCP: `fetchpriority="high"` and `loading="eager"` were already on the first image and are kept, with `decoding="sync"` added** so the browser does not defer the paint it was just told to prioritise. The later images take `decoding="async"`.
  - **"Meaningful alt text" was failing in the most damaging possible place.** `image.alt` is nullable on every Salla image and most merchants never fill it, so upstream's bare `alt="{{ image.alt }}"` ships an **empty alt on the page's main product photo** — which tells a screen reader the product is decorative. It now falls back to the product name, and a filled `alt` still wins. **The thumbnails go the other way, to `alt=""`**: the button around them carries «عرض الصورة :position من :total», and an image inside a named control that repeats a name is noise.
  - **"Zoom does not trap keyboard focus" is satisfied, and `image-zoom.js` was deliberately not touched.** It is a **pointer-only magnifier** — `mousemove` and `touchmove` only, gated behind `window.innerWidth < 1024`, appending a `<div class="img-magnifier-glass">` that is not focusable and takes no tab stop. There is nothing there to trap. The keyboard path to a large image is the `<a data-fslightbox>` the slide already is, which now carries a real name instead of the bare product name it repeated on every slide.
  - **The indicator is T-4.03's control, consumed rather than redrawn.** Same classes, same two custom properties, same tokens, `aria-hidden` for the same reason. **It hides itself when nothing scrolls** — a full-width bar that can never move is a worse answer than no bar. CLAUDE.md allows exactly one implementation of this and T-2.19 already measured it.
  - **The details panel is not `.s-block__panel`, and reusing it would have been wrong.** The export puts the gallery *and the whole info block* on `y306 x0 w393 h1033 rx24` — **full bleed**, where T-2.18's section panel is inset 16 at `rx16`. Same tone, different shape, so it is its own class. **It opens here because the gallery is its first child; T-4.10 fills the rest of it.**
  - **Every measured colour was already a token and none was added:** `#F7F6F4` → `--surface-section`, `#FDFDFD` → `--surface-page` (the 1px border the export draws around image and thumb), `#EDEBE8` → `--border-subtle`, `#646361` → `--text-secondary`, `#EBEBEB` → T-2.13's `--surface-placeholder`. The radii land on the shipped Tailwind scale — `rounded-3xl` is 24, `rounded-large` is T-2.17's 16, `rounded-lg` is 8 against a drawn 7.5.
  - **`product.js` is adopted, so its lint debt became the theme's — which is exactly what T-1.07's ratchet is for.** Four errors were sitting in it: `imageZoom` read as a bare global (it is `window.imageZoom`, set in `master.twig` from the setting — **not** the bug it looks like, but it does not lint), an unused `slideChange` parameter, and two `let`s that are never reassigned. All four fixed; **no behaviour changed.**
  - **Upstream's `rtl:ml-8 ltr:mr-8` became `me-8`** — the same margin in the logical property T-1.04 requires, without a variant per side.

#### T-4.10 — PDP info, price and options — ✅ **DONE 2026-08-10**
- **Objective:** Title, price block, rating, variant options.
- **Files affected:** `src/views/pages/product/single.twig`, `src/assets/styles/04-components/product-info.scss` (new), `app.scss` — **`options.twig` was not touched, see below**
- **Twilight components:** `options.twig`, `salla-installment`, `validate-product-options.js` — technique A
- **New components:** price block · **New sections:** none
- **Dynamic data:** product, variants, stock, offers · **Theme settings:** none
- **Dependencies:** T-4.09, T-2.08
- **Acceptance criteria:** Single `<h1>` is the product name. Option selection updates price with an announced live region. Out-of-stock conveyed non-visually. Product + AggregateRating + Offer schema emitted.
- **Complexity:** L
- **Carried from T-4.01 (owner's ruling, 2026-08-08):** the product card's colour swatches are presentational by design, and **the "keyboard-selectable with non-colour state indication" criterion was reassigned from T-4.01 to this task.** Selecting a variant is this component's job. The card deliberately keeps one focusable descendant so a keyboard user reaches the product in a single stop; do not push selection back onto it.
- **What was done:**
  - **`options.twig` was named in this entry and is not touched, because it does not render the options.** It delegates the whole set to `<salla-product-options>`; what the file actually holds is weight, size guide, notes and attachments. Editing it would have added a register row for nothing.
  - **Half the carried criterion was already true, and it was verified rather than assumed.** `salla-product-options` renders each colour as a real `<input type="radio">` with a `<label>` — so arrow-key selection, radio grouping and `:checked` are the browser's, and none of it is re-implemented. **Technique C, no subclass.**
  - **The other half was missing entirely, and one part of it would have been invisible by definition.** A selected state shown by colour alone is doc 13's exact prohibition, and on a control **whose whole content is a colour** it says nothing at all. `:checked` is drawn as a **ring outside the disc**, so it never covers the colour being chosen; `:focus-visible` draws the same ring in the focus colour. The input is clipped rather than `display:none`, because the latter would take it out of the tab order along with the pixels.
  - **The 25px disc got a 44px target without changing the design.** Measured `25×25 rx12.5` ring over a `23×23` colour disc at a 30px pitch; the disc stays 25, and a pseudo-element gives the thumb 44 — T-2.05's floor, by T-2.20's precedent.
  - **Schema was not partly met; it was unbuilt.** **Not one line of structured data existed anywhere in `src/views`** — no JSON-LD, no `itemscope`, grepped across the tree before anything was written. A `Product` node with `AggregateRating` and `Offer` is emitted now.
  - **JSON-LD, which is the opposite of T-4.01's call and for the same reason.** The card used `<meta>` because its price was already in the markup as text that no parser can read. Here the whole object must be described, including fields that appear nowhere on screen, and threading `itemprop` through a 400-line upstream template would put structured data into every future merge conflict. **`product.price` and `product.currency` — the float and the ISO code — never the localised strings on screen.**
  - **`AggregateRating` is omitted when there are no reviews**, because Google rejects the entire `Product` node for a `reviewCount` of 0. **Rendered through the real Twig engine and `json_decode`d in three cases** — full, unrated, and Arabic with a zero count — all valid, quotes escaped, and the zero-count case correctly producing no rating node.
  - **The two `<h2>`s in the price block were prices, not headings.** They put «595 ﷼» into the document outline between the `<h1>` and the real section headings, so a heading list read «The summer kit → 595 ﷼». `product.js` targets the *class*, so the class stays and the element is a `<strong>` — same weight, no outline entry. The single `<h1>` is the product name and was already the only one on the page.
  - **The price changed silently for anyone not watching it.** `product.js` rewrites `.total-price` on `onPriceUpdated`, which is what a variant selection triggers, and nothing announced it. The wrapper is `aria-live="polite"` and `aria-atomic` — polite because the customer caused the change and should not be interrupted mid-selection.
  - **Out of stock was colour, opacity and motion, and reached no screen reader.** It is wrapped in a `role="status"` that is always in the DOM, because a live region created at the moment it fills is not reliably announced. The `!opacity-50` also went: half-opacity red on the warm panel is about 2.4:1, which is the failure T-2.11 named — **the most consequential sentence on the page was the faintest.** Full `--color-error` is in the contrast table.
  - **The brand is its name, not its logo.** The artboard writes «Rhode» as text; upstream renders `brand.logo` in a `w-12` box, and `brand.logo` is nullable — so upstream can ship a broken image box for a brand that has a name and no logo. The name is the field that exists whenever the brand does.
  - **The installment mark takes the footer's payment pill exactly** — white, `--border-subtle`, `rounded-lg`, against a measured `64×35 rx7.5`. It is the same object doing the same job, so it is not given a second treatment that merely matches.

#### T-4.11 — PDP add-to-cart — ✅ **DONE 2026-08-10**
- **Objective:** Primary conversion action.
- **Files affected:** `src/views/pages/product/single.twig`, `src/assets/js/app.js`, `src/assets/js/product.js`, `src/assets/styles/04-components/product-info.scss`, `src/views/components/header/header.twig`, locales
- **Notes on delivery:**
  - **The loading state was the component's own, unused.** `salla-button` ships `load()`/`stop()` and `salla-add-product-button` renders it with `loader-position="center"` — but the add path calls `disable()` only. Nine sibling components in the same package call `btn.load()`; this one does not. Driven from the `disabled` attribute, which is the one signal every ending path sets, including validation refusal, which emits no event at all.
  - **Success is a toast, matching the error toast**, per doc 04's "implement consistently" for the Loading/Success/Error row. Registered as its own `onItemAdded` listener because upstream's animation line dereferences `salla-cart-summary` unguarded.
  - **The cart count was verified, not rebuilt.** T-3.04's `role="status"` region and `app.js`'s `[data-cart-count]` writer already work — `salla-cart-summary` proves `cart.event.onUpdated` fires on add. One gap: no `aria-atomic`, so only the changed node was announced — a bare «٣» rather than «السلة: ٣». One attribute.
  - **The price inside the button needed `keepButtonPriceInSync`.** The component captures `host.innerHTML` once and rewrites it on every render, so the template's `.total-price` node is replaced by a clone (stale `watchElements` cache) and every re-render restores the load-time price — on `product-options::change`, i.e. exactly when the price changes.
- **Twilight components:** `salla-add-product-button`, `salla-quantity-input` — technique C
- **New components:** none · **New sections:** none
- **Dynamic data:** cart · **Theme settings:** none
- **Dependencies:** T-4.10, T-2.12
- **Acceptance criteria:** Loading and success states per doc 04. Failure surfaces a real message, never a silent no-op. Cart count updates and is announced.
- **Complexity:** M

#### T-4.12 — PDP sticky action bar — ✅ **DONE 2026-08-10**
- **Objective:** The on-scroll state in `Product_Details_Page__On_Scroll_`.
- **Files affected:** `src/assets/styles/04-components/product-info.scss`, `src/views/pages/product/single.twig`, `src/assets/js/product.js` — **`sticky-header.js` was named in this entry and is not touched:** it is T-3.05's header observer and has nothing to do with this bar
- **Notes on delivery:**
  - **The bar already existed and was not rebuilt.** `single.twig` has shipped `<section class="sticky-product-bar">` since upstream, `master.twig` emits `is-sticky-product-bar` from the `sticky_add_to_cart` setting, and `product.scss` fixes it below 640. **It is the same section T-4.11 put the action row into** — which is why "no duplicate accessible names against the in-page button" is satisfied *by construction*: there is exactly one `salla-add-product-button` on the page and the bar is its own container changing position. Building a second bar would have put two buy actions in the accessibility tree.
  - **Two of the four criteria were genuinely unmet.** The reserve was `pb-28` (7rem) against a bar measuring 8.5rem — 44px quantity + 20px gap + 48px action row + 24px padding — so the bottom inch and a half of every product page sat under the bar. Reserve and height are now **the same custom property** and cannot drift. And the safe area was ignored entirely: `bottom-0` with `p-3` puts the buy button under the home indicator on every notched phone. `env()` arithmetic, added to the page reserve too.
  - **Zero CLS needed nothing**, and that was verified rather than assumed: the reserve is a class Twig renders on `<body>`, so it is in the first paint, and the entrance animates only `transform` and `opacity`.
  - **A defect in T-4.11 that this bar causes, found and fixed here.** With `support-sticky-bar` set and a mobile viewport, `componentDidRender` stops honouring `passedLabel` and rewrites the label from `getLabel()` — destroying T-4.11's price span. `sticky_add_to_cart` **defaults to on**, so that was the default mobile behaviour, and the artboard's bar shows the price. `keepButtonPriceInSync` now re-creates the span in front of whatever label the component chose, never replacing it, and adds nothing while the button is disabled — a price beside an out-of-stock product is an offer the store is not making. 9 cases in jsdom.
  - **Tests committed by T-1.09** — `tests/t-4.11-t-4.12-button-price.test.mjs`, which carries T-4.11's cases too: the two tasks are one method, and splitting the halves of one guard across two files would hide that.
  - **One inherited imperfection, stated not hidden:** these rules are mobile-first and release at `from-tablet` (768), while upstream's block still fixes the bar under `max-width: 640px`. Between 640 and 768 the page reserves space for a bar already back in the flow. Cosmetic, in a band no artboard covers, and it closes when T-1.06 converts that query.
- **Twilight components:** none · **New components:** sticky bar · **New sections:** none · **Dynamic data:** product, cart · **Theme settings:** none
- **Dependencies:** T-4.11, T-3.05
- **Acceptance criteria:** Does not obscure content at the bottom of scroll. Respects safe-area insets. No duplicate accessible names against the in-page button. Zero CLS on appearance.
- **Complexity:** M

#### T-4.13 — Quick product view — ✅ **DONE 2026-08-10**
- **Objective:** The `Quick_Product_View_Pop-up` overlay.
- **Files affected:** `src/views/components/ui/quick-view.twig` (new), `src/assets/js/partials/quick-view.js` (new), `src/assets/styles/04-components/quick-view.scss` (new), `product-card.js`, `master.twig`, `app.scss`, `webpack.config.js`, locales
- **Notes on delivery:**
  - **No overlay was written.** Focus in, focus trapped, focus returned, `Esc`, backdrop, scroll lock and the above-tablet centred dialog are all T-2.10's, and the primitive gets them from `<dialog>` + `showModal()`. This task supplies a body. That is what "shares focus management with T-2.10" means here, rather than a second implementation that agrees with the first for now.
  - **No business logic was duplicated, because none was written.** Options are `salla-product-options` and the buy action is `salla-add-product-button`, given the same product id the PDP gives them. Nothing here decides a price, validates an option, or adds anything to a cart — doc 15's rule met by subtraction.
  - **Fetched on open and cached per id.** A category grid holds thirty cards; preloading would be thirty product requests to serve the one a customer opens. Verified: no request at boot, exactly one on first open, **none** on reopen, exactly one more for a different product.
  - **One sheet for the document, included from `master.twig`.** Cards appear on Home, category, offers, brand and search — a sheet per page would be five copies of one dialog and a sheet per card would be thirty.
  - **The dialog's name becomes the product's** as soon as it arrives. `title_hidden` keeps the accessible name while dropping the pixels the artboard does not draw; an unnamed dialog is announced as just "dialog".
  - **The card's control is the one T-4.01 reserved room for.** It appends to the actions stack that task built for it, so the card is not re-laid-out.
  - **25 cases in jsdom** against the real class, including that a `<script>` in a product name is escaped rather than injected, and that the three states are mutually exclusive in all of loading, ready and failure.
  - **Tests committed by T-1.09** — `tests/t-4.13-quick-view.test.mjs`. The cases described above are in the repository and run in CI.
  - **⚠️ One thing raised, not decided here.** `product-card.js`'s header says the design puts a quick-view control in that corner **instead of** the wishlist heart, but `getActions()` renders the heart as well — so the card now carries both. Removing an affordance «is not a decision to take quietly», so the heart was left. **Needs the owner: does the card show quick-view only, or both?**
- **Twilight components:** `salla-modal`
- **New components:** quick view · **New sections:** none
- **Dynamic data:** product, fetched on demand · **Theme settings:** none
- **Dependencies:** T-4.10, T-2.10
- **Acceptance criteria:** Product data fetched on open, not preloaded for every card. Shares focus management with T-2.10. Reuses PDP option and add-to-cart logic — no duplicated business logic (doc 15). Skeleton while loading.
- **Complexity:** L

#### T-4.14 — PDP recommendations — ✅ **DONE 2026-08-10**
- **Objective:** Related products below the fold.
- **Files affected:** `src/views/pages/product/single.twig`, `src/assets/js/product.js`, `twilight.json` — **`salla-infinite-scroll` was named in this entry and is not used:** the block is a slider of a bounded set, not a paged list, and nothing about it scrolls infinitely
- **Notes on delivery:**
  - **"Lazy-loaded below the fold" could not be done with an attribute, and the component is why.** `salla-products-slider` fetches in `componentWillLoad`, so the request leaves with the page however far down the block sits — and then `componentDidRender` **strips `loading="lazy"` off every image it rendered**, on a `setInterval`, ten times over. Both read in its source. So the block furthest below the fold was the most eager thing on the page, and neither half is reachable from CSS or a prop. The only lever left is *when the element exists*, so the template renders a container and `product.js` creates the element on intersection, with 200px of root margin so it is already loading when reached.
  - **"Absent cleanly" was a real defect too.** The component sets `isReady = true` on an empty response exactly as on a full one, so a product with no related products rendered «منتجات مشابهة» over an empty rail. The container is removed once the slider settles with no items — measured from the DOM, because the global `products.fetched` event carries no way to tell whose slider fired it.
  - **The count is the merchant's**, through a new `related_products_count` setting, and it is **omitted rather than guessed** when unset so the platform's own default stands. Hard-coding 12 here would be the theme overruling a store setting it does not own.
  - **12 cases in jsdom**: nothing created before intersection, nothing created on a non-intersecting entry, every attribute passed through, the observer disconnected after firing, the block kept when products exist and removed when they do not, and no `limit` attribute at all when the setting is unset.
  - **Tests committed by T-1.09** — `tests/t-4.14-related-products.test.mjs`. The cases described above are in the repository and run in CI.
- **Twilight components:** `products-slider.twig`, `salla-infinite-scroll`
- **New components:** none · **New sections:** none
- **Dynamic data:** related products · **Theme settings:** products count
- **Dependencies:** T-4.03, T-4.10
- **Acceptance criteria:** Lazy-loaded below the fold per doc 11. Absent cleanly when no recommendations exist.
- **Complexity:** S

#### T-4.15 — Cart page — ✅ **DONE 2026-08-10**
- **Objective:** Items, coupon, summary, checkout per `Cart_Page`.
- **Files affected:** `src/views/pages/cart.twig`, `src/assets/js/cart.js`, `src/assets/styles/04-components/cart.scss` (new), `app.scss`, locales
- **Notes on delivery:**
  - **Three things the artboard draws are deliberately not built, and each was ruled on by the owner rather than decided here** — AC-3 (the mobile summary stays the platform's bottom bar), AC-4 (no checkout stepper), AC-5 (no order-notes field, because the SDK has no order-note API at all). All three in `/docs/DERIVED-DECISIONS.md`.
  - **The rows are a list, not cards.** Upstream's white `rounded-md` card per item became the artboard's flat row with a hairline. T-2.15's `.card` was deliberately **not** used — it would have put a card around something the design draws as a list.
  - **The bin is the decrement slot.** The artboard's pill has three slots, not four, because at quantity 1 «−» has nothing to do. `salla-quantity-input` exposes a `decrement-button` slot with a `hasDecrementSlot` flag that suppresses its own minus; the click is taken in the **capture phase**, so `decrease()` never runs and cannot clamp to 1 and silently do nothing behind a bin. The button's accessible name changes with the glyph.
  - **The coupon error was not accessible and the component is why.** `salla-cart-coupons` renders its failure as a bare `<span>` — no `role`, no `aria-live`, no `aria-describedby`, no `aria-invalid`. Read in its source. Three gaps, three fixes, component unmodified.
  - **A latent defect in upstream's `cart.js` was fixed on adoption:** `toggleElementClassIf(priceElement, 'text-red-400', 'text-sm text-gray-400', …)` wrote raw Tailwind palette onto a price the template colours from a token — so the price stopped matching the design **after the first `cart::updated`**, and only then.
  - **17 cases exercised in jsdom against the extracted method bodies**: the min-state both ways, both accessible names, the interception (and proof the component never sees the click at quantity 1), removal announced with the product name, the above-minimum path left alone, coupon invalid/associated/announced/cleared, and a row added after boot still getting a bin.
  - **Tests committed by T-1.09** — `tests/t-4.15-cart.test.mjs`. The cases described above are in the repository and run in CI.
- **Twilight components:** `cart.twig` — technique A; `salla-cart-summary`, `salla-cart-coupons`, `salla-cart-item-offers`, `salla-quantity-input`, `salla-loyalty-panel`
- **New components:** cart item row · **New sections:** none
- **Dynamic data:** cart, offers, coupons, loyalty · **Theme settings:** none
- **Dependencies:** T-4.11, T-2.09, T-2.11
- **Acceptance criteria:** Quantity and removal update totals with announcement. Coupon errors accessible. Empty cart uses T-2.14. Checkout handoff to Salla unmodified. Zero CLS on total recalculation.
- **Complexity:** L

#### T-4.16 — Offers page — ✅ **DONE 2026-08-10**
- **Objective:** `Offers_Page` — banner plus discounted products.
- **⏸ Why it is parked, and what unblocks it.** This entry names `src/views/pages/offers.twig` (new). **Upstream ships no such template**, and nothing in the repo or the Twilight SDK confirms the platform routes `/offers` to one. What *is* confirmed: an offers route exists — `photos-slider.twig` and `square-photos.twig` both list `offers` as a `link_type` beside `category`, `product` and `brand` — and `src/views/pages/product/index.twig` is a **generic products listing** carrying `sort_options`, `filters`, `search_query` and `category`, which is exactly the structure the Offers artboard draws. The likely answer is that Offers, category listing and search are all that one template. **Two facts are needed from Salla before building:** (1) does `/offers` render through `product/index.twig` or expect its own template, and (2) if shared, what `page.slug` value does the platform send for it — the docblock's only example is `"cat.show"`, and the banner has to be gated on something. Building the wrong one produces a file that never renders. **Note this also decides T-4.19's target**, since the category listing is the same template.
- **✅ ANSWERED, and no question needed to go to Salla.** `src/assets/js/products.js:59` enumerates the slugs it boots on:
  `'product.index'`, `'product.index.latest'`, **`'product.index.offers'`**, **`'product.index.search'`**, `'product.index.tag'`.
  So **the offers page is `product/index.twig`** and its `page.slug` is **`product.index.offers`** — both facts the park was waiting on. This also fixes the targets of the two derived tasks: **T-4.19's category listing is `product.index`** and **T-4.20's search results is `product.index.search`**, the same template, which is why B8 could call them derivable in the first place. **`src/views/pages/offers.twig` must not be created**; the entry's «Files affected» is wrong and is corrected here.
- **One consequence for T-4.18, found with it.** `products.js` builds the filter drawer with **`mmenu-light`** — the library T-3.06 removed from `app.js` because its bundle contains zero occurrences of `aria`, `focus`, `keydown` or `tabindex`. So the listing filters today are the same inaccessible drawer that task rejected, which is precisely what T-4.18 replaces with the T-2.10 sheet.
- **Files affected:** `src/views/pages/offers.twig` (new), `twilight.json`
- **Twilight components:** `salla-offer`, `salla-count-down`
- **New components:** offer banner · **New sections:** Offers (registered)
- **Dynamic data:** offers, discounted products
- **Theme settings:** `offer_banner` image
- **Dependencies:** T-4.03, T-4.01
- **Acceptance criteria:** Countdown timers accessible and correct across timezones. Discount conveyed as text, not colour alone. Expired offers handled.
- **Complexity:** M
- **Notes on delivery:**
  - **No `offers.twig` was created**, per the finding above: the offers page is `product/index.twig` at slug `product.index.offers`. The cover is gated on **both** the slug and the setting, so a category page cannot inherit it and a merchant who sets no cover gets the plain title rather than an empty band.
  - **The cover's scrim is white, and the hero's is black, for the same reason.** T-4.05 puts white text on a merchant image and darkens; these artboards put `--text-secondary` — dark — on a light image, so the problem inverts. Assuming the worst case (a black cover), white composited over black gives 2.11:1 at 60%, 3.26:1 at 75%, 4.21:1 at 85% and **4.76:1 at 90%** — so the gradient reaches 90%, which passes the small breadcrumb as well as the large title rather than passing one and failing the other. On a light cover it is white on white and invisible, which is what the artboards draw.
  - **«Discount conveyed as text, not colour alone» was a real gap in the card.** The struck regular price carried no words, so the buy pill read as two prices in a row — "295 700" — with nothing to say which was which. It now carries `theme.common.was_price`, **moved out of `theme.cart` where T-4.15 had put it**, so the cart row and the card cannot drift into two sentences for one idea.
  - **The countdown criteria have no element on this page, stated rather than skipped.** No artboard puts a countdown on the offers page; `salla-count-down` appears on the PDP for pre-order campaigns, where it already ships. Expired offers are the platform's: a product that has stopped being on offer stops being returned by `source: offers`, so there is nothing for the theme to expire. **If a countdown is wanted on this page it is a new task**, per the rule about design sections and backlog tasks — in reverse.

#### T-4.17 — Brand page — ✅ **DONE 2026-08-10** (unblocked 2026-08-05, B7 closed by documented inference)
- **Objective:** Brand header plus catalogue, per `Ariana_Grande`.
- **Files affected:** `src/views/pages/brands/single.twig`, `src/views/pages/brands/index.twig`
- **Twilight components:** `brands/single.twig` — technique A
- **New components:** brand header · **New sections:** none
- **Dynamic data:** brand, brand products · **Theme settings:** none
- **Dependencies:** T-4.07, T-4.01
- **Acceptance criteria:** **Confirmed 2026-08-05 by visual inspection: it is the brand page template**, not a campaign one-off — brand cover image, `البراندات | Brands` breadcrumb, sort dropdown, two-column product grid, standard footer. Recorded in `/docs/DERIVED-DECISIONS.md`. The sort control is the same disclosure pattern as the orders status filter in T-6.01 — share it. Brand schema emitted. Pagination or infinite scroll accessible.
- **Complexity:** M
- **Notes on delivery:**
  - **The cover is T-4.16's `.listing-cover`, reused whole** — including its contrast arithmetic, because the problem is identical: dark text over an image nobody can inspect at build time.
  - **Nothing merchant-authored was deleted to reach the artboard.** `Ariana_Grande.pdf` draws no logo tile and no description, but both are merchant content. The logo header is now the **fallback for a brand with no cover** rather than a deletion, and the description renders whenever one is written — the artboard's brand simply has none, which is not the same as the field being unwanted.
  - **The description was an `<h2>` holding prose**, which put a brand's marketing copy into the document outline as a section heading. It is a `<p>`.
  - **The sort control is a `<details>`, per the owner's ruling.** Open/close, `aria-expanded`, keyboard and `Esc` are the UA's — the same reasoning that made T-2.10 a `<dialog>`. **It renders only if the platform sends `sort_options` and invents nothing if it does not.** This template's docblock lists neither `sort_options` nor `products`, yet `products` is used two lines on, so the docblock is demonstrably incomplete and is evidence for neither.
  - **It is the shared implementation the entry asked for.** `partials/sort-disclosure.js` binds any `[data-sort-disclosure]`; **T-6.01's orders status filter consumes it and writes no second copy.** It boots everywhere and no-ops where the markup is absent, which is what lets one file serve two pages in different phases.
  - **`Brand` JSON-LD is emitted** — there was none; `salla-breadcrumb`'s was the only structured data on the page. Empty fields are filtered out rather than emitted null.
  - **The empty brand was a dead end** and now uses T-2.14 with a way onward.
  - **11 cases in jsdom**, including that the pressed state *moves* rather than accumulating, and that the URL is pushed so Back has somewhere to go.
  - **⚠️ Tests not committed.** The jsdom cases described above were run before T-1.09 existed and were never saved; see T-1.09. They are **not** re-derived on a guess. A task that next touches these files brings its tests with it.

#### T-4.18 — Filter panel — ✅ **DONE 2026-08-10**
- **Objective:** Faceted filtering on listing pages, per `Show Filter.pdf` (393×852, an overlay state).
- **Files affected:** `src/assets/styles/04-components/filters.scss`, listing template
- **Twilight components:** `salla-filters` — technique C
- **New components:** filter sheet · **New sections:** none
- **Dynamic data:** filters, results · **Theme settings:** filters feature flag
- **Dependencies:** T-2.10, T-4.01
- **Acceptance criteria:** Matches `Show Filter.pdf`. Result count changes must be announced; filter state must survive back-navigation. Note the artboard is a 393×852 overlay, so it presents as a bottom sheet over the listing — build it on T-2.10 rather than as a separate overlay implementation. The listing page it filters is still missing (B8), so verify against a listing built from live store data.
- **Complexity:** L
- **Notes on delivery:**
  - **The artboard is a side DRAWER, not a bottom sheet, and this entry said otherwise.** It reasoned «the artboard is a 393×852 overlay, so it presents as a bottom sheet» — but `Show Filter.pdf` draws a panel over roughly 70% of the width with the dimmed listing showing down the other side, floor to ceiling. The entry's *instruction* — build it on T-2.10 rather than as a separate overlay — is what mattered and is honoured; only its description of the shape is corrected, against the artboard. **T-2.10 gained a third variant, `drawer`**, which it needed anyway. Recorded as AC-8.
  - **What it replaced is the substance of the task.** The panel was `mmenu-light` — the library T-3.06 removed from `app.js` after finding its bundle contains **zero** occurrences of `aria`, `focus`, `keydown` or `tabindex`. Focus was neither trapped nor returned, `Esc` did nothing, and the page behind stayed tabbable: three criteria failing at once, none reachable from CSS. All three are now the browser's, through `<dialog>` + `showModal()`.
  - **The dependency is gone from `package.json`, not merely unimported.** `product.js` fell **14.9 KB → 13.9 KB**.
  - **The trigger was an `<a href="#filters-menu">` that navigated nowhere** — its handler called `preventDefault()` — and carried **no accessible name at all**, since its only content was a decorative icon. It is a real `<button>` with a name and `aria-haspopup="dialog"`, and `data-sheet-open` is what returns focus to it on close.
  - **«Filter state must survive back-navigation» was impossible as written.** Sorting used `history.replaceState`, which overwrites the current entry — so sorting five times left one entry and Back left the listing altogether. It pushes now, and a `popstate` handler puts the page into the state it goes back to; without that the URL would change and the grid would not, which is worse than not supporting Back at all.
  - **Above laptop the filters are a column in the page, not a drawer** — upstream's arrangement and doc 10's rule, reached by taking the panel out of the dialog's display model rather than by rendering it twice.
  - **8 cases in jsdom** for the restore path, including an absent `sort` clearing the sort rather than leaving a stale one, and a page with no products list being a clean no-op.
  - **⚠️ Tests not committed.** The jsdom cases described above were run before T-1.09 existed and were never saved; see T-1.09. They are **not** re-derived on a guess. A task that next touches these files brings its tests with it.

#### T-4.19 — Collection / category listing page — ✅ **DONE 2026-08-10** (derived, no artboard)
- **Objective:** The listing page that categories, collections and the "view all" links land on. **No artboard exists** — derived under the B8 ruling.
- **Files affected:** `src/views/pages/product/index.twig`, `src/views/pages/brands/index.twig`
- **Twilight components:** upstream `product/index.twig` — technique A; `salla-products-list`, `salla-infinite-scroll`, `salla-filters`
- **New components:** none — assembled from T-4.01 cards, T-4.04 section header and T-4.18 filters · **New sections:** none
- **Dynamic data:** category products, pagination, filter state
- **Theme settings:** products per page, default sort
- **Dependencies:** T-4.01, T-4.04, T-4.18, T-2.14
- **Acceptance criteria:** Built from existing components and the upstream template in the established visual language — warm page background, white cards, subtle borders, the same buttons. **No new visual pattern is invented.** Grid gains columns above mobile per the T-0.04 rules; the card itself does not change. Empty result uses T-2.14. Sort and pagination accessible, and filter state survives back-navigation. Every visual choice recorded in `/docs/DERIVED-DECISIONS.md`.
- **Complexity:** M
- **Notes on delivery:**
  - **The derivation is that almost nothing was derived.** B8 asks for existing components in the established language, and the page already was that: upstream's template, T-4.01's cards, T-2.14's empty state. **No new visual pattern was invented** — the only new CSS is one rule that hides the platform's placeholder while T-2.14's stands in for it.
  - **The sort control had no accessible name below 640.** Its label was `hidden sm:block` and there was no `aria-label` — so on the one viewport every artboard is drawn at, a screen reader announced an unnamed combo box. `sr-only sm:not-sr-only` keeps the artboard's appearance exactly and gives the control its name back.
  - **The empty result is T-2.14's, because the component's has no way onward.** `salla-products-list` renders its own `s-products-list-placeholder` — a bag and a sentence — and does not emit `.no-content-placeholder`, so T-2.14's retune, which reaches five upstream templates without editing any of them, misses this one. The component is **not modified**: its placeholder is hidden while ours shows, so a future SDK that adds an action needs only that rule removed.
  - **The brands index had its headings inverted.** `page.title` was an `<h2>` while the empty-state message was the template's only `<h1>` — so a store with brands had a page with no heading at all, and a store without them had one titled «لا توجد ماركات». Fixed both ways round.
  - **Two theme settings, both verified against the component's own attribute list before being added:** `listing_products_per_page` → `limit`, `listing_default_sort` → `sort-by`. Both omitted rather than guessed when unset.
  - **9 cases in jsdom**, including that results returning after an empty filter restore the platform placeholder, and that a malformed response does not crash or falsely blank the grid.
  - **⚠️ Tests not committed.** The jsdom cases described above were run before T-1.09 existed and were never saved; see T-1.09. They are **not** re-derived on a guess. A task that next touches these files brings its tests with it.
  - **⚠️ Filter state and back-navigation is NOT closed here, and it belongs to T-4.18.** `products.js` writes the sort with `history.replaceState`, which by definition leaves no entry to go back to. The filter half of this page is the `mmenu-light` drawer T-4.18 replaces, so both halves of that criterion are that task's.

#### T-4.20 — Search results page — ✅ **DONE 2026-08-10** (derived, no artboard)
- **Objective:** Results for the header search. **No artboard exists** — derived under the B8 ruling.
- **Files affected:** `src/views/pages/product/index.twig` (search variant)
- **Twilight components:** `salla-search`, `salla-products-list` — technique A
- **New components:** none — reuses T-4.19 wholesale · **New sections:** none
- **Dynamic data:** query, results, result count
- **Theme settings:** none
- **Dependencies:** T-4.19, T-3.04
- **Acceptance criteria:** Shares the T-4.19 layout rather than forking it — the only additions are the echoed query and the result count. Count announced to assistive tech on change. Zero results uses T-2.14 and offers a route onward, never a dead end. Query echoed safely, never as raw HTML. Recorded in `/docs/DERIVED-DECISIONS.md`.
- **Complexity:** S
- **Notes on delivery:**
  - **It shares T-4.19's layout and forks nothing.** The only two additions are the echoed query and the result count, exactly as the entry requires. No template was copied.
  - **«Query echoed safely» was a live reflected-XSS path, not a formality.** Upstream renders `{{ page.title|raw }}` — correct for a category, whose title a merchant authors and the docblock says «could be html» — and `products.js` assigned the fetched title with `.innerHTML`. **On the search slug that title carries the visitor's own query**, so anything put in the URL was written into the document as markup, twice over. The search page now echoes `search_query` through Twig's auto-escaping and sets the fetched title as `textContent`; **every other slug keeps upstream's behaviour**, because narrowing it everywhere would silently strip markup merchants are entitled to use. Proved both ways in jsdom: an `<img onerror>` query renders as visible text with no element created, and a category's `<em>` still renders.
  - **The count region is on every listing slug, not only on search.** The criterion is search's, but the thing that changes a count is a filter, and filters are on every listing — a region that existed only on search would go quiet exactly where it matters most. Empty until the first fetch, so it announces a change rather than reading a starting value at load, and a repeated number is suppressed.
  - **Visible as well as announced.** A live region that is `sr-only` tells sighted users nothing about a grid that just changed under them.
  - **Zero results was already done by T-4.19** — T-2.14's empty state with a route onward, which is why that criterion needed nothing here.
  - **11 cases in jsdom.**
  - **⚠️ Tests not committed.** The jsdom cases described above were run before T-1.09 existed and were never saved; see T-1.09. They are **not** re-derived on a guess. A task that next touches these files brings its tests with it.

#### T-4.21 — «تنسيقات جاهزة من أملاس» centred image carousel — ✅ **DONE 2026-08-08** (added 2026-08-06 by the project owner)
- **Objective:** The centred image carousel between the Stories feed and the third shoppable block on Home — a centred slide with its neighbours partly visible on both sides, and a scroll indicator beneath. **Images and links only; no hotspots on the slide.**
- **Why it was added:** the section is drawn on both Home artboards and **no backlog task covered it**. That is the standing stop condition in `CLAUDE.md` — a design section with no task is a gap in the plan — so it was raised rather than folded into a neighbouring task. The owner opened this task on 2026-08-06 and the stop condition is discharged.
- **Files affected:** `src/views/components/home/photos-slider.twig`, `src/assets/styles/04-components/slider.scss`
- **Twilight components:** `photos-slider.twig` — **technique A**. The upstream template already renders `salla-slider type="carousel" centered pagination`, which is this shape exactly; the `component-photos-slider` feature flag was kept in T-1.03 for precisely this reason
- **New components:** none · **New sections:** none — the flag registers it
- **Dynamic data:** the image list and each image's link, from the component's own fields
- **Theme settings:** image collection with per-item link (`link_type` covers category, product, offers, page, brand and external), plus the section title
- **Dependencies:** T-4.04
- **Acceptance criteria:** Uses the shipped `salla-slider` carousel rather than a second slider implementation. **Section title is a setting, not a literal** — «تنسيقات جاهزة من أملاس» is the merchant's copy, and the لام in أملاس is confirmed at 300 dpi. Slide images have reserved dimensions and meaningful alt text; the partial neighbours must not cause CLS or horizontal page scroll. Keyboard reachable, RTL scroll direction correct, autoplay pausable and disabled under `prefers-reduced-motion`. The scroll indicator is decorative and hidden from assistive tech, matching T-4.03. Section hidden cleanly when the merchant supplies no images.
- **Complexity:** S
- **What was done:**
  - **Upstream's carrier is kept unchanged.** `salla-slider type="carousel" centered` already draws a centred slide with its neighbours partly visible, which is why T-1.03 kept the flag. Nothing here replaces it; everything here is around it.
  - **The title has two sources because the theme cannot add a field to a platform-registered section.** `component-photos-slider` is a Salla feature flag, so its fields are the platform's. Platform `title` wins; the new `photos_slider_title` setting is the fallback; **if neither is set the heading is omitted rather than invented.** Either way the merchant changes the wording without a developer.
  - **Upstream's alt text was actively harmful, not merely absent.** `alt="{{ store.name }} image-slider-{{ index }}"` puts the same words on every slide, which is worse than empty — a screen reader reads all of them. Replaced by `items[].image.alt`, the merchant's own documented field, with blank meaning decorative.
  - **The indicator matches T-4.03 without a second implementation.** `slider-config` is merged over `salla-slider`'s swiper options, so the pagination type becomes `progressbar` with one attribute and no fork. `clickable: false` stops swiper inserting focusable bullets that duplicate slides already in the tab order, and the bar is `aria-hidden` because it reports a position the slides already carry.
  - **The autoplay control is shared code.** T-4.05's `initHeroAutoplay()` became `initAutoplayToggles()`, binding any `[data-autoplay-toggle]` to its nearest `[data-autoplay-scope]`. **This is the task that would have duplicated it**, and doc 15 forbids that; the two shared strings moved to `theme.common.*` for the same reason.
  - **CLS and the partial-neighbour criterion are one rule, not two.** `aspect-ratio: 4/3` plus matching `width`/`height` reserves the box before the image loads, and an image that cannot grow cannot push its neighbours sideways.
  - **The section hides itself when the merchant supplies no images** — the whole `<section>` is inside `{% if items|length %}`, so an empty block leaves no stray heading or empty track.

---

#### T-4.22 — Partnership banner — ✅ **DONE 2026-08-08** (added 2026-08-08 by the project owner)
- **Objective:** The last block before the footer on Home — one image with two calls to action laid over it, «انضم كبراند» and «انضم كفرد», both pointing at the T-7.09 partner page. No heading and no body copy: the image and the two buttons are the whole section.
- **Why it was added:** the block is drawn on `Home Page (No Scroll).pdf` and is recorded in `/docs/DERIVED-DECISIONS.md` under T-4.08, **and no backlog task covered it.** That is the standing stop condition in `CLAUDE.md` — a design section with no task is a gap in the plan, not something to fold into a neighbouring task — so it was raised against T-4.08 rather than absorbed by it. The owner opened this task on 2026-08-08 and the stop condition is discharged. Same route as T-4.21.
- **Files affected:** `src/views/components/home/partner-banner.twig` (new), `src/assets/styles/04-components/partner-banner.scss` (new), `src/assets/styles/app.scss`, `src/locales/ar.json`, `src/locales/en.json`, `twilight.json`
- **Twilight components:** none. `enhanced-square-banners` and `fixed-banner` were both evaluated as carriers and rejected — each renders a banner with a **title, subtitle and one link**, and this block has no text at all and **two** destinations. Adopting either would mean deleting most of it and adding what it lacks
- **New components:** partnership banner · **New sections:** `home.partner-banner`, registered in `twilight.json`
- **Dynamic data:** none from the platform. The image and both destinations are merchant-supplied, because the theme cannot know which page the merchant published the partner form on
- **Theme settings:** section image and its alt text; **per button, a label and a URL** — four fields, so a merchant can retitle either action or point them at two different destinations without a developer. Labels default to the artboard's copy; a cleared label falls back to the locale catalogue rather than rendering an empty button
- **Dependencies:** T-2.05 *(the button and its 44px floor)*, T-4.08 *(which owns the order this section lands in)*
- **Acceptance criteria:** **No literal in the template** — image, alt text, both labels and both URLs are settings. **A button with no URL is not rendered**, and a section with no image or no URL at all renders nothing: the theme never draws a dead control. Both labels reach the 44px target and clear WCAG 1.4.3 against an image the theme cannot see. Image dimensions reserved, `loading="lazy"`, zero CLS. RTL order matches the artboard — «انضم كبراند» at the inline start. Keyboard reachable with a visible focus indicator over the photograph.
- **Complexity:** XS
- **What was done:**
  - **The two URLs are settings because the platform leaves no alternative, and that was checked rather than assumed.** Salla's page set is fixed: the breadcrumb API inside `@salla.sa/twilight` enumerates it — `product.single`, `product.index`, `page-single`, `landing-page`, `brands.single`, `blog.*`, `customer.orders.single` — and a theme cannot add to it. So the theme cannot know where the T-7.09 partner form will live, and writing a path here would break on the first store that publishes it elsewhere. **The same finding decides more than this task** — see the note on T-7.06.
  - **Nothing renders that cannot act.** A button whose URL is empty is not rendered, and the whole section is inside `{% if component.image and (brand_url or individual_url) %}`. This is T-4.01's rule about quick view, applied again: a control that does nothing is worse than an absent one for someone who cannot see that it is dead.
  - **Labels are settings with a catalogue fallback, which is one more layer than the other sections have.** The artboard's copy is the default `value` in the manifest, so a merchant retitles either action without a developer; a merchant who *clears* the field gets `theme.partner.*` back rather than an empty button. `photos_slider_title` could omit its heading when empty because a heading is optional — a button is not.
  - **No scrim, unlike the hero, and the difference is not cosmetic.** The hero lays white text directly on the photograph, so its scrim is load-bearing. Here both buttons carry their own fill, so each one's contrast is settled against that fill and the merchant's image never enters the calculation. A scrim would darken the picture for no accessibility gain.
  - **The two fills are derived numbers, not sampled ones.** 60% black reuses T-4.05's own table — over a white image 50% is 3.98:1 and fails, 55% is 4.76:1, 60% is 5.74:1. The white action gets the reverse treatment: on a white photograph its fill disappears, so `--border-interactive` at 3.63:1 draws the boundary that identifies it, and the filled action gets a translucent white hairline against the dark-image case.
  - **Buttons stop at `w-40`.** The artboard draws them at 155pt of a 360pt image; B4 lets spacing scale up but not the component inflate, so above mobile they centre rather than stretch. Same shipped step, and the same reasoning, as T-4.03's card width.

---

#### T-4.23 — Shoppable video carousel — ✅ **DONE 2026-08-08** (added 2026-08-08 by the project owner, OP-4)
- **Objective:** The centred carousel between the first shoppable block and «تجارب عملائنا» on Home — vertical social videos with their neighbours partly visible, each slide carrying the poster's identity, and **beneath the centred slide a product name, price and add-to-cart button** plus a scroll-progress indicator. No section heading; the artboard draws none.
- **Why it was added:** the section is drawn on `Home Page (No Scroll).pdf` and **no backlog task covered it** — the third time this stop condition has fired, after T-4.21 and T-4.22. The 2026-08-06 order row in `/docs/DERIVED-DECISIONS.md` had counted it as a third "shoppable block", which the 200 dpi re-read on 2026-08-08 disproved: no hotspot marker and no pill appears anywhere on it. Raised as OP-4 and opened by the owner the same day.
- **Source ruling (project owner, 2026-08-08):** the media is an **embed URL** — YouTube, TikTok or Instagram — supplied **per slide** as a theme setting, **alongside a cover image, a poster name and a product ID**. **No direct video upload.** The cover image is what the page actually renders until the viewer asks for the video, which is also what makes the section affordable.
- **Files affected:** `src/views/components/home/video-carousel.twig` (new), `src/assets/styles/04-components/video-carousel.scss` (new), `src/assets/styles/app.scss`, `src/locales/ar.json`, `src/locales/en.json`, `twilight.json`
- **Twilight components:** `salla-slider type="carousel" centered` — the same carrier T-4.21 proved draws this exact shape, consumed and not forked. **`lite-youtube-embed` is already bundled** and imported by `home.js`; it is the façade pattern this task needs, and whether it can serve a non-YouTube embed is the first thing to establish
- **New components:** video slide · **New sections:** `home.video-carousel`, registered in `twilight.json`
- **Dynamic data:** the product for each slide, resolved **from its stored ID at runtime** — the T-4.06 rule, so a renamed or repriced product needs no edit here. Everything else is merchant-supplied
- **Theme settings:** a slide collection — embed URL, cover image and its alt text, poster name, product ID
- **Dependencies:** T-4.21 *(the carrier and its indicator)*, T-4.06 *(runtime product resolution)*, T-4.03 *(the indicator's implementation)*
- **Acceptance criteria:** **Nothing autoplays and nothing third-party loads until the viewer asks** — the cover image stands in for the embed, and the iframe is created on activation. No network request to YouTube, TikTok or Instagram on page load; this is a performance criterion and a privacy one. **The product line resolves from the stored ID** and is never written into the settings. Cover images have reserved dimensions and meaningful alt text; the partial neighbours cause no CLS and no horizontal page scroll. Keyboard reachable, RTL scroll direction correct. The indicator is the T-4.03/T-4.21 one, not a third implementation. Poster identity is text, not a scraped avatar. Section hidden cleanly when the merchant supplies no slides.
- **Complexity:** M
- **What was done:**
  - **`lite-youtube-embed` was the obvious candidate and it is YouTube-only**, which the entry asked to establish first. The owner's ruling covers TikTok and Instagram too, so **one generic façade serves all three** rather than one library plus two special cases. The bundled library is left where it is; nothing here imports it.
  - **Nothing third-party is requested until the viewer presses play.** What ships is the merchant's cover image and a control. Three embedded players on one Home page would cost more than everything above them combined — and an embed that loads on sight **reports the visitor to YouTube, TikTok or Instagram whether or not they were interested**, which is the privacy half of the same criterion.
  - **The URL mapping is the whole of the complexity, and it refuses to guess.** A merchant pastes the address from the browser bar; an iframe wants a different one. Three platforms, five patterns (`watch?v=`, `youtu.be`, `shorts`, TikTok `/video/`, Instagram `/reel|p|tv/`) — and **anything unrecognised opens in a new tab instead of being guessed at**, because a wrong embed URL renders a blank rectangle and a link at least works.
  - **The play button is an addition to the artboard, and it is a necessary one.** The artboard's slides are screenshots *of* a video player, so they show no control of their own. A façade needs something to ask **with**: without a control there is nothing to press, nothing to reach by keyboard and nothing to name. Recorded in `/docs/DERIVED-DECISIONS.md`.
  - **Playing replaces the cover rather than covering it**, so the tab order stays honest — there is no longer a play button to reach, because there is no longer anything to play. Focus moves to the frame.
  - **The product line shares its resolution code with the hotspot pill, and that meant extracting rather than copying.** `partials/product-runtime.js` now holds the three things both need — the HTML escape, `getDetails()` normalisation, and the `.sicon-sar` `aria-hidden` fix that stops a screen reader reading a private-use codepoint as the currency. **T-4.06's file imports it and lost its own copies.** The *rendering* stays with each component, because a hotspot pill and a carousel caption are not the same shape.
  - **No autoplay and therefore no pause control.** T-4.21's photos carousel auto-advances and needs a WCAG 2.2.2 toggle; nothing here moves on its own, so the simplest correct thing was to add neither.
  - **The carrier and the indicator are T-4.21's**, consumed through the same `slider-config` merge. No third slider and no third indicator, which the criterion asks for by name.

---

## Phase 5 — Customer Area

#### T-5.01 — Auth step 1: method selection — ✅ **DONE 2026-08-10**
- **Objective:** SMS / email choice in a bottom sheet.
- **Files affected:** `src/views/components/auth/login-sheet.twig` (new), `src/assets/js/partials/auth.js` (new), `src/assets/styles/04-components/login-sheet.scss` (new), `master.twig`, `app.scss`, `webpack.config.js`, locales, `tests/t-5.01-login-sheet.test.mjs` (new)
- **Twilight components:** `salla-login-modal` — ~~technique C preferred, B if presentation cannot be overridden~~ **neither is available; see below**
- **New components:** auth sheet · **New sections:** none
- **Dynamic data:** `salla.auth` · **Theme settings:** none
- **Dependencies:** T-2.10, T-2.05
- **Acceptance criteria:** Salla's auth flow is never reimplemented — only re-presented. Segmented choice is a labelled radio group. Sheet is dismissible without stranding a partial session.
- **Complexity:** L
- **What was done:**
  - **The stated technique was impossible, and that was established before anything was written.** `salla-login-modal`'s whole `render()` is an `<iframe>` pointing at `accounts.salla.com`, with a `postMessage` bridge that validates that origin strictly. **The method choice, the identifier field and the code entry are Salla's pages on Salla's origin.** CSS does not cross an origin boundary and a subclass reaches the modal shell, never the document inside it — so C and B both fail, and the entry's technique line is struck through rather than quietly satisfied.
  - **The owner ruled: keep the platform's flow, re-present it in this theme's shell.** The rejected alternative — rebuilding all three steps on `salla.auth.api`, which does expose `login()`, `verify()`, `resend()` and `register()` — would have matched the artboards exactly and silently dropped **passkeys, guest checkout and new-customer registration**, none of which any artboard draws. Recorded in full as **AC-9** in `/docs/DERIVED-DECISIONS.md`, including what the theme may never try to style.
  - **«Never reimplemented, only re-presented» is met absolutely rather than nearly.** Not one field, label, validation or submission is this theme's. The criterion is usually a matter of degree; here it is a fact about which origin the form is served from.
  - **`inline` is what makes the shell ours.** Without it the component draws its own centred `<salla-modal>` — the wrong shape, and carrying the four defects T-2.10 exists to avoid. With it, `render()` returns the iframe alone and T-2.10's `<dialog>` supplies focus trap, Esc, focus return and initial focus, all from `showModal()`.
  - **One property is set on the component, and it is the platform's own idiom.** The inline branch never assigns `this.modal`, yet the `login::open` handler calls `this.modal.open()` regardless — so **left alone, the first sign-in on any page throws a TypeError**. `salla-verify` solves this for its own inline display by assigning `{ open, close, setTitle }`; `auth.js` assigns the same three, pointed at the sheet. The component keeps deciding *when* it is visible; the theme changes only *what* becomes visible.
  - **Every existing caller keeps working untouched.** `customer.twig`'s sign-in link and `cart.js`'s guest-checkout path both dispatch `login::open`, and the component still listens for it. **No event was re-routed and no trigger was rewritten** — which was the strongest practical argument for the ruling.
  - **Closing is a round trip, deliberately.** Esc, the backdrop and T-2.10's ✕ all close the dialog directly, and the component would otherwise never learn its UI had gone; the `close` event tells it, which resets `canRenderIframe` and tears the iframe down. It does not recurse, because closing an already-closed `<dialog>` is defined as doing nothing and firing nothing.
  - **The reserved height is the artboard's shortest step, not a round number.** The iframe is created only on open and then resizes itself from `postMessage` height reports across three screens of different heights. A fixed height would crop the tallest; none at all would open at zero and snap to full size, which is the CLS this theme forbids.
  - **15 cases in `tests/t-5.01-login-sheet.test.mjs`**, including that `modal` really is undefined before the bridge runs, that signing in **without** the bridge throws — so the file is not a decoration — that the double `modal.open()` on one `login::open` does not raise `InvalidStateError`, and that a `salla-login-modal` **without** `inline` is left entirely alone.
  - **The harness gained a `<dialog>` on this task, and it was overdue.** jsdom 29 reflects `HTMLDialogElement` but implements neither `showModal()` nor `close()`, so every T-2.10-based assertion would have passed vacuously against a sheet that never opened. `tests/harness/dom.mjs` now implements the observable contract — `show`, `showModal`, `close`, `open`, `returnValue`, the `close` event, and both edge cases the theme relies on. **It deliberately does not implement the focus trap, Esc, focus return or inertness**: those are the four reasons T-2.10 chose `<dialog>`, they belong to the browser, and simulating them would produce tests that assert the simulation. They stay with T-8.06 and T-8.11.

#### T-5.02 — Auth step 2: identifier entry — ✅ **CLOSED 2026-08-10, no code — carried by T-5.01 under AC-9**
- **Objective:** Phone or email input.
- **Files affected:** ~~auth sheet, `auth.js`~~ **none**
- **Twilight components:** `salla-login-modal`
- **New components:** none · **New sections:** none · **Dynamic data:** `salla.auth` · **Theme settings:** none
- **Dependencies:** T-5.01, T-2.06
- **Acceptance criteria:** Country code handling correct for Saudi numbers. Validation errors announced. Back returns to step 1 preserving state. `autocomplete` set.
- **Complexity:** M
- **What was done — and why «nothing» is the correct answer rather than an omission:**
  - **`SignIn Bottom Sheet Step 2.pdf` draws the inside of the iframe.** The «رقم الجوال» label, the `+966` flag prefix, the number field, the red «يجب أن يكون الرقم صالحًا ومكوّنًا من 10 أرقام» line and the «دخول» button are one page served by `accounts.salla.com`. **Under AC-9 not one of them is this theme's to build**, and building any of them would mean the two implementations disagreeing the first time Salla changed a rule.
  - **T-2.06 is a dependency this task cannot consume, and that is the finding.** The backlog pairs this with the theme's text-input component; there is no input on this screen for it to style. The dependency was written before the iframe was known about, and is recorded as unmet-by-design rather than quietly dropped.
  - **All four criteria are the platform's behaviour. Two were verified from here, two cannot be.** Verified by reading the component: the sheet **contains** this step without clipping — the iframe reports its height over `postMessage`, `.sheet__body` scrolls under T-2.10's 90vh cap, and with the iframe sized to its content there is no nested scroller to swallow a touch drag. **Not verifiable from here:** the Saudi country-code handling, whether the validation error is announced rather than only reddened, whether Back preserves state, and whether `autocomplete` is set — all four are attributes of a document on another origin, which no test in this repository can open. **Handed to T-8.06 (by hand, with a screen reader) and T-8.11 (on real devices), against a live storefront.** They are not claimed here.
  - **One platform behaviour observed and recorded rather than acted on.** The component's `direction` message does `document.dir = value ? "rtl" : "ltr"` — **the iframe can rewrite the whole page's direction**, which is T-1.04's baseline. It is presumably syncing with the login page's locale and is the platform's to own; it is written down because a store that flipped to LTR mid-sign-in would otherwise look like a theme defect.

#### T-5.03 — Auth step 3: OTP verification — ✅ **CLOSED 2026-08-10, no code — carried by T-5.01 under AC-9**
- **Objective:** Verification code entry and resend.
- **Files affected:** ~~auth sheet, `auth.js`~~ **none**
- **Twilight components:** `salla-login-modal`
- **New components:** none (uses T-2.07) · **New sections:** none · **Dynamic data:** `salla.auth` · **Theme settings:** none
- **Dependencies:** T-5.02, T-2.07
- **Acceptance criteria:** Resend timer announced, not visual-only. Failure states distinct and actionable. Success redirects to the pre-auth destination. Rate-limit responses surfaced honestly.
- **Complexity:** M
- **What was done — and the same answer as T-5.02, for the same reason:**
  - **`Verification Code Bottom Sheet Step 3.pdf` is the iframe too**, and it is the busiest of the three: the phone repeated above, «رمز التحقق» over four code boxes, a red «الرمز غير صحيح. حاول مرة أخرى.», the «تحقق» button, a rule reading «إعادة الإرسال بعد 60 ثانية», and three resend channels — «رسالة نصية», «اتصال آلي», «الإيميل». **Every one of them is served by `accounts.salla.com`.**
  - **T-2.07 is the second dependency this chain cannot consume.** The theme has an OTP input, built and tested; the login flow's four boxes are not it and cannot be replaced by it. **T-2.07 is not therefore wasted** — `salla-verify` uses the same four-box shape for *profile* verification, which is a different flow on a different trigger (`profile::verification`) and is genuinely in the theme's document. Recorded so that a later reader does not conclude the component was built for nothing.
  - **«Rate-limit responses surfaced honestly» is the one criterion that is partly this theme's, and it is already met.** The iframe posts `notify` messages, which the component turns into `salla.notify[type](message)` — and `salla.notify` is the notifier **T-2.12 restyled to the design and fixed two behaviours on**. So a rate-limit or a failure the platform reports arrives in the theme's own toast, pauses on keyboard focus, and closes with a button labelled «إغلاق». Verified by reading both sides; nothing was added.
  - **«Success redirects to the pre-auth destination» is met by the platform, and the mechanism is worth naming.** On `authenticated` the component closes the flow, runs `handlAfterAuthenticatedResponse`, then reloads **the current page** after a second. The pre-auth destination is therefore wherever the customer already was — the cart, a product, the account link in the header — with no destination stored, and nothing for the theme to remember or restore.
  - **Two criteria cannot be verified from here and are not claimed.** Whether the «إعادة الإرسال بعد 60 ثانية» countdown is announced rather than only drawn, and whether the failure states are distinguishable to a screen reader, are properties of a document on another origin. **T-8.06 and T-8.11**, against a live storefront. **This is also the sharpest consequence of AC-9 and should be read as such:** the accessibility of the sign-in flow is Salla's, not this theme's, and the theme cannot fix it if it is wrong — it can only report it.
  - **The tall step was checked against the shell rather than assumed to fit.** This screen is roughly four times step 1's height; the iframe reports it, `.sheet__body` scrolls under the 90vh cap, and the header with its close button stays put — which is the reason T-2.10 made only the body scroll.

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

#### T-5.08 — Notifications page — ✅ **DONE 2026-08-10**
- **Objective:** `Notifications_Page` list.
- **Files affected:** `src/views/pages/customer/notifications.twig`, `src/assets/styles/04-components/notifications.scss` (new), `src/assets/js/partials/notifications.js` (new), `src/assets/styles/app.scss`, `webpack.config.js`, `src/locales/ar.json`, `src/locales/en.json`
- **Twilight components:** `notifications.twig` — technique A; `salla-notifications` — technique C
- **New components:** notification card · **New sections:** none
- **Dynamic data:** notifications, time-ordered · **Theme settings:** none
- **Dependencies:** T-2.15, T-3.02
- **Acceptance criteria:** Timestamps use `<time datetime>` with relative text. Read/unread not conveyed by colour alone. Empty state handled.
- **Complexity:** M
- **What was done:**
  - **The artboard draws two cards, and T-3.02 already knew it.** That task shipped `space-y-6` on the content column with the comment «the same 24 the notifications artboard leaves between its two cards». The first card is the promotional-messages switch; the second is the list. Both are this task's — the acceptance criteria name only the list, and an acceptance-criteria list is not a description of an artboard.
  - **The card is not `.card`, and that was sampled rather than argued.** Rendered at 300dpi and read pixel by pixel: both cards fill `#F7F6F4` (`--surface-section`) inside a 1px `#646361` border (`--border-interactive`); the icon tiles inside them fill `#FDFDFD` (`--surface-page`). T-2.15's shell is white on `--border-subtle`. **Doc 04's "six cards share one shell" does not hold for this one**, so `.notify-panel` is declared once and used by both cards rather than the `.card--warm` variant that doc forbids.
  - **The list is technique C, and it reaches further than usual because there is no shadow root.** `salla-notifications` and `salla-notification-item` both register with Stencil encapsulation flag `0` in the loader bundle, and `salla-notifications.css` is a zero-byte file. So the rows are restyled as ordinary elements — the tile, the glyph, the grid that puts the date on the title's line, the rule between rows. **Nothing is forked and no markup is copied.**
  - **One upstream rule had to be neutralised, and it was a real collision.** The component tags every item `s-block`, which T-2.18 gives `margin-top: 1.5rem` as the *Home section* rhythm. Left alone it would have put 24px between every notification on the page.
  - **The promotional switch is built here rather than delegated to `<salla-user-settings>`.** That component carries the same setting and the same write, but renders **three** sections with subtitles — hide-my-name, promotional messages, delete-account — and takes no prop to render one; the artboard draws a single row with no subtitle. Nothing is reimplemented by declining it: the label is the platform's own `pages.profile.promotional_messages`, and the write is `salla.profile.updateSettings({name, value})` — byte for byte the call `toggleSetting()` makes. **The initial state is server-rendered from `user.is_notifiable`**, so the switch is never briefly wrong while a fetch resolves.
  - **It reverts when the platform rejects the write, which Salla's component does not.** `toggleSetting()` fires the request and never inspects the result, so a rejected write leaves the control showing the opposite of what is stored — on a **marketing-consent** setting, which is the worst place for that. Reverted, surfaced through the T-2.12 toast, and disabled while in flight so a fast second click cannot race it.
  - **`<time datetime>` had to be joined from the wire, because the component throws the timestamp away.** Salla's v2 payload carries `created_at` beside `time_ago`; `normalizeNotification()` keeps only `time_ago`, so the rendered row holds a human string and nothing machine-readable. Both fetch paths announce globally — `notifications::fetched` for the first page, `infiniteScroll::load` for every page after it — and both carry the raw response. **The join is by url + title, never by arrival order**, and a row with no match gains no `datetime`: a wrong timestamp is worse than none. The platform's relative text is left exactly as it wrote it, which is why the criterion asks for `<time>` *with* relative text rather than instead of it.
  - **The read state is the derived one, under B8.** The artboard gives all five rows one appearance — bold titles, full-strength ink — so that is taken as unread, and read is what is derived: the title drops to normal weight. Weight is not invented; it is the contrast already drawn between a row's title and its body. The third channel is text, which no stylesheet can add — «غير مقروء» goes into the row's accessible name, the same fix T-4.01 made where upstream conveyed wishlist state by fill and colour alone.
  - **The artboard's uniform 122pt row pitch is deliberately not implemented, and the drawing is the reason.** Five rows at an exactly even pitch, with bodies running to one line, two, one, two and one — a spacing the content it contains cannot produce. A fixed row height would clip the first long notification a real store sends.
  - **The icon was verified against the font rather than chosen by name.** `sallaicons.ttf` was downloaded and four candidate glyphs drawn to SVG; `sicon-special-discount` is an exact match for the artboard's percent-in-a-scalloped-badge. The same pass found the artboard's bell is **plain**, not the `sicon-bell-ring` the component renders — one `content` declaration, no markup change.
  - **Fourteen cases in jsdom.** Among them: a rejected write reverts the switch and does not also fill the live region; a row with no matching response entry gains no `datetime`; a legacy response with no `created_at` fabricates nothing; and a row rendered *after* its response is still stamped. **That last case found a real defect in this task's own first draft** — a single «this row is done» marker meant a row already in the DOM was marked finished before its timestamp arrived and could never be stamped. The two halves are now idempotent separately.
  - **Two things are recorded rather than acted on.** The gap between the two cards measures 28.6pt where T-3.02 shipped 24 citing this same artboard; changing it would move five account pages on one page's evidence, which is not this task's to do. And `pnpm run lint:format` fails on **all ten files under `tests/`**, including T-1.09's own harness — `tests/` is absent from `.prettierignore` and no file there has ever conformed. This task's test file matches its neighbours rather than becoming the only formatted one. **That tree is a T-1.09 loose end, not a T-5.08 one.**

#### T-5.09 — In-app notification overlay — ✅ **DONE 2026-08-10** (unblocked 2026-08-05, B7 closed by documented inference)
- **Objective:** The `Notification.pdf` overlay state.
- **Resolved 2026-08-05 by the B7 ruling:** the three artboards carrying this name — `Notification.pdf` (393×852), `نسخة من Notification.pdf` (393×2208, a full-page capture) and `نسخة ٢ من Notification.pdf` (393×852) — are treated as **additional states, not alternatives**. Implement every state visible in each file. ~~The 2208-tall one is a full page, not an overlay, so route it to the notifications page (T-5.08) rather than forcing it into this overlay.~~ **Corrected 2026-08-10: it is the CART page, not the notifications page.** Record both readings in `/docs/DERIVED-DECISIONS.md` as inferred.
- **Files affected:** ~~notification component~~ `src/assets/js/partials/toast.js`, `src/assets/styles/05-utilities/toast.scss`
- **Twilight components:** ~~`salla-notifications`~~ — **wrong for these artboards; the component is `salla.notify`, technique C**
- **New components:** none · **New sections:** none · **Dynamic data:** runtime · **Theme settings:** none
- **Dependencies:** T-5.08, T-2.12
- **Acceptance criteria:** Every state present in the three artboards is implemented. Announced without stealing focus. Dismissible by keyboard. The inferred split between overlay and full page is recorded in `/docs/DERIVED-DECISIONS.md`.
- **Complexity:** S
- **What was done:**
  - **The three files are one component in three contexts, and that component is T-2.12's toast.** Read at 100 dpi: `Notification.pdf` is «تمت إضافة المنتج إلى السلة بنجاح» over the PDP; `نسخة ٢` is «تم إرسال رمز التحقق بنجاح عبر الرسائل النصية.» over the open sign-in sheet; `نسخة من` is «تم تطبيق الخصم بنجاح!» over the cart. Same 345×56 panel, same 32px success disc, same 3px timer bar T-2.12 already measured across eight exports. **Most of this task was delivered before it started**, and saying so is more useful than restating it.
  - **The 2026-08-05 routing was wrong, and is corrected rather than quietly dropped.** The tall file is the **cart** page — «سلة المشتريات», «عرض السلة», the three-step order indicator, the item rows — not the notifications page. Nothing in it belongs to T-5.08, which was built from `Notifications Page.pdf` and never consumed the mistaken routing, so the correction costs nothing. It is recorded because **an unretracted inference is indistinguishable from a fact.**
  - **The backlog names the wrong component, and that is stated rather than worked around.** `salla-notifications` is the *list* on the notifications page, which is T-5.08's. These artboards draw the notifier.
  - **One real defect, and no z-index could have fixed it.** The second artboard puts the toast over an open sheet. T-2.10's sheet is a `<dialog>` opened with `showModal()`, which promotes it into the browser's **top layer** — outside the page's paint order, where no stacking value on the notifier's container can reach. The message announcing that a verification code had been sent was being painted **behind the sheet that asked for the code**. **This is the sharpest consequence yet of AC-9:** T-5.03 verified that a rate limit or a failed code arrives in this theme's own toast, and it was arriving where nobody could see it.
  - **The fix is the one mechanism that exists.** Only a modal dialog and a popover may enter the top layer, and `popover="manual"` is the variant that neither traps focus, closes on `Esc`, nor light-dismisses — a toast may do none of those. The container is promoted on the observer T-2.12 already runs. A browser without `showPopover` is not asked, and a **refused** promotion has its attribute taken back off: `[popover]:not(:popover-open)` is `display: none`, so a container left declared as a popover it never opened would hide the message outright rather than merely place it too low.
  - **It promotes only while a modal is open, and the remaining gap is stated.** Promoting every toast would be less code and would put the whole notifier behind user-agent `[popover]` styles on every page; confining it to the broken case keeps the blast radius the size of the bug. Top-layer order is by entry, so a toast raised while a sheet is open lands in front of it — **but a sheet opened *after* a toast is already showing still covers it.** A two-second overlap in a sequence no artboard draws, left alone.
  - **The user-agent styles are undone explicitly, in the stylesheet.** The moment `popover` is set the browser applies a fitted box, an auto margin, a solid border, a quarter-em of padding, `Canvas`/`CanvasText` and `overflow: auto`. The rules T-2.12 wrote already beat the UA on width and padding; what this adds is only the declarations no rule in that file or in the library happened to state — so entering the top layer costs nothing visually.
  - **The other two criteria were verified rather than assumed.** Nothing takes focus, asserted against `document.activeElement` across a toast's arrival; and keyboard dismissal is T-2.12's `sr-only`-until-`:focus-visible` close button, which also stops the timer.
  - **Seven cases in jsdom:** the promotion happens exactly when a modal is open and not otherwise, is not repeated, is skipped on a browser without the API, gives the attribute back when refused, and T-2.12's translated close-button name still lands after the extension.

#### T-5.10 — Loyalty page — ✅ **DONE 2026-08-10** · ⚠ **two drawn elements not built — see OP-6**
- **Objective:** `Loyalty_Points_Page` — balance card and redemption entry.
- **Files affected:** `src/views/pages/loyalty.twig`, `src/assets/js/loyalty.js`, `src/assets/styles/04-components/loyalty-page.scss` (new), `src/assets/styles/04-components/account-cards.scss` (new), `src/assets/styles/app.scss`, `src/locales/ar.json`, `src/locales/en.json` — **not** `04-components/loyalty.scss`
- **Twilight components:** `loyalty.twig` — technique A; `salla-loyalty`, `salla-loyalty-points-history` — technique C
- **New components:** loyalty points card · **New sections:** none
- **Dynamic data:** points balance, tier, history
- **Theme settings:** ~~`enable_loyalty` toggle~~ — **not added, see below**
- **Dependencies:** T-2.15, T-3.02
- **Acceptance criteria:** Balance announced on change. Section hidden entirely when loyalty is disabled store-side, not merely visually. Points expressed as text.
- **Complexity:** M
- **What was done:**
  - **The page moved onto the account shell, and the artboard is unambiguous about it.** `Loyalty Points Page.pdf` draws T-3.02's breadcrumb and its rule with the first card at y306 — the identical shell as `Notifications Page`, `My Account Page`, `Orders In Progress` and `Favorites Page`. Upstream extended `layouts.master` and opened with a full-bleed gradient banner carrying a 7xl star and two decorative stars. **None of that is drawn anywhere in the design.**
  - **The prize carousels were removed from the page, not from the store.** They are what `salla-loyalty` shows when «استبدل نقاطك» opens it, which is the artboard's own redemption entry — so nothing became unreachable. **The ways-to-earn grid is the one removal that costs something**, and the artboard replaces it with a single line inside the balance card: the programme's own `description`, so no string was invented and the merchant edits it where they edit the programme.
  - **The card surface was already built, under another name, and that was fixed rather than duplicated.** T-5.08 declared the warm bordered panel as `.notify-panel`; this page draws the identical box, sampled to the same `#F7F6F4` on `#646361`. It moved to `04-components/account-cards.scss` as `.account-panel` / `.account-tile`. **Two names for one surface is the same defect as two definitions of it**, and doc 04 forbids both.
  - **The balance is text, and the counter it replaced was a defect rather than a style.** Upstream's `.count-anime` starts every visit at `0` and climbs, so the accessible name of a customer's points was «0» until the animation ended — and stayed «0» under `prefers-reduced-motion`.
  - **«Announced on change» needed the platform's number, not ours.** The balance changes off this page: `salla-loyalty` runs the exchange inside its own modal. On `loyalty::exchange.succeeded` the page asks `salla.api.loyalty.getPoints()` and writes what comes back. **It does not subtract the prize's `cost_points`** — that arithmetic is the programme's, and a theme doing it would be right until the first time it was not. A failed refresh leaves the rendered figure alone rather than blanking it.
  - **«Hidden entirely when disabled store-side» is the platform's own test.** `salla.api.loyalty.isFeatureEnabled()` reads `store.features` for `loyalty-system`; Twig cannot see that array but does not need to — the `loyalty` object is absent when the programme is, which is the test upstream's own `cart.twig` uses. Nothing is rendered and then hidden, and the disabled case gets T-2.14's empty state rather than a blank shell.
  - **No `enable_loyalty` setting was added, though the entry lists one.** It would be a second switch for one thing — T-7.06's reasoning for `enable_stories` — and worse here: a theme toggle cannot stop the platform routing to this page, so it could only blank a page that still answers.
  - **The history is `salla-loyalty-points-history`, restyled from outside.** It renders a five-column table into the light DOM (encapsulation flag `0`) and owns the fetch, the paging and the empty state, so the theme adds no request of its own. Its **expiry and status columns are `sr-only` rather than deleted** — the artboard draws neither, but «expired» and «revoked» are facts about a customer's points and a stylesheet is the wrong place to decide they stop existing. Its own per-cell mobile labels become the accessible names each value needs once the table stops being laid out as one; the component had already written them.
  - **The history rows carry two icons where the artboard draws five, and the gap is a data limit stated precisely.** The five correspond to the transaction's `key`; the component renders `translateKey(key)` — the *translated* note — and never the key. Nothing in the DOM carries it, and re-fetching `/balance/points` to decorate rows is a second request for data already on the page. What ships is the two states the rendered data does support, earn and spend, read off the sign the component itself writes — plus the «كسب» / «خصم» word, which the component does not render either. **Unblocked by exactly two things:** the component exposing `key` on the row, or `salla.api.loyalty` gaining a history method that fires an event the way `getPoints()` does.
  - **⚠ TWO DRAWN ELEMENTS ARE NOT BUILT, AND NEITHER IS GUESSED AT.** The rate «/ 1 ريال» needs a points-to-currency conversion; the notice «رصيدك الحالي من النقاط سينتهي قريبًا!» needs an expiry date **for the balance**. Neither exists in `loyalty`, in `user.loyalty_points`, in `getPoints()` — which returns `{points}` alone — or in any component read for this task. `/balance/points` carries `expires_at` **per transaction**, which is a different fact. **Inventing either would put a number on a customer's screen that nothing produced.** Raised as **OP-6**; the cheapest check is whether `getProgram()` carries the rate, which needs a live storefront rather than a code change.
  - **Eleven cases in jsdom**, covering that the new balance comes from the platform rather than from arithmetic, that a response without points leaves the figure alone, that a failed refresh does not blank it, that earn and spend take different words and different icons, that rows appended by «load more» are decorated too, and that the whole script is inert on any page whose slug is not `loyalty`.

#### T-5.11 — Points earned popup — ✅ **DONE 2026-08-10**
- **Objective:** `Points_Earned_Pop-up`.
- **Files affected:** `src/views/layouts/customer.twig`, `src/views/components/ui/dialog.twig`, `src/assets/js/partials/loyalty-popup.js` (new), `src/assets/styles/04-components/dialog.scss`, `webpack.config.js`, `src/locales/ar.json`, `src/locales/en.json`
- **Twilight components:** ~~`salla-modal`~~ — T-2.10's `<dialog>` primitive, for the reasons T-2.10 recorded
- **New components:** none (uses T-2.11) · **New sections:** none · **Dynamic data:** points event · **Theme settings:** none
- **Dependencies:** T-5.10, T-2.11
- **Acceptance criteria:** Triggered by a real loyalty event, never on a timer. Focus returns on dismiss.
- **Complexity:** S
- **What was done:**
  - **«A real loyalty event» is the whole task, and the platform does not have one.** `salla.event.loyalty` carries `exchangeSucceeded`, `programFetched`, `resetSucceeded` and `loyaltyPointsFetched` — a redemption, a programme, a reset and a balance. **Nothing announces an award.** So the trigger is built from two facts the platform does state and no invented third: a rating succeeded (`rating::store.rated` / `products.rated` / `shipping.rated` — the flow the artboard draws the popup over), **and** the balance actually rose, read from `getPoints()`.
  - **Both halves are required, and each is required for a different reason.** A rating alone is not an award — a store may award nothing for reviews, or may have awarded already — and «لقد ربحت 100 نقطة» when nothing was earned is worse than no popup at all. A balance increase alone would fire on any page that happened to refresh one. Both are pinned by cases.
  - **The number is a subtraction of two platform values, never an estimate.** The theme does not decide what a rating is worth; it reports the difference between what the platform said before and what it says after, clamped at zero so a decrease can never be announced as a gain. **Where the page rendered without a balance to compare against, the dialog stays shut** — the artboard's sentence has a number in it, and a sentence with a blank where the number goes is not a sentence.
  - **It lives on the account shell, not on one page.** The artboard draws it over «تقييم الطلب», a different customer page from the loyalty one, and points are earned on several. One dialog in `layouts.customer`, and a partial that does nothing where the element is absent — the arrangement `sort-disclosure.js` established.
  - **«Focus returns on dismiss» cost nothing, and that is not luck.** `showModal()` restores focus to whatever had it, and T-2.10's scroll lock is `overflow: hidden` rather than `position: fixed`, so the rating form is still where the customer left it. The same two properties T-7.07 relied on.
  - **The confetti is `sicon-party-horn`, verified against the shipped font.** Rendered from `sallaicons.ttf` beside `party-bell`, `gifts` and `special-check`; the party popper with streamers is the design's mark. **T-2.11's dialog gained an optional decorative `icon`** to carry it — additive, every existing caller unchanged — and `/docs/DESIGN-SYSTEM.md` was updated with it, because that gate closed on 2026-08-10 and a change to the system changes the record with it.
  - **Nine cases in jsdom**, including that a rating awarding nothing does not open it, that an unexplained balance rise does not open it, that a decrease never does, that one award does not fire twice, and that a second genuine award still announces its own figure.

#### T-5.12 — Points value popup, active and inactive — ✅ **DONE 2026-08-10**
- **Objective:** `Points_Value_Pop-up_-_InActive` and its active counterpart `Points Value Pop-up -  Active.pdf` (note the double space in the filename). Both 393×852.
- **Files affected:** `src/assets/js/loyalty.js`, `src/assets/styles/04-components/loyalty-page.scss`, `src/locales/ar.json`, `src/locales/en.json`
- **Twilight components:** `salla-loyalty` / `salla-loyalty-panel` — technique C, plus a light-DOM upgrade in JS
- **New components:** none · **New sections:** none · **Dynamic data:** redemption eligibility · **Theme settings:** none
- **Dependencies:** T-5.11
- **Acceptance criteria:** Inactive state explains *why* redemption is unavailable rather than only disabling the control. Disabled state announced.
- **Complexity:** S
- **What was done:**
  - **The two artboards are one component in its two states, and that component already had the pair.** `salla-loyalty` renders its redeem control `disabled={!this.selectedItem}`, so «InActive» and «Active» are its own — both are implemented as states per B7, and neither is treated as an alternative to the other. What the artboards add is the design on top: a titled sheet, the balance in a sentence, one bordered row per redemption option.
  - **⚠ THE PRIZE ROWS WERE NOT OPERABLE BY KEYBOARD AT ALL.** Each is a bare `<div onClick>` — no `tabindex`, no `role`, no `aria-checked`. **A customer using a keyboard could not redeem loyalty points in this store.** No stylesheet reaches that, so the rows are promoted to a real radio group: roving `tabindex`, `role="radio"` inside a `radiogroup`, `aria-checked`, and Enter, Space and arrow keys with wrap. **Activation goes through the component's own `click()`**, so keyboard and pointer run identical code and a future change to `setSelectedPrizeItem` needs no change here.
  - **«Explains why» is a sentence, not a tooltip.** It sits beside the button and is tied to it with `aria-describedby`, so the reason reaches a screen reader *at the control* rather than merely near it on screen — and it is removed the instant a prize is chosen, because **a stale explanation beside a live button is worse than none.**
  - **The selected row changes border weight as well as colour**, so selection survives a monochrome rendering — the rule T-4.06's markers already follow.
  - **A defect in this task's own first draft, found by a test.** The keydown guard checked `item.dataset.loyaltyKeys`, and the marker it set was the **empty string** — falsy, so the guard never fired and a fresh handler was bound on every observer sweep, of which there are many because this method's own sibling adds a node. `hasAttribute` fixes it.
  - **Nine cases in jsdom**, covering the reason appearing and disappearing with selection, the `aria-describedby` link, the roving tabindex, the group being one tab stop, Enter routing through the component's handler, and the arrows wrapping in RTL order.

#### T-5.13 — Redemption flow and toast — ✅ **DONE 2026-08-10** (unblocked 2026-08-05, B7 closed by documented inference)
- **Objective:** Redemption completion per the two `Redemption_-_Successful_Toast_Notification` files.
- **Files affected:** `src/assets/js/loyalty.js` — **not** the loyalty templates: the toast is T-2.12's and needed nothing
- **Twilight components:** `salla-loyalty` · **New components:** none · **New sections:** none
- **Dynamic data:** redemption transaction · **Theme settings:** none
- **Dependencies:** T-5.12, T-2.12
- **Acceptance criteria:** **Both artboards are implemented as states, not treated as alternatives** (B7 ruling). Both are 393×852 and differ in content. Redemption is idempotent — double submission cannot double-spend. Failure is recoverable and explained. The inferred meaning of each state is recorded in `/docs/DERIVED-DECISIONS.md`.
- **Complexity:** M
- **What was done:**
  - **The two files are the success and error variants of T-2.12's toast, and both were already built.** The first is the green «تم استبدال 1000 نقطة مقابل 1 ريال بنجاح!»; the `-1` file is the red two-line «رصيد نقاط غير كافٍ» over «عفوًا! ليس لديك رصيد كافٍ لاستبدال هذه النقاط.» T-2.12 measured that pair across eight exports and recorded that the taller error is the same toast with a wrapping message rather than a second size. **Implemented as states per B7; neither was chosen over the other.**
  - **«Failure is recoverable and explained» was verified rather than added.** `exchangeLoyaltyPoint()` catches and calls `salla.notify.error(this.getApiErrorMessage(error))` — the platform's own message, in the notifier T-2.12 restyled, with the sheet still open behind it so the customer can pick again.
  - **⚠ «Idempotent» was NOT already true, and the gap is small and expensive.** The component sets `buttonLoading = true` and then awaits — but that flag reaches the button through a **Stencil re-render, which is asynchronous**. Two clicks in the same frame both find a button that is not yet loading, and both fire the exchange. **On a points balance that is a customer paying twice for one reward.**
  - **The guard is a capture-phase listener on the host**, which runs before the component's own handler on the button and can therefore stop it. The first confirmation passes untouched; everything after it is swallowed until the platform says the flow ended. **Nothing is re-implemented** — it cancels a duplicate event; it does not perform, retry or reconcile an exchange, which CLAUDE.md reserves to the platform.
  - **It clears on failure as well as on success, and cancel is never blocked.** A failed redemption has to stay retryable, which is this task's other criterion; and a customer who cannot leave a confirmation is worse off than one who submits twice.
  - **Five cases in jsdom**, including that three clicks in one frame reach the component once, that a failure restores the ability to retry, and that the cancel control is untouched mid-flight.

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
- **Objective:** `Orders_In_Progress`, `Orders_Pending_Payment`, and — identified 2026-08-05 — `Full Page.pdf`, which is the **"previous orders"** variant with the status filter dropdown open.
- **Files affected:** `src/views/pages/customer/orders/index.twig`
- **Twilight components:** `orders/index.twig` — technique A; `salla-orders`
- **New components:** order card · **New sections:** none
- **Dynamic data:** customer orders, statuses · **Theme settings:** none
- **Dependencies:** T-2.15, T-3.02
- **Acceptance criteria:** Status conveyed as text plus colour, covering at least **تم التوصيل / تم الإلغاء / مسترجعة** as well as in-progress and pending-payment. **All three supplied variants covered by one component.** The status filter is a real disclosure with `aria-expanded`, and its selection survives back-navigation. Per-order actions — invoice download, reorder (T-6.04), rate (T-6.08) — are present and labelled. Empty state via T-2.14. Pagination accessible.
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
- **Dynamic data:** CMS page content · **Theme settings:** **`stories_page_id`** — added 2026-08-08 by the OP-3 ruling, see below
- **Dependencies:** T-3.01, **T-7.06** *(the feed and story card this page renders)*
- **Acceptance criteria:** One template serves Shipping, Return, How-to-Order and future pages (doc 06 principle). Merchant rich-text renders with correct heading hierarchy. Prose styles defined once.
- **Carried from T-7.06 — OP-3, ruled 2026-08-08 by the project owner (reading 2).** Salla's page set is fixed and a theme cannot mint a `/stories` route, so **the stories feed gets its URL from a CMS page the merchant creates**, identified by a **`stories_page_id` theme setting** and rendered by this template. **This task therefore owns the feed page**, and with it: the breadcrumb «الرئيسية ‹ تجارب عملائنا», the **filter chips**, and the **brand dropdown** — all three drawn on `Customer Stories – Pinterest Style.pdf` and on neither Home artboard, which is why T-7.06 did not improvise them onto its section. **The story card and the grid already exist** — `components.stories.story-card` and `.stories__grid` — and must be consumed, not re-written. **One warning the stylesheet already carries:** the tag row uses `--border-subtle`, which is correct for labels and **becomes a WCAG 1.4.11 failure the moment the chips become controls**; switch it to `--border-interactive` in the same change that makes them filter. **No slug may be hard-coded** — the merchant names the page, the setting names its id. **T-7.06 stays 🟡 until this lands.**
- **Complexity:** ~~S~~ **M** — the page and its two controls are more than a prose shell

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

#### T-7.06 — Stories masonry feed — 🟡 **PARTIAL 2026-08-08, and deliberately so** — the Home section is built and complete; the remainder was reassigned to T-7.01 by the OP-3 ruling (reading 2). **Confirmed by the project owner 2026-08-10: nothing here is awaiting a decision.** The 🟡 is a pointer to T-7.01, not an open question, and it clears when T-7.01 lands in Phase 7
- **Objective:** `Customer_Stories___Pinterest_Style` feed (393×3160).
- **Source ruling (project owner, 2026-08-06):** the blog is **ruled out**; the evidence below is accepted. The source is a **theme setting in `twilight.json`**, on the same mechanism as T-4.06: a list of story items, each carrying an **image**, a **brand tag**, **category tags**, and **one or more hotspots** with relative coordinates (`x%`, `y%`) and a **product ID**. **Percentages, never pixels.** No blog, no CMS, no app backend. Managed in the theme customiser — a constraint the owner accepted explicitly and which is recorded in `/docs/DERIVED-DECISIONS.md`.
- **~~Proposed ruling~~ (project owner, 2026-08-05):** ~~source is the **Salla blog**.~~ Withdrawn 2026-08-06.
- **Visual inspection of 2026-08-05 — accepted by the owner on 2026-08-06 as the reason the blog was ruled out.** Four findings, from the files themselves:
  1. `Story Page – Pinterest Style.pdf` is **393×852, not 3160** — 3160 is this feed page, tall because it is a masonry grid. The "long editorial content" reading rested on the wrong file.
  2. That story page is **not an article**. It is a modal over the feed showing one image with a **shoppable hotspot and a product pill** (`peptide lip tint`, 119 struck to 95, bag button), tag chips, and «أضف للمفضلة» / «إغلاق». There is no article body, byline or prose anywhere in it.
  3. Feed items carry a **brand tag** (`Rhode`) plus category chips (هدايا · عروض · إكسسوارات · ميكاب · صور) with a filter row and a brand dropdown. This is product-linked taxonomy, not blog categories.
  4. The footer lists **«المدونة» (blog) and «تجارب عملائنا» (stories) as two separate destinations**, so the blog is already spoken for by different content.
  On the home page the section sits after the product grid and the shoppable blocks, and its CTA is «تابعنا على وسائل التواصل» — social/UGC framing, not editorial.
  ~~**Consequence if built on the blog anyway:** article pages with `Article` schema and no shoppable overlay — a different product from the one drawn.~~ Avoided: the blog was ruled out on 2026-08-06.
- **Files affected:** ~~`src/views/pages/stories/index.twig` (new)~~ — **corrected 2026-08-08: that file can never render.** Salla's page set is fixed and a theme cannot add a route to it, so the feed is delivered as the Home section the same design draws: `src/views/components/home/stories.twig` (new), `src/views/components/stories/story-card.twig` (new), `src/assets/styles/04-components/stories.scss` (new), `src/assets/styles/app.scss`, `src/locales/ar.json`, `src/locales/en.json`, `twilight.json`
- **Twilight components:** `testimonials.twig` / `custom-testimonials.twig` evaluated as base; `salla-infinite-scroll`
- **New components:** story card, masonry grid · **New sections:** Stories (registered)
- **Dynamic data:** **resolved 2026-08-06 — theme settings.** Per item: image, brand tag, category tags, and one or more hotspots each carrying `x%`, `y%` and a product ID. Product data resolves from the stored ID at render time, so a renamed or repriced product needs no edit here
- **Theme settings:** `enable_stories` toggle, plus the story-item collection itself (image, brand tag, category tags, hotspot list)
- **Dependencies:** T-2.15, T-4.06 *(the hotspot component)*
- **Acceptance criteria:** The hotspot marker and product pill are **the component built in T-4.06, not a second implementation** — a duplicate implementation is a defect. **Coordinates stored and applied as percentages**; a pixel value anywhere is a defect. Masonry via CSS columns or grid, not a JS layout library. Reading order matches visual order. Filter chips are real controls and the filtered count is announced. Images lazy-loaded with reserved dimensions. The merchant adds, edits and removes stories and their hotspots entirely from the theme customiser, with no code change.
- **Complexity:** L
- **What was done:**
  - **The page in "Files affected" cannot exist, and this was checked in the platform rather than assumed.** Salla's page set is fixed: `@salla.sa/twilight`'s breadcrumb API enumerates it — `product.single`, `product.index`, `product.index.tag`, `page-single`, `landing-page`, `brands.single`, `blog.single`, `blog.index.author`, `blog.index.category`, `blog.index.tag`, `customer.orders.single` — and `src/views/pages` mirrors that list exactly, upstream and here. **A theme cannot mint `/stories`.** So the artboard's feed *page* has no address to live at, and what shipped is the Home section the same artboard also draws, which is what doc 07 called it all along: "Story Feed → New Component → **Stories Section**". **Raised as OP-3** in `/docs/DERIVED-DECISIONS.md`, with the `page-single` + page-id-setting mechanism written up as the recommendation. **It is the owner's ruling, not this task's.**
  - **What that leaves unmet, precisely: the filter chips and the brand dropdown.** Both are drawn on the *page* and on neither Home artboard, and there is no page. They are **not** improvised onto the Home section, because adding a control the artboard does not draw is exactly what B4 forbids. **The criterion "filter chips are real controls and the filtered count is announced" is therefore open, and is not being claimed.**
  - **The tags shipped as labels, not as dead chips.** They are `<li>` text with `--border-subtle`, and the stylesheet says at the point of definition that the token becomes a 1.4.11 failure the moment they turn into controls. That is the one line the page task will have to change, and it is written where it will be read.
  - **The card is deliberately not focusable.** Pressing a story opens the T-7.07 modal, which does not exist yet; a card that looks pressable and does nothing is worse than a plain image for someone who cannot see that it is dead. Same call as T-4.01's quick view. **T-7.07 adds the trigger**, and the card is a partial precisely so it can.
  - **Zero CLS needed a stored ratio, because nothing else knows one.** The merchant supplies a URL and the platform attaches no dimensions to it, so a masonry of unknown-height images either reserves its boxes from a stored value or does not reserve them at all. `items.shape` is a three-option dropdown feeding `--card-media-ratio`, **which T-2.15's card shell already reads** — the shell anticipated exactly this and needed no change.
  - **The media well is reused and no surface is redeclared.** `.card__media` gives the reserved box; the radius is added here because the artboard draws a rounded photograph with tags beneath it on the page, **not** a white card containing both. A `.card` wrapper would have drawn a box the design does not have.
  - **One hotspot per story, and the schema is why.** `twilight.json` supports no nested collection — the limit T-4.06 hit and recorded — so a story cannot hold a *list* of points. The ruling asks for "one or more"; one is what the schema holds and one is what `Story Page – Pinterest Style.pdf` draws. **The three hotspot fields are stored by this task and rendered by T-7.07**, which consumes the T-4.06 primitive.
  - **No `enable_stories` toggle was added, and the omission is deliberate.** A registered section already has an enable control — the merchant adds or removes it in the customiser — and a second switch inside it would be two ways to turn off one thing, with the usual result that they disagree. T-3.03 needed its own toggle because the marquee is **not** a section; this is.
  - **The CTA is a setting with a catalogue fallback and no invented destination.** «تابعنا على وسائل التواصل» is social framing and the artboard names no target, so the URL is the merchant's; **no URL means no button.** The label falls back to `theme.stories.follow_cta` when cleared, for the same reason as T-4.22's two actions.
- **Carried to T-7.07:** the trigger on the story card, the modal itself on the T-2.10 primitive, and the rendering of the three hotspot fields **through `components.ui.hotspot-image` and `partials/hotspots.js`** — a second implementation is a defect by ruling.
- **OP-3 ruled 2026-08-08 by the project owner — reading 2.** The stories feed gets a real URL through a **CMS page the merchant creates**, with a **`stories_page_id` theme setting** naming it, rendered by `page-single.twig`. **The work moves to T-7.01**, which already owns that template; nothing further is carried here. **This task's own marker stays 🟡 only until T-7.01 lands the page**, because the filter chips and the brand dropdown belong to it.
- **Carried to T-7.01 by that ruling:** the feed page and its breadcrumb, the `stories_page_id` setting, the filter chips and the brand dropdown, and the fact that the tag row's `--border-subtle` becomes a WCAG 1.4.11 failure the moment those chips become controls.
- **Confirmed by the project owner, 2026-08-10 — and the point of the confirmation is that there is no new ruling.** OP-3 was decided on 2026-08-08 and reading 2 stands; the marker stays 🟡 **until T-7.01 lands in Phase 7**, and nothing is expected of anyone before then. **This task is not a blocker and must not be counted as one** when Phase 5 or Phase 6 status is reported: a 🟡 that means "the rest of this work has an owner and a date" is a different thing from a 🟡 that means "somebody must decide". Re-opening the source question, the route question or the filter-chip question here is out of scope — **T-7.01 owns all three.**

#### T-7.07 — Story detail view — ✅ **DONE 2026-08-08**
- **Objective:** `Story_Page___Pinterest_Style` (393×852) — **a modal over the feed, not a page.** Visual inspection 2026-08-05, **confirmed by the project owner 2026-08-06.**
- **Ruling (project owner, 2026-08-06):** the story view is a **modal built on the T-2.10 primitive**, not a standalone page and not a route of its own. **No `Article` schema.** The hotspot and product pill are the T-4.06 component.
- **Files affected:** `src/views/components/stories/story-modal.twig` (new) — **not** `pages/stories/single.twig`
- **Twilight components:** ~~blog single as base candidate~~ withdrawn; T-2.10 sheet/dialog primitive
- **New components:** story viewer (modal body only) · **New sections:** none
- **Dynamic data:** the story item from the T-7.06 theme setting · **Theme settings:** none of its own
- **Dependencies:** T-7.06, T-2.10, T-4.06
- **Acceptance criteria:** ~~Article schema emitted.~~ **Withdrawn** — the artboard shows no article, and the owner confirmed it on 2026-08-06. Presents as a dialog sharing focus management with T-2.10. Contains the T-4.06 hotspot and product pill, «أضف للمفضلة» and «إغلاق». Keyboard operable. Dismissal returns focus to the originating feed card at its prior scroll position.
- **Complexity:** M
- **Carried from T-4.06 (owner's B6 ruling):** the hotspot primitive already exists — `components/ui/hotspot-image.twig`, `assets/js/partials/hotspots.js`, `04-components/hotspot.scss`. **Consume it. A second implementation is a defect, not a variation.** If this task needs hotspots on a page the `home` bundle does not cover, import `partials/hotspots` from that page's bundle; do not copy it.
- **What was done:**
  - **Three of the four acceptance criteria were met by consuming what already existed, and the file is short because of it.** The dialog, its focus trap, `Esc`, the backdrop and the focus return are T-2.10's — and under it, `<dialog>`'s. The marker and pill are T-4.06's, unchanged. What this task actually wrote is the arrangement, the trigger on the card, and one small module.
  - **"Dismissal returns focus to the originating feed card at its prior scroll position" cost nothing, and that is not luck.** `showModal()` restores focus to the element that had it — the card's own button. The scroll position survives because **T-2.10's lock is `overflow: hidden` and not `position: fixed`**; the fixed variant is the one that discards the offset, and this criterion is why the primitive does not use it.
  - **The card became a control here, and only here.** T-7.06 shipped it inert on purpose because the modal did not exist. The media is now wrapped in a `<button>` — **the card's only focusable descendant**, per T-2.15 — with the tags outside it, as drawn. **A button and not a link:** it opens a dialog, and there is no URL for it to be, which is the same platform fact that sent the feed page to T-7.01.
  - **The accessible name is not the image's alt.** Alt is optional on a story and empty means decorative, so a trigger relying on it would sometimes have no name at all. It is built from the brand where there is one and falls back to a generic phrase.
  - **One story modal per card, rendered by the section rather than inside the card.** A `<dialog>` in a `<li>` inside a masonry column is laid out by that column — irrelevant to where it *appears*, since the top layer decides that, but wrong as a parent.
  - **The hotspot inside a modal is deferred, and that is the one behavioural line this task adds.** Twenty-four stories would otherwise mean twenty-four `salla.product.getDetails()` calls on Home for products behind modals nobody opened. `Hotspots.boot()` now skips `[data-hotspot-defer]` and `Hotspots.mount()` is exposed and idempotent; `partials/story-modal.js` watches each dialog's `open` attribute and mounts on first show. **One implementation still, per the ruling — what changed is when it runs.** The image is free for the same reason: `loading="lazy"` inside a `display: none` dialog is never fetched.
  - **«أضف للمفضلة» is `btn--wishlist` with a `data-id`, which is the selector `wishlist.js` already syncs.** So the true state arrives from `salla.wishlist.event` and is corrected from storage on load — the button cannot claim a product is favourited when the request failed, which is the bug T-4.01 found in upstream's card.
  - **That control is a *text* button, which exposed a gap in T-4.01's fix.** `syncFavoriteState()` set only `aria-label`, correct for an icon heart; on a text button the visible «أضف للمفضلة» and the accessible "remove from favourites" would disagree, and WCAG 2.5.3 asks that the accessible name contain the visible label. It now also updates `[data-wishlist-text]` where a button has one. Icon buttons have none and are untouched.
  - **No `Article` schema and no visible heading**, per the artboard and the owner's 2026-08-06 confirmation — **but the dialog is still named.** `title_hidden` keeps the accessible name and drops the pixels, because an unnamed dialog is announced as "dialog" and nothing more.
- **Carried to T-7.01:** the stories page must import `partials/story-modal` — and with it `partials/hotspots` — from whichever bundle serves it. Both are in `home.js` today because Home is the only surface that has the feed.

#### T-7.08 — Story share toast — **UNBLOCKED 2026-08-06 (B6 closed)**
- **Objective:** `Story_Page___Toast_Notification`.
- **Files affected:** story templates
- **Twilight components:** `salla.notify` · **New components:** none · **New sections:** none · **Dynamic data:** runtime · **Theme settings:** none
- **Dependencies:** T-7.07, T-2.12
- **Acceptance criteria:** Share uses the Web Share API with clipboard fallback. Result announced.
- **Complexity:** XS

#### T-7.09 — Partner / brand-join page — **UNBLOCKED 2026-08-05 (B6: destination resolved, with a stop condition)**
- **Objective:** `Do_you_have_a_brand_or_want_to_join_us_`.
- **Source ruling (project owner, 2026-08-05):** submissions go through **Salla's contact page and its message system**. **No external form service, and no email address written into the theme.**
- **⚠ Standing stop condition:** if Salla's contact path cannot carry this form — extra fields, attachments, or routing the design requires — **stop and ask the project owner. Do not improvise a destination.** Verify the path before building, not after.
- **Files affected:** `src/views/pages/partner.twig` (new)
- **Twilight components:** `salla-file-upload` if attachments are required
- **New components:** partner form · **New sections:** none
- **Dynamic data:** submissions via Salla's contact/message system
- **Theme settings:** page enable toggle
- **Dependencies:** T-2.06
- **Acceptance criteria:** **Both artboards are implemented as states** (B7 ruling): `..._.pdf` is 393×2712 and `..._-1.pdf` is 393×1660, a 1052pt difference, so they are different screens or stages of one flow. Their inferred meaning is recorded in `/docs/DERIVED-DECISIONS.md`. **Destination resolved 2026-08-05:** submissions post through Salla's contact page and message system — no external service, and no email address written into the theme. **The stop condition stands:** if that path cannot carry the form the design draws — extra fields, attachments, routing — **stop and ask; do not improvise a destination.** Verify before building, not after. Spam protection that does not rely on a CAPTCHA barrier for assistive-tech users. Success and failure both communicated.
- **Complexity:** M

#### T-7.10 — Identify `Full_Page.pdf` — **UNBLOCKED 2026-08-05 (B7 closed by documented inference)**
- **Objective:** ~~Determine what `Full_Page.pdf` specifies.~~ **Done 2026-08-05 by visual inspection: it is the Orders list, "previous orders" tab, with the status filter dropdown open.**
- **Files affected:** unknown
- **Twilight components:** `salla-orders` · **New components:** status filter dropdown · **New sections:** none · **Dynamic data:** customer orders · **Theme settings:** none
- **Dependencies:** T-6.01
- **Acceptance criteria:** **Folded into T-6.01**, which now covers three status variants rather than two. Recorded in `/docs/DERIVED-DECISIONS.md` as "inferred, not confirmed by Design". This task closes when T-6.01 absorbs it.
- **Complexity:** unknown until identified

#### T-7.11 — 404 page — **derived, no artboard**
- **Objective:** Not-found page. **No artboard exists** — derived under the B8 ruling.
- **Files affected:** `src/views/pages/errors/404.twig`
- **Twilight components:** upstream error template — technique A
- **New components:** none — uses T-2.14 · **New sections:** none
- **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-7.01, T-2.14
- **Acceptance criteria:** Uses the empty-state component in the established visual language; no new pattern invented. Returns a real HTTP 404, not a soft 200. Offers a route onward — home, search, categories. Copy comes from `src/locales/`. Recorded in `/docs/DERIVED-DECISIONS.md`.
- **Complexity:** XS

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

#### T-8.09 — Cross-breakpoint regression — **UNBLOCKED 2026-08-05 (B4 closed by derivation authority)**
- **Objective:** Verify all four tiers from doc 10.
- **Files affected:** all
- **Twilight components:** all · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-8.08, T-0.04
- **Acceptance criteria:** Every commerce-critical flow tested at every breakpoint (doc 10 requirement). Above 768px, verify against the five derivation rules in T-0.04 — same elements, same order, no additions, no hiding — not against an artboard, since none exists.
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
| 0 — Decision gate | 5 | 0 |
| 1 — Setup & Architecture | 8 | 0 |
| 2 — Design System | 16 | 0 |
| 3 — Core Layout | 10 | 0 |
| 4 — Commerce | 20 | 0 |
| 5 — Customer Area | 15 | 0 |
| 6 — Orders | 9 | 0 |
| 7 — Content | 11 | 0 |
| 8 — Optimization & QA | 12 | 0 |
| **Total** | **106** | **0** |

**Zero of 106 tasks are blocked.** Recomputed 2026-08-06, when the owner closed B6 by ruling the Stories source. Every phase is clear. **B5 closed 2026-08-10 — docs 16/17 are authoritative on phase numbering and doc 01 is corrected to match — so the register now has no open entry at all.**

**Recomputed again 2026-08-06, after T-1.03.** Phase 4 stays at **20** and the total stays at **106**: **T-4.07 withdrawn** (no brands strip exists in either Home artboard; T-4.17 already carries brands as pages) and **T-4.21 added** (the «تنسيقات جاهزة من أملاس» carousel, which the design draws and no task covered). One out, one in. **Nothing is blocked, but two questions are open and recorded in `/docs/DERIVED-DECISIONS.md` under "Open — awaiting owner input":** `author_email` has no value (**OP-1**, must be answered before the first publish attempt) and the footer's «المدونة» link contradicts the blog being ruled out (**OP-2**, must be answered before T-3.08 closes). Neither stops work today.

**Revised 2026-08-06, third pass.** B6 closed — the blog ruled out, Stories sourced from a theme setting on the T-4.06 hotspot mechanism, the story view a modal on T-2.10, no `Article` schema. Unblocked **T-0.05, T-7.06, T-7.07, T-7.08** — the last four. Against the previous 4 blocked:

**Revised 2026-08-05, second pass.** The project owner closed B1, B2, B4, B7, B8 and B9, and narrowed B6. Against the original 101/22:

- **B1 closed** — typography is Salla's platform default via the `fonts` feature. Unblocked T-0.01, T-2.02.
- **B2 closed** — Tailwind and `@salla.sa/twilight-tailwind-theme` scales as shipped, nothing measured from Figma. Unblocked T-0.02, T-2.03.
- **B4 closed** — written derivation authority, not new artboards. Unblocked T-0.04, T-1.06, T-8.09.
- **B6 narrowed, then closed 2026-08-06** — all data from Salla; order tracking resolved as `salla-order-shipments`. Unblocked T-3.03, then T-4.06, T-7.09, and finally T-0.05, T-7.06, T-7.07, T-7.08.
- **B7 closed** by documented inference — unnamed artboards are additional states, never alternatives. Unblocked T-4.17, T-5.09, T-5.13, and the B7 half of T-7.09.
- **B8 closed** by derivation. Unblocked T-2.14, and added **T-4.19** (category listing), **T-4.20** (search results) and **T-7.11** (404), which the four missing screens needed and did not have.
- **B9 closed** — payment and trust marks consumed from `salla-payments` and store data, never bundled as images. Unblocked T-3.09.
- Earlier in the day: B3 closed, T-4.18 and T-6.08 unblocked, T-5.14 and T-5.15 added.

**The remaining six:** ~~T-0.05, T-4.06 (hotspots), T-7.06/07/08 (Stories), T-7.09 (partner form).~~ **None. All six cleared — the last four on 2026-08-06.**

Every inference made under the B7 and B8 rulings is recorded in `/docs/DERIVED-DECISIONS.md`, together with the accepted cost of the Stories ruling.

**Critical path:** T-0.01/02/03 → T-1.01 → T-1.04 → T-2.01/02/03 → T-2.16 → T-3.01 → T-3.04 → T-4.01 → T-4.08. ~~Everything downstream of T-2.02 depends on typography being resolved, which makes Blocker 1 the single highest-value thing to unblock.~~ Superseded: B1 closed 2026-08-05, so the path is now purely sequential and nothing on it waits on an answer. **T-4.06 is the new pivot** — the hotspot component it builds is consumed by T-7.06 and T-7.07, so a second implementation there is a defect, not a variation.

**Largest items, split before starting:** T-4.06 (shoppable lookbook, XL), T-2.10, T-3.04, T-4.01, T-4.05, T-4.09, T-4.10, T-4.13, T-4.15, T-5.01, T-7.06, T-8.06, T-8.09.

---

## 10. Blocker register

| # | Blocker | Blocks | Owner |
|---|---|---|---|
| ~~B1~~ | ~~Typography values unrecoverable~~ — **CLOSED 2026-08-05: typography is Salla's platform default via the `fonts` feature and the merchant customiser. No font is pinned in SCSS or Tailwind, so the missing Figma values were never needed** | — | Design |
| ~~B2~~ | ~~Spacing, radius, elevation, motion values absent~~ — **CLOSED 2026-08-05: build on the Tailwind and `@salla.sa/twilight-tailwind-theme` scales as shipped. Nothing is measured out of Figma. Semantic tokens are added only where a real task needs one** | — | Design |
| ~~B3~~ | ~~Documented folder structure conflicts with real Twilight structure~~ — **CLOSED 2026-08-05: follow real Twilight structure; docs 02/18 to be amended** | — | Architecture |
| ~~B4~~ | ~~No desktop or tablet designs — 50/50 exports are 393pt wide~~ — **CLOSED 2026-08-05 by written derivation authority, not by new artboards.** The 393pt design binds content, order and hierarchy. Larger tiers derive from doc 10 under five rules: bounded centred container; grids gain columns while the card is unchanged; bottom sheets become centred dialogs above tablet; footer goes multi-column; spacing and type scale up through Tailwind. Adding, reordering or hiding content remains forbidden. See T-0.04 | — | Design |
| ~~B5~~ | ~~Phase numbering conflict between doc 01 and docs 16/17~~ — **CLOSED 2026-08-10 by the project owner: docs 16 and 17 are authoritative on phase numbering; doc 01 is corrected to match.** The two agree through Phase 5 and diverge at 6: doc 01 reads **6 Content Pages · 7 Optimization · 8 QA & Release**, and has **no Orders phase at all**; docs 16/17 read **6 Orders · 7 Content · 8 Optimization & QA**. This backlog has followed 16/17 since it was written — `T-6.*` is Orders, `T-7.*` is Content, `T-8.*` is Optimization and QA — so **no task, id or dependency moves.** ⚠️ **`01-PROJECT-ROADMAP.docx` is a Word binary and has not been rewritten**; the correction is recorded here and in `/docs/DERIVED-DECISIONS.md`, and the file itself is the owner's to amend | — | PM |
| ~~B6~~ | ~~Unnamed data sources for non-native features~~ — **CLOSED 2026-08-06.** All data comes from Salla via `salla-*` and Twig, except what the platform has no home for. Resolved: order tracking (`salla-order-shipments`), announcement text (theme setting), **shoppable hotspots** (theme setting — image plus points carrying `x%`/`y%` and a product ID, percentages never pixels), **partner form** (Salla contact page and message system, with a standing instruction to stop and ask if that path cannot carry it), and finally **the Stories** — **the blog is ruled out**; stories are a **theme setting** on the T-4.06 mechanism (image, brand tag, category tags, hotspots with `x%`/`y%` and a product ID), the story view is a **modal over the feed built on T-2.10**, and **no `Article` schema** is emitted. The accepted cost — customiser management rather than a content panel — is recorded in `/docs/DERIVED-DECISIONS.md` | — | Platform |
| ~~B7~~ | ~~Unidentified exports~~ — **CLOSED 2026-08-05 by documented inference.** Unnamed artboards are treated as **additional states, never as alternatives**: implement every state each file shows. `Full_Page.pdf` and `Ariana_Grande.pdf` are identified by visual inspection. Every such call is recorded in `/docs/DERIVED-DECISIONS.md` and stamped **"inferred, not confirmed by Design"**. The measured fact behind the ruling stands: the partner, redemption and `Notification` files differ in page height and byte size, so none is a copy of another. **Partially confirmed 2026-08-08 by the SVG exports, which arrived named.** `Notification.svg` and `Add to Cart Notification.svg` are **byte-identical** (`5f7c827a…`), so the unnamed `Notification` artboard **is the add-to-cart notification** — an inference replaced by proof. Two further notifications arrived that had no PDF at all: **Login Notification** and **Shopping Cart Notification**. **Still open:** «نسخة من Notification» and «نسخة ٢ من Notification» have no SVG, so those two remain identified by inference alone | — | Design |
| ~~B8~~ | ~~Missing screens: search results, collection listing, empty states, 404~~ — **CLOSED 2026-08-05 by derivation.** The four are built from existing components and upstream Twilight templates in the established visual language — warm background, white cards, subtle borders, the same buttons — with no new visual pattern invented. Tasks T-4.19, T-4.20 and T-7.11 were added to carry them; empty states stay with T-2.14. Earlier the same day the filter panel and order rating were found present, unblocking T-4.18 and T-6.08 | — | Design |
| ~~B9~~ | ~~Third-party payment and trust mark provenance and usage rights~~ — **CLOSED 2026-08-05: marks are consumed from `salla-payments` and store data, never bundled as theme images. The theme ships no third-party mark, so it acquires no usage-rights exposure** | — | Legal / Platform |
