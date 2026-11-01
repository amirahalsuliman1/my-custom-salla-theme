/**
 * Salla rejected the theme on 2026-11-01 because its archive was 18.80 MB against
 * a 1 MB limit for public themes. The archive is what `git archive` produces, so
 * .gitattributes decides its size, and this holds the line. GitHub's zipball adds
 * a top-level folder to every path, so the budget leaves room under the limit.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

const BUDGET = 950_000

const archive = format => execFileSync(
  'git',
  ['archive', '--worktree-attributes', `--format=${format}`, 'HEAD'],
  { maxBuffer: 64 * 1024 * 1024 },
)

test('the release archive stays under the public theme limit', () => {
  const size = archive('zip').length
  assert.ok(size < BUDGET, `the archive is ${size} bytes; the budget is ${BUDGET}`)
})

test('the archive keeps what the theme runs on and drops the rest', () => {
  const names = execFileSync('tar', ['-t'], { input: archive('tar'), maxBuffer: 64 * 1024 * 1024 }).toString().split('\n')
  for (const needed of ['twilight.json', 'package.json', 'webpack.config.js', 'public/app.js', 'public/app.css', 'src/views/layouts/master.twig', 'src/locales/ar.json', 'scripts/split-css.mjs', 'scripts/extract-critical.mjs']) {
    assert.ok(names.includes(needed), `${needed} is missing from the archive`)
  }
  for (const prefix of ['docs/', 'screenshots/', 'help/', 'tests/']) {
    assert.ok(!names.some(name => name.startsWith(prefix)), `${prefix} is in the archive`)
  }
})
