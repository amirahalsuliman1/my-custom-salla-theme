/**
 * T-8.04, second pass — `ItemList` on the listing pages.
 *
 * ⚠ THIS IS THE ONE NODE IN THE THEME THAT IS BUILT IN THE BROWSER, AND THE
 * REASON IS NOT A PREFERENCE. Every other schema node is rendered by Twig from
 * data the template is handed. **The listing pages are handed no products at
 * all.** `pages/product/index.twig`'s variable table lists `page`, `category`,
 * `filters`, `sort_options` and `search_query` — and no collection. The grid is
 * `<salla-products-list source="…">`, which fetches over the API after load. So
 * a server-rendered `ItemList` on this page is not a thing that was skipped; it
 * is a thing there is no data for.
 *
 * WHY THAT IS NOT THE `BreadcrumbList` SITUATION, which T-8.04 answered by
 * emitting nothing. There the trail did not exist anywhere — not in Twig, not
 * in the DOM — so any trail would have been **invented**, and the task recorded
 * «a trail the template cannot see is not a trail it may guess». Here the
 * products are real, present and visible; they simply arrive a moment later.
 * Describing what is on the page is not guessing at what is not.
 *
 * ⚠ IT IS STILL A WEAKER GUARANTEE THAN THE OTHER FOUR NODES AND MUST BE READ
 * AS ONE. Google executes JavaScript before extracting structured data, so this
 * is a supported arrangement rather than a trick — but it is second-pass
 * rendering, it can be delayed, and no crawler is obliged to run scripts. The
 * validation step is on the manual checklist, and it is the only thing that can
 * confirm this node is seen at all.
 *
 * WHAT IT DESCRIBES IS THE DOM, NOT THE API RESPONSE. Reading the rendered
 * cards rather than re-fetching means the node cannot disagree with what the
 * visitor is looking at — after a filter, after a sort, after the second page
 * of an infinite scroll. A node describing products the page is not showing is
 * worse than no node.
 */

/** The card's title link — `product-card.js` renders exactly this shape. */
const CARD_LINK = '.product-card__title .card__link'
const NODE_ID = 'itemlist-schema'

/** Coalesce the bursts a grid re-render produces into one rebuild. */
let pending = null

const buildItems = () =>
  [...document.querySelectorAll(CARD_LINK)]
    .map((a, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: a.href,
      name: (a.textContent || '').trim(),
    }))
    // A card whose name or URL is missing is a half-rendered card, and a
    // ListItem with an empty name is the «empty claim» T-8.04 rules out
    // everywhere else in this theme's schema.
    .filter((item) => item.url && item.name)

const render = () => {
  pending = null

  const existing = document.getElementById(NODE_ID)
  const items = buildItems()

  // NO EMPTY LIST, EVER. A category with no results, or a grid that has not
  // arrived, must emit nothing rather than an `ItemList` claiming zero items —
  // the same rule as `sameAs` on the Organization node.
  if (!items.length) {
    existing?.remove()
    return
  }

  const node = existing || document.createElement('script')

  node.type = 'application/ld+json'
  node.id = NODE_ID
  // `textContent`, never `innerHTML`: product names are merchant data and this
  // is a script element. `JSON.stringify` also escapes the quote-in-a-name case
  // that `json_encode|raw` handles on the Twig side.
  node.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items,
  })

  if (!existing) {
    document.head.appendChild(node)
  }
}

const schedule = () => {
  if (pending) {
    return
  }

  // A microtask is not enough — the grid appends cards in a burst and we want
  // one node per burst, not one per card.
  pending = window.setTimeout(render, 200)
}

export default function initItemListSchema() {
  const list = document.querySelector('salla-products-list')

  if (!list) {
    return
  }

  // The component renders into its own subtree and re-renders on sort, filter
  // and pagination. Observing it covers all three without this file having to
  // know which events the platform dispatches for which.
  new MutationObserver(schedule).observe(list, { childList: true, subtree: true })
  schedule()
}
