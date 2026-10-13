/**
 * «هايلايت» (owner request, 2026-10-13) — partials/highlights.js.
 *
 * The viewer behaves like Instagram's: it opens on the first slide, moves on by
 * itself unless held or unless the visitor prefers reduced motion, closes after
 * the last slide, reads «next» toward the left on an RTL page, dims a watched
 * ring, and shows a «تسوّق» pill only once the product resolves.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/highlights.js';

const bubble = (slides, extra = '') =>
  `<li><button type="button" data-highlight data-highlight-title="عطور"
     data-highlight-slides='${JSON.stringify(slides)}' ${extra}>عطور</button></li>`;

const page = (bubbles) => `
  <section data-highlights>
    <ul>${bubbles}</ul>
    <dialog data-highlight-viewer>
      <div data-highlight-progress></div>
      <p data-highlight-viewer-title></p>
      <button type="button" data-highlight-close></button>
      <div data-highlight-stage>
        <img data-highlight-slide alt="">
        <button type="button" data-highlight-prev></button>
        <button type="button" data-highlight-next></button>
      </div>
      <a data-highlight-shop hidden>تسوّق</a>
      <a data-highlight-link hidden>المزيد</a>
    </dialog>
  </section>`;

async function setup(t, bubbles, { reduce = false, product } = {}) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const env = createDom({ html: page(bubbles), translations: { 'theme.highlights.shop': 'تسوّق' } });
  env.window.matchMedia = (q) => ({ matches: reduce && q.includes('reduce') });
  globalThis.matchMedia = env.window.matchMedia;
  const asked = [];
  env.salla.product.getDetails = (id) => {
    asked.push(id);
    return product ? Promise.resolve({ data: product }) : Promise.reject(new Error('gone'));
  };
  await loadFresh(SOURCE);
  const $ = (s) => env.document.querySelector(s);
  return { ...env, $, asked, slide: () => $('[data-highlight-slide]').getAttribute('src') };
}

afterEach(teardownDom);

describe('highlights', () => {
  test('a circle opens the viewer on its first slide, titled', async (t) => {
    const { $, slide } = await setup(t, bubble(['a.jpg', 'b.jpg']));
    $('[data-highlight]').click();

    assert.ok($('[data-highlight-viewer]').open);
    assert.equal(slide(), 'a.jpg');
    assert.equal($('[data-highlight-viewer-title]').textContent, 'عطور');
    assert.equal($('[data-highlight-progress]').children.length, 2);
  });

  test('it moves on by itself after five seconds, and closes after the last slide', async (t) => {
    const { $, slide } = await setup(t, bubble(['a.jpg', 'b.jpg']));
    $('[data-highlight]').click();

    t.mock.timers.tick(5000);
    assert.equal(slide(), 'b.jpg');
    t.mock.timers.tick(5000);
    assert.equal($('[data-highlight-viewer]').open, false);
  });

  test('holding the slide pauses it', async (t) => {
    const { window, $, slide } = await setup(t, bubble(['a.jpg', 'b.jpg']));
    $('[data-highlight]').click();
    $('[data-highlight-stage]').dispatchEvent(new window.Event('pointerdown'));

    t.mock.timers.tick(20000);
    assert.equal(slide(), 'a.jpg');

    $('[data-highlight-stage]').dispatchEvent(new window.Event('pointerup'));
    t.mock.timers.tick(5000);
    assert.equal(slide(), 'b.jpg');
  });

  test('with reduced motion it never advances on its own', async (t) => {
    const { $, slide } = await setup(t, bubble(['a.jpg', 'b.jpg']), { reduce: true });
    $('[data-highlight]').click();

    t.mock.timers.tick(60000);
    assert.equal(slide(), 'a.jpg');
    $('[data-highlight-next]').click();
    assert.equal(slide(), 'b.jpg');
  });

  test('on an RTL page the left arrow key is «next»', async (t) => {
    const { window, $, slide } = await setup(t, bubble(['a.jpg', 'b.jpg']));
    $('[data-highlight]').click();
    $('[data-highlight-viewer]').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft' }));

    assert.equal(slide(), 'b.jpg');
  });

  test('a watched highlight dims its ring, and stays dimmed on the next visit', async (t) => {
    const { $, window } = await setup(t, bubble(['a.jpg']));
    $('[data-highlight]').click();
    assert.ok($('[data-highlight]').classList.contains('highlights__bubble--seen'));

    const stored = window.localStorage.getItem('am1als:highlights-seen');
    teardownDom();
    t.mock.timers.reset();
    const again = await setup(t, bubble(['a.jpg']));
    again.window.localStorage.setItem('am1als:highlights-seen', stored);
    await loadFresh(SOURCE);
    assert.ok(again.$('[data-highlight]').classList.contains('highlights__bubble--seen'));
  });

  test('the «تسوّق» pill appears only once the product resolves', async (t) => {
    const { $, asked } = await setup(t, bubble(['a.jpg'], 'data-highlight-product="9"'), {
      product: { name: 'عطر <فاخر>', url: '/p/9', price: 250 },
    });
    $('[data-highlight]').click();
    assert.equal($('[data-highlight-shop]').hidden, true);

    for (let i = 0; i < 3; i += 1) await Promise.resolve();
    assert.deepEqual(asked, ['9']);
    assert.equal($('[data-highlight-shop]').hidden, false);
    assert.equal($('[data-highlight-shop]').getAttribute('href'), '/p/9');
    assert.match($('[data-highlight-shop]').innerHTML, /عطر &lt;فاخر&gt;/);
  });

  test('a product that no longer exists leaves no pill', async (t) => {
    const { $ } = await setup(t, bubble(['a.jpg'], 'data-highlight-product="404"'));
    $('[data-highlight]').click();
    for (let i = 0; i < 3; i += 1) await Promise.resolve();

    assert.equal($('[data-highlight-shop]').hidden, true);
  });
});
