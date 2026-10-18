/**
 * The listing's grid-size toggle (public-theme pass, 2026-10-19).
 *
 * Two states, «منتجات أكبر» and «منتجات أكثر», on `data-grid-density` of the
 * list's container; listing.scss turns each into columns per width. The
 * merchant picks the default (`listing_grid_default`, already on the markup);
 * the shopper's last choice is kept in their own browser and wins after that.
 */
const KEY = 'am1als:grid-density';

const read = () => {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const write = value => {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // Private windows and blocked storage: the choice simply is not kept.
  }
};

export default function initGridDensity() {
  const container = document.querySelector('[data-grid-density]');
  const buttons = [...document.querySelectorAll('[data-grid-density-set]')];

  if (!container || !buttons.length) {
    return;
  }

  const apply = value => {
    container.dataset.gridDensity = value;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.gridDensitySet === value)));
  };

  const saved = read();
  apply(saved === 'large' || saved === 'small' ? saved : container.dataset.gridDensity || 'small');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      apply(button.dataset.gridDensitySet);
      write(button.dataset.gridDensitySet);
    });
  });
}
