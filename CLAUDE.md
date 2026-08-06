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

**Never make assumptions.** If a value, data source, or design is missing, STOP and ask. Do not pick a reasonable default and continue. *(Narrowed 2026-08-05: where the owner has since issued a standing ruling — fonts, scales, breakpoint derivation, unnamed artboards, missing screens, payment marks — follow the ruling and record the call in `/docs/DERIVED-DECISIONS.md`. This exception covers those rulings and nothing else.)*

**Everything configurable must be a setting, never a hard-coded value.** Colours, fonts, copy, images, enable/disable toggles, item counts — if it could plausibly live in the theme customiser, it lives there, through `twilight.json` or `src/locales/`. **The merchant changes it, not the developer.** A literal in a template that a merchant would reasonably expect to edit is a defect, regardless of whether it renders correctly.

**One task at a time.** Implement a single backlog task, present it, and wait for approval before starting the next. Never generate multiple tasks or a whole phase in one pass.

**Plan before acting.** Use plan mode for anything beyond a trivial edit. Wait for explicit approval before writing files.

## STOP conditions — do not proceed, ask instead

**On 2026-08-05 the project owner closed B1, B2, B3, B4, B7, B8 and B9 and narrowed B6; on 2026-08-06 the owner closed B6.** **No STOP condition survives.** Every blocker that gated a task is now a rule below. The only open register entry is B5 — a phase-numbering conflict between doc 01 and docs 16/17, which blocks nothing.

The general rules still bind: **never assume** where no ruling exists, and stop and ask rather than improvise. Two standing stop conditions ride on closed blockers and are still live:

- **The partner form.** If Salla's contact and message path cannot carry the form the design draws — extra fields, attachments, routing — **stop and ask. Do not improvise a destination.** Verify before building, not after.
- **A design section with no backlog task.** The backlog is the plan of record. If the artboards show something no task covers, **say so and stop**; do not fold it into a neighbouring task.

### Closed — these are now the rules, not open questions

- **B6 — every data source is named.** All data comes from Salla, through `salla-*` components and Twig, except the two things the platform cannot carry. Resolved 2026-08-05: order tracking is `salla-order-shipments`; announcement text is a theme setting; **shoppable hotspots** are a theme setting — the section image plus a list of points, each carrying `x%`/`y%` and a product ID, **percentages never pixels**; the **partner form** posts through Salla's contact page and message system, with **no external service and no email address written into the theme**. Resolved 2026-08-06: **the Stories are a theme setting on the same mechanism as the hotspots** — a list of items, each with an image, a brand tag, category tags, and one or more hotspots carrying `x%`/`y%` and a product ID. **The blog is ruled out.** The story view is a **modal over the feed grid, built on the T-2.10 primitive** — not a page, not a route — and **no `Article` schema is emitted**. **One hotspot-and-pill component serves T-4.06 and T-7.07; a second implementation is a defect.** The accepted cost — customiser management rather than a content panel — is recorded as AC-1 in `/docs/DERIVED-DECISIONS.md`.

- **B1 — Typography = Salla's platform default.** Delivered through the `fonts` feature in `twilight.json` and the merchant customiser. **Never pin a font in SCSS or Tailwind.** Consume the platform's font variables; the merchant must be able to change the font with no code change.
- **B2 — Spacing, radius, elevation, motion = the shipped scales.** Tailwind plus `@salla.sa/twilight-tailwind-theme`, as they ship. **Never measure a value out of Figma.** Add a semantic token only when a real task needs one, and record it.
- **B3 — Folder structure = real Twilight structure**, as it exists in this repo. Docs 02/18 are wrong here and will be amended.
- **B4 — Derivation authority granted.** No further artboards are coming. The 393pt mobile design binds **content, order and hierarchy**. Derive larger breakpoints from doc 10 under these five rules only: bounded centred container, no full-bleed stretch · grids gain columns while **the card itself is unchanged** · bottom sheets become centred dialogs above tablet · footer goes multi-column · spacing and type scale up through the Tailwind scale. **Forbidden at every breakpoint:** adding an element or section absent from mobile, reordering content, hiding content that exists on mobile.
- **B7 — Unnamed artboards are additional states, never alternatives.** Implement every state a file shows; never pick one file and discard the others. Identify `Full_Page.pdf` and `Ariana_Grande.pdf` by visual inspection. Stamp every such call **"inferred, not confirmed by Design"** in `/docs/DERIVED-DECISIONS.md`.
- **B8 — Missing screens are derived.** Search results, category listing, empty states and 404 are built from existing components and upstream Twilight templates in the established visual language: warm page background, white cards, subtle borders, the same buttons. **Invent no new visual pattern.** Carried by T-4.19, T-4.20, T-7.11 and T-2.14.
- **B9 — Payment and trust marks come from Salla**, via `salla-payments` and store data. **Never bundle a third-party mark as a theme image.**

Every inference made under B7 or B8 goes in `/docs/DERIVED-DECISIONS.md`. No exceptions — an unrecorded inference is indistinguishable from an invention.

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
