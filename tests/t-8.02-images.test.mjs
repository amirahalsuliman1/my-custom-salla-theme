/**
 * T-8.02 — the image rules, and the checker that keeps them.
 *
 * The audit found no defects in the templates this theme wrote, so what is
 * worth pinning is not «the images are fine today» — it is that **the checker
 * would notice if they stopped being fine**. A green check that cannot fail is
 * the worst outcome of a task like this one, so most of these tests feed it
 * broken markup and insist that it complains.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const SCRIPT = 'scripts/check-images.mjs';

/** Run the checker with one extra template dropped into src/views. */
function withTemplate(markup, run) {
  const path = `src/views/components/__t802-fixture.twig`;
  fs.writeFileSync(path, markup);
  try {
    return run();
  } finally {
    fs.rmSync(path, { force: true });
  }
}

const check = () => {
  try {
    return { code: 0, out: execFileSync(process.execPath, [SCRIPT], { encoding: 'utf8' }) };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
};

describe('T-8.02 — the shipped templates', () => {
  test('every theme-owned image passes today', () => {
    const { code } = check();
    assert.equal(code, 0, 'the image checker is failing on the current tree');
  });

  test('the LCP images are the eager ones, and they are alone on their page', () => {
    // Home's hero and the PDP's first gallery frame. Both are `loop.first`
    // only — the rest of each slider is lazy.
    const hero = fs.readFileSync('src/views/components/home/hero.twig', 'utf8');
    assert.match(hero, /loop\.first \? .*fetchpriority|{% if loop\.first %}fetchpriority="high" loading="eager"/);
    const pdp = fs.readFileSync('src/views/pages/product/single.twig', 'utf8');
    assert.match(pdp, /\{% if loop\.first %\}\s*<img[^>]*loading="eager"/);
  });
});

describe('T-8.02 — the checker can fail', () => {
  test('a bare <img> with no reserved box is caught', () =>
    withTemplate('<img src="{{ x }}" alt="a" loading="lazy">', () => {
      const { code, out } = check();
      assert.equal(code, 1);
      assert.match(out, /no reserved box/);
    }));

  test('width+height alone satisfies the box', () =>
    withTemplate('<img src="{{ x }}" alt="a" width="10" height="10" loading="lazy">', () => {
      assert.equal(check().code, 0);
    }));

  test('a media well that sets aspect-ratio satisfies it too', () =>
    withTemplate('<div class="card__media"><img src="{{ x }}" alt="a" loading="lazy"></div>', () => {
      assert.equal(check().code, 0);
    }));

  test('a missing alt is caught', () =>
    withTemplate('<img src="{{ x }}" width="1" height="1" loading="lazy">', () => {
      const { code, out } = check();
      assert.equal(code, 1);
      assert.match(out, /no alt/);
    }));

  test('a missing loading strategy is caught', () =>
    withTemplate('<img src="{{ x }}" alt="a" width="1" height="1">', () => {
      const { code, out } = check();
      assert.equal(code, 1);
      assert.match(out, /no loading attribute/);
    }));

  test('⚠ a SECOND eager image on one template is caught', () =>
    withTemplate(
      '<img src="a" alt="a" width="1" height="1" loading="eager">' +
        '<img src="b" alt="b" width="1" height="1" loading="eager">',
      () => {
        const { code, out } = check();
        assert.equal(code, 1);
        assert.match(out, /2 eager images/);
      },
    ));

  test('one eager image is allowed — it is the LCP', () =>
    withTemplate('<img src="a" alt="a" width="1" height="1" loading="eager">', () => {
      assert.equal(check().code, 0);
    }));

  test('an image inside a dialog is exempt — a closed modal renders nothing', () =>
    withTemplate('<salla-modal id="m"><img src="{{ x }}" alt="a" loading="lazy"></salla-modal>', () => {
      assert.equal(check().code, 0);
    }));

  test('prose about `<img>` inside a Twig comment is not audited as markup', () =>
    withTemplate('{# talks about <img> with no alt #}<img src="a" alt="a" width="1" height="1" loading="lazy">', () => {
      assert.equal(check().code, 0);
    }));
});
