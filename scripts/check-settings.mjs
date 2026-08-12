#!/usr/bin/env node
/**
 * T-8.10 — the merchant's settings, checked against what the theme actually reads.
 *
 * CLAUDE.md STATES THE RULE THIS ENFORCES, AND STATES IT AS A DEFECT CONDITION:
 * "Everything configurable must be a setting, never a hard-coded value… The
 * merchant changes it, not the developer." There are two ways to break that
 * without anybody noticing, and they are mirror images:
 *
 *   · A SETTING THE MERCHANT CAN NEVER SET. A template reads
 *     `theme.settings.get('x')` and `twilight.json` declares no `x`. The
 *     customiser shows nothing, the value is always the fallback, and the
 *     feature silently does not exist. **Nothing errors** — Twig returns null.
 *
 *   · A SETTING THAT DOES NOTHING. `twilight.json` declares `y` and no template
 *     reads it. The merchant finds a control, changes it, saves, and the store
 *     looks identical. That is worse than a missing control, because it costs
 *     the merchant their trust in the whole panel.
 *
 * REACHABILITY IS THE PART THAT MAKES THIS HONEST. `src/views/components/home/`
 * holds twenty-eight templates and the theme exposes far fewer: a home section
 * is reachable only if it is registered in `components` or enabled through a
 * `component-*` entry in `features`. An unregistered template is dead code, and
 * a setting it reads is correctly absent rather than missing. Checking without
 * modelling that would report six false defects and be switched off within a
 * week.
 *
 * WHAT THIS CANNOT DO. It cannot tell whether a default is *sensible*, only
 * whether one exists. It cannot toggle a setting in a real store and look at the
 * result, which is the actual acceptance criterion. **That is
 * `/docs/MANUAL-QA.md` §5.**
 *
 * Run by `pnpm run lint:settings`, and inside `pnpm run lint`.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const VIEWS = path.join(ROOT, 'src/views')
const JS = path.join(ROOT, 'src/assets/js')
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'twilight.json'), 'utf8'))

const problems = []
const fail = (where, message) => problems.push(`${where}\n    ${message}`)

/* ── What the manifest declares ────────────────────────────────────────────── */

/** `static` entries are layout dividers and headings in the panel, not settings. */
const declared = new Map(
  (MANIFEST.settings ?? []).filter((s) => s.type !== 'static').map((s) => [s.id, s]),
)

/** Component fields are per-section and reached as `component.<field>`, not through `theme.settings`. */
const components = MANIFEST.components ?? []

/* ── Which templates a merchant can actually reach ─────────────────────────── */

const registered = new Set(components.map((c) => String(c.path ?? '').replace(/^home\./, '')))
const featured = new Set(
  (MANIFEST.features ?? [])
    .filter((f) => f.startsWith('component-'))
    .map((f) => f.slice('component-'.length)),
)

/**
 * A home template is reachable when its name is registered as a component or
 * enabled as a feature. The `startsWith` case is real rather than defensive:
 * one feature, `component-featured-products`, enables three templates —
 * `featured-products-style1`, `-style2` and `-style3`.
 */
function isReachable(relativePath) {
  if (!relativePath.startsWith('components/home/')) return true

  const name = path.basename(relativePath, '.twig')
  if (registered.has(name) || featured.has(name)) return true

  return [...featured].some((feature) => name.startsWith(feature))
}

/* ── What the theme reads ──────────────────────────────────────────────────── */

function walk(dir, extension) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full, extension)
    return entry.name.endsWith(extension) ? [full] : []
  })
}

/** Blank, never delete — line numbers have to keep pointing at real lines. */
const blank = (match) => match.replace(/[^\n]/g, ' ')

/**
 * TWO CALL FORMS, AND MISSING THE SECOND IS HOW A CHECKER CRIES WOLF. Twig reads
 * `theme.settings.get('x')`; `product-card.js` reads
 * `salla.config.get('theme.settings.instant_delivery_tag')`. A scan for only the
 * first reports `instant_delivery_tag` as dead when it is the setting driving
 * the card's delivery pill.
 */
const TWIG_CALL = /theme\.settings\.get\(\s*['"]([\w.-]+)['"]\s*(?:,([^)]*))?\)/g
const CONFIG_CALL = /salla\.config\.get\(\s*['"]theme\.settings\.([\w.-]+)['"]\s*(?:,([^)]*))?\)/g

/**
 * A THIRD SOURCE, AND WITHOUT IT THIS SCRIPT REPORTS A DEFECT THAT IS THE
 * PLATFORM WORKING AS DOCUMENTED. `theme.settings.set(name, value)` declares a
 * template-scoped global that `get` then reads — `master.twig` uses it for
 * `placeholder`, and `product-card.js` reads that value back through
 * `salla.config.get`. It is deliberately **not** a customiser setting: the
 * merchant has no business choosing the placeholder image path, and declaring
 * it in `twilight.json` would put a developer's constant in the merchant's
 * panel. So a `set` id counts as declared, and counts as *not* wanted in the
 * manifest.
 */
const SET_CALL = /theme\.settings\.set\(\s*['"]([\w.-]+)['"]/g

function collectRuntimeGlobals() {
  const ids = new Set()

  for (const full of walk(VIEWS, '.twig')) {
    const source = fs.readFileSync(full, 'utf8').replace(/\{#[\s\S]*?#\}/g, blank)
    for (const match of source.matchAll(SET_CALL)) ids.add(match[1])
  }

  return ids
}

/** Settings read anywhere, with where and whether the call site has a fallback. */
function collectUses() {
  const uses = new Map()

  const record = (id, file, line, hasFallback, reachable) => {
    const existing = uses.get(id) ?? { sites: [], reachable: false, everyCallHasFallback: true }
    existing.sites.push(`${file}:${line}`)
    existing.reachable = existing.reachable || reachable
    existing.everyCallHasFallback = existing.everyCallHasFallback && hasFallback
    uses.set(id, existing)
  }

  const scan = (files, base, alwaysReachable) => {
    for (const full of files) {
      const relative = path.relative(base, full).split(path.sep).join('/')
      const source = fs
        .readFileSync(full, 'utf8')
        .replace(/\{#[\s\S]*?#\}/g, blank) // Twig prose quotes example calls
        .replace(/\/\*[\s\S]*?\*\//g, blank) // and so do JS docblocks
        .replace(/^\s*\/\/.*$/gm, blank)

      const reachable = alwaysReachable || isReachable(relative)

      for (const pattern of [TWIG_CALL, CONFIG_CALL]) {
        for (const match of source.matchAll(pattern)) {
          const line = source.slice(0, match.index).split('\n').length
          record(match[1], relative, line, Boolean(match[2]?.trim()), reachable)
        }
      }
    }
  }

  scan(walk(VIEWS, '.twig'), VIEWS, false)
  scan(walk(JS, '.js'), JS, true)

  return uses
}

const uses = collectUses()
const runtimeGlobals = collectRuntimeGlobals()

/* ── The checks ────────────────────────────────────────────────────────────── */

/**
 * Consumed by a template no merchant can reach. These are upstream sections the
 * theme deregistered by replacing `components` with its own six; the templates
 * were left in the tree because deleting an upstream file buys nothing and
 * costs a diff on every SDK upgrade. Listed with the reason, not silenced.
 */
/**
 * FOUND, TRUE, AND NOT THIS SCRIPT'S TO DECIDE. Reported loudly on every run and
 * deliberately not a build failure — the same treatment T-8.09 gives the PDP's
 * duplicate wishlist button, and for the same reason: the fix is a product
 * decision with two defensible answers, and a lint script must not pick one by
 * failing until somebody picks the other.
 *
 * An entry here is removed when the owner rules, not when it becomes annoying.
 */
const OPEN_FINDINGS = new Map([
  [
    'squar_photo_bg_image_size',
    'Raised 2026-08-12 by T-8.10. Read by `components/home/square-photos.twig`, which IS ' +
      'reachable — the theme kept every one of upstream’s `features`, including ' +
      '`component-square-photos`, and only replaced the `components` list. But the theme’s ' +
      '`twilight.json` dropped this setting when its settings list was rewritten: upstream ' +
      '1.365.0 declares it, this theme does not. So a merchant can add the section and can ' +
      'never change how its images are sized. Nothing breaks — the call site falls back to ' +
      '`contain`. TWO DEFENSIBLE FIXES AND THEY POINT OPPOSITE WAYS: restore the declaration, ' +
      'if the section is meant to be available; or drop `component-square-photos` from ' +
      '`features`, if it is not in the design and keeping the feature was the oversight. ' +
      'AWAITING THE OWNER.',
  ],
])

const UNREACHABLE_OK = new Map([
  [
    'is_more_button_enabled',
    'components/home/brands.twig — upstream’s Brands section. The theme replaced upstream’s ' +
      'six `components` entries with its own, so `home.brands` is no longer registered and no ' +
      'merchant can add the section. The setting is correctly absent.',
  ],
])

for (const [id, use] of uses) {
  if (declared.has(id)) continue

  if (runtimeGlobals.has(id)) {
    // Set by a template through `theme.settings.set`. Declared, just not by the
    // manifest — and it must stay out of it.
    continue
  }

  if (!use.reachable) {
    if (!UNREACHABLE_OK.has(id)) {
      fail(
        `${id} — read at ${use.sites[0]}`,
        'read only by templates no merchant can reach, and not listed as such. If the section ' +
          'is genuinely dead, add it to UNREACHABLE_OK with the reason. If it is not, the ' +
          'reachability model above is wrong and needs fixing rather than an exception.',
      )
    }
    continue
  }

  if (OPEN_FINDINGS.has(id)) continue

  fail(
    `${id} — read at ${use.sites.join(', ')}`,
    'READ BY A REACHABLE TEMPLATE BUT NOT DECLARED IN twilight.json. The merchant has no ' +
      'control for it, so it is permanently whatever the fallback is. ' +
      (use.everyCallHasFallback
        ? 'Every call site has a fallback, so nothing breaks — but "the merchant changes it, ' +
          'not the developer" is not true of this value.'
        : '⚠ AND AT LEAST ONE CALL SITE HAS NO FALLBACK, so the value is null.'),
  )
}

/** A finding that has been resolved must leave, or the list stops being read. */
for (const id of OPEN_FINDINGS.keys()) {
  if (declared.has(id) || !uses.has(id)) {
    fail(
      `${id} — listed in OPEN_FINDINGS`,
      'is no longer an open finding: it is either declared now or no longer read. Remove the ' +
        'entry.',
    )
  }
}

for (const [id, setting] of declared) {
  if (!uses.has(id)) {
    fail(
      `${id} — declared in twilight.json`,
      'declared but never read. The merchant finds a control, changes it, saves, and the store ' +
        'looks identical — which costs more trust than a missing control does. Wire it or ' +
        'remove it.',
    )
    continue
  }

  // "Defaults sensible for a fresh install" — whether one is *sensible* needs a
  // store and an opinion; whether one *exists* does not.
  const hasDefault =
    Object.hasOwn(setting, 'value') ||
    (Array.isArray(setting.selected) && setting.selected.length > 0) ||
    uses.get(id).everyCallHasFallback

  if (!hasDefault) {
    fail(
      `${id} — declared in twilight.json`,
      'no default: no `value`, no `selected`, and at least one call site reads it with no ' +
        'fallback. A fresh install gets null here. Give it a default in the manifest or a ' +
        'fallback at every call site.',
    )
  }

  if (!setting.label) {
    fail(`${id} — declared in twilight.json`, 'no label. It appears in the customiser unnamed.')
  }
}

for (const component of components) {
  for (const field of component.fields ?? []) {
    if (field.type === 'static') continue

    /**
     * A `collection` is a repeater, and it is labelled per row rather than as a
     * whole: `item_label` is «سؤال», so the panel reads "سؤال 1", "سؤال 2". Its
     * own `label` is deliberately null — the section's title already names it,
     * and a second heading above the rows would be noise. Requiring `label`
     * here reported five correct fields as defects on the first run.
     */
    const named = field.label || (field.type === 'collection' && field.item_label)

    if (!named) {
      fail(
        `${component.path}.${field.id}`,
        'component field with no label. It appears in the customiser unnamed. ' +
          '(A collection may use `item_label` instead.)',
      )
    }
  }
}

/* ──────────────────────────────────────────────────────────────────────────── */

if (problems.length > 0) {
  console.error(`\n✖ check-settings — ${problems.length} problem(s)\n`)
  for (const problem of problems) console.error(`  ${problem}\n`)
  console.error(
    '  Whether a default is SENSIBLE, and whether a setting does the right thing when\n' +
      '  toggled, need a real store — /docs/MANUAL-QA.md section 5.\n',
  )
  process.exit(1)
}

const fieldCount = components.reduce((n, c) => n + (c.fields?.length ?? 0), 0)

console.log(
  `✔ check-settings — ${declared.size} settings declared and read, ` +
    `${components.length} components with ${fieldCount} fields, ` +
    `${UNREACHABLE_OK.size} setting(s) excused as unreachable.`,
)

if (OPEN_FINDINGS.size > 0) {
  console.log(`\n⚠ ${OPEN_FINDINGS.size} open finding(s), awaiting a ruling — not a failure:\n`)
  for (const [id, note] of OPEN_FINDINGS) console.log(`  · ${id}\n      ${note}\n`)
}
