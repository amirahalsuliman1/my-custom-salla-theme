/**
 * T-8.13 — the merchant colour panel.
 *
 * THE CLAIM THIS FILE DEFENDS, AND IT IS NOT «the colours work». It is the
 * owner's second constraint: **a store that touches nothing is byte-identical
 * to the design.** Nine settings were added to a theme whose every colour was
 * measured out of the SVG exports, and the way that goes wrong is not a broken
 * page — it is a default quietly one shade off, shipped to every store that
 * never opens the panel.
 *
 * So most of what follows compares a declared default against the token it
 * fills, and the three settings that ship EMPTY get their own tests, because
 * empty is the correct answer for them and a well-meaning later edit that fills
 * one in would repaint every store that has a brand colour set.
 *
 * The rest guards the two scoping decisions that keep a setting from reaching
 * further than its label promises: the header colours must not touch the
 * transparent Home header, and the footer surface must not touch the section
 * panel every page shares.
 *
 * WHAT THESE TESTS CANNOT DO. Nothing here checks contrast of a merchant's
 * chosen values, because nothing can — see AC-13 in /docs/DERIVED-DECISIONS.md.
 * `check-a11y.mjs` guards the defaults; the extremes are /docs/MANUAL-QA.md §5.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const MANIFEST = JSON.parse(fs.readFileSync('twilight.json', 'utf8'))
const MASTER = fs.readFileSync('src/views/layouts/master.twig', 'utf8')
const GLOBAL = fs.readFileSync('src/assets/styles/01-settings/global.scss', 'utf8')
const HEADER = fs.readFileSync('src/assets/styles/04-components/store-header.scss', 'utf8')
const FOOTER = fs.readFileSync('src/assets/styles/04-components/footer.scss', 'utf8')
const BUTTONS = fs.readFileSync('src/assets/styles/04-components/buttons.scss', 'utf8')
const ICONS = fs.readFileSync('src/assets/styles/03-elements/icons.scss', 'utf8')

/**
 * The panel, as a table rather than as prose.
 *
 * `expect` is what the token must resolve to with the setting unset. A hex
 * means the token declares that literal; a `var(...)` means it aliases, which
 * is the shape used wherever the value is already stated once elsewhere and
 * must not get a second home to drift in.
 */
const PANEL = [
  { id: 'color_page_background', token: '--surface-page', value: '#FDFDFD', expect: '#fdfdfd' },
  { id: 'color_text_primary', token: '--main-text-color', value: '#1B1B1B', expect: '#1b1b1b' },
  {
    id: 'color_header_background',
    token: '--surface-header',
    value: '#F7F6F4',
    expect: 'var(--surface-section)',
  },
  {
    id: 'color_header_text',
    token: '--text-header',
    value: '#1B1B1B',
    expect: 'var(--main-text-color)',
  },
  {
    id: 'color_footer_background',
    token: '--surface-footer',
    value: '#F7F6F4',
    expect: 'var(--surface-section)',
  },
  {
    id: 'color_footer_text',
    token: '--text-footer',
    value: '#1B1B1B',
    expect: 'var(--main-text-color)',
  },
  {
    id: 'color_button_background',
    token: '--color-button-bg',
    value: '',
    expect: 'var(--color-primary)',
  },
  {
    id: 'color_button_text',
    token: '--color-button-text',
    value: '',
    expect: 'var(--color-primary-reverse)',
  },
  { id: 'color_icons', token: '--color-icon', value: '', expect: 'currentColor' },
]

const setting = (id) => MANIFEST.settings.find((s) => s.id === id)

/** The declared value of a token in the `:root` block, as written. */
const declared = (token) => {
  const m = GLOBAL.match(new RegExp(`^\\s*${token}:\\s*([^;]+);`, 'm'))
  return m && m[1].trim()
}

/**
 * Follow a token through its aliases to the colour it actually paints.
 *
 * Four of the seven tokens alias rather than restate — `--surface-header` is
 * `var(--surface-section)`, which is `#f7f6f4` — and the default offered in the
 * customiser has to equal the END of that chain, not the middle of it. Without
 * this the comparison would be a hex against the string `var(--surface-section)`
 * and would prove nothing.
 */
const resolve = (value, seen = new Set()) => {
  const m = value && value.match(/^var\((--[\w-]+)\)$/)
  if (!m) return value
  if (seen.has(m[1])) return value // a cycle is a different defect; do not hang on it
  seen.add(m[1])
  return resolve(declared(m[1]), seen)
}

describe('T-8.13 — every setting is declared as a colour', () => {
  for (const { id } of PANEL) {
    test(`${id} is a colour picker, not a text field`, () => {
      const s = setting(id)
      assert.ok(s, `${id} is not declared in twilight.json`)
      assert.equal(s.type, 'string')
      // The whole point of the T-2.01 correction. A `text` format here means a
      // merchant typing a hex by hand into a field with no preview.
      assert.equal(s.format, 'color')
    })
  }

  test('every description states the required format', () => {
    // The owner's third constraint. The description is the ONLY channel this
    // theme has to the person choosing the colour — there is no validation
    // hook and no contrast warning anywhere on the platform, per AC-13.
    for (const { id } of PANEL) {
      assert.match(setting(id).description, /#RRGGBB/, `${id} does not state the format`)
    }
  })

  test('the settings that can make something invisible say so', () => {
    // Not decoration. A merchant reading «لون الأيقونات» has no way to know it
    // also recolours the icons sitting on the hero photograph.
    assert.match(setting('color_icons').description, /الغلاف|غير مرئية/)
    assert.match(setting('color_header_background').description, /الرئيسية/)
    assert.match(setting('color_button_background').description, /لون المتجر/)
  })
})

describe('T-8.13 — the three rulings of 2026-08-12', () => {
  /**
   * All TEN colour settings, not the nine in PANEL. `secondary_color` predates
   * this task and is the tenth field in the same panel; a merchant reading down
   * the list has no idea one of them came from a different task.
   */
  const ALL_COLOURS = MANIFEST.settings.filter((s) => s.format === 'color')

  test('the panel’s own ten are all colour pickers', () => {
    // The nine T-8.13 added, plus `secondary_color`, which predates it and sits
    // in the same panel. Named rather than counted: this assertion used to read
    // `length === 10` and broke the moment T-3.03 added two colours of its own
    // — pinning a total was the wrong invariant, because it fails on every
    // legitimate addition while proving nothing about these ten.
    const panel = [...PANEL.map((p) => p.id), 'secondary_color']
    for (const id of panel) assert.equal(setting(id)?.format, 'color', `${id} is not a colour`)
  })

  test('every colour setting anywhere in the manifest carries the responsibility line', () => {
    // RULING 3 — no minimum is imposed and no value is blocked; the theme
    // records instead. This replaced per-setting «must stay above 4.5:1»
    // wording, which read as a rule the theme was enforcing and was not.
    //
    // Deliberately every colour setting, not just the panel's: a merchant
    // reading down the customiser cannot tell which task added which field, so
    // a colour that omits the line is an inconsistency they would read as
    // meaning something.
    assert.ok(ALL_COLOURS.length >= 10, `expected the panel at least, found ${ALL_COLOURS.length}`)
    for (const s of ALL_COLOURS) {
      assert.match(
        s.description,
        /التباين مسؤوليتك — القالب لا يتحقّق منه ولا يمنع أي قيمة\./,
        `${s.id} does not record that contrast is the merchant's responsibility`,
      )
    }
  })

  test('no setting validates, clamps or rejects a colour value', () => {
    // The mirror of the line above: recording it in the description and then
    // quietly enforcing it in the manifest would be worse than either.
    for (const s of ALL_COLOURS) {
      for (const key of ['min', 'max', 'pattern', 'validation', 'rules', 'options']) {
        assert.ok(!(key in s), `${s.id} carries a "${key}" constraint`)
      }
      assert.equal(s.required, false, `${s.id} is required, so a merchant cannot clear it`)
    }
  })

  test('the header background setting warns about the hero, and about the scrim', () => {
    // RULING 1. Two separate facts, and the second is the one a merchant would
    // otherwise go looking for a control to change.
    const d = setting('color_header_background').description
    assert.match(d, /الرئيسية/, 'does not say the colour has no effect on Home')
    assert.match(d, /ستار الغلاف/, 'does not mention the hero scrim')
    assert.match(d, /غير قابل للضبط/, 'does not say the scrim is deliberately not settable')
  })

  test('the hero scrim is NOT a setting, and is not one by accident', () => {
    // RULING 1, the half that is an absence — which is exactly the kind of
    // thing a later «we made everything configurable» pass would undo. The
    // scrim is the only thing making the hero's white text readable over a
    // merchant-supplied image, and a merchant who lightened it would not see
    // the failure until they upload a light photograph months later.
    for (const s of MANIFEST.settings) {
      assert.ok(
        !/scrim|overlay|hero_dim/i.test(s.id),
        `${s.id} looks like a scrim setting — see the note in hero.scss`,
      )
    }
    const hero = fs.readFileSync('src/assets/styles/04-components/hero.scss', 'utf8')
    assert.match(hero, /\.hero__scrim[\s\S]*?rgb\(0 0 0 \/ 60%\)/, 'the 60% floor moved')
    assert.match(hero, /T-8\.13/, 'the reason it is not settable is not recorded where it lives')
  })

  test('--surface-control still follows the text, not the buttons', () => {
    // RULING 2. The filled neutral control — «انضم كبراند» — is the same ink as
    // the secondary text beside it. Pointing it at --color-button-bg would leak
    // a merchant's button colour into a control the design never treated as a
    // button, and would need an eleventh setting to say so.
    assert.equal(declared('--surface-control'), 'var(--text-secondary)')
    assert.ok(
      !GLOBAL.includes('--surface-control: var(--color-button-bg)'),
      '--surface-control must not follow the button colour',
    )
  })
})

describe('T-8.13 — a store that touches nothing is unchanged', () => {
  for (const { id, token, expect } of PANEL) {
    test(`${token} still resolves to ${expect} with ${id} unset`, () => {
      assert.equal(declared(token), expect, `${token} is not the theme's shipped value`)
    })
  }

  test('every default offered in the panel matches the token it fills', () => {
    // The failure this catches is a default one shade off the measured value —
    // invisible in review, shipped to every store that never opens the panel.
    for (const { id, value, token } of PANEL) {
      if (!value) continue // the three intentionally-empty ones, below
      const painted = resolve(declared(token))
      assert.equal(
        value.toLowerCase(),
        painted,
        `${id} offers ${value} but ${token} paints ${painted}`,
      )
    }
  })

  test('the three that cannot have a default ship empty', () => {
    // ⚠ Do not "fix" these by filling them in. Their tokens alias the
    // merchant's own store colour and `currentColor` — values this theme does
    // not own and which differ per store. A literal here repaints every store
    // that already set a brand colour.
    for (const id of ['color_button_background', 'color_button_text', 'color_icons']) {
      assert.equal(setting(id).value, '', `${id} must ship with no default`)
    }
  })
})

describe('T-8.13 — the settings reach CSS, and only when set', () => {
  for (const { id, token } of PANEL) {
    test(`${id} is emitted into :root as ${token}`, () => {
      assert.ok(
        MASTER.includes(`${token}: {{ theme.settings.get('${id}') }};`),
        `${id} is declared but never reaches CSS`,
      )
    })

    test(`${id} is guarded, so unset emits nothing`, () => {
      // The guard IS the "unchanged by default" property. Without it every
      // token would be overwritten on every page with whatever the platform
      // hands back for an unset setting.
      const at = MASTER.indexOf(`${token}: {{ theme.settings.get('${id}') }};`)
      const before = MASTER.slice(Math.max(0, at - 200), at)
      assert.match(before, new RegExp(`\\{% if theme\\.settings\\.get\\('${id}'\\) %\\}\\s*$`))
    })
  }

  test('the emitting block sits after app.css, or none of this wins', () => {
    // The inline :root block overrides the token layer by document order. If a
    // stylesheet were ever linked below it, every setting in this panel would
    // silently stop working while still being declared, read and documented.
    assert.ok(
      MASTER.indexOf("'app.css' | asset") < MASTER.indexOf('--surface-page: {{'),
      'the merchant colour block must come after the app.css link',
    )
  })
})

describe('T-8.13 — each setting stays inside what its label promises', () => {
  test('the header colours apply to the solid header only', () => {
    // On Home the header is transparent over the hero and its text is white
    // because a photograph is behind it. That white is a contrast requirement,
    // not a style, so neither header setting may reach it.
    assert.match(HEADER, /\.store-header--solid\s*\{[^}]*color:\s*var\(--text-header\)/s)
    assert.match(
      HEADER,
      /\.store-header--solid \.store-header__bar\s*\{[\s\S]*?background-color:\s*var\(--surface-header\)/,
    )
    const overlay = HEADER.slice(HEADER.indexOf('.store-header--overlay'))
    assert.ok(
      !overlay.slice(0, 400).includes('--text-header'),
      'the overlay header must not take the merchant ink',
    )
  })

  test('the footer surface does not repaint every section panel', () => {
    // `.s-block__panel` is shared by every section on every page. A setting
    // labelled «التذييل» that recoloured the whole store would be a defect no
    // amount of correct plumbing would excuse.
    assert.match(
      FOOTER,
      /\.store-footer__inner\.s-block__panel\s*\{[\s\S]*?background-color:\s*var\(--surface-footer\)/,
    )
    assert.ok(
      !/^\.s-block__panel\s*\{[^}]*--surface-footer/m.test(FOOTER),
      '--surface-footer must never be applied to the shared panel class',
    )
  })

  test('the button colours reach .btn--primary and nothing wider', () => {
    // `bg-primary` also paints the cart's progress bar and a brand-page chip.
    // Those are not buttons.
    assert.match(
      BUTTONS,
      /\.btn--primary\s*\{[\s\S]*?background-color:\s*var\(--color-button-bg\)[\s\S]*?color:\s*var\(--color-button-text\)/,
    )
    // The border moves with the fill, or the old store colour is drawn as a
    // 1px ring around the new one.
    assert.match(BUTTONS, /\.btn--primary\s*\{[\s\S]*?border-color:\s*var\(--color-button-bg\)/)
  })

  test('the icon colour is scoped to the theme’s own icon entry point', () => {
    assert.match(ICONS, /\.ui-icon\s*\{[\s\S]*?color:\s*var\(--color-icon\)/)
    // Not `[class^="sicon-"]`, which would also recolour the icons inside
    // Salla's own web components. Comments are stripped first — this file
    // explains the choice in prose and would otherwise fail on its own note.
    const body = ICONS.replace(/\/\*[\s\S]*?\*\//g, '')
    assert.ok(!body.includes('sicon-'), 'the icon colour must not target the font class directly')
  })

  test('T-2.04’s advice against an icon colour token is preserved, not erased', () => {
    // That file said in terms that no icon colour token should exist. It was
    // overruled by the owner, and the reasoning has to survive the override —
    // otherwise the next person re-derives it from scratch.
    assert.match(ICONS, /T-8\.13/)
    assert.match(ICONS, /currentColor/)
  })
})

describe('T-8.13 — no raw colour escaped the token layer', () => {
  test('the four consuming stylesheets set colours only through var()', () => {
    // stylelint's `color-no-hex` enforces this repo-wide and 01-settings is the
    // one exemption. This asserts the specific files this task touched, so a
    // future edit that adds a literal here fails with a reason rather than with
    // a generic lint message.
    for (const [name, css] of [
      ['store-header.scss', HEADER],
      ['footer.scss', FOOTER],
      ['buttons.scss', BUTTONS],
      ['icons.scss', ICONS],
    ]) {
      const body = css.replace(/\/\*[\s\S]*?\*\//g, '')
      assert.ok(
        !/#[0-9a-f]{3,8}\b/i.test(body),
        `${name} carries a raw hex outside the token layer`,
      )
    }
  })

  test('every token in the panel is declared in the settings layer', () => {
    for (const { token } of PANEL) {
      assert.ok(declared(token), `${token} is emitted but never declared in global.scss`)
    }
  })
})
