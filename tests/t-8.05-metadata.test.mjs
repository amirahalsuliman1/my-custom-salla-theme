/**
 * T-8.05 — metadata and canonicals.
 *
 * THE THEME EMITS NONE OF IT, AND THAT IS THE CORRECT ANSWER RATHER THAN AN
 * OMISSION. Upstream `theme-raed` at 1.365.0 — a published theme running on
 * thousands of live stores — contains no `<title>`, no `rel="canonical"`, no
 * `og:*` and no meta description in any file. If the theme owned those tags,
 * every Raed store on the internet would have a blank title. Salla injects them
 * through the head hooks, which its own documentation calls «responsible for
 * adding the SEO-related meta data to the page header section».
 *
 * So this task has no markup to add, and two failure modes to lock out. Both are
 * silent on a live store and neither is visible in a template diff:
 *
 *   1. A HOOK GOES MISSING. `master.twig` is a technique-A shadow of upstream.
 *      Drop `{% hook head %}` in an unrelated edit and every page loses its
 *      title, description, canonical and Open Graph tags at once — with nothing
 *      to see locally, because nothing local was ever emitting them.
 *
 *   2. A TEMPLATE ADDS ITS OWN. A second `<title>` or a second canonical is
 *      worse than none: Google picks one and it is not necessarily the platform's.
 *      A future task «adding SEO tags» in good faith is exactly how that lands.
 *
 * What no test here can do is prove the platform's tags are *right* — unique per
 * template, correct on filtered and paginated URLs, with a resolving OG image.
 * That needs a rendered storefront and a preview debugger, and it is on the
 * manual checklist in `/docs/MANUAL-QA.md` rather than claimed here.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const VIEWS = new URL('../src/views/', import.meta.url).pathname
const MASTER = path.join(VIEWS, 'layouts/master.twig')

/** Every `.twig` under `src/views`, path-relative for readable failures. */
function templates(dir = VIEWS) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return templates(full)
    return entry.name.endsWith('.twig') ? [full] : []
  })
}

const ALL = templates()

/**
 * `<svg>` blocks are removed before scanning. SVG has a `<title>` element of its
 * own — it is the accessible name of the graphic, it is required, and
 * `custom-testimonials.twig` uses one correctly. Matching it as a document title
 * would make this suite fail on the one file doing the right thing.
 */
const stripSvg = (source) => source.replace(/<svg[\s\S]*?<\/svg>/gi, '')

const read = (file) => stripSvg(fs.readFileSync(file, 'utf8'))

const rel = (file) => path.relative(VIEWS, file)

describe('T-8.05 — the head hooks, which are what actually carry the metadata', () => {
  const master = fs.readFileSync(MASTER, 'utf8')

  // Salla's documented three. Order matters to nothing here except that they are
  // all present; what matters is that none of them is ever quietly dropped.
  for (const hook of ["{% hook 'head:start' %}", '{% hook head %}', "{% hook 'head:end' %}"]) {
    test(`master.twig still carries ${hook}`, () => {
      assert.ok(
        master.includes(hook),
        `${hook} is gone from master.twig. The platform injects the title, description, ` +
          'canonical and Open Graph tags through these hooks — removing one deletes ' +
          'them from every page, and nothing local will look wrong.',
      )
    })
  }

  test('all three sit inside <head>, where injected tags are legal', () => {
    const open = master.indexOf('<head>')
    const close = master.indexOf('</head>')

    assert.ok(open !== -1 && close > open, 'master.twig has no <head> element')

    for (const hook of ["hook 'head:start'", 'hook head', "hook 'head:end'"]) {
      const at = master.indexOf(hook)
      assert.ok(at > open && at < close, `${hook} is outside <head>`)
    }
  })

  test('they run start → head → end, so injected order is the platform’s', () => {
    // Written as two comparisons on purpose. `a < b < c` is legal JavaScript and
    // means `(a < b) < c`, which compares a boolean against an index and is true
    // for any input — an assertion that cannot fail.
    const start = master.indexOf("hook 'head:start'")
    const main = master.indexOf('hook head')
    const end = master.indexOf("hook 'head:end'")

    assert.ok(start < main, `head:start (${start}) must precede head (${main})`)
    assert.ok(main < end, `head (${main}) must precede head:end (${end})`)
  })
})

describe('T-8.05 — the theme emits no metadata of its own, and must not start', () => {
  /**
   * Each entry is a tag the platform owns. A theme-side copy is a duplicate, and
   * a duplicate canonical or title is resolved by the crawler rather than by us.
   */
  const FORBIDDEN = [
    { what: 'a document <title>', pattern: /<title[\s>]/i },
    { what: 'a canonical link', pattern: /rel\s*=\s*["']?canonical/i },
    { what: 'a meta description', pattern: /<meta[^>]+name\s*=\s*["']description["']/i },
    { what: 'an Open Graph tag', pattern: /["']og:(title|description|image|url|type|site_name)/i },
    { what: 'a Twitter Card tag', pattern: /["']twitter:(card|title|description|image|site)/i },
    { what: 'a robots directive', pattern: /<meta[^>]+name\s*=\s*["']robots["']/i },
  ]

  for (const { what, pattern } of FORBIDDEN) {
    test(`no template emits ${what}`, () => {
      const offenders = ALL.filter((file) => pattern.test(read(file))).map(rel)

      assert.deepEqual(
        offenders,
        [],
        `${offenders.join(', ')} emits ${what}. Salla already injects it through the head ` +
          'hooks; a second one competes with the platform’s rather than adding to it.',
      )
    })
  }

  test('there is exactly one document shell, so there is one place to inject into', () => {
    const shells = ALL.filter((file) => /<html[\s>]/i.test(read(file))).map(rel)

    assert.deepEqual(
      shells,
      ['layouts/master.twig'],
      'A second <html> means a second <head> — and a page rendered through it would ' +
        'receive no injected metadata at all. `customer.twig` extends master rather ' +
        'than repeating it, and any new layout must do the same.',
    )
  })
})

describe('T-8.05 — the URLs the theme invents client-side', () => {
  /**
   * THREE OF THE THEME'S OWN SCRIPTS PUSH A URL, AND THIS IS THE ONE PART OF
   * «canonicals correct on filtered URLs» THAT LIVES IN THIS REPOSITORY.
   *
   * Sorting a grid rewrites the address bar without a navigation, so the head
   * keeps whatever the platform emitted for the *un-sorted* URL. That is the
   * right outcome — a sort order is not a separate document — but it only holds
   * while these stay query parameters. A script that pushed a new *path* would
   * mint a URL with no server-rendered metadata behind it at all.
   */
  const JS = new URL('../src/assets/js/', import.meta.url).pathname

  function scripts(dir = JS) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) return scripts(full)
      return entry.name.endsWith('.js') ? [full] : []
    })
  }

  test('every pushState/replaceState writes a query parameter, never a path', () => {
    const bad = []

    for (const file of scripts()) {
      const source = fs.readFileSync(file, 'utf8')
      // Comments discuss `pushState` at length in these files; only calls count.
      const calls = source.match(/history\.(?:push|replace)State\([^;]*?\)/gs) ?? []

      for (const call of calls) {
        if (!call.includes('addParamToUrl')) {
          bad.push(`${path.relative(JS, file)}: ${call.replace(/\s+/g, ' ')}`)
        }
      }
    }

    assert.deepEqual(
      bad,
      [],
      'A history entry was written from something other than `salla.helpers.addParamToUrl`. ' +
        'If it changes the path rather than the query, the resulting URL has no metadata ' +
        'behind it — the platform never rendered that address.',
    )
  })
})
