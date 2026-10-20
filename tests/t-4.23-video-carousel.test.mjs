/**
 * T-4.23 — the video carousel's in-page players (owner ruling 2026-10-12).
 *
 * The owner asked for two things: no cover image, and a video that plays in
 * the page rather than opening a new tab. These hold both, plus the one cost
 * control that survives the ruling — a player is mounted when its slide comes
 * near the screen, not on page load.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, teardownDom, loadFresh, observers } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/video-carousel.js';

const slide = (url, title = 'فيديو') =>
  `<div class="video-carousel__frame" data-video-slide data-embed-url="${url}" data-video-title="${title}">
     <p class="video-carousel__poster"><bdi>@am1als</bdi></p>
   </div>`;

const TRANSLATIONS = { 'theme.video.unplayable': 'تعذّر تشغيل هذا الفيديو. تأكّد من الرابط.' };

async function setup(...urls) {
  const env = createDom({ html: urls.map(u => slide(u)).join(''), translations: TRANSLATIONS });
  const opened = [];
  env.window.open = (...args) => opened.push(args);
  await loadFresh(SOURCE);
  return { ...env, opened, reveal: () => observers.intersection.forEach(o => o.trigger(true)) };
}

afterEach(teardownDom);

describe('T-4.23 · videos play in the page', () => {
  test('nothing is mounted until the slide comes near the screen', async () => {
    const { document, reveal } = await setup('https://youtu.be/abc123');

    assert.equal(document.querySelector('.video-carousel__embed'), null);
    reveal();
    assert.ok(document.querySelector('iframe.video-carousel__embed'));
  });

  test('a YouTube link becomes an embedded player, titled for assistive tech', async () => {
    const { document, reveal } = await setup('https://www.youtube.com/watch?v=abc123');
    reveal();

    const frame = document.querySelector('iframe.video-carousel__embed');
    assert.equal(frame.src, 'https://www.youtube.com/embed/abc123?playsinline=1');
    assert.equal(frame.title, 'فيديو');
  });

  test('TikTok and Instagram links embed too', async () => {
    const { document, reveal } = await setup(
      'https://www.tiktok.com/@am1als/video/7300000000000000000',
      'https://www.instagram.com/reel/Cabc_12/',
    );
    reveal();

    const srcs = [...document.querySelectorAll('iframe.video-carousel__embed')].map(f => f.src);
    assert.deepEqual(srcs, [
      'https://www.tiktok.com/embed/v2/7300000000000000000',
      'https://www.instagram.com/reel/Cabc_12/embed',
    ]);
  });

  test('a direct file plays in a native video element with controls', async () => {
    const { document, reveal } = await setup('https://cdn.example.test/clip.mp4');
    reveal();

    const video = document.querySelector('video.video-carousel__embed');
    assert.equal(video.getAttribute('src'), 'https://cdn.example.test/clip.mp4');
    assert.equal(video.controls, true);
  });

  test('nothing ever opens a new tab', async () => {
    const { opened, reveal } = await setup('https://vm.tiktok.com/ZSabc/', 'https://example.test/some-page');
    reveal();

    assert.deepEqual(opened, []);
  });

  test('in the theme editor, a link the browser cannot play says so in the slide', async () => {
    const { window, document, reveal } = await setup('https://vm.tiktok.com/ZSabc/');
    // The editor previews the store in a frame.
    Object.defineProperty(window, 'parent', { value: {}, configurable: true });
    reveal();

    document.querySelector('video.video-carousel__embed').dispatchEvent(new window.Event('error'));

    assert.equal(document.querySelector('video'), null);
    assert.equal(
      document.querySelector('.video-carousel__unplayable').textContent,
      'تعذّر تشغيل هذا الفيديو. تأكّد من الرابط.',
    );
  });

  test('on the storefront, an unplayable slide is removed and shows no message', async () => {
    const { window, document, reveal } = await setup('https://example.test/a.mp4', 'https://youtu.be/abc123');
    reveal();

    document.querySelector('video.video-carousel__embed').dispatchEvent(new window.Event('error'));

    assert.equal(document.querySelector('.video-carousel__unplayable'), null);
    assert.equal(document.querySelectorAll('[data-video-slide]').length, 1);
  });

  test('on the storefront, a section with no playable slide is removed', async () => {
    const env = createDom({
      html: `<section class="video-carousel">${slide('https://example.test/a.mp4')}</section>`,
      translations: TRANSLATIONS,
    });
    await loadFresh(SOURCE);
    observers.intersection.forEach(o => o.trigger(true));

    env.document.querySelector('video').dispatchEvent(new env.window.Event('error'));

    assert.equal(env.document.querySelector('.video-carousel'), null);
  });

  test('the poster name stays over the player', async () => {
    const { document, reveal } = await setup('https://youtu.be/abc123');
    reveal();

    const frame = document.querySelector('[data-video-slide]');
    assert.equal(frame.firstElementChild.tagName, 'IFRAME');
    assert.ok(frame.querySelector('.video-carousel__poster'));
  });
});
