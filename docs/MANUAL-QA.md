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
| a | **Browse and open a product** | `/` | Tab through the header, the announcement bar, hero, each home section, the footer, and the WhatsApp button. Open a product from a card |
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

- ⚠ **Critical CSS is not inlined.** T-8.01 split the sheet in two and deferred the platform's component CSS, but the above-fold rules were never extracted, because choosing them needs a rendered page. `app.css` at 58.8 KB still blocks first paint. **If LCP misses here, this is the first thing to try**, and the extraction step is the work T-8.01 deliberately left for a measurement to justify.
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

### 3.4 — Recording the result

For each of Home, PDP and Cart, record: the **median of five** for each metric, the **LCP element** Lighthouse named, and any shift you *saw* even where the number passed. Keep the Lighthouse JSON — it is the only durable evidence, and a number in a chat message is not a measurement.

**Then re-check `/docs/BUDGETS.md` §2 against what you found.** If a budget is wrong, changing it is the owner's decision and is recorded as such. **Raising a number to make a red result green is how budgets die** — that sentence is already in BUDGETS.md and applies here.

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

## 5. T-8.11 — cross-browser and device

*To be written by T-8.11.*

## 6. Carried from earlier tasks

*Collected here at the end of the phase.*
