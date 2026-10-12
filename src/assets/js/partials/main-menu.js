/**
 * T-3.06 — the store's navigation menu.
 *
 * WHAT THIS FILE WAS, AND WHY IT IS NOT THAT ANY MORE. Upstream's version
 * rendered two menus from one data set: a mobile list for mmenu-light to turn
 * into a drawer, and a desktop bar with hover dropdowns, mega-menu product
 * lists, and an overflow "More" dropdown measured at runtime. **Three things
 * made that untenable rather than merely different:**
 *
 *   1. **It was rendered nowhere.** T-3.04 replaced the header and the
 *      `<custom-main-menu>` element went with upstream's markup. The burger has
 *      pointed at `#mobile-menu` — an id nothing emits — ever since, so the
 *      store has had **no navigation menu at all**, and `app.js`'s
 *      `isElementLoaded('#mobile-menu')` has been polling for it every 160ms
 *      forever. This task is a regression fix before it is a feature.
 *   2. **mmenu-light cannot meet this task's criteria.** Its bundle contains
 *      **zero** occurrences of `aria`, of `focus`, of `keydown` and of
 *      `tabindex` — checked, not assumed. Focus is neither trapped nor returned,
 *      submenus expose no state, and none of that is reachable from CSS. T-2.10
 *      already solves all of it, which is why this task depends on it.
 *   3. **B4 forbids the desktop bar.** The 393pt design has a burger and no menu
 *      bar, and the ruling's forbidden list is explicit: no element absent from
 *      mobile may appear at a larger breakpoint. The same reasoning removed
 *      upstream's top navbar in T-3.04 and its account sidebar in T-3.02. **One
 *      navigation, at every width**, in the sheet that becomes a centred dialog
 *      above tablet.
 *
 * So this renders one accessible disclosure list and nothing else. The overflow
 * measurement, the resize handler, the mega-menu and `changeMenuDirection()` in
 * `app.js` all served the desktop bar and are gone with it.
 *
 * THE DATA SOURCE IS UNCHANGED: `salla.api.component.getMenus()`, the same call
 * upstream made, so the merchant's menus arrive exactly as before.
 */
class NavigationMenu extends HTMLElement {
  connectedCallback() {
    // T-2.13's skeleton, not a private set of placeholder classes. The menu is
    // fetched, so there is a real gap to fill and the region says so once.
    this.innerHTML = `
      <div class="skeleton-region" role="status" aria-busy="true" aria-live="polite">
        <span class="sr-only">${salla.lang.get('theme.common.loading_content')}</span>
        <span class="skeleton skeleton--text nav-menu__skeleton" aria-hidden="true"></span>
        <span class="skeleton skeleton--text nav-menu__skeleton" aria-hidden="true"></span>
        <span class="skeleton skeleton--text nav-menu__skeleton" aria-hidden="true"></span>
        <span class="skeleton skeleton--text nav-menu__skeleton" aria-hidden="true"></span>
      </div>`;

    salla
      .onReady()
      .then(() => salla.lang.onLoaded())
      .then(() => {
        this.displayAllText = salla.lang.get('blocks.home.display_all');

        return salla.api.component
          .getMenus()
          .then(({ data }) => {
            this.menus = data;
            this.render();
            this.bind();
          })
          .catch(error => salla.logger.error('custom-main-menu::Error fetching menus', error));
      });
  }

  hasChildren(menu) {
    return menu?.children?.length > 0;
  }

  /**
   * Menu titles are merchant data arriving over the API and interpolated into a
   * template string. Upstream wrote them in raw, so a title containing markup
   * would have been executed. `attrs` and `link_attrs` stay raw because they ARE
   * attributes and the platform composes them.
   */
  escape(value) {
    const node = document.createElement('span');

    node.textContent = value || '';

    return node.innerHTML;
  }

  image(menu) {
    if (!menu.image) {
      return '';
    }

    // The `menu-images` feature. Dimensions are stated so the row does not
    // reflow when the image lands — the zero-CLS rule, applied to a menu.
    return `<img src="${menu.image}" class="nav-menu__image" width="48" height="48" alt="" loading="lazy" />`;
  }

  /**
   * An item with children is a DISCLOSURE, not a link. `aria-expanded` on a real
   * `<button>` is what makes the state audible, `aria-controls` ties it to the
   * list it opens, and `hidden` is what makes a closed list unreachable rather
   * than merely invisible — a collapsed list that is still tabbable is the
   * commonest keyboard trap in a navigation menu.
   *
   * The parent's own page stays reachable through «عرض الكل», first in the
   * sublist. That is upstream's pattern too, and it is the right one: one
   * control, one job.
   */
  item(menu) {
    const title = this.escape(menu.title);

    if (!this.hasChildren(menu)) {
      return `
        <li class="nav-menu__item" ${menu.attrs || ''}>
          <a class="nav-menu__link" href="${menu.url}" ${menu.link_attrs || ''}>
            ${this.image(menu)}<span>${title}</span>
          </a>
        </li>`;
    }

    this.counter += 1;
    const id = `nav-menu-${this.counter}`;

    return `
      <li class="nav-menu__item" ${menu.attrs || ''}>
        <button type="button" class="nav-menu__toggle" aria-expanded="false" aria-controls="${id}">
          ${this.image(menu)}<span>${title}</span>
          <i class="ui-icon sicon-keyboard_arrow_down nav-menu__chevron" aria-hidden="true"></i>
        </button>
        <ul class="nav-menu__sub" id="${id}" hidden>
          <li class="nav-menu__item">
            <a class="nav-menu__link" href="${menu.url}">${this.escape(this.displayAllText)}</a>
          </li>
          ${menu.children.map(child => this.item(child)).join('')}
        </ul>
      </li>`;
  }

  render() {
    this.counter = 0;
    this.innerHTML = `<ul class="nav-menu">${this.menus.map(menu => this.item(menu)).join('')}</ul>`;
  }

  /**
   * One delegated listener for every disclosure at every depth, bound once.
   * Binding per button would miss nothing today — the tree renders in one pass —
   * but it would cost one listener per menu item on a store with a large
   * catalogue, for behaviour that is identical on all of them.
   */
  bind() {
    this.addEventListener('click', event => {
      const toggle = event.target.closest('.nav-menu__toggle');

      if (!toggle) {
        return;
      }

      const expanded = toggle.getAttribute('aria-expanded') === 'true';

      toggle.setAttribute('aria-expanded', String(!expanded));
      document.getElementById(toggle.getAttribute('aria-controls')).hidden = expanded;
    });
  }
}

customElements.define('custom-main-menu', NavigationMenu);
