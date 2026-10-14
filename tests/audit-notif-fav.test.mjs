/**
 * Audit «notif-fav» — the notifications page and the desktop favourites rows
 * against `Notifications Page.pdf`, `Desktop Notifications Page - Type A.svg`
 * and `Desktop Favorites Page - Floating Menu.svg` (2026-10-15).
 *
 * The notifications rows are Salla's own light-DOM markup restyled from
 * outside, so most of what is pinned here is a selector that has to OUTRANK a
 * platform rule — the specificity is the fix, not a detail of it.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const NOTIFY = fs.readFileSync('src/assets/styles/04-components/notifications.scss', 'utf8')
const CARD = fs.readFileSync('src/assets/styles/04-components/product-card.scss', 'utf8')
const TWIG = fs.readFileSync('src/views/pages/customer/notifications.twig', 'utf8')
const CHOICE = fs.readFileSync('src/views/components/ui/choice.twig', 'utf8')

/** The body of the first rule whose selector text is exactly `selector`. */
function rule(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*')
  const match = css.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`))
  assert.ok(match, `rule not found: ${selector}`)
  return match[1]
}

/** Everything inside the top-level `@include from-laptop { … }` that contains `marker`. */
function laptopBlock(css, marker) {
  let from = 0
  while ((from = css.indexOf('\n@include from-laptop {', from)) !== -1) {
    let depth = 0
    let end = css.indexOf('{', from)
    for (let i = end; i < css.length; i++) {
      if (css[i] === '{') depth++
      if (css[i] === '}' && --depth === 0) {
        end = i
        break
      }
    }
    const block = css.slice(from, end + 1)
    if (block.includes(marker)) return block
    from = end
  }
  assert.fail(`no from-laptop block contains ${marker}`)
}

describe('notifications · the list is one surface (#5)', () => {
  test('rows lose Salla\'s white fill, radius and hover shadow above every platform rule', () => {
    // (0,3,0) and (0,4,0): above `.s-notifications-item` (0,1,0), its hover
    // rules (0,2,0) and dark mode's `html.dark :is(.s-notifications-item)` (0,2,1).
    const body = rule(
      NOTIFY,
      '.notifications .s-notifications-container .s-notifications-item,\n.notifications .s-notifications-container .s-notifications-item:hover',
    )
    assert.match(body, /background-color:\s*transparent;/)
    assert.match(body, /border-radius:\s*0;/)
    assert.match(body, /box-shadow:\s*none;/)
  })

  test('Salla\'s space-y margin between items is replaced at (0,4,0), not left to win', () => {
    const body = rule(NOTIFY, '.notifications .s-notifications-container > :not([hidden]) ~ :not([hidden])')
    assert.match(body, /margin-block:\s*1rem 0;/)
  })

  test('Salla\'s space-x margin on the row\'s children is cleared, so unread tiles line up', () => {
    const body = rule(NOTIFY, '.notifications .s-notifications-item > :not([hidden]) ~ :not([hidden])')
    assert.match(body, /margin-inline:\s*0;/)
  })
})

describe('notifications · the tile\'s glyph (#43, #44)', () => {
  const glyph = () => rule(NOTIFY, '.notifications .s-notifications-item-icon > .s-notifications-item-icon')

  test('the inner <i> drops the platform\'s 3.5rem ringed circle', () => {
    const body = glyph()
    assert.match(body, /inline-size:\s*auto;/)
    assert.match(body, /block-size:\s*auto;/)
    assert.match(body, /border:\s*0;/)
    assert.match(body, /border-radius:\s*0;/)
    assert.match(body, /background:\s*none;/)
  })

  test('an unread bell takes the tile\'s grey, not Salla\'s red', () => {
    assert.match(glyph(), /color:\s*inherit;/)
  })

  test('the tile itself is still the account tile, on the span only', () => {
    assert.match(rule(NOTIFY, '.notifications .s-notifications-item > .s-notifications-item-icon'), /@extend \.account-tile;/)
  })
})

describe('notifications · the row\'s arrangement (#45, #123)', () => {
  test('at 393pt the row is one grid and the body spans it, under the tile and the date', () => {
    const row = rule(NOTIFY, '.notifications .s-notifications-item')
    assert.match(row, /@apply grid items-center/)
    assert.match(row, /grid-template-columns:\s*auto minmax\(0, 1fr\) auto;/)

    assert.match(
      rule(NOTIFY, '.notifications .s-notifications-item-content,\n.notifications .s-notifications-item-content-leading'),
      /display:\s*contents;/,
    )
    assert.match(rule(NOTIFY, '.notifications .s-notifications-item h4'), /grid-area:\s*1 \/ 2;/)
    assert.match(rule(NOTIFY, '.notifications .s-notifications-item-content-trailing'), /grid-area:\s*1 \/ 3;/)

    const body = rule(NOTIFY, '.notifications .s-notifications-item p')
    assert.match(body, /grid-row:\s*2;/)
    assert.match(body, /grid-column:\s*1 \/ -1;/)
    assert.match(body, /mb-0/, 'Salla\'s 0.75rem under the body is cancelled')
  })

  test('the <a> is never flattened — only the two role-less wrappers are', () => {
    assert.doesNotMatch(rule(NOTIFY, '.notifications .s-notifications-item'), /display:\s*contents/)
  })

  test('from 1024px the body sits beside the tile and the tile and date centre on both lines', () => {
    const block = laptopBlock(NOTIFY, '.s-notifications-item-content-trailing')
    assert.match(
      block,
      /\.notifications \.s-notifications-item > \.s-notifications-item-icon,\s*\.notifications \.s-notifications-item-content-trailing \{\s*grid-row:\s*1 \/ span 2;/,
    )
    assert.match(block, /\.notifications \.s-notifications-item p \{\s*grid-column:\s*2;/)
  })

  test('the old two-column content grid with its baseline alignment is gone', () => {
    assert.doesNotMatch(NOTIFY, /align-items:\s*baseline/)
  })
})

describe('notifications · the hairline (#122)', () => {
  test('the inset is the list\'s padding: 16 at 393pt, 24 from 1024px', () => {
    const body = rule(NOTIFY, '.notifications .s-notifications-container')
    assert.match(body, /@apply px-4 py-6;/)
    assert.match(body, /@include from-laptop \{\s*@apply px-6;/)
  })

  test('every row, the last included, closes with the rule, and rows carry no inline padding', () => {
    const row = rule(NOTIFY, '.notifications .s-notifications-item')
    assert.match(row, /border-block-end:\s*1px solid var\(--border-subtle\);/)
    assert.match(row, /padding-inline:\s*0;/)
    assert.doesNotMatch(NOTIFY, /salla-notification-item \+ salla-notification-item/)
  })
})

describe('notifications · the promotional card\'s subtitle (#46)', () => {
  test('the switch carries the platform\'s own description as its hint', () => {
    assert.match(TWIG, /hint:\s*trans\('pages\.profile\.promotional_messages_description'\)/)
    assert.match(CHOICE, /aria-describedby="\{\{ id \}\}-hint"/)
  })

  test('the subtitle shows from 1024px only, in the body\'s size', () => {
    const body = rule(NOTIFY, '.notify-prefs .choice__hint')
    assert.match(body, /@apply hidden text-sm;/)
    assert.match(body, /@include from-laptop \{\s*@apply block;/)
  })
})

describe('favourites · the desktop row\'s text column (#124)', () => {
  const block = () => laptopBlock(CARD, 'custom-wishlist-card .product-card__body')

  test('the colour swatches move under the price line', () => {
    assert.match(block(), /custom-wishlist-card \.product-card__swatches \{\s*order:\s*1;/)
    assert.doesNotMatch(CARD, /product-card__price-line \{[^}]*order:\s*-1/)
  })

  test('the row draws no rating', () => {
    assert.match(block(), /custom-wishlist-card \.product-card__rating \{\s*@apply hidden;/)
  })

  test('mobile is untouched: neither rule exists outside the 1024px block', () => {
    const outside = CARD.replace(block(), '')
    assert.doesNotMatch(outside, /custom-wishlist-card \.product-card__(swatches|rating)/)
  })
})
