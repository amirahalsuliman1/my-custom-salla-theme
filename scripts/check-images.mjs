#!/usr/bin/env node
/**
 * T-8.02 — enforce doc 11's image rules on the templates this theme owns.
 *
 * WHAT THE AUDIT FOUND, AND WHY THIS SCRIPT LOOKS SMALL. All 41 `<img>` tags in
 * `src/views` were read. **Every one in a template this theme wrote already
 * passes** — the box is reserved, the loading strategy is deliberate, and the
 * only page with an eager image is the page whose LCP it is. There was no pile
 * of defects to fix. So the deliverable is the thing that keeps it true, and the
 * exceptions list below is the honest record of what does not pass.
 *
 * THE BOX IS RESERVED TWO WAYS, AND BOTH COUNT. `width`+`height` on the tag is
 * one. The other is an ancestor class whose SCSS sets `aspect-ratio` — which is
 * how every media well in this theme does it, because a merchant's image has no
 * dimensions the template can know. `.card__media` carries
 * `--card-media-ratio`, `.hero__image` 5/7, `.hotspot__image` 3/4,
 * `.listing-cover__image` 393/420. A tag inside one of those is reserved even
 * with no attributes, and treating it as a defect would push false dimensions
 * onto a responsive box.
 *
 * ONE EAGER IMAGE PER TEMPLATE. «Only the LCP image is eager» is per page, not
 * per theme: Home's hero, the PDP's first gallery frame and the header's logo
 * are each correct where they are. What this catches is the second one — the
 * regression where a new section marks its image eager and quietly competes
 * with the LCP for bandwidth.
 *
 * WHAT IS NOT CHECKED HERE, BECAUSE IT CANNOT BE. «Modern formats served with
 * fallback» is the CDN's: images go through `|cdn(...)`, and format negotiation
 * happens on Salla's side from the request's `Accept` header. A theme cannot
 * emit a `<picture>` for a URL it does not control. **Measured CLS is T-8.08's
 * and needs a browser** — this script proves the boxes are reserved, not that
 * nothing moved.
 */
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

/**
 * Upstream templates this theme has never adopted. They fail the rules and are
 * listed rather than fixed, because editing one means shadowing it and buying
 * `/docs/OVERRIDES.md` a row that must be carried through every SDK upgrade —
 * a cost doc 04 says to pay only when a task needs the file.
 *
 * `blog/*` additionally has no route in this theme at all: B6 ruled the blog
 * out. Remove a path from this list in the same change that adopts the file.
 */
const UPSTREAM_NOT_ADOPTED = new Set([
  'src/views/pages/blog/index.twig',
  'src/views/pages/blog/single.twig',
  'src/views/pages/landing-page.twig',
  'src/views/pages/brands/index.twig',
  'src/views/pages/brands/single.twig',
  'src/views/pages/thank-you.twig',
  'src/views/components/home/brands.twig',
  'src/views/components/home/main-links.twig',
  'src/views/components/home/custom-testimonials.twig',
  'src/views/components/home/fixed-banner.twig',
  'src/views/components/home/photos-slider.twig',
])

/**
 * Classes whose SCSS reserves the box with `aspect-ratio`. Each is a real
 * selector in `04-components/` — grep before adding one, because a name here
 * that no stylesheet backs turns this check into a rubber stamp.
 */
const RESERVING_CLASSES = [
  'card__media', // cards.scss — var(--card-media-ratio)
  'hero__image', // hero.scss — 5/7
  'hotspot__image', // hotspot.scss — 3/4
  'listing-cover__image', // listing.scss — 393/420
  'partner-banner__image', // partner-banner.scss — 4/5
  'video-carousel__cover', // video-carousel.scss — 300/337
  'image-slider', // product-gallery.scss — .swiper-slide, var(--pdp-media-ratio)
  'product-gallery__thumb', // product-gallery.scss — var(--pdp-thumb-ratio)
]

/**
 * An image inside a dialog is exempt from the reserved-box rule, and this is a
 * measurement fact rather than a concession. CLS counts movement of content
 * that is *rendered*; a closed `salla-modal` renders nothing, so its contents
 * cannot shift the page. The footer's tax certificate is the case — a merchant
 * document whose dimensions no template can know.
 */
const DIALOG_CONTEXT = /<(salla-modal|dialog)\b/

const templates = execFileSync('find', ['src/views', '-name', '*.twig'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean)
  .filter((f) => !UPSTREAM_NOT_ADOPTED.has(f))
  .sort()

/**
 * THEME-OWNED IMAGES DELIBERATELY LEFT WITHOUT A `srcset`, each with the reason.
 *
 * These are merchant-setting URLs, so `|cdn()` would work on them — the same
 * class of value as `logo_light`, which the header has always passed through it.
 * What is missing is not the candidate list but the **`sizes`**, and a wrong
 * `sizes` is worse than none: it makes the browser pick a candidate for a box
 * that is not the box, so the page either fetches a blurry image or a needlessly
 * large one, permanently and invisibly.
 *
 * Every other responsive image in this theme got its `sizes` read off the
 * stylesheet — the hero and the partner banner are `.container`, the story card
 * is a `column-count` grid. Where the layout could not be stated, the image is
 * listed here rather than given a guess.
 *
 * ⚠ A line removed from this map with no `srcset` added falls through to the
 * «not ours» list, where it is wrong. Remove one only in the change that fixes it.
 */
const SRCSET_DEFERRED = {
  'src/views/components/home/video-carousel.twig:54':
    'The slide is a `salla-slider type="carousel" centered` child, so its width is ' +
    'decided by the platform component at runtime and appears in no stylesheet ' +
    'this repository owns. Deriving `sizes` needs the rendered slider — T-8.08.',
}

const problems = []
/** Tags that could carry a `srcset` and do not. Reported; never fatal. */
const responsive = []
/** Theme-owned, deliberately deferred, reason stated. See the map above. */
const deferred = []
/** Tags whose URL the theme does not control. The honest half of the audit. */
const notOurs = []

for (const file of templates) {
  const raw = fs.readFileSync(file, 'utf8')
  // Blank out Twig comments so prose about `<img>` is not audited as markup.
  const source = raw.replace(/\{#[\s\S]*?#\}/g, (m) => m.replace(/[^\n]/g, ' '))

  let eagerCount = 0

  for (const match of source.matchAll(/<img\b[^>]*>/g)) {
    const tag = match[0]
    const line = source.slice(0, match.index).split('\n').length
    const at = (attr) => new RegExp(`\\b${attr}\\s*=`).test(tag)
    const where = `${file}:${line}`

    const reservedByAttrs = at('width') && at('height')
    /*
     * The reserving class is usually on an ancestor, not the tag — the PDP's
     * `.image-slider` opens 49 lines above the image it sizes. So the test is
     * whether such a class appears anywhere earlier in the template.
     *
     * That is a heuristic and worth naming: it cannot tell an ancestor from a
     * sibling that merely came first, so it can exempt an image that is not
     * really inside a media well. It errs toward silence in a check whose job
     * is to catch the obvious regression — a new template with a bare `<img>`
     * and no reservation anywhere. The precise version needs a Twig parser,
     * which is a larger dependency than this check is worth.
     */
    const before = source.slice(0, match.index + tag.length)
    const reservedByCss = RESERVING_CLASSES.some((c) => before.includes(c))

    const insideDialog = DIALOG_CONTEXT.test(
      source.slice(Math.max(0, match.index - 1200), match.index),
    )

    if (!reservedByAttrs && !reservedByCss && !insideDialog) {
      problems.push(
        `${where}  no reserved box — add width+height, or place it in a media well that sets aspect-ratio`,
      )
    }

    if (!at('alt')) problems.push(`${where}  no alt attribute`)
    if (!at('loading'))
      problems.push(`${where}  no loading attribute — say lazy or eager deliberately`)
    if (/loading\s*=\s*"eager"/.test(tag)) eagerCount++

    /*
     * RESPONSIVE COVERAGE — REPORTED, NEVER FAILED, AND THE ASYMMETRY IS THE
     * POINT. The rules above are the theme's to keep: a missing `alt` or an
     * unreserved box is a defect in a file this repository owns. Whether an
     * image can carry a `srcset` is not, because it depends on **who owns the
     * URL**, and for most of these tags the answer is «the platform».
     *
     * A tag qualifies only if its `src` runs through `|cdn(…)`. That filter is
     * what produces a second URL at another width, and without it there is no
     * candidate list to build — writing `srcset="{{ x }} 1x, {{ x }} 2x"` is
     * the same file twice and a slower page.
     */
    const src = (tag.match(/\bsrc\s*=\s*"([^"]*)"/) || [])[1] || ''

    if (/\|\s*cdn\(/.test(src) && !at('srcset')) {
      responsive.push(`${where}  goes through |cdn() but offers no srcset`)
    }

    if (!/\|\s*cdn\(/.test(src) && !at('srcset')) {
      const reason = SRCSET_DEFERRED[where]

      if (reason) deferred.push(`${where}  ${src.trim()}\n      ${reason}`)
      else notOurs.push(`${where}  ${src.trim() || '(no src)'}`)
    }
  }

  if (eagerCount > 1) {
    problems.push(`${file}  ${eagerCount} eager images — only the LCP image may be eager`)
  }
}

console.log(`Image rules — doc 11, T-8.02\n\n  ${templates.length} theme-owned templates checked`)
console.log(
  `  ${UPSTREAM_NOT_ADOPTED.size} upstream templates skipped — see the list in this script\n`,
)

if (problems.length) {
  console.error(`✗ ${problems.length} problem${problems.length > 1 ? 's' : ''}:\n`)
  for (const p of problems) console.error('  · ' + p)
  process.exit(1)
}

console.log('✓ every image reserves its box, names itself, and states its loading strategy')

/**
 * THE AUDIT HALF, PRINTED EVERY RUN. T-8.02's second pass was asked for two
 * things: fix what the theme owns, and **say plainly what it does not**. An
 * unwritten «we could not do the rest» is indistinguishable from not having
 * looked, which is the same standard `/docs/DERIVED-DECISIONS.md` applies to an
 * unrecorded inference.
 */
if (responsive.length) {
  console.log(`\n⚠ ${responsive.length} image(s) could carry a srcset and do not:\n`)
  for (const r of responsive) console.log('  · ' + r)
}

if (deferred.length) {
  console.log(`\n⚠ ${deferred.length} theme-owned image(s) with no srcset, and why:\n`)
  for (const d of deferred) console.log('  · ' + d)
}

console.log(`\n  ${notOurs.length} image(s) whose URL this theme does not control:\n`)
for (const n of notOurs) console.log('  · ' + n)
console.log(
  "\n  These are the platform's — product galleries, cart lines, order attachments,\n" +
    "  shipping-carrier logos, a merchant's tax certificate. The theme re-presents a\n" +
    '  URL it is handed. It cannot build a candidate list for one, and `|cdn()` is not\n' +
    '  applied to them on the guess that it would work: a filter that mangles a URL\n' +
    "  replaces a correct image with a broken one. Resizing those is Salla's to do at\n" +
    "  the CDN, from the request's Accept header — see the header of this file.",
)
