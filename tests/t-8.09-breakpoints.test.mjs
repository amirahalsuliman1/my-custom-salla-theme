/**
 * T-8.09 — cross-breakpoint regression, in the part that is not a browser.
 *
 * THE CRITERION IS UNUSUALLY MACHINE-FRIENDLY FOR A VISUAL TASK, AND THAT IS
 * WORTH EXPLOITING. B4 grants derivation authority above 393pt under five rules,
 * and forbids three things **at every breakpoint**:
 *
 *   · adding an element or section absent from mobile
 *   · reordering content
 *   · hiding content that exists on mobile
 *
 * The first and the third have a signature in the markup. `hidden md:block` adds
 * something above the fold line that mobile never had; `lg:hidden` takes
 * something away that mobile has. **Neither is automatically a defect** — a
 * drawer trigger that disappears because the drawer became a column is exactly
 * what rule 3 asks for. But every one of them is a decision, and a decision that
 * nobody wrote down is indistinguishable from an accident.
 *
 * So this is a register, the same shape as T-8.07's. Every breakpoint-conditional
 * visibility in `src/views` is listed with what it does and why that is allowed.
 * A new one fails the suite until somebody says which of B4's rules it lives
 * under.
 *
 * WHAT THIS CANNOT DO. It cannot see reordering — B4's second prohibition — and
 * it cannot see a grid that gains a column it should not, a container that
 * stretches full-bleed, or anything else about how the page actually looks at
 * 768, 1024 and 1280. **That is `/docs/MANUAL-QA.md` §4 and it is the larger
 * half of T-8.09.**
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const VIEWS = path.join(ROOT, 'src/views')

/** Blank, never delete — see the same note in `scripts/check-a11y.mjs`. */
const blank = (match) => match.replace(/[^\n]/g, ' ')

function templates(dir = VIEWS) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return templates(full)
    return entry.name.endsWith('.twig') ? [full] : []
  })
}

/**
 * THE REGISTER. Keyed `path:line-ish` is too brittle — a line above it moves and
 * the whole register rots — so entries are keyed by file and by the class string
 * that produces the behaviour, which is what actually has to be justified.
 */
const REGISTER = [
  {
    file: 'pages/product/index.twig',
    match: 'filters-trigger lg:hidden',
    verdict: 'allowed',
    why:
      'B4 rule 3, and the cleanest possible case of it. The trigger opens the filters ' +
      'drawer; at from-laptop `filters.scss` turns that drawer into a static column beside ' +
      'the grid. Nothing is hidden that exists on mobile — the FILTERS are present at both ' +
      'tiers, and only the affordance for opening a drawer goes away when there is no drawer.',
  },
  {
    file: 'pages/product/single.twig',
    match: 'btn--wishlist animated hidden sm:inline-flex',
    verdict: 'open-defect',
    why:
      '⚠ FOUR DEFECTS IN ONE ELEMENT, AND IT IS REDUNDANT. Upstream ships TWO wishlist ' +
      'buttons on the PDP — one over the gallery (upstream line 120) and one in the tags ' +
      'and social row (upstream line 274). T-4.11 moved the FIRST one down into the action ' +
      'row beside «أضف إلى السلة», where the artboard draws it, and left the second where ' +
      'it was. So at ≥640px the page now carries two controls for the same action on the ' +
      'same product id: two tab stops, one job. Below 640px this one is hidden, which is ' +
      'B4’s forbidden «adding an element absent from mobile». It also hard-codes an English ' +
      '`aria-label="add to wishlist"` into an Arabic-first store, which CLAUDE.md forbids ' +
      'outright, and it carries no `aria-pressed`, so its state is never announced — the ' +
      'exact WCAG 1.4.1 defect T-4.01 fixed on the product card. ' +
      'THE FIX IS TO DELETE IT: T-4.11’s heart already serves every breakpoint. ' +
      'Not done here, because removing a visible control is the owner’s call, not a ' +
      'test-suite’s. Raised 2026-08-12.',
  },
]

/**
 * Upstream templates this theme has never adopted. Same policy as
 * `check-images.mjs` and `check-a11y.mjs`: listed rather than fixed, because
 * editing one means shadowing it and buying `/docs/OVERRIDES.md` a row.
 * Verified against the `1.365.0` tag at run time rather than trusted.
 */
const UNADOPTED = [
  'pages/testimonials.twig',
  'pages/blog/index.twig',
  'components/home/featured-products-style1.twig',
]

/** Every breakpoint-conditional visibility in the templates, with provenance. */
function findConditionalVisibility() {
  const found = []

  for (const file of templates()) {
    const name = path.relative(VIEWS, file).split(path.sep).join('/')
    const source = fs
      .readFileSync(file, 'utf8')
      .replace(/\{#[\s\S]*?#\}/g, blank)
      .replace(/<svg[\s\S]*?<\/svg>/gi, blank)

    source.split('\n').forEach((line, index) => {
      const hidesOnMobile =
        /(?:^|[\s"'])hidden(?=[\s"'])/.test(line) &&
        /\b(?:sm|md|lg|xl|2xl):(?:block|flex|grid|inline-flex|inline-block|contents)\b/.test(line)
      const hidesAbove = /\b(?:sm|md|lg|xl|2xl):hidden\b/.test(line)

      if (hidesOnMobile || hidesAbove) {
        found.push({
          file: name,
          line: index + 1,
          kind: hidesOnMobile
            ? 'absent on mobile, appears above'
            : 'present on mobile, hidden above',
          text: line.trim(),
        })
      }
    })
  }

  return found
}

const FOUND = findConditionalVisibility()

describe('T-8.09 — B4’s "no additions, no hiding", as a register', () => {
  test('every breakpoint-conditional visibility is either registered or in an unadopted file', () => {
    const unaccounted = FOUND.filter(
      (hit) =>
        !UNADOPTED.includes(hit.file) &&
        !REGISTER.some((entry) => entry.file === hit.file && hit.text.includes(entry.match)),
    ).map((hit) => `${hit.file}:${hit.line} — ${hit.kind} — ${hit.text.slice(0, 90)}`)

    assert.deepEqual(
      unaccounted,
      [],
      'A breakpoint-conditional visibility with no entry in REGISTER.\n' +
        'B4 forbids adding an element absent from mobile and hiding one that exists there, ' +
        'AT EVERY BREAKPOINT. This is not automatically a defect — a drawer trigger that goes ' +
        'away because the drawer became a column is rule 3 working correctly — but it is ' +
        'always a decision. Add an entry saying which rule it lives under, or remove the ' +
        'class.',
    )
  })

  test('the register has no stale entries', () => {
    const stale = REGISTER.filter(
      (entry) => !FOUND.some((hit) => hit.file === entry.file && hit.text.includes(entry.match)),
    ).map((entry) => `${entry.file} — ${entry.match}`)

    assert.deepEqual(stale, [], 'The register justifies something that is no longer in the markup.')
  })

  test('the unadopted list is true — every file on it is byte-identical to upstream 1.365.0', () => {
    const drifted = UNADOPTED.filter((name) => {
      const full = path.join(VIEWS, name)
      const upstream = execFileSync('git', ['show', `1.365.0:src/views/${name}`], {
        cwd: ROOT,
        encoding: 'utf8',
      })
      return upstream !== fs.readFileSync(full, 'utf8')
    })

    assert.deepEqual(
      drifted,
      [],
      'A file excused as "upstream, never adopted" has been edited. Once the theme touches ' +
        'it, it is shadowed, it owes /docs/OVERRIDES.md a row, and its defects become ours. ' +
        'Move it into REGISTER with a real justification.',
    )
  })
})

describe('T-8.09 — open defects, tracked so they cannot go quiet', () => {
  for (const entry of REGISTER.filter((e) => e.verdict === 'open-defect')) {
    /**
     * `todo`, not `fail`. The suite reports it on every run — `todo 1` rather
     * than the `todo 0` this repository has always shown — so it is visible in
     * CI without blocking unrelated work. It stops being a todo when the owner
     * rules on it, at which point this becomes a passing assertion or the entry
     * disappears with the markup.
     */
    test(`${entry.file} — ${entry.match}`, { todo: 'awaiting the owner’s ruling' }, () => {
      assert.fail(entry.why)
    })
  }
})
