/**
 * Home audit (2026-10-15) — the confirmed design-vs-code defects on Home, pinned.
 *
 * Each block names the audit item it holds. Most are source assertions, the way
 * the desktop-pass tests read the stylesheets; the three behaviours that live in
 * JavaScript — the sale price in the hotspot pill, the swiper-driven indicator
 * and the lookbook's segmented indicator — run the shipped files against the
 * harness instead.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const read = (file) => fs.readFileSync(file, 'utf8');
const fromTablet = (css) => css.slice(css.indexOf('@include from-tablet'));
const fromLaptop = (css) => css.slice(css.indexOf('@include from-laptop'));
const MANIFEST = JSON.parse(read('twilight.json'));
const field = (path, id) =>
  MANIFEST.components.find((c) => c.path === path).fields.find((f) => f.id === id);

const HOT = read('src/assets/styles/04-components/hotspot.scss');
const HOTSPOT_TWIG = read('src/views/components/ui/hotspot-image.twig');
const LOOKBOOK = read('src/views/components/home/lookbook.twig');

afterEach(teardownDom);

describe('#26 · the «Winter Is Coming» carousel sits in a panel', () => {
  test('header, row and indicator are inside one .s-block__panel', () => {
    const twig = read('src/views/components/home/products-slider.twig');
    const panel = twig.indexOf('<div class="s-block__panel">');
    assert.ok(panel > -1, 'no panel in the product carousel');
    assert.ok(panel < twig.indexOf("include 'components.ui.section-header'"));
    assert.ok(panel < twig.indexOf('<salla-products-list'));
    assert.ok(twig.indexOf('data-carousel-indicator') > panel);
    assert.match(twig, /class="s-block product-carousel container"/);
  });

  test('section-panel.scss no longer lists it as bare', () => {
    const css = read('src/assets/styles/04-components/section-panel.scss');
    assert.match(css, /panelled\s+the product carousel \(y734\)/);
    assert.doesNotMatch(css, /its \*cards\* carry the warm tone instead/);
  });
});

describe('#27 · the tilted caption on the overlay lookbook', () => {
  test('a merchant field, optional and empty by default', () => {
    const caption = field('home.lookbook', 'caption');
    assert.equal(caption.required, false);
    assert.equal(caption.value, null);
    assert.equal(caption.multilanguage, true);
    assert.ok(caption.label);
  });

  test('lookbook passes it; the primitive renders it only when set, dir="auto"', () => {
    assert.match(LOOKBOOK, /caption:\s+component\.caption/);
    // `dir="auto"` on the inner span: on the label it would flip its own
    // logical inset to the other corner for Latin copy.
    assert.match(HOTSPOT_TWIG, /\{% if caption\|default\(''\) %\}\s*<p class="hotspot__caption"><span dir="auto">\{\{ caption \}\}<\/span><\/p>/);
    assert.doesNotMatch(read('src/views/components/stories/story-modal.twig'), /caption:/);
  });

  test('top inline start, rotated 16°, token colours, never takes a press', () => {
    const rule = HOT.match(/\.hotspot__caption \{[^}]*\}/)[0];
    assert.match(rule, /pointer-events-none/);
    assert.match(rule, /inset-inline-start: 0;/);
    assert.match(rule, /transform: rotate\(16deg\);/);
    assert.match(rule, /background-color: var\(--border-subtle\);/);
    assert.match(rule, /border-color: var\(--border-interactive\);/);
    assert.match(HOT, /\[dir="ltr"\] \.hotspot__caption \{\s*transform: rotate\(-16deg\);/);
  });

  test('gone from 768px, where the desktop layout draws none', () => {
    assert.match(fromTablet(HOT), /\.lookbook \.hotspot__caption \{\s*display: none;/);
  });
});

describe('#28 + #104 · the swiper carousels use T-4.03\'s indicator', () => {
  for (const file of ['video-carousel', 'photos-slider']) {
    test(`${file}: no swiper progress bar, T-4.03's track and thumb instead`, () => {
      const twig = read(`src/views/components/home/${file}.twig`);
      assert.doesNotMatch(twig, /"type":"progressbar"|"pagination":/);
      assert.doesNotMatch(twig, /^\s*pagination$/m);
      assert.match(twig, /<div class="product-carousel__indicator" data-carousel-indicator="swiper" aria-hidden="true">\s*<span class="product-carousel__thumb"><\/span>/);
    });
  }

  test('the half-width photos bar is gone; the shared track is full width', () => {
    assert.doesNotMatch(read('src/assets/styles/04-components/photos-carousel.scss'), /swiper-pagination-progressbar|w-1\/2/);
    const css = read('src/assets/styles/04-components/product-carousel.scss');
    assert.match(css, /\.product-carousel__indicator \{\s*@apply relative mt-4 h-1 w-full/);
    assert.match(css, /\.product-carousel__indicator\[data-carousel-idle\] \{\s*visibility: hidden;/);
    assert.match(fromLaptop(css), /\.product-carousel__indicator \{\s*@apply h-2;/);
  });

  test('home.js sizes and moves the thumb from the swiper, from the inline start', async () => {
    const { document } = createDom({
      pageSlug: 'index',
      html: `<section class="photos-carousel"><div class="s-block__panel">
               <salla-slider><div class="swiper"></div></salla-slider>
               <div class="product-carousel__indicator" data-carousel-indicator="swiper" aria-hidden="true">
                 <span class="product-carousel__thumb"></span></div></div></section>`,
    });
    const handlers = {};
    const swiper = {
      params: { centeredSlides: false, slidesOffsetBefore: 0 },
      snapGrid: [0],
      virtualSize: 900,
      size: 300,
      progress: 0.5,
      isLocked: false,
      on: (events, callback) => events.split(' ').forEach((e) => { handlers[e] = callback; }),
    };
    document.querySelector('.swiper').swiper = swiper;

    await loadFresh('src/assets/js/home.js');

    const indicator = document.querySelector('[data-carousel-indicator="swiper"]');
    assert.equal(indicator.dataset.carouselReady, 'true');
    assert.equal(Number(indicator.style.getPropertyValue('--carousel-visible')).toFixed(3), '0.333');
    assert.equal(indicator.style.getPropertyValue('--carousel-progress'), '0.5');
    assert.equal(indicator.hasAttribute('data-carousel-idle'), false);

    swiper.progress = 1;
    handlers.progress();
    assert.equal(indicator.style.getPropertyValue('--carousel-progress'), '1');

    // Every slide in view: the box stays, the thumb does not show.
    swiper.virtualSize = 300;
    handlers.resize();
    assert.equal(indicator.hasAttribute('data-carousel-idle'), true);
  });
});

describe('#29 · the list lookbook: flat rows between rules, a flush photograph', () => {
  test('mobile rows: no card, no gap, a rule under every row but the last', () => {
    assert.match(HOT, /\.hotspot--list \.hotspot__pills \{\s*@apply gap-0;/);
    assert.match(HOT, /\.hotspot--list \.hotspot__pill \{\s*@apply rounded-none bg-transparent;/);
    assert.match(HOT, /\.hotspot--list \.hotspot__pill:not\(:last-child\) \{\s*border-block-end: 1px solid var\(--border-interactive\);/);
    assert.match(HOT, /\.hotspot--list \.hotspot__figure \{\s*@apply rounded-b-none;/);
  });

  test('a pressed row is still marked, by an outline rather than a border', () => {
    assert.match(HOT, /\.hotspot--list \.hotspot__pill\[aria-current="true"\] \{\s*outline: 2px solid var\(--border-interactive\);/);
    assert.match(HOT, /\.hotspot:not\(\.hotspot--list\) \.hotspot__pill\[aria-current="true"\]/);
  });

  test('the list panel is flush, and only the lookbook\'s', () => {
    assert.match(LOOKBOOK, /'s-block__panel s-block__panel--flush'/);
    const panel = read('src/assets/styles/04-components/section-panel.scss');
    assert.match(panel, /\.s-block__panel--flush \{\s*@apply overflow-hidden p-0;/);
    assert.match(panel, /\.s-block__panel \{\s*@apply rounded-large px-2 py-4;/);
  });

  test('from 768px the photograph stands bare and the mobile row treatment comes off', () => {
    const t = fromTablet(HOT);
    assert.match(t, /\.lookbook \.s-block__panel \{\s*@apply overflow-visible rounded-none bg-transparent p-0;/);
    assert.match(t, /\.lookbook \.hotspot--list \.hotspot__figure \{\s*@apply rounded-large;/);
    assert.match(t, /\.lookbook \.hotspot--list \.hotspot__pill \{\s*border-block-end-width: 0;/);
    assert.match(t, /\.lookbook \.hotspot__column \{[^}]*background-color: var\(--surface-section\);/);
  });
});

describe('#103 · the lookbook photographs keep the artboard\'s proportions', () => {
  test('a custom property, 3/4 by default for the story view', () => {
    assert.match(HOT, /aspect-ratio: var\(--hotspot-ratio, 3 \/ 4\);/);
    assert.match(HOT, /\.lookbook \.hotspot--overlay \{\s*--hotspot-ratio: 4 \/ 5;/);
    assert.match(HOT, /\.lookbook \.hotspot--list \{\s*--hotspot-ratio: 361 \/ 348;/);
    assert.match(fromTablet(HOT), /\.lookbook \.hotspot__image \{\s*aspect-ratio: auto;/);
  });
});

describe('#105 · the hand-drawn hearts around the hero quote', () => {
  const HERO = read('src/views/components/home/hero.twig');
  const CSS = read('src/assets/styles/04-components/hero.scss');

  test('a section switch, on by default', () => {
    const hearts = field('home.hero', 'quote_hearts');
    assert.equal(hearts.type, 'boolean');
    assert.equal(hearts.value, true);
    assert.match(HERO, /component\.quote_hearts is not defined or component\.quote_hearts/);
  });

  test('two decorative SVGs inside the quote, stroked in its colour', () => {
    const svgs = HERO.match(/<svg class="hero__heart hero__heart--(small|large)"[^>]*>/g);
    assert.equal(svgs.length, 2);
    svgs.forEach((svg) => {
      assert.match(svg, /aria-hidden="true"/);
      assert.match(svg, /focusable="false"/);
    });
    assert.equal((HERO.match(/stroke="currentColor"/g) || []).length, 2);
    assert.ok(HERO.indexOf('{% if hero_hearts %}') > HERO.indexOf('{% if slide.quote %}'));
  });

  test('placed against the quote box with logical properties, swapped on desktop', () => {
    assert.match(CSS, /\.hero__heart \{\s*@apply pointer-events-none absolute/);
    assert.match(CSS, /\.hero__heart--small \{\s*inline-size: 1\.5em;\s*inset-block-end: 100%;\s*inset-inline-end: 0;/);
    assert.match(CSS, /\.hero__heart--large \{\s*inline-size: 3em;\s*inset-block-start: 100%;/);
    const d = fromLaptop(CSS);
    assert.match(d, /\.hero__heart--large \{\s*inset-block: auto 100%;/);
    assert.match(d, /\.hero__heart--small \{\s*inset-block: 100% auto;/);
  });
});

describe('#106 · no stories call-to-action on desktop', () => {
  test('hidden from 1024px, kept below', () => {
    const css = read('src/assets/styles/04-components/stories.scss');
    assert.match(fromLaptop(css), /\.s-block\.stories \.stories__cta \{\s*display: none;/);
    assert.match(css, /\.stories__cta \{\s*@apply mt-6 flex w-full justify-center;/);
  });
});

describe('#75 + #107 · the hotspot pill: sale price, rating, price-and-bag', () => {
  const ROOT = `
    <div class="hotspot hotspot--overlay" data-hotspot-root>
      <figure class="hotspot__figure">
        <button type="button" class="hotspot__marker" data-hotspot-marker data-product-id="7" aria-controls="lb-1" aria-label="x"></button>
      </figure>
      <div class="hotspot__column">
        <ul class="hotspot__pills" data-carousel-track>
          <li class="hotspot__pill" id="lb-1" data-hotspot-pill data-product-id="7" hidden></li>
        </ul>
      </div>
    </div>`;

  async function mount(product) {
    const env = createDom({ html: ROOT, translations: { 'theme.common.was_price': 'السعر قبل الخصم' } });
    const asked = [];
    env.salla.product.getDetails = (id, withItems) => {
      asked.push([id, withItems]);
      return Promise.resolve({ data: product });
    };
    env.salla.helpers = { number: (n) => String(n) };
    await loadFresh('src/assets/js/partials/hotspots.js');
    await flush();
    return { ...env, asked, pill: env.document.querySelector('[data-hotspot-pill]') };
  }

  const BASE = { id: 7, name: 'peptide lip tint', url: '/p/7', status: 'sale', type: 'product' };

  test('a discounted product shows the sale price and the struck original, named', async () => {
    const { pill } = await mount({ ...BASE, price: 95, regular_price: 119 });
    const row = pill.querySelector('.hotspot__pill-body .hotspot__pill-prices');
    assert.equal(row.querySelector('.hotspot__pill-price').textContent, 'SAR 95');
    const was = row.querySelector('.hotspot__pill-price-was');
    assert.match(was.textContent, /SAR 119/);
    assert.equal(was.querySelector('.sr-only').textContent, 'السعر قبل الخصم');
  });

  test('is_on_sale with a sale_price uses the sale price', async () => {
    const { pill } = await mount({ ...BASE, price: 119, sale_price: 95, regular_price: 119, is_on_sale: true });
    assert.equal(pill.querySelector('.hotspot__pill-prices .hotspot__pill-price').textContent, 'SAR 95');
  });

  test('a full-price product shows one price and no strike', async () => {
    const { pill } = await mount({ ...BASE, price: 400 });
    assert.equal(pill.querySelector('.hotspot__pill-price-was'), null);
    assert.equal(pill.querySelector('.hotspot__pill-prices .hotspot__pill-price').textContent, 'SAR 400');
  });

  test('the rating is asked for and drawn with the product card\'s row', async () => {
    const { pill, asked } = await mount({ ...BASE, price: 400, rating: { stars: 4.5, count: 7000 } });
    assert.deepEqual(asked, [['7', ['rating']]]);
    assert.ok(pill.querySelector('.hotspot__pill-body .product-card__rating'));
    assert.equal(pill.querySelectorAll('.product-card__star--filled').length, 4);
  });

  test('no rating, no row', async () => {
    const { pill } = await mount({ ...BASE, price: 400 });
    assert.equal(pill.querySelector('.product-card__rating'), null);
  });

  test('the button carries the price for the desktop card, beside its own name', async () => {
    const { pill } = await mount({ ...BASE, price: 400 });
    const buy = pill.querySelector('salla-add-product-button.hotspot__pill-buy');
    assert.equal(buy.getAttribute('fill'), 'none');
    assert.match(buy.querySelector('.sr-only').textContent, /peptide lip tint/);
    assert.equal(buy.querySelector('.hotspot__pill-buy-price .hotspot__pill-price').textContent, 'SAR 400');
  });

  test('CSS: shown once — the row on mobile, the outlined control on the desktop card', () => {
    assert.match(HOT, /\.hotspot__pill-body \.product-card__rating,\s*\.hotspot__pill-buy-price \{\s*display: none;/);
    assert.match(HOT, /\.hotspot__pill-price-was \{\s*@apply text-sm text-secondary line-through;/);
    const t = fromTablet(HOT);
    assert.match(t, /\.lookbook \.hotspot__pill-body \.product-card__rating \{\s*display: flex;/);
    assert.match(t, /\.lookbook \.hotspot__pill-body \.hotspot__pill-prices \{\s*display: none;/);
    assert.match(t, /\.lookbook \.hotspot__pill-buy-price \{\s*@apply inline-flex/);
    assert.match(t, /\.lookbook \.hotspot__pill-buy \{\s*@apply mt-auto h-auto w-auto self-start;/);
    assert.match(t, /box-shadow: inset 0 0 0 1px var\(--border-interactive\);/);
    assert.match(t, /scrollbar-width: none;/);
    assert.doesNotMatch(t, /scrollbar-width: thin;/);
  });

  test('the rating markup exists once, in product-runtime', () => {
    assert.match(read('src/assets/js/partials/product-card.js'), /return ratingMarkup\(this\.product\?\.rating\);/);
    assert.doesNotMatch(read('src/assets/js/partials/product-card.js'), /product-card__star--filled/);
  });
});

describe('#107 · the lookbook\'s segmented indicator', () => {
  test('only the Home lookbook asks for it', () => {
    assert.match(LOOKBOOK, /indicator: true/);
    assert.match(HOTSPOT_TWIG, /\{% if indicator\|default\(false\) %\}[\s\S]*data-carousel-indicator="segments"/);
    assert.match(HOT, /\.hotspot \.hotspot__indicator \{\s*display: none;/);
    assert.match(fromTablet(HOT), /\.lookbook \.hotspot__indicator:not\(\[hidden\]\) \{\s*display: flex;/);
  });

  test('home.js builds one segment per shown card and marks the one in view', async () => {
    const { document } = createDom({
      pageSlug: 'index',
      html: `<div class="hotspot__column">
               <ul data-carousel-track><li>a</li><li>b</li><li hidden>c</li><li>d</li></ul>
               <div class="product-carousel__indicator product-carousel__indicator--segments" data-carousel-indicator="segments" hidden></div>
             </div>`,
    });
    const track = document.querySelector('[data-carousel-track]');
    Object.defineProperty(track, 'scrollWidth', { value: 900, configurable: true });
    Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true });

    await loadFresh('src/assets/js/home.js');

    const indicator = document.querySelector('[data-carousel-indicator="segments"]');
    assert.equal(indicator.hidden, false);
    assert.equal(indicator.children.length, 3);
    assert.ok(indicator.children[0].hasAttribute('data-active'));

    // RTL scrolls negative; T-4.03's Math.abs.
    track.scrollLeft = -600;
    track.dispatchEvent(new window.Event('scroll'));
    assert.ok(indicator.children[2].hasAttribute('data-active'));
    assert.equal(indicator.children[0].hasAttribute('data-active'), false);

    // A product that stops resolving drops its segment.
    track.lastElementChild.remove();
    await flush();
    assert.equal(indicator.children.length, 2);
  });
});

describe('#156 · the story view\'s bag is a filled square', () => {
  test('scoped to the story modal; Home keeps the bare bag', () => {
    assert.match(HOT, /\.story-modal \.hotspot__pill-buy \.s-button-element \{\s*@apply h-full w-full rounded;\s*background-color: var\(--surface-control\) !important;\s*color: var\(--surface-card\);/);
    assert.match(HOT, /\.hotspot__pill-buy \{\s*@apply inline-flex h-11 w-11 flex-none items-center justify-center;/);
  });
});

describe('#158 · the overlay marker: ring, dot and stem', () => {
  test('a thin empty ring with a centre dot and a stem above, in --on-media', () => {
    assert.match(HOT, /\.hotspot--overlay \.hotspot__marker-dot \{\s*@apply relative h-4 w-4 border bg-transparent;\s*border-color: var\(--on-media\);/);
    assert.match(HOT, /\.hotspot--overlay \.hotspot__marker-dot::after \{\s*@apply absolute inset-0 m-auto h-1\.5 w-1\.5 rounded-full;/);
    assert.match(HOT, /\.hotspot--overlay \.hotspot__marker-dot::before \{\s*@apply pointer-events-none absolute inset-x-0 mx-auto h-7 w-0\.5;\s*content: "";\s*inset-block-end: 100%;/);
    assert.match(HOT, /\.hotspot__marker \{\s*@apply absolute inline-flex h-11 w-11/);
  });

  test('--on-media is white and is not re-pointed in dark mode', () => {
    const global = read('src/assets/styles/01-settings/global.scss');
    assert.match(global, /--on-media: #ffffff;/);
    const dark = global.slice(global.indexOf('html.dark {'));
    assert.doesNotMatch(dark.slice(0, dark.indexOf('\n}')), /--on-media/);
  });
});
