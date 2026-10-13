/**
 * The theme's JavaScript reads its own strings through salla.lang.get('theme.…'),
 * but on the storefront salla.lang carries only the platform's translations —
 * found on the demo store 2026-10-13, where quick view printed raw keys. The
 * strings now reach salla.lang through components/js-translations.twig, which
 * scripts/js-translations.mjs generates. These hold that it stays complete.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { collectKeys, render } from '../scripts/js-translations.mjs';

const ar = JSON.parse(fs.readFileSync('src/locales/ar.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const lookup = (tree, key) => key.split('.').reduce((node, part) => node?.[part], tree);

describe('JS translations', () => {
  test('the generated partial is up to date with the keys the JS reads', () => {
    const actual = fs.readFileSync('src/views/components/js-translations.twig', 'utf8');
    assert.equal(actual, render(collectKeys()), 'run: node scripts/js-translations.mjs');
  });

  test('every key the JS reads exists in both locale files', () => {
    const missing = collectKeys().filter((key) => typeof lookup(ar, key) !== 'string' || typeof lookup(en, key) !== 'string');
    assert.deepEqual(missing, []);
  });

  test('the partial is included by the layout, before the theme bundles load', () => {
    const master = fs.readFileSync('src/views/layouts/master.twig', 'utf8');
    const include = master.indexOf("{% include 'components.js-translations' %}");
    assert.ok(include > -1, 'master.twig must include components.js-translations');
    assert.ok(include < master.indexOf("'app.js'"), 'it must come before app.js');
  });
});
