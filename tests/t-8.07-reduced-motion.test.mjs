/**
 * T-8.07 — reduced motion.
 *
 * T-2.03 BUILT THE MECHANISM; THIS TASK IS THE AUDIT OF IT, AND THE AUDIT FOUND
 * ONE NON-OBVIOUS RULE THAT IS WORTH MORE THAN THE REST OF THE FILE COMBINED.
 *
 * The blanket clamp in `02-generic/motion.scss` sets every animation to 0.01ms
 * and pins `animation-iteration-count` to 1. For a **finite** animation that is
 * exactly right: it completes instantly, its `animationend` still fires, and
 * scripts that wait on it keep working.
 *
 * FOR AN **INFINITE** ANIMATION IT IS WRONG, AND WRONG IN A WAY THAT LOOKS LIKE
 * NOTHING UNTIL YOU SEE IT. Pinning the count to 1 does not stop the animation
 * at its start — it runs one cycle instantly and **rests at its end state**. A
 * marquee ends with its text scrolled out of the bar. A shimmer ends with its
 * bright band parked wherever 100% put it. The theme has already been bitten by
 * this twice, and `announcement.scss` and `skeleton.scss` each carry their own
 * rule because of it.
 *
 * So the register below is the substance of this task: every infinite animation
 * in the stylesheets, with what happens to it under the preference. A new one
 * added with no entry fails this suite — which is the only way the fifth
 * occurrence of a bug that has already happened twice gets caught before a user
 * finds it.
 *
 * WHAT CANNOT BE TESTED HERE. jsdom applies no stylesheets and runs no
 * animations, so nothing below observes motion. These are assertions about the
 * *shape* of the suppression. **Watching the pages with the OS setting on is
 * `/docs/MANUAL-QA.md` §2 and is not claimed here.**
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const STYLES = new URL('../src/assets/styles/', import.meta.url).pathname
const read = (file) => fs.readFileSync(path.join(STYLES, file), 'utf8')

const MOTION = read('02-generic/motion.scss')
const APP = read('app.scss')

/** Every `.scss` under the styles tree, path-relative. */
function stylesheets(dir = STYLES) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return stylesheets(full)
    return entry.name.endsWith('.scss') ? [full] : []
  })
}

/** Strip comments so prose discussing a declaration is not read as one. */
const code = (source) => source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, '')

describe('T-8.07 — the blanket clamp, which is what covers code the theme does not own', () => {
  const clamp = code(MOTION)

  test('the clamp exists and reaches every element and pseudo-element', () => {
    assert.match(clamp, /@media\s*\(prefers-reduced-motion:\s*reduce\)/)
    assert.match(clamp, /\*,\s*\*::before,\s*\*::after/)
  })

  for (const declaration of [
    'animation-delay',
    'animation-duration',
    'animation-iteration-count',
    'transition-delay',
    'transition-duration',
    'scroll-behavior',
  ]) {
    test(`${declaration} is clamped, with !important`, () => {
      const rule = new RegExp(`${declaration}\\s*:[^;]+!important`)
      assert.match(
        clamp,
        rule,
        `${declaration} is no longer clamped. !important is not decoration here — ` +
          'it has to beat inline styles that animation libraries write at runtime.',
      )
    })
  }

  /**
   * THE SHARPEST TEST IN THIS FILE, AND THE LEAST OBVIOUS.
   *
   * `0.01ms` looks like a value somebody was too timid to round down. It is not.
   * A transition with duration `0s` **does not fire `transitionend`** — and
   * `wishlist.js` removes the item from the DOM inside a `transitionend`
   * handler. Round this to zero and, for reduce-motion users only, removed
   * wishlist items stay on the page forever. Nothing throws and nothing logs.
   *
   * The same holds for `animationend` and any script waiting on it.
   */
  test('the clamped durations are non-zero, because 0s never fires transitionend', () => {
    for (const [, property, value] of clamp.matchAll(
      /(animation-duration|transition-duration|animation-delay|transition-delay)\s*:\s*([^;!]+)/g,
    )) {
      const ms = /(-?[\d.]+)\s*(ms|s)\b/.exec(value.trim())

      assert.ok(ms, `${property} is "${value.trim()}" — expected a time`)
      assert.ok(
        Number(ms[1]) > 0,
        `${property} is ${value.trim()}. A zero duration fires no transitionend/animationend ` +
          'event, and wishlist.js removes the list item inside one. Keep it small and non-zero.',
      )
    }
  })

  test('the iteration count is pinned to 1, so an infinite animation can end at all', () => {
    assert.match(clamp, /animation-iteration-count\s*:\s*1\s*!important/)
  })

  test('the motion tokens collapse too, so token-driven components need no rule', () => {
    for (const token of ['--motion-fast', '--motion-base', '--motion-slow']) {
      assert.match(clamp, new RegExp(`${token}\\s*:\\s*0\\.01ms`), `${token} does not collapse`)
    }
  })

  test('motion.scss is the last import in app.scss', () => {
    const imports = [...code(APP).matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1])

    assert.equal(
      imports.at(-1),
      './02-generic/motion',
      'motion.scss must stay last. Its !important would win from anywhere, but the ' +
        'position is what makes the intent legible in a list of forty imports.',
    )
  })
})

/**
 * THE REGISTER. Every infinite animation in `src/assets/styles`, and what the
 * preference does to it. Two need a rule of their own; two are safe because of
 * where their keyframes end, and that reasoning is written down so nobody
 * "tidies up" by deleting a rule that turns out to matter.
 */
const INFINITE = {
  'announcement-scroll': {
    file: '04-components/announcement.scss',
    disposition: 'own rule',
    why:
      'A marquee. Letting it complete one instant cycle leaves the text scrolled out of the ' +
      'bar — the criterion says it stops, and stopping is not finishing. `animation: none`.',
  },
  'skeleton-sweep': {
    file: '04-components/skeleton.scss',
    disposition: 'own rule',
    why:
      'A shimmer. Completing parks a bright band at whatever position 100% names, which is ' +
      'brighter and more distracting than the sweep it replaced. The band is hidden instead.',
  },
  'header-skel-shimmer': {
    file: '04-components/header.scss',
    disposition: 'safe by end state',
    why:
      'Upstream, byte-identical to 1.365.0, and it needs no rule: the keyframes run ' +
      'background-position 200% → -200% at background-size 200%, so the gradient sits ' +
      'entirely off the element at BOTH endpoints. The end state is the flat grey bed with ' +
      'no band visible. Adding a rule would mean shadowing an upstream file for nothing.',
  },
  loader: {
    file: '02-generic/common.scss',
    disposition: 'safe by end state',
    why:
      'Upstream. A spinner ending at 360°, which is pixel-identical to 0°. It stops turning, ' +
      'which is the intended outcome of the preference rather than a defect.',
  },
}

describe('T-8.07 — infinite animations, each with a stated disposition', () => {
  /** `animation: name … infinite` and `animation-iteration-count: infinite`. */
  function findInfinite() {
    const found = new Map()

    for (const file of stylesheets()) {
      const relative = path.relative(STYLES, file).split(path.sep).join('/')

      for (const [, shorthand] of code(fs.readFileSync(file, 'utf8')).matchAll(
        /animation\s*:\s*([^;]*\binfinite\b[^;]*);/g,
      )) {
        // The name is the first token that is not a time, a timing function or
        // a keyword — which in practice is the first identifier in the value.
        const name = shorthand.trim().split(/\s+/)[0]
        found.set(name, relative)
      }
    }

    return found
  }

  const found = findInfinite()

  test('every infinite animation in the stylesheets is in the register', () => {
    const unregistered = [...found]
      .filter(([name]) => !Object.hasOwn(INFINITE, name))
      .map(([name, file]) => `${name} (${file})`)

    assert.deepEqual(
      unregistered,
      [],
      'An infinite animation with no entry in INFINITE. Decide what the preference does to ' +
        'it and say so here. Remember the trap: the blanket clamp does NOT stop an infinite ' +
        'animation at its start — it runs one instant cycle and rests at its END state. If ' +
        'that end state is visible, the animation needs a rule of its own.',
    )
  })

  test('the register has no stale entries', () => {
    const gone = Object.keys(INFINITE).filter((name) => !found.has(name))

    assert.deepEqual(
      gone,
      [],
      'The register names an animation that no longer exists. Remove the entry — a register ' +
        'that lists things that are gone stops being read.',
    )
  })

  for (const [name, entry] of Object.entries(INFINITE)) {
    if (entry.disposition !== 'own rule') continue

    test(`${name} is suppressed by a rule in its own file — ${entry.why.slice(0, 60)}…`, () => {
      const source = code(read(entry.file))
      const at = source.search(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)

      assert.ok(
        at !== -1,
        `${entry.file} declares ${name} as infinite but has no prefers-reduced-motion block. ` +
          `Without one the blanket clamp leaves it resting at its end state. ${entry.why}`,
      )

      const block = source.slice(at)
      assert.match(
        block,
        /animation\s*:\s*none|@apply\s+[^;]*\bhidden\b|display\s*:\s*none/,
        `${entry.file}'s reduce block must stop or hide the animation, not shorten it. ` +
          'Shortening is what the blanket clamp already does, and it is the thing that fails here.',
      )
    })
  }
})

describe('T-8.07 — no stylesheet re-enables motion under the preference', () => {
  /**
   * A `prefers-reduced-motion: reduce` block that sets a *real* duration is a
   * contradiction, and an easy one to write by accident when copying a rule.
   * The clamp's own 0.01ms declarations are the deliberate exception.
   */
  test('a reduce block never sets a perceptible duration', () => {
    const offenders = []

    for (const file of stylesheets()) {
      const relative = path.relative(STYLES, file).split(path.sep).join('/')
      if (relative === '02-generic/motion.scss') continue

      const source = code(fs.readFileSync(file, 'utf8'))
      const at = source.search(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
      if (at === -1) continue

      // The media block, to its closing brace.
      let depth = 0
      let end = source.indexOf('{', at)
      const open = end
      while (end < source.length) {
        if (source[end] === '{') depth += 1
        else if (source[end] === '}' && --depth === 0) break
        end += 1
      }

      for (const [, value] of source
        .slice(open, end)
        .matchAll(/(?:animation|transition)-duration\s*:\s*([^;]+)/g)) {
        const ms = /(-?[\d.]+)\s*(ms|s)\b/.exec(value)
        const milliseconds = ms ? Number(ms[1]) * (ms[2] === 's' ? 1000 : 1) : 0
        if (milliseconds > 1) offenders.push(`${relative}: ${value.trim()}`)
      }
    }

    assert.deepEqual(
      offenders,
      [],
      'A reduce-motion block sets a duration a user can perceive, which is the opposite of ' +
        'what the block is for.',
    )
  })
})
