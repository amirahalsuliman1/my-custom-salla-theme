/**
 * Home's shoppable images, shown on other pages (public-theme pass, 2026-10-19).
 *
 *   · the product page: «نسّقيه مع» — the first shoppable image with a point on
 *     this product, when its section allows it (`show_on_products`);
 *   · a category page: the interactive cover — the first shoppable image whose
 *     section names this category (`category`).
 *
 * The section is taken from Home's own markup (partials/home-document), so it is
 * the same image, the same points and the same pills; sections hidden from Home
 * arrive inside a `<template>` and are found there. Nothing found leaves the
 * mount hidden.
 */
import Hotspots from './hotspots';
import { homeDocument } from './home-document';

const sectionsOf = page => [
  ...page.querySelectorAll('[data-lookbook]'),
  ...[...page.querySelectorAll('template[data-lookbook-store]')]
    .flatMap(template => [...template.content.querySelectorAll('[data-lookbook]')]),
];

function matches(section, mount) {
  const product = mount.dataset.forProduct;
  const category = mount.dataset.forCategory;

  if (product) {
    return section.dataset.lookbookPdp === 'true'
      && (section.dataset.lookbookProducts || '').split(',').includes(product);
  }

  const name = mount.dataset.forCategoryName?.trim();

  return (!!category && section.dataset.lookbookCategory === category)
    || (!!name && section.dataset.lookbookCategoryName === name);
}

async function fill(mount) {
  const page = await homeDocument();
  const section = page && sectionsOf(page).find(candidate => matches(candidate, mount));

  if (!section) {
    return;
  }

  const node = document.importNode(section, true);

  node.removeAttribute('data-testid');
  mount.querySelector('[data-lookbook-slot]').append(node);
  mount.hidden = false;
  node.querySelectorAll('[data-hotspot-root]').forEach(root => Hotspots.mount(root));
}

export default function initLookbookElsewhere() {
  document.querySelectorAll('[data-lookbook-mount]').forEach(mount => {
    if (!('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting || entry.boundingClientRect.top < 0)) {
        observer.disconnect();
        fill(mount).catch(() => {});
      }
    }, { rootMargin: '600px 0px' });

    observer.observe(mount.parentElement);
  });
}
