/**
 * T-8.04 — structured data.
 *
 * THE FAILURE MODE HERE IS SILENCE. A JSON-LD node with a trailing comma, or a
 * store name containing a quote, produces JSON that does not parse — and a
 * node that does not parse is simply ignored. Nothing in the page looks wrong,
 * nothing logs, and the rich result disappears weeks later.
 *
 * So these tests render each node's Twig with representative values and **parse
 * the result as JSON**, including the awkward cases: an apostrophe in the store
 * name, an absent logo, an absent category. Google's validator is the manual
 * step; this is the part that can run on every commit.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/**
 * A deliberately small Twig evaluator — enough for these nodes and no more.
 * It resolves `{{ x|json_encode|raw }}`, `{% if %}`/`{% endif %}` and the `-`
 * whitespace trims, which is exactly the surface the schema blocks use.
 */
function renderTwig(template, vars) {
  const lookup = (path) =>
    path
      .split('.')
      .reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), vars);

  const truthy = (expr) =>
    expr
      .split(/\s+or\s+/)
      .some((clause) =>
        clause
          .split(/\s+and\s+/)
          .every((term) => {
            const v = lookup(term.trim());
            return v !== undefined && v !== null && v !== '' && v !== false;
          }),
      );

  // {% if %} ... {% endif %}, innermost first
  let out = template;
  let guard = 0;
  while (/\{%-?\s*if\s/.test(out) && guard++ < 50) {
    out = out.replace(
      /\{%-?\s*if\s+([^%]+?)\s*-?%\}((?:(?!\{%-?\s*if\s)[\s\S])*?)\{%-?\s*endif\s*-?%\}/,
      (_, cond, body) => (truthy(cond) ? body : ''),
    );
  }

  // {{ expr|filters }}
  out = out.replace(/\{\{-?\s*([^}]+?)\s*-?\}\}/g, (_, expr) => {
    const [head, ...filters] = expr.split('|').map((s) => s.trim());
    let value;
    const call = head.match(/^(trans|url)\((.*)\)$/);
    if (call) value = call[2].replace(/^['"]|['"]$/g, '') || '/';
    else value = lookup(head);
    for (const f of filters) {
      if (f.startsWith('default(')) value = value ?? f.slice(8, -1).replace(/^['"]|['"]$/g, '');
      else if (f === 'striptags') value = String(value ?? '').replace(/<[^>]*>/g, '');
      else if (f === 'trim') value = String(value ?? '').trim();
      else if (f === 'json_encode') value = JSON.stringify(value ?? null);
    }
    return String(value ?? '');
  });

  return out;
}

/** Pull the nth `application/ld+json` block out of a template. */
function ldBlocks(file) {
  const source = fs.readFileSync(file, 'utf8');
  return [...source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => m[1],
  );
}

const STORE_FULL = {
  store: {
    name: 'أملاس',
    url: 'https://am1als.com',
    logo: 'https://cdn/logo.png',
    description: '<p>متجر</p>',
    contacts: { mobile: '0500000000', email: 'a@b.com' },
  },
};

describe('T-8.04 — Organization, in the layout', () => {
  const [block] = ldBlocks('src/views/layouts/master.twig');

  test('the layout emits exactly one node — the site-wide one', () => {
    assert.equal(ldBlocks('src/views/layouts/master.twig').length, 1);
  });

  test('it parses with a full store', () => {
    const json = JSON.parse(renderTwig(block, STORE_FULL));
    assert.equal(json['@type'], 'Organization');
    assert.equal(json.name, 'أملاس');
    assert.equal(json.contactPoint.telephone, '0500000000');
  });

  test('⚠ it still parses with a store that has set almost nothing', () => {
    // The bare-install case, and the one most likely to emit a dangling comma.
    const json = JSON.parse(renderTwig(block, { store: { name: 'x', url: 'https://x', contacts: {} } }));
    assert.equal(json['@type'], 'Organization');
    assert.ok(!('logo' in json), 'an unset logo must be an absent key, not an empty one');
    assert.ok(!('contactPoint' in json), 'no phone and no email means no contactPoint');
  });

  test('⚠ a quote in the store name does not break the JSON', () => {
    const json = JSON.parse(
      renderTwig(block, { store: { name: 'Sam\'s "Shop"', url: 'https://x', contacts: {} } }),
    );
    assert.equal(json.name, 'Sam\'s "Shop"');
  });

  test('sameAs is not emitted — the URLs are resolved client-side', () => {
    assert.doesNotMatch(block, /sameAs/);
  });
});

describe('T-8.04 — BreadcrumbList, on the product page', () => {
  const blocks = ldBlocks('src/views/pages/product/single.twig');
  const breadcrumb = blocks.find((b) => b.includes('BreadcrumbList'));
  const product = blocks.find((b) => b.includes('"Product"'));

  test('the page carries both a BreadcrumbList and a Product node', () => {
    assert.ok(breadcrumb, 'no BreadcrumbList node');
    assert.ok(product, 'no Product node');
  });

  test('the trail parses and runs home › category › product', () => {
    const json = JSON.parse(
      renderTwig(breadcrumb, {
        product: { name: 'قلم', category: { name: 'مكياج', url: 'https://x/c' } },
      }),
    );
    assert.equal(json['@type'], 'BreadcrumbList');
    assert.deepEqual(
      json.itemListElement.map((i) => i.position),
      [1, 2, 3],
    );
    assert.equal(json.itemListElement[1].name, 'مكياج');
  });

  test('the last item carries no `item` URL — the reader is already there', () => {
    const json = JSON.parse(
      renderTwig(breadcrumb, { product: { name: 'قلم', category: { name: 'مكياج', url: 'u' } } }),
    );
    assert.ok(!('item' in json.itemListElement[2]));
  });

  test('⚠ a product with no category emits no trail at all, rather than a guessed one', () => {
    const source = fs.readFileSync('src/views/pages/product/single.twig', 'utf8');
    assert.match(source, /\{%\s*if product\.category and product\.category\.name\s*%\}[\s\S]{0,900}BreadcrumbList/);
  });
});

describe('T-8.04 — no node for content that is not on the page', () => {
  // The check is on what is *emitted*, not on what is written: a Twig comment
  // explaining where FAQPage lives is prose, not a node, and an earlier version
  // of this test failed on exactly that.
  const emitted = (file) => ldBlocks(file).join('\n');

  test('FAQPage is emitted by the FAQ section and nowhere else', () => {
    const faq = ldBlocks('src/views/components/home/faq.twig');
    assert.equal(faq.length, 1);
    assert.match(faq[0], /FAQPage/);
    for (const f of ['src/views/layouts/master.twig', 'src/views/pages/index.twig']) {
      assert.doesNotMatch(emitted(f), /FAQPage/);
    }
  });

  test('the Product node stays on the product page', () => {
    assert.doesNotMatch(emitted('src/views/layouts/master.twig'), /"Product"/);
  });
});
