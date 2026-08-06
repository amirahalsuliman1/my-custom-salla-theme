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

First entries recorded 2026-08-05 from visual inspection of five artboards under the B7 ruling. No derived *layout* rows yet — nothing above 393pt has been built.

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
| T-4.07 → withdrawn | **There is no brands strip on Home.** Both Home artboards were read end to end and no brand-logo row exists at any scroll position. Brands appear in the design only as *pages* — the `Ariana Grande.pdf` template and its `البراندات \| Brands` breadcrumb — which T-4.17 already carries | mobile consistency — full read of both Home artboards | inferred, not confirmed by Design — **the owner withdrew T-4.07 on 2026-08-06** and `home.brands` was deleted with it |

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

### OP-1 — `twilight.json` `author_email` has no value

**Raised 2026-08-06 under T-1.03.** The field is set to the literal string `TODO` at the owner's instruction, because no address was available and one must not be invented. The candidates were the owner's personal git address and a store support address; picking either would have been an assumption, and the field is publicly visible in the theme listing.

**Consumed by:** T-1.03, and again by any submission of the theme to Salla — the platform is expected to reject or flag `TODO` at publish time, which is the intended failure mode. **This must be resolved before the first publish attempt.**

### OP-2 — the footer links to «المدونة», but the blog is ruled out

**Raised 2026-08-06 under T-1.03, assigned to T-3.08.** Both Home artboards and the brand and stories artboards draw a footer whose «روابط مهمة» column includes **«المدونة»** as a destination separate from «تجارب عملائنا» — recorded in the register above, and one of the readings that justified ruling the blog out as the *Stories* source on 2026-08-06.

**The contradiction.** Ruling the blog out as the Stories source is not the same as ruling out the store's blog. The design still points at a blog. Three readings are possible and they produce different work:

1. The store keeps a Salla blog for ordinary editorial content, and the footer link is correct as drawn. Nothing to build; the link comes from the store menu.
2. The blog is gone entirely, and the footer link is a leftover in the artboard. The link must not be rendered, and nothing in the theme may reference `blog_link`.
3. The link should point at the Stories feed instead. This changes the footer's information architecture, which the artboard draws explicitly, and would need the owner's ruling under the never-change-the-design rule.

**Do not choose.** T-3.08 builds the footer from store menus rather than hard-coded links, so the question can stay open until that task starts — but it must be answered before T-3.08 is closed, and it is recorded here so the closing of B6 is not mistaken for having answered it.
