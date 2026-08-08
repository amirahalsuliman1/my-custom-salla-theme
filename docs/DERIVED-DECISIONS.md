# DERIVED DECISIONS — visual calls made without a design reference

**Authorised by the project owner on 2026-08-05**, when B4, B7 and B8 were closed by derivation rather than by new artboards.

Every visual decision taken **without** an artboard specifying it is recorded here. The register exists so that a reader can always tell the difference between *the design said this* and *we worked this out ourselves* — and so that if Design later supplies the missing screen, the delta is a lookup, not an archaeology project.

An unrecorded inference is indistinguishable from an invention. Record it.

---

## What must be recorded

- Any layout at a breakpoint above 393pt — every one, since no artboard exists above mobile (B4).
- Any screen built without an artboard: search results, category listing, empty states, 404 (B8).
- Any reading of an unnamed or ambiguous artboard: `Full_Page.pdf`, `Ariana_Grande.pdf`, the partner pair, the redemption pair, the `Notification` trio (B7).
- Any semantic token added on top of the shipped Tailwind scales (B2).

## What must **not** be recorded here

- Anything an artboard specifies directly. That is implementation, not derivation.
- Technique A/B/C override choices. Those belong in [OVERRIDES.md](OVERRIDES.md).
- A screen may well need a row in **both** files — a derived screen that also shadows an upstream Twig has an entry here for its visual choices and a row there for the shadowed file.

---

## The register

First entries recorded 2026-08-05 from visual inspection of five artboards under the B7 ruling. **The first derivations above 393pt were recorded 2026-08-06 under T-1.06** — the tier values themselves, not yet any layout at them.

| Task | Decision | Source | Status |
|---|---|---|---|
| T-7.10 → T-6.01 | `Full Page.pdf` (393×2435) is the **Orders list, "previous orders" tab, with the status filter dropdown open**. It shows breadcrumb الرئيسية › الطلبات, an open disclosure listing الطلبات السابقة / طلبات قيد التنفيذ / طلبات بانتظار الدفع, and order cards #1024/#1023/#1022 | mobile consistency — matches `Orders In Progress.pdf` and `Orders Pending Payment.pdf` card anatomy exactly | inferred, not confirmed by Design |
| T-6.01 | Order status has **at least five values**, not the two the backlog assumed: تم التوصيل, تم الإلغاء, مسترجعة, plus in-progress and pending-payment. One component covers all | mobile consistency — read off `Full Page.pdf` | inferred, not confirmed by Design |
| T-6.01 | Each order card carries three actions: تحميل الفاتورة, إعادة الطلب, تقييم الطلب. The last is the entry point to T-6.08 | mobile consistency — read off `Full Page.pdf` | inferred, not confirmed by Design |
| T-4.17 | `Ariana Grande.pdf` (393×1761) is the **brand page template**, not a campaign one-off: brand cover, `البراندات \| Brands` breadcrumb, sort disclosure, two-column product grid, standard footer | mobile consistency — the page is structurally generic; nothing is specific to this brand | inferred, not confirmed by Design |
| T-4.17 + T-6.01 | The brand **sort** dropdown and the orders **status** dropdown are the same disclosure pattern. Build once, use twice | mobile consistency — identical control drawn on both artboards | inferred, not confirmed by Design |
| T-4.06 | The hotspot-plus-product-pill mechanic appears in **three places**: twice on `Home Page (No Scroll).pdf` and once inside `Story Page – Pinterest Style.pdf`. One component serves all three | mobile consistency — identical marker and pill treatment across all three | **confirmed by the project owner 2026-08-06** — the ruling makes one component serving T-4.06 and T-7.07 mandatory, not merely economical |
| T-4.06 | The mechanic has **two presentations, not two components**: an overlay pill on the image (`The Quencher® Luxe Tumbler`, `G7 X Mark III`) and a stacked product list beneath the image (`The tinted lip layer` · `lip case` · `مجوهرات لوما` · `Polo Bear Cotton Crewneck Sweater`). The markers on the image are identical in both | mobile consistency — read off `Home Page (No Scroll).pdf`, all three blocks | inferred, not confirmed by Design |
| T-4.08 | Home section order, read off `Home Page (No Scroll).pdf` (393×5131): announcement bar → transparent header over hero → "Winter Is Coming" product grid → shoppable block → shoppable block → **تجارب عملائنا** (stories) → تنسيقات جاهزة من أملاس → shoppable block → gift-card block → footer | mobile consistency — read directly off the artboard | inferred, not confirmed by Design |
| T-7.06 | The stories section on Home sits **after** the product grid and the shoppable blocks, and its CTA is «تابعنا على وسائل التواصل» — social/UGC framing, not editorial | mobile consistency — read off `Home Page (No Scroll).pdf` | inferred, not confirmed by Design |
| T-7.07 | `Story Page – Pinterest Style.pdf` is a **modal over the feed**, not a page: one image, a shoppable hotspot with a product pill, tag chips, «أضف للمفضلة» and «إغلاق». **No article body exists**, so the `Article` schema requirement was withdrawn | mobile consistency — read off the artboard | **confirmed by the project owner 2026-08-06** — modal on the T-2.10 primitive, no standalone route, no `Article` schema |
| T-7.06 | Feed items carry a brand tag (`Rhode`) plus category chips (هدايا · عروض · إكسسوارات · ميكاب · صور), with a filter row and a brand dropdown above the grid | mobile consistency — read off `Customer Stories – Pinterest Style.pdf` | inferred, not confirmed by Design |
| T-3.08 | Footer contents: AM1ALS wordmark, «روابط مهمة» in two columns (تجارب عملائنا · أحكام الشحن · الأسئلة الشائعة · سياسة الخصوصية · الأحكام والشروط · المدونة), six social pills (email, WhatsApp, TikTok, Snapchat, X, Instagram), a موثق في منصة الأعمال badge, and six payment marks (tabby, G Pay, Apple Pay, VISA, Mastercard, mada) | mobile consistency — identical on `Ariana Grande.pdf` and `Customer Stories – Pinterest Style.pdf` | inferred, not confirmed by Design |
| T-3.08 | The footer lists **«المدونة» and «تجارب عملائنا» as separate destinations**, so blog and stories are distinct in the information architecture | mobile consistency — read off two artboards | **confirmed by the project owner 2026-08-06** — this reading is one of the reasons the blog was ruled out as the Stories source |
| T-4.08 | Correction to the row above, from a 150 dpi crop taken 2026-08-06: the final block before the footer is **not a gift-card block**. It is the **partner CTA banner** — one image with «انضم كبراند» and «انضم كفرد» — and it is the Home entry point to the T-7.09 partner page | mobile consistency — read off `Home Page (No Scroll).pdf` at 150 dpi | inferred, not confirmed by Design |
| T-4.03 | «Winter Is Coming» is a **carousel, not a static grid** — a scroll-progress indicator sits beneath the two visible cards | mobile consistency — read off `Home Page (No Scroll).pdf` at 150 dpi | inferred, not confirmed by Design |
| T-4.21 | «تنسيقات جاهزة من أملاس» is a **centred image carousel** with partial neighbouring slides and a scroll indicator — images only, no hotspots on the centred slide. Its nearest upstream carrier is `component-photos-slider`, whose `salla-slider type="carousel" centered pagination` renders exactly this shape | mobile consistency — read off both Home artboards | inferred, not confirmed by Design — **the gap it raised is closed: the owner opened T-4.21 on 2026-08-06 and the stop condition is discharged** |
| T-4.21 | The section title is «تنسيقات جاهزة من **أملاس**», with a lām. The two rows above originally transcribed it «أماس» | read off `Home Page (No Scroll).pdf` at 300 dpi, 2026-08-06 | direct artboard reading — recorded because the string becomes a locale key in T-1.05 and the slip would have shipped |
| T-1.03 | **Nine feature flags and five component registrations were deleted because no artboard draws them**: `mega-menu`, `component-featured-products`, `component-fixed-banner`, `component-fixed-products`, `component-parallax-background`, `component-testimonials`, `component-square-photos`, `component-store-features`, `component-youtube`; and `home.main-links`, `home.slider-products-with-header`, `home.enhanced-square-banners`, `home.brands`, `home.custom-testimonials`. The reasoning is **absence** — both Home artboards were read end to end at 100 dpi on 2026-08-06 and none of these blocks appears | mobile consistency — full read of `Home Page (No Scroll).pdf` (393×5131) and `Home Page (Scroll).pdf` (393×852) | inferred, not confirmed by Design — **approved by the project owner 2026-08-06** on a section-by-section table. Absence in an artboard is weaker evidence than presence: if Design later supplies a Home variant containing one of these, restoring the flag is a one-line change |
| T-1.03 | `home.enhanced-slider` is **kept as the carrier for the T-4.05 hero**: its template renders `salla-slider type="fullwidth"` with a centred white title and description over a dimmed full-bleed image, which is the hero's construction exactly | `Twilight template` — read from `src/views/components/home/enhanced-slider.twig` against the Home artboard | inferred, not confirmed by Design |
| T-4.03 | The «Winter Is Coming» carrier is `products-slider.twig`, **not** `slider-products-with-header.twig`. The latter forces a required full-bleed background image with the title laid over it; the artboard shows a plain card with a title, «عرض الكل» and a scroll indicator, which is what `products-slider.twig` renders via `block-title` and `display-all-url` | `Twilight template` — both templates read against the artboard | inferred, not confirmed by Design — **approved by the project owner 2026-08-06**; the backlog line naming two carriers was corrected |
| T-1.06 | **The four viewports in doc 10 are given pixel values for the first time: Mobile = base with no media query, Tablet = 768px, Laptop = 1024px, Desktop = 1280px.** Doc 10 names Mobile/Tablet/Laptop/Desktop but carries **no numbers at all** for them, so the values had to come from somewhere; under B2 that somewhere is the shipped Tailwind scale, never a measurement. The three are Tailwind's `md`, `lg` and `xl`, which also gives every SCSS tier an exact utility-class equivalent so the two systems cannot drift | `Twilight template` + B2 — Tailwind's shipped default screens, cross-checked against this repo's own files | inferred, not confirmed by Design — **the numbers are derived, the four tier names are doc 10's** |
| T-1.06 | Upstream's `992px` and `1200px` are **not** carried forward as tiers. They are Bootstrap values matching neither the Tailwind scale nor anything else here. Two corroborations that the chosen numbers are continuity rather than invention: **768px is exactly the boundary upstream's own `@mixin tablet` already used**, now read from the other side; and **1280px is already the container's cap** in `tailwind.config.js`, so the widest tier and the widest container agree — which is where B4's first derivation rule, bounded centred container with no full-bleed stretch, has to land | `Twilight template` — `01-settings/breakpoints.scss` and `tailwind.config.js` as they ship | inferred, not confirmed by Design |
| T-2.01 | **`border/subtle` #EDEBE8 is decorative only, and a second boundary token was added.** Measured contrast is **1.10:1 on `surface/page` and 1.19:1 on `surface/card`** — far under the 3:1 WCAG 1.4.11 requires of a boundary needed to *identify* a control. That is acceptable for card edges and dividers, where the card is identified by its background change and the border is trim; it is not acceptable on a form control, where the border **is** the affordance | measured — the full table is below this register | **ruled by the project owner 2026-08-06**: second token required at ≥3:1, `border/subtle` documented decorative-only |
| T-2.01 | **`--border-interactive` = `#888684`**, for inputs, selects, checkboxes and any control a user must be able to find. **Derived by a rule, not chosen by eye:** the lightest tone on `text/secondary`'s own hue axis — which is near-neutral at 1.5% saturation — that still clears 3:1 against **every** surface a control can sit on. Measured **3.36:1 on page, 3.63:1 on card, 3.02:1 on the soft accent** | measured — derived from the recovered palette, no new hue introduced | inferred, not confirmed by Design |
| T-2.01 | **Rejected alternative, recorded so it is not re-proposed:** preserving `border/subtle`'s own HSL hue and darkening it yields **`#998D7C`**, which **fails on `accent/soft` at 2.71:1** and reads distinctly tan rather than neutral — the usual HSL trap, where a barely-saturated light tone becomes visibly coloured as it darkens. Reusing `text/secondary` #646361 unchanged also passes (5.00:1 worst) but is far heavier than the hairline the artboards draw | measured | inferred, not confirmed by Design |
| T-2.01 | **The focus indicator does not use the merchant's brand colour.** `--focus-ring-color` is ink `#231f1e` — 15.12:1 on the page, 16.33:1 on a card — inverting to white under `.dark`. The merchant can set the brand colour to any value including a pale tint that would fail 1.4.11 against a white card, and **a focus ring that can be configured into invisibility is not a focus ring** | `Twilight template` — `theme.color.primary` is merchant-set, read from `master.twig` | inferred, not confirmed by Design |
| T-2.01 | **Correction to a T-1.08 record.** T-1.08 named `corePlugins: { outline: false }` in `tailwind.config.js` as the cause of the theme's missing focus indicator. **That line does nothing.** Tailwind 3 has no core plugin called `outline` — only `outlineStyle`, `outlineWidth`, `outlineOffset`, `outlineColor` — so it was a Tailwind 2 leftover and every outline utility was generated regardless; `.outline-none` is in the built CSS. **The real cause is `a:focus { outline: none; }` at `02-generic/reset.scss:46`**, which strips the indicator from every link and supplies no replacement. The failure was real, the cause named was wrong; the dead key is removed and `02-generic/focus.scss` overrides the reset | `Twilight template` — Tailwind 3 core-plugin list and the built CSS, both read directly | **verified, not inferred** |
| T-2.01 | **Scope expanded to `twilight.json`.** The backlog scoped T-2.01 to `tailwind.config.js` and `global.scss`, but doc 08 requires a merchant-configurable Secondary Color and Salla's `color` platform feature carries **only one** brand colour — `theme.color.primary`, plus derived `darker`/`lighter`/`reverse`. A secondary colour has no platform home, so it must be a theme setting | `Twilight template` — `theme.color.*` read from `master.twig` and the SDK types | **ruled by the project owner 2026-08-06**, who expanded the scope and asked for the expansion to be recorded here |
| T-2.01 | **There is no colour input type for a theme setting, so `secondary_color` is `type: "string"`, `format: "text"` holding a hex.** Checked three ways: the whole of upstream `1.365.0`'s manifest, **every commit in upstream's entire history** (`git log --all -S` for both `"type": "color"` and `"format": "color"` returns nothing), and Salla's own twilight.json documentation. Twelve formats have ever been used — `switch`, `hidden`, `text`, `textarea`, `image`, `icon`, `integer`, `collection`, `dropdown-list`, `line`, `title`, `description`, `variable-list` — and **none is a colour picker**. `text` is proven in upstream and certain to work; if Salla ever ships a colour format, changing one word upgrades the control with no other edit. Default `#F9E6E7`, reusing the recovered `accent/soft` rather than inventing a hue | Official Salla documentation + `Twilight template` — full upstream history searched | inferred, not confirmed by Design — **the fallback to a text field is a UX compromise the owner should know about**; it is not a guess about the schema |
| T-2.03 | **Three semantic motion tokens added — `--motion-fast` 150ms, `--motion-base` 300ms, `--motion-slow` 500ms, easing `cubic-bezier(0.4, 0, 0.2, 1)`.** Doc 14 describes nine animations and states outright that its timings "should be finalized during development" — **it contains no numbers at all.** Under B2 the values are therefore Tailwind's shipped `transitionDuration` scale, each mapping 1:1 to a utility class (`duration-150`/`300`/`500`) and the easing to `ease-in-out`, so nothing is measured out of Figma. Added now rather than speculatively because T-2.05 consumes them immediately | `Twilight template` + B2 — Tailwind's shipped scale | inferred, not confirmed by Design |
| T-2.03 | **No spacing, radius or elevation token was added.** Tailwind's scales plus `@salla.sa/twilight-tailwind-theme` and upstream's existing `borderRadius`/`boxShadow`/`spacing` extensions are used exactly as they ship. B2 permits a semantic token only where a real task needs one, and none did | B2 | — |
| T-2.03 | **`prefers-reduced-motion` was handled with a blanket clamp, not per component.** It appeared **nowhere in `src/`** beforehand. Collapsing the `--motion-*` tokens alone would only cover theme code, and theme code is the minority of what animates here — upstream's `animations.scss` plus the bundled swiper, mmenu, sweetalert2 and lite-youtube stylesheets all animate with hard-coded durations the theme cannot edit. The clamp uses `0.01ms` and `animation-iteration-count: 1` rather than `0` or `animation: none`, so animations still complete and still fire `animationend` and scripts waiting on that event keep working | doc 14 + doc 15 + CLAUDE.md, which asks for it "at the token layer" | inferred, not confirmed by Design |
| T-2.04 | **The upstream `sicon-*` icon font is retained, not replaced by an SVG sprite.** `master.twig` already loads `sallaicons.css` from the CDN, **52 distinct glyphs** are in use across the theme, and only 2 local SVGs exist. Replacing it would mean redrawing 52 glyphs to gain a sprite the theme has no other use for. The acceptance criterion's "single sprite" is read as satisfied by the font: one file, one request, one source | `Twilight template` — icon usage counted across `src/views` and `src/assets/js` | **ruled by the project owner 2026-08-06** |
| T-2.04 | **Icons are `aria-hidden` by default; a label is the exception.** Not one of the theme's icon elements carried `aria-hidden` beforehand. An icon font renders a private-use-area codepoint, so a screen reader announces nothing useful or announces garbage, and an icon-only button ends up with no accessible name. Most icons here sit beside their own text — cart beside «السلة», chevron beside a link — so **naming them by default would make a screen reader say everything twice.** `components/ui/icon.twig` inverts the burden: decorative unless deliberately named | doc 13 — WCAG 2.1 AA, and the markup as it stands | inferred, not confirmed by Design |
| T-2.04 | **No icon size scale was invented and no icon colour token exists.** The icons are a font, so Tailwind's shipped font sizes *are* the scale, mapped `xs`→`text-xs` … `xl`→`text-2xl` inside the partial. Colour is inherited via `currentColor`. The single rule that could not be expressed in Tailwind is `line-height: 1` on the glyph: an icon font inherits the surrounding line-height, so a large icon silently grows its own line box and nudges the layout — **a shift with no visible cause** | B2 | inferred, not confirmed by Design |
| T-2.15 | **One card shell, consumed by all six card types; the `.card__media` aspect ratio defaults to 1/1.** The ratio is **inferred, taken from no artboard** — a card type needing another shape sets `--card-media-ratio` rather than redefining the well. It lives in the shell rather than in each card because CLAUDE.md treats zero CLS as a requirement and a per-card solution would eventually miss one | mobile consistency — doc 04's six-card list plus its "avoid duplicated variants" rule | inferred, not confirmed by Design |
| T-2.15 | **The card border uses `--border-subtle` (1.10:1), deliberately.** The card is identified by its white surface against the warm page; the border is trim, not the thing that makes the card findable, so WCAG 1.4.11's 3:1 does not bind here. Recorded because the same token near a form control **would** be a defect | measured — see the T-2.01 contrast table | inferred, not confirmed by Design |
| T-2.15 | **Interactive cards use one stretched link plus a `:focus-within` ring on the card**, not a focusable image, title and price. Three focus stops to reach one destination is the failure mode the shared shell exists to prevent, and drawing the ring on the card means the indicator surrounds what will actually be activated | doc 13 — WCAG 2.4.7 and logical tab order | inferred, not confirmed by Design |
| T-2.05 | **The design's button names map onto upstream's existing `.btn--` classes; only two are new.** primary→`--primary`, secondary→`--outline-primary`, error→`--danger`, icon-only→`--icon` all exist upstream, written in nested `&--` form. **Only `--ghost` and `--success` had no analogue.** Recorded because the nested syntax makes them invisible to a grep for `.btn--primary` — a duplicate `--primary` was written and removed while doing this task, which is exactly the duplication doc 04 forbids | `Twilight template` — `03-elements/buttons.scss` read in full | **verified, not inferred** |
| T-2.05 | **`min-height: 2.75rem` added to `.btn`, and `.btn--icon` resized from `w-10 h-10` to 44px.** Upstream sets no height on `.btn` (computing to ~36px) and states the icon button as 40px, so **every button in the theme was under WCAG 2.5.5's 44×44** — the icon-only ones, where a mis-tap costs most, being the ones stated in pixels. This is a deliberate 4px visual change to an upstream component | doc 13 — WCAG 2.5.5 | inferred, not confirmed by Design |
| T-2.05 | **Doc 04's "success", "error" and "empty" are read as transient result states, not template-chosen variants** — "added to cart", "could not add" — applied by script after an action resolves. **"empty" has no button meaning and is deliberately not implemented** rather than invented. Both implemented states pair colour with an icon and a message, since doc 13 forbids colour as the only carrier of meaning | doc 04's State Matrix, which is generic across all components | inferred, not confirmed by Design |
| T-2.05 | **`button_style` is read as corner shape** — rounded (default) · pill · square — since doc 08 says only "Button Style / Select / Primary". **It is not yet live:** a theme setting reaches CSS only through a template, and the body class it hangs off is emitted by `master.twig`, which T-3.01 owns and which is currently skipped | doc 08 | inferred, not confirmed by Design |
| T-2.05 | **Disabled buttons emit `aria-disabled`, not the `disabled` attribute.** A natively disabled button is skipped by keyboard navigation entirely, so a user tabbing a form never learns the submit button exists — they simply run out of controls. `aria-disabled` keeps it reachable and announced as unavailable, which is what the design's disabled state means | doc 13 — WCAG 2.4.3, 4.1.2 | inferred, not confirmed by Design |
| T-4.07 → withdrawn | **There is no brands strip on Home.** Both Home artboards were read end to end and no brand-logo row exists at any scroll position. Brands appear in the design only as *pages* — the `Ariana Grande.pdf` template and its `البراندات \| Brands` breadcrumb — which T-4.17 already carries | mobile consistency — full read of both Home artboards | inferred, not confirmed by Design — **the owner withdrew T-4.07 on 2026-08-06** and `home.brands` was deleted with it |

### The T-2.01 contrast table

Measured 2026-08-06 with the WCAG 2.1 relative-luminance formula, against the palette in `01-settings/global.scss`. **Recorded so it is never re-derived by hand and never guessed at.** Thresholds: **4.5:1** for body text (1.4.3 AA), **3:1** for large text and for non-text boundaries that identify a control (1.4.11).

| Foreground | on `surface/page` #F7F6F4 | on `surface/card` #FFFFFF | on `accent/soft` #F9E6E7 | Verdict |
|---|---|---|---|---|
| ink `#231F1E` | **15.12** | **16.33** | — | ✅ passes everything |
| `text/secondary` `#646361` | **5.56** | **6.00** | **5.00** | ✅ AA body text on every surface |
| `border/interactive` `#888684` | **3.36** | **3.63** | **3.02** | ✅ clears 1.4.11 everywhere, with the accent as the binding case |
| `border/subtle` `#EDEBE8` | **1.10** | **1.19** | — | ⚠️ **decorative only** — never on a control boundary |
| `accent/soft` `#F9E6E7` | **1.11** | — | — | ⚠️ a background wash, never a text or border colour |
| focus ring `#231F1E` | **15.12** | **16.33** | — | ✅ and unconfigurable, by design |

Two notes that matter more than the numbers:

**`surface/page` is the binding surface, not white.** Every light token scores *lower* against the warm page than against a white card, so a value checked only against white will pass review and fail in the product. Check against `#F7F6F4` first, and against `#F9E6E7` for anything that can land on the accent wash.

**This table covers the shipped default palette only.** `theme.color.primary` is merchant-set through the `color` feature and `secondary_color` is merchant-set through the theme setting, so **no ratio involving either can be proven here**. Any component that puts text on the brand colour must derive its foreground from `theme.color.text` / `theme.color.reverse_text`, which the platform computes for exactly this reason — never from a hard-coded pairing.

**Column definitions**

- **Task** — the backlog task ID the decision was made under, e.g. `T-4.19`.
- **Decision** — the actual call, concretely. "Grid goes to 3 columns at the laptop tier" is a decision. "Made it responsive" is not.
- **Source** — exactly one of:
  - `doc 10` — derived from the responsive plan, under one of the five T-0.04 rules. Name the rule.
  - `Twilight template` — taken from the upstream `theme-raed` template for this page type.
  - `mobile consistency` — extrapolated from how the 393pt design already solves the same problem elsewhere. Name the artboard it was extrapolated from.
- **Status** — one of:
  - `inferred, not confirmed by Design` — the default for everything in this file, and mandatory for every B7 reading.
  - `confirmed by Design` — Design has since reviewed and accepted it. Keep the row; the history is the value.
  - `confirmed by the project owner` — the owner reviewed the inference and ruled on it. Weaker than a Design confirmation in provenance, binding in practice. Date it.
  - `superseded` — Design supplied an artboard that overrides it. Keep the row and link the task that implemented the real design.

**Rules**

1. The row lands in the **same PR** as the code it describes. A derived screen merged without its rows is incomplete.
2. One row per decision, not per screen. A page with four derived choices gets four rows.
3. Never delete a row. Move it to `superseded` — the record of what we assumed, and when, is exactly what makes a later design review cheap.
4. If a decision cannot be traced to one of the three sources, it is not a derivation. It is an invention, and it is out of scope — stop and ask.

---

## Standing rulings these rows inherit from

Recorded once here so individual rows do not restate them.

**B4 — breakpoint derivation.** The 393pt design binds content, order and hierarchy. Above it, only five moves are permitted: bounded centred container; grids gain columns while the card is unchanged; bottom sheets become centred dialogs above tablet; footer goes multi-column; spacing and type scale up through the Tailwind scale. Adding an element absent from mobile, reordering content, or hiding content that exists on mobile is forbidden at every breakpoint.

**B7 — unnamed artboards.** Treated as additional states, never as alternatives. Implement every state a file shows. Never pick one file and discard the others.

**B8 — missing screens.** Built from existing components and upstream Twilight templates in the established visual language: warm page background, white cards, subtle borders, the same buttons. No new visual pattern is invented.

**B6 — data sources.** All data comes from Salla via `salla-*` components and Twig, except the two things the platform has no home for: shoppable hotspots and Stories. Both are theme settings, both carry percentage coordinates and product IDs, and both use one hotspot component.

---

## Accepted constraints

Not derivations. These are costs the project owner was shown and accepted in writing. They are recorded so that nobody later reports them as defects, and so that the trade-off behind them is still legible when the reason has been forgotten.

### AC-1 — Stories are managed in the theme customiser, not a content panel

**Ruled 2026-08-06 by the project owner.** Stories live in `twilight.json` as a settings collection, edited in the theme customiser alongside the other sections.

**The cost.** A merchant publishing a story edits theme settings rather than a content panel. There is no editorial workflow, no draft state, no scheduling, and no per-story URL. Bulk publishing is manual. This is heavier than a CMS for the person doing it every week.

**Why it was accepted.** The hotspot mechanism is the reason the section exists. Each story carries one or more points with **relative coordinates (`x%`, `y%`) and a product ID**, and neither Salla's blog nor any CMS field on the platform can carry that pair. Choosing the blog would have produced article pages with `Article` schema and no shoppable overlay — a different product from the one the artboards draw. The owner weighed the two and chose the mechanism over the workflow.

**What this obliges.** The story-item collection is a merchant-editable setting like any other — image, brand tag, category tags and hotspot list all configurable, nothing hard-coded, per the standing rule that the merchant changes it and not the developer. Carried by [T-7.06](19-ENGINEERING-BACKLOG.md), consumed by T-7.07.

**If this is ever revisited,** the thing to check first is whether Salla has since exposed a content type that can carry a coordinate pair and a product ID per item. That, and only that, is what made the blog unusable.

---

## Open — awaiting owner input

Not derivations and not accepted costs. These are values or rulings the work needs and does not have. Each names the task that will consume the answer, so nothing here can be quietly forgotten. **Clear the entry when the answer arrives; do not delete it — move it into the register or into the task.**

### ~~OP-1 — `twilight.json` `author_email` has no value~~ — ✅ **CLOSED 2026-08-08 by the project owner**

**Raised 2026-08-06 under T-1.03.** The field was set to the literal string `TODO` at the owner's instruction, because no address was available and one must not be invented. The candidates were the owner's personal git address and a store support address; picking either would have been an assumption, and the field is publicly visible in the theme listing.

**How it closed.** The owner supplied a real address in commit `59bea10a`: `author_email` now reads `Amirarhalsuliman1@gmail.com`. The placeholder never reached a publish attempt, so the intended failure mode was never exercised — the value arrived first.

**Nothing is carried.** No task waits on this and no code reads the field; it is manifest metadata consumed by the platform at publish time. The entry stays here rather than being deleted so that the `TODO` visible in the history of `twilight.json` before `59bea10a` is explained by a record rather than looking like an oversight someone silently patched.

### OP-2 — the footer links to «المدونة», but the blog is ruled out

**Raised 2026-08-06 under T-1.03, assigned to T-3.08.** Both Home artboards and the brand and stories artboards draw a footer whose «روابط مهمة» column includes **«المدونة»** as a destination separate from «تجارب عملائنا» — recorded in the register above, and one of the readings that justified ruling the blog out as the *Stories* source on 2026-08-06.

**The contradiction.** Ruling the blog out as the Stories source is not the same as ruling out the store's blog. The design still points at a blog. Three readings are possible and they produce different work:

1. The store keeps a Salla blog for ordinary editorial content, and the footer link is correct as drawn. Nothing to build; the link comes from the store menu.
2. The blog is gone entirely, and the footer link is a leftover in the artboard. The link must not be rendered, and nothing in the theme may reference `blog_link`.
3. The link should point at the Stories feed instead. This changes the footer's information architecture, which the artboard draws explicitly, and would need the owner's ruling under the never-change-the-design rule.

**Do not choose.** T-3.08 builds the footer from store menus rather than hard-coded links, so the question can stay open until that task starts — but it must be answered before T-3.08 is closed, and it is recorded here so the closing of B6 is not mistaken for having answered it.
