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

#### T-0.01 — Resolve typography source — ✅ CLOSED 2026-08-05
- **Ruling (project owner, 2026-08-05):** Typography is **Salla's platform default**, delivered through the `fonts` feature in `twilight.json` and the merchant's theme customiser. **No font is pinned in SCSS or Tailwind.** The theme consumes the font variables the platform provides, and changing the font must be possible from the merchant dashboard with no code change. This closes B1 without recovering any Figma value — the values were never needed, because the theme does not own them.
- **Objective:** ~~Obtain binding font family, weight, size, line-height and letter-spacing values.~~ Superseded: confirm the platform font pipeline is wired and merchant-switchable.
- **Files affected:** none (input gathering)
- **Twilight components:** `src/assets/styles/01-settings/fonts.scss` (currently empty), `twilight.json` `features: ["fonts"]`
- **New components:** none · **New sections:** none · **Dynamic data:** none
- **Theme settings:** determines whether `font_family` is exposed as a merchant setting
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

#### T-2.02 — Typography tokens — **UNBLOCKED 2026-08-05 (B1 closed)**
- **Objective:** Font faces, scale and weights as tokens.
- **Files affected:** `src/assets/styles/01-settings/fonts.scss`, `tailwind.config.js`, `src/assets/fonts/`
- **Twilight components:** `features: ["fonts"]`
- **New components:** none · **New sections:** none · **Dynamic data:** none
- **Theme settings:** `font_family` select
- **Dependencies:** T-0.01, T-2.01
- **Acceptance criteria:** Faces come from the platform `fonts` feature — **not self-hosted and not pinned in SCSS or Tailwind**. The type scale is Tailwind's as shipped. Switching the font in the merchant customiser reflows every screen with no rebuild. No layout shift on font swap. Any semantic type token added on top is recorded in `/docs/DERIVED-DECISIONS.md`.
- **Complexity:** M

#### T-2.03 — Spacing, radius, elevation, motion tokens — **UNBLOCKED 2026-08-05 (B2 closed)**
- **Objective:** Remaining visual primitives as tokens.
- **Files affected:** `tailwind.config.js`, `src/assets/styles/01-settings/global.scss`
- **Twilight components:** none · **New components:** none · **New sections:** none · **Dynamic data:** none · **Theme settings:** none
- **Dependencies:** T-0.02, T-2.01
- **Acceptance criteria:** Tailwind and `@salla.sa/twilight-tailwind-theme` scales are used **as they ship**; nothing is measured out of Figma. Semantic tokens are added only where a real task needs one, each recorded in `/docs/DERIVED-DECISIONS.md`. Motion tokens respect `prefers-reduced-motion` at the token layer so no component has to remember. Doc 14's durations encoded.
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

#### T-2.14 — Empty states — **UNBLOCKED 2026-08-05 (B8 closed by derivation)**
- **Objective:** Empty treatments for cart, favorites, orders, notifications, search.
- **Files affected:** `src/views/components/ui/empty-state.twig` (new)
- **Twilight components:** `no-content-placeholder`
- **New components:** empty state · **New sections:** none · **Dynamic data:** none
- **Theme settings:** none
- **Dependencies:** T-2.13, T-0.05
- **Acceptance criteria:** One reusable component covering all five contexts. **Derived** under the B8 ruling: built from existing components and upstream Twilight templates in the established visual language — warm page background, white card, subtle border, the same buttons. No new visual pattern is invented. Each derivation recorded in `/docs/DERIVED-DECISIONS.md`.
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
- **Acceptance criteria:** One `<h1>` per page enforced by template contract. Landmarks present. Critical CSS inlined, rest deferred. Upstream hooks preserved so Salla injects correctly. **Carried from T-1.05:** the `<noscript>` block at `master.twig:104-106` is the theme's only hard-coded user-facing string — English prose shown to an Arabic-first audience. Move it to `theme.*` in `src/locales/`. It was left in place rather than fixed earlier because this task is the one that shadows the file. **Carried from T-1.04:** line 53 already emits `lang` and `dir` correctly from the platform; preserve it exactly when copying the file down.
- **Complexity:** M

#### T-3.02 — Customer layout override
- **Objective:** Shell for account-area pages.
- **Files affected:** `src/views/layouts/customer.twig`
- **Twilight components:** `customer.twig` — technique A
- **New components:** none · **New sections:** none · **Dynamic data:** customer session · **Theme settings:** none
- **Dependencies:** T-3.01
- **Acceptance criteria:** Consistent navigation across all customer pages (doc 06 principle). Unauthenticated access redirects correctly.
- **Complexity:** S

#### T-3.03 — Announcement marquee bar — **UNBLOCKED 2026-08-05 (B6 narrowed)**
- **Objective:** Scrolling promotional bar above the hero.
- **Files affected:** `src/views/components/announcement-bar.twig` (new), `src/assets/styles/04-components/announcement.scss` (new)
- **Twilight components:** none
- **New components:** marquee · **New sections:** registered in `twilight.json`
- **Dynamic data:** announcement text — **resolved 2026-08-05: a theme setting**, per the configurability principle. Not CMS, not hard-coded.
- **Theme settings:** `announcement_text`, enable toggle
- **Dependencies:** T-3.01, T-0.05
- **Acceptance criteria:** Text comes from the `announcement_text` setting and the bar has an enable toggle — a merchant can change or disable it without a developer. Nothing is written into the Twig. Animation pauses on hover and stops entirely under reduced-motion. Content readable by screen readers without repetition. RTL scroll direction correct. No CLS on load.
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

#### T-3.09 — Payment and trust marks — **UNBLOCKED 2026-08-05 (B9 closed)**
- **Objective:** Tabby, Google Pay, Apple Pay, Visa, Mastercard, mada, Maroof.
- **Files affected:** `src/assets/images/`, footer template
- **Twilight components:** `salla-payments`
- **New components:** none · **New sections:** none
- **Dynamic data:** enabled payment methods via `salla-payments` and store data — **confirmed 2026-08-05**
- **Theme settings:** possibly none if platform-driven
- **Dependencies:** T-3.08, T-0.05
- **Acceptance criteria:** Marks are consumed from `salla-payments` and store data — **no bundled image strip**, which is what closes the usage-rights question: the theme never ships third-party marks. Marks reflect actually-enabled methods. Maroof badge links to the real registration.
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
- **Twilight components:** `products-slider.twig` — technique A. **Corrected 2026-08-06 under T-1.03:** this line previously named `slider-products-with-header.twig` as a second carrier. It is not one. That template forces a required full-bleed background image with the title laid over it, which the artboard does not draw; its registration was deleted in T-1.03. `products-slider.twig` alone renders the title, «عرض الكل» and the product carousel the design shows
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

#### T-4.06 — Shoppable lookbook section — **UNBLOCKED 2026-08-05 (B6: source resolved)**
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

#### ~~T-4.07 — Brands strip section~~ — ❌ **WITHDRAWN 2026-08-06 by the project owner**
- ~~**Objective:** Brand logos row on Home.~~
- **Why it was withdrawn:** **the section does not exist in the design.** Both Home artboards were read end to end at 100 dpi on 2026-08-06 during T-1.03 — `Home Page (No Scroll).pdf` (393×5131) and `Home Page (Scroll).pdf` (393×852) — and no brand-logo row appears at any scroll position. The task was written from an assumption about what a Home page usually contains, not from an artboard.
- **Where brands actually live in the design:** as **pages**, not as a Home strip — the `Ariana Grande.pdf` brand template with its `البراندات | Brands` breadcrumb, sort disclosure and two-column grid. **T-4.17 already carries all of it.** Nothing is lost by this withdrawal.
- **What went with it:** the `home.brands` registration was deleted from `twilight.json` in T-1.03, and with it the `is_more_button_enabled` setting, whose only consumer was `brands.twig`. **The file `src/views/components/home/brands.twig` was left on disk** — T-1.03's scope was `twilight.json` alone, and deleting an upstream file is an override that would have to be recorded in `/docs/OVERRIDES.md`.
- **To reverse this,** restore the `home.brands` entry in `twilight.json`. The template is untouched, so the section returns with one registration. Recorded in `/docs/DERIVED-DECISIONS.md`.

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

#### T-4.17 — Brand page — **UNBLOCKED 2026-08-05 (B7 closed by documented inference)**
- **Objective:** Brand header plus catalogue, per `Ariana_Grande`.
- **Files affected:** `src/views/pages/brands/single.twig`, `src/views/pages/brands/index.twig`
- **Twilight components:** `brands/single.twig` — technique A
- **New components:** brand header · **New sections:** none
- **Dynamic data:** brand, brand products · **Theme settings:** none
- **Dependencies:** T-4.07, T-4.01
- **Acceptance criteria:** **Confirmed 2026-08-05 by visual inspection: it is the brand page template**, not a campaign one-off — brand cover image, `البراندات | Brands` breadcrumb, sort dropdown, two-column product grid, standard footer. Recorded in `/docs/DERIVED-DECISIONS.md`. The sort control is the same disclosure pattern as the orders status filter in T-6.01 — share it. Brand schema emitted. Pagination or infinite scroll accessible.
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

#### T-4.19 — Collection / category listing page — **derived, no artboard**
- **Objective:** The listing page that categories, collections and the "view all" links land on. **No artboard exists** — derived under the B8 ruling.
- **Files affected:** `src/views/pages/product/index.twig`, `src/views/pages/brands/index.twig`
- **Twilight components:** upstream `product/index.twig` — technique A; `salla-products-list`, `salla-infinite-scroll`, `salla-filters`
- **New components:** none — assembled from T-4.01 cards, T-4.04 section header and T-4.18 filters · **New sections:** none
- **Dynamic data:** category products, pagination, filter state
- **Theme settings:** products per page, default sort
- **Dependencies:** T-4.01, T-4.04, T-4.18, T-2.14
- **Acceptance criteria:** Built from existing components and the upstream template in the established visual language — warm page background, white cards, subtle borders, the same buttons. **No new visual pattern is invented.** Grid gains columns above mobile per the T-0.04 rules; the card itself does not change. Empty result uses T-2.14. Sort and pagination accessible, and filter state survives back-navigation. Every visual choice recorded in `/docs/DERIVED-DECISIONS.md`.
- **Complexity:** M

#### T-4.20 — Search results page — **derived, no artboard**
- **Objective:** Results for the header search. **No artboard exists** — derived under the B8 ruling.
- **Files affected:** `src/views/pages/product/index.twig` (search variant)
- **Twilight components:** `salla-search`, `salla-products-list` — technique A
- **New components:** none — reuses T-4.19 wholesale · **New sections:** none
- **Dynamic data:** query, results, result count
- **Theme settings:** none
- **Dependencies:** T-4.19, T-3.04
- **Acceptance criteria:** Shares the T-4.19 layout rather than forking it — the only additions are the echoed query and the result count. Count announced to assistive tech on change. Zero results uses T-2.14 and offers a route onward, never a dead end. Query echoed safely, never as raw HTML. Recorded in `/docs/DERIVED-DECISIONS.md`.
- **Complexity:** S

#### T-4.21 — «تنسيقات جاهزة من أملاس» centred image carousel — **ADDED 2026-08-06 by the project owner**
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

#### T-5.09 — In-app notification overlay — **UNBLOCKED 2026-08-05 (B7 closed by documented inference)**
- **Objective:** The `Notification.pdf` overlay state.
- **Resolved 2026-08-05 by the B7 ruling:** the three artboards carrying this name — `Notification.pdf` (393×852), `نسخة من Notification.pdf` (393×2208, a full-page capture) and `نسخة ٢ من Notification.pdf` (393×852) — are treated as **additional states, not alternatives**. Implement every state visible in each file. The 2208-tall one is a full page, not an overlay, so route it to the notifications page (T-5.08) rather than forcing it into this overlay. Record both readings in `/docs/DERIVED-DECISIONS.md` as inferred.
- **Files affected:** notification component
- **Twilight components:** `salla-notifications`
- **New components:** none · **New sections:** none · **Dynamic data:** runtime · **Theme settings:** none
- **Dependencies:** T-5.08, T-2.12
- **Acceptance criteria:** Every state present in the three artboards is implemented. Announced without stealing focus. Dismissible by keyboard. The inferred split between overlay and full page is recorded in `/docs/DERIVED-DECISIONS.md`.
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

#### T-5.13 — Redemption flow and toast — **UNBLOCKED 2026-08-05 (B7 closed by documented inference)**
- **Objective:** Redemption completion per the two `Redemption_-_Successful_Toast_Notification` files.
- **Files affected:** loyalty templates, `src/assets/js/loyalty.js`
- **Twilight components:** `salla-loyalty` · **New components:** none · **New sections:** none
- **Dynamic data:** redemption transaction · **Theme settings:** none
- **Dependencies:** T-5.12, T-2.12
- **Acceptance criteria:** **Both artboards are implemented as states, not treated as alternatives** (B7 ruling). Both are 393×852 and differ in content. Redemption is idempotent — double submission cannot double-spend. Failure is recoverable and explained. The inferred meaning of each state is recorded in `/docs/DERIVED-DECISIONS.md`.
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

#### T-7.06 — Stories masonry feed — **UNBLOCKED 2026-08-06 (B6 closed)**
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
- **Files affected:** `src/views/pages/stories/index.twig` (new), `src/assets/styles/04-components/stories.scss` (new), `twilight.json`
- **Twilight components:** `testimonials.twig` / `custom-testimonials.twig` evaluated as base; `salla-infinite-scroll`
- **New components:** story card, masonry grid · **New sections:** Stories (registered)
- **Dynamic data:** **resolved 2026-08-06 — theme settings.** Per item: image, brand tag, category tags, and one or more hotspots each carrying `x%`, `y%` and a product ID. Product data resolves from the stored ID at render time, so a renamed or repriced product needs no edit here
- **Theme settings:** `enable_stories` toggle, plus the story-item collection itself (image, brand tag, category tags, hotspot list)
- **Dependencies:** T-2.15, T-4.06 *(the hotspot component)*
- **Acceptance criteria:** The hotspot marker and product pill are **the component built in T-4.06, not a second implementation** — a duplicate implementation is a defect. **Coordinates stored and applied as percentages**; a pixel value anywhere is a defect. Masonry via CSS columns or grid, not a JS layout library. Reading order matches visual order. Filter chips are real controls and the filtered count is announced. Images lazy-loaded with reserved dimensions. The merchant adds, edits and removes stories and their hotspots entirely from the theme customiser, with no code change.
- **Complexity:** L

#### T-7.07 — Story detail view — **UNBLOCKED 2026-08-06 (B6 closed)**
- **Objective:** `Story_Page___Pinterest_Style` (393×852) — **a modal over the feed, not a page.** Visual inspection 2026-08-05, **confirmed by the project owner 2026-08-06.**
- **Ruling (project owner, 2026-08-06):** the story view is a **modal built on the T-2.10 primitive**, not a standalone page and not a route of its own. **No `Article` schema.** The hotspot and product pill are the T-4.06 component.
- **Files affected:** `src/views/components/stories/story-modal.twig` (new) — **not** `pages/stories/single.twig`
- **Twilight components:** ~~blog single as base candidate~~ withdrawn; T-2.10 sheet/dialog primitive
- **New components:** story viewer (modal body only) · **New sections:** none
- **Dynamic data:** the story item from the T-7.06 theme setting · **Theme settings:** none of its own
- **Dependencies:** T-7.06, T-2.10, T-4.06
- **Acceptance criteria:** ~~Article schema emitted.~~ **Withdrawn** — the artboard shows no article, and the owner confirmed it on 2026-08-06. Presents as a dialog sharing focus management with T-2.10. Contains the T-4.06 hotspot and product pill, «أضف للمفضلة» and «إغلاق». Keyboard operable. Dismissal returns focus to the originating feed card at its prior scroll position.
- **Complexity:** M

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

**Zero of 106 tasks are blocked.** Recomputed 2026-08-06, when the owner closed B6 by ruling the Stories source. Every phase is clear; the only open register entry left is **B5**, which is a documentation conflict about phase numbering and blocks no task.

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
| B5 | Phase numbering conflict between doc 01 and docs 16/17 | Backlog sequencing — this backlog follows docs 16/17 | PM |
| ~~B6~~ | ~~Unnamed data sources for non-native features~~ — **CLOSED 2026-08-06.** All data comes from Salla via `salla-*` and Twig, except what the platform has no home for. Resolved: order tracking (`salla-order-shipments`), announcement text (theme setting), **shoppable hotspots** (theme setting — image plus points carrying `x%`/`y%` and a product ID, percentages never pixels), **partner form** (Salla contact page and message system, with a standing instruction to stop and ask if that path cannot carry it), and finally **the Stories** — **the blog is ruled out**; stories are a **theme setting** on the T-4.06 mechanism (image, brand tag, category tags, hotspots with `x%`/`y%` and a product ID), the story view is a **modal over the feed built on T-2.10**, and **no `Article` schema** is emitted. The accepted cost — customiser management rather than a content panel — is recorded in `/docs/DERIVED-DECISIONS.md` | — | Platform |
| ~~B7~~ | ~~Unidentified exports~~ — **CLOSED 2026-08-05 by documented inference.** Unnamed artboards are treated as **additional states, never as alternatives**: implement every state each file shows. `Full_Page.pdf` and `Ariana_Grande.pdf` are identified by visual inspection. Every such call is recorded in `/docs/DERIVED-DECISIONS.md` and stamped **"inferred, not confirmed by Design"**. The measured fact behind the ruling stands: the partner, redemption and `Notification` files differ in page height and byte size, so none is a copy of another | — | Design |
| ~~B8~~ | ~~Missing screens: search results, collection listing, empty states, 404~~ — **CLOSED 2026-08-05 by derivation.** The four are built from existing components and upstream Twilight templates in the established visual language — warm background, white cards, subtle borders, the same buttons — with no new visual pattern invented. Tasks T-4.19, T-4.20 and T-7.11 were added to carry them; empty states stay with T-2.14. Earlier the same day the filter panel and order rating were found present, unblocking T-4.18 and T-6.08 | — | Design |
| ~~B9~~ | ~~Third-party payment and trust mark provenance and usage rights~~ — **CLOSED 2026-08-05: marks are consumed from `salla-payments` and store data, never bundled as theme images. The theme ships no third-party mark, so it acquires no usage-rights exposure** | — | Legal / Platform |
