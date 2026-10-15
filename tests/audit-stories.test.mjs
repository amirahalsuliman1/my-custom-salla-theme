/**
 * The stories screens against their artboards — the audit of 2026-10-15.
 *
 * Eight differences between `Story Page – Pinterest Style.pdf`, `Customer
 * Stories – Pinterest Style.pdf`, `Desktop Customer Stories - Story Pop-up.svg`
 * and the code, each pinned here so it cannot drift back:
 *
 *   #7   «أضف للمفضلة» read a field the customiser no longer writes
 *   #8   the desktop pop-up steps between stories, with neighbours either side
 *   #73  the X sits at the photograph's inline start, not its end
 *   #74  the footer buttons are the neutral variant, not the brand outline
 *   #157 the category chips are one segmented control
 *   #159 the stories page's feed panel is full bleed on a phone
 *   #160 the sheet's photograph is near-square
 *   #161 on desktop the tags sit over the photograph and the sheet chrome goes
 *
 * The template and stylesheet facts are read from source, as the other tests
 * here do; the stepping is run against a document, because it is behaviour.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const MODAL = fs.readFileSync('src/views/components/stories/story-modal.twig', 'utf8');
const SCSS = fs.readFileSync('src/assets/styles/04-components/stories.scss', 'utf8');
const HOTSPOT_SCSS = fs.readFileSync('src/assets/styles/04-components/hotspot.scss', 'utf8');
const AR = JSON.parse(fs.readFileSync('src/locales/ar.json', 'utf8'));
const EN = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));

/** The bodies of every `@include <mixin> { … }` block, braces balanced. */
function blocks(css, mixin) {
  const bodies = [];
  const opener = `@include ${mixin} {`;
  let from = css.indexOf(opener);

  while (from !== -1) {
    let depth = 1;
    let i = from + opener.length;

    while (depth && i < css.length) {
      if (css[i] === '{') depth += 1;
      if (css[i] === '}') depth -= 1;
      i += 1;
    }

    bodies.push(css.slice(from + opener.length, i - 1));
    from = css.indexOf(opener, i);
  }

  return bodies;
}

/** The stylesheet with every media block removed — what mobile gets. */
function base(css) {
  let out = css;

  for (const mixin of ['from-tablet', 'from-laptop', 'from-desktop']) {
    for (const body of blocks(out, mixin)) {
      out = out.replace(`@include ${mixin} {${body}}`, '');
    }
  }

  return out;
}

/** One rule's declarations, by its exact selector. */
function rule(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\n)\\s*${escaped} \\{([^}]*)\\}`));

  return match ? match[1] : null;
}

const LAPTOP = blocks(SCSS, 'from-laptop').join('\n');
const MOBILE = base(SCSS);

describe('#7 · «أضف للمفضلة» follows the product picker', () => {
  test('the story product is resolved from `story.product` first, the typed id second', () => {
    assert.match(MODAL, /\{% set story_product = story\.product is defined and story\.product \? story\.product : null %\}/);
    assert.match(MODAL, /\{% set story_product_id = story\.product_id\|default\(''\) %\}/);
    assert.ok(
      MODAL.indexOf('story.product is defined') < MODAL.indexOf("story.product_id|default('')"),
      'the picker is read before the legacy field',
    );
  });

  test('the button is gated on, and toggles, the resolved id — never the legacy field alone', () => {
    assert.match(MODAL, /\{% if story_product_id %\}\s*<button type="button"\s+class="btn btn--neutral story-modal__action btn--wishlist not-added"/);
    assert.match(MODAL, /data-id="\{\{ story_product_id \}\}"/);
    assert.match(MODAL, /onclick="salla\.wishlist\.toggle\(\{\{ story_product_id \}\}\)"/);
    assert.doesNotMatch(MODAL, /\{% if story\.product_id %\}/);
    assert.doesNotMatch(MODAL, /data-id="\{\{ story\.product_id \}\}"/);
  });

  test('the hotspot and the button name the same product', () => {
    assert.match(MODAL, /product_id: story_product_id \}\]/);
  });
});

describe('#74 · the footer buttons are the neutral variant', () => {
  test('both «إغلاق» and «أضف للمفضلة» are `btn--neutral`', () => {
    assert.match(MODAL, /class="btn btn--neutral story-modal__action" data-sheet-close>/);
    assert.match(MODAL, /class="btn btn--neutral story-modal__action btn--wishlist not-added"/);
    assert.doesNotMatch(MODAL, /class="[^"]*btn--outline-primary/);
  });
});

describe('#73 · the X stands at the photograph\'s inline start', () => {
  test('the header is placed from the inline start on the phone and the tablet', () => {
    const header = rule(MOBILE, '.story-modal .sheet__header');

    assert.ok(header);
    assert.match(header, /inset-inline-start: 1\.5rem;/);
    assert.doesNotMatch(header, /inset-inline-end/);
  });

  test('and on desktop, 8px inside the unpadded photograph', () => {
    const header = rule(LAPTOP, '.story-modal .sheet__header');

    assert.ok(header);
    assert.match(header, /inset-inline-start: 0\.5rem;/);
    assert.doesNotMatch(header, /inset-inline-end/);
  });
});

describe('#160 · the sheet\'s photograph is near-square', () => {
  test('the story view takes the drawn 361×349 below 1024px', () => {
    assert.match(rule(MOBILE, '.story-modal .hotspot__image') ?? '', /aspect-ratio: 361 \/ 349;/);
  });

  test('the shared primitive keeps 3:4 for everyone else', () => {
    assert.match(rule(HOTSPOT_SCSS, '.hotspot__image') ?? '', /aspect-ratio: (var\(--hotspot-ratio, )?3 \/ 4\)?;/);
  });
});

describe('#157 · the category chips are one segmented control', () => {
  test('the group carries the boundary and no longer bleeds to the screen edge', () => {
    const group = rule(MOBILE, '.stories-filter');

    assert.ok(group);
    assert.match(group, /@apply flex w-fit max-w-full gap-1 overflow-x-auto rounded-large p-1;/);
    assert.match(group, /border: 1px solid var\(--border-interactive\);/);
    assert.doesNotMatch(group, /-mx-4/);
  });

  test('an unselected chip has no edge of its own, at an unchanged size', () => {
    const chip = rule(MOBILE, '.stories-filter__chip');

    assert.ok(chip);
    assert.match(chip, /border: 1px solid transparent;/);
    assert.match(chip, /background-color: transparent;/);
    assert.match(rule(MOBILE, ".stories-filter__chip[aria-pressed='true']") ?? '', /background-color: var\(--surface-control\);/);
  });

  test('the desktop row does not strip the group\'s padding', () => {
    const group = rule(LAPTOP, '.stories-filter');

    assert.ok(group);
    assert.doesNotMatch(group, /px-0/);
  });
});

describe('#159 · the stories page\'s feed panel is full bleed on a phone', () => {
  test('below 768px it runs edge to edge with the cards at the merchant\'s gutter', () => {
    const panel = rule(MOBILE, '.s-information-page .s-block.stories .s-block__panel');

    assert.ok(panel);
    assert.match(panel, /margin-inline: calc\(-1 \* var\(--page-gutter, 16px\)\);/);
    assert.match(panel, /padding-inline: var\(--page-gutter, 16px\);/);
    assert.match(panel, /@apply rounded-3xl;/);
  });

  test('from 768px the container bounds it again, and Home is untouched', () => {
    const tablet = blocks(SCSS, 'from-tablet').join('\n');

    assert.match(rule(tablet, '.s-information-page .s-block.stories .s-block__panel') ?? '', /@apply mx-0 px-2;/);
    assert.equal(rule(MOBILE, '.s-block.stories .s-block__panel'), null);
    assert.doesNotMatch(SCSS, /max-width/);
  });
});

describe('#8 / #161 · the desktop pop-up, in the stylesheet', () => {
  test('the chevrons and neighbours are not displayed below 1024px', () => {
    assert.match(MOBILE, /\.story-modal__nav,\s*\.story-modal__peek \{\s*display: none;\s*\}/);
  });

  test('from 1024px the dialog is the 9:16 photograph, with no sheet around it', () => {
    assert.match(rule(LAPTOP, '.sheet.story-modal') ?? '', /inline-size: calc\(var\(--story-stage\) \* 9 \/ 16\);/);
    assert.match(rule(LAPTOP, '.sheet.story-modal') ?? '', /overflow: visible;/);
    assert.match(rule(LAPTOP, '.story-modal .hotspot__image') ?? '', /aspect-ratio: 9 \/ 16;/);
    assert.match(rule(LAPTOP, '.story-modal .sheet__panel') ?? '', /background-color: transparent;/);
  });

  test('the chevrons stand outside the photograph, previous at the inline start', () => {
    assert.match(rule(LAPTOP, '.story-modal__nav--prev') ?? '', /inset-inline-end: calc\(100% \+ 1rem\);/);
    assert.match(rule(LAPTOP, '.story-modal__nav--next') ?? '', /inset-inline-start: calc\(100% \+ 1rem\);/);
    assert.match(rule(LAPTOP, '.story-modal__nav[hidden]') ?? '', /display: none;/);
    assert.match(LAPTOP, /\[dir='ltr'\] \.story-modal__nav \.ui-icon \{\s*transform: scaleX\(-1\);/);
  });

  test('the neighbours are 0.4 of the photograph, with their box reserved', () => {
    const item = rule(LAPTOP, '.story-modal__peek-item');

    assert.ok(item);
    assert.match(item, /inline-size: calc\(var\(--story-stage\) \* 0\.4 \* 9 \/ 16\);/);
    assert.match(item, /aspect-ratio: 9 \/ 16;/);
  });

  test('#161 — the tags sit over the photograph\'s foot at the inline start', () => {
    const tags = rule(LAPTOP, '.story-modal .story-card__tags');

    assert.ok(tags);
    assert.match(tags, /position: absolute;/);
    assert.match(tags, /inset-block-end: 1rem;/);
    assert.match(tags, /inset-inline: 1rem;/);
  });

  test('#161 — the undrawn chrome: the X waits for keyboard focus, «إغلاق» and the marker go', () => {
    assert.match(rule(LAPTOP, '.story-modal .sheet__close') ?? '', /@apply sr-only;/);
    assert.match(rule(LAPTOP, '.story-modal .sheet__close:focus-visible') ?? '', /@apply not-sr-only h-11 w-11;/);
    assert.match(rule(LAPTOP, '.story-modal__action[data-sheet-close]') ?? '', /display: none;/);
    assert.match(rule(LAPTOP, '.story-modal .hotspot__marker') ?? '', /display: none;/);
  });
});

describe('#8 · the desktop pop-up, in the template', () => {
  test('two chevrons, hidden until the script knows there is somewhere to go', () => {
    assert.match(MODAL, /class="story-modal__nav story-modal__nav--prev"\s+data-story-step="-1"\s+aria-label="\{\{ trans\('theme\.stories\.previous'\) \}\}"\s+hidden>/);
    assert.match(MODAL, /class="story-modal__nav story-modal__nav--next"\s+data-story-step="1"\s+aria-label="\{\{ trans\('theme\.stories\.next'\) \}\}"\s+hidden>/);
  });

  test('the neighbour strips are pictures, hidden from assistive technology', () => {
    assert.match(MODAL, /data-story-peek="prev" aria-hidden="true"/);
    assert.match(MODAL, /data-story-peek="next" aria-hidden="true"/);
  });

  test('the chevrons are named in both languages, under their own keys', () => {
    assert.equal(AR.theme.stories.previous, 'القصة السابقة');
    assert.equal(AR.theme.stories.next, 'القصة التالية');
    assert.equal(EN.theme.stories.previous, 'Previous story');
    assert.equal(EN.theme.stories.next, 'Next story');
  });
});

/* ── #8 · the stepping, run ─────────────────────────────────────────────── */

const card = (n, hidden = false) => `
  <li class="story-card"${hidden ? ' hidden' : ''}>
    <button type="button" class="story-card__trigger" data-sheet-open="story-1-${n}">
      <img src="/story-${n}.jpg" alt="">
    </button>
  </li>`;

const dialog = (n) => `
  <dialog id="story-1-${n}" class="sheet story-modal" data-sheet>
    <div class="sheet__panel"><div class="sheet__body">
      <div class="hotspot" data-hotspot-root data-hotspot-defer></div>
      <div class="story-modal__peek story-modal__peek--prev" data-story-peek="prev" aria-hidden="true"></div>
      <div class="story-modal__peek story-modal__peek--next" data-story-peek="next" aria-hidden="true"></div>
      <button type="button" class="story-modal__nav story-modal__nav--prev" data-story-step="-1" hidden></button>
      <button type="button" class="story-modal__nav story-modal__nav--next" data-story-step="1" hidden></button>
    </div></div>
  </dialog>`;

function feed({ count = 5, hidden = [] } = {}) {
  const ns = Array.from({ length: count }, (_, i) => i + 1);

  return `
    <div class="s-block__panel">
      <ul class="stories__grid">${ns.map((n) => card(n, hidden.includes(n))).join('')}</ul>
      ${ns.map(dialog).join('')}
    </div>
    <button type="button" data-sheet-open="somewhere-else">not a story</button>`;
}

async function boot(html = feed()) {
  const dom = createDom({ html });
  const { default: StoryModal } = await loadFresh('src/assets/js/partials/story-modal.js');

  await flush();
  return { ...dom, StoryModal };
}

const story = (n) => document.getElementById(`story-1-${n}`);
const nav = (n, step) => story(n).querySelector(`.story-modal__nav[data-story-step="${step}"]`);
const peeks = (n, side) =>
  [...story(n).querySelectorAll(`[data-story-peek="${side}"] .story-modal__peek-item`)].map((item) => ({
    step: item.getAttribute('data-story-step'),
    src: item.querySelector('img')?.getAttribute('src'),
  }));
const openIds = () => [...document.querySelectorAll('.story-modal[open]')].map((d) => d.id);
const press = (n, key) =>
  story(n).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

async function open(n) {
  story(n).showModal();
  await flush();
}

afterEach(teardownDom);

describe('#8 · opening a story sets its chevrons and its neighbours', () => {
  test('a middle story shows both chevrons and two neighbours a side, nearest beside it', async () => {
    await boot();
    await open(3);

    assert.equal(nav(3, -1).hidden, false);
    assert.equal(nav(3, 1).hidden, false);
    assert.deepEqual(peeks(3, 'prev'), [
      { step: '-2', src: '/story-1.jpg' },
      { step: '-1', src: '/story-2.jpg' },
    ]);
    assert.deepEqual(peeks(3, 'next'), [
      { step: '1', src: '/story-4.jpg' },
      { step: '2', src: '/story-5.jpg' },
    ]);
  });

  test('the ends hide the chevron that has nowhere to go', async () => {
    await boot();

    await open(1);
    assert.equal(nav(1, -1).hidden, true);
    assert.equal(nav(1, 1).hidden, false);
    assert.deepEqual(peeks(1, 'prev'), []);
    story(1).close();

    await open(5);
    assert.equal(nav(5, 1).hidden, true);
    assert.deepEqual(peeks(5, 'next'), []);
  });

  test('a story the filter has hidden is not stepped into, and is not a neighbour', async () => {
    await boot(feed({ hidden: [4] }));
    await open(3);

    assert.deepEqual(peeks(3, 'next').map((p) => p.src), ['/story-5.jpg']);

    nav(3, 1).click();
    assert.deepEqual(openIds(), ['story-1-5']);
  });

  test('a trigger outside the feed is not part of its order', async () => {
    const { StoryModal } = await boot();

    assert.deepEqual(StoryModal.sequence(story(1)).map((d) => d.id), [
      'story-1-1', 'story-1-2', 'story-1-3', 'story-1-4', 'story-1-5',
    ]);
  });
});

describe('#8 · stepping', () => {
  test('the next chevron closes this story, opens the next and keeps the keyboard on it', async () => {
    await boot();
    await open(2);

    nav(2, 1).click();

    assert.deepEqual(openIds(), ['story-1-3']);
    assert.equal(document.activeElement, nav(3, 1));
  });

  test('stepping to the last story hands focus to the chevron that is left', async () => {
    await boot();
    await open(4);

    nav(4, 1).click();

    assert.deepEqual(openIds(), ['story-1-5']);
    assert.equal(nav(5, 1).hidden, true);
    assert.equal(document.activeElement, nav(5, -1));
  });

  test('a neighbour picture steps by its own offset', async () => {
    await boot();
    await open(3);

    story(3).querySelector('.story-modal__peek-item[data-story-step="-2"] img').click();

    assert.deepEqual(openIds(), ['story-1-1']);
  });

  test('in Arabic ← is the next story and → the previous one', async () => {
    await boot();
    await open(3);

    press(3, 'ArrowLeft');
    assert.deepEqual(openIds(), ['story-1-4']);

    press(4, 'ArrowRight');
    assert.deepEqual(openIds(), ['story-1-3']);
  });

  test('in English the arrows swap, as the chevrons do', async () => {
    await boot();
    document.documentElement.setAttribute('dir', 'ltr');
    await open(3);

    press(3, 'ArrowRight');
    assert.deepEqual(openIds(), ['story-1-4']);
  });

  test('an arrow with no chevron behind it does nothing', async () => {
    await boot();
    await open(5);

    press(5, 'ArrowLeft');

    assert.deepEqual(openIds(), ['story-1-5']);
  });

  test('closing a story reached by stepping returns focus to its own card', async () => {
    await boot();
    await open(2);

    nav(2, 1).click();
    nav(3, 1).click();
    story(4).close();

    assert.equal(document.activeElement, document.querySelector('[data-sheet-open="story-1-4"]'));
  });

  test('closing the story opened from its card leaves focus to the browser', async () => {
    await boot();

    const other = document.querySelector('[data-sheet-open="somewhere-else"]');

    other.focus();
    await open(2);
    story(2).close();

    assert.equal(document.activeElement, other);
  });

  test('a modal inserted after boot (the PDP strip) binds once and steps the same way', async () => {
    const { StoryModal } = await boot('<section data-pdp-stories></section>');
    const section = document.querySelector('[data-pdp-stories]');

    section.innerHTML = `<ul>${card(7)}${card(8)}${card(9)}</ul>${dialog(7)}${dialog(8)}${dialog(9)}`;
    [7, 7, 8, 9].forEach((n) => StoryModal.bind(story(n)));

    await open(7);
    nav(7, 1).click();

    // Bound twice, the click would have stepped twice and landed on 9.
    assert.deepEqual(openIds(), ['story-1-8']);
  });
});
