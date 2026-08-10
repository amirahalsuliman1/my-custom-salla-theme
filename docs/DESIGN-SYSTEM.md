# DESIGN SYSTEM — the Phase 2 review gate

**T-2.16.** Sign-off before any page consumes the system.
Audited 2026-08-10 against the tree at that date.

**GATE CLOSED — 2026-08-10.** All five of doc 17's Phase 2 lines are signed; the
fifth, *component inventory approved*, is the project owner's own signature,
given on 2026-08-10. Nothing in this document is awaiting a decision. It is now
a **record**, not a checklist: later work reads §1 for what exists, §2 for the
state a component already has, and §6 for the limits it must not re-discover.
Changing the system after this point changes this document too.

---

## 0. What this document is, and what "demonstrated" can mean here

T-2.16's first acceptance criterion is *"every component demonstrated in all nine
states"*. **A live styleguide page is not available to this theme, and that is a
platform fact rather than a shortcut.** Salla's page set is fixed — the
breadcrumb API in `@salla.sa/twilight` enumerates it and `src/views/pages`
mirrors it exactly — so a `pages/styleguide/index.twig` would never be rendered
by anything. That is the same finding recorded as OP-3 when the stories feed
needed a route and could not have one.

So *demonstrated* here means: **for every component and every state, the selector
or attribute that implements it is named, with the file it lives in, and the
claim is checkable by reading that file.** Where a state is not implemented, the
row says so and says why. **No row in this document asserts a state that the code
does not contain** — every ✅ below was verified by reading the file named beside
it, not from the task's own notes.

The live pass — a real browser, a real screen reader, real devices — is
**T-8.06** (accessibility audit), **T-8.09** (cross-breakpoint regression) and
**T-8.11** (cross-browser and device testing). This gate is a code-level review
and does not claim to be the other thing.

---

## 1. The system, as built

| # | Component | Files | Task |
|---|---|---|---|
| 1 | Colour tokens | `01-settings/global.scss`, `tailwind.config.js` | T-2.01, corrected by T-2.17 |
| 2 | Typography | `01-settings/fonts.scss`, `tailwind.config.js` | T-2.02 |
| 3 | Spacing · radius · elevation · motion | `tailwind.config.js`, `01-settings/global.scss`, `02-generic/motion.scss` | T-2.03, T-2.19 |
| 4 | Icon | `components/ui/icon.twig`, `03-elements/icons.scss` | T-2.04 |
| 5 | Button | `components/ui/button.twig`, `04-components/buttons.scss` | T-2.05, T-2.11 |
| 6 | Field — text, phone, textarea | `components/ui/input.twig`, `04-components/forms.scss` | T-2.06, T-2.16 |
| 7 | OTP | `components/ui/otp.twig`, `js/partials/otp.js` | T-2.07 |
| 8 | Checkbox · radio · switch | `components/ui/choice.twig`, `04-components/forms.scss` | T-2.08 |
| 9 | Quantity | `js/partials/quantity.js`, `04-components/forms.scss` | T-2.09 |
| 10 | Overlay primitive — sheet / dialog | `components/ui/bottom-sheet.twig`, `js/partials/bottom-sheet.js`, `04-components/bottom-sheet.scss` | T-2.10 |
| 11 | Confirmation dialog | `components/ui/dialog.twig`, `04-components/dialog.scss` | T-2.11 |
| 12 | Toast | `05-utilities/toast.scss`, `js/partials/toast.js` | T-2.12 |
| 13 | Skeleton | `components/ui/skeleton.twig`, `04-components/skeleton.scss` | T-2.13 |
| 14 | Empty state | `components/ui/empty-state.twig`, `04-components/empty-state.scss` | T-2.14 |
| 15 | Card shell | `04-components/cards.scss` | T-2.15 |
| 16 | Section panel | `04-components/section-panel.scss` | T-2.18 |
| 17 | Focus indicator | `02-generic/focus.scss` | T-2.01 |

Items 1–3 and 17 are layers, not components: they have no states of their own and
appear in the matrix only as the source of everybody else's.

---

## 2. The nine-state matrix

Doc 04's matrix, verbatim: **Default · Hover · Pressed · Focus · Disabled ·
Loading · Success · Error · Empty**, each marked *"implement consistently"*.

`—` means the state has no meaning for that component, with the reason given
below the table. It is not a synonym for "missing".

| Component | Default | Hover | Pressed | Focus | Disabled | Loading | Success | Error | Empty |
|---|---|---|---|---|---|---|---|---|---|
| **Button** | ✅ 6 variants | ✅ `hover:opacity-80`; `.btn--ghost` under `@media (hover: hover)` | ✅ `:active` translateY, excluded on both disabled forms | ✅ `button:focus-visible` | ✅ `[aria-disabled="true"]` | ✅ `[aria-busy]` + `role="status"` | ✅ `.btn--success` | ✅ `.btn--danger`, 6.36:1 | — a |
| **Field** | ✅ `.field__input` | — b | — c | ✅ `input:focus-visible` | ✅ `.field--disabled` + native attr **(added by this gate)** | — d | — j | ✅ `.field--invalid` + `aria-invalid` + `role="alert"` | ✅ label + placeholder |
| **OTP** | ✅ `.otp__digit` | — b | — c | ✅ inherited | ✅ inherited | — d | — j | ✅ inherited | ✅ |
| **Choice** | ✅ + `:checked` | — b | — c | ✅ `input:focus-visible` | ✅ `.choice--disabled` | — d | — e/j | ✅ via the field's message | — f |
| **Quantity** | ✅ technique C | — b | ✅ native buttons | ✅ ⚠️ F6 | ✅ platform clamps to `min` | — d | — e | ✅ platform | — f |
| **Sheet / dialog** | ✅ two variants | ✅ close button | ✅ close button | ✅ trapped, returned, `Esc` | — g | — g | — g | — g | — g |
| **Toast** | ✅ | ✅ pauses the timer | — c | ✅ pauses the timer | — g | — h | ✅ measured | ✅ measured | — g |
| **Skeleton** | ✅ | — i | — i | — i | — i | ✅ **it is this state** | — i | — i | — i |
| **Empty state** | ✅ | ✅ its action | ✅ its action | ✅ its action | — g | — g | — g | — g | ✅ **it is this state** |
| **Card** | ✅ | ✅ `.card--interactive` shadow | ⚠️ F4 | ✅ `:focus-within` ring | — g | ✅ via skeleton | — g | — g | ✅ via empty state |

**Why the dashes:**

- **a** — a button has no "empty". Recorded under T-2.05 in `/docs/DERIVED-DECISIONS.md`.
- **b** — **no artboard draws a hover state on a form control, and none is added.** The field's boundary is already `--border-interactive` at 6.00:1, so hover would have nothing to strengthen. Deliberate, and listed as **F3**.
- **c** — a text field, an OTP box and a toast have no pressed state; nothing about them is pushed.
- **d** — loading belongs to the *form*, not to one field: the submit button carries `aria-busy` and the announcement. Putting a spinner on a field would say the field is loading, which is never what is meant.
- **e** — success and error on a selection control are the *form's* validation message, which is the field component's `role="alert"` region. A green checkbox says nothing a message does not.
- **f** — an "empty" checkbox is its unchecked state, which is Default.
- **g** — an overlay, a toast and a card are containers. Their contents carry these states; the container carrying them too would be two components disagreeing.
- **h** — a toast never loads; it appears when its message already exists.
- **i** — a skeleton *is* a state. It has no states of its own, and it is deliberately `aria-hidden` so it has no interactive ones either.
- **j** — **no form control has a success state, by ruling.** The project owner closed this on 2026-08-10: no artboard draws one, and **only the error needs distinguishing** — a field that is simply correct looks like a field. It is an accepted constraint (**AC-2**), not an unimplemented row, and this theme does not owe it a green border.

---

## 3. Contrast — validated

The full table lives in `/docs/DERIVED-DECISIONS.md` and was **recomputed in
full** under T-2.17 when three inferred token values were replaced by measured
ones. Every row passes, and every row passes by more than it did before. Pairs
added since, both verified here:

| Pair | Ratio | Threshold | Verdict |
|---|---|---|---|
| white on `--color-error` `#C20013` | **6.36:1** | 4.5:1 (1.4.3) | ✅ — and it replaced upstream's `bg-red-400`, which was **3.05:1** |
| `--text-secondary` on `--surface-card`, overlay titles | **6.00:1** | 4.5:1 | ✅ |
| `--color-success` `#16AE26` on `--accent-success-soft` `#E8F7E9` | 2.66:1 | 3:1 (1.4.11) | ✅ **exempt** — the check is redundant with the message beside it at 5.90:1; 1.4.11 binds graphics *required* to understand the content |

**One claim in this section is machine-enforced rather than reviewed.** `no raw
hex outside the token layer` is a stylelint rule with `01-settings` exempted, and
`lint:changed` runs it on every file a commit touches. A full-repo run today
reports 36 raw-hex occurrences, **all of them in upstream files the theme has
never adopted** — `common.scss`, `reset.scss`, `tooltip.scss`,
`03-elements/{buttons,form,radio,radio-images}.scss`,
`04-components/{gifting,home-blocks,menus,product,slider,user-pages,virtooal}.scss`,
`05-utilities/swal.scss`. **No theme-authored stylesheet contains one**, and the
ratchet makes that a build failure rather than a promise.

---

## 4. Keyboard pass

Verified by reading the markup and the scripts. Live-input verification is T-8.06.

| Component | What receives focus | Order | Escape / dismissal | Announced |
|---|---|---|---|---|
| Button | the button or link itself | source order | — | `aria-busy` + `role="status"` while loading; `aria-disabled` stays reachable **on purpose**, so a keyboard user learns the control exists |
| Field · OTP · Choice | the native control | source order | — | label, `aria-describedby` hint, `role="alert"` error |
| OTP | each box, and paste fills all of them | left-to-right within the row | — | `theme.form.otp_digit` names each box's position |
| Quantity | the platform's two buttons and the input | platform's | — | `role="status"` announces the new number — the one thing the platform did not do |
| Sheet · dialog | the close button, via `autofocus` | trapped by `showModal()` | `Esc` and backdrop click, both native; focus returns to the opener | `role="dialog"`, `aria-modal`, labelled by its title |
| Confirmation dialog | the close button | dismiss before confirm, so **the destructive action is the last thing reached** | as above | as above |
| Toast | its close button, `sr-only` until focused | after the page's content | the close button; the timer pauses while focused or hovered | `role="alert"` + `aria-live="polite"` from the library, verified in its source |
| Skeleton | **nothing, deliberately** | — | — | one `role="status"` sentence for the region, bars `aria-hidden` |
| Empty state | its action | source order | — | icon is `aria-hidden`; the message is ordinary text |
| Card | **exactly one** stretched link | one stop per card | — | the ring is drawn on the card via `:focus-within`, so the indicator surrounds what will actually activate |

**The indicator itself is `02-generic/focus.scss`**, written at element-level
specificity `(0,1,1)` so it beats `reset.scss`'s `a:focus { outline: none }`, and
imported after it. It uses `:focus-visible`, so it appears for keyboard input and
not on mouse click. Its colour is ink, never the merchant's brand colour, so no
palette setting can make it invisible.

---

## 5. Responsive rules

Mobile-first since T-1.06: `from-tablet` / `from-laptop` / `from-desktop`
min-width mixins, with `max-width` queries failing the build outside the one file
that defines the shim. Derivation follows B4's five rules and adds nothing the
mobile design does not have.

| Component | Above tablet | Rule |
|---|---|---|
| Sheet | becomes a centred dialog, capped at 28rem | doc 10, B4 |
| Toast | capped at 24rem, stays centred | B4 — bounded, not full-bleed |
| Customer layout | capped at `max-w-3xl`, centred | B4 — upstream's own cap, kept |
| Footer | multi-column | B4 |
| Cards, grids | gain columns; **the card itself is unchanged** | B4 |

**Nothing in the system hides on one breakpoint and appears on another.** The one
element that did — the account sidebar, `hidden lg:block` — was removed in T-3.02
for exactly that reason.

---

## 6. Findings

| # | Finding | Status |
|---|---|---|
| **F1** | **The field had no disabled state** while `.choice--disabled` had had one since T-2.08, and `input.twig` had no `disabled` parameter at all — so the state was unreachable, not merely unstyled | ✅ **fixed in this gate.** One parameter, one class, and deliberately the *same two declarations* as `.choice--disabled` rather than a second idea about what "off" looks like |
| **F2** | **No form control has a "success" state.** Doc 04's matrix asks for one; no artboard draws one | ✅ **CLOSED 2026-08-10 by the project owner: ruled `—` for this theme.** Not a gap and not deferred work — an accepted constraint, recorded as **AC-2** in `/docs/DERIVED-DECISIONS.md`. See §2's note **e/j** |
| **F3** | **No form control has a hover state**, deliberately: no artboard draws one, and the boundary is already 6.00:1 with nothing to strengthen | **accepted** — recorded here so it is not later read as an oversight |
| **F4** | **A card has no pressed state.** It is a link; the browser's own active feedback and the `:focus-within` ring cover it | **accepted** — implementing one would mean animating a whole card under a thumb |
| **F5** | **The nine states cannot be demonstrated on a live page**, because this platform has no route a styleguide could occupy — the OP-3 finding again | **structural.** §2 is the demonstration this theme can have |
| **F6** | **The focus ring cannot cross into a `salla-*` shadow root.** Recorded in `focus.scss` when it was written, and it is a *system-level* limit rather than one component's: `salla-quantity-input`, `salla-tel-input`, `salla-datetime-picker` and `salla-user-menu` are all adopted or about to be | **carried to every task that adopts a Salla component**, and to T-8.06. Focus styling there has to come through the component's exposed CSS parts — technique C — and each such task owns proving it |
| **F7** | **`.btn`'s hover is `opacity-80` on the whole button**, upstream's, rather than a colour change. On a filled destructive button that dims the label along with the fill; the pair stays at 6.36:1 because both dim together | **accepted**, and noted because it is the one hover in the system that is not a token change |

---

## 7. Doc 17 — Phase 2 checklist

| Item | Signed | Evidence |
|---|---|---|
| Design tokens documented | ✅ | §1 items 1–3; `/docs/DERIVED-DECISIONS.md` contrast table, recomputed in full under T-2.17 |
| Reusable components identified | ✅ | §1 — seventeen entries, each with its files and its task |
| States documented | ✅ | §2 — the full nine-state matrix, every cell traceable to a selector or an attribute, with F1 fixed and F2–F4 recorded rather than hidden |
| Responsive rules defined | ✅ | §5, and the mobile-first mixins the build enforces |
| **Component inventory approved** | ✅ **signed by the project owner, 2026-08-10** | Approved as it stands — the seventeen entries of §1 with their files and their tasks. **No finding in §6 was open at the point of signature:** F1 was fixed by this task, F2 closed by ruling on 2026-08-10, and F3–F7 are accepted constraints or limits carried to the tasks that own them. The signature approves the inventory, **not** the six things §8 says this gate does not claim |

---

## 8. What this gate does not claim

- It is a **code-level** review. No browser, no screen reader, no device was run
  against the system; that is T-8.06, T-8.09 and T-8.11.
- It reviews the **design system**, not the pages built ahead of it. Phase 3 and
  Phase 4 work that ran out of order at the owner's instruction — the header, the
  footer, the Home sections — is reviewed by its own tasks and by T-8.09.
- Components that are **technique C over a Salla web component** are reviewed as
  far as the light DOM reaches. What happens inside a shadow root is F6.
