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
| T-4.06 | The hotspot-plus-product-pill mechanic appears in **three places**: twice on `Home Page (No Scroll).pdf` and once inside `Story Page – Pinterest Style.pdf`. One component serves all three | mobile consistency — identical marker and pill treatment across all three | inferred, not confirmed by Design |
| T-4.08 | Home section order, read off `Home Page (No Scroll).pdf` (393×5131): announcement bar → transparent header over hero → "Winter Is Coming" product grid → shoppable block → shoppable block → **تجارب عملائنا** (stories) → تنسيقات جاهزة من أماس → shoppable block → gift-card block → footer | mobile consistency — read directly off the artboard | inferred, not confirmed by Design |
| T-7.06 | The stories section on Home sits **after** the product grid and the shoppable blocks, and its CTA is «تابعنا على وسائل التواصل» — social/UGC framing, not editorial | mobile consistency — read off `Home Page (No Scroll).pdf` | inferred, not confirmed by Design |
| T-7.07 | `Story Page – Pinterest Style.pdf` is a **modal over the feed**, not a page: one image, a shoppable hotspot with a product pill, tag chips, «أضف للمفضلة» and «إغلاق». **No article body exists**, so the `Article` schema requirement was withdrawn | mobile consistency — read off the artboard | inferred, not confirmed by Design |
| T-7.06 | Feed items carry a brand tag (`Rhode`) plus category chips (هدايا · عروض · إكسسوارات · ميكاب · صور), with a filter row and a brand dropdown above the grid | mobile consistency — read off `Customer Stories – Pinterest Style.pdf` | inferred, not confirmed by Design |
| T-3.08 | Footer contents: AM1ALS wordmark, «روابط مهمة» in two columns (تجارب عملائنا · أحكام الشحن · الأسئلة الشائعة · سياسة الخصوصية · الأحكام والشروط · المدونة), six social pills (email, WhatsApp, TikTok, Snapchat, X, Instagram), a موثق في منصة الأعمال badge, and six payment marks (tabby, G Pay, Apple Pay, VISA, Mastercard, mada) | mobile consistency — identical on `Ariana Grande.pdf` and `Customer Stories – Pinterest Style.pdf` | inferred, not confirmed by Design |
| T-3.08 | The footer lists **«المدونة» and «تجارب عملائنا» as separate destinations**, so blog and stories are distinct in the information architecture | mobile consistency — read off two artboards | inferred, not confirmed by Design |

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
