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

**1.5.1 — ⚠ The demo store, which is the high-severity half and was not here before.** Ruled 2026-08-12: **the theme will never emit a `robots` tag**, and keeping non-live storefronts out of the index is the platform's job (AC-15). Nothing in this repository can verify that it happens, so this is the check.

**Do** — on the **demo or preview** storefront, View Source and search for `robots`. Then search Google for `site:<demo-store-domain>`.

**Expect** — either a `noindex` on the demo store, or no results in the index.

**Fail when** the demo storefront is **indexable and indexed**. That is a duplicate of the real store competing with it in search, and **the theme cannot see it, cannot cause it and cannot fix it.** It is **Q4** in the Salla questions table in [DERIVED-DECISIONS.md](DERIVED-DECISIONS.md), and it must be answered **before the first publish** — not after, because removing an indexed duplicate is much slower than never creating one.

⚠ **Do not respond by adding a `robots` tag to the theme.** A forgotten `noindex` on the live store is the worse failure by a wide margin: the merchant sees a working, published storefront, nothing errors, and the store is invisible to Google — silently, totally, and possibly for months.

---

### 1.6 — ⚠ The ItemList node, which is the only one built in the browser

*T-8.04, second pass. Every other schema node is rendered by Twig. This one is not, because the listing page's Twig context carries no products — see AC-14. **That makes it the only node whose visibility to a crawler is genuinely in question.***

**1.6.1 — It exists at all.** Open `/category/<slug>`, wait for the grid, then in the console run `document.getElementById('itemlist-schema').textContent`.

**Expect** — a parsable `ItemList` whose `itemListElement` count matches the number of cards on screen, in the same order, with the right URLs and names.

**Fail when**: the node is **absent** with products on screen · the count **disagrees** with the grid · a `name` is empty or a `url` is relative.

**1.6.2 — It follows the grid.** Apply a filter, then change the sort, then scroll to load the next page. Re-run the console line after each.

**Expect** — the node is rebuilt each time and always describes what is currently displayed. Still exactly **one** `#itemlist-schema` in the document.

**Fail when**: it still lists the **previous** filter's products · a second node appears · it stops updating after the first change.

**1.6.3 — An empty result emits nothing.** Filter to a combination with no results.

**Expect** — **no** `itemlist-schema` node at all.

**Fail when** an `ItemList` with an empty `itemListElement` is emitted. An empty claim is worse than an absent key, and that rule is applied to every other node in this theme.

**1.6.4 — Google actually sees it.** Paste the category URL into the **Rich Results Test** (<https://search.google.com/test/rich-results>) and, separately, into Search Console's URL Inspection → *Test live URL* → *View crawled page*.

**Expect** — the tool lists an `ItemList` among the detected items.

**Fail when** the tool renders the page but reports **no** `ItemList`. ⚠ **That is the outcome this whole section exists for**, and it means the client-side node is not being picked up. **Do not respond by moving it into Twig** — there is no product data there to move. Record it, and it becomes a question for Salla about server-rendering the grid.

**1.6.5 — The four Twig nodes still validate.** Paste each of these into the Rich Results Test: Home (`Organization`, `FAQPage`), a product page (`Product`, `Offer`, `AggregateRating`, `BreadcrumbList`), a category page (`Organization`, `ItemList`).

**Expect** — zero errors. Warnings about optional fields are acceptable and should be recorded, not fixed blind: `priceValidUntil`, `sameAs` and `Review` are **deliberately absent** and each has its reason in AC-14.

**Fail when** any node reports an **error**, or the product page's `image` shows only one URL when the gallery has several — the node now emits the whole gallery.

## 2. T-8.06 — accessibility, WCAG 2.1 AA

**What is already machine-checked, so you do not have to look for it.** `pnpm run lint:a11y` recomputes all 18 contrast pairs from `01-settings/global.scss` — not from the table in `/docs/DERIVED-DECISIONS.md`, from the tokens themselves — and scans all 75 templates for missing `alt`, unnamed controls, positive `tabindex`, `aria-hidden` on a focusable element, and misspelled ARIA. It runs in CI. **It covers roughly a third of WCAG**, which is the published ceiling for automated checking and the reason the rest of this section exists.

**What you are looking for here is the other two thirds**, and it is mostly one question asked repeatedly: *can this be done, and understood, without a mouse and without the screen?*

### 2.0 — Set-up

- **Keyboard only.** Physically move the mouse out of reach. Reaching for it is the signal that something failed.
- **Screen reader.** **VoiceOver** on macOS/iOS (`Cmd+F5`) or **NVDA** on Windows. Set the **speech language to Arabic** — an Arabic page read by an English voice tells you nothing about pronunciation or bidi.
- **Store language: Arabic**, so `dir="rtl"` is live. Repeat §2.3 in English if the store is multilingual.
- **Browser zoom to 200%** for §2.6.

> **Focus order in RTL runs right-to-left.** Tab moves to the element that is *visually next*, which in Arabic means leftward along a row. A row that tabs left-to-right in RTL is a defect even though nothing looks wrong.

### 2.1 — Keyboard pass, per flow

Each row is one flow, done end to end with `Tab`, `Shift+Tab`, `Enter`, `Space`, arrow keys and `Esc`, and nothing else.

| # | Flow | Open | Do |
|---|---|---|---|
| a | **Browse and open a product** | `/` | Tab through the header, the announcement bar, hero, each home section, the footer, and the WhatsApp button. Open a product from a card. ⚠ **Three controls were added to this exact flow on 2026-08-12 and each changes the tab-stop count:** the announcement bar's **link** (one stop, and the marquee must pause when it receives focus), its **close button**, and the WhatsApp button's **label** — which moves the accessible name from `aria-label` onto the visible text. **With both announcement bars on, the lower one is `aria-hidden` and must contribute NO stops at all** |
| b | **Quick view** | `/` | Reach a card's quick-view control, `Enter`, operate the sheet, `Esc` |
| c | **Add to cart with options** | a product with a size or colour | Choose each option, set quantity, add to cart, dismiss the toast |
| d | **Filter and sort a listing** | `/category/<slug>` | Open filters, apply one, close. Open the sort disclosure, choose an option with `Enter`, confirm it closes |
| e | **Cart to checkout** | `/cart` | Change a quantity, remove a line, apply a coupon, reach the checkout button |
| f | **Sign in** | any page | Trigger the login sheet, complete the phone step, reach the OTP boxes, paste a code |
| g | **Account area** | `/orders` | Reach the account menu from the header, move between account pages, open an order |
| h | **Cancel an order** | `/orders` | Open the cancel dialog, confirm the **close** control is reached *before* the destructive one, `Esc` out, then reopen and confirm |
| i | **Rate an order** | a delivered order | Open the rating modal, set a star rating **with arrow keys**, submit |
| j | **Stories** | the stories feed page | Filter by tag, open a story, move between hotspots, `Esc` |
| k | **Search** | header search | Open, type, reach a result, `Enter` |

**Expect**, on every row:

- **every** interactive element is reachable, and reachable in the order it appears
- the **focus indicator is visible at every stop** — `02-generic/focus.scss` draws an ink ring, 2px, 2px offset
- `Enter` activates links and buttons; `Space` activates buttons and checkboxes
- in a dialog or sheet: focus moves **into** it on open, `Tab` **cannot leave it**, `Esc` closes it, and focus **returns to the control that opened it**
- arrow keys work where a widget is a single tab stop (star rating, sliders)

**Fail when**:

- **a keyboard trap** — focus enters something and `Tab`/`Esc` cannot get out. This is WCAG **2.1.2 Level A**, the most severe result available here. Stop and record it immediately
- an element is **reachable but has no visible focus ring** (2.4.7)
- an element is **operable by mouse but not by keyboard** (2.1.1)
- focus **jumps** somewhere unrelated, or is **lost to `<body>`**, after a dialog closes (2.4.3)
- the tab order **crosses back and forth** across the page rather than following the visual order
- a sheet closes but the page **behind it scrolled** to a different position

> **⚠ F6 — the focus ring cannot cross into a `salla-*` shadow root**, and this is the single most likely finding in §2.1. `/docs/DESIGN-SYSTEM.md` §6 records it as a system-level limit. Check it deliberately on **`salla-quantity-input`** (row c/e), **`salla-tel-input`** (row f), **`salla-datetime-picker`**, **`salla-user-menu`** (row g) and **`salla-filters`** (row d). Where the ring is missing inside a component, the fix is **technique C** — the component's exposed CSS parts, from outside — and never a fork. If a component exposes no part for it, that is a platform limitation: record it, do not fork the component.

### 2.2 — Screen reader pass, in Arabic

Do §2.1's rows again with the screen reader on and **the display off or eyes closed** for at least rows a, c, e and f. Reading the screen while listening hides exactly the failures this pass exists to find.

**Expect**:

- **every control announces a name, a role and its state.** "زر" with no name is a fail; so is a name that is only an icon's filename
- **headings form an outline** — pull up the screen reader's heading list (VoiceOver: `Ctrl+Opt+U`). Exactly **one `<h1>`** per page, no skipped levels
- **landmarks are present and named** — banner, navigation, main, contentinfo
- **dialogs announce themselves** on open, with their title, and the page behind is inert
- **live regions announce without stealing focus** — the add-to-cart toast, the quantity `role="status"`, form errors with `role="alert"`
- **state changes are spoken**: a wishlist heart says whether it is on, a filter chip says whether it is selected, a sort option says which is chosen

**Fail when**:

- a control is announced as **"link"** or **"button"** with no name (4.1.2)
- an **icon-only control reads its glyph name** or a class name
- a **state is conveyed by colour or fill alone** with nothing spoken (1.4.1) — the wishlist heart and the notification read/unread row are the two the theme deliberately fixed; verify they still speak
- a **toast is never announced**, or is announced but **steals focus** (4.1.3)
- a **form error is shown in red and not spoken** (3.3.1)
- the **heading list is empty, has two `<h1>`s, or skips a level** (1.3.1)
- **`<h1>` is missing on an account page** — it is `sr-only` there by design, so it must be *present and invisible*, not absent

### 2.3 — RTL and bidi

**Open** the product page, the cart, and the order page, in Arabic.

**Do** — tab through each row; read aloud any line that mixes Arabic with a Latin product name, a price, an order number or a phone number.

**Expect** — focus moves **right to left**. Latin runs stay intact and in the correct position inside Arabic sentences. Numbers read as numbers.

**Fail when**:

- **tab order runs left-to-right** within a row
- a **Latin product name breaks apart** or jumps to the wrong end of its Arabic sentence — bidi bleed, the defect CLAUDE.md names explicitly. `<bdi>` is the fix and the theme already uses it on story brand tags
- an **order number or phone number renders reversed**
- an **icon points the wrong way** — a "next" chevron pointing right in RTL
- **`dir="rtl"` is missing** on `<html>`, which would make every one of the above fail at once

### 2.4 — Target size and spacing

**Do** — on a real phone or an emulated 393px viewport, with DevTools' element inspector, measure the hit area of: the wishlist heart on a card, the quantity `+`/`−`, the sort disclosure, filter chips, footer social pills, the WhatsApp button, the story hotspot markers, and every dialog close button.

**Expect** — at least **44×44 CSS px**, the theme's stated floor.

**Fail when** any target is **under 44px** *and* has no equivalent larger control elsewhere. Note that WCAG 2.1 AA's 2.5.5 is AAA at 44px — this is the **theme's own** standard, so a miss here is a house-standard failure, not a conformance failure. Record it as such.

### 2.5 — Contrast, in situ

The token pairs are machine-checked. What a machine cannot check is **text over an image**, because nobody has seen the merchant's image.

**Do** — set the hero image, the lookbook image and the partner banner image to a **deliberately pale, near-white photograph**. Then sample the actual rendered pixels behind the text with a contrast picker.

**Expect** — at least **4.5:1** for body text and **3:1** for large text, against the *worst* pixel under the text, not the average.

**Fail when** any glyph sits at under 4.5:1 over the pale image. The scrim derivations in `/docs/DERIVED-DECISIONS.md` (T-4.05, T-2.20, T-4.22) claim 5.74:1 against pure white — this is the check that they hold in the browser.

### 2.6 — Zoom and reflow

**Do** — at 320px width, zoom the browser to **200%** and then **400%**. Walk Home, a listing, a product and the cart.

**Expect** — content reflows into one column. Nothing is clipped, nothing overlaps, and there is **no horizontal scrollbar**.

**Fail when** the page scrolls horizontally at 400% (1.4.10), text is cut off, or a fixed element covers content with no way past it.

### 2.7 — Doc 13's eight rows, signed

The task's final criterion is that doc 13's checklist is signed. Sign each row only against evidence from the passes above.

| Row | Signed off by |
|---|---|
| Keyboard navigation | §2.1, all eleven flows |
| ARIA | §2.2 + `lint:a11y` |
| Focus management | §2.1, dialogs and sheets |
| Contrast | `lint:a11y` (tokens) + §2.5 (over images) |
| Forms | §2.1 rows c/f, §2.2 error announcement |
| Dialogs | §2.1 rows b/h/i/j |
| Images | `lint:a11y` (`alt` present) + §2.2 (`alt` is *useful*, which no script can judge) |
| Screen readers | §2.2, in Arabic |

**Triage what you find** into: **must fix before release** (any Level A failure, any keyboard trap, anything blocking a purchase), **fix in the platform's court** (a `salla-*` component's internals), and **accepted with a recorded reason** — which goes into `/docs/DERIVED-DECISIONS.md`, because an unrecorded acceptance is indistinguishable from an oversight.

### 2.8 — Carried here by earlier tasks

These were explicitly deferred to T-8.06 and must not be lost:

| From | What to verify |
|---|---|
| **T-5.02** (Salla's checkout iframe) | Saudi country-code handling; whether the validation error is **announced** rather than only reddened; whether **Back preserves state**; whether `autocomplete` is set. All four are inside a cross-origin document — verify by using it, not by reading it |
| **T-5.03** (OTP) | Whether the «إعادة الإرسال بعد ٦٠ ثانية» countdown is **announced** rather than only drawn, and whether the failure states are distinguishable by ear |
| **T-2.10 / harness** | `tests/harness/dom.mjs` deliberately does **not** simulate the focus trap, `Esc`, focus return or inertness — those are the four reasons the theme chose `<dialog>`, and they belong to the browser. **Nothing in the test suite has ever verified them.** §2.1's dialog rows are their first real check |
| **T-8.01** | Critical CSS is **not inlined** — the theme ships two sheets and the above-fold rule set was never extracted, because choosing it needs a rendered page. Judge here whether the un-inlined first paint is acceptable, or whether it justifies the extraction step |
| **AC-9** | The accessibility of Salla's own sign-in flow **is not this theme's to fix**. Where row f fails inside the platform's document, the outcome is a report to Salla, not a change here |

### 2.9 — T-8.07, reduced motion, watched rather than inferred

`tests/t-8.07-reduced-motion.test.mjs` asserts the *shape* of the suppression — the clamp is present, its durations are non-zero, `motion.scss` is imported last, and every infinite animation has a stated disposition. **jsdom applies no stylesheets and runs no animations**, so nothing in that suite has ever seen motion stop. This is the check that has.

**Do** — turn the preference on at the OS, not in DevTools, so the platform's own components see it too:

- **macOS** — System Settings → Accessibility → Display → **Reduce motion**
- **iOS** — Settings → Accessibility → Motion → **Reduce Motion**
- **Windows** — Settings → Accessibility → Visual effects → **Animation effects** off
- **Android** — Settings → Accessibility → **Remove animations**

Then walk doc 14's nine animations, plus the two the theme added:

| # | Animation | Where | Expect under the preference |
|---|---|---|---|
| a | Hero transition | Home | No slide, no fade. **Autoplay is paused on arrival** — not merely pausable |
| b | Product image transition | product gallery | Images swap instantly |
| c | Bottom sheet | login, filters | Appears in place, no slide from the bottom |
| d | Toast | after add-to-cart | Appears in place, no upward drift |
| e | Dialog | cancel-order | No scale, no fade |
| f | Accordion | FAQ | Panel opens instantly. **It still opens** — height is JS-driven and the transition end is what removes `hidden` |
| g | Floating menu | account | No slide |
| h | Order status | orders | No highlight sweep |
| i | Story navigation | stories | Instant, no horizontal slide |
| j | **Announcement marquee** | Home, top and above the footer | **Text stands still and is readable in place** — not scrolled off the end of the bar |
| k | **Skeleton shimmer** | any loading state | The bar is flat grey. **No bright band parked** anywhere on it |

**Fail when**:

- **anything still moves perceptibly** (2.3.3)
- the **announcement text is missing or clipped** — that is the end-state trap: the marquee completed instead of stopping, and its text is now outside the bar
- a **bright band sits frozen** on a skeleton
- **hero autoplay is still running** on arrival. `home.js` reads the preference live and sets the initial state from it; if the carousel advances by itself, that wiring broke
- **a removed wishlist item stays on the page.** This is the specific failure a zero-duration clamp causes: `wishlist.js` deletes the node inside a `transitionend` handler, and a `0s` transition fires no such event. Remove an item from the wishlist with the preference on and confirm the row actually disappears
- **an accordion panel will not open**, for the same reason
- **any functionality is lost** rather than merely stilled — a control that no longer responds, a sheet that no longer closes

> **The one known gap, recorded rather than fixed.** Upstream's `add-product-toast` drives a progress bar by writing `style.width` on a 50 ms `setInterval`. **No CSS clamp can reach a JS timer**, so that bar keeps moving under the preference. It is **off by default** — T-2.12 set `enable_add_product_toast` to `false` because the design's toast is the slim `salla.notify` one — and it is an upstream component this theme has never adopted. **If a merchant enables it, this is a known reduced-motion failure**; check it during §5 (T-8.10) when every setting gets toggled, and treat it as a reason to leave the setting off rather than as a theme defect to fix.

---

## 3. T-8.08 — Core Web Vitals

**The budgets are `/docs/BUDGETS.md` §2 and they are not negotiable downward here.** LCP **≤ 2.5 s**, INP **≤ 200 ms**, CLS **≤ 0.05** — the last one deliberately half the published 0.1, because doc 11 asks for "near-zero", T-8.02's criteria say "at or near zero on every template", and CLAUDE.md says zero CLS is a requirement rather than an aspiration.

**Byte budgets are already enforced in CI and are not re-checked here.** As of 2026-08-12: `app.css` 58.8 KB, `salla-components.css` 44.7 KB, `app.js` 34.1 KB, `product.js` 2.8 KB, `home.js` 2.3 KB, `media.js` 11.7 KB, first-load JS 37.9 KB. Everything is inside its ceiling; `app.css` is the one asset still above its 50 KB Phase-8 target.

### 3.0 — Conditions, which are most of the result

**Measure on throttled mobile, not desktop.** A desktop measurement of these three numbers proves nothing about the audience this store serves, and the criterion says so explicitly.

| Setting | Value |
|---|---|
| Device | a **real mid-range Android**, or DevTools device emulation at 393×852 |
| CPU throttle | **4× slowdown** (6× if you have a real low-end device to calibrate against) |
| Network | **Slow 4G** |
| Cache | **disabled**, and measure a **cold** load. Then measure a warm one separately |
| Profile | a **fresh** browser profile, no extensions — an ad blocker changes every number |
| Runs | **five per page**, and take the **median**. A single run is noise |

**Pages: Home, PDP and Cart.** Those three are the criterion. Add the category listing if time allows — it is the heaviest grid.

**Tools**, in the order they are useful:

1. **Lighthouse**, mobile preset — the fastest read, and the one that names the LCP element for you
2. **DevTools → Performance**, with **Web Vitals** enabled in the panel's settings — this is where INP actually gets measured, because Lighthouse's "Total Blocking Time" is a proxy for INP and not INP
3. **PageSpeed Insights** on the live URL, for the CrUX field data, once the store has traffic

> **Lab is not field.** The budgets are defined at the **75th percentile of real users**. Lighthouse gives you one synthetic run. Treat a lab pass as *necessary and not sufficient*: it is the gate for release, and PSI field data is what confirms it a month later. Record both, and never report a lab number as if it were a field number.

### 3.1 — LCP ≤ 2.5 s

**Do** — run Lighthouse on each page and read the **"Largest Contentful Paint element"** it names.

**Expect**:

| Page | The LCP element should be | Why |
|---|---|---|
| Home | the **hero image** | it is the only eagerly-loaded image on the page, deliberately |
| PDP | the **first gallery frame** | same reason |
| Cart | the **first cart line's thumbnail**, or the page heading if the cart is empty | it is the first row's image that loads eagerly |

**Fail when**:

- **LCP exceeds 2.5 s** at the median of five throttled runs
- **the LCP element is not the one above** — if Lighthouse names a footer block, a late text node, or a `salla-*` component, something is painting the intended hero too late
- **the LCP element is an image with `loading="lazy"`.** `lint:images` enforces one eager image per template; if the LCP one is lazy, the wrong one is eager
- **LCP moves between runs** — that usually means it is racing hydration rather than being painted from HTML

**The two known suspects, named in advance:**

- ✅ **Critical CSS is now inlined — 4.9 KB, done 2026-08-12.** No stylesheet blocks first paint any more except the two fonts below. **What this changes about the measurement:** if LCP still misses, the CSS is no longer the suspect and the answer is in the image itself — the hero's own transfer size, or the `fetchpriority="high"` preload competing with something. ⚠ **It also introduces a new failure this section must watch for**, and it is checked in §3.4 rather than here.
- ⚠ **Two more render-blocking sheets stay on purpose** — the platform's font CSS, which first paint genuinely needs, and the icon font, whose glyphs are sized by the type scale and would reflow their controls if they arrived late. Confirm in the waterfall that neither is the long pole. **A preconnect was considered and rejected** as a guessed origin; if the waterfall shows a slow third-party font host, that is now measured rather than guessed and worth revisiting.

### 3.2 — CLS ≤ 0.05

This is the tightest budget in the file and the one most likely to fail.

**Do**, per page:

1. Load cold with throttling on and **watch the top 3 seconds**, not the final state.
2. In DevTools → Performance, enable **Layout Shift Regions** so the shifts are visible rather than inferred.
3. Scroll to the bottom slowly, then reload and let it sit idle for 10 seconds — CLS accumulates over the whole page lifetime, not just load.
4. On the listing page, **trigger the next page of products** and watch for a shift.

**Expect** — a median CLS of **0.05 or lower** on every page, with **zero** shifts visible in the first paint.

**Fail when** CLS exceeds 0.05, **or** when any of these specific shifts is visible even under budget:

| Suspect | What it looks like | Note |
|---|---|---|
| ⚠ **Font swap** | all text nudges when the merchant's font arrives | **`font-display` cannot be set from this theme.** The `@font-face` rules live in the stylesheet Salla serves from `theme.font.path`, which the theme does not own. The fallback stack narrows the shift; it does not remove it. **If this is visible, it is a platform conversation, not a theme fix** — record it with a screen recording |
| **Icon font** | controls resize when `sallaicons` arrives | it is render-blocking on purpose for exactly this reason. If it still shifts, the blocking is not working |
| **`salla-components.css`** | platform components restyle after load | it is deferred deliberately. The argument was that every `salla-*` element is empty until hydration, so there is nothing to shift. **This is the measurement that tests that argument** |
| **Merchant images** | a card or banner jumps as its image lands | `lint:images` proves the box is *reserved*; only this proves nothing *moved*. Test with a **slow image** — throttle hard |
| **Announcement bar** | the page drops when the bar appears | it renders server-side and should reserve its own height |
| **`salla-*` hydration** | filters, cart totals or the user menu resize on hydrate | the theme cannot fix a component's internals; record which one |
| **Infinite scroll** | the footer jumps when a page of products appends | appended content below the viewport should not count; if it does, something above it is moving |

> **T-8.02 explicitly deferred this measurement here.** That task proved every image box is reserved. It could not prove nothing moved, and said so. §3.2 is the check it was waiting for.

### 3.3 — INP ≤ 200 ms

**Do** — with the Performance panel recording and Web Vitals enabled, perform each interaction and read the INP attribution:

| # | Page | Interaction |
|---|---|---|
| a | Home | open the search modal |
| b | Home | open a card's quick view |
| c | Home | tap a story, then move between hotspots |
| d | listing | open the filter panel; apply a filter |
| e | listing | change the sort order |
| f | PDP | change a product option (size, colour) |
| g | PDP | change quantity, then add to cart |
| h | Cart | change a line quantity |
| i | Cart | remove a line |
| j | any | open the login sheet |
| k | account | open the cancel-order dialog |

**Expect** — every interaction's INP at or under **200 ms**, measured on the throttled profile.

**Fail when**:

- any single interaction exceeds **200 ms**
- an interaction shows **no visual feedback within 100 ms** even if the total lands under budget — INP measures to next paint, and a control that looks dead for 150 ms feels broken regardless of the number
- the **worst** interaction is one of a/b/j — those open overlays built on T-2.10's `<dialog>`, and a slow `showModal()` usually means a large subtree being built on click rather than being present and inert

### 3.4 — ⚠ The inlined critical CSS, which is the one thing in Phase 8 no test could check

**Read this before running §3.1.** T-8.01's second half inlines 4.9 KB of above-fold CSS into every page and makes `app.css` non-blocking. The test suite proves that block is a faithful subset of `app.css` and that it contains the bar, the header and the hero. **No test in this repository can prove the page paints correctly**, because there is no browser in it — the rules were derived from the Twig templates, not observed on a rendered page. That gap is [AC-12](DERIVED-DECISIONS.md) and this section is the only thing that closes it.

**Do**, on Home, on a real phone, with DevTools → Network → **Slow 4G** and the cache disabled:

1. Load the page and **watch the first second**. Record the screen if you can — this is a flash, and it is easy to talk yourself out of having seen one.
2. Repeat on the product page, the cart and one CMS page.
3. Reload once with **JavaScript disabled** entirely.
4. Reload once with the **announcement bar turned off** in the customiser, then once with the **hero removed** from the section list.

**Expect** — the announcement bar, the header and the hero appear **already styled**, in their final positions, in the first frame that shows anything. The marquee is scrolling. The header sits over the hero image, not above it. Content below the hero may appear unstyled for a moment; **that is the design of this change, not a defect.**

**Fail when**:

- **the bar, header or hero appears unstyled and then snaps into place.** This is the failure the whole section exists for: a rule the static extraction missed. Note *which element* moved — the `SURFACE` list in `scripts/extract-critical.mjs` is where the fix goes.
- **the header appears below the hero and then jumps on top of it.** `--header-offset` and the `body:has(.announcement-bar--top)` rule are in the extract; if this happens, `:has()` is failing in that browser and the overlay header needs a non-`:has()` fallback.
- **the marquee starts still and then begins moving.** Its `@keyframes` are carried by name; a miss here means the second pass in the extractor did not find the animation.
- **anything shifts** as `app.css` arrives — this is a CLS event and belongs in §3.2's table as well.
- **with JavaScript off, the page renders with only the header styled.** The `<noscript>` fallback is not working, and this is the worst outcome in this section: a fully unstyled store.
- **turning the announcement bar off, or removing the hero, leaves a gap or a misplaced header.** The extract is one sheet for all configurations; it must not assume a section is present.

⚠ **If the first bullet happens, do not fix it by re-inlining `app.css`.** That undoes the task. The fix is to name the missing surface in the script and rebuild.

### 3.5 — Recording the result

For each of Home, PDP and Cart, record: the **median of five** for each metric, the **LCP element** Lighthouse named, and any shift you *saw* even where the number passed. Keep the Lighthouse JSON — it is the only durable evidence, and a number in a chat message is not a measurement.

**Then re-check `/docs/BUDGETS.md` §2 against what you found.** If a budget is wrong, changing it is the owner's decision and is recorded as such. **Raising a number to make a red result green is how budgets die** — that sentence is already in BUDGETS.md and applies here.

### 3.6 — ⚠ The responsive candidates actually resolve

*T-8.02, second pass. Seven images gained a `srcset` built from `|cdn(width)`. **Nothing in this repository can confirm Salla's CDN honours those widths** — the theme writes a URL and assumes a resize happens at the other end.*

**3.6.1 — The CDN really resizes.** On Home, open DevTools → Network → Img, and hard-reload at a **narrow** viewport (375px).

**Expect** — the hero request is the **450w** candidate, and its transferred size is meaningfully smaller than the 1350w one.

**Fail when**:

- **every candidate transfers the same number of bytes.** `|cdn(450)` is being ignored and the theme is shipping a full-size image with a misleading `srcset` — worse than no `srcset`, because the browser now believes it chose a small file.
- a candidate URL **404s** or returns the placeholder.
- the image is **visibly blurry** at any tier — the widths are too small for the box and `sizes` needs revisiting.

**3.6.2 — The hero is fetched ONCE.** Still on Home, filter Network by the hero image's filename.

**Expect** — **exactly one** hero image request.

**Fail when** there are **two** — one from the `<link rel="preload">` and one from the `<img>`. That means `imagesrcset`/`imagesizes` have drifted from `srcset`/`sizes`, and the page is now preloading a file it does not use. There is a test pinning them together; if this fails, the test was defeated by something it does not read (a changed `sizes` unit, a CDN that normalises URLs differently).

**3.6.3 — Retina logos.** On a 2× display, hard-reload and inspect the header logo.

**Expect** — the **350w** candidate is fetched, and the wordmark is crisp rather than soft.

**Fail when** the 175w file is fetched on a 2× screen, or the logo looks softer than the text beside it.

**3.6.4 — The widths chosen match the boxes.** At 375px, 768px and 1440px, right-click the hero, the offers banner and a story card → *Inspect*, and read `currentSrc`.

**Expect** — the width chosen is the **smallest candidate at or above** the rendered box width × device pixel ratio.

**Fail when** a much larger candidate is chosen at a small viewport — that is a `sizes` expression that overstates the box, and it costs bandwidth on exactly the connections that can least afford it. Record the element and the viewport; the fix is the `sizes`, not the `srcset`.

## 4. T-8.09 — cross-breakpoint regression

**Above 393pt there is no artboard, and that is the point.** B4 granted derivation authority instead of new designs, so **you are testing against five rules, not against a picture.** Anyone who asks "does this match the design?" above mobile is asking a question with no answer.

**The four tiers**, from doc 10 and `01-settings/breakpoints.scss`:

| Tier | Width | Rule |
|---|---|---|
| **Mobile** | **393px** | the artboards. The binding reference for content, order and hierarchy |
| **Tablet** | **768px** | `from-tablet`. Two columns where the design allows |
| **Laptop** | **1024px** | `from-laptop`. Multi-column grids |
| **Desktop** | **1280px** | `from-desktop`. Maximum container, whitespace maintained |

Also check **320px** — narrower than any artboard, and the width WCAG 1.4.10 names.

### 4.1 — B4's five rules, checked as rules

At each of 393 · 768 · 1024 · 1280, on Home, category listing, PDP, cart and one account page:

| # | Rule | Expect | Fail when |
|---|---|---|---|
| 1 | **Bounded centred container, no full-bleed stretch** | content stops at a maximum width and centres; margins grow, the column does not | a text column runs the full 1280px, or a section stretches edge to edge that did not on mobile |
| 2 | **Grids gain columns; the card itself is unchanged** | more cards per row — same card width, same image ratio, same type size, same padding | the **card** grows. This is the most commonly broken rule: a 2-up grid at 1280 with each card twice the size is a redesign, not a derivation |
| 3 | **Bottom sheets become centred dialogs above tablet** | the login sheet, quick view and cancel dialog stop sliding from the bottom and centre, capped at 28rem. The filters drawer becomes a static column beside the grid | a sheet is still full-width and bottom-anchored at 1280, or the filters column overlaps the grid |
| 4 | **Footer goes multi-column** | link groups sit side by side | the footer is still a single stack at 1280 |
| 5 | **Spacing and type scale up through the Tailwind scale** | larger gaps and headings at wider tiers | a spacing value that is not on the scale, or type that never grows |

### 4.2 — The three prohibitions, which bind at *every* breakpoint

**Nothing may be added, reordered, or hidden.** `tests/t-8.09-breakpoints.test.mjs` catches the add and the hide **where they are done with a utility class** — it registers every one and fails on a new one. It cannot see reordering at all, and it cannot see either prohibition done with CSS `order`, `display` in a stylesheet, or a Twig conditional on something viewport-derived.

**Do** — at each tier, list the sections top to bottom on Home and compare the four lists.

**Expect** — the same sections, in the same order, at all four widths.

**Fail when**:

- a section **appears** at a wider tier that is not there at 393
- a section is **missing** at a wider tier that is there at 393
- two sections **swap order** — check `flex-direction: row-reverse`, `order:`, and grid placement, which are the three ways this happens without anyone meaning it
- content is present but **visually unreachable** — clipped, behind something, or scrolled off with no scrollbar

> ⚠ **One open defect is already known and is waiting on your ruling. See §7.** The PDP carries a second, redundant wishlist button that is hidden below 640px. Do not spend time rediscovering it.

### 4.3 — Commerce-critical flows, at every breakpoint

Doc 10 requires this explicitly: *"Test all commerce-critical flows on every breakpoint."* Run each flow **completely** at 393, 768, 1024 and 1280 — not a glance at the page, the whole flow.

| # | Flow |
|---|---|
| a | Home → category → product → add to cart → cart → reach checkout |
| b | Search → result → product → add to cart |
| c | Filter and sort a listing, then open a result |
| d | Sign in, then reach the account area |
| e | Open an order, then cancel it |
| f | Add to wishlist from a card, then from the PDP, then open the Favorites page |

**Fail when** a flow that completes at one width **cannot be completed** at another, or when a control needed to finish it is off-screen, overlapped, or under 44px.

### 4.4 — The seams

Resize **slowly** through each breakpoint rather than jumping between them. Bugs live at the boundary, not in the middle of a tier.

**Expect** — layout changes once, cleanly, at 768 / 1024 / 1280.

**Fail when**:

- a **horizontal scrollbar appears** at any width between 320 and 1920. Walk the whole range
- content **jumps twice** near one boundary — usually two rules with different breakpoints fighting
- an element **overlaps another** in a narrow band, then recovers
- the page is **still mobile-shaped at 1279px and desktop-shaped at 1281px** with nothing in between — a tier was skipped

### 4.5 — RTL at every tier

Everything above, again, in Arabic. **A multi-column layout is where physical-property bugs surface**, because a single-column mobile page hides them.

**Fail when** a multi-column layout reads **left to right** in Arabic, a sidebar lands on the wrong side, or a `margin-left` survives that should have been `margin-inline-start`.

## 5. T-8.10 — merchant settings

**What is already machine-checked.** `pnpm run lint:settings` reads `twilight.json` against every `theme.settings.get()` and `salla.config.get('theme.settings.…')` in the theme and fails on the two mirror-image defects: **a setting the merchant can never set** (read but not declared) and **a setting that does nothing** (declared but never read). It also requires a default and a label on every one. It models reachability, so an unregistered upstream home section is not reported as missing settings. It runs in CI. Today: **44 settings, 6 components with 20 fields, all wired**, and **one open finding — see §7**. ⚠ That count was **26** until 2026-08-12 and this line said so; T-8.13, T-3.03 and T-3.10 added eighteen. A checklist that states a stale total is a checklist that quietly under-tests, so `tests/t-8.10-qa-coverage.test.mjs` now fails if a declared setting is named nowhere in this file.

**What it cannot do is the criterion itself:** toggle each setting in a real store and look. A setting can be declared, read, defaulted, labelled — and still be wired to the wrong thing.

### 5.1 — Every setting, toggled

For each row: set it, save, reload the storefront, and confirm the described change happens **and nothing else does**.

**⚠ Eighteen of the 44 are checked in their own sections rather than here**, because they change behaviour rather than appearance and each needed more than one row. They are indexed by id so that «is every setting tested?» can be answered by searching this file, which it could not be before:

| Setting | Label | Checked in |
|---|---|---|
| `color_page_background` | لون خلفية الصفحة | §5.5 — the colour panel, with hostile values |
| `color_text_primary` | لون النصّ الأساسي | §5.5 — the colour panel, with hostile values |
| `color_header_background` | لون خلفية الرأس | §5.5 — the colour panel, with hostile values |
| `color_header_text` | لون نصّ الرأس | §5.5 — the colour panel, with hostile values |
| `color_footer_background` | لون خلفية التذييل | §5.5 — the colour panel, with hostile values |
| `color_footer_text` | لون نصّ التذييل | §5.5 — the colour panel, with hostile values |
| `color_button_background` | لون خلفية الأزرار | §5.5 — the colour panel, with hostile values |
| `color_button_text` | لون نصّ الأزرار | §5.5 — the colour panel, with hostile values |
| `color_icons` | لون الأيقونات | §5.5 — the colour panel, with hostile values |
| `secondary_color` | اللون الثانوي | §5.5 — the colour panel, with hostile values |
| `announcement_bg` | لون خلفية الشريط الإعلاني | §5.6 — the announcement bar’s five controls |
| `announcement_text_color` | لون نصّ الشريط الإعلاني | §5.6 — the announcement bar’s five controls |
| `announcement_url` | رابط الشريط الإعلاني | §5.6 — the announcement bar’s five controls |
| `announcement_sticky` | تثبيت الشريط عند التمرير في كل الصفحات | §5.6 — the announcement bar’s five controls |
| `announcement_dismissible` | السماح للعميل بإغلاق الشريط | §5.6 — the announcement bar’s five controls |
| `whatsapp_fab_bg` | لون خلفية زرّ واتساب | §5.7 — the WhatsApp button’s four controls |
| `whatsapp_fab_icon_color` | لون أيقونة زرّ واتساب | §5.7 — the WhatsApp button’s four controls |
| `whatsapp_fab_label` | نصّ زرّ واتساب | §5.7 — the WhatsApp button’s four controls |
| `whatsapp_fab_side` | جهة زرّ واتساب | §5.7 — the WhatsApp button’s four controls |


| # | Setting | Set it to | Expect |
|---|---|---|---|
| 1 | `secondary_color` | a hex that is obviously not the default | the secondary brand colour changes wherever it is used. Try an invalid string too — the store must not break |
| 2 | `button_style` | each of rounded · pill · square | every button in the store changes corner shape, including inside dialogs |
| 3 | `announcement_enabled` | on, then off | the top marquee appears and disappears on **Home only** |
| 4 | `announcement_bottom_enabled` | on, then off | the second marquee above the footer, **Home only**, independent of #3 |
| 5 | `announcement_text` | a long Arabic string, then one word | the marquee carries it. **A single word must still be readable, not racing** |
| 6 | `logo_light` | upload one, then clear it | the overlay header uses it on Home; clearing falls back without breaking the header |
| 7 | `header_is_sticky` | on, then off | the header sticks or does not, at every breakpoint |
| 8 | `footer_is_dark` | on, then off | the footer inverts. **Check contrast in both** |
| 9 | `whatsapp_fab_enabled` | on, then off | the floating button appears; with it on and no WhatsApp number in store settings, it must not render a dead control |
| 10 | `product_show_breadcrumbs` | on, then off | PDP breadcrumb. **Confirm the `BreadcrumbList` JSON-LD tracks it** — schema for content absent from the page is a T-8.04 defect |
| 11 | `product_index_show_breadcrumbs` | on, then off | listing breadcrumb, independent of #10 |
| 12 | `enable_add_product_toast` | on | ⚠ the rich toast replaces the slim one. **Then re-run §2.9 with reduced motion on** — its progress bar is the known reduced-motion gap |
| 13 | `notify_when_available_in_card` | on, then off | the notify control on out-of-stock cards |
| 14 | `instant_delivery_tag` | a tag name that exists, then one that does not | the delivery pill appears only on products carrying that tag; a nonexistent tag shows none |
| 15 | `sticky_add_to_cart` | on, then off | the mobile sticky bar. **With it on, confirm the price still shows in the button** — T-4.12 exists because the component rewrites that label |
| 16 | `related_products_count` | 0, 1, the maximum | zero must hide the section entirely, not leave an empty heading |
| 17 | `offer_banner` | set, then clear | the offers banner |
| 18 | `listing_products_per_page` | the minimum and the maximum | the grid count, and infinite scroll still paging correctly |
| 19 | `listing_default_sort` | each option | the listing loads pre-sorted, and the sort control shows that option as selected |
| 20 | `show_tags` | on, then off | product tags on the PDP |
| 21 | `slider_background_size` | each option | the slider background fit |
| 22 | `imageZoom` | on, then off | PDP gallery zoom |
| 23 | `order_cancellation_policy_url` | a URL, then empty | the link in the cancel dialog; **empty must hide the link, not render a dead one** |
| 24 | `stories_page_id` | a valid CMS page id, then an invalid one, then empty | the stories feed link resolves; invalid or empty must not produce a broken link |
| 25 | `vertical_fixed_products` | on, then off | the fixed-products layout |
| 26 | `photos_slider_title` | a title, then empty | empty hides the heading rather than rendering an empty one |

**Fail when**, for any row:

- the change **does not happen**
- the change happens **somewhere else too** — a setting with side effects
- **clearing an optional value breaks the page** rather than hiding the thing
- an **empty or invalid value renders a dead control**: a link with no href, a button that does nothing, a heading with no text
- the setting **only takes effect after a hard refresh** that a merchant would not know to do

### 5.2 — The six custom sections

Each of `home.hero`, `home.lookbook`, `home.video-carousel`, `home.stories`, `home.partner-banner`, `home.faq`: add it, fill every field, save, view. Then **remove every optional field's value** and view again.

**Expect** — the section renders fully configured, and degrades cleanly when optional fields are empty.

**Fail when**:

- a **collection with zero items** renders an empty container or a heading with nothing under it
- a **collection at its maximum** (30 FAQ items, all hero slides) breaks the layout
- a **hotspot's `x%`/`y%`** lands in the wrong place, or a **hotspot product id that does not exist** breaks the section rather than skipping the point
- an **image field left empty** renders a broken image rather than nothing
- **`cta_url` empty** on the stories section renders a link to nowhere

### 5.3 — The two extremes, which are the actual criterion

**Do**:

1. **Every optional section disabled.** Remove all six custom sections and turn off every optional toggle. View Home, a listing, a PDP and the cart.
2. **Every optional section enabled**, every toggle on, every collection filled to its maximum.

**Expect** — in (1) the store is sparse but **complete and navigable**: header, footer, product grid, working cart. In (2) it is dense but **not broken**.

**Fail when**:

- (1) leaves Home **empty**, or with orphan spacing where sections used to be, or with no way to reach a product
- (1) breaks a **commerce-critical flow** — a store with everything optional turned off must still sell
- (2) produces a **horizontal scrollbar**, overlapping sections, or a Home page whose LCP is now catastrophic. Re-run §3.1 on the maximal Home

### 5.4 — A fresh install

**Do** — install the theme on a **clean demo store** where no setting has ever been touched.

**Expect** — the store looks deliberate out of the box. The defaults are what a merchant sees before they read anything.

**Fail when**:

- a section renders with **placeholder or example content visible to shoppers** — the FAQ's default «هل منتجاتكم أصلية؟» and the stories defaults are seed content, and it must be obvious they are meant to be replaced. **If seed copy would embarrass a merchant who published without editing, that is a defect**
- a **required field with no default** blocks the section from rendering at all
- the **default colour, button shape or font** produce a store that looks unfinished rather than plain

> **Remember the standing note in `MEMORY.md`:** the Arabic strings in the artboards, including the AM5 coupon, are **illustrative, not final**. Do not treat seed copy as approved copy.

---

### 5.5 — ⚠ The nine colour settings, tested with hostile values

**Read AC-13 in [DERIVED-DECISIONS.md](DERIVED-DECISIONS.md) before this section.** T-8.13 gives the merchant nine colours. **The theme cannot warn them about contrast and nothing in the build can** — `check-a11y.mjs` recomputes 18 pairs from the *defaults* and is blind to whatever the merchant chooses. This section is the only check that exists, and **the point of it is to be hostile.** «I set some colours and it looked fine» does not test what AC-13 admits to.

**5.5.1 — The zero test, which is the most important one here.** On a store where **none** of the nine has been touched, load Home, a product page, the cart and the account area.

**Expect** — pixel-identical to the theme before T-8.13. Six of the nine ship the measured design value; three ship **empty** on purpose.

**Fail when**:

- **the buttons are grey rather than the store's brand colour.** This is the specific regression the three empty defaults exist to prevent: it means someone filled one of `color_button_background`, `color_button_text` or `color_icons` with a literal, and every store with a brand colour set has been repainted.
- **the header bar or footer panel changed tone.** Both default to `#F7F6F4`, the measured section panel — not white.

**5.5.2 — Each setting alone.** Change one, save, reload, then clear it. Nine times.

| Setting | Should change | Must NOT change |
|---|---|---|
| لون خلفية الصفحة | the page behind everything | the section panels, the cards, the sheets |
| لون النصّ الأساسي | body text site-wide | the white text on the hero, prices in error red |
| لون خلفية الرأس | the header bar on **inner pages only** | **the Home header, which is transparent over the hero** |
| لون نصّ الرأس | header icons and text on inner pages | the white header icons on Home |
| لون خلفية التذييل | the footer panel | every other section panel on the site |
| لون نصّ التذييل | footer headings, links, tax line, copyright | the trust badges, which follow «تذييل داكن» |
| لون خلفية الأزرار | `.btn--primary` fill and its border | the cart's shipping-progress bar, brand-page chips |
| لون نصّ الأزرار | the primary button's label | outline and ghost button labels |
| لون الأيقونات | every `.ui-icon` | icons rendered inside Salla's own components |

**Fail when** anything in the third column moves. Each is a scoping decision with a test behind it, and a failure means the CSS reached further than the label promises.

**5.5.3 — The hostile pass, which is the actual criterion.** Set `لون النصّ الأساسي` to **`#CCCCCC`** and leave the page background at its default.

**Expect** — an unreadable store. **That is a pass.** The owner accepted this in writing; the check is that it degrades *predictably* rather than breaking.

**Fail when**:

- **anything other than text colour changes** — a layout shifts, a border disappears, a component throws. The setting must be inert beyond its one job.
- the **focus ring** becomes invisible. It is `#1B1B1B` and **deliberately not configurable**; if it followed the ink here, keyboard users would lose the one indicator that is supposed to be exempt.

Then repeat with `لون الأيقونات` set to a dark colour and check the **Home header over a dark hero image** — the icons should be invisible, which is the documented consequence, and nothing else should be wrong.

**5.5.5 — The hero quote survives everything.** With the hostile values from 5.5.3 still in place, upload a **deliberately pale hero image** — near-white, the worst case the scrim was built for — and read the quote over it.

**Expect** — the quote is still legible. The scrim is a fixed gradient reaching 60% black and holding to 70%, and it is **deliberately not a setting** (ruling of 2026-08-12, AC-13): none of the ten colours can reach it.

**Fail when**:

- **the quote is hard to read over the pale image.** That is the one failure in this whole section that is the theme's fault rather than the merchant's, because the scrim is the theme's and its whole job is this case.
- **any colour setting changed the scrim's darkness.** It would mean a setting leaked past its scope, and the absence of a scrim control stopped being a guarantee.

**5.5.4 — Malformed input.** Type `red`, then `#GGG`, then a single space into one of the fields if the picker allows free text.

**Expect** — the token falls back to its default and the page renders normally. An invalid CSS declaration is dropped by the browser.

**Fail when** the page renders with a **broken or empty `:root` block**, or any subsequent declaration in that block stops working — that would mean the value escaped its declaration and corrupted the ones after it.

### 5.6 — ⚠ The announcement bar's five controls

*T-3.03, second pass. Here rather than in §5.1 because three of these change behaviour, not appearance.*

**5.6.1 — The link.** Set `رابط الشريط الإعلاني`, reload Home.

**Expect** — the announcement text is a link. **Tab through the page from the top:** the bar takes **exactly one** tab stop. Pointing at it or focusing it **stops the marquee**, so the target holds still.

**Fail when** — there are **two** tab stops in the bar (the duplicated marquee copy became a second link), or the marquee keeps moving under the pointer, or a screen reader reads the announcement **twice** (once as text, once as a link name).

**5.6.2 — The link, with both bars on.** Keep `إظهار الشريط الإعلاني أسفل الصفحة أيضًا` on. Tab to the bottom of Home with a screen reader running.

**Fail when** — the keyboard **lands on the lower bar's link or close button**. The lower bar is `aria-hidden`, so anything focusable inside it is a control the screen reader will not announce — the trap this pass exists to avoid.

**5.6.3 — Pinning, and what it costs.** Turn on `تثبيت الشريط عند التمرير في كل الصفحات`. Scroll Home, then a product page, then the cart.

**Expect** — the bar appears on **every** page, pins to the top, and **the header no longer pins** — that is the ruling, not a bug. Nothing below the bar moves when it pins.

**Fail when** — the header pins **as well**, and the two stack into a strip eating the top of the page · the page **shifts** as the bar pins (it must be `position: sticky`, not `fixed`) · on Home the overlay header sits in the wrong place, which means `--header-offset` is being measured from a bar no longer in flow.

**5.6.4 — Dismissal, and the shift it must not cause.** Turn on `السماح للعميل بإغلاق الشريط`. Close the bar. **Reload, on a throttled connection, and watch the top of the page.**

**Expect** — after the reload the bar is **simply not there**. It must never appear and then disappear.

**Fail when**:

- **the bar flashes and then vanishes.** That is a layout shift of the bar's full height, pushing the whole page up, on every load for every visitor who ever closed it — and it means the decision moved out of the head script into the deferred bundle. Record it against §3.2 as well.
- **closing the top bar leaves the lower one scrolling** above the footer. They are one message and close together.
- **focus is lost** after closing — pressing Tab should continue from the page content, not restart at the top of the document.
- **the bar comes back** on the next page load. Storage is not being written; check whether the browser is in private mode, which is a documented and acceptable degradation, not a defect.

**5.6.5 — A new announcement reaches people who dismissed the old one.** With the bar dismissed, change `نص الشريط الإعلاني` and reload.

**Expect** — the bar is **back**. The stored key is derived from the text, so a new message is a new decision.

**Fail when** the bar stays hidden — a permanent flag retires the feature the first time anyone uses it, and the people most likely to buy never see the next offer.

### 5.7 — ⚠ The WhatsApp button's four controls

*T-3.10, second pass. The colours are §5.5's business; these two items are not.*

**5.7.1 — The label and the accessible name.** Set `نصّ زرّ واتساب`, reload, and run a screen reader over the button. Then clear it and repeat.

**Expect** — with a label, the button is announced as **exactly the words on it**. With none, it is announced by its `aria-label`.

**Fail when**:

- the screen reader says something **different from the visible text** — that is WCAG 2.5.3, and it also breaks voice control: a user saying what they can see cannot activate the button.
- the button is announced **twice**, or as an unlabelled link.
- with no label the button is **not a circle** — a fixed width would clip the text, so `min-width` is used; if the bare button is an oval, the padding is on the button instead of on the label.

**5.7.2 — The side, on a notched phone in landscape.** Set `جهة زرّ واتساب` to `بداية السطر`, then rotate a notched iPhone to landscape with the notch on the **same** side as the button. Repeat with the button on the other side. Then repeat both in an **LTR** store.

**Expect** — the button clears the notch on whichever side it is on, in both directions.

**Fail when** the button sits **under the notch**, or is pushed away from the edge on the side that has no notch.

⚠ **Read this before recording a pass.** The theme uses `max()` of both physical safe-area insets, which is correct in any direction — **but `master.twig`'s viewport meta has no `viewport-fit=cover`, so every `env(safe-area-inset-*)` is `0px` on iOS today.** Until that token is added (T-8.11's call, because it re-lays-out every page), this item can only confirm the button is not *worse*, not that the inset works. Record which of the two you tested.

**5.7.3 — Stacking with the back-to-top button.** Set both to the **same** side and scroll far enough for both to appear.

**Expect** — the back-to-top button sits **above** the WhatsApp button, both fully visible and both tappable.

**Fail when** they **overlap**, or the merchant is shown an error, or one refuses to appear — the ruling is that the back-to-top button raises itself, never that the choice is blocked.

### 5.8 — The panel reads as a shop owner's control panel

*Added 2026-08-12 after the owner found «بداية السطر» / «نهاية السطر» in a side setting — correct CSS, meaningless to a merchant.*

**Do** — open the theme customiser and read **every** setting top to bottom, out loud, as somebody who has never seen this code.

**Expect** — each one answers three questions from its label and description alone: *what does it change*, *what happens if I leave it*, and *what will I see*.

**Fail when**:

- a label uses a **word from the code**: a CSS keyword, a transliterated English term, an axis where a corner is meant. A test now blocks the specific ones already found — `Cover`, `Contain`, «سليدر», «بداية السطر», «نهاية السطر» — but it cannot invent the next one. **That is what this reading is for.**
- a **switch or dropdown has no description.** `sticky_add_to_cart` shipped with none, and «الوضع الداكن» was a label on a setting that only changes Salla's trust badges — unguessable from four words.
- a description **names another setting** and you cannot find that name in the panel. A test catches the exact-name case; a paraphrase will slip past it.
- you can read a setting and still not know **whether it is currently doing anything** — the three colour settings that ship empty are the ones to check hardest.
- a **direction setting** does not tell you the side mirrors itself between the Arabic and the English store.

**5.8.1 — The side settings, on a real store.** Set the WhatsApp button to «يمين الشاشة». Look at the Arabic storefront, then switch the store to English and look again.

**Expect** — right in Arabic, **left** in English. That is the behaviour working, not a bug: the side follows reading direction, which is what the label promises in its parenthetical.

**Fail when** it stays on the same physical side in both — the value has been hard-coded to a physical side somewhere and the mirroring is gone.

## 6. T-8.11 — cross-browser and device

> **⚠ The matrix below is a proposal, not an agreement.** The criterion says the target matrix is *agreed in advance*, and nobody has agreed one. **Read §6.1 and confirm or change it before testing** — testing against a matrix nobody signed produces a pass nobody can rely on.

### 6.1 — The proposed matrix

The criterion names four: Safari iOS, Chrome Android, Chrome desktop, Safari desktop. Expanded to something testable, and weighted for a Saudi storefront:

| # | Browser | Version | Device | Priority |
|---|---|---|---|---|
| a | **Safari iOS** | current and current − 1 | **a notched iPhone** (iPhone 14/15/16 or SE 3 for the no-notch control) | **critical** — the largest share of Saudi mobile commerce |
| b | **Chrome Android** | current | a mid-range Android, 6″ | **critical** |
| c | **Chrome desktop** | current | macOS or Windows, 1440×900 | critical |
| d | **Safari desktop** | current | macOS | critical |
| e | **Samsung Internet** | current | the same Android | **worth adding** — a large share of Android in the region, and it is a distinct engine build |
| f | **Firefox desktop** | current | any | secondary |
| g | **Edge desktop** | current | Windows | secondary — Chromium, so mostly covered by (c) |
| h | **iPad Safari** | current | any iPad | secondary — it lands on the tablet and laptop tiers at once |

**The project has no `browserslist`**, so the build uses Browserslist's defaults rather than a stated target. **That is itself worth a decision:** agreeing this matrix and writing it into `package.json` makes the build's output match the browsers actually being tested. Raise it with the matrix.

### 6.2 — ⚠ Safe-area insets — read this before testing a notched device

**A specific prediction, which this pass exists to confirm or refute.**

The theme uses `env(safe-area-inset-*)` in exactly two places — the WhatsApp FAB (`whatsapp-fab.scss`) and the sticky add-to-cart bar (`product-info.scss`). **But `master.twig`'s viewport meta is `width=device-width, initial-scale=1.0` with no `viewport-fit=cover`.** Without that token, iOS lays the page out *inside* the safe area and **every `env(safe-area-inset-*)` evaluates to `0px`.**

So one of two things is true, and only a notched iPhone can say which:

- **The browser is already handling it.** iOS letterboxes the content, the FAB and the sticky bar sit above the home indicator on their own, and the `env()` arithmetic is harmless dead code. **This is the likely outcome, and it is a pass.**
- **It is not.** Something sits under the home indicator or behind the notch.

**Do**, on a notched iPhone, in **both portrait and landscape**:

1. Load a product page with `sticky_add_to_cart` **on**. Look at the bottom bar against the home indicator.
2. Load Home with `whatsapp_fab_enabled` **on**. Look at the FAB.
3. Rotate to landscape and look at both again, and at the page's inline edges against the notch.
4. Open a bottom sheet (login, filters) and look at its bottom edge.
5. Scroll to the very bottom of the footer.

**Expect** — nothing is under the home indicator, nothing is behind the notch, and nothing is clipped at the inline edges in landscape.

**Fail when**:

- the **sticky add-to-cart bar sits under the home indicator**, so the button is hard to press. This is the highest-consequence failure on this list — it is the buy button
- the **FAB overlaps the home indicator**
- in **landscape**, content is clipped by the notch, or there are unexpected bars at the inline edges

> **If it fails, the fix is `viewport-fit=cover` on the viewport meta — and it is not a one-line change.** Adding it makes the page extend edge to edge on every iOS device, which changes the layout of every page, and it makes the `env()` values live for the first time. **It would also expose a latent mismatch that is dormant today:** `whatsapp-fab.scss` pairs the logical `inset-inline-end` with the physical `env(safe-area-inset-left)`. In Arabic those agree — inline-end *is* the left. **In an LTR store they do not**, so a landscape notch on the right would be compensated on the wrong side. Both changes together, or neither.

### 6.3 — Per-browser, the things that actually differ

Run flows a–f from §4.3 on each **critical** browser. Beyond that, check the features where engines genuinely diverge:

| Feature | Where | Watch for |
|---|---|---|
| **`<dialog>` + `showModal()`** | every sheet and dialog — T-2.10's foundation | the focus trap, `Esc`, focus return and inertness are **the browser's**, and the test harness deliberately never simulated them. **Safari was the last engine to ship `<dialog>`; this is the highest-risk item on the page** |
| **`imagesrcset` on `<link rel=preload>`** | the hero preload, `home/hero.twig` | Safari shipped this late. Where it is unsupported the browser falls back to the plain `href` — which T-8.02 deliberately made **one of the candidates**, so nothing breaks. ⚠ **The tell is a double fetch:** filter Network by the hero filename at a narrow viewport. Two requests means the preload took `href` (900w) while the `<img>` chose 450w. That is a wasted download, not a broken page, and it is browser-specific — record which engine |
| **`:has()`** | **five sites, two of them decide layout** — `body:has(.announcement-bar--top)` sets `--header-offset`, `body:not(:has(.hero))` gives the overlay header its own backing, and T-3.10's `.whatsapp-fab:has(.whatsapp-fab__label)` pads the pill | ⚠ **This is a hard dependency with no fallback anywhere in the theme.** In an engine without `:has()` the overlay header sits at offset 0 — on top of the announcement bar on Home — and the padding rule silently does nothing. Chrome 105+ / Safari 15.4+ / Firefox 121+, so it is safe on the proposed matrix and **not** safe on anything older. Check the header position on Home *with the bar on* as the single tell |
| **`::backdrop`** | dialog scrims | the scrim renders, and the page behind does not scroll |
| **`inert`** | page behind an open sheet | content behind is genuinely unreachable by Tab |
| **Logical properties** | everywhere — the theme uses them exclusively | `margin-inline`, `inset-inline`, `padding-block` all resolve correctly in both directions |
| **`aspect-ratio`** | every reserved media box | the box is reserved before the image lands. A fallback in an older Safari means CLS |
| **`background-attachment`** | `.full-banner-entry` | `safari-fixes.scss` already carries a Safari override here. Confirm it still applies |
| **`:focus-visible`** | the focus ring | keyboard focus shows a ring, mouse click does not |
| **`@supports` / `env()`** | §6.2 | as above |
| **Scroll containers** | the sheet body, `hide-scroll` strips | iOS momentum scrolling works, and a nested scroller does not swallow a swipe |
| **Arabic font rendering** | everywhere | letters join; no tofu boxes; no fallback face on one engine only |

### 6.4 — Device-specific behaviour

**Do**, on the real phones:

1. Rotate every key page **portrait → landscape → portrait**.
2. Open a text input and confirm the **on-screen keyboard** does not cover the field or the submit button — check the login sheet, the search modal and the coupon field.
3. **Pinch-zoom** a page and confirm nothing is trapped or unreachable.
4. Use the **browser's back gesture** after opening a sheet, after sorting, and after filtering.
5. Check **`100vh`-style full-height elements** against the collapsing iOS address bar.

**Fail when**:

- the keyboard **covers the input** being typed into
- the **back gesture leaves the page in a broken state** — a sheet closed but the scroll lock still on, or a filter applied with no way to undo it. T-4.18 added `popstate` handling for exactly this; confirm it works on a real device
- rotation **loses scroll position** or **breaks the layout** until reload
- an element sized to the viewport height **jumps when the address bar collapses**

### 6.5 — Recording

Per browser and per device: version, OS version, the flows completed, and a screenshot of anything that failed. **A "works fine" with no version recorded is not a test result** — the next Safari release makes it unverifiable.

## 7. Open decisions — three things waiting on the owner

These are not checklist items. They are **findings with no single right answer**, raised by Phase 8 and left undecided because each one is a product call rather than an engineering one. Nothing below blocks CI; all three are reported on every run so they cannot go quiet.

### D1 — The PDP carries two wishlist buttons ⚠ *raised by T-8.09*

Upstream ships **two** wishlist controls on the product page: one over the gallery image, one down in the tags-and-social row. **T-4.11 moved the first into the action row beside «أضف إلى السلة», where the artboard draws it, and left the second exactly where it was.** So today, at ≥640px, the page has two buttons for the same action on the same product — two tab stops for one job.

The leftover one carries three further defects: it is `hidden sm:inline-flex`, which is **B4's forbidden "absent on mobile, appears above"**; it hard-codes an English `aria-label="add to wishlist"` into an Arabic-first store, which **CLAUDE.md forbids outright**; and it has no `aria-pressed`, so its state is never announced — the exact **WCAG 1.4.1** defect T-4.01 fixed on the product card.

**Recommendation: delete it.** T-4.11's heart already serves every breakpoint, and the artboard draws one heart, not two.
**Why it was not done:** removing a visible control is the owner's call.
**Where it lives:** `src/views/pages/product/single.twig:414–428`, registered in `tests/t-8.09-breakpoints.test.mjs` and reported as `todo 1`.

### D2 — `squar_photo_bg_image_size` is unreachable ⚠ *raised by T-8.10*

`components/home/square-photos.twig` reads this setting and **the merchant can add that section** — the theme kept `component-square-photos` in `features`. But the theme's `twilight.json` **dropped the declaration** that upstream 1.365.0 carries, so the merchant can never change it. Nothing breaks; the call site falls back to `contain`.

**Two defensible fixes, pointing opposite ways:**
- **Restore the declaration**, if the section is meant to be available to merchants.
- **Drop `component-square-photos` from `features`**, if the section is not in the design and keeping the feature was the oversight.

**Why it was not done:** these are opposite answers and picking one is a product decision.
**Where it lives:** `scripts/check-settings.mjs` → `OPEN_FINDINGS`, printed on every run.

### D3 — The browser and device matrix has never been agreed ⚠ *raised by T-8.11*

The criterion says the matrix is *agreed in advance*. §6.1 proposes one and **the proposal is not an agreement**. Two things ride on it: which browsers §6 is actually run against, and whether a `browserslist` goes into `package.json` so the build targets the same set it is tested on.

**Why it was not done:** it is a scope decision, and it changes build output.

---

## 8. Carried from earlier tasks

Items earlier tasks explicitly deferred to a manual pass, collected so none is lost. Each is already placed in the section that carries it; this is the index.

| From | What | Where it is checked |
|---|---|---|
| **T-8.01** | Critical CSS is **not inlined** — `app.css` still blocks first paint at 58.8 KB, above its 50 KB target. The extraction was left for a measurement to justify | **§3.1** — and if LCP misses, this is the first thing to try |
| **T-8.02** | «Measured CLS at or near zero on every template» — that task proved the boxes are *reserved* and said plainly it could not prove nothing *moved* | **§3.2** |
| **T-8.04** | «Validates in Google Rich Results with zero errors» — needs a live URL in Google's validator | **§1**, and paste the product, Home and FAQ URLs |
| **T-8.05** | All four criteria: unique titles, canonicals on filtered and paginated URLs, OG images resolving, Arabic in previews | **§1** in full |
| **T-5.02** | Salla's checkout iframe — Saudi country code, whether the validation error is *announced*, whether Back preserves state, whether `autocomplete` is set. All four are cross-origin | **§2.8** |
| **T-5.03** | The OTP «إعادة الإرسال بعد ٦٠ ثانية» countdown — announced or only drawn? Are the failure states distinguishable by ear? | **§2.8** |
| **T-2.10 / harness** | `tests/harness/dom.mjs` deliberately never simulated the focus trap, `Esc`, focus return or inertness — **the four reasons the theme chose `<dialog>` have never been verified by anything** | **§2.1** dialog rows, and **§6.3** per engine |
| **T-2.03 / fonts** | `font-display` cannot be set from this theme; the fallback stack narrows the swap shift but does not remove it | **§3.2**, and it is a platform conversation if visible |
| **T-8.07** | Upstream's `add-product-toast` progress bar is JS-driven and no CSS clamp reaches it — a known reduced-motion failure if the setting is enabled | **§2.9** and **§5.1 row 12** |
| **DESIGN-SYSTEM F6** | The focus ring cannot cross into a `salla-*` shadow root — a system-level limit, not one component's | **§2.1**, on the five named components |
| **AC-9** | The accessibility of Salla's own sign-in flow is not this theme's to fix — the outcome of a failure there is a report to Salla | **§2.8** |
