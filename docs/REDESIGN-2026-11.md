# Redesign targets — November 2026

Owner ruling of 2026-11-04: rebuild on React and redesign so the theme meets what Salla's approved themes do. This file is the measurable target. Where it contradicts the earlier artboards or `DESIGN-SYSTEM.md`, this file wins; everything it does not mention keeps the existing design language (warm page, white cards, subtle borders, AM1ALS wordmark, Arabic first).

## What the reviewer said (2026-11-04, desktop home screenshot only)

Small type in the header, cards, section titles and footer; a hero with no headline and no clear «تسوق الآن»; product names and prices weak; small card icons and no visible add to cart; sections alike; banners unbalanced; a black-and-grey page with no accent and weak contrast; uneven spacing; a shoppable-image section with no title; a small features strip; a weak footer; categories hard to reach from the first screen; weak hover and focus states. The report describes black cards on a black section — the reviewer saw dark mode.

## The approved-theme baseline

Measured on 2026-11-04 from the demo stores of nine approved themes at 1440px (تمارا, ترف, مواسم, تَميّم, بِينْك, كسوة, دُرّة, بروفا, رائد React). 299 of the 300 approved themes are Twig, so the framework is not what gets a theme approved.

| Baseline | Themes showing it |
|---|---|
| Hero headline of 38px or more | 7 of 9 |
| Hero headline with a visible CTA button | 4 verified |
| Category links in the desktop header, 14–16px, weight 500 or more | 7 of 9 |
| Section titles of 24px or more | 7 of 8 measured |
| «عرض الكل» in the accent colour or as a filled button | 3 |
| Product name 14–18px, weight 600 or more | 5 of 5 measured |
| Price bold, 14–20px, usually in a colour | 6 of 6 measured |
| Add to cart visible on the card without hover | 3 of 3 checked |
| Card action icons of 34px or more | 4 |
| A non-black accent on CTAs | 6 of 9 |
| Footer headings 16–20px bold | 5 of 5 measured |

## Targets

All sizes are steps of the Tailwind scale the theme already ships. Nothing is measured out of Figma.

| Element | Phone | From 1024px |
|---|---|---|
| Hero headline | `text-3xl font-bold` | `text-5xl font-bold` |
| Hero subline | `text-base` | `text-lg` |
| Hero CTA | filled accent, `min-h-12`, `text-base font-bold` | same |
| Section title | `text-2xl font-bold` | `text-3xl font-bold` |
| «عرض الكل» | accent, `text-base font-semibold`, with an arrow | same |
| Header category links | in the drawer | `text-base font-medium` row |
| Header icons | 40px hit area, 24px glyph | same |
| Product name | `text-base font-semibold`, two lines | same |
| Price | `text-lg font-bold`, accent | same |
| Old price | `text-sm line-through`, secondary | same |
| Card add to cart | always visible, `min-h-10` | same |
| Card icon buttons | 40px | same |
| Card gap | `gap-4` | `gap-6` |
| Features icon | 48px | same |
| Features title / text | `text-lg font-bold` / `text-base` | same |
| Footer heading / link | `text-lg font-bold` / `text-base` | same |
| Footer social icons | 40px | same |

## Colour

- **Accent** is the store's primary colour (`--color-primary`) unless the merchant sets the theme's `accent_color`, which overrides it; the text on an accent fill is chosen for contrast automatically. The theme never hard-codes it. Default for the demo store: **bronze gold `#86663A`** (owner, 2026-11-04; white on it 5.3:1, it on the page 5.2:1), set through `accent_color` because the store colour sits behind an SMS code. It carries CTAs, prices, «عرض الكل» and active states. In dark mode accent text is mixed toward white so it stays readable.
- **Focus rings are the ink, not the accent**: a merchant can pick a pale accent that would fail WCAG 1.4.11, and the ring must never vanish.
- **Contrast:** every text/surface pair passes WCAG AA in light and dark mode. Secondary text is never below 4.5:1 on its surface.
- **Section separation:** consecutive sections alternate the page and section surfaces, or carry a panel, so no two neighbours share an unbroken background.
- **Dark mode:** card, section and page surfaces are three visible steps apart. The demo store defaults to light mode so a reviewer's device setting cannot switch it.

## Interaction

Every link, card and icon has a hover state and a visible `:focus-visible` ring in the ink. Images that link show it on hover. Nothing relies on hover alone to reveal a purchase action.

## Home page structure

- Categories within the first screen: the header row on desktop; the drawer plus the highlights row on a phone.
- Each section has a title and a single purpose (new arrivals, best sellers, offers, a brand, a lookbook). The same product does not repeat across neighbouring sections in the demo store.
- The page keeps its current sections. Order follows commercial priority, set by the merchant.
