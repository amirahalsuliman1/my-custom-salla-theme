# BUDGETS — performance and accessibility targets

**Task:** T-1.08 · **Set:** 2026-08-06, before any theme code exists to bias them — which is the entire point of setting them in Phase 1 rather than Phase 8.

This file is the single record of what "fast enough" and "accessible enough" mean for this theme. Phase 8 audits against it: **T-8.01** (CSS), **T-8.03** (JS), **T-8.06** (accessibility), **T-8.08** (Core Web Vitals). The numbers below are what those tasks are graded on.

---

## 1. Accessibility

**WCAG 2.1 Level AA is the conformance target.** Doc 13 states it and CLAUDE.md's definition of done repeats it; this file names it so there is a single place to point at.

It is a **conformance target, not a score**. There is no percentage to hit and no automated tool that establishes it — automated checks find roughly a third of WCAG issues at best. The specific requirements are doc 13's eight checklist rows, all marked Required: keyboard navigation, ARIA, focus management, contrast, forms, dialogs, images, screen readers. **T-8.06 audits them by hand**, and doc 13's own testing section — keyboard-only, screen reader, contrast validation — is the method.

Two AA criteria are called out here because they are the ones this design is most likely to fail quietly:

- **1.4.3 Contrast (Minimum)** — 4.5:1 for body text, 3:1 for large text and for UI component boundaries. **The theme's colours are merchant-configurable** through the `color` feature, so contrast cannot be proven once and forgotten: it has to hold for the shipped default palette, which is what T-2.01 must check when it encodes the palette.
- **2.4.7 Focus Visible** — every interactive element. Note that `tailwind.config.js` sets `corePlugins: { outline: false }`, which disables Tailwind's outline utilities. **That is a live risk to this criterion** and T-2.01 or the component tasks must supply a deliberate focus style rather than inherit the browser's by accident.

---

## 2. Core Web Vitals

Doc 11 sets these qualitatively — "prioritize above-the-fold content", "near-zero layout shifts", "fast interaction response" — and gives no numbers. The numbers are Google's published **"good"** thresholds, measured at the **75th percentile**, which is how the metrics are defined. They are an external standard rather than a local invention.

| Metric | Budget | Source |
|---|---|---|
| **LCP** — Largest Contentful Paint | **≤ 2.5 s** | CWV "good" threshold |
| **INP** — Interaction to Next Paint | **≤ 200 ms** | CWV "good" threshold |
| **CLS** — Cumulative Layout Shift | **≤ 0.05** | **Tighter than the 0.1 CWV threshold, deliberately** |

**On CLS.** The published "good" bound is 0.1, and the budget here is half that. Three sources agree that 0.1 is too loose for this theme: doc 11 asks for "near-zero layout shifts", T-8.02's acceptance criteria say "measured CLS at or near zero on every template", and CLAUDE.md states plainly that **zero CLS is a requirement, not an aspiration**. 0.05 is not zero because measurement noise exists; it is as close to zero as a budget can honestly be enforced.

**Measurement conditions, per T-8.08:** throttled mobile, **not desktop**, on Home, PDP and Cart. A desktop measurement of these three numbers proves nothing about the audience this store serves.

---

## 3. Byte budgets

Compressed with **gzip** (Node's zlib at level 9, which is what the checker measures), which is the conservative floor — if the CDN serves brotli the real numbers are 25–30% smaller, and brotli figures are recorded below for information only.

Each asset has two numbers, and they mean different things:

- **Ceiling** — enforced by CI on every build. It is the measured baseline plus headroom, so **it catches regression from today forward**. It is not an endorsement of the current size.
- **Phase 8 target** — what T-8.01 and T-8.03 must actually deliver. This is the number those tasks are graded on.

The distinction matters because the scaffold ships heavier than the theme should. Setting the enforced number at the target today would fail CI on a green build and teach the team to ignore it; setting only the ceiling would let Phase 8 declare victory at the baseline.

<!-- The block below is the single source of truth. scripts/check-budgets.mjs parses
     it directly out of this file, so the documented numbers and the enforced ones
     cannot drift apart. Sizes are gzip bytes. -->

```json
{
  "compression": "gzip",
  "assets": [
    { "file": "app.css", "baseline": 90508, "ceiling": 102400, "target": 51200 },
    { "file": "app.js", "baseline": 32508, "ceiling": 40960, "target": 35840 },
    { "file": "product.js", "baseline": 14426, "ceiling": 20480, "target": 15360 },
    { "file": "home.js", "baseline": 11997, "ceiling": 20480, "target": 15360 }
  ],
  "aggregate": {
    "firstLoadJs": { "files": ["app.js", "product-card.js", "main-menu.js"], "ceiling": 51200, "target": 40960 }
  }
}
```

### Where these came from

| Asset | Baseline, measured 2026-08-06 | Ceiling | Target | Reasoning |
|---|---|---|---|---|
| `app.css` | 88.4 KB (700.9 KB raw) | 100 KB | **50 KB** | The single worst asset in the build, and the reason T-8.01 exists. Most of it is Tailwind plus `@salla.sa/twilight-tailwind-theme`'s safe-list; the target assumes T-8.01's purge does its job |
| `app.js` | 31.7 KB (110.0 KB raw) | 40 KB | 35 KB | The entry bundle, loaded everywhere. Modest headroom because it should not grow |
| `product.js` | 14.1 KB | 20 KB | 15 KB | The heaviest route chunk; also the ceiling any **new** route chunk must respect |
| `home.js` | 11.7 KB | 20 KB | 15 KB | Home gains the hotspot component (T-4.06) and the stories feed (T-7.06), so it has real headroom to consume |
| **First-load JS** | 36.2 KB | 50 KB | 40 KB | `app.js` + `product-card.js` + `main-menu.js` — the three `master.twig` loads on every page |

Brotli, for reference at the same build: `app.css` 63.1 KB, `app.js` 28.1 KB. Not budgeted, because whether the CDN serves it is Salla's decision and not the theme's.

**Assets deliberately not budgeted.** The eight chunks under 3 KB gzip — `checkout.js`, `pages.js`, `wishlist-card.js`, `digital-files.js`, `testimonials.js`, `order.js`, `add-product-toast.js`, `product-card.js` — are individually too small for a byte budget to say anything useful. They are governed by the first-load aggregate and by T-8.03's code-splitting criteria instead. **A budget nobody can breach is noise, and noise is what makes people stop reading budget failures.**

---

## 4. What CI enforces, and what it cannot

`scripts/check-budgets.mjs` runs after the production build and **fails the build when any asset exceeds its ceiling**. It reads the JSON block above, so this document is the configuration rather than a description of it.

**CI cannot enforce sections 1 and 2, and pretending otherwise would be worse than the gap.** LCP, INP and CLS are measured against a rendered storefront with real products, real images and the merchant's own settings. None of that exists in a CI runner building a theme package — there is no store to load. The same is true of WCAG conformance, most of which is not machine-checkable at all.

So the split is:

| Section | Enforced by | When |
|---|---|---|
| Byte budgets | `scripts/check-budgets.mjs` in CI | every PR and push |
| Core Web Vitals | T-8.08, throttled mobile on Home, PDP, Cart | Phase 8 |
| WCAG 2.1 AA | T-8.06, by hand, doc 13's method | Phase 8 |
| Contrast of the default palette | T-2.01, when the palette is encoded | Phase 2 |

**Changing a number in this file is a decision, not a maintenance task.** Raising a ceiling to make a build pass is how budgets die. If an asset exceeds its ceiling, the first question is what was added, not what the number should have been.
