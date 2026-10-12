/**
 * T-8.03 — the bundle graph.
 *
 * «No duplicated logic across bundles» was the criterion this task actually
 * failed on, and it failed invisibly: separate webpack entries do not share
 * modules, so `fslightbox` and `lite-youtube-embed` were compiled into both
 * `home.js` and `product.js`. Nothing in the build said so.
 *
 * These tests pin the two things that would silently undo the fix: a page
 * bundle importing a vendor library directly again, and a template loading a
 * dependent bundle **before** the one it depends on. The second is the sharper
 * failure — `defer` executes in document order, so getting the tags the wrong
 * way round throws at runtime on the page that matters most.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = fs.readFileSync('webpack.config.js', 'utf8');

describe('T-8.03 — the shared media bundle', () => {
  test('neither page bundle imports the vendor libraries directly', () => {
    for (const file of ['src/assets/js/home.js', 'src/assets/js/product.js']) {
      const source = fs.readFileSync(file, 'utf8');
      const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
      assert.doesNotMatch(code, /from ['"]fslightbox['"]/, `${file} imports fslightbox directly`);
      assert.doesNotMatch(code, /['"]lite-youtube-embed['"]/, `${file} imports lite-youtube directly`);
      assert.match(code, /vendor\/media/, `${file} should take them from the shared module`);
    }
  });

  test('both bundles declare the dependency in the build graph', () => {
    assert.match(config, /home\s*:\s*\{import:[^}]*dependOn:\s*\['app', 'media'\]/);
    assert.match(config, /product\s*:\s*\{import:[^}]*dependOn:\s*\['app', 'media'\]/);
  });

  test('media.js is not folded into app.js, which every page loads', () => {
    const app = fs.readFileSync('src/assets/js/app.js', 'utf8');
    assert.doesNotMatch(app, /fslightbox|lite-youtube/);
    assert.doesNotMatch(config, /app\s*:\s*\[[^\]]*vendor\/media/);
  });

  test('⚠ each template loads media.js BEFORE its own bundle', () => {
    for (const [file, bundle] of [
      ['src/views/pages/index.twig', 'home.js'],
      ['src/views/pages/product/single.twig', 'product.js'],
    ]) {
      const source = fs.readFileSync(file, 'utf8');
      const media = source.indexOf("'media.js' | asset");
      const own = source.indexOf(`'${bundle}' | asset`);
      assert.ok(media > -1, `${file} does not load media.js`);
      assert.ok(media < own, `${file} loads ${bundle} before media.js — defer runs in document order`);
    }
  });
});

describe('T-8.03 — dependOn is only safe where app.js has already run', () => {
  test('the three head-loaded bundles do NOT dependOn app', () => {
    // `product-card.js`, `main-menu.js` and `add-product-toast.js` are loaded
    // in <head>, before app.js is parsed. A shared-module reference into app
    // would be a reference into a bundle that has not run.
    for (const name of ['product-card', 'main-menu', 'add-product-toast']) {
      const line = config.split('\n').find((l) => l.includes(`'${name}'`) && l.includes('asset('));
      assert.ok(line, `no entry line found for ${name}`);
      assert.doesNotMatch(line, /dependOn/, `${name} must not dependOn app — it loads in <head>`);
    }
  });

  test('master.twig still loads app.js before the page-scripts block', () => {
    const master = fs.readFileSync('src/views/layouts/master.twig', 'utf8');
    const app = master.indexOf("'app.js' | asset");
    const block = master.indexOf('{% block scripts %}');
    assert.ok(app > -1 && block > -1);
    assert.ok(app < block, 'app.js must precede the page scripts that dependOn it');
  });
});
