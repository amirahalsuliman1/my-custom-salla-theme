/**
 * T-8.02, second pass — responsive candidates for the images this theme owns.
 *
 * WHAT CHANGED AND WHAT DID NOT. No new image system: no `<picture>`, no macro,
 * no art direction. Seven `<img>` tags gained a `srcset` and, where the box is
 * fluid, a `sizes` read off the stylesheet rather than guessed.
 *
 * THE SHARPEST TEST IN THIS FILE IS THE PRELOAD ONE. The hero is the Home LCP
 * and it is preloaded. A `rel="preload"` with a bare `href` fetches exactly that
 * URL, so the moment the `<img>` offers a candidate list the two can disagree —
 * and on every viewport where they do, the page downloads **two** hero images
 * and preloads the one it does not use. That is a regression that makes the
 * measurement in T-8.08 worse while looking like an optimisation.
 *
 * WHAT THESE TESTS CANNOT DO. They cannot confirm Salla's CDN actually serves a
 * resized image for `|cdn(450)`, or that the browser picks the candidate we
 * expect. /docs/MANUAL-QA.md §3.6.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

/**
 * Templates are read with their Twig comments removed.
 *
 * These files document themselves heavily, and the prose quotes the very markup
 * being asserted about — `hero.twig`'s note explains what a bare
 * `rel="preload"` does. Scanning the raw file finds the sentence as readily as
 * the tag, so a comment can satisfy an assertion or, worse, be counted as a
 * second preload.
 */
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\{#[\s\S]*?#\}/g, '')
const HERO = read('src/views/components/home/hero.twig')

/** Pull one attribute off the first tag in `src` that contains `needle`. */
const attr = (src, needle, name) => {
  // The needle is a literal — `cdn(175)` has parentheses in it, which as a
  // regex quietly become a capture group matching `cdn175` and never match.
  const literal = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const tag = src.match(new RegExp(`<[a-z-]+\\b[^>]*${literal}[^>]*>`, 's'))
  assert.ok(tag, `no tag containing ${needle}`)
  const m = tag[0].match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 's'))
  return m && m[1].replace(/\s+/g, ' ').trim()
}

describe('T-8.02 — the hero preload and the hero image cannot disagree', () => {
  test('the preload carries imagesrcset and imagesizes', () => {
    assert.ok(HERO.includes('imagesrcset='), 'the preload offers no candidate list')
    assert.ok(HERO.includes('imagesizes='), 'the preload offers no sizes')
  })

  test('the candidate lists offer exactly the same widths', () => {
    // Not «both exist» — the same set. A preload listing 450/900 against an
    // image listing 450/900/1350 still double-fetches at large viewports.
    //
    // The two expressions are compared by WIDTH rather than as strings,
    // because the source spells the same value two ways: the preload is
    // outside the loop and says `hero_first.image`, the tag is inside it and
    // says `slide.image`. For the first slide those are the same URL — which is
    // the only slide that is preloaded — so a string comparison would fail on a
    // difference that does not exist at render time.
    const widths = (s) => (s.match(/(\d+)w/g) || []).join(',')
    const preload = attr(HERO, 'rel="preload"', 'imagesrcset')
    const image = attr(HERO, 'class="hero__image"', 'srcset')
    assert.equal(widths(preload), widths(image))
    assert.ok(widths(preload).length > 0, 'no w-descriptors at all')
  })

  test('the preload is built from the first slide and the tag from the loop variable', () => {
    // The pairing above is only sound while these two hold. If the preload ever
    // starts naming `slide.image` it is outside the loop and resolves to
    // nothing; if the tag names `hero_first.image` every slide shows the first.
    assert.match(attr(HERO, 'rel="preload"', 'imagesrcset'), /hero_first\.image/)
    assert.match(attr(HERO, 'class="hero__image"', 'srcset'), /slide\.image/)
  })

  test('the sizes expressions are identical too', () => {
    assert.equal(
      attr(HERO, 'rel="preload"', 'imagesizes'),
      attr(HERO, 'class="hero__image"', 'sizes'),
    )
  })

  test('the preload href is one of the candidates it offers', () => {
    const href = attr(HERO, 'rel="preload"', 'href')
    assert.ok(
      attr(HERO, 'rel="preload"', 'imagesrcset').includes(href),
      'the fallback href is not in the candidate list, so it can be fetched as an extra',
    )
  })

  test('only the first slide is preloaded', () => {
    // Preloading all ten would have them compete with the one on screen — the
    // reason T-4.05 preloaded a single slide in the first place.
    assert.match(HERO, /\{% if hero_first\.image %\}/)
    assert.equal((HERO.match(/rel="preload"/g) || []).length, 1)
  })
})

describe('T-8.02 — every responsive image states a sizes it can justify', () => {
  const RESPONSIVE = [
    ['src/views/components/home/hero.twig', 'hero__image', 'calc(100vw - 32px)'],
    ['src/views/pages/product/index.twig', 'listing-cover__image', '100vw'],
    [
      'src/views/components/home/partner-banner.twig',
      'partner-banner__image',
      'calc(100vw - 32px)',
    ],
    ['src/views/components/ui/hotspot-image.twig', 'hotspot__image', 'calc(100vw - 32px)'],
    ['src/views/components/stories/story-card.twig', 'story.image', '44vw'],
  ]

  for (const [file, needle, expected] of RESPONSIVE) {
    test(`${file.split('/').pop()} offers w-descriptors and a sizes`, () => {
      const src = read(file)
      const srcset = attr(src, needle, 'srcset')
      const sizes = attr(src, needle, 'sizes')
      assert.ok(srcset, 'no srcset')
      assert.match(srcset, /\d+w/, 'w-descriptors are required when sizes is present')
      assert.ok(sizes && sizes.includes(expected), `sizes should end at ${expected}, got ${sizes}`)
    })
  }

  test('the fixed-size logos use x-descriptors and no sizes', () => {
    // A logo is 175×40 at every viewport. `sizes` on a fixed box is noise, and
    // w-descriptors would ask the browser to solve a problem it does not have.
    for (const file of [
      'src/views/components/header/header.twig',
      'src/views/components/footer/footer.twig',
    ]) {
      const srcset = attr(read(file), 'cdn(175)', 'srcset')
      assert.match(srcset, /1x,.*2x/, `${file} should offer a 2x candidate`)
      assert.equal(attr(read(file), 'cdn(175)', 'sizes'), null, `${file} should not set sizes`)
    }
  })

  test('every candidate goes through |cdn(), or it is the same file twice', () => {
    for (const [file, needle] of RESPONSIVE) {
      const srcset = attr(read(file), needle, 'srcset')
      const urls = srcset.split(',').map((c) => c.trim())
      for (const u of urls) assert.match(u, /\|\s*cdn\(\d+\)/, `${file}: ${u} is not resized`)
    }
  })
})

describe('T-8.02 — the audit reports what it did not fix', () => {
  const output = execFileSync(process.execPath, ['scripts/check-images.mjs'], { encoding: 'utf8' })

  test('nothing that goes through |cdn() is left without a srcset', () => {
    // This is the one bucket the theme has no excuse for: the filter that
    // builds a second URL is already being called.
    assert.ok(
      !output.includes('goes through |cdn() but offers no srcset'),
      'an image is resized but offers no candidates',
    )
  })

  test('the deferred image is named with its reason, not silently dropped', () => {
    assert.match(output, /theme-owned image\(s\) with no srcset, and why/)
    assert.match(output, /video-carousel\.twig/)
    assert.match(output, /salla-slider/)
  })

  test('the platform-owned URLs are listed rather than assumed away', () => {
    // The instruction was to fix what the theme owns AND say plainly what it
    // does not. An unwritten «we could not do the rest» is indistinguishable
    // from not having looked.
    assert.match(output, /image\(s\) whose URL this theme does not control/)
    for (const expected of ['cart.twig', 'product/single.twig', 'orders/single.twig']) {
      assert.ok(output.includes(expected), `${expected} is missing from the not-ours list`)
    }
  })

  test('|cdn() is not applied to a platform URL on the guess that it would work', () => {
    // A filter that mangles a URL replaces a correct image with a broken one,
    // and it would break on a live store rather than here.
    for (const file of [
      'src/views/pages/cart.twig',
      'src/views/pages/product/single.twig',
      'src/views/pages/customer/orders/single.twig',
    ]) {
      const source = read(file).replace(/\{#[\s\S]*?#\}/g, '')
      assert.ok(
        !/src="\{\{[^"]*\|\s*cdn\(/.test(source),
        `${file} pipes a platform URL through cdn()`,
      )
    }
  })

  test('the audit still passes the rules T-8.02 shipped first', () => {
    assert.match(output, /✓ every image reserves its box/)
  })
})
