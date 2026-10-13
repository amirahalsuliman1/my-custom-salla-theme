/**
 * The customiser reads as a shop owner's control panel, not as a stylesheet.
 *
 * WHY THIS IS A TEST AND NOT A STYLE NOTE. Every label in `twilight.json` was
 * written by someone holding the code in their head, and the failure mode is
 * silent: «بداية السطر» is exactly right in CSS and means nothing to a merchant
 * choosing a corner for a button. Nobody files a bug; the setting just gets set
 * wrong, or left alone.
 *
 * THE DIRECTION SETTINGS ARE THE CASE THAT PROVOKED IT. The behaviour is
 * correct and must not change — a side follows reading direction, so it flips
 * between an Arabic store and an English one, and that is why the CSS is
 * logical. **The merchant does not need to know any of that.** They need to
 * know which corner they are picking and that it mirrors itself. So the value
 * stays `start`/`end` and only the words change.
 *
 * WHAT THIS FILE DOES NOT CLAIM. It cannot tell whether a sentence reads well;
 * it catches the specific vocabulary that has already gone wrong once, and the
 * consistency rules that keep two settings from describing each other by names
 * that no longer exist. Reading the panel for tone is /docs/MANUAL-QA.md §5.1.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const MANIFEST = JSON.parse(fs.readFileSync('twilight.json', 'utf8'))
const SETTINGS = MANIFEST.settings.filter((s) => s.format !== 'title' && s.format !== 'line')

/** Every label and description a merchant can read, including component fields. */
const allText = () => {
  const out = []
  const walk = (items) => {
    for (const s of items || []) {
      if (s.label) out.push([s.id || '(option)', 'label', s.label])
      if (s.description) out.push([s.id || '(option)', 'description', s.description])
      for (const o of s.options || []) if (o.label) out.push([s.id, 'option', o.label])
      walk(s.fields)
    }
  }
  walk(MANIFEST.settings)
  for (const c of MANIFEST.components || []) walk(c.fields)
  return out
}

describe('a direction setting names a corner, not an axis', () => {
  /** Every setting that picks a side. New ones must join this list. */
  const SIDE_SETTINGS = SETTINGS.filter((s) => /_side$/.test(s.id || ''))

  test('there is at least one, so this file cannot pass by finding nothing', () => {
    assert.ok(SIDE_SETTINGS.length >= 1)
  })

  for (const s of SIDE_SETTINGS) {
    test(`${s.id} keeps logical VALUES and plain-language labels`, () => {
      // The values are the contract with the stylesheet and must not be
      // translated into `right`/`left` — that would hard-code a physical side
      // and break the mirroring this whole design depends on.
      const values = s.options.map((o) => o.value).sort()
      assert.deepEqual(values, ['end', 'start'])

      const byValue = Object.fromEntries(s.options.map((o) => [o.value, o.label]))
      // `start` is the reading-order start: the RIGHT of an Arabic screen.
      assert.match(byValue.start, /يمين الشاشة/)
      assert.match(byValue.start, /يسار في المتجر الإنجليزي/)
      assert.match(byValue.end, /يسار الشاشة/)
      assert.match(byValue.end, /يمين في المتجر الإنجليزي/)
    })

    test(`${s.id} explains that the side mirrors itself`, () => {
      assert.match(s.description || '', /تنعكس تلقائيًّا حسب لغة المتجر/)
    })

    test(`${s.id} no longer says «بداية السطر» or «نهاية السطر» anywhere`, () => {
      const text = JSON.stringify(s)
      assert.ok(!text.includes('بداية السطر'), 'a typesetting term survived in the label')
      assert.ok(!text.includes('نهاية السطر'), 'a typesetting term survived in the label')
    })
  }
})

describe('no setting speaks CSS, or English, at the merchant', () => {
  /**
   * Vocabulary that has already appeared in this file and should not again.
   * Each entry is a term with a plain-Arabic replacement, not a blanket ban on
   * English — `#RRGGBB` is a format the merchant genuinely has to type, and
   * `WhatsApp` is a product name.
   */
  const JARGON = [
    ['Cover', 'say what happens to the image, not the CSS keyword'],
    ['Contain', 'say what happens to the image, not the CSS keyword'],
    ['سليدر', 'transliterated English — «معرض الصور»'],
    ['بداية السطر', 'typesetting term — name the corner'],
    ['نهاية السطر', 'typesetting term — name the corner'],
    ['inline-start', 'a CSS property has no place in a customiser'],
    ['inline-end', 'a CSS property has no place in a customiser'],
    ['srcset', 'an implementation detail'],
    ['CSS', 'an implementation detail'],
  ]

  for (const [term, why] of JARGON) {
    test(`no label or description contains «${term}»`, () => {
      const hits = allText().filter(([, , text]) => text.includes(term))
      assert.deepEqual(
        hits.map(([id, kind]) => `${id}.${kind}`),
        [],
        `${why}`,
      )
    })
  }

  test('every switch and dropdown explains what it does', () => {
    // A bare on/off with no description is the other half of the same problem:
    // «الوضع الداكن» was a real label here, on a setting that only changes the
    // platform's trust badges. The merchant could not have guessed that.
    const bare = SETTINGS.filter(
      (s) => ['switch', 'dropdown-list'].includes(s.format) && !(s.description || '').trim(),
    )
    assert.deepEqual(
      bare.map((s) => s.id),
      [],
      'these toggles say nothing about their effect',
    )
  })
})

describe('settings that mention each other use names that exist', () => {
  test('every «…» quoted setting name resolves to a real label', () => {
    // `color_footer_background` pointed at «تذييل داكن» — a label that had been
    // rewritten. A cross-reference to a name nobody can find in the panel is
    // worse than no cross-reference, because the merchant goes looking.
    // Option labels count as names too: a description that explains a dropdown
    // necessarily quotes its choices, and those are labels the merchant reads
    // in exactly the same panel.
    const labels = new Set(
      allText()
        .filter(([, k]) => k === 'label' || k === 'option')
        .map(([, , t]) => t),
    )
    // Names of panels and page types that are Salla's, not this theme's.
    const EXTERNAL = new Set([
      'هوية وبيانات المتجر',
      'صفحة مخصّصة',
      'تجارب عملائنا',
      'العروض',
      'منتجات مشابهة',
      'تسليم فوري',
      'أضف إلى السلة',
      'أعلمني عند التوفر',
    ])

    const missing = []
    for (const [id, kind, text] of allText()) {
      for (const m of text.matchAll(/«([^»]{2,60})»/g)) {
        const name = m[1].trim()
        // A prefix counts. An option reads «إظهار الصورة كاملة (قد يبقى فراغ
        // حولها)» in the dropdown, and a sentence referring to it says the
        // first half — which is unambiguous and reads better than pasting the
        // parenthetical into prose.
        if ([...labels].some((l) => l === name || l.startsWith(name))) continue
        if (EXTERNAL.has(name)) continue
        // Quotes are also used for example copy and for option labels; only
        // flag a name that reads like a setting, i.e. one this file could own.
        if (/^(لون|إظهار|تثبيت|شارات|عرض|تفعيل|السماح|جهة|نص|رابط|صورة|عدد)/.test(name)) {
          missing.push(`${id}.${kind} → «${name}»`)
        }
      }
    }
    assert.deepEqual(missing, [], 'a setting refers to another by a name that no label carries')
  })
})
