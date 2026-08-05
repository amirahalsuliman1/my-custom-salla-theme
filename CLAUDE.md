# CLAUDE.md — Am1als (أملاس) Salla Twilight Theme

## What this project is

A custom Salla theme for the Am1als store, built by **extending the official Twilight theme** (`SallaApp/theme-raed`). The design is fixed and documented. Your job is to implement it, not to design it.

## Sources of truth, in priority order

1. The 19 project documents in `/docs/`
2. The Figma design exports in `/docs/design/`
3. Official Twilight architecture (the upstream `theme-raed` source)
4. Official Salla documentation

`/docs/19-ENGINEERING-BACKLOG.md` is the implementation plan of record. Work from it. Do not invent tasks outside it; if something is needed that isn't in it, say so and stop.

## Hard rules

**Never change** layout, typography, spacing, UX, or component hierarchy from what the design specifies.

**Never make assumptions.** If a value, data source, or design is missing, STOP and ask. Do not pick a reasonable default and continue. Do not infer a font, a spacing value, or a colour that isn't documented.

**One task at a time.** Implement a single backlog task, present it, and wait for approval before starting the next. Never generate multiple tasks or a whole phase in one pass.

**Plan before acting.** Use plan mode for anything beyond a trivial edit. Wait for explicit approval before writing files.

## STOP conditions — do not proceed, ask instead

These are unresolved. Any task depending on one of them is blocked, and "blocked" means do not start it, not "start it with a placeholder."

- **B1 — Typography.** No font family, weight, size or line-height values exist. The Figma PDFs embed outlined Type 3 glyphs with no font names; doc 03 records no values. **Everything downstream of design tokens is blocked on this.** Do not choose a font.
- **B2 — Spacing, radius, elevation, motion.** No numeric values documented. Do not measure from raster and treat the result as spec without written authority.
- **B3 — Folder structure. RESOLVED 2026-08-05 by the project owner.** Ruling: the theme follows the real Twilight structure as it already exists in this repo. Docs 02/18 are wrong on this point and will be amended separately. This is no longer a STOP condition, and T-1.01 is not blocked by it.
- **B4 — No desktop or tablet designs.** All 41 artboards are 393pt mobile. Do not invent desktop layouts.
- **B6 — Data sources unconfirmed** for Stories, shoppable hotspots, the partner form, and order tracking.
- **B7 — Ambiguous exports.** `Full_Page.pdf` unidentified; duplicate partner and redemption artboards; `Ariana_Grande.pdf` purpose unconfirmed.
- **B8 — Missing screens:** collection listing, search results, filter panel, order rating, empty states, 404.
- **B9 — Payment/trust mark provenance and usage rights.**

## Verified facts about Twilight — do not contradict these

Confirmed by reading the upstream source, not from memory:

- Structure is `src/views/{layouts,components,pages}`, `src/assets/{js,styles,images}`, `src/locales`, `twilight.json`. There is **no** `sections/`, `blocks/`, `partials/`, `helpers/`, `utilities/` or `config/` top-level folder.
- "Sections" are Twig files in `src/views/components/home/` **registered as components in `twilight.json`**. That registration is what makes them merchant-configurable.
- Styling is **Tailwind + SCSS in ITCSS layers** `01-settings` → `05-utilities`.
- `src/assets/styles/01-settings/breakpoints.scss` ships **max-width (desktop-first)** mixins. This contradicts the mobile-first mandate in doc 10 and must be converted (T-1.06) before responsive work.
- **Product cards are web components**, not Twig. `<custom-salla-product-card>` is defined in `src/assets/js/partials/product-card.js` as a class extending `HTMLElement`. Overriding the card is a JS task. Same for `custom-wishlist-card`.
- Salla ships web components for much of the design: `salla-login-modal`, `salla-loyalty`, `salla-loyalty-panel`, `salla-notifications`, `salla-order-shipments`, `salla-order-details`, `salla-datetime-picker`, `salla-filters`, `salla-modal`, `salla-comments`, `salla-quantity-input`, `salla-add-product-button`. **Check for an existing component before building a new one.**

## Override policy

Three techniques, in order of preference:

- **(C) CSS / part styling** — style the Salla web component from outside. Preferred, because it survives SDK upgrades.
- **(B) Web component extension** — subclass the custom element in JS. Use when C is insufficient.
- **(A) Twig replacement** — copy the upstream `.twig` into the theme and edit. For page shells and layouts.

Every shadowed upstream file must be recorded in `/docs/OVERRIDES.md` with its upstream version.

## Definition of done — every task, no exceptions

Production ready · Clean code · Responsive · SEO · Accessibility (WCAG 2.1 AA) · Performance · Maintainability · Twilight compatible.

Plus the specific acceptance criteria for that task in the backlog.

## Implementation notes

- **RTL and Arabic first.** Use logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline`). Never bare `left`/`right`. Latin product names must not bidi-bleed inside RTL text.
- **No hard-coded user-facing strings.** Everything through `src/locales/ar.json` and `en.json`.
- **No raw hex outside the token layer.**
- **Reserve image dimensions.** Zero CLS is a requirement, not an aspiration.
- **Respect `prefers-reduced-motion`** at the token layer.
- Do not reimplement Salla auth, checkout, or totals. Re-present them; never recompute them client-side.

## Current state

Phase 1 is in progress. The three ad-hoc commits made ahead of the plan (announcement bar, its temp disable, product card styling) were reverted on 2026-08-05 in `ab6ed7a`. `src/` and `twilight.json` are now byte-identical to the upstream scaffold. The announcement bar returns under T-3.03 and the product card under T-4.01, once B6 and B1 are resolved.

**Upstream baseline:** an `upstream` remote points at `SallaApp/theme-raed`. The scaffold matches upstream release **`1.365.0`** — verified by tree comparison. Do **not** trust `package.json`'s `"version": "1.358.0"`; it is stale. Diff overrides against the `1.365.0` tag, and record them in `/docs/OVERRIDES.md` per T-1.02.

**Start at T-1.01.**
