/**
 * The account audit (2026-10-14) — the profile page, its calendar and the
 * floating menu, against `My Account Page.pdf`, `Desktop My Account Page.svg`
 * and the ten «Floating Menu» artboards.
 *
 * Most of these pin a stylesheet or a template, read as source, because the
 * fault was a rule that matched nothing or a breakpoint that was missing — a
 * build cannot catch either. The two script changes are run: the date
 * announcement against flatpickr's alt-input shape, and the menu's Esc path
 * against the outside-click listener `salla-user-menu` adds on `window`.
 */
import { test, describe, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs'

const read = (path) => fs.readFileSync(path, 'utf8')

const PROFILE_SCSS = read('src/assets/styles/04-components/profile.scss')
const MENU_SCSS = read('src/assets/styles/04-components/floating-menu.scss')
const PROFILE_TWIG = read('src/views/pages/customer/profile.twig')
const HEADER_TWIG = read('src/views/components/header/header.twig')
const MENU_JS = read('src/assets/js/partials/floating-menu.js')
const AR = JSON.parse(read('src/locales/ar.json'))
const EN = JSON.parse(read('src/locales/en.json'))

/** The body of the first rule whose selector is exactly `selector`. */
function rule(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = source.match(new RegExp(`(?:^|[}\\n])\\s*${escaped}\\s*\\{([^}]*)\\}`))
  return match ? match[1] : null
}

/** The text of the first `@include from-laptop { … }` block after `anchor`. */
function laptopBlockAfter(source, anchor) {
  const start = source.indexOf(anchor)
  assert.notEqual(start, -1, `anchor not found: ${anchor}`)
  const at = source.indexOf('@include from-laptop', start)
  assert.notEqual(at, -1, `no from-laptop block after ${anchor}`)
  let depth = 0
  for (let i = source.indexOf('{', at); i < source.length; i += 1) {
    if (source[i] === '{') depth += 1
    if (source[i] === '}') depth -= 1
    if (depth === 0) return source.slice(at, i + 1)
  }
  return ''
}

describe('profile — the deactivate card (#0)', () => {
  test('no rule still names the stale -delete-user class on its own', () => {
    for (const line of PROFILE_SCSS.split('\n')) {
      if (line.includes('s-user-settings-section-delete-user') && !line.trim().startsWith('*')) {
        assert.match(line, /s-user-settings-section-deactivate-user/, line)
      }
    }
  })

  test('promotional messages is hidden as the section before deactivate', () => {
    assert.match(
      PROFILE_SCSS,
      /\.profile-settings \.s-user-settings-section:has\(\+ :is\(\.s-user-settings-section-deactivate-user, \.s-user-settings-section-delete-user\)\)\s*\{\s*@apply hidden;/,
    )
  })

  test('the section icons are hidden and the tile is not padded twice', () => {
    assert.match(rule(PROFILE_SCSS, '.profile-settings .s-list-tile-item-icon'), /@apply hidden;/)
    assert.match(rule(PROFILE_SCSS, '.profile-settings .s-list-tile-item'), /p-0/)
    assert.match(
      rule(PROFILE_SCSS, '.profile-settings .s-user-settings-wrapper .s-user-settings-section'),
      /background-color:\s*transparent/,
    )
  })

  test('stacked below 1024px, one row with a 22.5rem button from 1024px', () => {
    const block = PROFILE_SCSS.slice(
      PROFILE_SCSS.indexOf('.profile-settings :is(.s-user-settings-section-deactivate-user'),
    )
    assert.match(block, /\.s-list-tile-item-action\s*\{\s*@apply mt-3;\s*flex: 1 1 100%;/)
    const laptop = laptopBlockAfter(block, '.s-button-btn')
    assert.match(laptop, /flex-nowrap/)
    assert.match(laptop, /\.s-list-tile-item-action\s*\{\s*@apply mt-0;\s*flex: 0 0 auto;/)
    assert.match(laptop, /\.s-button-btn\s*\{\s*inline-size: 22\.5rem;/)
  })

  test('the pink fill and red edge come from tokens', () => {
    const block = PROFILE_SCSS.slice(
      PROFILE_SCSS.indexOf('.profile-settings :is(.s-user-settings-section-deactivate-user'),
    )
    assert.match(block, /background-color: var\(--accent-soft\);/)
    assert.match(block, /border: 1px solid var\(--color-error\);/)
  })
})

describe('profile — the form (#9, #10, #84, #85)', () => {
  test('gender is two equal columns in DOM order, male first', () => {
    const body = rule(PROFILE_SCSS, '.profile-gender__options')
    assert.match(body, /@apply grid grid-cols-2 justify-items-start gap-6;/)
    assert.doesNotMatch(body, /flex-row-reverse|justify-end/)
    assert.ok(PROFILE_TWIG.indexOf("id:      'gender-male'") < PROFILE_TWIG.indexOf("id:      'gender-female'"))
  })

  test('from 1024px phone takes row 3 before email; the DOM keeps email first', () => {
    assert.match(PROFILE_TWIG, /class:\s*'profile-form__field--email'/)
    assert.match(PROFILE_TWIG, /class="profile-form__field profile-form__field--phone"/)
    assert.ok(PROFILE_TWIG.indexOf('profile-form__field--email') < PROFILE_TWIG.indexOf('profile-form__field--phone'))
    const laptop = laptopBlockAfter(PROFILE_SCSS, '.profile-form__fields {')
    assert.match(laptop, /> \.profile-form__field--email,\s*> \.profile-form__field--email ~ \*\s*\{\s*order: 1;/)
    assert.match(laptop, /> \.profile-form__field--email ~ \.profile-form__field--phone\s*\{\s*order: 0;/)
  })

  test('the avatar is centred on mobile and at the inline start from 1024px', () => {
    const block = PROFILE_SCSS.slice(PROFILE_SCSS.indexOf('.profile-avatar {'))
    assert.match(block, /^\.profile-avatar \{\s*@apply mb-6 flex justify-center;/)
    assert.match(laptopBlockAfter(block, '.profile-avatar {'), /@apply justify-start;/)
  })

  test('the save button is full width on mobile, 22.5rem at the inline end from 1024px', () => {
    const block = PROFILE_SCSS.slice(PROFILE_SCSS.indexOf('.profile-form__submit {'))
    assert.match(block, /^\.profile-form__submit \{\s*@apply mt-6 block w-full;/)
    const laptop = laptopBlockAfter(block, '.profile-form__submit {')
    assert.match(laptop, /inline-size: 22\.5rem;/)
    assert.match(laptop, /margin-inline-start: auto;/)
  })
})

describe('profile — the camera mark (#83)', () => {
  test('a bare white glyph centred on the photo, no disc', () => {
    const body = rule(PROFILE_SCSS, '.profile-avatar__badge')
    assert.ok(body)
    assert.match(body, /text-white/)
    assert.match(body, /inset: 0;/)
    assert.match(body, /margin: auto;/)
    assert.doesNotMatch(body, /rounded-full|border|background-color|inset-block-end/)
  })

  test('rendered only over a photo, at the xl step', () => {
    assert.match(
      PROFILE_TWIG,
      /\{% if user\.avatar %\}\s*<span class="profile-avatar__badge" aria-hidden="true">\s*\{% include 'components\.ui\.icon' with \{ name: 'camera', size: 'xl' \} only %\}/,
    )
  })
})

describe('profile — the birthday (#86)', () => {
  test('shows d/m/Y, submits Y-m-d, through the attributes the component maps', () => {
    assert.match(PROFILE_TWIG, /\sdate-format="Y-m-d"/)
    assert.match(PROFILE_TWIG, /\salt-input\s/)
    assert.match(PROFILE_TWIG, /\salt-format="d\/m\/Y"/)
    assert.match(PROFILE_TWIG, /\salt-input-class="s-datetime-picker-input"/)
    assert.doesNotMatch(PROFILE_TWIG, /dateFormat=/)
  })
})

describe('date announcement reads what is shown (#86)', () => {
  afterEach(() => teardownDom())

  test('with alt-input the visible d/m/Y is announced, not the hidden Y-m-d', async () => {
    const { document } = createDom({
      html: `
        <div class="profile-form__field">
          <salla-datetime-picker id="birthday">
            <div class="s-datetime-picker">
              <input type="hidden" name="birthday" class="s-datetime-picker-input flatpickr-input" value="2000-04-19">
              <input type="text" class="s-datetime-picker-input" value="19/04/2000">
            </div>
          </salla-datetime-picker>
          <span class="sr-only" role="status" aria-live="polite" data-date-status></span>
        </div>`,
      translations: { 'theme.account.date_selected': 'التاريخ المختار: :date' },
    })

    await loadFresh('src/assets/js/partials/date-picker.js')

    // flatpickr dispatches `change` on the input it was attached to — the hidden one.
    document.querySelector('input[type="hidden"]').dispatchEvent(new window.Event('change', { bubbles: true }))

    assert.equal(document.querySelector('[data-date-status]').textContent, 'التاريخ المختار: 19/04/2000')
  })

  test('without alt-input the one input is still the one read', async () => {
    const { document } = createDom({
      html: `
        <div>
          <salla-datetime-picker><div class="s-datetime-picker"><input type="text" value="2025-05-01"></div></salla-datetime-picker>
          <span data-date-status></span>
        </div>`,
      translations: { 'theme.account.date_selected': ':date' },
    })

    await loadFresh('src/assets/js/partials/date-picker.js')
    document.querySelector('input').dispatchEvent(new window.Event('change', { bubbles: true }))

    assert.equal(document.querySelector('[data-date-status]').textContent, '2025-05-01')
  })
})

describe('profile — the calendar (#87)', () => {
  test('the panel floats on the raised shadow, padding around the grid', () => {
    const body = rule(PROFILE_SCSS, '.flatpickr-calendar')
    assert.match(body, /@apply rounded-large border p-2 shadow-raised;/)
    assert.match(body, /box-sizing: content-box;/)
    assert.doesNotMatch(body, /box-shadow:\s*none/)
  })

  test('the month band is the section surface, edge to edge; weekdays stay clear', () => {
    const band = rule(PROFILE_SCSS, '.flatpickr-calendar .flatpickr-months')
    assert.match(band, /@apply -mx-2 -mt-2 mb-2 px-2;/)
    assert.match(band, /background-color: var\(--surface-section\);/)
    assert.match(rule(PROFILE_SCSS, '.flatpickr-calendar .flatpickr-weekdays'), /background-color: transparent;/)
  })

  test('the band\'s text is the page ink, over the platform\'s white', () => {
    assert.match(
      PROFILE_SCSS,
      /\.flatpickr-calendar \.flatpickr-months,\s*\.flatpickr-calendar \.flatpickr-months \*,\s*\.flatpickr-calendar \.flatpickr-weekday\s*\{\s*color: var\(--main-text-color\);/,
    )
  })

  test('the selected day keeps its 3:1 fill (T-2.20), not the drawn light disc', () => {
    assert.match(rule(PROFILE_SCSS, '.flatpickr-calendar .flatpickr-day.selected'), /background-color: var\(--surface-control\);/)
  })
})

describe('floating menu (#11, #12, #79, #80, #81, #82)', () => {
  test('the header mounts the menu without show-header', () => {
    const mount = HEADER_TWIG.match(/<salla-user-menu[^>]*>/)[0]
    assert.match(mount, /avatar-only show-trigger/)
    assert.doesNotMatch(mount, /show-header/)
  })

  test('the trigger slot carries the photo, the desktop icon and a translated name', () => {
    const slot = HEADER_TWIG.match(/<div slot="trigger">([\s\S]*?)<\/div>/)
    assert.ok(slot, 'the header passes a trigger slot')
    assert.match(slot[1], /<span class="s-user-menu-avatar-wrap"><img class="s-user-menu-trigger-avatar" src="\{avatar\}" alt="" width="40" height="40" loading="lazy"><\/span>/)
    assert.match(slot[1], /<i class="store-header__user-icon sicon-user-circle" aria-hidden="true"><\/i>/)
    assert.match(slot[1], /<span class="sr-only">\{\{ trans\('theme\.header\.account_menu'\) \}\}<\/span>/)
    assert.ok(AR.theme.header.account_menu)
    assert.ok(EN.theme.header.account_menu)
  })

  test('photo below 1024px, outline icon from 1024px', () => {
    assert.match(rule(MENU_SCSS, '.store-header__user-icon'), /@apply hidden;/)
    const laptop = laptopBlockAfter(MENU_SCSS, '.store-header__user-icon {')
    assert.match(laptop, /\.store-header__user \.s-user-menu-avatar-wrap\s*\{\s*@apply hidden;/)
    assert.match(laptop, /\.store-header__user-icon\s*\{\s*@apply inline-block text-2xl leading-none;/)
  })

  test('the fill is hover and focus only — the current page is not painted', () => {
    assert.match(MENU_SCSS, /\.s-user-menu-dropdown-item-link:hover,\s*\.s-user-menu-dropdown-item-link:focus-visible\s*\{\s*background-color: var\(--surface-section\);/)
    assert.doesNotMatch(MENU_SCSS, /\[aria-current='page'\]\s*[,{]/)
    // …but it is still announced.
    assert.match(MENU_JS, /link\.setAttribute\('aria-current', 'page'\)/)
  })

  test('row icons are hidden on mobile and shown from 1024px', () => {
    assert.match(rule(MENU_SCSS, '.s-user-menu-dropdown-item-prefix'), /@apply hidden;/)
    const laptop = laptopBlockAfter(MENU_SCSS, '.s-user-menu-dropdown-item-prefix {')
    assert.match(laptop, /\.s-user-menu-dropdown-item-prefix\s*\{\s*@apply inline-flex h-5 w-5/)
  })

  test('the pending-orders row no artboard draws is hidden by its link', () => {
    assert.match(
      MENU_SCSS,
      /\.s-user-menu-dropdown-item:has\(> \.s-user-menu-dropdown-item-link\[href\*='pending_orders'\]\)\s*\{\s*@apply hidden;/,
    )
  })

  test('desktop panel is w-60 with no caret; the caret clears the backdrop fill', () => {
    const laptop = laptopBlockAfter(MENU_SCSS, '.s-user-menu-toggler::before {')
    assert.match(laptop, /\.s-user-menu-dropdown\s*\{\s*@apply w-60;/)
    assert.match(laptop, /\.s-user-menu-toggler::before\s*\{\s*display: none;/)
    const caret = rule(MENU_SCSS, '.s-user-menu-toggler::before')
    assert.match(caret, /bg-transparent/)
    assert.match(caret, /inset-inline-start: auto;/)
  })
})

describe('floating menu — Esc without the panel header (#11)', () => {
  afterEach(() => teardownDom())

  test('Esc reaches the component\'s window listener and returns focus', async () => {
    const { document, window } = createDom({
      html: `
        <salla-user-menu class="store-header__user">
          <div class="s-user-menu-wrapper">
            <div class="s-user-menu-trigger-slot" id="trigger-slot"></div>
            <div class="s-user-menu-toggler">
              <div class="s-user-menu-dropdown"><ul class="s-user-menu-dropdown-list">
                <li class="s-user-menu-dropdown-item"><a class="s-user-menu-dropdown-item-link" href="/account/notifications">n</a></li>
              </ul></div>
            </div>
          </div>
        </salla-user-menu>`,
    })

    await loadFresh('src/assets/js/partials/floating-menu.js')

    const trigger = document.getElementById('trigger-slot')
    const toggler = document.querySelector('.s-user-menu-toggler')

    // What `salla-user-menu` does on open: the class, and an outside-click
    // listener on window that clears it.
    let closedByOutsideClick = false
    window.addEventListener('click', () => {
      closedByOutsideClick = true
      toggler.classList.remove('opened')
    })
    toggler.classList.add('opened')
    await flush()

    assert.equal(document.activeElement, document.querySelector('.s-user-menu-dropdown-item-link'))

    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }))
    await flush()

    assert.ok(closedByOutsideClick)
    assert.equal(toggler.classList.contains('opened'), false)
    assert.equal(document.activeElement, trigger)
  })
})
