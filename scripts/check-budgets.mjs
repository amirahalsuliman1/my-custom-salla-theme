#!/usr/bin/env node
/**
 * T-1.08 — enforce the byte budgets recorded in /docs/BUDGETS.md.
 *
 * Run after a production build:
 *   pnpm run production && node scripts/check-budgets.mjs
 *
 * The numbers are parsed straight out of the fenced JSON block in BUDGETS.md
 * rather than duplicated here, so the documented budget and the enforced budget
 * cannot drift apart. A budget that disagrees with its own documentation is
 * worse than no budget, because someone will trust the wrong one.
 *
 * Gzip is the unit. It is the conservative floor — if the CDN serves brotli the
 * real figures are 25–30% smaller — and whether it does is Salla's decision, not
 * the theme's, so the theme budgets against the weaker guarantee.
 *
 * This enforces section 3 of BUDGETS.md only. LCP, INP, CLS and WCAG conformance
 * need a rendered storefront with real products and merchant settings, which a CI
 * runner building a theme package does not have. BUDGETS.md section 4 says which
 * task carries each of those instead.
 */

import { readFileSync, existsSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BUDGETS_DOC = 'docs/BUDGETS.md'
const BUILD_DIR = 'public'

const KB = (bytes) => `${(bytes / 1024).toFixed(1)} KB`

/** Pull the single fenced ```json block out of BUDGETS.md. */
function readBudgets() {
  const markdown = readFileSync(join(ROOT, BUDGETS_DOC), 'utf8')
  const block = markdown.match(/```json\n([\s\S]*?)```/)

  if (!block) {
    throw new Error(`no fenced json block found in ${BUDGETS_DOC} — the budgets live there`)
  }

  return JSON.parse(block[1])
}

/** Compressed size of a built asset, or null when it was not emitted. */
function gzipSize(file) {
  const path = join(ROOT, BUILD_DIR, file)
  if (!existsSync(path) || !statSync(path).isFile()) return null
  return gzipSync(readFileSync(path), { level: 9 }).length
}

const budgets = readBudgets()
const rows = []
const failures = []

for (const asset of budgets.assets) {
  const size = gzipSize(asset.file)

  if (size === null) {
    // A missing asset is a build problem, not a budget pass. Say so rather than
    // scoring an absent file as zero bytes.
    failures.push(`${asset.file} — not found in ${BUILD_DIR}/; was the production build run?`)
    continue
  }

  const overCeiling = size > asset.ceiling
  if (overCeiling) {
    failures.push(
      `${asset.file} — ${KB(size)} exceeds its ceiling of ${KB(asset.ceiling)} by ${KB(size - asset.ceiling)}`,
    )
  }

  rows.push({
    file: asset.file,
    size,
    ceiling: asset.ceiling,
    target: asset.target,
    state: overCeiling ? 'OVER' : size > asset.target ? 'above target' : 'at target',
  })
}

// Aggregates: the bytes a page actually pays on first load, which no single
// per-file budget can express.
for (const [name, group] of Object.entries(budgets.aggregate ?? {})) {
  const sizes = group.files.map((file) => ({ file, size: gzipSize(file) }))
  const missing = sizes.filter((entry) => entry.size === null)

  if (missing.length) {
    failures.push(`${name} — missing ${missing.map((entry) => entry.file).join(', ')}`)
    continue
  }

  const total = sizes.reduce((sum, entry) => sum + entry.size, 0)
  const overCeiling = total > group.ceiling

  if (overCeiling) {
    failures.push(
      `${name} — ${KB(total)} exceeds its ceiling of ${KB(group.ceiling)} by ${KB(total - group.ceiling)}`,
    )
  }

  rows.push({
    file: `${name} (${group.files.join(' + ')})`,
    size: total,
    ceiling: group.ceiling,
    target: group.target,
    state: overCeiling ? 'OVER' : total > group.target ? 'above target' : 'at target',
  })
}

const width = Math.max(...rows.map((row) => row.file.length), 10)

console.log(`Byte budgets — ${budgets.compression}, from ${BUDGETS_DOC}\n`)
for (const row of rows) {
  console.log(
    `  ${row.file.padEnd(width)}  ${KB(row.size).padStart(9)}  ceiling ${KB(row.ceiling).padStart(9)}  target ${KB(row.target).padStart(9)}  ${row.state}`,
  )
}

if (failures.length) {
  console.error(
    `\n✗ budget check failed — ${failures.length} breach${failures.length === 1 ? '' : 'es'}:\n`,
  )
  for (const failure of failures) console.error(`  · ${failure}`)
  console.error(
    `\nRaising a ceiling to make this pass is how budgets die. The first question is what was added.\n`,
  )
  process.exit(1)
}

const aboveTarget = rows.filter((row) => row.state === 'above target')
console.log(`\n✓ every asset within its ceiling`)
if (aboveTarget.length) {
  console.log(
    `  ${aboveTarget.length} still above the Phase 8 target — T-8.01 and T-8.03 own closing that gap.`,
  )
}
