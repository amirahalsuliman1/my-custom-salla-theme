#!/usr/bin/env node
/**
 * T-1.07 — lint the files a change touches, and only those.
 *
 * The pre-commit hook gets this behaviour from lint-staged. CI needs it too, and
 * this is the shared implementation.
 *
 * WHY RATCHET RATHER THAN LINT EVERYTHING. `src/` is upstream's scaffold. A
 * full-repo run reports 443 SCSS problems and 80 JS problems, none of them this
 * theme's doing. Gating CI on that number leaves two options — rewrite the whole
 * scaffold inside a Phase 1 task, or switch lint off — and both are worse than
 * the third: lint what you touch. It also lands the incentive in the right place.
 * Adopting an upstream file under technique A means editing it, which means it
 * gets linted, which is exactly when its quality becomes the theme's problem.
 *
 * Usage:
 *   node scripts/lint-changed.mjs                 # staged + unstaged vs HEAD
 *   node scripts/lint-changed.mjs <base>          # everything since <base>
 *   node scripts/lint-changed.mjs <base> <head>
 */

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const [base, head = 'HEAD'] = process.argv.slice(2)

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()

/** Files changed in the range, or in the working tree when no base is given. */
function changedFiles() {
  if (base) {
    // Three-dot: what the branch changed, ignoring what landed on the base since.
    const range = git('merge-base', base, head)
    return git('diff', '--name-only', '--diff-filter=ACMR', range, head).split('\n')
  }

  const tracked = git('diff', '--name-only', '--diff-filter=ACMR', 'HEAD').split('\n')
  const untracked = git('ls-files', '--others', '--exclude-standard').split('\n')
  return [...tracked, ...untracked]
}

const changed = [...new Set(changedFiles())].filter((f) => f && existsSync(f))

const matches = (patterns) => (file) => patterns.some((re) => re.test(file))

const groups = [
  {
    name: 'stylelint',
    files: changed.filter(matches([/\.scss$/])),
    run: (files) => ['npx', ['stylelint', ...files]],
  },
  {
    name: 'eslint',
    files: changed.filter(
      // `tests/` is T-1.09's and is theme-authored throughout, so it is linted
      // like the rest of it rather than ratcheted in gradually.
      matches([
        /^src\/assets\/js\/.+\.js$/,
        /^scripts\/.+\.mjs$/,
        /^tests\/.+\.mjs$/,
        /\.config\.(js|mjs)$/,
      ]),
    ),
    run: (files) => ['npx', ['eslint', '--max-warnings', '0', ...files]],
  },
  {
    name: 'locales',
    // Validated as a pair, so the file list is a trigger rather than an argument.
    files: changed.filter(matches([/^src\/locales\/.+\.json$/])),
    run: () => ['node', ['scripts/check-locales.mjs']],
  },
]

if (!changed.length) {
  console.log('lint-changed: nothing changed')
  process.exit(0)
}

let failed = false

for (const group of groups) {
  if (!group.files.length) continue

  console.log(
    `\n▸ ${group.name} — ${group.files.length} file${group.files.length === 1 ? '' : 's'}`,
  )
  const [command, args] = group.run(group.files)

  try {
    execFileSync(command, args, { stdio: 'inherit' })
  } catch {
    failed = true
  }
}

if (failed) {
  console.error('\n✗ lint-changed failed')
  process.exit(1)
}

console.log('\n✓ lint-changed passed')
