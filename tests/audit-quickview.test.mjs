/**
 * The quick view against its two artboards — `Quick Product View Pop-up.pdf`
 * (mobile) and `Desktop Quick Product View Pop-up.svg` — 2026-10-15.
 *
 * Each case pins one confirmed difference, by the audit item's number, and is
 * written as the drawing rather than as the code: «the current price comes
 * first», not «line 189 swapped with line 190». The behaviour cases boot the
 * shipped `quick-view.js` through T-1.09's harness; the layout cases read the
 * stylesheet, because jsdom has no layout to measure.
 *
 * Item 69 («تتضمن 3 منتجات») is not here: no ruling names the field that row
 * reads, and it was raised rather than built.
 */
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDom, teardownDom, loadFresh, flush } from './harness/dom.mjs';

const SOURCE = 'src/assets/js/partials/quick-view.js';
const read = (file) => fs.readFileSync(file, 'utf8');
const SCSS = read('src/assets/styles/04-components/quick-view.scss');
const DESKTOP = SCSS.slice(SCSS.indexOf('@include from-laptop {'));
const BASE = SCSS.slice(0, SCSS.indexOf('@include from-laptop {'));

const TRANSLATIONS = {
  'theme.product.quick_view': 'عرض سريع',
  'theme.product.view_details': 'عرض تفاصيل المنتج',
  'theme.product.add_to_wishlist': 'أضف للمفضلة',
  'theme.product.quick_view_image': 'الصورة :number',
  'theme.product.quick_view_previous_image': 'الصورة السابقة',
  'theme.product.quick_view_next_image': 'الصورة التالية',
  'theme.product.rating_summary': 'التقييم :stars من 5، وعدد التقييمات :count',
  'theme.product.only_left': 'متبقّي :count قطع فقط!',
  'theme.common.was_price': 'السعر قبل الخصم',
};

const page = (threshold) => `
  <div id="quick-view-sheet">
    <h2 class="sheet__title"></h2>
    <div data-quick-view-root${threshold === undefined ? '' : ` data-low-stock-threshold="${threshold}"`}>
      <div data-quick-view-loading></div>
      <div data-quick-view-content hidden></div>
      <div data-quick-view-error hidden></div>
    </div>
  </div>
  <button type="button" data-quick-view="10">عرض سريع</button>`;

const product = (overrides = {}) => ({
  id: 10,
  name: 'The summer kit',
  price: 595,
  regular_price: 700,
  status: 'sale',
  type: 'product',
  url: 'https://example.test/p/10',
  quantity: 50,
  max_quantity: 10,
  images: [1, 2, 3, 4, 5, 6].map((n) => ({ url: `https://example.test/${n}.jpg` })),
  ...overrides,
});

/** Boot the shipped file, open product 10 and let it render. */
async function open(data = {}, { threshold, desktop = false } = {}) {
  const dom = createDom({ html: page(threshold), translations: TRANSLATIONS });

  dom.salla.helpers = { number: (n) => String(n) };
  globalThis.matchMedia = (query) => ({ matches: desktop && query === '(min-width: 1024px)' });

  await loadFresh(SOURCE);
  dom.document.querySelector('[data-quick-view="10"]').click();
  dom.control.resolveGetDetails({ data: product(data) });
  await flush();

  return dom;
}

/** What `salla-product-options` renders into its light DOM for one option. */
function renderOption(document, { required = true } = {}) {
  document.querySelector('salla-product-options').innerHTML = `
    <salla-conditional-fields>
      <div class="s-product-options-option-container" data-option-id="1">
        <div class="s-product-options-option" data-option-type="color">
          <label for="options[1]" class="s-product-options-option-label "><b>اختر لون الـ Pocket Blush<span> * </span> </b><small></small></label>
          <div class="s-product-options-option-content ">
            <div class="s-product-options-colors-wrapper">
              <div class="s-product-options-colors-item">
                <input type="radio" name="options[1]" id="c1"${required ? ' required' : ''}>
                <label for="c1"><span></span><div>أحمر</div></label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </salla-conditional-fields>`;
}

afterEach(teardownDom);

describe('#6 — the gallery sits at the inline start, as drawn', () => {
  test('no `order` moves the image to the second column', () => {
    assert.doesNotMatch(SCSS, /\border:/);
    assert.match(DESKTOP, /\.quick-view__content:not\(\[hidden\]\) \{\s*@apply grid grid-cols-2/);
  });

  test('the image is written before the details, so it takes the first (right, in Arabic) column', async () => {
    const { document } = await open();
    const content = document.querySelector('[data-quick-view-content]');

    assert.equal(content.firstElementChild.className, 'quick-view__media');
    assert.equal(content.lastElementChild.className, 'quick-view__info');
  });
});

describe('#66 — the thumbnails are a rail over the photograph, with up and down', () => {
  test('a rail of up to five thumbnails between a previous and a next button', async () => {
    const { document } = await open();
    const rail = document.querySelector('.quick-view__media > .quick-view__rail');
    const steps = rail.querySelectorAll('[data-quick-view-step]');

    assert.ok(rail, 'the rail is inside the media block, laid over the image');
    assert.equal(rail.querySelectorAll('[data-quick-view-thumb]').length, 5);
    assert.equal(steps[0].getAttribute('data-quick-view-step'), '-1');
    assert.equal(steps[0].getAttribute('aria-label'), 'الصورة السابقة');
    assert.equal(steps[0].querySelector('i').className, 'sicon-keyboard_arrow_up');
    assert.equal(steps[1].getAttribute('data-quick-view-step'), '1');
    assert.equal(steps[1].getAttribute('aria-label'), 'الصورة التالية');
    assert.equal(steps[1].querySelector('i').className, 'sicon-keyboard_arrow_down');
    assert.equal(rail.lastElementChild, steps[1], 'next is below the thumbnails');
  });

  test('a product with one image gets no rail', async () => {
    const { document } = await open({ images: [{ url: 'https://example.test/1.jpg' }] });

    assert.equal(document.querySelector('.quick-view__rail'), null);
  });

  test('next and previous step the selection and the main image, and say when they are at an end', async () => {
    const { document } = await open();
    const [up, down] = document.querySelectorAll('[data-quick-view-step]');
    const main = document.querySelector('[data-quick-view-image]');
    const pressed = () => [...document.querySelectorAll('[data-quick-view-thumb]')]
      .findIndex((el) => el.getAttribute('aria-pressed') === 'true');

    assert.equal(up.getAttribute('aria-disabled'), 'true', 'nothing before the first image');
    up.click();
    assert.equal(pressed(), 0);

    down.click();
    assert.equal(pressed(), 1);
    assert.equal(main.getAttribute('src'), 'https://example.test/2.jpg');
    assert.equal(up.getAttribute('aria-disabled'), 'false');

    down.click();
    down.click();
    down.click();
    assert.equal(pressed(), 4);
    assert.equal(down.getAttribute('aria-disabled'), 'true');
    assert.equal(down.hasAttribute('disabled'), false, 'focus is not thrown out of the dialog');

    down.click();
    assert.equal(pressed(), 4, 'the last image stays selected');
  });

  test('a thumbnail still selects itself, and moves the ends with it', async () => {
    const { document } = await open();
    const thumbs = document.querySelectorAll('[data-quick-view-thumb]');
    const [up, down] = document.querySelectorAll('[data-quick-view-step]');

    thumbs[4].click();
    assert.equal(document.querySelector('[data-quick-view-image]').getAttribute('src'), 'https://example.test/5.jpg');
    assert.equal(thumbs[4].getAttribute('aria-pressed'), 'true');
    assert.equal(down.getAttribute('aria-disabled'), 'true');
    assert.equal(up.getAttribute('aria-disabled'), 'false');
  });

  test('the rail floats at the inline-start edge, four 3rem thumbnails tall', () => {
    assert.match(DESKTOP, /\.quick-view__media \{\s*@apply relative block;/);
    assert.match(DESKTOP, /\.quick-view__rail \{\s*@apply absolute flex flex-col items-center gap-2;\s*inset-block-start: 50%;\s*inset-inline-start: 1rem;/);
    assert.match(DESKTOP, /max-block-size: calc\(4 \* 3rem \+ 3 \* 0\.5rem\);/);
    assert.match(DESKTOP, /\.quick-view__thumb,\s*\.quick-view__rail-btn \{[^}]*inline-size: 3rem;\s*block-size: 3rem;/);
    assert.match(DESKTOP, /\.quick-view__rail-btn \{\s*background-color: var\(--surface-card\);/);
    assert.doesNotMatch(SCSS, /\b(left|right):/, 'logical properties only');
  });

  test('the strip scrolls by the stylesheet\'s behaviour, so reduced motion reaches it', () => {
    assert.match(DESKTOP, /scroll-behavior: smooth;/);
    assert.doesNotMatch(read(SOURCE), /behavior:\s*'smooth'/);
  });
});

describe('#67 — the current price comes first', () => {
  test('595 before the struck 700, at the inline start', async () => {
    const { document } = await open();
    const prices = document.querySelector('.quick-view__prices');

    assert.equal(prices.firstElementChild.className, 'quick-view__price');
    assert.equal(prices.lastElementChild.className, 'quick-view__price--was');
  });
});

describe('#68 — each option row is a disclosure', () => {
  test('on mobile the row starts closed, «+», and the native label stays', async () => {
    const { document } = await open();

    renderOption(document);
    await flush();

    const toggle = document.querySelector('.s-product-options-option > [data-quick-view-option]');
    const panel = document.getElementById(toggle.getAttribute('aria-controls'));

    assert.equal(toggle.tagName, 'BUTTON');
    assert.equal(toggle.getAttribute('type'), 'button');
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.match(toggle.textContent, /اختر لون الـ Pocket Blush/);
    assert.equal(toggle.querySelector('.disclosure-mark').getAttribute('aria-hidden'), 'true');
    assert.ok(panel.classList.contains('s-product-options-option-content'));
    assert.equal(panel.hidden, true);
    assert.equal(toggle.nextElementSibling.tagName, 'LABEL', 'Salla\'s label still names its field');
  });

  test('on desktop the same row starts open, «−», as the desktop artboard draws it', async () => {
    const { document } = await open({}, { desktop: true });

    renderOption(document);
    await flush();

    const toggle = document.querySelector('[data-quick-view-option]');

    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(document.getElementById(toggle.getAttribute('aria-controls')).hidden, false);
  });

  test('the row toggles, and only one control is ever added however often Salla re-renders', async () => {
    const { document } = await open();

    renderOption(document);
    await flush();

    const toggle = document.querySelector('[data-quick-view-option]');
    const panel = document.getElementById(toggle.getAttribute('aria-controls'));

    toggle.click();
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(panel.hidden, false);

    toggle.querySelector('span').click();
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(panel.hidden, true);

    panel.append(document.createElement('span'));
    await flush();
    assert.equal(document.querySelectorAll('[data-quick-view-option]').length, 1);
  });

  test('a required option that fails validation opens before the browser points at it', async () => {
    const { document, window } = await open();

    renderOption(document);
    await flush();

    const toggle = document.querySelector('[data-quick-view-option]');

    document.getElementById('c1').dispatchEvent(new window.Event('invalid'));
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(document.getElementById(toggle.getAttribute('aria-controls')).hidden, false);
  });

  test('the closed state is the attribute, never the class Salla skips when validating', () => {
    const js = read(SOURCE);

    assert.match(js, /panel\.hidden = !open;/);
    assert.doesNotMatch(js, /classList\.(add|toggle)\('hidden'/);
    assert.match(BASE, /\.quick-view \.s-product-options-option-content\[hidden\] \{\s*@apply hidden;/);
  });

  test('a row on the dialog surface with a hairline under it, title above the swatches at every width', () => {
    assert.match(BASE, /\.quick-view \.s-product-options-wrapper \{\s*@apply mb-0 bg-transparent p-0;/);
    assert.match(BASE, /\.quick-view \.s-product-options-option \{\s*@apply block;\s*border-block-end: 1px solid var\(--border-interactive\);/);
    assert.match(BASE, /\.quick-view__option-toggle \{\s*@apply flex min-h-11 w-full items-center justify-between/);
    assert.match(BASE, /\.quick-view__option-toggle \+ \.s-product-options-option-label \{\s*@apply sr-only;/);
  });
});

describe('#70 — the desktop rating row under the title', () => {
  test('the card\'s rating row, read as one sentence, between the title and the prices', async () => {
    const { document } = await open({ rating: { stars: 4.5, count: 7000 } });
    const rating = document.querySelector('.quick-view__head .quick-view__rating');

    assert.ok(rating.classList.contains('product-card__rating'), 'one rating look, the card\'s');
    assert.equal(rating.previousElementSibling.className, 'quick-view__title');
    assert.equal(rating.nextElementSibling.className, 'quick-view__prices');
    assert.equal(rating.querySelector('.sr-only').textContent, 'التقييم 4.5 من 5، وعدد التقييمات 7000');
    assert.equal(rating.querySelectorAll('.product-card__star--filled').length, 4);
    assert.equal(rating.querySelector('.product-card__rating-count').textContent, '(7000)');
  });

  test('no rating, no row', async () => {
    const { document } = await open({ rating: null });

    assert.equal(document.querySelector('.quick-view__rating'), null);
  });

  test('one helper renders it for both the card and the quick view', () => {
    assert.match(read('src/assets/js/partials/product-card.js'), /return ratingMarkup\(this\.product\?\.rating\);/);
    assert.match(read(SOURCE), /ratingMarkup\(product\.rating, 'quick-view__rating'\)/);
  });

  test('not displayed below 1024px, where the mobile artboard draws none', () => {
    assert.match(BASE, /\.quick-view__rating,\s*\.quick-view__quantity \{\s*@apply hidden;/);
    assert.match(DESKTOP, /\.quick-view__rating \{\s*@apply flex;/);
  });
});

describe('#71 — the desktop quantity stepper', () => {
  test('the product page\'s own stepper, starting at one, above the buy row', async () => {
    const { document } = await open();
    const stepper = document.querySelector('salla-quantity-input.quick-view__quantity');

    assert.equal(stepper.getAttribute('value'), '1');
    assert.equal(stepper.getAttribute('max'), '10');
    assert.equal(stepper.getAttribute('name'), 'quantity');
    assert.ok(stepper.nextElementSibling.classList.contains('quick-view__actions'));
  });

  test('none for a hidden quantity or a booking, as on the product page', async () => {
    const hidden = await open({ is_hidden_quantity: true });

    assert.equal(hidden.document.querySelector('salla-quantity-input'), null);

    const booking = await open({ type: 'booking' });

    assert.equal(booking.document.querySelector('salla-quantity-input'), null);
  });

  test('the chosen quantity rides on the add button', async () => {
    const { document, window } = await open();
    const input = document.createElement('input');

    input.className = 's-quantity-input-input';
    input.value = '3';
    document.querySelector('.quick-view__quantity').append(input);
    input.dispatchEvent(new window.CustomEvent('change', { bubbles: true, detail: { quantity: 3 } }));

    assert.equal(document.querySelector('salla-add-product-button').getAttribute('quantity'), '3');
  });

  test('desktop only, at the inline start on its own row', () => {
    assert.match(DESKTOP, /\.quick-view__quantity \{\s*@apply block self-start;/);
  });
});

describe('#150 — the desktop details column is start-aligned', () => {
  test('brand, title, rating, prices and stock flush to the inline start from 1024px', () => {
    assert.match(DESKTOP, /\.quick-view__head \{\s*@apply items-start text-start;/);
    assert.match(DESKTOP, /\.quick-view__prices,\s*\.quick-view__stock \{\s*@apply justify-start;/);
  });

  test('mobile stays centred, and the way onward stays centred on both', () => {
    assert.match(BASE, /\.quick-view__head \{\s*@apply flex flex-col items-center gap-1 text-center;/);
    assert.match(BASE, /\.quick-view__details \{\s*@apply inline-flex items-center gap-1 self-center/);
  });

  test('the details column is a stack, so `self-center` and the gaps take effect', () => {
    assert.match(BASE, /\.quick-view__info \{\s*@apply flex flex-col gap-4;/);
  });
});

describe('#151 — «عرض تفاصيل المنتج» ends in its arrow', () => {
  test('the label then the diagonal arrow, pointing to the inline end, hidden from screen readers', async () => {
    const { document } = await open();
    const link = document.querySelector('.quick-view__details');
    const arrow = link.lastElementChild;

    assert.equal(link.firstElementChild.textContent, 'عرض تفاصيل المنتج');
    assert.match(arrow.className, /\bsicon-arrow-up-left\b/, 'RTL document: up and to the left');
    assert.equal(arrow.getAttribute('aria-hidden'), 'true');
  });
});

describe('#152 — the low-stock line follows the merchant', () => {
  test('shown at or under the merchant\'s threshold, with Salla\'s switch on', async () => {
    const { document } = await open({ quantity: 8, can_show_remained_quantity: true }, { threshold: 10 });

    assert.match(document.querySelector('.quick-view__stock').textContent, /متبقّي 8 قطع فقط!/);
  });

  test('not shown over the threshold', async () => {
    const { document } = await open({ quantity: 8, can_show_remained_quantity: true }, { threshold: 5 });

    assert.equal(document.querySelector('.quick-view__stock'), null);
  });

  test('not shown when the merchant hides the remaining quantity, at any count', async () => {
    const off = await open({ quantity: 2, can_show_remained_quantity: false }, { threshold: 5 });

    assert.equal(off.document.querySelector('.quick-view__stock'), null);

    const hidden = await open({ quantity: 2, can_show_remained_quantity: true, is_hidden_quantity: true }, { threshold: 5 });

    assert.equal(hidden.document.querySelector('.quick-view__stock'), null);
  });

  test('without the attribute the setting\'s default, five, applies', async () => {
    const { document } = await open({ quantity: 5, can_show_remained_quantity: true });

    assert.ok(document.querySelector('.quick-view__stock'));
  });

  test('the threshold is a theme setting, written onto the sheet', () => {
    const setting = JSON.parse(read('twilight.json')).settings.find((s) => s.id === 'low_stock_threshold');

    assert.equal(setting?.type, 'number');
    assert.equal(setting.value, 5);
    assert.match(read('src/views/components/ui/quick-view.twig'),
      /data-low-stock-threshold="\{\{ theme\.settings\.get\('low_stock_threshold', 5\) \}\}"/);
    assert.doesNotMatch(read(SOURCE), /remaining <= 5/);
  });
});
