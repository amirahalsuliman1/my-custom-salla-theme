/**
 * T-8.01, second half — the above-fold extract.
 *
 * THE CLAIM THIS FILE DEFENDS. `critical.css` is a **subset of `app.css`, rule
 * for rule and byte for byte**, chosen so that the announcement bar, the header
 * and the hero paint from the HTML document alone. Two ways that can go wrong,
 * and they are not symmetric:
 *
 *   · Keep too little, and the store's first frame is wrong — an unstyled hero
 *     under an unstyled header. That is the failure worth tests.
 *   · Keep too much, and the page is a few kilobytes heavier. Recoverable.
 *
 * So the extractor is written to over-include, and the tests here are shaped to
 * catch the two ways over-inclusion silently became *everything* — the
 * `:where()` comma and the bare custom element — plus the subset property that
 * makes the whole cascade argument in `master.twig` true.
 *
 * WHAT THESE TESTS CANNOT DO. There is no browser here, so nothing below proves
 * the first frame looks right. They prove the extract is a faithful, ordered
 * subset with the above-fold rules in it. The rendering claim is §1 of
 * /docs/MANUAL-QA.md and belongs to a person with a phone.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const SCRIPT = 'scripts/extract-critical.mjs'
const MASTER = 'src/views/layouts/master.twig'
const PARTIAL = 'src/views/components/critical-css.twig'
const CRITICAL = 'public/critical.css'
const APP = 'public/app.css'

/**
 * Run the extractor over a synthetic sheet, using the REAL above-fold surface.
 *
 * The surface is deliberately not stubbed. These fixtures use the theme's own
 * class names — `.hero__scrim` is above the fold, `.product-card` is not — so
 * the tests exercise the same list the build uses, and a template dropping out
 * of `SURFACE` shows up here rather than only in production.
 */
function run(css) {
  const dir = fs.mkdtempSync('/tmp/critical-css-test-')
  try {
    fs.writeFileSync(`${dir}/app.css`, css)
    execFileSync(process.execPath, [SCRIPT, dir, `${dir}/partial.twig`], { encoding: 'utf8' })
    return {
      css: fs.readFileSync(`${dir}/critical.css`, 'utf8'),
      partial: fs.readFileSync(`${dir}/partial.twig`, 'utf8'),
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

describe('T-8.01 — what the fold keeps', () => {
  test('the header, the bar and the hero are all kept — the owner’s three', () => {
    const { css } = run(
      '.announcement-bar__track{animation:none}' +
        '.store-header--overlay{position:absolute}' +
        '.hero__scrim{opacity:.4}',
    )
    assert.match(css, /\.announcement-bar__track/)
    assert.match(css, /\.store-header--overlay/)
    assert.match(css, /\.hero__scrim/)
  })

  test('a class only JavaScript ever adds is kept', () => {
    // `store-header--stuck` is written by `sticky-header.js` and by no template.
    // It is the reason the SURFACE list carries a `.js` file at all, and if that
    // entry is ever dropped the header's scrolled state loses its styling in the
    // first frame after a scroll.
    assert.match(run('.store-header--stuck{background:#fff}').css, /--stuck/)
  })

  test('a section far below the fold is dropped', () => {
    const { css } = run('.product-card__title{font-size:1rem}.store-footer__inner{padding:2rem}')
    assert.doesNotMatch(css, /product-card__title/)
    assert.doesNotMatch(css, /store-footer__inner/)
  })

  test('a descendant of an above-fold box is judged on ALL its parts', () => {
    // `.hero` is above the fold; a product card inside it is not, and there is
    // no product card in the hero. `every`, not `some` — the quantifier is the
    // whole difference between an extract and a copy of the stylesheet.
    assert.doesNotMatch(run('.hero .product-card__title{color:red}').css, /product-card/)
  })

  test('a grouped selector rides in on one above-fold member', () => {
    // Preflight is written this way — `blockquote,dd,dl,figure,h1,…{margin:0}`.
    // Judging the group as a whole would drop the theme's entire element layer
    // over a `<table>` nobody put above the fold.
    assert.match(run('table,.hero__quote{margin:0}').css, /hero__quote/)
  })
})

describe('T-8.01 — the two regressions that quietly kept the whole sheet', () => {
  test('a `:where()` list is split on top-level commas only', () => {
    // `postcss-preset-env` compiles every logical property in this theme into
    // this shape. Splitting the prelude on bare commas cut it into a fragment
    // with no class in it — which read as a base rule and was kept. Almost
    // every rule in the theme is compiled this way, so the bug kept the footer,
    // the story cards and the product page: 29.3 KB where 19.7 KB was correct.
    const sel = '.store-footer__inner:where([dir=rtl],[dir=rtl] *){padding-right:1rem}'
    assert.doesNotMatch(run(sel).css, /store-footer__inner/)
  })

  test('a `:where()` list on an above-fold class still survives it', () => {
    const sel = '.hero__quote:where([dir=rtl],[dir=rtl] *){text-align:right}'
    assert.match(run(sel).css, /hero__quote/)
  })

  test('a bare custom element outside the fold is dropped', () => {
    // `lite-youtube{…}` has no class in it, and the first version of the
    // element test read «no class means base rule, keep it». The video-carousel
    // façade rode in on a rule meant for `html` and `body`, at 22 KB.
    assert.doesNotMatch(run('lite-youtube{display:block}').css, /lite-youtube/)
  })

  test('the elements the fold really has are still kept bare', () => {
    const { css } = run('html{height:100%}body{margin:0}img{display:block}')
    assert.match(css, /html\{/)
    assert.match(css, /body\{/)
    assert.match(css, /img\{/)
  })

  test('a selector naming no element at all is always kept', () => {
    // `*,::before,::after{box-sizing:border-box}`. Deciding which resets the
    // fold depends on is not knowable from a template, and a missing
    // `box-sizing` moves every box on the page.
    assert.match(run('*,:after,:before{box-sizing:border-box}').css, /box-sizing/)
  })

  test('a CSS comment between rules cannot drop the rule after it', () => {
    // `app.css` carries `/*! __THEME_CSS_STARTS_HERE__ */` mid-file, and a
    // prelude reaches the matcher with whatever preceded it. Left unstripped,
    // its words parse as element names and the rule after the marker vanishes —
    // an under-inclusion, which is the direction that breaks a page.
    assert.match(run('/*! __THEME_CSS_STARTS_HERE__ */.hero__quote{color:red}').css, /hero__quote/)
  })
})

describe('T-8.01 — at-rules', () => {
  test('every breakpoint is kept, not just the small one', () => {
    const { css } = run(
      '@media (min-width:640px){.hero__quote{font-size:2rem}}' +
        '@media (min-width:1280px){.hero__quote{font-size:3rem}}',
    )
    assert.match(css, /min-width:640px/)
    assert.match(css, /min-width:1280px/)
  })

  test('a media block keeps only its above-fold members', () => {
    const { css } = run('@media (min-width:640px){.hero__quote{a:b}.product-card{c:d}}')
    assert.match(css, /hero__quote/)
    assert.doesNotMatch(css, /product-card/)
  })

  test('`@media print` is dropped — it cannot affect a paint on screen', () => {
    assert.doesNotMatch(run('@media print{.hero__quote{display:none}}').css, /@media print/)
  })

  test('the keyframes a kept rule names come with it', () => {
    // The announcement bar is a marquee and it is the first thing on the page.
    // Keyframes left behind do not error; the bar simply sits still.
    const { css } = run(
      '.announcement-bar__track{animation:announcement-scroll 30s linear infinite}' +
        '@keyframes announcement-scroll{to{transform:translateX(50%)}}',
    )
    assert.match(css, /@keyframes announcement-scroll/)
  })

  test('keyframes nothing kept names are left behind', () => {
    assert.doesNotMatch(run('@keyframes spin{to{transform:rotate(1turn)}}').css, /@keyframes spin/)
  })

  test('`@font-face` is kept whole rather than filtered', () => {
    const { css } = run('@font-face{font-family:x;src:url(y.woff2)}')
    assert.match(css, /@font-face/)
  })
})

describe('T-8.01 — the extract is a faithful subset of the sheet it came from', () => {
  // The generated banner is the one thing in the file that is not copied from
  // `app.css`, so it comes off before the comparison rather than being special
  // -cased inside it.
  const critical = fs.readFileSync(CRITICAL, 'utf8').replace(/^\/\*![\s\S]*?\*\/\n/, '')
  const app = fs.readFileSync(APP, 'utf8')

  test('every kept declaration block appears verbatim in app.css', () => {
    // The subset property is what makes the cascade argument in `master.twig`
    // true: `app.css` loads last and re-declares all of this in its original
    // order, so the final computed styles are exactly what one sheet produced.
    // If the extractor ever rewrote a rule rather than copying it, the two
    // would disagree and only a browser would ever notice.
    const blocks = critical.match(/[^{}]+\{[^{}]*\}/g) || []
    assert.ok(blocks.length > 100, `expected a real sheet, got ${blocks.length} blocks`)
    const missing = blocks.map((b) => b.trim()).filter((b) => !app.includes(b))
    assert.deepEqual(
      missing.slice(0, 3),
      [],
      `${missing.length} blocks are not verbatim in app.css`,
    )
  })

  test('it is a fraction of the sheet, not most of it', () => {
    // A guard against the failure mode both regressions above had: an extractor
    // that keeps everything still passes every «is it there?» test in this file.
    assert.ok(
      critical.length < app.length * 0.15,
      `critical is ${((critical.length / app.length) * 100).toFixed(1)}% of app.css`,
    )
  })
})

describe('T-8.01 — the generated partial and the document', () => {
  test('the committed partial matches the committed stylesheet', () => {
    // These two are written by the same run. If they disagree, someone edited
    // one by hand or committed a stale build — and the store would paint from
    // the stale one.
    const partial = fs.readFileSync(PARTIAL, 'utf8')
    const css = fs.readFileSync(CRITICAL, 'utf8').replace(/^\/\*![\s\S]*?\*\/\n/, '')
    assert.ok(partial.includes(css), 'critical-css.twig does not carry public/critical.css')
  })

  test('the CSS is wrapped in `{% verbatim %}`', () => {
    // Twig parses the body of every template it loads. A stylesheet is a
    // document full of braces; the day a minifier emits two adjacently, an
    // unescaped partial becomes a syntax error on every page of the store.
    const partial = fs.readFileSync(PARTIAL, 'utf8')
    assert.match(partial, /<style id="critical-css">\{% verbatim %\}/)
    assert.match(partial, /\{% endverbatim %\}<\/style>/)
  })

  test('the partial says it is generated', () => {
    assert.match(fs.readFileSync(PARTIAL, 'utf8'), /DO NOT EDIT THIS FILE/)
  })

  test('master.twig inlines the critical block BEFORE it links app.css', () => {
    // The cascade argument, asserted rather than left to a comment. Move the
    // inline block below `app.css` and every kept rule starts beating the rules
    // written to override it — a bug no byte count and no page load would show
    // until the one component that depends on the override.
    const master = fs.readFileSync(MASTER, 'utf8')
    const inline = master.indexOf("include 'components.critical-css'")
    const sheet = master.indexOf("'app.css' | asset")
    assert.notEqual(inline, -1, 'master.twig does not include the critical partial')
    assert.ok(inline < sheet, 'the inline block must come before the app.css link')
  })

  test('app.css is fetched without blocking, and has a noscript fallback', () => {
    const master = fs.readFileSync(MASTER, 'utf8')
    assert.match(
      master,
      /<link rel="stylesheet" href="\{\{ 'app\.css' \| asset \}\}" media="print" onload=/,
      'app.css still blocks first paint',
    )
    // With no JavaScript the `onload` never fires and `media="print"` never
    // lifts. Without this line the store would render with 4.9 KB of header CSS
    // and nothing else.
    assert.match(master, /<noscript><link rel="stylesheet" href="\{\{ 'app\.css' \| asset \}\}">/)
  })
})

describe('T-8.01 — the surface is guarded', () => {
  test('a renamed above-fold template fails the build instead of shrinking the fold', () => {
    const script = fs.readFileSync(SCRIPT, 'utf8')
    assert.match(script, /the above-fold surface names files that do not exist/)
  })

  test('every file the surface names exists', () => {
    const script = fs.readFileSync(SCRIPT, 'utf8')
    const block = script.slice(script.indexOf('const SURFACE = ['))
    // Entries only, not every quoted run — the list is interleaved with prose
    // saying why each file is in it, and «the header's burger» is an apostrophe
    // that a naive quote match reads as the start of a path.
    const files = [...block.slice(0, block.indexOf('\n]')).matchAll(/^\s*'([^']+)',$/gm)].map(
      (m) => m[1],
    )
    assert.ok(files.length >= 6, `expected the full surface, found ${files.length}`)
    for (const f of files) assert.ok(fs.existsSync(f), `${f} is named in SURFACE but is missing`)
  })
})
