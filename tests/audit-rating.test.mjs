/**
 * Audit, screen group «rating» — `Rate Your Order.pdf` and `Desktop Step 1 –
 * Rate Your Order.svg` against `salla-rating-modal` as the theme ships it.
 *
 * Both fixes are CSS from outside (technique C), so what is pinned here is the
 * source: the rule exists, it is loaded after the platform sheet it overrides,
 * it is scoped to the modal, and it speaks in tokens rather than hex.
 *
 * #72  — the stars are one ink: an outline when unchosen, filled when chosen.
 *        The platform paints them solid grey and amber.
 * #153 — the reaction word sits centred under each product's stars at every
 *        width. The platform turns the pair into a row from 640px up.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const RATING = 'src/assets/styles/04-components/rating.scss';
const APP = 'src/assets/styles/app.scss';

const scss = readFileSync(RATING, 'utf8');
const app = readFileSync(APP, 'utf8');

/** The declaration block that directly follows `selector`, up to its first `}`. */
function block(selector) {
  const at = scss.indexOf(`${selector} {`);
  assert.notEqual(at, -1, `${selector} is missing from ${RATING}`);
  return scss.slice(at, scss.indexOf('}', at));
}

describe('the rating stylesheet is loaded where it can win', () => {
  test('app.scss imports it', () => {
    assert.match(app, /@import '\.\/04-components\/rating';/);
  });

  test('it loads below the split marker, so after salla-components.css', () => {
    assert.ok(
      app.indexOf("@import './04-components/rating'") > app.indexOf('__THEME_CSS_STARTS_HERE__'),
      'above the marker it would be split into the platform sheet and lose on order',
    );
  });

  test('and before dark-mode, which repaints after every component', () => {
    assert.ok(
      app.indexOf("@import './04-components/rating'") < app.indexOf("@import './04-components/dark-mode'"),
    );
  });

  test('no raw hex and no bare left/right', () => {
    const code = scss.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(code, /#[0-9a-f]{3,8}\b/i);
    assert.doesNotMatch(code, /(^|[\s;{])(left|right)\s*:/m);
  });
});

describe('#72 — the stars are one ink, outlined or filled', () => {
  test('an unchosen star is an outline with the card showing through', () => {
    const rule = block('.s-rating-modal .s-rating-stars-btn-star');
    assert.match(rule, /fill:\s*transparent;/);
    assert.match(rule, /stroke:\s*var\(--border-interactive\);/);
    assert.match(rule, /stroke-width:\s*1\.5px;/);
  });

  test('the outline keeps the artboard weight at both icon sizes', () => {
    assert.match(scss, /path\s*\{\s*vector-effect:\s*non-scaling-stroke;/);
  });

  test('a chosen or hovered star fills in the same ink', () => {
    const rule = block('.s-rating-modal .s-rating-stars-selected,\n.s-rating-modal .s-rating-stars-hovered');
    assert.match(rule, /fill:\s*var\(--surface-control\);/);
  });

  test('the fill and the edge are the same decision as --text-secondary', () => {
    const tokens = readFileSync('src/assets/styles/01-settings/global.scss', 'utf8');
    assert.match(tokens, /--border-interactive:\s*var\(--text-secondary\);/);
    assert.match(tokens, /--surface-control:\s*var\(--text-secondary\);/);
  });

  test('every star rule is scoped to the modal, not the PDP or testimonials', () => {
    const selectors = scss
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('{')
      .slice(0, -1)
      .map(chunk => chunk.split(/[;}]/).pop().trim())
      .filter(sel => /s-rating-stars-(btn-star|selected|hovered)/.test(sel));
    assert.ok(selectors.length >= 2);
    for (const sel of selectors) {
      for (const part of sel.split(',')) {
        assert.match(part.trim(), /^\.s-rating-modal\s/, `${part.trim()} leaks outside the modal`);
      }
    }
  });
});

describe('#153 — the reaction word sits under the stars at every width', () => {
  test('the product row stacks the word under the stars, with no media query', () => {
    const rule = block('.s-rating-modal-product-details-main .s-rating-stars-wrapper');
    assert.match(rule, /@apply mb-1\.5 flex-col gap-2;/);
    assert.doesNotMatch(scss, /@media|@include from-/);
  });

  test('the word is centred inside its own box, not hugging the end edge', () => {
    assert.match(
      scss,
      /\.s-rating-stars-label,\s*\.s-rating-stars-label-without-tag\s*\{\s*@apply text-center;/,
    );
  });
});
