# MANUAL-QA — the Phase 8 checks a machine cannot run

**Owner:** the project owner, by hand. **Status:** open — nothing in this file has been executed.

This file exists because several Phase 8 acceptance criteria are **not verifiable from this repository**, and the honest response to that is a procedure rather than a claim. A test runner has no browser, no screen reader, no device and no storefront with real products in it. Everything below needs at least one of those.

**How to read an item.** Every check has the same four fields, and the fourth is the one that matters:

| Field | Meaning |
|---|---|
| **Open** | the exact URL or screen |
| **Do** | the exact action — which key, which control |
| **Expect** | what a pass looks like |
| **Fail when** | the condition that makes it a defect. If this is true, the item is **failed** — not "mostly fine", not "close enough" |

**Record the result.** Put a date and an initial in the margin of the item, or keep a copy of this file with the boxes ticked. An unrecorded pass is indistinguishable from an untested item, which is the same rule `/docs/DERIVED-DECISIONS.md` applies to inferences.

---

## 0. Preflight — getting something to test

Every check below needs a live storefront running this theme. There is no local substitute: the platform renders the Twig, injects the metadata, and serves the products.

```bash
pnpm install
pnpm run production          # build the assets the preview will serve
salla theme preview          # or: salla theme p
```

The preview needs a **partner account** and a **demo store** — see `README.md` §Requirements. The demo store must have, at minimum:

- **at least 12 products**, so grids wrap and infinite scroll has a second page
- **at least one product with options** (size or colour) and **one out of stock**
- **at least 3 categories**, one of them nested
- **at least one product with 4+ images**, for the gallery and the LCP measurement
- **a store logo, a description, and a contact phone or email** set in store settings — `Organization` schema drops fields that are absent, so a bare store cannot prove them present
- **one CMS page** published, for the page shell
- **one completed order** on the test customer, for the account area

> A store with three products and no logo will pass checks that a real store fails. Populate it first.

**Where a check needs a second pair of eyes:** the screen-reader items in §2. Reading a screen with VoiceOver while also knowing what the screen looks like is a skill; if it is not yours, the item is better delegated than guessed at.

---

## 1. T-8.05 — metadata and canonicals

**Why this is here in full.** The theme emits **no** `<title>`, meta description, canonical, Open Graph or Twitter Card tag — not as an omission, but because Salla injects all of them through the `head` hooks. Upstream `theme-raed` 1.365.0 contains none of these tags in any file, and it runs on thousands of stores with working titles. `tests/t-8.05-metadata.test.mjs` locks that arrangement in place: it fails if a hook goes missing and it fails if a template starts emitting a competing tag.

**What it cannot do is confirm the platform's tags are correct.** That is the whole of this section, and all four of T-8.05's acceptance criteria live in it.

### 1.1 — Every template has a title and a description, and they differ

**Open** each URL in turn, then View Source (`Ctrl+U` / `Cmd+Opt+U`) — **not** the DevTools element inspector, which shows the DOM after scripts have run rather than what a crawler receives.

| # | Page | URL |
|---|---|---|
| a | Home | `/` |
| b | Category listing | `/category/<slug>` |
| c | Product | `/<product-slug>/p<id>` |
| d | Cart | `/cart` |
| e | Search results | `/search?q=<term>` |
| f | Offers | `/offers` |
| g | Brands index | `/brands` |
| h | Single brand | `/brand/<slug>` |
| i | CMS page (incl. the stories feed) | `/page/<slug>` |
| j | Account — orders | `/orders` |
| k | Thank-you | reachable only by completing a test order |

**Do** — for each, copy out the contents of `<title>` and `<meta name="description">` into a scratch list.

**Expect** — every page has exactly **one** of each, both non-empty, and the title names *that page* (product name, category name, page name) rather than only the store name.

**Fail when** any of these is true:

- a page has **no** `<title>` or an empty one
- a page has **two** `<title>` elements, or two `<meta name="description">` — if this happens, check whether a template started emitting one; the test suite should have caught it, and if it did not, the regex needs widening
- **two different pages carry the identical title** — the criterion is "unique per template". Home and the store's CMS "about" page sharing a title is a fail; two *product* pages differing only by product name is a pass
- the description is the *same* boilerplate string on every page

> If a page fails here, **it is a platform or store-settings problem, not a theme change.** Do not add the tag to the template — that creates the duplicate this task exists to prevent. Record it and raise it with Salla, or set the missing SEO field in the store's own settings.

### 1.2 — Canonicals on filtered, sorted and paginated URLs

This is the criterion most likely to actually fail, and the theme has a hand in it.

**Open** `/category/<slug>` and View Source. Note the `<link rel="canonical">` value — call it **C**.

**Do**, in order:

1. Apply a filter in the `salla-filters` panel. Note the address bar.
2. Change the sort order using the sort control. Note the address bar again.
3. **Reload the page** at that sorted-and-filtered URL and View Source.
4. Scroll to the bottom to trigger the next page of products. Note the address bar.

**Expect**:

- after (1) and (2) the address bar has gained query parameters (`?sort=…`, filter params) — the **path is unchanged**
- after (3) the canonical is still **C**, the clean category URL. A sort order is not a separate document and must not be indexed as one
- after (4) either the URL is unchanged (infinite scroll) or, if it gains `?page=2`, that page's canonical is **its own** `?page=2` URL — *not* C. Self-referencing canonicals are correct for pagination; collapsing page 2 onto page 1 hides those products from the index

**Fail when**:

- the canonical on the sorted URL **includes the `sort` parameter** — that is a duplicate-content URL being declared authoritative
- the canonical points at a **different domain or protocol** than the one being browsed (`http://` when the store is `https://`, or the `*.salla.sa` subdomain when the store has a custom domain)
- a filtered URL is canonical to itself — every filter combination then becomes an indexable page
- any step changes the **path** rather than the query string. The theme's own scripts (`products.js`, `testimonials.js`, `sort-disclosure.js`) push only query parameters and there is a test asserting it, so a path change here means a platform behaviour worth reporting

### 1.3 — Open Graph and Twitter Card images resolve

**Open** the product page from 1.1c and View Source. Find `og:image`, `og:title`, `og:description`, `og:url` and the `twitter:*` set.

**Do**:

1. Copy the `og:image` URL and open it directly in a new tab.
2. Paste the product URL into a preview debugger and fetch it fresh:
   - **Facebook** — <https://developers.facebook.com/tools/debug/> (press **Scrape Again**; the first result may be cached)
   - **X / Twitter** — the Card Validator, or paste into a draft post
   - **WhatsApp** — paste into a message to yourself. This is the one that matters most for a Saudi store, and it is stricter than the others about image size
3. Repeat for Home and for one CMS page.

**Expect** — the image loads on its own, is at least **600×315**, and the preview card renders with the product's image, name and price.

**Fail when**:

- the `og:image` URL **404s**, or resolves to a placeholder rather than the product image
- the preview card shows **no image** or a cropped, unreadable one
- `og:url` differs from the canonical
- the card is missing entirely in WhatsApp — commonly an image over its size limit, or an image served without a `Content-Type`

### 1.4 — Arabic metadata renders correctly in previews

Arabic in metadata fails in ways Latin text does not, and none of them are visible in the source.

**Do** — with the store language set to Arabic, run 1.3's preview debuggers again on the product page and the Home page. Then search the store's own name in Google (`site:<store-domain>`) if the store has been indexed.

**Expect** — the Arabic renders **right-to-left**, joined, with no `?`, no `Ù...` mojibake and no reversed word order. A title that mixes a Latin product name into Arabic keeps the Latin run intact and in the right place.

**Fail when**:

- characters appear as `?`, boxes, or Latin-1 mojibake — a UTF-8 encoding fault somewhere in the chain
- Arabic letters appear **disconnected** in the preview card (each letter in isolated form)
- a mixed Arabic/Latin title has the Latin run **in the wrong position** — bidi bleed, the same defect CLAUDE.md names for product names in RTL body text
- the title is **truncated mid-word** in a way that changes its meaning. Note the length; Google shows roughly 580px, which is fewer Arabic characters than Latin ones

### 1.5 — Robots directives

**Open** and View Source on: `/orders`, `/profile`, `/wishlist`, `/cart`, and the thank-you page.

**Expect** — the account pages and the thank-you page carry `<meta name="robots" content="noindex…">` or are blocked in `robots.txt`.

**Fail when** an account page or the thank-you page is **indexable**. Note that this is low-severity — those pages sit behind authentication and a crawler will not reach them — and that **the fix is not a theme change**: the theme deliberately emits no robots tag, and adding one risks conflicting with the platform's. Record it and raise it.

---

## 2. T-8.06 — accessibility, WCAG 2.1 AA

*To be written by T-8.06.*

## 3. T-8.08 — Core Web Vitals

*To be written by T-8.08.*

## 4. T-8.09 — cross-breakpoint regression

*To be written by T-8.09.*

## 5. T-8.11 — cross-browser and device

*To be written by T-8.11.*

## 6. Carried from earlier tasks

*Collected here at the end of the phase.*
