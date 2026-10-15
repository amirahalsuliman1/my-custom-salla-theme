/**
 * The content pages against their artboards — the 2026-10-15 audit pass.
 *
 * `FAQ Page.pdf`, `FAQ Page - Close Dropdown.pdf`, `How to Order & Warrant
 * Page.pdf`, `Return & Exchange.pdf`, `Shipping Policy Page.pdf` and their five
 * Desktop SVG twins were re-rendered and read against `page-single.twig`,
 * `home/faq.twig`, `prose.scss` and `accordion.scss`. Each block below pins one
 * confirmed difference by reading the source: a phone rule must stay outside
 * `from-laptop`, and a desktop rule must live inside it and nowhere else.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')

const PROSE = read('src/assets/styles/04-components/prose.scss')
const ACCORDION = read('src/assets/styles/04-components/accordion.scss')
const INFO = read('src/assets/styles/04-components/product-info.scss')
const PAGE = read('src/views/pages/page-single.twig')
const FAQ = read('src/views/components/home/faq.twig')
const OVERRIDES = read('docs/OVERRIDES.md')

/** Comments blanked, so prose about a rule is never matched as the rule. */
const css = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '')
const twig = (source) => source.replace(/\{#[\s\S]*?#\}/g, '')

/** The body of the first `{…}` that opens at or after `from`, braces matched. */
function blockAt(source, from) {
  const open = source.indexOf('{', from)
  let depth = 0
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i)
  }
  throw new Error('unbalanced braces')
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** A top-level rule's body, by its exact selector line. */
function rule(source, selector) {
  const at = css(source).search(new RegExp(`^${escape(selector)} \\{`, 'm'))
  assert.notEqual(at, -1, `there is a top-level \`${selector}\` rule`)
  return blockAt(css(source), at)
}

/** Every `@include from-laptop { … }` body in the file. */
function laptop(source) {
  const clean = css(source)
  const blocks = []
  let at = clean.indexOf('@include from-laptop')
  while (at !== -1) {
    blocks.push(blockAt(clean, at))
    at = clean.indexOf('@include from-laptop', at + 1)
  }
  return blocks.join('\n')
}

/** The stylesheet with every from-laptop block removed: what the phone gets. */
function phone(source) {
  let out = css(source)
  let at = out.indexOf('@include from-laptop')
  while (at !== -1) {
    const body = blockAt(out, at)
    out = out.slice(0, at) + out.slice(out.indexOf(body, at) + body.length + 1)
    at = out.indexOf('@include from-laptop')
  }
  return out
}

describe('#23 · the card text is one ink, --text-secondary, as all ten artboards fill it', () => {
  test('no rule in either stylesheet paints the card with the page ink any more', () => {
    assert.doesNotMatch(css(PROSE), /--main-text-color/)
    assert.doesNotMatch(css(ACCORDION), /--main-text-color/)
  })

  for (const selector of [
    '.static-page__title',
    '.content-entry',
    '.content-entry h1',
    '.content-entry a',
  ]) {
    test(`${selector} reads --text-secondary`, () => {
      assert.match(rule(PROSE, selector), /color: var\(--text-secondary\);/)
    })
  }

  test('the policy headings h2/h3/h4 read --text-secondary', () => {
    const at = css(PROSE).indexOf('.content-entry h2,\n.content-entry h3,\n.content-entry h4 {')
    assert.notEqual(at, -1)
    assert.match(blockAt(css(PROSE), at), /color: var\(--text-secondary\);/)
  })

  test('a link stays marked by its underline now that it shares the body ink', () => {
    assert.match(rule(PROSE, '.content-entry a'), /@apply underline;/)
  })

  for (const selector of ['.faq__title', '.faq__number', '.faq__text', '.faq__intro', '.faq__answer-inner']) {
    test(`${selector} reads --text-secondary`, () => {
      assert.match(rule(ACCORDION, selector), /color: var\(--text-secondary\);/)
    })
  }
})

describe('#24 · the FAQ card is the policy pages\' 64rem box from 1024px', () => {
  test('the cap lives in from-laptop, scoped to the CMS page, and centres the panel', () => {
    assert.match(
      laptop(ACCORDION),
      /\.s-information-page \.faq__panel \{\s*margin-inline: auto;\s*max-inline-size: 64rem;\s*\}/,
    )
  })

  test('it is the same 64rem the policy card takes', () => {
    assert.match(laptop(PROSE), /\.static-page \{\s*@apply max-w-none;\s*max-inline-size: 64rem;/)
  })

  test('the phone is untouched: no width rule on the panel outside from-laptop', () => {
    assert.doesNotMatch(phone(ACCORDION), /max-inline-size/)
    assert.match(rule(ACCORDION, '.faq__panel'), /^\s*@apply p-6;\s*$/)
  })

  test('the markup still carries the classes the rule keys on', () => {
    assert.match(twig(PAGE), /class="s-blocks-wrapper s-information-page/)
    assert.match(twig(FAQ), /class="account-panel faq__panel"/)
  })
})

describe('#99 · a hairline under every FAQ entry, the last included', () => {
  test('the accordion no longer drops the last row\'s rule or padding', () => {
    assert.doesNotMatch(css(ACCORDION), /\.faq__item:last-child/)
    assert.match(rule(ACCORDION, '.faq__item'), /@apply pb-4;\s*border-block-end: 1px solid var\(--border-interactive\);/)
  })

  test('the PDP notes draw the rule under their last block too (pdp audit #142)', () => {
    assert.match(INFO, /\.product-notes \.faq__item:last-child/)
  })

  test('the header comment says what the artboards draw', () => {
    assert.doesNotMatch(ACCORDION, /none after the last/)
    assert.match(ACCORDION, /the last included/)
  })
})

describe('#100 · the breadcrumb: ancestor regular, current page bold', () => {
  test('the trail takes --text-secondary, never the drawn 2.4:1 grey', () => {
    assert.match(rule(PROSE, '.static-page__breadcrumb .s-breadcrumb-wrapper'), /color: var\(--text-secondary\);/)
    assert.doesNotMatch(css(PROSE), /#a8a7a5/i)
  })

  test('the current page — the ol\'s last item, its anchor stripped by Salla — is bold', () => {
    assert.match(
      rule(PROSE, '.static-page__breadcrumb .s-breadcrumb-wrapper > .s-breadcrumb-item:last-child'),
      /@apply font-bold;/,
    )
  })

  test('the chevron follows the trail ink instead of its path\'s default black', () => {
    assert.match(rule(PROSE, '.static-page__breadcrumb .s-breadcrumb-arrow svg'), /fill: currentColor;/)
  })

  test('the rule rests on what the installed component really renders', () => {
    const src = read('node_modules/@salla.sa/twilight-components/dist/components/salla-breadcrumb.js')
    assert.match(src, /"s-breadcrumb-wrapper": true/)
    assert.match(src, /<li class="s-breadcrumb-item"><a href=\{url\}>\{title\}<\/a><\/li>/)
    assert.match(src, /h\("li", \{ class: "s-breadcrumb-arrow" \}/)
    // The last item's anchor is replaced by its text, so styling `a` alone
    // would never reach the current page.
    assert.match(src, /lastEl && lastEl\.replaceWith\(lastEl\.firstChild\)/)
  })
})

describe('#101 · heading and question sizes', () => {
  test('the policy title is 20 on the phone and 36 from 1024px', () => {
    assert.match(rule(PROSE, '.static-page__title'), /@apply mb-6 text-xl font-bold;/)
    assert.match(laptop(PROSE), /\.static-page__title \{\s*@apply text-4xl;\s*\}/)
    assert.doesNotMatch(phone(PROSE), /text-4xl/)
  })

  test('the FAQ title takes the same sizes on the CMS page, and stays a section heading on Home', () => {
    assert.match(rule(ACCORDION, '.s-information-page .faq__title'), /@apply text-xl;/)
    assert.match(laptop(ACCORDION), /\.s-information-page \.faq__title \{\s*@apply text-4xl;\s*\}/)
    assert.match(rule(ACCORDION, '.faq__title'), /@apply text-lg font-bold;/)
    assert.doesNotMatch(phone(ACCORDION), /text-4xl/)
  })

  test('a question is a step above its answer: 16 against 14', () => {
    assert.match(rule(ACCORDION, '.faq__number'), /@apply flex-none text-base font-bold;/)
    assert.match(rule(ACCORDION, '.faq__text'), /@apply flex-1 text-base font-bold;/)
    assert.match(rule(ACCORDION, '.faq__answer-inner'), /@apply pt-3 text-sm leading-relaxed;/)
  })
})

describe('#102 · a customised CMS page has an h1', () => {
  const markup = twig(PAGE)
  const customised = markup.slice(markup.indexOf("{% if page.type == 'customised' %}"), markup.indexOf('{% else %}'))
  const plain = markup.slice(markup.indexOf('{% else %}'), markup.indexOf('{% endif %}', markup.indexOf('{% else %}')))

  test('the customised branch emits a visually hidden h1 from page.title, before the hook', () => {
    const h1 = customised.indexOf('<h1 class="sr-only">{{ page.title }}</h1>')
    assert.notEqual(h1, -1)
    assert.ok(h1 < customised.indexOf("{% hook 'information_page.information_page' %}"))
  })

  test('each branch has exactly one h1', () => {
    assert.equal(customised.match(/<h1\b/g).length, 1)
    assert.equal(plain.match(/<h1\b/g).length, 1)
  })

  test('the FAQ section keeps its h2, so Home does not get a second h1', () => {
    assert.match(twig(FAQ), /<h2 class="faq__title"/)
    assert.doesNotMatch(twig(FAQ), /<h1\b/)
  })

  test('the shadowed file\'s OVERRIDES row records the heading', () => {
    const row = OVERRIDES.split('\n').find((line) => line.startsWith('| `src/views/pages/page-single.twig`'))
    assert.match(row, /visually hidden `<h1>` from `page\.title`/)
  })
})
