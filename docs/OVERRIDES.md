# OVERRIDES — shadowed upstream files

**Task:** T-1.02 · **Status:** register empty, and that is the correct starting state.

This file is the single record of every upstream Twilight file this theme shadows. If a file is not in the register below, the theme does not own it and an SDK upgrade may replace it freely. If a file **is** in the register, someone must reconcile it by hand on every upgrade. Keeping the register short is the point.

---

## 1. Baseline

| | |
|---|---|
| Upstream repository | `SallaApp/theme-raed` |
| Git remote | `upstream` |
| **Pinned baseline tag** | **`1.365.0`** |
| Verified | 2026-08-05, by tree comparison — `git rev-parse d5ca1cb:src` matches `1.365.0:src` byte for byte |

> **Do not trust `package.json`.** It declares `"version": "1.358.0"`. That is wrong. The scaffold's source tree is identical to upstream `1.365.0`, not `1.358.0`. Diffing against `1.358.0` produces 46 files of phantom drift that has nothing to do with this theme. Always diff against `1.365.0`.

One nuance worth knowing before you diff: upstream `1.365.0`, `1.366.0` and `1.367.0` have **identical** `src/` and `twilight.json`. The releases differ only outside the source tree. Real source drift starts at `1.368.0`.

If the `upstream` remote is missing on a fresh clone:

```bash
git remote add upstream https://github.com/SallaApp/theme-raed.git
git fetch upstream
```

---

## 2. Override technique policy

Three mechanisms, in strict order of preference. **Always use the highest letter that is sufficient.** Escalating from C to B, or B to A, requires a one-line justification in the PR description.

### (C) CSS / part styling — preferred

Style the Salla web component from outside, through its exposed CSS parts and custom properties. Nothing is shadowed, nothing is forked, and the component keeps receiving upstream fixes.

Use for: restyling `salla-button`, `salla-quantity-input`, `salla-filters`, `salla-modal`, `salla-datetime-picker`, and every other `salla-*` element whose markup we do not need to change.

**A technique-C change adds no row to the register.** That is precisely why it is preferred.

### (B) Web component extension

Subclass the custom element in JS when C cannot reach what needs changing — new markup, new behaviour, different data binding.

Use for: `custom-salla-product-card` extending `salla-product-card`, and `custom-wishlist-card`. Extend the upstream class; do not copy its body into the theme. A subclass inherits upstream fixes to the methods it does not override.

**Adds a row to the register.**

### (A) Twig replacement — last resort

Copy the upstream `.twig` into the theme and edit it. The copy is frozen at the moment it is taken and receives no upstream fix ever again.

Use for: page shells and layouts — `master.twig`, `customer.twig`, page templates under `src/views/pages/`.

**Adds a row to the register, and is the expensive kind of row.** Every technique-A file is permanent manual reconciliation work on every upgrade.

---

## 3. The register

| Path | Technique | Upstream version at override | Task | Last reconciled with upstream |
|---|---|---|---|---|
| `twilight.json` | A | `1.365.0` | T-1.03 — the theme manifest is necessarily theme-owned: identity, feature flags and section registrations are the theme's own configuration, not upstream code we could have left alone. Recorded because an upgrade that adds a platform feature flag or a new upstream section will not reach us | — |

**On `twilight.json`.** It is a technique-A row by definition rather than by choice — there is no C or B path to a manifest. The reconciliation it obliges is real but narrow: on each upgrade, diff upstream's manifest for **newly added feature flags and component registrations**, and decide for each whether the design wants it. Do not merge upstream's manifest over ours; T-1.03 deliberately removed nine flags and five sections, and a blind merge restores every one of them.

**Column definitions**

- **Path** — repo-relative path of the shadowing file, e.g. `src/views/layouts/master.twig`.
- **Technique** — `A`, `B` or `C`. A row should almost never be `C`; if it is, say in the Task column why the row exists at all.
- **Upstream version at override** — the upstream tag whose content the override was written against. Usually `1.365.0` for the first wave. This is the *left-hand side* of every future diff for this file, and it changes only when the row is reconciled.
- **Task** — the backlog task ID that introduced or last changed the override, e.g. `T-3.01`.
- **Last reconciled with upstream** — ISO date of the last time someone diffed this file against a newer upstream tag and either confirmed no change or merged the change in. Empty until the first upgrade.

**Rules**

1. A PR that shadows a file and does not add its row is incomplete. Reviewers reject it.
2. One row per file. If one task shadows four templates, that is four rows.
3. When an override is deleted, delete the row. Do not keep tombstones — git history holds them.
4. After reconciling a row during an upgrade, update **both** its version column and its date column.
5. **A derived screen goes in [DERIVED-DECISIONS.md](DERIVED-DECISIONS.md) as well.** Screens built without an artboard — search results, category listing, empty states, 404, and every layout above the 393pt breakpoint — carry visual decisions that no design specifies. Those decisions are recorded there. If such a screen *also* shadows an upstream Twig, it needs an entry in **both** files: a row here for the shadowed file, and rows there for the visual calls. The two registers answer different questions — this one asks *what will an SDK upgrade break*, that one asks *what did we make up* — so neither substitutes for the other.

---

## 4. Adding an override

1. Confirm C is genuinely insufficient. Write the reason in the PR description.
2. Copy the file from the pinned baseline, never from `upstream/master` and never from memory:
   ```bash
   git show 1.365.0:src/views/layouts/master.twig > src/views/layouts/master.twig
   ```
   Commit that untouched copy **first**, then edit it in a second commit. This makes the theme's actual delta reviewable in isolation, forever.
3. Add the row to the register in the same PR.

---

## 5. SDK upgrade procedure

Run this whenever the theme moves to a newer upstream release. `<NEW>` is the target tag.

**Step 1 — fetch and pick the target**

```bash
git fetch upstream --tags
git tag -l '1.*' | sort -V | tail -5
```

**Step 2 — does the upgrade touch anything we shadow?**

This is the whole question. Compare the baseline against the target and intersect with the register:

```bash
git diff --name-only 1.365.0..<NEW> -- src twilight.json
```

Cross-reference the output against the Path column. Files in the output but **not** in the register need no action — nothing shadows them, so the upgrade carries them for free. Files in **both** lists are the work.

Worked example, verified 2026-08-05 against `upstream/master`:

```
$ git diff --name-only 1.365.0..upstream/master -- src twilight.json
src/assets/js/product.js
src/views/components/home/brands.twig
```

Two files drifted. The register is empty, so neither is shadowed, so this upgrade needs zero manual reconciliation.

**Step 3 — reconcile each shadowed file that drifted**

For each such row, read what upstream changed:

```bash
git diff <VERSION-IN-REGISTER>..<NEW> -- <PATH>
```

Apply the upstream change into our copy by hand. Do **not** check out the upstream file over ours — that silently discards the theme's own edits.

Then read our resulting delta against the new upstream, which is what the next upgrade will start from:

```bash
git diff <NEW>..HEAD -- <PATH>
```

If that delta no longer contains a change we still need, delete the override entirely and remove its row. Overrides that have quietly become no-ops are the cheapest wins available in this file.

**Step 4 — update the register**

For every row touched: set the version column to `<NEW>`, set the date column to today. For rows whose file did not drift, update only the date — that records "checked, no change", which is different from "not checked".

**Step 5 — update this document's baseline**

Once every row reads `<NEW>`, change the pinned baseline in §1 to `<NEW>` and note the date. Until then the baseline stays where it is; a half-migrated register with a moved baseline is worse than no register.

**Step 6 — rebuild and verify**

```bash
pnpm install
pnpm production
```

The build must succeed, and `git status` must show no unexpected change outside `public/`.

---

## 6. PR compliance check

Any reviewer can verify the register is complete with one command. Every path it prints must appear in the register:

```bash
git diff --name-only 1.365.0 HEAD -- src twilight.json
```

Silence means the theme shadows nothing. Output that is absent from the register above means the register is stale and the PR is not mergeable.
