/**
 * The manual checklist cannot silently fall behind the theme.
 *
 * WHY THIS EXISTS. `/docs/MANUAL-QA.md` §5.1 opened with «Today: 26 settings,
 * all wired» for a month after the manifest had 44. Nobody was wrong when they
 * wrote it; it simply stopped being true, and a checklist that states a stale
 * total is worse than one that states none — it reads as coverage. The eighteen
 * settings added by T-8.13, T-3.03 and T-3.10 were in fact checked, in their own
 * sections, but only by their Arabic labels: **«is every setting tested?» could
 * not be answered by searching the file**, which is the only way anyone would
 * ever ask it.
 *
 * WHAT THIS ENFORCES, AND WHAT IT DELIBERATELY DOES NOT. It requires every
 * declared setting to be **named** somewhere in the checklist, and the stated
 * total to match the manifest. It cannot judge whether the check written there
 * is a good one — that is the reviewer's job, and §5.8 is the pass for reading
 * the panel as a whole. A test that tried to grade prose would fail on wording
 * and pass on emptiness.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const MANIFEST = JSON.parse(fs.readFileSync('twilight.json', 'utf8'))
const QA = fs.readFileSync('docs/MANUAL-QA.md', 'utf8')

/** Decorative entries carry no behaviour and nothing to toggle. */
const DECORATIVE = new Set(['title', 'line', 'description'])
const SETTINGS = MANIFEST.settings.filter((s) => !DECORATIVE.has(s.format))

describe('every declared setting is named in the manual checklist', () => {
  test('none is missing', () => {
    const missing = SETTINGS.map((s) => s.id).filter((id) => !QA.includes(id))
    assert.deepEqual(
      missing,
      [],
      'these settings are declared but appear nowhere in docs/MANUAL-QA.md — ' +
        'add a row to §5.1, or an entry to its index pointing at the section that covers them',
    )
  })

  test('the total stated in §5.1 matches the manifest', () => {
    // The specific sentence that went stale. Pinning the number rather than the
    // wording, so the prose can be rewritten without breaking this.
    const stated = QA.match(/\*\*(\d+) settings, 6 components/)
    assert.ok(stated, '§5.1 no longer states a settings total')
    assert.equal(Number(stated[1]), SETTINGS.length)
  })

  test('the index names a section for each setting checked outside §5.1', () => {
    // A pointer to nowhere is the failure this replaces: an id present in the
    // file only because it appears in an index row that names no section.
    const rows = [...QA.matchAll(/^\| `([a-z_]+)` \| .+ \| (§[\d.]+ — .+?) \|$/gm)]
    assert.ok(rows.length >= 18, `expected the index, found ${rows.length} rows`)
    for (const [, id, section] of rows) {
      assert.ok(
        SETTINGS.some((s) => s.id === id),
        `the index names ${id}, which is not a declared setting`,
      )
      const number = section.match(/§([\d.]+)/)[1]
      assert.ok(
        new RegExp(`^### ${number.replace('.', '\\.')} —`, 'm').test(QA),
        `the index points at §${number}, which has no heading in this file`,
      )
    }
  })
})

describe('the checklist keeps naming the things that need a device', () => {
  /**
   * One entry per capability this repository does not have. If a section is
   * ever deleted, the criterion it carried silently becomes «done» — which is
   * the whole reason this file exists rather than a note in a commit message.
   */
  const REQUIRED = [
    ['§1.6', 'the ItemList node — the only one built in the browser'],
    ['§2.1', 'the keyboard pass'],
    ['§3.4', 'the inlined critical CSS'],
    ['§3.6', 'the responsive candidates'],
    ['§5.5', 'the colour panel with hostile values'],
    ['§5.6', "the announcement bar's controls"],
    ['§5.7', "the WhatsApp button's controls"],
    ['§5.8', 'reading the panel as a merchant'],
    ['§5.10', "the back-to-top button's controls"],
    ['§6.2', 'safe-area insets'],
    ['§6.3', 'per-browser features'],
  ]

  for (const [section, what] of REQUIRED) {
    test(`${section} still exists — ${what}`, () => {
      const number = section.slice(1)
      assert.match(QA, new RegExp(`^### ${number.replace('.', '\\.')} —`, 'm'))
    })
  }

  test('nothing in the checklist claims to have been executed', () => {
    // The file's own status line. If this ever flips, it must flip because a
    // person ran the checks — never because a task wanted to look finished.
    assert.match(QA, /\*\*Status:\*\* open — nothing in this file has been executed/)
  })
})
