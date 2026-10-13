/**
 * T-8.01 — the stylesheet split.
 *
 * The whole change rests on one claim: **every rule that used to ship still
 * ships, just in one of two files instead of one.** A splitter that quietly
 * dropped rules would look like a triumph on the budget report and un-style a
 * live store, which is the failure this file exists to make impossible.
 *
 * The sharpest test here is the last one: a theme file that deliberately
 * overrides an `s-*` class must stay in `app.css`. Those overrides live *below*
 * the marker, and moving one would send it to a sheet that loads **before** the
 * rule it is meant to beat — a cascade bug that no byte count would reveal.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const SCRIPT = 'scripts/split-css.mjs'
const APP_SCSS = 'src/assets/styles/app.scss'
const MARKER = '__THEME_CSS_STARTS_HERE__'

/** Count `{` at depth 0 — a cheap stand-in for "number of rules". */
const declarationsOf = (css) => (css.match(/\{/g) || []).length

/**
 * Run the splitter against a synthetic sheet in a scratch directory.
 *
 * The real `public/` is never touched: the script takes its output directory as
 * an argument precisely so these tests cannot leave the working tree holding a
 * stylesheet built out of fixtures.
 */
function runSplit(css) {
  const dir = fs.mkdtempSync('/tmp/split-css-test-')
  try {
    fs.writeFileSync(`${dir}/app.css`, css)
    execFileSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' })
    return {
      app: fs.readFileSync(`${dir}/app.css`, 'utf8'),
      salla: fs.readFileSync(`${dir}/salla-components.css`, 'utf8'),
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

describe('T-8.01 — the marker', () => {
  test('app.scss carries the marker the splitter depends on', () => {
    assert.match(fs.readFileSync(APP_SCSS, 'utf8'), new RegExp(MARKER))
  })

  test('the marker is a `/*!` comment, so minification keeps it', () => {
    const scss = fs.readFileSync(APP_SCSS, 'utf8')
    assert.match(scss, new RegExp(`/\\*!\\s*${MARKER}`))
  })

  test('a build with no marker fails loudly instead of shipping one sheet', () => {
    const dir = fs.mkdtempSync('/tmp/split-css-test-')
    try {
      fs.writeFileSync(`${dir}/app.css`, '.a{color:red}')
      assert.throws(
        () => execFileSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8', stdio: 'pipe' }),
        /marker/i,
      )
      // and it wrote nothing rather than half a split
      assert.equal(fs.existsSync(`${dir}/salla-components.css`), false)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('T-8.01 — what moves and what does not', () => {
  const CSS = [
    '.s-cart-summary-total{color:red}',
    '.s-button-text{font-weight:700}',
    'salla-slider{display:block}',
    '.s-slider-thumbs .swiper-slide{opacity:.5}',
    '.card{border:1px solid}',
    '@media (min-width:768px){.s-cart-summary-total{color:blue}.card{border:0}}',
    '@keyframes spin{from{transform:rotate(0)}}',
    `/*! ${MARKER} */`,
    '.s-user-menu-item{color:green}',
    '.stories__grid{display:grid}',
  ].join('')

  const out = runSplit(CSS)

  test('platform-only rules above the marker move out', () => {
    assert.match(out.salla, /\.s-cart-summary-total\{color:red\}/)
    assert.match(out.salla, /\.s-button-text/)
    assert.doesNotMatch(out.app, /\.s-cart-summary-total\{color:red\}/)
  })

  test('a `salla-*` element selector moves', () => {
    assert.match(out.salla, /salla-slider/)
  })

  test('a grouped selector mixing a theme class stays put', () => {
    // `.swiper-slide` is not the platform's, so the whole rule stays rather
    // than being torn in half.
    assert.match(out.app, /\.s-slider-thumbs \.swiper-slide/)
    assert.doesNotMatch(out.salla, /swiper-slide/)
  })

  test("the theme's own rules stay", () => {
    assert.match(out.app, /\.card\{border:1px solid\}/)
  })

  test('a @media block is split, not skipped, and neither side is emitted empty', () => {
    assert.match(out.salla, /@media \(min-width:768px\)\{\.s-cart-summary-total\{color:blue\}\}/)
    assert.match(out.app, /@media \(min-width:768px\)\{\.card\{border:0\}\}/)
  })

  test('@keyframes is never opened — a partial copy is broken, not smaller', () => {
    assert.match(out.app, /@keyframes spin/)
    assert.doesNotMatch(out.salla, /@keyframes/)
  })

  test('nothing is lost: every rule still ships in one of the two sheets', () => {
    const before = declarationsOf(CSS)
    const after = declarationsOf(out.app) + declarationsOf(out.salla)
    // The split re-emits one `@media` prelude on each side, so the count grows
    // by exactly the number of at-rules that were opened — never shrinks.
    assert.ok(after >= before, `rules lost: ${before} before, ${after} after`)
  })

  test('⚠ a theme override of an `s-*` class BELOW the marker never moves', () => {
    // `floating-menu.scss` styles `s-user-menu-*` on purpose. Moving it would
    // put the override in the sheet that loads first, and it would stop
    // winning. This is the bug a byte count cannot see.
    assert.match(out.app, /\.s-user-menu-item\{color:green\}/)
    assert.doesNotMatch(out.salla, /\.s-user-menu-item/)
  })
})

describe('T-8.01 — the shipped build', () => {
  test('master.twig links the deferred sheet BEFORE app.css', () => {
    const master = fs.readFileSync('src/views/layouts/master.twig', 'utf8')
    const salla = master.indexOf("'salla-components.css' | asset")
    const app = master.indexOf("'app.css' | asset")
    assert.ok(salla > -1, 'the deferred sheet is not linked at all')
    assert.ok(
      salla < app,
      'cascade order broken — the deferred sheet must come first in the document',
    )
  })

  test('it is loaded non-blocking, with a noscript fallback that is not', () => {
    const master = fs.readFileSync('src/views/layouts/master.twig', 'utf8')
    assert.match(master, /salla-components\.css[^>]*media="print"[^>]*onload=/)
    assert.match(
      master,
      /<noscript><link rel="stylesheet" href="\{\{ 'salla-components\.css' \| asset \}\}"><\/noscript>/,
    )
  })
})

describe('T-8.01 — the splitter cannot eat its own output', () => {
  /**
   * Found on 2026-08-12 by running the script by hand after a build.
   *
   * It is not idempotent and cannot be: its input is the unsplit sheet and the
   * first run consumes it. A second run finds no platform rules, writes a
   * valid and almost-empty `salla-components.css` over the real one, reports
   * «0 platform rules moved» and exits 0. Nothing downstream notices —
   * `check-budgets.mjs` sees a sheet far under its ceiling and passes — and the
   * failure surfaces on a live store as the platform's cart and filters
   * rendering unstyled.
   */
  test('a second run refuses rather than writing an empty sheet', () => {
    const dir = fs.mkdtempSync('/tmp/split-css-test-')
    try {
      fs.writeFileSync(`${dir}/app.css`, `.s-button{color:red}/*! ${MARKER} */.theme{color:blue}`)
      execFileSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' })
      const firstRun = fs.readFileSync(`${dir}/salla-components.css`, 'utf8')
      assert.match(firstRun, /s-button/, 'the first run should have moved the rule')

      assert.throws(
        () => execFileSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' }),
        /Command failed/,
        'the second run should exit non-zero',
      )

      assert.equal(
        fs.readFileSync(`${dir}/salla-components.css`, 'utf8'),
        firstRun,
        'the second run overwrote the deferred sheet',
      )
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  test('a first run into a fresh directory still works', () => {
    // The guard keys on «no rules moved AND the target already exists», so it
    // must not fire on a legitimate build whose sheet happens to have no
    // platform rules at all.
    const dir = fs.mkdtempSync('/tmp/split-css-test-')
    try {
      fs.writeFileSync(`${dir}/app.css`, `/*! ${MARKER} */.theme{color:blue}`)
      execFileSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' })
      assert.ok(fs.existsSync(`${dir}/salla-components.css`))
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('T-8.01 — the build banner cannot be read as a budget breach', () => {
  /**
   * The banner used to print a line labelled «before» carrying a bare
   * `app.css` and a gzip figure above the 100 KB ceiling. That number is the
   * unsplit intermediate — a file that lives for milliseconds and is never
   * served — but beside a filename that IS shipped it reads as a breach, and
   * was reported as one.
   */
  const banner = (() => {
    const dir = fs.mkdtempSync('/tmp/split-css-test-')
    try {
      fs.writeFileSync(`${dir}/app.css`, `.s-x{color:red}/*! ${MARKER} */.theme{color:blue}`)
      return execFileSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' })
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })()

  test('the intermediate says it is never shipped', () => {
    assert.match(banner, /intermediate\s+app\.css \(unsplit\)/)
    assert.match(banner, /never shipped/)
  })

  test('there is no bare «before» line to mistake for the shipped file', () => {
    assert.ok(!/^\s*before\s/m.test(banner), 'the ambiguous label is back')
  })

  test('the shipped rows are marked, and the banner names the real authority', () => {
    assert.equal((banner.match(/^\s*SHIPPED\s/gm) || []).length, 2)
    assert.match(banner, /check-budgets\.mjs/)
  })
})
