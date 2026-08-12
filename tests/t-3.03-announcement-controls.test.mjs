/**
 * T-3.03, second pass — the five merchant controls on the announcement bar.
 *
 * Three of these settings do something a colour cannot, and each has a way of
 * going wrong that no screenshot would show:
 *
 *   · THE LINK can become a second tab stop, or a focusable control inside an
 *     `aria-hidden` subtree — the classic screen-reader trap, where the keyboard
 *     lands somewhere the accessibility tree says does not exist.
 *   · THE STICKY SWITCH can end up fighting the header for the top of the page.
 *     The owner ruled one band pins and never both; that ruling lives in a
 *     single `and not` in `header.twig` and is worth pinning down.
 *   · DISMISSAL can shift the page. The bar is above the fold with a fixed
 *     height, so hiding it from a deferred bundle paints it and then removes it.
 *     The decision has to be made in the head, before the element is parsed.
 *
 * WHAT THESE TESTS CANNOT DO. They read templates; they do not render. That the
 * bar actually pins, actually closes, and actually does not flash is
 * /docs/MANUAL-QA.md §5.6.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const MANIFEST = JSON.parse(fs.readFileSync('twilight.json', 'utf8'))
const BAR = fs.readFileSync('src/views/components/announcement-bar.twig', 'utf8')
const HEADER = fs.readFileSync('src/views/components/header/header.twig', 'utf8')
const MASTER = fs.readFileSync('src/views/layouts/master.twig', 'utf8')
const CSS = fs.readFileSync('src/assets/styles/04-components/announcement.scss', 'utf8')
const GLOBAL = fs.readFileSync('src/assets/styles/01-settings/global.scss', 'utf8')
const JS = fs.readFileSync('src/assets/js/partials/announcement.js', 'utf8')

const setting = (id) => MANIFEST.settings.find((s) => s.id === id)

describe('T-3.03 — the five settings are declared and defaulted to today’s bar', () => {
  const EXPECTED = [
    ['announcement_bg', 'color', '#FFFFFF'],
    ['announcement_text_color', 'color', '#646361'],
    ['announcement_url', 'url', ''],
    ['announcement_sticky', 'switch', false],
    ['announcement_dismissible', 'switch', false],
  ]

  for (const [id, format, value] of EXPECTED) {
    test(`${id} is a ${format} defaulting to ${JSON.stringify(value)}`, () => {
      const s = setting(id)
      assert.ok(s, `${id} is not declared`)
      assert.equal(s.format, format)
      assert.equal(s.value, value)
    })
  }

  test('the ink default is the secondary token, not the page ink', () => {
    // The bar is `text-sm font-bold text-secondary` in the artboard, not body
    // ink. A default of #1B1B1B would have darkened it on every store that
    // never opened the panel — the same class of error the header and footer
    // defaults had in T-8.13's proposal.
    assert.match(GLOBAL, /--announcement-text:\s*var\(--text-secondary\);/)
    assert.equal(setting('announcement_text_color').value, '#646361')
  })

  test('both colour tokens alias, so an untouched bar is unchanged', () => {
    assert.match(GLOBAL, /--announcement-bg:\s*var\(--surface-card\);/)
  })

  test('the two colours are emitted guarded, like the rest of the panel', () => {
    for (const [id, token] of [
      ['announcement_bg', '--announcement-bg'],
      ['announcement_text_color', '--announcement-text'],
    ]) {
      const line = `${token}: {{ theme.settings.get('${id}') }};`
      assert.ok(MASTER.includes(line), `${id} never reaches CSS`)
      const before = MASTER.slice(Math.max(0, MASTER.indexOf(line) - 120), MASTER.indexOf(line))
      assert.match(before, new RegExp(`\\{% if theme\\.settings\\.get\\('${id}'\\) %\\}\\s*$`))
    }
  })
})

describe('T-3.03 — the bar colour actually beats the card it sits in', () => {
  test('the surface rule is written as `.announcement-bar.card`', () => {
    // The bar carries both classes and `cards.scss` is imported AFTER
    // `announcement.scss`, so a single-class rule here loses on order and the
    // setting silently does nothing. Two classes win from any position.
    assert.match(
      CSS,
      /\.announcement-bar\.card\s*\{[\s\S]*?background-color:\s*var\(--announcement-bg\)/,
    )
  })

  test('the text rule no longer hard-codes the secondary utility', () => {
    // The window has to clear the rule AND the comment inside it — at 240 it
    // cut four characters short of the declaration and failed on a rule that
    // was correct, which is the least useful kind of red.
    const rule = CSS.slice(CSS.indexOf('.announcement-bar__text {'))
    assert.match(rule.slice(0, rule.indexOf('}')), /color:\s*var\(--announcement-text\)/)
    // Comments stripped first: the rule's own note explains that it *was*
    // `text-secondary`, and a raw scan reads that prose as the declaration it
    // is describing.
    const code = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    assert.ok(
      !/\.announcement-bar__text\s*\{[^}]*text-secondary/.test(code),
      'the utility would win over the token',
    )
  })
})

describe('T-3.03 — the link is one tab stop and never a hidden trap', () => {
  test('the anchor IS the visible text, not a stretched overlay', () => {
    // A stretched anchor needs an accessible name, and the only sensible name
    // is the announcement — so a screen reader reads the sentence twice.
    assert.match(BAR, /<a class="announcement-bar__text announcement-bar__link"/)
    assert.ok(!/class="[^"]*hero__link/.test(BAR), 'no stretched-link pattern here')
  })

  test('the marquee duplicate stays a plain aria-hidden span', () => {
    // A second anchor to the same URL is a second tab stop for nothing.
    assert.match(BAR, /<span class="announcement-bar__text" aria-hidden="true">/)
    const anchors = BAR.match(/<a class="announcement-bar__text/g) || []
    assert.equal(anchors.length, 1)
  })

  test('the silent bar’s link leaves the tab order', () => {
    // When both bars are on, the lower one is aria-hidden. A focusable element
    // inside an aria-hidden subtree is a control the keyboard can reach and the
    // screen reader will not announce.
    const anchor = BAR.slice(BAR.indexOf('announcement-bar__link'))
    assert.match(anchor.slice(0, 300), /\{% if announcement_silent %\}tabindex="-1"\{% endif %\}/)
  })

  test('the dismiss button in the silent bar leaves the tab order too', () => {
    const button = BAR.slice(BAR.indexOf('data-announcement-dismiss'))
    assert.match(button.slice(0, 300), /\{% if announcement_silent %\}tabindex="-1"\{% endif %\}/)
  })

  test('the link is only rendered when the merchant set a URL', () => {
    assert.match(BAR, /\{% if announcement_link %\}/)
    assert.match(BAR, /\{% else %\}\s*<span class="announcement-bar__text">/)
  })
})

describe('T-3.03 — one band pins, never both', () => {
  test('the header gives up its stickiness when the bar takes it', () => {
    // The owner's ruling of 2026-08-12, resolved once in Twig rather than as
    // two settings racing in CSS.
    assert.match(
      HEADER,
      /header_is_sticky\s*=\s*theme\.settings\.get\('header_is_sticky',\s*true\)\s*\n?\s*and not announcement_sticky/,
    )
  })

  test('the sticky class is only ever applied to the top bar', () => {
    // A pinned bar above the footer would pin nothing and cover content.
    assert.match(BAR, /announcement_sticky and announcement_position == 'top'/)
  })

  test('sticky uses position:sticky, so nothing below it moves when it pins', () => {
    assert.match(CSS, /\.announcement-bar--sticky\s*\{[\s\S]*?position:\s*sticky/)
    assert.ok(
      !/\.announcement-bar--sticky\s*\{[^}]*position:\s*fixed/.test(CSS),
      'fixed would take the bar out of flow and shift the page',
    )
  })

  test('pinning also puts the bar on every page, as its label promises', () => {
    assert.match(HEADER, /\{% if header_is_overlay or announcement_sticky %\}/)
  })

  test('the setting warns that the header loses its pin, and that this leaves the artboard', () => {
    const d = setting('announcement_sticky').description
    assert.match(d, /يفقد الرأس تثبيته/)
    assert.match(d, /كل صفحات المتجر/)
    assert.match(d, /التصميم يرسم الشريط في الصفحة الرئيسية فقط/)
  })
})

describe('T-3.03 — dismissal cannot shift the page', () => {
  test('the decision is made in the head, before the bar is parsed', () => {
    // If this ever moves to app.js the bar paints and then vanishes: a shift of
    // the full --announcement-height, on every load, for every visitor who has
    // closed it once.
    const head = MASTER.slice(0, MASTER.indexOf('</head>'))
    assert.match(head, /announcement-dismissed/)
    assert.match(head, /localStorage\.getItem/)
  })

  test('the storage key changes when the announcement text changes', () => {
    // A permanent flag would retire the feature the first time anyone used it:
    // the merchant writes a new offer and the people most likely to buy never
    // see it.
    const head = MASTER.slice(0, MASTER.indexOf('</head>'))
    assert.match(head, /announcement_text.*json_encode\|raw/)
    assert.match(head, /charCodeAt/)
  })

  test('no Twig filter outside the core is relied on for the hash', () => {
    // `md5` is not a core Twig filter and whether Salla adds one is
    // undocumented. A filter that does not exist is a template error on every
    // page of the store.
    assert.ok(!/\|\s*md5/.test(MASTER), 'master.twig uses a non-core Twig filter')
  })

  test('storage access is wrapped, because Safari private mode throws', () => {
    const head = MASTER.slice(0, MASTER.indexOf('</head>'))
    assert.match(head, /try\s*\{/)
    assert.match(JS, /try\s*\{[\s\S]*?setItem[\s\S]*?\}\s*catch/)
  })

  test('one selector hides the bar, and both paths use it', () => {
    assert.match(CSS, /\.announcement-dismissed \.announcement-bar\s*\{[\s\S]*?display:\s*none/)
    assert.match(JS, /documentElement\.classList\.add\('announcement-dismissed'\)/)
  })

  test('both bars close together, because they are one message', () => {
    // T-3.03 renders one announcement in two positions sharing a single text so
    // they cannot drift. Closing one and leaving the other scrolling above the
    // footer would read as a bug.
    assert.match(JS, /querySelectorAll\('\[data-announcement-dismiss\]'\)/)
  })

  test('focus is moved before the button is removed from the page', () => {
    // Otherwise the browser drops focus to <body> and a keyboard user is
    // silently returned to the top of the document.
    assert.match(JS, /Announcement\.restoreFocus\(\)/)
    assert.match(JS, /getElementById\('main-content'\)/)
  })
})
